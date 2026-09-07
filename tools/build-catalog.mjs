// tools/build-catalog.mjs — scan the repo and write catalog.json (the home-page catalog).
// Usage: node tools/build-catalog.mjs
// Every .html/.pdf/.md/.mp3/.xlsx/.csv outside the EXCLUDE list becomes an entry; CURATED overrides
// title/kind/group/audience/lang per path; EXTERNAL adds off-repo links. Re-run after adding files.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const ROOT = path.resolve(new URL('.', import.meta.url).pathname, '..');
const EXT = new Set(['.html', '.pdf', '.md', '.mp3', '.xlsx', '.csv']);
const EXCLUDE_DIRS = /^(_retired|node_modules|drone-tiles|supabase|\.github|\.git|\.claude|roof-scanner|scripts|gis-mapper\/grid-data|academy\/tests|academy\/i18n|academy\/migrations)(\/|$)|(^|\/)tools(\/|$)/;
const EXCLUDE_FILES = new Set([
  'index.html', 'assets.html', '_admin-cta.html', 'CLAUDE.md',
  'roof-scanner.html', 'solar-atlas.html', // redirect stubs → kp-solar-pro.html
  'academy/QA_REPORT.md', 'academy/TRANSLATION_QA.md', 'academy/IMPROVEMENT_PLAN.md', // superseded QA logs
  'proposals/QA_REPORT.md', 'platform/sales/QA_REPORT.md',
]);

