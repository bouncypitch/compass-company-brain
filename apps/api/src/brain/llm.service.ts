import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import Anthropic from '@anthropic-ai/sdk';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import { z } from 'zod';
import { BRAIN_CAPABILITIES } from '@app-starter/shared';

const Capability = z.enum(BRAIN_CAPABILITIES);

export const RadarSynthesisSchema = z.object({
  summary: z.string().describe('Two sentences: the single most important market shift and what Forgeline should do.'),
  moves: z.array(
    z.object({
      id: z.string().describe('kebab-case id, e.g. move-cursor-cloud-agents'),
      company: z.string(),
      capability: Capability,
      headline: z.string().describe('Under 12 words.'),
      prediction: z.string().describe('What they will likely ship or do next, concrete.'),
      horizon: z.string().describe('e.g. "next 1-2 quarters"'),
      confidence: z.number().describe('0 to 1'),
      signalIds: z.array(z.string()).describe('ids of the supporting signals, only from the provided list'),
      talkClipIds: z.array(z.string()).describe('ids of supporting talk clips, empty if none'),
      reasoning: z.string().describe('How the signals combine into the prediction, 2-3 sentences.'),
    }),
  ),
  patterns: z.array(
    z.object({
      capability: Capability,
      companies: z.array(z.string()),
      summary: z.string(),
      confidence: z.number(),
    }),
  ),
  gaps: z.array(
    z.object({
      id: z.string().describe('kebab-case id, e.g. gap-agent-memory'),
      capability: Capability,
      title: z.string(),
      whyItMatters: z.string().describe('Tie to Forgeline goals/KRs by id and to competitor moves.'),
      roadmapItem: z.string().describe('Roadmap id and title, e.g. "R-14 Agent memory"'),
      codePaths: z.array(z.string()).describe('forgeline-core file paths that must change'),
      affectedGoals: z.array(z.string()).describe('Goal/KR ids, e.g. AE-KR1'),
      owner: z.string().nullable().describe('Current owner name, or null if unowned'),
      urgency: z.enum(['high', 'medium', 'low']),
      recommendation: z.string().describe('What to build, by when, and the first concrete step.'),
      signalIds: z.array(z.string()),
    }),
  ),
});
export type RadarSynthesis = z.infer<typeof RadarSynthesisSchema>;

export const CompassSchema = z.object({
  targetLevel: z.string(),
  headline: z.string().describe('One sentence: the single best promotion move for this person, and why.'),
  levelGaps: z.array(
    z.object({
      dimension: z.string(),
      expectation: z.string().describe('What the next level requires, quoted or closely paraphrased from the ladder'),
      evidence: z.string().describe('What this person has already shown, citing reviews/feedback'),
      status: z.enum(['met', 'partial', 'gap']),
    }),
  ),
  opportunities: z.array(
    z.object({
      rank: z.number(),
      title: z.string(),
      gapId: z.string().nullable(),
      whyYou: z.string().describe('Why this person specifically: strengths, history, code ownership.'),
      ladderGapsClosed: z.array(z.string()),
      managerImpact: z.string().describe('Which of the manager\'s measured KRs it moves, by id.'),
      companyGoal: z.string(),
      deptGoal: z.string(),
      evidence: z.array(z.object({ label: z.string(), source: z.string().describe('doc path, signal id, ticket or memory id') })),
      peopleToTalkTo: z.array(z.object({ name: z.string(), why: z.string() })),
    }),
  ),
  plan90: z.array(z.object({ window: z.string(), milestone: z.string() })),
  managerMeasuredOn: z.array(z.string()),
});
export type CompassSynthesis = z.infer<typeof CompassSchema>;

export const AskSchema = z.object({
  answer: z.string().describe('Direct answer in 2-5 sentences, plain language, naming people, teams, roadmap ids and KRs.'),
  citations: z.array(z.object({ label: z.string(), source: z.string().describe('doc path, signal id, ticket, KR or memory id from the context') })),
  followUps: z.array(z.string()).describe('2-3 natural follow-up questions'),
  talkClipIds: z.array(z.string()).describe('ids of keynote talk clips (talk-NN) that directly support the answer; empty if none'),
});

export const DiffSchema = z.object({
  summary: z.string(),
  files: z.array(z.object({ path: z.string(), patch: z.string().describe('unified diff for this file') })),
});

@Injectable()
export class LlmService {
  private readonly logger = new Logger(LlmService.name);
  private readonly client = new Anthropic();
  private readonly model = 'claude-opus-5-5';

  private async parse<T extends z.ZodTypeAny>(
    schema: T,
    system: string,
    prompt: string,
    effort: 'low' | 'medium' | 'high',
  ): Promise<z.infer<T>> {
    try {
      const response = await this.client.messages.parse({
        model: this.model,
        max_tokens: 16000,
        system,
        messages: [{ role: 'user', content: prompt }],
        output_config: { effort, format: zodOutputFormat(schema) },
      });
      if (response.stop_reason === 'refusal' || !response.parsed_output) {
        throw new Error(`no parsed output (stop_reason=${response.stop_reason})`);
      }
      return response.parsed_output as z.infer<T>;
    } catch (err) {
      if (err instanceof Anthropic.AuthenticationError) throw new ServiceUnavailableException('ANTHROPIC_API_KEY is missing or invalid');
      if (err instanceof Anthropic.RateLimitError) throw new ServiceUnavailableException('Claude is rate limited, try again shortly');
      this.logger.error(`Claude call failed: ${(err as Error).message}`);
      throw new ServiceUnavailableException(`Claude call failed: ${(err as Error).message}`);
    }
  }

