# Company Brain Ontology: AI Coding-Assistant Startup (~60 people, Series B)

Goal: one graph that connects strategy, code, customers, competitors and people, so an agent can answer cross-cutting questions ("which competitor move threatens which roadmap item, who owns that code, and who could lead it?").

## Prior art we borrowed from (all fetched)
- **Backstage catalog** has kinds Component, API, Resource, User, Group, System, Domain, Location, with `type` a free-form field, not a kind. We reuse the Component/API/System/Domain split and User/Group for engineering. https://backstage.io/docs/features/software-catalog/system-model/
- **W3C ORG** separates `Post` (a seat that can be vacant) from the person holding it, models `Membership` as an n-ary link (member, organization, role, `memberDuring`), and has `reportsTo` for solid and dotted lines. https://www.w3.org/TR/vocab-org/
- **schema.org Organization** has `subOrganization`/`parentOrganization`, `department`, `member`/`memberOf`, `employee`. https://schema.org/Organization
- **OpenLineage** has Job / Run / Dataset plus extensible *facets*. We use the same split for Eval/Model/Dataset (an eval is a Job, each execution a Run). https://openlineage.io/docs/spec/object-model/
- **Graphiti/Zep** has bi-temporal facts that are invalidated, not deleted. Every derived fact traces to source "episodes". Entity types are prescribed (Pydantic) or learned. https://github.com/getzep/graphiti
- **HydraDB**: shared *knowledge* vs per-user *memory* in collections, a context graph returned as `query_paths` and `chunk_relations`, bring-your-own-graph via `graph_payload` (entities: name/type/namespace; relations: source/target/predicate/context; limits 5,000 entities, 10,000 relations, 500 relations per entity, 2,000-char relation context, 256-char names/predicates), `upsert` with stable source ids, and `acl` at query time. https://hydradb.com/blog/build-company-brain-ai-agents , https://docs.hydradb.com , https://docs.hydradb.com/get-started/v2/core-concepts
- Glean, Notion, Linear, Jira, Salesforce and OKR models: not fetched. Our Strategy, Ticket and Account/Opportunity layers follow their well-known shapes (Objective > Key Result > Initiative; Account > Opportunity; Epic > Ticket), but treat that as our design, not a cited claim.

