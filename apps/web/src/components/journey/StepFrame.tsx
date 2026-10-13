'use client';

import type { ReactNode } from 'react';
import { ArrowDown, Brain } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Rise, truncate } from '@/components/demo/primitives';

export const JORDAN = {
  id: 'jordan-rivera',
  name: 'Jordan Rivera',
  initials: 'JR',
  level: 'L4',
  team: 'Platform Eng',
} as const;

export const QUESTION = 'How do I get promoted to Staff?';

/** Rewrites third-person brain output ("Jordan diagnosed…") into Jordan's own view. */
export const youify = (text: string): string => {
  const out = text
    .replace(/\bJordan has\b/g, 'you have')
    .replace(/\bJordan is\b/g, 'you are')
    .replace(/\bJordan Rivera's\b/g, 'your')
    .replace(/\bJordan's\b/g, 'your')
    .replace(/\bJordan Rivera\b/g, 'you')
    .replace(/\bJordan\b/g, 'you');
  return out.charAt(0).toUpperCase() + out.slice(1);
};

/** First sentence, cut to `max` characters at a word boundary. */
export const firstLine = (text: string, max: number): string => {
  const first = text.match(/^.+?[.!?](?=\s|$)/)?.[0] ?? text;
  return truncate(first.replace(/[.]$/, ''), max);
};

export const initialsOf = (name: string): string =>
  name
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

const AVATAR_GRADIENTS = [
  'from-sky-400 to-indigo-500',
  'from-emerald-400 to-teal-500',
  'from-amber-400 to-orange-500',
  'from-fuchsia-400 to-violet-500',
  'from-rose-400 to-pink-500',
  'from-cyan-400 to-blue-500',
  'from-lime-400 to-emerald-500',
];

/** Gradient initials avatar; Jordan always gets the signature orange→violet. */
export const Avatar = ({
  name,
  className,
  isYou = false,
}: {
  name: string;
  className?: string;
  isYou?: boolean;
}) => {
  let hash = 0;
  for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return (
    <span
      aria-hidden
      className={cn(
        'flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br font-semibold tracking-[-0.02em] text-white',
        isYou
          ? 'from-orange-300 via-pink-400 to-violet-500'
          : AVATAR_GRADIENTS[hash % AVATAR_GRADIENTS.length],
        className,
      )}
    >
      {initialsOf(name)}
    </span>
  );
};

export const CompassMark = ({ className }: { className?: string }) => (
  <span
    aria-hidden
    className={cn(
      'flex h-7 w-7 shrink-0 items-center justify-center rounded-[9px] bg-gradient-to-br from-indigo-500 via-violet-500 to-pink-500',
      className,
    )}
  >
    <Brain className="h-4 w-4 text-white" />
  </span>
);

interface StepFrameProps {
  eyebrow: string;
  title: ReactNode;
  aside?: ReactNode;
  children: ReactNode;
  className?: string;
}

/** One answer step: Compass eyebrow, short headline, one big visual. */
export const StepFrame = ({ eyebrow, title, aside, children, className }: StepFrameProps) => (
  <div className={cn('flex h-full flex-col', className)}>
    <Rise className="flex items-end justify-between gap-8">
      <div className="min-w-0">
        <p className="mb-2 flex items-center gap-2 text-[13px] font-semibold uppercase tracking-[0.18em] text-indigo-500/80">
          <CompassMark className="h-5 w-5 rounded-[6px] [&_svg]:h-3 [&_svg]:w-3" />
          {eyebrow}
        </p>
        <h2 className="text-[46px] font-semibold leading-[1.05] tracking-[-0.035em] text-neutral-950">
          {title}
        </h2>
      </div>
      {aside}
    </Rise>
    <div className="relative mt-6 min-h-0 flex-1">{children}</div>
  </div>
);

export const NextButton = ({ label, onClick }: { label: string; onClick: () => void }) => (
  <button
    type="button"
    onClick={onClick}
    className="group inline-flex h-12 items-center gap-2.5 rounded-full bg-neutral-950 pl-6 pr-5 text-[16px] font-semibold tracking-[-0.01em] text-white shadow-[0_2px_4px_rgba(0,0,0,0.12),0_16px_32px_-14px_rgba(15,23,42,0.6)] transition hover:scale-[1.03] hover:bg-neutral-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-300"
  >
    Next: {label}
    <ArrowDown className="h-4 w-4 transition group-hover:translate-y-0.5" aria-hidden />
  </button>
);

/** Jordan's question, right-aligned like a sent message. */
export const QuestionBubble = ({ text }: { text: string }) => (
  <div className="flex items-center justify-end gap-3">
    <p className="journey-bubble rounded-[22px] rounded-br-md bg-gradient-to-br from-indigo-500 to-violet-500 px-5 py-3 text-[18px] font-medium tracking-[-0.01em] text-white shadow-[0_14px_30px_-14px_rgba(99,102,241,0.8)]">
      {text}
    </p>
    <Avatar name={JORDAN.name} isYou className="h-9 w-9 text-[13px]" />
  </div>
);
