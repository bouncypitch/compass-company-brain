import type { Chunk } from "../ingest/chunker.js";

export interface ScoredChunk {
  chunk: Chunk;
  score: number;
}

interface Entry {
  chunk: Chunk;
  vector: Float32Array;
  norm: number;
}

/**
 * Brute-force cosine index, in-process only.
 *
 * Fine up to ~200k chunks on a dev laptop. We looked at hnswlib-node in FL-2102
 * but the bigger problem is that this index is rebuilt from nothing every
 * session — there is no serialize()/load() because there's nowhere to put it.
 */
export class VectorIndex {
  private entries = new Map<string, Entry>();

  get size(): number {
    return this.entries.size;
  }

  clear(): void {
    this.entries.clear();
  }

  upsert(chunk: Chunk, vector: number[]): void {
    const v = Float32Array.from(vector);
    this.entries.set(chunk.id, { chunk, vector: v, norm: l2(v) });
  }

  removeByPath(path: string): void {
    for (const [id, e] of this.entries) {
      if (e.chunk.path === path) this.entries.delete(id);
    }
  }

  search(query: number[], k = 20, filter?: (c: Chunk) => boolean): ScoredChunk[] {
    const q = Float32Array.from(query);
    const qn = l2(q);
    if (qn === 0) return [];

    const scored: ScoredChunk[] = [];
    for (const e of this.entries.values()) {
      if (filter && !filter(e.chunk)) continue;
      scored.push({ chunk: e.chunk, score: dot(q, e.vector) / (qn * e.norm || 1) });
    }
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, k);
  }
}

function dot(a: Float32Array, b: Float32Array): number {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += a[i]! * b[i]!;
  return s;
}

function l2(a: Float32Array): number {
  return Math.sqrt(dot(a, a));
}
