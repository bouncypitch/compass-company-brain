'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { BrainGraph, BrainGraphNode } from '@app-starter/shared';
import { ArrowUpRight } from 'lucide-react';
import { brainApi } from '@/lib/brain-api';
import { BrainGraphView, TYPE_COLOR, TYPE_LABEL } from './BrainGraphView';
import { GlassCard, Reveal, SectionHeading } from './ui';

/** One graph from market signal to an employee's promotion opportunity. */
export const StoryView = ({ organizationId, employeeId }: { organizationId: string; employeeId: string }) => {
  const [selected, setSelected] = useState<BrainGraphNode | null>(null);
  const radar = useQuery({ queryKey: ['brain-radar', organizationId], queryFn: () => brainApi.getRadar(organizationId) });
  const compass = useQuery({
    queryKey: ['brain-compass', organizationId, employeeId],
    queryFn: () => brainApi.compass(organizationId, employeeId),
    staleTime: Infinity,
  });

  const graph = useMemo<BrainGraph | null>(() => {
    if (!radar.data) return null;
    const nodes = [...radar.data.graph.nodes];
    const edges = [...radar.data.graph.edges];
    // Industry patterns: every company converging on a capability points at it.
    for (const p of radar.data.patterns) {
      const capId = `cap-${p.capability}`;
      if (!nodes.some((n) => n.id === capId)) continue;
      for (const company of p.companies) {
        const id = `co-${company}`;
        if (!nodes.some((n) => n.id === id)) nodes.push({ id, label: company, type: 'company', detail: 'converging' });
        edges.push({ id: `${id}->${capId}`, source: id, target: capId, label: 'converging on' });
      }
    }
    const c = compass.data;
    if (c) {
      const ids = new Set(nodes.map((n) => n.id));
      for (const n of c.graph.nodes) if (!ids.has(n.id)) nodes.push(n);
      edges.push(...c.graph.edges);
      // Stitch: a market gap that became this person's promotion opportunity.
      for (const o of c.opportunities) {
        if (o.gapId && ids.has(o.gapId)) edges.push({ id: `${o.gapId}->opp-${o.rank}`, source: o.gapId, target: `opp-${o.rank}`, label: 'becomes' });
      }
    }
    return focusStory({ nodes, edges }, c?.opportunities.find((o) => o.gapId)?.gapId ?? radar.data.gaps[0]?.id);
  }, [radar.data, compass.data]);

  if (!graph) {
    return <GlassCard className="p-10 text-center text-[15px] text-neutral-500">Run the radar first to build the story.</GlassCard>;
  }
  const types = [...new Set(graph.nodes.map((n) => n.type))];
  return (
    <div className="space-y-6">
      <Reveal>
        <SectionHeading
          eyebrow="The story"
          title="From market signal to your promotion"
          description="From public competitor signals, to the capability they point at, to the Forgeline gap, roadmap, code and goals, to the person best placed to own it."
        />
      </Reveal>
      <Reveal delay={80}>
        <ul className="flex flex-wrap gap-x-4 gap-y-2" aria-label="Node types">
          {types.map((t) => (
            <li key={t} className="flex items-center gap-1.5 text-[12px] text-neutral-500">
              <span className="h-2 w-2 rounded-full" style={{ background: TYPE_COLOR[t].border }} aria-hidden />
              {TYPE_LABEL[t]}
            </li>
          ))}
        </ul>
      </Reveal>
      <Reveal delay={140}>
        <BrainGraphView graph={graph} onSelect={setSelected} />
      </Reveal>
      {selected ? (
        <GlassCard className="flex flex-wrap items-start gap-4 p-6 animate-in fade-in slide-in-from-bottom-2 duration-300 motion-reduce:animate-none">
          <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: TYPE_COLOR[selected.type].border }} aria-hidden />
          <div className="min-w-0 flex-1 space-y-1">
            <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-400">{TYPE_LABEL[selected.type]}</div>
            <div className="text-[17px] font-semibold tracking-[-0.01em] text-neutral-900">{selected.label}</div>
            {selected.detail ? <div className="text-[14px] text-neutral-500">{selected.detail}</div> : null}
          </div>
          {selected.url ? (
            <a href={selected.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-full bg-black/[0.04] px-3 py-1.5 text-[13px] font-medium text-indigo-600 hover:bg-indigo-50">
              Open source <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
            </a>
          ) : null}
        </GlassCard>
      ) : null}
    </div>
  );
};

/**
 * Keeps one readable chain: the focus gap, the capability that threatens it,
 * the competitor moves pursuing that capability (with two signals each), the
 * gap's roadmap/code/goals, and the promotion opportunities it became.
 */
function focusStory(graph: BrainGraph, gapId: string | undefined): BrainGraph {
  if (!gapId) return graph;
  const keep = new Set<string>([gapId]);
  const into = (id: string) => graph.edges.filter((e) => e.target === id);
  const out = (id: string) => graph.edges.filter((e) => e.source === id);
  for (const e of into(gapId)) {
    keep.add(e.source); // capability
    for (const m of into(e.source)) {
      keep.add(m.source); // competitor move
      into(m.source).slice(0, 2).forEach((s) => keep.add(s.source)); // signals / talk clips
    }
  }
  for (const e of out(gapId)) {
    keep.add(e.target); // roadmap, code, goals, opportunities
    if (e.target.startsWith('opp-')) out(e.target).forEach((o) => keep.add(o.target)); // person, manager, skills
  }
  return {
    nodes: graph.nodes.filter((n) => keep.has(n.id)),
    edges: graph.edges.filter((e) => keep.has(e.source) && keep.has(e.target)),
  };
}
