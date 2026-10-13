'use client';

import { useCallback, useEffect, useState, type ComponentType } from 'react';
import { useSearchParams } from 'next/navigation';
import { Brain } from 'lucide-react';
import { cn } from '@/lib/utils';
import './demo.css';
import { DemoDataProvider } from './DemoContext';
import type { SlideProps } from './primitives';
import { CloseSlide, MarketSlide, ProblemSlide, TitleSlide } from './IntroSlides';
import { ConvergenceSlide, LandscapeSlide, TimeMachineSlide } from './RadarSlides';
import { GapSlide } from './GapSlide';
import { OrgSlide, StorySlide } from './GraphSlides';
import { CompassSlide, PlanSlide } from './CompassSlides';
import { AskSlide, KeynoteSlide } from './AskSlide';
import { ExampleSlide } from './ExampleSlide';

interface SlideDef {
  id: string;
  label: string;
  Component: ComponentType<SlideProps>;
}

/** Deck order; ids are stable for `?s=<id>` links and the recorder's `data-slide`. */
export const DEMO_SLIDES: SlideDef[] = [
  { id: 'title', label: 'Compass', Component: TitleSlide },
  { id: 'example', label: 'A real example', Component: ExampleSlide },
  { id: 'problem', label: 'The problem', Component: ProblemSlide },
  { id: 'market', label: 'The market', Component: MarketSlide },
  { id: 'landscape', label: 'Landscape', Component: LandscapeSlide },
  { id: 'convergence', label: 'Convergence', Component: ConvergenceSlide },
  { id: 'timemachine', label: 'Time machine', Component: TimeMachineSlide },
  { id: 'gap', label: 'The gap', Component: GapSlide },
  { id: 'story', label: 'The story', Component: StorySlide },
  { id: 'compass', label: 'Compass', Component: CompassSlide },
  { id: 'plan', label: '90-day plan', Component: PlanSlide },
  { id: 'ask', label: 'Ask', Component: AskSlide },
  { id: 'keynote', label: 'Keynote', Component: KeynoteSlide },
  { id: 'org', label: 'Company graph', Component: OrgSlide },
  { id: 'close', label: 'Close', Component: CloseSlide },
];

const indexOfSlide = (id: string | null): number => {
  const idx = DEMO_SLIDES.findIndex((s) => s.id === id);
  return idx < 0 ? 0 : idx;
};

const isTypingTarget = (target: EventTarget | null): boolean =>
  target instanceof HTMLElement &&
  (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName));

/** Full-screen, presenter-driven keynote over the live company brain. */
export const DemoDeck = ({ organizationId }: { organizationId: string }) => {
  const searchParams = useSearchParams();
  const [index, setIndex] = useState(() => indexOfSlide(searchParams.get('s')));
  const current = DEMO_SLIDES[index];

  const goTo = useCallback((next: number): void => {
    setIndex(Math.max(0, Math.min(DEMO_SLIDES.length - 1, next)));
  }, []);

  // Keep ?s= in sync so a reload (or a shared link) reopens the same slide.
  useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.set('s', current.id);
    window.history.replaceState(window.history.state, '', url);
  }, [current.id]);

  // The deck covers the app chrome; stop the page underneath from scrolling.
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (isTypingTarget(e.target)) {
        if (e.key === 'Escape') (e.target as HTMLElement).blur();
        return;
      }
      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') {
        e.preventDefault();
        setIndex((i) => Math.min(DEMO_SLIDES.length - 1, i + 1));
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        setIndex((i) => Math.max(0, i - 1));
      } else if (e.key === 'Home') {
        setIndex(0);
      } else if (e.key === 'End') {
        setIndex(DEMO_SLIDES.length - 1);
      } else if (/^[0-9]$/.test(e.key)) {
        // 1–9 jump to slides 1–9; 0 jumps to slide 10.
        const n = e.key === '0' ? 10 : Number(e.key);
        setIndex(Math.min(DEMO_SLIDES.length - 1, n - 1));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <DemoDataProvider organizationId={organizationId}>
      <div
        data-slide={current.id}
        role="region"
        aria-roledescription="presentation"
        aria-label="Compass live demo"
        className="demo-root fixed inset-0 z-[100] overflow-hidden"
      >
        <div className="pointer-events-none absolute left-10 top-7 z-20 flex items-center gap-2 text-[17px] font-semibold tracking-[-0.01em] text-neutral-900">
          <span className="flex h-7 w-7 items-center justify-center rounded-[9px] bg-gradient-to-br from-indigo-500 via-violet-500 to-pink-500">
            <Brain className="h-4 w-4 text-white" aria-hidden />
          </span>
          Compass
        </div>
        <div
          className="pointer-events-none absolute right-10 top-8 z-20 text-[14px] font-medium tabular-nums text-neutral-400"
          aria-live="polite"
        >
          {index + 1} <span className="text-neutral-300">/ {DEMO_SLIDES.length}</span>
        </div>

        {DEMO_SLIDES.map((slide, i) => {
          const isActive = i === index;
          return (
            <section
              key={slide.id}
              aria-label={slide.label}
              aria-hidden={!isActive}
              inert={!isActive}
              data-state={isActive ? 'active' : i < index ? 'before' : 'after'}
              className={cn('demo-slide absolute inset-0', !isActive && 'pointer-events-none')}
            >
              <slide.Component isActive={isActive} />
            </section>
          );
        })}

        <nav aria-label="Slides" className="absolute inset-x-0 bottom-7 z-20 flex justify-center">
          <ol className="flex items-center gap-2 rounded-full bg-white/50 px-3 py-2 backdrop-blur">
            {DEMO_SLIDES.map((slide, i) => (
              <li key={slide.id}>
                <button
                  type="button"
                  onClick={() => goTo(i)}
                  aria-label={`Slide ${i + 1}: ${slide.label}`}
                  aria-current={i === index ? 'step' : undefined}
                  className={cn(
                    'block h-2 rounded-full transition-all duration-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400',
                    i === index
                      ? 'w-6 bg-neutral-900'
                      : 'w-2 bg-neutral-900/15 hover:bg-neutral-900/35',
                  )}
                />
              </li>
            ))}
          </ol>
        </nav>
      </div>
    </DemoDataProvider>
  );
};
