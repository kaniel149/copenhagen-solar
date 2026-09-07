// academy/tools/apply-chrome.mjs — swap the duplicated header/footer in all 24 lessons for the shared
// site nav/footer placeholders (rendered by ../../assets/site.js). Content is untouched. Idempotent.
// Usage: node academy/tools/apply-chrome.mjs
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(new URL('.', import.meta.url).pathname, '..');
const DIR = path.join(ROOT, 'courses');
const NAV = '<div id="site-nav" data-page="academy"></div>';
const FOOT = '<div id="site-footer"></div>';
const VERSION = 'paths-20260907';
const SCRIPT = `<script src="../../assets/site.js?v=${VERSION}" data-root="../../" defer></script>`;
const BRAND_CSS = `<link rel="stylesheet" href="../assets/academy-brand.css?v=${VERSION}">`;
const LESSON_CSS = `<link rel="stylesheet" href="../assets/lesson-tools.css?v=${VERSION}">`;
const LESSON_SCRIPT = `<script src="../assets/lesson-tools.js?v=${VERSION}" defer></script>`;
const FAVICON = '<link rel="icon" type="image/png" href="../../assets/bustan-energy-logo.png">';

let changed = 0;
for (const f of fs.readdirSync(DIR).filter((f) => /^[a-z-]+-\d{2}\.html$/.test(f))) {
  const p = path.join(DIR, f);
  const before = fs.readFileSync(p, 'utf8');
  let s = before;
  s = s.replace(/<header class="header">[\s\S]*?<\/header>/, NAV);
  s = s.replace(/<footer class="footer">[\s\S]*?<\/footer>/, FOOT);
  s = s.replace(/\n?<div class="bg-ambient"><\/div>/, '');
  s = s.replace(/<html\b([^>]*)>/, (_, attrs) => {
    if (/class="[^"]*\bbustan-academy\b/.test(attrs)) return `<html${attrs}>`;
    if (/class="/.test(attrs)) return `<html${attrs.replace(/class="/, 'class="bustan-academy ')}>`;
    return `<html${attrs} class="bustan-academy">`;
  });
  for (const asset of ['../assets/academy.css', '../assets/academy.js', '../../assets/site.js']) {
    const pattern = asset.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    s = s.replace(new RegExp(pattern + '(?:\\?[^"\\s]*)?', 'g'), `${asset}?v=${VERSION}`);
  }
  const track = f.replace(/-\d{2}\.html$/, '');
  s = s.replace(/(<div class="breadcrumb">)([\s\S]*?)(<\/div>)/, (_, start, inner, end) =>
    start + inner.replace(`href="${track}-01.html"`, `href="../library.html#track-${track}"`) + end);
  // Some source lessons placed CSS near the footer. Normalize it into the head.
  const headEnd = s.indexOf('</head>');
  const lateStyles = [...s.matchAll(/<style>[\s\S]*?<\/style>/g)].filter((m) => m.index > headEnd);
  for (const m of [...lateStyles].reverse()) s = s.slice(0, m.index) + s.slice(m.index + m[0].length);
  if (lateStyles.length) s = s.replace(/<\/head>/, lateStyles.map((m) => m[0]).join('\n') + '\n</head>');
  // Keep brand overrides after every page-local style block.
  s = s.replace(/\s*<link\b[^>]*href="\.\.\/assets\/academy-brand\.css[^>]*>/g, '');
  s = s.replace(/\s*<link\b[^>]*href="\.\.\/assets\/lesson-tools\.css[^>]*>/g, '');
  s = s.replace(/\s*<script\b[^>]*src="\.\.\/assets\/lesson-tools\.js[^>]*><\/script>/g, '');
  s = s.replace(/<\/head>/, `  ${BRAND_CSS}\n  ${LESSON_CSS}\n  ${LESSON_SCRIPT}\n</head>`);
  if (!s.includes('rel="icon"')) s = s.replace(/<\/head>/, `  ${FAVICON}\n</head>`);
  if (!s.includes('assets/site.js')) s = s.replace(/<\/body>/, `${SCRIPT}\n</body>`);
  if (s !== before) { fs.writeFileSync(p, s); changed++; }
}
console.log(`apply-chrome: ${changed} lesson(s) updated`);
