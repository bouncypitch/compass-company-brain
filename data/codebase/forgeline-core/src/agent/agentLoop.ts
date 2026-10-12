import type { ForgelineConfig } from "../config.js";
import type { ContextBuilder } from "../retrieval/contextBuilder.js";
import type { LocalRunner } from "../sandbox/localRunner.js";
import { TaskMetrics } from "../telemetry/taskMetrics.js";
import { Planner } from "./planner.js";
import { AgentSession, type TaskOutcome } from "./session.js";
import { createTools } from "./tools.js";

export interface AgentLoopDeps {
  config: ForgelineConfig;
  contextBuilder: ContextBuilder;
  runner: LocalRunner;
  metrics: TaskMetrics;
}

/**
 * plan → act → observe, until the planner says finish or we hit maxAgentSteps.
 *
 * Each call to runTask() is fully independent:
 *   1. a brand-new AgentSession (empty)
 *   2. context built from scratch via ContextBuilder (code chunks only)
 *   3. outcome + lessons reported to telemetry, then discarded
 *
 * There is no step where we look up what happened the last time someone ran a
 * similar task on this repo, or what reviewers said about our previous PRs.
 */
export async function runTask(task: string, deps: AgentLoopDeps): Promise<TaskOutcome> {
  const { config, contextBuilder, runner, metrics } = deps;
  const session = new AgentSession(config.repoRoot, task);
  const planner = new Planner(config);
  const tools = createTools({ repoRoot: config.repoRoot, runner });
  const toolsByName = new Map(tools.map((t) => [t.name, t]));

  // TODO(R-14): recall relevant memories (repo conventions, past outcomes for
  // similar tasks, review feedback) here and pass them into contextBuilder.build().
  const ctx = await contextBuilder.build(task);
  metrics.taskStarted(session.id, { contextTokens: ctx.totalTokens });

  let prUrl: string | undefined;
  let testsPassed: boolean | undefined;

  try {
    for (let step = 0; step < config.maxAgentSteps; step++) {
      const action = await planner.next(ctx, session.steps, tools);

      if (action.type === "finish") {
        session.record("final", action.summary);
        action.lessons?.forEach((l) => session.addLesson(l));
        const outcome = session.end({ status: "succeeded", prUrl, testsPassed });
        metrics.taskFinished(session.id, outcome, session.stepCount);
        // TODO(R-14): memoryStore.saveOutcome(outcome) — lessons are dropped on the floor right now.
        return outcome;
      }

      session.record("plan", action.thought);
      const tool = toolsByName.get(action.tool);
      if (!tool) {
        session.record("observation", `unknown tool ${action.tool}`);
        continue;
      }

      session.record("tool_call", JSON.stringify(action.args), tool.name);
      const result = await tool.run(action.args);
      session.record("observation", result.output.slice(0, 4_000), tool.name);

      if (tool.name === "run_command" && /test/.test(action.args.cmd ?? "")) {
        testsPassed = result.ok;
        if (!result.ok) session.addLesson(`test command failed: ${action.args.cmd}`);
      }
      if (tool.name === "open_pr" && result.ok) {
        prUrl = result.output.split("\n").find((l) => l.startsWith("https://"));
      }
    }

    const outcome = session.end({ status: "aborted", prUrl, testsPassed });
    metrics.taskFinished(session.id, outcome, config.maxAgentSteps);
    return outcome;
  } catch (err) {
    session.addLesson(`crashed: ${(err as Error).message}`);
    const outcome = session.end({ status: "failed", prUrl, testsPassed });
    metrics.taskFinished(session.id, outcome, session.stepCount);
    throw err;
  }
}
