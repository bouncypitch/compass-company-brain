'use client';

import { useMemo, useState, type CSSProperties } from 'react';
import { Check } from 'lucide-react';
import {
  BRAIN_CAPABILITY_LABELS,
  type BrainCapability,
  type BrainSignal,
  type CompetitorMove,
  type IndustryPattern,
  type RadarResult,
  type TimeMachineReveal,
} from '@app-starter/shared';
import { cn } from '@/lib/utils';
import { useDemo } from './DemoContext';
import {
  CompanyDot,
  Glass,
  Rise,
  SlideFrame,
  SlideLoading,
  companyColor,
  formatDate,
  truncate,
} from './primitives';

/** Soft indigo scale indexed by landscape strength (0 = no signal). */
const CELL = [
  'bg-black/[0.025] text-neutral-300',
  'bg-indigo-50 text-indigo-400',
  'bg-indigo-200/70 text-indigo-700',
  'bg-gradient-to-br from-indigo-400 to-violet-500 text-white shadow-[0_6px_16px_-6px_rgba(99,102,241,0.6)]',
];

interface ActiveCell {
  capability: BrainCapability;
  company: string;
  signals: BrainSignal[];
  /** Position of the popover in % of the grid. */
  rowIndex: number;
  colIndex: number;
}

export const LandscapeSlide = () => (
  <SlideFrame title="Where everyone is moving.">
    <Rise delay={120} className="h-full">
      <LandscapeHeatmap />
    </Rise>
  </SlideFrame>
);

/** Capability × competitor heatmap with signal popovers; `highlight` accents one row. */
export const LandscapeHeatmap = ({ highlight }: { highlight?: BrainCapability }) => {
  const { radar } = useDemo();
  const [active, setActive] = useState<ActiveCell | null>(null);
  const data = radar.data;
  const model = useMemo(() => {
    if (!data) return null;
    const companies = [...new Set(data.landscape.map((c) => c.company))];
    const capabilities = (Object.keys(BRAIN_CAPABILITY_LABELS) as BrainCapability[]).filter((cap) =>
      data.landscape.some((c) => c.capability === cap),
    );
    const signals = new Map(data.signals.map((s) => [s.id, s]));
    return { companies, capabilities, signals };
  }, [data]);
  if (!data || !model) return <SlideLoading />;
  const { companies, capabilities, signals } = model;

  const handleOpen = (
    capability: BrainCapability,
    company: string,
    rowIndex: number,
    colIndex: number,
  ): void => {
    const cell = data.landscape.find((c) => c.capability === capability && c.company === company);
    const list = (cell?.signalIds ?? [])
      .map((id) => signals.get(id))
      .filter((s): s is BrainSignal => !!s)
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 3);
    if (!list.length) {
      setActive(null);
      return;
    }
    setActive({ capability, company, signals: list, rowIndex, colIndex });
  };

  return (
    <Glass className="relative h-full px-8 py-6">
      <div
        role="grid"
        aria-label="Signals by capability and competitor"
        className="grid h-full gap-2"
        style={{
          gridTemplateColumns: `200px repeat(${companies.length}, minmax(0, 1fr))`,
          gridTemplateRows: `auto repeat(${capabilities.length}, minmax(0, 1fr))`,
        }}
        onMouseLeave={() => setActive(null)}
      >
        <div role="row" className="contents">
          <div role="columnheader" />
          {companies.map((c) => (
            <div
              role="columnheader"
              key={c}
              className="flex items-center justify-center gap-2 pb-1 text-[15px] font-semibold text-neutral-700"
            >
              <CompanyDot company={c} className="h-2 w-2" />
              <span className="truncate">{c}</span>
            </div>
          ))}
        </div>
        {capabilities.map((cap, rowIndex) => (
          <div role="row" key={cap} className="contents">
            <div
              role="rowheader"
              className={cn(
                'flex items-center text-[16px] font-medium text-neutral-600',
                cap === highlight && 'font-semibold text-indigo-700',
              )}
            >
              {cap === highlight ? (
                <span className="-ml-3 rounded-full bg-indigo-500/10 px-3 py-1 ring-1 ring-indigo-500/25">
                  {BRAIN_CAPABILITY_LABELS[cap]}
                </span>
              ) : (
                BRAIN_CAPABILITY_LABELS[cap]
              )}
            </div>
            {companies.map((company, colIndex) => {
              const cell = data.landscape.find(
                (c) => c.capability === cap && c.company === company,
              );
              const count = cell?.signalIds.length ?? 0;
              const strength = Math.min(3, cell?.strength ?? 0);
              const isOpen = active?.capability === cap && active.company === company;
              return (
                <button
                  key={company}
                  type="button"
                  role="gridcell"
                  aria-label={`${company}, ${BRAIN_CAPABILITY_LABELS[cap]}: ${count} signals`}
                  onMouseEnter={() => handleOpen(cap, company, rowIndex, colIndex)}
                  onFocus={() => handleOpen(cap, company, rowIndex, colIndex)}
                  onClick={() => handleOpen(cap, company, rowIndex, colIndex)}
                  className={cn(
                    'flex items-center justify-center rounded-2xl text-[20px] font-semibold tabular-nums outline-none transition duration-200 hover:scale-[1.04] focus-visible:ring-2 focus-visible:ring-indigo-400',
                    CELL[strength],
                    cap === highlight &&
                      count > 0 &&
                      'ring-2 ring-indigo-400/50 ring-offset-2 ring-offset-white/60',
                    isOpen && 'scale-[1.06] ring-2 ring-white',
                  )}
                >
                  {count || '·'}
                </button>
              );
            })}
          </div>
        ))}
      </div>
      {active ? (
        <CellPopover cell={active} rows={capabilities.length} cols={companies.length} />
      ) : null}
    </Glass>
  );
};

