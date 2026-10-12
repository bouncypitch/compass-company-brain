'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { CheckCircle2, ExternalLink, GitPullRequest, History, Loader2, Radar, Sparkles } from 'lucide-react';
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
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { brainApi } from '@/lib/brain-api';
import { cn } from '@/lib/utils';
import { ClipPlayer } from './ClipPlayer';

const CELL = ['bg-muted/40', 'bg-indigo-100', 'bg-indigo-300', 'bg-indigo-600 text-white'];

const SignalChip = ({ signal }: { signal: BrainSignal }) => (
  <a
    href={signal.url}
    target="_blank"
    rel="noreferrer"
    className="inline-flex items-center gap-1 rounded border bg-background px-2 py-0.5 text-[11px] hover:border-indigo-500 hover:text-indigo-700"
    title={signal.summary}
  >
    <span className="font-mono text-muted-foreground">{signal.date}</span>
    <span className="max-w-[260px] truncate">{signal.title}</span>
    <ExternalLink className="h-3 w-3 shrink-0" aria-hidden />
  </a>
);

const Confidence = ({ value }: { value: number }) => (
  <div className="flex items-center gap-2 text-xs text-muted-foreground" aria-label={`Confidence ${Math.round(value * 100)}%`}>
    <div className="h-1.5 w-24 rounded bg-muted">
      <div className="h-1.5 rounded bg-indigo-600" style={{ width: `${Math.round(value * 100)}%` }} />
    </div>
    {Math.round(value * 100)}%
  </div>
);

