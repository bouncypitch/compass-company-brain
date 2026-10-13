/**
 * Composites the recorded deck into the Apple-style frame and lays narration
 * clips at each slide's start time.
 *   node compose.mjs clips/deck.webm clips/timeline.json out/compass-demo.mp4
 */
import fs from 'fs';
import { execFileSync } from 'child_process';

const [video = 'clips/deck.webm', timelinePath = 'clips/timeline.json', out = 'out/compass-demo.mp4'] = process.argv.slice(2);
fs.mkdirSync('out', { recursive: true });
const timeline = JSON.parse(fs.readFileSync(timelinePath, 'utf8'));
const durations = JSON.parse(fs.readFileSync('audio/durations.json', 'utf8'));
const LEAD = 0.5; // narration starts shortly after each slide appears
// Optional cuts (absolute recording seconds) remove dead air such as waiting on a live API call.
const cuts = (timeline.cuts ?? []).slice().sort((a, b) => a.from - b.from);
const mapT = (t) => t - cuts.filter((c) => c.to <= t).reduce((s, c) => s + (c.to - c.from), 0);
const keep = [];
let cursor = timeline.trimStart;
for (const c of cuts) { keep.push([cursor, c.from]); cursor = c.to; }
keep.push([cursor, timeline.end]);

const audioInputs = [];
const delays = [];
timeline.slides.forEach((s) => {
  const d = durations[s.id];
  if (!d) return;
  audioInputs.push('-i', d.file);
  const idx = audioInputs.length / 2 + 2; // inputs 0..2 are bg, video, mask
  delays.push(`[${idx}:a]adelay=${Math.round((mapT(s.start) - timeline.trimStart + LEAD) * 1000)}|${Math.round((mapT(s.start) - timeline.trimStart + LEAD) * 1000)}[a${idx}]`);
});
(timeline.cues ?? []).filter((c) => c.at !== undefined).forEach((c) => {
  audioInputs.push('-i', c.file);
  const idx = audioInputs.length / 2 + 2;
  const ms = Math.round((mapT(c.at) - timeline.trimStart) * 1000);
  delays.push(`[${idx}:a]adelay=${ms}|${ms},volume=1.15[a${idx}]`);
});
const labels = delays.map((d) => d.match(/\[(a\d+)\]$/)[1]);
const total = keep.reduce((sum, [a, b]) => sum + (b - a), 0);
const filter = [
  `[1:v]split=${keep.length}${keep.map((_, i) => `[s${i}]`).join('')}`,
  ...keep.map(([a, b], i) => `[s${i}]trim=start=${a.toFixed(3)}:end=${b.toFixed(3)},setpts=PTS-STARTPTS[k${i}]`),
  `${keep.map((_, i) => `[k${i}]`).join('')}concat=n=${keep.length}:v=1:a=0,split[base][src]`,
  `[src]crop=24:24:1416:850[patch]`,
  `[base][patch]overlay=1416:876,fps=30,scale=1568:980:flags=lanczos,format=rgba[v]`,
  `[2:v]scale=1568:980,format=gray[m]`,
  `[v][m]alphamerge[vm]`,
  `[0:v][vm]overlay=176:46:shortest=1,fade=t=in:st=0:d=0.8,fade=t=out:st=${(total - 1.2).toFixed(2)}:d=1.2,format=yuv420p[outv]`,
  ...delays,
  `${labels.map((l) => `[${l}]`).join('')}amix=inputs=${labels.length}:normalize=0,apad,atrim=0:${total.toFixed(2)},afade=t=out:st=${(total - 1.2).toFixed(2)}:d=1.2[outa]`,
].join(';');

const args = [
  '-y', '-loglevel', 'error',
  '-loop', '1', '-framerate', '30', '-i', 'frame-bg.png',
  '-i', video,
  '-loop', '1', '-framerate', '30', '-i', 'mask.png',
  ...audioInputs,
  '-filter_complex', filter,
  '-map', '[outv]', '-map', '[outa]',
  '-t', total.toFixed(2),
  '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p',
  '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart',
  out,
];
execFileSync('ffmpeg', args, { stdio: 'inherit' });
console.log(`wrote ${out} (${total.toFixed(1)}s)`);
