'use client';

import { useState, type ChangeEvent } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowRight, Check, ChevronDown, Compass, Loader2, RefreshCw, Target, Users } from 'lucide-react';
import type { CompassResult } from '@app-starter/shared';
import { Button } from '@/components/ui/button';
import { brainApi } from '@/lib/brain-api';
import { cn } from '@/lib/utils';
import { GlassCard, Pill, Reveal, SECONDARY_PILL, SectionHeading } from './ui';

const STATUS_TONE = { met: 'emerald', partial: 'amber', gap: 'rose' } as const;
const STATUS_LABEL = { met: 'Met', partial: 'Partial', gap: 'Gap' } as const;

export const DEFAULT_EMPLOYEE = 'jordan-rivera';

interface CompassViewProps {
  organizationId: string;
  employeeId: string;
  onEmployeeChange: (id: string) => void;
  onLoaded?: (result: CompassResult) => void;
}

const LevelGapTable = ({ data }: { data: CompassResult }) => (
  <GlassCard className="overflow-hidden">
    <div className="hidden grid-cols-[200px_1fr_1fr_110px] gap-6 border-b border-black/[0.05] px-7 py-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-400 md:grid" aria-hidden>
      <div>Dimension</div>
      <div>Next level expects</div>
      <div>Your evidence</div>
      <div className="text-right">Status</div>
    </div>
    <ul>
      {data.levelGaps.map((g) => (
        <li
          key={g.dimension}
          className="grid gap-2 border-b border-black/[0.04] px-7 py-5 text-[14px] leading-relaxed last:border-b-0 md:grid-cols-[200px_1fr_1fr_110px] md:gap-6"
        >
          <div className="font-semibold text-neutral-900">{g.dimension}</div>
          <div className="text-neutral-700">{g.expectation}</div>
          <div className="text-neutral-500">{g.evidence}</div>
          <div className="md:text-right">
            <Pill tone={STATUS_TONE[g.status]}>
              <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />
              {STATUS_LABEL[g.status]}
            </Pill>
          </div>
        </li>
      ))}
    </ul>
  </GlassCard>
);

