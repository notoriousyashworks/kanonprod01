/* ============================================
   KicksAura Login Modal — MSG91 OTP (Custom UI)
   ============================================ */
import { loginWithBackend, setAuthUser, isLoggedIn, getAuthUser } from './auth.js';
import { aboutUsContent, shippingPolicyContent } from './policy-content.js';

// ─── Config ────────────────────────────────────────────────────────────────────
const MSG91_SCRIPT_URL   = 'https://verify.msg91.com/otp-provider.js';
const OTP_LENGTH         = 4;
const RESEND_COUNTDOWN   = 30; // seconds

// ─── State ─────────────────────────────────────────────────────────────────────
let sdkReady    = false;
let sdkLoading  = false;
let widgetConfig = null; // { widgetId, widgetToken } — loaded from backend
let currentPhone = '';
let currentReqId = null;
let countdownTimer = null;

// ─── Widget Config Loader ────────────────────────────────────────────────────────
async function loadWidgetConfig() {
  if (widgetConfig) return widgetConfig;
  try {
    const res = await fetch('/api/v1/users/auth/widget-config');
    if (!res.ok) {
      const text = await res.text().catch(() => 'no body');
      throw new Error(`HTTP ${res.status}: ${text}`);
    }
    widgetConfig = await res.json();
    return widgetConfig;
  } catch (e) {
    console.error('[KicksAura] Could not load MSG91 widget config:', e.message);
    throw new Error('API Error: ' + e.message);
  }
}

// ─── SDK Loader ────────────────────────────────────────────────────────────────

function loadMsg91Sdk() {
  return new Promise((resolve, reject) => {
    if (window.initSendOTP) { resolve(); return; }
    if (sdkLoading) {
      // Wait for existing load attempt
      const poll = setInterval(() => {
        if (window.initSendOTP) { clearInterval(poll); resolve(); }
      }, 100);
      setTimeout(() => { clearInterval(poll); reject(new Error('SDK load timeout')); }, 10000);
      return;
    }
    sdkLoading = true;
    const existing = document.getElementById('msg91-otp-sdk');
    if (existing) { existing.remove(); }
    const script = document.createElement('script');
    script.id  = 'msg91-otp-sdk';
    script.src = MSG91_SCRIPT_URL;
    script.onload = () => {
      const poll = setInterval(() => {
        if (window.initSendOTP) {
          clearInterval(poll);
          sdkLoading = false;
          resolve();
        }
      }, 50);
      setTimeout(() => { clearInterval(poll); reject(new Error('initSendOTP unavailable')); }, 8000);
    };
    script.onerror = () => {
      sdkLoading = false;
      reject(new Error('Failed to load MSG91 SDK'));
    };
    document.head.appendChild(script);
  });
}

function initMsg91(config) {
  if (sdkReady) return;
  window.initSendOTP({
    widgetId:        config.widgetId,
    tokenAuth:       config.widgetToken,
    exposeMethods:   true,
    success: (data) => {},
    failure: (error) => console.error('MSG91 Init Failure:', error)
  });
  sdkReady = true;
}

// ─── Modal DOM ─────────────────────────────────────────────────────────────────

