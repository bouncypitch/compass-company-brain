'use client';

import { useMemo } from 'react';
import { Background, Controls, MarkerType, ReactFlow, type Edge, type Node } from '@xyflow/react';
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
};

const TYPE_STYLE: Record<BrainGraphNode['type'], string> = {
  signal: 'border-sky-400 bg-sky-50 text-sky-950',
  talk: 'border-fuchsia-500 bg-fuchsia-50 text-fuchsia-950',
  company: 'border-sky-500 bg-sky-100 text-sky-950',
  move: 'border-indigo-500 bg-indigo-50 text-indigo-950',
  capability: 'border-violet-500 bg-violet-50 text-violet-950',
  gap: 'border-rose-500 bg-rose-50 text-rose-950',
  roadmap: 'border-amber-500 bg-amber-50 text-amber-950',
  code: 'border-slate-500 bg-slate-50 text-slate-900 font-mono',
  goal: 'border-emerald-500 bg-emerald-50 text-emerald-950',
  skill: 'border-teal-500 bg-teal-50 text-teal-950',
  person: 'border-orange-500 bg-orange-100 text-orange-950 font-semibold',
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
};

interface BrainGraphViewProps {
  graph: BrainGraph;
  highlight?: string[];
  onSelect?: (node: BrainGraphNode) => void;
  className?: string;
}

export const BrainGraphView = ({ graph, highlight = [], onSelect, className }: BrainGraphViewProps) => {
  const { nodes, edges } = useMemo(() => {
    const rows: Record<number, number> = {};
    const lit = new Set(highlight);
    const flowNodes: Node[] = graph.nodes.map((n) => {
      const col = COLUMN[n.type] ?? 3;
      const row = (rows[col] = (rows[col] ?? -1) + 1);
      return {
        id: n.id,
        position: { x: col * 250, y: row * 86 + (col % 2) * 30 },
        data: {
          label: (
            <div className="text-left">
              <div className="text-[10px] uppercase tracking-wide opacity-60">{TYPE_LABEL[n.type]}</div>
              <div className="text-xs leading-snug line-clamp-3">{n.label}</div>
              {n.detail ? <div className="text-[10px] opacity-70 mt-0.5 line-clamp-1">{n.detail}</div> : null}
            </div>
          ),
          raw: n,
        },
        className: cn(
          'rounded-md border-2 !w-[210px] !p-2 shadow-sm',
          TYPE_STYLE[n.type],
          lit.size > 0 && !lit.has(n.id) && 'opacity-40',
        ),
      };
    });
    const flowEdges: Edge[] = graph.edges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      label: e.label,
      animated: true,
      labelStyle: { fontSize: 10 },
      markerEnd: { type: MarkerType.ArrowClosed },
    }));
    return { nodes: flowNodes, edges: flowEdges };
  }, [graph, highlight]);

  return (
    <div className={cn('h-[560px] w-full rounded-lg border bg-background', className)}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        fitView
        proOptions={{ hideAttribution: true }}
        nodesConnectable={false}
        onNodeClick={(_, node) => onSelect?.((node.data as { raw: BrainGraphNode }).raw)}
      >
        <Background gap={20} />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  );
};
