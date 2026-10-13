# Compass — Company Brain Hackathon submission

## Basics
- **Project name:** Compass
- **Tagline:** The company brain that turns market moves into roadmaps — and roadmaps into promotions.
- **GitHub:** https://github.com/bouncypitch/compass-company-brain
- **Live demo (static, no login):** https://bouncypitch.github.io/compass-company-brain/
  - Keynote deck: https://bouncypitch.github.io/compass-company-brain/deck/
  - Jordan's journey: https://bouncypitch.github.io/compass-company-brain/journey/
- **Demo video:** https://youtu.be/B5Cdtfa5Ykk (MP4 also at https://github.com/bouncypitch/compass-company-brain/releases/latest)
- **Gallery images:** `docs/gallery/01…15.png` (1800×1200, 3:2)
- **Built with:** HydraDB, Claude (Opus 5.5), App-Starter, NestJS, Next.js, PostgreSQL, Redis, React Flow, ElevenLabs, whisper.cpp, Playwright, TypeScript

## Description

### Inspiration
Every company already has a brain. It's just scattered across Slack, email, meeting recordings, roadmaps, code, performance reviews, and the market outside. And every engineer asks the same question: *"What should I work on to get promoted?"* Today's keynote set the bar: a company brain shouldn't just answer questions, it should take action. Compass does both.

### What it does
Compass is a company brain for **Forgeline**, a fictional AI coding-assistant startup. It's demoed through **Jordan**, a senior engineer who asks: ***"How do I get promoted to Staff?"***

- **Builds the brain.** Slack threads, email, meeting recordings (including today's keynote, transcribed with whisper.cpp), docs, OKRs, the career ladder, the roadmap, code and reviews are ingested into **HydraDB** as a retrieval index plus a knowledge graph. Every answer is grounded, cited, and connected.
- **Researches the competition with agents.** Research agents fan out in parallel, one per competitor, each chasing a different intent: launches, hiring and leadership moves, government contracts, research papers, acquisitions, market entries and pricing.
  - They covered **7 real competitors**: Cursor, Cognition, GitHub Copilot, Replit, OpenAI Codex, Google and Amazon.
  - That produced **235 verified, cited signals**, scored into a capability × company landscape.
  - Compass predicts where each competitor is going and spots convergence: 5 of 7 are moving on codebase memory.
- **Is validated against the future.** We hid every signal after Aug 1 and predicted from the earlier data alone, then checked against what actually shipped. It called:
  - Cursor's agent-to-merge pipeline (Rollouts / Security Review)
  - Google's enterprise push for Antigravity
  - Replit's governance tools
  - Codex's enterprise workspaces
- **Proposes high-impact projects for each engineer.** It weighs the competitive landscape, the engineer's skills and reviews, what their manager is rated on, department objectives, and the company's north star, then picks the strongest alignment between individual and company goals. For Jordan, that's **R-14 Agent memory**:
  - it's unowned,
  - it blocks 7 goals and a $610K renewal,
  - and it lives in code Jordan already owns.
- **Acts.** One click claims the project, writes the decision back into HydraDB (the brain learns), and **drafts a 4-file pull request** against the real codebase. It then lays out a dated **90-day plan** and **who to talk to**, with a reason for each person.
- **Ask anything, by voice.** Answers come with citations and the HydraDB graph paths followed, including from the keynote recording, with the exact moment playable.
- **The company graph.** 25 people, 9 teams, 15 KRs, 18 roadmap items, 15 code modules, conversations, customers and tickets: **267 relationships** you can zoom from company to team to person to roadmap item.

### How we built it
- **HydraDB** holds three kinds of collections:
  - `company` knowledge: docs, Slack, 1:1s, customer notes, code and the topology.
  - `market` knowledge: competitor signals and the keynote transcript.
  - `mem_*` per-employee memory collections.
- **Bring-your-own-graph** declares the spine:
  - Company → Signal → Capability for the market.
  - A deterministic company topology from systems of record: org chart, OKR owners, roadmap, CODEOWNERS, and who appears in which conversation.
  - Queries use hybrid search with `graph_context` in thinking mode.
- **Claude Opus 5.5** reasons over the retrieval with schema-validated structured outputs (radar, gaps, promotion plans, cited answers) and streams the drafted PR.
- **App-Starter** (NestJS, Next.js, Postgres, Redis) provides auth, organizations and roles. Every result is cached per org for instant replay.
- **Research agents** collected and verified every competitor signal from public sources, with no speculation about named individuals.
- **Demo video:** Playwright recording of the live app, ElevenLabs narration, and an ffmpeg compositor with drift-proof slide markers.

### Challenges
- **Honesty at every layer:** every competitor claim needs a real URL and date, the time machine needs a hard cutoff, and the promotion coach must never leak other people's private feedback.
- **Making a dense graph readable:** this took focus modes and deterministic layouts.

### Accomplishments
- An end-to-end loop from a public competitor launch to an engineer's drafted PR and promotion plan, grounded in a real knowledge graph.
- A validated forecasting check.
- The keynote, cited at the exact second.

### What we learned
- Declared graphs from systems of record make retrieval dramatically more trustworthy than extraction alone.
- The most valuable output of a company brain is alignment between people's growth and the company's goals.

### What's next
- Live connectors (Slack, Gmail, Linear, GitHub, CRM).
- Temporal edges (valid-from / valid-to).
- Role-based access control on memories.
- A manager view across the whole team.

## YouTube upload (title / description)
- **Title:** Compass — the company brain that turns market moves into promotions (Company Brain Hackathon)
- **Description:**
  Jordan asks "How do I get promoted to Staff?" Compass, a company brain built on HydraDB and Claude, answers by connecting today's keynote, 235 verified competitor signals from 7 AI-coding companies, Forgeline's roadmap and code, and Jordan's own reviews. Then it acts: it claims the highest-alignment project, drafts the pull request and lays out a 90-day plan.
  Code: https://github.com/bouncypitch/compass-company-brain
  Live demo: https://bouncypitch.github.io/compass-company-brain/
- **Visibility:** Unlisted or Public (both work for DevPost).
