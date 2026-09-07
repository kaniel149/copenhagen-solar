import test from 'node:test';
import assert from 'node:assert/strict';
import { createRuntime, plain, sampleQuestions, answerQuiz } from './_academy-runtime-dom.mjs';

const KEY = 'bustan_academy_progress';
const LEGACY = 'tm_academy_progress';
const LANG = 'bustan_academy_lang';
const LAST = 'bustan_academy_last_lesson';

function track(completed = [], quizScores = {}) { return { completed, quizScores }; }

test('migrates legacy completions and scores once, without replacing current progress', () => {
  const old = { 'solar-fundamentals': track([1, 2], { 2: { score: 2, total: 3, ts: 123 } }) };
  const { api, disk, document } = createRuntime({ values: { [LEGACY]: JSON.stringify(old) } });
  let events = 0;
  document.addEventListener('academy:progress', () => events++);
  api.checkAuth();
  assert.deepEqual(plain(api.getProgress()), old);
  assert.deepEqual(JSON.parse(disk.get(KEY)), old);
  assert.equal(disk.get(LEGACY), JSON.stringify(old), 'legacy data stays available for recovery');
  api.checkAuth();
  assert.equal(events, 1, 'migration should not write on every read');
  const current = { technical: track([3]) };
  const second = createRuntime({ values: { [KEY]: JSON.stringify(current), [LEGACY]: JSON.stringify(old) } });
  assert.deepEqual(plain(second.api.getProgress()), current);
});

test('corrupt or invalid top-level data recovers safely, including valid legacy data', () => {
  for (const raw of ['{', 'null', '[]', 'false', '17', '"bad"']) {
    const runtime = createRuntime({ values: { [KEY]: raw } });
    assert.deepEqual(plain(runtime.api.getProgress()), {});
    assert.equal(runtime.api.markLessonComplete('technical', 1), false);
  }
  const old = { management: track([2]) };
  const { api } = createRuntime({ values: { [KEY]: '{', [LEGACY]: JSON.stringify(old) } });
  assert.deepEqual(plain(api.getProgress()), old);
});

test('normalizes malformed per-track values and bounds counts to known lesson totals', () => {
  const data = {
    technical: track([1, '1', 2, 3, 4, -1, 0, 1.5, null, {}, 'bad'], {
      1: { score: 0, total: 3, ts: 10 },
      2: { score: 2, total: 3, ts: 20 },
      3: { score: 4, total: 3, ts: 30 },
      4: { score: 3, total: 3, ts: 40 }
    }),
    management: { completed: {}, quizScores: [] },
    'solar-fundamentals': 'bad',
    unknown: track([1])
  };
  const { api, document } = createRuntime({ values: { [KEY]: JSON.stringify(data) } });
  assert.deepEqual(plain(api.getProgress()), {
    technical: track([1, 2, 3], { 1: { score: 0, total: 3, ts: 10 }, 2: { score: 2, total: 3, ts: 20 } }),
    management: track()
  });
  assert.equal(api.getCompletedCount('technical'), 3);
  assert.equal(api.getCompletedCount('unknown'), 0);
  assert.equal(api.getCompletedCount('__proto__'), 0);
  assert.equal(api.isLessonComplete('technical', 4), false);
  const card = document.createElement('a'); card.className = 'track-card'; card.dataset.track = 'technical'; card.dataset.total = '999';
  for (const className of ['progress-bar-fill', 'progress-text', 'progress-pct']) {
    const el = document.createElement('span'); el.className = className; el.textContent = '0'; card.appendChild(el);
  }
  document.body.appendChild(card);
  api.updateProgressBars();
  assert.equal(card.querySelector('.progress-bar-fill').style.width, '100%');
  assert.equal(card.querySelector('.progress-text').textContent, '3/3');
  assert.equal(card.querySelector('.progress-pct').textContent, '100%');
});

test('save sanitizes input and emits academy:progress with the stored normalized progress', () => {
  const { api, document, disk } = createRuntime();
  const events = [];
  document.addEventListener('academy:progress', event => events.push(plain(event.detail)));
  api.saveProgress({ technical: track([1, 1, 999]), irrelevant: true });
  assert.deepEqual(JSON.parse(disk.get(KEY)), { technical: track([1]) });
  assert.deepEqual(events, [{ progress: { technical: track([1]) } }]);
});

