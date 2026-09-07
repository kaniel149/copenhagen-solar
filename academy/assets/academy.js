/* ============================================
   Bustan Energy Academy — Shared JavaScript
   Progress stays in this browser; no account is required.
   ============================================ */

const STORAGE_KEY = 'bustan_academy_progress';
// Read-only compatibility keys preserve progress from before the rebrand.
const LEGACY_KEYS = ['tm_academy_progress'];
const LANGUAGE_KEY = 'bustan_academy_lang';
const LAST_LESSON_KEY = 'bustan_academy_last_lesson';
const ACADEMY_TRACK_TOTALS = Object.freeze({
  'solar-fundamentals': 8, technical: 3, 'sales-bd': 4, 'ev-storage': 3, management: 6,
  foundation: 8, installers: 9, service: 9, sales: 9, finance: 9,
  leadership: 9, 'design-permitting': 9
});
const ROLE_TRACKS = new Set(['foundation', 'installers', 'service', 'sales', 'finance', 'leadership', 'design-permitting']);
function academyPassRate(courseId) { return ROLE_TRACKS.has(courseId) ? 0.8 : 0.6; }
const academyMemoryStorage = new Map();
const academyPendingStorage = new Set();
const academyQuizStates = new WeakMap();
const academyCompleteButtons = new WeakMap();

function getCurrentUser() { return null; }
function getProgressKey() { return STORAGE_KEY; }

// A denied read/write must never interrupt a lesson. Keep successful reads and
// unsaved writes in memory; a failed write takes precedence over stale disk data.
function readAcademyStorage(key) {
  if (academyPendingStorage.has(key)) return academyMemoryStorage.get(key) ?? null;
  try {
    const value = localStorage.getItem(key);
    if (value === null) academyMemoryStorage.delete(key);
    else academyMemoryStorage.set(key, value);
    return value;
  } catch {
    return academyMemoryStorage.get(key) ?? null;
  }
}

function writeAcademyStorage(key, value) {
  academyMemoryStorage.set(key, value);
  try {
    localStorage.setItem(key, value);
    academyPendingStorage.delete(key);
    return true;
  } catch {
    academyPendingStorage.add(key);
    return false;
  }
}

// A notebook storage event carries the other tab's committed snapshot. Its UI
// keeps any conflicting draft separately before adopting this shared baseline.
function adoptAcademyStorageSnapshot(key, value) {
  academyPendingStorage.delete(key);
  if (value === null) academyMemoryStorage.delete(key);
  else academyMemoryStorage.set(key, value);
}

function academyRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function parseAcademyRecord(raw) {
  if (typeof raw !== 'string') return null;
  try {
    const value = JSON.parse(raw);
    return academyRecord(value) ? value : null;
  } catch { return null; }
}

function getTrackTotal(courseId) {
  return Object.prototype.hasOwnProperty.call(ACADEMY_TRACK_TOTALS, courseId)
    ? ACADEMY_TRACK_TOTALS[courseId] : 0;
}

function academyLessonNumber(courseId, value) {
  if (typeof value !== 'number' && !(typeof value === 'string' && /^\d+$/.test(value))) return null;
  const num = Number(value);
  return Number.isSafeInteger(num) && num >= 1 && num <= getTrackTotal(courseId) ? num : null;
}

function validAcademyScore(value) {
  return academyRecord(value) && Number.isSafeInteger(value.score) && value.score >= 0
    && Number.isSafeInteger(value.total) && value.total > 0 && value.score <= value.total;
}

function normalizeAcademyProgress(data) {
  const progress = {};
  if (!academyRecord(data)) return progress;
  for (const courseId of Object.keys(ACADEMY_TRACK_TOTALS)) {
    if (!Object.prototype.hasOwnProperty.call(data, courseId) || !academyRecord(data[courseId])) continue;
    const source = data[courseId];
    const completed = Array.isArray(source.completed)
      ? [...new Set(source.completed.map(value => academyLessonNumber(courseId, value)).filter(value => value !== null))].sort((a, b) => a - b)
      : [];
    const quizScores = {};
    if (academyRecord(source.quizScores)) {
      for (const [key, value] of Object.entries(source.quizScores)) {
        const lessonNum = academyLessonNumber(courseId, key);
        if (lessonNum === null || !validAcademyScore(value)) continue;
        quizScores[lessonNum] = {
          score: value.score, total: value.total,
          ts: Number.isFinite(value.ts) && value.ts >= 0 ? value.ts : 0
        };
      }
    }
    progress[courseId] = { completed, quizScores };
  }
  return progress;
}