function injectModalDOM(context = null) {
  let overlay = document.getElementById('login-modal-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'login-modal-overlay';
    overlay.className = 'login-modal-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', 'Log in to KicksAura');
    document.body.appendChild(overlay);
  }

  // Always use the split checkout layout
  overlay.classList.add('checkout-mode');

  // The actual OTP DOM logic (no brand block — checkout layout has its own header)
  const otpDom = `
      <!-- PHONE STEP -->
      <div id="login-step-phone">
        <div class="login-input-wrap" id="login-phone-wrap">
          <span class="login-phone-prefix" style="gap: 6px; padding-right: 14px; border-right: 1px solid #e2e8f0; display: flex; align-items: center;">
            <svg width="20" height="14" viewBox="0 0 24 16" style="border-radius: 2px;" xmlns="http://www.w3.org/2000/svg">
              <rect width="24" height="5.33" fill="#FF9933"/>
              <rect y="5.33" width="24" height="5.33" fill="#FFFFFF"/>
              <rect y="10.66" width="24" height="5.33" fill="#138808"/>
              <circle cx="12" cy="8" r="2.2" fill="#000080"/>
            </svg>
            <span style="margin-left: 2px;">+91</span>
          </span>
          <div style="position: relative; flex: 1; height: 100%; display: flex; align-items: center; padding-left: 14px; overflow: hidden;">
            <div id="login-phone-display" style="display: flex; gap: 4px; pointer-events: none; width: 100%; justify-content: flex-start; align-items: center;">
            </div>
            <input
              type="tel"
              id="login-phone-input"
              class="login-phone-input"
              style="position: absolute; inset: 0; opacity: 0; cursor: text; padding: 0; height: 100%; width: 100%; font-size: 16px;"
              maxlength="10"
              inputmode="numeric"
              autocomplete="tel-national"
            />
          </div>
        </div>
        <div class="login-error-msg" id="login-phone-error"></div>
        <button class="login-btn-primary" id="login-send-otp-btn">
          <span id="login-send-otp-text">Continue</span>
        </button>
        <p class="login-privacy-note">We'll send a one-time password to verify your number.</p>
      </div>

      <!-- OTP STEP -->
      <div id="login-step-otp" style="display:none;">
        <p class="login-otp-phone-info" id="login-otp-phone-info">
          OTP sent to <strong id="login-otp-phone-display"></strong>
        </p>
        <div class="login-otp-inputs" id="login-otp-inputs">
          ${Array.from({ length: OTP_LENGTH }, (_, i) => `
            <input
              type="text"
              inputmode="numeric"
              maxlength="1"
              class="login-otp-box"
              id="otp-box-${i}"
              aria-label="OTP digit ${i + 1}"
              autocomplete="${i === 0 ? 'one-time-code' : 'off'}"
            />`).join('')}
        </div>
        <div class="login-error-msg" id="login-otp-error"></div>
        <button class="login-btn-primary" id="login-verify-btn" style="margin-top: 16px;">
          <span id="login-verify-text">Verify OTP</span>
        </button>
        <div class="login-resend-row">
          <button class="login-resend-btn" id="login-resend-btn" disabled>Resend OTP</button>
          <span class="login-resend-countdown" id="login-resend-countdown"> in <span id="login-countdown-num">${RESEND_COUNTDOWN}</span>s</span>
        </div>
        <p class="login-back-link">
          Wrong number? <button id="login-change-phone-btn">Change</button>
        </p>
      </div>
  `;

  // Left pane content depends on context
  let leftPaneContent = '';
  if (context === 'checkout') {
    leftPaneContent = `
      <h3 class="login-modal-left-title">Order summary</h3>
      <div class="login-modal-cart-items" id="login-modal-cart-list">
        <!-- Cart items will be rendered here -->
      </div>
    `;
  } else {
    leftPaneContent = `
      <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; text-align: center;">
        <h2 style="color: white; font-size: 28px; margin-bottom: 8px;">Welcome</h2>
        <p style="color: rgba(255, 255, 255, 0.95); font-size: 14px; line-height: 1.5;">Log in to Access your Wishlist, Orders and more</p>
      </div>
    `;
  }

  // Use the split pane layout unconditionally
  overlay.innerHTML = `
    <div class="login-modal checkout-mode" id="login-modal-panel">
      <button class="login-modal-close" id="login-modal-close" aria-label="Close">✕</button>
      
      <div class="login-modal-left-pane">
        <div class="login-modal-left-content" style="flex: 1;">
          ${leftPaneContent}
        </div>

      </div>
      
      <div class="login-modal-right-pane">
        <div class="login-modal-checkout-header">
          <h2>Log In</h2>
          <p>${context === 'checkout' ? 'Confirm your mobile number to proceed to checkout' : 'Confirm your mobile number to proceed'}</p>
        </div>
        
        <div class="login-modal-inner">
          ${otpDom}
          
          <div class="login-modal-footer-links">
            <a href="#" id="login-about-link">About Us</a> | <a href="#" id="login-shipping-link">Shipping & Delivery Policy</a>
          </div>
        </div>
      </div>
    </div>
  `;

  // Info Modal DOM
  if (!document.getElementById('policy-modal-overlay')) {
    const policyModal = document.createElement('div');
    policyModal.id = 'policy-modal-overlay';
    policyModal.className = 'login-modal-overlay';
    policyModal.style.zIndex = '99999'; // Force it to be above everything
    policyModal.innerHTML = `
      <div class="login-modal" style="max-width: 550px; padding: 0; text-align: left; display: flex; flex-direction: column; max-height: 85vh; border-radius: 20px; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.4);">
        <div style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 28px 32px; position: relative; flex-shrink: 0;">
          <h2 id="policy-modal-title" style="margin: 0; font-size: 26px; color: #ffffff; font-weight: 700; letter-spacing: -0.5px;"></h2>
          <button id="policy-modal-close" style="position: absolute; top: 24px; right: 24px; background: rgba(255,255,255,0.1); border: none; font-size: 16px; cursor: pointer; color: white; width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; transition: all 0.2s ease; outline: none;" onmouseover="this.style.background='rgba(255,255,255,0.2)'" onmouseout="this.style.background='rgba(255,255,255,0.1)'">✕</button>
        </div>
        <div id="policy-modal-content" style="padding: 32px; font-size: 15px; line-height: 1.7; color: #334155; overflow-y: auto; background: #ffffff;"></div>
      </div>
    `;
    document.body.appendChild(policyModal);
    
    document.getElementById('policy-modal-close').addEventListener('click', () => {
      document.getElementById('policy-modal-overlay').classList.remove('open');
    });
    policyModal.addEventListener('click', (e) => {
      if (e.target === policyModal) policyModal.classList.remove('open');
    });
  }


  // Bind Events
  bindModalEvents();
  
  // Bind Policy Links
  const aboutLink = document.getElementById('login-about-link');
  if (aboutLink) {
    aboutLink.onclick = (e) => {
      e.preventDefault();
      document.getElementById('policy-modal-title').textContent = 'About Us';
      document.getElementById('policy-modal-content').innerHTML = aboutUsContent;
      document.getElementById('policy-modal-overlay').classList.add('open');
    };
  }
  
  const shippingLink = document.getElementById('login-shipping-link');
  if (shippingLink) {
    shippingLink.onclick = (e) => {
      e.preventDefault();
      document.getElementById('policy-modal-title').textContent = 'Shipping & Delivery Policy';
      document.getElementById('policy-modal-content').innerHTML = shippingPolicyContent;
      document.getElementById('policy-modal-overlay').classList.add('open');
    };
  }
}

