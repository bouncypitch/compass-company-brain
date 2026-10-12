'use client';

import { useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

/** Props every slide receives from the deck. */
export interface SlideProps {
  isActive: boolean;
}

export const Glass = ({
  children,
  className,
  style,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) => (
  <div
    style={style}
    className={cn(
      'rounded-3xl border border-black/[0.05] bg-white/70 shadow-[0_1px_2px_rgba(0,0,0,0.03),0_24px_60px_-30px_rgba(15,23,42,0.22)] backdrop-blur-xl',
      className,
    )}
  >
    {children}
  </div>
);

/** Staggered entrance; `delay` in ms. Animates each time the slide becomes active. */
export const Rise = ({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) => (
  <div className={cn('demo-rise', className)} style={{ '--d': `${delay}ms` } as CSSProperties}>
    {children}
  </div>
);

interface SlideFrameProps {
  eyebrow?: string;
  title: ReactNode;
  children?: ReactNode;
  className?: string;
  /** Extra content aligned to the right of the headline. */
  aside?: ReactNode;
}

/** Standard slide: short headline on top, one big visual filling the rest. */
export const SlideFrame = ({ eyebrow, title, children, className, aside }: SlideFrameProps) => (
  <div className={cn('flex h-full w-full flex-col px-20 pb-20 pt-[72px]', className)}>
    <Rise className="flex items-end justify-between gap-8">
      <div>
        {eyebrow ? (
          <p className="mb-2 text-[15px] font-semibold uppercase tracking-[0.18em] text-indigo-500/80">
            {eyebrow}
          </p>
        ) : null}
        <h2 className="text-[52px] font-semibold leading-[1.05] tracking-[-0.035em] text-neutral-950">
          {title}
        </h2>
      </div>
      {aside}
    </Rise>
    <div className="relative mt-8 min-h-0 flex-1">{children}</div>
  </div>
);

export const SlideLoading = ({ label = 'Loading the brain…' }: { label?: string }) => (
  <div className="flex h-full items-center justify-center gap-3 text-[18px] text-neutral-400">
    <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
    {label}
  </div>
);

const prefersReducedMotion = (): boolean =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Counts from 0 to `target` each time the slide becomes active. */
export const CountUp = ({
  target,
  isActive,
  duration = 1400,
  className,
}: {
  target: number;
  isActive: boolean;
  duration?: number;
  className?: string;
}) => {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!isActive) {
      setValue(0);
      return;
    }
    if (prefersReducedMotion()) {
      setValue(target);
      return;
    }
    let frame = 0;
    const start = performance.now();
    const tick = (now: number): void => {
      const t = Math.min(1, (now - start) / duration);
      setValue(Math.round(target * (1 - Math.pow(1 - t, 3))));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, isActive, duration]);
  return <span className={cn('tabular-nums', className)}>{value.toLocaleString('en-US')}</span>;
};

/** Stable accent per competitor so a company keeps its color across slides. */
const COMPANY_PALETTE = [
  '#6366f1',
  '#ec4899',
  '#14b8a6',
  '#f59e0b',
  '#8b5cf6',
  '#0ea5e9',
  '#f43f5e',
  '#10b981',
];
const KNOWN_COMPANY_COLOR: Record<string, string> = {
  'GitHub Copilot': '#6366f1',
  Cursor: '#0f172a',
  Replit: '#f97316',
  'OpenAI Codex': '#10b981',
  Amazon: '#f59e0b',
  Google: '#0ea5e9',
  Cognition: '#ec4899',
};
export const companyColor = (company: string): string => {
  if (KNOWN_COMPANY_COLOR[company]) return KNOWN_COMPANY_COLOR[company];
  let hash = 0;
  for (const ch of company) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return COMPANY_PALETTE[hash % COMPANY_PALETTE.length];
};

export const CompanyDot = ({ company, className }: { company: string; className?: string }) => (
  <span
    aria-hidden
    className={cn('inline-block h-2.5 w-2.5 shrink-0 rounded-full', className)}
    style={{ background: companyColor(company) }}
  />
);

/** Cuts text at a word boundary so it never wraps past its slot. */
export const truncate = (text: string, max: number): string => {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  return `${cut.slice(0, Math.max(cut.lastIndexOf(' '), max - 12)).replace(/[,;:.\s—-]+$/, '')}…`;
};

export const formatDate = (iso: string): string => {
  const d = new Date(iso.length === 10 ? `${iso}T00:00:00` : iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};
