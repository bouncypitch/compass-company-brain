# forgeline-core

Core engine behind the Forgeline IDE extension (`forgeline-vscode`, `forgeline-jetbrains`)
and the `forge` CLI. Given a customer repo, it indexes the code, retrieves relevant
context for a task, and runs an agent loop that plans, edits, tests, and opens a PR.

> Status: GA for the IDE extension, beta for the CLI. See `docs/roadmap.md` in the
> product repo for R-xx items referenced in code comments.

## Architecture

```
  ┌──────────────┐    ┌────────────────┐    ┌──────────────────┐
  │   ingest/    │──▶│   retrieval/   │──▶│      agent/      │
  │ repoIndexer  │    │ embeddingClient│    │ agentLoop        │
  │ chunker      │    │ vectorIndex    │    │ planner / tools  │
  │ fileWatcher  │    │ contextBuilder │    │ session          │
  └──────────────┘    └────────────────┘    └────────┬─────────┘
                                                      │
                                   ┌──────────────────┴──────────┐
                                   │ sandbox/localRunner         │
                                   │ telemetry/taskMetrics       │
                                   └─────────────────────────────┘
```

1. **ingest/** walks the repo, splits files into chunks, and keeps the index fresh
   while the session is open (`fileWatcher`).
2. **retrieval/** embeds chunks, stores them in an in-process vector index, and
   assembles a token-budgeted context window for each task.
3. **agent/** runs the plan → act → observe loop with a small toolset (read, edit,
   run tests, open PR). Session state lives in memory for the duration of a task.
4. **sandbox/** executes commands and background tasks on the developer's machine.
5. **telemetry/** emits task outcome metrics (feeds OKR AE-KR1: agent task success rate).

### What is *not* here (yet)

- **Persistent memory.** Every session starts cold: the index is rebuilt from scratch
  and the agent has no record of past tasks, PR review feedback, or incidents.
  Tracked as roadmap item **R-14 "Agent memory"** — currently unowned.
- **Cloud sandbox.** Background agents only run locally (`sandbox/localRunner.ts`).
  Tracked as **R-09**.

## Modules & owners

| Module        | Owners                                   | Notes                                  |
|---------------|------------------------------------------|----------------------------------------|
| `ingest/`     | @jordan-rivera, @priya-shah              | Indexing, chunking, file watching      |
| `retrieval/`  | @jordan-rivera, @priya-shah              | Embeddings, vector index, context      |
| `agent/`      | @marcus-oyelaran, @sam-okafor (@forgeline/agent-eng) | Agent loop, planner, tools |
| `sandbox/`    | @nadia-haddad                              | Local runner; cloud sandbox is R-09    |
| `telemetry/`  | @ian-fletcher                            | Task metrics, OKR dashboards           |
| `memory/`     | _unowned_                                | Does not exist. R-14.                  |

See `CODEOWNERS` for review routing.

## Development

```bash
npm install
npm run build
npm test
forge task "add input validation to the signup handler" --repo ../acme-api
```

Config is read from env vars (see `src/config.ts`). The embedding provider defaults
to `forgeline-embed-v2` via the Forgeline gateway.
