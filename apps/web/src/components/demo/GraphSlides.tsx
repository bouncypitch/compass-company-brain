'use client';

import { useMemo, useState } from 'react';
import { X } from 'lucide-react';
import type { BrainGraph, BrainGraphNode, CompassResult, RadarResult } from '@app-starter/shared';
import { BrainGraphView, TYPE_COLOR, TYPE_LABEL } from '@/components/brain/BrainGraphView';
import { useDemo } from './DemoContext';
import { StoryFlow } from './StoryFlow';
import { CountUp, Glass, Rise, SlideFrame, SlideLoading, type SlideProps } from './primitives';

/**
 * Keeps one readable chain: the focus gap, the capability that threatens it,
 * the competitor moves pursuing that capability (two signals each), the gap's
 * roadmap/code/goals, and the promotion opportunities it became.
 * Mirrors StoryView's private helper so the demo tells the same story.
 */
const focusStory = (graph: BrainGraph, gapId: string | undefined): BrainGraph => {
  if (!gapId) return graph;
  const keep = new Set<string>([gapId]);
  const into = (id: string) => graph.edges.filter((e) => e.target === id);
  const out = (id: string) => graph.edges.filter((e) => e.source === id);
  for (const e of into(gapId)) {
    keep.add(e.source);
    for (const m of into(e.source)) {
      keep.add(m.source);
      into(m.source)
        .slice(0, 2)
        .forEach((s) => keep.add(s.source));
    }
  }
  for (const e of out(gapId)) {
    keep.add(e.target);
    if (e.target.startsWith('opp-')) out(e.target).forEach((o) => keep.add(o.target));
  }
  return {
    nodes: graph.nodes.filter((n) => keep.has(n.id)),
    edges: graph.edges.filter((e) => keep.has(e.source) && keep.has(e.target)),
  };
};

const buildStory = (radar: RadarResult, compass: CompassResult | undefined): BrainGraph => {
  const nodes = [...radar.graph.nodes];
  const edges = [...radar.graph.edges];
  for (const p of radar.patterns) {
    const capId = `cap-${p.capability}`;
    if (!nodes.some((n) => n.id === capId)) continue;
    for (const company of p.companies) {
      const id = `co-${company}`;
      if (!nodes.some((n) => n.id === id))
        nodes.push({ id, label: company, type: 'company', detail: 'converging' });
      edges.push({ id: `${id}->${capId}`, source: id, target: capId, label: 'converging on' });
    }
  }
  if (compass) {
    const ids = new Set(nodes.map((n) => n.id));
    for (const n of compass.graph.nodes) if (!ids.has(n.id)) nodes.push(n);
    edges.push(...compass.graph.edges);
    for (const o of compass.opportunities) {
      if (o.gapId && ids.has(o.gapId))
        edges.push({
          id: `${o.gapId}->opp-${o.rank}`,
          source: o.gapId,
          target: `opp-${o.rank}`,
          label: 'becomes',
        });
    }
  }
  return focusStory(
    { nodes, edges },
    compass?.opportunities.find((o) => o.gapId)?.gapId ?? radar.gaps[0]?.id,
  );
};

const GRAPH_CLASS = 'h-full rounded-[28px] bg-white/50 backdrop-blur-xl';

export const StorySlide = () => {
  const { radar, compass } = useDemo();
  const graph = useMemo(
    () => (radar.data ? buildStory(radar.data, compass.data) : null),
    [radar.data, compass.data],
  );
  if (!graph) return <SlideLoading />;
  return (
    <SlideFrame
      title={
        <>
          From a competitor&apos;s launch to{' '}
          <span className="demo-gradient-text">Jordan&apos;s promotion</span>.
        </>
      }
    >
      <StoryFlow graph={graph} />
    </SlideFrame>
  );
};

const ORG_TYPES = new Set<BrainGraphNode['type']>([
  'team',
  'person',
  'goal',
  'roadmap',
  'gap',
  'code',
]);
const ORG_COLUMNS: Partial<Record<BrainGraphNode['type'], number>> = {
  team: 0,
  person: 1,
  goal: 2,
  gap: 3,
  roadmap: 3,
  code: 4,
};

