// Company brain ("Compass") types shared between the API and the web app.

export const BRAIN_CAPABILITIES = [
  'background_agents',
  'codebase_memory',
  'multi_agent',
  'code_review',
  'enterprise',
  'own_models',
  'editor_ux',
  'app_builder',
  'pricing_business',
] as const;

export type BrainCapability = (typeof BRAIN_CAPABILITIES)[number];

export const BRAIN_CAPABILITY_LABELS: Record<BrainCapability, string> = {
  background_agents: 'Background agents',
  codebase_memory: 'Codebase memory',
  multi_agent: 'Multi-agent',
  code_review: 'Code review',
  enterprise: 'Enterprise',
  own_models: 'Own models',
  editor_ux: 'Editor UX',
  app_builder: 'App builder',
  pricing_business: 'Pricing & business',
};

export interface BrainSignal {
  id: string;
  company: string;
  kind: string;
  title: string;
  date: string;
  url: string;
  summary: string;
  capability: BrainCapability;
}

export interface BrainTalkClip {
  id: string;
  startSec: number;
  endSec: number;
  text: string;
}

export interface BrainGraphNode {
  id: string;
  label: string;
  type: 'signal' | 'company' | 'move' | 'capability' | 'gap' | 'roadmap' | 'code' | 'goal' | 'person' | 'talk' | 'skill' | 'team' | 'doc' | 'customer' | 'ticket';
  detail?: string;
  url?: string;
}

export interface BrainGraphEdge {
  id: string;
  source: string;
  target: string;
  label: string;
}

export interface BrainGraph {
  nodes: BrainGraphNode[];
  edges: BrainGraphEdge[];
}

export interface CompetitorMove {
  id: string;
  company: string;
  capability: BrainCapability;
  headline: string;
  prediction: string;
  horizon: string;
  confidence: number;
  signalIds: string[];
  talkClipIds: string[];
  reasoning: string;
}

export interface IndustryPattern {
  capability: BrainCapability;
  companies: string[];
  summary: string;
  confidence: number;
}

export interface StrategicGap {
  id: string;
  capability: BrainCapability;
  title: string;
  whyItMatters: string;
  roadmapItem: string;
  codePaths: string[];
  affectedGoals: string[];
  owner: string | null;
  urgency: 'high' | 'medium' | 'low';
  recommendation: string;
  signalIds: string[];
}

export interface LandscapeCell {
  capability: BrainCapability;
  company: string;
  strength: number;
  signalIds: string[];
}

export interface RadarResult {
  generatedAt: string;
  cutoff: string | null;
  summary: string;
  moves: CompetitorMove[];
  patterns: IndustryPattern[];
  gaps: StrategicGap[];
  landscape: LandscapeCell[];
  signals: BrainSignal[];
  talkClips: BrainTalkClip[];
  graph: BrainGraph;
  cached: boolean;
}

export interface TimeMachineReveal {
  company: string;
  announcement: string;
  date: string;
  url: string;
  why: string;
}

export interface TimeMachineResult {
  cutoff: string;
  radar: RadarResult;
  reveals: TimeMachineReveal[];
}

export interface BrainPerson {
  id: string;
  name: string;
  title: string;
  level: string;
  team: string;
  managerId: string | null;
}

export interface LevelGap {
  dimension: string;
  expectation: string;
  evidence: string;
  status: 'met' | 'partial' | 'gap';
}

export interface CompassOpportunity {
  rank: number;
  title: string;
  gapId: string | null;
  whyYou: string;
  ladderGapsClosed: string[];
  managerImpact: string;
  companyGoal: string;
  deptGoal: string;
  evidence: { label: string; source: string }[];
  peopleToTalkTo: { name: string; why: string }[];
}

export interface CompassResult {
  generatedAt: string;
  employee: BrainPerson & { managerName: string | null };
  targetLevel: string;
  headline: string;
  levelGaps: LevelGap[];
  opportunities: CompassOpportunity[];
  plan90: { window: string; milestone: string }[];
  managerMeasuredOn: string[];
  graph: BrainGraph;
  cached: boolean;
}

export interface AcceptRecommendationResult {
  gapId: string;
  priorityId: string;
  indexingStatus: string;
  diff: { path: string; patch: string }[];
}

export interface IndexingStatusResult {
  id: string;
  status: string;
}

export interface AskCitation {
  label: string;
  source: string;
}

export interface AskResult {
  question: string;
  answer: string;
  citations: AskCitation[];
  followUps: string[];
  graphEvidence: { source: string; relation: string; target: string }[];
  usedHydra: boolean;
  /** Moments of the hackathon keynote recording the answer cites (playable). */
  talkClips?: BrainTalkClip[];
}

export interface TopologyStats {
  people: number;
  teams: number;
  goals: number;
  roadmapItems: number;
  codeModules: number;
  docs: number;
  customers: number;
  tickets: number;
  relations: number;
}

export interface TopologyResult {
  graph: BrainGraph;
  stats: TopologyStats;
}
