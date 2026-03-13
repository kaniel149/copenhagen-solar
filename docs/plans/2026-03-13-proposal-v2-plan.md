# Proposal v2 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Upgrade `proposal.html` from basic 2-option layout to premium beamtech-level design with 3 options (EPC/PPA/EPC+Battery), battery storage section, integrated contracts, and full dynamic URL params.

**Architecture:** Single HTML file with inline CSS/JS. All data flows through URL params. Beamtech-001.html serves as the visual reference — we copy its design system and section structure, but make everything dynamic. Existing MapLibre roof visualization and i18n system are preserved.

**Tech Stack:** Vanilla HTML/CSS/JS, MapLibre GL JS, Google Fonts (Inter, Playfair Display, Noto Sans Thai, Heebo)

---

### Task 1: CSS Foundation — Replace Design System

**Files:**
- Modify: `proposal.html` (lines 10-118, the entire `<style>` block)

**Step 1: Replace the CSS**

Remove the current `<style>` block (lines 10-118) and replace with the beamtech design system from `proposals/beamtech-001.html` (lines 18-1042). This includes:

- CSS variables: `--navy`, `--gold`, `--green`, `--bg`, `--border`, shadows, radius
- Typography: Playfair Display headings, Inter body
- Layout: `.container`, `section`, `.section-label`, `.section-heading`, `.section-desc`
- Nav: `.nav`, `.nav-logo`, `.logo-mark`, `.nav-brand`, `.nav-cta`
- Hero: `.hero`, `.hero-inner`, `.hero-badge`, `.hero-stats`, `.hero-stat`, `.hero-meta`
- Project images: `.project-images`, `.img-wrapper`, `.img-caption`, `.detail-card`, `.detail-row`
- Options: `.options-grid`, `.option-card`, `.option-card.featured`, `.option-tag`, `.option-price`
- Specs: `.specs-row`, `.spec-card`, `.spec-item`
- Savings: `.savings-visual`, `.savings-bar`, `.savings-card`
- Timeline: `.timeline-grid`, `.tl-step`, `.tl-dot`
- Warranty: `.warranty-grid`, `.warranty-card`
- Battery: `.battery-section`, `.battery-grid`, `.battery-card`
- Agreement: `.agreement-section`, `.option-select`, `.option-radio`, `.key-terms-list`, `.terms-toggle`, `.signature-block`
- CTA: `.cta-block`, `.btn-whatsapp`, `.btn-phone`
- Footer: `.footer`, `.footer-logo`
- Floating WhatsApp: `.floating-wa`
- Responsive: 768px breakpoints
- Print: clean B&W styles

Also update the Google Fonts `<link>` tag to include Playfair Display:
```html
<link href="https://fonts.googleapis.com/css2?family=Heebo:wght@300;400;500;700;900&family=Inter:wght@300;400;500;600;700;800;900&family=Noto+Sans+Thai:wght@300;400;500;600;700&family=Playfair+Display:wght@700;800;900&display=swap" rel="stylesheet">
```

**Step 2: Verify**

Open `proposal.html` in browser. Page will look broken (old HTML + new CSS) — that's expected.

**Step 3: Commit**

```bash
git add proposal.html
git commit -m "refactor: replace proposal CSS with beamtech design system"
```

---

### Task 2: Sticky Nav + Floating WhatsApp

**Files:**
- Modify: `proposal.html` — replace the lang-bar (lines 123-128) with sticky nav

**Step 1: Replace lang-bar with sticky nav**

Remove the old `.lang-bar` div and replace with:

