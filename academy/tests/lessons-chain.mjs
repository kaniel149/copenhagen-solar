// academy/tests/lessons-chain.mjs
import fs from 'node:fs'; import vm from 'node:vm';
import { rel, read, fail, LESSON_RE } from './_util.mjs';
const ctx = { window: {} }; vm.runInNewContext(read('academy/assets/lessons.js'), ctx);
const L = ctx.window.ACADEMY_LESSONS, T = ctx.window.ACADEMY_TRACKS;
const onDisk = fs.readdirSync(rel('academy/courses')).filter(f => LESSON_RE.test(f)).sort();
if (L.length !== 24) fail(`manifest has ${L.length} lessons, expected 24`);
if (onDisk.length !== L.length) fail(`disk ${onDisk.length} vs manifest ${L.length}`);
if (Object.keys(T).length !== 5) fail('expected 5 tracks');
for (const l of L) {
  const html = read(`academy/${l.file}`);
  const byTrack = L.filter(x => x.track === l.track).sort((a, b) => a.num - b.num);
  const i = byTrack.indexOf(l), prev = byTrack[i - 1], next = byTrack[i + 1];
  const prevHref = (html.match(/<a href="([^"]+)" class="lesson-nav-btn prev"/) || [])[1];
  const nextHref = (html.match(/<a href="([^"]+)" class="lesson-nav-btn next"/) || [])[1];
  if (prev && prevHref !== `${prev.slug}.html`) fail(`${l.slug}: prev=${prevHref}, expected ${prev.slug}.html`);
  if (next && nextHref !== `${next.slug}.html`) fail(`${l.slug}: next=${nextHref}, expected ${next.slug}.html`);
  if (!html.includes(`initCompleteButton('${l.track}', ${l.num})`)) fail(`${l.slug}: initCompleteButton id mismatch`);
}
const hub = read('academy/library.html');
if (!hub.includes('assets/lessons.js')) fail('hub does not load assets/lessons.js');
for (const t of Object.keys(T)) if (!hub.includes(`href="#track-${t}"`)) fail(`hub track card for ${t} does not link #track-${t}`);
console.log(`lessons-chain: ${L.length} lessons, prev/next consistent`);
