import { randomUUID } from "node:crypto";

export type StepKind = "plan" | "tool_call" | "observation" | "reflection" | "final";

export interface SessionStep {
  kind: StepKind;
  at: number;
  content: string;
  tool?: string;
}

export interface TaskOutcome {
  status: "succeeded" | "failed" | "aborted";
  prUrl?: string;
  testsPassed?: boolean;
  /** Free-text notes the agent writes when it hits a dead end or a reviewer pushes back. */
  lessons: string[];
}

/**
 * Per-task session state.
 *
 * Everything here lives in process memory and is thrown away in `end()`.
 * That includes `lessons` — e.g. "this repo uses pnpm, not npm", "reviewers
 * reject PRs that touch generated/ files", "integration tests need
 * DOCKER_HOST set". The agent figures these out mid-task and then forgets
 * them the moment the task finishes.
 *
 * Customers keep telling us the agent "repeats the same mistakes" across
 * tasks (see FL-2287, FL-2310, and the Acme QBR notes). This is why.
 *
 * TODO(R-14): persist lessons + outcome to a MemoryStore in end(), and load
 * relevant ones when the session is created. R-14 "Agent memory" is on the
 * roadmap but has no owner.
 */
export class AgentSession {
  readonly id = randomUUID();
  readonly startedAt = Date.now();
  readonly steps: SessionStep[] = [];
  readonly lessons: string[] = [];
  private ended = false;

  constructor(
    readonly repoRoot: string,
    readonly task: string,
  ) {}

  record(kind: StepKind, content: string, tool?: string): void {
    if (this.ended) throw new Error(`session ${this.id} already ended`);
    this.steps.push({ kind, at: Date.now(), content, tool });
  }

  addLesson(lesson: string): void {
    if (!this.lessons.includes(lesson)) this.lessons.push(lesson);
  }

  get stepCount(): number {
    return this.steps.filter((s) => s.kind === "tool_call").length;
  }

  /**
   * Finalize the session. Returns the outcome for telemetry, then drops state.
   * Nothing is written to disk.
   */
  end(outcome: Omit<TaskOutcome, "lessons">): TaskOutcome {
    this.ended = true;
    const result: TaskOutcome = { ...outcome, lessons: [...this.lessons] };

    // Intentionally not persisted — see TODO(R-14) above.
    this.steps.length = 0;
    this.lessons.length = 0;

    return result;
  }
}
