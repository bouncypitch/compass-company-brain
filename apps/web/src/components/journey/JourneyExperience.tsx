'use client';

import { useCallback, useEffect, useRef, useState, type ComponentType } from 'react';
import { useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import '@/components/demo/demo.css';
import './journey.css';
import { DemoDataProvider } from '@/components/demo/DemoContext';
import { AskStep, type AskStepHandle } from './AskStep';
import { StandingStep } from './StandingStep';
import { ConvergeStep, MarketStep } from './MarketSteps';
import { ClaimStep, OpportunityStep } from './OpportunitySteps';
import { PlanStep } from './PlanStep';
import { PeopleStep } from './PeopleStep';
import { DoneStep } from './DoneStep';
import { Avatar, CompassMark, JORDAN, NextButton, QUESTION, QuestionBubble } from './StepFrame';

interface StepDef {
  id: string;
  /** Short name used in "Next: <label>" buttons and the progress dots. */
  label: string;
  Component: ComponentType;
}

/** Answer steps after the ask; ids are stable for `?step=<id>` and the recorder's `data-step`. */
export const JOURNEY_STEPS: StepDef[] = [
  { id: 'standing', label: 'Where you stand', Component: StandingStep },
  { id: 'market', label: 'Why now', Component: MarketStep },
  { id: 'converge', label: 'The pattern', Component: ConvergeStep },
  { id: 'opportunity', label: 'Your opportunity', Component: OpportunityStep },
  { id: 'claim', label: 'Make it yours', Component: ClaimStep },
  { id: 'plan', label: 'Your 90 days', Component: PlanStep },
  { id: 'people', label: 'Who to talk to', Component: PeopleStep },
  { id: 'done', label: 'The big picture', Component: DoneStep },
];

/** How long Compass "thinks" between the question and the first answer step. */
const THINK_MS = 1100;

/** -1 is the ask step; 0… index into JOURNEY_STEPS. */
const ASK = -1;

const indexOfStep = (id: string | null): number => JOURNEY_STEPS.findIndex((s) => s.id === id);

const isTypingTarget = (target: EventTarget | null): boolean =>
  target instanceof HTMLElement &&
  (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName));

const prefersReducedMotion = (): boolean =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Jordan's "How do I get promoted to Staff?" journey: one question, then a
 * vertical run of full-height answer steps revealed one at a time.
 */
