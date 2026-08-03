/* ============================================
   KicksAura Admin Login Modal
   ============================================ */
import { loginWithBackend, isLoggedIn } from './auth.js';

// ─── Config ────────────────────────────────────────────────────────────────────
const MSG91_SCRIPT_URL   = 'https://verify.msg91.com/otp-provider.js';
const OTP_LENGTH         = 4;
const RESEND_COUNTDOWN   = 30; // seconds

// ─── State ─────────────────────────────────────────────────────────────────────
let sdkReady    = false;
let sdkLoading  = false;
let widgetConfig = null;
let currentPhone = '';
let currentReqId = null;
let countdownTimer = null;

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
    console.error('[KicksAura] Could not load MSG91 config:', e.message);
    throw new Error('API Error: ' + e.message);
  }
}

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
    success: (data) => console.log('MSG91 Init Success:', data),
    failure: (error) => console.error('MSG91 Init Failure:', error)
  });
  sdkReady = true;
}

export function openAdminLoginModal() {
  let overlay = document.getElementById('login-modal-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'login-modal-overlay';
    overlay.className = 'login-modal-overlay';
    document.body.appendChild(overlay);
  }

  const otpDom = `
    <div class="login-modal-brand" style="text-align:center; margin-bottom: 24px;">
      <h2 id="login-modal-title" style="margin-bottom:8px;">Admin Panel Log In</h2>
      <p id="login-modal-subtitle" style="color:#666;">Enter your mobile number to access the dashboard</p>
    </div>

    <!-- PHONE STEP -->
    <div id="login-step-phone">
      <div class="login-input-wrap" id="login-phone-wrap" style="display:flex; border:1px solid #cbd5e1; padding:12px; border-radius:8px;">
        <span class="login-phone-prefix" style="padding-right:12px; border-right:1px solid #cbd5e1;">+91</span>
        <input type="tel" id="login-phone-input" style="border:none; outline:none; padding-left:12px; flex:1; font-size:16px;" maxlength="10" placeholder="Mobile Number" />
      </div>
      <div class="login-error-msg" id="login-phone-error" style="color:red; font-size:14px; margin-top:8px;"></div>
      <button id="login-send-otp-btn" style="width:100%; padding:12px; margin-top:16px; background:#0f172a; color:#fff; border:none; border-radius:8px; cursor:pointer; font-weight:bold;">Continue</button>
    </div>

    <!-- OTP STEP -->
    <div id="login-step-otp" style="display:none;">
      <p style="text-align:center; color:#666;">OTP sent to <strong id="login-otp-phone-display"></strong></p>
      <div style="display:flex; justify-content:center; gap:8px; margin: 16px 0;" id="login-otp-inputs">
        ${Array.from({ length: OTP_LENGTH }, (_, i) => `<input type="text" maxlength="1" class="login-otp-box" id="otp-box-${i}" style="width:40px; height:48px; text-align:center; font-size:20px; border:1px solid #cbd5e1; border-radius:8px;" />`).join('')}
      </div>
      <div class="login-error-msg" id="login-otp-error" style="color:red; font-size:14px; text-align:center;"></div>
      <button id="login-verify-btn" style="width:100%; padding:12px; margin-top:16px; background:#0f172a; color:#fff; border:none; border-radius:8px; cursor:pointer; font-weight:bold;">Verify OTP</button>
      
      <div style="text-align:center; margin-top:16px; font-size:14px;">
        <button id="login-resend-btn" style="background:none; border:none; color:#2563eb; cursor:pointer;" disabled>Resend OTP</button>
        <span id="login-resend-countdown" style="color:#666;"> in <span id="login-countdown-num">${RESEND_COUNTDOWN}</span>s</span>
      </div>
      <div style="text-align:center; margin-top:8px; font-size:14px;">
        <button id="login-change-phone-btn" style="background:none; border:none; color:#2563eb; cursor:pointer;">Change Number</button>
      </div>
    </div>
  `;

  overlay.innerHTML = `
    <div class="login-modal" style="background:#fff; width:100%; max-width:400px; margin:auto; padding:32px; border-radius:12px; box-shadow:0 10px 25px rgba(0,0,0,0.1);">
      ${otpDom}
    </div>
  `;

  // Apply some overlay css if missing
  overlay.style.position = 'fixed';
  overlay.style.inset = '0';
  overlay.style.backgroundColor = '#f8fafc';
  overlay.style.display = 'flex';
  overlay.style.alignItems = 'center';
  overlay.style.justifyContent = 'center';
  overlay.style.zIndex = '99999';
  
  bindModalEvents();
  document.getElementById('login-phone-input').focus();
}

function bindModalEvents() {
  document.getElementById('login-send-otp-btn').addEventListener('click', handleSendOtp);
  document.getElementById('login-phone-input').addEventListener('keydown', (e) => { if (e.key === 'Enter') handleSendOtp(); });
  document.getElementById('login-phone-input').addEventListener('input', (e) => {
      e.target.value = e.target.value.replace(/\\D/g, '').slice(0,10);
      document.getElementById('login-phone-error').textContent = '';
  });

  const boxes = Array.from({ length: OTP_LENGTH }, (_, i) => document.getElementById(`otp-box-` + i));
  boxes.forEach((box, i) => {
    box.addEventListener('input', (e) => {
      e.target.value = e.target.value.replace(/\\D/g, '').slice(-1);
      if (e.target.value) {
        if (i < boxes.length - 1) boxes[i + 1].focus();
        else {
           if (boxes.every(b => b.value)) handleVerifyOtp();
        }
      }
      document.getElementById('login-otp-error').textContent = '';
    });
    box.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace' && !box.value && i > 0) {
        boxes[i - 1].value = '';
        boxes[i - 1].focus();
      } else if (e.key === 'Enter') {
        handleVerifyOtp();
      }
    });
  });

  document.getElementById('login-verify-btn').addEventListener('click', handleVerifyOtp);
  document.getElementById('login-resend-btn').addEventListener('click', handleResendOtp);
  document.getElementById('login-change-phone-btn').addEventListener('click', showPhoneStep);
}

