/**
 * Runtime configuration. Everything comes from env vars so the IDE extension
 * and the CLI can share one code path.
 */

export interface ForgelineConfig {
  repoRoot: string;
  gatewayUrl: string;
  apiKey: string;
  embeddingModel: string;
  plannerModel: string;
  maxContextTokens: number;
  chunkMaxLines: number;
  chunkOverlapLines: number;
  maxAgentSteps: number;
  sandbox: {
    mode: "local"; // "cloud" is R-09, not implemented
    commandTimeoutMs: number;
    maxConcurrentBackgroundTasks: number;
  };
  telemetry: {
    enabled: boolean;
    endpoint: string;
  };
  // There is intentionally no `memoryDir` / `memoryBackend` here — nothing
  // persists between sessions today. See R-14.
}

function intEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const n = Number.parseInt(raw, 10);
  return Number.isNaN(n) ? fallback : n;
}

export function loadConfig(overrides: Partial<ForgelineConfig> = {}): ForgelineConfig {
  const apiKey = process.env.FORGELINE_API_KEY ?? "";
  if (!apiKey && !overrides.apiKey) {
    throw new Error("FORGELINE_API_KEY is not set. Run `forge login` or export it.");
  }

  const base: ForgelineConfig = {
    repoRoot: process.env.FORGELINE_REPO_ROOT ?? process.cwd(),
    gatewayUrl: process.env.FORGELINE_GATEWAY_URL ?? "https://gateway.forgeline.dev/v1",
    apiKey,
    embeddingModel: process.env.FORGELINE_EMBED_MODEL ?? "forgeline-embed-v2",
    plannerModel: process.env.FORGELINE_PLANNER_MODEL ?? "forgeline-planner-large",
    maxContextTokens: intEnv("FORGELINE_MAX_CONTEXT_TOKENS", 48_000),
    chunkMaxLines: intEnv("FORGELINE_CHUNK_MAX_LINES", 80),
    chunkOverlapLines: intEnv("FORGELINE_CHUNK_OVERLAP", 10),
    maxAgentSteps: intEnv("FORGELINE_MAX_STEPS", 25),
    sandbox: {
      mode: "local",
      commandTimeoutMs: intEnv("FORGELINE_CMD_TIMEOUT_MS", 120_000),
      maxConcurrentBackgroundTasks: intEnv("FORGELINE_MAX_BG_TASKS", 2),
    },
    telemetry: {
      enabled: process.env.FORGELINE_TELEMETRY !== "0",
      endpoint: process.env.FORGELINE_TELEMETRY_URL ?? "https://t.forgeline.dev/ingest",
    },
  };

  return { ...base, ...overrides };
}