export const JourneyExperience = ({ organizationId }: { organizationId: string }) => {
  const searchParams = useSearchParams();
  const initial = indexOfStep(searchParams.get('step'));
  const [asked, setAsked] = useState<string | null>(initial >= 0 ? QUESTION : null);
  const [isThinking, setIsThinking] = useState(false);
  const [revealed, setRevealed] = useState(initial >= 0 ? initial : ASK);
  const [current, setCurrent] = useState(initial >= 0 ? initial : ASK);
  const scrollRef = useRef<HTMLDivElement>(null);
  const askRef = useRef<AskStepHandle>(null);
  const pendingScroll = useRef<{ index: number; isSmooth: boolean } | null>(
    initial >= 0 ? { index: initial, isSmooth: false } : null,
  );
  const thinkTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scrollToStep = useCallback((index: number, isSmooth: boolean): void => {
    const container = scrollRef.current;
    if (!container) return;
    const behavior: ScrollBehavior = isSmooth && !prefersReducedMotion() ? 'smooth' : 'auto';
    // The first answer step shares the viewport with the question bubble above it.
    if (index <= 0) {
      container.scrollTo({ top: 0, behavior });
      return;
    }
    const el = container.querySelector<HTMLElement>(`[data-step="${JOURNEY_STEPS[index].id}"]`);
    if (el) container.scrollTo({ top: el.offsetTop, behavior });
  }, []);

  // Scroll once the newly revealed step has rendered.
  useEffect(() => {
    const pending = pendingScroll.current;
    if (!pending) return;
    pendingScroll.current = null;
    requestAnimationFrame(() => scrollToStep(pending.index, pending.isSmooth));
  }, [revealed, current, scrollToStep]);

  const goTo = useCallback(
    (index: number): void => {
      if (!asked && index > ASK) return;
      const next = Math.max(asked ? 0 : ASK, Math.min(JOURNEY_STEPS.length - 1, index));
      // Focus would otherwise stay on a Next button that just scrolled away.
      if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
      pendingScroll.current = { index: next, isSmooth: true };
      setRevealed((r) => Math.max(r, next));
      setCurrent(next);
    },
    [asked],
  );

  const handleSubmit = useCallback((question: string): void => {
    setAsked(question);
    setIsThinking(true);
    thinkTimer.current = setTimeout(() => {
      setIsThinking(false);
      pendingScroll.current = { index: 0, isSmooth: false };
      setRevealed((r) => Math.max(r, 0));
      setCurrent(0);
    }, THINK_MS);
  }, []);

  useEffect(
    () => () => {
      if (thinkTimer.current) clearTimeout(thinkTimer.current);
    },
    [],
  );

  // Keep ?step= in sync so a reload reopens the same step.
  useEffect(() => {
    if (current < 0) return;
    const url = new URL(window.location.href);
    url.searchParams.set('step', JOURNEY_STEPS[current].id);
    window.history.replaceState(window.history.state, '', url);
  }, [current]);

  // The overlay covers the app chrome; stop the page underneath from scrolling.
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  // Track the step in view when the presenter scrolls by hand.
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const idx = indexOfStep((entry.target as HTMLElement).dataset.step ?? null);
          if (idx >= 0) setCurrent(idx);
        }
      },
      { root: container, threshold: 0.6 },
    );
    container.querySelectorAll('[data-step]').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [revealed, isThinking]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (isTypingTarget(e.target)) {
        if (e.key === 'Escape') (e.target as HTMLElement).blur();
        return;
      }
      const isForward = ['ArrowDown', 'ArrowRight', ' ', 'PageDown'].includes(e.key);
      const isBack = ['ArrowUp', 'PageUp'].includes(e.key);
      if (!isForward && !isBack) return;
      e.preventDefault();
      if (isThinking) return;
      if (isForward && !asked) {
        askRef.current?.runSuggestion();
        return;
      }
      goTo(current + (isForward ? 1 : -1));
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [asked, current, goTo, isThinking]);

  const currentId = current < 0 ? 'ask' : JOURNEY_STEPS[current].id;
  const isAnswering = !!asked && !isThinking;

  return (
    <DemoDataProvider organizationId={organizationId}>
      <div
        data-current-step={currentId}
        role="region"
        aria-label="Compass: your path to Staff"
        className="demo-root fixed inset-0 z-[100] overflow-hidden"
      >
        <header className="absolute inset-x-0 top-0 z-30 flex h-16 items-center justify-between border-b border-black/[0.04] bg-white/40 px-8 backdrop-blur-xl">
          <div className="flex items-center gap-2 text-[17px] font-semibold tracking-[-0.01em] text-neutral-900">
            <CompassMark />
            Compass
          </div>
          {isAnswering ? (
            <nav aria-label="Steps" className="absolute left-1/2 -translate-x-1/2">
              <ol className="flex items-center gap-2">
                {JOURNEY_STEPS.map((step, i) => (
                  <li key={step.id}>
                    <button
                      type="button"
                      onClick={() => goTo(i)}
                      disabled={i > revealed}
                      aria-label={`Step ${i + 1}: ${step.label}`}
                      aria-current={i === current ? 'step' : undefined}
                      className={cn(
                        'block h-2 rounded-full transition-all duration-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 disabled:cursor-default',
                        i === current ? 'w-6 bg-neutral-900' : 'w-2 bg-neutral-900/15',
                        i <= revealed && i !== current && 'hover:bg-neutral-900/35',
                        i > revealed && 'bg-neutral-900/[0.07]',
                      )}
                    />
                  </li>
                ))}
              </ol>
            </nav>
          ) : null}
          <div className="flex items-center gap-3 rounded-full bg-white/80 py-1.5 pl-1.5 pr-4 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_20px_-12px_rgba(15,23,42,0.3)]">
            <Avatar name={JORDAN.name} isYou className="h-8 w-8 text-[12px]" />
            <div className="leading-tight">
              <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-neutral-400">
                Signed in as
              </div>
              <div className="text-[14px] font-semibold text-neutral-900">
                {JORDAN.name}{' '}
                <span className="font-medium text-neutral-500">
                  · {JORDAN.level} · {JORDAN.team}
                </span>
              </div>
            </div>
          </div>
        </header>

        <div
          ref={scrollRef}
          className="journey-scroll absolute inset-x-0 bottom-0 top-16 overflow-y-auto"
        >
          <section
            data-step="ask"
            aria-label="Ask Compass"
            data-state="active"
            hidden={isAnswering}
            className="h-[max(calc(100vh-64px),760px)] min-h-[calc(100vh-64px)] px-16 pb-8 pt-8"
          >
            <AskStep ref={askRef} asked={asked} onSubmit={handleSubmit} />
          </section>

          {isAnswering
            ? JOURNEY_STEPS.slice(0, revealed + 1).map((step, i) => {
                const next = JOURNEY_STEPS[i + 1];
                return (
                  <section
                    key={step.id}
                    data-step={step.id}
                    data-state="active"
                    aria-label={step.label}
                    className="flex h-[max(calc(100vh-64px),760px)] min-h-[calc(100vh-64px)] flex-col px-16 pb-7 pt-8"
                  >
                    {i === 0 ? (
                      <div className="mb-5">
                        <QuestionBubble text={asked} />
                      </div>
                    ) : null}
                    <div className="min-h-0 flex-1">
                      <step.Component />
                    </div>
                    {next ? (
                      <div className="mt-5 flex justify-end">
                        <NextButton label={next.label} onClick={() => goTo(i + 1)} />
                      </div>
                    ) : null}
                  </section>
                );
              })
            : null}
        </div>
      </div>
    </DemoDataProvider>
  );
};
