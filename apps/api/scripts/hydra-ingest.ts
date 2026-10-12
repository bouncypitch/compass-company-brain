/**
 * Loads the Forgeline company brain into HydraDB.
 *
 *   pnpm --filter @app-starter/api exec ts-node scripts/hydra-ingest.ts [--only=company|market|memories|talk]
 *
 * Collections:
 *   company   internal docs (OKRs, ladder, roadmap, Slack, 1:1s, customer notes) + forgeline-core code
 *   market    public competitor signals (+ the hackathon talk transcript)
 *   mem_<id>  per-employee memories (reviews, feedback, shipped work)
 *
 * Every signal also carries a declared graph (bring-your-own-graph) so the
 * Company -> Capability spine always exists, independent of LLM extraction.
 */
import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';
import { HydraDBClient } from '@hydradb/sdk';
import { loadSignals, loadTalkClips, DATA_DIR, slugId } from '../src/brain/brain-data';

const DB = process.env.HYDRA_DB_DATABASE || 'forgeline_brain';
const client = new HydraDBClient({ token: process.env.HYDRA_DB_API_KEY ?? '' });
const only = process.argv.find((a) => a.startsWith('--only='))?.split('=')[1];
const TMP = path.join(DATA_DIR, '.ingest-tmp');

type Doc = { id: string; file: string; metadata: Record<string, unknown>; graph?: object };

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function ensureDatabase(): Promise<void> {
  try {
    await client.databases.create({ database: DB });
    console.log(`created database ${DB}`);
  } catch (err) {
    console.log(`database create skipped (${(err as Error).message.slice(0, 80)})`);
  }
  for (let i = 0; i < 60; i++) {
    const res = await client.databases.status({ database: DB });
    const ready = (res as any)?.data?.infra?.readyForIngestion;
    if (ready) return;
    console.log('waiting for database infra...');
    await sleep(5000);
  }
  throw new Error('database never became ready');
}

function walk(dir: string, exts: string[]): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) return e.name === 'node_modules' ? [] : walk(p, exts);
    return exts.some((x) => e.name.endsWith(x)) || exts.includes(e.name) ? [p] : [];
  });
}

async function ingestDocs(collection: string, docs: Doc[]): Promise<string[]> {
  const ids: string[] = [];
  for (let i = 0; i < docs.length; i += 8) {
    const batch = docs.slice(i, i + 8);
    const graph: Record<string, object> = {};
    for (const d of batch) if (d.graph) graph[d.id] = d.graph;
    const res = await client.context.ingest({
      database: DB,
      collection,
      type: 'knowledge',
      documents: batch.map((d) => ({ path: d.file, filename: path.basename(d.file), contentType: 'text/markdown' })),
      documentMetadata: JSON.stringify(batch.map((d) => ({ id: d.id, metadata: d.metadata }))),
      upsert: 'true',
      ...(Object.keys(graph).length ? { graphPayload: JSON.stringify(graph) } : {}),
    });
    const results = ((res as any)?.data?.results ?? []) as { id: string; status: string; error?: string }[];
    results.forEach((r) => console.log(`  ${collection} ${r.id} ${r.status}${r.error ? ' ' + r.error : ''}`));
    ids.push(...batch.map((d) => d.id));
  }
  return ids;
}

function companyDocs(): Doc[] {
  const internal = walk(path.join(DATA_DIR, 'internal'), ['.md', '.json']).map((file) => {
    const rel = path.relative(DATA_DIR, file);
    return { id: slugId('doc', rel), file, metadata: { kind: rel.split(path.sep)[1]?.replace(/\..*$/, '') ?? 'doc', path: rel, source: 'internal' } };
  });
  const codeRoot = path.join(DATA_DIR, 'codebase', 'forgeline-core');
  const code = walk(codeRoot, ['.ts', '.md', 'CODEOWNERS']).map((file) => {
    const rel = path.relative(path.join(DATA_DIR, 'codebase'), file);
    // HydraDB parses by extension; ship code as markdown with a fenced block.
    const out = path.join(TMP, 'code', rel.replace(/[\\/]/g, '__') + '.md');
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(out, `# ${rel}\n\nFile \`${rel}\` in the Forgeline codebase.\n\n\`\`\`ts\n${fs.readFileSync(file, 'utf8')}\n\`\`\`\n`);
    return { id: slugId('code', rel), file: out, metadata: { kind: 'code', path: rel, source: 'codebase' } };
  });
  return [...internal, ...code];
}