function getProgress() {
  const current = parseAcademyRecord(readAcademyStorage(STORAGE_KEY));
  if (current) return normalizeAcademyProgress(current);
  for (const key of LEGACY_KEYS) {
    const legacy = parseAcademyRecord(readAcademyStorage(key));
    if (legacy) return saveProgress(legacy);
  }
  return {};
}

function saveProgress(data) {
  const progress = normalizeAcademyProgress(data);
  writeAcademyStorage(STORAGE_KEY, JSON.stringify(progress));
  document.dispatchEvent(new CustomEvent('academy:progress', { detail: { progress } }));
  return progress;
}

// Other tabs and back/forward restoration can change persisted progress while
// these controls remain mounted. Notify readers without writing the data again.
function refreshAcademyProgress() {
  document.dispatchEvent(new CustomEvent('academy:progress', { detail: { progress: getProgress() } }));
}

window.addEventListener('storage', event => {
  if (event.key === null || event.key === STORAGE_KEY || LEGACY_KEYS.includes(event.key)) refreshAcademyProgress();
});
window.addEventListener('pageshow', refreshAcademyProgress);

function checkAuth() { getProgress(); }

function getLastLesson() {
  const value = parseAcademyRecord(readAcademyStorage(LAST_LESSON_KEY));
  if (!value) return null;
  const lessonNum = academyLessonNumber(value.courseId, value.lessonNum);
  if (lessonNum === null || !Number.isFinite(value.ts) || value.ts < 0) return null;
  return { courseId: value.courseId, lessonNum, ts: value.ts };
}

function recordLastLesson(courseId, lessonNum) {
  const num = academyLessonNumber(courseId, lessonNum);
  if (num === null) return null;
  const lesson = { courseId, lessonNum: num, ts: Date.now() };
  writeAcademyStorage(LAST_LESSON_KEY, JSON.stringify(lesson));
  return lesson;
}

function getCompletedCount(courseId) {
  const total = getTrackTotal(courseId);
  return total ? Math.min(getProgress()[courseId]?.completed.length || 0, total) : 0;
}

function isLessonComplete(courseId, lessonNum) {
  const num = academyLessonNumber(courseId, lessonNum);
  return num !== null && (getProgress()[courseId]?.completed.includes(num) || false);
}

function hasPassedQuiz(courseId, lessonNum) {
  const num = academyLessonNumber(courseId, lessonNum);
  if (num === null) return false;
  const score = getProgress()[courseId]?.quizScores[num];
  return Boolean(score && score.score >= Math.ceil(score.total * academyPassRate(courseId)));
}

function markLessonComplete(courseId, lessonNum) {
  const num = academyLessonNumber(courseId, lessonNum);
  if (num === null) return false;
  // Earlier completions remain valid even if they predate the quiz requirement.
  if (isLessonComplete(courseId, num)) return true;
  if (!hasPassedQuiz(courseId, num)) return false;
  const progress = getProgress();
  progress[courseId].completed.push(num);
  saveProgress(progress);
  return true;
}

function saveQuizScore(courseId, lessonNum, score, total) {
  const num = academyLessonNumber(courseId, lessonNum);
  if (num === null || !validAcademyScore({ score, total })) return false;
  const progress = getProgress();
  if (!progress[courseId]) progress[courseId] = { completed: [], quizScores: {} };
  progress[courseId].quizScores[num] = { score, total, ts: Date.now() };
  saveProgress(progress);
  return true;
}

function updateProgressBars() {
  document.querySelectorAll('.track-card[data-track]').forEach(card => {
    const total = getTrackTotal(card.dataset.track);
    const completed = Math.min(getCompletedCount(card.dataset.track), total);
    const pct = total > 0 ? Math.min(100, Math.round((completed / total) * 100)) : 0;
    const fill = card.querySelector('.progress-bar-fill');
    const text = card.querySelector('.progress-text');
    const pctEl = card.querySelector('.progress-pct');
    if (fill) fill.style.width = pct + '%';
    if (text && !text.querySelector('[data-en]')) text.textContent = `${completed}/${total}`;
    if (pctEl && pctEl.textContent !== '') pctEl.textContent = pct + '%';
  });
}

// ---- Language Toggle ----
function validAcademyLanguage(lang) { return ['en', 'he', 'th'].includes(lang); }

function initLanguage() {
  const requested = new URLSearchParams(window.location.search).get('lang');
  const saved = readAcademyStorage(LANGUAGE_KEY);
  const legacy = readAcademyStorage('tm_academy_lang');
  setLanguage([requested, saved, legacy].find(validAcademyLanguage) || 'en');
}

