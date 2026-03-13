# Proposal v2 — Design Document

> Upgrade `proposal.html` to beamtech-level quality with 3 options, battery storage, and integrated contracts.

## Goal

Transform the existing dynamic `proposal.html` (2 options, basic design) into a premium proposal page matching `beamtech-001.html` quality — with full dynamic URL params support.

## Page Structure (12 Sections)

| # | Section | Source | Dynamic? |
|---|---------|--------|----------|
| 1 | Sticky Nav | beamtech | ref#, languages (EN/TH/HE), WhatsApp CTA |
| 2 | Hero | beamtech | Client name, KPIs (savings, payback, kWh, warranty), metadata |
| 3 | Your Project | beamtech | Images via `img1`/`img2` params, property + roof details |
| 4 | Roof Visualization | existing proposal.html | MapLibre + polygon panel rendering (keep as-is) |
| 5 | 3 Options | beamtech | EPC / PPA / EPC+Battery — 3 cards, auto-calculated |
| 6 | Comparison Table | beamtech | Side-by-side table of all 3 options |
| 7 | Savings Projection | upgraded | 25-year bar chart (existing logic, new design) |
| 8 | Equipment | beamtech | LONGi + Huawei + Mounting (static content) |
| 9 | Battery Add-on | beamtech | Dark section, 2 battery options, hidden if no `bat` param |
| 10 | Warranty & Timeline | beamtech | 3 warranty cards + 4-step installation timeline |
| 11 | Agreement | beamtech + contracts | Option selection, key terms, expandable full terms, signature, contract links |
| 12 | CTA + Footer | beamtech | WhatsApp, LINE, Phone, Email |

## URL Parameters

```
?n=Client Name             # Client/property name
&a=163                     # Roof area m²
&u=146.7                   # Usable area
&kw=32.5                   # System size kWp
&p=56                      # Panel count
&kwh=43800                 # Annual production kWh
&epc=1056250               # EPC price (THB)
&bat=550000                # Battery add-on price (optional — hides battery section if absent)
&batkwh=30                 # Battery capacity kWh
&ppa=4.50                  # PPA rate per kWh
&pea=6                     # PEA grid rate per kWh
&img1=url                  # Project image 1 (optional)
&img2=url                  # Project image 2 (optional)
&ph=66623480119            # WhatsApp/phone number
&ref=TM-2026-001           # Proposal reference number
&la=9.7&lo=100.0           # Coordinates for roof map
&poly=[...]                # Roof polygon for MapLibre
```

## Auto-Calculations

```javascript
// EPC (Option A)
epc_monthly_savings = (kwh / 12) * pea
epc_annual_savings  = kwh * pea
epc_payback         = epc / epc_annual_savings
epc_savings_25yr    = epc_annual_savings * 25

// PPA (Option B)
ppa_monthly_cost    = (kwh / 12) * ppa
ppa_monthly_savings = (kwh / 12) * (pea - ppa)
ppa_discount_pct    = ((pea - ppa) / pea) * 100

// EPC + Battery (Option C)
epc_bat_total       = epc + bat
epc_bat_extra       = batkwh * 365 * 0.5 * pea * 0.2  // self-consumption bonus
epc_bat_annual      = epc_annual_savings + epc_bat_extra
epc_bat_payback     = epc_bat_total / epc_bat_annual
backup_hours        = batkwh / 3  // average load estimate
```

## Agreement Section

- **3 radio buttons** — select Option A / B / C
- **Key terms** — 6-8 dynamic bullet points based on selected option
  - EPC: payment schedule (30/40/30), ownership, warranties
  - PPA: rate, escalation, contract period, maintenance included, transfer terms
  - EPC+Battery: all EPC terms + battery warranty, backup specs
- **Expandable full terms** — `<details>` element with main clauses from relevant contract
- **"Read Full Contract"** — link to `epc-contract.html` (Option A/C) or `ppa-contract.html` (Option B)
- **Signature block** — 2 columns (Client / TM Energy), name, title, date, stamp area

## Design System

- **Typography:** Playfair Display (headings) + Inter (body)
- **Colors:** navy `#0D2137`, gold `#E8A820`, green `#1A7A5A`, coral `#E85D3A`
- **Cards:** white bg, 16px radius, `rgba(0,0,0,.06)` borders, hover shadows
- **Hero:** navy gradient bg, gold accent stats
- **Battery section:** dark navy bg, green accent
- **Options cards:** 3-column grid, middle card (PPA) featured with gold border + scale(1.03)
- **Responsive:** mobile-first grid collapse at 768px
- **Print:** clean layout, nav/floating hidden, page breaks
- **i18n:** EN / TH / HE with data-i18n attributes (existing pattern)

## Dependencies

- MapLibre GL JS (existing)
- Google Fonts: Inter, Playfair Display, Noto Sans Thai, Heebo
- No build step — single HTML file with inline CSS/JS

## What Stays From Current `proposal.html`

- URL param parsing logic
- MapLibre roof visualization + panel generation
- Signature canvas (mouse + touch)
- i18n system (T object with en/th/he)
- Scroll animations (IntersectionObserver)
- Print styles

## What's New

- Complete visual redesign (beamtech design system)
- 3rd option: EPC + Battery
- Comparison table
- Battery add-on section (conditional)
- Project images section (conditional)
- Agreement section with option selection + expandable terms
- Contract links (EPC / PPA)
- Timeline section
- Warranty cards
- Floating WhatsApp button
- Sticky nav with language switcher