// path → overrides. `alt` is a secondary title (translation or plain-English name) shown under the title and searched.
const CURATED = {
  // ── Presentations (decks) ──
  'presentations/index.html': { title: 'Presentations hub', kind: 'deck', group: 'presentations', audience: 'team', lang: ['en'], hub: true },
  'presentations/bustan-energy-company-2026.html': { title: 'Company presentation 2026', alt: 'Who we are, what we do on Koh Phangan, team and track record', kind: 'deck', group: 'presentations', audience: 'client', lang: ['en'] },
  'presentations/ev-charging-koh-phangan.html': { title: 'EV charging network — Koh Phangan', alt: 'Charging-station opportunity, sites, unit economics', kind: 'deck', group: 'presentations', audience: 'investor', lang: ['en', 'th'] },
  'presentations/ev-charging-koh-phangan-he.html': { title: 'רשת טעינה לרכב חשמלי — קופנגן', alt: 'EV charging network (Hebrew twin)', kind: 'deck', group: 'presentations', audience: 'investor', lang: ['he'] },
  'presentations/community-solar-research.html': { title: 'Community Solar בתאילנד — מחקר מעמיק', alt: 'Community-solar models and their fit for Thailand', kind: 'deck', group: 'presentations', audience: 'internal', lang: ['he'] },
  'presentations/VALIDATION.md': { title: 'Presentations — number validation', alt: 'Financing deck vs business-plan workbook, cell by cell', kind: 'doc', group: 'presentations', audience: 'internal', lang: ['en'] },

  'presentations/bustan-financing.html': { title: 'מימון — בנקים, תנאים, מספרים אמיתיים', alt: 'Bustan Energy — financing', kind: 'deck', group: 'presentations', audience: 'investor', lang: ['he', 'en', 'th'], note: 'numbers pending validation' },

  // ── Playbooks (long-form strategy & ops docs) ──
  'business-plan.html': { title: 'תוכנית עסקית שנה 1', alt: 'Business plan — year 1', kind: 'doc', group: 'strategy', audience: 'internal', lang: ['he'], playbook: true },
  'pnl-plan.html': { title: 'פיננסים — P&L ותוכנית הקמה מלאה', alt: 'P&L + full build-out plan', kind: 'doc', group: 'strategy', audience: 'internal', lang: ['he'], playbook: true },
  'strategy.html': { title: 'אסטרטגיה עסקית', alt: 'Strategy deck', kind: 'doc', group: 'strategy', audience: 'internal', lang: ['he'], playbook: true },
  'financial-dashboard.html': { title: 'דשבורד פיננסי', alt: 'Financial dashboard', kind: 'doc', group: 'strategy', audience: 'internal', lang: ['he'], playbook: true },
  'financing.html': { title: 'מימון ובנקים', alt: 'Financing deep dive — banks, terms, PPA/ESCO math', kind: 'doc', group: 'strategy', audience: 'internal', lang: ['he'], playbook: true },
  'sales-marketing.html': { title: 'שיווק ומכירות', alt: 'Sales & marketing playbook', kind: 'doc', group: 'sales', audience: 'team', lang: ['he'], playbook: true },
  'licensing.html': { title: 'רישוי ורגולציה', alt: 'Licensing solar systems in Thailand', kind: 'doc', group: 'ops', audience: 'team', lang: ['he'], playbook: true },
  'installation.html': { title: 'תהליך הקמה', alt: 'Installation process', kind: 'doc', group: 'ops', audience: 'team', lang: ['he'], playbook: true },
  'monitoring-maintenance.html': { title: 'ניטור ותחזוקה', alt: 'Monitoring & maintenance', kind: 'doc', group: 'ops', audience: 'team', lang: ['he'], playbook: true },
  'procurement-engineering.html': { title: 'רכש והנדסה', alt: 'Procurement & engineering', kind: 'doc', group: 'ops', audience: 'team', lang: ['he'], playbook: true },
  'equipment-list.html': { title: 'רשימת ציוד וכלי עבודה', alt: 'Equipment & tools list', kind: 'doc', group: 'ops', audience: 'team', lang: ['he'], playbook: true },
  'legal-contracts.html': { title: 'משפטי, חוזים והסכמים', alt: 'Legal, contracts & agreements', kind: 'doc', group: 'legal', audience: 'client', lang: ['he'], playbook: true },
  'value-chain.html': { title: 'ארכיטקטורת Value Chain', alt: 'Value-chain architecture (CRM)', kind: 'doc', group: 'sales', audience: 'team', lang: ['he'], playbook: true },
  'crm-value-chain.html': { title: 'CRM value chain — Lead to O&M', alt: '15 slides', kind: 'doc', group: 'sales', audience: 'team', lang: ['he'], playbook: true },
  'thailand-solar-farm-masterclass.html': { title: 'Thailand solar farm masterclass', kind: 'doc', group: 'ops', audience: 'team', lang: ['en'], playbook: true },
  'solar-farm-guide.html': { title: 'Solar farm development guide — Koh Phangan (up to 9 MW)', kind: 'doc', group: 'ops', audience: 'team', lang: ['en'], playbook: true },
  'customer-avatars.html': { title: 'אווטרי לקוחות', alt: 'Customer avatars', kind: 'doc', group: 'sales', audience: 'team', lang: ['he'], playbook: true },
  'drone-guide.html': { title: 'מדריך סריקת גגות ברחפן', alt: 'Drone roof-scanning guide', kind: 'doc', group: 'ops', audience: 'team', lang: ['he'], playbook: true },
  'VALUE_CHAIN.md': { title: 'Value chain blueprint', kind: 'doc', group: 'plans', audience: 'internal', lang: ['en'] },
  'about.md': { title: 'About Bustan Energy', alt: 'Company one-pager', kind: 'doc', group: 'public', audience: 'client', lang: ['en'] },
  'Ko_Phangan_Solar_Business_Plan.xlsx': { title: 'Business plan workbook', alt: 'Ko Phangan Solar Business Plan (canonical numbers)', kind: 'doc', group: 'strategy', audience: 'internal', lang: ['en'] },

  // ── CRM steps ──
  'crm-step1-lead-capture.html': { title: 'CRM Step 1 — ליד נכנס', alt: 'Lead capture & pipeline', kind: 'doc', group: 'crm', audience: 'team', lang: ['he'] },
  'crm-step2-site-survey.html': { title: 'CRM Step 2 — סקר ראשוני', alt: 'Site survey', kind: 'doc', group: 'crm', audience: 'team', lang: ['he'] },
  'crm-step3-electricity.html': { title: 'CRM Step 3 — ניתוח חשמל', alt: 'Electricity analysis', kind: 'doc', group: 'crm', audience: 'team', lang: ['he'] },
  'crm-step4-design.html': { title: 'CRM Step 4 — עיצוב מערכת', alt: 'System design', kind: 'doc', group: 'crm', audience: 'team', lang: ['he'] },
  'crm-step5-sld.html': { title: 'CRM Step 5 — SLD ו-PEA', alt: 'SLD & PEA', kind: 'doc', group: 'crm', audience: 'team', lang: ['he'] },
  'crm-step6-proposal.html': { title: 'CRM Step 6 — הצעת מחיר', alt: 'Proposal', kind: 'doc', group: 'crm', audience: 'team', lang: ['he'] },
  'crm-step7-contract.html': { title: 'CRM Step 7 — חוזה', alt: 'Contract', kind: 'doc', group: 'crm', audience: 'team', lang: ['he'] },
  'crm-step8-inventory.html': { title: 'CRM Step 8 — הזמנת חומר', alt: 'Inventory & procurement', kind: 'doc', group: 'crm', audience: 'team', lang: ['he'] },
  'crm-step9-installation.html': { title: 'CRM Step 9 — התקנה', alt: 'Installation', kind: 'doc', group: 'crm', audience: 'team', lang: ['he'] },
  'crm-step10-om.html': { title: 'CRM Step 10 — חיבור + O&M', alt: 'Grid connection + O&M', kind: 'doc', group: 'crm', audience: 'team', lang: ['he'] },

  // ── Legal ──
  'epc-contract.html': { title: 'חוזה EPC להקמת מערכת סולארית', alt: 'EPC contract', kind: 'doc', group: 'legal', audience: 'client', lang: ['he'] },
  'ppa-contract.html': { title: 'הסכם רכישת חשמל (PPA)', alt: 'PPA contract', kind: 'doc', group: 'legal', audience: 'client', lang: ['he'] },
  'legal/nda-bustan-energy-template.html': { title: 'NDA template', kind: 'doc', group: 'legal', audience: 'client', lang: ['en'] },
  'legal/nda-bustan-energy-erez-v2.html': { title: 'NDA — Bustan Energy & Erez (v2)', kind: 'doc', group: 'legal', audience: 'internal', lang: ['en'] },

  // ── Tools ──
  'kp-solar-pro.html': { title: 'KP Solar Pro v2', alt: 'Roof scanner + solar atlas (unified)', kind: 'tool', group: 'tools', audience: 'internal', lang: ['en'] },
  'bill-scanner.html': { title: 'Bill scanner & proposal generator', kind: 'tool', group: 'tools', audience: 'team', lang: ['en'] },
  'gis-mapper/index.html': { title: 'GIS mapper — land & roofs', alt: 'Ko Phangan & Samui', kind: 'tool', group: 'tools', audience: 'internal', lang: ['en'] },
  'power-grid-map.html': { title: 'Power grid map — Koh Phangan', kind: 'tool', group: 'tools', audience: 'internal', lang: ['en'] },
  'planning-tracker.html': { title: 'Planning vs execution tracker', kind: 'tool', group: 'tools', audience: 'internal', lang: ['en'] },
  'solar-farm-scout.html': { title: 'Solar farm + storage scout', kind: 'tool', group: 'tools', audience: 'internal', lang: ['en'] },
  'drone-mission-plan.html': { title: 'Drone mission plan', alt: 'תוכנית סריקה אווירית', kind: 'tool', group: 'drone', audience: 'internal', lang: ['he', 'en'] },
  'drone-ops.html': { title: 'Drone ops plan', alt: 'תוכנית סריקת רחפן', kind: 'tool', group: 'drone', audience: 'internal', lang: ['he'] },
  'platform/sales/index.html': { title: 'Sales app (PWA)', kind: 'tool', group: 'sales', audience: 'team', lang: ['en'] },
  'academy/admin.html': { title: 'Academy admin', alt: 'Progress dashboard (auth disabled)', kind: 'tool', group: 'academy', audience: 'internal', lang: ['en'] },
  'landing/solar-savings-calculator.html': { title: 'Solar savings calculator', kind: 'tool', group: 'public', audience: 'client', lang: ['en'] },
  'landing/whatsapp-links.html': { title: 'WhatsApp contact links', kind: 'tool', group: 'public', audience: 'client', lang: ['en'] },
  'rfq-preview.html': { title: 'RFQ email preview', kind: 'proposal', group: 'procurement', audience: 'internal', lang: ['en'] },

  // ── Proposals ──
  'proposal.html': { title: 'Proposal builder (legacy)', kind: 'proposal', group: 'proposals', audience: 'client', lang: ['en'] },
  'proposals/beamtech-001.html': { title: 'Beamtech Residences — proposal 001', kind: 'proposal', group: 'proposals', audience: 'client', lang: ['en'] },
  'proposals/beamtech-001-he.html': { title: 'Beamtech Residences — הצעת מחיר', alt: 'Proposal 001 (Hebrew)', kind: 'proposal', group: 'proposals', audience: 'client', lang: ['he'] },
  'proposals/beamtech-001-th.html': { title: 'Beamtech Residences — ข้อเสนอระบบโซลาร์', alt: 'Proposal 001 (Thai)', kind: 'proposal', group: 'proposals', audience: 'client', lang: ['th'] },
  'proposals/beamtech-002.html': { title: 'Beamtech Residences — proposal 002', kind: 'proposal', group: 'proposals', audience: 'client', lang: ['en'] },
  'proposals/beamtech-aerial.html': { title: 'Beamtech — aerial panel layout', kind: 'proposal', group: 'proposals', audience: 'client', lang: ['en'] },
  'proposals/beamtech-layout.html': { title: 'Beamtech — solar layout plan', kind: 'proposal', group: 'proposals', audience: 'client', lang: ['en'] },
  'proposals/kaniel-villas-001.html': { title: 'Kaniel Villas — proposal 001', kind: 'proposal', group: 'proposals', audience: 'client', lang: ['en'] },
  'proposals/kaniel-villas-001.pdf': { title: 'Kaniel Villas — proposal 001 (PDF)', kind: 'proposal', group: 'proposals', audience: 'client', lang: ['en'] },
  'proposals/tm-factory-001.html': { title: 'TM Concrete Factory — proposal 001', kind: 'proposal', group: 'proposals', audience: 'client', lang: ['en'] },
  'proposals/tm-factory-001.pdf': { title: 'TM Concrete Factory — proposal 001 (PDF)', kind: 'proposal', group: 'proposals', audience: 'client', lang: ['en'] },
  'proposals/concrete-factory-quote.html': { title: 'Concrete factory — PV + battery quote', kind: 'proposal', group: 'proposals', audience: 'client', lang: ['th', 'en'] },
  'proposals/concrete-factory-proposal.md': { title: 'הצעת מחיר — מערכת סולארית + אגירה', alt: 'Concrete factory proposal (source)', kind: 'proposal', group: 'proposals', audience: 'client', lang: ['he'] },

  // ── PEA ──
  'pea-docs/index.html': { title: 'PEA application — 300 kWp concrete factory', kind: 'pea', group: 'pea', audience: 'team', lang: ['en'], hub: true },
  'pea-docs/pea-application-package.html': { title: 'PEA application package — 300 kWp', kind: 'pea', group: 'pea', audience: 'team', lang: ['th'] },
  'pea-docs/pea-summary-beamtech.html': { title: 'PEA summary — Beamtech 32.5 kWp', kind: 'pea', group: 'pea', audience: 'team', lang: ['en'] },
  'pea-docs/layout-beamtech.html': { title: 'Roof layout — Beamtech 32.5 kWp', kind: 'pea', group: 'pea', audience: 'team', lang: ['en'] },
  'pea-docs/sld-beamtech.html': { title: 'SLD — Beamtech 32.5 kWp', kind: 'pea', group: 'pea', audience: 'team', lang: ['en'] },
  'pea-docs/sld-concrete-factory.html': { title: 'SLD — 300 kWp concrete factory', kind: 'pea', group: 'pea', audience: 'team', lang: ['th'] },
  'pea-docs/Layout-Beamtech-32.5kWp.pdf': { title: 'Roof layout — Beamtech (PDF)', kind: 'pea', group: 'pea', audience: 'team', lang: ['en'] },
  'pea-docs/PEA-Summary-Beamtech-32.5kWp.pdf': { title: 'PEA summary — Beamtech (PDF)', kind: 'pea', group: 'pea', audience: 'team', lang: ['en'] },
  'pea-docs/SLD-Beamtech-32.5kWp.pdf': { title: 'SLD — Beamtech (PDF)', kind: 'pea', group: 'pea', audience: 'team', lang: ['en'] },
  'pea-docs/fb-post.html': { title: 'PEA — Facebook post', kind: 'brand', group: 'marketing', audience: 'team', lang: ['en'] },

  // ── Research & plans ──
  'research/README.md': { title: 'Thailand solar farm research — index', kind: 'research', group: 'research', audience: 'internal', lang: ['en'], hub: true },
  'research/VERIFICATION_2026_03.md': { title: 'Research verification — March 2026', kind: 'research', group: 'research', audience: 'internal', lang: ['en'] },
  'research/VERIFICATION_REPORT.md': { title: 'Research verification report', kind: 'research', group: 'research', audience: 'internal', lang: ['en'] },
  'research/VERIFICATION_REPORT_B.md': { title: 'Research verification report B', kind: 'research', group: 'research', audience: 'internal', lang: ['en'] },
  'ev-charging-research.md': { title: 'EV charging & fleet research', kind: 'research', group: 'research', audience: 'internal', lang: ['en'] },
  'academy/research/electrician-training-research.md': { title: 'Electrician training research', kind: 'research', group: 'academy', audience: 'team', lang: ['en'] },
  'drone-surveys/stitching-report.md': { title: 'Drone orthomosaic stitching report', kind: 'research', group: 'drone', audience: 'internal', lang: ['en'] },
  'SCAN_REPORT.md': { title: 'AI building scan report — Koh Phangan', kind: 'research', group: 'plans', audience: 'internal', lang: ['en'] },
  'SCAN_PROCESS.md': { title: 'Solar lead intelligence process', alt: 'SCAN_PROCESS.md', kind: 'doc', group: 'plans', audience: 'internal', lang: ['en'] },
  'DRONE_SCAN_PLAN.md': { title: 'Drone island scan plan', kind: 'doc', group: 'drone', audience: 'internal', lang: ['en'] },
  'DRONE_ORTHOMOSAIC_HANDOFF.md': { title: 'Drone orthomosaic handoff', kind: 'doc', group: 'drone', audience: 'internal', lang: ['en'] },
  'platform/PLATFORM_PLAN.md': { title: 'Platform plan — unified operations system', kind: 'doc', group: 'plans', audience: 'internal', lang: ['en'] },
  'docs/plans/2026-03-13-proposal-v2-design.md': { title: 'Proposal v2 — design (2026-03-13)', kind: 'doc', group: 'plans', audience: 'internal', lang: ['en'] },
  'docs/plans/2026-03-13-proposal-v2-plan.md': { title: 'Proposal v2 — implementation plan (2026-03-13)', kind: 'doc', group: 'plans', audience: 'internal', lang: ['en'] },
  'docs/plans/2026-03-13-solar-intelligence-platform-design.md': { title: 'Solar intelligence platform — design (2026-03-13)', kind: 'doc', group: 'plans', audience: 'internal', lang: ['en'] },
  'docs/plans/2026-03-29-data-cleanup-island-scan.md': { title: 'KP Solar Pro — data cleanup & island scan (2026-03-29)', kind: 'doc', group: 'plans', audience: 'internal', lang: ['en'] },
  'docs/plans/2026-03-29-kp-solar-pro-improvement-design.md': { title: 'KP Solar Pro — improvement design (2026-03-29)', kind: 'doc', group: 'plans', audience: 'internal', lang: ['en'] },

  // ── Brand & marketing ──
  'brand-kit.html': { title: 'Brand kit', kind: 'brand', group: 'brand', audience: 'team', lang: ['he'] },
  'brand-kit/print-templates.html': { title: 'Print-ready templates', kind: 'brand', group: 'brand', audience: 'team', lang: ['en'] },
  'assets/business-cards.html': { title: 'Business cards', kind: 'brand', group: 'brand', audience: 'team', lang: ['en'] },
  'assets/social/fb-post-copy.md': { title: 'Facebook post copy — Koh Phangan real-estate group', kind: 'brand', group: 'marketing', audience: 'team', lang: ['en'] },
  'ads-pro/index.html': { title: 'Ads pro — 8 HTML ad creatives', kind: 'brand', group: 'marketing', audience: 'team', lang: ['en'], hub: true },
  'marketing/index.html': { title: 'Marketing hub — digital assets', kind: 'brand', group: 'marketing', audience: 'team', lang: ['en'], hub: true },
  'marketing/POSTING-GUIDE.md': { title: 'Social media posting guide', kind: 'brand', group: 'marketing', audience: 'team', lang: ['en'] },
  'marketing/social-media-plan.md': { title: '30-day social media plan', kind: 'brand', group: 'marketing', audience: 'team', lang: ['en'] },
  'marketing/social-media-plan-extended.md': { title: 'Extended social media plan (posts 21–45)', kind: 'brand', group: 'marketing', audience: 'team', lang: ['en'] },
  'landing/solar-koh-phangan.html': { title: 'Landing — Solar Koh Phangan', alt: 'Public lead-gen page', kind: 'brand', group: 'public', audience: 'client', lang: ['en'] },
  'academy/emails/welcome-erez.html': { title: 'Academy welcome email (Erez)', kind: 'doc', group: 'academy', audience: 'internal', lang: ['he'] },

  // ── Academy ──
  'academy/index.html': { title: 'Academy hub', alt: '24 lessons · 5 tracks · EN/HE/TH', kind: 'academy', group: 'academy', audience: 'team', lang: ['en', 'he', 'th'], hub: true },
  'academy/SYLLABUS.md': { title: 'Academy syllabus', kind: 'academy', group: 'academy', audience: 'team', lang: ['en'] },
  'academy/VIDEO_LIBRARY.md': { title: 'Academy video library', kind: 'academy', group: 'academy', audience: 'team', lang: ['en'] },

  // ── Blog ──
  'blog/index.html': { title: 'Blog hub', kind: 'blog', group: 'blog', audience: 'client', lang: ['en'], hub: true },
};

