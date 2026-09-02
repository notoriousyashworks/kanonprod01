(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const o of document.querySelectorAll('link[rel="modulepreload"]'))n(o);new MutationObserver(o=>{for(const i of o)if(i.type==="childList")for(const s of i.addedNodes)s.tagName==="LINK"&&s.rel==="modulepreload"&&n(s)}).observe(document,{childList:!0,subtree:!0});function a(o){const i={};return o.integrity&&(i.integrity=o.integrity),o.referrerPolicy&&(i.referrerPolicy=o.referrerPolicy),o.crossOrigin==="use-credentials"?i.credentials="include":o.crossOrigin==="anonymous"?i.credentials="omit":i.credentials="same-origin",i}function n(o){if(o.ep)return;o.ep=!0;const i=a(o);fetch(o.href,i)}})();const Q="kicksaura_auth_user";function ye(){const e=localStorage.getItem(Q);try{return e?JSON.parse(e):null}catch{return null}}function Se(e){e?localStorage.setItem(Q,JSON.stringify(e)):localStorage.removeItem(Q)}function Le(){localStorage.removeItem(Q)}function Be(){return!!ye()}async function Ae(e){const t=await fetch("/api/v1/users/auth/login",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({accessToken:e})});if(!t.ok){const n=await t.json().catch(()=>({}));throw new Error(n.error||"Login failed. Please try again.")}const a=await t.json();return Se({uuid:a.uuid,firstName:a.firstName,lastName:a.lastName,phoneNumber:a.phoneNumber,role:a.role,addresses:a.addresses||[]}),a}async function De(){try{await fetch("/api/v1/users/auth/logout",{method:"POST",credentials:"include"})}catch(e){console.error("Logout request failed",e)}Le(),window.dispatchEvent(new CustomEvent("auth-changed",{detail:{loggedIn:!1}})),window.location.href="/"}const Te="https://verify.msg91.com/otp-provider.js",F=4,Ee=30;let ve=!1,W=!1,Z=null,xe="",ce=null,Y=null;async function Ne(){if(Z)return Z;try{const e=await fetch("/api/v1/users/auth/widget-config");if(!e.ok){const t=await e.text().catch(()=>"no body");throw new Error(`HTTP ${e.status}: ${t}`)}return Z=await e.json(),Z}catch(e){throw console.error("[KicksAura] Could not load MSG91 config:",e.message),new Error("API Error: "+e.message)}}function Oe(){return new Promise((e,t)=>{if(window.initSendOTP){e();return}if(W){const o=setInterval(()=>{window.initSendOTP&&(clearInterval(o),e())},100);setTimeout(()=>{clearInterval(o),t(new Error("SDK load timeout"))},1e4);return}W=!0;const a=document.getElementById("msg91-otp-sdk");a&&a.remove();const n=document.createElement("script");n.id="msg91-otp-sdk",n.src=Te,n.onload=()=>{const o=setInterval(()=>{window.initSendOTP&&(clearInterval(o),W=!1,e())},50);setTimeout(()=>{clearInterval(o),t(new Error("initSendOTP unavailable"))},8e3)},n.onerror=()=>{W=!1,t(new Error("Failed to load MSG91 SDK"))},document.head.appendChild(n)})}function Ue(e){ve||(window.initSendOTP({widgetId:e.widgetId,tokenAuth:e.widgetToken,exposeMethods:!0,success:t=>console.log("MSG91 Init Success:",t),failure:t=>console.error("MSG91 Init Failure:",t)}),ve=!0)}function Re(){let e=document.getElementById("login-modal-overlay");e||(e=document.createElement("div"),e.id="login-modal-overlay",e.className="login-modal-overlay",document.body.appendChild(e));const t=`
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
        ${Array.from({length:F},(a,n)=>`<input type="text" maxlength="1" class="login-otp-box" id="otp-box-${n}" style="width:40px; height:48px; text-align:center; font-size:20px; border:1px solid #cbd5e1; border-radius:8px;" />`).join("")}
      </div>
      <div class="login-error-msg" id="login-otp-error" style="color:red; font-size:14px; text-align:center;"></div>
      <button id="login-verify-btn" style="width:100%; padding:12px; margin-top:16px; background:#0f172a; color:#fff; border:none; border-radius:8px; cursor:pointer; font-weight:bold;">Verify OTP</button>
      
      <div style="text-align:center; margin-top:16px; font-size:14px;">
        <button id="login-resend-btn" style="background:none; border:none; color:#2563eb; cursor:pointer;" disabled>Resend OTP</button>
        <span id="login-resend-countdown" style="color:#666;"> in <span id="login-countdown-num">${Ee}</span>s</span>
      </div>
      <div style="text-align:center; margin-top:8px; font-size:14px;">
        <button id="login-change-phone-btn" style="background:none; border:none; color:#2563eb; cursor:pointer;">Change Number</button>
      </div>
    </div>
  `;e.innerHTML=`
    <div class="login-modal" style="background:#fff; width:100%; max-width:400px; margin:auto; padding:32px; border-radius:12px; box-shadow:0 10px 25px rgba(0,0,0,0.1);">
      ${t}
    </div>
  `,e.style.position="fixed",e.style.inset="0",e.style.backgroundColor="#f8fafc",e.style.display="flex",e.style.alignItems="center",e.style.justifyContent="center",e.style.zIndex="99999",qe(),document.getElementById("login-phone-input").focus()}function qe(){document.getElementById("login-send-otp-btn").addEventListener("click",fe),document.getElementById("login-phone-input").addEventListener("keydown",t=>{t.key==="Enter"&&fe()}),document.getElementById("login-phone-input").addEventListener("input",t=>{t.target.value=t.target.value.replace(/\\D/g,"").slice(0,10),document.getElementById("login-phone-error").textContent=""});const e=Array.from({length:F},(t,a)=>document.getElementById("otp-box-"+a));e.forEach((t,a)=>{t.addEventListener("input",n=>{n.target.value=n.target.value.replace(/\\D/g,"").slice(-1),n.target.value&&(a<e.length-1?e[a+1].focus():e.every(o=>o.value)&&ne()),document.getElementById("login-otp-error").textContent=""}),t.addEventListener("keydown",n=>{n.key==="Backspace"&&!t.value&&a>0?(e[a-1].value="",e[a-1].focus()):n.key==="Enter"&&ne()})}),document.getElementById("login-verify-btn").addEventListener("click",ne),document.getElementById("login-resend-btn").addEventListener("click",ze),document.getElementById("login-change-phone-btn").addEventListener("click",Me)}function Me(){oe(),document.getElementById("login-step-phone").style.display="",document.getElementById("login-step-otp").style.display="none",document.getElementById("login-phone-input").value="",document.getElementById("login-phone-error").textContent="",setTimeout(()=>document.getElementById("login-phone-input").focus(),50)}function _e(){document.getElementById("login-step-phone").style.display="none",document.getElementById("login-step-otp").style.display="",document.getElementById("login-otp-phone-display").textContent="+91 "+xe,Array.from({length:F},(t,a)=>document.getElementById("otp-box-"+a)).forEach(t=>t.value=""),document.getElementById("login-otp-error").textContent="",we(),setTimeout(()=>document.getElementById("otp-box-0").focus(),50)}async function fe(){const e=document.getElementById("login-phone-input").value;if(e.length!==10){document.getElementById("login-phone-error").textContent="Enter valid 10 digit number";return}const t=document.getElementById("login-send-otp-btn");t.disabled=!0,t.textContent="Sending...";try{const a=await Ne();await Oe(),Ue(a);let n=50;for(;typeof window.sendOtp!="function"&&n>0;)await new Promise(o=>setTimeout(o,100)),n--;if(typeof window.sendOtp!="function")throw new Error("MSG91 SDK not ready. Please refresh and try again.");xe=e,window.sendOtp("91"+e,o=>{ce=(o==null?void 0:o.reqId)||(o==null?void 0:o.message)||null,_e(),t.disabled=!1,t.textContent="Continue"},o=>{document.getElementById("login-phone-error").textContent=(o==null?void 0:o.message)||"Failed to send OTP",t.disabled=!1,t.textContent="Continue"})}catch(a){document.getElementById("login-phone-error").textContent=a.message,t.disabled=!1,t.textContent="Continue"}}async function ne(){const t=Array.from({length:F},(n,o)=>document.getElementById("otp-box-"+o)).map(n=>n.value).join("");if(t.length!==F)return;const a=document.getElementById("login-verify-btn");a.disabled=!0,a.textContent="Verifying...",window.verifyOtp(t,async n=>{const o=(n==null?void 0:n.access_token)||(n==null?void 0:n.token)||(n==null?void 0:n.message);try{if(!o||o.toLowerCase()==="success")throw new Error("Verification error");if((await Ae(o)).role!=="ROLE_ADMIN"){document.getElementById("login-otp-error").textContent="Access Denied: You do not have admin privileges.",a.disabled=!1,a.textContent="Verify OTP";return}window.location.reload()}catch(i){document.getElementById("login-otp-error").textContent=i.message,a.disabled=!1,a.textContent="Verify OTP"}},n=>{document.getElementById("login-otp-error").textContent="Incorrect OTP",a.disabled=!1,a.textContent="Verify OTP"},ce)}function ze(){const e=document.getElementById("login-resend-btn");e.disabled=!0,document.getElementById("login-otp-error").textContent="";try{const t=window.retryOTP||window.retryOtp;if(typeof t!="function")throw new Error("OTP service is currently unavailable.");t("11",a=>{a!=null&&a.reqId&&(ce=a.reqId),we()},a=>{const n=typeof a=="string"?a:(a==null?void 0:a.message)||"Could not resend OTP. Please try again.";document.getElementById("login-otp-error").textContent=n,e.disabled=!1})}catch(t){document.getElementById("login-otp-error").textContent=t.message,e.disabled=!1}}function we(){oe();let e=Ee;const t=document.getElementById("login-countdown-num"),a=document.getElementById("login-resend-countdown"),n=document.getElementById("login-resend-btn");n.disabled=!0,a.style.display="",t.textContent=e,Y=setInterval(()=>{e--,t.textContent=e,e<=0&&(oe(),n.disabled=!1,a.style.display="none")},1e3)}function oe(){Y&&(clearInterval(Y),Y=null)}document.addEventListener("DOMContentLoaded",()=>{document.getElementById("view-store-link")});const $e=["ORDER_PLACED","ORDER_CONFIRMED","ORDER_DISPATCHED","ORDER_DELIVERED","CANCELLED","RETURNED"],Ve=["PENDING_REVIEW","PENDING","CONFIRMED","PACKED","SHIPPED","DELIVERED","CANCELLED","RETURNED"],X={ORDER_PLACED:"Order Placed",ORDER_CONFIRMED:"Order Confirmed",ORDER_DISPATCHED:"Order Dispatched",ORDER_DELIVERED:"Order Delivered",CANCELLED:"Cancelled",RETURNED:"Returned",PENDING_REVIEW:"Pending Review",PENDING:"Pending",CONFIRMED:"Confirmed",PACKED:"Packed",SHIPPED:"Shipped",DELIVERED:"Delivered"},He={ORDER_PLACED:"warning",ORDER_CONFIRMED:"info",ORDER_DISPATCHED:"purple",ORDER_DELIVERED:"success",CANCELLED:"danger",RETURNED:"neutral",PENDING_REVIEW:"warning",PENDING:"warning",CONFIRMED:"info",PACKED:"info",SHIPPED:"purple",DELIVERED:"success"},B=10,be=void 0,Fe=void 0,d={section:"dashboard",products:[],orders:[],stats:null,customers:[],categories:[],brands:[],coupons:[],reviews:[],pf:{search:"",category:"",page:1},of:{search:"",status:"",page:1},cf:{search:"",page:1},catPage:1,brandPage:1,couponPage:1,reviewPage:1},g={async req(e,t={}){const a=await fetch(e,{headers:{"Content-Type":"application/json",...t.headers},...t});if(a.status===204)return null;const n=await a.json().catch(()=>({}));if(a.status===401||a.status===403)throw localStorage.removeItem("kicksaura_auth_user"),window.location.reload(),new Error("Session expired. Please log in again.");if(!a.ok)throw new Error(n.error||`Server error ${a.status}`);return n},getAdminProducts:()=>g.req("/api/v1/admin/products?size=1000").then(e=>e.content||e),createProduct:e=>g.req("/api/v1/admin/products",{method:"POST",body:JSON.stringify(e)}),updateProduct:(e,t)=>g.req(`/api/v1/admin/products/${e}`,{method:"PUT",body:JSON.stringify(t)}),deleteProduct:e=>g.req(`/api/v1/admin/products/${e}`,{method:"DELETE"}),toggleVisibility:(e,t)=>g.req(`/api/v1/admin/products/${e}/visibility`,{method:"PATCH",body:JSON.stringify({isVisible:t})}),getAdminOrders:()=>g.req("/api/v1/admin/orders?size=1000").then(e=>e.content||e),getOrderStats:()=>g.req("/api/v1/admin/orders/stats"),updateOrderStatus:(e,t,a)=>g.req(`/api/v1/admin/orders/${e}/status`,{method:"PATCH",body:JSON.stringify({status:t,adminStatus:a})}),updateOrderFull:(e,t)=>g.req(`/api/v1/admin/orders/${e}/full-update`,{method:"PUT",body:JSON.stringify(t)}),getAdminUsers:()=>g.req("/api/v1/admin/users"),getCategories:()=>g.req("/api/v1/admin/categories"),createCategory:e=>g.req("/api/v1/admin/categories",{method:"POST",body:JSON.stringify(e)}),updateCategory:(e,t)=>g.req(`/api/v1/admin/categories/${e}`,{method:"PUT",body:JSON.stringify(t)}),deleteCategory:e=>g.req(`/api/v1/admin/categories/${e}`,{method:"DELETE"}),getBrands:()=>g.req("/api/v1/admin/brands"),createBrand:e=>g.req("/api/v1/admin/brands",{method:"POST",body:JSON.stringify(e)}),updateBrand:(e,t)=>g.req(`/api/v1/admin/brands/${e}`,{method:"PUT",body:JSON.stringify(t)}),deleteBrand:e=>g.req(`/api/v1/admin/brands/${e}`,{method:"DELETE"}),getCoupons:()=>g.req("/api/v1/admin/coupons"),createCoupon:e=>g.req("/api/v1/admin/coupons",{method:"POST",body:JSON.stringify(e)}),updateCoupon:(e,t)=>g.req(`/api/v1/admin/coupons/${e}`,{method:"PUT",body:JSON.stringify(t)}),deleteCoupon:e=>g.req(`/api/v1/admin/coupons/${e}`,{method:"DELETE"}),getReviews:()=>g.req("/api/v1/reviews"),createReview:e=>g.req("/api/v1/reviews",{method:"POST",body:JSON.stringify(e)}),deleteReview:e=>g.req(`/api/v1/reviews/${e}`,{method:"DELETE"})},I={currency(e){return e==null?"—":new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:0}).format(e)},date(e){return e?new Date(e).toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"}):"—"},datetime(e){return e?new Date(e).toLocaleString("en-IN",{day:"2-digit",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"}):"—"}};function p(e){return String(e??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}async function Ie(e,t="image",a=null){const n=new FormData;n.append("file",e),n.append("upload_preset",Fe),n.append("resource_type",t),a&&n.append("folder",a);const o=await fetch(`https://api.cloudinary.com/v1_1/${be}/${t}/upload`,{method:"POST",body:n});if(!o.ok)throw new Error("Cloudinary upload failed");const i=await o.json();return t==="image"||i.resource_type==="image"?`https://res.cloudinary.com/${be}/image/upload/f_auto,q_auto/${i.public_id}`:i.secure_url}const $={images:[],videos:[],activeUploads:0};async function je(e,t="image",a=null){const n=new FormData;n.append("file",e),a&&n.append("folder",a);const o=await fetch("/api/v1/admin/upload",{method:"POST",body:n});if(!o.ok){let s=`Upload failed (HTTP ${o.status})`;try{const r=await o.json();s=r.error||r.message||s}catch{}throw new Error(s)}const i=await o.json();if(!i.url)throw new Error("Backend returned no URL");return i.url}function re(e,t,a,n,o=null,i=!1){const s=document.getElementById(e);if(!s)return;function r(){const u=($[t]||[]).map((h,b)=>{const k=a==="video";let x=h;!k&&typeof h=="string"&&h.includes("/upload/")&&!h.includes("/f_auto")&&(x=h.replace("/upload/","/upload/f_auto,q_auto,c_limit,w_600/"));const w=k?`<video src="${x}" class="upload-thumb-video" muted playsinline></video>`:`<img src="${x}" class="upload-thumb-img" alt="Uploaded photo" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex'"><div style="display:none; width:100%; height:100%; align-items:center; justify-content:center; background:#1e1e1e; color:#bbb; font-size:11px; padding:8px; text-align:center; word-break:break-all;">${p(h.split("/").pop()||"photo")}</div>`;let C="",S="";return a==="image"&&(b===0?C='<span class="upload-cover-badge" style="position:absolute; bottom:6px; left:6px; right:6px; background:#e50914; color:#fff; font-size:11px; font-weight:700; padding:4px 0; text-align:center; border-radius:6px; z-index:2; box-shadow:0 2px 4px rgba(0,0,0,0.5);">★ Card Cover</span>':S=`<button type="button" class="upload-make-cover" data-idx="${b}" style="position:absolute; bottom:6px; left:6px; right:6px; background:rgba(0,0,0,0.85); color:#fff; font-size:11px; font-weight:600; padding:4px 0; text-align:center; border-radius:6px; border:1px solid rgba(255,255,255,0.25); cursor:pointer; z-index:2; transition:all 0.2s;" title="Set as primary product card cover">★ Make Cover</button>`),`<div class="upload-thumb" data-idx="${b}" style="position:relative;">
        ${w}
        ${C}
        ${S}
        <button type="button" class="upload-thumb-remove" data-idx="${b}" title="Remove">×</button>
      </div>`}).join(""),v=$["isUploading_"+t]||!1,E=v?`<span class="upload-hint" style="color:#f39c12; font-weight:600;">⏳ Uploading ${a}(s)... Please wait...</span>`:'<span class="upload-hint">Drop files here or <u>browse</u></span>';s.innerHTML=`
      <div class="upload-thumbs" id="${e}-thumbs">${u}</div>
      <label class="upload-dropzone ${v?"uploading":""}" id="${e}-zone" style="${v?"opacity:0.7; pointer-events:none;":""}">
        <input type="file" accept="${n}" multiple class="upload-file-input" id="${e}-input" ${v?"disabled":""}>
        <div class="upload-dropzone-inner">
          <span class="upload-icon">${v?"⏳":"☁"}</span>
          ${E}
          <span class="upload-sub">Uploads ${i?"directly to Cloudinary":"securely via Bunny Storage"}</span>
        </div>
      </label>
      <div class="upload-progress-bar" id="${e}-bar" style="${v?"display:block;":"display:none;"}">
        <div class="upload-progress-fill" id="${e}-fill"></div>
      </div>`,s.querySelectorAll(".upload-thumb-remove").forEach(h=>{h.addEventListener("click",()=>{$[t].splice(parseInt(h.dataset.idx),1),r()})}),s.querySelectorAll(".upload-make-cover").forEach(h=>{h.addEventListener("click",()=>{const b=parseInt(h.dataset.idx),[k]=$[t].splice(b,1);$[t].unshift(k),r(),y("Set as primary product card cover","success")})});const m=document.getElementById(`${e}-input`),f=document.getElementById(`${e}-zone`);m&&m.addEventListener("change",h=>c(Array.from(h.target.files))),f&&(f.addEventListener("dragover",h=>{h.preventDefault(),f.classList.add("dragover")}),f.addEventListener("dragleave",()=>f.classList.remove("dragover")),f.addEventListener("drop",h=>{h.preventDefault(),f.classList.remove("dragover"),c(Array.from(h.dataTransfer.files).filter(b=>b.type.startsWith(a+"/")))}))}async function c(l){if(!l.length)return;$["isUploading_"+t]=!0,$.activeUploads=($.activeUploads||0)+1,r();const u=document.getElementById(`${e}-bar`),v=document.getElementById(`${e}-fill`),E=document.getElementById("m-submit"),m=E?E.dataset.originalLabel||E.textContent:"Save";E&&(E.disabled=!0,E.textContent="⏳ Uploading Image…"),u&&(u.style.display="block");let f=0;for(const h of l)try{v&&(v.style.width=Math.round(f/l.length*100)+"%");const b=i?await Ie(h,a,o):await je(h,a,o);$[t].push(b),f++,v&&(v.style.width=Math.round(f/l.length*100)+"%")}catch(b){y(`Failed to upload ${h.name}: ${b.message}`,"error")}$["isUploading_"+t]=!1,$.activeUploads=Math.max(0,($.activeUploads||1)-1),E&&$.activeUploads===0&&(E.disabled=!1,E.textContent=m),r()}r()}function ee(e){const t=X[e]||e;return`<span class="badge badge-${He[e]||"neutral"}">${t}</span>`}function j(e,t,a){return e.slice((t-1)*a,t*a)}function K(e,t,a,n){const o=Math.ceil(e/a);if(o<=1)return"";let i="";for(let r=1;r<=o;r++)i+=`<button class="page-btn ${r===t?"active":""}" data-p="${r}">${r}</button>`;return`
    <div class="pagination" data-pagination-id="${`pg-${Date.now()}-${Math.random().toString(36).slice(2)}`}" data-current="${t}" data-total="${o}">
      <button class="page-btn" data-p="${Math.max(1,t-1)}" ${t===1?"disabled":""}>‹ Prev</button>
      ${i}
      <button class="page-btn" data-p="${Math.min(o,t+1)}" ${t===o?"disabled":""}>Next ›</button>
    </div>`}function G(e,t){e.querySelectorAll("[data-pagination-id] .page-btn[data-p]:not(:disabled)").forEach(a=>{a.addEventListener("click",()=>t(parseInt(a.dataset.p)))})}function O(e="Loading..."){document.getElementById("content-body").innerHTML=`
    <div class="loading-state"><div class="spinner"></div><p>${e}</p></div>`}function ue(e,t){const a=document.getElementById(e);if(!a)return;const n=document.activeElement;let o=null,i=0,s=0;if(n&&a.contains(n)&&(o=n.id,(n.tagName==="INPUT"||n.tagName==="TEXTAREA")&&(i=n.selectionStart,s=n.selectionEnd)),a.innerHTML=t,o){const r=document.getElementById(o);r&&(r.focus(),(r.tagName==="INPUT"||r.tagName==="TEXTAREA")&&r.setSelectionRange(i,s))}}function y(e,t="success"){const a=document.getElementById("toast-container"),n="tk-"+Date.now(),o=t==="success"?"✓":t==="error"?"✕":"ℹ";a.insertAdjacentHTML("beforeend",`<div class="toast toast-${t}" id="${n}">
       <span class="toast-icon">${o}</span>
       <span class="toast-message">${p(e)}</span>
     </div>`);const i=document.getElementById(n);requestAnimationFrame(()=>{requestAnimationFrame(()=>i.classList.add("toast-visible"))}),setTimeout(()=>{i.classList.remove("toast-visible"),setTimeout(()=>i.remove(),300)},3500)}let _=null;function J(e,t,a,n="Delete"){_=a,document.getElementById("confirm-title").textContent=t||"Are you sure?",document.getElementById("confirm-message").textContent=e,document.getElementById("confirm-ok").textContent=n,document.getElementById("confirm-overlay").classList.remove("hidden")}let de=null;function M(e,t,a,n){de=n||null,document.getElementById("modal-title").textContent=e,document.getElementById("modal-body").innerHTML=t;const o=document.getElementById("modal-footer");n?(o.innerHTML=`
      <button class="btn btn-secondary" id="m-cancel">Cancel</button>
      <button class="btn btn-primary" id="m-submit" data-original-label="${a||"Save"}">${a||"Save"}</button>`,document.getElementById("m-cancel").addEventListener("click",A),document.getElementById("m-submit").addEventListener("click",async()=>{const i=document.getElementById("m-submit");if(!(!i||i.disabled)){i.disabled=!0,i.textContent="Saving...";try{await de()}catch(s){y(s.message,"error"),i.disabled=!1,i.textContent=i.dataset.originalLabel||a||"Save"}}})):(o.innerHTML='<button class="btn btn-secondary" id="m-close">Close</button>',document.getElementById("m-close").addEventListener("click",A)),document.getElementById("modal-overlay").classList.remove("hidden")}function A(){document.getElementById("modal-overlay").classList.add("hidden"),document.getElementById("modal-body").innerHTML="",document.getElementById("modal-footer").innerHTML="",de=null}const Ke={dashboard:{title:"Dashboard",sub:"Overview of your store"},products:{title:"Products",sub:"Manage your product catalog"},orders:{title:"Orders",sub:"Manage customer orders"},customers:{title:"Customers",sub:"View and manage customers"},categories:{title:"Categories",sub:"Manage product categories"},brands:{title:"Brands",sub:"Manage brands available for products"},coupons:{title:"Coupons",sub:"Manage discount coupons"},reviews:{title:"Reviews",sub:"Manage customer review images"}};function ie(e){var a,n;d.section=e,document.querySelectorAll(".nav-item").forEach(o=>o.classList.toggle("active",o.dataset.section===e));const t=Ke[e]||{};document.getElementById("page-title").textContent=t.title||e,document.getElementById("page-subtitle").textContent=t.sub||"",document.getElementById("page-actions").innerHTML="",(n=(a={dashboard:Ge,products:Je,orders:tt,customers:nt,categories:st,brands:et,coupons:rt,reviews:dt})[e])==null||n.call(a)}async function Ge(){document.getElementById("content-body").innerHTML=`
      <div class="stats-grid" id="dash-stats">
        ${L("stat-icon--revenue",'<line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>',"Total Revenue","...")}
        ${L("stat-icon--orders",'<path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/>',"Total Orders","...")}
        ${L("stat-icon--pending",'<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',"Pending Orders","...")}
        ${L("stat-icon--customers",'<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',"Total Customers","...")}
        ${L("stat-icon--products",'<path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/>',"Total Products","...")}
      </div>
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">Recent Orders</h3>
          <button class="btn btn-ghost btn-sm" onclick="navigate('orders')">View All →</button>
        </div>
        <div class="table-wrapper">
          <table class="table">
            <thead><tr><th>Order #</th><th>City</th><th>Items</th><th>Amount</th><th>Status</th><th>Date</th></tr></thead>
            <tbody id="dash-recent-orders">
              <tr><td colspan="6" class="empty-row">Loading recent orders...</td></tr>
            </tbody>
          </table>
        </div>
      </div>`;try{const[e,t,a]=await Promise.all([g.getOrderStats(),d.products.length?Promise.resolve(d.products):g.getAdminProducts(),d.orders.length?Promise.resolve(d.orders):g.getAdminOrders()]);d.stats=e,d.products=t||[],d.orders=a||[];const n=document.getElementById("dash-stats");n&&(n.innerHTML=`
        ${L("stat-icon--revenue",'<line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>',"Total Revenue",I.currency((e==null?void 0:e.totalRevenue)||0))}
        ${L("stat-icon--orders",'<path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/>',"Total Orders",(e==null?void 0:e.totalOrders)||0)}
        ${L("stat-icon--pending",'<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',"Pending Orders",(e==null?void 0:e.pendingOrders)||0)}
        ${L("stat-icon--customers",'<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',"Total Customers",(e==null?void 0:e.totalCustomers)||0)}
        ${L("stat-icon--products",'<path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/>',"Total Products",d.products.length)}
      `);const o=[...d.orders].slice(0,8),i=document.getElementById("dash-recent-orders");i&&(i.innerHTML=o.length===0?'<tr><td colspan="6" class="empty-row">No orders yet</td></tr>':o.map(s=>{var r,c;return`<tr>
            <td><strong class="order-number">${p(s.orderNumber)}</strong></td>
            <td class="text-muted">${p(((r=s.shippingAddress)==null?void 0:r.city)||"—")}</td>
            <td>${((c=s.items)==null?void 0:c.length)||0}</td>
            <td><strong>${I.currency(s.totalAmount)}</strong></td>
            <td>${ee(s.status)}</td>
            <td class="text-muted text-sm">${I.datetime(s.createdAt)}</td>
          </tr>`}).join(""))}catch(e){y("Failed to load dashboard data: "+e.message,"error")}}function L(e,t,a,n){return`<div class="stat-card">
    <div class="stat-icon ${e}">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${t}</svg>
    </div>
    <div class="stat-info">
      <div class="stat-label">${a}</div>
      <div class="stat-value">${n}</div>
    </div>
  </div>`}async function Je(){O();try{const[e,t,a]=await Promise.all([g.getAdminProducts(),d.categories.length?Promise.resolve(d.categories):g.getCategories(),d.brands.length?Promise.resolve(d.brands):g.getBrands()]);d.products=e||[],t&&(d.categories=t),a&&(d.brands=a),d.pf={search:"",category:"",page:1},N()}catch(e){y("Failed to load products: "+e.message,"error")}}function N(){const{search:e,category:t,page:a}=d.pf,n=d.categories.map(r=>r.name).sort();let o=d.products;if(e){const r=e.toLowerCase();o=o.filter(c=>{var l,u;return((l=c.name)==null?void 0:l.toLowerCase().includes(r))||((u=c.brand)==null?void 0:u.toLowerCase().includes(r))})}t&&(o=o.filter(r=>r.category===t));const i=o.length,s=j(o,a,B);document.getElementById("page-actions").innerHTML='<button class="btn btn-primary" id="btn-add-product">+ Add Product</button>',ue("content-body",`
    <div class="toolbar">
      <div class="toolbar-left">
        <div class="search-box">
          <svg class="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input type="text" class="search-input" id="prod-search" placeholder="Search products…" value="${p(e)}">
        </div>
        <select class="filter-select" id="cat-filter">
          <option value="">All Categories</option>
          ${n.map(r=>`<option value="${p(r)}" ${r===t?"selected":""}>${p(r)}</option>`).join("")}
        </select>
      </div>
      <span class="result-count">${i} product${i!==1?"s":""}</span>
    </div>
    <div class="card">
      <div class="table-wrapper">
        <table class="table">
          <thead><tr>
            <th>Product</th><th>Category</th><th>Price</th>
            <th>Variants</th><th>Status</th><th>Actions</th>
          </tr></thead>
          <tbody>
            ${s.length===0?'<tr><td colspan="6" class="empty-row">No products found</td></tr>':s.map(r=>{var c,l;return`<tr>
                  <td>
                    <div class="product-cell">
                      ${(c=r.imageUrls)!=null&&c[0]?`<img src="${p(r.imageUrls[0])}" alt="" class="product-thumb">`:'<div class="product-thumb-placeholder">👟</div>'}
                      <div>
                        <div class="product-name">${p(r.name)}</div>
                        <div class="product-brand text-muted">${p(r.brand)}</div>
                      </div>
                    </div>
                  </td>
                  <td><span class="category-tag">${p(r.category||"—")}</span></td>
                  <td>
                    <div class="price-cell">
                      ${r.discountedPrice?`<span class="price-discounted">${I.currency(r.discountedPrice)}</span>`:""}
                      <span class="${r.discountedPrice?"price-strikethrough":"price-base"}">${I.currency(r.basePrice)}</span>
                    </div>
                  </td>
                  <td><span class="variant-count">${((l=r.variants)==null?void 0:l.length)||0} var.</span></td>
                  <td>
                    <button class="toggle-visibility ${r.visible?"visible-on":"visible-off"}"
                            data-id="${r.id}" data-vis="${r.visible}">
                      ${r.visible?"Visible":"Hidden"}
                    </button>
                  </td>
                  <td>
                    <div class="action-btns">
                      <button class="btn-icon btn-icon--edit" data-action="edit" data-id="${r.id}" title="Edit">
                        ${Pe()}</button>
                      <button class="btn-icon btn-icon--copy" data-action="dup" data-id="${r.id}" title="Duplicate">
                        ${ct()}</button>
                      <button class="btn-icon btn-icon--delete" data-action="del" data-id="${r.id}" title="Delete">
                        ${pe()}</button>
                    </div>
                  </td>
                </tr>`}).join("")}
          </tbody>
        </table>
      </div>
      ${K(i,a,B)}
    </div>`),document.getElementById("btn-add-product").addEventListener("click",()=>se()),document.getElementById("prod-search").addEventListener("input",r=>{d.pf.search=r.target.value,d.pf.page=1,N()}),document.getElementById("cat-filter").addEventListener("change",r=>{d.pf.category=r.target.value,d.pf.page=1,N()}),document.querySelectorAll(".toggle-visibility").forEach(r=>r.addEventListener("click",async()=>{const c=r.dataset.vis==="true";try{await g.toggleVisibility(r.dataset.id,!c);const l=d.products.find(u=>u.id===r.dataset.id);l&&(l.visible=!c),y(`Product ${c?"hidden":"visible"}`),N()}catch(l){y(l.message,"error")}})),document.querySelectorAll('[data-action="edit"]').forEach(r=>r.addEventListener("click",()=>{const c=d.products.find(l=>l.id===r.dataset.id);c&&se(c)})),document.querySelectorAll('[data-action="dup"]').forEach(r=>r.addEventListener("click",()=>{const c=d.products.find(l=>l.id===r.dataset.id);c&&se({...c,id:null,name:c.name+" (Copy)"})})),document.querySelectorAll('[data-action="del"]').forEach(r=>r.addEventListener("click",()=>{const c=d.products.find(l=>l.id===r.dataset.id);J(`Delete "${c==null?void 0:c.name}"? This cannot be undone.`,"Delete Product",async()=>{await g.deleteProduct(r.dataset.id),d.products=d.products.filter(l=>l.id!==r.dataset.id),y("Product deleted"),N()})})),G(document.getElementById("content-body"),r=>{d.pf.page=r,N()})}async function se(e=null){var c;if(!d.categories.length)try{d.categories=await g.getCategories()||[]}catch{}if(!d.brands.length)try{d.brands=await g.getBrands()||[]}catch{}const t=!!(e!=null&&e.id),a=["UK 5","UK 5.5","UK 6","UK 6.5","UK 7","UK 7.5","UK 8","UK 8.5","UK 9","UK 9.5","UK 10","UK 10.5","UK 11","UK 11.5","UK 12"],n=["UK 7","UK 7.5","UK 8","UK 8.5","UK 9","UK 9.5","UK 10","UK 10.5"],o={};t&&((c=e==null?void 0:e.variants)!=null&&c.length)&&e.variants.forEach(l=>{o[l.size]=l});function i(){return a.map((l,u)=>{const v=o[l],E=n.includes(l),m=t?!!v:E,f=t?(v==null?void 0:v.stockQuantity)??0:E?10:0,h=l.replace("UK ","");return`
        <div class="size-grid-item ${m?"":"size-grid-item--off"}" data-size="${p(l)}">
          <label class="size-grid-check">
            <input type="checkbox" class="sg-check" data-size="${p(l)}" ${m?"checked":""}>
            <span class="sg-size-label">${p(h)}</span>
          </label>
          <input type="number" class="sg-stock form-input" data-size="${p(l)}"
            placeholder="Stock" value="${f}" min="0"
            ${m?"":"disabled"}>
        </div>`}).join("")}const s=i(),r=`<form id="prod-form" autocomplete="off">
    <div class="form-grid-2">
      <div class="form-group">
        <label class="form-label">Product Name *</label>
        <input class="form-input" name="name" value="${p((e==null?void 0:e.name)||"")}" required placeholder="e.g. Nike Air Max 90">
      </div>
      <div class="form-group">
        <label class="form-label">Search Name <small class="text-muted">(for indexing)</small></label>
        <input class="form-input" name="searchName" value="${p((e==null?void 0:e.searchName)||"")}" placeholder="lowercase name">
      </div>
    </div>
    <div class="form-grid-2">
      <div class="form-group">
        <label class="form-label">Brand *</label>
        <input type="hidden" name="brand" id="brand-hidden" value="${p((e==null?void 0:e.brand)||"")}" required>
        <button type="button" class="cat-picker-btn" id="brand-picker-btn">
          <span id="brand-picker-label">${p((e==null?void 0:e.brand)||"Select a brand…")}</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
        </button>
        <div class="cat-picker-popup hidden" id="brand-picker-popup">
          <input class="cat-picker-search" id="brand-picker-search" placeholder="Search brands…" autocomplete="off">
          <div class="cat-picker-grid" id="brand-picker-grid"></div>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Search Brand <small class="text-muted">(for indexing)</small></label>
        <input class="form-input" name="searchBrand" value="${p((e==null?void 0:e.searchBrand)||"")}" placeholder="lowercase brand">
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">Category *</label>
      <input type="hidden" name="category" id="cat-hidden" value="${p((e==null?void 0:e.category)||"")}" required>
      <button type="button" class="cat-picker-btn" id="cat-picker-btn">
        <span id="cat-picker-label">${p((e==null?void 0:e.category)||"Select a category…")}</span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
      </button>
      <div class="cat-picker-popup hidden" id="cat-picker-popup">
        <input class="cat-picker-search" id="cat-picker-search" placeholder="Search categories…" autocomplete="off">
        <div class="cat-picker-grid" id="cat-picker-grid"></div>
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">Hidden Search Keywords <small class="text-muted">(for searching synonyms, tags, etc.)</small></label>
      <input class="form-input" name="searchText" value="${p((e==null?void 0:e.searchText)||"")}" placeholder="e.g. running, sports, casual, sneaker">
    </div>
    <div class="form-group">
      <label class="form-label">Description</label>
      <textarea class="form-textarea" name="description" rows="3">${p((e==null?void 0:e.description)||"")}</textarea>
    </div>
    <div class="form-grid-2">
      <div class="form-group">
        <label class="form-label">Original Price (₹) *</label>
        <input type="number" class="form-input" name="basePrice" value="${(e==null?void 0:e.basePrice)||""}" min="0" step="1" required>
      </div>
      <div class="form-group">
        <label class="form-label">Selling Price (₹) <small class="text-muted">optional</small></label>
        <input type="number" class="form-input" name="discountedPrice" value="${(e==null?void 0:e.discountedPrice)||""}" min="0" step="1" placeholder="Leave blank = no discount">
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">Images <small class="text-muted">(First image with <b>★ Card Cover</b> will be your primary Product Card image across the store. Click <b>Make Cover</b> on any thumbnail to select it)</small></label>
      <div id="img-uploader"></div>
    </div>
    <div class="form-group">
      <label class="form-label">Videos <small class="text-muted">(optional — drag & drop or browse)</small></label>
      <div id="vid-uploader"></div>
    </div>
    <div class="form-group">
      <label class="form-checkbox-label">
        <input type="checkbox" name="isVisible" ${(e==null?void 0:e.visible)!==!1?"checked":""}> Active / Visible on store
      </label>
      <label class="form-checkbox-label" style="margin-top: 8px;">
        <input type="checkbox" name="isSaleVisible" ${e!=null&&e.saleVisible?"checked":""}> Sale Badge Visible
      </label>
      <label class="form-checkbox-label" style="margin-top: 8px;">
        <input type="checkbox" name="isVideoVisible" ${e!=null&&e.videoVisible?"checked":""}> Video Available Badge Visible
      </label>
      <label class="form-checkbox-label" style="margin-top: 8px;">
        <input type="checkbox" name="isLimitedStock" ${e!=null&&e.limitedStock?"checked":""}> Limited Stock Badge Visible
      </label>
      <label class="form-checkbox-label" style="margin-top: 8px;">
        <input type="checkbox" name="isNewArrival" ${e!=null&&e.newArrival?"checked":""}> New Arrival
      </label>
      <label class="form-checkbox-label" style="margin-top: 8px;">
        <input type="checkbox" name="isTrending" ${e!=null&&e.trending?"checked":""}> Trending
      </label>
      <label class="form-checkbox-label" style="margin-top: 8px;">
        <input type="checkbox" name="withOgBox" ${e!=null&&e.withOgBox?"checked":""}> With OG Box
      </label>
      <label class="form-checkbox-label" style="margin-top: 8px;">
        <input type="checkbox" name="isInStockFlag" ${e?e.inStockFlag?"checked":"":"checked"}> In Stock
      </label>
    </div>

    <div class="form-section-divider"><span>Sizes & Stock</span></div>
    <p class="form-hint" style="margin: -4px 0 12px; color: #888; font-size: 12.5px;">
      Sizes are optional. Keep them selected for shoes, or uncheck every size for products that do not need size selection.
    </p>
    <div id="size-grid-wrap" class="size-grid-wrap">
      ${s}
    </div>
  </form>`;$.images=e!=null&&e.imageUrls?[...e.imageUrls]:[],$.videos=e!=null&&e.videoUrls?[...e.videoUrls]:[],$.isUploading_images=!1,$.isUploading_videos=!1,$.activeUploads=0,M(t?"Edit Product":"Add New Product",r,t?"Update":"Create",async()=>{if($.activeUploads>0||$.isUploading_images||$.isUploading_videos)throw new Error("Please wait for the image upload to finish.");const l=document.getElementById("prod-form"),u=Qe(l);if(Ye(l,u),t){const v=await g.updateProduct(e.id,u),E=d.products.findIndex(m=>m.id===e.id);E!==-1&&(d.products[E]=v),y("Product updated")}else{const v=await g.createProduct(u);d.products.unshift(v),y("Product created")}A(),N()}),requestAnimationFrame(()=>{re("img-uploader","images","image","image/*","kicks-aura/products/images"),re("vid-uploader","videos","video","video/*","kicks-aura/products/videos"),We(),Xe(),document.querySelectorAll(".sg-check").forEach(l=>{l.addEventListener("change",()=>{const u=l.closest(".size-grid-item"),v=u.querySelector(".sg-stock");l.checked?(u.classList.remove("size-grid-item--off"),v.disabled=!1,(!v.value||v.value==="0")&&(v.value=10)):(u.classList.add("size-grid-item--off"),v.disabled=!0,v.value=0)})})})}function We(){const e=document.getElementById("cat-picker-btn"),t=document.getElementById("cat-picker-popup"),a=document.getElementById("cat-picker-search"),n=document.getElementById("cat-picker-grid"),o=document.getElementById("cat-hidden"),i=document.getElementById("cat-picker-label");if(!e)return;let s=o.value||"";function r(c=""){const l=d.categories.filter(u=>!c||u.name.toLowerCase().includes(c.toLowerCase()));if(!l.length){n.innerHTML='<p class="cat-picker-empty">No categories found</p>';return}n.innerHTML=l.map(u=>`
      <button type="button" class="cat-chip ${u.name===s?"active":""}" data-name="${p(u.name)}">
        ${u.imageUrl?`<img src="${p(u.imageUrl)}" alt="">`:""}
        <span>${p(u.name)}</span>
      </button>`).join(""),n.querySelectorAll(".cat-chip").forEach(u=>{u.addEventListener("click",()=>{s=u.dataset.name,o.value=s,i.textContent=s,t.classList.add("hidden"),e.classList.remove("cat-picker-btn--error","input-error")})})}e.addEventListener("click",c=>{c.stopPropagation(),t.classList.toggle("hidden"),t.classList.contains("hidden")||(r(),a.value="",a.focus())}),a.addEventListener("input",()=>r(a.value)),document.addEventListener("click",function c(l){!t.contains(l.target)&&l.target!==e&&(t.classList.add("hidden"),document.removeEventListener("click",c))}),r()}function Ze(e){e.querySelectorAll(".input-error").forEach(t=>t.classList.remove("input-error"))}function q(e){const t=document.querySelector(e);t&&(t.classList.add("input-error"),t.scrollIntoView({behavior:"smooth",block:"center"}),typeof t.focus=="function"&&t.focus({preventScroll:!0}))}function Ye(e,t){if(Ze(e),!t.name)throw q('[name="name"]'),new Error("Please enter a product name.");if(!t.brand)throw q("#brand-picker-btn"),new Error("Please select a brand.");if(!t.category)throw q("#cat-picker-btn"),new Error("Please select a category.");if(!t.basePrice||t.basePrice<=0)throw q('[name="basePrice"]'),new Error("Please enter a valid original price.");if(t.discountedPrice!==null&&t.discountedPrice<0)throw q('[name="discountedPrice"]'),new Error("Selling price cannot be negative.");if(!t.imageUrls||t.imageUrls.length===0)throw q("#img-uploader"),new Error("Please upload at least one product image.")}function Qe(e){var i,s,r,c,l,u,v,E;const t=m=>{var f,h;return((h=(f=e.querySelector(`[name="${m}"]`))==null?void 0:f.value)==null?void 0:h.trim())||""},a=[],n=t("brand").toUpperCase().replace(/[^A-Z0-9]/g,"");return e.querySelectorAll(".size-grid-item:not(.size-grid-item--off)").forEach(m=>{var k;const f=m.dataset.size,h=parseInt(((k=m.querySelector(".sg-stock"))==null?void 0:k.value)||"0",10),b=`${n}-${f.replace(/[^A-Z0-9]/g,"")}`;f&&a.push({size:f,stockQuantity:h,sku:b})}),{name:t("name"),searchName:t("searchName")||t("name").toLowerCase(),brand:t("brand"),searchBrand:t("searchBrand")||t("brand").toLowerCase(),searchText:t("searchText"),category:t("category"),description:t("description"),basePrice:parseFloat(t("basePrice"))||0,discountedPrice:parseFloat(t("discountedPrice"))||null,imageUrls:[...$.images],videoUrls:[...$.videos],visible:((i=e.querySelector('[name="isVisible"]'))==null?void 0:i.checked)??!0,saleVisible:((s=e.querySelector('[name="isSaleVisible"]'))==null?void 0:s.checked)??!1,videoVisible:((r=e.querySelector('[name="isVideoVisible"]'))==null?void 0:r.checked)??!1,limitedStock:((c=e.querySelector('[name="isLimitedStock"]'))==null?void 0:c.checked)??!1,newArrival:((l=e.querySelector('[name="isNewArrival"]'))==null?void 0:l.checked)??!1,trending:((u=e.querySelector('[name="isTrending"]'))==null?void 0:u.checked)??!1,withOgBox:((v=e.querySelector('[name="withOgBox"]'))==null?void 0:v.checked)??!1,inStockFlag:((E=e.querySelector('[name="isInStockFlag"]'))==null?void 0:E.checked)??!0,variants:a}}function Xe(){const e=document.getElementById("brand-picker-btn"),t=document.getElementById("brand-picker-popup"),a=document.getElementById("brand-picker-search"),n=document.getElementById("brand-picker-grid"),o=document.getElementById("brand-hidden"),i=document.getElementById("brand-picker-label");if(!e)return;let s=o.value||"";function r(c=""){const l=d.brands.filter(u=>!c||u.name.toLowerCase().includes(c.toLowerCase()));if(!l.length){n.innerHTML='<p class="cat-picker-empty">No brands found. Add one in the Brands section first.</p>';return}n.innerHTML=l.map(u=>`
      <button type="button" class="cat-chip ${u.name===s?"active":""}" data-name="${p(u.name)}">
        <span>${p(u.name)}</span>
      </button>`).join(""),n.querySelectorAll(".cat-chip").forEach(u=>{u.addEventListener("click",()=>{s=u.dataset.name,o.value=s,i.textContent=s,t.classList.add("hidden"),e.classList.remove("cat-picker-btn--error","input-error")})})}e.addEventListener("click",c=>{c.stopPropagation(),t.classList.toggle("hidden"),t.classList.contains("hidden")||(r(),a.value="",a.focus())}),a.addEventListener("input",()=>r(a.value)),document.addEventListener("click",function c(l){!t.contains(l.target)&&l.target!==e&&(t.classList.add("hidden"),document.removeEventListener("click",c))}),r()}async function et(){O();try{const e=await g.getBrands();d.brands=e||[],z()}catch(e){y("Failed to load brands: "+e.message,"error")}}function z(e=null){var o;document.getElementById("page-actions").innerHTML="";const t=!!e,a={};d.products.forEach(i=>{if(i.brand){const s=i.brand.toLowerCase();a[s]=(a[s]||0)+1}});const n=d.brands.map(i=>{const s=a[i.name.toLowerCase()]||0;return`
    <div class="cat-card" data-id="${i.id}">
      <div class="cat-card-img" style="display:flex;align-items:center;justify-content:center;font-size:32px;background:#1a1a1a;">🏷️</div>
      <div class="cat-card-info">
        <span class="cat-card-name">${p(i.name)}</span>
        <span class="badge ${i.active?"badge-success":"badge-neutral"} cat-card-badge">${i.active?"Active":"Inactive"}</span>
      </div>
      <div class="cat-product-count">
        <span class="cat-product-count-icon">📦</span>
        <span>${s} product${s!==1?"s":""}</span>
      </div>
      <div class="cat-card-actions">
        <button class="btn btn-sm btn-secondary edit-brand-inline" data-id="${i.id}">Edit</button>
        <button class="btn btn-sm btn-danger del-brand-inline" data-id="${i.id}">Delete</button>
      </div>
    </div>`}).join("")||'<p class="cat-empty-msg">No brands yet. Add your first one →</p>';document.getElementById("content-body").innerHTML=`
    <div class="cat-page-layout">
      <!-- Form panel -->
      <div class="cat-form-panel">
        <div class="cat-form-header">
          <h3 class="cat-form-title">${t?"✏️ Edit Brand":"➕ Add Brand"}</h3>
          ${t?'<button class="btn btn-sm btn-secondary" id="brand-cancel-edit">Cancel</button>':""}
        </div>
        <form id="brand-inline-form" novalidate>
          <div class="form-group">
            <label class="form-label">Brand Name <span class="form-required">*</span></label>
            <input class="form-input" id="brand-name-input" type="text"
              value="${p((e==null?void 0:e.name)||"")}"
              placeholder="e.g. Nike, New Balance, Adidas…"
              autocomplete="off" required>
          </div>
          <div class="form-group">
            <label class="form-checkbox-label">
              <input type="checkbox" id="brand-active-check" ${(e==null?void 0:e.active)!==!1?"checked":""}> Active / Available for products
            </label>
          </div>
          <button type="submit" class="btn btn-primary cat-submit-btn" id="brand-submit-btn">
            ${t?"Update Brand":"Create Brand"}
          </button>
        </form>
      </div>
      <!-- Brand cards grid -->
      <div class="cat-grid-panel">
        <h3 class="cat-grid-title">All Brands <span class="cat-count-badge">${d.brands.length}</span></h3>
        <div class="cat-cards-grid">
          ${n}
        </div>
      </div>
    </div>`,(o=document.getElementById("brand-cancel-edit"))==null||o.addEventListener("click",()=>z()),document.getElementById("brand-inline-form").addEventListener("submit",async i=>{i.preventDefault();const s=document.getElementById("brand-name-input").value.trim();if(!s){y("Brand name is required","error");return}const r=document.getElementById("brand-active-check").checked,c=document.getElementById("brand-submit-btn");c.disabled=!0,c.textContent=t?"Updating…":"Creating…";try{if(t){const l=await g.updateBrand(e.id,{name:s,active:r}),u=d.brands.findIndex(v=>v.id===e.id);u!==-1&&(d.brands[u]=l),y("Brand updated")}else{const l=await g.createBrand({name:s,active:r});d.brands.push(l),y("Brand created")}z()}catch(l){y(l.message,"error"),c.disabled=!1,c.textContent=t?"Update Brand":"Create Brand"}}),document.querySelectorAll(".edit-brand-inline").forEach(i=>{i.addEventListener("click",()=>{const s=d.brands.find(r=>r.id===i.dataset.id);s&&z(s)})}),document.querySelectorAll(".del-brand-inline").forEach(i=>{i.addEventListener("click",()=>{const s=d.brands.find(r=>r.id===i.dataset.id);J(`Delete brand "${s==null?void 0:s.name}"? Products using this brand will keep the name string.`,"Delete Brand",async()=>{await g.deleteBrand(i.dataset.id),d.brands=d.brands.filter(r=>r.id!==i.dataset.id),y("Brand deleted"),z()})})})}async function tt(){O();try{d.orders=await g.getAdminOrders()||[],d.of={search:"",status:"",page:1},H()}catch(e){y("Failed to load orders: "+e.message,"error")}}function H(){const{search:e,status:t,page:a}=d.of;let n=d.orders;if(e){const s=e.toLowerCase();n=n.filter(r=>{var c;return(c=r.orderNumber)==null?void 0:c.toLowerCase().includes(s)})}t&&(n=n.filter(s=>s.status===t));const o=n.length,i=j(n,a,B);ue("content-body",`
    <div class="toolbar">
      <div class="toolbar-left">
        <div class="search-box">
          <svg class="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input class="search-input" id="ord-search" placeholder="Search by order number…" value="${p(e)}">
        </div>
        <select class="filter-select" id="ord-status">
          <option value="">All Statuses</option>
          ${$e.map(s=>`<option value="${s}" ${s===t?"selected":""}>${X[s]||s}</option>`).join("")}
        </select>
      </div>
      <span class="result-count">${o} order${o!==1?"s":""}</span>
    </div>
    <div class="card">
      <div class="table-wrapper">
        <table class="table">
          <thead><tr><th>Order #</th><th>Customer</th><th>Product</th><th>Shipping To</th><th>Items</th><th>Shipping Fee</th><th>Amount</th><th>Status</th><th>Admin Status</th><th>Date</th><th>Video Call</th><th>Actions</th></tr></thead>
          <tbody>
            ${i.length===0?'<tr><td colspan="12" class="empty-row">No orders found</td></tr>':i.map(s=>{var v,E,m;const r=d.customers.find(f=>f.uuid===s.userId),c=r?p(r.firstName+" "+(r.lastName||"")).trim():"Guest",l=(s.items||[]).map(f=>{const h=d.products.find(b=>b.id===f.productId);return h?p(h.name):"Unknown"}),u=l.length>0?l[0]+(l.length>1?` (+${l.length-1})`:""):"—";return`<tr>
                  <td><strong class="order-number">${p(s.orderNumber)}</strong></td>
                  <td>${c}</td>
                  <td><span title="${l.join(", ")}">${u}</span></td>
                  <td class="text-muted text-sm">${p(((v=s.shippingAddress)==null?void 0:v.city)||"—")}, ${p(((E=s.shippingAddress)==null?void 0:E.state)||"")}</td>
                  <td>${((m=s.items)==null?void 0:m.length)||0}</td>
                  <td class="text-muted">${I.currency(s.shippingFees||0)}</td>
                  <td><strong>${I.currency(s.totalAmount)}</strong></td>
                  <td>${ee(s.status)}</td>
                  <td>${ee(s.adminStatus||"PENDING_REVIEW")}</td>
                  <td class="text-muted text-sm">${I.datetime(s.createdAt)}</td>
                  <td>${s.liveVideoCall?'<span style="color:#166534; font-weight:600;">Yes</span>':'<span style="color:#64748b;">No</span>'}</td>
                  <td>
                    <div class="action-btns">
                      <button class="btn btn-sm btn-secondary view-ord" data-id="${s.id}">View</button>
                      <button class="btn btn-sm btn-primary receipt-ord" data-id="${s.id}">Order Detail</button>
                    </div>
                  </td>
                </tr>`}).join("")}
          </tbody>
        </table>
      </div>
      ${K(o,a,B)}
    </div>`),document.getElementById("ord-search").addEventListener("input",s=>{d.of.search=s.target.value,d.of.page=1,H()}),document.getElementById("ord-status").addEventListener("change",s=>{d.of.status=s.target.value,d.of.page=1,H()}),document.querySelectorAll(".view-ord").forEach(s=>s.addEventListener("click",()=>{const r=d.orders.find(c=>c.id===s.dataset.id);r&&at(r)})),document.querySelectorAll(".receipt-ord").forEach(s=>s.addEventListener("click",()=>{const r=d.orders.find(c=>c.id===s.dataset.id);r&&ke(r)})),G(document.getElementById("content-body"),s=>{d.of.page=s,H()})}function at(e){var E;const t=e.shippingAddress,a=t?[t.houseNumberOrAddress,t.landmark,t.city,t.state,t.pinCode].filter(Boolean).join(", "):"—",n=d.customers.find(m=>m.uuid===e.userId),o=!!e.liveVideoCall,i=(e.items||[]).map(m=>{var x;const f=d.products.find(w=>w.id===m.productId);(x=f==null?void 0:f.variants)==null||x.find(w=>w.id===m.variantId);const h=["PENDING","ACCEPTED","EDITED","CANCELLED"],b=`<select class="item-status-select" data-id="${m.id}" style="padding: 2px 4px; font-size: 12px; border: 1px solid #ddd; border-radius: 4px;">
      ${h.map(w=>`<option value="${w}" ${m.status===w?"selected":""}>${w}</option>`).join("")}
    </select>`;let k="<td>Not required</td>";return f&&f.variants&&f.variants.length>0&&(k=`<td>
        <select class="item-variant-select" data-id="${m.id}" style="padding: 2px; font-size: 12px; border: 1px solid #ddd; border-radius: 4px; width: 60px;">
          ${f.variants.map(w=>`<option value="${w.id}" ${w.id===m.variantId?"selected":""}>${p(w.size)}</option>`).join("")}
        </select>
      </td>`),`<tr class="item-row-data" data-id="${m.id}">
      <td>${p((f==null?void 0:f.name)||"Product")}</td>
      ${k}
      <td>
        <input type="number" min="1" max="${m.quantity}" class="item-qty-input" value="${m.quantity}" style="width: 50px; padding: 2px; font-size: 12px; border: 1px solid #ddd; border-radius: 4px;">
      </td>
      <td>${I.currency(m.purchasePrice)}</td>
      <td><strong class="item-subtotal-display" data-price="${m.purchasePrice}">${I.currency(m.purchasePrice*m.quantity)}</strong></td>
      <td>${b}</td>
    </tr>`}).join(""),s=`<div class="order-detail">
    <div style="background:${o?"#dcfce7":"#f1f5f9"}; color:${o?"#166534":"#64748b"}; padding:12px 16px; border-radius:8px; margin-bottom:20px; border:1px solid ${o?"#bbf7d0":"#e2e8f0"}; font-weight:600; display:flex; align-items:center; gap:8px;">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        ${o?'<polyline points="20 6 9 17 4 12"></polyline>':'<line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line>'}
      </svg>
      Live Video Call Before Dispatch: ${o?"Requested":"Not Requested"}
    </div>
    <div class="detail-grid">
      <div class="detail-section">
        <div class="detail-section-title">Customer</div>
        ${n?`<p><strong>${p(n.firstName)} ${p(n.lastName)}</strong></p>
             <p class="text-muted">${p(n.phoneNumber)}</p>
             ${n.email?`<p class="text-muted">${p(n.email)}</p>`:""}`:`<p class="text-muted">ID: ${p(e.userId)}</p>`}
      </div>
      <div class="detail-section">
        <div class="detail-section-title">Order Info</div>
        <p><strong>${p(e.orderNumber)}</strong></p>
        <p class="text-muted">${I.datetime(e.createdAt)}</p>
        <div class="form-group mt-8">
          <label style="font-size:11px; color:#666;">Global Status</label>
          <select class="form-select" id="order-global-status">
            ${$e.map(m=>`<option value="${m}" ${m===e.status?"selected":""}>${X[m]||m}</option>`).join("")}
          </select>
        </div>
        <div class="form-group mt-4">
          <label style="font-size:11px; color:#666;">Admin Status</label>
          <select class="form-select" id="order-admin-status">
            ${Ve.map(m=>`<option value="${m}" ${m===(e.adminStatus||"PENDING_REVIEW")?"selected":""}>${X[m]||m}</option>`).join("")}
          </select>
        </div>
        <div class="form-group mt-4">
          <label style="font-size:11px; color:#666;">Tracking ID</label>
          <input type="text" class="form-input" id="order-tracking-id" value="${p(e.trackingId||"")}" placeholder="Tracking ID">
        </div>
        <div class="form-group mt-4">
          <label style="font-size:11px; color:#666;">Tracking Link</label>
          <input type="url" class="form-input" id="order-tracking-link" value="${p(e.trackingLink||"")}" placeholder="URL">
        </div>
        <div class="form-group mt-4">
          <label style="font-size:11px; color:#666;">Shipping Fees</label>
          <input type="number" class="form-input" id="order-shipping-fees" value="${e.shippingFees!==null&&e.shippingFees!==void 0?e.shippingFees:""}" placeholder="Fee">
        </div>
        <div class="form-group mt-4">
          <label style="font-size:11px; color:#666;">Phone Number</label>
          <input type="text" class="form-input" id="order-phone-number" value="${p(e.phoneNumber||"")}" placeholder="Phone Number">
        </div>
      </div>
    </div>
    <div class="detail-section mt-16">
      <div class="detail-section-title">Shipping Address</div>
      <p>${p(a)}</p>
    </div>
    <div class="detail-section mt-16">
      <div class="detail-section-title">Items (${((E=e.items)==null?void 0:E.length)||0})</div>
      <table class="table table-compact">
        <thead><tr><th>Product</th><th>Size</th><th>Qty</th><th>Unit Price</th><th>Subtotal</th><th>Status</th></tr></thead>
        <tbody>${i||'<tr><td colspan="6" class="empty-row">No items</td></tr>'}</tbody>
      </table>
    </div>
    <div class="detail-section mt-16">
      <div class="detail-section-title">Summary</div>
      <div class="order-summary">
        <div class="summary-row"><span>Total Amount</span><strong id="modal-total-amount">${I.currency(e.totalAmount)}</strong></div>
        <div class="summary-row">
          <span>Payment</span>
          <select class="form-select" id="order-payment-method" style="width: 140px; text-align:right;">
            <option value="COD" ${(e.paymentMethod||"COD").toUpperCase()==="COD"?"selected":""}>Cash on Delivery</option>
            <option value="PREPAID" ${(e.paymentMethod||"").toUpperCase()==="PREPAID"?"selected":""}>Prepaid</option>
          </select>
        </div>
      </div>
    </div>
  </div>`;M(`Edit Order — ${e.orderNumber}`,s,"Save Changes",async()=>{const m=document.getElementById("order-global-status").value,f=document.getElementById("order-admin-status").value,h=document.getElementById("order-payment-method").value,b=document.querySelectorAll(".item-row-data"),k=Array.from(b).map(x=>{const w=x.querySelector(".item-variant-select");return{id:x.dataset.id,status:x.querySelector(".item-status-select").value,quantity:parseInt(x.querySelector(".item-qty-input").value,10),variantId:w?w.value:void 0}});try{const x=document.getElementById("order-tracking-id").value,w=document.getElementById("order-tracking-link").value,C=document.getElementById("order-shipping-fees").value,S=document.getElementById("order-phone-number").value,D=await g.updateOrderFull(e.id,{paymentMethod:h,items:k,trackingId:x,trackingLink:w,shippingFees:C!==""?parseFloat(C):null,phoneNumber:S});if(m!==e.status||f!==(e.adminStatus||"PENDING_REVIEW")){const R=await g.updateOrderStatus(e.id,m,f);D.status=R.status,D.adminStatus=R.adminStatus}const U=d.orders.findIndex(R=>R.id===e.id);U!==-1&&(d.orders[U]=D),y("Order updated successfully"),A(),H()}catch(x){throw y("Failed to update order: "+x.message,"error"),x}});const r=document.querySelectorAll(".item-qty-input"),c=document.getElementById("modal-total-amount"),l=document.getElementById("order-payment-method"),u=document.querySelectorAll(".item-status-select");function v(){let m=0,f=0;document.querySelectorAll(".item-row-data").forEach(w=>{const C=parseInt(w.querySelector(".item-qty-input").value,10)||1,S=parseFloat(w.querySelector(".item-subtotal-display").dataset.price),D=w.querySelector(".item-subtotal-display");D.textContent=I.currency(S*C),m+=S*C,f+=C});const h=l.value==="PREPAID";let b=h?f*200:0,k=!h&&f>0?f*99:0;m===0&&(b=0,k=0);const x=m-b+k;c&&(c.textContent=I.currency(x))}r.forEach(m=>m.addEventListener("input",v)),l.addEventListener("change",v),u.forEach(m=>m.addEventListener("change",v))}function ke(e){const t=e.shippingAddress,a=[e.firstName,e.lastName].filter(Boolean).join(" ")||e.phoneNumber||"Customer",n=(e.paymentMethod||"").toUpperCase()==="PREPAID",o=e.phoneNumber||(t==null?void 0:t.phone)||"—";let i="",s=0,r=0;(e.items||[]).forEach((b,k)=>{var me,ge;const x=d.products.find(T=>T.id===b.productId),w=(me=x==null?void 0:x.variants)==null?void 0:me.find(T=>T.id===b.variantId),C=((ge=x==null?void 0:x.imageUrls)==null?void 0:ge[0])||b.productImage||b.imageUrl||"",S=b.quantity||1,D=b.purchasePrice||((x==null?void 0:x.discountedPrice)??(x==null?void 0:x.basePrice))||0;s+=D*S,r+=S;let U=C;if(C.includes("res.cloudinary.com")&&!C.includes("/q_auto")){const T=C.split("/upload/");T.length===2&&(U=T[0]+"/upload/w_200,h_200,c_fill,q_auto,f_auto/"+T[1])}const R=U?`<img src="${U}" style="width:64px;height:64px;object-fit:cover;border-radius:8px;border:1px solid #e2e8f0;flex-shrink:0;">`:"",Ce=k===(e.items||[]).length-1;i+=`
      <div style="display:flex;align-items:center;gap:12px;padding:10px 0;${Ce?"":"border-bottom:1px solid #f1f5f9;"}">
        ${R}
        <div style="flex:1;">
          <div style="font-size:13px;color:#1e293b;margin-bottom:4px;">${p((x==null?void 0:x.name)||b.productName||"Product")}</div>
          <div style="display:flex;gap:6px;align-items:center;">
            <span style="background:${n?"#dcfce7":"#ffedd5"};color:${n?"#166534":"#9a3412"};padding:1px 7px;border-radius:3px;font-size:10px;font-weight:600;">${n?"PREPAID":"COD"}</span>
            <span style="font-size:11px;color:#64748b;">Qty: <b style="color:#0f172a;">${S}</b></span>
            ${w!=null&&w.size||b.size?`<span style="font-size:11px;color:#64748b;">Size: <b style="color:#0f172a;">${p((w==null?void 0:w.size)||b.size)}</b></span>`:""}
          </div>
        </div>
      </div>`});const c=n?0:r*99,l=n?r*200:0,u=s-l+c,v=b=>"₹"+b.toLocaleString("en-IN",{minimumFractionDigits:2}),E=[t==null?void 0:t.houseNumberOrAddress,t==null?void 0:t.landmark,t==null?void 0:t.city,t==null?void 0:t.state,t==null?void 0:t.pinCode].filter(Boolean).join(", "),m=`receipt-${e.id}`,h=`
    <div>
      ${`
    <div id="${m}" style="font-family:'Inter',sans-serif;background:#fff;width:480px;padding:0;border-radius:12px;overflow:hidden;">

      <!-- Header -->
      <div style="background:#0f172a;color:#fff;padding:16px 20px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;border-bottom:1px solid rgba(255,255,255,0.1);padding-bottom:12px;">
          <div style="background:#000;display:inline-flex;padding:6px 12px;border-radius:5px;font-family:'Inter',sans-serif;font-weight:900;font-size:22px;letter-spacing:0.5px;box-shadow: 0 1px 3px rgba(0,0,0,0.5);">
            <span style="color:#fff;">KICKS</span><span style="color:#ff0000;margin-left:3px;">AURA</span>
          </div>
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <div>
            <div style="font-size:9px;opacity:0.55;letter-spacing:1px;text-transform:uppercase;margin-bottom:2px;">Order ID</div>
            <div style="font-size:13px;font-weight:600;letter-spacing:0.3px;">${p(e.orderNumber)}</div>
          </div>
          <div style="text-align:center;">
            <div style="font-size:9px;opacity:0.55;letter-spacing:1px;text-transform:uppercase;margin-bottom:2px;">Date</div>
            <div style="font-size:13px;">${I.date(e.createdAt)}</div>
          </div>
          <div style="text-align:right;">
            <div style="font-size:9px;opacity:0.55;letter-spacing:1px;text-transform:uppercase;margin-bottom:2px;">Total</div>
            <div style="font-size:16px;font-weight:700;">${v(u)}</div>
          </div>
        </div>
      </div>

      <!-- Items -->
      <div style="padding:12px 20px 4px;border-bottom:1px solid #e2e8f0;">
        <div style="font-size:9px;color:#94a3b8;letter-spacing:1px;text-transform:uppercase;margin-bottom:4px;">Items</div>
        ${i}
      </div>

      <!-- Price breakdown -->
      <div style="padding:10px 20px;border-bottom:1px solid #e2e8f0;">
        <div style="font-size:9px;color:#94a3b8;letter-spacing:1px;text-transform:uppercase;margin-bottom:8px;">Pricing</div>
        <div style="display:flex;justify-content:space-between;font-size:12px;color:#475569;margin-bottom:5px;">
          <span>Subtotal</span><span>${v(s)}</span>
        </div>
        ${n?`
        <div style="display:flex;justify-content:space-between;font-size:12px;color:#475569;margin-bottom:5px;">
          <span>Prepaid discount</span><span>− ${v(l)}</span>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:12px;color:#475569;margin-bottom:5px;">
          <span>Shipping</span><span>Free</span>
        </div>`:`
        <div style="display:flex;justify-content:space-between;font-size:12px;color:#475569;margin-bottom:5px;">
          <span>COD shipping (Advance)</span><span>+ ${v(c)}</span>
        </div>`}
        <div style="display:flex;justify-content:space-between;font-size:13px;color:#0f172a;border-top:1px solid #e2e8f0;padding-top:7px;margin-top:2px;">
          <span>Total</span><span>${v(u)}</span>
        </div>
      </div>

      <!-- Customer -->
      <div style="padding:10px 20px;background:#f8fafc;">
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;font-size:11px;margin-bottom:8px;">
          <div>
            <div style="color:#94a3b8;font-size:9px;text-transform:uppercase;letter-spacing:0.8px;margin-bottom:2px;">Customer</div>
            <div style="color:#0f172a;">${p(a)}</div>
          </div>
          <div>
            <div style="color:#94a3b8;font-size:9px;text-transform:uppercase;letter-spacing:0.8px;margin-bottom:2px;">Payment</div>
            <div style="color:#0f172a;">${n?"Prepaid":"COD"}</div>
          </div>
        </div>
        <div style="font-size:11px;margin-top:8px;">
          <div style="color:#94a3b8;font-size:9px;text-transform:uppercase;letter-spacing:0.8px;margin-bottom:2px;">Delivery Address</div>
          <div style="color:#0f172a;line-height:1.5;">${p(E||"—")}<br>${p(o)}</div>
        </div>
      </div>

      <!-- Support Note -->
      <div style="padding:12px 20px 16px; text-align:left; font-size:10px; color:#94a3b8; background:#fff;">
        If any issues, share order and query on email - <span style="color:#0f172a;">kicksauraa@gmail.com</span>
      </div>

    </div>`}
      <div style="display:flex; justify-content:space-between; align-items:center; margin-top:12px;">
        <div>
        </div>
        <button id="pdf-download-btn"
          style="background:#0f172a;color:#fff;border:none;padding:9px 20px;border-radius:8px;font-size:13px;cursor:pointer;display:inline-flex;align-items:center;gap:8px;font-family:inherit;">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          Download PDF
        </button>
      </div>
    </div>`;M("Order Detail",h),requestAnimationFrame(()=>{const b=document.getElementById("pdf-download-btn");b&&b.addEventListener("click",async()=>{b.disabled=!0,b.textContent="Generating…";const k=document.getElementById(m);await html2pdf().set({margin:8,filename:`${e.orderNumber}.pdf`,image:{type:"jpeg",quality:.98},html2canvas:{scale:2,useCORS:!0,logging:!1},jsPDF:{unit:"mm",format:"a5",orientation:"portrait"}}).from(k).save(),b.disabled=!1,b.innerHTML="✓ Downloaded",setTimeout(()=>{b.innerHTML="↓ Download PDF",b.disabled=!1},2500)})})}async function nt(){O();try{[d.customers,d.orders]=await Promise.all([g.getAdminUsers().then(e=>e||[]),d.orders.length?Promise.resolve(d.orders):g.getAdminOrders().then(e=>e||[])]),d.cf={search:"",page:1},le()}catch(e){y("Failed to load customers: "+e.message,"error")}}function le(){const{search:e,page:t}=d.cf;let a=d.customers;if(e){const i=e.toLowerCase();a=a.filter(s=>{var r,c,l,u;return((r=s.firstName)==null?void 0:r.toLowerCase().includes(i))||((c=s.lastName)==null?void 0:c.toLowerCase().includes(i))||((l=s.phoneNumber)==null?void 0:l.includes(i))||((u=s.email)==null?void 0:u.toLowerCase().includes(i))})}const n=a.length,o=j(a,t,B);ue("content-body",`
    <div class="toolbar">
      <div class="toolbar-left">
        <div class="search-box">
          <svg class="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input class="search-input" id="cust-search" placeholder="Search customers…" value="${p(e)}">
        </div>
      </div>
      <span class="result-count">${n} customer${n!==1?"s":""}</span>
    </div>
    <div class="card">
      <div class="table-wrapper">
        <table class="table">
          <thead><tr><th>Name</th><th>Phone</th><th>Email</th><th>Role</th><th>Orders</th><th>Spent</th><th>Joined</th><th>Actions</th></tr></thead>
          <tbody>
            ${o.length===0?'<tr><td colspan="8" class="empty-row">No customers found</td></tr>':o.map(i=>{var l;const s=d.orders.filter(u=>u.userId===i.uuid),r=s.reduce((u,v)=>u+(v.totalAmount||0),0);return`<tr>
                    <td>
                      <div class="customer-name">
                        <div class="avatar">${(((l=i.firstName)==null?void 0:l[0])||"?").toUpperCase()}</div>
                        <span>${p(i.firstName)} ${p(i.lastName)}</span>
                      </div>
                    </td>
                    <td>${p(i.phoneNumber)}</td>
                    <td class="text-muted">${p(i.email||"—")}</td>
                    <td><span class="role-tag role-${(i.role||"").toLowerCase().replace("role_","")}">${p((i.role||"").replace("ROLE_",""))}</span></td>
                    <td>${s.length}</td>
                    <td>${I.currency(r)}</td>
                    <td class="text-muted text-sm">${I.date(i.createdAt)}</td>
                    <td><button class="btn btn-sm btn-secondary view-cust" data-uuid="${i.uuid}">View</button></td>
                  </tr>`}).join("")}
          </tbody>
        </table>
      </div>
      ${K(n,t,B)}
    </div>`),document.getElementById("cust-search").addEventListener("input",i=>{d.cf.search=i.target.value,d.cf.page=1,le()}),document.querySelectorAll(".view-cust").forEach(i=>i.addEventListener("click",()=>{const s=d.customers.find(r=>r.uuid===i.dataset.uuid);s&&it(s)})),G(document.getElementById("content-body"),i=>{d.cf.page=i,le()})}function it(e){var i;const t=d.orders.filter(s=>s.userId===e.uuid),a=t.reduce((s,r)=>s+(r.totalAmount||0),0),n=e.userAddress,o=`<div class="order-detail">
    <div class="detail-grid">
      <div class="detail-section">
        <div class="detail-section-title">Profile</div>
        <div class="customer-detail-header">
          <div class="avatar avatar-lg">${(((i=e.firstName)==null?void 0:i[0])||"?").toUpperCase()}</div>
          <div>
            <p><strong>${p(e.firstName)} ${p(e.lastName)}</strong></p>
            <p class="text-muted">${p(e.phoneNumber)}</p>
            ${e.email?`<p class="text-muted">${p(e.email)}</p>`:""}
          </div>
        </div>
        <p class="mt-8"><span class="role-tag role-${(e.role||"").toLowerCase().replace("role_","")}">${p((e.role||"").replace("ROLE_",""))}</span></p>
        <p class="text-muted mt-4">Joined: ${I.date(e.createdAt)}</p>
      </div>
      <div class="detail-section">
        <div class="detail-section-title">Stats</div>
        <div class="mini-stat"><span>Total Orders</span><strong>${t.length}</strong></div>
        <div class="mini-stat mt-8"><span>Lifetime Spend</span><strong>${I.currency(a)}</strong></div>
      </div>
    </div>
    ${n?`<div class="detail-section mt-16">
      <div class="detail-section-title">Saved Address</div>
      <p>${p([n.houseNumberOrAddress,n.landmark,n.city,n.state,n.pinCode].filter(Boolean).join(", "))}</p>
    </div>`:""}
    <div class="detail-section mt-16">
      <div class="detail-section-title">Order History</div>
      <table class="table table-compact">
        <thead><tr><th>Order #</th><th>Amount</th><th>Status</th><th>Date</th></tr></thead>
        <tbody>${t.length===0?'<tr><td colspan="4" class="empty-row">No orders</td></tr>':t.map(s=>`<tr>
              <td class="order-number">${p(s.orderNumber)}</td>
              <td>${I.currency(s.totalAmount)}</td>
              <td>${ee(s.status)}</td>
              <td class="text-muted">${I.datetime(s.createdAt)}</td>
            </tr>`).join("")}
        </tbody>
      </table>
    </div>
  </div>`;M(`${e.firstName} ${e.lastName}`,o,null,null)}const P={imageUrl:null,isUploading:!1};async function st(){O();try{const[e,t]=await Promise.all([g.getCategories(),d.products.length?Promise.resolve(d.products):g.getAdminProducts()]);d.categories=e||[],t&&(d.products=t),d.catPage=1,V()}catch(e){y("Failed to load categories: "+e.message,"error")}}function V(e=null){document.getElementById("page-actions").innerHTML="";const t=!!e,a={};d.products.forEach(i=>{if(i.category){const s=i.category.toLowerCase();a[s]=(a[s]||0)+1}});const n=d.categories.map(i=>{const s=a[i.name.toLowerCase()]||0;return`
    <div class="cat-card" data-id="${i.id}">
      <div class="cat-card-img">
        ${i.imageUrl?`<img src="${p(i.imageUrl)}" alt="${p(i.name)}">`:'<div class="cat-card-no-img">No Image</div>'}
      </div>
      <div class="cat-card-info">
        <span class="cat-card-name">${p(i.name)}</span>
        <span class="badge ${i.active?"badge-success":"badge-neutral"} cat-card-badge">${i.active?"Active":"Inactive"}</span>
      </div>
      <div class="cat-product-count">
        <span class="cat-product-count-icon">📦</span>
        <span>${s} product${s!==1?"s":""}</span>
      </div>
      <div class="cat-card-actions">
        <button class="btn btn-sm btn-secondary edit-cat-inline" data-id="${i.id}">Edit</button>
        <button class="btn btn-sm btn-danger del-cat-inline" data-id="${i.id}">Delete</button>
      </div>
    </div>`}).join("")||'<p class="cat-empty-msg">No categories yet. Add your first one →</p>';document.getElementById("content-body").innerHTML=`
    <div class="cat-page-layout">

      <!-- ── LEFT: Add / Edit Form ───────────────────────── -->
      <div class="cat-form-panel">
        <div class="cat-form-header">
          <h3 class="cat-form-title">${t?"✏️ Edit Category":"➕ Add Category"}</h3>
          ${t?'<button class="btn btn-sm btn-secondary" id="cat-cancel-edit">Cancel</button>':""}
        </div>

        <form id="cat-inline-form" novalidate>
          <!-- Name text input -->
          <div class="form-group">
            <label class="form-label">Category Name <span class="form-required">*</span></label>
            <input class="form-input" id="cat-name-input" type="text"
              value="${p((e==null?void 0:e.name)||"")}"
              placeholder="e.g. Shoes, Watches, Perfumes…"
              autocomplete="off" required>
          </div>

          <!-- Image upload -->
          <div class="form-group">
            <label class="form-label">Category Image</label>
            <div class="cat-img-upload-wrap">
              <!-- Preview -->
              <div class="cat-img-preview" id="cat-img-preview">
                ${e!=null&&e.imageUrl||P.imageUrl?`<img src="${p((e==null?void 0:e.imageUrl)||P.imageUrl)}" id="cat-img-preview-img" alt="preview">
                     <button type="button" class="cat-img-remove" id="cat-img-remove">×</button>`:""}
              </div>
              <!-- Drop zone (hidden once image picked) -->
              <label class="cat-dropzone ${e!=null&&e.imageUrl||P.imageUrl?"hidden":""}" id="cat-dropzone" for="cat-file-input">
                <input type="file" id="cat-file-input" accept="image/*" class="upload-file-input">
                <div class="upload-dropzone-inner">
                  <span class="upload-icon">🖼️</span>
                  <span class="upload-hint">Drop image here or <u>browse</u></span>
                  <span class="upload-sub">Uploads to Cloudinary</span>
                </div>
              </label>
              <!-- Progress -->
              <div class="upload-progress-bar" id="cat-upload-bar" style="display:none">
                <div class="upload-progress-fill" id="cat-upload-fill"></div>
              </div>
            </div>
          </div>

          <!-- Active toggle -->
          <div class="form-group">
            <label class="form-checkbox-label">
              <input type="checkbox" id="cat-active-check" ${(e==null?void 0:e.active)!==!1?"checked":""}> Active / Visible on store
            </label>
          </div>

          <button type="submit" class="btn btn-primary cat-submit-btn" id="cat-submit-btn">
            ${t?"Update Category":"Create Category"}
          </button>
        </form>
      </div>

      <!-- ── RIGHT: Category Cards Grid ───────────────────── -->
      <div class="cat-grid-panel">
        <h3 class="cat-grid-title">All Categories <span class="cat-count-badge">${d.categories.length}</span></h3>
        <div class="cat-cards-grid">
          ${n}
        </div>
      </div>

    </div>`,e!=null&&e.imageUrl?P.imageUrl=e.imageUrl:t||(P.imageUrl=null),ot(e);const o=document.getElementById("cat-cancel-edit");o&&o.addEventListener("click",()=>{P.imageUrl=null,V()}),document.getElementById("cat-inline-form").addEventListener("submit",async i=>{if(i.preventDefault(),P.isUploading){y("Please wait for the image upload to finish.","error");return}const s=document.getElementById("cat-name-input"),r=s.value.trim();if(!r){s.classList.add("input-error"),y("Please enter a category name","error");return}if(s.classList.remove("input-error"),!P.imageUrl){y("Please upload an image before creating.","error");return}const c=document.getElementById("cat-submit-btn");if(!(c&&c.disabled)){c&&(c.disabled=!0,c.textContent=t?"Updating…":"Creating…");try{const l={name:r,imageUrl:P.imageUrl||null,active:document.getElementById("cat-active-check").checked};if(t){const u=await g.updateCategory(e.id,l),v=d.categories.findIndex(E=>E.id===e.id);v!==-1&&(d.categories[v]=u),y("Category updated ✓")}else{const u=await g.createCategory(l);d.categories.push(u),y("Category created ✓")}P.imageUrl=null,V()}catch(l){y("Error: "+l.message,"error"),c&&(c.disabled=!1,c.textContent=t?"Update Category":"Create Category")}}}),document.querySelectorAll(".edit-cat-inline").forEach(i=>i.addEventListener("click",()=>{const s=d.categories.find(r=>r.id===i.dataset.id);s&&(P.imageUrl=s.imageUrl||null,V(s))})),document.querySelectorAll(".del-cat-inline").forEach(i=>i.addEventListener("click",()=>{const s=d.categories.find(r=>r.id===i.dataset.id);J(`Delete category "${s==null?void 0:s.name}"?`,"Delete Category",async()=>{await g.deleteCategory(i.dataset.id),d.categories=d.categories.filter(r=>r.id!==i.dataset.id),y("Category deleted"),V()})}))}function ot(e=null){const t=document.getElementById("cat-file-input"),a=document.getElementById("cat-dropzone"),n=document.getElementById("cat-img-preview"),o=document.getElementById("cat-upload-bar"),i=document.getElementById("cat-upload-fill");function s(l){P.imageUrl=l,n.innerHTML=l?`<img src="${l}" id="cat-img-preview-img" alt="preview">
         <button type="button" class="cat-img-remove" id="cat-img-remove">×</button>`:"",a&&a.classList.toggle("hidden",!!l);const u=document.getElementById("cat-img-remove");u&&u.addEventListener("click",()=>s(null))}async function r(l){if(!l||!l.type.startsWith("image/"))return;const u=document.getElementById("cat-submit-btn"),v=u?u.textContent:e?"Update Category":"Create Category";if(P.isUploading=!0,u&&(u.disabled=!0,u.textContent="⏳ Uploading Image…"),a){const E=a.querySelector(".upload-hint");E&&(E.innerHTML='<span style="color:#f39c12; font-weight:600;">⏳ Uploading to Cloudinary...</span>')}o&&(o.style.display="block"),i&&(i.style.width="30%");try{const E=await Ie(l,"image","kicks-aura/categories");if(i&&(i.style.width="100%"),setTimeout(()=>{o&&(o.style.display="none"),i&&(i.style.width="0")},400),s(E),P.isUploading=!1,u&&(u.disabled=!1,u.textContent=v),a){const m=a.querySelector(".upload-hint");m&&(m.innerHTML="Drop image here or <u>browse</u>")}y("Image uploaded ✓")}catch(E){if(P.isUploading=!1,o&&(o.style.display="none"),u&&(u.disabled=!1,u.textContent=v),a){const m=a.querySelector(".upload-hint");m&&(m.innerHTML="Drop image here or <u>browse</u>")}y("Upload failed: "+E.message,"error")}}t&&t.addEventListener("change",l=>r(l.target.files[0])),a&&(a.addEventListener("dragover",l=>{l.preventDefault(),a.classList.add("dragover")}),a.addEventListener("dragleave",()=>a.classList.remove("dragover")),a.addEventListener("drop",l=>{l.preventDefault(),a.classList.remove("dragover"),r(l.dataTransfer.files[0])}));const c=document.getElementById("cat-img-remove");c&&c.addEventListener("click",()=>s(null))}async function rt(){O();try{d.coupons=await g.getCoupons()||[],d.couponPage=1,te()}catch(e){y("Failed to load coupons: "+e.message,"error")}}function te(){const e=d.coupons.length,t=j(d.coupons,d.couponPage,B);document.getElementById("page-actions").innerHTML='<button class="btn btn-primary" id="btn-add-coupon">+ Add Coupon</button>',document.getElementById("content-body").innerHTML=`
    <div class="card">
      <div class="table-wrapper">
        <table class="table">
          <thead><tr><th>Code</th><th>Discount</th><th>Min Order</th><th>Expiry</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            ${t.length===0?'<tr><td colspan="6" class="empty-row">No coupons yet — add one!</td></tr>':t.map(a=>{const n=a.expiryDate&&new Date(a.expiryDate)<new Date;return`<tr>
                    <td><code class="coupon-code">${p(a.code)}</code></td>
                    <td><strong>${a.discountType==="PER_PRODUCT"?`₹${a.discountAmount} per product`:`${a.discountPercent}% off`}</strong></td>
                    <td>${a.minOrderValue?I.currency(a.minOrderValue):"—"}</td>
                    <td class="${n?"text-danger":""}">${I.date(a.expiryDate)}</td>
                    <td>${n?'<span class="badge badge-danger">Expired</span>':`<span class="badge ${a.active?"badge-success":"badge-neutral"}">${a.active?"Active":"Inactive"}</span>
               ${a.showOnCheckout?'<span class="badge badge-info" style="margin-left:4px;background-color:#007bff;color:white;">Visible</span>':""}`}
                    </td>
                    <td><div class="action-btns">
                      <button class="btn-icon btn-icon--edit edit-coupon" data-id="${a.id}" title="Edit">${Pe()}</button>
                      <button class="btn-icon btn-icon--delete del-coupon" data-id="${a.id}" title="Delete">${pe()}</button>
                    </div></td>
                  </tr>`}).join("")}
          </tbody>
        </table>
      </div>
      ${K(e,d.couponPage,B)}
    </div>`,document.getElementById("btn-add-coupon").addEventListener("click",()=>he()),document.querySelectorAll(".edit-coupon").forEach(a=>a.addEventListener("click",()=>{const n=d.coupons.find(o=>o.id===a.dataset.id);n&&he(n)})),document.querySelectorAll(".del-coupon").forEach(a=>a.addEventListener("click",()=>{const n=d.coupons.find(o=>o.id===a.dataset.id);J(`Delete coupon "${n==null?void 0:n.code}"?`,"Delete Coupon",async()=>{await g.deleteCoupon(a.dataset.id),d.coupons=d.coupons.filter(o=>o.id!==a.dataset.id),y("Coupon deleted"),te()})})),G(document.getElementById("content-body"),a=>{d.couponPage=a,te()})}function he(e=null){const t=!!e,a=(e==null?void 0:e.discountType)||"PERCENTAGE",n=`<form id="coupon-form">
    <div class="form-group">
      <label class="form-label">Coupon Code *</label>
      <input class="form-input" name="code" value="${p((e==null?void 0:e.code)||"")}" required
             placeholder="e.g. SAVE20" style="text-transform:uppercase;font-family:monospace">
      <small class="form-hint">Will be auto-uppercased</small>
    </div>

    <div class="form-group">
      <label class="form-label">Discount Type *</label>
      <div style="display:flex;gap:12px;margin-top:6px;">
        <label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:14px;">
          <input type="radio" name="discountType" value="PERCENTAGE" ${a==="PERCENTAGE"?"checked":""}>
          Percentage (% off)
        </label>
        <label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:14px;">
          <input type="radio" name="discountType" value="PER_PRODUCT" ${a==="PER_PRODUCT"?"checked":""}>
          Per Product (₹ off per item)
        </label>
      </div>
    </div>

    <div class="form-grid-2">
      <div class="form-group" id="field-percent" style="${a==="PER_PRODUCT"?"display:none;":""}">
        <label class="form-label">Discount (%) *</label>
        <input type="number" class="form-input" name="disc" value="${(e==null?void 0:e.discountPercent)||""}" min="1" max="100" step="0.1">
      </div>
      <div class="form-group" id="field-amount" style="${a==="PERCENTAGE"?"display:none;":""}">
        <label class="form-label">Discount Amount (₹ per product) *</label>
        <input type="number" class="form-input" name="discAmt" value="${(e==null?void 0:e.discountAmount)||""}" min="1" step="1" placeholder="e.g. 200">
      </div>
      <div class="form-group">
        <label class="form-label">Min Order Value (₹)</label>
        <input type="number" class="form-input" name="minVal" value="${(e==null?void 0:e.minOrderValue)||""}" min="0" step="1" placeholder="No minimum">
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">Expiry Date</label>
      <input type="date" class="form-input" name="expiry" value="${(e==null?void 0:e.expiryDate)||""}">
    </div>
    <div class="form-group">
      <label class="form-checkbox-label">
        <input type="checkbox" name="active" ${(e==null?void 0:e.active)!==!1?"checked":""}> Active
      </label>
      <label class="form-checkbox-label" style="margin-left:16px;">
        <input type="checkbox" name="showOnCheckout" ${e!=null&&e.showOnCheckout?"checked":""}> Show on Checkout
      </label>
    </div>
  </form>`;M(t?"Edit Coupon":"Add Coupon",n,t?"Update":"Create",async()=>{var r;const o=document.getElementById("coupon-form"),i=((r=o.querySelector('[name="discountType"]:checked'))==null?void 0:r.value)||"PERCENTAGE",s={code:o.querySelector('[name="code"]').value.trim().toUpperCase(),discountType:i,discountPercent:i==="PERCENTAGE"&&parseFloat(o.querySelector('[name="disc"]').value)||0,discountAmount:i==="PER_PRODUCT"&&parseFloat(o.querySelector('[name="discAmt"]').value)||0,minOrderValue:parseFloat(o.querySelector('[name="minVal"]').value)||null,expiryDate:o.querySelector('[name="expiry"]').value||null,active:o.querySelector('[name="active"]').checked,showOnCheckout:o.querySelector('[name="showOnCheckout"]').checked};if(i==="PERCENTAGE"&&!s.discountPercent||i==="PER_PRODUCT"&&!s.discountAmount)return y("Please enter a discount value","error"),!1;if(t){const c=await g.updateCoupon(e.id,s),l=d.coupons.findIndex(u=>u.id===e.id);l!==-1&&(d.coupons[l]=c),y("Coupon updated")}else d.coupons.push(await g.createCoupon(s)),y("Coupon created");A(),te()}),requestAnimationFrame(()=>{document.querySelectorAll('[name="discountType"]').forEach(o=>{o.addEventListener("change",()=>{const i=o.value==="PER_PRODUCT";document.getElementById("field-percent").style.display=i?"none":"",document.getElementById("field-amount").style.display=i?"":"none"})})})}async function dt(){O();try{d.reviews=await g.getReviews()||[],ae()}catch(e){document.getElementById("content-body").innerHTML=`<div class="error-state">Error loading reviews: ${p(e.message)}</div>`}}function ae(){const e=document.getElementById("content-body");document.getElementById("page-actions").innerHTML=`
    <button class="btn btn-primary" id="btn-add-review">+ Add Review</button>`;const a=j(d.reviews,d.reviewPage,B).map(n=>`
    <tr>
      <td><img src="${p(n.imageUrl)}" class="table-img" style="object-fit:cover;width:120px;height:auto"></td>
      <td>${I.datetime(n.createdAt)}</td>
      <td class="table-actions">
        <button class="icon-btn del-review" data-id="${n.id}" title="Delete">${pe()}</button>
      </td>
    </tr>`).join("");e.innerHTML=`
    <div class="card">
      <div class="table-wrapper">
        <table class="table">
          <thead><tr><th>Image</th><th>Date Added</th><th width="100">Actions</th></tr></thead>
          <tbody>${a||'<tr><td colspan="3" class="text-center text-muted">No reviews found</td></tr>'}</tbody>
        </table>
      </div>
      ${K(d.reviews.length,d.reviewPage,B)}
    </div>`,document.getElementById("btn-add-review").addEventListener("click",()=>lt()),document.querySelectorAll(".del-review").forEach(n=>n.addEventListener("click",()=>{J("Delete this review image?","Delete Review",async()=>{await g.deleteReview(n.dataset.id),d.reviews=d.reviews.filter(o=>o.id!==n.dataset.id),y("Review deleted"),ae()})})),G(e,n=>{d.reviewPage=n,ae()})}function lt(){$["new-review"]=[],$["isUploading_new-review"]=!1,$.activeUploads=0,M("Add Customer Review",`
    <div class="form-group">
      <label class="form-label">Review Image *</label>
      <div id="review-image-upload"></div>
    </div>`,"Save",async()=>{if($.activeUploads>0||$["isUploading_new-review"])throw new Error("Please wait for the image upload to finish.");const t=$["new-review"];if(!t.length)throw new Error("Please upload an image before creating.");for(const a of t){const n=await g.createReview({imageUrl:a});d.reviews.unshift(n)}y(`${t.length} review(s) added`),A(),ae()}),setTimeout(()=>{re("review-image-upload","new-review","image","image/*","kicks-aura/reviews",!0)},10)}const Pe=()=>'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>',ct=()=>'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="14" height="14" x="8" y="8" rx="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>',pe=()=>'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>';function ut(){const e=ye();if(!Be()||!e||e.role!=="ROLE_ADMIN"){Re();return}document.getElementById("admin-layout").style.display="flex",document.querySelectorAll(".nav-item[data-section]").forEach(a=>a.addEventListener("click",n=>{n.preventDefault(),ie(a.dataset.section)})),document.getElementById("modal-close").addEventListener("click",A),document.getElementById("modal-overlay").addEventListener("click",a=>{a.target===document.getElementById("modal-overlay")&&A()}),document.getElementById("confirm-cancel").addEventListener("click",()=>{document.getElementById("confirm-overlay").classList.add("hidden"),_=null}),document.getElementById("confirm-ok").addEventListener("click",async()=>{if(document.getElementById("confirm-overlay").classList.add("hidden"),_){try{await _()}catch(a){y(a.message,"error")}_=null}});const t=document.getElementById("admin-logout-btn");t&&t.addEventListener("click",a=>{a.preventDefault(),De()}),window.hideModal=A,window.showReceiptModal=ke,window.navigate=ie,window.S=d,ie("dashboard")}document.addEventListener("DOMContentLoaded",ut);
