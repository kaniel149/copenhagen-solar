/* In-lesson navigation and reading progress; neither marks a lesson complete. */
document.addEventListener('DOMContentLoaded', () => {
  const lesson = document.querySelector('.lesson-container');
  if (!lesson) return;
  const sections = [...lesson.querySelectorAll('.lesson-section, .content-section')].filter(section => section.querySelector('h2'));
  if (!sections.length) return;
  const outline = document.createElement('details');
  outline.className = 'lesson-outline';
  const summary = document.createElement('summary');
  const navigation = document.createElement('nav');
  outline.append(summary, navigation);
  const first = sections[0];
  first.parentNode.insertBefore(outline, first);

  const meter = document.createElement('div');
  meter.className = 'lesson-reading-progress';
  meter.setAttribute('role', 'progressbar');
  meter.setAttribute('aria-valuemin', '0');
  meter.setAttribute('aria-valuemax', '100');
  const fill = document.createElement('i');
  meter.append(fill);
  document.body.append(meter);
  sections.forEach((section, index) => { if (!section.id) section.id = `lesson-part-${index + 1}`; });

  function renderOutline() {
    const lang = document.body.dataset.lang || 'en';
    const label = { en: 'In this lesson', he: 'בתוך השיעור', th: 'ในบทเรียนนี้' }[lang] || 'In this lesson';
    summary.textContent = label;
    navigation.setAttribute('aria-label', label);
    meter.setAttribute('aria-label', { en: 'Reading progress', he: 'התקדמות בקריאה', th: 'ความคืบหน้าการอ่าน' }[lang] || 'Reading progress');
    const list = document.createElement('ol');
    sections.forEach(section => {
      const heading = section.querySelector(`h2[data-${lang}]`) || [...section.querySelectorAll('h2')].find(h => !h.hasAttribute('data-en') && !h.hasAttribute('data-he') && !h.hasAttribute('data-th'));
      if (!heading) return;
      const item = document.createElement('li');
      const link = document.createElement('a');
      const translated = heading.querySelector(`[data-${lang}]`);
      link.textContent = (translated || heading).textContent.trim();
      link.href = `#${section.id}`;
      link.addEventListener('click', () => { outline.open = false; });
      item.append(link);
      list.append(item);
    });
    navigation.replaceChildren(list);
  }
  function updateReadingProgress() {
    const rect = lesson.getBoundingClientRect();
    const navHeight = document.getElementById('nav')?.offsetHeight || 76;
    const distance = Math.max(1, lesson.offsetHeight - (window.innerHeight - navHeight));
    const percentage = Math.max(0, Math.min(100, Math.round((navHeight - rect.top) / distance * 100)));
    fill.style.width = `${percentage}%`;
    meter.setAttribute('aria-valuenow', String(percentage));
  }
  let scheduled = false;
  const scheduleUpdate = () => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => { scheduled = false; updateReadingProgress(); });
  };
  window.addEventListener('scroll', scheduleUpdate, { passive: true });
  window.addEventListener('resize', scheduleUpdate, { passive: true });
  window.addEventListener('load', scheduleUpdate);
  document.addEventListener('academy:lang', () => { renderOutline(); scheduleUpdate(); });
  renderOutline();
  updateReadingProgress();
});
