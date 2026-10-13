'use client';

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type CSSProperties,
} from 'react';
import { ArrowUp, Mic, Search, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Glass, Rise } from '@/components/demo/primitives';
import { useSpeechInput } from '@/components/demo/useSpeechInput';
import { CompassMark, JORDAN, QUESTION, QuestionBubble } from './StepFrame';

const TYPE_MS = 28;

export interface AskStepHandle {
  /** Types the suggestion out and submits it (keyboard advance on the first step). */
  runSuggestion: () => void;
}

interface AskStepProps {
  /** The submitted question, once asked. */
  asked: string | null;
  onSubmit: (question: string) => void;
}

/** Spotlight-style ask bar; after submit, shows the sent bubble while Compass "thinks". */
export const AskStep = forwardRef<AskStepHandle, AskStepProps>(({ asked, onSubmit }, ref) => {
  const [question, setQuestion] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const typingTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const handleSubmit = (q: string): void => {
    const trimmed = q.trim();
    if (!trimmed || asked) return;
    onSubmit(trimmed);
  };

  const speech = useSpeechInput({ onFinal: handleSubmit });

  useEffect(
    () => () => {
      if (typingTimer.current) clearInterval(typingTimer.current);
    },
    [],
  );

  const handleSuggestion = (): void => {
    if (asked || isTyping) return;
    setIsTyping(true);
    setQuestion('');
    let i = 0;
    typingTimer.current = setInterval(() => {
      i += 1;
      setQuestion(QUESTION.slice(0, i));
      if (i < QUESTION.length) return;
      if (typingTimer.current) clearInterval(typingTimer.current);
      setIsTyping(false);
      handleSubmit(QUESTION);
    }, TYPE_MS);
  };

  useImperativeHandle(ref, () => ({ runSuggestion: handleSuggestion }));

  if (asked) {
    return (
      <div className="flex h-full flex-col">
        <QuestionBubble text={asked} />
        <div className="mt-6 flex items-center gap-3" role="status" aria-live="polite">
          <CompassMark className="h-9 w-9 rounded-[11px] [&_svg]:h-5 [&_svg]:w-5" />
          <span className="flex items-center gap-1.5 rounded-full bg-white/80 px-4 py-3 shadow-[0_8px_24px_-14px_rgba(15,23,42,0.35)]">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                aria-hidden
                className="journey-dot h-2 w-2 rounded-full bg-indigo-500"
                style={{ '--d': `${i * 150}ms` } as CSSProperties}
              />
            ))}
            <span className="sr-only">
              Compass is reading your reviews, the roadmap and the market…
            </span>
          </span>
        </div>
      </div>
    );
  }

  const shown = speech.isListening ? speech.interim : question;
  return (
    <div className="flex h-full flex-col items-center justify-center pb-16">
      <Rise className="flex flex-col items-center text-center">
        <span className="demo-glow flex h-20 w-20 items-center justify-center rounded-[26px] bg-gradient-to-br from-indigo-500 via-violet-500 to-pink-500">
          <Sparkles className="h-10 w-10 text-white" strokeWidth={1.6} aria-hidden />
        </span>
        <h1 className="mt-8 text-[54px] font-semibold leading-[1.05] tracking-[-0.04em] text-neutral-950">
          Hi {JORDAN.name.split(' ')[0]}. <span className="demo-gradient-text">Ask Compass.</span>
        </h1>
        <p className="mt-3 text-[20px] text-neutral-500">
          It knows your work, your company and your market.
        </p>
      </Rise>
      <Rise delay={120} className="mt-10 w-full max-w-[820px]">
        <Glass className="bg-white/85 p-2.5 shadow-[0_2px_4px_rgba(0,0,0,0.03),0_30px_70px_-30px_rgba(79,70,229,0.45)]">
          <form
            className="flex items-center gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit(question);
            }}
          >
            <Search className="ml-4 h-6 w-6 shrink-0 text-neutral-400" aria-hidden />
            <label htmlFor="journey-ask" className="sr-only">
              Ask Compass
            </label>
            <input
              id="journey-ask"
              value={shown}
              readOnly={isTyping || speech.isListening}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder={
                speech.isListening ? 'Listening…' : 'Ask about your career, team or code'
              }
              autoComplete="off"
              className={cn(
                'h-14 min-w-0 flex-1 bg-transparent text-[23px] font-medium tracking-[-0.015em] text-neutral-900 outline-none placeholder:text-neutral-300',
                speech.isListening && 'text-indigo-600',
              )}
            />
            {speech.isSupported ? (
              <button
                type="button"
                onClick={speech.toggle}
                aria-label={speech.isListening ? 'Stop listening' : 'Ask by voice'}
                aria-pressed={speech.isListening}
                className={cn(
                  'relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-300',
                  speech.isListening
                    ? 'bg-rose-500 text-white'
                    : 'bg-black/[0.05] text-neutral-700 hover:bg-black/[0.08]',
                )}
              >
                {speech.isListening ? (
                  <span
                    aria-hidden
                    className="demo-pulse-ring absolute inset-0 rounded-full bg-rose-400"
                  />
                ) : null}
                <Mic className="relative h-5 w-5" aria-hidden />
              </button>
            ) : null}
            <button
              type="submit"
              aria-label="Ask"
              disabled={!question.trim() || isTyping}
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-neutral-950 text-white transition hover:bg-neutral-800 disabled:opacity-25"
            >
              <ArrowUp className="h-5 w-5" aria-hidden />
            </button>
          </form>
        </Glass>
      </Rise>
      <Rise delay={240} className="mt-5">
        <button
          type="button"
          onClick={handleSuggestion}
          disabled={isTyping}
          className="flex items-center gap-2 rounded-full border border-black/[0.06] bg-white/75 px-5 py-2.5 text-[17px] font-medium text-neutral-700 shadow-[0_1px_2px_rgba(0,0,0,0.04)] backdrop-blur transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 disabled:opacity-50"
        >
          <Sparkles className="h-4 w-4 text-violet-500" aria-hidden />
          {QUESTION}
        </button>
      </Rise>
    </div>
  );
});
AskStep.displayName = 'AskStep';
