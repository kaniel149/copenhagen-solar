/* ============================================================
   Bustan Dark — shared runtime: icons, nav, footer, language,
   reveal, catalog, deck theater. Loaded by every page:
   <script src="…/assets/site.js" data-root="../" defer></script>
   ============================================================ */
(() => {
  const SCRIPT = document.currentScript || document.querySelector('script[src$="site.js"]');
  const ROOT = (SCRIPT && SCRIPT.dataset.root) || '';
  const BRAND_VERSION = 'bustan-20260907';
  const GH = 'https://github.com/kaniel149/bustan-index/blob/main/';
  const LANGS = ['en', 'he', 'th'];
  document.documentElement.classList.add('js');

  // ---------- i18n ----------
  const T = {
    catalog: { en: 'Catalog', he: 'קטלוג', th: 'แคตตาล็อก' },
    presentations: { en: 'Presentations', he: 'מצגות', th: 'งานนำเสนอ' },
    academy: { en: 'Academy', he: 'אקדמיה', th: 'อคาเดมี' },
    tools: { en: 'Tools', he: 'כלים', th: 'เครื่องมือ' },
    blog: { en: 'Blog', he: 'בלוג', th: 'บล็อก' },
    admin: { en: 'Admin', he: 'אדמין', th: 'แอดมิน' },
    company: { en: 'Company', he: 'חברה', th: 'บริษัท' },
    language: { en: 'Language', he: 'שפה', th: 'ภาษา' },
    index: { en: 'Index', he: 'אינדקס', th: 'ดัชนี' },
    site: { en: 'Marketing site', he: 'אתר שיווקי', th: 'เว็บไซต์การตลาด' },
    rights: { en: 'Internal knowledge index · Koh Phangan, Thailand', he: 'אינדקס ידע פנימי · קופנגן, תאילנד', th: 'ดัชนีความรู้ภายใน · เกาะพะงัน ประเทศไทย' },
    search: { en: 'Search titles, groups, languages…', he: 'חיפוש בכותרות, קבוצות, שפות…', th: 'ค้นหาชื่อ กลุ่ม ภาษา…' },
    showing: { en: 'Showing', he: 'מציג', th: 'แสดง' },
    of: { en: 'of', he: 'מתוך', th: 'จาก' },
    clear: { en: 'Clear', he: 'נקה', th: 'ล้าง' },
    kind: { en: 'Type', he: 'סוג', th: 'ประเภท' },
    audience: { en: 'Audience', he: 'קהל', th: 'กลุ่มเป้าหมาย' },
    lang: { en: 'Language', he: 'שפה', th: 'ภาษา' },
    empty: { en: 'Nothing matches. Try another word or clear the filters.', he: 'לא נמצאו תוצאות. נסו מילה אחרת או נקו את הסינון.', th: 'ไม่พบผลลัพธ์ ลองคำอื่นหรือล้างตัวกรอง' },
    open: { en: 'Open', he: 'פתח', th: 'เปิด' },
    fullscreen: { en: 'Fullscreen', he: 'מסך מלא', th: 'เต็มจอ' },
    close: { en: 'Close', he: 'סגור', th: 'ปิด' },
    external: { en: 'external', he: 'חיצוני', th: 'ภายนอก' },
    updated: { en: 'Updated', he: 'עודכן', th: 'อัปเดต' },
    menu: { en: 'Menu', he: 'תפריט', th: 'เมนู' },
  };
  const KINDS = {
    deck: { icon: 'deck', en: 'Presentations', he: 'מצגות', th: 'งานนำเสนอ', desc: { en: 'Slide decks for clients, partners and investors', he: 'מצגות ללקוחות, שותפים ומשקיעים', th: 'สไลด์สำหรับลูกค้า พันธมิตร และนักลงทุน' } },
    doc: { icon: 'doc', en: 'Playbooks & documents', he: 'מדריכים ומסמכים', th: 'คู่มือและเอกสาร', desc: { en: 'Business plan, strategy, ops, CRM steps, legal, plans', he: 'תוכנית עסקית, אסטרטגיה, תפעול, CRM, משפטי, תוכניות', th: 'แผนธุรกิจ กลยุทธ์ ปฏิบัติการ CRM กฎหมาย' } },
    academy: { icon: 'academy', en: 'Academy', he: 'אקדמיה', th: 'อคาเดมี', desc: { en: '24 lessons in 5 tracks · EN / HE / TH', he: '24 שיעורים ב-5 מסלולים · EN / HE / TH', th: '24 บทเรียน 5 เส้นทาง · EN / HE / TH' } },
    tool: { icon: 'tool', en: 'Tools', he: 'כלים', th: 'เครื่องมือ', desc: { en: 'Scanners, maps, trackers, admin', he: 'סורקים, מפות, מעקב, אדמין', th: 'เครื่องสแกน แผนที่ ตัวติดตาม แอดมิน' } },
    proposal: { icon: 'proposal', en: 'Proposals', he: 'הצעות מחיר', th: 'ข้อเสนอ', desc: { en: 'Client proposals and layouts', he: 'הצעות ללקוחות ותוכניות פריסה', th: 'ข้อเสนอลูกค้าและแบบวาง' } },
    pea: { icon: 'pea', en: 'PEA & grid', he: 'PEA ורשת', th: 'PEA และโครงข่าย', desc: { en: 'Applications, single-line diagrams, layouts', he: 'בקשות, תרשימי SLD, פריסות', th: 'ใบสมัคร แผนภาพเส้นเดียว แบบวาง' } },
    research: { icon: 'research', en: 'Research', he: 'מחקר', th: 'งานวิจัย', desc: { en: 'Thailand solar market, regulations, verification', he: 'שוק סולארי בתאילנד, רגולציה, אימות', th: 'ตลาดโซลาร์ไทย กฎระเบียบ การตรวจสอบ' } },
    podcast: { icon: 'podcast', en: 'Podcasts', he: 'פודקאסטים', th: 'พอดแคสต์', desc: { en: 'Audio walkthroughs of the playbooks', he: 'הסברים קוליים על המדריכים', th: 'เสียงบรรยายคู่มือ' } },
    brand: { icon: 'brand', en: 'Brand & marketing', he: 'מותג ושיווק', th: 'แบรนด์และการตลาด', desc: { en: 'Brand kit, ads, posts, landing pages', he: 'ערכת מותג, מודעות, פוסטים, דפי נחיתה', th: 'ชุดแบรนด์ โฆษณา โพสต์ แลนดิ้งเพจ' } },
    blog: { icon: 'blog', en: 'Blog', he: 'בלוג', th: 'บล็อก', desc: { en: 'Public SEO articles', he: 'מאמרי SEO ציבוריים', th: 'บทความ SEO สาธารณะ' } },
  };
  const AUD = { internal: { en: 'Internal', he: 'פנימי', th: 'ภายใน' }, team: { en: 'Team', he: 'צוות', th: 'ทีม' }, client: { en: 'Client', he: 'לקוח', th: 'ลูกค้า' }, investor: { en: 'Investor', he: 'משקיע', th: 'นักลงทุน' } };
  const LANG_LABEL = { en: 'EN', he: 'עב', th: 'ไทย' };

  let lang = 'en';
  const t = (o) => (o && (o[lang] || o.en)) || '';
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const icon = (name, cls = 'i') => `<svg class="${cls}" aria-hidden="true"><use href="#i-${name}"/></svg>`;

  // ---------- icon sprite (1.5px line set) ----------
  const SPRITE = `<svg xmlns="http://www.w3.org/2000/svg" style="display:none" aria-hidden="true">
<symbol id="i-mark" viewBox="0 0 24 24"><path d="M12 3v2M4.2 6.2l1.4 1.4M3 13h2M19 13h2M18.4 6.2 17 7.6"/><path d="M6 17a6 6 0 0 1 12 0"/><path d="M3 21h18"/></symbol>
<symbol id="i-deck" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="13" rx="2"/><path d="M12 17v3M8 20h8"/><path d="m10 8 4 2.5-4 2.5z"/></symbol>
<symbol id="i-doc" viewBox="0 0 24 24"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h6"/></symbol>
<symbol id="i-academy" viewBox="0 0 24 24"><path d="m2 9 10-5 10 5-10 5z"/><path d="M6 11.5V16c0 1.5 3 3 6 3s6-1.5 6-3v-4.5"/><path d="M22 9v6"/></symbol>
<symbol id="i-tool" viewBox="0 0 24 24"><path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18v3h3l6.3-6.3a4 4 0 0 0 5.4-5.4l-2.6 2.6-2.1-2.1z"/></symbol>
<symbol id="i-proposal" viewBox="0 0 24 24"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/><path d="m9 15 2 2 4-4"/></symbol>
<symbol id="i-pea" viewBox="0 0 24 24"><path d="M13 2 4 14h7l-1 8 9-12h-7z"/></symbol>
<symbol id="i-research" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></symbol>
<symbol id="i-podcast" viewBox="0 0 24 24"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3M9 21h6"/></symbol>
<symbol id="i-brand" viewBox="0 0 24 24"><path d="M20 12 12 20l-9-9V3h8z"/><circle cx="7.5" cy="7.5" r="1.5"/></symbol>
<symbol id="i-blog" viewBox="0 0 24 24"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></symbol>
<symbol id="i-arrow" viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></symbol>
<symbol id="i-ext" viewBox="0 0 24 24"><path d="M14 4h6v6M20 4l-9 9"/><path d="M19 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5"/></symbol>
<symbol id="i-menu" viewBox="0 0 24 24"><path d="M4 7h16M4 12h16M4 17h16"/></symbol>
<symbol id="i-close" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></symbol>
<symbol id="i-full" viewBox="0 0 24 24"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></symbol>
<symbol id="i-play" viewBox="0 0 24 24"><path d="m7 5 12 7-12 7z"/></symbol>
<symbol id="i-globe" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/></symbol>
<symbol id="i-check" viewBox="0 0 24 24"><path d="m5 12 4 4L19 6"/></symbol>
<symbol id="i-info" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 8h.01M11 12h1v5h1"/></symbol>
<symbol id="i-chart" viewBox="0 0 24 24"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></symbol>
<symbol id="i-scan" viewBox="0 0 24 24"><path d="M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3M3 12h18"/></symbol>
<symbol id="i-bill" viewBox="0 0 24 24"><path d="M6 3h12v18l-3-2-3 2-3-2-3 2z"/><path d="M9 8h6M9 12h6"/></symbol>
<symbol id="i-file" viewBox="0 0 24 24"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/></symbol>
<symbol id="i-search" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></symbol>
<symbol id="i-clock" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></symbol>
<symbol id="i-sun" viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></symbol>
<symbol id="i-bolt" viewBox="0 0 24 24"><path d="M13 2 4 14h7l-1 8 9-12h-7z"/></symbol>
<symbol id="i-briefcase" viewBox="0 0 24 24"><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M3 12h18"/></symbol>
<symbol id="i-battery" viewBox="0 0 24 24"><rect x="3" y="7" width="16" height="10" rx="2"/><path d="M22 11v2M7 11v2M11 11v2"/></symbol>
<symbol id="i-users" viewBox="0 0 24 24"><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M21.5 20a6.5 6.5 0 0 0-4.5-6.2"/></symbol>
<symbol id="i-cert" viewBox="0 0 24 24"><circle cx="12" cy="9" r="6"/><path d="m8.5 14-1.5 7 5-2.5 5 2.5-1.5-7"/></symbol>
</svg>`;
  document.body.insertAdjacentHTML('afterbegin', SPRITE);

  // ---------- nav + footer ----------
  const NAV_LINKS = [
    ['catalog', ROOT + 'index.html#catalog', 'catalog'],
    ['presentations', ROOT + 'presentations/index.html', 'presentations'],
    ['academy', ROOT + 'academy/index.html', 'academy'],
    ['tools', ROOT + 'index.html#g-tool', 'tools'],
    ['blog', ROOT + 'blog/index.html', 'blog'],
    ['admin', 'https://bustan-energy.com/admin', 'admin'],
  ];
  const navHost = document.getElementById('site-nav');
  const page = (navHost && navHost.dataset.page) || '';
  const spans = (k) => LANGS.map((l) => `<span data-${l}>${esc(T[k][l])}</span>`).join('');
  const navHTML = `<header class="nav" id="nav"><div class="nav-inner">
    <a class="nav-logo" href="${ROOT}index.html" aria-label="Bustan Energy"><img src="${ROOT}assets/bustan-energy-logo.png" alt="Bustan Energy" width="188" height="84"></a>
    <nav class="nav-links" aria-label="Site">${NAV_LINKS.map(([k, href, id]) => `<a href="${href}"${id === page ? ' aria-current="page"' : ''}${href.startsWith('http') ? ' target="_blank" rel="noopener"' : ''}>${spans(k)}</a>`).join('')}</nav>
    <div class="nav-lang" role="group" aria-label="Language">${LANGS.map((l) => `<button type="button" data-set-lang="${l}" aria-pressed="false">${LANG_LABEL[l]}</button>`).join('')}</div>
    <button class="nav-menu" type="button" aria-expanded="false" aria-controls="nav" aria-label="Menu">${icon('menu')}</button>
  </div></header>`;
  if (navHost) navHost.outerHTML = navHTML; else document.body.insertAdjacentHTML('afterbegin', navHTML);
  document.body.classList.add('site-nav-fixed');
  const nav = document.getElementById('nav');
  nav.querySelector('.nav-menu').addEventListener('click', (e) => {
    const open = nav.classList.toggle('open');
    e.currentTarget.setAttribute('aria-expanded', String(open));
    e.currentTarget.innerHTML = icon(open ? 'close' : 'menu');
  });

  const footHost = document.getElementById('site-footer');
  if (footHost) {
    const li = (href, k, ext) => `<li><a href="${href}"${ext ? ' target="_blank" rel="noopener"' : ''}>${T[k] ? spans(k) : esc(k)}</a></li>`;
    footHost.outerHTML = `<footer class="footer"><div class="footer-inner">
      <div class="footer-cols">
        <div><h4>${spans('index')}</h4><ul>${li(ROOT + 'index.html#catalog', 'catalog')}${li(ROOT + 'presentations/index.html', 'presentations')}${li(ROOT + 'academy/index.html', 'academy')}${li(ROOT + 'blog/index.html', 'blog')}</ul></div>
        <div><h4>${spans('tools')}</h4><ul>${li(ROOT + 'kp-solar-pro.html', 'KP Solar Pro')}${li(ROOT + 'bill-scanner.html', 'Bill scanner')}${li('https://bustan-energy.com/admin/scan', 'Admin · scan', true)}${li('https://bustan-energy.com/admin', 'Bustan Admin', true)}</ul></div>
        <div><h4>${spans('company')}</h4><ul>${li('https://bustan-energy.com', 'site', true)}${li('mailto:kaniel@bustan-energy.com', 'kaniel@bustan-energy.com')}${li('tel:+66946692011', '+66 94 669 2011')}${li('https://www.facebook.com/share/189ywnsdS6/', 'Facebook', true)}</ul></div>
        <div><h4>${spans('language')}</h4><ul>${LANGS.map((l) => `<li><a href="#" data-set-lang="${l}">${l === 'en' ? 'English' : l === 'he' ? 'עברית' : 'ไทย'}</a></li>`).join('')}</ul></div>
      </div>
      <div class="footer-base"><span>© 2026 Bustan Energy Co., Ltd.</span><span>${spans('rights')}</span></div>
    </div></footer>`;
  }

  // ---------- language ----------
  function applyLang(l, persist = true) {
    if (!LANGS.includes(l)) l = 'en';
    lang = l;
    document.documentElement.lang = l;
    document.documentElement.dir = l === 'he' ? 'rtl' : 'ltr';
    document.querySelectorAll('[data-set-lang]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.setLang === l)));
    if (persist) { try { localStorage.setItem('bustan_lang', l); localStorage.setItem('bustan_academy_lang', l); } catch {} }
    // Academy pages keep their own body[data-lang] machinery — keep it in sync without recursion.
    if (document.body.dataset.lang !== undefined && typeof window.setLanguage === 'function' && document.body.dataset.lang !== l) window.setLanguage(l);
    const ttl = document.querySelector('title');
    if (ttl && ttl.dataset[l]) document.title = ttl.dataset[l];
    document.dispatchEvent(new CustomEvent('site:lang', { detail: l }));
  }
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-set-lang]'); if (!b) return;
    e.preventDefault(); applyLang(b.dataset.setLang);
  });
  document.addEventListener('academy:lang', (e) => { if (e.detail !== lang) applyLang(e.detail, false); });
  const qLang = new URLSearchParams(location.search).get('lang');
  let saved = null; try { saved = localStorage.getItem('bustan_lang') || localStorage.getItem('bustan_academy_lang'); } catch {}
  applyLang(qLang || saved || document.documentElement.lang || 'en', !!qLang);

  // ---------- reveal ----------
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const io = ('IntersectionObserver' in window && !reduce) ? new IntersectionObserver((es) => {
    es.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
  }, { threshold: 0.08, rootMargin: '0px 0px -6% 0px' }) : null;
  function observe(scope = document) {
    scope.querySelectorAll('.reveal:not(.in)').forEach((el) => { if (io) io.observe(el); else el.classList.add('in'); });
  }
  observe();
  // Hero content is in view on load — show it immediately, no waiting for the observer's first tick.
  document.querySelectorAll('.hero .reveal').forEach((el) => el.classList.add('in'));

  // ---------- deck theater (iframe + Fullscreen API) ----------
  let theater = null;
  function openTheater(url, title) {
    if (!theater) {
      theater = document.createElement('div'); theater.className = 'theater';
      theater.innerHTML = `<div class="theater-bar"><b></b><span class="muted small">Esc</span><button class="btn btn-sm" type="button" data-close>${icon('close')}<span>${esc(t(T.close))}</span></button></div><iframe title="deck" allow="fullscreen"></iframe>`;
      document.body.appendChild(theater);
      theater.querySelector('[data-close]').addEventListener('click', closeTheater);
      document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && theater.classList.contains('open')) closeTheater(); });
      document.addEventListener('fullscreenchange', () => { if (!document.fullscreenElement && theater.classList.contains('open')) closeTheater(); });
    }
    theater.querySelector('b').textContent = title || '';
    theater.querySelector('iframe').src = url;
    theater.classList.add('open');
    document.body.style.overflow = 'hidden';
    if (theater.requestFullscreen) theater.requestFullscreen().catch(() => {});
    theater.querySelector('iframe').focus();
  }
  function closeTheater() {
    if (!theater) return;
    theater.classList.remove('open'); theater.querySelector('iframe').src = 'about:blank';
    document.body.style.overflow = '';
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
  }
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-theater]'); if (!b) return;
    e.preventDefault(); openTheater(b.dataset.theater, b.dataset.title || b.getAttribute('aria-label') || '');
  });

  // ---------- catalog ----------
  const catalogHost = document.getElementById('catalog-groups');
  if (catalogHost) initCatalog(catalogHost);
  let catalogPromise = null;
  function loadCatalog(src) {
    if (!catalogPromise) catalogPromise = fetch(src || (ROOT + 'catalog.json?v=' + BRAND_VERSION)).then((r) => r.json());
    return catalogPromise;
  }
  const lists = document.querySelectorAll('[data-list]');
  if (lists.length) initLists(lists);

  // <div data-list="decks|playbooks|kind:xxx" data-cols="3"> — rendered from catalog.json
  async function initLists(hosts) {
    let data; try { data = await loadCatalog(); } catch { hosts.forEach((host) => { host.innerHTML = `<p>${esc(t(T.empty))}</p>`; }); return; }
    const render = () => hosts.forEach((host) => {
      const spec = host.dataset.list;
      let items = data.entries.filter((e) => spec === 'decks' ? e.kind === 'deck' && !e.hub : spec === 'playbooks' ? e.playbook : spec.startsWith('kind:') ? e.kind === spec.slice(5) : false);
      if (spec === 'playbooks') items = items.slice().sort((a, b) => (a.group + a.title).localeCompare(b.group + b.title));
      host.innerHTML = items.map((e) => cardHTML(e, spec !== 'decks')).join('');
      host.querySelectorAll('.reveal').forEach((el) => el.classList.remove('in'));
      observe(host);
    });
    render();
    document.addEventListener('site:lang', render);
  }

  function hrefFor(e) {
    if (e.external) return e.path;
    if (/\.md$/i.test(e.path)) return GH + e.path;
    return ROOT + e.path + ((e.kind === 'deck' || e.playbook) ? '?v=' + BRAND_VERSION : '');
  }
  function fmtDate(d) { return d || ''; }
  const tagsFor = (e) => `<div class="tags">${e.lang.map((l) => `<span class="tag tag-lang">${l}</span>`).join('')}<span class="tag">${esc(t(AUD[e.audience]))}</span>${e.group && e.group !== e.kind ? `<span class="tag">${esc(e.group)}</span>` : ''}${e.note ? `<span class="tag tag-warn">${esc(e.note)}</span>` : ''}</div>`;
  const dirAttr = (s) => /[֐-׿]/.test(s) ? ' dir="rtl"' : /[฀-๿]/.test(s) ? ' dir="ltr"' : ' dir="auto"';

  function rowHTML(e) {
    const href = hrefFor(e), ext = e.external || /\.md$/i.test(e.path);
    const ic = e.kind === 'podcast' ? 'podcast' : /\.(pdf|xlsx|csv)$/i.test(e.path) ? 'file' : e.hub ? 'globe' : KINDS[e.kind].icon;
    const audio = e.kind === 'podcast' && !e.external ? `<div class="row-audio"><audio controls preload="none" src="${esc(ROOT + e.path)}"></audio></div>` : '';
    return `<a class="row" href="${esc(href)}"${ext ? ' target="_blank" rel="noopener"' : ''}>
      ${icon(ic)}
      <div><div class="row-title"${dirAttr(e.title)}>${esc(e.title)}</div>${e.alt ? `<div class="row-sub"${dirAttr(e.alt)}>${esc(e.alt)}</div>` : ''}</div>
      ${tagsFor(e)}
      <div class="row-date">${fmtDate(e.updated)}</div>
      ${icon(ext ? 'ext' : 'arrow', 'i i-s row-go')}
      ${audio}
    </a>`;
  }
  function deckHTML(e, compact) { return cardHTML(e, compact); }
  function cardHTML(e, compact) {
    const href = hrefFor(e);
    const cover = e.cover ? `<div class="bustan-cover" aria-hidden="true"><img class="bustan-cover-photo" src="${esc(ROOT + e.cover)}" alt="" loading="lazy" width="640" height="360"><div class="bustan-cover-panel"><img class="bustan-cover-logo" src="${ROOT}assets/bustan-energy-logo.png" alt="" width="188" height="84"><span class="bustan-cover-label">${esc(e.kind === 'deck' ? t(T.presentations) : e.group)}</span><span class="bustan-cover-place">KOH PHANGAN<br>THAILAND</span></div></div>` : '';
    const thumb = cover || (e.thumb ? `<img src="${esc(ROOT + e.thumb)}" alt="" loading="lazy" width="640" height="360">` : '');
    return `<div class="card deck-card">
      <a class="deck-thumb" href="${esc(href)}"${e.external ? ' target="_blank" rel="noopener"' : ''} aria-label="${esc(e.title)}">${thumb}</a>
      <div class="deck-body">
        <h3 class="card-title"${dirAttr(e.title)}>${esc(e.title)}</h3>
        ${e.alt ? `<p class="card-sub"${dirAttr(e.alt)}>${esc(e.alt)}</p>` : ''}
        <div class="tags" style="margin-top:14px">${e.lang.map((l) => `<span class="tag tag-lang">${l}</span>`).join('')}<span class="tag">${esc(t(AUD[e.audience]))}</span>${compact && e.group ? `<span class="tag">${esc(e.group)}</span>` : ''}${e.note ? `<span class="tag tag-warn">${esc(e.note)}</span>` : ''}</div>
        <div class="deck-actions">
          <a class="btn btn-sm" href="${esc(href)}"${e.external ? ' target="_blank" rel="noopener"' : ''}>${icon(e.external ? 'ext' : 'arrow')}<span>${esc(t(T.open))}</span></a>
          ${e.external ? '' : `<button class="btn btn-sm" type="button" data-theater="${esc(href)}" data-title="${esc(e.title)}">${icon('full')}<span>${esc(t(T.fullscreen))}</span></button>`}
        </div>
      </div>
    </div>`;
  }


  async function initCatalog(host) {
    const src = host.dataset.src || (ROOT + 'catalog.json?v=' + BRAND_VERSION);
    let data;
    try { data = await (await fetch(src)).json(); }
    catch { host.innerHTML = `<p class="empty">catalog.json could not be loaded.</p>`; return; }
    const all = data.entries;
    const state = { q: '', kind: '', audience: '', lang: '' };
    const toolbar = document.getElementById('catalog-toolbar');
    const KIND_ORDER = Object.keys(KINDS);

    // index for search: title + alt + group + kind label (3 langs) + lang codes + audience + path
    const norm = (s) => String(s || '').toLowerCase().normalize('NFKD');
    for (const e of all) {
      e._hay = norm([e.title, e.alt, e.group, e.kind, ...LANGS.map((l) => KINDS[e.kind]?.[l]), ...LANGS.map((l) => AUD[e.audience]?.[l]), e.lang.join(' '), e.audience, e.path.replace(/[-_/.]/g, ' ')].join(' '));
    }

    function renderToolbar() {
      if (!toolbar) return;
      const chip = (grp, val, label) => `<button class="chip" type="button" data-f="${grp}" data-v="${val}" aria-pressed="${state[grp] === val}">${esc(label)}</button>`;
      toolbar.innerHTML = `<div class="toolbar-inner">
        <label class="search">${icon('search')}<input id="catalog-q" type="search" placeholder="${esc(t(T.search))}" value="${esc(state.q)}" autocomplete="off" spellcheck="false" aria-label="${esc(t(T.search))}"><kbd>/</kbd></label>
        <div class="chips" aria-label="${esc(t(T.kind))}"><span class="chips-label">${esc(t(T.kind))}</span>${KIND_ORDER.map((k) => chip('kind', k, t(KINDS[k]))).join('')}</div>
        <div class="chips" aria-label="${esc(t(T.audience))}"><span class="chips-label">${esc(t(T.audience))}</span>${Object.keys(AUD).map((a) => chip('audience', a, t(AUD[a]))).join('')}</div>
        <div class="chips" aria-label="${esc(t(T.lang))}"><span class="chips-label">${esc(t(T.lang))}</span>${LANGS.map((l) => chip('lang', l, LANG_LABEL[l])).join('')}${(state.kind || state.audience || state.lang || state.q) ? `<button class="chip chip-clear" type="button" data-clear>${esc(t(T.clear))}</button>` : ''}</div>
        <div class="count" id="catalog-count"></div>
      </div>`;
      const q = toolbar.querySelector('#catalog-q');
      q.addEventListener('input', () => { state.q = q.value; renderGroups(); });
      toolbar.querySelectorAll('.chip[data-f]').forEach((c) => c.addEventListener('click', () => {
        state[c.dataset.f] = state[c.dataset.f] === c.dataset.v ? '' : c.dataset.v;
        renderToolbar(); renderGroups();
      }));
      const clr = toolbar.querySelector('[data-clear]');
      if (clr) clr.addEventListener('click', () => { state.q = state.kind = state.audience = state.lang = ''; renderToolbar(); renderGroups(); });
      measureToolbar();
    }

    function matches(e) {
      if (state.kind && e.kind !== state.kind) return false;
      if (state.audience && e.audience !== state.audience) return false;
      if (state.lang && !e.lang.includes(state.lang)) return false;
      if (state.q) { const words = norm(state.q).split(/\s+/).filter(Boolean); if (!words.every((w) => e._hay.includes(w))) return false; }
      return true;
    }

    function renderGroups() {
      let shown = 0;
      const html = KIND_ORDER.map((k) => {
        const items = all.filter((e) => e.kind === k && matches(e));
        if (!items.length) return '';
        shown += items.length;
        const K = KINDS[k];
        const body = k === 'deck'
          ? `<div class="cat-grid">${items.filter((e) => !e.hub).map(deckHTML).join('')}</div>${items.filter((e) => e.hub).map(rowHTML).join('')}`
          : items.map(rowHTML).join('');
        return `<section class="cat-group" id="g-${k}">
          <div class="cat-head"><div class="cat-head-inner"><h2>${icon(K.icon)}${esc(t(K))}</h2><span class="n">${items.length}</span><span class="desc">${esc(t(K.desc))}</span></div></div>
          <div class="cat-list">${body}</div>
        </section>`;
      }).join('');
      host.innerHTML = html || `<p class="empty">${esc(t(T.empty))}</p>`;
      observe(host);
      const c = document.getElementById('catalog-count');
      if (c) c.innerHTML = `${esc(t(T.showing))} <b>${shown}</b> ${esc(t(T.of))} ${all.length}`;
      document.querySelectorAll('[data-catalog-count]').forEach((el) => { el.textContent = all.length; });
    }

    function measureToolbar() {
      if (!toolbar) return;
      document.documentElement.style.setProperty('--toolbar-h', toolbar.offsetHeight + 'px');
    }
    addEventListener('resize', measureToolbar, { passive: true });
    document.addEventListener('keydown', (e) => {
      if (e.key === '/' && !/input|textarea/i.test(document.activeElement?.tagName || '')) { e.preventDefault(); document.getElementById('catalog-q')?.focus(); }
    });
    document.addEventListener('site:lang', () => { renderToolbar(); renderGroups(); });

    renderToolbar(); renderGroups();
    if (location.hash && document.querySelector(location.hash)) setTimeout(() => document.querySelector(location.hash).scrollIntoView(), 50);
  }

  // expose for pages that render their own lists
  window.BustanSite = { t, T, KINDS, AUD, icon, esc, applyLang, observe, openTheater, get lang() { return lang; }, ROOT, hrefFor };
})();
