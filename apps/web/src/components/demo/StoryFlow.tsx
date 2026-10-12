'use client';

import { useCallback, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import type { BrainGraph, BrainGraphNode } from '@app-starter/shared';
import { TYPE_COLOR, TYPE_LABEL } from '@/components/brain/BrainGraphView';
import { cn } from '@/lib/utils';
import { Rise } from './primitives';

interface StoryColumn {
  title: string;
  color: string;
  /** Max cards shown so every column fits the 1440x900 frame. */
  limit: number;
  accepts: (n: BrainGraphNode) => boolean;
  /** Lower sorts first inside the column. */
  rank?: (n: BrainGraphNode) => number;
}

const isOpportunity = (n: BrainGraphNode): boolean => n.id.startsWith('opp-');

/** signal → move → capability → gap → roadmap/code/goal → opportunity → person. */
const COLUMNS: StoryColumn[] = [
  {
    title: 'Signals',
    color: TYPE_COLOR.signal.border,
    limit: 3,
    accepts: (n) => n.type === 'signal' || n.type === 'talk',
  },
  {
    title: 'Move',
    color: TYPE_COLOR.move.border,
    limit: 2,
    accepts: (n) => n.type === 'move',
  },
  {
    title: 'Capability',
    color: TYPE_COLOR.capability.border,
    limit: 1,
    accepts: (n) => n.type === 'capability',
  },
  {
    title: 'Our gap',
    color: TYPE_COLOR.gap.border,
    limit: 1,
    accepts: (n) => n.type === 'gap' && !isOpportunity(n),
  },
  {
    title: 'Plan · code',
    color: TYPE_COLOR.roadmap.border,
    limit: 4,
    accepts: (n) => n.type === 'roadmap' || n.type === 'code' || n.type === 'goal',
    rank: (n) => ({ roadmap: 0, code: 1, goal: 2 })[n.type as 'roadmap' | 'code' | 'goal'] ?? 3,
  },
  {
    title: 'Opportunity',
    color: TYPE_COLOR.skill.border,
    limit: 1,
    accepts: (n) => isOpportunity(n),
  },
  {
    title: 'People',
    color: TYPE_COLOR.person.border,
    limit: 3,
    accepts: (n) => n.type === 'person' || n.type === 'skill',
    rank: (n) => (n.type === 'person' ? 0 : 1),
  },
];

interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** A large, readable left-to-right story canvas with self-drawing, flowing connectors. */
export const StoryFlow = ({ graph }: { graph: BrainGraph }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const nodeRefs = useRef(new Map<string, HTMLDivElement>());
  const [boxes, setBoxes] = useState<Map<string, Box>>(new Map());

  const { columns, colOf } = useMemo(() => {
    const degree = new Map<string, number>();
    graph.edges.forEach((e) => {
      degree.set(e.source, (degree.get(e.source) ?? 0) + 1);
      degree.set(e.target, (degree.get(e.target) ?? 0) + 1);
    });
    const placed = new Map<string, number>();
    const cols = COLUMNS.map((col, ci) => {
      const nodes = graph.nodes
        .filter((n) => col.accepts(n))
        .sort(
          (a, b) =>
            (col.rank?.(a) ?? 0) - (col.rank?.(b) ?? 0) ||
            (degree.get(b.id) ?? 0) - (degree.get(a.id) ?? 0),
        )
        .slice(0, col.limit);
      nodes.forEach((n) => placed.set(n.id, ci));
      return { ...col, nodes };
    });
    return { columns: cols, colOf: placed };
  }, [graph]);

  const edges = useMemo(
    () =>
      graph.edges
        .filter(
          (e) =>
            colOf.has(e.source) &&
            colOf.has(e.target) &&
            colOf.get(e.source) !== colOf.get(e.target),
        )
        .map((e) =>
          colOf.get(e.source)! < colOf.get(e.target)!
            ? { id: e.id, from: e.source, to: e.target }
            : { id: e.id, from: e.target, to: e.source },
        ),
    [graph.edges, colOf],
  );

  // Offsets are relative to the container and ignore the slide's CSS transforms.
  const measure = useCallback((): void => {
    const next = new Map<string, Box>();
    nodeRefs.current.forEach((el, id) =>
      next.set(id, { x: el.offsetLeft, y: el.offsetTop, w: el.offsetWidth, h: el.offsetHeight }),
    );
    setBoxes(next);
  }, []);

  useLayoutEffect(() => {
    measure();
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [measure, columns]);

  const setNodeRef = (id: string) => (el: HTMLDivElement | null) => {
    if (el) nodeRefs.current.set(id, el);
    else nodeRefs.current.delete(id);
  };

  return (
    <div ref={containerRef} className="relative h-full">
      <svg
        aria-hidden
        className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
      >
        {edges.map((e) => {
          const a = boxes.get(e.from);
          const b = boxes.get(e.to);
          if (!a || !b) return null;
          const x1 = a.x + a.w;
          const y1 = a.y + a.h / 2;
          const x2 = b.x;
          const y2 = b.y + b.h / 2;
          const dx = Math.max(24, (x2 - x1) / 2);
          const d = `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;
          const delay = 500 + (colOf.get(e.from) ?? 0) * 220;
          return (
            <g key={e.id}>
              <path
                d={d}
                pathLength={1}
                fill="none"
                stroke="#b8bde0"
                strokeWidth={1.6}
                className="demo-draw"
                style={{ '--d': `${delay}ms` } as CSSProperties}
              />
              <path
                d={d}
                fill="none"
                stroke="#7c83f0"
                strokeOpacity={0.55}
                strokeWidth={2}
                strokeLinecap="round"
                className="demo-flow"
                style={{ strokeDasharray: '3 13' }}
              />
            </g>
          );
        })}
      </svg>
      <div className="grid h-full grid-cols-7 gap-9">
        {columns.map((col, ci) => (
          <div key={col.title} className="flex min-w-0 flex-col">
            <Rise
              delay={ci * 120}
              className="mb-4 flex items-center gap-2 text-[13px] font-semibold uppercase tracking-[0.12em] text-neutral-400"
            >
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ background: col.color }}
                aria-hidden
              />
              <span className="truncate">{col.title}</span>
            </Rise>
            <div className="flex flex-1 flex-col justify-center gap-4">
              {col.nodes.map((n) => {
                const tone = TYPE_COLOR[n.type];
                const isFocus = n.type === 'person' && n.id === 'person';
                return (
                  // The ref sits outside Rise: a transformed ancestor would become the offsetParent.
                  <div key={n.id} ref={setNodeRef(n.id)}>
                    <Rise delay={150 + ci * 160}>
                      <div
                        className={cn(
                          'rounded-2xl px-4 py-3.5',
                          isFocus && 'ring-4 ring-orange-200',
                        )}
                        style={{
                          background: `linear-gradient(180deg, #ffffff 0%, ${tone.bg} 100%)`,
                          border: `1px solid ${tone.border}66`,
                          color: tone.fg,
                          boxShadow:
                            '0 1px 2px rgba(0,0,0,0.04), 0 12px 28px -16px rgba(15,23,42,0.3)',
                        }}
                      >
                        <div className="mb-1 text-[10.5px] font-semibold uppercase tracking-[0.12em] opacity-60">
                          {isOpportunity(n) ? 'Opportunity' : TYPE_LABEL[n.type]}
                        </div>
                        <div
                          className={cn(
                            'line-clamp-4 text-[16px] font-semibold leading-snug tracking-[-0.01em]',
                            n.type === 'code' &&
                              'font-mono text-[13.5px] font-medium tracking-normal',
                          )}
                        >
                          {n.type === 'code' ? n.label.replace(/\s*\(.*\)\s*$/, '') : n.label}
                        </div>
                      </div>
                    </Rise>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
