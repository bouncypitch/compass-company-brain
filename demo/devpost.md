# Compass — DevPost final text (paste before 10pm)

**Tagline:** A company brain that watches your competitors, rewrites your roadmap, and tells every engineer which piece is their promotion.

## Inspiration
Every company already has a brain — it's just scattered across Slack, roadmaps, code, reviews and the market outside. And every engineer asks the same question: *what should I work on to get promoted?* No single person can connect the market, the roadmap, the code and their own growth. A company brain can.

## What it does
- **Radar:** tracks 7 real AI-coding competitors (Cursor, Cognition, GitHub Copilot, Replit, OpenAI Codex, Google, Amazon) through **235 verified public signals** — launches, hiring, leadership changes, government contracts, research, acquisitions, market entries, pricing — every one linked to its source. It predicts each competitor's next move with confidence and finds industry patterns (5 of 7 converging on codebase memory).
- **Time machine:** hides every signal after Aug 1, predicts, then reveals what actually shipped (it called Cursor's Rollouts/Security Review, Google's Antigravity enterprise push, Replit's governance tools).
- **Strategy → pull request:** maps market moves to our fictional startup Forgeline's roadmap, KRs and code ("R-14 Agent memory is unowned and blocks task success, win rate and two renewals"); one click writes the decision back into HydraDB and drafts a 4-file PR against the real codebase.
- **Compass:** for any engineer, aligns the career ladder, company/department goals, unowned work, what their manager is measured on, and their own review history into a ranked promotion plan and a 90-day plan — every claim cited.
- **Ask the brain (with voice):** ask anything — by typing or speaking — and get cited answers with the HydraDB graph paths it followed.
- **Company graph:** 25 people, 9 teams, 15 KRs, 18 roadmap items, 15 code modules, conversations, customers and tickets — 267 relationships, explorable with focus mode.

## How we built it
- **HydraDB** is the memory: a shared `company` knowledge collection (OKRs, ladder, roadmap, Slack, 1:1s, customer notes, code), a `market` collection (signals with declared graphs: Company → Signal → Capability), per-employee `mem_*` memory collections, and the full company topology declared via **bring-your-own-graph**. Queries use hybrid search with graph context in thinking mode; answers render HydraDB's graph paths.
- **Claude (Opus 5.5)** reasons over HydraDB retrieval with structured outputs: competitor moves, gaps, promotion plans, cited answers, and the drafted PR.
- **App-Starter** (NestJS + Next.js + Postgres) provides auth, organizations and roles; every brain result is cached per org for instant replay.
- Research agents collected and verified every public signal (no speculation about individuals). Forgeline and its people are fictional.

## Challenges
Keeping it honest: every competitor claim needed a real URL and date, the time machine needed a hard cutoff, and the promotion coach must never leak other people's private feedback.

## What's next
Live connectors (Slack, Linear, GitHub, CRM), temporal edges (valid_from/valid_to), and a manager view across the whole team.

**Built with:** HydraDB, Claude, App-Starter, NestJS, Next.js, PostgreSQL, Redis, React Flow, ElevenLabs, whisper.cpp, Playwright, TypeScript