test('denied storage access/read/write supports language, quiz scores and completion in memory', () => {
  for (const denial of [{ denyStorageAccess: true }, { denyRead: true, denyWrite: true }]) {
    const { api, document } = createRuntime({ ...denial, search: '?lang=he' });
    api.checkAuth();
    api.initLanguage();
    assert.equal(document.documentElement.lang, 'he');
    assert.equal(document.documentElement.dir, 'rtl');
    assert.equal(api.saveQuizScore('technical', 1, 2, 3), true);
    assert.equal(api.markLessonComplete('technical', 1), true);
    assert.equal(api.getCompletedCount('technical'), 1);
    api.recordLastLesson('technical', 1);
    assert.equal(api.getLastLesson().courseId, 'technical');
    api.setLanguage('th');
    assert.equal(document.documentElement.lang, 'th');
  }
});

test('failed writes override stale disk data without losing earlier completions and scores', () => {
  const original = { technical: track([1], { 1: { score: 3, total: 3, ts: 123 } }) };
  const { api, disk } = createRuntime({ denyWrite: true, values: { [KEY]: JSON.stringify(original) } });
  api.saveQuizScore('technical', 2, 2, 3);
  assert.equal(api.markLessonComplete('technical', 2), true);
  assert.deepEqual(plain(api.getProgress().technical.completed), [1, 2]);
  assert.deepEqual(plain(api.getProgress().technical.quizScores[1]), original.technical.quizScores[1]);
  assert.equal(api.getProgress().technical.quizScores[2].score, 2);
  assert.deepEqual(JSON.parse(disk.get(KEY)), original, 'denied storage has not persisted the memory change');
});

test('language query wins over saved preference; unsupported languages fall back safely', () => {
  const { api, document, disk } = createRuntime({ search: '?lang=he', values: { [LANG]: 'th' } });
  api.initLanguage();
  assert.equal(document.documentElement.lang, 'he');
  assert.equal(document.title, 'כותרת השיעור');
  assert.equal(disk.get(LANG), 'he');
  assert.equal(document.querySelectorAll('.lang-btn').filter(button => button.classList.contains('active'))[0].dataset.lang, 'he');
  api.setLanguage('unsupported');
  assert.equal(document.documentElement.lang, 'en');
  assert.equal(document.documentElement.dir, 'ltr');
  const saved = createRuntime({ search: '?lang=unsupported', values: { [LANG]: 'th' } });
  saved.api.initLanguage();
  assert.equal(saved.document.documentElement.lang, 'th');
  const legacy = createRuntime({ values: { [LANG]: 'invalid', tm_academy_lang: 'he' } });
  legacy.api.initLanguage();
  assert.equal(legacy.document.documentElement.lang, 'he');
  assert.equal(legacy.disk.get(LANG), 'he');
});

test('resume only accepts known lessons and records visits from initCompleteButton', () => {
  const { api, disk } = createRuntime();
  assert.equal(api.getLastLesson(), null);
  api.initCompleteButton('sales-bd', 4);
  assert.equal(api.getLastLesson().courseId, 'sales-bd');
  assert.equal(api.getLastLesson().lessonNum, 4);
  assert.ok(api.getLastLesson().ts > 0);
  assert.equal(api.recordLastLesson('sales-bd', 5), null);
  assert.equal(api.recordLastLesson('not-a-track', 1), null);
  assert.equal(api.getLastLesson().lessonNum, 4);
  disk.set(LAST, JSON.stringify({ courseId: 'technical', lessonNum: 9, ts: 1 }));
  assert.equal(api.getLastLesson(), null);
  disk.set(LAST, 'bad JSON');
  assert.equal(api.getLastLesson(), null);
});

test('new completion requires 60% with rounding, while legacy completion survives failed retries', () => {
  const { api } = createRuntime({ values: { [KEY]: JSON.stringify({ technical: track([1]) }) } });
  assert.equal(api.markLessonComplete('technical', 1), true, 'pre-existing completion does not need a retroactive quiz');
  assert.equal(api.markLessonComplete('technical', 2), false);
  api.saveQuizScore('technical', 2, 1, 3);
  assert.equal(api.markLessonComplete('technical', 2), false);
  api.saveQuizScore('technical', 2, 2, 3);
  assert.equal(api.markLessonComplete('technical', 2), true);
  assert.equal(api.markLessonComplete('technical', 2), true);
  assert.equal(api.getCompletedCount('technical'), 2);
  api.saveQuizScore('technical', 2, 0, 3);
  assert.equal(api.isLessonComplete('technical', 2), true);
  assert.equal(api.saveQuizScore('technical', 3, 0, 0), false);
  assert.equal(api.saveQuizScore('technical', 3, 5, 3), false);
  assert.equal(api.saveQuizScore('technical', 99, 3, 3), false);
});

