'use client';

import { useEffect, useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { ArrowRight, ArrowUp, Loader2, Mic, Search, Sparkles } from 'lucide-react';
import type { AskResult } from '@app-starter/shared';
import { brainApiExtras } from '@/lib/brain-api';
import { cn } from '@/lib/utils';
import { useDemo } from './DemoContext';
import { Glass, Rise, SlideFrame } from './primitives';
import { useSpeechInput } from './useSpeechInput';

const SUGGESTIONS = [
  'Who owns agent memory, and what is blocked on it?',
  'Why did we lose Tallgrass Financial?',
  'Which roadmap items have no owner?',
];

const TYPE_MS = 28;

export const AskSlide = () => {
  const { organizationId } = useDemo();
  const [question, setQuestion] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const typingTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const ask = useMutation({ mutationFn: (q: string) => brainApiExtras.ask(organizationId, q) });

  const handleSubmit = (q: string): void => {
    const trimmed = q.trim();
    if (!trimmed || ask.isPending) return;
    setQuestion(trimmed);
    ask.mutate(trimmed);
  };

  const speech = useSpeechInput({ onFinal: handleSubmit });

  useEffect(
    () => () => {
      if (typingTimer.current) clearInterval(typingTimer.current);
    },
    [],
  );

  /** Types the suggestion into the bar like a person would, then asks it. */
  const handleSuggestion = (text: string): void => {
    if (ask.isPending || isTyping) return;
    if (typingTimer.current) clearInterval(typingTimer.current);
    setIsTyping(true);
    setQuestion('');
    let i = 0;
    typingTimer.current = setInterval(() => {
      i += 1;
      setQuestion(text.slice(0, i));
      if (i >= text.length) {
        if (typingTimer.current) clearInterval(typingTimer.current);
        setIsTyping(false);
        handleSubmit(text);
      }
    }, TYPE_MS);
  };

  const shown = speech.isListening ? speech.interim : question;
  const hasAnswer = !!ask.data && !ask.isPending;

  return (
    <SlideFrame
      title={
        <>
          Ask the brain <span className="demo-gradient-text">anything</span>.
        </>
      }
    >
      <div className="mx-auto flex h-full max-w-[1120px] flex-col gap-5">
        <Rise delay={100}>
          <Glass className="bg-white/85 p-3 shadow-[0_2px_4px_rgba(0,0,0,0.03),0_30px_70px_-30px_rgba(79,70,229,0.4)]">
            <form
              className="flex items-center gap-3"
              onSubmit={(e) => {
                e.preventDefault();
                handleSubmit(question);
              }}
            >
              <Search className="ml-4 h-7 w-7 shrink-0 text-neutral-400" aria-hidden />
              <label htmlFor="demo-ask" className="sr-only">
                Ask the company brain
              </label>
              <input
                id="demo-ask"
                value={shown}
                readOnly={isTyping || speech.isListening}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder={
                  speech.isListening ? 'Listening…' : 'Ask about people, goals, code or competitors'
                }
                className={cn(
                  'h-16 min-w-0 flex-1 bg-transparent text-[26px] font-medium tracking-[-0.015em] text-neutral-900 outline-none placeholder:text-neutral-300',
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
                    'relative flex h-14 w-14 shrink-0 items-center justify-center rounded-full transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-300',
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
                  <Mic className="relative h-6 w-6" aria-hidden />
                </button>
              ) : null}
              <button
                type="submit"
                aria-label="Ask"
                disabled={!question.trim() || ask.isPending}
                className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-neutral-950 text-white transition hover:bg-neutral-800 disabled:opacity-30"
              >
                {ask.isPending ? (
                  <Loader2 className="h-6 w-6 animate-spin" aria-hidden />
                ) : (
                  <ArrowUp className="h-6 w-6" aria-hidden />
                )}
              </button>
            </form>
          </Glass>
        </Rise>
        {!hasAnswer && !ask.isPending ? (
          <Rise delay={220} className="flex flex-wrap justify-center gap-3">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => handleSuggestion(s)}
                className="flex items-center gap-2 rounded-full border border-black/[0.06] bg-white/70 px-5 py-3 text-[18px] font-medium text-neutral-700 shadow-[0_1px_2px_rgba(0,0,0,0.04)] backdrop-blur transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300"
              >
                <Sparkles className="h-4 w-4 text-violet-500" aria-hidden />
                {s}
              </button>
            ))}
          </Rise>
        ) : null}
        <div className="min-h-0 flex-1" aria-live="polite">
          {ask.isPending ? <Thinking /> : null}
          {ask.isError && !ask.isPending ? (
            <p className="text-center text-[18px] text-rose-600">{ask.error.message}</p>
          ) : null}
          {hasAnswer && ask.data ? <Answer result={ask.data} /> : null}
          {!hasAnswer && !ask.isPending && !ask.isError ? <EmptyState /> : null}
        </div>
      </div>
    </SlideFrame>
  );
};

const EmptyState = () => (
  <div className="flex h-full items-center justify-center">
    <div className="flex items-center gap-4 text-[18px] text-neutral-400">
      {['Docs', 'Slack', '1:1s', 'Tickets', 'Code', 'Competitors'].map((s) => (
        <span key={s} className="rounded-full bg-black/[0.03] px-4 py-2">
          {s}
        </span>
      ))}
    </div>
  </div>
);

const Thinking = () => (
  <Glass className="flex h-full flex-col items-center justify-center gap-6">
    <div className="relative flex h-24 w-24 items-center justify-center">
      <span aria-hidden className="demo-pulse-ring absolute inset-0 rounded-full bg-indigo-300" />
      <span className="relative flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 text-white">
        <Sparkles className="h-10 w-10" aria-hidden />
      </span>
    </div>
    <p className="text-[22px] font-medium text-neutral-500">
      Searching HydraDB and the company graph…
    </p>
  </Glass>
);

const Answer = ({ result }: { result: AskResult }) => (
  <Glass className="flex max-h-full flex-col gap-5 overflow-hidden px-10 py-8 animate-in fade-in slide-in-from-bottom-3 duration-500">
    <div className="min-h-0 flex-1 overflow-auto pr-2">
      <p className="whitespace-pre-line text-[24px] leading-[1.5] tracking-[-0.01em] text-neutral-800">
        {result.answer}
      </p>
    </div>
    {result.graphEvidence.length ? (
      <div className="space-y-1.5 border-t border-black/[0.05] pt-4">
        {result.graphEvidence.slice(0, 3).map((g) => (
          <div
            key={`${g.source}-${g.relation}-${g.target}`}
            className="flex items-center gap-2 text-[15px] text-neutral-600"
          >
            <span className="font-semibold text-neutral-900">{g.source}</span>
            <ArrowRight className="h-3.5 w-3.5 text-indigo-400" aria-hidden />
            <span className="text-indigo-600">{g.relation}</span>
            <ArrowRight className="h-3.5 w-3.5 text-indigo-400" aria-hidden />
            <span className="font-semibold text-neutral-900">{g.target}</span>
          </div>
        ))}
      </div>
    ) : null}
    {result.citations.length ? (
      <div className="flex flex-wrap gap-2">
        {result.citations.slice(0, 6).map((c) => (
          <span
            key={`${c.label}-${c.source}`}
            className="rounded-full bg-indigo-500/10 px-3.5 py-1.5 text-[14px] font-medium text-indigo-700"
          >
            {c.label}
          </span>
        ))}
      </div>
    ) : null}
  </Glass>
);
