import Link from 'next/link';
import type { ReactNode } from 'react';
import { ArrowRight, Brain, Github, Play, Presentation, Route, type LucideIcon } from 'lucide-react';
import '@/components/demo/demo.css';
import { REPO_URL, VIDEO_URL } from '@static/lib/demo-org';

const Orbs = () => (
  <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
    <div className="demo-orb left-[6%] top-[8%] h-[380px] w-[380px] bg-[#c7cdff]" />
    <div
      className="demo-orb right-[4%] top-[18%] h-[340px] w-[340px] bg-[#fbc6e3]"
      style={{ animationDelay: '-6s' }}
    />
    <div
      className="demo-orb bottom-[2%] left-[34%] h-[320px] w-[420px] bg-[#b9f3df]"
      style={{ animationDelay: '-11s' }}
    />
  </div>
);

interface EntryCardProps {
  href: string;
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  children: ReactNode;
}

const EntryCard = ({ href, icon: Icon, eyebrow, title, children }: EntryCardProps) => (
  <Link
    href={href}
    className="group relative flex flex-col rounded-[28px] border border-white/70 bg-white/60 p-8 shadow-[0_30px_80px_-40px_rgba(15,23,42,0.35)] backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:bg-white/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 motion-reduce:transition-none sm:p-10"
  >
    <div className="mb-8 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 via-violet-500 to-pink-500 text-white shadow-[0_16px_40px_-16px_rgba(124,58,237,0.7)]">
      <Icon className="h-7 w-7" strokeWidth={1.7} aria-hidden />
    </div>
    <div className="text-sm font-semibold uppercase tracking-[0.14em] text-violet-600">
      {eyebrow}
    </div>
    <h2 className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-neutral-950 sm:text-4xl">
      {title}
    </h2>
    <p className="mt-4 flex-1 text-lg leading-relaxed text-neutral-500">{children}</p>
    <div className="mt-8 inline-flex items-center gap-2 text-base font-semibold text-neutral-900">
      Open
      <ArrowRight
        className="h-4 w-4 transition-transform group-hover:translate-x-1 motion-reduce:transition-none"
        aria-hidden
      />
    </div>
  </Link>
);

const ExternalLink = ({ href, icon: Icon, children }: { href: string; icon: LucideIcon; children: ReactNode }) => (
  <a
    href={href}
    target="_blank"
    rel="noreferrer"
    className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white/70 px-5 py-2.5 text-sm font-semibold text-neutral-800 backdrop-blur transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
  >
    <Icon className="h-4 w-4" aria-hidden />
    {children}
  </a>
);

/** Landing page: two ways into the recorded Compass demo. */
export default function HomePage() {
  return (
    <main className="demo-root relative min-h-screen overflow-hidden">
      <Orbs />
      <div className="relative mx-auto flex min-h-screen max-w-6xl flex-col px-4 py-16 sm:px-8 sm:py-24">
        <header className="flex flex-col items-center text-center">
          <div className="mb-8 flex h-20 w-20 items-center justify-center rounded-[26px] bg-gradient-to-br from-indigo-500 via-violet-500 to-pink-500 shadow-[0_24px_60px_-18px_rgba(124,58,237,0.6)]">
            <Brain className="h-10 w-10 text-white" strokeWidth={1.6} aria-hidden />
          </div>
          <h1 className="text-6xl font-semibold leading-[0.95] tracking-[-0.05em] text-neutral-950 sm:text-8xl">
            Compass
          </h1>
          <p className="mt-6 max-w-3xl text-xl font-medium leading-snug tracking-[-0.01em] text-neutral-500 sm:text-2xl">
            The company brain that turns <span className="demo-gradient-text">market moves</span>{' '}
            into roadmaps — and roadmaps into{' '}
            <span className="demo-gradient-text">promotions</span>.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <ExternalLink href={VIDEO_URL} icon={Play}>
              Watch the demo video
            </ExternalLink>
            <ExternalLink href={REPO_URL} icon={Github}>
              View on GitHub
            </ExternalLink>
          </div>
        </header>

        <section className="mt-14 grid gap-6 md:grid-cols-2" aria-label="Demos">
          <EntryCard href="/deck/" icon={Presentation} eyebrow="Keynote" title="Live demo deck">
            The full keynote: the market radar, the unowned roadmap item, the drafted pull request,
            and the brain answering questions. Use the arrow keys to advance.
          </EntryCard>
          <EntryCard href="/journey/" icon={Route} eyebrow="Walkthrough" title="Jordan's journey">
            &ldquo;How do I get promoted to Staff?&rdquo; Follow one engineer from a market signal
            to a claimed opportunity and a concrete promotion plan.
          </EntryCard>
        </section>

        <footer className="mt-auto pt-14 text-center text-sm text-neutral-400">
          Static demo running on a recorded snapshot of the company brain — no login, no backend.
        </footer>
      </div>
    </main>
  );
}
