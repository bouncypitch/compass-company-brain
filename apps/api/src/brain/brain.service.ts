import { ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { BrainInsightKind, Prisma } from '@prisma/client';
import {
  AcceptRecommendationResult,
  AskResult,
  TopologyResult,
  BrainGraph,
  BrainGraphEdge,
  BrainGraphNode,
  BrainPerson,
  BrainSignal,
  BRAIN_CAPABILITIES,
  BRAIN_CAPABILITY_LABELS,
  CompassResult,
  LandscapeCell,
  RadarResult,
  StrategicGap,
  TimeMachineResult,
} from '@app-starter/shared';
import { PrismaService } from '../prisma/prisma.service';
import { OrganizationsService } from '../organizations/organizations.service';
import { HydraService } from './hydra.service';
import { CompassSynthesis, LlmService, RadarSynthesis } from './llm.service';
import { buildTopology, topologyText } from './topology';
import {
  loadMemories,
  loadPeople,
  loadSignals,
  loadTalkClips,
  loadTimeMachine,
  readCodeFiles,
  readDataFile,
  readInternalDocs,
} from './brain-data';

/** Cutoff for the time-machine demo: every reveal is dated after it. */
export const TIME_MACHINE_CUTOFF = '2026-08-01';

const MEMORY_DIFF_FILES = ['src/agent/session.ts', 'src/agent/agentLoop.ts', 'src/retrieval/contextBuilder.ts', 'src/config.ts'];

/**
 * Compass: the company brain. Reads competitor signals and internal knowledge
 * through HydraDB, reasons with Claude, and caches every result per
 * organization so the demo can replay instantly.
 */
@Injectable()
export class BrainService {
  private readonly logger = new Logger(BrainService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly organizationsService: OrganizationsService,
    private readonly hydra: HydraService,
    private readonly llm: LlmService,
  ) {}

  // ---------- radar ----------

  async getRadar(userId: string, organizationId: string): Promise<RadarResult | null> {
    await this.requireMember(userId, organizationId);
    return this.latest<RadarResult>(organizationId, BrainInsightKind.RADAR, 'live');
  }

  async runRadar(userId: string, organizationId: string): Promise<RadarResult> {
    await this.requireMember(userId, organizationId);
    const radar = await this.buildRadar(null);
    await this.save(organizationId, BrainInsightKind.RADAR, 'live', radar);
    return radar;
  }

  async runTimeMachine(userId: string, organizationId: string): Promise<TimeMachineResult> {
    await this.requireMember(userId, organizationId);
    const cached = await this.latest<TimeMachineResult>(organizationId, BrainInsightKind.TIME_MACHINE, TIME_MACHINE_CUTOFF);
    if (cached) return cached;
    const radar = await this.buildRadar(TIME_MACHINE_CUTOFF);
    const reveals = loadTimeMachine()
      .filter((t) => t.date > TIME_MACHINE_CUTOFF)
      .map(({ company, announcement, date, url, why }) => ({ company, announcement, date, url, why }));
    const result: TimeMachineResult = { cutoff: TIME_MACHINE_CUTOFF, radar, reveals };
    await this.save(organizationId, BrainInsightKind.TIME_MACHINE, TIME_MACHINE_CUTOFF, result);
    return result;
  }

  private async buildRadar(cutoff: string | null): Promise<RadarResult> {
    const signals = loadSignals().filter((s) => !cutoff || s.date < cutoff);
    const talkClips = cutoff ? [] : loadTalkClips();
    const hydra = await this.hydra.query(
      'Which competitor moves in AI coding tools threaten Forgeline goals, roadmap items and code? What capabilities are competitors converging on?',
      { market: 1, company: 1 },
    );
    const context = [
      `<competitor_signals count="${signals.length}">\n${signals.map(signalLine).join('\n')}\n</competitor_signals>`,
      talkClips.length
        ? `<talk_clips speaker="Dave Nielsen, Company Brain Hackathon MC" date="2026-10-12">\n${talkClips.map((c) => `[${c.id} @${c.startSec}s] ${c.text}`).join('\n')}\n</talk_clips>`
        : '',
      hydra.text ? `<hydradb_retrieval>\n${hydra.text}\n</hydradb_retrieval>` : '',
      `<forgeline_internal>\n${readDataFile('internal/company.md')}\n\n${readDataFile('internal/okrs.md')}\n\n${readDataFile('internal/roadmap.md')}\n</forgeline_internal>`,
      `<forgeline_code_readme>\n${readDataFile('codebase/forgeline-core/README.md')}\n</forgeline_code_readme>`,
    ].join('\n\n');

    const synthesis = await this.llm.synthesizeRadar(context, cutoff);
    const known = new Set(signals.map((s) => s.id));
    const clean = sanitizeRadar(synthesis, known, new Set(talkClips.map((c) => c.id)));
    return {
      generatedAt: new Date().toISOString(),
      cutoff,
      summary: clean.summary,
      moves: clean.moves,
      patterns: clean.patterns,
      gaps: clean.gaps,
      landscape: buildLandscape(signals),
      signals,
      talkClips,
      graph: buildRadarGraph(clean, signals),
      cached: false,
    };
  }

  // ---------- recommendations ----------

  async acceptRecommendation(userId: string, organizationId: string, gapId: string, fresh = false): Promise<AcceptRecommendationResult> {
    await this.requireMember(userId, organizationId);
    if (!fresh) {
      // Live demos replay the last drafted PR instantly; ?fresh=true re-drafts.
      const prior = await this.latest<AcceptRecommendationResult & { gap?: unknown }>(organizationId, BrainInsightKind.RECOMMENDATION, gapId);
      if (prior && prior.diff?.length) {
        return { gapId, priorityId: prior.priorityId, diff: prior.diff, indexingStatus: await this.hydra.status('company', prior.priorityId) };
      }
    }
    const radar = await this.latest<RadarResult>(organizationId, BrainInsightKind.RADAR, 'live');
    const gap = radar?.gaps.find((g) => g.id === gapId);
    if (!gap) throw new NotFoundException(`Recommendation not found: ${gapId}`);

    const priorityId = `priority-${gap.id}`;
    const body = [
      `Status: ACCEPTED as a Q4 2026 priority on ${new Date().toISOString().slice(0, 10)}. Owner: UNOWNED (needs a lead).`,
      `Roadmap: ${gap.roadmapItem}. Goals: ${gap.affectedGoals.join(', ')}.`,
      `Why: ${gap.whyItMatters}`,
      `Recommendation: ${gap.recommendation}`,
      `Code: ${gap.codePaths.join(', ')}`,
      `Competitor evidence: ${gap.signalIds.join(', ')}`,
    ].join('\n\n');
    await this.hydra.ingestText('company', priorityId, `Accepted priority: ${gap.title}`, body, { kind: 'priority', gapId: gap.id }, {
      entities: {
        p: { name: gap.title, type: 'Priority', namespace: 'company' },
        r: { name: gap.roadmapItem, type: 'RoadmapItem', namespace: 'company' },
        ...Object.fromEntries(gap.affectedGoals.map((g, i) => [`g${i}`, { name: g, type: 'Goal', namespace: 'company' }])),
      },
      relations: [
        { source: 'p', target: 'r', predicate: 'prioritizes', context: gap.recommendation.slice(0, 200) },
        ...gap.affectedGoals.map((_, i) => ({ source: 'p', target: `g${i}`, predicate: 'unblocks', context: gap.whyItMatters.slice(0, 200) })),
      ],
    });

    let diff: AcceptRecommendationResult['diff'] = [];
    try {
      const draft = await this.llm.draftDiff(
        `Recommendation to implement:\n${body}\n\nCurrent code:\n${readCodeFiles(gap.capability === 'codebase_memory' ? MEMORY_DIFF_FILES : gap.codePaths.map((p) => p.replace(/^forgeline-core\//, '')))}`,
      );
      diff = draft.files;
    } catch (err) {
      this.logger.warn(`diff draft failed: ${(err as Error).message}`);
    }
    const result: AcceptRecommendationResult = { gapId, priorityId, indexingStatus: await this.hydra.status('company', priorityId), diff };
    await this.save(organizationId, BrainInsightKind.RECOMMENDATION, gapId, { ...result, gap });
    return result;
  }

  async priorityStatus(userId: string, organizationId: string, priorityId: string): Promise<{ id: string; status: string }> {
    await this.requireMember(userId, organizationId);
    return { id: priorityId, status: await this.hydra.status('company', priorityId) };
  }

  // ---------- compass ----------

  async listPeople(userId: string, organizationId: string): Promise<BrainPerson[]> {
    await this.requireMember(userId, organizationId);
    return loadPeople().map(({ id, name, title, level, team, managerId }) => ({ id, name, title, level, team, managerId }));
  }

  async getCompass(userId: string, organizationId: string, employeeId: string, refresh: boolean): Promise<CompassResult> {
    await this.requireMember(userId, organizationId);
    if (!refresh) {
      const cached = await this.latest<CompassResult>(organizationId, BrainInsightKind.COMPASS, employeeId);
      if (cached) return cached;
    }
    const people = loadPeople();
    const person = people.find((p) => p.id === employeeId);
    if (!person) throw new NotFoundException(`Employee not found: ${employeeId}`);
    const manager = people.find((p) => p.id === person.managerId) ?? null;
    const memories = loadMemories(employeeId);
    const accepted = await this.prisma.brainInsight.findMany({
      where: { organizationId, kind: BrainInsightKind.RECOMMENDATION },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });
    const radar = await this.latest<RadarResult>(organizationId, BrainInsightKind.RADAR, 'live');
    const memCollection = `mem_${employeeId.replace(/-/g, '_')}`;
    const hydra = await this.hydra.query(
      `What should ${person.name} (${person.level}, ${person.team}) work on to reach the next level? Which unowned priorities match their strengths and their manager's goals?`,
      { company: 1, market: 0.4, [memCollection]: 1.5 },
      'all',
    );

    const context = [
      `<employee>\n${JSON.stringify(person, null, 2)}\nManager: ${manager ? `${manager.name}, ${manager.title}` : 'none'}\n</employee>`,
      `<employee_memories>\n${memories.map((m) => `[${m.id}] (${m.kind}, ${m.date}) ${m.title}\n${m.text}`).join('\n\n') || 'none on file'}\n</employee_memories>`,
      `<team_directory>\n${people.map((p) => `${p.id} | ${p.name} | ${p.title} | ${p.level} | ${p.team} | projects: ${p.currentProjects.join('; ')}`).join('\n')}\n</team_directory>`,
      accepted.length
        ? `<newly_accepted_priorities note="accepted by leadership today; currently unowned">\n${accepted.map((a) => JSON.stringify((a.payload as any).gap ?? a.payload)).join('\n')}\n</newly_accepted_priorities>`
        : '',
      radar ? `<competitive_gaps>\n${radar.gaps.map((g) => `${g.id}: ${g.title} | ${g.roadmapItem} | owner: ${g.owner ?? 'none'} | ${g.whyItMatters}`).join('\n')}\n</competitive_gaps>` : '',
      hydra.text ? `<hydradb_retrieval>\n${hydra.text}\n</hydradb_retrieval>` : '',
      `<forgeline_internal>\n${readInternalDocs()}\n</forgeline_internal>`,
      `<codeowners>\n${readDataFile('codebase/forgeline-core/CODEOWNERS')}\n</codeowners>`,
    ].join('\n\n');

    const synthesis = await this.llm.synthesizeCompass(context);
    const result: CompassResult = {
      generatedAt: new Date().toISOString(),
      employee: { id: person.id, name: person.name, title: person.title, level: person.level, team: person.team, managerId: person.managerId, managerName: manager?.name ?? null },
      targetLevel: synthesis.targetLevel,
      headline: synthesis.headline,
      levelGaps: synthesis.levelGaps,
      opportunities: synthesis.opportunities,
      plan90: synthesis.plan90,
      managerMeasuredOn: synthesis.managerMeasuredOn,
      graph: buildCompassGraph(synthesis, person.name, manager?.name ?? null),
      cached: false,
    };
    await this.save(organizationId, BrainInsightKind.COMPASS, employeeId, result);
    return result;
  }

  // ---------- company knowledge ----------

  async topology(userId: string, organizationId: string): Promise<TopologyResult> {
    await this.requireMember(userId, organizationId);
    return buildTopology();
  }

  async ask(userId: string, organizationId: string, question: string): Promise<AskResult> {
    await this.requireMember(userId, organizationId);
    const topology = buildTopology();
    const hydra = await this.hydra.query(question, { company: 1, market: 0.6 }, 'knowledge');
    const signals = loadSignals();
    const context = [
      `<question>${question}</question>`,
      hydra.text ? `<hydradb_retrieval>\n${hydra.text}\n</hydradb_retrieval>` : '',
      `<company_topology>\n${topologyText(topology)}\n</company_topology>`,
      `<forgeline_internal>\n${readInternalDocs()}\n</forgeline_internal>`,
      `<competitor_signals>\n${signals.map(signalLine).join('\n')}\n</competitor_signals>`,
    ].join('\n\n');
    const out = await this.llm.answer(context);
    return { question, ...out, graphEvidence: hydra.triplets.slice(0, 12), usedHydra: hydra.ok };
  }

  // ---------- helpers ----------

  private async requireMember(userId: string, organizationId: string): Promise<void> {
    const role = await this.organizationsService.getUserRoleInOrganization(userId, organizationId);
    if (!role) throw new ForbiddenException('You do not have access to this organization');
  }

  private async latest<T>(organizationId: string, kind: BrainInsightKind, subjectKey: string): Promise<T | null> {
    const row = await this.prisma.brainInsight.findFirst({
      where: { organizationId, kind, subjectKey },
      orderBy: { createdAt: 'desc' },
    });
    return row ? ({ ...(row.payload as object), cached: true } as T) : null;
  }

  private async save(organizationId: string, kind: BrainInsightKind, subjectKey: string, payload: unknown): Promise<void> {
    await this.prisma.brainInsight.create({
      data: { organizationId, kind, subjectKey, payload: payload as Prisma.InputJsonValue },
    });
  }
}

const signalLine = (s: BrainSignal): string =>
  `[${s.id}] ${s.date} | ${s.company} | ${s.kind} | ${s.capability} | ${s.title} — ${s.summary}`;

function sanitizeRadar(r: RadarSynthesis, knownSignals: Set<string>, knownClips: Set<string>): RadarSynthesis {
  const keep = (ids: string[]): string[] => ids.filter((id) => knownSignals.has(id));
  const clamp = (n: number): number => Math.max(0, Math.min(1, n));
  return {
    ...r,
    moves: r.moves.map((m) => ({ ...m, confidence: clamp(m.confidence), signalIds: keep(m.signalIds), talkClipIds: m.talkClipIds.filter((c) => knownClips.has(c)) })),
    patterns: r.patterns.map((p) => ({ ...p, confidence: clamp(p.confidence) })),
    gaps: r.gaps.map((g) => ({ ...g, signalIds: keep(g.signalIds) })),
  };
}

function buildLandscape(signals: BrainSignal[]): LandscapeCell[] {
  const companies = [...new Set(signals.map((s) => s.company))];
  return BRAIN_CAPABILITIES.flatMap((capability) =>
    companies.map((company) => {
      const ids = signals.filter((s) => s.company === company && s.capability === capability).map((s) => s.id);
      return { capability, company, strength: Math.min(3, ids.length), signalIds: ids };
    }),
  );
}

class GraphBuilder {
  private readonly nodes = new Map<string, BrainGraphNode>();
  private readonly edges = new Map<string, BrainGraphEdge>();
  node(id: string, label: string, type: BrainGraphNode['type'], extra: Partial<BrainGraphNode> = {}): string {
    if (!this.nodes.has(id)) this.nodes.set(id, { id, label, type, ...extra });
    return id;
  }
  edge(source: string, target: string, label: string): void {
    const id = `${source}->${target}`;
    if (!this.edges.has(id)) this.edges.set(id, { id, source, target, label });
  }
  build(): BrainGraph {
    return { nodes: [...this.nodes.values()], edges: [...this.edges.values()] };
  }
}

/** Signal -> Company move -> Capability -> Forgeline gap -> Roadmap / Code / Goal. */
function buildRadarGraph(r: RadarSynthesis, signals: BrainSignal[]): BrainGraph {
  const g = new GraphBuilder();
  const byId = new Map(signals.map((s) => [s.id, s]));
  for (const m of r.moves) {
    const move = g.node(m.id, m.headline, 'move', { detail: `${m.company} · ${Math.round(m.confidence * 100)}% · ${m.horizon}` });
    for (const sid of m.signalIds.slice(0, 3)) {
      const s = byId.get(sid);
      if (s) g.edge(g.node(sid, `${s.company}: ${s.title}`, 'signal', { detail: s.date, url: s.url }), move, 'indicates');
    }
    for (const cid of m.talkClipIds) g.edge(g.node(cid, 'Hackathon talk clip', 'talk'), move, 'supports');
    g.edge(move, g.node(`cap-${m.capability}`, BRAIN_CAPABILITY_LABELS[m.capability], 'capability'), 'pursues');
  }
  for (const gap of r.gaps) {
    const gapNode = g.node(gap.id, gap.title, 'gap', { detail: gap.owner ? `owner: ${gap.owner}` : 'UNOWNED' });
    g.edge(g.node(`cap-${gap.capability}`, BRAIN_CAPABILITY_LABELS[gap.capability], 'capability'), gapNode, 'threatens');
    g.edge(gapNode, g.node(`rm-${gap.roadmapItem}`, gap.roadmapItem, 'roadmap'), 'tracked as');
    for (const p of gap.codePaths.slice(0, 2)) g.edge(gapNode, g.node(`code-${p}`, p, 'code'), 'changes');
    for (const kr of gap.affectedGoals.slice(0, 3)) g.edge(gapNode, g.node(`goal-${kr}`, kr, 'goal'), 'blocks');
  }
  return g.build();
}

/** Company goal -> Dept goal -> Opportunity -> Person, plus ladder gaps closed. */
function buildCompassGraph(c: CompassSynthesis, personName: string, managerName: string | null): BrainGraph {
  const g = new GraphBuilder();
  const person = g.node('person', personName, 'person');
  const manager = managerName ? g.node('manager', managerName, 'person', { detail: 'manager' }) : null;
  for (const o of c.opportunities.slice(0, 3)) {
    const opp = g.node(`opp-${o.rank}`, o.title, 'gap', { detail: `#${o.rank}` });
    const company = g.node(`cg-${o.companyGoal}`, o.companyGoal, 'goal');
    const dept = g.node(`dg-${o.deptGoal}`, o.deptGoal, 'goal');
    g.edge(company, dept, 'drives');
    g.edge(dept, opp, 'blocked by');
    g.edge(opp, person, 'best fit');
    if (manager) g.edge(opp, manager, 'moves KRs of');
    for (const skill of o.ladderGapsClosed.slice(0, 2)) g.edge(opp, g.node(`skill-${skill}`, skill, 'skill'), 'closes');
  }
  return g.build();
}

export type { StrategicGap };
