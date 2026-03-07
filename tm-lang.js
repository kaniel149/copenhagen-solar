/* TM Energy Tri-Lingual Engine v2
   Translates h2/h3 headers, changes direction, shows language prominently */
(function(){
  // Translation dictionary: Hebrew → {en, th}
  const T = {
    // Strategy
    'ההזדמנות': {en:'The Opportunity',th:'โอกาส'},
    'גודל השוק': {en:'Market Size',th:'ขนาดตลาด'},
    'מפת תחרות': {en:'Competitive Landscape',th:'ภูมิทัศน์การแข่งขัน'},
    'מודל עסקי': {en:'Business Model',th:'โมเดลธุรกิจ'},
    'מימון ומבנה משפטי': {en:'Financing & Legal',th:'การเงินและกฎหมาย'},
    'שרשרת אספקה': {en:'Supply Chain',th:'ห่วงโซ่อุปทาน'},
    'אסטרטגיית שיווק': {en:'Marketing Strategy',th:'กลยุทธ์การตลาด'},
    'חבילות תמחור': {en:'Pricing Packages',th:'แพ็คเกจราคา'},
    'מה מוכן עכשיו': {en:'Deliverables',th:'สิ่งที่พร้อม'},
    'מקורות ושיטת מחקר': {en:'Sources & Methodology',th:'แหล่งข้อมูล'},
    // Business Plan
    'תוכנית עסקית': {en:'Business Plan',th:'แผนธุรกิจ'},
    'תחזית הכנסות': {en:'Revenue Forecast',th:'คาดการณ์รายได้'},
    'תזרים מזומנים': {en:'Cash Flow',th:'กระแสเงินสด'},
    'מבנה צוות': {en:'Team Structure',th:'โครงสร้างทีม'},
    'סיכום': {en:'Summary',th:'สรุป'},
    'אסטרטגיית תמחור': {en:'Pricing Strategy',th:'กลยุทธ์ราคา'},
    'סיכונים': {en:'Risks',th:'ความเสี่ยง'},
    // Sales & Marketing
    'שיווק ומכירות': {en:'Sales & Marketing',th:'การขายและการตลาด'},
    'ערוצי שיווק': {en:'Marketing Channels',th:'ช่องทางการตลาด'},
    'אסטרטגיית מכירות': {en:'Sales Strategy',th:'กลยุทธ์การขาย'},
    'תקציב שיווק': {en:'Marketing Budget',th:'งบประมาณการตลาด'},
    'תוכן ומסרים': {en:'Content & Messaging',th:'เนื้อหาและข้อความ'},
    'KPIs ויעדים': {en:'KPIs & Goals',th:'ตัวชี้วัดและเป้าหมาย'},
    // Installation
    'תהליך הקמה': {en:'Installation Process',th:'ขั้นตอนการติดตั้ง'},
    'סקר גג': {en:'Roof Survey',th:'สำรวจหลังคา'},
    'קונסטרוקציה': {en:'Construction',th:'การก่อสร้าง'},
    'חיבור לרשת': {en:'Grid Connection',th:'เชื่อมต่อกริด'},
    'בטיחות': {en:'Safety',th:'ความปลอดภัย'},
    'בדיקות והפעלה': {en:'Testing & Commissioning',th:'ทดสอบและเปิดใช้'},
    'בקרת איכות': {en:'Quality Control',th:'ควบคุมคุณภาพ'},
    // Procurement
    'רכש והנדסה': {en:'Procurement & Engineering',th:'จัดซื้อและวิศวกรรม'},
    'ציוד ומפרט': {en:'Equipment & Specs',th:'อุปกรณ์'},
    'מבנה עלויות': {en:'Cost Structure',th:'โครงสร้างต้นทุน'},
    'לוגיסטיקה': {en:'Logistics',th:'โลจิสติกส์'},
    // Legal
    'חוזים והסכמים': {en:'Contracts & Agreements',th:'สัญญาและข้อตกลง'},
    'הסכם תחזוקה': {en:'Maintenance Agreement',th:'สัญญาบำรุงรักษา'},
    'אחריות': {en:'Warranty',th:'การรับประกัน'},
    'ביטוח': {en:'Insurance',th:'ประกันภัย'},
    'מיסוי': {en:'Taxation',th:'ภาษี'},
    'יישוב סכסוכים': {en:'Dispute Resolution',th:'การระงับข้อพิพาท'},
    // Monitoring
    'ניטור ותחזוקה': {en:'Monitoring & Maintenance',th:'ติดตามและบำรุงรักษา'},
    'תחזוקה מונעת': {en:'Preventive Maintenance',th:'บำรุงรักษาเชิงป้องกัน'},
    'חבילות O&M': {en:'O&M Packages',th:'แพ็คเกจ O&M'},
    'התראות': {en:'Alerts',th:'แจ้งเตือน'},
    'הכנסה חוזרת': {en:'Recurring Revenue',th:'รายได้ประจำ'},
    // Licensing
    'רישוי ורגולציה': {en:'Licensing & Regulation',th:'ใบอนุญาตและกฎระเบียบ'},
    'תהליך רישוי': {en:'Licensing Process',th:'ขั้นตอนการขอใบอนุญาต'},
    'מיסוי סולאר': {en:'Solar Taxation',th:'ภาษีโซลาร์'},
    'רישום חברה': {en:'Company Registration',th:'จดทะเบียนบริษัท'},
    'אנשי קשר': {en:'Contacts',th:'ติดต่อ'},
    // Financing
    'מימון': {en:'Financing',th:'การเงิน'},
    'מקורות מימון': {en:'Funding Sources',th:'แหล่งเงินทุน'},
    'הלוואות': {en:'Loans',th:'สินเชื่อ'},
    'הטבות מס': {en:'Tax Incentives',th:'สิทธิประโยชน์ทางภาษี'},
    'ESCO': {en:'ESCO Model',th:'โมเดล ESCO'},
    'סיכום מימון': {en:'Financing Summary',th:'สรุปการเงิน'},
    // P&L
    'הוצאות תפעוליות': {en:'Operating Expenses',th:'ค่าดำเนินงาน'},
    'כוח אדם': {en:'Workforce',th:'กำลังคน'},
    'שלושה מסלולי הכנסה': {en:'Three Revenue Streams',th:'สามช่องทางรายได้'},
    'תחזית 5 שנים': {en:'5-Year Forecast',th:'คาดการณ์ 5 ปี'},
    'מעקב ביצועים': {en:'Performance Tracking',th:'ติดตามผลงาน'},
    // General
    'לוח זמנים': {en:'Timeline',th:'ไทม์ไลน์'},
    'צ\'קליסט': {en:'Checklist',th:'เช็คลิสต์'},
  };

  let currentLang = 'he';
  const originals = new Map();

  function setLang(lang) {
    currentLang = lang;
    localStorage.setItem('tm-lang', lang);
    
    // Update buttons
    document.querySelectorAll('.lang-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.l === lang);
    });

    // Update body direction
    document.body.style.direction = lang === 'he' ? 'rtl' : 'ltr';
    
    // Update all h2 and h3 elements
    document.querySelectorAll('h2, h3').forEach(el => {
      // Store original Hebrew text
      if (!originals.has(el)) {
        originals.set(el, el.innerHTML);
      }
      
      const orig = originals.get(el);
      // Extract pure text for matching (strip HTML tags and emojis for lookup)
      const textOnly = orig.replace(/<[^>]*>/g, '').replace(/[\u{1F300}-\u{1FAFF}]/gu, '').trim();
      
      if (lang === 'he') {
        el.innerHTML = orig;
        el.style.direction = 'rtl';
        el.style.textAlign = 'right';
      } else {
        // Find matching translation
        let found = null;
        for (const [he, trans] of Object.entries(T)) {
          if (textOnly.includes(he)) {
            found = trans;
            break;
          }
        }
        
        if (found) {
          const transText = lang === 'en' ? found.en : found.th;
          // Show translation prominently with Hebrew small below
          el.innerHTML = `<span style="display:block">${transText}</span><span style="display:block;font-size:0.5em;opacity:0.4;margin-top:2px">${textOnly}</span>`;
          el.style.direction = 'ltr';
          el.style.textAlign = 'left';
        } else {
          el.innerHTML = orig;
          el.style.direction = lang === 'he' ? 'rtl' : 'ltr';
          el.style.textAlign = lang === 'he' ? 'right' : 'left';
        }
      }
    });

    // Update slide direction
    document.querySelectorAll('.slide, .container').forEach(el => {
      el.style.direction = lang === 'he' ? 'rtl' : 'ltr';
      el.style.textAlign = lang === 'he' ? 'right' : 'left';
    });
    
    // Update tables
    document.querySelectorAll('th').forEach(th => {
      th.style.textAlign = lang === 'he' ? 'right' : 'left';
    });

    // Show language indicator
    let indicator = document.getElementById('lang-indicator');
    if (!indicator) {
      indicator = document.createElement('div');
      indicator.id = 'lang-indicator';
      indicator.style.cssText = 'position:fixed;bottom:20px;right:20px;z-index:999;padding:8px 16px;border-radius:8px;font-size:12px;font-weight:700;pointer-events:none;transition:all .3s';
      document.body.appendChild(indicator);
    }
    const labels = {he:'עברית 🇮🇱',en:'English 🇬🇧',th:'ภาษาไทย 🇹🇭'};
    const colors = {he:'rgba(0,56,184,.8)',en:'rgba(0,82,33,.8)',th:'rgba(164,30,30,.8)'};
    indicator.textContent = labels[lang];
    indicator.style.background = colors[lang];
    indicator.style.color = 'white';
    
    // Fade out after 2s
    clearTimeout(indicator._timer);
    indicator.style.opacity = '1';
    indicator._timer = setTimeout(() => { indicator.style.opacity = '0'; }, 2000);
  }

  // Make global
  window.setLang = setLang;

  // Restore saved language
  const saved = localStorage.getItem('tm-lang');
  if (saved && saved !== 'he') {
    // Small delay to ensure DOM is ready
    setTimeout(() => setLang(saved), 100);
  }
})();
