'use client';

import { use, useState, type ReactNode } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RadarView } from '@/components/brain/RadarView';
import { CompassView, DEFAULT_EMPLOYEE } from '@/components/brain/CompassView';
import { StoryView } from '@/components/brain/StoryView';
import { AskView } from '@/components/brain/AskView';
import { OrgMapView } from '@/components/brain/OrgMapView';
import { BRAIN_FONT } from '@/components/brain/ui';

interface PageProps {
  params: Promise<{ organizationId: string }>;
}

interface TabContext {
  organizationId: string;
  employeeId: string;
  setEmployeeId: (id: string) => void;
}

interface BrainTab {
  value: string;
  label: string;
  render: (ctx: TabContext) => ReactNode;
}

/** Adding a tab is one entry here. */
const TABS: BrainTab[] = [
  { value: 'radar', label: 'Radar', render: ({ organizationId }) => <RadarView organizationId={organizationId} /> },
  {
    value: 'compass',
    label: 'Compass',
    render: ({ organizationId, employeeId, setEmployeeId }) => (
      <CompassView organizationId={organizationId} employeeId={employeeId} onEmployeeChange={setEmployeeId} />
    ),
  },
  { value: 'story', label: 'Story', render: ({ organizationId, employeeId }) => <StoryView organizationId={organizationId} employeeId={employeeId} /> },
  { value: 'ask', label: 'Ask', render: ({ organizationId }) => <AskView organizationId={organizationId} /> },
  { value: 'org', label: 'Org map', render: ({ organizationId }) => <OrgMapView organizationId={organizationId} /> },
];

const Hero = () => (
  <section className="relative overflow-hidden rounded-[2rem] border border-black/[0.05] bg-gradient-to-br from-[#f5f7ff] via-[#fdf2f8] to-[#f0fdfa] px-8 py-10 md:px-14 md:py-11">
    <div aria-hidden className="pointer-events-none absolute -left-20 -top-28 h-80 w-80 rounded-full bg-indigo-300/25 blur-3xl" />
    <div aria-hidden className="pointer-events-none absolute -bottom-32 right-0 h-96 w-96 rounded-full bg-teal-200/30 blur-3xl" />
    <div aria-hidden className="pointer-events-none absolute right-1/3 top-0 h-56 w-56 rounded-full bg-rose-200/25 blur-3xl" />
    <div className="relative animate-in fade-in slide-in-from-bottom-2 fill-mode-both duration-700 motion-reduce:animate-none">
      <p className="text-[13px] font-semibold uppercase tracking-[0.18em] text-neutral-500">Forgeline company brain</p>
      <h1 className="mt-3 bg-gradient-to-br from-neutral-950 via-neutral-800 to-neutral-600 bg-clip-text text-[56px] font-semibold leading-[1.02] tracking-[-0.045em] text-transparent md:text-[68px]">
        Compass
      </h1>
      <p className="mt-4 max-w-2xl text-[19px] leading-snug tracking-[-0.01em] text-neutral-500 md:text-[22px]">
        It watches the market, finds the gaps in our roadmap and code, and shows each person which piece is their promotion.
      </p>
    </div>
  </section>
);

export default function BrainPage({ params }: PageProps) {
  const { organizationId } = use(params);
  const [employeeId, setEmployeeId] = useState(DEFAULT_EMPLOYEE);
  const ctx: TabContext = { organizationId, employeeId, setEmployeeId };

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 text-neutral-900 antialiased md:pl-20" style={BRAIN_FONT}>
      <Hero />
      <Tabs defaultValue={TABS[0].value} className="mt-2">
        <div className="sticky top-16 z-40 flex justify-center py-4">
          <TabsList
            aria-label="Compass views"
            className="h-11 rounded-full border border-black/[0.06] bg-neutral-100/80 p-1 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-12px_rgba(15,23,42,0.18)] backdrop-blur-xl"
          >
            {TABS.map((t) => (
              <TabsTrigger
                key={t.value}
                value={t.value}
                className="h-9 rounded-full px-6 text-[14px] font-medium text-neutral-500 transition-all duration-300 hover:text-neutral-800 data-[state=active]:bg-white data-[state=active]:text-neutral-900 data-[state=active]:shadow-[0_1px_3px_rgba(0,0,0,0.12),0_1px_1px_rgba(0,0,0,0.04)]"
              >
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
        {TABS.map((t) => (
          <TabsContent key={t.value} value={t.value} className="mt-0 pt-2 focus-visible:ring-0 focus-visible:ring-offset-0">
            {t.render(ctx)}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