function setLanguage(lang) {
  if (!validAcademyLanguage(lang)) lang = 'en';
  document.body.setAttribute('data-lang', lang);
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === 'he' ? 'rtl' : 'ltr';
  writeAcademyStorage(LANGUAGE_KEY, lang);
  const title = document.querySelector('title');
  if (title) {
    if (!title.dataset.en) title.dataset.en = title.textContent;
    document.title = title.dataset[lang] || title.dataset.en;
  }
  document.querySelectorAll('.lang-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.lang === lang));
  document.dispatchEvent(new CustomEvent('academy:lang', { detail: lang }));
}

// ---- Scroll Animations ----
function initScrollAnimations() {
  if (typeof IntersectionObserver !== 'function') {
    document.querySelectorAll('.fade-up').forEach(el => el.classList.add('visible'));
    return;
  }
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
  document.querySelectorAll('.fade-up').forEach(el => observer.observe(el));
}

// ---- Quiz Engine ----
function academyQuizLanguage() { return document.body.getAttribute('data-lang') || 'en'; }

function appendAcademyTranslations(parent, translations, prefix = '') {
  for (const lang of ['en', 'he', 'th']) {
    const span = document.createElement('span');
    span.setAttribute(`data-${lang}`, '');
    span.textContent = prefix + (translations[lang] || translations.en || '');
    parent.appendChild(span);
  }
}

function initQuiz(courseId, lessonNum, questions) {
  const container = document.getElementById('quiz-container');
  if (!container || !Array.isArray(questions) || questions.length === 0) return;
  academyQuizStates.get(container)?.dispose();
  const result = document.getElementById('quiz-result');
  let answered = 0;
  let correct = 0;
  let answers = [];

  const updateLanguage = () => {
    const lang = academyQuizLanguage();
    container.querySelectorAll('[data-en],[data-he],[data-th]').forEach(span => {
      const visible = span.dataset[lang] !== undefined;
      span.hidden = !visible;
      span.style.display = visible ? 'inline' : 'none';
    });
    answers.forEach(({ feedback, question, passed }) => {
      const answer = question.options[question.correct][lang] || question.options[question.correct].en;
      const label = String.fromCharCode(65 + question.correct);
      const messages = {
        en: passed ? 'Correct.' : `Correct answer: ${label} — ${answer}`,
        he: passed ? 'תשובה נכונה.' : `התשובה הנכונה: ${label} — ${answer}`,
        th: passed ? 'ถูกต้อง' : `คำตอบที่ถูกต้อง: ${label} — ${answer}`
      };
      const explanation = question.explanation?.[lang] || question.explanation?.en || '';
      feedback.textContent = messages[lang] + (explanation ? ` ${explanation}` : '');
    });
    updateResultText();
    const retry = document.getElementById('quiz-retry-btn');
    if (retry) retry.textContent = { en: 'Try the quiz again', he: 'נסה שוב את הבוחן', th: 'ลองทำแบบทดสอบอีกครั้ง' }[lang];
  };

  const render = () => {
    answered = 0;
    correct = 0;
    answers = [];
    container.replaceChildren();
    if (result) {
      result.className = 'quiz-result';
      result.removeAttribute('data-score');
      result.removeAttribute('data-total');
      result.replaceChildren();
      const message = document.createElement('p');
      message.className = 'quiz-result-message';
      message.setAttribute('role', 'status');
      message.setAttribute('aria-live', 'polite');
      result.appendChild(message);
      const retry = document.createElement('button');
      retry.id = 'quiz-retry-btn';
      retry.className = 'quiz-retry-btn';
      retry.type = 'button';
      retry.addEventListener('click', () => {
        render();
        container.querySelector('button.quiz-option')?.focus();
      });
      result.appendChild(retry);
    }

    questions.forEach((question, qi) => {
      const qDiv = document.createElement('div');
      qDiv.className = 'quiz-question';
      const qText = document.createElement('p');
      qText.id = `quiz-question-${qi + 1}`;
      appendAcademyTranslations(qText, question.question, `${qi + 1}. `);
      qDiv.appendChild(qText);
      const options = document.createElement('div');
      options.className = 'quiz-options';
      options.setAttribute('role', 'group');
      options.setAttribute('aria-labelledby', qText.id);
      const feedback = document.createElement('p');
      feedback.className = 'quiz-answer-feedback';
      feedback.setAttribute('role', 'status');
      feedback.setAttribute('aria-live', 'polite');
      feedback.hidden = true;

      question.options.forEach((option, oi) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'quiz-option';
        button.setAttribute('aria-pressed', 'false');
        const marker = document.createElement('span');
        marker.className = 'marker';
        marker.setAttribute('aria-hidden', 'true');
        marker.textContent = String.fromCharCode(65 + oi);
        button.appendChild(marker);
        appendAcademyTranslations(button, option);
        button.addEventListener('click', () => {
          if (qDiv.classList.contains('answered')) return;
          qDiv.classList.add('answered');
          answered++;
          const passed = oi === question.correct;
          if (passed) correct++;
          button.setAttribute('aria-pressed', 'true');
          button.classList.add(passed ? 'correct' : 'incorrect');
          options.children[question.correct].classList.add('correct');
          Array.from(options.children).forEach(opt => {
            opt.disabled = true;
            opt.classList.add('disabled');
          });
          feedback.hidden = false;
          answers.push({ feedback, question, passed });
          updateLanguage();
          if (answered === questions.length) showQuizResult(correct, questions.length, courseId, lessonNum);
        });
        options.appendChild(button);
      });
      qDiv.appendChild(options);
      qDiv.appendChild(feedback);
      container.appendChild(qDiv);
    });
    updateLanguage();
  };

  document.addEventListener('academy:lang', updateLanguage);
  academyQuizStates.set(container, {
    dispose() { document.removeEventListener('academy:lang', updateLanguage); }
  });
  render();
}