function showPhoneStep() {
  stopCountdown();
  document.getElementById('login-step-phone').style.display = '';
  document.getElementById('login-step-otp').style.display = 'none';
  document.getElementById('login-phone-input').value = '';
  document.getElementById('login-phone-error').textContent = '';
  setTimeout(() => document.getElementById('login-phone-input').focus(), 50);
}

function showOtpStep() {
  document.getElementById('login-step-phone').style.display = 'none';
  document.getElementById('login-step-otp').style.display = '';
  document.getElementById('login-otp-phone-display').textContent = '+91 ' + currentPhone;
  const boxes = Array.from({ length: OTP_LENGTH }, (_, i) => document.getElementById(`otp-box-` + i));
  boxes.forEach(b => b.value = '');
  document.getElementById('login-otp-error').textContent = '';
  startCountdown();
  setTimeout(() => document.getElementById('otp-box-0').focus(), 50);
}

async function handleSendOtp() {
  const phone = document.getElementById('login-phone-input').value;
  if (phone.length !== 10) {
    document.getElementById('login-phone-error').textContent = 'Enter valid 10 digit number';
    return;
  }
  
  const btn = document.getElementById('login-send-otp-btn');
  btn.disabled = true;
  btn.textContent = 'Sending...';

  try {
    const config = await loadWidgetConfig();
    await loadMsg91Sdk();
    initMsg91(config);

    let retries = 50;
    while (typeof window.sendOtp !== 'function' && retries > 0) {
      await new Promise(r => setTimeout(r, 100));
      retries--;
    }
    
    if (typeof window.sendOtp !== 'function') {
      throw new Error('MSG91 SDK not ready. Please refresh and try again.');
    }

    currentPhone = phone;
    window.sendOtp('91' + phone, (data) => {
      currentReqId = data?.reqId || data?.message || null;
      showOtpStep();
      btn.disabled = false;
      btn.textContent = 'Continue';
    }, (err) => {
      document.getElementById('login-phone-error').textContent = err?.message || 'Failed to send OTP';
      btn.disabled = false;
      btn.textContent = 'Continue';
    });
  } catch (err) {
    document.getElementById('login-phone-error').textContent = err.message;
    btn.disabled = false;
    btn.textContent = 'Continue';
  }
}

async function handleVerifyOtp() {
  const boxes = Array.from({ length: OTP_LENGTH }, (_, i) => document.getElementById(`otp-box-` + i));
  const otp = boxes.map(b => b.value).join('');
  if (otp.length !== OTP_LENGTH) return;

  const btn = document.getElementById('login-verify-btn');
  btn.disabled = true;
  btn.textContent = 'Verifying...';

  window.verifyOtp(otp, async (data) => {
    const token = data?.access_token || data?.token || data?.message;
    try {
      if (!token || token.toLowerCase() === 'success') throw new Error('Verification error');
      
      const user = await loginWithBackend(token);
      
      // Admin verification
      if (user.role !== 'ROLE_ADMIN') {
         document.getElementById('login-otp-error').textContent = 'Access Denied: You do not have admin privileges.';
         btn.disabled = false;
         btn.textContent = 'Verify OTP';
         // We do not reload here so they see the error message.
         // They can't access the dashboard anyway because admin.js blocks it.
         return;
      }
      
      // Success
      window.location.reload();
      
    } catch (e) {
      document.getElementById('login-otp-error').textContent = e.message;
      btn.disabled = false;
      btn.textContent = 'Verify OTP';
    }
  }, (err) => {
    document.getElementById('login-otp-error').textContent = 'Incorrect OTP';
    btn.disabled = false;
    btn.textContent = 'Verify OTP';
  }, currentReqId);
}

function handleResendOtp() {
  const btn = document.getElementById('login-resend-btn');
  btn.disabled = true;
  window.retryOtp(null, (data) => {
    if (data?.reqId) currentReqId = data.reqId;
    startCountdown();
  }, (err) => {
    document.getElementById('login-otp-error').textContent = 'Failed to resend';
    btn.disabled = false;
  }, currentReqId);
}

function startCountdown() {
  stopCountdown();
  let seconds = RESEND_COUNTDOWN;
  const num = document.getElementById('login-countdown-num');
  const txt = document.getElementById('login-resend-countdown');
  const btn = document.getElementById('login-resend-btn');
  
  btn.disabled = true;
  txt.style.display = '';
  num.textContent = seconds;
  
  countdownTimer = setInterval(() => {
    seconds--;
    num.textContent = seconds;
    if (seconds <= 0) {
      stopCountdown();
      btn.disabled = false;
      txt.style.display = 'none';
    }
  }, 1000);
}

function stopCountdown() {
  if (countdownTimer) { clearInterval(countdownTimer); countdownTimer = null; }
}
