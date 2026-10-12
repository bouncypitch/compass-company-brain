'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ArrowUp, Loader2, Mic, Network, Sparkles } from 'lucide-react';
import { useSpeechInput } from '@/components/demo/useSpeechInput';
import type { AskResult } from '@app-starter/shared';
import { brainApiExtras } from '@/lib/brain-api';
import { cn } from '@/lib/utils';
import { GlassCard, Pill, Reveal, SectionHeading } from './ui';

const SUGGESTIONS = [
  'Who owns agent memory, and what is blocked on it?',
  'Why did we lose Tallgrass Financial, and what would have changed the outcome?',
  'Which competitors are moving into government and regulated customers?',
  'What is Priya Shah measured on this quarter, and how is it trending?',
  'Which roadmap items have no owner and which goals do they block?',
];

/** Ask the company brain anything: HydraDB retrieval + topology + Claude, with citations. */
export const AskView = ({ organizationId }: { organizationId: string }) => {
  const [question, setQuestion] = useState('');
  const [history, setHistory] = useState<AskResult[]>([]);
  const ask = useMutation({
    mutationFn: (q: string) => brainApiExtras.ask(organizationId, q),
    onSuccess: (r) => setHistory((h) => [r, ...h]),
    onError: (e: Error) => toast.error(e.message),
  });

  const speech = useSpeechInput({ onFinal: (transcript) => handleAsk(transcript), onError: (e) => toast.error(`Voice input: ${e}`) });

  const handleAsk = (q: string): void => {
    const trimmed = q.trim();
    if (!trimmed || ask.isPending) return;
    setQuestion('');
    ask.mutate(trimmed);
  };

  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow="Ask the brain"
        title="Everything happening at Forgeline, one question away"
        description="Answers come from HydraDB: every doc, Slack thread, 1:1, ticket, line of code and competitor signal, plus the company graph of who owns what."
      />
      <GlassCard className="p-3">
        <form
          className="flex items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            handleAsk(question);
          }}
        >
          <Sparkles className="ml-3 h-5 w-5 shrink-0 text-violet-500" aria-hidden />
          <label htmlFor="brain-ask" className="sr-only">Ask the company brain</label>
          <input
            id="brain-ask"
            value={speech.isListening && speech.interim ? speech.interim : question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask about people, goals, customers, code or competitors…"
            className="h-12 flex-1 bg-transparent text-[17px] outline-none placeholder:text-neutral-400"
          />
          {speech.isSupported ? (
            <button
              type="button"
              onClick={speech.toggle}
              className={cn(
                'relative flex h-10 w-10 items-center justify-center rounded-full border border-black/[0.08] bg-white text-neutral-700 transition hover:bg-neutral-50',
                speech.isListening && 'border-rose-300 bg-rose-50 text-rose-600',
              )}
              aria-label={speech.isListening ? 'Stop voice input' : 'Ask by voice'}
              aria-pressed={speech.isListening}
            >
              {speech.isListening ? <span className="absolute inset-0 animate-ping rounded-full bg-rose-300/40" aria-hidden /> : null}
              <Mic className="relative h-4 w-4" />
            </button>
          ) : null}
          <button
            type="submit"
            disabled={ask.isPending || !question.trim()}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-900 text-white transition hover:bg-neutral-800 disabled:opacity-30"
            aria-label="Ask"
          >
            {ask.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUp className="h-4 w-4" />}
          </button>
        </form>
      </GlassCard>
      <div className="flex flex-wrap gap-2">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => handleAsk(s)}
            className="rounded-full border border-black/[0.06] bg-white/70 px-4 py-2 text-[13px] text-neutral-700 backdrop-blur transition hover:bg-white hover:text-neutral-900"
          >
            {s}
          </button>
        ))}
      </div>

      {ask.isPending ? (
        <GlassCard className="flex items-center gap-3 p-6 text-[15px] text-neutral-500">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Searching docs, conversations, code, memories and the market…
        </GlassCard>
      ) : null}

      {history.map((r, i) => (
        <Reveal key={`${r.question}-${history.length - i}`}>
          <GlassCard className={cn('space-y-5 p-8', i > 0 && 'opacity-80')}>
            <div className="text-[13px] font-medium uppercase tracking-[0.14em] text-violet-500">{r.question}</div>
            <p className="text-[19px] leading-relaxed text-neutral-900">{r.answer}</p>
            {r.citations.length ? (
              <div className="flex flex-wrap gap-2">
                {r.citations.map((c, j) => (
                  <Pill key={j} className="max-w-full">
                    <span className="truncate">{c.label}</span>
                    <code className="ml-1.5 truncate text-[11px] opacity-60">{c.source}</code>
                  </Pill>
                ))}
              </div>
            ) : null}
            {r.graphEvidence.length ? (
              <div className="rounded-2xl bg-neutral-50/80 p-4">
                <div className="mb-2 flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.12em] text-neutral-500">
                  <Network className="h-3.5 w-3.5" aria-hidden /> HydraDB graph paths
                </div>
                <ul className="space-y-1 text-[13px] text-neutral-700">
                  {r.graphEvidence.map((t, j) => (
                    <li key={j}>
                      {t.source} <span className="text-violet-600">— {t.relation} →</span> {t.target}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            {i === 0 && r.followUps.length ? (
              <div className="flex flex-wrap gap-2 pt-1">
                {r.followUps.map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => handleAsk(f)}
                    className="rounded-full bg-violet-50 px-4 py-1.5 text-[13px] text-violet-700 transition hover:bg-violet-100"
                  >
                    {f}
                  </button>
                ))}
              </div>
            ) : null}
          </GlassCard>
        </Reveal>
      ))}
    </div>
  );
};
