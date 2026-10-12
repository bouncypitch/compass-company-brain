import type { EmbeddingClient } from "./embeddingClient.js";
import type { ScoredChunk, VectorIndex } from "./vectorIndex.js";

export interface ContextSection {
  title: string;
  body: string;
  tokens: number;
}

export interface TaskContext {
  task: string;
  sections: ContextSection[];
  totalTokens: number;
  droppedChunks: number;
}

export interface ContextBuilderDeps {
  index: VectorIndex;
  embedder: EmbeddingClient;
  maxTokens: number;
}

// ~4 chars/token is close enough for budgeting; the gateway does the real count.
export const estimateTokens = (s: string): number => Math.ceil(s.length / 4);

const SYSTEM_PREAMBLE = `You are Forgeline, a coding agent working inside the user's repository.
Prefer small, reviewable diffs. Run the project's tests before proposing a PR.`;

/**
 * Assembles the prompt context for a single agent task.
 *
 * Inputs today are only: the task text, the system preamble, and retrieved code
 * chunks. Everything is computed fresh per task. There is no section for
 * "things we learned about this repo" (team conventions, past review feedback,
 * prior task outcomes, incidents) because we don't store any of that.
 * TODO(R-14): add a `recalled` section sourced from agent memory once it exists.
 */
export class ContextBuilder {
  constructor(private readonly deps: ContextBuilderDeps) {}

  async build(task: string, opts: { pinnedPaths?: string[] } = {}): Promise<TaskContext> {
    const sections: ContextSection[] = [];
    let budget = this.deps.maxTokens;

    const push = (title: string, body: string): boolean => {
      const tokens = estimateTokens(body);
      if (tokens > budget) return false;
      sections.push({ title, body, tokens });
      budget -= tokens;
      return true;
    };

    push("system", SYSTEM_PREAMBLE);
    push("task", task);

    const queryVec = await this.deps.embedder.embed(task);
    const hits = this.deps.index.search(queryVec, 40);
    const ordered = this.prioritize(hits, opts.pinnedPaths ?? []);

    let dropped = 0;
    for (const { chunk } of ordered) {
      const header = `// ${chunk.path}:${chunk.startLine}-${chunk.endLine}`;
      if (!push(`code:${chunk.id}`, `${header}\n${chunk.text}`)) dropped++;
    }

    return {
      task,
      sections,
      totalTokens: this.deps.maxTokens - budget,
      droppedChunks: dropped,
    };
  }

  /** Pinned files first, then by score; dedupe overlapping chunks from the same file. */
  prioritize(hits: ScoredChunk[], pinned: string[]): ScoredChunk[] {
    const pinnedSet = new Set(pinned);
    const seen = new Map<string, number[]>();
    const sorted = [...hits].sort((a, b) => {
      const pa = pinnedSet.has(a.chunk.path) ? 1 : 0;
      const pb = pinnedSet.has(b.chunk.path) ? 1 : 0;
      return pb - pa || b.score - a.score;
    });

    return sorted.filter(({ chunk }) => {
      const lines = seen.get(chunk.path) ?? [];
      const overlaps = lines.some((s) => Math.abs(s - chunk.startLine) < 20);
      if (overlaps) return false;
      seen.set(chunk.path, [...lines, chunk.startLine]);
      return true;
    });
  }
}

export function renderContext(ctx: TaskContext): string {
  return ctx.sections.map((s) => `### ${s.title}\n${s.body}`).join("\n\n");
}
