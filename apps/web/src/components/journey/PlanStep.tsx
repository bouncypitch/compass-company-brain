'use client';

import { FileText, Flag, Presentation, Rocket, Trophy, Users, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDemo } from '@/components/demo/DemoContext';
import { Glass, Rise, SlideLoading, truncate } from '@/components/demo/primitives';
import { shortMilestone, shortWindow } from '@/components/demo/CompassSlides';
import { StepFrame } from './StepFrame';

const ICONS: LucideIcon[] = [FileText, Presentation, Users, Rocket, Flag, Trophy];

/** "Days 5–9 (by 10/21 roadmap sync)" → "by 10/21 roadmap sync". */
const windowNote = (window: string): string => window.match(/\((.*)\)/)?.[1] ?? '';

/** "Own R-14 Agent Memory end-to-end: write the RFC…" → "Own R-14 Agent Memory end-to-end". */
const shortTitle = (title: string): string => truncate(title.split(/[:;]/)[0], 60);

/** Non-breaking hyphens so "1-pager" or "R-14" never split across lines. */
const keepHyphens = (text: string): string => text.replace(/(\w)-(\w)/g, '$1\u2011$2');

export const PlanStep = () => {
  const { compass } = useDemo();
  const data = compass.data;
  if (!data?.plan90.length) return <SlideLoading />;
  const beats = data.plan90.slice(0, 6);
  const top = data.opportunities[0];
  const cols = beats.length;

  return (
    <StepFrame
      eyebrow="06 · Your 90 days"
      title={
        <>
          Your <span className="demo-gradient-text">90 days.</span>
        </>
      }
      aside={
        top ? (
          <span className="mb-1 flex max-w-[620px] items-center gap-3 rounded-full bg-white/80 py-2 pl-2 pr-5 shadow-[0_8px_24px_-14px_rgba(15,23,42,0.35)]">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-neutral-950 text-[14px] font-semibold text-white">
              #1
            </span>
            <span className="truncate text-[17px] font-semibold tracking-[-0.01em] text-neutral-900">
              {shortTitle(top.title)}
            </span>
          </span>
        ) : null
      }
    >
      <div className="flex h-full flex-col justify-center">
        <ol
          className="relative grid gap-4"
          style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
        >
          <li
            aria-hidden
            className="absolute top-[86px] h-[3px] -translate-y-1/2 rounded-full bg-gradient-to-r from-indigo-400 via-violet-400 to-pink-400 opacity-60"
            style={{ left: `${50 / cols}%`, right: `${50 / cols}%` }}
          />
          {beats.map((beat, i) => {
            const Icon = ICONS[i] ?? Rocket;
            const isLast = i === beats.length - 1;
            return (
              <li key={beat.window}>
                <Rise delay={150 + i * 140} className="flex flex-col items-center text-center">
                  <span className="text-[14px] font-semibold uppercase tracking-[0.14em] text-indigo-500">
                    {shortWindow(beat.window)}
                  </span>
                  <span className="mt-1 h-5 truncate text-[13px] text-neutral-400">
                    {windowNote(beat.window)}
                  </span>
                  <span
                    className={cn(
                      'mt-3 flex h-16 w-16 items-center justify-center rounded-full border-4 border-white text-white shadow-[0_14px_30px_-12px_rgba(99,102,241,0.7)]',
                      isLast
                        ? 'bg-gradient-to-br from-pink-500 to-orange-400'
                        : 'bg-gradient-to-br from-indigo-500 to-violet-500',
                    )}
                  >
                    <Icon className="h-7 w-7" strokeWidth={1.8} aria-hidden />
                  </span>
                  <Glass className="mt-5 flex min-h-[200px] w-full items-center px-5 py-5">
                    <p className="w-full text-[19px] font-semibold leading-snug tracking-[-0.015em] text-neutral-800">
                      {keepHyphens(shortMilestone(beat.milestone))}
                    </p>
                  </Glass>
                </Rise>
              </li>
            );
          })}
        </ol>
        <Rise delay={1100} className="mt-10 flex justify-center">
          <span className="rounded-full bg-gradient-to-r from-indigo-500/10 to-pink-500/10 px-5 py-2 text-[16px] font-semibold text-indigo-700">
            Ends with your promo packet for {data.targetLevel.split(/\s[—-]\s/)[0]}
          </span>
        </Rise>
      </div>
    </StepFrame>
  );
};
