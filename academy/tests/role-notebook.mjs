import fs from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRuntime } from './_academy-runtime-dom.mjs';

const KEY = 'bustan_academy_notebook_v1';
const t = value => ({ en: value, he: value, th: value });
function track(id, total) {
  return { id, title: t(id), lessons: Array.from({ length: total }, (_, i) => ({
    track: id, num: i + 1, slug: `${id}-${String(i + 1).padStart(2, '0')}`,
    title: t(`${id} lesson ${i + 1}`), summary: t('Summary')
  })) };
}
function notebook({ data = {}, denyWrite = false } = {}) {
  const runtime = createRuntime({ values: { [KEY]: JSON.stringify(data) }, denyWrite });
  const { api, document, disk } = runtime;
  api.location = { search: '?lang=en', href: 'https://example.test/academy/learning/finance-01.html' };
  api.Blob = Blob;
  api.setTimeout = () => {};
  let blob;
  api.URL = class extends URL {
    static createObjectURL(value) { blob = value; return 'blob:test'; }
    static revokeObjectURL() {}
  };
  document.body.dataset.courseId = 'finance';
  document.body.dataset.lessonNum = '1';
  for (const [tag, id] of [['a', 'previous-lesson'], ['a', 'next-lesson'], ['p', 'learning-context']]) {
    const element = document.createElement(tag); element.id = id; document.body.appendChild(element);
  }
  const actions = document.createElement('div'); document.body.appendChild(actions);
  for (const [tag, id] of [['span', 'notebook-status'], ['button', 'download-notebook']]) {
    const element = document.createElement(tag); element.id = id; actions.appendChild(element);
  }
  const editor = document.createElement('textarea'); editor.dataset.notebook = 'finance-01'; document.body.appendChild(editor);
  api.ACADEMY_CURRICULUM = { version: 'test', tracks: [track('foundation', 8), track('finance', 9)] };
  vm.runInContext(fs.readFileSync(new URL('../assets/role-paths.js', import.meta.url), 'utf8'), api);
  document.dispatchEvent(new Event('DOMContentLoaded'));
  api.initCompleteButton('finance', 1);
  const remote = value => {
    const raw = value === null ? null : JSON.stringify(value);
    if (raw === null) disk.delete(KEY); else disk.set(KEY, raw);
    const event = new Event('storage');
    Object.defineProperties(event, { key: { value: KEY }, newValue: { value: raw } });
    api.dispatchEvent(event);
  };
  const input = value => { editor.value = value; editor.dispatchEvent(new Event('input')); };
  const download = async () => { document.getElementById('download-notebook').click(); return blob.text(); };
  return { ...runtime, editor, remote, input, download, status: document.getElementById('notebook-status') };
}

test('clean notebook adopts another tab’s answer and export matches the editor', async () => {
  const r = notebook({ data: { 'finance-01': 'Original answer' } });
  r.remote({ 'finance-01': 'New remote answer', 'finance-02': 'Another lesson answer' });
  assert.equal(r.editor.value, 'New remote answer');
  assert.equal(r.document.getElementById('notebook-keep-draft').hidden, true);
  const text = await r.download();
  assert.ok(text.includes('New remote answer'));
  assert.ok(text.includes('Another lesson answer'));
  assert.ok(!text.includes('Original answer'));
  r.remote(null);
  assert.equal(r.editor.value, '');
});

