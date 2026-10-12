'use client';

import { useEffect, useMemo, useRef } from 'react';
import { Background, Controls, MarkerType, ReactFlow, type Edge, type Node, type ReactFlowInstance } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import type { BrainGraph, BrainGraphNode } from '@app-starter/shared';
import { cn } from '@/lib/utils';

/** Left-to-right story order: evidence on the left, the person on the right. */
const COLUMN: Record<BrainGraphNode['type'], number> = {
  signal: 0,
  talk: 0,
  company: 0,
  move: 1,
  capability: 2,
  gap: 3,
  roadmap: 4,
  code: 4,
  goal: 5,
  skill: 6,
  person: 6,
  team: 6,
  doc: 4,
  customer: 0,
  ticket: 4,
};

/** Inline colors: React Flow's default node CSS overrides Tailwind background utilities. */
export const TYPE_COLOR: Record<BrainGraphNode['type'], { bg: string; border: string; fg: string }> = {
  signal: { bg: '#f0f9ff', border: '#38bdf8', fg: '#0c4a6e' },
  talk: { bg: '#fdf4ff', border: '#d946ef', fg: '#701a75' },
  company: { bg: '#e0f2fe', border: '#0ea5e9', fg: '#0c4a6e' },
  move: { bg: '#eef2ff', border: '#6366f1', fg: '#312e81' },
  capability: { bg: '#f5f3ff', border: '#8b5cf6', fg: '#4c1d95' },
  gap: { bg: '#fff1f2', border: '#f43f5e', fg: '#881337' },
  roadmap: { bg: '#fffbeb', border: '#f59e0b', fg: '#78350f' },
  code: { bg: '#f8fafc', border: '#64748b', fg: '#0f172a' },
  goal: { bg: '#ecfdf5', border: '#10b981', fg: '#064e3b' },
  skill: { bg: '#f0fdfa', border: '#14b8a6', fg: '#134e4a' },
  person: { bg: '#ffedd5', border: '#f97316', fg: '#7c2d12' },
  team: { bg: '#fdf2f8', border: '#ec4899', fg: '#831843' },
  doc: { bg: '#f7fee7', border: '#84cc16', fg: '#365314' },
  customer: { bg: '#ecfeff', border: '#06b6d4', fg: '#164e63' },
  ticket: { bg: '#fef2f2', border: '#ef4444', fg: '#7f1d1d' },
};

export const TYPE_LABEL: Record<BrainGraphNode['type'], string> = {
  signal: 'Signal',
  talk: 'Talk clip',
  company: 'Company',
  move: 'Competitor move',
  capability: 'Capability',
  gap: 'Gap / opportunity',
  roadmap: 'Roadmap',
  code: 'Code',
  goal: 'Goal',
  skill: 'Ladder skill',
  person: 'Person',
  team: 'Team',
  doc: 'Doc',
  customer: 'Customer',
  ticket: 'Ticket',
};

interface BrainGraphViewProps {
  graph: BrainGraph;
  highlight?: string[];
  onSelect?: (node: BrainGraphNode) => void;
  className?: string;
  /** Override the left-to-right column per node type (e.g. for the org map). */
  columns?: Partial<Record<BrainGraphNode['type'], number>>;
  /** Hide edge labels and animation for dense graphs. */
  isDense?: boolean;
}

