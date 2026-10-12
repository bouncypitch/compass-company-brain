'use client';

import type { CSSProperties } from 'react';
import {
  Brain,
  ClipboardCheck,
  Code2,
  Map as MapIcon,
  MessageSquare,
  Swords,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { useDemo } from './DemoContext';
import {
  CompanyDot,
  CountUp,
  Glass,
  Rise,
  SlideFrame,
  SlideLoading,
  type SlideProps,
} from './primitives';

const Orbs = () => (
  <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
    <div className="demo-orb left-[8%] top-[12%] h-[420px] w-[420px] bg-[#c7cdff]" />
    <div
      className="demo-orb right-[6%] top-[22%] h-[380px] w-[380px] bg-[#fbc6e3]"
      style={{ animationDelay: '-6s' }}
    />
    <div
      className="demo-orb bottom-[4%] left-[38%] h-[360px] w-[460px] bg-[#b9f3df]"
      style={{ animationDelay: '-11s' }}
    />
  </div>
);

export const TitleSlide = () => (
  <div className="relative flex h-full w-full flex-col items-center justify-center text-center">
    <Orbs />
    <Rise className="relative">
      <div className="mx-auto mb-10 flex h-24 w-24 items-center justify-center rounded-[30px] bg-gradient-to-br from-indigo-500 via-violet-500 to-pink-500 shadow-[0_24px_60px_-18px_rgba(124,58,237,0.6)]">
        <Brain className="h-12 w-12 text-white" strokeWidth={1.6} aria-hidden />
      </div>
    </Rise>
    <Rise delay={120} className="relative">
      <h1 className="text-[168px] font-semibold leading-[0.9] tracking-[-0.055em] text-neutral-950">
        Compass
      </h1>
    </Rise>
    <Rise delay={260} className="relative mt-8">
      <p className="max-w-[900px] text-[32px] font-medium leading-tight tracking-[-0.015em] text-neutral-500">
        The company brain that turns <span className="demo-gradient-text">market moves</span> into{' '}
        <span className="demo-gradient-text">promotions</span>.
      </p>
    </Rise>
  </div>
);

interface Source {
  label: string;
  icon: LucideIcon;
  color: string;
  /** Final orbit position, in % of the stage. */
  x: number;
  y: number;
  /** Scattered start offset. */
  sx: number;
  sy: number;
  sr: number;
}

const SOURCES: Source[] = [
  {
    label: 'Slack',
    icon: MessageSquare,
    color: '#ec4899',
    x: 22,
    y: 22,
    sx: -260,
    sy: -120,
    sr: -14,
  },
  { label: 'Roadmap', icon: MapIcon, color: '#f59e0b', x: 78, y: 20, sx: 280, sy: -110, sr: 12 },
  { label: 'Code', icon: Code2, color: '#334155', x: 88, y: 58, sx: 300, sy: 60, sr: 18 },
  {
    label: 'Reviews',
    icon: ClipboardCheck,
    color: '#14b8a6',
    x: 70,
    y: 90,
    sx: 240,
    sy: 160,
    sr: -10,
  },
  { label: 'Customers', icon: Users, color: '#0ea5e9', x: 30, y: 90, sx: -220, sy: 170, sr: 14 },
  { label: 'Competitors', icon: Swords, color: '#6366f1', x: 12, y: 58, sx: -300, sy: 50, sr: -16 },
];

export const ProblemSlide = () => (
  <SlideFrame
    title={
      <>
        Your company already has a brain.{' '}
        <span className="text-neutral-400">It&apos;s scattered.</span>
      </>
    }
  >
    <div className="absolute inset-0 mx-auto max-w-[1100px]">
      <svg
        aria-hidden
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        {SOURCES.map((s, i) => (
          <line
            key={s.label}
            x1={s.x}
            y1={s.y}
            x2={50}
            y2={55}
            className="demo-fade"
            style={{ '--d': `${900 + i * 120}ms` } as CSSProperties}
            stroke={s.color}
            strokeOpacity={0.35}
            strokeWidth={1.5}
            vectorEffect="non-scaling-stroke"
          />
        ))}
      </svg>
      <div className="absolute left-1/2 top-[55%] -translate-x-1/2 -translate-y-1/2">
        <div className="demo-glow flex h-[200px] w-[200px] flex-col items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 via-violet-500 to-pink-500 text-white">
          <Brain className="h-16 w-16" strokeWidth={1.4} aria-hidden />
          <span className="mt-2 text-[20px] font-semibold tracking-[-0.01em]">Compass</span>
        </div>
      </div>
      {SOURCES.map((s, i) => (
        <div
          key={s.label}
          className="demo-converge absolute"
          style={
            {
              left: `${s.x}%`,
              top: `${s.y}%`,
              '--sx': `${s.sx}px`,
              '--sy': `${s.sy}px`,
              '--sr': `${s.sr}deg`,
              '--d': `${i * 90}ms`,
            } as CSSProperties
          }
        >
          <div className="demo-float" style={{ '--fd': `${-i * 0.9}s` } as CSSProperties}>
            <Glass className="flex items-center gap-3 rounded-full bg-white/85 py-3 pl-3 pr-6">
              <span
                className="flex h-11 w-11 items-center justify-center rounded-full"
                style={{ background: `${s.color}18`, color: s.color }}
              >
                <s.icon className="h-5 w-5" aria-hidden />
              </span>
              <span className="text-[21px] font-semibold tracking-[-0.01em] text-neutral-800">
                {s.label}
              </span>
            </Glass>
          </div>
        </div>
      ))}
    </div>
  </SlideFrame>
);

export const MarketSlide = ({ isActive }: SlideProps) => {
  const { radar } = useDemo();
  const data = radar.data;
  if (!data) return <SlideLoading />;
  const companies = [...new Set(data.signals.map((s) => s.company))];
  const kinds = new Set(data.signals.map((s) => s.kind)).size;
  const stats = [
    { value: data.signals.length, label: 'public signals' },
    { value: companies.length, label: 'competitors' },
    { value: kinds, label: 'kinds of evidence' },
  ];
  return (
    <SlideFrame title="It reads the whole market.">
      <div className="flex h-full flex-col items-center justify-center gap-16">
        <div className="grid w-full grid-cols-3 gap-8">
          {stats.map((s, i) => (
            <Rise key={s.label} delay={120 + i * 120}>
              <Glass className="flex flex-col items-center py-12">
                <CountUp
                  target={s.value}
                  isActive={isActive}
                  className="demo-gradient-text text-[140px] font-semibold leading-none tracking-[-0.05em]"
                />
                <span className="mt-4 text-[24px] font-medium text-neutral-500">{s.label}</span>
              </Glass>
            </Rise>
          ))}
        </div>
        <Rise delay={520} className="flex flex-wrap justify-center gap-3">
          {companies.map((c) => (
            <span
              key={c}
              className="flex items-center gap-2.5 rounded-full border border-black/[0.05] bg-white/80 px-5 py-2.5 text-[19px] font-medium text-neutral-700 shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
            >
              <CompanyDot company={c} />
              {c}
            </span>
          ))}
        </Rise>
      </div>
    </SlideFrame>
  );
};

export const CloseSlide = () => (
  <div className="relative flex h-full w-full flex-col items-center justify-center px-24 text-center">
    <Orbs />
    <Rise className="relative">
      <p className="max-w-[1180px] text-[64px] font-semibold leading-[1.1] tracking-[-0.04em] text-neutral-950">
        The brain saw the <span className="demo-gradient-text">market move</span>, changed the{' '}
        <span className="demo-gradient-text">roadmap</span>, and told every engineer which part is
        their <span className="demo-gradient-text">promotion</span>.
      </p>
    </Rise>
    <Rise delay={300} className="relative mt-14 flex items-center gap-3">
      {['HydraDB', 'Claude', 'App-Starter'].map((chip) => (
        <span
          key={chip}
          className="rounded-full border border-black/[0.06] bg-white/80 px-6 py-3 text-[20px] font-medium text-neutral-700 shadow-[0_1px_2px_rgba(0,0,0,0.04)] backdrop-blur"
        >
          {chip}
        </span>
      ))}
    </Rise>
  </div>
);
