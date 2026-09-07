// academy/tests/links.mjs — 0 dead local links across hub, lessons, presentations, root index, assets index
import fs from 'node:fs'; import path from 'node:path';
import { ROOT, rel, htmlIn, read, localRefs, fail } from './_util.mjs';
const files = [...htmlIn('academy'), ...htmlIn('academy/courses'), ...htmlIn('academy/learning'), ...htmlIn('academy/paths'), ...htmlIn('presentations'), ...htmlIn('blog'), 'index.html', 'assets.html'];
let dead = 0, checked = 0;
for (const f of files) {
  for (const u of localRefs(read(f))) {
    checked++;
    const t = u.startsWith('/') ? rel(u) : path.resolve(path.dirname(rel(f)), u);
    if (![t, path.join(t, 'index.html')].some(c => fs.existsSync(c))) { dead++; fail(`${f} -> ${u}`); }
  }
}
console.log(`links: ${checked} checked, ${dead} dead`);
