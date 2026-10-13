import type {
  AcceptRecommendationResult,
  AskResult,
  BrainPerson,
  CompassResult,
  RadarResult,
  TimeMachineResult,
  TopologyResult,
} from '@app-starter/shared';

/**
 * Static stand-in for apps/web/src/lib/brain-api.ts. Same exported names and
 * signatures, but every call reads the recorded snapshot in public/snapshot/
 * instead of the API, so the deck and journey run with no backend or keys.
 */

const SNAPSHOT_BASE = `${process.env.NEXT_PUBLIC_BASE_PATH ?? ''}/snapshot`;
const ACCEPT_DELAY_MS = 1500;
const ASK_DELAY_MS = 900;
const FALLBACK_NOTE = 'Static demo: showing a recorded answer — live answers need the backend.';

const cache = new Map<string, Promise<unknown>>();

const load = <T>(file: string): Promise<T> => {
  const hit = cache.get(file);
  if (hit) return hit as Promise<T>;
  const request = fetch(`${SNAPSHOT_BASE}/${file}`).then((res) => {
    if (!res.ok) throw new Error(`Snapshot ${file} failed to load (${res.status})`);
    return res.json() as Promise<T>;
  });
  request.catch(() => cache.delete(file));
  cache.set(file, request);
  return request;
};

const wait = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

const normalize = (text: string): string =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const words = (text: string): Set<string> =>
  new Set(normalize(text).split(' ').filter((w) => w.length > 2));

/** Jaccard overlap of the two questions' words. */
const similarity = (a: string, b: string): number => {
  const wa = words(a);
  const wb = words(b);
  if (wa.size === 0 || wb.size === 0) return 0;
  const shared = [...wa].filter((w) => wb.has(w)).length;
  return shared / (wa.size + wb.size - shared);
};

const answerFor = async (question: string): Promise<AskResult> => {
  const answers = await load<Record<string, AskResult>>('ask.json');
  const key = normalize(question);
  const exact = Object.entries(answers).find(([q]) => normalize(q) === key);
  if (exact) return exact[1];

  const suggested = await load<string[]>('questions.json');
  const candidates = suggested.filter((q) => answers[q]);
  const pool = candidates.length > 0 ? candidates : Object.keys(answers);
  const closest = pool.reduce((best, q) =>
    similarity(question, q) > similarity(question, best) ? q : best,
  );
  const recorded = answers[closest];
  return { ...recorded, answer: `${FALLBACK_NOTE}\n\n${recorded.answer}` };
};

export class BrainApi {
  getRadar(_organizationId: string): Promise<RadarResult | null> {
    return load<RadarResult>('radar.json');
  }

  runRadar(_organizationId: string): Promise<RadarResult> {
    return load<RadarResult>('radar.json');
  }

  timeMachine(_organizationId: string): Promise<TimeMachineResult> {
    return load<TimeMachineResult>('time-machine.json');
  }

  async accept(_organizationId: string, _gapId: string): Promise<AcceptRecommendationResult> {
    const [result] = await Promise.all([
      load<AcceptRecommendationResult>('accept-gap-agent-memory.json'),
      wait(ACCEPT_DELAY_MS),
    ]);
    return result;
  }

  priorityStatus(
    _organizationId: string,
    priorityId: string,
  ): Promise<{ id: string; status: string }> {
    return Promise.resolve({ id: priorityId, status: 'completed' });
  }

  people(_organizationId: string): Promise<BrainPerson[]> {
    return load<BrainPerson[]>('people.json');
  }

  compass(_organizationId: string, _employeeId: string, _refresh = false): Promise<CompassResult> {
    return load<CompassResult>('compass-jordan-rivera.json');
  }
}

export const brainApiExtras = {
  ask: async (_organizationId: string, question: string): Promise<AskResult> => {
    const [result] = await Promise.all([answerFor(question), wait(ASK_DELAY_MS)]);
    return result;
  },
  topology: (_organizationId: string): Promise<TopologyResult> =>
    load<TopologyResult>('topology.json'),
};

export const brainApi = new BrainApi();
