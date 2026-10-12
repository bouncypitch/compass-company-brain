import * as fs from 'fs';
import * as path from 'path';
import type { BrainGraph, BrainGraphEdge, BrainGraphNode, TopologyResult } from '@app-starter/shared';
import { DATA_DIR, loadPeople, readDataFile } from './brain-data';

/**
 * Builds Forgeline's company topology deterministically from the source docs:
 * people/teams/reporting lines, goals and KRs with owners, roadmap items with
 * owners/KRs/modules, CODEOWNERS, and every Slack thread, 1:1 and customer note
 * linked to the people, roadmap items, KRs, tickets and customers it mentions.
 * Deterministic on purpose: the graph is the brain's spine and must not drift.
 */
export function buildTopology(): TopologyResult {
  const nodes = new Map<string, BrainGraphNode>();
  const edges = new Map<string, BrainGraphEdge>();
  const node = (id: string, label: string, type: BrainGraphNode['type'], detail?: string): string => {
    if (!nodes.has(id)) nodes.set(id, { id, label, type, ...(detail ? { detail } : {}) });
    return id;
  };
  const edge = (source: string, target: string, label: string): void => {
    if (source === target) return;
    const id = `${source}->${label}->${target}`;
    if (!edges.has(id)) edges.set(id, { id, source, target, label });
  };

  // People, teams, reporting lines.
  const people = loadPeople();
  const byName = new Map(people.map((p) => [p.name.toLowerCase(), p.id]));
  for (const p of people) {
    node(`person-${p.id}`, p.name, 'person', `${p.title} · ${p.level}`);
    edge(`person-${p.id}`, node(`team-${p.team}`, p.team, 'team'), 'member of');
    if (p.managerId) edge(`person-${p.id}`, `person-${p.managerId}`, 'reports to');
  }
  const personRef = (name: string): string | null => {
    const id = byName.get(name.trim().toLowerCase());
    return id ? `person-${id}` : null;
  };

  // Goals and KRs (okrs.md tables), department owners from headings.
  const okrs = readDataFile('internal/okrs.md');
  let deptOwner: string | null = null;
  let deptTeam: string | null = null;
  for (const line of okrs.split('\n')) {
    const heading = /^##\s+(.+?)\s+—\s+owner:\s+(.+)$/.exec(line);
    if (heading) {
      deptTeam = heading[1].trim();
      deptOwner = personRef(heading[2]);
      continue;
    }
    const row = /^\|\s*\*\*([A-Z]+-(?:KR)?\d+)\*\*\s*\|(.+)\|\s*$/.exec(line);
    if (!row) continue;
    const cells = row[2].split('|').map((c) => c.trim());
    const id = `goal-${row[1]}`;
    node(id, `${row[1]}: ${cells[0]}`, 'goal', cells.slice(-3, -1).join(' · '));
    const owner = personRef(cells[cells.length - 1] ?? '');
    if (owner) edge(owner, id, 'owns KR');
    if (row[1].includes('KR') && deptOwner) edge(id, deptOwner, 'dept goal of');
    if (row[1].includes('KR') && deptTeam) edge(id, node(`team-${deptTeam}`, deptTeam, 'team'), 'measures');
  }

  // Roadmap (roadmap.md table rows).
  const roadmap = readDataFile('internal/roadmap.md');
  for (const line of roadmap.split('\n')) {
    const row = /^\|\s*(R-\d+)\s*\|(.+)\|\s*$/.exec(line);
    if (!row) continue;
    const [item, owner, , krs, modules, status] = row[2].split('|').map((c) => c.trim());
    const id = node(`rm-${row[1]}`, `${row[1]}: ${item.replace(/\*\*/g, '')}`, 'roadmap', status?.replace(/\*\*/g, '').slice(0, 80));
    const owners = owner.split('/').map((o) => personRef(o)).filter(Boolean) as string[];
    if (owners.length) owners.forEach((o) => edge(o, id, 'owns'));
    else node('unowned', 'UNOWNED', 'gap', 'roadmap items with no owner');
    if (!owners.length) edge(id, 'unowned', 'has owner');
    for (const kr of krs.match(/[A-Z]+-(?:KR)?\d+/g) ?? []) edge(id, node(`goal-${kr}`, kr, 'goal'), 'advances');
    for (const mod of modules.match(/forgeline-[a-z-]+\/[a-z-]+/g) ?? []) edge(id, node(`code-${mod}`, mod, 'code'), 'changes');
  }

  // CODEOWNERS.
  for (const line of readDataFile('codebase/forgeline-core/CODEOWNERS').split('\n')) {
    const m = /^\/src\/([a-z-]+)\/?\s+(.+)$/.exec(line.trim());
    if (!m) continue;
    const code = node(`code-forgeline-core/${m[1]}`, `forgeline-core/${m[1]}`, 'code');
    for (const handle of m[2].match(/@[a-z-]+(?![/a-z-])/g) ?? []) {
      const pid = handle.slice(1);
      if (people.some((p) => p.id === pid)) edge(`person-${pid}`, code, 'code owner of');
    }
  }

  // Conversations and notes: who and what they mention.
  const docDirs: [string, string][] = [['slack', 'Slack'], ['one-on-ones', '1:1'], ['customer-notes', 'Customer note']];
  for (const [dir, kind] of docDirs) {
    const abs = path.join(DATA_DIR, 'internal', dir);
    if (!fs.existsSync(abs)) continue;
    for (const file of fs.readdirSync(abs).filter((f) => f.endsWith('.md'))) {
      const text = fs.readFileSync(path.join(abs, file), 'utf8');
      const title = (/^#\s+(.+)$/m.exec(text)?.[1] ?? file).slice(0, 70);
      const doc = node(`doc-${dir}/${file}`, title, 'doc', kind);
      if (dir === 'customer-notes') {
        const customer = file.replace(/-(lost-deal|churn-risk)\.md$/, '').replace(/-/g, ' ');
        edge(node(`customer-${customer}`, customer.replace(/\b\w/g, (c) => c.toUpperCase()), 'customer'), doc, 'described in');
      }
      for (const p of people) if (text.includes(p.name)) edge(doc, `person-${p.id}`, 'involves');
      for (const r of new Set(text.match(/\bR-\d{2}\b/g) ?? [])) if (nodes.has(`rm-${r}`)) edge(doc, `rm-${r}`, 'discusses');
      for (const kr of new Set(text.match(/\b[A-Z]{2,3}-(?:KR)?\d\b/g) ?? [])) if (nodes.has(`goal-${kr}`)) edge(doc, `goal-${kr}`, 'cites');
      for (const t of new Set(text.match(/\b(?:FL-\d{4}|INC-\d{3})\b/g) ?? [])) edge(doc, node(`ticket-${t}`, t, 'ticket'), 'references');
    }
  }

  const graph: BrainGraph = { nodes: [...nodes.values()], edges: [...edges.values()] };
  const count = (t: BrainGraphNode['type']): number => graph.nodes.filter((n) => n.type === t).length;
  return {
    graph,
    stats: {
      people: count('person'),
      teams: count('team'),
      goals: count('goal'),
      roadmapItems: count('roadmap'),
      codeModules: count('code'),
      docs: count('doc'),
      customers: count('customer'),
      tickets: count('ticket'),
      relations: graph.edges.length,
    },
  };
}

/** HydraDB bring-your-own-graph payload for the topology (local ids -> entities). */
export function topologyGraphPayload(t: TopologyResult): object {
  const typeName: Record<string, string> = {
    person: 'Person', team: 'Team', goal: 'Goal', roadmap: 'RoadmapItem', code: 'CodeModule',
    doc: 'Document', customer: 'Customer', ticket: 'Ticket', gap: 'Gap',
  };
  const local = new Map(t.graph.nodes.map((n, i) => [n.id, `e${i}`]));
  return {
    entities: Object.fromEntries(
      t.graph.nodes.map((n) => [local.get(n.id)!, { name: n.label, type: typeName[n.type] ?? 'Entity', namespace: 'company' }]),
    ),
    relations: t.graph.edges.map((e) => ({
      source: local.get(e.source)!,
      target: local.get(e.target)!,
      predicate: e.label.replace(/\s+/g, '_'),
      context: `${t.graph.nodes.find((n) => n.id === e.source)?.label} ${e.label} ${t.graph.nodes.find((n) => n.id === e.target)?.label}`,
    })),
  };
}

/** Plain-text rendering so the topology is also retrievable by text search. */
export function topologyText(t: TopologyResult): string {
  const label = new Map(t.graph.nodes.map((n) => [n.id, n.label]));
  return t.graph.edges.map((e) => `- ${label.get(e.source)} ${e.label} ${label.get(e.target)}`).join('\n');
}