// ─── Event Binding ─────────────────────────────────────────────────────────────

function bindModalEvents() {
  // Close
  document.getElementById('login-modal-close').addEventListener('click', closeLoginModal);
  document.getElementById('login-modal-overlay').addEventListener('click', (e) => {
    if (e.target === document.getElementById('login-modal-overlay')) closeLoginModal();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeLoginModal();
  });

  // Send OTP
  document.getElementById('login-send-otp-btn').addEventListener('click', handleSendOtp);
  
  const phoneInput = document.getElementById('login-phone-input');
  
  function renderPhoneDisplay() {
    const display = document.getElementById('login-phone-display');
    if (!display) return;
    const val = phoneInput.value.replace(/\D/g, '').slice(0, 10);
    let html = '';
    for (let i = 0; i < 10; i++) {
      const digit = val[i] || '';
      const isNext = i === val.length;
      const margin = i === 4 ? 'margin-right: 12px;' : '';
      const isActive = isNext && document.activeElement === phoneInput;
      const border = isActive ? 'border-bottom: 2px solid #0f172a;' : 'border-bottom: 2px solid #cbd5e1;';
      const color = digit ? '#0f172a' : 'transparent';
      html += `<span style="width: 14px; height: 28px; display: inline-flex; justify-content: center; align-items: center; font-size: 18px; font-weight: 600; color: ${color}; ${border} ${margin} transition: all 0.2s;">${digit || '0'}</span>`;
    }
    display.innerHTML = html;
  }
  
  phoneInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleSendOtp();
  });
  
  phoneInput.addEventListener('input', (e) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val.length > 10) val = val.slice(0, 10);
    e.target.value = val;
    renderPhoneDisplay();
    clearPhoneError();
  });
  
  phoneInput.addEventListener('focus', renderPhoneDisplay);
  phoneInput.addEventListener('blur', renderPhoneDisplay);
  
  // Initial render
  renderPhoneDisplay();

  // OTP boxes
  bindOtpBoxEvents();

  // Verify
  document.getElementById('login-verify-btn').addEventListener('click', handleVerifyOtp);

  // Resend
  document.getElementById('login-resend-btn').addEventListener('click', handleResendOtp);

  // Change phone
  document.getElementById('login-change-phone-btn').addEventListener('click', () => {
    showPhoneStep();
  });
}