```html
<nav class="nav">
  <div class="nav-logo">
    <div class="logo-mark">TM</div>
    <div class="nav-brand">TM ENERGY</div>
  </div>
  <div class="nav-ref" id="navRef">#TM-2026-001 · Confidential</div>
  <div style="display:flex;gap:6px;align-items:center;">
    <button class="lang-btn-nav" onclick="setLang('en')" style="background:var(--gold);color:var(--navy);padding:4px 10px;border-radius:6px;font-size:11px;font-weight:700;border:none;cursor:pointer;">EN</button>
    <button class="lang-btn-nav" onclick="setLang('th')" style="background:rgba(255,255,255,.12);color:#fff;padding:4px 10px;border-radius:6px;font-size:11px;font-weight:700;border:none;cursor:pointer;">TH</button>
    <button class="lang-btn-nav" onclick="setLang('he')" style="background:rgba(255,255,255,.12);color:#fff;padding:4px 10px;border-radius:6px;font-size:11px;font-weight:700;border:none;cursor:pointer;">עב</button>
    <a id="navWA" href="#" class="nav-cta" target="_blank">💬 WhatsApp</a>
  </div>
</nav>
```

Add floating WhatsApp button before `</body>`:
```html
<a id="floatingWA" href="#" class="floating-wa" target="_blank" title="Chat on WhatsApp">💬</a>
```

**Step 2: Commit**

```bash
git commit -am "feat: add sticky nav and floating WhatsApp button"
```

---

### Task 3: Hero Section

**Files:**
- Modify: `proposal.html` — replace the `.hero` div (lines 130-137)

**Step 1: Replace hero**

Replace the simple hero with the beamtech hero structure. Use `id` attributes for all dynamic values:

```html
<header class="hero">
  <div class="hero-inner">
    <div class="hero-badge" data-i18n="heroBadge">SOLAR ENERGY PROPOSAL</div>
    <h1 data-i18n="heroTitle">Solar Power for<br><em id="heroClientName">Your Property</em></h1>
    <p class="hero-subtitle" id="heroSubtitle">...</p>

    <div class="hero-stats">
      <div class="hero-stat">
        <div class="hero-stat-value" id="heroSavings">-</div>
        <div class="hero-stat-label" data-i18n="annualSave">Annual Savings</div>
      </div>
      <div class="hero-stat">
        <div class="hero-stat-value" id="heroPayback">-</div>
        <div class="hero-stat-label" data-i18n="payback">Payback Period</div>
      </div>
      <div class="hero-stat">
        <div class="hero-stat-value" id="heroKwh">-</div>
        <div class="hero-stat-label">kWh/year</div>
      </div>
      <div class="hero-stat">
        <div class="hero-stat-value">25 yrs</div>
        <div class="hero-stat-label" data-i18n="panelWarranty">Panel Warranty</div>
      </div>
    </div>

    <div class="hero-meta">
      <div class="hero-meta-item"><span data-i18n="preparedFor">Prepared for</span><strong id="heroClient">-</strong></div>
      <div class="hero-meta-item"><span data-i18n="proposalDate">Proposal Date</span><strong id="heroDate">-</strong></div>
      <div class="hero-meta-item"><span>Reference</span><strong id="heroRef">-</strong></div>
      <div class="hero-meta-item"><span data-i18n="validUntil">Valid Until</span><strong id="heroValid">-</strong></div>
    </div>
  </div>
</header>
```

**Step 2: Commit**

```bash
git commit -am "feat: add premium hero section with dynamic KPIs"
```

---

### Task 4: Your Project Section (images + details)

**Files:**
- Modify: `proposal.html` — add new section after hero

**Step 1: Add project section**

This section is conditional — shown only when `img1` or `img2` params exist. Add after the hero:

