import { request } from "undici";

import type { ForgelineConfig } from "../config.js";
import { renderContext, type TaskContext } from "../retrieval/contextBuilder.js";
import type { SessionStep } from "./session.js";
import type { Tool } from "./tools.js";

export type PlannerAction =
  | { type: "tool"; tool: string; args: Record<string, string>; thought: string }
  | { type: "finish"; summary: string; lessons?: string[] };

/**
 * Asks the planner model for the next action given the task context and the
 * steps taken so far in *this* session.
 *
 * The prompt has no knowledge of earlier sessions. If a reviewer told us last
 * week "don't add new deps without an ADR", the planner has no way to know.
 */
export class Planner {
  constructor(private readonly config: ForgelineConfig) {}

  buildPrompt(ctx: TaskContext, history: SessionStep[], tools: Tool[]): string {
    const toolList = tools.map((t) => `- ${t.name}: ${t.description}`).join("\n");
    const transcript = history
      .map((s) => `[${s.kind}${s.tool ? `:${s.tool}` : ""}] ${s.content}`)
      .join("\n");

    return [
      renderContext(ctx),
      "### tools",
      toolList,
      "### transcript",
      transcript || "(no steps yet)",
      "### instructions",
      'Respond with JSON: {"type":"tool","tool":...,"args":{...},"thought":...} or ' +
        '{"type":"finish","summary":...,"lessons":[...]}. ' +
        "Use `lessons` for anything you learned about this repo that would help next time.",
    ].join("\n\n");
  }

  async next(ctx: TaskContext, history: SessionStep[], tools: Tool[]): Promise<PlannerAction> {
    const prompt = this.buildPrompt(ctx, history, tools);
    const res = await request(`${this.config.gatewayUrl}/chat`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify({
        model: this.config.plannerModel,
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        temperature: 0.2,
      }),
    });

    if (res.statusCode >= 400) {
      throw new Error(`planner ${res.statusCode}: ${await res.body.text()}`);
    }
    const json = (await res.body.json()) as { content: string };
    return parseAction(json.content);
  }
}

export function parseAction(raw: string): PlannerAction {
  const parsed = JSON.parse(raw) as Partial<PlannerAction> & Record<string, unknown>;
  if (parsed.type === "finish") {
    return {
      type: "finish",
      summary: String(parsed.summary ?? ""),
      lessons: Array.isArray(parsed.lessons) ? parsed.lessons.map(String) : [],
    };
  }
  if (parsed.type === "tool" && typeof parsed.tool === "string") {
    return {
      type: "tool",
      tool: parsed.tool,
      args: (parsed.args as Record<string, string>) ?? {},
      thought: String(parsed.thought ?? ""),
    };
  }
  throw new Error(`unparseable planner action: ${raw.slice(0, 200)}`);
}
