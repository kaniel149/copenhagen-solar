/**
 * TM Energy — Proposal System v1
 * Features: Digital signature, tracking, option select, expiry, notifications
 */
(function() {
  'use strict';
  
  // ── CONFIG ──
  const CONFIG = {
    // Google Apps Script endpoint for CRM/tracking
    apiEndpoint: 'https://script.google.com/macros/s/AKfycbxNKTiczMYnecswhyG_DdZA2MUdrZnBeNAfi8wvKYgE9wmaQ3MrwY6M2Xx00dLzZEI2/exec',
    whatsappNumber: '66623480119',
    expiryDays: 30,
    ownerName: 'Kaniel Tordjman'
  };

  // ── PROPOSAL META (read from page) ──
  const META = {
    ref: document.querySelector('.nav-ref')?.textContent?.match(/#([\w-]+)/)?.[1] || 'unknown',
    title: document.querySelector('h1')?.textContent?.trim() || document.title,
    validUntil: null,
    proposalDate: null
  };

  // Parse dates from hero-meta
  document.querySelectorAll('.hero-meta-item').forEach(el => {
    const label = el.textContent.trim();
    const strong = el.querySelector('strong')?.textContent?.trim();
    if (label.includes('Valid Until') && strong) META.validUntil = strong;
    if (label.includes('Proposal Date') && strong) META.proposalDate = strong;
  });

  // ══════════════════════════════════════
  // 1. TRACKING — view events
  // ══════════════════════════════════════
  const trackEvent = (event, data = {}) => {
    const payload = {
      action: 'proposal_event',
      proposal: META.ref,
      event: event,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent.substring(0, 120),
      ...data
    };
    
    // Fire and forget — use sendBeacon for reliability
    if (navigator.sendBeacon) {
      navigator.sendBeacon(CONFIG.apiEndpoint, JSON.stringify(payload));
    } else {
      fetch(CONFIG.apiEndpoint, {
        method: 'POST',
        body: JSON.stringify(payload),
        keepalive: true
      }).catch(() => {});
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
        sectionObserver.unobserve(entry.target); // Only track once
      }
    });
  }, { threshold: 0.3 });

  document.querySelectorAll('section').forEach(s => sectionObserver.observe(s));

  // ══════════════════════════════════════
  // 2. EXPIRY COUNTDOWN
  // ══════════════════════════════════════
  if (META.validUntil) {
    const expiryDate = new Date(META.validUntil);
    const now = new Date();
    const daysLeft = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));
    
    if (daysLeft <= 0) {
      // Expired — show overlay
      const overlay = document.createElement('div');
      overlay.innerHTML = `
        <div style="position:fixed;inset:0;background:rgba(0,0,0,.85);z-index:10000;display:flex;align-items:center;justify-content:center;">
          <div style="background:#fff;border-radius:20px;padding:48px;max-width:480px;text-align:center;">
            <div style="font-size:48px;margin-bottom:16px;">⏰</div>
            <h2 style="font-size:24px;margin-bottom:12px;color:#1a2e4a;">Proposal Expired</h2>
            <p style="color:#666;margin-bottom:24px;">This proposal expired on ${META.validUntil}.<br>Contact us for an updated quote.</p>
            <a href="https://wa.me/${CONFIG.whatsappNumber}?text=Hi%20TM%20Energy%2C%20proposal%20${META.ref}%20expired%20—%20please%20send%20updated%20quote" 
               style="display:inline-block;background:#25D366;color:#fff;padding:14px 32px;border-radius:12px;text-decoration:none;font-weight:700;font-size:16px;" target="_blank">
              💬 Request Updated Quote
            </a>
          </div>
        </div>`;
      document.body.appendChild(overlay);
      trackEvent('expired_view');
      return; // Stop everything else
    } else if (daysLeft <= 7) {
      // Show urgency banner
      const banner = document.createElement('div');
      banner.style.cssText = 'position:fixed;bottom:0;left:0;right:0;background:linear-gradient(90deg,#e74c3c,#c0392b);color:#fff;padding:12px 20px;text-align:center;z-index:9999;font-size:14px;font-weight:600;';
      banner.innerHTML = `⏰ This proposal expires in <strong>${daysLeft} day${daysLeft > 1 ? 's' : ''}</strong> — <a href="#agreement" style="color:#fff;text-decoration:underline;">Sign now</a>`;
      document.body.appendChild(banner);
      document.body.style.paddingBottom = '48px';
    }
  }

  // ══════════════════════════════════════
  // 3. OPTION SELECTION (radio buttons)
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
        // Deselect all
        radios.forEach(r => {
          r.style.borderColor = '#e0e0e0';
          r.style.background = '#fff';
          const d = r.querySelector('.radio-dot');
          if (d) { d.style.borderColor = '#ccc'; d.style.background = '#fff'; }
        });
        // Select this one
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
        // Add name input
        const nameField = clientParty.querySelector('.sig-field-input');
        if (nameField) {
          const nameInput = document.createElement('input');
          nameInput.type = 'text';
          nameInput.placeholder = 'Type your full name';
          nameInput.style.cssText = 'width:100%;padding:10px 14px;border:1px solid #ddd;border-radius:8px;font-size:14px;font-family:inherit;';
          nameField.replaceWith(nameInput);
          nameInput.className = 'sig-name-input';
        }

        // Replace signature line with canvas
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

          // Signature canvas logic
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
          // 5. SUBMIT BUTTON
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
            const payload = {
              action: 'proposal_signed',
              proposal: META.ref,
              option: selectedOption,
              clientName: clientName,
              signature: sigData,
              timestamp: new Date().toISOString(),
              url: window.location.href
            };

            try {
              await fetch(CONFIG.apiEndpoint, {
                method: 'POST',
                body: JSON.stringify(payload)
              });
            } catch(e) {}

            // Track
            trackEvent('signed', { option: selectedOption, clientName });

            // WhatsApp notification to owner
            const waMsg = encodeURIComponent(
              `🎉 Proposal ${META.ref} SIGNED!\n` +
              `Client: ${clientName}\n` +
              `Option: ${selectedOption}\n` +
              `Time: ${new Date().toLocaleString()}`
            );

            // Show success screen
            const successHTML = `
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
                  <a href="https://wa.me/${CONFIG.whatsappNumber}?text=Hi%20TM%20Energy%2C%20I%20just%20signed%20proposal%20${META.ref}%20(${selectedOption})" 
                     style="display:inline-block;background:#25D366;color:#fff;padding:14px 32px;border-radius:12px;text-decoration:none;font-weight:700;font-size:16px;" target="_blank">
                    💬 Message Us on WhatsApp
                  </a>
                </div>
              </div>`;
            
            const successDiv = document.createElement('div');
            successDiv.innerHTML = successHTML;
            document.body.appendChild(successDiv);

            // Replace submit button
            submitBtn.textContent = '✅ Signed Successfully';
            submitBtn.style.background = '#16a34a';
          });
        }
      }

      // Auto-fill date
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
    }
  }

  // ══════════════════════════════════════
  // 6. OPTION CARDS — click to scroll to agreement
  // ══════════════════════════════════════
  document.querySelectorAll('.option-card').forEach((card, i) => {
    const cta = document.createElement('a');
    cta.href = '#agreement';
    cta.textContent = '→ Select This Option';
    cta.style.cssText = 'display:block;text-align:center;margin-top:16px;padding:12px;background:var(--navy,#1a2e4a);color:#fff;border-radius:10px;text-decoration:none;font-weight:700;font-size:13px;transition:all .2s;';
    cta.addEventListener('click', (e) => {
      // Auto-select the matching radio
      setTimeout(() => {
        const radios = document.querySelectorAll('#agreement .option-radio');
        if (radios[i]) radios[i].click();
      }, 500);
    });
    card.appendChild(cta);
  });

  // ══════════════════════════════════════
  // 7. VIEW COUNTER BADGE
  // ══════════════════════════════════════
  const viewKey = `tm_views_${META.ref}`;
  const views = parseInt(localStorage.getItem(viewKey) || '0') + 1;
  localStorage.setItem(viewKey, views);
  if (views > 1) {
    const badge = document.createElement('div');
    badge.style.cssText = 'position:fixed;top:70px;right:16px;background:rgba(26,46,74,.8);color:#fff;padding:6px 12px;border-radius:8px;font-size:11px;z-index:999;backdrop-filter:blur(8px);';
    badge.textContent = `View #${views}`;
    document.body.appendChild(badge);
    setTimeout(() => badge.style.opacity = '0', 5000);
  }

  console.log(`[TM Proposal System] Loaded — ${META.ref} | View #${views}`);
})();