// ─── OTP Box Behaviour ─────────────────────────────────────────────────────────

function bindOtpBoxEvents() {
  const boxes = getOtpBoxes();

  boxes.forEach((box, i) => {
    box.addEventListener('input', (e) => {
      const val = e.target.value.replace(/\D/g, '');
      e.target.value = val.slice(-1);
      if (val) {
        box.classList.add('filled');
        box.classList.remove('error');
        if (i < boxes.length - 1) {
          boxes[i + 1].focus();
        } else {
          const allFilled = Array.from(boxes).every(b => b.value);
          if (allFilled) handleVerifyOtp();
        }
      } else {
        box.classList.remove('filled');
      }
      clearOtpError();
    });

    box.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace') {
        if (!box.value && i > 0) {
          boxes[i - 1].value = '';
          boxes[i - 1].classList.remove('filled');
          boxes[i - 1].focus();
        }
      } else if (e.key === 'Enter') {
        handleVerifyOtp();
      }
    });

    // Paste handling (on first box)
    box.addEventListener('paste', (e) => {
      e.preventDefault();
      const pasted = (e.clipboardData || window.clipboardData).getData('text').replace(/\D/g, '');
      if (!pasted) return;
      boxes.forEach((b, j) => {
        b.value = pasted[j] || '';
        if (pasted[j]) {
          b.classList.add('filled');
        } else {
          b.classList.remove('filled');
        }
      });
      const nextEmpty = boxes.findIndex(b => !b.value);
      if (nextEmpty === -1) {
        boxes[boxes.length - 1].focus();
        handleVerifyOtp();
      } else {
        boxes[nextEmpty].focus();
      }
      clearOtpError();
    });
  });
}

function getOtpBoxes() {
  return Array.from({ length: OTP_LENGTH }, (_, i) => document.getElementById(`otp-box-${i}`));
}

function getOtpValue() {
  return getOtpBoxes().map(b => b.value).join('');
}

function clearOtpBoxes() {
  getOtpBoxes().forEach(b => {
    b.value = '';
    b.classList.remove('filled', 'error');
  });
}

// ─── Step Management ───────────────────────────────────────────────────────────

function showPhoneStep() {
  stopCountdown();
  document.getElementById('login-step-phone').style.display = '';
  document.getElementById('login-step-otp').style.display   = 'none';
  
  const title = document.getElementById('login-modal-title');
  const subtitle = document.getElementById('login-modal-subtitle');
  if (title) title.textContent = 'Log In';
  if (subtitle) subtitle.textContent = 'Enter your mobile number to continue';
  
  const phoneInput = document.getElementById('login-phone-input');
  if (phoneInput) phoneInput.value = '';
  clearOtpBoxes();
  clearOtpError();
  setSendBtnLoading(false);
  setTimeout(() => document.getElementById('login-phone-input')?.focus(), 50);
}

function showOtpStep() {
  document.getElementById('login-step-phone').style.display = 'none';
  document.getElementById('login-step-otp').style.display   = '';
  
  const title = document.getElementById('login-modal-title');
  const subtitle = document.getElementById('login-modal-subtitle');
  if (title) title.textContent = 'Enter OTP';
  if (subtitle) subtitle.textContent = 'Check your SMS';
  
  document.getElementById('login-otp-phone-display').textContent = `+91 ${currentPhone}`;
  clearOtpBoxes();
  clearOtpError();
  setVerifyBtnLoading(false);
  startCountdown();
  setTimeout(() => document.getElementById('otp-box-0')?.focus(), 50);
}

// ─── Send OTP ──────────────────────────────────────────────────────────────────

