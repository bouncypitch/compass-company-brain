'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Compass, Loader2, RefreshCw, Users } from 'lucide-react';
import type { CompassResult } from '@app-starter/shared';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { brainApi } from '@/lib/brain-api';
import { cn } from '@/lib/utils';

const STATUS_STYLE = { met: 'bg-emerald-100 text-emerald-900', partial: 'bg-amber-100 text-amber-900', gap: 'bg-rose-100 text-rose-900' } as const;

export const DEFAULT_EMPLOYEE = 'jordan-rivera';

interface CompassViewProps {
  organizationId: string;
  employeeId: string;
  onEmployeeChange: (id: string) => void;
  onLoaded?: (result: CompassResult) => void;
}

export const CompassView = ({ organizationId, employeeId, onEmployeeChange }: CompassViewProps) => {
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const people = useQuery({ queryKey: ['brain-people', organizationId], queryFn: () => brainApi.people(organizationId) });
  const compass = useQuery({
    queryKey: ['brain-compass', organizationId, employeeId],
    queryFn: () => brainApi.compass(organizationId, employeeId),
    staleTime: Infinity,
  });

  const handleRefresh = async (): Promise<void> => {
    setIsRefreshing(true);
    try {
      const fresh = await brainApi.compass(organizationId, employeeId, true);
      queryClient.setQueryData(['brain-compass', organizationId, employeeId], fresh);
    } finally {
      setIsRefreshing(false);
    }
  };

  const data = compass.data;
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <label htmlFor="compass-employee" className="text-sm font-medium">
          <Users className="mr-1 inline h-4 w-4" aria-hidden /> Coach
        </label>
        <select
          id="compass-employee"
          value={employeeId}
          onChange={(e) => onEmployeeChange(e.target.value)}
          className="rounded-md border bg-background px-3 py-2 text-sm"
        >
          {(people.data ?? []).map((p) => (
            <option key={p.id} value={p.id}>{p.name} · {p.level} · {p.team}</option>
          ))}
        </select>
        <Button variant="outline" onClick={handleRefresh} disabled={isRefreshing || compass.isFetching}>
          {isRefreshing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
          Re-think with latest priorities
        </Button>
        {data ? <span className="text-xs text-muted-foreground">{data.cached ? 'cached' : 'live'} · {new Date(data.generatedAt).toLocaleTimeString()}</span> : null}
      </div>

      {compass.isLoading || isRefreshing ? (
        <Card><CardContent className="flex items-center gap-2 p-6 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Reading goals, the ladder, open gaps and this person&apos;s history…</CardContent></Card>
      ) : null}
      {compass.error ? <p className="text-sm text-destructive">{(compass.error as Error).message}</p> : null}

      {data && !isRefreshing ? (
        <>
          <Card className="bg-orange-50 border-orange-300">
            <CardContent className="flex gap-3 p-5">
              <Compass className="h-6 w-6 shrink-0 text-orange-600" aria-hidden />
              <div>
                <div className="text-sm text-orange-900">
                  {data.employee.name} · {data.employee.title} ({data.employee.level}) → {data.targetLevel}
                  {data.employee.managerName ? ` · manager ${data.employee.managerName}` : ''}
                </div>
                <p className="text-lg font-semibold text-orange-950">{data.headline}</p>
              </div>
            </CardContent>
          </Card>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold">Where you stand for {data.targetLevel}</h2>
            <div className="overflow-x-auto rounded border">
              <table className="w-full min-w-[640px] text-sm">
                <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
                  <tr><th className="p-2">Dimension</th><th className="p-2">Next level expects</th><th className="p-2">Your evidence</th><th className="p-2">Status</th></tr>
                </thead>
                <tbody>
                  {data.levelGaps.map((g) => (
                    <tr key={g.dimension} className="border-t align-top">
                      <td className="p-2 font-medium">{g.dimension}</td>
                      <td className="p-2">{g.expectation}</td>
                      <td className="p-2 text-muted-foreground">{g.evidence}</td>
                      <td className="p-2"><span className={cn('rounded px-2 py-0.5 text-xs font-semibold', STATUS_STYLE[g.status])}>{g.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold">Your best promotion bets</h2>
            <div className="grid gap-3 lg:grid-cols-3">
              {data.opportunities.map((o) => (
                <Card key={o.rank} className={cn(o.rank === 1 && 'border-2 border-orange-400')}>
                  <CardHeader className="pb-2">
                    <Badge variant={o.rank === 1 ? 'default' : 'secondary'} className="w-fit">#{o.rank}</Badge>
                    <CardTitle className="text-base">{o.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <p><span className="font-semibold">Why you: </span>{o.whyYou}</p>
                    <p><span className="font-semibold">Your manager: </span>{o.managerImpact}</p>
                    <p className="text-xs text-muted-foreground">{o.companyGoal} → {o.deptGoal}</p>
                    <div className="flex flex-wrap gap-1">{o.ladderGapsClosed.map((s) => <Badge key={s} variant="teal">{s}</Badge>)}</div>
                    {o.peopleToTalkTo.length ? (
                      <div className="text-xs"><span className="font-semibold">Talk to: </span>{o.peopleToTalkTo.map((p) => `${p.name} (${p.why})`).join('; ')}</div>
                    ) : null}
                    <details className="text-xs">
                      <summary className="cursor-pointer text-indigo-700">Evidence ({o.evidence.length})</summary>
                      <ul className="mt-1 space-y-0.5">{o.evidence.map((e, i) => <li key={i}>{e.label} <code className="rounded bg-muted px-1">{e.source}</code></li>)}</ul>
                    </details>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          <section className="grid gap-3 md:grid-cols-2">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base">Your 90-day plan</CardTitle></CardHeader>
              <CardContent>
                <ol className="space-y-2 text-sm">
                  {data.plan90.map((p) => <li key={p.window}><span className="font-semibold">{p.window}: </span>{p.milestone}</li>)}
                </ol>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base">What your manager is measured on</CardTitle></CardHeader>
              <CardContent>
                <ul className="list-disc space-y-1 pl-5 text-sm">{data.managerMeasuredOn.map((m) => <li key={m}>{m}</li>)}</ul>
              </CardContent>
            </Card>
          </section>
        </>
      ) : null}
    </div>
  );
};
