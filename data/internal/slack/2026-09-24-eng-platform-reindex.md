# #eng-platform — "why is ingest at 100% CPU again"

**Date:** 2026-09-24 · **Participants:** Luis Romero, Jordan Rivera, Wei Chen, Priya Shah, Grace Liu

---

**Luis Romero** 2:13 PM
ingest-workers pegged at 100% CPU for Halvorsen's tenant for the 3rd time today. Grafana: https://grafana.internal/d/ingest-tenant?tenant=halvorsen. Bellows isn't red, nothing deployed. Anyone?

**Jordan Rivera** 2:21 PM
Looked. It's not a bug exactly — it's by design, which is worse. Every new agent session gets a fresh `SessionIndex` in `forgeline-core/ingest/session.go`. The chunk/embedding cache is keyed on `session_id`, not `(repo, commit)`. So when Halvorsen's 200 devs start `fl` sessions in the morning, we re-index the same 2.3M LOC monorepo ~dozens of times.

**Jordan Rivera** 2:22 PM
Quick numbers from Quarry for last 7 days, Halvorsen only: 1,912 sessions → 1,904 full re-indexes. Cache hit rate across sessions: 0.4%. 🫠

**Wei Chen** 2:25 PM
wait so the incremental indexing work in R-01 only helps *within* a session?

**Jordan Rivera** 2:27 PM
Yep. R-01 makes a single long session cheaper. It doesn't help the "every session starts from zero" problem. Fixing that properly means a persistent, tenant-scoped repo store keyed by commit — and once you have that, you could also store what the agent learned: conventions, review feedback, which files go together. That's basically agent memory.

**Priya Shah** 2:31 PM
That's R-14 territory. It's sitting in Later with no owner. Agent Eng says it's a storage problem, we've said it's an agent feature. Neither team has it in Q4.

**Grace Liu** 2:34 PM
For the record, session-scoped caching was a deliberate choice in 2024 for tenant isolation simplicity. A commit-keyed store is fine isolation-wise if it's per-tenant and encrypted with the tenant key. Someone should write the doc.

**Jordan Rivera** 2:36 PM
I could hack a commit-keyed cache in `ingest` in like a week, which would drop PE-KR1 p95 a lot. But the memory part (learning from PRs/reviews/incidents) touches `retrieval` and `agent-loop`, and that needs Sam's team.

**Luis Romero** 2:37 PM
can you at least make it stop melting my nodes at 9am Pacific

**Jordan Rivera** 2:38 PM
I'll add jitter + a per-tenant concurrency cap as a band-aid. FL-4398.

**Priya Shah** 2:44 PM
Thanks Jordan. Let's talk about the bigger thing in our 1:1. Not a ticket-sized problem.

**Wei Chen** 2:45 PM
(for my own learning, is there a doc on why it was session-scoped? I couldn't find one)

**Grace Liu** 2:47 PM
There isn't. Which is sort of the point 🙂