## 1. Design principles
1. **Stable, namespaced ids** (`person:ada@co.com`, `repo:gh/acme/agent-core`). Resolve identities across Slack, GitHub, Linear and the CRM into one canonical node and keep an `aliases[]` list.
2. **Provenance on every node and edge**: `source_ids[]` (doc, message, commit URL) plus `extracted_by` (human, connector, llm:model@version). Nothing appears in the UI without a "why do we think this" link.
3. **Temporal validity**: edges carry `valid_from`/`valid_to`; supersede, never delete (Graphiti's approach). That makes "who owned this in March?" answerable.
4. **Declared vs inferred**: `basis: declared | derived | inferred`. Declared (CODEOWNERS, HRIS, OKR tool) always wins and can be used for actions. Inferred (LLM, co-commit stats) shows as dashed lines with `confidence` 0-1 and must be confirmed before it drives decisions.
5. **ACL/visibility on each node and edge** (`public | team | exec | hr_confidential`). Talent and comp nodes are inherited-restricted: a traversal never leaks across an ACL boundary.
6. **Facts vs. interpretations**: raw events (commit, signal) are immutable; judgments (gap, fit, risk) are separate derived nodes or edges that can be recomputed.
7. **Small core, extensible facets** (OpenLineage style): about 45 node types, with kind-specific data in `props`, so new sources do not need schema migrations.
8. **Edges are first class**: relationships may carry weight, evidence and a `context` sentence (this maps directly to HydraDB relation `context`).

## 2. Node types
Common fields on all nodes: `id, type, name, aliases[], props{}, source_ids[], acl, created_at, updated_at, valid_from, valid_to`. Only distinguishing properties are listed below.

**People & Org**
| Node | Key props | Example id |
|---|---|---|
| Person | email, title, start_date, location, status | `person:ada@co.com` |
| Team | function (eng/gtm/…), charter, size | `team:agent-runtime` |
| Department | head | `dept:engineering` |
| Role / Level | ladder, level (L1-L7), track (IC/mgr) | `level:swe-l5` |
| Post (seat) | team, level, open? (vacant seats = hiring plan) | `post:agent-runtime-staff-1` |

Manager line = `reports_to` edges; Membership data lives on the `member_of` edge (role, since).

**Strategy**
| Node | Key props | Example id |
|---|---|---|
| CompanyGoal (Objective) | period, owner, status, narrative | `goal:2026h2-enterprise-ready` |
| DeptGoal / KeyResult | metric, baseline, target, current, confidence | `kr:eng-p95-latency-800ms` |
| Initiative | status, start/end, sponsor | `init:soc2-type2` |
| RoadmapItem | quarter, stage (idea/committed/shipping), size | `rm:ide-multi-repo-context` |
| Decision / ADR | status, date, decider, rationale, alternatives | `adr:0042-switch-to-mcp` |

**Engineering**
| Node | Key props | Example id |
|---|---|---|
| Repo | url, language, visibility | `repo:gh/acme/cli` |
| Service / Module (Component, System, Domain as `kind`) | path globs, tier, lifecycle | `mod:agent-core/planner` |
| API | spec url, visibility, version | `api:inference-gateway/v2` |
| CodeOwner (ownership rule) | pattern, source (CODEOWNERS/inferred) | derived edge, not a node by default |
| PR | state, author, merged_at, size | `pr:cli#1893` |
| Commit | sha, author, files | `commit:cli@9f2c1ab` |
| Ticket | tracker, state, priority, estimate | `tkt:ENG-2231` |
| Incident | sev, started, resolved, customer_impact | `inc:2026-09-14-index-outage` |
| Postmortem | root_cause, action_items | `pm:2026-09-14-index-outage` |
| Eval / Benchmark | suite, metric, owner (like an OpenLineage Job) | `eval:swe-bench-verified` |
| EvalRun | model, score, date (like a Run) | `evalrun:swebv-2026-10-01-m7` |
| Model | provider, version, role (served/base/finetune) | `model:acme-code-7b-v3` |
| Prompt | version, template hash, used_by | `prompt:planner/system@v14` |
| Dataset | size, license, pii? | `ds:accepted-completions-2026q3` |
| FeatureFlag | state, rollout %, owner | `flag:multi-repo-ctx` |
| Release | version, date, channel, notes | `rel:ide-1.42.0` |

**Customers & GTM**
| Node | Key props | Example id |
|---|---|---|
| Account | segment, ARR, seats, industry, health | `acct:globex` |
| Opportunity | stage, amount, close_date, loss_reason | `opp:globex-expansion-q4` |
| Renewal | date, ARR at risk | `ren:globex-2027-02` |
| SupportTicket | severity, product_area, state | `sup:ZD-5521` |
| FeatureRequest | summary, votes, ARR-weighted demand | `fr:sso-scim` |
| Contact / Champion | role, sentiment, influence | `contact:globex/jlee` |

**Knowledge**
| Node | Key props | Example id |
|---|---|---|
| Doc | url, system (Notion/Drive), author, last_edited | `doc:notion/pricing-v3` |
| DesignDoc / RFC | status, reviewers | `rfc:012-remote-agents` |
| Meeting | date, attendees, transcript ref | `mtg:2026-10-08-roadmap-sync` |
| OneOnOne | participants (restricted ACL) | `1on1:ada-ben-2026-10-09` |
| SlackThread | channel, ts, participants | `slack:C123/1728400000` |

**Market**
| Node | Key props | Example id |
|---|---|---|
| Competitor | category, funding, size, positioning | `comp:cursorlike` |
| Signal | `kind` ∈ launch, hiring, leadership_change, contract, paper, funding, acquisition, market_entry, pricing; date, url, strength | `sig:cursorlike-hires-3-sec-eng` |
| Capability | name, maturity, taxonomy parent | `cap:secure-on-prem-agent` |
| Trend | direction, horizon, evidence count | `trend:agentic-background-tasks` |

**Talent**
| Node | Key props | Example id |
|---|---|---|
| Skill | taxonomy, parent | `skill:distributed-systems` |
| LadderExpectation | level, dimension, description | `exp:swe-l5-scope` |
| Review | cycle, rating, ACL hr_confidential | `rev:ada-2026h1` |
| Feedback | from, to, text, sentiment | `fb:ben-to-ada-0912` |
| GrowthArea | skill, target level, plan | `grow:ada-systems-design` |

## 3. Relationship types
Columns: B = basis (D declared, I inferred, D/I either); T = temporal (Y = carries valid_from/to).

| Predicate | From → To | Meaning | B | T |
|---|---|---|---|---|
| reports_to | Person → Person | Solid line manager (dotted line via `kind` prop) | D | Y |
| member_of | Person → Team | Membership with role | D | Y |
| part_of | Team → Department; Module → Service → System → Domain; Team → Team | Containment | D | Y |
| holds | Person → Post | Occupies a seat/level | D | Y |
| at_level | Post/Person → Level | Current level | D | Y |
| owns | Team/Person → Module/API/Repo/Service | Accountable owner | D | Y |
| code_owner_of | Person/Team → Module | CODEOWNERS or de facto (commit share) | D/I | Y |
| drives | Goal → KR; DeptGoal → CompanyGoal | Goal decomposition | D | Y |
| advances | RoadmapItem/Initiative → KR/Goal | Work moves metric | D/I | Y |
| realizes | Initiative → RoadmapItem | Initiative contains item | D | Y |
| implemented_by | RoadmapItem → Module/Repo/PR/Ticket | Where the code lives | D/I | Y |
| touches | PR/Commit → Module | Changed files mapped to modules | D | N |
| authored_by | PR/Commit/Doc → Person | Authorship | D | N |
| blocks / blocked_by | Ticket/RoadmapItem ↔ same | Hard dependency | D | Y |
| depends_on | Module/Service/RoadmapItem → same, Resource, Model, Dataset | Technical or delivery dependency | D/I | Y |
| exposes | Service → API | Interface surface | D | Y |
| gated_by | RoadmapItem/Module → FeatureFlag | Rollout control | D | Y |
| shipped_in | PR/RoadmapItem → Release | Delivery | D | N |
| uses_model | Module/Prompt → Model | Runtime model | D | Y |
| evaluated_by | Model/Prompt/Module → Eval | Quality gate | D | Y |
| scored | EvalRun → Model (score prop) | Result | D | N |
| trained_on | Model → Dataset | Lineage | D | Y |
| mentions | Doc/SlackThread/Meeting → any node | Reference with context sentence | I | N |
| decided_in | Decision → Meeting/Doc/SlackThread | Where it was decided | D/I | N |
| supersedes | Decision → Decision | Replaces an earlier decision | D | Y |
| constrains | Decision → Module/RoadmapItem | Decision shapes work | D/I | Y |
| caused | Incident → Ticket / PR | Incident produced follow-up | D | N |
| root_cause_in | Postmortem → Module/PR | Where the fault was | D/I | N |
| affects | Incident → Account / Module | Customer or system impact | D/I | N |
| resolved_by | Incident → PR | Fix | D | N |
| requested_by | FeatureRequest → Account/Contact | Demand source | D | N |
| maps_to | FeatureRequest → RoadmapItem | Tracked by item | D/I | Y |
| opportunity_of | Opportunity → Account | Deal belongs to account | D | N |
| blocked_on | Opportunity → FeatureRequest/Incident | Deal risk | I | Y |
| lost_to | Opportunity → Competitor | Loss reason | D | N |
| champion_of | Contact → Account/Opportunity | Internal advocate | D/I | Y |
| escalated_from | SupportTicket → Incident | Support linked to outage | D/I | N |
| indicates | Signal → Capability | Signal reveals capability | I | N |
| from_competitor | Signal → Competitor | Source of signal | D | N |
| pursuing | Competitor → Capability | Investment direction (aggregated from signals, with strength) | I | Y |
| threatens | Capability → RoadmapItem / Account | Gap that the competitor move opens | I | Y |
| covers | RoadmapItem/Module → Capability | Our own coverage | D/I | Y |
| requires | LadderExpectation/Level/RoadmapItem → Skill | Skill needed | D | Y |
| demonstrated | Person → Skill | Evidence of skill (with `evidence_ids`, level, date) | I | Y |
| has_gap | Person → GrowthArea | Skill gap vs. level | I | Y |
| best_fit_for | Person → RoadmapItem/Initiative/Opportunity | Match score with explanation | I | Y |
| reviewed_in | Person → Review; Feedback → Person | Talent record (restricted) | D | Y |

## 4. Topology views
| View | Subgraph (predicates) | Notes |
|---|---|---|
| Org chart | Person, Team, Post; `reports_to`, `member_of`, `part_of`, `holds` | Toggle vacant posts; "as of" date slider |
| Goal tree | CompanyGoal → DeptGoal/KR → Initiative → RoadmapItem; `drives`, `realizes`, `advances` | Color by KR confidence; orphan items highlighted |
| Roadmap → code → owner | RoadmapItem → Module → Person/Team; `implemented_by`, `owns`, `code_owner_of`, `blocked_by` | Shows bus-factor and blocked work |
| Customer impact map | Account ↔ Opportunity, Renewal, FeatureRequest, Incident, SupportTicket; `affects`, `requested_by`, `maps_to` | Size nodes by ARR |
| Competitive landscape | Competitor, Signal, Capability, our RoadmapItem; `from_competitor`, `indicates`, `pursuing`, `covers`, `threatens`, `lost_to` | Heat map: capability x competitor, timeline of signals |
| Talent / opportunity map | Person, Skill, Level, GrowthArea, RoadmapItem/Opportunity; `demonstrated`, `requires`, `has_gap`, `best_fit_for` | ACL-gated; managers only |
| Incident / decision timeline | Incident, Postmortem, Decision, Release; `caused`, `supersedes`, `constrains` | Temporal slider |

## 5. Multi-hop queries
1. Competitor Signal → Capability → (uncovered) Roadmap gap → Code Module → Code Owner → Person → Ladder gap.
2. KR at risk ← advances ← RoadmapItem → blocked_by → Ticket → owner Person → manager.
3. Lost Opportunity → lost_to → Competitor → pursuing → Capability → threatens → RoadmapItem.
4. Account → FeatureRequest → maps_to → RoadmapItem → implemented_by → Module → Release (when will this customer get it?).
5. Incident → affects → Account → Renewal (ARR at risk this quarter) → Champion contact.
6. Incident → root_cause_in → Module → code_owner_of → Team → open Postmortem action items.
7. Decision (ADR) → constrains → Module → touched by recent PRs: is current work violating a decision?
8. Person → demonstrated → Skill ← requires ← next Level (promotion evidence), then → has_gap → GrowthArea → best_fit_for → Initiative.
9. RoadmapItem → requires → Skill ← demonstrated ← Person: staffing candidates ranked by fit and load.
10. Model → evaluated_by → Eval → EvalRun trend, joined to Release → shipped_in: which release regressed?
11. Signal (hiring: security engineers) → Competitor → pursuing → Capability → Account (those asking via FeatureRequest) → Opportunity at risk.
12. Meeting → mentions → Decision/Initiative → advances → KR: which meetings actually move goals?
13. Team → owns → Module → depends_on → Service owned by another Team: cross-team dependency load.

## 6. Compact JSON schema
```json
{
  "version": "0.1",
  "common_node": ["id","type","name","aliases","props","source_ids","acl","valid_from","valid_to"],
  "common_edge": ["id","predicate","from","to","basis","confidence","source_ids","acl","valid_from","valid_to","context","props"],
  "basis_enum": ["declared","derived","inferred"],
  "acl_enum": ["public","team","exec","hr_confidential"],
  "layers": {
    "people_org": ["Person","Team","Department","Level","Post"],
    "strategy": ["CompanyGoal","KeyResult","Initiative","RoadmapItem","Decision"],
    "engineering": ["Repo","Module","API","PR","Commit","Ticket","Incident","Postmortem","Eval","EvalRun","Model","Prompt","Dataset","FeatureFlag","Release"],
    "gtm": ["Account","Opportunity","Renewal","SupportTicket","FeatureRequest","Contact"],
    "knowledge": ["Doc","DesignDoc","Meeting","OneOnOne","SlackThread"],
    "market": ["Competitor","Signal","Capability","Trend"],
    "talent": ["Skill","LadderExpectation","Review","Feedback","GrowthArea"]
  },
  "signal_kinds": ["launch","hiring","leadership_change","contract","paper","funding","acquisition","market_entry","pricing"],
  "predicates": {
    "reports_to":{"from":["Person"],"to":["Person"],"temporal":true},
    "member_of":{"from":["Person"],"to":["Team"],"temporal":true},
    "part_of":{"from":["Team","Module"],"to":["Department","Team","Module"],"temporal":true},
    "owns":{"from":["Team","Person"],"to":["Module","API","Repo"],"temporal":true},
    "code_owner_of":{"from":["Person","Team"],"to":["Module"],"temporal":true,"basis":["declared","inferred"]},
    "drives":{"from":["CompanyGoal","KeyResult"],"to":["KeyResult"],"temporal":true},
    "advances":{"from":["RoadmapItem","Initiative"],"to":["KeyResult","CompanyGoal"],"temporal":true},
    "implemented_by":{"from":["RoadmapItem"],"to":["Module","Repo","PR","Ticket"],"temporal":true},
    "blocks":{"from":["Ticket","RoadmapItem"],"to":["Ticket","RoadmapItem"],"temporal":true},
    "depends_on":{"from":["Module","RoadmapItem"],"to":["Module","Model","Dataset","RoadmapItem"],"temporal":true},
    "mentions":{"from":["Doc","SlackThread","Meeting"],"to":["*"],"basis":["inferred"]},
    "decided_in":{"from":["Decision"],"to":["Meeting","Doc","SlackThread"]},
    "caused":{"from":["Incident"],"to":["Ticket","PR"]},
    "affects":{"from":["Incident"],"to":["Account","Module"]},
    "requested_by":{"from":["FeatureRequest"],"to":["Account","Contact"]},
    "lost_to":{"from":["Opportunity"],"to":["Competitor"]},
    "indicates":{"from":["Signal"],"to":["Capability"],"basis":["inferred"]},
    "pursuing":{"from":["Competitor"],"to":["Capability"],"temporal":true,"basis":["inferred"]},
    "threatens":{"from":["Capability"],"to":["RoadmapItem","Account"],"temporal":true,"basis":["inferred"]},
    "requires":{"from":["LadderExpectation","Level","RoadmapItem"],"to":["Skill"],"temporal":true},
    "demonstrated":{"from":["Person"],"to":["Skill"],"temporal":true,"basis":["inferred"],"props":["evidence_ids","level"]},
    "best_fit_for":{"from":["Person"],"to":["RoadmapItem","Initiative","Opportunity"],"temporal":true,"basis":["inferred"],"props":["score","explanation"]}
  },
  "note": "Remaining predicates from the section 3 table follow the same shape."
}
```

## 7. Mapping to HydraDB
**Collections (knowledge vs. memory)**
- **Shared knowledge** (`type="knowledge"`, one company collection, with metadata filters such as `layer`, `team`, `node_type`): Docs, RFCs/ADRs, postmortems, meeting notes, Slack threads, support tickets, release notes, competitor signals, public ladder docs. Pass each user's `acl` on queries from the server session, never from the client.
- **Per-user / persona memory** (`type="memory"`, collections like `eng_manager`, `backend_engineer`, or one per user): 1:1 notes, personal preferences, who someone is coaching, drafts, what each person has already seen. Reviews and feedback live in a restricted collection, not the shared one. Retrieve with `type="all"` and weighted `collections`.

**Declare vs. extract**
- **Declare via bring-your-own-graph** (`graph_payload`: entities with name/type/namespace; relations with source/target/predicate/context) the edges that are deterministic and valuable: `reports_to`, `member_of`, `owns`, `code_owner_of`, `drives`/`advances`, `implemented_by`, `depends_on`, `blocks`, `requested_by`, `affects`, `lost_to`. Sources are HRIS, CODEOWNERS, the OKR tool, Linear/Jira, the CRM, and the repo-to-module map. Remember the limits (500 relations per entity: shard hub nodes such as the company goal).
- **Let HydraDB extract** `mentions`, `decided_in`, topical links between docs and threads, and Signal → Capability hints. Treat these as `inferred`. The blog is explicit that extracted relations are model-derived.
- **Derive in our own layer** (cron, then written back as declared graph edges with `basis=derived`): `pursuing`, `threatens`, `demonstrated`, `has_gap`, `best_fit_for`. These are aggregations over signals and evidence, not single-document facts. Store the explanation in the relation `context` field.
- Caveat: the HydraDB pages we could read do not document edge-level temporal validity. Keep `valid_from`/`valid_to` and `basis` in our own store, or encode them in the relation `context`/metadata, and verify support in the API reference before relying on it.

**Freshness**
- Give each source a stable id (e.g. `pr:cli#1893`) and re-ingest with `upsert="true"`; poll status until `completed` before graph queries, since graph results need completed sources.
- Connectors: sync on a schedule from source apps (HydraDB lists 70 providers) and inherit source permissions. Add webhooks for fast-moving objects (PRs, incidents, tickets), and run nightly full reconciliation for org and CRM data.
- Close out edges by re-ingesting with a `valid_to` rather than deleting. Stamp every answer with the "as of" time of its newest source and flag stale nodes (e.g. no update in 30 days) in the UI.

## Summary: top recommendations
1. Use about 45 node types in 7 layers, with stable namespaced ids and an identity-resolution step before anything is written.
2. Put `provenance`, `basis` (declared/derived/inferred), `confidence` and `valid_from/valid_to` on every edge, as Graphiti does; supersede rather than delete.
3. Seed the graph from systems of record (HRIS, CODEOWNERS, OKR tool, Linear, CRM) through HydraDB bring-your-own-graph; leave `mentions`/`decided_in` to extraction.
4. Compute judgment edges (`pursuing`, `threatens`, `has_gap`, `best_fit_for`) as a separate recomputable layer, always with an explanation.
5. Put org knowledge in one shared knowledge collection and personal or HR-sensitive context in restricted memory collections; enforce ACL at query time.
6. Build the demo around the flagship path: competitor signal → capability → roadmap gap → module → code owner → person → ladder gap.
