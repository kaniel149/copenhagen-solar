// Parse each lesson's inline JavaScript without running browser or quiz code.
// This catches errors such as an unclosed DOMContentLoaded callback, which can
// leave an otherwise valid-looking lesson with no quiz or completion controls.
import fs from 'node:fs';
import vm from 'node:vm';
import { rel, read, fail, LESSON_RE } from './_util.mjs';

const lessons = fs.readdirSync(rel('academy/courses')).filter(f => LESSON_RE.test(f)).sort();
const jsTypes = new Set([
  '', 'text/javascript', 'application/javascript', 'text/ecmascript',
  'application/ecmascript', 'application/x-javascript', 'text/jscript',
]);
let compiled = 0;
for (const lesson of lessons) {
  const file = `academy/courses/${lesson}`;
  const html = read(file);
  let lessonScripts = 0;
  for (const match of html.matchAll(/<script\b((?:"[^"]*"|'[^']*'|[^'">])*)>([\s\S]*?)<\/script\s*>/gi)) {
    const attrs = new Map();
    for (const attr of match[1].matchAll(/([^\s=/>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g)) {
      attrs.set(attr[1].toLowerCase(), attr[2] ?? attr[3] ?? attr[4] ?? '');
    }
    if (attrs.has('src')) continue;
    const type = (attrs.get('type') || '').trim().toLowerCase();
    // Data blocks (JSON, import maps, archived scripts) are not executable JS.
    if (!jsTypes.has(type)) continue;
    const start = match.index + match[0].indexOf('>') + 1;
    const lineOffset = html.slice(0, start).split('\n').length - 1;
    lessonScripts++;
    try {
      new vm.Script(match[2], { filename: file, lineOffset });
      compiled++;
    } catch (error) {
      fail(`${file}: inline script ${lessonScripts} cannot parse: ${error.message}`);
    }
  }
  if (!lessonScripts) fail(`${file}: no inline lesson initialization script found`);
}
console.log(`inline-scripts: ${compiled} scripts parsed in ${lessons.length} lessons`);