```html
<section id="projectSection" style="display:none;">
  <div class="container">
    <div class="section-label" data-i18n="yourProject">Your Project</div>
    <h2 class="section-heading" id="projectHeading">Your Solar Installation</h2>
    <p class="section-desc" id="projectDesc"></p>

    <div class="project-images" id="projectImages"></div>

    <div class="project-details">
      <div class="detail-card">
        <h4>🏢 <span data-i18n="propDetails">Property Details</span></h4>
        <div class="detail-row"><span class="detail-label" data-i18n="owner">Owner</span><span class="detail-value" id="detailOwner">-</span></div>
        <div class="detail-row"><span class="detail-label" data-i18n="location">Location</span><span class="detail-value">Koh Phangan, Surat Thani</span></div>
      </div>
      <div class="detail-card">
        <h4>☀️ <span data-i18n="roofAssess">Roof Assessment</span></h4>
        <div class="detail-row"><span class="detail-label" data-i18n="roofArea">Roof Area</span><span class="detail-value" id="detailRoof">-</span></div>
        <div class="detail-row"><span class="detail-label" data-i18n="usableArea">Usable Area</span><span class="detail-value" id="detailUsable">-</span></div>
        <div class="detail-row"><span class="detail-label" data-i18n="systemSize">System Size</span><span class="detail-value" id="detailKwp">-</span></div>
        <div class="detail-row"><span class="detail-label" data-i18n="panels">Panels</span><span class="detail-value" id="detailPanels">-</span></div>
      </div>
    </div>
  </div>
</section>
```

**Step 2: Commit**

```bash
git commit -am "feat: add conditional project images section"
```

---

### Task 5: Roof Visualization Section

**Files:**
- Modify: `proposal.html` — keep existing MapLibre section, just wrap in new design

**Step 1: Wrap existing roof map**

Keep the existing `#roofVizSection` but update its HTML structure to match the new design system (section-label + section-heading pattern). The MapLibre JS logic stays unchanged.

**Step 2: Commit**

```bash
git commit -am "refactor: wrap roof visualization in new design system"
```

---

### Task 6: Three Options Section

**Files:**
- Modify: `proposal.html` — replace the old 2-option compare section

**Step 1: Add 3 options grid**

Replace the old `.compare` div with the beamtech-style 3-column options grid. All values use `id` attributes for dynamic population:

- **Option A: EPC** — price, features, annual savings, payback
- **Option B: PPA (RECOMMENDED)** — ฿0 upfront, rate, monthly savings, featured card
- **Option C: EPC + Battery** — total price, features, savings, payback, backup hours

Key IDs: `epcPrice`, `epcAnnualSav`, `epcPayback`, `ppaSave`, `ppaRate`, `ppaDiscount`, `epcBatPrice`, `epcBatSav`, `epcBatPayback`, `epcBatBackup`

Battery option card is shown/hidden based on `bat` param.

**Step 2: Commit**

```bash
git commit -am "feat: add 3-option pricing cards (EPC/PPA/EPC+Battery)"
```

---

### Task 7: Comparison Table

**Files:**
- Modify: `proposal.html` — add comparison table section after options

**Step 1: Add comparison table**

Table with dynamic values comparing all 3 options across: upfront cost, monthly payment, annual savings, 10-year cost, 20-year cost, payback period, blackout protection, ownership.

All values populated by JS using same URL params.

**Step 2: Commit**

```bash
git commit -am "feat: add side-by-side comparison table"
```

---

### Task 8: Savings Projection + Equipment + Timeline + Warranty Sections

**Files:**
- Modify: `proposal.html` — replace old savings chart and equipment sections

**Step 1: Savings section**

Add the beamtech-style savings visualization with bar comparison (PEA vs Solar) + 4 savings cards (annual, 10yr, payback, CO2). Dynamic values.

**Step 2: Equipment section**

Copy beamtech specs section (LONGi + Huawei + Installation details). Static content with spec-card layout.

**Step 3: Timeline section**

4-step timeline: Survey & Design → Permits & Procurement → Installation → Go Live. Static layout.

**Step 4: Warranty section**

6 warranty cards: 25yr panels, 10yr inverter, 24mo workmanship, 24/7 monitoring, 2x/yr cleaning, local team. Static layout.

**Step 5: Commit**

```bash
git commit -am "feat: add savings, equipment, timeline, and warranty sections"
```

---

### Task 9: Battery Add-on Section (Conditional)

**Files:**
- Modify: `proposal.html` — add battery section

**Step 1: Add battery section**

Dark navy background section with 2 battery cards (15 kWh / 30 kWh). Hidden entirely if no `bat` URL param.

Dynamic values: battery capacity, cost, extra savings, backup hours.

The 30 kWh option shows "RECOMMENDED" tag.

