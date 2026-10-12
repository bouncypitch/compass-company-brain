import { request } from "undici";
import type { ForgelineConfig } from "../config.js";

const MAX_BATCH = 64;
const MAX_RETRIES = 3;

interface EmbedResponse {
  data: { index: number; embedding: number[] }[];
  usage: { tokens: number };
}

/**
 * Thin client over the gateway's /embeddings endpoint.
 *
 * There's a per-process memo keyed on text so we don't double-embed overlap
 * regions, but it's a plain Map — gone when the session ends. (Persisting it
 * was proposed in FL-2231; blocked on R-14.)
 */
export class EmbeddingClient {
  private readonly memo = new Map<string, number[]>();
  tokensUsed = 0;

  constructor(private readonly config: ForgelineConfig) {}

  async embed(text: string): Promise<number[]> {
    const [v] = await this.embedBatch([text]);
    return v!;
  }

  async embedBatch(texts: string[]): Promise<number[][]> {
    const out: (number[] | undefined)[] = texts.map((t) => this.memo.get(t));
    const missing = texts
      .map((t, i) => ({ t, i }))
      .filter(({ i }) => out[i] === undefined);

    for (let start = 0; start < missing.length; start += MAX_BATCH) {
      const slice = missing.slice(start, start + MAX_BATCH);
      const vectors = await this.callWithRetry(slice.map((m) => m.t));
      slice.forEach((m, j) => {
        out[m.i] = vectors[j];
        this.memo.set(m.t, vectors[j]!);
      });
    }

    return out as number[][];
  }

  private async callWithRetry(input: string[]): Promise<number[][]> {
    let lastErr: unknown;
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        const res = await request(`${this.config.gatewayUrl}/embeddings`, {
          method: "POST",
          headers: {
            "content-type": "application/json",
            authorization: `Bearer ${this.config.apiKey}`,
          },
          body: JSON.stringify({ model: this.config.embeddingModel, input }),
        });
        if (res.statusCode === 429) {
          await new Promise((r) => setTimeout(r, 500 * 2 ** attempt));
          continue;
        }
        if (res.statusCode >= 400) {
          throw new Error(`embeddings ${res.statusCode}: ${await res.body.text()}`);
        }
        const json = (await res.body.json()) as EmbedResponse;
        this.tokensUsed += json.usage.tokens;
        return json.data.sort((a, b) => a.index - b.index).map((d) => d.embedding);
      } catch (err) {
        lastErr = err;
      }
    }
    throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
  }
}
