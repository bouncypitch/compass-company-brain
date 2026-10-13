'use client';

import { Check } from 'lucide-react';
import {
  BRAIN_CAPABILITY_LABELS,
  type CompetitorMove,
  type TimeMachineReveal,
} from '@app-starter/shared';
import { useDemo } from '@/components/demo/DemoContext';
import {
  CompanyDot,
  CountUp,
  Glass,
  Rise,
  SlideLoading,
  formatDate,
} from '@/components/demo/primitives';
import {
  ConvergenceRing,
  LandscapeHeatmap,
  pairPredictions,
  pickConvergence,
} from '@/components/demo/RadarSlides';
import { StepFrame } from './StepFrame';

const Stat = ({ value, label }: { value: number; label: string }) => (
  <div className="flex flex-col items-center px-6">
    <CountUp
      target={value}
      isActive
      className="text-[30px] font-semibold leading-none tracking-[-0.03em] text-neutral-950"
    />
    <span className="mt-1 text-[12px] font-medium uppercase tracking-[0.12em] text-neutral-400">
      {label}
    </span>
  </div>
);

export const MarketStep = () => {
  const { radar } = useDemo();
  const data = radar.data;
  if (!data) return <SlideLoading label="Scanning the market…" />;
  const competitors = new Set(data.landscape.map((c) => c.company)).size;
  const focus = data.gaps[0]?.capability ?? 'codebase_memory';
  return (
    <StepFrame
      eyebrow="02 · Why now"
      title={
        <>
          Why now: <span className="demo-gradient-text">the market moved.</span>
        </>
      }
      aside={
        <Glass className="flex shrink-0 items-center divide-x divide-black/[0.06] bg-white/85 py-3">
          <Stat value={data.signals.length} label="signals" />
          <Stat value={competitors} label="competitors" />
          <Stat value={data.moves.length} label="predicted moves" />
        </Glass>
      }
    >
      <Rise delay={120} className="h-full">
        <LandscapeHeatmap highlight={focus} />
      </Rise>
    </StepFrame>
  );
};

const isMemoryNews = (text: string): boolean => /memor|persistent|context/i.test(text);

/** Predicted→shipped pairs, memory launches first since that is the convergence on screen. */
const calledIt = (moves: CompetitorMove[], reveals: TimeMachineReveal[], companies: string[]) => {
  const inPattern = moves.filter((m) => companies.includes(m.company));
  const memory = pairPredictions(
    inPattern,
    reveals.filter((r) => isMemoryNews(`${r.announcement} ${r.why}`)),
    3,
  );
  const rest = pairPredictions(inPattern, reveals, 3).filter(
    (p) => !memory.some((m) => m.move.company === p.move.company),
  );
  return [...memory, ...rest].slice(0, 3);
};

export const ConvergeStep = () => {
  const { radar, timeMachine } = useDemo();
  const data = radar.data;
  if (!data) return <SlideLoading />;
  const picked = pickConvergence(data);
  if (!picked) return <SlideLoading label="No patterns yet" />;
  const { pattern, all } = picked;
  const tm = timeMachine.data;
  const pairs = tm ? calledIt(tm.radar.moves, tm.reveals, pattern.companies) : [];
  return (
    <StepFrame
      eyebrow="03 · The pattern"
      title={
        <>
          <span className="demo-gradient-text">
            {pattern.companies.length} of {all.length}
          </span>{' '}
          are converging on {BRAIN_CAPABILITY_LABELS[pattern.capability].toLowerCase()}.
        </>
      }
    >
      <div className="grid h-full grid-cols-[minmax(0,1fr)_440px] gap-8">
        <ConvergenceRing pattern={pattern} all={all} className="h-full" />
        <div className="flex min-h-0 flex-col gap-3">
          <Rise delay={500} className="flex items-center justify-between">
            <span className="text-[22px] font-semibold tracking-[-0.02em] text-neutral-900">
              It called it.
            </span>
            {tm ? (
              <span className="rounded-full bg-indigo-500/10 px-3 py-1 text-[13px] font-semibold text-indigo-700">
                Only data before {formatDate(tm.cutoff)}
              </span>
            ) : null}
          </Rise>
          {pairs.length ? (
            pairs.map(({ move, reveal }, i) => (
              <Rise key={move.id} delay={650 + i * 160} className="min-h-0 flex-1">
                <Glass className="flex h-full flex-col justify-center gap-3 px-5 py-4">
                  <div className="flex items-center gap-2 text-[13px] font-semibold uppercase tracking-[0.12em] text-neutral-400">
                    <CompanyDot company={move.company} className="h-2 w-2" />
                    {move.company} · predicted
                  </div>
                  <p className="line-clamp-2 text-[17px] font-semibold leading-snug tracking-[-0.01em] text-neutral-900">
                    {move.headline}
                  </p>
                  <div className="flex items-start gap-2.5 rounded-xl bg-emerald-50/80 px-3 py-2">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white">
                      <Check className="h-3 w-3" strokeWidth={3.5} aria-label="Shipped" />
                    </span>
                    <span className="line-clamp-2 text-[14px] font-medium leading-snug text-emerald-900">
                      <span className="font-semibold tabular-nums">{formatDate(reveal.date)}</span>{' '}
                      · {reveal.announcement}
                    </span>
                  </div>
                </Glass>
              </Rise>
            ))
          ) : (
            <SlideLoading label="Rewinding to August…" />
          )}
        </div>
      </div>
    </StepFrame>
  );
};
