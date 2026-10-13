'use client';

import { FileText, Rocket, Trophy, Users, type LucideIcon } from 'lucide-react';
import type { LevelGap } from '@app-starter/shared';
import { cn } from '@/lib/utils';
import { useDemo } from './DemoContext';
import { Glass, Rise, SlideFrame, SlideLoading, truncate } from './primitives';

export const STATUS_TONE: Record<LevelGap['status'], string> = {
  met: 'bg-emerald-500/10 text-emerald-700',
  partial: 'bg-amber-500/10 text-amber-700',
  gap: 'bg-rose-500/10 text-rose-700',
};
export const STATUS_DOT: Record<LevelGap['status'], string> = {
  met: 'bg-emerald-500',
  partial: 'bg-amber-500',
  gap: 'bg-rose-500',
};

export const initials = (name: string): string =>
  name
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

/** Splits off the first sentence so it can lead in large type. */
const splitFirstSentence = (text: string): [string, string] => {
  const match = text.match(/^(.+?[.!?])\s+(.*)$/s);
  return match ? [match[1], match[2]] : [text, ''];
};

/** "L5 — Staff Engineer (H1 2027 cycle)" → "L5". */
export const levelCode = (level: string): string => level.split(/\s|—/)[0];

export const CompassSlide = () => {
  const { compass } = useDemo();
  const data = compass.data;
  if (!data) return <SlideLoading label="Asking Compass about Jordan…" />;
  const [lead, rest] = splitFirstSentence(data.headline);
  const top = data.opportunities[0];
  // Gaps first: those are what the promotion case has to close.
  const order: LevelGap['status'][] = ['gap', 'partial', 'met'];
  const gaps = [...data.levelGaps]
    .sort((a, b) => order.indexOf(a.status) - order.indexOf(b.status))
    .slice(0, 3);
  return (
    <SlideFrame
      title={
        <>
          Every engineer gets a <span className="demo-gradient-text">compass</span>.
        </>
      }
    >
      <div className="grid h-full grid-cols-[360px_minmax(0,1fr)] gap-6">
        <Rise delay={120} className="min-h-0">
          <Glass className="flex h-full flex-col items-center justify-center gap-6 p-8 text-center">
            <div className="flex h-36 w-36 items-center justify-center rounded-full bg-gradient-to-br from-orange-300 via-pink-400 to-violet-500 text-[52px] font-semibold tracking-[-0.03em] text-white shadow-[0_24px_50px_-18px_rgba(236,72,153,0.7)]">
              {initials(data.employee.name)}
            </div>
            <div>
              <div className="text-[30px] font-semibold tracking-[-0.02em] text-neutral-950">
                {data.employee.name}
              </div>
              <div className="mt-1 text-[17px] text-neutral-500">{data.employee.team}</div>
            </div>
            <div className="flex items-center gap-4 text-[56px] font-semibold leading-none tracking-[-0.04em]">
              <span className="text-neutral-400">{levelCode(data.employee.level)}</span>
              <span className="text-neutral-300">→</span>
              <span className="demo-gradient-text">{levelCode(data.targetLevel)}</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              {gaps.map((g) => (
                <span
                  key={g.dimension}
                  className={cn(
                    'flex items-center gap-2 rounded-full px-4 py-1.5 text-[15px] font-semibold',
                    STATUS_TONE[g.status],
                  )}
                >
                  <span className={cn('h-2 w-2 rounded-full', STATUS_DOT[g.status])} aria-hidden />
                  {g.dimension}
                  <span className="font-medium opacity-70">· {g.status}</span>
                </span>
              ))}
            </div>
          </Glass>
        </Rise>
        <div className="flex min-h-0 flex-col gap-6">
          <Rise delay={240} className="min-h-0 flex-1">
            <Glass className="flex h-full flex-col justify-center px-12 py-10">
              <p className="text-[38px] font-semibold leading-[1.15] tracking-[-0.03em] text-neutral-950">
                {lead}
              </p>
              {rest ? (
                <p className="mt-5 line-clamp-4 text-[21px] leading-[1.45] text-neutral-500">
                  {rest}
                </p>
              ) : null}
            </Glass>
          </Rise>
          {top ? (
            <Rise delay={380}>
              <Glass className="flex items-center gap-6 bg-gradient-to-r from-indigo-50/80 to-white/70 px-8 py-6">
                <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-neutral-950 text-[26px] font-semibold text-white">
                  #1
                </span>
                <div className="min-w-0">
                  <div className="text-[13px] font-semibold uppercase tracking-[0.16em] text-indigo-500">
                    Top opportunity
                  </div>
                  <div className="mt-1 line-clamp-2 text-[22px] font-semibold leading-snug tracking-[-0.01em] text-neutral-900">
                    {top.title}
                  </div>
                </div>
              </Glass>
            </Rise>
          ) : null}
        </div>
      </div>
    </SlideFrame>
  );
};

