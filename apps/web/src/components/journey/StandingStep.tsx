'use client';

import { Check, Minus, X, type LucideIcon } from 'lucide-react';
import type { LevelGap } from '@app-starter/shared';
import { cn } from '@/lib/utils';
import { useDemo } from '@/components/demo/DemoContext';
import { Glass, Rise, SlideLoading } from '@/components/demo/primitives';
import { STATUS_DOT, STATUS_TONE, levelCode } from '@/components/demo/CompassSlides';
import { StepFrame, firstLine, youify } from './StepFrame';

const STATUS_ICON: Record<LevelGap['status'], LucideIcon> = { met: Check, partial: Minus, gap: X };
const STATUS_WORD: Record<LevelGap['status'], string> = {
  met: 'Met',
  partial: 'Partial',
  gap: 'Gap',
};
const STATUS_SCORE: Record<LevelGap['status'], number> = { met: 1, partial: 0.5, gap: 0 };

/** "Senior Software Engineer" → "Senior"; "L5 — Staff Engineer" → "Staff". */
const levelWord = (title: string): string =>
  title.replace(/^L\d+\s*[—-]\s*/, '').split(/\s/)[0] ?? title;

const ReadinessRing = ({ value }: { value: number }) => {
  const r = 64;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative h-[168px] w-[168px]">
      <svg viewBox="0 0 160 160" className="h-full w-full -rotate-90" aria-hidden>
        <defs>
          <linearGradient id="journey-ring" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="55%" stopColor="#a855f7" />
            <stop offset="100%" stopColor="#ec4899" />
          </linearGradient>
        </defs>
        <circle
          cx="80"
          cy="80"
          r={r}
          fill="none"
          stroke="#6366f1"
          strokeOpacity={0.1}
          strokeWidth={14}
        />
        <circle
          cx="80"
          cy="80"
          r={r}
          fill="none"
          stroke="url(#journey-ring)"
          strokeWidth={14}
          strokeLinecap="round"
          strokeDasharray={`${c * value} ${c}`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[40px] font-semibold leading-none tracking-[-0.04em] text-neutral-950">
          {Math.round(value * 100)}%
        </span>
        <span className="mt-1 text-[13px] font-semibold uppercase tracking-[0.14em] text-neutral-400">
          ready
        </span>
      </div>
    </div>
  );
};

export const StandingStep = () => {
  const { compass } = useDemo();
  const data = compass.data;
  if (!data) return <SlideLoading label="Reading your reviews…" />;
  const rows = data.levelGaps.slice(0, 5);
  const open = rows.filter((g) => g.status !== 'met').length;
  const readiness = rows.length
    ? rows.reduce((sum, g) => sum + STATUS_SCORE[g.status], 0) / rows.length
    : 0;
  const counts = (['met', 'partial', 'gap'] as const).map((s) => ({
    status: s,
    n: rows.filter((g) => g.status === s).length,
  }));

  return (
    <StepFrame
      eyebrow="01 · Where you stand"
      title={
        <>
          <span className="demo-gradient-text">
            {open} {open === 1 ? 'gap' : 'gaps'}
          </span>{' '}
          to Staff.
        </>
      }
    >
      <div className="grid h-full grid-cols-[380px_minmax(0,1fr)] gap-6">
        <Rise delay={120} className="min-h-0">
          <Glass className="flex h-full flex-col items-center justify-center gap-7 p-8">
            <div className="flex items-end gap-5">
              <div className="flex flex-col items-center">
                <span className="text-[64px] font-semibold leading-none tracking-[-0.05em] text-neutral-300">
                  {levelCode(data.employee.level)}
                </span>
                <span className="mt-2 text-[14px] font-medium text-neutral-400">
                  {levelWord(data.employee.title)}
                </span>
              </div>
              <span className="pb-9 text-[36px] text-neutral-300" aria-hidden>
                →
              </span>
              <div className="flex flex-col items-center">
                <span className="demo-gradient-text text-[64px] font-semibold leading-none tracking-[-0.05em]">
                  {levelCode(data.targetLevel)}
                </span>
                <span className="mt-2 text-[14px] font-medium text-neutral-500">
                  {levelWord(data.targetLevel)}
                </span>
              </div>
            </div>
            <ReadinessRing value={readiness} />
            <div className="flex gap-2">
              {counts.map(({ status, n }) => (
                <span
                  key={status}
                  className={cn(
                    'flex items-center gap-1.5 rounded-full px-3 py-1 text-[13px] font-semibold',
                    STATUS_TONE[status],
                  )}
                >
                  <span
                    className={cn('h-1.5 w-1.5 rounded-full', STATUS_DOT[status])}
                    aria-hidden
                  />
                  {n} {STATUS_WORD[status].toLowerCase()}
                </span>
              ))}
            </div>
          </Glass>
        </Rise>
        <Rise delay={220} className="min-h-0">
          <Glass className="flex h-full flex-col divide-y divide-black/[0.05] px-8 py-2">
            {rows.map((g, i) => {
              const Icon = STATUS_ICON[g.status];
              return (
                <Rise
                  key={g.dimension}
                  delay={320 + i * 110}
                  className="flex min-h-0 flex-1 items-center gap-5"
                >
                  <span
                    className={cn(
                      'flex h-11 w-11 shrink-0 items-center justify-center rounded-full',
                      STATUS_TONE[g.status],
                    )}
                  >
                    <Icon className="h-5 w-5" strokeWidth={2.6} aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-[20px] font-semibold tracking-[-0.015em] text-neutral-900">
                      {g.dimension}
                    </div>
                    <div className="mt-0.5 truncate text-[15px] text-neutral-500">
                      {firstLine(youify(g.evidence), 90)}
                    </div>
                  </div>
                  <span
                    className={cn(
                      'shrink-0 rounded-full px-3.5 py-1 text-[14px] font-semibold',
                      STATUS_TONE[g.status],
                    )}
                  >
                    {STATUS_WORD[g.status]}
                  </span>
                </Rise>
              );
            })}
          </Glass>
        </Rise>
      </div>
    </StepFrame>
  );
};