// Off-repo links that belong in the catalog.
const EXTERNAL = [
  { title: 'Marketing site', path: 'https://bustan-energy.com', kind: 'brand', group: 'public', audience: 'client', lang: ['en'] },
  { title: 'Bustan Admin', alt: 'Proposals, CRM, analytics', path: 'https://bustan-energy.com/admin', kind: 'tool', group: 'tools', audience: 'internal', lang: ['en', 'he'] },
  { title: 'KP Solar Pro (admin scan)', alt: 'bustan-energy.com/admin/scan', path: 'https://bustan-energy.com/admin/scan', kind: 'tool', group: 'tools', audience: 'internal', lang: ['en'] },
  { title: 'New proposal (v2)', path: 'https://bustan-energy.com/admin/proposals/new', kind: 'tool', group: 'proposals', audience: 'internal', lang: ['he', 'en'] },
  { title: 'CRM', path: 'https://bustan-energy.com/crm', kind: 'tool', group: 'crm', audience: 'team', lang: ['en'] },
  { title: 'Client proposal portal (example)', path: 'https://bustan-energy.com/p/', kind: 'proposal', group: 'proposals', audience: 'client', lang: ['en'] },
  { title: 'Competitor research (full, internal)', alt: 'Koh Phangan / Surat Thani installer landscape, 2026-05-31', path: 'https://bustan-energy.com/bustan-competitor-research-full-internal-2026-05-31.html', kind: 'research', group: 'strategy', audience: 'internal', lang: ['en'], thumb: 'assets/thumbs/ext-competitor-research.webp' },
  { title: 'Drive — project folder', path: 'https://drive.google.com/drive/folders/12hdMH7wDmO3KgEytFPCKR7FoQasSEBNg', kind: 'doc', group: 'plans', audience: 'internal', lang: ['en'] },
  { title: 'GitHub — copenhagen-solar', path: 'https://github.com/kaniel149/copenhagen-solar', kind: 'tool', group: 'tools', audience: 'internal', lang: ['en'] },
  { title: 'GitHub — solar-intelligence (v2)', path: 'https://github.com/kaniel149/solar-intelligence', kind: 'tool', group: 'tools', audience: 'internal', lang: ['en'] },
];

