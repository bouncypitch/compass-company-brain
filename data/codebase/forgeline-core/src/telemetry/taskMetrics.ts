import { request } from "undici";
import type { TaskOutcome } from "../agent/session.js";

/**
 * Agent task metrics.
 *
 * `agent_task_success_rate` is the headline number for OKR AE-KR1
 * ("Raise agent task success rate from 41% to 60% by end of Q4").
 * Success = task finished with status "succeeded" AND tests passed (if tests ran).
 *
 * We also track `repeat_failure_rate`: share of failed tasks whose first failing
 * command matches a failure seen on the same repo in a previous session. It's
 * computed offline in the warehouse because the agent itself has no memory of
 * previous sessions (R-14). Last read: ~38% of failures are repeats.
 */

interface TaskEvent {
  event: "task_started" | "task_finished";
  sessionId: string;
  at: number;
  props: Record<string, string | number | boolean | undefined>;
}

export class TaskMetrics {
  private started = 0;
  private succeeded = 0;
  private buffer: TaskEvent[] = [];

  constructor(private readonly opts: { enabled: boolean; endpoint: string }) {}

  taskStarted(sessionId: string, props: { contextTokens: number }): void {
    this.started++;
    this.emit({ event: "task_started", sessionId, at: Date.now(), props });
  }

  taskFinished(sessionId: string, outcome: TaskOutcome, steps: number): void {
    const success = outcome.status === "succeeded" && outcome.testsPassed !== false;
    if (success) this.succeeded++;
    this.emit({
      event: "task_finished",
      sessionId,
      at: Date.now(),
      props: {
        status: outcome.status,
        success,
        steps,
        testsPassed: outcome.testsPassed,
        hasPr: Boolean(outcome.prUrl),
        // Only the count leaves the machine; the lesson text itself is discarded
        // with the session. FL-2310 asked for the text so we could at least mine it.
        lessonsCount: outcome.lessons.length,
      },
    });
  }

  /** AE-KR1. Process-local; the warehouse computes the real rolling number. */
  get successRate(): number {
    return this.started === 0 ? 0 : this.succeeded / this.started;
  }

  private emit(e: TaskEvent): void {
    if (!this.opts.enabled) return;
    this.buffer.push(e);
    if (this.buffer.length >= 20) void this.flush();
  }

  async flush(): Promise<void> {
    if (this.buffer.length === 0) return;
    const batch = this.buffer.splice(0);
    try {
      await request(this.opts.endpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ events: batch }),
      });
    } catch {
      // telemetry must never break a task
    }
  }
}
