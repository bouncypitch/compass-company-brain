import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";

export interface ExecResult {
  exitCode: number;
  stdout: string;
  stderr: string;
  durationMs: number;
}

export interface BackgroundTask {
  id: string;
  label: string;
  startedAt: number;
  promise: Promise<unknown>;
}

/**
 * Runs commands and background agent tasks on the developer's own machine.
 *
 * "Background agents" today just means a detached promise in this process —
 * close the laptop or quit the IDE and the task dies. Enterprise customers
 * want to kick off a task and come back to a PR (FL-2198).
 *
 * TODO(R-09): cloud sandbox. Add a RemoteRunner implementing the same
 * interface (ephemeral container per task, repo snapshot, streamed logs).
 * Owner: @nadia-haddad. Blocked on infra budget for Q4.
 */
export class LocalRunner {
  private readonly background = new Map<string, BackgroundTask>();

  constructor(
    private readonly opts: { commandTimeoutMs: number; maxConcurrentBackgroundTasks: number },
  ) {}

  exec(cmd: string, { cwd }: { cwd: string }): Promise<ExecResult> {
    const t0 = Date.now();
    return new Promise((resolve) => {
      const child = spawn(cmd, { cwd, shell: true, env: process.env });
      let stdout = "";
      let stderr = "";
      const timer = setTimeout(() => child.kill("SIGKILL"), this.opts.commandTimeoutMs);

      child.stdout.on("data", (d: Buffer) => (stdout += d.toString()));
      child.stderr.on("data", (d: Buffer) => (stderr += d.toString()));
      child.on("close", (code) => {
        clearTimeout(timer);
        resolve({ exitCode: code ?? -1, stdout, stderr, durationMs: Date.now() - t0 });
      });
    });
  }

  /** Fire-and-forget a task. Local only; lost if the process exits. */
  runInBackground<T>(label: string, fn: () => Promise<T>): BackgroundTask {
    if (this.background.size >= this.opts.maxConcurrentBackgroundTasks) {
      throw new Error(
        `too many background tasks (${this.background.size}); cloud sandbox (R-09) not available`,
      );
    }
    const id = randomUUID();
    const promise = fn().finally(() => this.background.delete(id));
    const task: BackgroundTask = { id, label, startedAt: Date.now(), promise };
    this.background.set(id, task);
    return task;
  }

  listBackground(): BackgroundTask[] {
    return [...this.background.values()];
  }
}
