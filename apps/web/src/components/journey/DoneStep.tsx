'use client';

import { Fragment } from 'react';
import { ChevronRight, Map as MapIcon, Radar, User, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Rise } from '@/components/demo/primitives';
import { CompassMark } from './StepFrame';

const CHAIN: { label: string; Icon: LucideIcon; tone: string }[] = [
  { label: 'Market', Icon: Radar, tone: 'from-sky-400 to-indigo-500' },
  { label: 'Roadmap', Icon: MapIcon, tone: 'from-violet-500 to-fuchsia-500' },
  { label: 'You', Icon: User, tone: 'from-pink-500 to-orange-400' },
];

export const DoneStep = () => (
  <div className="relative flex h-full flex-col items-center justify-center overflow-hidden rounded-[36px] text-center">
    <div aria-hidden className="demo-orb left-[10%] top-[8%] h-72 w-72 bg-indigo-300/60" />
    <div
      aria-hidden
      className="demo-orb bottom-[6%] right-[12%] h-80 w-80 bg-pink-300/50"
      style={{ animationDelay: '-6s' }}
    />
    <Rise className="relative">
      <CompassMark className="mx-auto h-14 w-14 rounded-[18px] [&_svg]:h-7 [&_svg]:w-7" />
    </Rise>
    <Rise delay={120} className="relative mt-8">
      <h2 className="max-w-[1000px] text-[68px] font-semibold leading-[1.04] tracking-[-0.045em] text-neutral-950">
        From a competitor&apos;s launch
        <br />
        to <span className="demo-gradient-text">your promotion.</span>
      </h2>
    </Rise>
    <Rise delay={320} className="relative mt-12">
      <ol className="flex items-center gap-4" aria-label="Market to roadmap to you">
        {CHAIN.map(({ label, Icon, tone }, i) => (
          <Fragment key={label}>
            {i > 0 ? (
              <li aria-hidden>
                <ChevronRight className="h-7 w-7 text-neutral-300" />
              </li>
            ) : null}
            <li className="flex items-center gap-3 rounded-full bg-white/85 py-2 pl-2 pr-6 shadow-[0_12px_30px_-16px_rgba(15,23,42,0.4)]">
              <span
                className={cn(
                  'flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br text-white',
                  tone,
                )}
              >
                <Icon className="h-5 w-5" aria-hidden />
              </span>
              <span className="text-[22px] font-semibold tracking-[-0.02em] text-neutral-900">
                {label}
              </span>
            </li>
          </Fragment>
        ))}
      </ol>
    </Rise>
    <Rise delay={520} className="relative mt-10">
      <p className="text-[18px] font-medium text-neutral-400">Compass · the company brain</p>
    </Rise>
  </div>
);