test('quiz options are labeled native buttons, lock after one answer and announce the correct answer', () => {
  const { api, document } = createRuntime();
  api.initLanguage();
  api.initCompleteButton('technical', 1);
  api.initQuiz('technical', 1, sampleQuestions(3));
  const first = document.querySelector('.quiz-question');
  const options = first.querySelectorAll('.quiz-option');
  assert.equal(options[0].tagName, 'BUTTON');
  assert.equal(options[0].type, 'button');
  assert.equal(first.querySelector('.quiz-options').getAttribute('aria-labelledby'), first.querySelector('p').id);
  options[1].click();
  assert.ok(options.every(option => option.disabled));
  assert.equal(options[1].getAttribute('aria-pressed'), 'true');
  assert.ok(options[0].classList.contains('correct'));
  assert.equal(first.querySelector('.quiz-answer-feedback').hidden, false);
  assert.match(first.querySelector('.quiz-answer-feedback').textContent, /Correct answer: A/);
  options[0].click();
  assert.equal(options[0].getAttribute('aria-pressed'), 'false', 'a disabled answer cannot alter the choice');
  assert.equal(document.getElementById('complete-btn').disabled, true);
});

test('fail → retry → pass resets quiz state, keeps language listeners stable, then permits completion', () => {
  const { api, document } = createRuntime();
  api.initLanguage();
  const originalSetLanguage = api.setLanguage;
  api.initCompleteButton('technical', 1);
  api.initQuiz('technical', 1, sampleQuestions(5));
  const complete = document.getElementById('complete-btn');
  assert.equal(complete.dataset.state, 'locked');
  complete.click();
  assert.equal(api.isLessonComplete('technical', 1), false);
  answerQuiz(document, 0);
  const result = document.getElementById('quiz-result');
  assert.ok(result.classList.contains('fail'));
  assert.match(result.querySelector('.quiz-result-message').textContent, /^0\/5/);
  const retry = document.getElementById('quiz-retry-btn');
  assert.equal(retry.tagName, 'BUTTON');
  api.setLanguage('he');
  assert.match(retry.textContent, /נסה שוב/);
  assert.match(result.querySelector('.quiz-result-message').textContent, /חזור על החומר/);
  assert.match(document.querySelector('.quiz-answer-feedback').textContent, /התשובה הנכונה/);
  retry.click();
  assert.equal(result.classList.contains('show'), false);
  assert.equal(result.dataset.score, undefined);
  assert.equal(document.querySelectorAll('.quiz-question').length, 5);
  assert.ok(document.querySelectorAll('.quiz-option').every(button => !button.disabled));
  assert.equal(document.activeElement, document.querySelector('.quiz-option'));
  assert.equal(document.documentElement.lang, 'he');
  assert.equal(api.setLanguage, originalSetLanguage, 'quiz initialization and retries must not wrap the language function');
  answerQuiz(document, 3);
  assert.ok(result.classList.contains('pass'), '3 of 5 is exactly 60%');
  assert.equal(complete.disabled, false);
  assert.equal(complete.dataset.state, 'ready');
  complete.click();
  assert.equal(api.isLessonComplete('technical', 1), true);
  assert.equal(complete.dataset.state, 'completed');
  api.setLanguage('th');
  assert.match(complete.textContent, /เรียนจบแล้ว/);
  assert.match(result.querySelector('.quiz-result-message').textContent, /เยี่ยมมาก/);
  assert.ok(document.getElementById('quiz-container').querySelectorAll('[data-he]').every(span => span.style.display === 'none'));
  assert.ok(document.getElementById('quiz-container').querySelectorAll('[data-th]').every(span => span.style.display === 'inline'));
  document.getElementById('quiz-retry-btn').click();
  answerQuiz(document, 0);
  assert.equal(api.isLessonComplete('technical', 1), true, 'retry never erases a completed lesson');
  assert.equal(complete.dataset.state, 'completed');
});

test('re-initializing quiz and completion button does not duplicate score/completion saves', () => {
  const { api, document } = createRuntime();
  api.initLanguage();
  let events = 0;
  document.addEventListener('academy:progress', () => events++);
  for (let i = 0; i < 3; i++) {
    api.initCompleteButton('technical', 1);
    api.initQuiz('technical', 1, sampleQuestions(1));
  }
  answerQuiz(document, 1);
  assert.equal(events, 1);
  document.getElementById('complete-btn').click();
  assert.equal(events, 2);
  assert.equal(api.getCompletedCount('technical'), 1);
});
