import fs from 'fs';
import { execFileSync } from 'child_process';
import dotenv from 'dotenv';
dotenv.config({ path: '../../apps/api/.env' });
const key = process.env.ELEVENLABS_API_KEY;
const voice = process.env.ELEVENLABS_VOICE_ID || 'EXAVITQu4vr4xnSDxMaL';
const only = process.argv.slice(2);
fs.mkdirSync('audio', { recursive: true });
const lines = JSON.parse(fs.readFileSync('narration.json', 'utf8'));
const out = {};
for (const [i, l] of lines.entries()) {
  const file = `audio/${String(i).padStart(2, '0')}-${l.id}.mp3`;
  if (!only.length || only.includes(l.id) || !fs.existsSync(file)) {
    const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice}?output_format=mp3_44100_128`, {
      method: 'POST',
      headers: { 'xi-api-key': key, 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: l.text, model_id: 'eleven_multilingual_v2', voice_settings: { stability: 0.45, similarity_boost: 0.8, style: 0.15, use_speaker_boost: true } }),
    });
    if (!res.ok) throw new Error(`${l.id}: ${res.status} ${await res.text()}`);
    fs.writeFileSync(file, Buffer.from(await res.arrayBuffer()));
  }
  const dur = parseFloat(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', file]).toString());
  out[l.id] = { file, duration: dur };
  console.log(l.id.padEnd(12), dur.toFixed(1) + 's');
}
fs.writeFileSync('audio/durations.json', JSON.stringify(out, null, 2));
console.log('total', Object.values(out).reduce((s, x) => s + x.duration, 0).toFixed(1) + 's');