const OpportunityCard = ({ o }: { o: CompassResult['opportunities'][number] }) => {
  const isTop = o.rank === 1;
  return (
    <GlassCard
      className={cn(
        'relative flex h-full flex-col gap-4 overflow-hidden p-6',
        isTop && 'border-orange-300/60 bg-gradient-to-b from-orange-50/90 via-white/80 to-white/70 shadow-[0_1px_2px_rgba(0,0,0,0.03),0_20px_40px_-20px_rgba(249,115,22,0.35)]',
      )}
    >
      <div className="flex items-center justify-between">
        <span className={cn('text-[40px] font-semibold leading-none tracking-[-0.04em] text-neutral-200', isTop && 'bg-gradient-to-br from-orange-400 to-rose-500 bg-clip-text text-transparent')}>
          {String(o.rank).padStart(2, '0')}
        </span>
        {isTop ? <Pill tone="orange"><Target className="h-3 w-3" aria-hidden />Best bet</Pill> : null}
      </div>
      <h3 className="text-[19px] font-semibold leading-snug tracking-[-0.01em] text-neutral-900">{o.title}</h3>
      <div className="space-y-3 text-[14px] leading-relaxed">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-400">Why you</div>
          <p className="text-neutral-700">{o.whyYou}</p>
        </div>
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-400">Your manager</div>
          <p className="text-neutral-700">{o.managerImpact}</p>
        </div>
      </div>
      <div className="flex items-center gap-1.5 text-[12px] text-neutral-500">
        <span>{o.companyGoal}</span>
        <ArrowRight className="h-3 w-3 shrink-0" aria-hidden />
        <span>{o.deptGoal}</span>
      </div>
      <div className="flex flex-wrap gap-1.5">{o.ladderGapsClosed.map((s) => <Pill key={s} tone="teal">{s}</Pill>)}</div>
      {o.peopleToTalkTo.length ? (
        <div className="text-[13px] text-neutral-600">
          <span className="font-semibold text-neutral-800">Talk to </span>
          {o.peopleToTalkTo.map((p) => `${p.name} (${p.why})`).join('; ')}
        </div>
      ) : null}
      <details className="group mt-auto border-t border-black/[0.05] pt-3 text-[12px]">
        <summary className="flex cursor-pointer list-none items-center gap-1 font-medium text-indigo-600">
          Evidence ({o.evidence.length})
          <ChevronDown className="h-3.5 w-3.5 transition group-open:rotate-180" aria-hidden />
        </summary>
        <ul className="mt-2 space-y-1.5 text-neutral-600">
          {o.evidence.map((e, i) => (
            <li key={i}>
              {e.label} <code className="rounded-md bg-black/[0.04] px-1.5 py-0.5 font-mono text-[11px]">{e.source}</code>
            </li>
          ))}
        </ul>
      </details>
    </GlassCard>
  );
};

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
  const handleEmployeeChange = (e: ChangeEvent<HTMLSelectElement>): void => onEmployeeChange(e.target.value);

  const data = compass.data;
  return (
    <div className="space-y-14">
      <Reveal>
        <SectionHeading
          eyebrow="Career compass"
          title="Your next promotion, mapped to the company"
          description={data ? `${data.cached ? 'Cached' : 'Live'} · ${new Date(data.generatedAt).toLocaleTimeString()}` : undefined}
          action={
            <>
              <label htmlFor="compass-employee" className="sr-only">Coach</label>
              <div className="relative">
                <Users className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" aria-hidden />
                <select
                  id="compass-employee"
                  value={employeeId}
                  onChange={handleEmployeeChange}
                  className="h-10 appearance-none rounded-full border border-black/[0.08] bg-white/80 pl-10 pr-10 text-[14px] font-medium text-neutral-800 shadow-[0_1px_2px_rgba(0,0,0,0.04)] backdrop-blur focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300"
                >
                  {(people.data ?? []).map((p) => (
                    <option key={p.id} value={p.id}>{p.name} · {p.level} · {p.team}</option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" aria-hidden />
              </div>
              <Button variant="outline" onClick={handleRefresh} disabled={isRefreshing || compass.isFetching} className={SECONDARY_PILL}>
                {isRefreshing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                Re-think with latest priorities
              </Button>
            </>
          }
        />
      </Reveal>

      {compass.isLoading || isRefreshing ? (
        <GlassCard className="flex items-center gap-3 p-8 text-[15px] text-neutral-500">
          <Loader2 className="h-5 w-5 animate-spin" aria-hidden /> Reading goals, the ladder, open gaps and this person&apos;s history…
        </GlassCard>
      ) : null}
      {compass.error ? <p className="text-sm text-destructive">{(compass.error as Error).message}</p> : null}

      {data && !isRefreshing ? (
        <>
          <Reveal delay={80}>
            <div className="relative overflow-hidden rounded-3xl border border-orange-200/50 bg-gradient-to-br from-[#fff7ed] via-[#fff1f2] to-[#fdf4ff] p-8 shadow-[0_12px_32px_-16px_rgba(249,115,22,0.25)] md:p-11">
              <div aria-hidden className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-orange-200/40 blur-3xl" />
              <div aria-hidden className="pointer-events-none absolute -bottom-28 left-10 h-64 w-64 rounded-full bg-fuchsia-200/30 blur-3xl" />
              <div className="relative space-y-5">
                <div className="flex flex-wrap items-center gap-2 text-[13px] text-neutral-600">
                  <Compass className="h-4 w-4 text-orange-500" aria-hidden />
                  <span className="font-semibold text-neutral-900">{data.employee.name}</span>
                  <span>{data.employee.title}</span>
                  <Pill className="bg-white/70">{data.employee.level}</Pill>
                  <ArrowRight className="h-3.5 w-3.5 text-orange-500" aria-hidden />
                  <Pill tone="orange" className="bg-orange-500/15">{data.targetLevel}</Pill>
                  {data.employee.managerName ? <span className="text-neutral-500">· manager {data.employee.managerName}</span> : null}
                </div>
                <p className="max-w-5xl text-[24px] font-semibold leading-[1.28] tracking-[-0.022em] text-neutral-900 md:text-[29px]">{data.headline}</p>
              </div>
            </div>
          </Reveal>

          <Reveal delay={160}>
            <section className="space-y-5">
              <SectionHeading eyebrow="The ladder" title={`Where you stand for ${data.targetLevel}`} />
              <LevelGapTable data={data} />
            </section>
          </Reveal>

          <section className="space-y-5">
            <SectionHeading eyebrow="Opportunities" title="Your best promotion bets" description="Work the company needs that also closes your ladder gaps." />
            <div className="grid gap-4 lg:grid-cols-3">
              {data.opportunities.map((o, i) => (
                <Reveal key={o.rank} delay={i * 70}>
                  <OpportunityCard o={o} />
                </Reveal>
              ))}
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-[1.4fr_1fr]">
            <Reveal>
              <GlassCard className="h-full p-7">
                <h3 className="text-[19px] font-semibold tracking-[-0.01em] text-neutral-900">Your 90-day plan</h3>
                <ol className="relative mt-6 space-y-6 border-l border-black/[0.08] pl-7">
                  {data.plan90.map((p, i) => (
                    <li key={p.window} className="relative">
                      <span
                        aria-hidden
                        className={cn(
                          'absolute -left-[35px] top-0.5 flex h-4 w-4 items-center justify-center rounded-full border-2 border-white bg-neutral-300 shadow-[0_0_0_1px_rgba(0,0,0,0.06)]',
                          i === 0 && 'bg-gradient-to-br from-indigo-400 to-violet-500',
                        )}
                      />
                      <div className="text-[12px] font-semibold uppercase tracking-[0.12em] text-indigo-500/90">{p.window}</div>
                      <p className="mt-1 text-[15px] leading-relaxed text-neutral-700">{p.milestone}</p>
                    </li>
                  ))}
                </ol>
              </GlassCard>
            </Reveal>
            <Reveal delay={80}>
              <GlassCard className="h-full p-7">
                <h3 className="text-[19px] font-semibold tracking-[-0.01em] text-neutral-900">What your manager is measured on</h3>
                <ul className="mt-6 space-y-3.5">
                  {data.managerMeasuredOn.map((m) => (
                    <li key={m} className="flex gap-3 text-[15px] leading-relaxed text-neutral-700">
                      <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-teal-500/10 text-teal-600">
                        <Check className="h-3 w-3" aria-hidden />
                      </span>
                      {m}
                    </li>
                  ))}
                </ul>
              </GlassCard>
            </Reveal>
          </section>
        </>
      ) : null}
    </div>
  );
};