export const OrgSlide = ({ isActive }: SlideProps) => {
  const { topology } = useDemo();
  const [selected, setSelected] = useState<BrainGraphNode | null>(null);
  const data = topology.data;

  const graph = useMemo<BrainGraph | null>(() => {
    if (!data) return null;
    const nodes = data.graph.nodes.filter((n) => ORG_TYPES.has(n.type));
    const ids = new Set(nodes.map((n) => n.id));
    return { nodes, edges: data.graph.edges.filter((e) => ids.has(e.source) && ids.has(e.target)) };
  }, [data]);

  /** Focus mode (as in OrgMapView): redraw only the node and its direct connections. */
  const focused = useMemo<BrainGraph | null>(() => {
    if (!selected || !data) return null;
    const ids = new Set([selected.id]);
    data.graph.edges.forEach((e) => {
      if (e.source === selected.id) ids.add(e.target);
      if (e.target === selected.id) ids.add(e.source);
    });
    const nodes = data.graph.nodes.filter((n) => ids.has(n.id));
    return { nodes, edges: data.graph.edges.filter((e) => ids.has(e.source) && ids.has(e.target)) };
  }, [selected, data]);

  if (!data || !graph) return <SlideLoading />;
  const { stats } = data;
  const tiles = [
    { value: stats.people, label: 'people' },
    { value: stats.teams, label: 'teams' },
    { value: stats.goals, label: 'goals' },
    { value: stats.roadmapItems, label: 'roadmap' },
    { value: stats.codeModules, label: 'code' },
    { value: stats.relations, label: 'relationships' },
  ];
  const handleClear = (): void => setSelected(null);

  return (
    <SlideFrame
      title="One company. One graph."
      aside={
        <Glass className="flex items-center divide-x divide-black/[0.06] bg-white/85 py-3">
          {tiles.map((t) => (
            <div key={t.label} className="flex flex-col items-center px-5">
              <CountUp
                target={t.value}
                isActive={isActive}
                className="text-[30px] font-semibold leading-none tracking-[-0.03em] text-neutral-950"
              />
              <span className="mt-1 text-[12px] font-medium uppercase tracking-[0.1em] text-neutral-400">
                {t.label}
              </span>
            </div>
          ))}
        </Glass>
      }
    >
      <div className="relative h-full">
        <Rise delay={120} className="h-full">
          <BrainGraphView
            key={selected?.id ?? 'all'}
            graph={focused ?? graph}
            columns={ORG_COLUMNS}
            isDense={!selected}
            onSelect={setSelected}
            className={GRAPH_CLASS}
          />
        </Rise>
        {selected ? (
          <Glass className="absolute bottom-5 right-5 flex max-w-[420px] items-center gap-3 bg-white/90 py-3 pl-5 pr-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <span
              className="h-3 w-3 shrink-0 rounded-full"
              style={{ background: TYPE_COLOR[selected.type].border }}
              aria-hidden
            />
            <div className="min-w-0">
              <div className="text-[12px] font-semibold uppercase tracking-[0.12em] text-neutral-400">
                {TYPE_LABEL[selected.type]}
              </div>
              <div className="truncate text-[18px] font-semibold text-neutral-900">
                {selected.label}
              </div>
            </div>
            <button
              type="button"
              onClick={handleClear}
              aria-label="Clear focus"
              className="ml-2 rounded-full p-2 text-neutral-500 hover:bg-black/[0.05]"
            >
              <X className="h-5 w-5" aria-hidden />
            </button>
          </Glass>
        ) : (
          <span className="pointer-events-none absolute bottom-5 right-6 rounded-full bg-white/80 px-4 py-2 text-[14px] font-medium text-neutral-500 backdrop-blur">
            Click any node to focus
          </span>
        )}
      </div>
    </SlideFrame>
  );
};