export const BrainGraphView = ({ graph, highlight = [], onSelect, className, columns, isDense = false }: BrainGraphViewProps) => {
  const instance = useRef<ReactFlowInstance | null>(null);
  const highlightKey = highlight.join('|');

  // Dense graphs: fly the camera to the highlighted neighborhood (or back out when cleared).
  useEffect(() => {
    const flow = instance.current;
    if (!flow || !isDense) return;
    const ids = highlightKey ? highlightKey.split('|') : [];
    const timer = setTimeout(() => {
      void flow.fitView(ids.length ? { nodes: ids.map((id) => ({ id })), padding: 0.25, duration: 700 } : { padding: 0.08, duration: 700 });
    }, 50);
    return () => clearTimeout(timer);
  }, [highlightKey, isDense]);

  const { nodes, edges } = useMemo(() => {
    const lit = new Set(highlight);
    // Dense graphs wrap each column into sub-columns of MAX_ROWS so the canvas stays readable.
    const maxRows = isDense ? 9 : Number.POSITIVE_INFINITY;
    const colOf = (n: BrainGraphNode): number => columns?.[n.type] ?? COLUMN[n.type] ?? 3;
    const byCol = new Map<number, BrainGraphNode[]>();
    graph.nodes.forEach((n) => byCol.set(colOf(n), [...(byCol.get(colOf(n)) ?? []), n]));
    const positions = new Map<string, { x: number; y: number }>();
    let cursorX = 0;
    [...byCol.keys()].sort((a, b) => a - b).forEach((col) => {
      const list = byCol.get(col)!;
      list.forEach((n, i) => {
        const sub = Math.floor(i / maxRows);
        const row = i % maxRows;
        positions.set(n.id, { x: cursorX + sub * 235, y: row * (isDense ? 92 : 104) + (!isDense && col % 2 ? 40 : 0) });
      });
      cursorX += Math.max(1, Math.ceil(list.length / maxRows)) * 235 + (isDense ? 90 : 25);
    });
    const flowNodes: Node[] = graph.nodes.map((n) => {
      return {
        id: n.id,
        position: positions.get(n.id)!,
        data: {
          label: (
            <div className="text-left">
              <div className="mb-1 flex items-center gap-1.5 text-[9.5px] font-semibold uppercase tracking-[0.12em] opacity-70">
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: TYPE_COLOR[n.type].border }} />
                {TYPE_LABEL[n.type]}
              </div>
              <div className="line-clamp-2 text-[12px] font-medium leading-snug">{n.label}</div>
              {n.detail ? <div className="mt-1 line-clamp-1 text-[10px] opacity-60">{n.detail}</div> : null}
            </div>
          ),
          raw: n,
        },
        className: cn('!rounded-2xl !px-3 !py-2 transition-opacity', n.type === 'code' && 'font-mono', lit.size > 0 && !lit.has(n.id) && 'opacity-40'),
        style: {
          width: 210,
          background: `linear-gradient(180deg, #ffffff 0%, ${TYPE_COLOR[n.type].bg} 100%)`,
          border: `1px solid ${TYPE_COLOR[n.type].border}55`,
          color: TYPE_COLOR[n.type].fg,
          boxShadow: '0 1px 2px rgba(0,0,0,0.04), 0 8px 20px -12px rgba(15,23,42,0.25)',
        },
      };
    });
    const flowEdges: Edge[] = graph.edges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      label: isDense && !(lit.has(e.source) && lit.has(e.target)) ? undefined : e.label,
      animated: !isDense || (lit.has(e.source) && lit.has(e.target)),
      hidden: isDense && lit.size > 0 && !(lit.has(e.source) && lit.has(e.target)),
      style: { stroke: '#b4b9d9', strokeWidth: 1.25 },
      labelStyle: { fontSize: 10, fill: '#737373', fontWeight: 500 },
      labelBgStyle: { fill: '#ffffff', fillOpacity: 0.85 },
      labelBgPadding: [6, 3] as [number, number],
      labelBgBorderRadius: 6,
      markerEnd: { type: MarkerType.ArrowClosed, color: '#c7cbe3' },
    }));
    return { nodes: flowNodes, edges: flowEdges };
  }, [graph, highlight, columns, isDense]);

  return (
    <div
      className={cn(
        'h-[600px] w-full overflow-hidden [&_[data-handlepos]]:!opacity-0 rounded-3xl border border-black/[0.06] bg-gradient-to-br from-[#f7f8ff] via-[#fdfbff] to-[#f3fbf9] shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_12px_32px_-16px_rgba(15,23,42,0.14)]',
        className,
      )}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        fitView
        fitViewOptions={{ padding: 0.08 }}
        minZoom={0.2}
        proOptions={{ hideAttribution: true }}
        style={{ background: 'transparent' }}
        nodesConnectable={false}
        onInit={(flow) => {
          instance.current = flow;
          setTimeout(() => void flow.fitView({ padding: 0.08 }), 60);
        }}
        onNodeClick={(_, node) => onSelect?.((node.data as { raw: BrainGraphNode }).raw)}
      >
        <Background gap={22} size={1.2} color="#d9dbe8" />
        <Controls showInteractive={false} className="!overflow-hidden !rounded-xl !border !border-black/[0.06] !shadow-[0_4px_12px_-4px_rgba(15,23,42,0.15)]" />
      </ReactFlow>
    </div>
  );
};
