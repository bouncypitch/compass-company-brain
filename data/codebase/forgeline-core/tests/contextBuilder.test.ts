import { describe, expect, it } from "vitest";

import type { Chunk } from "../src/ingest/chunker.js";
import { ContextBuilder, estimateTokens } from "../src/retrieval/contextBuilder.js";
import type { EmbeddingClient } from "../src/retrieval/embeddingClient.js";
import { VectorIndex } from "../src/retrieval/vectorIndex.js";

function chunk(path: string, startLine: number, text: string): Chunk {
  return {
    id: `${path}:${startLine}-${startLine + 10}`,
    path,
    startLine,
    endLine: startLine + 10,
    text,
    language: "typescript",
    contentHash: `${path}-${startLine}`,
  };
}

const fakeEmbedder = {
  embed: async () => [1, 0, 0],
  embedBatch: async (xs: string[]) => xs.map(() => [1, 0, 0]),
} as unknown as EmbeddingClient;

function makeIndex(): VectorIndex {
  const idx = new VectorIndex();
  idx.upsert(chunk("src/auth/login.ts", 1, "export function login() {}"), [1, 0, 0]);
  idx.upsert(chunk("src/auth/login.ts", 5, "// overlapping chunk"), [0.9, 0.1, 0]);
  idx.upsert(chunk("src/billing/invoice.ts", 1, "export class Invoice {}"), [0.5, 0.5, 0]);
  idx.upsert(chunk("README.md", 1, "# acme-api"), [0, 1, 0]);
  return idx;
}

describe("ContextBuilder", () => {
  it("always includes system preamble and task first", async () => {
    const cb = new ContextBuilder({ index: makeIndex(), embedder: fakeEmbedder, maxTokens: 10_000 });
    const ctx = await cb.build("fix login redirect");
    expect(ctx.sections[0]?.title).toBe("system");
    expect(ctx.sections[1]?.title).toBe("task");
    expect(ctx.sections[1]?.body).toBe("fix login redirect");
  });

  it("dedupes overlapping chunks from the same file", async () => {
    const cb = new ContextBuilder({ index: makeIndex(), embedder: fakeEmbedder, maxTokens: 10_000 });
    const ctx = await cb.build("fix login redirect");
    const loginSections = ctx.sections.filter((s) => s.title.startsWith("code:src/auth/login.ts"));
    expect(loginSections).toHaveLength(1);
  });

  it("puts pinned paths ahead of higher-scoring chunks", async () => {
    const cb = new ContextBuilder({ index: makeIndex(), embedder: fakeEmbedder, maxTokens: 10_000 });
    const ctx = await cb.build("update invoice totals", { pinnedPaths: ["README.md"] });
    const codeTitles = ctx.sections.filter((s) => s.title.startsWith("code:")).map((s) => s.title);
    expect(codeTitles[0]).toContain("README.md");
  });

  it("respects the token budget and reports dropped chunks", async () => {
    const tiny = estimateTokens("You are Forgeline") + 60;
    const cb = new ContextBuilder({ index: makeIndex(), embedder: fakeEmbedder, maxTokens: tiny });
    const ctx = await cb.build("x");
    expect(ctx.totalTokens).toBeLessThanOrEqual(tiny);
    expect(ctx.droppedChunks).toBeGreaterThan(0);
  });

  // Documents current behavior: context is code-only and identical across runs.
  // When R-14 lands this should become "includes recalled memories for the repo".
  it("has no memory section — two identical builds produce identical context", async () => {
    const cb = new ContextBuilder({ index: makeIndex(), embedder: fakeEmbedder, maxTokens: 10_000 });
    const a = await cb.build("fix login redirect");
    const b = await cb.build("fix login redirect");
    expect(a.sections.map((s) => s.title)).toEqual(b.sections.map((s) => s.title));
    expect(a.sections.some((s) => s.title === "recalled")).toBe(false);
  });
});
