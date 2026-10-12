import { createHash } from "node:crypto";

export interface Chunk {
  id: string;
  path: string;
  startLine: number;
  endLine: number;
  text: string;
  language: string;
  /** sha1 of text; used to skip re-embedding within a single session */
  contentHash: string;
}

export interface ChunkOptions {
  maxLines: number;
  overlapLines: number;
}

const EXT_TO_LANG: Record<string, string> = {
  ts: "typescript",
  tsx: "typescript",
  js: "javascript",
  jsx: "javascript",
  py: "python",
  go: "go",
  rs: "rust",
  java: "java",
  rb: "ruby",
  md: "markdown",
};

// Rough heuristic for "good" split points. A tree-sitter based chunker was
// prototyped in FL-1987 but parked — too slow on monorepos.
const BOUNDARY_RE = /^(export\s+)?(async\s+)?(function|class|interface|type|const|def|func|fn|impl)\b/;

export function detectLanguage(path: string): string {
  const ext = path.split(".").pop()?.toLowerCase() ?? "";
  return EXT_TO_LANG[ext] ?? "text";
}

export function chunkFile(path: string, source: string, opts: ChunkOptions): Chunk[] {
  const lines = source.split("\n");
  const chunks: Chunk[] = [];
  const language = detectLanguage(path);

  let start = 0;
  while (start < lines.length) {
    let end = Math.min(start + opts.maxLines, lines.length);

    // Try to end the chunk right before a top-level declaration so we don't
    // slice functions in half.
    for (let i = end - 1; i > start + opts.maxLines / 2; i--) {
      if (BOUNDARY_RE.test(lines[i] ?? "")) {
        end = i;
        break;
      }
    }

    const text = lines.slice(start, end).join("\n");
    if (text.trim().length > 0) {
      const contentHash = createHash("sha1").update(text).digest("hex");
      chunks.push({
        id: `${path}:${start + 1}-${end}`,
        path,
        startLine: start + 1,
        endLine: end,
        text,
        language,
        contentHash,
      });
    }

    if (end >= lines.length) break;
    start = Math.max(end - opts.overlapLines, start + 1);
  }

  return chunks;
}
