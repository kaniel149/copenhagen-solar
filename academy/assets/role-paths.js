/* Bustan Academy role paths and local practice notebook. */
(() => {
  const pathSequence = (tracks, id) => {
    const base = tracks.find(t => t.id === 'foundation');
    const role = tracks.find(t => t.id === id && t.id !== 'foundation');
    return [...(base?.lessons || []), ...(role?.lessons || [])];
  };
  const nextInPath = (sequence, isComplete) => sequence.find(l => !isComplete(l.track, l.num)) || sequence[0] || null;
  const normalize = x => String(x || '').normalize('NFKD').replace(/\p{M}/gu, '').toLocaleLowerCase();
  const matches = (lesson, state, isComplete) => {
    if (state.track && lesson.track !== state.track) return false;
    const done = isComplete(lesson.track, lesson.num);
    if (state.status === 'done' && !done || state.status === 'open' && done) return false;
    const haystack = normalize([...Object.values(lesson.title), ...Object.values(lesson.summary)].join(' '));
    return normalize(state.query).split(/\s+/).filter(Boolean).every(word => haystack.includes(word));
  };
  if (typeof module !== 'undefined') module.exports = { pathSequence, nextInPath, matches };
  if (typeof document === 'undefined') return;
  document.addEventListener('DOMContentLoaded', () => {
    const model = window.ACADEMY_CURRICULUM;
    if (!model) return;
    const tracks = model.tracks;
    const lessons = tracks.flatMap(t => t.lessons);
    const roles = tracks.filter(t => t.id !== 'foundation');
    const isRole = id => roles.some(t => t.id === id);
    const progress = (id, num) => isLessonComplete(id, num);
    const lang = () => document.body.dataset.lang || 'en';
    const tr = (en, he, th) => ({ en, he, th })[lang()] || en;
    const tx = value => value[lang()] || value.en;
    const esc = x => String(x ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    const PATH_KEY = 'bustan_academy_role_path';
    const NOTE_KEY = 'bustan_academy_notebook_v1';
    const query = new URLSearchParams(location.search);
    const pageTrack = document.body.dataset.pathId || document.body.dataset.courseId;
    const explicitPath = isRole(query.get('path')) ? query.get('path') : null;
    let chosen = isRole(pageTrack) ? pageTrack : explicitPath || readAcademyStorage(PATH_KEY);
    if (!isRole(chosen)) chosen = 'foundation';
    if (chosen !== 'foundation') writeAcademyStorage(PATH_KEY, chosen);
    const depth = Boolean(document.body.dataset.courseId || document.body.dataset.pathId);
    const prefix = depth ? '../' : '';
    const lessonUrl = (lesson, role = chosen) => `${prefix}learning/${lesson.slug}.html?v=${model.version}&lang=${lang()}${isRole(role) ? `&path=${role}` : ''}`;
    const pathUrl = id => `${prefix}paths/${id}.html?v=${model.version}&lang=${lang()}`;
    const labelDone = () => tr('Completed','הושלם','เรียนจบแล้ว');
    const lessonLabel = () => tr('Lesson','שיעור','บทเรียน');
    const state = { query: '', track: '', status: '' };
    const findTrack = id => tracks.find(t => t.id === id);
    const count = items => items.filter(l => progress(l.track, l.num)).length;

    function syncLinks() {
      document.querySelectorAll('a[data-learning-link]').forEach(a => {
        const url = new URL(a.getAttribute('href'), location.href);
        url.searchParams.set('lang', lang());
        url.searchParams.set('v', model.version);
        if (/\/learning\/foundation-/.test(url.pathname) && isRole(chosen)) url.searchParams.set('path', chosen);
        a.href = url.pathname + url.search + url.hash;
      });
    }
    document.querySelectorAll('[data-path-choice]').forEach(a => a.addEventListener('click', () => {
      chosen = a.dataset.pathChoice;
      if (isRole(chosen)) writeAcademyStorage(PATH_KEY, chosen);
    }));

    function updateRows() {
      document.querySelectorAll('[data-curriculum-row]').forEach(row => {
        const done = progress(row.dataset.track, Number(row.dataset.num));
        row.classList.toggle('completed', done);
        row.querySelector('.lesson-marker').textContent = done ? '✓' : String(row.dataset.num).padStart(2,'0');
        row.querySelector('.lesson-status').textContent = done ? labelDone() : '';
      });
    }
    function renderHome() {
      if (!document.body.hasAttribute('data-role-home')) return;
      const sequence = pathSequence(tracks, chosen);
      const next = nextInPath(sequence, progress);
      const allDone = count(sequence) === sequence.length;
      const title = document.getElementById('resume-title');
      title.textContent = next ? tx(next.title) : '';
      document.getElementById('resume-copy').textContent = `${tx(findTrack(chosen).title)} · ${count(sequence)} / ${sequence.length} ${tr('lessons completed','שיעורים הושלמו','บทเรียนที่เรียนจบ')}`;
      const resume = document.getElementById('resume-path');
      resume.href = next ? lessonUrl(next) : pathUrl(chosen);
      resume.textContent = allDone ? tr('Review the path','חזרה למסלול','ทบทวนเส้นทาง') : tr('Continue learning','להמשיך ללמוד','เรียนต่อ');
      document.querySelectorAll('[data-role-progress]').forEach(el => {
        const items = pathSequence(tracks, el.dataset.roleProgress);
        el.textContent = `${count(items)} / ${items.length} ${tr('completed','הושלמו','เรียนจบ')}`;
      });
      const filtered = lessons.filter(l => matches(l, state, progress));
      document.getElementById('curriculum-results').textContent = `${filtered.length} / ${lessons.length} ${tr('lessons','שיעורים','บทเรียน')} · ${count(lessons)} ${tr('completed','הושלמו','เรียนจบ')}`;
      const list = document.getElementById('curriculum-list');
      list.innerHTML = filtered.map(l => {
        const done = progress(l.track, l.num);
        return `<li class="curriculum-row ${done?'completed':''}"><a href="${lessonUrl(l,l.track==='foundation'?chosen:l.track)}"><span class="lesson-marker" aria-hidden="true">${done?'✓':String(l.num).padStart(2,'0')}</span><span class="lesson-line"><small class="result-track">${esc(tx(findTrack(l.track).title))}</small><strong>${esc(tx(l.title))}</strong><span>${esc(tx(l.summary))}</span></span><span class="lesson-status">${done?esc(labelDone()):''}</span></a></li>`;
      }).join('');
      document.getElementById('curriculum-empty').hidden = filtered.length > 0;
    }
    function renderControls() {
      const q = document.getElementById('curriculum-query');
      if (!q) return;
      q.placeholder = tr('Battery, survey, cash flow, permits…','סוללות, סקר, תזרים, רישוי…','แบตเตอรี่ สำรวจ กระแสเงินสด ใบอนุญาต…');
      q.setAttribute('aria-label', tr('Search lessons','חיפוש שיעורים','ค้นหาบทเรียน'));
      const filter = document.getElementById('curriculum-track');
      filter.setAttribute('aria-label', tr('Path','מסלול','เส้นทาง'));
      filter.innerHTML = `<option value="">${tr('All paths','כל המסלולים','ทุกเส้นทาง')}</option>` + tracks.map(t => `<option value="${t.id}">${esc(tx(t.title))}</option>`).join('');
      filter.value = state.track;
      const status = document.getElementById('curriculum-status');
      status.setAttribute('aria-label', tr('Progress','התקדמות','ความคืบหน้า'));
      status.innerHTML = `<option value="">${tr('All lessons','כל השיעורים','ทุกบทเรียน')}</option><option value="open">${tr('Not completed','טרם הושלמו','ยังไม่จบ')}</option><option value="done">${labelDone()}</option>`;
      status.value = state.status;
    }
    function renderPath() {
      const id = document.body.dataset.pathId;
      if (!id) return;
      const sequence = pathSequence(tracks, id);
      const base = findTrack('foundation').lessons;
      const total = count(sequence);
      const foundationDone = count(base);
      document.getElementById('path-progress').textContent = `${total} / ${sequence.length} ${tr('lessons completed','שיעורים הושלמו','บทเรียนที่เรียนจบ')}`;
      document.getElementById('foundation-status').textContent = foundationDone === base.length
        ? tr('Foundation complete. Continue with your specialist lessons and role assessment.','הבסיס הושלם. המשיכו לשיעורים הייעודיים ולמשימת המסלול.','พื้นฐานครบแล้ว เรียนเฉพาะทางและทำภารกิจประเมินต่อ')
        : tr(`Start with the shared foundation: ${foundationDone}/${base.length} complete.`,`מתחילים בבסיס המשותף: ${foundationDone}/${base.length} הושלמו.`,`เริ่มจากพื้นฐานร่วม: เรียนจบ ${foundationDone}/${base.length}`);
      const next = nextInPath(sequence, progress);
      const button = document.getElementById('path-continue');
      button.href = next ? lessonUrl(next, id) : '#capstone';
      button.textContent = total === sequence.length ? tr('Review lessons','חזרה על השיעורים','ทบทวนบทเรียน') : tr('Continue to the next lesson','להמשיך לשיעור הבא','ไปบทเรียนถัดไป');
      document.querySelectorAll('[data-stage]').forEach(el => {
        const items = findTrack(el.dataset.stage).lessons;
        el.textContent = `${count(items)} / ${items.length} ${tr('completed','הושלמו','เรียนจบ')}`;
      });
      document.getElementById('capstone-status').textContent = total === sequence.length
        ? tr('All learning checkpoints complete. Prepare your evidence for a trainer’s practical review.','כל נקודות הבדיקה בלמידה הושלמו. הכינו את הראיות לבדיקה מעשית של אחראי ההדרכה.','จุดตรวจการเรียนครบแล้ว เตรียมหลักฐานให้ผู้ฝึกสอนประเมินภาคปฏิบัติ')
        : tr('Complete the foundation and specialist lessons before submitting the final assessment.','השלימו את הבסיס ואת השיעורים הייעודיים לפני מסירת משימת הסיום.','เรียนพื้นฐานและเฉพาะทางให้ครบก่อนส่งภารกิจสุดท้าย');
      updateRows();
    }
    function renderLesson() {
      document.querySelector('.curriculum-pagination')?.setAttribute('aria-label',tr('Lesson navigation','ניווט בין שיעורים','การนำทางบทเรียน'));
      const id = document.body.dataset.courseId;
      if (!id) return;
      const num = Number(document.body.dataset.lessonNum);
      const role = id === 'foundation' ? chosen : id;
      const sequence = pathSequence(tracks, role);
      const index = sequence.findIndex(l => l.track === id && l.num === num);
      const next = sequence[index + 1];
      const previous = sequence[index - 1];
      const prevLink = document.getElementById('previous-lesson');
      const nextLink = document.getElementById('next-lesson');
      prevLink.href = previous ? lessonUrl(previous, role) : pathUrl(role);
      prevLink.textContent = previous ? `${tr('Previous','הקודם','ก่อนหน้า')}: ${tx(previous.title)}` : tr('Back to the path','בחזרה למסלול','กลับสู่เส้นทาง');
      nextLink.href = next ? lessonUrl(next, role) : role === 'foundation' ? `${prefix}index.html?lang=${lang()}#roles` : pathUrl(role)+'#capstone';
      nextLink.textContent = next ? `${tr('Next','הבא','ถัดไป')}: ${tx(next.title)}` : role === 'foundation' ? tr('Choose your role','בחירת מסלול תפקיד','เลือกเส้นทางตามบทบาท') : tr('Role assessment','משימת סיום למסלול','ภารกิจประเมินตามบทบาท');
      const base = findTrack('foundation').lessons;
      const baseDone = count(base);
      document.getElementById('learning-context').textContent = id === 'foundation'
        ? tr('Shared foundation: completion counts across all six roles.','בסיס משותף: ההשלמה נספרת בכל ששת המסלולים.','พื้นฐานร่วม: ผลการเรียนใช้นับได้กับทั้งหกบทบาท')
        : baseDone === base.length
          ? `${tx(findTrack(id).title)} · ${lessonLabel()} ${num} / ${findTrack(id).lessons.length}`
          : tr(`You are previewing a specialist lesson. Complete the shared foundation first (${baseDone}/8).`,`זהו שיעור ייעודי. מומלץ להשלים תחילה את הבסיס המשותף (${baseDone}/8).`,`กำลังดูบทเฉพาะทาง แนะนำให้เรียนพื้นฐานร่วมก่อน (${baseDone}/8)`);
    }
    function readNotes(raw = readAcademyStorage(NOTE_KEY)) {
      const data = parseAcademyRecord(raw);
      const clean = {};
      if (data) for (const l of lessons) if (typeof data[l.slug] === 'string') clean[l.slug] = data[l.slug].slice(0,24000);
      return clean;
    }
    const notes = document.querySelector('[data-notebook]');
    let notebookData = readNotes();
    let notebookPersisted = true;
    let notebookConflict = false;
    let keepDraftButton;
    let loadRemoteButton;
    function notebookStatus() {
      const status = document.getElementById('notebook-status');
      if (!status || !notes) return;
      if (keepDraftButton) {
        keepDraftButton.hidden = loadRemoteButton.hidden = !notebookConflict;
        keepDraftButton.textContent = tr('Save my draft','שמירת הטיוטה שלי','บันทึกร่างของฉัน');
        loadRemoteButton.textContent = tr('Load the other tab’s answer','טעינת התשובה מהלשונית האחרת','โหลดคำตอบจากอีกแท็บ');
      }
      status.textContent = notebookConflict
        ? tr('Another tab changed this answer. Your draft is kept here. Choose which version to keep, or download your draft.','התשובה השתנתה בלשונית אחרת. הטיוטה שלכם נשמרת כאן. בחרו איזו גרסה לשמור, או הורידו את הטיוטה.','อีกแท็บเปลี่ยนคำตอบนี้แล้ว ร่างของคุณยังอยู่ที่นี่ เลือกฉบับที่จะเก็บหรือดาวน์โหลดร่างของคุณ')
        : !notes.value ? tr('Ready for your answer','מוכנים לתשובה שלכם','พร้อมสำหรับคำตอบของคุณ')
        : notebookPersisted ? tr('Saved in this browser','נשמר בדפדפן הזה','บันทึกในเบราว์เซอร์นี้แล้ว')
          : tr('Browser storage is unavailable. Download your notebook before leaving.','שמירת הדפדפן אינה זמינה. הורידו את המחברת לפני היציאה.','พื้นที่เก็บข้อมูลเบราว์เซอร์ใช้ไม่ได้ ดาวน์โหลดสมุดก่อนออก');
    }
    function saveNotebookDraft() {
      notebookData[notes.dataset.notebook] = notes.value;
      notebookPersisted = writeAcademyStorage(NOTE_KEY, JSON.stringify(notebookData));
      notebookConflict = false;
      notebookStatus();
    }
    function reconcileNotebook(raw) {
      if (raw !== undefined) adoptAcademyStorageSnapshot(NOTE_KEY, raw);
      notebookData = raw === undefined ? readNotes() : readNotes(raw);
      if (!notes) return;
      const incoming = notebookData[notes.dataset.notebook] || '';
      if (incoming === notes.value) {
        notebookConflict = false;
      } else if (document.activeElement === notes || !notebookPersisted || notebookConflict) {
        notebookConflict = true;
      } else {
        notes.value = incoming;
        notebookPersisted = true;
      }
      notebookStatus();
    }
    if (notes) {
      notes.value = notebookData[notes.dataset.notebook] || '';
      notes.setAttribute('aria-label', tr('My answer and evidence','התשובה והראיות שלי','คำตอบและหลักฐานของฉัน'));
      notes.addEventListener('input', () => {
        if (notebookConflict) notebookStatus();
        else saveNotebookDraft();
      });
      const actions = document.getElementById('notebook-status').parentElement;
      keepDraftButton = document.createElement('button');
      keepDraftButton.id = 'notebook-keep-draft';
      keepDraftButton.type = 'button';
      keepDraftButton.className = 'btn';
      keepDraftButton.addEventListener('click', () => { saveNotebookDraft(); notes.focus(); });
      loadRemoteButton = document.createElement('button');
      loadRemoteButton.id = 'notebook-load-remote';
      loadRemoteButton.type = 'button';
      loadRemoteButton.className = 'btn';
      loadRemoteButton.addEventListener('click', () => {
        notes.value = notebookData[notes.dataset.notebook] || '';
        notebookConflict = false;
        notebookPersisted = true;
        notebookStatus();
        notes.focus();
      });
      actions.appendChild(keepDraftButton);
      actions.appendChild(loadRemoteButton);
      notebookStatus();
    }
    document.getElementById('download-notebook')?.addEventListener('click', () => {
      const exportedNotes = notes ? { ...notebookData, [notes.dataset.notebook]: notes.value } : readNotes();
      const sequence = document.body.dataset.pathId ? pathSequence(tracks, document.body.dataset.pathId) : pathSequence(tracks, chosen);
      const lines = ['Bustan Energy Academy',tr('Practice notebook','מחברת תרגול','สมุดแบบฝึกหัด'),new Date().toISOString(),'',tr('Learning progress and learner-written answers. Practical assessment requires a trainer.','התקדמות בלמידה ותשובות שנכתבו בידי הלומד. הערכה מעשית דורשת בדיקת אחראי.','ความคืบหน้าการเรียนและคำตอบของผู้เรียน การประเมินภาคปฏิบัติต้องมีผู้ฝึกสอนตรวจ'),''];
      sequence.forEach(l => lines.push(tx(findTrack(l.track).title)+' · '+lessonLabel()+' '+l.num+': '+tx(l.title),progress(l.track,l.num)?labelDone():tr('Not completed','טרם הושלם','ยังไม่จบ'),exportedNotes[l.slug] || tr('No written answer yet.','עדיין לא נכתבה תשובה.','ยังไม่มีคำตอบที่เขียน'),''));
      const url = URL.createObjectURL(new Blob([lines.join('\n')],{type:'text/plain;charset=utf-8'}));
      const a = document.createElement('a'); a.href=url; a.download=`bustan-academy-notebook-${chosen}-${lang()}.txt`; a.click();
      setTimeout(()=>URL.revokeObjectURL(url),1000);
    });
    const q = document.getElementById('curriculum-query');
    if (q) {
      q.addEventListener('input',()=>{state.query=q.value;renderHome()});
      document.getElementById('curriculum-track').addEventListener('change',e=>{state.track=e.target.value;renderHome()});
      document.getElementById('curriculum-status').addEventListener('change',e=>{state.status=e.target.value;renderHome()});
      document.getElementById('curriculum-filters').addEventListener('submit',e=>e.preventDefault());
      document.getElementById('curriculum-clear').addEventListener('click',()=>{state.query=state.track=state.status='';q.value='';renderControls();renderHome();q.focus()});
    }
    function refresh() { if(notes) notes.setAttribute('aria-label',tr('My answer and evidence','התשובה והראיות שלי','คำตอบและหลักฐานของฉัน')); renderControls();renderHome();renderPath();renderLesson();notebookStatus();syncLinks(); }
    document.addEventListener('academy:lang', refresh);
    document.addEventListener('academy:progress', refresh);
    window.addEventListener('pageshow', () => { reconcileNotebook(); refresh(); });
    window.addEventListener('storage',event=>{
      if(event.key===NOTE_KEY||event.key===null) reconcileNotebook(event.newValue);
      if((event.key===PATH_KEY||event.key===null)&&!pageTrack){const saved=readAcademyStorage(PATH_KEY);chosen=isRole(saved)?saved:'foundation';refresh()}
    });
    refresh();
  });
})();
