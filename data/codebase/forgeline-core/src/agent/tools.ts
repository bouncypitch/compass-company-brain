import { readFile, writeFile } from "node:fs/promises";
import { join, normalize } from "node:path";

import type { LocalRunner } from "../sandbox/localRunner.js";

export interface ToolResult {
  ok: boolean;
  output: string;
}

export interface Tool {
  name: string;
  description: string;
  run(args: Record<string, string>): Promise<ToolResult>;
}

export interface ToolDeps {
  repoRoot: string;
  runner: LocalRunner;
}

function safePath(repoRoot: string, p: string): string {
  const full = normalize(join(repoRoot, p));
  if (!full.startsWith(normalize(repoRoot))) {
    throw new Error(`path escapes repo root: ${p}`);
  }
  return full;
}

export function createTools({ repoRoot, runner }: ToolDeps): Tool[] {
  return [
    {
      name: "read_file",
      description: "Read a file relative to the repo root.",
      async run({ path }) {
        try {
          return { ok: true, output: await readFile(safePath(repoRoot, path!), "utf8") };
        } catch (err) {
          return { ok: false, output: String(err) };
        }
      },
    },
    {
      name: "write_file",
      description: "Overwrite a file with new contents.",
      async run({ path, contents }) {
        await writeFile(safePath(repoRoot, path!), contents ?? "", "utf8");
        return { ok: true, output: `wrote ${path}` };
      },
    },
    {
      name: "run_command",
      description: "Run a shell command in the repo (tests, linters, build).",
      async run({ cmd }) {
        // The agent guesses the test command from package.json every task.
        // It frequently picks `npm test` in pnpm/yarn repos and burns a step (FL-2287).
        const res = await runner.exec(cmd!, { cwd: repoRoot });
        return { ok: res.exitCode === 0, output: res.stdout + res.stderr };
      },
    },
    {
      name: "open_pr",
      description: "Commit current changes on a new branch and open a pull request.",
      async run({ title, body, branch }) {
        const b = branch ?? `forgeline/${Date.now()}`;
        const steps = [
          `git checkout -b ${b}`,
          `git add -A`,
          `git commit -m ${JSON.stringify(title ?? "Forgeline change")}`,
          `gh pr create --title ${JSON.stringify(title ?? "")} --body ${JSON.stringify(body ?? "")}`,
        ];
        let out = "";
        for (const s of steps) {
          const r = await runner.exec(s, { cwd: repoRoot });
          out += r.stdout;
          if (r.exitCode !== 0) return { ok: false, output: out + r.stderr };
        }
        return { ok: true, output: out.trim() };
      },
    },
  ];
}