const CellPopover = ({ cell, rows, cols }: { cell: ActiveCell; rows: number; cols: number }) => {
  // Flip to the left/top half so the popover never leaves the card.
  const isRight = cell.colIndex >= cols / 2;
  const isBottom = cell.rowIndex >= rows / 2;
  const left = `calc(232px + (100% - 264px) * ${(cell.colIndex + (isRight ? 0 : 1)) / cols})`;
  const top = `calc(56px + (100% - 80px) * ${(cell.rowIndex + (isBottom ? 0 : 1)) / rows})`;
  return (
    <div
      role="status"
      className="pointer-events-none absolute z-10 w-[380px] animate-in fade-in zoom-in-95 duration-200"
      style={{
        left,
        top,
        transform: `translate(${isRight ? '-100%' : '0'}, ${isBottom ? '-100%' : '0'})`,
      }}
    >
      <div className="m-2 rounded-2xl border border-black/[0.06] bg-white/95 p-4 shadow-[0_24px_48px_-16px_rgba(15,23,42,0.35)] backdrop-blur-xl">
        <div className="mb-2 flex items-center gap-2 text-[13px] font-semibold uppercase tracking-[0.12em] text-neutral-400">
          <CompanyDot company={cell.company} className="h-2 w-2" />
          {cell.company} · {BRAIN_CAPABILITY_LABELS[cell.capability]}
        </div>
        <ul className="space-y-2">
          {cell.signals.map((s) => (
            <li key={s.id} className="flex items-baseline justify-between gap-3">
              <span className="line-clamp-2 text-[15px] font-medium leading-snug text-neutral-800">
                {s.title}
              </span>
              <span className="shrink-0 text-[13px] tabular-nums text-neutral-400">
                {formatDate(s.date)}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

/** The pattern behind our top gap (fallback: the widest one) and every tracked company. */
export const pickConvergence = (
  data: RadarResult,
): { pattern: IndustryPattern; all: string[] } | null => {
  // Lead with the capability behind our top gap; fall back to the widest pattern.
  const focusCap = data.gaps[0]?.capability;
  const pattern =
    data.patterns.find((p) => p.capability === focusCap) ??
    [...data.patterns].sort((a, b) => b.companies.length - a.companies.length)[0];
  if (!pattern) return null;
  return { pattern, all: [...new Set(data.landscape.map((c) => c.company))] };
};

export const ConvergenceSlide = () => {
  const { radar } = useDemo();
  const data = radar.data;
  if (!data) return <SlideLoading />;
  const picked = pickConvergence(data);
  if (!picked) return <SlideLoading label="No patterns yet" />;
  const { pattern, all } = picked;
  const capLabel = BRAIN_CAPABILITY_LABELS[pattern.capability];

  return (
    <SlideFrame
      title={
        <>
          <span className="demo-gradient-text">
            {pattern.companies.length} of {all.length}
          </span>{' '}
          are converging on {capLabel.toLowerCase()}.
        </>
      }
    >
      <div className="flex h-full flex-col">
        <ConvergenceRing pattern={pattern} all={all} className="max-w-[1000px] flex-1" />
        <Rise delay={900}>
          <p className="mx-auto mt-4 max-w-[1000px] text-center text-[20px] leading-snug text-neutral-500">
            {leadSentence(pattern.summary, 120)}
          </p>
        </Rise>
      </div>
    </SlideFrame>
  );
};

/** Radial diagram: converging companies flow into the capability at the centre. */
export const ConvergenceRing = ({
  pattern,
  all,
  className,
}: {
  pattern: IndustryPattern;
  all: string[];
  className?: string;
}) => {
  const converging = new Set(pattern.companies);
  const capLabel = BRAIN_CAPABILITY_LABELS[pattern.capability];
  // Converging companies first so they sit across the top of the ring.
  const ordered = [
    ...all.filter((c) => converging.has(c)),
    ...all.filter((c) => !converging.has(c)),
  ];
  const cx = 50;
  const cy = 50;
  const points = ordered.map((company, i) => {
    // Centre the converging group on the top of the ring.
    const angle = -Math.PI / 2 + (i - (converging.size - 1) / 2) * ((Math.PI * 2) / ordered.length);
    return {
      company,
      x: cx + Math.cos(angle) * 40,
      y: cy + Math.sin(angle) * 40,
      isIn: converging.has(company),
    };
  });

  return (
    <div className={cn('relative mx-auto min-h-0 w-full', className)}>
      <svg
        aria-hidden
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <ellipse
          cx={cx}
          cy={cy}
          rx={40}
          ry={40}
          fill="none"
          stroke="#6366f1"
          strokeOpacity={0.08}
          strokeWidth={1}
          vectorEffect="non-scaling-stroke"
        />
        {points.map((p, i) =>
          p.isIn ? (
            <g key={p.company}>
              <line
                x1={p.x}
                y1={p.y}
                x2={cx}
                y2={cy}
                className="demo-fade"
                style={{ '--d': `${300 + i * 140}ms` } as CSSProperties}
                stroke={companyColor(p.company)}
                strokeOpacity={0.35}
                strokeWidth={2}
                vectorEffect="non-scaling-stroke"
              />
              <line
                x1={p.x}
                y1={p.y}
                x2={cx}
                y2={cy}
                className="demo-flow"
                stroke={companyColor(p.company)}
                strokeWidth={2.5}
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
              />
            </g>
          ) : null,
        )}
      </svg>
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="demo-glow flex h-[176px] w-[176px] flex-col items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 via-violet-500 to-pink-500 px-4 text-center text-white">
          <span className="text-[24px] font-semibold leading-tight tracking-[-0.02em]">
            {capLabel}
          </span>
        </div>
      </div>
      {points.map((p, i) => (
        <div
          key={p.company}
          className="absolute -translate-x-1/2 -translate-y-1/2"
          style={{ left: `${p.x}%`, top: `${p.y}%` }}
        >
          <Rise delay={200 + i * 110}>
            <span
              className={cn(
                'flex items-center gap-2.5 whitespace-nowrap rounded-full border px-5 py-2.5 text-[19px] font-semibold shadow-[0_8px_24px_-12px_rgba(15,23,42,0.3)]',
                p.isIn
                  ? 'border-black/[0.05] bg-white text-neutral-800'
                  : 'border-dashed border-black/10 bg-white/40 text-neutral-400 shadow-none',
              )}
            >
              <CompanyDot company={p.company} className={cn(!p.isIn && 'opacity-30')} />
              {p.company}
            </span>
          </Rise>
        </div>
      ))}
    </div>
  );
};

/** First sentence when it fits, otherwise a word-boundary cut. */
const leadSentence = (text: string, max: number): string => {
  const first = text.match(/^.+?[.!?](?=\s|$)/)?.[0];
  return first && first.length <= max ? first : truncate(text, max);
};

const GENERIC = new Set([
  'agent',
  'agents',
  'with',
  'from',
  'into',
  'will',
  'that',
  'this',
  'their',
  'more',
  'makes',
  'make',
  'becomes',
  'pushes',
  'introducing',
  'ships',
  'new',
]);

const tokens = (text: string): Set<string> =>
  new Set(
    text
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((w) => w.length > 3 && !GENERIC.has(w)),
  );

/** Best-matching (prediction, reveal) pair per company, strongest matches first. */
export const pairPredictions = (
  moves: CompetitorMove[],
  reveals: TimeMachineReveal[],
  limit: number,
) => {
  const best = new Map<
    string,
    { move: CompetitorMove; reveal: TimeMachineReveal; score: number }
  >();
  for (const move of moves) {
    const words = tokens(`${move.headline} ${move.prediction}`);
    for (const reveal of reveals.filter((r) => r.company === move.company)) {
      const score = [...tokens(`${reveal.announcement} ${reveal.why}`)].filter((w) =>
        words.has(w),
      ).length;
      const current = best.get(move.company);
      if (!current || score > current.score) best.set(move.company, { move, reveal, score });
    }
  }
  return [...best.values()].sort((a, b) => b.score - a.score).slice(0, limit);
};

export const TimeMachineSlide = () => {
  const { timeMachine } = useDemo();
  const data = timeMachine.data;
  if (!data) return <SlideLoading label="Rewinding to August…" />;
  const pairs = pairPredictions(data.radar.moves, data.reveals, 4);
  const cutoff = formatDate(data.cutoff);
  return (
    <SlideFrame
      title="It called it."
      aside={
        <span className="mb-2 rounded-full bg-indigo-500/10 px-4 py-2 text-[16px] font-semibold text-indigo-700">
          Only data before {cutoff}
        </span>
      }
    >
      <div className="grid h-full grid-cols-[1fr_96px_1fr] grid-rows-[auto_repeat(4,minmax(0,1fr))] gap-x-0 gap-y-4">
        <Rise className="flex items-center gap-2 text-[15px] font-semibold uppercase tracking-[0.16em] text-indigo-500">
          Predicted · before {cutoff}
        </Rise>
        <div />
        <Rise className="flex items-center gap-2 text-[15px] font-semibold uppercase tracking-[0.16em] text-emerald-600">
          What shipped
        </Rise>
        {pairs.map(({ move, reveal }, i) => (
          <div key={move.id} className="contents">
            <Rise delay={150 + i * 160} className="min-h-0">
              <Glass className="flex h-full flex-col justify-center px-6 py-4">
                <div className="mb-1.5 flex items-center gap-2 text-[15px] font-semibold text-neutral-500">
                  <CompanyDot company={move.company} />
                  {move.company}
                </div>
                <div className="line-clamp-2 text-[21px] font-semibold leading-snug tracking-[-0.01em] text-neutral-900">
                  {move.headline}
                </div>
              </Glass>
            </Rise>
            <div className="relative flex items-center justify-center">
              <svg
                aria-hidden
                className="absolute inset-0 h-full w-full"
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
              >
                <line
                  x1={0}
                  y1={50}
                  x2={100}
                  y2={50}
                  className="demo-fade"
                  style={{ '--d': `${500 + i * 160}ms` } as CSSProperties}
                  stroke="#10b981"
                  strokeOpacity={0.45}
                  strokeWidth={2}
                  vectorEffect="non-scaling-stroke"
                />
              </svg>
              <Rise delay={700 + i * 160}>
                <span className="relative flex h-11 w-11 items-center justify-center rounded-full bg-emerald-500 text-white shadow-[0_8px_20px_-6px_rgba(16,185,129,0.7)]">
                  <Check className="h-6 w-6" strokeWidth={3} aria-label="Matched" />
                </span>
              </Rise>
            </div>
            <Rise delay={400 + i * 160} className="min-h-0">
              <Glass className="flex h-full flex-col justify-center border-emerald-500/15 bg-emerald-50/40 px-6 py-4">
                <div className="mb-1.5 flex items-center justify-between gap-2 text-[15px] font-semibold text-neutral-500">
                  <span className="flex items-center gap-2">
                    <CompanyDot company={reveal.company} />
                    {reveal.company}
                  </span>
                  <span className="tabular-nums text-emerald-700">{formatDate(reveal.date)}</span>
                </div>
                <div className="line-clamp-2 text-[21px] font-semibold leading-snug tracking-[-0.01em] text-neutral-900">
                  {reveal.announcement}
                </div>
              </Glass>
            </Rise>
          </div>
        ))}
      </div>
    </SlideFrame>
  );
};
