'use client';

import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowRight, Check, GitPullRequest, Loader2, RotateCcw, TrendingDown } from 'lucide-react';
import type { AcceptRecommendationResult, StrategicGap } from '@app-starter/shared';
import { brainApi } from '@/lib/brain-api';
import { cn } from '@/lib/utils';
import { useDemo } from '@/components/demo/DemoContext';
import { Glass, Rise, SlideLoading } from '@/components/demo/primitives';
import { DiffCard, shortPath, splitRoadmap } from '@/components/demo/GapSlide';
import { Avatar, JORDAN, StepFrame, firstLine } from './StepFrame';

/** "forgeline-core/ingest/ (repoIndexer, fileWatcher)" → "repoIndexer, fileWatcher". */
const pathDetail = (path: string): string => path.match(/\((.*)\)/)?.[1] ?? '';

/** Pulls "$610K" and "12/15" for the at-risk renewal out of the opportunity's goal text. */
const useRenewal = (): { account: string; amount: string; date: string } => {
  const { compass } = useDemo();
  const text = compass.data?.opportunities[0]?.companyGoal ?? '';
  const amount = text.match(/Halvorsen \((\$[\d.,]+[KM])/)?.[1] ?? '$610K';
  const date = text.match(/renews (\d{1,2}\/\d{1,2})/)?.[1] ?? '12/15';
  return { account: 'Halvorsen', amount, date };
};

const isJordan = (personId: string | undefined): boolean => personId === `person-${JORDAN.id}`;

/** Code owner per module id, from the company graph's "code owner of" edges. */
const useCodeOwners = (): Map<string, { id: string; name: string }> => {
  const { topology } = useDemo();
  return useMemo(() => {
    const owners = new Map<string, { id: string; name: string }>();
    const graph = topology.data?.graph;
    if (!graph) return owners;
    const label = new Map(graph.nodes.map((n) => [n.id, n.label]));
    for (const e of graph.edges) {
      if (e.label !== 'code owner of') continue;
      // Modules can have several owners; once Jordan is one, keep "you own this".
      if (isJordan(owners.get(e.target)?.id)) continue;
      owners.set(e.target, { id: e.source, name: label.get(e.source) ?? e.source });
    }
    return owners;
  }, [topology.data]);
};

const codeId = (path: string): string => `code-${shortPath(path).replace(/\/$/, '')}`;

/** Owner of a gap code path; "forgeline-core/agent/" also matches "forgeline-core/agent-loop". */
const ownerOf = (
  owners: Map<string, { id: string; name: string }>,
  path: string,
): { id: string; name: string } | undefined => {
  const id = codeId(path);
  const exact = owners.get(id);
  if (exact) return exact;
  const prefix = [...owners.keys()].find((k) => k.startsWith(`${id}-`) || k.startsWith(`${id}/`));
  return prefix ? owners.get(prefix) : undefined;
};

export const OpportunityStep = () => {
  const { radar } = useDemo();
  const owners = useCodeOwners();
  const renewal = useRenewal();
  const gap = radar.data?.gaps[0];
  if (!gap) return <SlideLoading />;
  const [roadmapId, roadmapName] = splitRoadmap(gap.roadmapItem);
  const yours = gap.codePaths.filter((p) => isJordan(ownerOf(owners, p)?.id)).length;

  return (
    <StepFrame
      eyebrow="04 · Your opportunity"
      title={
        <>
          The biggest unowned bet: <span className="demo-gradient-text">{roadmapId}</span>
        </>
      }
    >
      <div className="grid h-full grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] gap-6">
        <Rise delay={120} className="min-h-0">
          <Glass className="relative flex h-full flex-col overflow-hidden p-9">
            <div
              aria-hidden
              className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-rose-200/50 blur-3xl"
            />
            <div className="relative flex items-center gap-3">
              <span className="rounded-full bg-rose-500 px-4 py-1.5 text-[13px] font-bold uppercase tracking-[0.16em] text-white shadow-[0_8px_20px_-8px_rgba(244,63,94,0.8)]">
                {gap.owner ? `Owner: ${gap.owner}` : 'Unowned'}
              </span>
              <span className="rounded-full bg-rose-500/10 px-4 py-1.5 text-[13px] font-semibold uppercase tracking-[0.12em] text-rose-700">
                {gap.urgency} urgency
              </span>
            </div>
            <div className="relative mt-7 text-[124px] font-semibold leading-[0.9] tracking-[-0.05em] text-neutral-950">
              {roadmapId}
            </div>
            <div className="relative mt-2 text-[32px] font-semibold tracking-[-0.025em] text-neutral-500">
              {roadmapName}
            </div>
            <p className="relative mt-5 max-w-[520px] text-[19px] leading-snug text-neutral-600">
              {firstLine(gap.whyItMatters, 110).replace(/([^…])$/, '$1.')}
            </p>
            <div className="relative mt-auto space-y-5">
              <div>
                <div className="mb-2 text-[12px] font-semibold uppercase tracking-[0.16em] text-neutral-400">
                  Blocks {gap.affectedGoals.length} goals
                </div>
                <div className="flex flex-wrap gap-2">
                  {gap.affectedGoals.map((g) => (
                    <span
                      key={g}
                      className="rounded-full bg-amber-500/10 px-3 py-1 text-[15px] font-semibold text-amber-800"
                    >
                      {g}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-2xl bg-gradient-to-r from-rose-500/10 to-orange-500/5 px-4 py-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-rose-500 text-white">
                  <TrendingDown className="h-[18px] w-[18px]" aria-hidden />
                </span>
                <span className="text-[17px] font-semibold text-neutral-900">
                  {renewal.account} · {renewal.amount} renewal
                </span>
                <span className="ml-auto rounded-full bg-white/80 px-3 py-1 text-[14px] font-semibold tabular-nums text-rose-700">
                  at risk {renewal.date}
                </span>
              </div>
            </div>
          </Glass>
        </Rise>
        <Rise delay={260} className="min-h-0">
          <Glass className="flex h-full flex-col p-9">
            <div className="text-[12px] font-semibold uppercase tracking-[0.16em] text-neutral-400">
              Where it lives
            </div>
            <div className="mt-1 text-[28px] font-semibold leading-tight tracking-[-0.025em] text-neutral-950">
              Lives in code <span className="demo-gradient-text">you already own.</span>
            </div>
            <ul className="mt-6 flex min-h-0 flex-1 flex-col gap-2.5">
              {gap.codePaths.map((p, i) => {
                const owner = ownerOf(owners, p);
                const isYours = isJordan(owner?.id);
                return (
                  <Rise key={p} delay={380 + i * 110} className="min-h-0 flex-1">
                    <li
                      className={cn(
                        'flex h-full items-center gap-4 rounded-2xl border px-4',
                        isYours
                          ? 'border-violet-400/40 bg-gradient-to-r from-violet-500/[0.08] to-pink-500/[0.05]'
                          : 'border-black/[0.05] bg-white/50',
                      )}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-mono text-[16px] font-medium text-neutral-900">
                          {shortPath(p)}
                        </div>
                        <div className="truncate text-[13px] text-neutral-400">
                          {pathDetail(p) || 'module'}
                        </div>
                      </div>
                      {isYours ? (
                        <span className="flex items-center gap-2 rounded-full bg-white/90 py-1 pl-1 pr-3 text-[14px] font-semibold text-violet-700 shadow-sm">
                          <Avatar name={JORDAN.name} isYou className="h-7 w-7 text-[11px]" />
                          You own this
                        </span>
                      ) : owner ? (
                        <span className="flex items-center gap-2 text-[14px] font-medium text-neutral-500">
                          <Avatar name={owner.name} className="h-7 w-7 text-[11px]" />
                          {owner.name}
                        </span>
                      ) : (
                        <span className="rounded-full border border-dashed border-black/15 px-3 py-1 text-[13px] font-medium text-neutral-400">
                          {/new module/i.test(p) ? 'New · yours to create' : 'No owner yet'}
                        </span>
                      )}
                    </li>
                  </Rise>
                );
              })}
            </ul>
            <div className="mt-5 text-[15px] font-medium text-neutral-500">
              <span className="font-semibold text-neutral-900">
                {yours} of {gap.codePaths.length}
              </span>{' '}
              modules are already yours.
            </div>
          </Glass>
        </Rise>
      </div>
    </StepFrame>
  );
};

const CLAIM_STEPS = [
  'Naming you owner',
  'Saving to the brain',
  'Linking blocked goals',
  'Drafting the PR',
];
const CLAIM_STEP_MS = 650;

export const ClaimStep = () => {
  const { radar, organizationId } = useDemo();
  const gap = radar.data?.gaps[0];
  if (!gap) return <SlideLoading />;
  return <ClaimPanel gap={gap} organizationId={organizationId} />;
};

const ClaimPanel = ({ gap, organizationId }: { gap: StrategicGap; organizationId: string }) => {
  const queryClient = useQueryClient();
  // Same key as the deck's GapSlide so one accept shows in both.
  const resultKey = ['demo-accept', organizationId, gap.id];
  const cached = useQuery<AcceptRecommendationResult | null>({
    queryKey: resultKey,
    queryFn: () => null,
    enabled: false,
    staleTime: Infinity,
    gcTime: Infinity,
  });
  const [isAnimating, setIsAnimating] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const accept = useMutation({
    mutationFn: () => brainApi.accept(organizationId, gap.id),
    onSuccess: (r) => queryClient.setQueryData(resultKey, r),
  });
  const result = cached.data ?? null;
  const status = useQuery({
    queryKey: ['brain-priority', organizationId, result?.priorityId],
    queryFn: () => brainApi.priorityStatus(organizationId, result!.priorityId),
    enabled: !!result,
    refetchInterval: (q) => (q.state.data?.status === 'completed' ? false : 3000),
  });

  // The accept answer is cached and near-instant; pace the steps so the moment reads on video.
  useEffect(() => {
    if (!isAnimating) return;
    if (stepIndex >= CLAIM_STEPS.length) {
      if (!accept.isPending) setIsAnimating(false);
      return;
    }
    const timer = setTimeout(() => setStepIndex((s) => s + 1), CLAIM_STEP_MS);
    return () => clearTimeout(timer);
  }, [isAnimating, stepIndex, accept.isPending]);

  const handleClaim = (): void => {
    setStepIndex(0);
    setIsAnimating(true);
    accept.mutate();
  };

  const [roadmapId] = splitRoadmap(gap.roadmapItem);
  const isRunning = isAnimating || accept.isPending;
  const indexing = status.data?.status ?? result?.indexingStatus ?? 'queued';
  const isDone = !!result && !isRunning;
  // Priya is measured on the Platform KRs; show which of them this claim moves.
  const managerKrs = gap.affectedGoals.filter((g) => g.startsWith('PE-'));

  return (
    <StepFrame
      eyebrow="05 · Make it yours"
      title={
        <>
          Make it <span className="demo-gradient-text">yours.</span>
        </>
      }
    >
      {isDone && result ? (
        <div className="grid h-full grid-cols-[360px_minmax(0,1fr)] gap-6">
          <Rise className="min-h-0">
            <Glass className="flex h-full flex-col p-8">
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500 text-white shadow-[0_14px_30px_-10px_rgba(16,185,129,0.7)]">
                <Check className="h-8 w-8" strokeWidth={3} aria-hidden />
              </span>
              <div className="mt-6 text-[40px] font-semibold leading-[1.05] tracking-[-0.035em] text-neutral-950">
                {roadmapId} is yours.
              </div>
              <ul className="mt-8 space-y-5 text-[19px] font-medium text-neutral-700">
                {[
                  `Owner: ${JORDAN.name}`,
                  'Priority saved to the brain',
                  `${gap.affectedGoals.length} goals linked`,
                  `${result.diff.length} files drafted`,
                ].map((line) => (
                  <li key={line} className="flex items-center gap-3">
                    <Check
                      className="h-5 w-5 shrink-0 text-emerald-500"
                      strokeWidth={3}
                      aria-hidden
                    />
                    {line}
                  </li>
                ))}
              </ul>
              <div className="mt-auto flex items-center gap-3 rounded-2xl bg-white/70 px-4 py-3">
                <Avatar name={JORDAN.name} isYou className="h-9 w-9 text-[13px]" />
                <div className="min-w-0 text-[14px] leading-snug text-neutral-500">
                  {managerKrs.length ? (
                    <>
                      Moves your manager Priya&apos;s{' '}
                      <span className="whitespace-nowrap font-semibold text-neutral-800">
                        {managerKrs.join(' & ')}
                      </span>
                    </>
                  ) : (
                    'Your manager Priya sees it in the brain.'
                  )}
                </div>
              </div>
            </Glass>
          </Rise>
          <Rise delay={140} className="min-h-0">
            <DiffCard
              result={result}
              indexing={indexing}
              indexingLabel={`Saved to the brain · HydraDB indexing: ${indexing}`}
            />
          </Rise>
        </div>
      ) : (
        <Rise delay={120} className="h-full">
          <Glass className="relative flex h-full flex-col items-center justify-center overflow-hidden p-10 text-center">
            <div
              aria-hidden
              className="pointer-events-none absolute -bottom-32 left-1/2 h-80 w-[640px] -translate-x-1/2 rounded-full bg-violet-200/50 blur-3xl"
            />
            <div className="relative flex h-24 w-24 items-center justify-center rounded-[28px] bg-gradient-to-br from-indigo-500 to-violet-500 text-white shadow-[0_20px_50px_-16px_rgba(99,102,241,0.7)]">
              <GitPullRequest className="h-11 w-11" strokeWidth={1.6} aria-hidden />
            </div>
            {isRunning ? (
              <div
                className="relative mt-10 w-full max-w-[420px] space-y-6"
                role="status"
                aria-live="polite"
              >
                <ol className="space-y-3 text-left">
                  {CLAIM_STEPS.map((label, i) => (
                    <li
                      key={label}
                      className={cn(
                        'flex items-center gap-3 text-[22px] font-medium transition-colors duration-500',
                        i <= stepIndex ? 'text-neutral-900' : 'text-neutral-300',
                      )}
                    >
                      {i < stepIndex ? (
                        <Check className="h-6 w-6 text-emerald-500" strokeWidth={3} aria-hidden />
                      ) : i === stepIndex ? (
                        <Loader2 className="h-6 w-6 animate-spin text-indigo-500" aria-hidden />
                      ) : (
                        <span
                          className="h-6 w-6 rounded-full border-2 border-neutral-200"
                          aria-hidden
                        />
                      )}
                      {label}
                    </li>
                  ))}
                </ol>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-indigo-500/10">
                  <div
                    className="journey-fill h-full w-full rounded-full bg-gradient-to-r from-indigo-500 via-violet-500 to-pink-500"
                    style={{ '--dur': `${CLAIM_STEPS.length * CLAIM_STEP_MS}ms` } as CSSProperties}
                  />
                </div>
              </div>
            ) : (
              <div className="relative mt-10 flex flex-col items-center gap-5">
                <button
                  type="button"
                  onClick={handleClaim}
                  className="group inline-flex h-[72px] items-center gap-3 rounded-full bg-neutral-950 px-10 text-[24px] font-semibold tracking-[-0.01em] text-white shadow-[0_2px_4px_rgba(0,0,0,0.15),0_20px_40px_-12px_rgba(15,23,42,0.55)] transition hover:scale-[1.03] hover:bg-neutral-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-300"
                >
                  {accept.isError ? <RotateCcw className="h-6 w-6" aria-hidden /> : null}
                  {accept.isError ? 'Try again' : `Claim ${roadmapId} & draft the PR`}
                  {accept.isError ? null : (
                    <ArrowRight
                      className="h-6 w-6 transition group-hover:translate-x-1"
                      aria-hidden
                    />
                  )}
                </button>
                {accept.isError ? (
                  <p className="max-w-[440px] text-[16px] text-rose-600">{accept.error.message}</p>
                ) : (
                  <p className="text-[18px] text-neutral-400">
                    Names you owner, saves it to the brain, drafts the code.
                  </p>
                )}
              </div>
            )}
          </Glass>
        </Rise>
      )}
    </StepFrame>
  );
};
