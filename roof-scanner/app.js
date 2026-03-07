// ============================================================
// Ko Phangan Solar — Roof Scanner Pro v2
// ============================================================

// --- Constants ---
const PRIORITY_COLORS = { A: '#E8A820', B: '#2ED89A', C: '#6496FF', D: '#666' };
const CATEGORY_LABELS = {
  hospitality: '🏨 מלון/ריזורט', food_beverage: '🍽️ מסעדה/בר', retail: '🛒 חנות',
  residential: '🏠 מגורים', bungalow: '🛖 בנגלו', commercial: '🏢 מסחרי',
  healthcare: '🏥 רפואי', education: '🏫 חינוך', temple: '⛩️ מקדש'
};
const CENTER = [100.00, 9.73];
// Cost per kWp in thousands of THB (equipment + installation)
const COST_PER_KWP_K = 11.8;

// --- State ---
let map, selId = null;
let fPri = 'all', fCat = null, fSz = null, fSp = null, fPip = false;
let heatOn = false, polyOn = false, clusterOn = false;
let listLimit = 100;
let sortBy = 'score'; // score | area | kwp | name
let compareSet = new Set();
let searchTimeout = null;

// --- localStorage helpers ---
function getNotes(id) {
  try { return JSON.parse(localStorage.getItem('scanner_notes') || '{}')[id] || ''; } catch { return ''; }
}
function setNote(id, text) {
  try {
    const notes = JSON.parse(localStorage.getItem('scanner_notes') || '{}');
    if (text.trim()) notes[id] = text; else delete notes[id];
    localStorage.setItem('scanner_notes', JSON.stringify(notes));
  } catch {}
}
function getPipelineLocal() {
  try { return new Set(JSON.parse(localStorage.getItem('scanner_pipeline') || '[]')); } catch { return new Set(); }
}
function savePipelineLocal(set) {
  try { localStorage.setItem('scanner_pipeline', JSON.stringify([...set])); } catch {}
}

// Merge localStorage pipeline into data on load
function mergePipeline() {
  const local = getPipelineLocal();
  if (local.size === 0) return;
  B.forEach(b => { if (local.has(b.i)) b.pip = 1; });
}

// --- URL State ---
function readUrlState() {
  const hash = window.location.hash.slice(1);
  if (!hash) return;
  const params = new URLSearchParams(hash);
  if (params.get('b')) {
    const id = parseInt(params.get('b'));
    if (B.find(x => x.i === id)) setTimeout(() => selectBuilding(id), 500);
  }
  if (params.get('pri')) fPri = params.get('pri');
  if (params.get('cat')) fCat = params.get('cat');
  if (params.get('sz')) fSz = params.get('sz');
}
function updateUrlState() {
  const parts = [];
  if (selId) parts.push(`b=${selId}`);
  if (fPri !== 'all') parts.push(`pri=${fPri}`);
  if (fCat) parts.push(`cat=${fCat}`);
  if (fSz) parts.push(`sz=${fSz}`);
  history.replaceState(null, '', parts.length ? '#' + parts.join('&') : window.location.pathname);
}

// --- Debounce ---
function debounce(fn, ms) {
  let timer;
  return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), ms); };
}

