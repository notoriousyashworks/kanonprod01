import{a as G,s as S,i as U,l as K,b as Q,T as Y,U as J,h as X,u as z,j as B,r as Z}from"./login-modal.js_v_1-YKruNoRe.js";const ee="https://verify.msg91.com/otp-provider.js",P=4,N=30;let M=!1,b=!1,w=null,H="",k=null,x=null;async function te(){if(w)return w;try{const e=await fetch("/api/v1/users/auth/widget-config");if(!e.ok){const t=await e.text().catch(()=>"no body");throw new Error(`HTTP ${e.status}: ${t}`)}return w=await e.json(),w}catch(e){throw console.error("[KicksAura] Could not load MSG91 widget config:",e.message),new Error("API Error: "+e.message)}}function ne(){return new Promise((e,t)=>{if(window.initSendOTP){e();return}if(b){const l=setInterval(()=>{window.initSendOTP&&(clearInterval(l),e())},100);setTimeout(()=>{clearInterval(l),t(new Error("SDK load timeout"))},1e4);return}b=!0;const n=document.getElementById("msg91-otp-sdk");n&&n.remove();const i=document.createElement("script");i.id="msg91-otp-sdk",i.src=ee,i.onload=()=>{const l=setInterval(()=>{window.initSendOTP&&(clearInterval(l),b=!1,e())},50);setTimeout(()=>{clearInterval(l),t(new Error("initSendOTP unavailable"))},8e3)},i.onerror=()=>{b=!1,t(new Error("Failed to load MSG91 SDK"))},document.head.appendChild(i)})}function oe(e){M||(window.initSendOTP({widgetId:e.widgetId,tokenAuth:e.widgetToken,exposeMethods:!0,success:t=>{},failure:t=>console.error("MSG91 Init Failure:",t)}),M=!0)}function ie(e=null){let t=document.getElementById("login-modal-overlay");t||(t=document.createElement("div"),t.id="login-modal-overlay",t.className="login-modal-overlay",t.setAttribute("role","dialog"),t.setAttribute("aria-modal","true"),t.setAttribute("aria-label","Log in to KicksAura"),document.body.appendChild(t)),t.classList.add("checkout-mode");const n=`
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
          ${Array.from({length:P},(s,c)=>`
            <input
              type="text"
              inputmode="numeric"
              maxlength="1"
              class="login-otp-box"
              id="otp-box-${c}"
              aria-label="OTP digit ${c+1}"
              autocomplete="${c===0?"one-time-code":"off"}"
            />`).join("")}
        </div>
        <div class="login-error-msg" id="login-otp-error"></div>
        <button class="login-btn-primary" id="login-verify-btn" style="margin-top: 16px;">
          <span id="login-verify-text">Verify OTP</span>
        </button>
        <div class="login-resend-row">
          <button class="login-resend-btn" id="login-resend-btn" disabled>Resend OTP</button>
          <span class="login-resend-countdown" id="login-resend-countdown"> in <span id="login-countdown-num">${N}</span>s</span>
        </div>
        <p class="login-back-link">
          Wrong number? <button id="login-change-phone-btn">Change</button>
        </p>
      </div>
  `;let i="";if(e==="checkout"?i=`
      <h3 class="login-modal-left-title">Order summary</h3>
      <div class="login-modal-cart-items" id="login-modal-cart-list">
        <!-- Cart items will be rendered here -->
      </div>
    `:i=`
      <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; text-align: center;">
        <h2 style="color: white; font-size: 28px; margin-bottom: 8px;">Welcome</h2>
        <p style="color: rgba(255, 255, 255, 0.95); font-size: 14px; line-height: 1.5;">Log in to Access your Wishlist, Orders and more</p>
      </div>
    `,t.innerHTML=`
    <div class="login-modal checkout-mode" id="login-modal-panel">
      <button class="login-modal-close" id="login-modal-close" aria-label="Close">✕</button>
      
      <div class="login-modal-left-pane">
        <div class="login-modal-left-content" style="flex: 1;">
          ${i}
        </div>

      </div>
      
      <div class="login-modal-right-pane">
        <div class="login-modal-checkout-header">
          <h2>Log In</h2>
          <p>${e==="checkout"?"Confirm your mobile number to proceed to checkout":"Confirm your mobile number to proceed"}</p>
        </div>
        
        <div class="login-modal-inner">
          ${n}
          
          <div class="login-modal-footer-links">
            <a href="#" id="login-about-link">About Us</a> | <a href="#" id="login-shipping-link">Shipping & Delivery Policy</a>
          </div>
        </div>
      </div>
    </div>
  `,!document.getElementById("policy-modal-overlay")){const s=document.createElement("div");s.id="policy-modal-overlay",s.className="login-modal-overlay",s.style.zIndex="99999",s.innerHTML=`
      <div class="login-modal" style="max-width: 550px; padding: 0; text-align: left; display: flex; flex-direction: column; max-height: 85vh; border-radius: 20px; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.4);">
        <div style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 28px 32px; position: relative; flex-shrink: 0;">
          <h2 id="policy-modal-title" style="margin: 0; font-size: 26px; color: #ffffff; font-weight: 700; letter-spacing: -0.5px;"></h2>
          <button id="policy-modal-close" style="position: absolute; top: 24px; right: 24px; background: rgba(255,255,255,0.1); border: none; font-size: 16px; cursor: pointer; color: white; width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; transition: all 0.2s ease; outline: none;" onmouseover="this.style.background='rgba(255,255,255,0.2)'" onmouseout="this.style.background='rgba(255,255,255,0.1)'">✕</button>
        </div>
        <div id="policy-modal-content" style="padding: 32px; font-size: 15px; line-height: 1.7; color: #334155; overflow-y: auto; background: #ffffff;"></div>
      </div>
    `,document.body.appendChild(s),document.getElementById("policy-modal-close").addEventListener("click",()=>{document.getElementById("policy-modal-overlay").classList.remove("open")}),s.addEventListener("click",c=>{c.target===s&&s.classList.remove("open")})}le();const l=document.getElementById("login-about-link");l&&(l.onclick=s=>{s.preventDefault(),document.getElementById("policy-modal-title").textContent="About Us",document.getElementById("policy-modal-content").innerHTML=G,document.getElementById("policy-modal-overlay").classList.add("open")});const a=document.getElementById("login-shipping-link");a&&(a.onclick=s=>{s.preventDefault(),document.getElementById("policy-modal-title").textContent="Shipping & Delivery Policy",document.getElementById("policy-modal-content").innerHTML=S,document.getElementById("policy-modal-overlay").classList.add("open")})}function le(){document.getElementById("login-modal-close").addEventListener("click",I),document.getElementById("login-modal-overlay").addEventListener("click",n=>{n.target===document.getElementById("login-modal-overlay")&&I()}),document.addEventListener("keydown",n=>{n.key==="Escape"&&I()}),document.getElementById("login-send-otp-btn").addEventListener("click",D);const e=document.getElementById("login-phone-input");function t(){const n=document.getElementById("login-phone-display");if(!n)return;const i=e.value.replace(/\D/g,"").slice(0,10);let l="";for(let a=0;a<10;a++){const s=i[a]||"",c=a===i.length,o=a===4?"margin-right: 12px;":"",r=c&&document.activeElement===e?"border-bottom: 2px solid #0f172a;":"border-bottom: 2px solid #cbd5e1;";l+=`<span style="width: 14px; height: 28px; display: inline-flex; justify-content: center; align-items: center; font-size: 18px; font-weight: 600; color: ${s?"#0f172a":"transparent"}; ${r} ${o} transition: all 0.2s;">${s||"0"}</span>`}n.innerHTML=l}e.addEventListener("keydown",n=>{n.key==="Enter"&&D()}),e.addEventListener("input",n=>{let i=n.target.value.replace(/\D/g,"");i.length>10&&(i=i.slice(0,10)),n.target.value=i,t(),F()}),e.addEventListener("focus",t),e.addEventListener("blur",t),t(),se(),document.getElementById("login-verify-btn").addEventListener("click",E),document.getElementById("login-resend-btn").addEventListener("click",re),document.getElementById("login-change-phone-btn").addEventListener("click",()=>{A()})}function se(){const e=h();e.forEach((t,n)=>{t.addEventListener("input",i=>{const l=i.target.value.replace(/\D/g,"");i.target.value=l.slice(-1),l?(t.classList.add("filled"),t.classList.remove("error"),n<e.length-1?e[n+1].focus():Array.from(e).every(s=>s.value)&&E()):t.classList.remove("filled"),g()}),t.addEventListener("keydown",i=>{i.key==="Backspace"?!t.value&&n>0&&(e[n-1].value="",e[n-1].classList.remove("filled"),e[n-1].focus()):i.key==="Enter"&&E()}),t.addEventListener("paste",i=>{i.preventDefault();const l=(i.clipboardData||window.clipboardData).getData("text").replace(/\D/g,"");if(!l)return;e.forEach((s,c)=>{s.value=l[c]||"",l[c]?s.classList.add("filled"):s.classList.remove("filled")});const a=e.findIndex(s=>!s.value);a===-1?(e[e.length-1].focus(),E()):e[a].focus(),g()})})}function h(){return Array.from({length:P},(e,t)=>document.getElementById(`otp-box-${t}`))}function ae(){return h().map(e=>e.value).join("")}function T(){h().forEach(e=>{e.value="",e.classList.remove("filled","error")})}function A(){v(),document.getElementById("login-step-phone").style.display="",document.getElementById("login-step-otp").style.display="none";const e=document.getElementById("login-modal-title"),t=document.getElementById("login-modal-subtitle");e&&(e.textContent="Log In"),t&&(t.textContent="Enter your mobile number to continue");const n=document.getElementById("login-phone-input");n&&(n.value=""),T(),g(),m(!1),setTimeout(()=>{var i;return(i=document.getElementById("login-phone-input"))==null?void 0:i.focus()},50)}function de(){document.getElementById("login-step-phone").style.display="none",document.getElementById("login-step-otp").style.display="";const e=document.getElementById("login-modal-title"),t=document.getElementById("login-modal-subtitle");e&&(e.textContent="Enter OTP"),t&&(t.textContent="Check your SMS"),document.getElementById("login-otp-phone-display").textContent=`+91 ${H}`,T(),g(),u(!1),j(),setTimeout(()=>{var n;return(n=document.getElementById("otp-box-0"))==null?void 0:n.focus()},50)}async function D(){const e=document.getElementById("login-phone-input").value.trim().replace(/\D/g,"");if(!e||e.length!==10||!/^[6-9]/.test(e)){C("Please enter a valid 10-digit Indian mobile number.");return}m(!0),F();try{const t=await te();await ne(),oe(t);let n=50;for(;typeof window.sendOtp!="function"&&n>0;)await new Promise(l=>setTimeout(l,100)),n--;if(typeof window.sendOtp!="function")throw new Error("MSG91 SDK not ready. Please refresh and try again.");const i="91"+e;H=e,window.sendOtp(i,l=>{k=(l==null?void 0:l.reqId)||(l==null?void 0:l.message)||null,de(),m(!1)},l=>{const a=typeof l=="string"?l:(l==null?void 0:l.message)||"Could not send OTP. Please try again.";C(a),m(!1)})}catch(t){C(t.message||"Could not send OTP. Please try again."),m(!1)}}async function E(){const e=ae();if(e.length!==P){p("Please enter all 6 digits.");return}if(!k){p("Session expired. Please resend the OTP.");return}u(!0),g(),window.verifyOtp(e,async t=>{try{const n=(t==null?void 0:t.access_token)||(t==null?void 0:t.token)||(t==null?void 0:t.message);if(!n||n.toLowerCase()==="success"){p("Verification error. Please try again."),u(!1);return}const i=await K(n);u(!1),v(),I(),window.dispatchEvent(new CustomEvent("auth-changed",{detail:{loggedIn:!0,user:i}})),y&&(window.location.href=y);const l=document.getElementById("profile-dropdown-name");if(l){const a=[i.firstName,i.lastName].filter(Boolean).join(" ").trim()||`+91 ${i.phoneNumber}`;l.textContent=a}}catch(n){p(n.message||"Login failed. Please try again."),u(!1)}},t=>{const i=(typeof t=="string"?t:(t==null?void 0:t.message)||"Incorrect OTP. Please try again.").toLowerCase().includes("expired")?"OTP has expired. Please resend.":"Incorrect OTP. Please try again.";p(i);const l=h();l.forEach(a=>{a.classList.add("error"),a.value=""}),l[0]&&l[0].focus(),u(!1)},k)}function re(){const e=document.getElementById("login-resend-btn");if(!e.disabled){e.disabled=!0,g(),T();try{const t=window.retryOTP||window.retryOtp;if(typeof t!="function")throw new Error("OTP service is currently unavailable.");t("11",n=>{n!=null&&n.reqId&&(k=n.reqId),j()},n=>{const i=typeof n=="string"?n:(n==null?void 0:n.message)||"Could not resend OTP. Please try again.";p(i),e.disabled=!1})}catch(t){p(t.message||"An error occurred while resending OTP."),e.disabled=!1}}}function j(){v();let e=N;const t=document.getElementById("login-countdown-num"),n=document.getElementById("login-resend-countdown"),i=document.getElementById("login-resend-btn");!t||!i||(i.disabled=!0,n&&(n.style.display=""),t.textContent=e,x=setInterval(()=>{e--,t.textContent=e,e<=0&&(v(),i.disabled=!1,n&&(n.style.display="none"))},1e3))}function v(){x&&(clearInterval(x),x=null)}function C(e){var n;const t=document.getElementById("login-phone-error");t&&(t.textContent=e),(n=document.getElementById("login-phone-wrap"))==null||n.classList.add("error")}function F(){var t;const e=document.getElementById("login-phone-error");e&&(e.textContent=""),(t=document.getElementById("login-phone-wrap"))==null||t.classList.remove("error")}function p(e){const t=document.getElementById("login-otp-error");t&&(t.textContent=e)}function g(){const e=document.getElementById("login-otp-error");e&&(e.textContent=""),h().forEach(t=>t.classList.remove("error"))}function m(e){const t=document.getElementById("login-send-otp-btn");t&&(t.disabled=e,t.innerHTML=e?'<span class="login-spinner"></span><span>Sending…</span>':'<span id="login-send-otp-text">Continue</span>')}function u(e){const t=document.getElementById("login-verify-btn");t&&(t.disabled=e,t.innerHTML=e?'<span class="login-spinner"></span><span>Verifying…</span>':'<span id="login-verify-text">Verify OTP</span>')}let y=null;function q(e=null){let t=null;typeof e=="string"?y=e:e&&typeof e=="object"?(y=e.redirectUrl||null,t=e.context||null):y=null,ie(t);const n=document.getElementById("login-modal-overlay");if(n){if(t==="checkout"){const i=document.getElementById("login-modal-cart-list");if(i)try{const l=localStorage.getItem("kicksaura_cart"),a=l?JSON.parse(l):[];if(a.length===0)i.innerHTML='<p style="color:#888; font-size:14px;">Your cart is empty.</p>';else{i.innerHTML=a.map(o=>{const d=o.productImage&&o.productImage.startsWith("http")?o.productImage:o.productImage?`https://res.cloudinary.com/undefined/image/upload/w_200,h_200,c_fill,q_auto,f_auto/${o.productImage}`:"",r=(o.price*o.quantity).toLocaleString("en-IN");return`
              <div class="login-modal-cart-item" style="display: flex; gap: 16px; padding: 12px 0; border-bottom: 1px solid #e5e5e5; cursor: pointer;">
                <img src="${d}" alt="${o.productName}" style="width: 54px; height: 54px; border-radius: 50%; object-fit: cover; border: 1px solid #eee;" />
                <div style="flex: 1; display: flex; flex-direction: column; justify-content: center;">
                  <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 12px;">
                    <h4 style="margin: 0 0 6px 0; font-size: 14px; font-weight: 600; color: #111; line-height: 1.4;">${o.productName}</h4>
                    <span style="font-weight: 700; font-size: 15px; color: #111;">₹${r}</span>
                  </div>
                  <p style="margin: 0; font-size: 13px; color: #888;">Qty: ${o.quantity}</p>
                </div>
              </div>
            `}).join("");let s=0,c=0;a.forEach(o=>{s+=o.quantity,c+=o.price*o.quantity}),i.innerHTML+=`
            <div id="login-modal-cart-summary" style="display: none; padding-top: 24px; color: #111; cursor: default;">
              <div style="display: flex; justify-content: space-between; font-size: 15px; margin-bottom: 24px; color: #111;">
                <span>Subtotal</span>
                <span>₹${c.toLocaleString("en-IN")}</span>
              </div>
              <div style="border-top: 1.5px solid #111; margin-bottom: 24px;"></div>
              <div style="display: flex; justify-content: space-between; font-size: 18px; font-weight: 800; color: #111; margin-bottom: 8px;">
                <span>Grand Total</span>
                <span>₹${c.toLocaleString("en-IN")}</span>
              </div>
            </div>
          `,i.onclick=o=>{const d=document.getElementById("login-modal-cart-summary");d&&(d.style.display=d.style.display==="none"?"block":"none")}}}catch(l){console.error("Failed to load cart for login modal",l)}}A(),n.classList.add("open"),document.body.style.overflow="hidden"}}function I(){v();const e=document.getElementById("login-modal-overlay");e&&(e.classList.remove("open"),document.body.style.overflow="",e.classList.contains("checkout-mode")&&(U()||(window.location.href="/")))}function ge(){if(new URLSearchParams(window.location.search).get("login")==="1"){const e=()=>{q(window.location.pathname);const t=new URL(window.location);t.searchParams.delete("login"),window.history.replaceState({},"",t)};document.readyState==="loading"?document.addEventListener("DOMContentLoaded",e):setTimeout(e,50)}document.addEventListener("click",e=>{if(e.target.closest("#profile-login-btn")&&(e.preventDefault(),e.stopPropagation(),q(window.location.pathname)),e.target.closest("#profile-logout-btn")){e.preventDefault();const{logout:t}=window._kicksauraAuth||{};t&&t()}})}function ce(e){const t=String(e??"").trim();return t&&t.toLowerCase()!=="one size"&&t.toLowerCase()!=="n/a"}function f(){var c;const e=document.getElementById("cart-sidebar-items"),t=document.getElementById("cart-sidebar-footer"),n=document.getElementById("cart-sidebar-count"),i=document.getElementById("cart-shipping-banner");if(!e)return;const l=Q(),a=Y(),s=J();if(n&&(n.textContent=a>0?`(${a})`:""),i&&(i.innerHTML="",i.style.display="none"),l.length===0){e.innerHTML=`
      <div class="cart-sidebar-empty">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#ccc" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
        </svg>
        <p class="cart-empty-title">Your Cart is Empty</p>
        <a href="/products" class="cart-continue-btn" id="cart-continue-shopping">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          Continue Shopping
        </a>
      </div>`,t&&(t.innerHTML="");return}if(e.innerHTML=l.map(o=>{const d=o.productImage?X(o.productImage):"",r=Number(o.price||0),L=o.basePrice&&Number(o.basePrice)>r?Number(o.basePrice):null,$=`Rs. ${r.toLocaleString("en-IN")}.00`,O=L?`Rs. ${L.toLocaleString("en-IN")}.00`:null,V=`Rs. ${(r*o.quantity).toLocaleString("en-IN")}.00`,_=O?`<span style="text-decoration: line-through; color: #888; font-size: 13px; margin-right: 6px;">${O}</span><span style="font-weight: 700; color: #111;">${$}</span>`:`<span style="font-weight: 700; color: #111;">${$}</span>`,R=ce(o.size)?`<br/><span style="color: #666; font-size: 12.5px;">Size: ${o.size}</span>`:"",W=o.liveVideoCall?'<p class="modern-item-video-meta" style="margin-top: 4px; font-size: 11px; color: #16a34a; display: flex; align-items: center; gap: 4px;"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg> Video call before dispatch</p>':"";return`
      <div class="cart-sidebar-item modern-cart-item" data-product-id="${o.productId}" data-variant-id="${o.variantId}">
        <div class="cart-sidebar-img modern-item-img">
          <a href="/product-details?id=${o.productId}" target="_blank" style="display: block; width: 100%; height: 100%; text-decoration: none;">
            ${d?`<img src="${d}" alt="${o.productName}" />`:'<div class="cart-sidebar-img-placeholder" style="color: #111;">👟</div>'}
          </a>
        </div>
        <div class="cart-sidebar-details modern-item-details">
          <a href="/product-details?id=${o.productId}" target="_blank" style="text-decoration: none;">
            <p class="modern-item-name" style="margin-top: 0; font-weight: 600; font-size: 15px; color: #111;">${o.productName||"Product"}</p>
          </a>
          <p class="modern-item-unit-meta" style="margin-bottom: 6px;">${_}${R}</p>
          ${W}
          
          <div class="modern-item-controls">
            <div class="modern-qty-pill">
              ${o.quantity>1?`<button class="modern-qty-btn cart-qty-minus" data-pid="${o.productId}" data-size="${o.size}" data-video="${o.liveVideoCall}" aria-label="Decrease">−</button>`:""}
              <span class="modern-qty-num">${o.quantity}</span>
              <button class="modern-qty-btn cart-qty-plus" data-pid="${o.productId}" data-size="${o.size}" data-video="${o.liveVideoCall}" aria-label="Increase">+</button>
            </div>
            <button class="modern-trash-btn cart-remove-btn" data-pid="${o.productId}" data-size="${o.size}" data-video="${o.liveVideoCall}" aria-label="Remove item">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                <line x1="10" y1="11" x2="10" y2="17"></line>
                <line x1="14" y1="11" x2="14" y2="17"></line>
              </svg>
            </button>
          </div>

          <div class="modern-item-total-price">${V}</div>
        </div>
      </div>`}).join(""),t){let d=`<span style="font-size: 28px; font-weight: 600; color: #315bfb;">${`Rs. ${Number(s).toLocaleString("en-IN")}.00`}</span>`;t.innerHTML=`
      <div class="modern-cart-summary" style="border-top: none; padding-top: 10px; text-align: left;">
        <div class="modern-subtotal-row" style="display: block; margin-bottom: 12px;">
          <span class="modern-subtotal-label" style="font-size: 28px; font-weight: 600; color: #000;">Subtotal: </span>
          ${d}
        </div>
        <p class="modern-subtotal-subtext" style="color: #000; font-size: 16px;">Taxes, Discounts and <span class="shipping-policy-popup-link" style="color: #315bfb; cursor: pointer;">shipping</span> calculated at checkout</p>
        
        <button type="button" class="modern-checkout-btn" onclick="sessionStorage.setItem('checkout_intent', 'true'); window.location.href='/checkout'">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
          <span>Check Out</span>
        </button>

        <div class="modern-bottom-nav">
          <a href="/products" class="modern-continue-link" style="color: #315bfb; font-weight: 700; text-decoration: none;">← Continue Shopping</a>
          <a href="/cart" class="modern-view-cart-link" style="color: #315bfb; font-weight: 700; text-decoration: none;">View Cart →</a>
        </div>
      </div>`,(c=t.querySelector(".shipping-policy-popup-link"))==null||c.addEventListener("click",r=>{r.preventDefault(),pe()})}e.querySelectorAll(".cart-qty-plus").forEach(o=>{o.addEventListener("click",()=>{const d=l.find(r=>r.productId===o.dataset.pid&&String(r.size)===String(o.dataset.size)&&String(r.liveVideoCall)===String(o.dataset.video));d&&(z(d.productId,d.size,d.quantity+1),B(),f())})}),e.querySelectorAll(".cart-qty-minus").forEach(o=>{o.addEventListener("click",()=>{const d=l.find(r=>r.productId===o.dataset.pid&&String(r.size)===String(o.dataset.size)&&String(r.liveVideoCall)===String(o.dataset.video));!d||d.quantity<=1||(z(d.productId,d.size,d.quantity-1),B(),f())})}),e.querySelectorAll(".cart-remove-btn").forEach(o=>{o.addEventListener("click",()=>{const d=l.find(r=>r.productId===o.dataset.pid&&String(r.size)===String(o.dataset.size)&&String(r.liveVideoCall)===String(o.dataset.video));d&&(Z(d.productId,d.size),B(),f())})})}function pe(){let e=document.getElementById("policy-modal-overlay");if(!e)e=document.createElement("div"),e.className="policy-modal-overlay",e.id="policy-modal-overlay",e.setAttribute("role","dialog"),e.setAttribute("aria-modal","true"),e.innerHTML=`
      <div class="policy-modal" id="policy-modal">
        <div class="policy-modal-header">
          <h2 class="policy-modal-title">Shipping Policy</h2>
          <button type="button" class="policy-modal-close" onclick="document.getElementById('policy-modal-overlay').classList.remove('visible')">✕</button>
        </div>
        <div class="policy-modal-body">
          ${S}
        </div>
        <div class="policy-modal-footer">
          <button type="button" class="policy-modal-close-btn" onclick="document.getElementById('policy-modal-overlay').classList.remove('visible')">Close</button>
        </div>
      </div>
    `,e.addEventListener("click",t=>{t.target===e&&e.classList.remove("visible")}),document.body.appendChild(e);else{const t=e.querySelector(".policy-modal-title"),n=e.querySelector(".policy-modal-body");t&&(t.textContent="Shipping Policy"),n&&(n.innerHTML=S)}e.classList.add("visible")}function me(){const e=document.getElementById("cart-sidebar"),t=document.getElementById("cart-overlay"),n=document.getElementById("cart-trigger"),i=document.getElementById("close-cart");if(!e||!n)return;function l(){e.classList.add("open"),t==null||t.classList.add("open"),document.body.classList.add("sidebar-lock"),f()}function a(){e.classList.remove("open"),t==null||t.classList.remove("open"),document.body.classList.remove("sidebar-lock")}n.addEventListener("click",s=>{s.preventDefault(),l()}),i==null||i.addEventListener("click",a),t==null||t.addEventListener("click",a),document.addEventListener("click",s=>{s.target.closest("#close-cart")&&(s.preventDefault(),a())}),document.addEventListener("keydown",s=>{s.key==="Escape"&&e.classList.contains("open")&&a()}),window.addEventListener("cart-updated",()=>{e.classList.contains("open")&&f()})}export{ge as a,me as i,pe as o};
