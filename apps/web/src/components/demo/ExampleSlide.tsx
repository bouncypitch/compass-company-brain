'use client';

import { ArrowRight, GitPullRequest, Radar, TriangleAlert, TrendingUp, type LucideIcon } from 'lucide-react';
import { useDemo } from './DemoContext';
import { CompanyDot, Glass, Rise, SlideFrame, formatDate, type SlideProps } from './primitives';

interface StepProps {
  icon: LucideIcon;
  tone: string;
  kicker: string;
  title: string;
  detail: string;
  chip?: string;
  delay: number;
  company?: string;
}

const Step = ({ icon: Icon, tone, kicker, title, detail, chip, delay, company }: StepProps) => (
  <Rise delay={delay} className="min-w-0 flex-1">
    <Glass className="flex h-[420px] flex-col gap-5 p-8">
      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-white shadow-lg" style={{ background: tone }}>
        <Icon className="h-7 w-7" aria-hidden />
      </div>
      <p className="flex items-center gap-2 text-[14px] font-semibold uppercase tracking-[0.16em] text-neutral-400">
        {company ? <CompanyDot company={company} /> : null}
        {kicker}
      </p>
      <p className="text-[27px] font-semibold leading-[1.15] tracking-[-0.02em] text-neutral-950">{title}</p>
      <p className="text-[17px] leading-snug text-neutral-500">{detail}</p>
      {chip ? (
        <span className="mt-auto w-fit rounded-full bg-neutral-900/[0.05] max-w-full truncate px-3.5 py-1.5 font-mono text-[13px] text-neutral-700">{chip}</span>
      ) : null}
    </Glass>
  </Rise>
);

const Arrow = ({ delay }: { delay: number }) => (
  <Rise delay={delay} className="flex shrink-0 items-center">
    <ArrowRight className="h-8 w-8 text-indigo-300" aria-hidden />
  </Rise>
);

/** One concrete, true example from the data, end to end, before explaining how it works. */
export const ExampleSlide = (_props: SlideProps) => {
  const { radar, compass } = useDemo();
  const signal = radar.data?.signals.find((s) => s.id === 'copilot-20') ?? radar.data?.signals.find((s) => s.capability === 'codebase_memory');
  const gap = radar.data?.gaps[0];
  const blocked = gap?.affectedGoals.filter((g) => g.includes('KR')).length ?? 4;
  const employee = compass.data?.employee;
  return (
    <SlideFrame eyebrow="A real example" title="Monday, 9:00 a.m.">
      <div className="flex flex-1 items-center gap-4">
        <Step
          delay={100}
          icon={Radar}
          tone="linear-gradient(135deg,#6366f1,#8b5cf6)"
          company={signal?.company ?? 'GitHub Copilot'}
          kicker={signal ? formatDate(signal.date) : 'Competitor'}
          title={signal?.title ?? 'Copilot ships cross-agent memory'}
          detail="A competitor ships persistent codebase memory."
          chip="public signal · cited"
        />
        <Arrow delay={250} />
        <Step
          delay={350}
          icon={TriangleAlert}
          tone="linear-gradient(135deg,#f43f5e,#fb7185)"
          kicker="Our roadmap"
          title={`${gap?.roadmapItem.split(/\s[—-]\s/)[0] ?? 'R-14 Agent memory'} has no owner`}
          detail={`Blocks ${blocked} KRs and Halvorsen's $610K renewal.`}
          chip="UNOWNED"
        />
        <Arrow delay={500} />
        <Step
          delay={600}
          icon={GitPullRequest}
          tone="linear-gradient(135deg,#0ea5e9,#22d3ee)"
          kicker="One click"
          title="Compass drafts the pull request"
          detail="Writes the decision back into HydraDB."
          chip="src/memory/memoryStore.ts"
        />
        <Arrow delay={750} />
        <Step
          delay={850}
          icon={TrendingUp}
          tone="linear-gradient(135deg,#f97316,#ec4899)"
          kicker={employee ? `${employee.name} · ${employee.level}` : 'Jordan Rivera · L4'}
          title="…and it's Jordan's path to Staff"
          detail="Code Jordan owns. Goals Jordan's manager is measured on."
          chip="L4 → L5"
        />
      </div>
    </SlideFrame>
  );
};