const RESEARCH_TITLES = {
  '01-market-overview': 'Market overview', '02-regulations': 'Regulations', '03-on-grid': 'On-grid', '04-micro-grid-island': 'Micro-grid island',
  '05-permitting': 'Permitting', '06-grid-technical': 'Grid technical', '07-costs-pricing': 'Costs & pricing', '08-bess-storage': 'BESS storage',
  '09-financial-models': 'Financial models', '10-case-studies': 'Case studies', '11-key-players': 'Key players', '12-koh-phangan': 'Koh Phangan',
};
const TRACK_ORDER = { 'solar-fundamentals': 1, technical: 2, 'sales-bd': 3, 'ev-storage': 4, management: 5 };
const PODCAST_TITLES = {
  '01-pnl-business-plan': 'P&L & business plan', '02-strategy': 'Strategy', '03-business-plan': 'Business plan — year 1',
  '04-sales-marketing': 'Sales & marketing', '05-installation': 'Installation', '06-procurement': 'Procurement & engineering',
  '07-legal': 'Legal & contracts', '08-monitoring': 'Monitoring & maintenance', '09-licensing': 'Licensing', '10-financing': 'Financing',
};

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const abs = path.join(dir, e.name), rel = path.relative(ROOT, abs);
    if (EXCLUDE_DIRS.test(rel) || / [23]\./.test(e.name)) continue;
    if (e.isDirectory()) walk(abs, out);
    else if (EXT.has(path.extname(e.name)) && !EXCLUDE_FILES.has(rel)) out.push(rel);
  }
  return out;
}

