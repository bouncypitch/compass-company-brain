# FY26-Q4 OKRs

*Period: 2026-10-01 → 2026-12-31 · Status as of 2026-10-09 (weekly check-in) · Owner of this doc: Elena Marchetti*

Status legend: 🟢 on track · 🟡 at risk · 🔴 off track

## Company goals

| ID | Goal | Metric | Start | Target | Current | Status | Exec owner |
|---|---|---|---|---|---|---|---|
| **CG-1** | Win enterprise | Enterprise ARR | $9.0M | $14.0M | $10.4M | 🟡 | Dana Whitfield |
| **CG-2** | Retain | Quarterly logo churn, teams >50 seats | 4.1% | ≤2.0% | 3.8% | 🔴 | Arjun Malhotra |

---

## Platform Eng — owner: Priya Shah
**Dept goal:** Make Forgeline the fastest, most reliable context engine for large enterprise repos. *Supports CG-2, CG-1.*

| KR | Description | Start | Target | Current | Status | KR owner |
|---|---|---|---|---|---|---|
| **PE-KR1** | p95 repo indexing time, repos >1M LOC | 14 min | 4 min | 9.5 min | 🟡 | Jordan Rivera |
| **PE-KR2** | Retrieval contribution to agent success: context hit@10 on FL-Bench-Enterprise | 71% | 85% | 74% | 🟡 | Jordan Rivera |
| **PE-KR3** | Enterprise API uptime; zero Sev-1 >2h | 99.82% | 99.9% | 99.86% | 🟢 | Luis Romero |
| **PE-KR4** | Cloud sandbox beta (R-09) live with design partners | 0 | 5 | 1 | 🔴 | Nadia Haddad |

Notes: PE-KR1 gap is dominated by full re-indexing on every new agent session (see #eng-platform 2026-09-24). PE-KR4 is understaffed (1.5 engineers).

## Agent Eng — owner: Marcus Oyelaran
**Dept goal:** Agents that finish real enterprise tasks without babysitting. *Supports CG-2.*

| KR | Description | Start | Target | Current | Status | KR owner |
|---|---|---|---|---|---|---|
| **AE-KR1** | Agent task success rate, FL-Bench-Enterprise | 52% | 65% | 54% | 🔴 | Sam Okafor |
| **AE-KR2** | "Repeat-mistake" support tickets / month | 38 | 19 | 41 | 🔴 | Ian Fletcher |
| **AE-KR3** | Tool-call error rate in agent-loop | 6.2% | 3.0% | 4.1% | 🟢 | Tobias Greer |

Notes: Failure analysis (2026-10-06) attributes ~31% of AE-KR1 failures to "context forgotten across sessions" — agent re-learns repo conventions every run. No Q4 work item addresses this; see roadmap **R-14 (Later / unowned)**.

## Product & Design — owner: Elena Marchetti
**Dept goal:** Enterprise-ready product that teams actually use daily. *Supports CG-1, CG-2.*

| KR | Description | Start | Target | Current | Status | KR owner |
|---|---|---|---|---|---|---|
| **PR-KR1** | SSO/SCIM + audit log GA (R-02, R-03) | 40% | 100% | 70% | 🟢 | Rosa Delgado |
| **PR-KR2** | Weekly active seats in enterprise accounts | 62% | 75% | 64% | 🟡 | Kai Nakamura |
| **PR-KR3** | Every Now/Next roadmap item has a named owner + linked KR | 70% | 100% | 88% | 🟡 | Elena Marchetti |

## GTM / Sales — owner: Ben Castellano
**Dept goal:** Win competitive enterprise bake-offs and protect the top accounts. *Supports CG-1, CG-2.*

| KR | Description | Start | Target | Current | Status | KR owner |
|---|---|---|---|---|---|---|
| **GTM-KR1** | Enterprise win rate in competitive deals | 22% | 35% | 19% | 🔴 | Ben Castellano |
| **GTM-KR2** | New enterprise ARR closed in Q4 | $0 | $3.6M | $0.5M | 🟡 | Derek Mbeki |
| **GTM-KR3** | Renew top-15 >50-seat accounts with no downgrade | — | 15/15 | 12 safe, 3 at risk | 🟡 | Fiona Gallagher |

Notes: Loss reasons Q3 (n=9 competitive losses): "competitor agent remembers our codebase/conventions" cited in 5; price in 2; on-prem in 1; other 1. At-risk renewals: Halvorsen Logistics, Brightwater Bank, Kestrel Health.

---

## Cross-dept dependencies flagged at check-in
- AE-KR1 and GTM-KR1 both depend on **persistent codebase memory for agents** (R-14). No owner; not in any dept's Q4 plan. *Action: unassigned.*
- PE-KR4 depends on R-09 staffing; Priya requested +1 headcount (pending).
