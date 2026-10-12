import { Injectable, Logger } from '@nestjs/common';
import { HydraDBClient } from '@hydradb/sdk';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { buildString } = require('@hydradb/sdk/helpers') as { buildString: (result: unknown) => string };

export interface HydraContext {
  text: string;
  triplets: { source: string; relation: string; target: string }[];
  ok: boolean;
}

/**
 * Thin wrapper over HydraDB. Every method degrades to an empty context instead
 * of throwing, so a slow or unavailable memory layer never takes the demo down;
 * callers fall back to the raw data files.
 */
@Injectable()
export class HydraService {
  private readonly logger = new Logger(HydraService.name);
  private readonly client = process.env.HYDRA_DB_API_KEY
    ? new HydraDBClient({ token: process.env.HYDRA_DB_API_KEY, timeoutInSeconds: 45 })
    : null;
  readonly database = process.env.HYDRA_DB_DATABASE || 'forgeline_brain';

  get isEnabled(): boolean {
    return this.client !== null;
  }

  async query(
    query: string,
    collections: Record<string, number>,
    type: 'knowledge' | 'memory' | 'all' = 'knowledge',
  ): Promise<HydraContext> {
    if (!this.client) return { text: '', triplets: [], ok: false };
    try {
      const res: any = await this.client.query({
        database: this.database,
        query,
        type,
        collections,
        queryBy: 'hybrid',
        graphContext: true,
        mode: 'thinking',
        maxResults: 24,
      } as any);
      const triplets = ((res?.data?.graph?.paths ?? []) as any[])
        .flatMap((p) => p.triplets ?? [])
        .map((t: any) => ({
          source: String(t.source?.name ?? ''),
          relation: String(t.relation?.canonical_predicate ?? t.relation?.canonicalPredicate ?? t.relation?.name ?? ''),
          target: String(t.target?.name ?? ''),
        }))
        .filter((t) => t.source && t.target);
      return { text: buildString(res?.data ?? res) || '', triplets, ok: true };
    } catch (err) {
      this.logger.warn(`HydraDB query failed: ${(err as Error).message}`);
      return { text: '', triplets: [], ok: false };
    }
  }

  /** Writes a new knowledge doc (e.g. an accepted recommendation) back into the brain. */
  async ingestText(collection: string, id: string, title: string, body: string, metadata: Record<string, unknown>, graph?: object): Promise<boolean> {
    if (!this.client) return false;
    try {
      await this.client.context.ingest({
        database: this.database,
        collection,
        type: 'knowledge',
        documents: [{ data: Buffer.from(`# ${title}\n\n${body}\n`), filename: `${id}.md`, contentType: 'text/markdown' }],
        documentMetadata: JSON.stringify([{ id, metadata }]),
        upsert: 'true',
        ...(graph ? { graphPayload: JSON.stringify({ [id]: graph }) } : {}),
      });
      return true;
    } catch (err) {
      this.logger.warn(`HydraDB ingest failed: ${(err as Error).message}`);
      return false;
    }
  }

  async status(collection: string, id: string): Promise<string> {
    if (!this.client) return 'disabled';
    try {
      const res: any = await this.client.context.status({ database: this.database, collection, id });
      return res?.data?.statuses?.[0]?.indexingStatus ?? 'unknown';
    } catch {
      return 'unknown';
    }
  }
}