  synthesizeRadar(context: string, cutoff: string | null): Promise<RadarSynthesis> {
    const system = [
      'You are the strategy layer of Compass, the company brain for Forgeline, a Series B startup building an AI coding assistant for enterprise teams.',
      'You read public competitor signals plus Forgeline internal docs and code, and you produce evidence-backed competitive intelligence.',
      'Rules: cite only signal ids and talk clip ids that appear in the provided context. Never invent facts, dates or numbers.',
      'Never speculate about named individuals (hiring, firing, departures); reason about teams and roles in aggregate.',
      cutoff
        ? `TIME MACHINE MODE: today is ${cutoff}. You only know the signals provided, all dated before ${cutoff}. Do not use any outside knowledge of events after that date. Make forward-looking predictions.`
        : 'Use only the provided context, not outside knowledge.',
      'Produce 7-9 competitor moves (at least one per company), 3-4 industry patterns that span multiple companies, and 3 strategic gaps for Forgeline ranked by urgency, each mapped to a roadmap item, code paths, and goal/KR ids from the internal docs. Use the full range of signal kinds: launches, hiring and leadership changes, contracts, research, market entries, acquisitions, partnerships and pricing.',
    ].join('\n');
    return this.parse(RadarSynthesisSchema, system, context, cutoff ? 'medium' : 'medium');
  }

  synthesizeCompass(context: string): Promise<CompassSynthesis> {
    const system = [
      'You are the career layer of Compass, the company brain for Forgeline.',
      'Given one employee\'s memories (reviews, feedback, shipped work), the engineering ladder, company and department goals, the roadmap, current competitive gaps, and team context, produce a concrete promotion plan.',
      'Rank 3 opportunities. The best ones close the person\'s specific ladder gaps, sit on unowned or under-staffed work that blocks company goals, and move the KRs their manager is measured on.',
      'Be specific and supportive, like a great mentor. Cite evidence sources (doc paths, ticket ids, memory ids, signal ids) that appear in the context. Never invent facts.',
      'Do not reveal other people\'s private feedback or reviews; only use other people\'s public roles, projects and code ownership.',
      'Refer to people by name; use they/them for anyone whose pronouns are not stated.',
    ].join('\n');
    return this.parse(CompassSchema, system, context, 'medium');
  }

  answer(context: string): Promise<z.infer<typeof AskSchema>> {
    const system = [
      'You are Compass, the company brain of Forgeline (an AI coding-assistant startup). Answer employee questions using ONLY the provided context: HydraDB retrieval (documents, graph relations, memories), the company topology graph, competitor signals, and the transcript of today\'s Company Brain Hackathon keynote (talk clips with ids and timestamps).',
      'When the question is about the keynote or talk, quote the speaker briefly and verbatim from the clips, cite the clip ids in talkClipIds (at most 2, the most relevant), and connect it to what Forgeline/Compass does.',
      'Be concise and specific. Cite sources that appear in the context. If the context does not contain the answer, say what is missing.',
      'Never reveal another employee\'s private reviews or feedback; use only public roles, ownership and work. Use they/them for anyone whose pronouns are not stated.',
    ].join('\n');
    return this.parse(AskSchema, system, context, 'low');
  }

  /**
   * Drafts the PR as plain unified diffs separated by "=== FILE: <path>" lines.
   * Streamed with a large budget: diffs are long and structured JSON output
   * truncated mid-string when thinking used most of a 16K budget.
   */
  async draftDiff(context: string): Promise<z.infer<typeof DiffSchema>> {
    try {
      const stream = this.client.messages.stream({
        model: this.model,
        max_tokens: 64000,
        system:
          'You are a senior engineer at Forgeline. Draft a minimal pull request against the provided forgeline-core files: the first slice of the recommended capability, following the existing code style, with clear TODOs for follow-ups. Output ONLY: one line "SUMMARY: <one sentence>", then for each changed or new file a line "=== FILE: <path>" followed by a unified diff for that file. No prose, no code fences.',
        messages: [{ role: 'user', content: context }],
        output_config: { effort: 'low' },
      });
      const message = await stream.finalMessage();
      const text = message.content.map((b) => (b.type === 'text' ? b.text : '')).join('');
      const summary = /SUMMARY:\s*(.*)/.exec(text)?.[1]?.trim() ?? '';
      const files = text
        .split(/^=== FILE:\s*/m)
        .slice(1)
        .map((chunk) => {
          const [path, ...rest] = chunk.split('\n');
          return { path: path.trim(), patch: rest.join('\n').replace(/```[a-z]*\n?/g, '').trim() };
        })
        .filter((f) => f.path && f.patch);
      return { summary, files };
    } catch (err) {
      this.logger.error(`diff draft failed: ${(err as Error).message}`);
      throw new ServiceUnavailableException(`Claude call failed: ${(err as Error).message}`);
    }
  }

}
