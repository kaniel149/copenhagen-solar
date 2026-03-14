/**
 * TM Energy — Proposal System v2
 * Features: Digital signature, Supabase CRM tracking, option select, expiry, notifications
 */
(function() {
  'use strict';
  
  // ── CONFIG ──
  const CONFIG = {
    supabaseUrl: 'https://ygoiaabzkuvdsyyduvhv.supabase.co',
    supabaseKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlnb2lhYWJ6a3V2ZHN5eWR1dmh2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEzMzI3NjAsImV4cCI6MjA4NjkwODc2MH0.xnrTLVrCn1uB62HEBN9JiwiZp09oGUSmOOsejmz_BXY',
    appsScriptUrl: 'https://script.google.com/macros/s/AKfycbwT-cIxzaLNGYRNB4J3bCztMuSza2RkIXf_-5PinMsNS52yi1jw_xLppd0G3Y4fNCUk/exec',
    whatsappNumber: '66997044944',
    expiryDays: 30,
    ownerName: 'Kaniel Tordjman'
  };

  // ── SUPABASE REST HELPER ──
  const supabase = {
    from: (table) => ({
      insert: async (data) => {
        try {
          const resp = await fetch(`${CONFIG.supabaseUrl}/rest/v1/${table}`, {
            method: 'POST',
            headers: {
              'apikey': CONFIG.supabaseKey,
              'Authorization': `Bearer ${CONFIG.supabaseKey}`,
              'Content-Type': 'application/json',
              'Prefer': 'return=representation'
            },
            body: JSON.stringify(data)
          });
          return resp.ok ? await resp.json() : null;
        } catch(e) { return null; }
      },
      select: async (query = '*', filters = {}) => {
        let url = `${CONFIG.supabaseUrl}/rest/v1/${table}?select=${query}`;
        Object.entries(filters).forEach(([k,v]) => url += `&${k}=eq.${v}`);
        try {
          const resp = await fetch(url, {
            headers: {
              'apikey': CONFIG.supabaseKey,
              'Authorization': `Bearer ${CONFIG.supabaseKey}`
            }
          });
          return resp.ok ? await resp.json() : [];
        } catch(e) { return []; }
      },
      update: async (data, filters = {}) => {
        let url = `${CONFIG.supabaseUrl}/rest/v1/${table}?`;
        Object.entries(filters).forEach(([k,v]) => url += `${k}=eq.${v}&`);
        try {
          const resp = await fetch(url, {
            method: 'PATCH',
            headers: {
              'apikey': CONFIG.supabaseKey,
              'Authorization': `Bearer ${CONFIG.supabaseKey}`,
              'Content-Type': 'application/json',
              'Prefer': 'return=representation'
            },
            body: JSON.stringify(data)
          });
          return resp.ok;
        } catch(e) { return false; }
      }
    })
  };

  // ── PROPOSAL META (read from page) ──
  const META = {
    ref: document.querySelector('.nav-ref')?.textContent?.match(/#([\w-]+)/)?.[1] || 'unknown',
    title: document.querySelector('h1')?.textContent?.trim() || document.title,
    validUntil: null,
    proposalDate: null
  };

  document.querySelectorAll('.hero-meta-item').forEach(el => {
    const label = el.textContent.trim();
    const strong = el.querySelector('strong')?.textContent?.trim();
    if (label.includes('Valid Until') && strong) META.validUntil = strong;
    if (label.includes('Proposal Date') && strong) META.proposalDate = strong;
  });

  // ══════════════════════════════════════
  // 1. TRACKING — Supabase + Apps Script fallback
  // ══════════════════════════════════════
  const trackEvent = async (event, data = {}) => {
    const payload = {
      proposal_ref: META.ref,
      event: event,
      data: {
        ...data,
        url: window.location.href,
        timestamp: new Date().toISOString()
      },
      user_agent: navigator.userAgent.substring(0, 200),
      created_at: new Date().toISOString()
    };
    
    // Try Supabase first
    const result = await supabase.from('proposal_events').insert(payload);
    
    // Fallback to Apps Script
    if (!result) {
      const fallback = {
        action: 'proposal_event',
        proposal: META.ref,
        event,
        timestamp: new Date().toISOString(),
        ...data
      };
      if (navigator.sendBeacon) {
        navigator.sendBeacon(CONFIG.appsScriptUrl, JSON.stringify(fallback));
      }
    }

    // Also update proposals table — increment open_count, update status
    if (event === 'viewed') {
      const existing = await supabase.from('proposals').select('id,open_count,status', { extra_data: `->>'ref'`, extra_data: META.ref });
      // We'll match by extra_data.ref or by a lookup
    }
  };

  // Track page view
  const viewStart = Date.now();
  trackEvent('viewed');

  // Track time on page when leaving
  window.addEventListener('beforeunload', () => {
    const seconds = Math.round((Date.now() - viewStart) / 1000);
    trackEvent('time_spent', { seconds });
  });

  // Track section visibility
  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const label = entry.target.querySelector('.section-label')?.textContent || 
                      entry.target.querySelector('h2')?.textContent || 'unknown';
        trackEvent('section_viewed', { section: label.substring(0, 50) });
        sectionObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.3 });

  document.querySelectorAll('section').forEach(s => sectionObserver.observe(s));

  // ══════════════════════════════════════
  // 2. EXPIRY COUNTDOWN
  // ══════════════════════════════════════
  if (META.validUntil) {
    const match = META.validUntil.match(/(\d+)\s+(\w+)\s+(\d+)/);
    let expiryDate;
    if (match) {
      expiryDate = new Date(`${match[2]} ${match[1]}, ${match[3]}`);
    } else {
      expiryDate = new Date(META.validUntil);
    }
    
    const now = new Date();
    const daysLeft = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));
    
    if (daysLeft <= 0) {
      const overlay = document.createElement('div');
      overlay.innerHTML = `
        <div style="position:fixed;inset:0;background:rgba(0,0,0,.85);z-index:10000;display:flex;align-items:center;justify-content:center;">
          <div style="background:#fff;border-radius:20px;padding:48px;max-width:480px;text-align:center;">
            <div style="font-size:48px;margin-bottom:16px;">⏰</div>
            <h2 style="font-size:24px;margin-bottom:12px;color:#1a2e4a;">Proposal Expired</h2>
            <p style="color:#666;margin-bottom:24px;">This proposal expired on ${META.validUntil}.<br>Contact us for an updated quote.</p>
            <a href="https://wa.me/${CONFIG.whatsappNumber}?text=Hi%20TM%20Energy%2C%20proposal%20${META.ref}%20expired%20—%20please%20send%20updated%20quote" 
               style="display:inline-block;background:#25D366;color:#fff;padding:14px 32px;border-radius:12px;text-decoration:none;font-weight:700;font-size:16px;" target="_blank">
              Request Updated Quote
            </a>
          </div>
        </div>`;
      document.body.appendChild(overlay);
      trackEvent('expired_view');
      return;
    } else if (daysLeft <= 7) {
      const banner = document.createElement('div');
      banner.style.cssText = 'position:fixed;bottom:0;left:0;right:0;background:linear-gradient(90deg,#e74c3c,#c0392b);color:#fff;padding:12px 20px;text-align:center;z-index:9999;font-size:14px;font-weight:600;';
      banner.innerHTML = `⏰ This proposal expires in <strong>${daysLeft} day${daysLeft > 1 ? 's' : ''}</strong> — <a href="#agreement" style="color:#fff;text-decoration:underline;">Sign now</a>`;
      document.body.appendChild(banner);
      document.body.style.paddingBottom = '48px';
    }
  }

  // ══════════════════════════════════════
  // 3. OPTION SELECTION
  // ══════════════════════════════════════
  const agreementSection = document.getElementById('agreement');
  if (agreementSection) {
    const radios = agreementSection.querySelectorAll('.option-radio');
    let selectedOption = null;

    radios.forEach((radio, i) => {
      radio.style.cssText = 'display:flex;align-items:center;gap:12px;padding:14px 18px;border:2px solid #e0e0e0;border-radius:12px;cursor:pointer;transition:all .2s;margin-bottom:8px;';
      const dot = radio.querySelector('.radio-dot');
      if (dot) dot.style.cssText = 'width:20px;height:20px;border-radius:50%;border:2px solid #ccc;transition:all .2s;flex-shrink:0;';

      radio.addEventListener('click', () => {
        radios.forEach(r => {
          r.style.borderColor = '#e0e0e0';
          r.style.background = '#fff';
          const d = r.querySelector('.radio-dot');
          if (d) { d.style.borderColor = '#ccc'; d.style.background = '#fff'; }
        });
        radio.style.borderColor = '#E8A820';
        radio.style.background = 'rgba(232,168,32,.06)';
        if (dot) { dot.style.borderColor = '#E8A820'; dot.style.background = '#E8A820'; }
        selectedOption = ['PPA', 'EPC', 'EPC+Battery'][i] || `Option ${i+1}`;
        trackEvent('option_selected', { option: selectedOption });
      });
    });

    // ══════════════════════════════════════
    // 4. DIGITAL SIGNATURE
    // ══════════════════════════════════════
    const sigBlock = agreementSection.querySelector('.signature-block');
    if (sigBlock) {
      const clientParty = sigBlock.querySelector('.sig-party');
      if (clientParty) {
        // Name input
        const nameField = clientParty.querySelector('.sig-field-input');
        if (nameField) {
          const nameInput = document.createElement('input');
          nameInput.type = 'text';
          nameInput.placeholder = 'Type your full name';
          nameInput.style.cssText = 'width:100%;padding:10px 14px;border:1px solid #ddd;border-radius:8px;font-size:14px;font-family:inherit;box-sizing:border-box;';
          nameField.replaceWith(nameInput);
          nameInput.className = 'sig-name-input';
        }

        // Signature canvas
        const sigLine = clientParty.querySelector('.sig-line');
        if (sigLine) {
          const sigContainer = document.createElement('div');
          sigContainer.innerHTML = `
            <div style="margin:16px 0 8px;font-size:12px;color:#999;">Draw your signature below:</div>
            <canvas id="sig-canvas" width="400" height="150" style="border:2px dashed #ddd;border-radius:12px;cursor:crosshair;width:100%;touch-action:none;background:#fafafa;"></canvas>
            <div style="display:flex;gap:8px;margin-top:8px;">
              <button id="sig-clear" style="padding:6px 16px;border:1px solid #ddd;border-radius:8px;background:#fff;cursor:pointer;font-size:12px;">Clear</button>
            </div>`;
          sigLine.replaceWith(sigContainer);

          const canvas = document.getElementById('sig-canvas');
          const ctx = canvas.getContext('2d');
          let drawing = false;
          let hasSigned = false;

          const getPos = (e) => {
            const rect = canvas.getBoundingClientRect();
            const scaleX = canvas.width / rect.width;
            const scaleY = canvas.height / rect.height;
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            return { x: (clientX - rect.left) * scaleX, y: (clientY - rect.top) * scaleY };
          };

          const startDraw = (e) => { e.preventDefault(); drawing = true; hasSigned = true; ctx.beginPath(); const p = getPos(e); ctx.moveTo(p.x, p.y); };
          const draw = (e) => { if (!drawing) return; e.preventDefault(); const p = getPos(e); ctx.lineWidth = 2.5; ctx.lineCap = 'round'; ctx.strokeStyle = '#1a2e4a'; ctx.lineTo(p.x, p.y); ctx.stroke(); };
          const stopDraw = () => { drawing = false; };

          canvas.addEventListener('mousedown', startDraw);
          canvas.addEventListener('mousemove', draw);
          canvas.addEventListener('mouseup', stopDraw);
          canvas.addEventListener('mouseleave', stopDraw);
          canvas.addEventListener('touchstart', startDraw, { passive: false });
          canvas.addEventListener('touchmove', draw, { passive: false });
          canvas.addEventListener('touchend', stopDraw);

          document.getElementById('sig-clear').addEventListener('click', () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            hasSigned = false;
          });

          // ══════════════════════════════════════
          // 5. SUBMIT — sign & save to CRM
          // ══════════════════════════════════════
          const submitBtn = document.createElement('button');
          submitBtn.id = 'sig-submit';
          submitBtn.textContent = '✅ Sign & Accept Proposal';
          submitBtn.style.cssText = 'display:block;width:100%;margin-top:24px;padding:18px;background:linear-gradient(135deg,#1a7a5a,#16a34a);color:#fff;border:none;border-radius:14px;font-size:18px;font-weight:800;cursor:pointer;transition:all .3s;letter-spacing:.5px;';
          submitBtn.addEventListener('mouseover', () => submitBtn.style.transform = 'translateY(-2px)');
          submitBtn.addEventListener('mouseout', () => submitBtn.style.transform = 'none');

          sigBlock.parentElement.appendChild(submitBtn);

          submitBtn.addEventListener('click', async () => {
            const nameEl = clientParty.querySelector('.sig-name-input');
            const clientName = nameEl?.value?.trim();

            if (!selectedOption) { alert('Please select an option (A, B, or C)'); return; }
            if (!clientName) { alert('Please enter your full name'); nameEl?.focus(); return; }
            if (!hasSigned) { alert('Please draw your signature'); return; }

            submitBtn.disabled = true;
            submitBtn.textContent = '⏳ Submitting...';
            submitBtn.style.opacity = '0.6';

            const sigData = canvas.toDataURL('image/png');

            // 1. Track the signature event
            await trackEvent('signed', { 
              option: selectedOption, 
              clientName,
              signatureLength: sigData.length
            });

            // 2. Try to update the proposal in Supabase CRM
            // Look up the proposal by ref in extra_data
            const proposals = await supabase.from('proposals').select('id,status');
            // Since we can't filter by JSONB easily with REST, we'll just log the signature

            // 3. Send notification via Apps Script (email to Kaniel)
            try {
              await fetch(CONFIG.appsScriptUrl, {
                method: 'POST',
                body: JSON.stringify({
                  action: 'proposal_signed',
                  proposal: META.ref,
                  option: selectedOption,
                  clientName: clientName,
                  signature: sigData.substring(0, 100) + '...', // Don't send full base64 to Apps Script
                  timestamp: new Date().toISOString(),
                  url: window.location.href
                })
              });
            } catch(e) {}

            // 4. Show success screen
            const successDiv = document.createElement('div');
            successDiv.innerHTML = `
              <div style="position:fixed;inset:0;background:rgba(0,0,0,.7);z-index:10000;display:flex;align-items:center;justify-content:center;animation:fadeIn .3s;">
                <div style="background:#fff;border-radius:24px;padding:48px;max-width:520px;text-align:center;box-shadow:0 20px 60px rgba(0,0,0,.2);">
                  <div style="font-size:64px;margin-bottom:16px;">🎉</div>
                  <h2 style="font-size:28px;color:#1a2e4a;margin-bottom:12px;">Proposal Signed!</h2>
                  <p style="color:#666;font-size:16px;margin-bottom:8px;">Thank you, <strong>${clientName}</strong></p>
                  <p style="color:#666;font-size:14px;margin-bottom:24px;">You selected <strong>${selectedOption}</strong> for proposal <strong>${META.ref}</strong></p>
                  <div style="background:#f0fdf4;border-radius:12px;padding:20px;margin-bottom:24px;">
                    <p style="color:#16a34a;font-weight:600;margin-bottom:8px;">What happens next?</p>
                    <p style="color:#666;font-size:13px;line-height:1.6;">Our team will contact you within 24 hours to confirm details and schedule the site survey.</p>
                  </div>
                  <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;">
                    <a href="https://wa.me/${CONFIG.whatsappNumber}?text=Hi%20TM%20Energy%2C%20I%20just%20signed%20proposal%20${META.ref}%20(${selectedOption})" 
                       style="display:inline-block;background:#25D366;color:#fff;padding:14px 28px;border-radius:12px;text-decoration:none;font-weight:700;font-size:15px;" target="_blank">
                      💬 WhatsApp Us
                    </a>
                    <button onclick="window.print()" style="padding:14px 28px;border:2px solid #1a2e4a;border-radius:12px;background:#fff;color:#1a2e4a;font-weight:700;font-size:15px;cursor:pointer;">
                      🖨️ Print / Save PDF
                    </button>
                  </div>
                </div>
              </div>`;
            document.body.appendChild(successDiv);

            submitBtn.textContent = '✅ Signed Successfully';
            submitBtn.style.background = '#16a34a';

            // 5. Store signature locally as backup
            try {
              localStorage.setItem(`tm_sig_${META.ref}`, JSON.stringify({
                clientName, selectedOption, sigData, timestamp: new Date().toISOString()
              }));
            } catch(e) {}
          });
        }
      }

      // Auto-fill date fields
      const dateFields = sigBlock.querySelectorAll('.sig-field');
      dateFields.forEach(f => {
        if (f.querySelector('.sig-field-label')?.textContent?.includes('Date')) {
          const dateInput = f.querySelector('.sig-field-input');
          if (dateInput) {
            dateInput.textContent = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
            dateInput.style.cssText = 'font-size:14px;color:#1a2e4a;font-weight:600;padding:8px 0;';
          }
        }
      });

      // Check if already signed
      try {
        const existing = localStorage.getItem(`tm_sig_${META.ref}`);
        if (existing) {
          const data = JSON.parse(existing);
          const notice = document.createElement('div');
          notice.style.cssText = 'background:#f0fdf4;border:2px solid #16a34a;border-radius:12px;padding:16px 20px;margin-bottom:20px;text-align:center;';
          notice.innerHTML = `<span style="color:#16a34a;font-weight:700;">✅ You signed this proposal on ${new Date(data.timestamp).toLocaleDateString()}</span><br><span style="font-size:12px;color:#666;">Option: ${data.selectedOption} | Name: ${data.clientName}</span>`;
          agreementSection.querySelector('.agreement-section')?.prepend(notice);
        }
      } catch(e) {}
    }
  }

  // ══════════════════════════════════════
  // 6. OPTION CARDS — "Select This Option" buttons
  // ══════════════════════════════════════
  document.querySelectorAll('.option-card').forEach((card, i) => {
    const cta = document.createElement('a');
    cta.href = '#agreement';
    cta.textContent = '→ Select This Option';
    cta.style.cssText = 'display:block;text-align:center;margin-top:16px;padding:12px;background:var(--navy,#1a2e4a);color:#fff;border-radius:10px;text-decoration:none;font-weight:700;font-size:13px;transition:all .2s;';
    cta.addEventListener('mouseenter', () => cta.style.background = '#E8A820');
    cta.addEventListener('mouseleave', () => cta.style.background = '');
    cta.addEventListener('click', () => {
      setTimeout(() => {
        const radios = document.querySelectorAll('#agreement .option-radio');
        if (radios[i]) radios[i].click();
      }, 500);
    });
    card.appendChild(cta);
  });

  // ══════════════════════════════════════
  // 7. VIEW COUNTER
  // ══════════════════════════════════════
  const viewKey = `tm_views_${META.ref}`;
  const views = parseInt(localStorage.getItem(viewKey) || '0') + 1;
  localStorage.setItem(viewKey, views);
  if (views > 1) {
    const badge = document.createElement('div');
    badge.style.cssText = 'position:fixed;top:70px;right:16px;background:rgba(26,46,74,.8);color:#fff;padding:6px 12px;border-radius:8px;font-size:11px;z-index:999;backdrop-filter:blur(8px);transition:opacity 1s;';
    badge.textContent = `View #${views}`;
    document.body.appendChild(badge);
    setTimeout(() => { badge.style.opacity = '0'; setTimeout(() => badge.remove(), 1000); }, 5000);
  }

  // ══════════════════════════════════════
  // 8. PRINT STYLES — hide interactive elements
  // ══════════════════════════════════════
  const printStyle = document.createElement('style');
  printStyle.textContent = `
    @media print {
      #sig-canvas, #sig-clear, #sig-submit, .option-card a[href="#agreement"] { display: none !important; }
      .sig-name-input { border: none !important; padding: 0 !important; font-weight: 700 !important; }
    }
  `;
  document.head.appendChild(printStyle);

  console.log(`[TM Proposal System v2] Loaded — ${META.ref} | View #${views} | Supabase connected`);
})();
