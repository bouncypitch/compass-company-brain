# Forgeline — Company Overview

*Internal wiki · last updated 2026-10-05 by Dana Whitfield (CEO)*

## What we do
Forgeline builds an AI coding assistant for enterprise engineering teams. We ship two surfaces on one backend:

- **Forgeline IDE** — extensions for VS Code and JetBrains (inline completions, chat, multi-file edits).
- **Forgeline Agent (`fl` CLI)** — an autonomous agent that takes a ticket, plans, edits code across the repo, runs tests, and opens a PR.

Both are powered by `forgeline-core`, our monorepo of backend services: `ingest` (repo indexing), `retrieval` (hybrid code search + context assembly), `agent-loop` (planner/executor), `sandbox` (execution environments), `policy` (enterprise guardrails), `auth`, `telemetry`, and `eval` (FL-Bench).

## Customers
~140 paying organizations, 31 of them "enterprise" (>50 seats, annual contract, SSO). Enterprise ARR is **$10.4M** as of 2026-10-09 (up from $9.0M at the start of FY26-H2). Representative accounts: Halvorsen Logistics (210 seats), Brightwater Bank (180), Kestrel Health (95), Ostrander Games (70). Typical buyer: VP Engineering at a 200–2,000 engineer company with a large, old, convention-heavy codebase.

## Market & competition
We compete with Cursor, Cognition (Devin / Windsurf), GitHub Copilot, and Replit. Our wedge has been **enterprise trust**: on-prem/VPC deployment, policy controls, audit logs, and strong retrieval on very large monorepos. Where we lose: competitors increasingly market agents that "learn your codebase" and remember conventions across sessions. See `customer-notes/` and #deals-competitive.

## FY26-Q4 strategy
Two company goals (details in `okrs.md`):

1. **CG-1 Win enterprise** — grow enterprise ARR from $9M to $14M.
2. **CG-2 Retain** — cut churn among teams with >50 seats.

Themes for the quarter: enterprise readiness (SSO/SCIM, audit), agent reliability (task success on real enterprise repos), and competitive parity on agent capabilities buyers ask about in bake-offs.

## Org (61 people)
| Dept | Leader | Size | Focus |
|---|---|---|---|
| Platform Eng | Priya Shah (EM) | 11 | ingest, retrieval, sandbox, reliability |
| Agent Eng | Marcus Oyelaran (EM) | 10 | agent-loop, tool use, evals |
| Product & Design | Elena Marchetti (VP Product) | 7 | roadmap, IDE UX, enterprise features |
| GTM / Sales | Ben Castellano (VP GTM) | 19 | sales, solutions eng, CS & support |
| G&A | Zoe Adler (Head of People) + ops | 8 | people, finance, legal |

Engineering reports to **Arjun Malhotra (CTO)**. **Grace Liu (L6 Principal)** is our only principal engineer and floats across teams on architecture.

## Internal tools you'll hear about
- **Linear-style tracker "Anvil"** — tickets are `FL-####`.
- **Hearth** — internal incident tool (`INC-###`).
- **FL-Bench-Enterprise** — our eval suite of 420 real tasks from 12 consenting customer repos.
- **Bellows** — the deploy pipeline. "Bellows is red" is a common Slack phrase.
- **Quarry** — the analytics warehouse (Looker on top).

## Values
Ship to real repos. Write it down. Own the outcome, not the ticket.
