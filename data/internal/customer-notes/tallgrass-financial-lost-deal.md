# Closed-Lost: Tallgrass Financial

**Author:** Derek Mbeki (AE) with Lena Park (SE) · **Date:** 2026-09-19
**Deal:** 140 seats, $420K ACV, 2-year · **Competitor:** Cursor (won) · Devin (eliminated round 1)
**Linked KRs:** GTM-KR1, GTM-KR2, CG-1 · **Linked roadmap:** R-14, R-01

## Timeline
- 2026-07-22 — Discovery. Champion: Director of Platform Eng. Pain: 1.8M LOC Go/TS monorepo, heavy internal conventions.
- 2026-08-12 — Security review: Forgeline scored highest (VPC deploy, audit logs, policy controls).
- 2026-08-18 → 09-05 — 3-week bake-off, 12 engineers each tool.
- 2026-09-17 — Decision: Cursor.

## Why we lost (champion's words)
> "By week two, Cursor remembered our conventions. Forgeline was like onboarding a new contractor every morning. Your security story is better, but my engineers voted with their time."

## Bake-off evidence (Lena)
- Same correction given to Forgeline agent 14 times across sessions (use `tglog` wrapper, not `log.Printf`).
- Agent re-imported from deprecated `legacy/` package in 5 of 23 PRs despite review comments.
- Each new `fl` session re-indexed the full repo: ~11 min median wait. Engineers started leaving one session open all day to avoid it, which then hit context limits.
- Task completion (their scoring): Cursor 68%, Forgeline 57%, Devin 49%.
- Where we won: policy controls, audit, on-prem readiness, large-file retrieval accuracy in week 1.

## Loss reason codes
Primary: **Product gap — no persistent codebase memory**. Secondary: indexing latency per session.

## Ask to product/eng
Agent should learn from prior sessions, PR reviews, and repo ADRs, and stop re-indexing unchanged code. Roadmap R-14 is unowned; this was the 5th Q3 loss with this reason.
