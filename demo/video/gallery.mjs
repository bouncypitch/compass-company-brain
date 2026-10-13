import { chromium } from 'playwright';
import path from 'path';
const cp = (f) => `file://${path.resolve('../checkpoints', f)}`;
const g = (f) => `file://${path.resolve('gallery', f)}`;
const items = [
  ['Compass', 'A competitor ships memory → our R-14 is unowned → <span class="grad">Compass drafts the PR → Jordan\'s path to Staff</span>', cp('site-02-example.png')],
  ['The brain', 'Slack, email, meetings, docs, code, reviews and the market — <span class="grad">one brain in HydraDB</span>', cp('v5-brain.png')],
  ['It was listening', 'Ask about today\'s keynote — Compass finds <span class="grad">the exact moment in the recording</span>', g('raw-keynote.png')],
  ['Jordan asks', '"How do I get promoted to Staff?" — <span class="grad">where you stand, with evidence</span>', cp('journey-01-standing.png')],
  ['Research agents', 'Agents fan out per competitor and intent; <span class="grad">235 verified signals scored into the landscape</span>', cp('journey-02-market.png')],
  ['Where they\'re going', '<span class="grad">5 of 7 competitors</span> are converging on codebase memory', cp('site-05-convergence.png')],
  ['Validated against the future', 'Predicted from pre-Aug-1 data only — <span class="grad">then checked against what shipped</span>', cp('site-06-timemachine.png')],
  ['High-impact project', 'Market × skills × manager KRs × department × north star — <span class="grad">strongest alignment: R-14</span>', cp('journey-04-opportunity.png')],
  ['Make it yours', 'One click writes the decision into HydraDB and <span class="grad">drafts the pull request</span>', cp('journey-05-claim.png')],
  ['Your 90 days', 'A dated plan from one-pager to <span class="grad">shipped results</span>', cp('journey-06-plan.png')],
  ['Who to talk to', 'Jordan\'s live company graph — <span class="grad">drag it, click anyone</span>', cp('journey-07-people.png')],
  ['The company graph', 'Zoom from the whole company into a team: <span class="grad">people and the goals they own</span>', g('raw-graph.png')],
  ['The whole chain', 'From a competitor\'s launch to <span class="grad">Jordan\'s promotion</span>', cp('site-08-story.png')],
  ['Ask the brain', 'Cited answers with <span class="grad">the HydraDB graph paths it followed</span>', cp('static-09-deck-ask-answer.png')],
];
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1800, height: 1200 }, deviceScaleFactor: 1 });
for (const [i, [k, t, img]] of items.entries()) {
  await p.goto(`file://${path.resolve('gallery.html')}?k=${encodeURIComponent(k)}&t=${encodeURIComponent(t)}&img=${encodeURIComponent(img)}`);
  await p.waitForTimeout(400);
  await p.screenshot({ path: `gallery/${String(i + 1).padStart(2, '0')}-${k.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.png` });
}
await p.goto(`file://${path.resolve('arch.html')}`);
await p.waitForTimeout(300);
await p.screenshot({ path: 'gallery/15-architecture.png' });
await b.close();
console.log('ok');
