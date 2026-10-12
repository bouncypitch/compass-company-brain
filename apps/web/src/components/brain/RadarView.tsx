'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ArrowUpRight, Check, CheckCircle2, FileCode2, GitPullRequest, History, Loader2, Radar, Sparkles } from 'lucide-react';
import {
  BRAIN_CAPABILITIES,
  BRAIN_CAPABILITY_LABELS,
  type AcceptRecommendationResult,
  type BrainSignal,
  type RadarResult,
  type StrategicGap,
  type TimeMachineResult,
} from '@app-starter/shared';
import { Button } from '@/components/ui/button';
import { brainApi } from '@/lib/brain-api';
import { cn } from '@/lib/utils';
import { ClipPlayer } from './ClipPlayer';
import { ConfidenceBar, GlassCard, Pill, PRIMARY_PILL, Reveal, SECONDARY_PILL, SectionHeading, StatPill, formatShortDate } from './ui';

/** Soft indigo scale indexed by landscape strength (0 = no signal). */
const CELL = [
  'bg-black/[0.025] text-transparent',
  'bg-indigo-50 text-indigo-400',
  'bg-indigo-200/70 text-indigo-700',
  'bg-gradient-to-br from-indigo-400 to-violet-500 text-white shadow-[0_4px_12px_-4px_rgba(99,102,241,0.6)]',
];

const URGENCY_TONE = { high: 'rose', medium: 'amber', low: 'neutral' } as const;
const URGENCY_WASH = {
  high: 'from-rose-100/70 via-white/0',
  medium: 'from-amber-100/70 via-white/0',
  low: 'from-slate-100/70 via-white/0',
} as const;

/** Splits the summary at its first clause so the lead can carry the gradient accent. */
const splitLead = (text: string): [string, string] => {
  const idx = text.search(/[:.](\s|$)/);
  if (idx < 0 || idx > 160) return ['', text];
  return [text.slice(0, idx + 1), text.slice(idx + 1)];
};

const SignalChip = ({ signal }: { signal: BrainSignal }) => (
  <a
    href={signal.url}
    target="_blank"
    rel="noreferrer"
    className="group inline-flex max-w-full items-center gap-1.5 rounded-full border border-black/[0.06] bg-white/80 px-3 py-1 text-[12px] text-neutral-700 transition hover:border-indigo-200 hover:text-indigo-700"
    title={signal.summary}
  >
    <span className="tabular-nums text-neutral-400">{signal.date}</span>
    <span className="max-w-[260px] truncate">{signal.title}</span>
    <ArrowUpRight className="h-3 w-3 shrink-0 text-neutral-400 transition group-hover:text-indigo-600" aria-hidden />
  </a>
);

interface LandscapeProps {
  radar: RadarResult;
  pickedLabel: string | null;
  onPick: (ids: string[], label: string) => void;
}

