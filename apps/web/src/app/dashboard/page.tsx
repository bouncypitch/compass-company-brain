'use client';

import Link from 'next/link';
import { ArrowRight, BrainCircuit, Presentation, type LucideIcon } from 'lucide-react';

interface EntryProps {
  href: string;
  icon: LucideIcon;
  kicker: string;
  title: string;
  description: string;
  gradient: string;
}

const Entry = ({ href, icon: Icon, kicker, title, description, gradient }: EntryProps) => (
  <Link
    href={href}
    className="group flex flex-col gap-6 rounded-3xl border border-black/[0.06] bg-white/70 p-10 shadow-[0_1px_2px_rgba(0,0,0,0.03),0_24px_60px_-30px_rgba(15,23,42,0.25)] backdrop-blur-xl transition hover:-translate-y-0.5 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
  >
    <div className="flex h-16 w-16 items-center justify-center rounded-2xl text-white shadow-lg" style={{ background: gradient }}>
      <Icon className="h-8 w-8" aria-hidden />
    </div>
    <div>
      <p className="text-[13px] font-semibold uppercase tracking-[0.18em] text-neutral-400">{kicker}</p>
      <p className="mt-2 text-[34px] font-semibold leading-tight tracking-[-0.03em] text-neutral-950">{title}</p>
      <p className="mt-3 text-[17px] leading-relaxed text-neutral-500">{description}</p>
    </div>
    <span className="mt-auto inline-flex items-center gap-2 text-[15px] font-medium text-indigo-600">
      Open <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" aria-hidden />
    </span>
  </Link>
);

/** Post-login home: the two ways into Compass. */
export default function DashboardPage() {
  return (
    <div
      className="relative -mx-8 -mt-6 min-h-[calc(100vh-4rem)] px-8 py-16 md:pl-24"
      style={{
        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", Inter, sans-serif',
        background:
          'radial-gradient(900px 500px at 10% 0%, #e9ecff 0%, transparent 60%), radial-gradient(800px 500px at 95% 10%, #fde7f3 0%, transparent 55%), radial-gradient(900px 600px at 70% 110%, #dcfaf1 0%, transparent 60%), #fbfbfd',
      }}
    >
      <div className="mx-auto max-w-5xl">
        <p className="text-[14px] font-semibold uppercase tracking-[0.24em] text-indigo-500/80">Forgeline company brain</p>
        <h1 className="mt-3 text-[72px] font-bold leading-[1.02] tracking-[-0.04em] text-neutral-950">Compass</h1>
        <p className="mt-4 max-w-2xl text-[21px] leading-snug text-neutral-500">
          The company brain that turns market moves into roadmaps, and roadmaps into promotions.
        </p>
        <div className="mt-12 grid gap-6 md:grid-cols-2">
          <Entry
            href="/demo"
            icon={Presentation}
            kicker="Keynote"
            title="Live demo"
            description="A full-screen walkthrough: a real example, the market radar, the time machine, one-click PRs, promotion plans, and Ask with voice."
            gradient="linear-gradient(135deg,#6366f1,#ec4899)"
          />
          <Entry
            href="/brain"
            icon={BrainCircuit}
            kicker="Product"
            title="Open the brain"
            description="The working app: Radar, Compass, Story, Ask and the company graph, running on HydraDB."
            gradient="linear-gradient(135deg,#0ea5e9,#10b981)"
          />
        </div>
      </div>
    </div>
  );
}