const Landscape = ({ radar, onPick }: { radar: RadarResult; onPick: (ids: string[], label: string) => void }) => {
  const companies = [...new Set(radar.landscape.map((c) => c.company))];
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] border-separate border-spacing-1 text-xs">
        <thead>
          <tr>
            <th className="text-left font-medium text-muted-foreground">Capability</th>
            {companies.map((c) => (
              <th key={c} className="font-semibold">{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {BRAIN_CAPABILITIES.map((cap) => (
            <tr key={cap}>
              <td className="whitespace-nowrap pr-2 text-muted-foreground">{BRAIN_CAPABILITY_LABELS[cap]}</td>
              {companies.map((company) => {
                const cell = radar.landscape.find((c) => c.capability === cap && c.company === company);
                const n = cell?.signalIds.length ?? 0;
                return (
                  <td key={company} className="p-0">
                    <button
                      type="button"
                      disabled={!n}
                      onClick={() => cell && onPick(cell.signalIds, `${company} · ${BRAIN_CAPABILITY_LABELS[cap]}`)}
                      className={cn('h-8 w-full rounded font-mono transition hover:ring-2 hover:ring-indigo-400 disabled:hover:ring-0', CELL[cell?.strength ?? 0])}
                      aria-label={`${company} ${BRAIN_CAPABILITY_LABELS[cap]}: ${n} signals`}
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
    </div>
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

  return (
    <Card className={cn('border-l-4', gap.urgency === 'high' ? 'border-l-rose-500' : 'border-l-amber-500')}>
      <CardHeader className="pb-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={gap.urgency === 'high' ? 'destructive' : 'secondary'}>{gap.urgency} urgency</Badge>
          <Badge variant="outline">{gap.roadmapItem}</Badge>
          <Badge variant="outline">{gap.owner ? `Owner: ${gap.owner}` : 'No owner'}</Badge>
        </div>
        <CardTitle className="text-lg">{gap.title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <p>{gap.whyItMatters}</p>
        <p className="font-medium">{gap.recommendation}</p>
        <div className="flex flex-wrap gap-1 text-xs">
          {gap.affectedGoals.map((g) => <Badge key={g} variant="teal">{g}</Badge>)}
          {gap.codePaths.map((p) => <code key={p} className="rounded bg-muted px-1.5 py-0.5">{p}</code>)}
        </div>
        <div className="flex flex-wrap gap-1">
          {gap.signalIds.map((id) => signals.get(id)).filter(Boolean).slice(0, 4).map((s) => <SignalChip key={s!.id} signal={s!} />)}
        </div>
        {!result ? (
          <Button onClick={() => accept.mutate()} disabled={accept.isPending}>
            {accept.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <GitPullRequest className="mr-2 h-4 w-4" />}
            {accept.isPending ? 'Accepting and drafting the code change…' : 'Accept and draft the PR'}
          </Button>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" aria-hidden />
              Saved back to the brain as <code className="rounded bg-muted px-1">{result.priorityId}</code>, HydraDB indexing:
              <Badge variant={status.data?.status === 'completed' ? 'teal' : 'secondary'}>{status.data?.status ?? result.indexingStatus}</Badge>
            </div>
            {result.diff.map((f) => (
              <details key={f.path} className="rounded border bg-muted/30" open>
                <summary className="cursor-pointer px-3 py-1.5 font-mono text-xs">{f.path}</summary>
                <pre className="max-h-72 overflow-auto px-3 pb-3 text-[11px] leading-relaxed">
                  {f.patch.split('\n').map((line, i) => (
                    <div key={i} className={cn(line.startsWith('+') && 'bg-emerald-100 text-emerald-900', line.startsWith('-') && 'bg-rose-100 text-rose-900')}>
                      {line || ' '}
                    </div>
                  ))}
                </pre>
              </details>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const MovesList = ({ radar }: { radar: RadarResult }) => {
  const signals = useMemo(() => new Map(radar.signals.map((s) => [s.id, s])), [radar]);
  const clips = useMemo(() => new Map(radar.talkClips.map((c) => [c.id, c])), [radar]);
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {radar.moves.map((m) => (
        <Card key={m.id}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between gap-2">
              <Badge variant="outline">{m.company}</Badge>
              <span className="text-xs text-muted-foreground">{m.horizon}</span>
            </div>
            <CardTitle className="text-base">{m.headline}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>{m.prediction}</p>
            <Confidence value={m.confidence} />
            <p className="text-xs text-muted-foreground">{m.reasoning}</p>
            <div className="flex flex-wrap gap-1">
              {m.signalIds.map((id) => signals.get(id)).filter(Boolean).map((s) => <SignalChip key={s!.id} signal={s!} />)}
            </div>
            {m.talkClipIds.map((id) => clips.get(id)).filter(Boolean).map((c) => <ClipPlayer key={c!.id} clip={c!} />)}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

const TimeMachinePanel = ({ data }: { data: TimeMachineResult }) => (
  <Card className="border-2 border-dashed border-indigo-400">
    <CardHeader>
      <CardTitle className="flex items-center gap-2 text-lg">
        <History className="h-5 w-5" aria-hidden /> Time machine: the brain only saw signals before {data.cutoff}
      </CardTitle>
      <p className="text-sm text-muted-foreground">{data.radar.summary}</p>
    </CardHeader>
    <CardContent className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-2">
        <h3 className="text-sm font-semibold">What it predicted ({data.radar.signals.length} signals)</h3>
        {data.radar.moves.map((m) => (
          <div key={m.id} className="rounded border p-2 text-sm">
            <div className="font-medium">{m.company}: {m.headline}</div>
            <div className="text-xs text-muted-foreground">{m.prediction}</div>
            <Confidence value={m.confidence} />
          </div>
        ))}
      </div>
      <div className="space-y-2">
        <h3 className="text-sm font-semibold">What actually happened after {data.cutoff}</h3>
        {data.reveals.map((r) => (
          <a key={r.url} href={r.url} target="_blank" rel="noreferrer" className="block rounded border border-emerald-400 bg-emerald-50 p-2 text-sm text-emerald-950 hover:bg-emerald-100">
            <div className="font-medium">{r.company}: {r.announcement}</div>
            <div className="font-mono text-xs">{r.date}</div>
            <div className="text-xs">{r.why}</div>
          </a>
        ))}
      </div>
    </CardContent>
  </Card>
);

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

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={() => run.mutate()} disabled={run.isPending}>
          {run.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Radar className="mr-2 h-4 w-4" />}
          {run.isPending ? 'Reading the market…' : data ? 'Re-run radar' : 'Run radar'}
        </Button>
        <Button variant="outline" onClick={() => machine.mutate()} disabled={machine.isPending}>
          {machine.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <History className="mr-2 h-4 w-4" />}
          Time machine
        </Button>
        {data ? (
          <span className="text-xs text-muted-foreground">
            {data.signals.length} verified public signals · {data.cached ? 'cached' : 'live'} · {new Date(data.generatedAt).toLocaleTimeString()}
          </span>
        ) : null}
      </div>

      {machine.data ? <TimeMachinePanel data={machine.data} /> : null}

      {radar.isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
      {!radar.isLoading && !data ? (
        <Card><CardContent className="p-6 text-sm text-muted-foreground">No radar yet. Run it to read 85 public signals from Cursor, Cognition, GitHub Copilot and Replit.</CardContent></Card>
      ) : null}

      {data ? (
        <>
          <Card className="bg-indigo-950 text-indigo-50">
            <CardContent className="flex gap-3 p-5">
              <Sparkles className="h-5 w-5 shrink-0" aria-hidden />
              <p className="text-base">{data.summary}</p>
            </CardContent>
          </Card>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold">Competitive landscape</h2>
            <Landscape radar={data} onPick={(ids, label) => setPicked({ ids, label })} />
            {picked ? (
              <div className="space-y-1 rounded border p-3">
                <div className="text-sm font-medium">{picked.label}</div>
                <div className="flex flex-wrap gap-1">
                  {picked.ids.map((id) => signals.get(id)).filter(Boolean).map((s) => <SignalChip key={s!.id} signal={s!} />)}
                </div>
              </div>
            ) : null}
          </section>

          {data.patterns.length ? (
            <section className="space-y-2">
              <h2 className="text-lg font-semibold">Industry patterns</h2>
              <div className="grid gap-3 md:grid-cols-3">
                {data.patterns.map((p) => (
                  <Card key={p.capability + p.summary}>
                    <CardContent className="space-y-2 p-4 text-sm">
                      <Badge variant="outline">{BRAIN_CAPABILITY_LABELS[p.capability]}</Badge>
                      <p>{p.summary}</p>
                      <p className="text-xs text-muted-foreground">{p.companies.join(' · ')}</p>
                      <Confidence value={p.confidence} />
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          ) : null}

          <section className="space-y-2">
            <h2 className="text-lg font-semibold">Competitor moves</h2>
            <MovesList radar={data} />
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold">What Forgeline should do</h2>
            <div className="grid gap-3">
              {data.gaps.map((g) => <GapCard key={g.id} gap={g} organizationId={organizationId} signals={signals} />)}
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
};
