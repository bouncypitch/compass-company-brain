'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowRight, Check, FileCode2, GitPullRequest, Loader2, RotateCcw } from 'lucide-react';
import type { AcceptRecommendationResult, StrategicGap } from '@app-starter/shared';
import { brainApi } from '@/lib/brain-api';
import { cn } from '@/lib/utils';
import { useDemo } from './DemoContext';
import { Glass, Rise, SlideFrame, SlideLoading } from './primitives';

const STEPS = ['Writing to HydraDB…', 'Linking goals & owners…', 'Drafting PR…'];
const STEP_MS = 9000;

/** "R-14 Agent memory" → ["R-14", "Agent memory"]. */
const splitRoadmap = (item: string): [string, string] => {
  const idx = item.indexOf(' ');
  return idx < 0 ? [item, ''] : [item.slice(0, idx), item.slice(idx + 1)];
};

/** "forgeline-core/ingest/ (repoIndexer, fileWatcher)" → "forgeline-core/ingest/". */
const shortPath = (path: string): string => path.replace(/\s*\(.*\)\s*$/, '');

export const GapSlide = () => {
  const { radar, organizationId } = useDemo();
  const gap = radar.data?.gaps[0];
  if (!gap) return <SlideLoading />;
  return <GapCard gap={gap} organizationId={organizationId} />;
};