async function handleSendOtp() {
  const rawPhone = document.getElementById('login-phone-input').value.trim().replace(/\D/g, '');

  // Validate
  if (!rawPhone || rawPhone.length !== 10 || !/^[6-9]/.test(rawPhone)) {
    showPhoneError('Please enter a valid 10-digit Indian mobile number.');
    return;
  }

  setSendBtnLoading(true);
  clearPhoneError();

  try {
    const config = await loadWidgetConfig();
    await loadMsg91Sdk();
    initMsg91(config);

    // Poll until window.sendOtp is available (up to 5 seconds)
    let retries = 50;
    while (typeof window.sendOtp !== 'function' && retries > 0) {
      await new Promise(resolve => setTimeout(resolve, 100));
      retries--;
    }

    if (typeof window.sendOtp !== 'function') {
      throw new Error('MSG91 SDK not ready. Please refresh and try again.');
    }

    const identifier = '91' + rawPhone;    // MSG91 needs country code without +
    currentPhone = rawPhone;

    window.sendOtp(
      identifier,
      (data) => {
        // Success
        currentReqId = data?.reqId || data?.message || null;
        showOtpStep();
        setSendBtnLoading(false);
      },
      (error) => {
        // Failure
        const msg = typeof error === 'string' ? error : (error?.message || 'Could not send OTP. Please try again.');
        showPhoneError(msg);
        setSendBtnLoading(false);
      }
    );
  } catch (err) {
    showPhoneError(err.message || 'Could not send OTP. Please try again.');
    setSendBtnLoading(false);
  }
}

// ─── Verify OTP ────────────────────────────────────────────────────────────────

async function handleVerifyOtp() {
  const otp = getOtpValue();

  if (otp.length !== OTP_LENGTH) {
    showOtpError('Please enter all 6 digits.');
    return;
  }

  if (!currentReqId) {
    showOtpError('Session expired. Please resend the OTP.');
    return;
  }

  setVerifyBtnLoading(true);
  clearOtpError();

  window.verifyOtp(
    otp,
    async (data) => {
      // MSG91 says OTP is correct — now verify with our backend
      try {
        const accessToken = data?.access_token || data?.token || data?.message;
        if (!accessToken || accessToken.toLowerCase() === 'success') {
          showOtpError('Verification error. Please try again.');
          setVerifyBtnLoading(false);
          return;
        }

        const user = await loginWithBackend(accessToken);
        setVerifyBtnLoading(false);
        stopCountdown();
        closeLoginModal();

        // Notify all listeners (navbar, profile dropdown, etc.)
        window.dispatchEvent(new CustomEvent('auth-changed', { detail: { loggedIn: true, user } }));

        if (pendingRedirectUrl) {
          window.location.href = pendingRedirectUrl;
        }

        // Update profile dropdown name without full reload
        const nameEl = document.getElementById('profile-dropdown-name');
        if (nameEl) {
          const displayName = [user.firstName, user.lastName].filter(Boolean).join(' ').trim() || `+91 ${user.phoneNumber}`;
          nameEl.textContent = displayName;
        }
      } catch (err) {
        showOtpError(err.message || 'Login failed. Please try again.');
        setVerifyBtnLoading(false);
      }
    },
    (error) => {
      // MSG91 OTP verification failed
      const msg = typeof error === 'string' ? error : (error?.message || 'Incorrect OTP. Please try again.');
      const userMsg = msg.toLowerCase().includes('expired') ? 'OTP has expired. Please resend.' : 'Incorrect OTP. Please try again.';
      showOtpError(userMsg);
      const boxes = getOtpBoxes();
      boxes.forEach(b => {
        b.classList.add('error');
        b.value = '';
      });
      if (boxes[0]) boxes[0].focus();
      setVerifyBtnLoading(false);
    },
    currentReqId
  );
}

// ─── Resend OTP ────────────────────────────────────────────────────────────────

