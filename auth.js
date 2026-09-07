// Bustan Energy — lightweight client-side access notice.
// This is only a convenience gate for legacy static pages, not real security.
(function () {
  const ACCESS_HASHES = {
    '305800b71062b49b350208327a02ec378199b4cf35e60eeb971611bef4928394': { name: 'Kaniel', he: 'קניאל' },
    '3cb25825a619415e255ae83eb0cd9c26684de310fb3c377ac289362e043affe7': { name: 'Omer', he: 'עומר' },
    '2725d2bcfac13cc02f042a2cdec42759659c6ec2ab7877065b82a9ebf813cb85': { name: 'Yoni', he: 'יוני' },
  };
  const BRAND_LOGO = new URL('assets/bustan-energy-logo.png', document.currentScript.src).href;
  const SESSION_DAYS = 7;
  const STORAGE_KEY = 'bustan_static_access';

  function getAuth() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)); } catch { return null; }
  }

  function isValid(auth) {
    if (!auth || !auth.hash || !auth.time) return false;
    if (!ACCESS_HASHES[auth.hash]) return false;
    return Date.now() - auth.time <= SESSION_DAYS * 24 * 60 * 60 * 1000;
  }

  async function sha256(value) {
    const data = new TextEncoder().encode(value);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, '0')).join('');
  }

  function showGate() {
    document.body.style.overflow = 'hidden';
    const overlay = document.createElement('div');
    overlay.id = 'bustan-auth-gate';
    overlay.innerHTML = `
      <style>
        #bustan-auth-gate {
          position: fixed; inset: 0; z-index: 99999;
          background: linear-gradient(160deg, #27342F, #24463E 58%, #1C2824);
          display: flex; align-items: center; justify-content: center;
          font-family: 'Heebo', 'DM Sans', sans-serif;
        }
        .gate-box {
          width: min(90%, 380px); padding: 40px 34px; text-align: center;
          background: #FFF4E2; color: #27342F;
          border: 1px solid rgba(245,184,75,.35); border-radius: 10px;
          box-shadow: 0 22px 70px rgba(19,35,30,.28);
        }
        .gate-logo { display: block; width: 220px; max-width: 100%; height: auto; margin: 0 auto 18px; }
        .gate-sub { color: rgba(39,52,47,.62); font-size: 13px; margin-bottom: 26px; }
        .gate-input {
          width: 100%; padding: 15px; font-size: 22px; text-align: center; letter-spacing: 10px;
          background: #F4EAD8; border: 1px solid rgba(36,70,62,.22);
          border-radius: 8px; color: #27342F; outline: none; font-family: monospace;
          -webkit-text-security: disc;
        }
        .gate-input:focus { border-color: #008F8A; box-shadow: 0 0 0 3px rgba(0,143,138,.14); }
        .gate-input::placeholder { letter-spacing: 3px; font-size: 13px; color: rgba(39,52,47,.35); }
        .gate-btn {
          width: 100%; margin-top: 14px; padding: 13px; font-size: 15px; font-weight: 800;
          background: #F5B84B; color: #27342F; border: none; border-radius: 8px;
          cursor: pointer; transition: transform .2s, box-shadow .2s;
        }
        .gate-btn:hover { transform: translateY(-1px); box-shadow: 0 8px 24px rgba(245,184,75,.28); }
        .gate-error { color: #B94436; font-size: 13px; margin-top: 12px; min-height: 20px; }
        .gate-welcome { color: #006F6B; font-size: 17px; font-weight: 800; margin-top: 12px; }
      </style>
      <div class="gate-box">
        <img class="gate-logo" src="${BRAND_LOGO}" alt="Bustan Energy">
        <div class="gate-sub">Internal static archive</div>
        <input class="gate-input" id="gate-pin" type="password" inputmode="numeric"
               pattern="[0-9]*" maxlength="4" placeholder="PIN" autofocus>
        <button class="gate-btn" id="gate-submit">Enter</button>
        <div class="gate-error" id="gate-error"></div>
      </div>
    `;
    document.body.appendChild(overlay);

    const pinInput = document.getElementById('gate-pin');
    const errEl = document.getElementById('gate-error');

    async function tryLogin() {
      const pin = pinInput.value.trim();
      const hash = await sha256(pin);
      if (!ACCESS_HASHES[hash]) {
        errEl.textContent = 'PIN incorrect';
        pinInput.value = '';
        pinInput.focus();
        pinInput.style.borderColor = '#B94436';
        setTimeout(() => { pinInput.style.borderColor = 'rgba(36,70,62,.22)'; }, 1500);
        return;
      }

      const user = ACCESS_HASHES[hash];
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ hash, time: Date.now() }));
      errEl.innerHTML = `<div class="gate-welcome">Welcome, ${user.he}</div>`;
      setTimeout(() => {
        overlay.style.transition = 'opacity .35s';
        overlay.style.opacity = '0';
        setTimeout(() => {
          overlay.remove();
          document.body.style.overflow = '';
        }, 350);
      }, 650);
    }

    document.getElementById('gate-submit').addEventListener('click', tryLogin);
    pinInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') tryLogin();
    });
    pinInput.addEventListener('input', () => {
      if (pinInput.value.length === 4) setTimeout(tryLogin, 160);
    });
  }

  const auth = getAuth();
  if (!isValid(auth)) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', showGate);
    } else {
      showGate();
    }
  }

  window.bustanStaticAccess = {
    logout: () => { localStorage.removeItem(STORAGE_KEY); location.reload(); },
    who: () => {
      const authState = getAuth();
      return authState && ACCESS_HASHES[authState.hash] ? ACCESS_HASHES[authState.hash].he : null;
    },
  };
})();
