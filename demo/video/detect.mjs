/** Reads the corner slide marker from the recording and writes true slide start times (video seconds). */
import fs from 'fs';
import { execFileSync } from 'child_process';
const [video = 'clips/deck.webm', timelinePath = 'clips/timeline.json'] = process.argv.slice(2);
const FPS = 20;
const raw = execFileSync('ffmpeg', ['-loglevel', 'error', '-i', video, '-vf', `fps=${FPS},crop=6:6:1429:889,scale=1:1`, '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], { maxBuffer: 1 << 26 });
const tl = JSON.parse(fs.readFileSync(timelinePath, 'utf8'));
const firstSeen = {};
for (let f = 0; f * 3 < raw.length; f++) {
  const [r, g, b] = raw.subarray(f * 3, f * 3 + 3);
  if (b < 190) continue; // not a marker frame
  const idx = Math.round(r / 80) + 4 * Math.round(g / 80);
  if (idx >= 0 && idx < tl.slides.length && firstSeen[idx] === undefined) firstSeen[idx] = f / FPS;
}
tl.slides.forEach((s, i) => { if (firstSeen[i] !== undefined) { s.wallStart = s.start; s.start = firstSeen[i]; } });
const missing = tl.slides.filter((s, i) => firstSeen[i] === undefined).map((s) => s.id);
tl.wallTrimStart = tl.trimStart;
tl.trimStart = firstSeen[0] ?? tl.trimStart;
const dur = parseFloat(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', video]).toString());
tl.end = dur - 0.2;
fs.writeFileSync(timelinePath, JSON.stringify(tl, null, 2));
console.log('slide starts (video s):', tl.slides.map((s) => `${s.id}:${s.start.toFixed(1)}`).join(' '));
if (missing.length) console.log('MISSING markers for', missing.join(', '));