const Landscape = ({ radar, pickedLabel, onPick }: LandscapeProps) => {
  const companies = [...new Set(radar.landscape.map((c) => c.company))];
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[680px] table-fixed border-separate border-spacing-1.5 text-[13px]">
        <thead>
          <tr>
            <th className="w-44 text-left text-[12px] font-medium text-neutral-400">Capability</th>
            {companies.map((c) => (
              <th key={c} className="pb-1 text-[13px] font-semibold text-neutral-800">{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {BRAIN_CAPABILITIES.map((cap) => (
            <tr key={cap}>
              <td className="whitespace-nowrap pr-3 text-neutral-500">{BRAIN_CAPABILITY_LABELS[cap]}</td>
              {companies.map((company) => {
                const cell = radar.landscape.find((c) => c.capability === cap && c.company === company);
                const n = cell?.signalIds.length ?? 0;
                const label = `${company} · ${BRAIN_CAPABILITY_LABELS[cap]}`;
                const handleClick = (): void => {
                  if (cell) onPick(cell.signalIds, label);
                };
                return (
                  <td key={company} className="p-0">
                    <button
                      type="button"
                      disabled={!n}
                      onClick={handleClick}
                      aria-pressed={pickedLabel === label}
                      className={cn(
                        'h-10 w-full rounded-xl text-[13px] font-medium tabular-nums transition duration-200 hover:-translate-y-px hover:ring-2 hover:ring-indigo-300/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 disabled:cursor-default disabled:hover:translate-y-0 disabled:hover:ring-0 motion-reduce:transition-none',
                        CELL[cell?.strength ?? 0],
                        pickedLabel === label && 'ring-2 ring-neutral-900/70',
                      )}
                      aria-label={`${label}: ${n} signals`}
                    >
                      {n || ''}
                    </button>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-4 flex items-center justify-end gap-2 text-[11px] text-neutral-400" aria-hidden>
        Fewer signals
        {CELL.map((c, i) => (
          <span key={i} className={cn('h-3 w-6 rounded-md', c)} />
        ))}
        More
      </div>
    </div>
  );
};

const DiffCard = ({ file }: { file: AcceptRecommendationResult['diff'][number] }) => {
  const lines = file.patch.split('\n');
  const added = lines.filter((l) => l.startsWith('+') && !l.startsWith('+++')).length;
  const removed = lines.filter((l) => l.startsWith('-') && !l.startsWith('---')).length;
  return (
    <details className="group overflow-hidden rounded-2xl border border-black/[0.07] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.03)]" open>
      <summary className="flex cursor-pointer list-none items-center gap-2 border-b border-black/[0.05] bg-neutral-50/80 px-4 py-2.5 text-[12px]">
        <span className="flex gap-1.5" aria-hidden>
          <span className="h-2.5 w-2.5 rounded-full bg-black/10" />
          <span className="h-2.5 w-2.5 rounded-full bg-black/10" />
          <span className="h-2.5 w-2.5 rounded-full bg-black/10" />
        </span>
        <FileCode2 className="ml-2 h-3.5 w-3.5 text-neutral-400" aria-hidden />
        <span className="truncate font-mono text-neutral-700">{file.path}</span>
        <span className="ml-auto font-mono tabular-nums text-emerald-600">+{added}</span>
        <span className="font-mono tabular-nums text-rose-500">−{removed}</span>
      </summary>
      <pre className="max-h-80 overflow-auto py-2 font-mono text-[12px] leading-[1.65]">
        {lines.map((line, i) => (
          <div
            key={i}
            className={cn(
              'px-4 text-neutral-600',
              line.startsWith('+') && 'bg-emerald-500/[0.08] text-emerald-800',
              line.startsWith('-') && 'bg-rose-500/[0.08] text-rose-800',
              line.startsWith('@@') && 'text-indigo-500/80',
            )}
          >
            {line || ' '}
          </div>
        ))}
      </pre>
    </details>
  );
};

const GapCard = ({ gap, organizationId, signals }: { gap: StrategicGap; organizationId: string; signals: Map<string, BrainSignal> }) => {
  const queryClient = useQueryClient();
  const [result, setResult] = useState<AcceptRecommendationResult | null>(null);
  const accept = useMutation({
    mutationFn: () => brainApi.accept(organizationId, gap.id),
    onSuccess: (r) => {
      setResult(r);
      toast.success('Accepted. The brain is learning the new priority.');
      void queryClient.invalidateQueries({ queryKey: ['brain-compass'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const status = useQuery({
    queryKey: ['brain-priority', organizationId, result?.priorityId],
    queryFn: () => brainApi.priorityStatus(organizationId, result!.priorityId),
    enabled: !!result,
    refetchInterval: (q) => (q.state.data?.status === 'completed' ? false : 3000),
  });
  const handleAccept = (): void => accept.mutate();
  const isIndexed = status.data?.status === 'completed';
  const gapSignals = gap.signalIds.map((id) => signals.get(id)).filter((s): s is BrainSignal => !!s).slice(0, 4);

  return (
    <GlassCard className="relative overflow-hidden p-7 md:p-9">
      <div aria-hidden className={cn('pointer-events-none absolute inset-0 bg-gradient-to-br to-transparent opacity-80', URGENCY_WASH[gap.urgency])} />
      <div className="relative space-y-6">
        <div className="flex flex-wrap items-center gap-2">
          <Pill tone={URGENCY_TONE[gap.urgency]}>
            <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />
            {gap.urgency} urgency
          </Pill>
          <Pill>{gap.roadmapItem}</Pill>
          <Pill tone={gap.owner ? 'neutral' : 'amber'}>{gap.owner ? `Owner: ${gap.owner}` : 'No owner'}</Pill>
        </div>
        <h3 className="max-w-4xl text-[26px] font-semibold leading-tight tracking-[-0.02em] text-neutral-900 md:text-[30px]">{gap.title}</h3>
        <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
          <div className="space-y-4 text-[15px] leading-relaxed">
            <p className="text-neutral-600">{gap.whyItMatters}</p>
            <div className="rounded-2xl border border-indigo-500/10 bg-indigo-50/50 p-4 text-neutral-800">
              <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-indigo-500">Recommendation</div>
              {gap.recommendation}
            </div>
          </div>
          <div className="space-y-4 text-[13px]">
            {gap.affectedGoals.length ? (
              <div className="space-y-2">
                <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-400">Goals at risk</div>
                <div className="flex flex-wrap gap-1.5">{gap.affectedGoals.map((g) => <Pill key={g} tone="teal">{g}</Pill>)}</div>
              </div>
            ) : null}
            {gap.codePaths.length ? (
              <div className="space-y-2">
                <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-400">Code</div>
                <div className="flex flex-wrap gap-1.5">
                  {gap.codePaths.map((p) => <code key={p} className="rounded-lg bg-black/[0.04] px-2 py-0.5 font-mono text-[12px] text-neutral-700">{p}</code>)}
                </div>
              </div>
            ) : null}
            {gapSignals.length ? (
              <div className="space-y-2">
                <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-400">Evidence</div>
                <div className="flex flex-wrap gap-1.5">{gapSignals.map((s) => <SignalChip key={s.id} signal={s} />)}</div>
              </div>
            ) : null}
          </div>
        </div>
        {!result ? (
          <Button onClick={handleAccept} disabled={accept.isPending} className={cn(PRIMARY_PILL, 'h-11 px-6 text-[15px]')}>
            {accept.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <GitPullRequest className="mr-2 h-4 w-4" />}
            {accept.isPending ? 'Accepting and drafting the code change…' : 'Accept & draft PR'}
          </Button>
        ) : (
          <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-500 motion-reduce:animate-none">
            <div className="flex flex-wrap items-center gap-2 text-[14px] text-neutral-700">
              <CheckCircle2 className="h-5 w-5 text-emerald-500" aria-hidden />
              Saved back to the brain as
              <code className="rounded-lg bg-black/[0.04] px-2 py-0.5 font-mono text-[12px]">{result.priorityId}</code>
              <span className="text-neutral-400">·</span> HydraDB indexing
              <Pill tone={isIndexed ? 'emerald' : 'neutral'} className="capitalize">
                {!isIndexed ? <Loader2 className="h-3 w-3 animate-spin" aria-hidden /> : null}
                {status.data?.status ?? result.indexingStatus}
              </Pill>
            </div>
            {result.diff.map((f) => <DiffCard key={f.path} file={f} />)}
          </div>
        )}
      </div>
    </GlassCard>
  );
};

const MovesList = ({ radar }: { radar: RadarResult }) => {
  const signals = useMemo(() => new Map(radar.signals.map((s) => [s.id, s])), [radar]);
  const clips = useMemo(() => new Map(radar.talkClips.map((c) => [c.id, c])), [radar]);
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {radar.moves.map((m, i) => (
        <Reveal key={m.id} delay={i * 60}>
          <GlassCard className="flex h-full flex-col gap-4 p-6">
            <div className="flex items-center justify-between gap-2">
              <Pill tone="indigo">{m.company}</Pill>
              <span className="text-[12px] text-neutral-400">{m.horizon}</span>
            </div>
            <h3 className="text-[19px] font-semibold leading-snug tracking-[-0.01em] text-neutral-900">{m.headline}</h3>
            <p className="text-[14px] leading-relaxed text-neutral-600">{m.prediction}</p>
            <ConfidenceBar value={m.confidence} />
            <p className="text-[13px] leading-relaxed text-neutral-400">{m.reasoning}</p>
            <div className="mt-auto flex flex-wrap gap-1.5">
              {m.signalIds.map((id) => signals.get(id)).filter((s): s is BrainSignal => !!s).map((s) => <SignalChip key={s.id} signal={s} />)}
            </div>
            {m.talkClipIds.map((id) => clips.get(id)).filter((c) => !!c).map((c) => <ClipPlayer key={c!.id} clip={c!} />)}
          </GlassCard>
        </Reveal>
      ))}
    </div>
  );
};

const TimeMachinePanel = ({ data }: { data: TimeMachineResult }) => {
  const cutoff = formatShortDate(data.cutoff);
  const revealed = new Set(data.reveals.map((r) => r.company));
  const predicted = new Set(data.radar.moves.map((m) => m.company));
  return (
    <Reveal>
      <GlassCard className="relative overflow-hidden p-7 md:p-9">
        <div aria-hidden className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-violet-200/40 blur-3xl" />
        <div className="relative space-y-6">
          <SectionHeading
            eyebrow="Time machine"
            title={<span className="flex items-center gap-3"><History className="h-7 w-7 text-violet-500" aria-hidden />The brain only saw signals before {cutoff}</span>}
            description={data.radar.summary}
          />
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-3">
              <div className="flex items-baseline justify-between">
                <h3 className="text-[15px] font-semibold text-neutral-900">Predicted (before {cutoff})</h3>
                <span className="text-[12px] text-neutral-400">{data.radar.signals.length} signals</span>
              </div>
              {data.radar.moves.map((m) => (
                <div key={m.id} className="space-y-2 rounded-2xl border border-black/[0.06] bg-white/70 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="text-[14px] font-medium text-neutral-900">{m.company}: {m.headline}</div>
                    {revealed.has(m.company) ? <Pill tone="emerald"><Check className="h-3 w-3" aria-hidden />Matched</Pill> : null}
                  </div>
                  <div className="text-[13px] leading-relaxed text-neutral-500">{m.prediction}</div>
                  <ConfidenceBar value={m.confidence} />
                </div>
              ))}
            </div>
            <div className="space-y-3">
              <div className="flex items-baseline justify-between">
                <h3 className="text-[15px] font-semibold text-neutral-900">What actually shipped</h3>
                <span className="text-[12px] text-neutral-400">What actually happened after {cutoff}</span>
              </div>
              {data.reveals.map((r) => (
                <a
                  key={r.url}
                  href={r.url}
                  target="_blank"
                  rel="noreferrer"
                  className="group flex gap-3 rounded-2xl border border-emerald-500/15 bg-gradient-to-br from-emerald-50/80 to-teal-50/40 p-4 transition hover:border-emerald-500/30"
                >
                  <span
                    className={cn(
                      'mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full',
                      predicted.has(r.company) ? 'bg-emerald-500 text-white' : 'bg-black/[0.06] text-neutral-400',
                    )}
                    role="img"
                    aria-label={predicted.has(r.company) ? 'Predicted' : 'Not predicted'}
                  >
                    <Check className="h-3.5 w-3.5" aria-hidden />
                  </span>
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-1 text-[14px] font-medium text-neutral-900">
                      {r.company}: {r.announcement}
                      <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-neutral-400 group-hover:text-emerald-600" aria-hidden />
                    </div>
                    <div className="text-[12px] tabular-nums text-emerald-700/80">{r.date}</div>
                    <div className="text-[13px] leading-relaxed text-neutral-600">{r.why}</div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </div>
      </GlassCard>
    </Reveal>
  );
};

const SummaryCard = ({ radar }: { radar: RadarResult }) => {
  const [lead, rest] = splitLead(radar.summary);
  const companies = new Set(radar.landscape.map((c) => c.company)).size;
  return (
    <GlassCard className="relative overflow-hidden p-8 md:p-11">
      <div aria-hidden className="pointer-events-none absolute -right-32 -top-32 h-80 w-80 rounded-full bg-indigo-200/40 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -bottom-40 left-1/4 h-80 w-80 rounded-full bg-rose-100/50 blur-3xl" />
      <div className="relative">
        <div className="mb-5 flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.16em] text-indigo-500/80">
          <Sparkles className="h-4 w-4" aria-hidden /> This week&apos;s read
        </div>
        <p className="text-[22px] font-medium leading-[1.4] tracking-[-0.015em] text-neutral-800 md:text-[23px]">
          {lead ? <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-rose-500 bg-clip-text font-semibold text-transparent">{lead}</span> : null}
          {rest}
        </p>
        <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatPill value={radar.signals.length} label="verified public signals" />
          <StatPill value={companies} label="competitors watched" />
          <StatPill value={radar.moves.length} label="predicted moves" />
          <StatPill value={radar.gaps.length} label="gaps for Forgeline" />
        </div>
      </div>
    </GlassCard>
  );
};

export const RadarView = ({ organizationId }: { organizationId: string }) => {
  const queryClient = useQueryClient();
  const [picked, setPicked] = useState<{ ids: string[]; label: string } | null>(null);
  const radar = useQuery({ queryKey: ['brain-radar', organizationId], queryFn: () => brainApi.getRadar(organizationId) });
  const run = useMutation({
    mutationFn: () => brainApi.runRadar(organizationId),
    onSuccess: (r) => queryClient.setQueryData(['brain-radar', organizationId], r),
    onError: (e: Error) => toast.error(e.message),
  });
  const machine = useMutation({ mutationFn: () => brainApi.timeMachine(organizationId), onError: (e: Error) => toast.error(e.message) });
  const data = radar.data;
  const signals = useMemo(() => new Map((data?.signals ?? []).map((s) => [s.id, s])), [data]);

  const handleRun = (): void => run.mutate();
  const handleTimeMachine = (): void => machine.mutate();
  const handlePick = (ids: string[], label: string): void => setPicked({ ids, label });

  return (
    <div className="space-y-14">
      <Reveal>
        <SectionHeading
          eyebrow="Market radar"
          title="What the market is telling us"
          description={
            data
              ? `${data.signals.length} verified public signals · ${data.cached ? 'cached' : 'live'} · ${new Date(data.generatedAt).toLocaleTimeString()}`
              : 'Public signals from Cursor, Cognition, GitHub Copilot and Replit.'
          }
          action={
            <>
              <Button variant="outline" onClick={handleTimeMachine} disabled={machine.isPending} className={SECONDARY_PILL}>
                {machine.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <History className="mr-2 h-4 w-4" />}
                Time machine
              </Button>
              <Button onClick={handleRun} disabled={run.isPending} className={PRIMARY_PILL}>
                {run.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Radar className="mr-2 h-4 w-4" />}
                {run.isPending ? 'Reading the market…' : data ? 'Re-run radar' : 'Run radar'}
              </Button>
            </>
          }
        />
      </Reveal>

      {machine.data ? <TimeMachinePanel data={machine.data} /> : null}

      {radar.isLoading ? (
        <GlassCard className="flex items-center gap-3 p-8 text-[15px] text-neutral-500">
          <Loader2 className="h-5 w-5 animate-spin" aria-hidden /> Loading the radar…
        </GlassCard>
      ) : null}
      {!radar.isLoading && !data ? (
        <GlassCard className="p-10 text-center text-[15px] text-neutral-500">
          No radar yet. Run it to read 85 public signals from Cursor, Cognition, GitHub Copilot and Replit.
        </GlassCard>
      ) : null}

      {data ? (
        <>
          <Reveal delay={80}>
            <SummaryCard radar={data} />
          </Reveal>

          <Reveal delay={160}>
            <section className="space-y-5">
              <SectionHeading eyebrow="Landscape" title="Competitive landscape" description="Signal density by capability. Tap a cell to see the evidence." />
              <GlassCard className="p-6 md:p-8">
                <Landscape radar={data} pickedLabel={picked?.label ?? null} onPick={handlePick} />
                {picked ? (
                  <div className="mt-6 space-y-3 border-t border-black/[0.05] pt-5 animate-in fade-in duration-300 motion-reduce:animate-none">
                    <div className="text-[14px] font-semibold text-neutral-900">{picked.label}</div>
                    <div className="flex flex-wrap gap-1.5">
                      {picked.ids.map((id) => signals.get(id)).filter((s): s is BrainSignal => !!s).map((s) => <SignalChip key={s.id} signal={s} />)}
                    </div>
                  </div>
                ) : null}
              </GlassCard>
            </section>
          </Reveal>

          {data.patterns.length ? (
            <section className="space-y-5">
              <SectionHeading eyebrow="Patterns" title="Industry patterns" description="Where several competitors are converging at once." />
              <div className="grid gap-4 md:grid-cols-3">
                {data.patterns.map((p, i) => (
                  <Reveal key={p.capability + p.summary} delay={i * 60}>
                    <GlassCard className="flex h-full flex-col gap-3 p-6">
                      <Pill tone="violet" className="w-fit">{BRAIN_CAPABILITY_LABELS[p.capability]}</Pill>
                      <p className="text-[15px] leading-relaxed text-neutral-800">{p.summary}</p>
                      <p className="mt-auto text-[12px] text-neutral-400">{p.companies.join(' · ')}</p>
                      <ConfidenceBar value={p.confidence} />
                    </GlassCard>
                  </Reveal>
                ))}
              </div>
            </section>
          ) : null}

          <section className="space-y-5">
            <SectionHeading eyebrow="Predictions" title="Competitor moves" description="What each competitor is likely to ship next, and why." />
            <MovesList radar={data} />
          </section>

          <section className="space-y-5">
            <SectionHeading eyebrow="Action" title="What Forgeline should do" description="Gaps in our roadmap and code, ranked by urgency." />
            <div className="grid gap-5">
              {data.gaps.map((g, i) => (
                <Reveal key={g.id} delay={i * 80}>
                  <GapCard gap={g} organizationId={organizationId} signals={signals} />
                </Reveal>
              ))}
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
};