**Step 2: Commit**

```bash
git commit -am "feat: add conditional battery storage section"
```

---

### Task 10: Agreement Section with Contract Links

**Files:**
- Modify: `proposal.html` — replace old signature section

**Step 1: Add agreement section**

Copy beamtech agreement structure:
- 3 radio buttons (Option A/B/C) with click selection JS
- Key terms list (dynamic based on selected option)
- Expandable `<details>` with full terms
- **"Read Full Contract" links** — `<a href="epc-contract.html">` for EPC options, `<a href="ppa-contract.html">` for PPA
- Signature block: 2 columns (Client / TM Energy), name, title, date, stamp area
- Consent text with ref number

Dynamic: option prices, system specs, ref number.

**Step 2: Commit**

```bash
git commit -am "feat: add agreement section with option selection and contract links"
```

---

### Task 11: CTA + About + Footer

**Files:**
- Modify: `proposal.html` — replace old CTA and footer

**Step 1: Add CTA block**

Gold gradient CTA with WhatsApp + Phone buttons, 3-step process. Dynamic WhatsApp link with ref number.

**Step 2: Add About TM Energy section**

Company stats (100+ projects, 10+ years, Tier 1, Local team).

**Step 3: Add footer**

Navy footer with logo, contacts, legal text, proposal ref + validity date.

**Step 4: Commit**

```bash
git commit -am "feat: add CTA, about, and footer sections"
```

---

### Task 12: JavaScript — Dynamic Data Population

**Files:**
- Modify: `proposal.html` — replace the `<script>` block

**Step 1: URL param parsing + calculations**

Keep existing `params` parsing. Add new calculations:

```javascript
// Parse all params
const n = params.get('n') || 'Your Property';
const a = parseFloat(params.get('a')) || 500;
const u = parseFloat(params.get('u')) || (a * 0.7);
const kw = parseFloat(params.get('kw')) || (u / 5.5);
const p = parseInt(params.get('p')) || Math.floor(u / 2.58);
const kwh = parseInt(params.get('kwh')) || Math.round(kw * 4.5 * 365);
const epc = parseInt(params.get('epc')) || Math.round(kw * 30000);
const bat = parseInt(params.get('bat')) || 0;
const batkwh = parseInt(params.get('batkwh')) || 0;
const ppa = parseFloat(params.get('ppa')) || 4.50;
const pea = parseFloat(params.get('pea')) || 6;
const img1 = params.get('img1');
const img2 = params.get('img2');
const ph = params.get('ph') || '66623480119';
const ref = params.get('ref') || 'TM-' + new Date().getFullYear() + '-' + String(Math.floor(Math.random()*999)).padStart(3,'0');

// EPC calculations
const epcAnnual = kwh * pea;
const epcMonthly = epcAnnual / 12;
const epcPayback = epc / epcAnnual;
const epc25 = epcAnnual * 25;
const co2 = kwh * 0.0005;

// PPA calculations
const ppaMonthlyCost = (kwh / 12) * ppa;
const ppaMonthlySav = (kwh / 12) * (pea - ppa);
const ppaDiscount = ((pea - ppa) / pea * 100);

// EPC + Battery calculations
const epcBatTotal = epc + bat;
const epcBatExtra = batkwh * 365 * 0.5 * pea * 0.2;
const epcBatAnnual = epcAnnual + epcBatExtra;
const epcBatPayback = epcBatTotal / epcBatAnnual;
const backupHrs = Math.round(batkwh / 3);
```

**Step 2: DOM population**

Populate all `id`-based elements with calculated values. Format currency with `toLocaleString()`.

**Step 3: Conditional sections**

```javascript
// Show project images if img1 or img2 provided
if (img1 || img2) {
  document.getElementById('projectSection').style.display = '';
  // Inject images
}

// Show battery section only if bat param exists
if (!bat) {
  document.getElementById('batterySection').style.display = 'none';
  // Hide Option C card
}
```

**Step 4: WhatsApp links**

Update all WhatsApp `href` attributes with phone number and pre-filled message including ref.

