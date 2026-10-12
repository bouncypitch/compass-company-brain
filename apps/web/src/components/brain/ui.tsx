import type { CSSProperties, ReactNode } from 'react';
import { cn } from '@/lib/utils';

/** System font stack so the demo renders in SF Pro on Apple hardware. */
export const BRAIN_FONT: CSSProperties = {
  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", Inter, "Helvetica Neue", sans-serif',
};

/** Shared class strings for the pill buttons used across the brain screens. */
export const PRIMARY_PILL =
  'h-10 rounded-full bg-neutral-900 px-5 text-[14px] font-medium text-white shadow-[0_1px_2px_rgba(0,0,0,0.12),0_4px_14px_-4px_rgba(15,23,42,0.35)] hover:bg-neutral-800';
export const SECONDARY_PILL =
  'h-10 rounded-full border border-black/[0.08] bg-white/80 px-5 text-[14px] font-medium text-neutral-800 shadow-[0_1px_2px_rgba(0,0,0,0.04)] backdrop-blur hover:bg-white';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
}

export const GlassCard = ({ children, className }: GlassCardProps) => (
  <div
    className={cn(
      'rounded-3xl border border-black/[0.06] bg-white/70 shadow-[0_1px_2px_rgba(0,0,0,0.03),0_12px_32px_-16px_rgba(15,23,42,0.14)] backdrop-blur-xl',
      className,
    )}
  >
    {children}
  </div>
);

interface SectionHeadingProps {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}

export const SectionHeading = ({ eyebrow, title, description, action, className }: SectionHeadingProps) => (
  <div className={cn('flex flex-wrap items-end justify-between gap-4', className)}>
    <div className="max-w-3xl space-y-1.5">
      {eyebrow ? <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-indigo-500/80">{eyebrow}</p> : null}
      <h2 className="text-[26px] font-semibold leading-tight tracking-[-0.02em] text-neutral-900 md:text-[30px]">{title}</h2>
      {description ? <p className="text-[15px] leading-relaxed text-neutral-500">{description}</p> : null}
    </div>
    {action ? <div className="flex flex-wrap items-center gap-2">{action}</div> : null}
  </div>
);

const PILL_TONE = {
  neutral: 'bg-black/[0.04] text-neutral-600',
  indigo: 'bg-indigo-500/10 text-indigo-700',
  violet: 'bg-violet-500/10 text-violet-700',
  teal: 'bg-teal-500/10 text-teal-700',
  rose: 'bg-rose-500/10 text-rose-700',
  amber: 'bg-amber-500/10 text-amber-700',
  emerald: 'bg-emerald-500/10 text-emerald-700',
  orange: 'bg-orange-500/10 text-orange-700',
} as const;

export type PillTone = keyof typeof PILL_TONE;

interface PillProps {
  children: ReactNode;
  tone?: PillTone;
  className?: string;
}

export const Pill = ({ children, tone = 'neutral', className }: PillProps) => (
  <span className={cn('inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-[12px] font-medium', PILL_TONE[tone], className)}>
    {children}
  </span>
);

interface StatPillProps {
  value: ReactNode;
  label: string;
  className?: string;
}

export const StatPill = ({ value, label, className }: StatPillProps) => (
  <div className={cn('rounded-2xl border border-black/[0.05] bg-white/60 px-4 py-3', className)}>
    <div className="text-[24px] font-semibold leading-none tracking-tight text-neutral-900">{value}</div>
    <div className="mt-1.5 text-[12px] text-neutral-500">{label}</div>
  </div>
);

interface RevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

/** Fades and lifts content in on mount; disabled under prefers-reduced-motion. */
export const Reveal = ({ children, className, delay = 0 }: RevealProps) => (
  <div
    className={cn('animate-in fade-in slide-in-from-bottom-3 fill-mode-both duration-700 ease-out motion-reduce:animate-none', className)}
    style={{ animationDelay: `${delay}ms` }}
  >
    {children}
  </div>
);

interface ConfidenceBarProps {
  value: number;
  className?: string;
}

export const ConfidenceBar = ({ value, className }: ConfidenceBarProps) => {
  const pct = Math.round(value * 100);
  return (
    <div className={cn('flex items-center gap-3 text-[12px] text-neutral-500', className)} role="meter" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={`Confidence ${pct}%`}>
      <span>Confidence</span>
      <div className="h-1 flex-1 overflow-hidden rounded-full bg-black/[0.06]">
        <div className="h-full rounded-full bg-gradient-to-r from-indigo-400 to-violet-500" style={{ width: `${pct}%` }} />
      </div>
      <span className="tabular-nums font-medium text-neutral-700">{pct}%</span>
    </div>
  );
};

/** Formats an ISO date (YYYY-MM-DD) as "Aug 1", falling back to the raw string. */
export const formatShortDate = (iso: string): string => {
  const d = new Date(iso.length === 10 ? `${iso}T00:00:00` : iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};