const HE = /[֐-׿]/, TH = /[฀-๿]/;
function detectLang(text, html) {
  const l = new Set();
  const attr = (html || '').match(/<html[^>]*\slang="([a-z]{2})/i)?.[1];
  if (attr) l.add(attr);
  if (HE.test(text)) l.add('he');
  if (TH.test(text)) l.add('th');
  if (html && /data-he[=>\s]/.test(html) && /data-th[=>\s]/.test(html) && /data-en[=>\s]/.test(html)) { l.add('en'); l.add('he'); l.add('th'); }
  if (!l.size) l.add('en');
  return [...l];
}

function cleanTitle(t) {
  return t.replace(/\s+/g, ' ').replace(/^(Bustan Energy — )+/, '').replace(/ — Bustan Energy( Academy)?$/, '').replace(/ \| Bustan Energy$/, '').trim();
}

function defaults(rel) {
  const base = path.basename(rel), stem = base.replace(/\.[^.]+$/, '');
  if (rel.startsWith('podcasts/')) return { title: PODCAST_TITLES[stem] || stem, alt: `Podcast ${stem.slice(0, 2)}`, kind: 'podcast', group: 'podcasts', audience: 'team', lang: ['en'] };
  if (rel.startsWith('academy/courses/')) return { kind: 'academy', group: 'academy', audience: 'team', lang: ['en', 'he', 'th'] };
  if (rel.startsWith('academy/')) return { kind: 'academy', group: 'academy', audience: 'team' };
  if (rel.startsWith('blog/')) return { kind: 'blog', group: 'blog', audience: 'client', lang: ['en'] };
  if (rel.startsWith('research/')) return { kind: 'research', group: 'research', audience: 'internal', lang: ['en'], title: RESEARCH_TITLES[stem] ? `Thailand solar research ${stem.slice(0, 2)} — ${RESEARCH_TITLES[stem]}` : undefined };
  if (rel.startsWith('marketing/posts/')) return { title: `Post ${stem.replace(/^post-0*(\d+)-(.*)$/, (_, n, s) => `${n} — ${s.replace(/-/g, ' ')}`)}`, kind: 'brand', group: 'marketing', audience: 'team', lang: ['en'] };
  if (rel.startsWith('ads-pro/')) return { title: `Ad creative ${stem.replace('ad', '')}`, kind: 'brand', group: 'marketing', audience: 'team', lang: ['en'] };
  if (rel.startsWith('proposals/')) return { kind: 'proposal', group: 'proposals', audience: 'client' };
  if (rel.startsWith('pea-docs/')) return { kind: 'pea', group: 'pea', audience: 'team' };
  if (rel.startsWith('presentations/')) return { kind: 'deck', group: 'presentations', audience: 'client' };
  if (rel.startsWith('docs/plans/')) return { kind: 'doc', group: 'plans', audience: 'internal', lang: ['en'] };
  return { kind: 'doc', group: 'docs', audience: 'internal' };
}

function readTitle(rel) {
  const abs = path.join(ROOT, rel), ext = path.extname(rel);
  if (ext === '.html') {
    const html = fs.readFileSync(abs, 'utf8');
    const t = html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1] || '';
    const h1 = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1]?.replace(/<[^>]+>/g, '') || '';
    return { title: cleanTitle(t || h1 || path.basename(rel)), html };
  }
  if (ext === '.md') {
    const md = fs.readFileSync(abs, 'utf8');
    const h = md.match(/^#\s+(.+)$/m)?.[1] || path.basename(rel);
    return { title: cleanTitle(h.replace(/^Bustan Energy — /, '')), html: null, text: md.slice(0, 2000) };
  }
  return { title: path.basename(rel), html: null };
}