function handleResendOtp() {
  const btn = document.getElementById('login-resend-btn');
  if (btn.disabled) return;

  btn.disabled = true;
  clearOtpError();
  clearOtpBoxes();

  try {
    const retryFunc = window.retryOTP || window.retryOtp;
    if (typeof retryFunc !== 'function') {
      throw new Error('OTP service is currently unavailable.');
    }

    retryFunc(
      '11', // '11' for SMS channel
      (data) => {
        if (data?.reqId) currentReqId = data.reqId;
        startCountdown();
      },
      (error) => {
        const msg = typeof error === 'string' ? error : (error?.message || 'Could not resend OTP. Please try again.');
        showOtpError(msg);
        btn.disabled = false;
      }
    );
  } catch (err) {
    showOtpError(err.message || 'An error occurred while resending OTP.');
    btn.disabled = false;
  }
}

// ─── Countdown ─────────────────────────────────────────────────────────────────

function startCountdown() {
  stopCountdown();
  let seconds = RESEND_COUNTDOWN;
  const numEl  = document.getElementById('login-countdown-num');
  const countEl = document.getElementById('login-resend-countdown');
  const resendBtn = document.getElementById('login-resend-btn');

  if (!numEl || !resendBtn) return;

  resendBtn.disabled = true;
  if (countEl) countEl.style.display = '';
  numEl.textContent = seconds;

  countdownTimer = setInterval(() => {
    seconds--;
    numEl.textContent = seconds;
    if (seconds <= 0) {
      stopCountdown();
      resendBtn.disabled = false;
      if (countEl) countEl.style.display = 'none';
    }
  }, 1000);
}

function stopCountdown() {
  if (countdownTimer) { clearInterval(countdownTimer); countdownTimer = null; }
}

// ─── UI Helpers ────────────────────────────────────────────────────────────────

function showPhoneError(msg) {
  const el = document.getElementById('login-phone-error');
  if (el) el.textContent = msg;
  document.getElementById('login-phone-wrap')?.classList.add('error');
}
function clearPhoneError() {
  const el = document.getElementById('login-phone-error');
  if (el) el.textContent = '';
  document.getElementById('login-phone-wrap')?.classList.remove('error');
}

function showOtpError(msg) {
  const el = document.getElementById('login-otp-error');
  if (el) el.textContent = msg;
}
function clearOtpError() {
  const el = document.getElementById('login-otp-error');
  if (el) el.textContent = '';
  getOtpBoxes().forEach(b => b.classList.remove('error'));
}

function setSendBtnLoading(loading) {
  const btn  = document.getElementById('login-send-otp-btn');
  if (!btn) return;
  btn.disabled = loading;
  btn.innerHTML = loading
    ? `<span class="login-spinner"></span><span>Sending…</span>`
    : `<span id="login-send-otp-text">Continue</span>`;
}

function setVerifyBtnLoading(loading) {
  const btn = document.getElementById('login-verify-btn');
  if (!btn) return;
  btn.disabled = loading;
  btn.innerHTML = loading
    ? `<span class="login-spinner"></span><span>Verifying…</span>`
    : `<span id="login-verify-text">Verify OTP</span>`;
}

// ─── Open / Close ───────────────────────────────────────────────────────────────

let pendingRedirectUrl = null;

