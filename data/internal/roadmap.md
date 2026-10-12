# Forgeline Product & Engineering Roadmap — FY26-Q4

*Owner: Elena Marchetti (VP Product) · Last reviewed at roadmap sync 2026-10-07 · Next review 2026-10-21*

Rule (PR-KR3): every **Now** and **Next** item must have a named owner and a linked KR. **Later** items may be unowned.

## NOW (in flight this quarter)

| ID | Item | Owner | Dept | Linked KR | Modules | Status |
|---|---|---|---|---|---|---|
| R-01 | Incremental indexing for monorepos >1M LOC | Jordan Rivera | Platform | PE-KR1 | `forgeline-core/ingest` | 60%; blocked on session-scoped cache (see R-14 note) |
| R-02 | SSO/SCIM GA (Okta, Entra) | Rosa Delgado | Product | PR-KR1, CG-1 | `forgeline-core/auth` | 80% |
| R-03 | Audit log export (SIEM) | Rosa Delgado | Product | PR-KR1 | `forgeline-core/telemetry` | 55% |
| R-04 | Hybrid retrieval v3 (re-ranker for symbols) | Jordan Rivera | Platform | PE-KR2 | `forgeline-core/retrieval` | 40% |
| R-05 | Tool-call reliability (structured retries) | Tobias Greer | Agent | AE-KR3 | `forgeline-core/agent-loop` | 70% |
| R-06 | Planner v2 for multi-file refactors | Sam Okafor | Agent | AE-KR1 | `forgeline-core/agent-loop` | 35% |
| R-07 | Enterprise tenant isolation hardening | Luis Romero | Platform | PE-KR3 | `forgeline-core/policy`, `forgeline-core/auth` | 65% |
| R-08 | JetBrains parity: agent panel | Hannah Lowe / Ian Fletcher | Product | PR-KR2 | `forgeline-ide/jetbrains` | 50% |

## NEXT (staffed or staffing; start this quarter)

| ID | Item | Owner | Dept | Linked KR | Modules | Status |
|---|---|---|---|---|---|---|
| R-09 | **Cloud sandbox for background agents** (today agents only run locally on dev machine) | Nadia Haddad | Platform | PE-KR4, GTM-KR1 | `forgeline-core/sandbox` | Owned but **understaffed** (1.5 eng; asked for +1). 1 of 5 design partners live. |
| R-10 | Admin usage dashboard (seat activity) | Kai Nakamura | Product | PR-KR2, GTM-KR3 | `forgeline-web/admin`, `forgeline-core/telemetry` | Design done |
| R-11 | Policy packs (banned APIs, license rules) | Rosa Delgado | Product | CG-1 | `forgeline-core/policy` | Spec in review |
| R-12 | FL-Bench-Enterprise v2 (add 150 tasks) | Tobias Greer | Agent | AE-KR1 | `forgeline-core/eval` | Starting 10/20 |
| R-13 | Bake-off kit for SEs (scripted demo repos) | Lena Park | GTM | GTM-KR1 | n/a | In progress |

## LATER (not scheduled; may be unowned)

| ID | Item | Owner | Dept | Linked KR | Modules | Notes |
|---|---|---|---|---|---|---|
| R-14 | **Agent memory — persistent codebase memory across sessions** (learn conventions from past PRs, review comments, incidents; stop re-indexing from scratch per session) | **unowned** | ? (spans Platform + Agent) | AE-KR1, AE-KR2, GTM-KR1, PE-KR1 | `forgeline-core/retrieval`, `forgeline-core/ingest`, `forgeline-core/agent-loop` | Raised in roadmap sync 4 times since July. Platform says it's an agent feature; Agent Eng says it's a retrieval/storage problem. Top competitive loss reason in Q3. No design doc. |
| R-15 | Voice pairing mode | unowned | Product | — | `forgeline-ide/vscode` | Hack-week idea |
| R-16 | Self-hosted model option (BYO weights) | Grace Liu (exploring) | CTO office | CG-1 | `forgeline-core/inference` | Research spike only |
| R-17 | Jira/Linear two-way sync for agent tasks | unowned | Product | PR-KR2 | `forgeline-core/integrations` | Customer ask (Brightwater) |
| R-18 | Agent cost controls per team | Kai Nakamura | Product | GTM-KR3 | `forgeline-core/billing` | Parked until R-10 ships |

---

### Roadmap sync notes, 2026-10-07 (excerpt)
- Ben: "R-14 is the #1 thing I hear in losses. Can we pull it into Next?" Elena: "Happy to — need an owner and a design doc first. Who?" (silence)
- Marcus: Agent Eng is fully committed to R-05/R-06; would partner but can't lead.
- Priya: Platform is stretched on R-01, R-04, R-09. Noted that R-14 overlaps heavily with the indexer cache work in R-01.
- **Action:** Elena to ask Arjun to find an owner for R-14 before 10/21. *Status: open.*
