#!/usr/bin/env node
import { Command } from "commander";

import { runTask } from "./agent/agentLoop.js";
import { loadConfig } from "./config.js";
import { FileWatcher } from "./ingest/fileWatcher.js";
import { RepoIndexer } from "./ingest/repoIndexer.js";
import { ContextBuilder } from "./retrieval/contextBuilder.js";
import { EmbeddingClient } from "./retrieval/embeddingClient.js";
import { LocalRunner } from "./sandbox/localRunner.js";
import { TaskMetrics } from "./telemetry/taskMetrics.js";

/**
 * Entry point for both the `forge` CLI and the IDE extension host
 * (the extension imports startSession() directly).
 */
export async function startSession(repoRoot?: string) {
  const config = loadConfig(repoRoot ? { repoRoot } : {});

  // Cold start, every time. No cached index, no memory to load. (FL-2231, R-14)
  const indexer = new RepoIndexer(config);
  const stats = await indexer.indexAll();
  console.error(
    `[forgeline] indexed ${stats.files} files / ${stats.chunks} chunks in ${stats.durationMs}ms`,
  );

  const watcher = new FileWatcher(config.repoRoot, indexer);
  watcher.start();

  const contextBuilder = new ContextBuilder({
    index: indexer.index,
    embedder: new EmbeddingClient(config),
    maxTokens: config.maxContextTokens,
  });
  const runner = new LocalRunner(config.sandbox);
  const metrics = new TaskMetrics(config.telemetry);

  return {
    config,
    run: (task: string) => runTask(task, { config, contextBuilder, runner, metrics }),
    runInBackground: (task: string) =>
      runner.runInBackground(task, () => runTask(task, { config, contextBuilder, runner, metrics })),
    async close() {
      await watcher.stop();
      await metrics.flush();
      // Index, embeddings memo, and any session lessons are released here.
    },
  };
}

if (require.main === module) {
  const program = new Command("forge").description("Forgeline coding agent").version("0.14.2");

  program
    .command("task")
    .argument("<description>", "what you want the agent to do")
    .option("--repo <path>", "repository root", process.cwd())
    .option("--background", "run without blocking (local only, see R-09)")
    .action(async (description: string, opts: { repo: string; background?: boolean }) => {
      const session = await startSession(opts.repo);
      try {
        if (opts.background) {
          const bg = session.runInBackground(description);
          console.log(`started background task ${bg.id}; keep this terminal open`);
          await bg.promise;
        } else {
          const outcome = await session.run(description);
          console.log(JSON.stringify(outcome, null, 2));
        }
      } finally {
        await session.close();
      }
    });

  program.parseAsync(process.argv).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
