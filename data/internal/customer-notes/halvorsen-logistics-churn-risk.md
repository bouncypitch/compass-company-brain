# Churn Risk: Halvorsen Logistics

**Author:** Fiona Gallagher (CS) with Lena Park (SE) · **Date:** 2026-10-10
**Account:** 210 seats, $610K ARR (~6% of enterprise ARR) · **Renewal:** 2026-12-15 · **Risk:** 🔴 High
**Linked KRs:** GTM-KR3, CG-2, CG-1, AE-KR2 · **Linked roadmap:** R-14, R-09 · **Tickets:** FL-4430, FL-4398

## Health signals
- Weekly active seats: 78% (Jul) → 59% (Oct).
- Repeat-mistake tickets: 9 in Q3 (highest of any account).
- Running a 40-seat Devin pilot in Payments team since 2026-09-15.
- Ingest CPU incidents on their tenant (FL-4398) — fixed with a band-aid on 10/1.

## QBR highlights (2026-10-09)
- VP Eng: "Your agent is smart on day one and exactly as smart on day ninety."
- Staff engineer shared an internal doc, **"Things to tell Forgeline every morning"** — 2 pages of conventions (use `hvclient` for HTTP, never add `moment`, migrations go through `dbtool`, etc.). Rules-file workaround covers ~half; the rest is context the agent "should've picked up from our reviews."
- Devin pilot feedback (per VP Eng): "picks up corrections after one review."
- Secondary ask: run background agents overnight without a laptop open (→ R-09 cloud sandbox). "Nice to have; the memory thing is the must-have."

## Save plan
1. Exec sponsor call (Dana ↔ VP Eng) by 10/24.
2. Present a credible dated plan for persistent memory (R-14) — **needs an eng owner and design doc first**.
3. Offer Halvorsen as R-14 design partner (they've agreed in principle).
4. Interim: SE-assisted `.forgeline/rules.md` built from their "every morning" doc (Lena, by 10/17).
5. Fast-track R-09 cloud sandbox design-partner slot if staffing allows.

## Renewal forecast
- Without a memory plan by mid-Nov: likely downgrade to ~90 seats or churn.
- With a credible R-14 plan + design partner role: likely flat renewal.
