# #support-escalations — "repeat-mistake tickets are up again"

**Date:** 2026-10-02 · **Participants:** Omar Said, Fiona Gallagher, Ian Fletcher, Marcus Oyelaran

---

**Omar Said** 9:05 AM
Weekly triage: 11 tickets tagged `repeat-mistake` this week, all enterprise. September total = 41 (AE-KR2 target is 19 🫤). Highlights:
- **FL-4412** (Brightwater Bank): agent keeps generating raw SQL instead of their `bwdb` query builder. Reviewer has rejected the same pattern in 9 PRs.
- **FL-4430** (Halvorsen Logistics): agent re-adds a dependency (`moment`) they removed in a migration last quarter. "We have an ADR about this. It's in the repo."
- **FL-4471** (Kestrel Health): agent ignores their PHI-redaction helper in logging. Same review comment 6 times. Their security lead is cc'd now, which is… not great.

**Fiona Gallagher** 9:09 AM
Kestrel and Halvorsen are both on the at-risk renewal list (GTM-KR3). Kestrel's renewal is 11/30. This one worries me most.

**Ian Fletcher** 9:14 AM
Looked at all three. Root cause is the same: the agent has no memory across sessions. Review comments live in GitHub; we never ingest them. Each session builds context from the current files + retrieval, so the "don't do X" knowledge just… evaporates.

**Ian Fletcher** 9:15 AM
Workaround we've been suggesting: put rules in `.forgeline/rules.md`. Works for maybe half. Customers say "why should we write a manual for the tool, it should learn from our reviews."

**Omar Said** 9:17 AM
Direct quote from FL-4430: *"Devin's trial instance picked this up after one correction."* 😐

**Marcus Oyelaran** 9:22 AM
This is the AE-KR2 problem and honestly most of AE-KR1 too. We're staffed on tool-call reliability (R-05) and planner v2 (R-06) this quarter. Memory needs a real storage + retrieval layer that's more Platform's area. I'll raise it with Priya and Arjun again.

**Fiona Gallagher** 9:24 AM
"Raise it again" is doing a lot of work in that sentence, Marcus 😅

**Marcus Oyelaran** 9:25 AM
Fair. It needs an owner, not another thread.

**Omar Said** 9:27 AM
Adding a `needs:agent-memory` label in Anvil so we can at least count it. Retroactively tagging Sept: 29 of 41 repeat-mistake tickets fit.