test('focused draft gets explicit conflict, remains editable and exports without overwriting remote data', async () => {
  const r = notebook({ data: { 'finance-01': 'Local draft' } });
  r.editor.focus();
  r.remote({ 'finance-01': 'Remote revision', 'finance-02': 'Remote second lesson' });
  assert.equal(r.editor.value, 'Local draft');
  assert.match(r.status.textContent, /Another tab changed/);
  assert.equal(r.document.getElementById('notebook-keep-draft').hidden, false);
  assert.equal(r.document.getElementById('notebook-load-remote').hidden, false);
  r.input('Local draft continued');
  assert.equal(JSON.parse(r.disk.get(KEY))['finance-01'], 'Remote revision');
  const text = await r.download();
  assert.ok(text.includes('Local draft continued'));
  assert.ok(!text.includes('Remote revision'));
  assert.ok(text.includes('Remote second lesson'));
  r.document.getElementById('notebook-keep-draft').click();
  assert.equal(JSON.parse(r.disk.get(KEY))['finance-01'], 'Local draft continued');
  assert.equal(JSON.parse(r.disk.get(KEY))['finance-02'], 'Remote second lesson');
  assert.equal(r.document.getElementById('notebook-keep-draft').hidden, true);
  assert.equal(r.document.activeElement, r.editor);
});

test('load-other-answer resolves conflict explicitly and translates conflict controls', () => {
  const r = notebook({ data: { 'finance-01': 'Old local' } });
  r.editor.focus();
  r.remote({ 'finance-01': 'Latest remote' });
  r.api.setLanguage('he');
  assert.match(r.status.textContent, /לשונית אחרת/);
  assert.match(r.document.getElementById('notebook-keep-draft').textContent, /הטיוטה/);
  r.api.setLanguage('th');
  assert.match(r.status.textContent, /อีกแท็บ/);
  r.document.getElementById('notebook-load-remote').click();
  assert.equal(r.editor.value, 'Latest remote');
  assert.equal(r.document.getElementById('notebook-load-remote').hidden, true);
  assert.equal(r.document.activeElement, r.editor);
  assert.equal(JSON.parse(r.disk.get(KEY))['finance-01'], 'Latest remote');
});

test('denied storage retains and exports a draft, including after a remote conflict', async () => {
  const r = notebook({ data: { 'finance-01': 'Original' }, denyWrite: true });
  r.input('Unsaved local draft');
  assert.match(r.status.textContent, /storage is unavailable/);
  r.remote({ 'finance-01': 'Remote revision', 'finance-02': 'Remote second' });
  assert.equal(r.editor.value, 'Unsaved local draft');
  assert.match(r.status.textContent, /Another tab changed/);
  assert.ok((await r.download()).includes('Unsaved local draft'));
  r.api.dispatchEvent(new Event('pageshow'));
  assert.equal(r.editor.value, 'Unsaved local draft');
  assert.match(r.status.textContent, /Another tab changed/);
  assert.ok((await r.download()).includes('Remote second'));
  r.document.getElementById('notebook-keep-draft').click();
  assert.match(r.status.textContent, /storage is unavailable/);
  assert.ok((await r.download()).includes('Remote second'));
  assert.equal(JSON.parse(r.disk.get(KEY))['finance-01'], 'Remote revision');
});

test('choosing the remote answer after a failed local write remains coherent on restore', async () => {
  const r = notebook({ data: { 'finance-01': 'Original' }, denyWrite: true });
  r.input('Failed-write draft');
  r.remote({ 'finance-01': 'Committed remote answer' });
  r.document.getElementById('notebook-load-remote').click();
  r.api.dispatchEvent(new Event('pageshow'));
  assert.equal(r.editor.value, 'Committed remote answer');
  assert.equal(r.document.getElementById('notebook-keep-draft').hidden, true);
  assert.ok((await r.download()).includes('Committed remote answer'));
  assert.ok(!(await r.download()).includes('Failed-write draft'));
});

test('pageshow reconciles a clean notebook and mounted completion controls', () => {
  const r = notebook({ data: { 'finance-01': 'Before restore' } });
  r.disk.set(KEY, JSON.stringify({ 'finance-01': 'After restore' }));
  r.disk.set('bustan_academy_progress', JSON.stringify({ finance: { completed: [], quizScores: { 1: { score: 4, total: 5, ts: 1 } } } }));
  r.api.dispatchEvent(new Event('pageshow'));
  assert.equal(r.editor.value, 'After restore');
  assert.equal(r.document.getElementById('complete-btn').dataset.state, 'ready');
});