**Step 5: Commit**

```bash
git commit -am "feat: add dynamic data population and conditional sections"
```

---

### Task 13: i18n — Update Translation Object

**Files:**
- Modify: `proposal.html` — expand the `T` object

**Step 1: Add new translation keys**

Expand the existing `T` object (en/th/he) with all new `data-i18n` keys used in beamtech sections. Keep existing keys, add new ones for:
- Hero, project, options, comparison, savings, equipment, timeline, warranty, battery, agreement, CTA, footer

**Step 2: Update setLang function**

Update `setLang()` to also handle the new nav language buttons (active state).

**Step 3: Commit**

```bash
git commit -am "feat: expand i18n translations for all new sections"
```

---

### Task 14: MapLibre + Signature + Scroll Animations

**Files:**
- Modify: `proposal.html` — keep existing JS, integrate with new DOM

**Step 1: MapLibre**

Keep `initRoofMap()` and `generatePanels()` functions exactly as-is. Just update the section container ID if needed.

**Step 2: Signature**

Keep existing canvas signature logic. Move it into the new agreement section's signature block (replace the static sig-line divs with the canvas for the client side).

**Step 3: Scroll animations**

Keep the existing `IntersectionObserver` for `.fade-in` animations. Add `fade-in` class to all new sections.

**Step 4: Agreement radio selection**

Add the beamtech radio selection JS (from beamtech lines 1751-1788). Make key terms update dynamically when an option is selected.

**Step 5: Commit**

```bash
git commit -am "feat: integrate MapLibre, signature, and scroll animations"
```

---

### Task 15: Final Polish + Testing

**Files:**
- Modify: `proposal.html`

**Step 1: Test with full URL params**

Open in browser with test params:
```
proposal.html?n=Beamtech%20Residences&a=163&u=146.7&kw=32.5&p=56&kwh=43800&epc=1056250&bat=550000&batkwh=30&ppa=4.50&pea=6&ph=66623480119&ref=TM-2026-001&la=9.748&lo=100.044
```

Verify:
- All 3 option cards show correct values
- Comparison table populated
- Savings section correct
- Battery section visible (because `bat` param exists)
- Agreement radio selection works
- Contract links point to correct files
- WhatsApp links include ref and phone
- Print layout clean

**Step 2: Test without battery params**

```
proposal.html?n=Villa%20Sunset&a=80&kw=10&p=18&kwh=16425&epc=300000&ppa=4.50&pea=6&ph=66623480119
```

Verify:
- Battery section hidden
- Option C card hidden
- Comparison table shows 2 options only
- Everything else works

**Step 3: Test mobile responsive**

Chrome DevTools → mobile viewport. Check all sections stack properly.

**Step 4: Test i18n**

Switch to TH and HE. Verify translations and RTL layout.

**Step 5: Final commit**

```bash
git commit -am "polish: final adjustments and testing"
```

---

## Summary

| Task | Description | Estimated Size |
|------|-------------|---------------|
| 1 | CSS Design System | ~1000 lines CSS |
| 2 | Sticky Nav + WhatsApp | ~30 lines HTML |
| 3 | Hero Section | ~40 lines HTML |
| 4 | Project Images | ~30 lines HTML |
| 5 | Roof Visualization | ~10 lines (wrap) |
| 6 | 3 Options Cards | ~100 lines HTML |
| 7 | Comparison Table | ~80 lines HTML |
| 8 | Savings + Equipment + Timeline + Warranty | ~200 lines HTML |
| 9 | Battery Section | ~50 lines HTML |
| 10 | Agreement + Contracts | ~100 lines HTML |
| 11 | CTA + About + Footer | ~80 lines HTML |
| 12 | JavaScript (calculations + DOM) | ~150 lines JS |
| 13 | i18n Translations | ~200 lines JS |
| 14 | MapLibre + Signature + Animations | ~50 lines JS |
| 15 | Testing + Polish | 0 new lines |

**Total:** ~1 file, ~1800 lines (up from 557)