function updated(rel) {
  try {
    const abs = path.join(ROOT, rel);
    if (/\.html?$/i.test(rel)) {
      const m = fs.readFileSync(abs, 'utf8').slice(0, 8000).match(/<meta\s+name=["']content-updated["']\s+content=["'](\d{4}-\d{2}-\d{2})["']/i);
      if (m) return m[1];
    }
  } catch {}
  try { return execFileSync('git', ['log', '-1', '--format=%cs', '--', rel], { cwd: ROOT }).toString().trim() || null; } catch { return null; }
}

const thumbFor = (rel) => {
  const slug = rel.replace(/\/index\.html$/, '').replace(/\.html$/, '').replace(/\//g, '-');
  const p = `assets/thumbs/${slug}.webp`;
  return fs.existsSync(path.join(ROOT, p)) ? p : undefined;
};

const coverPhotos = {"strategy": "drone-imagery/DJI_20260327112929_0021_D.webp", "ops": "drone-imagery/DJI_20260327110028_0002_D.webp", "sales": "drone-imagery/DJI_20260327110222_0003_D.webp", "legal": "drone-imagery/DJI_20260327112912_0020_D.webp", "presentations": "drone-imagery/DJI_20260327112800_0013_D.webp"};
const entries = [];
for (const rel of walk(ROOT).sort()) {
  const d = defaults(rel), c = CURATED[rel] || {};
  const { title, html, text } = readTitle(rel);
  const finalTitle = c.title || d.title || title;
  const lang = c.lang || d.lang || detectLang(`${finalTitle} ${text || ''}`, html);
  const e = {
    title: finalTitle, path: rel, kind: c.kind || d.kind, group: c.group || d.group, lang,
    audience: c.audience || d.audience, updated: updated(rel), size: fs.statSync(path.join(ROOT, rel)).size,
  };
  if (c.alt || d.alt) e.alt = c.alt || d.alt;
  if (c.hub) e.hub = true;
  if (c.playbook) e.playbook = true;
  if ((e.kind === 'deck' && !e.hub) || e.playbook) e.cover = coverPhotos[e.group] || coverPhotos.presentations;
  else { const th = c.thumb || thumbFor(rel); if (th) e.thumb = th; }
  if (c.note) e.note = c.note;
  if (rel.startsWith('academy/courses/')) {
    const m = rel.match(/courses\/([a-z-]+?)-(\d{2})\.html$/);
    e.track = m[1]; e.num = Number(m[2]); e.title = title.replace(/^Lesson \d+: /, '');
    e.alt = `${e.track.replace(/-/g, ' ')} · lesson ${e.num}`;
  }
  entries.push(e);
}
for (const x of EXTERNAL) entries.push({ ...x, external: true });

const KIND_ORDER = ['deck', 'doc', 'academy', 'tool', 'proposal', 'pea', 'research', 'podcast', 'brand', 'blog'];
const sortKey = (e) => e.track ? `1-${TRACK_ORDER[e.track]}-${String(e.num).padStart(2, '0')}` : e.kind === 'podcast' ? `1-${e.path}` : e.hub ? '0' : `2-${e.title}`;
entries.sort((a, b) => KIND_ORDER.indexOf(a.kind) - KIND_ORDER.indexOf(b.kind) || a.group.localeCompare(b.group) || sortKey(a).localeCompare(sortKey(b), undefined, { numeric: true }));

const out = { generated: new Date().toISOString().slice(0, 10), count: entries.length, entries };
fs.writeFileSync(path.join(ROOT, 'catalog.json'), JSON.stringify(out, null, 1) + '\n');
// ---- static (no-JS) catalog markup, spliced into index.html between the catalog:static markers ----
const KIND_LABEL = { deck: 'Presentations', doc: 'Playbooks & documents', academy: 'Academy', tool: 'Tools', proposal: 'Proposals', pea: 'PEA & grid', research: 'Research', podcast: 'Podcasts', brand: 'Brand & marketing', blog: 'Blog' };
const KIND_ICON = { deck: 'deck', doc: 'doc', academy: 'academy', tool: 'tool', proposal: 'proposal', pea: 'pea', research: 'research', podcast: 'podcast', brand: 'brand', blog: 'blog' };
const AUD_LABEL = { internal: 'Internal', team: 'Team', client: 'Client', investor: 'Investor' };
const GH = 'https://github.com/kaniel149/bustan-index/blob/main/';
const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const hrefFor = (e) => e.external ? e.path : /\.md$/i.test(e.path) ? GH + e.path : e.path;
const dirAttr = (v) => /[\u0590-\u05FF]/.test(v) ? ' dir="rtl"' : ' dir="auto"';
const ic = (n) => `<svg class="i" aria-hidden="true"><use href="#i-${n}"/></svg>`;
const tags = (e) => `<div class="tags">${e.lang.map((l) => `<span class="tag tag-lang">${l}</span>`).join('')}<span class="tag">${AUD_LABEL[e.audience]}</span>${e.group && e.group !== e.kind ? `<span class="tag">${esc(e.group)}</span>` : ''}${e.note ? `<span class="tag tag-warn">${esc(e.note)}</span>` : ''}</div>`;
const row = (e) => {
  const ext = e.external || /\.md$/i.test(e.path);
  const audio = e.kind === 'podcast' && !e.external ? `<div class="row-audio"><audio controls preload="none" src="${esc(e.path)}"></audio></div>` : '';
  return `<a class="row" href="${esc(hrefFor(e))}"${ext ? ' target="_blank" rel="noopener"' : ''}>${ic(e.kind === 'podcast' ? 'podcast' : /\.(pdf|xlsx|csv)$/i.test(e.path) ? 'file' : e.hub ? 'globe' : KIND_ICON[e.kind])}<div><div class="row-title"${dirAttr(e.title)}>${esc(e.title)}</div>${e.alt ? `<div class="row-sub"${dirAttr(e.alt)}>${esc(e.alt)}</div>` : ''}</div>${tags(e)}<div class="row-date">${e.updated || ''}</div>${ic(ext ? 'ext' : 'arrow')}${audio}</a>`;
};
const deck = (e) => `<div class="card deck-card"><a class="deck-thumb" href="${esc(hrefFor(e))}"${e.external ? ' target="_blank" rel="noopener"' : ''} aria-label="${esc(e.title)}">${e.cover ? `<img src="${esc(e.cover)}" alt="" loading="lazy" width="640" height="360">` : e.thumb ? `<img src="${esc(e.thumb)}" alt="" loading="lazy" width="640" height="360">` : ''}</a><div class="deck-body"><h3 class="card-title"${dirAttr(e.title)}>${esc(e.title)}</h3>${e.alt ? `<p class="card-sub"${dirAttr(e.alt)}>${esc(e.alt)}</p>` : ''}<div class="tags" style="margin-top:14px">${e.lang.map((l) => `<span class="tag tag-lang">${l}</span>`).join('')}<span class="tag">${AUD_LABEL[e.audience]}</span>${e.note ? `<span class="tag tag-warn">${esc(e.note)}</span>` : ''}</div><div class="deck-actions"><a class="btn btn-sm" href="${esc(hrefFor(e))}"${e.external ? ' target="_blank" rel="noopener"' : ''}>${ic(e.external ? 'ext' : 'arrow')}<span>Open</span></a></div></div></div>`;
const staticHTML = KIND_ORDER.map((k) => {
  const items = entries.filter((e) => e.kind === k);
  if (!items.length) return '';
  const body = k === 'deck' ? `<div class="cat-grid">${items.filter((e) => !e.hub).map(deck).join('')}</div>${items.filter((e) => e.hub).map(row).join('')}` : items.map(row).join('');
  return `<section class="cat-group" id="g-${k}"><div class="cat-head"><div class="cat-head-inner"><h2>${ic(KIND_ICON[k])}${KIND_LABEL[k]}</h2><span class="n">${items.length}</span></div></div><div class="cat-list">${body}</div></section>`;
}).join('\n');
const indexPath = path.join(ROOT, 'index.html');
const indexHTML = fs.readFileSync(indexPath, 'utf8');
const START = '<!-- catalog:static:start', END = '<!-- catalog:static:end -->';
const a = indexHTML.indexOf(START), b = indexHTML.indexOf(END);
if (a < 0 || b < 0) throw new Error('index.html: catalog:static markers not found');
const startLineEnd = indexHTML.indexOf('-->', a) + 3;
fs.writeFileSync(indexPath, indexHTML.slice(0, startLineEnd) + '\n' + staticHTML + '\n' + indexHTML.slice(b));

const byKind = {}; for (const e of entries) byKind[e.kind] = (byKind[e.kind] || 0) + 1;
console.log(`catalog.json: ${entries.length} entries`, byKind);
