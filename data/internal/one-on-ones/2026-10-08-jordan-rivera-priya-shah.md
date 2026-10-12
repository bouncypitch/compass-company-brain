# 1:1 — Jordan Rivera ↔ Priya Shah

**Date:** 2026-10-08 · **Cadence:** weekly · **Doc owner:** Priya Shah (shared)

## Updates (Jordan)
- R-01 incremental indexing: 60%. Within-session re-index on a 2.3M LOC repo is down from 14 → 9.5 min p95 (PE-KR1). Remaining gains are capped because the cache is keyed on `session_id` (see #eng-platform 9/24).
- FL-4398 band-aid shipped: jitter + per-tenant concurrency cap. Halvorsen ingest CPU spikes gone. Luis sent a 🙏.
- R-04 re-ranker: offline eval hit@10 74% → 78% on the symbol subset. Not merged yet.

## Career conversation (L5)
**Jordan:** Wants to go for Staff (L5) in the H1 2027 cycle. Asked directly what's missing.

**Priya** (referencing ladder v3 and H1 2026 review):
- Technical depth is clearly L5-level already. The INC-188 untangling in March is still cited by other teams.
- Gaps against the L5 bar:
  1. **Cross-team leadership** — everything so far has been within Platform, on items someone else put on the roadmap.
  2. **Design docs** — "You've written great PR descriptions, but no RFC that another team adopted." Zero cross-team design docs in the last 3 halves.
  3. **Business impact in numbers** — latency wins are real, but the promo packet needs a line like "moved win rate / churn / task success by X."
- "The calibration committee will ask: what did Jordan decide that wouldn't have happened without them?"

**Priya on her own context:** She's measured on PE-KR1 (indexing latency), PE-KR2 (our contribution to agent task success), PE-KR3 (enterprise reliability), and PE-KR4 (sandbox). PE-KR1 and PE-KR2 are both stuck behind the same root cause: the indexer starts from scratch every session and nothing persists between them.

**Priya:** "Honestly, someone needs to own agent memory. It's R-14, it's been unowned since July, it's blocking Marcus's AE-KR1 and Ben's win rate, and it's half my KRs too. Agent Eng won't lead it. You know `ingest` and `retrieval` better than anyone. That's exactly the kind of thing that makes a Staff case — but only if you lead it, not just build the cache."

**Jordan:** Interested but nervous about (a) leading people on Agent Eng they don't manage, (b) giving up hands-on time on R-04, (c) "writing a doc that gets ignored."

**Priya:** Will protect time — move R-04 finishing work to Wei with Jordan reviewing (also counts as mentoring). Suggested pairing with Sam Okafor (L5, Agent Eng) as co-author and Grace Liu as reviewer. Lena Park offered customer interviews.

## Action items
- [ ] Jordan: draft a 1-pager "R-14 Persistent Codebase Memory — problem + proposal" by 10/16; then full RFC before roadmap review 10/21.
- [ ] Jordan: grab 30 min with Sam Okafor re: agent-loop integration points.
- [ ] Priya: talk to Arjun + Marcus about naming Jordan as R-14 owner; check with Elena on moving R-14 to Next.
- [ ] Priya: hand R-04 remainder to Wei Chen, Jordan as reviewer.
- [ ] Jordan: ask Lena for 3 customer interviews (Halvorsen, Brightwater, Kestrel).

## Private notes (Priya)
Jordan defaults to "I'll just fix it." That instinct is why they're great and why they're stuck at L4. If they write the doc and get two teams aligned on R-14, the promo case writes itself.
