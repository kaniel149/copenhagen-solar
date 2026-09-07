/* Bustan Energy Academy — lesson discovery and a useful next step. */
(() => {
  const normalize = (value) => String(value || '').normalize('NFKD').replace(/\p{M}/gu, '').toLowerCase();
  function matchesLesson(lesson, tracks, state, isComplete) {
    if (state.track && lesson.track !== state.track) return false;
    const completed = isComplete(lesson.track, lesson.num);
    if (state.status === 'completed' && !completed) return false;
    if (state.status === 'unfinished' && completed) return false;
    const track = tracks[lesson.track] || {};
    const haystack = normalize([...Object.values(lesson.title), track.en, track.he, track.th].join(' '));
    return normalize(state.query).split(/\s+/).filter(Boolean).every(word => haystack.includes(word));
  }
  function nextLesson(lessons, last, isComplete) {
    const recent = lessons.find(l => l.track === last?.courseId && l.num === last?.lessonNum);
    if (recent && !isComplete(recent.track, recent.num)) return recent;
    if (recent) {
      const sameTrack = lessons.find(l => l.track === recent.track && l.num > recent.num && !isComplete(l.track, l.num));
      if (sameTrack) return sameTrack;
    }
    return lessons.find(l => !isComplete(l.track, l.num)) || recent || lessons[0] || null;
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = { matchesLesson, nextLesson };
  if (typeof document === 'undefined') return;

  document.addEventListener('DOMContentLoaded', () => {
    const lessons = window.ACADEMY_LESSONS || [];
    const tracks = window.ACADEMY_TRACKS || {};
    const state = { query: '', track: '', status: '' };
    const q = document.getElementById('lesson-search');
    const trackSelect = document.getElementById('track-filter');
    const statusSelect = document.getElementById('status-filter');
    if (!q || !lessons.length) return;
    const lang = () => document.body.dataset.lang || 'en';
    const text = values => values[lang()] || values.en;
    const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const complete = (track, num) => isLessonComplete(track, num);
    const href = lesson => `${lesson.file}?v=paths-20260907&lang=${lang()}`;
    const wording = {
      allTracks: { en: 'All tracks', he: 'כל המסלולים', th: 'ทุกเส้นทาง' },
      allLessons: { en: 'All lessons', he: 'כל השיעורים', th: 'ทุกบทเรียน' },
      unfinished: { en: 'Not completed', he: 'טרם הושלמו', th: 'ยังไม่จบ' },
      completed: { en: 'Completed', he: 'הושלמו', th: 'เรียนจบแล้ว' },
      clear: { en: 'Clear filters', he: 'ניקוי סינון', th: 'ล้างตัวกรอง' },
      search: { en: 'Search solar, battery, sales…', he: 'חיפוש סולאר, סוללות, מכירות…', th: 'ค้นหาโซลาร์ แบตเตอรี่ การขาย…' },
      start: { en: 'Start learning', he: 'להתחיל ללמוד', th: 'เริ่มเรียน' },
      resume: { en: 'Continue learning', he: 'להמשיך ללמוד', th: 'เรียนต่อ' },
      review: { en: 'Review a lesson', he: 'לחזור על שיעור', th: 'ทบทวนบทเรียน' },
      next: { en: 'Your next step', he: 'הצעד הבא שלך', th: 'ขั้นตอนถัดไปของคุณ' },
      allDone: { en: 'All lessons completed', he: 'כל השיעורים הושלמו', th: 'เรียนจบทุกบทแล้ว' },
      lesson: { en: 'Lesson', he: 'שיעור', th: 'บทเรียน' },
      progress: { en: 'Learning progress', he: 'התקדמות בלמידה', th: 'ความคืบหน้าการเรียน' },
    };

    function renderControls() {
      q.setAttribute('aria-label', text({ en: 'Find a lesson', he: 'חיפוש שיעור', th: 'ค้นหาบทเรียน' }));
      trackSelect.setAttribute('aria-label', text({ en: 'Track', he: 'מסלול', th: 'เส้นทาง' }));
      statusSelect.setAttribute('aria-label', text({ en: 'Progress', he: 'התקדמות', th: 'ความคืบหน้า' }));
      q.placeholder = text(wording.search);
      trackSelect.innerHTML = `<option value="">${esc(text(wording.allTracks))}</option>` + Object.entries(tracks).map(([id, track]) => `<option value="${id}">${esc(track[lang()] || track.en)}</option>`).join('');
      trackSelect.value = state.track;
      statusSelect.innerHTML = ['', 'unfinished', 'completed'].map(value => `<option value="${value}">${esc(text(wording[value || 'allLessons']))}</option>`).join('');
      statusSelect.value = state.status;
      document.getElementById('clear-filters').textContent = text(wording.clear);
    }

    function render() {
      let shown = 0;
      document.querySelectorAll('[data-track-lessons]').forEach(ul => {
        const track = ul.dataset.trackLessons;
        const all = lessons.filter(l => l.track === track);
        const filtered = all.filter(l => matchesLesson(l, tracks, state, complete));
        shown += filtered.length;
        const row = document.getElementById(`track-${track}`);
        row.hidden = !filtered.length;
        ul.innerHTML = filtered.map(l => {
          const done = complete(track, l.num);
          return `<li><a class="lesson-row${done ? ' done' : ''}" href="${href(l)}"><span class="n" aria-hidden="true">${done ? '✓' : l.num}</span><span class="t">${esc(l.title[lang()] || l.title.en)}${done ? `<small class="lesson-done-label">${esc(text(wording.completed))}</small>` : ''}</span><svg class="i arrow" aria-hidden="true"><use href="#i-arrow"/></svg></a></li>`;
        }).join('');
        const card = row.querySelector('.track-card');
        const next = all.find(l => !complete(l.track, l.num)) || all[0];
        if (card && next) card.href = href(next);
      });

      const done = lessons.filter(l => complete(l.track, l.num)).length;
      document.getElementById('overall-fill').style.width = `${Math.round(done / lessons.length * 100)}%`;
      document.getElementById('overall-text').textContent = `${done} / ${lessons.length}`;
      const progress = document.getElementById('overall-progress');
      progress.setAttribute('aria-valuenow', String(done));
      progress.setAttribute('aria-label', text(wording.progress));
      document.getElementById('lesson-results').textContent = text({ en: `${shown} of ${lessons.length} lessons · ${done} completed`, he: `${shown} מתוך ${lessons.length} שיעורים · ${done} הושלמו`, th: `${shown} จาก ${lessons.length} บทเรียน · เรียนจบแล้ว ${done} บท` });
      document.getElementById('lesson-empty').hidden = shown > 0;
      document.getElementById('clear-filters').hidden = !(state.query || state.track || state.status);

      const last = typeof getLastLesson === 'function' ? getLastLesson() : null;
      const next = nextLesson(lessons, last, complete);
      if (next) {
        const label = text(done === lessons.length ? wording.review : last || done ? wording.resume : wording.start);
        document.getElementById('resume-heading').textContent = next.title[lang()] || next.title.en;
        document.getElementById('resume-eyebrow').textContent = text(done === lessons.length ? wording.allDone : wording.next);
        document.getElementById('resume-meta').textContent = `${tracks[next.track][lang()] || tracks[next.track].en} · ${text(wording.lesson)} ${next.num}`;
        for (const id of ['resume-lesson-link', 'hero-resume-link']) {
          const link = document.getElementById(id);
          link.href = href(next);
          link.textContent = label;
        }
      }
      updateProgressBars();
    }
    function reset() {
      state.query = state.track = state.status = '';
      q.value = '';
      renderControls();
      render();
      q.focus();
    }
    q.addEventListener('input', () => { state.query = q.value; render(); });
    trackSelect.addEventListener('change', () => { state.track = trackSelect.value; render(); });
    statusSelect.addEventListener('change', () => { state.status = statusSelect.value; render(); });
    document.getElementById('lesson-filters').addEventListener('submit', e => e.preventDefault());
    document.getElementById('clear-filters').addEventListener('click', reset);
    document.getElementById('empty-clear').addEventListener('click', reset);
    document.querySelectorAll('.path a[href^="#track-"]').forEach(link => link.addEventListener('click', () => {
      state.track = link.getAttribute('href').replace('#track-', '');
      state.query = state.status = '';
      q.value = '';
      renderControls();
      render();
    }));
    document.addEventListener('academy:lang', () => { renderControls(); render(); });
    document.addEventListener('academy:progress', render);
    window.addEventListener('pageshow', render);
    window.addEventListener('storage', event => { if (!event.key || event.key.startsWith('bustan_academy')) render(); });
    renderControls();
    render();
  });
})();