const GapCard = ({ gap, organizationId }: { gap: StrategicGap; organizationId: string }) => {
  const queryClient = useQueryClient();
  const resultKey = ['demo-accept', organizationId, gap.id];
  // Observing the key keeps an earlier accept result alive in the cache.
  const cached = useQuery<AcceptRecommendationResult | null>({
    queryKey: resultKey,
    queryFn: () => null,
    enabled: false,
    staleTime: Infinity,
    gcTime: Infinity,
  });
  const accept = useMutation({
    mutationFn: () => brainApi.accept(organizationId, gap.id),
    onSuccess: (r) => {
      queryClient.setQueryData(resultKey, r);
      void queryClient.invalidateQueries({ queryKey: ['brain-compass'] });
    },
  });
  const result = cached.data ?? null;
  const status = useQuery({
    queryKey: ['brain-priority', organizationId, result?.priorityId],
    queryFn: () => brainApi.priorityStatus(organizationId, result!.priorityId),
    enabled: !!result,
    refetchInterval: (q) => (q.state.data?.status === 'completed' ? false : 3000),
  });
  const [roadmapId, roadmapName] = splitRoadmap(gap.roadmapItem);
  const handleAccept = (): void => accept.mutate();

  return (
    <SlideFrame
      title={
        <>
          One unowned item.{' '}
          <span className="demo-gradient-text">{gap.affectedGoals.length} blocked goals.</span>
        </>
      }
    >
      <div className="grid h-full grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] gap-6">
        <Rise delay={120} className="min-h-0">
          <Glass className="relative flex h-full flex-col overflow-hidden p-10">
            <div
              aria-hidden
              className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-rose-200/50 blur-3xl"
            />
            <div className="relative flex items-center gap-3">
              <span className="rounded-full bg-rose-500 px-4 py-1.5 text-[14px] font-bold uppercase tracking-[0.16em] text-white shadow-[0_8px_20px_-8px_rgba(244,63,94,0.8)]">
                {gap.owner ? `Owner: ${gap.owner}` : 'Unowned'}
              </span>
              <span className="rounded-full bg-rose-500/10 px-4 py-1.5 text-[14px] font-semibold uppercase tracking-[0.12em] text-rose-700">
                {gap.urgency} urgency
              </span>
            </div>
            <div className="relative mt-10 text-[150px] font-semibold leading-[0.9] tracking-[-0.05em] text-neutral-950">
              {roadmapId}
            </div>
            <div className="relative mt-3 text-[36px] font-semibold tracking-[-0.025em] text-neutral-500">
              {roadmapName}
            </div>
            <div className="relative mt-auto space-y-5">
              <div>
                <div className="mb-2 text-[13px] font-semibold uppercase tracking-[0.16em] text-neutral-400">
                  Blocks
                </div>
                <div className="flex flex-wrap gap-2">
                  {gap.affectedGoals.map((g) => (
                    <span
                      key={g}
                      className="rounded-full bg-amber-500/10 px-3.5 py-1.5 text-[16px] font-semibold text-amber-800"
                    >
                      {g}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <div className="mb-2 text-[13px] font-semibold uppercase tracking-[0.16em] text-neutral-400">
                  Code
                </div>
                <div className="flex flex-wrap gap-2">
                  {gap.codePaths.map((p) => (
                    <span
                      key={p}
                      className="rounded-lg bg-neutral-900/[0.05] px-3 py-1.5 font-mono text-[14px] text-neutral-700"
                    >
                      {shortPath(p)}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </Glass>
        </Rise>
        <Rise delay={260} className="min-h-0">
          {result ? (
            <DiffCard result={result} indexing={status.data?.status ?? result.indexingStatus} />
          ) : (
            <AcceptPanel
              isPending={accept.isPending}
              error={accept.error}
              onAccept={handleAccept}
            />
          )}
        </Rise>
      </div>
    </SlideFrame>
  );
};

interface AcceptPanelProps {
  isPending: boolean;
  error: Error | null;
  onAccept: () => void;
}

const AcceptPanel = ({ isPending, error, onAccept }: AcceptPanelProps) => {
  const [step, setStep] = useState(0);
  useEffect(() => {
    if (!isPending) {
      setStep(0);
      return;
    }
    const timer = setInterval(() => setStep((s) => Math.min(STEPS.length - 1, s + 1)), STEP_MS);
    return () => clearInterval(timer);
  }, [isPending]);

  return (
    <Glass className="flex h-full flex-col items-center justify-center gap-10 p-10 text-center">
      <div className="flex h-24 w-24 items-center justify-center rounded-[28px] bg-gradient-to-br from-indigo-500 to-violet-500 text-white shadow-[0_20px_50px_-16px_rgba(99,102,241,0.7)]">
        <GitPullRequest className="h-11 w-11" strokeWidth={1.6} aria-hidden />
      </div>
      {isPending ? (
        <div className="w-full max-w-[420px] space-y-6" role="status" aria-live="polite">
          <ol className="space-y-3 text-left">
            {STEPS.map((label, i) => (
              <li
                key={label}
                className={cn(
                  'flex items-center gap-3 text-[22px] font-medium transition-colors duration-500',
                  i <= step ? 'text-neutral-900' : 'text-neutral-300',
                )}
              >
                {i < step ? (
                  <Check className="h-6 w-6 text-emerald-500" strokeWidth={3} aria-hidden />
                ) : i === step ? (
                  <Loader2 className="h-6 w-6 animate-spin text-indigo-500" aria-hidden />
                ) : (
                  <span className="h-6 w-6 rounded-full border-2 border-neutral-200" aria-hidden />
                )}
                {label}
              </li>
            ))}
          </ol>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-indigo-500/10">
            <div className="demo-shimmer h-full w-full" />
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          <button
            type="button"
            onClick={onAccept}
            className="group inline-flex h-20 items-center gap-3 rounded-full bg-neutral-950 px-12 text-[26px] font-semibold tracking-[-0.01em] text-white shadow-[0_2px_4px_rgba(0,0,0,0.15),0_20px_40px_-12px_rgba(15,23,42,0.55)] transition hover:scale-[1.03] hover:bg-neutral-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-300"
          >
            {error ? <RotateCcw className="h-7 w-7" aria-hidden /> : null}
            {error ? 'Try again' : 'Accept & draft PR'}
            {error ? null : (
              <ArrowRight className="h-7 w-7 transition group-hover:translate-x-1" aria-hidden />
            )}
          </button>
          {error ? (
            <p className="max-w-[420px] text-[16px] text-rose-600">{error.message}</p>
          ) : (
            <p className="text-[18px] text-neutral-400">
              Saves the priority to the brain and drafts the code.
            </p>
          )}
        </div>
      )}
    </Glass>
  );
};

const lineTone = (line: string): string => {
  if (line.startsWith('+++') || line.startsWith('---')) return 'text-neutral-400';
  if (line.startsWith('+')) return 'bg-emerald-500/10 text-emerald-800';
  if (line.startsWith('-')) return 'bg-rose-500/10 text-rose-700';
  if (line.startsWith('@@')) return 'text-indigo-500';
  return 'text-neutral-600';
};

const DiffCard = ({
  result,
  indexing,
}: {
  result: AcceptRecommendationResult;
  indexing: string;
}) => {
  const [tab, setTab] = useState(0);
  const file = result.diff[tab] ?? result.diff[0];
  const isIndexed = indexing === 'completed';
  return (
    <Glass className="flex h-full flex-col overflow-hidden">
      <div className="flex items-center justify-between gap-4 border-b border-black/[0.05] px-6 py-4">
        <span className="flex items-center gap-2 text-[18px] font-semibold text-neutral-900">
          <GitPullRequest className="h-5 w-5 text-indigo-500" aria-hidden /> Draft PR
        </span>
        <span
          className={cn(
            'flex items-center gap-2 rounded-full px-4 py-1.5 text-[15px] font-semibold',
            isIndexed ? 'bg-emerald-500/10 text-emerald-700' : 'bg-indigo-500/10 text-indigo-700',
          )}
        >
          {isIndexed ? null : <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
          Saved to brain ✓ indexing: {indexing}
        </span>
      </div>
      <div
        role="tablist"
        aria-label="Changed files"
        className="flex gap-1 overflow-x-auto border-b border-black/[0.05] px-4 pt-2"
      >
        {result.diff.map((d, i) => (
          <button
            key={d.path}
            type="button"
            role="tab"
            aria-selected={i === tab}
            onClick={() => setTab(i)}
            className={cn(
              'flex shrink-0 items-center gap-1.5 rounded-t-xl px-3.5 py-2 font-mono text-[13px] transition',
              i === tab
                ? 'bg-white text-neutral-900 shadow-[0_-1px_0_rgba(0,0,0,0.04)]'
                : 'text-neutral-400 hover:text-neutral-700',
            )}
          >
            <FileCode2 className="h-3.5 w-3.5" aria-hidden />
            {d.path.split('/').pop()}
          </button>
        ))}
      </div>
      {file ? (
        <pre
          role="tabpanel"
          className="min-h-0 flex-1 overflow-auto bg-white/60 py-3 font-mono text-[15px] leading-[1.65]"
        >
          {file.patch.split('\n').map((line, i) => (
            <div key={i} className={cn('whitespace-pre px-6', lineTone(line))}>
              {line || ' '}
            </div>
          ))}
        </pre>
      ) : (
        <div className="flex flex-1 items-center justify-center text-neutral-400">
          No code changes
        </div>
      )}
    </Glass>
  );
};