const MILESTONE_ICONS: LucideIcon[] = [FileText, Users, Rocket, Trophy];

/** "Week 2 (by 10/21 roadmap review)" → "Week 2". */
export const shortWindow = (window: string): string => window.replace(/\s*\(.*\)\s*$/, '');

/** First clause of a milestone, kept to a glanceable length. */
export const shortMilestone = (milestone: string): string => {
  const sentence = milestone.split(/(?<=\.)\s/)[0].replace(/\.$/, '');
  // Prefer a natural clause break (colon, dash, bracket) over a mid-phrase cut.
  const clause = sentence
    .split(/\s[—–-]\s|[:(;]/)[0]
    .replace(/['"‘’“”]/g, '')
    .trim();
  return truncate(clause.length >= 18 ? clause : sentence, 64);
};

export const PlanSlide = () => {
  const { compass } = useDemo();
  const plan = compass.data?.plan90;
  if (!plan?.length) return <SlideLoading />;
  // Keep the timeline to four beats: the first three windows plus the finish.
  const beats = plan.length > 4 ? [...plan.slice(0, 3), plan[plan.length - 1]] : plan;
  return (
    <SlideFrame
      title={
        <>
          90 days to <span className="demo-gradient-text">Staff</span>.
        </>
      }
    >
      <div className="relative flex h-full flex-col justify-center">
        <ol className="relative grid grid-cols-4 gap-6">
          <li
            aria-hidden
            className="absolute left-[12.5%] right-[12.5%] top-[76px] h-[3px] -translate-y-1/2 rounded-full bg-gradient-to-r from-indigo-400 via-violet-400 to-pink-400 opacity-60"
          />
          {beats.map((beat, i) => {
            const Icon = MILESTONE_ICONS[i] ?? Rocket;
            return (
              <li key={beat.window}>
                <Rise delay={150 + i * 180} className="flex flex-col items-center text-center">
                  <span className="mb-3 text-[15px] font-semibold uppercase tracking-[0.16em] text-indigo-500">
                    {shortWindow(beat.window)}
                  </span>
                  <span
                    className={cn(
                      'flex h-20 w-20 items-center justify-center rounded-full border-4 border-white text-white shadow-[0_16px_36px_-14px_rgba(99,102,241,0.7)]',
                      i === beats.length - 1
                        ? 'bg-gradient-to-br from-pink-500 to-orange-400'
                        : 'bg-gradient-to-br from-indigo-500 to-violet-500',
                    )}
                  >
                    <Icon className="h-9 w-9" strokeWidth={1.7} aria-hidden />
                  </span>
                  <Glass className="mt-6 flex min-h-[170px] w-full items-center px-6 py-5">
                    <p className="w-full text-[22px] font-semibold leading-snug tracking-[-0.015em] text-neutral-800">
                      {shortMilestone(beat.milestone)}
                    </p>
                  </Glass>
                </Rise>
              </li>
            );
          })}
        </ol>
      </div>
    </SlideFrame>
  );
};