function showQuizResult(score, total, courseId, lessonNum) {
  if (!saveQuizScore(courseId, lessonNum, score, total)) return;
  const result = document.getElementById('quiz-result');
  if (!result) return;
  const pass = score >= Math.ceil(total * academyPassRate(courseId));
  result.className = `quiz-result show ${pass ? 'pass' : 'fail'}`;
  result.dataset.score = score;
  result.dataset.total = total;
  result.dataset.passRate = academyPassRate(courseId);
  updateResultText();
}

function updateResultText() {
  const result = document.getElementById('quiz-result');
  if (!result || result.dataset.score === undefined || result.dataset.total === undefined) return;
  const score = Number(result.dataset.score);
  const total = Number(result.dataset.total);
  const pass = score >= Math.ceil(total * (Number(result.dataset.passRate) || 0.6));
  const messages = {
    en: pass ? `Great job! ${score}/${total} correct!` : `${score}/${total} — Review the material and try again.`,
    he: pass ? `כל הכבוד! ${score}/${total} תשובות נכונות!` : `${score}/${total} — חזור על החומר ונסה שוב.`,
    th: pass ? `เยี่ยมมาก! ${score}/${total} ข้อถูก!` : `${score}/${total} — ทบทวนเนื้อหาแล้วลองอีกครั้ง`
  };
  let message = result.querySelector('.quiz-result-message');
  if (!message) {
    message = document.createElement('p');
    message.className = 'quiz-result-message';
    message.setAttribute('role', 'status');
    message.setAttribute('aria-live', 'polite');
    result.prepend(message);
  }
  message.textContent = messages[academyQuizLanguage()] || messages.en;
}

// ---- Complete Lesson Button ----
function initCompleteButton(courseId, lessonNum) {
  recordLastLesson(courseId, lessonNum);
  const btn = document.getElementById('complete-btn');
  if (!btn) return;
  academyCompleteButtons.get(btn)?.();
  const updateBtn = () => {
    const lang = academyQuizLanguage();
    const completed = isLessonComplete(courseId, lessonNum);
    const passed = hasPassedQuiz(courseId, lessonNum);
    const labels = completed
      ? { en: '✓ Lesson Completed', he: '✓ השיעור הושלם', th: '✓ เรียนจบแล้ว' }
      : passed
        ? { en: 'Mark as Complete', he: 'סמן כהושלם', th: 'ทำเครื่องหมายว่าเรียนจบ' }
        : { en: 'Pass the quiz to complete this lesson', he: 'עבור את הבוחן כדי להשלים את השיעור', th: 'ผ่านแบบทดสอบเพื่อเรียนจบบทเรียนนี้' };
    btn.classList.toggle('completed', completed);
    btn.disabled = completed || !passed;
    btn.setAttribute('aria-disabled', String(btn.disabled));
    btn.dataset.state = completed ? 'completed' : passed ? 'ready' : 'locked';
    btn.textContent = labels[lang] || labels.en;
  };
  const onClick = () => {
    markLessonComplete(courseId, lessonNum);
    updateBtn();
  };
  btn.addEventListener('click', onClick);
  document.addEventListener('academy:lang', updateBtn);
  document.addEventListener('academy:progress', updateBtn);
  academyCompleteButtons.set(btn, () => {
    btn.removeEventListener('click', onClick);
    document.removeEventListener('academy:lang', updateBtn);
    document.removeEventListener('academy:progress', updateBtn);
  });
  updateBtn();
}

// ---- Init ----
document.addEventListener('DOMContentLoaded', () => {
  checkAuth();
  initLanguage();
  initScrollAnimations();
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.addEventListener('click', () => setLanguage(btn.dataset.lang));
  });
});
