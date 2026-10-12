import { readFile } from "node:fs/promises";
import { join, relative } from "node:path";
import fg from "fast-glob";
import ignore from "ignore";
import pLimit from "p-limit";

import type { ForgelineConfig } from "../config.js";
import { chunkFile, type Chunk } from "./chunker.js";
import { EmbeddingClient } from "../retrieval/embeddingClient.js";
import { VectorIndex } from "../retrieval/vectorIndex.js";

const DEFAULT_IGNORES = ["node_modules/**", "dist/**", "build/**", ".git/**", "**/*.min.js", "**/*.lock"];
const MAX_FILE_BYTES = 512 * 1024;

export interface IndexStats {
  files: number;
  chunks: number;
  durationMs: number;
}

/**
 * Builds the vector index for a repo.
 *
 * NOTE: this runs a FULL index on every session start. Nothing is written to
 * disk — the VectorIndex is in-process and dies with the session. On large
 * customer repos (Acme's monorepo is ~40k files) cold start is 3-6 minutes and
 * burns embedding credits every single time. FL-2231 has the numbers.
 *
 * We discussed caching embeddings keyed by contentHash under ~/.forgeline,
 * but it got folded into R-14 (agent memory) since that needs a persistence
 * layer anyway. R-14 has no owner yet.
 */
export class RepoIndexer {
  private readonly embedder: EmbeddingClient;
  readonly index: VectorIndex;

  constructor(private readonly config: ForgelineConfig) {
    this.embedder = new EmbeddingClient(config);
    this.index = new VectorIndex();
  }

  async listFiles(): Promise<string[]> {
    const ig = ignore().add(DEFAULT_IGNORES);
    try {
      const gitignore = await readFile(join(this.config.repoRoot, ".gitignore"), "utf8");
      ig.add(gitignore);
    } catch {
      // no .gitignore, fine
    }
    const all = await fg("**/*", { cwd: this.config.repoRoot, dot: false, onlyFiles: true });
    return all.filter((p) => !ig.ignores(p));
  }

  /** Full rebuild. Called from index.ts on every session start. */
  async indexAll(): Promise<IndexStats> {
    const t0 = Date.now();
    this.index.clear(); // always start from zero — no previous index to load
    const files = await this.listFiles();
    const limit = pLimit(8);
    let chunkCount = 0;

    await Promise.all(
      files.map((rel) =>
        limit(async () => {
          const chunks = await this.indexFile(rel);
          chunkCount += chunks.length;
        }),
      ),
    );

    return { files: files.length, chunks: chunkCount, durationMs: Date.now() - t0 };
  }

  /** Re-index a single file (used by fileWatcher for in-session edits). */
  async indexFile(relPath: string): Promise<Chunk[]> {
    const abs = join(this.config.repoRoot, relPath);
    let source: string;
    try {
      const buf = await readFile(abs);
      if (buf.byteLength > MAX_FILE_BYTES) return [];
      source = buf.toString("utf8");
    } catch {
      return [];
    }

    const chunks = chunkFile(relative(this.config.repoRoot, abs), source, {
      maxLines: this.config.chunkMaxLines,
      overlapLines: this.config.chunkOverlapLines,
    });
    if (chunks.length === 0) return [];

    this.index.removeByPath(relPath);
    const vectors = await this.embedder.embedBatch(chunks.map((c) => c.text));
    chunks.forEach((chunk, i) => this.index.upsert(chunk, vectors[i]!));
    return chunks;
  }
}