function marketDocs(): Doc[] {
  const dir = path.join(TMP, 'signals');
  fs.mkdirSync(dir, { recursive: true });
  return loadSignals().map((s) => {
    const file = path.join(dir, `${s.id}.md`);
    fs.writeFileSync(
      file,
      `# ${s.company}: ${s.title}\n\nCompany: ${s.company}\nDate: ${s.date}\nKind: ${s.kind}\nCapability: ${s.capability}\nSource: ${s.url}\n\n${s.summary}\n`,
    );
    return {
      id: s.id,
      file,
      metadata: { company: s.company, date: s.date, kind: s.kind, capability: s.capability, url: s.url, source: 'market' },
      graph: {
        entities: {
          sig: { name: s.title, type: 'Signal', namespace: 'market' },
          co: { name: s.company, type: 'Company', namespace: 'market' },
          cap: { name: s.capability, type: 'Capability', namespace: 'market' },
        },
        relations: [
          { source: 'co', target: 'sig', predicate: 'published', context: `${s.company} ${s.kind} on ${s.date}`, temporal_details: s.date },
          { source: 'sig', target: 'cap', predicate: 'indicates', context: s.summary.slice(0, 200), temporal_details: s.date },
          { source: 'co', target: 'cap', predicate: 'pursuing', context: s.title, temporal_details: s.date },
        ],
      },
    };
  });
}

function talkDocs(): Doc[] {
  const dir = path.join(TMP, 'talk');
  fs.mkdirSync(dir, { recursive: true });
  return loadTalkClips().map((c) => {
    const file = path.join(dir, `${c.id}.md`);
    fs.writeFileSync(file, `# Company Brain Hackathon talk, ${fmt(c.startSec)}\n\nSpeaker: Dave Nielsen (hackathon MC)\n\n${c.text}\n`);
    return { id: c.id, file, metadata: { kind: 'talk', speaker: 'Dave Nielsen', startSec: c.startSec, endSec: c.endSec, source: 'market', company: 'Industry' } };
  });
}

const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

async function ingestMemories(): Promise<void> {
  const dir = path.join(DATA_DIR, 'memories');
  if (!fs.existsSync(dir)) return;
  for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('.json'))) {
    const data = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
    const employeeId: string = data.employeeId ?? f.replace('.json', '');
    const items = (data.items ?? []).map((it: any) => ({
      id: it.id,
      title: it.title,
      text: it.text,
      user_name: employeeId,
      infer: false,
      metadata: { kind: it.kind, date: it.date, employeeId },
    }));
    const res = await client.context.ingest({ database: DB, collection: `mem_${employeeId.replace(/-/g, '_')}`, type: 'memory', memories: JSON.stringify(items), upsert: 'true' });
    console.log(`  memories ${employeeId}: ${((res as any)?.data?.results ?? []).length} items`);
  }
}

async function waitForIndexing(collection: string, ids: string[]): Promise<void> {
  for (let round = 0; round < 60; round++) {
    const pending: string[] = [];
    for (let i = 0; i < ids.length; i += 50) {
      const res = await client.context.status({ database: DB, collection, ids: ids.slice(i, i + 50) });
      for (const s of ((res as any)?.data?.statuses ?? []) as any[]) {
        if (s.indexingStatus === 'failed') console.log(`  FAILED ${s.id}: ${s.errorMessage}`);
        else if (s.indexingStatus !== 'completed') pending.push(s.id);
      }
    }
    if (!pending.length) return console.log(`${collection}: all ${ids.length} sources completed`);
    console.log(`${collection}: ${pending.length} still indexing...`);
    await sleep(8000);
  }
}

async function main(): Promise<void> {
  if (!process.env.HYDRA_DB_API_KEY) throw new Error('HYDRA_DB_API_KEY is not set in apps/api/.env');
  await ensureDatabase();
  if (!only || only === 'company') await waitForIndexing('company', await ingestDocs('company', companyDocs()));
  if (!only || only === 'market') await waitForIndexing('market', await ingestDocs('market', marketDocs()));
  if (!only || only === 'talk') {
    const docs = talkDocs();
    if (docs.length) await waitForIndexing('market', await ingestDocs('market', docs));
  }
  if (!only || only === 'memories') await ingestMemories();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