// --- Map Init ---
function initMap() {
  try {
    map = new maplibregl.Map({
      container: 'map',
      style: {
        version: 8,
        glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
        sources: {
          sat: { type: 'raster', tiles: ['https://mt0.google.com/vt/lyrs=s&hl=en&x={x}&y={y}&z={z}'], tileSize: 256, maxzoom: 22, attribution: 'Google' },
          str: { type: 'raster', tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'], tileSize: 256, maxzoom: 19 }
        },
        layers: [
          { id: 'satellite', type: 'raster', source: 'sat' },
          { id: 'streets', type: 'raster', source: 'str', layout: { visibility: 'none' } }
        ]
      },
      center: CENTER, zoom: 13, maxZoom: 22,
      maxBounds: [[99.7, 9.55], [100.2, 9.95]],
      fadeDuration: 0
    });

    map.on('load', onMapLoad);
    map.on('error', (e) => {
      console.error('Map error:', e);
      showMapError();
    });
  } catch (e) {
    console.error('Map init failed:', e);
    showMapError();
  }
}

function showMapError() {
  document.querySelector('.map-error').classList.add('show');
}

function retryMap() {
  document.querySelector('.map-error').classList.remove('show');
  initMap();
}

function onMapLoad() {
  const pts = B.map(b => ({
    type: 'Feature',
    geometry: { type: 'Point', coordinates: [b.lo, b.la] },
    properties: { i: b.i, pr: b.pr, s: b.s, a: b.a, pip: b.pip, n: b.n, c: b.c }
  }));

  map.addSource('pts', { type: 'geojson', data: { type: 'FeatureCollection', features: pts } });

  const polys = B.filter(b => b.poly && b.poly.length > 2).map(b => ({
    type: 'Feature',
    geometry: { type: 'Polygon', coordinates: [b.poly.concat([b.poly[0]])] },
    properties: { i: b.i, pr: b.pr, pip: b.pip }
  }));
  map.addSource('polys', { type: 'geojson', data: { type: 'FeatureCollection', features: polys } });

  map.addSource('clusters', {
    type: 'geojson', data: { type: 'FeatureCollection', features: pts },
    cluster: true, clusterMaxZoom: 14, clusterRadius: 60,
    clusterProperties: { totalKw: ['+', ['get', 'a']], countA: ['+', ['case', ['==', ['get', 'pr'], 'A'], 1, 0]] }
  });

  // Polygon layers
  map.addLayer({ id: 'poly-fill', type: 'fill', source: 'polys', layout: { visibility: 'none' },
    paint: { 'fill-color': ['match', ['get', 'pr'], 'A', '#E8A820', 'B', '#2ED89A', 'C', '#6496FF', '#666'], 'fill-opacity': 0.3 } });
  map.addLayer({ id: 'poly-line', type: 'line', source: 'polys', layout: { visibility: 'none' },
    paint: { 'line-color': ['match', ['get', 'pr'], 'A', '#E8A820', 'B', '#2ED89A', 'C', '#6496FF', '#666'], 'line-width': 1.5, 'line-opacity': 0.7 } });

  // Pipeline ring
  map.addLayer({ id: 'pip-ring', type: 'circle', source: 'pts', filter: ['==', ['get', 'pip'], 1],
    paint: { 'circle-radius': ['interpolate', ['linear'], ['zoom'], 10, 5, 14, 10, 17, 16],
      'circle-color': 'transparent', 'circle-stroke-width': 2.5, 'circle-stroke-color': '#2ED89A', 'circle-opacity': 0 } });

  // Main circles
  map.addLayer({ id: 'bldg', type: 'circle', source: 'pts',
    paint: { 'circle-radius': ['interpolate', ['linear'], ['zoom'], 10, 2, 14, 5, 17, 9],
      'circle-color': ['match', ['get', 'pr'], 'A', '#E8A820', 'B', '#2ED89A', 'C', '#6496FF', '#666'],
      'circle-opacity': 0.85, 'circle-stroke-width': 0.5, 'circle-stroke-color': 'rgba(255,255,255,0.2)' } });

  // Heatmap
  map.addLayer({ id: 'heat', type: 'heatmap', source: 'pts', layout: { visibility: 'none' },
    paint: { 'heatmap-weight': ['interpolate', ['linear'], ['get', 's'], 0, 0, 100, 1],
      'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 10, 1, 15, 3],
      'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 10, 15, 15, 30],
      'heatmap-color': ['interpolate', ['linear'], ['heatmap-density'], 0, 'rgba(0,0,0,0)', 0.2, '#1A7A5A', 0.4, '#2ED89A', 0.6, '#E8A820', 0.8, '#E85D3A', 1, '#FF2222'],
      'heatmap-opacity': 0.7 } });

  // Clusters
  map.addLayer({ id: 'cl-circle', type: 'circle', source: 'clusters', filter: ['has', 'point_count'], layout: { visibility: 'none' },
    paint: { 'circle-color': ['step', ['get', 'point_count'], '#2ED89A', 20, '#E8A820', 50, '#E85D3A'],
      'circle-radius': ['step', ['get', 'point_count'], 18, 20, 24, 50, 32], 'circle-opacity': 0.9 } });
  map.addLayer({ id: 'cl-text', type: 'symbol', source: 'clusters', filter: ['has', 'point_count'], layout: { visibility: 'none',
    'text-field': '{point_count_abbreviated}', 'text-font': ['Open Sans Regular'], 'text-size': 12 },
    paint: { 'text-color': '#fff' } });

  map.on('click', 'bldg', e => { if (e.features.length) selectBuilding(e.features[0].properties.i); });
  map.on('click', 'cl-circle', e => { map.easeTo({ center: e.lngLat, zoom: map.getZoom() + 2 }); });
  map.on('mouseenter', 'bldg', () => map.getCanvas().style.cursor = 'pointer');
  map.on('mouseleave', 'bldg', () => map.getCanvas().style.cursor = '');

  // Hide loading
  document.querySelector('.loading-overlay').classList.add('hide');
  setTimeout(() => document.querySelector('.loading-overlay').remove(), 500);

  // Show keyboard hint briefly
  const hint = document.querySelector('.kbd-hint');
  if (hint) { hint.classList.add('show'); setTimeout(() => hint.classList.remove('show'), 4000); }

  mergePipeline();
  readUrlState();
  renderList();
  renderAnalytics();
}

// --- Filtering ---
function getFiltered() {
  let f = B;
  if (fPri !== 'all') f = f.filter(b => b.pr === fPri);
  if (fCat) f = f.filter(b => b.c === fCat);
  if (fSz) f = f.filter(b => b.a >= parseInt(fSz));
  if (fSp === 'phone') f = f.filter(b => b.ph);
  if (fSp === 'email') f = f.filter(b => b.em);
  if (fSp === 'pipeline' || fPip) f = f.filter(b => b.pip);
  const q = document.getElementById('search').value.toLowerCase().trim();
  if (q) f = f.filter(b =>
    (b.n || '').toLowerCase().includes(q) ||
    (b.c || '').includes(q) ||
    (b.ph || '').includes(q) ||
    (b.nth || '').toLowerCase().includes(q)
  );
  // Sort
  f = sortFiltered(f);
  return f;
}

function sortFiltered(f) {
  const copy = [...f];
  switch (sortBy) {
    case 'area': return copy.sort((a, b) => b.a - a.a);
    case 'kwp': return copy.sort((a, b) => b.kw - a.kw);
    case 'name': return copy.sort((a, b) => (a.n || '').localeCompare(b.n || ''));
    case 'savings': return copy.sort((a, b) => b.sav - a.sav);
    case 'score':
    default: return copy.sort((a, b) => b.s - a.s);
  }
}

function updateMapFilter() {
  const f = getFiltered();
  const ids = new Set(f.map(b => b.i));
  const fltr = ['in', ['get', 'i'], ['literal', [...ids]]];
  ['bldg', 'heat', 'pip-ring', 'poly-fill', 'poly-line'].forEach(l => {
    if (map.getLayer(l)) map.setFilter(l, fltr);
  });
  document.getElementById('s-total').textContent = f.length.toLocaleString();
  document.getElementById('s-kwp').textContent = (f.reduce((s, b) => s + b.kw, 0) / 1000).toFixed(1);
  document.getElementById('s-named').textContent = f.filter(b => b.n).length.toLocaleString();
  document.getElementById('s-a').textContent = f.filter(b => b.pr === 'A').length.toLocaleString();
  document.getElementById('s-pip').textContent = f.filter(b => b.pip).length;
}

// --- List Rendering ---
function renderList() {
  listLimit = 100;
  renderListInner();
  updateUrlState();
}

function renderListInner() {
  const f = getFiltered();
  const el = document.getElementById('buildingList');
  const show = f.slice(0, listLimit);
  const inCompare = compareSet.size > 0;

  el.innerHTML = show.map(b => `
    <div class="bc${selId === b.i ? ' sel' : ''}${b.pip ? ' pipeline' : ''}" onclick="selectBuilding(${b.i})" data-id="${b.i}">
      <div class="bc-top">
        <div class="bc-name">${escHtml(b.n || CATEGORY_LABELS[b.c] || b.c)}</div>
        <span class="badge p${b.pr.toLowerCase()}">${b.pr}·${b.s}</span>
        ${inCompare ? `<input type="checkbox" ${compareSet.has(b.i) ? 'checked' : ''} onclick="event.stopPropagation();toggleCompare(${b.i})" style="margin-right:4px;cursor:pointer">` : ''}
      </div>
      <div class="bc-row">
        <span>📐${b.a.toLocaleString()}m²</span>
        <span>⚡${b.kw.toFixed(1)}kWp</span>
        <span>🔢${b.p}</span>
        ${b.ph ? '<span>📞</span>' : ''}${b.em ? '<span>✉️</span>' : ''}${b.w ? '<span>🌐</span>' : ''}
      </div>
      ${b.pip ? '<span class="bc-pip">🟢 Pipeline</span>' : ''}<span class="bc-tag">${CATEGORY_LABELS[b.c] || b.c}</span>
    </div>`).join('') +
    (f.length > listLimit ? `<div class="load-more" onclick="loadMore()">+ ${(f.length - listLimit).toLocaleString()} עוד — לחץ לטעינה</div>` : '');

  updateMapFilter();
}

function loadMore() {
  listLimit += 100;
  renderListInner();
}

// --- HTML escaping ---
function escHtml(s) {
  if (!s) return '';
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// --- CSV escaping ---
function escCsv(val) {
  if (val == null) return '';
  const s = String(val);
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

// --- Building Selection ---
function selectBuilding(id) {
  selId = id;
  const b = B.find(x => x.i === id);
  if (!b) return;
  map.flyTo({ center: [b.lo, b.la], zoom: 17, duration: 600 });
  if (polyOn) {
    map.setLayoutProperty('poly-fill', 'visibility', 'visible');
    map.setLayoutProperty('poly-line', 'visibility', 'visible');
  }

  const waMsg = encodeURIComponent(
    `Hello! I'm from Ko Phangan Solar / สวัสดีครับ! เราจาก Ko Phangan Solar.\n\n` +
    `We noticed ${b.n || 'your building'} could benefit from a ${b.kw.toFixed(0)}kWp solar system ` +
    `that would save approximately ฿${b.sav.toLocaleString()}/month on electricity.\n\n` +
    `Would you be interested in a free consultation? / สนใจปรึกษาฟรีไหมครับ?`
  );

  const noteText = getNotes(b.i);

  document.getElementById('detailContent').innerHTML = `
    <div class="dp-head">
      <h2>${escHtml(b.n || CATEGORY_LABELS[b.c] || 'מבנה')} <span class="badge p${b.pr.toLowerCase()}" style="font-size:10px">${b.pr}·${b.s}</span>${b.pip ? '<span class="bc-pip" style="font-size:9px;margin-right:6px">🟢 Pipeline</span>' : ''}</h2>
      <button class="dp-close" onclick="closeDetail()">✕</button>
    </div>
    <div class="dp-meta">
      ${CATEGORY_LABELS[b.c] || b.c}${b.nth ? ' · ' + escHtml(b.nth) : ''}${b.cu ? ' · ' + escHtml(b.cu) : ''}${b.st ? ' · ' + b.st + '⭐' : ''}${b.rm ? ' · ' + b.rm + ' חדרים' : ''}
      ${b.ph ? ' · 📞 <a href="tel:' + b.ph + '">' + escHtml(b.ph) + '</a>' : ''}
      ${b.w ? ' · 🌐 <a href="' + escHtml(b.w) + '" target="_blank">Website</a>' : ''}
      ${b.em ? ' · ✉️ ' + escHtml(b.em) : ''}
      ${b.hr ? ' · 🕐 ' + escHtml(b.hr) : ''}
      ${b.fb ? ' · <a href="https://facebook.com/' + escHtml(b.fb) + '" target="_blank">FB</a>' : ''}
      ${b.ig ? ' · <a href="https://instagram.com/' + escHtml(b.ig) + '" target="_blank">IG</a>' : ''}
    </div>
    <div class="dp-grid">
      <div class="dg"><div class="dg-v" style="color:var(--gold)">${b.a.toLocaleString()}</div><div class="dg-l">שטח גג m²</div></div>
      <div class="dg"><div class="dg-v" style="color:var(--gold)">${b.u.toLocaleString()}</div><div class="dg-l">שמיש m²</div></div>
      <div class="dg"><div class="dg-v" style="color:#2ED89A">${b.kw.toFixed(1)}</div><div class="dg-l">kWp</div></div>
      <div class="dg"><div class="dg-v" style="color:#2ED89A">${b.p}</div><div class="dg-l">פאנלים</div></div>
      <div class="dg"><div class="dg-v" style="color:#6496FF">${(b.kwh / 1000).toFixed(1)}K</div><div class="dg-l">kWh/שנה</div></div>
      <div class="dg"><div class="dg-v" style="color:var(--coral)">${b.ppap}</div><div class="dg-l">החזר PPA</div></div>
    </div>
    <div class="dp-cols">
      <div class="dp-col">
        <h4>EPC — מכירה ללקוח</h4>
        <table class="dt">
          <tr><td>מחיר</td><td>฿${(b.epc / 1000).toFixed(0)}K</td></tr>
          <tr><td>עלות (${COST_PER_KWP_K}K/kWp)</td><td>฿${(b.kw * COST_PER_KWP_K).toFixed(0)}K</td></tr>
          <tr><td>רווח</td><td style="color:#2ED89A">฿${(b.ep / 1000).toFixed(0)}K</td></tr>
          <tr><td>חיסכון/חודש</td><td style="color:var(--gold)">฿${b.sav.toLocaleString()}</td></tr>
        </table>
      </div>
      <div class="dp-col">
        <h4>PPA — מכירת חשמל</h4>
        <table class="dt">
          <tr><td>השקעה</td><td>฿${(b.ppai / 1000).toFixed(0)}K</td></tr>
          <tr><td>הכנסה/שנה</td><td style="color:#2ED89A">฿${(b.ppar / 1000).toFixed(0)}K</td></tr>
          <tr><td>MRR</td><td style="color:var(--gold)">฿${(b.ppar / 12000).toFixed(1)}K</td></tr>
          <tr><td>רווח 25 שנה</td><td style="color:#2ED89A">฿${((b.ppar * 25 - b.ppai) / 1e6).toFixed(1)}M</td></tr>
        </table>
      </div>
    </div>
    <div class="dp-actions">
      <a class="act-map" href="https://www.google.com/maps/@${b.la},${b.lo},19z" target="_blank">📍 Maps</a>
      <a class="act-sat" href="https://www.google.com/maps/@${b.la},${b.lo},60m/data=!3m1!1e3" target="_blank">🛰️ Satellite</a>
      ${b.ph ? `<a class="act-wa" href="https://wa.me/${b.ph.replace(/[^0-9+]/g, '')}?text=${waMsg}" target="_blank">💬 WhatsApp</a><a class="act-call" href="tel:${b.ph}">📞 Call</a>` : ''}
      <button class="act-pdf" onclick="genPDF(${b.i})">📄 PDF Proposal</button>
      <button class="act-pip" onclick="toggleBuildingPipeline(${b.i})">${b.pip ? '🔴 הסר מ-Pipeline' : '🟢 הוסף ל-Pipeline'}</button>
    </div>
    <div class="dp-notes">
      <label>📝 הערות (נשמר מקומית)</label>
      <textarea id="noteArea" placeholder="הוסף הערות על המבנה...">${escHtml(noteText)}</textarea>
      <div class="note-saved" id="noteSaved">✓ נשמר</div>
    </div>
    <div class="dp-note">* חישובי PPA: 4.5 שעות שמש, ฿4.5/kWh, 70% ניצולת גג. כפוף לסקר שטח.</div>`;

  document.getElementById('detailPanel').classList.add('show');
  document.querySelectorAll('.bc').forEach(c => c.classList.remove('sel'));
  const card = document.querySelector(`.bc[data-id="${id}"]`);
  if (card) { card.classList.add('sel'); card.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }

  // Note auto-save
  const noteArea = document.getElementById('noteArea');
  if (noteArea) {
    noteArea.addEventListener('input', debounce(() => {
      setNote(b.i, noteArea.value);
      const saved = document.getElementById('noteSaved');
      if (saved) { saved.classList.add('show'); setTimeout(() => saved.classList.remove('show'), 1500); }
    }, 500));
  }

  updateUrlState();
}

function closeDetail() {
  document.getElementById('detailPanel').classList.remove('show');
  selId = null;
  updateUrlState();
}

function resetView() {
  map.flyTo({ center: CENTER, zoom: 13, duration: 600 });
  closeDetail();
}

// --- Pipeline Toggle ---
function toggleBuildingPipeline(id) {
  const b = B.find(x => x.i === id);
  if (!b) return;
  b.pip = b.pip ? 0 : 1;
  const local = getPipelineLocal();
  if (b.pip) local.add(id); else local.delete(id);
  savePipelineLocal(local);
  // Re-render
  selectBuilding(id);
  renderList();
  renderAnalytics();
}

// --- Map Style ---
function setStyle(s, el) {
  document.querySelectorAll('.htb').forEach(b => {
    if (b.textContent.includes('🛰️') || b.textContent.includes('🗺️')) b.classList.remove('on');
  });
  if (el) el.classList.add('on');
  map.setLayoutProperty('satellite', 'visibility', s === 'sat' ? 'visible' : 'none');
  map.setLayoutProperty('streets', 'visibility', s === 'str' ? 'visible' : 'none');
}

function toggleHeat(el) {
  heatOn = !heatOn;
  if (el) el.classList.toggle('on', heatOn);
  map.setLayoutProperty('heat', 'visibility', heatOn ? 'visible' : 'none');
  map.setLayoutProperty('bldg', 'visibility', heatOn ? 'none' : 'visible');
}

function togglePolygons(el) {
  polyOn = !polyOn;
  if (el) el.classList.toggle('on', polyOn);
  map.setLayoutProperty('poly-fill', 'visibility', polyOn ? 'visible' : 'none');
  map.setLayoutProperty('poly-line', 'visibility', polyOn ? 'visible' : 'none');
}

function toggleClusters(el) {
  clusterOn = !clusterOn;
  if (el) el.classList.toggle('on', clusterOn);
  map.setLayoutProperty('cl-circle', 'visibility', clusterOn ? 'visible' : 'none');
  map.setLayoutProperty('cl-text', 'visibility', clusterOn ? 'visible' : 'none');
  map.setLayoutProperty('bldg', 'visibility', clusterOn ? 'none' : 'visible');
}

// --- Filter Management (supports multi-filter) ---
function setFilter(p) {
  fPri = p;
  document.querySelectorAll('.fbtn[data-f]').forEach(b => b.classList.remove('on'));
  document.querySelector(`.fbtn[data-f="${p}"]`)?.classList.add('on');
  // Don't reset category/size when changing priority (multi-filter)
  renderList();
}

function togglePipeline() {
  fPip = !fPip;
  document.querySelector('.fbtn[data-sp="pipeline"]')?.classList.toggle('on', fPip);
  renderList();
}

function setupFilters() {
  document.querySelectorAll('.fbtn').forEach(btn => {
    btn.addEventListener('click', () => {
      const f = btn.dataset.f, c = btn.dataset.cat, s = btn.dataset.sz, sp = btn.dataset.sp;
      if (f) {
        fPri = f;
        document.querySelectorAll('.fbtn[data-f]').forEach(b => b.classList.remove('on'));
        btn.classList.add('on');
      } else if (c) {
        fCat = fCat === c ? null : c;
        document.querySelectorAll('.fbtn[data-cat]').forEach(b => b.classList.remove('on'));
        if (fCat) btn.classList.add('on');
      } else if (s) {
        fSz = fSz === s ? null : s;
        document.querySelectorAll('.fbtn[data-sz]').forEach(b => b.classList.remove('on'));
        if (fSz) btn.classList.add('on');
      } else if (sp) {
        if (sp === 'pipeline') {
          fPip = !fPip;
          btn.classList.toggle('on', fPip);
        } else {
          fSp = fSp === sp ? null : sp;
          document.querySelectorAll('.fbtn[data-sp]:not([data-sp="pipeline"])').forEach(b => b.classList.remove('on'));
          if (fSp) btn.classList.add('on');
        }
      }
      renderList();
    });
  });
}

// --- Sort ---
function setupSort() {
  const sel = document.getElementById('sortSelect');
  if (sel) {
    sel.addEventListener('change', () => {
      sortBy = sel.value;
      renderList();
    });
  }
}

// --- Tabs ---
function showTab(tab, el) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('on'));
  el.classList.add('on');
  document.getElementById('buildingList').style.display = tab === 'list' ? 'block' : 'none';
  document.getElementById('filtersRow').style.display = tab === 'list' ? 'flex' : 'none';
  document.querySelector('.search-box').style.display = tab === 'list' ? 'block' : 'none';
  document.querySelector('.sort-row').style.display = tab === 'list' ? 'flex' : 'none';
  document.getElementById('analyticsPanel').classList.toggle('show', tab === 'analytics');
}

// --- Analytics ---
function renderAnalytics() {
  const el = document.getElementById('analyticsPanel');
  const byCat = {};
  B.forEach(b => { byCat[b.c] = (byCat[b.c] || 0) + 1; });
  const catEntries = Object.entries(byCat).sort((a, b) => b[1] - a[1]);
  const maxCat = catEntries[0] ? catEntries[0][1] : 1;
  const byPri = { A: 0, B: 0, C: 0, D: 0 };
  B.forEach(b => byPri[b.pr]++);
  const totalEpc = B.reduce((s, b) => s + b.epc, 0);
  const totalPpaRev = B.reduce((s, b) => s + b.ppar, 0);
  const topAreas = B.slice().sort((a, b) => b.a - a.a).slice(0, 10);

  el.innerHTML = `
    <h3>סיכום כללי</h3>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-bottom:10px">
      <div class="dg"><div class="dg-v" style="color:var(--gold)">${B.length}</div><div class="dg-l">מבנים</div></div>
      <div class="dg"><div class="dg-v" style="color:#2ED89A">${(B.reduce((s, b) => s + b.kw, 0) / 1000).toFixed(1)}</div><div class="dg-l">MWp</div></div>
      <div class="dg"><div class="dg-v" style="color:#6496FF">${B.reduce((s, b) => s + b.p, 0).toLocaleString()}</div><div class="dg-l">פאנלים</div></div>
    </div>
    <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:6px;margin-bottom:10px">
      <div class="dg"><div class="dg-v" style="color:var(--gold)">฿${(totalEpc / 1e9).toFixed(2)}B</div><div class="dg-l">שווי EPC כולל</div></div>
      <div class="dg"><div class="dg-v" style="color:#2ED89A">฿${(totalPpaRev / 1e6).toFixed(0)}M</div><div class="dg-l">PPA שנתי</div></div>
    </div>
    <h3>לפי עדיפות</h3>
    ${['A', 'B', 'C', 'D'].map(p => `<div class="chart-bar">
      <div class="chart-bar-lbl">${p} (${byPri[p]})</div>
      <div class="chart-bar-fill" style="width:${byPri[p] / B.length * 200}px;background:${PRIORITY_COLORS[p]}"></div>
      <div class="chart-bar-val">${(byPri[p] / B.length * 100).toFixed(0)}%</div>
    </div>`).join('')}
    <h3>לפי קטגוריה</h3>
    ${catEntries.map(([c, n]) => `<div class="chart-bar">
      <div class="chart-bar-lbl">${CATEGORY_LABELS[c] || c}</div>
      <div class="chart-bar-fill" style="width:${n / maxCat * 180}px;background:var(--gold)"></div>
      <div class="chart-bar-val">${n}</div>
    </div>`).join('')}
    <h3>Pipeline</h3>
    <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:6px;margin-bottom:10px">
      <div class="dg"><div class="dg-v" style="color:var(--reef)">${B.filter(b => b.pip).length}</div><div class="dg-l">לידים</div></div>
      <div class="dg"><div class="dg-v" style="color:var(--gold)">฿${(B.filter(b => b.pip).reduce((s, b) => s + b.epc, 0) / 1e6).toFixed(0)}M</div><div class="dg-l">שווי EPC</div></div>
    </div>
    <h3>🏆 Top 10 גגות</h3>
    ${topAreas.map((b, i) => `<div class="chart-bar">
      <div class="chart-bar-lbl">${i + 1}. ${escHtml(b.n || b.c)}</div>
      <div class="chart-bar-fill" style="width:${b.a / topAreas[0].a * 150}px;background:${PRIORITY_COLORS[b.pr]}"></div>
      <div class="chart-bar-val">${b.a.toLocaleString()}m²</div>
    </div>`).join('')}
    <h3>נתוני קשר</h3>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px">
      <div class="dg"><div class="dg-v" style="color:var(--gold)">${B.filter(b => b.ph).length}</div><div class="dg-l">📞 טלפון</div></div>
      <div class="dg"><div class="dg-v" style="color:#2ED89A">${B.filter(b => b.w).length}</div><div class="dg-l">🌐 אתר</div></div>
      <div class="dg"><div class="dg-v" style="color:#6496FF">${B.filter(b => b.em).length}</div><div class="dg-l">✉️ מייל</div></div>
    </div>`;
}

// --- PDF (pass building ID, not polygon data) ---
function genPDF(id) {
  const b = B.find(x => x.i === id);
  if (!b) return;
  const p = new URLSearchParams({
    id: b.i, n: b.n || '', a: b.a, u: b.u, kw: b.kw, p: b.p, kwh: b.kwh,
    epc: b.epc, sav: b.sav, ph: b.ph || '', la: b.la, lo: b.lo
  });
  window.open('proposal.html?' + p.toString(), '_blank');
}

// --- Exports ---
function exportCSV() {
  const f = getFiltered();
  const h = 'Name,Name_TH,Category,Priority,Score,Pipeline,Area_m2,kWp,Panels,Annual_kWh,Monthly_Savings,EPC_Price,EPC_Profit,PPA_Invest,PPA_Annual,Payback,Phone,Website,Email,Hours,Facebook,Instagram,Lat,Lng';
  const rows = f.map(b => [
    escCsv(b.n), escCsv(b.nth), escCsv(b.c), b.pr, b.s, b.pip, b.a, b.kw.toFixed(1), b.p, b.kwh,
    b.sav, b.epc, b.ep, b.ppai, b.ppar, b.ppap,
    escCsv(b.ph), escCsv(b.w), escCsv(b.em), escCsv(b.hr), escCsv(b.fb), escCsv(b.ig), b.la, b.lo
  ].join(','));
  dl(h + '\n' + rows.join('\n'), 'text/csv', `kophangan_roofs_${new Date().toISOString().slice(0, 10)}.csv`);
}

function exportTop() {
  const top = B.filter(b => b.pr === 'A' && b.n).slice(0, 50);
  let t = '# Ko Phangan Solar — Top 50 Leads\n\n';
  top.forEach((b, i) => {
    t += `${i + 1}. **${b.n}** (${CATEGORY_LABELS[b.c] || b.c})${b.pip ? ' 🟢 Pipeline' : ''}\n`;
    t += `   📐 ${b.a}m² | ⚡ ${b.kw.toFixed(1)}kWp | 🔢 ${b.p} panels\n`;
    t += `   💰 EPC: ฿${(b.epc / 1000).toFixed(0)}K | PPA: ฿${(b.ppar / 1000).toFixed(0)}K/yr\n`;
    if (b.ph) t += `   📞 ${b.ph}\n`;
    if (b.w) t += `   🌐 ${b.w}\n`;
    if (b.em) t += `   ✉️ ${b.em}\n`;
    t += `   📍 ${b.la}, ${b.lo}\n\n`;
  });
  dl(t, 'text/markdown', 'kophangan_top50.md');
}

function exportPipeline() {
  const pip = B.filter(b => b.pip);
  let t = '# Ko Phangan Solar — Pipeline Leads\n\n';
  pip.forEach((b, i) => {
    t += `${i + 1}. **${b.n}** — ${CATEGORY_LABELS[b.c] || b.c}, ${b.a}m², ${b.kw.toFixed(1)}kWp\n`;
    t += `   EPC: ฿${(b.epc / 1000).toFixed(0)}K | PPA: ฿${(b.ppar / 1000).toFixed(0)}K/yr\n`;
    if (b.ph) t += `   📞 ${b.ph} `;
    if (b.em) t += `✉️ ${b.em} `;
    if (b.w) t += `🌐 ${b.w}`;
    t += '\n\n';
  });
  dl(t, 'text/markdown', 'kophangan_pipeline.md');
}

function dl(content, type, name) {
  const b = new Blob([content], { type });
  const u = URL.createObjectURL(b);
  const a = document.createElement('a');
  a.href = u; a.download = name; a.click();
  URL.revokeObjectURL(u);
}

// --- Comparison Mode ---
function startCompare() {
  compareSet.clear();
  document.querySelector('.compare-bar').classList.add('show');
  renderListInner();
}

function toggleCompare(id) {
  if (compareSet.has(id)) compareSet.delete(id); else if (compareSet.size < 5) compareSet.add(id);
  document.querySelector('.compare-count').textContent = compareSet.size;
  renderListInner();
}

function clearCompare() {
  compareSet.clear();
  document.querySelector('.compare-bar').classList.remove('show');
  document.querySelector('.compare-panel').classList.remove('show');
  renderListInner();
}

function showComparison() {
  if (compareSet.size < 2) return;
  const buildings = [...compareSet].map(id => B.find(b => b.i === id)).filter(Boolean);
  const panel = document.querySelector('.compare-panel');
  panel.innerHTML = `
    <div class="compare-header">
      <h2>השוואת מבנים (${buildings.length})</h2>
      <button class="dp-close" onclick="clearCompare()" style="font-size:22px">✕</button>
    </div>
    <div class="compare-grid">
      ${buildings.map(b => `
        <div class="compare-card">
          <h3>${escHtml(b.n || CATEGORY_LABELS[b.c] || 'מבנה')} <span class="badge p${b.pr.toLowerCase()}">${b.pr}</span></h3>
          <table class="dt">
            <tr><td>שטח גג</td><td>${b.a.toLocaleString()} m²</td></tr>
            <tr><td>שמיש</td><td>${b.u.toLocaleString()} m²</td></tr>
            <tr><td>kWp</td><td>${b.kw.toFixed(1)}</td></tr>
            <tr><td>פאנלים</td><td>${b.p}</td></tr>
            <tr><td>kWh/שנה</td><td>${b.kwh.toLocaleString()}</td></tr>
            <tr><td>חיסכון/חודש</td><td style="color:var(--gold)">฿${b.sav.toLocaleString()}</td></tr>
            <tr><td>EPC מחיר</td><td>฿${(b.epc / 1000).toFixed(0)}K</td></tr>
            <tr><td>EPC רווח</td><td style="color:#2ED89A">฿${(b.ep / 1000).toFixed(0)}K</td></tr>
            <tr><td>PPA שנתי</td><td>฿${(b.ppar / 1000).toFixed(0)}K</td></tr>
            <tr><td>החזר PPA</td><td>${b.ppap} שנים</td></tr>
            <tr><td>Score</td><td>${b.s}/100</td></tr>
          </table>
        </div>`).join('')}
    </div>`;
  panel.classList.add('show');
}

// --- Keyboard Shortcuts ---
function setupKeyboard() {
  document.addEventListener('keydown', e => {
    // Don't capture when typing in inputs
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;

    switch (e.key) {
      case 'Escape':
        if (document.querySelector('.compare-panel.show')) { clearCompare(); }
        else { closeDetail(); }
        break;
      case '/':
        e.preventDefault();
        document.getElementById('search').focus();
        break;
      case 'h':
        toggleHeat(document.querySelector('.htb:nth-child(3)'));
        break;
      case 'p':
        togglePolygons(document.querySelector('.htb:nth-child(4)'));
        break;
      case 'r':
        resetView();
        break;
      case 'c':
        if (!compareSet.size) startCompare(); else showComparison();
        break;
    }
  });
}

// --- Search Setup ---
function setupSearch() {
  document.getElementById('search').addEventListener('input', debounce(() => renderList(), 300));
}

// --- Init ---
document.addEventListener('DOMContentLoaded', () => {
  initMap();
  setupFilters();
  setupSort();
  setupSearch();
  setupKeyboard();
});