export function openLoginModal(optionsOrRedirectUrl = null) {
  let context = null;
  
  if (typeof optionsOrRedirectUrl === 'string') {
    pendingRedirectUrl = optionsOrRedirectUrl;
  } else if (optionsOrRedirectUrl && typeof optionsOrRedirectUrl === 'object') {
    pendingRedirectUrl = optionsOrRedirectUrl.redirectUrl || null;
    context = optionsOrRedirectUrl.context || null;
  } else {
    pendingRedirectUrl = null;
  }

  injectModalDOM(context);
  const overlay = document.getElementById('login-modal-overlay');
  if (!overlay) return;

  // If checkout context, populate cart items
  if (context === 'checkout') {
    const list = document.getElementById('login-modal-cart-list');
    if (list) {
      try {
        const cartStr = localStorage.getItem('kicksaura_cart');
        const cart = cartStr ? JSON.parse(cartStr) : [];
        if (cart.length === 0) {
          list.innerHTML = '<p style="color:#888; font-size:14px;">Your cart is empty.</p>';
        } else {
          list.innerHTML = cart.map(item => {
            const img = item.productImage && item.productImage.startsWith('http') 
              ? item.productImage 
              : item.productImage ? `https://res.cloudinary.com/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME_FRONTEND}/image/upload/w_200,h_200,c_fill,q_auto,f_auto/${item.productImage}` 
              : '';
            const price = (item.price * item.quantity).toLocaleString('en-IN');
            return `
              <div class="login-modal-cart-item" style="display: flex; gap: 16px; padding: 12px 0; border-bottom: 1px solid #e5e5e5; cursor: pointer;">
                <img src="${img}" alt="${item.productName}" style="width: 54px; height: 54px; border-radius: 50%; object-fit: cover; border: 1px solid #eee;" />
                <div style="flex: 1; display: flex; flex-direction: column; justify-content: center;">
                  <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 12px;">
                    <h4 style="margin: 0 0 6px 0; font-size: 14px; font-weight: 600; color: #111; line-height: 1.4;">${item.productName}</h4>
                    <span style="font-weight: 700; font-size: 15px; color: #111;">₹${price}</span>
                  </div>
                  <p style="margin: 0; font-size: 13px; color: #888;">Qty: ${item.quantity}</p>
                </div>
              </div>
            `;
          }).join('');
          
          let totalItems = 0;
          let subtotal = 0;
          cart.forEach(item => {
            totalItems += item.quantity;
            subtotal += (item.price * item.quantity);
          });
          
          list.innerHTML += `
            <div id="login-modal-cart-summary" style="display: none; padding-top: 24px; color: #111; cursor: default;">
              <div style="display: flex; justify-content: space-between; font-size: 15px; margin-bottom: 24px; color: #111;">
                <span>Subtotal</span>
                <span>₹${subtotal.toLocaleString('en-IN')}</span>
              </div>
              <div style="border-top: 1.5px solid #111; margin-bottom: 24px;"></div>
              <div style="display: flex; justify-content: space-between; font-size: 18px; font-weight: 800; color: #111; margin-bottom: 8px;">
                <span>Grand Total</span>
                <span>₹${subtotal.toLocaleString('en-IN')}</span>
              </div>
            </div>
          `;
          
          // Click listener to toggle the order summary dropdown
          list.onclick = (e) => {
            const summaryEl = document.getElementById('login-modal-cart-summary');
            if (summaryEl) {
              summaryEl.style.display = summaryEl.style.display === 'none' ? 'block' : 'none';
            }
          };
        }
      } catch (e) {
        console.error('Failed to load cart for login modal', e);
      }
    }
  }

  showPhoneStep();
  overlay.classList.add('open');
  document.body.style.overflow = 'hidden';
}

export function closeLoginModal() {
  stopCountdown();
  const overlay = document.getElementById('login-modal-overlay');
  if (!overlay) return;
  overlay.classList.remove('open');
  document.body.style.overflow = '';

  // If they closed the checkout login modal without logging in, redirect them back home
  // (There is no standalone /cart route — the cart is a sidebar on the home page)
  if (overlay.classList.contains('checkout-mode')) {
    if (!isLoggedIn()) {
      window.location.href = '/';
    }
  }
}

// ─── Auto-hook profile button ───────────────────────────────────────────────────
// Called after navbar is rendered — wires the profile icon or login btn.
export function initLoginModalTrigger() {
  // If redirected from a protected page with ?login=1, auto-open the modal
  if (new URLSearchParams(window.location.search).get('login') === '1') {
    const triggerOpen = () => {
      openLoginModal(window.location.pathname);
      // Clean up the URL so it doesn't reopen on refresh
      const url = new URL(window.location);
      url.searchParams.delete('login');
      window.history.replaceState({}, '', url);
    };

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', triggerOpen);
    } else {
      setTimeout(triggerOpen, 50); // slight delay to ensure DOM is ready
    }
  }

  // If profile button exists, we delegate to it for the login flow
  // The profile.js initProfileDropdown already handles click → dropdown.
  // We hook the dropdown's "Login" button if present.
  document.addEventListener('click', (e) => {
    if (e.target.closest('#profile-login-btn')) {
      e.preventDefault();
      e.stopPropagation();
      openLoginModal(window.location.pathname);
    }
    if (e.target.closest('#profile-logout-btn')) {
      e.preventDefault();
      const { logout } = window._kicksauraAuth || {};
      if (logout) logout();
    }
  });
}
