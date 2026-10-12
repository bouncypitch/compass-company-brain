'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import type { BrainGraph, BrainGraphNode } from '@app-starter/shared';
import { brainApiExtras } from '@/lib/brain-api';
import { cn } from '@/lib/utils';
import { BrainGraphView, TYPE_COLOR, TYPE_LABEL } from './BrainGraphView';
import { GlassCard, SectionHeading, StatPill } from './ui';

type Layer = 'org' | 'strategy' | 'code' | 'conversations';

const LAYERS: { value: Layer; label: string; types: BrainGraphNode['type'][] }[] = [
  { value: 'org', label: 'People & teams', types: ['team', 'person'] },
  { value: 'strategy', label: 'Goals & roadmap', types: ['goal', 'roadmap', 'gap'] },
  { value: 'code', label: 'Code', types: ['code'] },
  { value: 'conversations', label: 'Conversations & customers', types: ['doc', 'customer', 'ticket'] },
];

/** Left-to-right: who → what they drive → what it changes → where it is discussed. */
const COLUMNS: Partial<Record<BrainGraphNode['type'], number>> = {
  team: 0,
  person: 1,
  goal: 2,
  gap: 3,
  roadmap: 3,
  code: 4,
  doc: 5,
  customer: 6,
  ticket: 6,
};

/** The company knowledge graph: who works where, owns what, and what is discussed where. */
export const OrgMapView = ({ organizationId }: { organizationId: string }) => {
  const [layers, setLayers] = useState<Set<Layer>>(new Set<Layer>(['org', 'strategy', 'code']));
  const [selected, setSelected] = useState<BrainGraphNode | null>(null);
  const topology = useQuery({ queryKey: ['brain-topology', organizationId], queryFn: () => brainApiExtras.topology(organizationId) });

  const graph = useMemo<BrainGraph | null>(() => {
    if (!topology.data) return null;
    const types = new Set(LAYERS.filter((l) => layers.has(l.value)).flatMap((l) => l.types));
    const nodes = topology.data.graph.nodes.filter((n) => types.has(n.type));
    const ids = new Set(nodes.map((n) => n.id));
    return { nodes, edges: topology.data.graph.edges.filter((e) => ids.has(e.source) && ids.has(e.target)) };
  }, [topology.data, layers]);

  const neighborhood = useMemo(() => {
    if (!selected || !graph) return [];
    const ids = new Set([selected.id]);
    graph.edges.forEach((e) => {
      if (e.source === selected.id) ids.add(e.target);
      if (e.target === selected.id) ids.add(e.source);
    });
    return [...ids];
  }, [selected, graph]);

  const relations = useMemo(() => {
    if (!selected || !topology.data) return [];
    const label = new Map(topology.data.graph.nodes.map((n) => [n.id, n.label]));
    return topology.data.graph.edges
      .filter((e) => e.source === selected.id || e.target === selected.id)
      .map((e) => `${label.get(e.source)} ${e.label} ${label.get(e.target)}`);
  }, [selected, topology.data]);

  const handleToggle = (layer: Layer): void =>
    setLayers((prev) => {
      const next = new Set(prev);
      if (next.has(layer)) next.delete(layer);
      else next.add(layer);
      return next.size ? next : prev;
    });

  const stats = topology.data?.stats;
  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow="Company graph"
        title="Who works where, owns what, and why it matters"
        description="Built from the org chart, OKRs, roadmap, CODEOWNERS, Slack, 1:1s and customer notes, and declared to HydraDB as a bring-your-own graph."
      />
      {stats ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-8">
          <StatPill value={stats.people} label="people" />
          <StatPill value={stats.teams} label="teams" />
          <StatPill value={stats.goals} label="goals & KRs" />
          <StatPill value={stats.roadmapItems} label="roadmap items" />
          <StatPill value={stats.codeModules} label="code modules" />
          <StatPill value={stats.docs} label="conversations" />
          <StatPill value={stats.customers + stats.tickets} label="customers & tickets" />
          <StatPill value={stats.relations} label="relationships" />
        </div>
      ) : null}
      <div className="flex flex-wrap gap-2">
        {LAYERS.map((l) => (
          <button
            key={l.value}
            type="button"
            aria-pressed={layers.has(l.value)}
            onClick={() => handleToggle(l.value)}
            className={cn(
              'rounded-full px-4 py-2 text-[13px] font-medium transition',
              layers.has(l.value) ? 'bg-neutral-900 text-white' : 'border border-black/[0.08] bg-white/70 text-neutral-600 hover:bg-white',
            )}
          >
            {l.label}
          </button>
        ))}
        {selected ? (
          <button type="button" onClick={() => setSelected(null)} className="rounded-full px-4 py-2 text-[13px] text-violet-600 hover:bg-violet-50">
            Clear focus
          </button>
        ) : null}
      </div>
      {topology.isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
      {graph ? (
        <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
          <BrainGraphView graph={graph} columns={COLUMNS} isDense highlight={neighborhood} onSelect={setSelected} className="h-[640px]" />
          <GlassCard className="max-h-[640px] space-y-3 overflow-auto p-5">
            {selected ? (
              <>
                <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em]" style={{ color: TYPE_COLOR[selected.type].fg }}>
                  <span className="h-2 w-2 rounded-full" style={{ background: TYPE_COLOR[selected.type].border }} />
                  {TYPE_LABEL[selected.type]}
                </div>
                <div className="text-[18px] font-semibold leading-snug text-neutral-900">{selected.label}</div>
                {selected.detail ? <div className="text-[13px] text-neutral-500">{selected.detail}</div> : null}
                <ul className="space-y-1.5 border-t border-black/[0.06] pt-3 text-[13px] text-neutral-700">
                  {relations.map((r) => <li key={r}>{r}</li>)}
                </ul>
              </>
            ) : (
              <p className="text-[14px] leading-relaxed text-neutral-500">
                Click any person, goal, roadmap item or code module to see everything connected to it.
              </p>
            )}
          </GlassCard>
        </div>
      ) : null}
    </div>
  );
};
