import * as fs from 'fs';
import * as path from 'path';
import { BrainCapability, BrainPerson, BrainSignal, BrainTalkClip, BRAIN_CAPABILITIES } from '@app-starter/shared';

/** The API and the ingest script both run with cwd = apps/api. */
export const DATA_DIR = process.env.BRAIN_DATA_DIR || path.resolve(process.cwd(), '../../data');

export interface TimeMachineCandidate {
  company: string;
  announcement: string;
  date: string;
  url: string;
  precedingSignalIds: string[];
  why: string;
}

export interface PersonRecord extends BrainPerson {
  location?: string;
  skills: string[];
  currentProjects: string[];
}

const readJson = <T>(rel: string, fallback: T): T => {
  const file = path.join(DATA_DIR, rel);
  return fs.existsSync(file) ? (JSON.parse(fs.readFileSync(file, 'utf8')) as T) : fallback;
};

export const slugId = (prefix: string, rel: string): string =>
  `${prefix}-${rel.replace(/\.[a-z]+$/i, '').replace(/[^a-z0-9]+/gi, '-').toLowerCase()}`.slice(0, 120);

const companyDirs = (): string[] => {
  const dir = path.join(DATA_DIR, 'external');
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((d) => fs.existsSync(path.join(dir, d, 'signals.json')));
};

export const loadSignals = (): BrainSignal[] =>
  companyDirs()
    .flatMap((d) => readJson<{ signals: BrainSignal[] }>(`external/${d}/signals.json`, { signals: [] }).signals)
    .filter((s) => (BRAIN_CAPABILITIES as readonly string[]).includes(s.capability))
    .map((s) => ({ ...s, capability: s.capability as BrainCapability }))
    .sort((a, b) => a.date.localeCompare(b.date));

export const loadTimeMachine = (): TimeMachineCandidate[] =>
  companyDirs().flatMap((d) => {
    const file = readJson<{ company: string; timeMachine?: Omit<TimeMachineCandidate, 'company'>[] }>(
      `external/${d}/signals.json`,
      { company: d },
    );
    return (file.timeMachine ?? []).map((t) => ({ ...t, company: file.company }));
  });

export const loadTalkClips = (): BrainTalkClip[] => readJson<BrainTalkClip[]>('external/talk/clips.json', []);

export const loadPeople = (): PersonRecord[] => readJson<PersonRecord[]>('internal/people.json', []);

export const loadMemories = (employeeId: string): { id: string; title: string; text: string; date: string; kind: string }[] =>
  readJson<{ items: any[] }>(`memories/${employeeId}.json`, { items: [] }).items;

export const readDataFile = (rel: string): string => {
  const file = path.join(DATA_DIR, rel);
  return fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
};

/** Concatenates every internal doc under a folder, labelled by path, for grounding prompts. */
export const readInternalDocs = (sub = ''): string => {
  const root = path.join(DATA_DIR, 'internal', sub);
  if (!fs.existsSync(root)) return '';
  const files: string[] = [];
  const walk = (d: string): void =>
    fs.readdirSync(d, { withFileTypes: true }).forEach((e) => {
      const p = path.join(d, e.name);
      if (e.isDirectory()) walk(p);
      else if (e.name.endsWith('.md')) files.push(p);
    });
  walk(root);
  return files
    .sort()
    .map((f) => `<doc path="${path.relative(DATA_DIR, f)}">\n${fs.readFileSync(f, 'utf8')}\n</doc>`)
    .join('\n\n');
};

export const readCodeFiles = (rels: string[]): string =>
  rels
    .map((r) => {
      const content = readDataFile(path.join('codebase/forgeline-core', r));
      return content ? `<file path="forgeline-core/${r}">\n${content}\n</file>` : '';
    })
    .filter(Boolean)
    .join('\n\n');
