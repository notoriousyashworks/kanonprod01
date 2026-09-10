(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const i of document.querySelectorAll('link[rel="modulepreload"]'))o(i);new MutationObserver(i=>{for(const s of i)if(s.type==="childList")for(const r of s.addedNodes)r.tagName==="LINK"&&r.rel==="modulepreload"&&o(r)}).observe(document,{childList:!0,subtree:!0});function n(i){const s={};return i.integrity&&(s.integrity=i.integrity),i.referrerPolicy&&(s.referrerPolicy=i.referrerPolicy),i.crossOrigin==="use-credentials"?s.credentials="include":i.crossOrigin==="anonymous"?s.credentials="omit":s.credentials="same-origin",s}function o(i){if(i.ep)return;i.ep=!0;const s=n(i);fetch(i.href,s)}})();const F="kicksaura_wishlist";function A(){const e=localStorage.getItem(F);return e?JSON.parse(e):[]}function le(e){localStorage.setItem(F,JSON.stringify(e))}function R(e){return A().some(n=>n.id===e)}function K(e){var s,r,a,l,d,c;let t=e;if(typeof e=="string"&&(t=(s=window._allProducts)==null?void 0:s.find(p=>p.id===e),!t)){const p=document.querySelector(`[data-product-id="${e}"]`);p?t={id:e,name:((r=p.querySelector(".pc-name"))==null?void 0:r.textContent)||"Product",imageUrls:[(a=p.querySelector("img"))==null?void 0:a.src],discountedPrice:parseFloat(((d=(l=p.querySelector(".pc-price"))==null?void 0:l.textContent)==null?void 0:d.replace(/[^0-9.]/g,""))||"0")}:t={id:e}}let n=A();const o=n.findIndex(p=>p.id===t.id);let i=!1;return o>-1?n.splice(o,1):(n.push({id:t.id,name:t.name,image:((c=t.imageUrls)==null?void 0:c[0])||"/images/products/redjordanface1.png",price:t.discountedPrice||t.basePrice,originalPrice:t.discountedPrice?t.basePrice:null}),i=!0),le(n),de(),J(),i?D("Added to wishlist!","success"):D("Removed from wishlist.","info"),i}function de(){const e=A(),t=document.getElementById("wishlist-badge");t&&(t.textContent=e.length,t.style.display=e.length>0?"flex":"none")}function J(){const e=document.getElementById("wishlist-items-container");if(!e)return;const t=A();if(t.length===0){e.innerHTML=`
      <div class="empty-state" style="margin-top: 64px; text-align: center;">
        <div style="font-size: 32px; margin-bottom: 16px;">🤍</div>
        <p style="font-weight: 600; color: #333; font-size: 16px;">Your wishlist is empty</p>
      </div>
    `;return}e.innerHTML=t.map(n=>{const o=n.image||"",i=Number(n.price||0),s=Number(n.originalPrice||0),r=`Rs. ${i.toLocaleString("en-IN")}.00`,a=s&&s>i?`Rs. ${s.toLocaleString("en-IN")}.00`:null,l=a?`<span style="text-decoration: line-through; color: #888; font-size: 13px; margin-right: 6px;">${a}</span><span style="font-weight: 700; color: #111; font-size: 15px;">${r}</span>`:`<span style="font-weight: 700; color: #111; font-size: 15px;">${r}</span>`;return`
      <div class="wishlist-sidebar-item modern-cart-item" data-id="${n.id}" style="cursor: pointer; position: relative; transition: background 0.2s; padding: 14px 12px; border-bottom: 1px solid #eee; display: flex; align-items: flex-start; gap: 14px;">
        <div class="cart-sidebar-img modern-item-img" style="flex: 0 0 74px; width: 74px; height: 74px; border-radius: 12px; overflow: hidden; background: #f9f9f9; display: flex; align-items: center; justify-content: center;">
          ${o?`<img src="${o}" alt="${n.name}" style="width: 100%; height: 100%; object-fit: contain;" />`:'<span style="font-size: 24px;">👟</span>'}
        </div>
        
        <div class="cart-sidebar-details modern-item-details" style="flex: 1; min-width: 0;">
          <p class="modern-item-name" style="font-size: 15px; font-weight: 700; color: #111; margin: 0 0 6px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${n.name}</p>
          <p class="modern-item-unit-meta" style="margin: 0 0 10px;">${l}</p>
          
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 10px;">
            <span style="font-size: 12.5px; font-weight: 600; color: #2563eb; display: flex; align-items: center; gap: 4px;">
              <span>View Product →</span>
            </span>
            
            <button class="modern-trash-btn remove-wishlist-btn" data-id="${n.id}" title="Remove from wishlist" style="background: #fff; border: 1px solid #eee; width: 34px; height: 34px; border-radius: 8px; display: flex; align-items: center; justify-content: center; cursor: pointer; color: #666; transition: all 0.2s;">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="pointer-events: none;">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                <line x1="10" y1="11" x2="10" y2="17"></line>
                <line x1="14" y1="11" x2="14" y2="17"></line>
              </svg>
            </button>
          </div>
        </div>
      </div>
    `}).join(""),e.querySelectorAll(".remove-wishlist-btn").forEach(n=>{n.addEventListener("click",o=>{o.stopPropagation();const i=n.dataset.id;K({id:i});const s=document.querySelector(`.product-card-new[data-product-id="${i}"] .pc-heart-btn`);if(s){s.classList.remove("active");const r=s.querySelector("svg");r&&(r.setAttribute("fill","none"),r.setAttribute("stroke","currentColor"))}})}),e.querySelectorAll(".wishlist-sidebar-item").forEach(n=>{n.addEventListener("click",o=>{if(o.target.closest(".remove-wishlist-btn"))return;const i=n.dataset.id;i&&window.open(`/product-details?id=${i}`,"_blank")})})}function Ve(){const e=document.getElementById("wishlist-sidebar"),t=document.getElementById("wishlist-overlay"),n=document.getElementById("wishlist-trigger"),o=document.getElementById("close-wishlist");if(!e||!n)return;function i(){e.classList.add("open"),t==null||t.classList.add("open"),document.body.classList.add("sidebar-lock"),J()}function s(){e.classList.remove("open"),t==null||t.classList.remove("open"),document.body.classList.remove("sidebar-lock")}n.addEventListener("click",r=>{r.preventDefault(),i()}),o==null||o.addEventListener("click",s),t==null||t.addEventListener("click",s),document.addEventListener("keydown",r=>{r.key==="Escape"&&e.classList.contains("open")&&s()})}window.toggleWishlistItem=K;window.isWishlisted=R;const _="kicksaura_auth_user";function Y(){const e=localStorage.getItem(_);try{return e?JSON.parse(e):null}catch{return null}}function G(e){e?localStorage.setItem(_,JSON.stringify(e)):localStorage.removeItem(_)}function Q(){localStorage.removeItem(_)}function X(){return!!Y()}async function Z(e){const t=await fetch("/api/v1/users/auth/login",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({accessToken:e})});if(!t.ok){const o=await t.json().catch(()=>({}));throw new Error(o.error||"Login failed. Please try again.")}const n=await t.json();return G({uuid:n.uuid,firstName:n.firstName,lastName:n.lastName,phoneNumber:n.phoneNumber,role:n.role,addresses:n.addresses||[]}),n}async function ee(){try{await fetch("/api/v1/users/auth/logout",{method:"POST",credentials:"include"})}catch(e){console.error("Logout request failed",e)}Q(),window.dispatchEvent(new CustomEvent("auth-changed",{detail:{loggedIn:!1}})),window.location.href="/"}const Ue=Object.freeze(Object.defineProperty({__proto__:null,clearAuthUser:Q,getAuthUser:Y,isLoggedIn:X,loginWithBackend:Z,logout:ee,setAuthUser:G},Symbol.toStringTag,{value:"Module"})),ce=`
  <div style="display: flex; flex-direction: column; gap: 16px;">
    <p style="font-size: 18px; font-weight: 600; color: #0f172a; margin: 0;">Welcome to Kicks Aura</p>
    <p style="font-size: 16px; font-weight: 700; color: #3b82f6; margin: 0;">Top-shelf quality (7A). Uncompromising style. Exceptional value.</p>
    <div style="width: 40px; height: 3px; background: #e2e8f0; border-radius: 2px;"></div>
    <p style="margin: 0; color: #475569;">We started Kicks Aura with one simple belief—great fashion should be an accessible part of your everyday life. Our mission is to curate a collection of sneakers, watches, perfumes, and accessories that elevate your personal style.</p>
    <p style="margin: 0; color: #475569;">Every product is carefully selected to deliver the perfect balance of <strong style="color: #0f172a;">style, quality, and value</strong>. From the look and feel to the finer details, we focus on items that meet our standards and are genuinely worth adding to your collection.</p>
    <p style="margin: 0; color: #475569;">We believe fashion is about confidence, and everyone should have the opportunity to express themselves freely and boldly.</p>
    <div style="padding: 16px; background: #f8fafc; border-left: 4px solid #3b82f6; border-radius: 0 8px 8px 0; margin-top: 8px;">
      <p style="margin: 0; font-style: italic; color: #334155; font-size: 14.5px;">"At Kicks Aura, we're more than just a store—we're building a community of people who appreciate great fashion and trust in uncompromising quality."</p>
    </div>
    <p style="margin: 0; font-weight: 500; color: #0f172a; margin-top: 8px;">Thank you for choosing Kicks Aura. We're excited to be a part of your style journey.</p>
  </div>
`,pe=`
  <p style="margin-bottom: 14px; line-height: 1.5;">Thank you for shopping with <strong>KicksAura</strong>. We are committed to delivering your order quickly and safely across India.</p>

  <p style="margin-bottom: 6px;"><strong>Shipping Time</strong></p>
  <p style="margin-bottom: 14px; line-height: 1.5;">All orders are delivered within 4–5 working days. Once the order is confirmed, it will be dispatched ASAP!</p>

  <p style="margin-bottom: 6px;"><strong>Delivery Time</strong></p>
  <p style="margin-bottom: 14px; line-height: 1.5;">Delivery typically takes 4–5 working days across Pan India.</p>

  <p style="margin-bottom: 6px; color: #2563eb;"><strong>Shipping Charges</strong></p>
  <ul style="margin-left: 20px; margin-bottom: 14px; line-height: 1.6; color: #2563eb; font-weight: 500;">
    <li style="color: #2563eb;">Free shipping on all prepaid orders (plus ₹200 FLAT OFF per product!)</li>
    <li style="color: #2563eb;">Cash on Delivery (COD): ₹99 per product shipping charge (to be paid in advance)</li>
  </ul>

  <p style="margin-bottom: 6px;"><strong>Order Tracking</strong></p>
  <p style="margin-bottom: 14px; line-height: 1.5;">Once your order is shipped, you will receive a tracking number via SMS to track your delivery.</p>

  <p style="margin-bottom: 6px;"><strong>Cash on Delivery (COD)</strong></p>
  <p style="margin-bottom: 16px; line-height: 1.5;">COD is available across Pan India! A ₹99 per product advance is required before dispatch to confirm your order.</p>

  <p style="line-height: 1.5; padding-top: 10px; border-top: 1px solid #eee;">For any shipping-related queries, contact us at:<br><strong>kicksauraa@gmail.com</strong> or WhatsApp <strong>+91 62393 79751</strong></p>
`,ue="/api/v1";async function u(e,t={}){const n=`${ue}${e}`,o={headers:{"Content-Type":"application/json",...t.headers},credentials:"include",...t};try{const i=await fetch(n,o);if(!i.ok){if(i.status===401)throw console.warn("Session expired or unauthorized. Logging out..."),ee(),new Error("Session expired. Please log in again.");const s=await i.json().catch(()=>({}));throw new Error(s.error||`Request failed with status ${i.status}`)}return i.status===204?null:await i.json()}catch(i){throw console.error(`API Error [${e}]:`,i),i}}async function ge(){return u("/categories")}async function We(){const e=await u("/products");return e.content||e}async function Fe(){const e=await u("/products/new-arrivals");return e.content||e}async function Re(){const e=await u("/products/trending");return e.content||e}async function Ke(e,t=0,n=16){const o=new URLSearchParams;e.query&&o.append("query",e.query),e.categories&&e.categories.length>0&&o.append("categories",e.categories.join(",")),e.brands&&e.brands.length>0&&o.append("brands",e.brands.join(",")),e.minPrice!==void 0&&e.minPrice>0&&o.append("minPrice",e.minPrice),e.maxPrice!==void 0&&e.maxPrice<35e3&&o.append("maxPrice",e.maxPrice),e.sizes&&e.sizes.length>0&&o.append("sizes",e.sizes.join(",")),o.append("page",t),o.append("size",n);const s=`/products/filter?${o.toString()}`;return u(s)}async function Je(e){return u(`/products/${e}`)}async function Ye(e,t,n=8){const o=await u(`/products/category/${encodeURIComponent(e)}`),s=(o.content||o).filter(r=>String(r.id)!==String(t));for(let r=s.length-1;r>0;r--){const a=Math.floor(Math.random()*(r+1));[s[r],s[a]]=[s[a],s[r]]}return s.slice(0,n)}async function Ge(){return u("/brands")}async function Qe(e){return u("/orders/checkout",{method:"POST",body:JSON.stringify(e)})}async function Xe(e){return u(`/orders/user/${e}?t=${Date.now()}`)}async function Ze(e){return u("/users/profile",{method:"PUT",body:JSON.stringify(e)})}async function et(e){return u("/users/profile/address",{method:"POST",body:JSON.stringify(e)})}function D(e,t="info"){let n=document.querySelector(".toast-container");n||(n=document.createElement("div"),n.className="toast-container",document.body.appendChild(n));const o=n.querySelectorAll(".toast");for(let s of o)if(s.textContent===e)return;const i=document.createElement("div");i.className=`toast toast--${t}`,i.textContent=e,n.appendChild(i),setTimeout(()=>{i.remove()},3e3)}function tt(){const e=document.getElementById("nav-search-input"),t=document.getElementById("nav-search-btn"),n=()=>{e&&e.value.trim()&&(window.location.href=`/products?search=${encodeURIComponent(e.value.trim())}`)};e&&e.addEventListener("keydown",r=>{r.key==="Enter"&&n()}),t&&t.addEventListener("click",n);const o=document.getElementById("nav-animated-placeholder"),i=document.getElementById("placeholder-text-1"),s=document.getElementById("placeholder-text-2");if(e&&o&&i&&s){const r=["Search for Sneakers...","Search for Apparel...","Search for Perfumes...","Search for Watches...","Search for Nike Pandas...","Search for Adidas Sambas...","Search for New Balance 9060...","Search for Air Force 1...","Search for Onitsuka Tiger...","Search for Air Jordan 1...","Search for Sunglasses...","Search for Nike Dunks...","Search for Adidas Campus...","Search for Belts...","Search for New Balance 530...","Search for Air Jordan 4...","Search for Adidas Spezial...","Search for Nike Vomero...","Search for Wallets...","Search for ASICS Gel-NYC...","Search for Nike P-6000...","Search for New Balance 550...","Search for Travis Scott...","Search for Accessories...","Search for Yeezy 350..."];let a=0,l=0,d=!1,c=null;const p=()=>{const M=r[a];d?(i.textContent=M.substring(0,l-1),l--):(i.textContent=M.substring(0,l+1),l++);let N=d?30:60;!d&&l===M.length?(N=2e3,d=!0):d&&l===0&&(d=!1,a=(a+1)%r.length,N=500),c=setTimeout(p,N)},k=()=>{c||(s&&(s.style.display="none"),i.className="animated-placeholder-text visible",c=setTimeout(p,500))},O=()=>{c&&(clearTimeout(c),c=null)},E=()=>{document.activeElement===e||e.value.trim()!==""?(o.style.display="none",O()):(o.style.display="flex",k())};e.addEventListener("focus",E),e.addEventListener("blur",E),e.addEventListener("input",E),E()}}function fe(e){return!e||typeof e!="string"||!e.includes("res.cloudinary.com")?e:e.includes("/upload/")&&!e.includes("/f_auto")?e.replace("/upload/","/upload/f_auto,q_auto,w_800/"):e}function me(e){return!e||typeof e!="string"||!e.includes("res.cloudinary.com")?e:e.replace("/upload/","/upload/so_0,w_800,q_auto/f_jpg/")}function he(e){return!e||typeof e!="string"||!e.includes("res.cloudinary.com")?e:e.replace("/upload/","/upload/sp_auto:maxres_720p/").replace(/\.mp4$/i,".m3u8")}function ye(e){return!e||typeof e!="string"||!e.includes("res.cloudinary.com")?e:e.replace("/upload/","/upload/q_auto,vc_h264,w_800/")}function ve(e){return!e||typeof e!="string"||!e.includes("res.cloudinary.com")?e:e.replace("/upload/","/upload/q_auto,vc_h264,w_400/")}function g(e){return typeof e=="string"&&e.includes("ik.imagekit.io")}function be(e){return!g(e)||e.includes("tr=")||e.includes("/tr:")?e:e+(e.includes("?")?"&":"?")+"tr=q-auto,f-auto,w-800"}function we(e){return!g(e)||e.includes("tr=")||e.includes("/tr:")?e:e+(e.includes("?")?"&":"?")+"tr=orig"}function xe(e){return!g(e)||e.includes("tr=")||e.includes("/tr:")?e:e+(e.includes("?")?"&":"?")+"tr=orig"}function ke(e){return!g(e)||e.includes("tr=")||e.includes("/tr:")?e:e+(e.includes("?")?"&":"?")+"tr=orig"}function Ee(e){return!e||typeof e!="string"?e:e.includes("res.cloudinary.com")?fe(e):g(e)?be(e):e}function Ie(e){return!e||typeof e!="string"?e:e.includes("res.cloudinary.com")?me(e):g(e)?we(e):e}function nt(e){return!e||typeof e!="string"?e:e.includes("res.cloudinary.com")?he(e):(g(e),e)}function it(e){return!e||typeof e!="string"?e:e.includes("res.cloudinary.com")?ye(e):g(e)?xe(e):e}function Se(e){return!e||typeof e!="string"?e:e.includes("res.cloudinary.com")?ve(e):g(e)?ke(e):e}function Le(e,t){const n="916239379751",o=`I am interested in ${e} - ${window.location.origin}/product-details?id=${t}`,i=`https://wa.me/${n}?text=${encodeURIComponent(o)}`;window.open(i,"_blank","noopener,noreferrer")}typeof window<"u"&&(window.openProductWhatsApp=Le);function ot(e){var p,k;const t=Ee(((p=e.imageUrls)==null?void 0:p[0])||""),o=((k=e.videoUrls)==null?void 0:k.length)>0?e.videoUrls[0]:null,i=O=>"₹"+O.toLocaleString("en-IN"),s=e.discountedPrice||e.basePrice,r=e.discountedPrice?e.basePrice:null,a=R(e.id);let l="";t?l=`<img src="${t}" alt="${e.name}" loading="lazy" />`:o?l=`<video 
      poster="${Ie(o)}"
      data-src="${Se(o)}"
      class="pc-video-preview" 
      muted playsinline loop 
      onmouseover="if (!this.src && this.dataset.src) { this.src = this.dataset.src; } this.play();" 
      onmouseout="this.pause()" 
      style="width:100%; height:100%; object-fit:contain; background:transparent;">
    </video>`:l='<div class="pc-no-image">👟</div>';const d="";(e.name||"").replace(/"/g,"&quot;");const c=(e.category||"").trim().toLowerCase()==="handbags";return`
    <a href="/product-details?id=${e.id}" target="_blank" class="product-card-link" aria-label="${e.name}">
      <article class="product-card product-card-new ${c?"is-handbag":""}" data-product-id="${e.id}">
        <div class="pc-image-wrap">
          ${d}
          <button class="pc-heart-btn ${a?"active":""}" onclick="event.preventDefault(); event.stopPropagation(); toggleWishlistItem('${e.id}'); this.classList.toggle('active'); this.querySelector('svg').setAttribute('fill', this.classList.contains('active') ? '#0a0a0a' : 'none'); this.querySelector('svg').setAttribute('stroke', this.classList.contains('active') ? '#0a0a0a' : 'currentColor')">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="${a?"#0a0a0a":"none"}" stroke="${a?"#0a0a0a":"currentColor"}" stroke-width="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
            </svg>
          </button>
          <a href="https://wa.me/916239379751?text=${encodeURIComponent(`Hi Kicks Aura, I want to inquire about this product:

*`+(e.name||e.brand||"")+`*
Price: `+i(s)+`
Link: `+window.location.origin+"/product-details?id="+e.id)}" target="_blank" rel="noopener noreferrer" class="pc-whatsapp-btn" aria-label="Inquire via WhatsApp" onclick="event.stopPropagation();">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
          </a>
          ${l}
        </div>
        <div class="pc-body">
          ${e.category?`<div class="pc-category">${e.category}</div>`:""}
          <h3 class="pc-name">${e.name}</h3>
          <div class="pc-price-row">
            <span class="pc-price ${r?"pc-price--sale":"pc-price--normal"}">${i(s)}</span>
            ${r?`<span class="pc-original-price">${i(r)}</span>`:""}
          </div>
        </div>
      </article>
    </a>
  `}function st(e="home"){return setTimeout(te,0),`
    <header class="header">
      <!-- Rotating Announcement Ticker -->
      <div class="header__banner" id="header-banner">
        <div class="header__banner-ticker" id="header-ticker">
          <div class="ticker-item is-active">
            <span class="ticker-highlight">COD Available</span>
            <span class="ticker-divider">|</span>
            <span>Only Rs 99 Advance</span>
          </div>
          <div class="ticker-item">
            <span class="ticker-highlight">Extra Rs 200 Off</span>
            <span class="ticker-divider">|</span>
            <span>on Prepaid Orders</span>
          </div>
        </div>
      </div>
      <!-- Top Bar: Logo, Search, Icons -->
      <div class="header__top">
        <div class="container header__top-inner">
          <!-- Hamburger + Home (mobile only) -->
          <div class="mobile-left-actions">
            <button class="icon-btn mobile-menu-btn" id="mobile-menu-btn" aria-label="Open menu" aria-expanded="false">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round">
                <line x1="3" y1="6" x2="21" y2="6"/>
                <line x1="3" y1="12" x2="21" y2="12"/>
                <line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
            </button>
            <a href="/" class="icon-btn mobile-home-btn" aria-label="Home">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
            </a>
          </div>
          
          <div class="header__logo-container">
            <a href="/" class="header__logo header__logo--wordmark" aria-label="Kicks Aura – Home">
              <span class="logo-kicks">Kicks</span><span class="logo-aura">Aura</span>
            </a>
            <div class="header__logo-subtitle">PREMIUM | <span class="subtitle-highlight">UNISEX</span> | CURATED</div>
          </div>
          <div class="header__search">
            <div class="header__search-icon-left">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#666" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            </div>
            <input type="text" placeholder="" id="nav-search-input" />
            <div class="animated-placeholder-wrapper" id="nav-animated-placeholder">
              <span class="animated-placeholder-text visible" id="placeholder-text-1">Search for Sneakers...</span>
              <span class="animated-placeholder-text slide-down" id="placeholder-text-2"></span>
            </div>
            <button class="header__search-btn" id="nav-search-btn" style="display:none;"></button>
          </div>
          <div class="header__icons">
            <button class="icon-btn nav-icon" id="wishlist-trigger" aria-label="Wishlist" style="position: relative; background:none; border:none; cursor:pointer;">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
              </svg>
              <span class="cart-badge nav-badge" id="wishlist-badge" style="display: none;">0</span>
            </button>
            <button class="icon-btn" id="cart-trigger" style="position: relative; background:none; border:none; cursor:pointer;">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
              <span class="cart-badge navbar__cart-count" id="cart-badge">0</span>
            </button>
            <div class="profile-dropdown-wrap" id="profile-dropdown-wrap">
              <button class="icon-btn profile-icon-btn" id="profile-icon-btn" aria-label="Account" aria-haspopup="true">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              </button>
              <div class="profile-dropdown" id="profile-dropdown" role="menu">
                <div class="profile-dropdown-header" id="profile-dropdown-header" style="padding: 16px 20px 12px; border-bottom: none;">
                  <h3 class="profile-dropdown-label" style="font-size: 16px; color: #111; font-weight: 700; text-transform: none; letter-spacing: 0; margin: 0;">Account</h3>
                  <p class="profile-dropdown-name" id="profile-dropdown-name" style="display:none;"></p>
                </div>
                <div class="profile-dropdown-auth" id="profile-dropdown-auth" style="display:flex; flex-direction:column; gap:10px; padding:0 20px 16px;">
              <button class="profile-auth-btn" id="profile-login-btn" style="background:#0a0a0a; color:#fff; border-radius:8px; padding:12px; font-size:14px; font-weight:600; border:none; cursor:pointer; width: 100%;">Log In with Mobile</button>
                </div>
                <div class="profile-dropdown-actions" style="border-top:none; padding: 0 20px 20px;">
                  <a href="/orders" class="profile-dropdown-btn" id="profile-dd-orders">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
                    Orders
                  </a>
                  <a href="/profile" class="profile-dropdown-btn" id="profile-dd-profile">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    Profile
                  </a>
                </div>
              </div>
            </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Nav Links -->
      <nav class="header__nav">
        <div class="header__nav-inner">
          <a href="/" class="nav-link ${e==="home"?"nav-link--active":""}">Home</a>
          <div class="nav-dropdown-wrapper" id="nav-categories-wrapper">
            <a href="/#shop-category" class="nav-link nav-link--dropdown ${e==="products"?"nav-link--active":""}">
              Categories
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
            </a>
            <div class="nav-dropdown" id="nav-categories-dropdown"></div>
          </div>
          <a href="/#new-arrivals" class="nav-link">New Arrivals</a>
          <a href="/shipping-policy" class="nav-link ${e==="shipping"?"nav-link--active":""}">Shipping Policy</a>
        </div>
      </nav>

      <!-- Mobile Nav Drawer -->
      <div class="mobile-nav-overlay" id="mobile-nav-overlay" aria-hidden="true"></div>
      <div class="mobile-nav-drawer" id="mobile-nav-drawer" role="dialog" aria-modal="true" aria-label="Navigation menu">
        <div class="mobile-nav-drawer__header" style="justify-content: flex-end;">
          <button class="mobile-nav-drawer__close" id="mobile-nav-close" aria-label="Close menu">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <nav class="mobile-nav-drawer__nav">
          <a href="/" class="mobile-nav-link ${e==="home"?"mobile-nav-link--active":""}">
            Home
          </a>
          <a href="/#shop-category" class="mobile-nav-link ${e==="products"?"mobile-nav-link--active":""}">
            Categories
          </a>
          <a href="/#new-arrivals" class="mobile-nav-link">
            New Arrivals
          </a>
          <a href="/shipping-policy" class="mobile-nav-link ${e==="shipping"?"mobile-nav-link--active":""}">
            Shipping Policy
          </a>
        </nav>
        <div class="mobile-nav-drawer__footer">
          <span>© 2026 Kicks Aura. All rights reserved.</span>
        </div>
      </div>
    </header>
  
    <!-- Wishlist Sidebar -->
    <div class="sidebar-overlay" id="wishlist-overlay"></div>
    <div class="sidebar cart-sidebar-modern" id="wishlist-sidebar">
      <div class="sidebar-header">
        <h3>Your Wishlist</h3>
        <button class="close-sidebar" id="close-wishlist">✕</button>
      </div>
      <div class="wishlist-items" id="wishlist-items-container">
        <!-- Items injected via JS -->
      </div>
    </div>

    <!-- Cart Sidebar -->
    <div class="sidebar-overlay" id="cart-overlay"></div>
    <div class="sidebar cart-sidebar-modern" id="cart-sidebar">
      <div class="sidebar-header cart-header-modern">
        <h3 class="cart-main-title">Your Cart <span class="cart-sidebar-count" id="cart-sidebar-count"></span></h3>
        <button class="close-sidebar" id="close-cart" aria-label="Close cart">✕</button>
      </div>
      <div class="cart-shipping-banner" id="cart-shipping-banner">
        <!-- Free shipping progress bar injected via JS -->
      </div>
      <div class="cart-sidebar-items" id="cart-sidebar-items">
        <!-- Items injected via JS -->
      </div>
      <div class="cart-sidebar-footer" id="cart-sidebar-footer">
        <!-- Footer injected via JS -->
      </div>
    </div>
  `}function Ce(){return`
    <!-- Trust Strip -->
    <div class="trust-strip">
      <div class="trust-strip__inner">
        <div class="trust-strip__item">
          <div class="trust-strip__icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          </div>
          <div class="trust-strip__label">COD Available</div>
          <div class="trust-strip__sub">(Only Rs 99 advance)</div>
        </div>
        <div class="trust-strip__item">
          <div class="trust-strip__icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
          </div>
          <div class="trust-strip__label">Rs 200 Off on Prepaid</div>
          <div class="trust-strip__sub">Shipping</div>
        </div>
        <div class="trust-strip__item">
          <div class="trust-strip__icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
          </div>
          <div class="trust-strip__label">Easy Returns & Exchange</div>
          <div class="trust-strip__sub">Hassle-free within 7 days</div>
        </div>

      </div>
    </div>
    <footer id="footer" class="footer">
      <div class="container footer__inner">
        <div class="footer__col">
          <h4>CUSTOMER CARE</h4>
          <div class="footer__contact-info">
            <p><span>Address:</span> Phase 2, Chandigarh, India</p>
            <p><span>Mobile:</span> +91 6239379751</p>
            <p><span>Email:</span> kicksauraa@gmail.com</p>
            <p><span>Store Time:</span> 11:00 AM - 8:00 PM, Monday - Saturday</p>
          </div>
        </div>
        <div class="footer__links-wrapper">
          <div class="footer__col">
            <h4 style="visibility: hidden; user-select: none; margin-bottom: 18px;">COMPANY</h4>
            <a href="/">Home</a>
            <a href="/about-us">About Us</a>
            <a href="https://wa.me/916239379751?text=Hey!" target="_blank" rel="noopener">Contact Us</a>
          </div>
          <div class="footer__col">
            <h4 style="visibility: hidden; user-select: none; margin-bottom: 18px;">POLICIES</h4>
            <a href="/shipping-policy">Shipping & Delivery Policy</a>
            <a href="/return-exchange">Return, Exchange & Refund</a>
            <a href="/terms-conditions">Terms & Conditions</a>
            <a href="/privacy-policy">Privacy Policy</a>
          </div>
        </div>
        <div class="footer__col" style="align-items: center; justify-content: flex-start; margin-left: auto; margin-top: 18px;">
          <a href="https://instagram.com/kicksauraa" target="_blank" rel="noopener" aria-label="Instagram" style="opacity: 0.7; transition: opacity 0.2s;">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
          </a>
        </div>

      </div>
      <div class="container">
        <div class="footer__bottom">
          <span class="footer__bottom-copy">© 2026 Kicks Aura. All rights reserved.</span>
        </div>
      </div>
    </footer>
  `}function Pe(){const e=document.getElementById("footer-container");e&&(e.innerHTML=Ce())}function rt(){const e=document.getElementById("header-ticker");if(!e)return;const t=e.querySelectorAll(".ticker-item");if(!t.length)return;let n=0;setInterval(()=>{const o=t[n];o.classList.add("is-leaving"),o.classList.remove("is-active"),n=(n+1)%t.length;const i=t[n];i.classList.remove("is-leaving"),i.classList.add("is-active"),setTimeout(()=>{o.classList.remove("is-leaving")},600)},3800)}function at(){const e=document.getElementById("mobile-menu-btn"),t=document.getElementById("mobile-nav-drawer"),n=document.getElementById("mobile-nav-overlay"),o=document.getElementById("mobile-nav-close");if(!e||!t||!n)return;const i=()=>{t.classList.add("is-open"),n.classList.add("is-open"),e.setAttribute("aria-expanded","true"),document.body.style.overflow="hidden"},s=()=>{t.classList.remove("is-open"),n.classList.remove("is-open"),e.setAttribute("aria-expanded","false"),document.body.style.overflow=""};e.addEventListener("click",i),o&&o.addEventListener("click",s),n.addEventListener("click",s),t.querySelectorAll(".mobile-nav-link").forEach(r=>{r.addEventListener("click",s)})}async function te(){const e=document.getElementById("nav-categories-wrapper"),t=document.getElementById("nav-categories-dropdown");if(!(!e||!t))try{const n=await ge(),o=Array.isArray(n)?n:n.content||[];if(o.length===0){e.style.display="none";return}const i=o.map(s=>{const r=s.name||s;return`<a href="/products?categories=${encodeURIComponent(r)}">${r}</a>`}).join("");t.innerHTML=i}catch(n){console.error("Failed to load categories:",n),e.style.display="none"}}function V(){Pe(),te()}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",V):V();const B="kicksaura_cart";function _e(e,t){if(e==null&&t==null)return!0;if(e==null||t==null){const n=String(e??"").trim(),o=String(t??"").trim();return(n===""||n==="null"||n==="undefined")&&(o===""||o==="null"||o==="undefined")}return String(e).trim()===String(t).trim()}function $(e,t,n){return!(!_e(e.productId,t)||String(e.size).trim()!==String(n).trim())}function Be(e){if(!Array.isArray(e)||e.length<=1)return e||[];const t=[];for(const n of e){const o=t.find(i=>$(i,n.productId,n.size));o?(o.quantity=(Number(o.quantity)||1)+(Number(n.quantity)||1),o.liveVideoCall=!!o.liveVideoCall||!!n.liveVideoCall,o.variantId=n.variantId||o.variantId):t.push({...n,quantity:Number(n.quantity)||1})}return t}function y(){const e=localStorage.getItem(B),t=e?JSON.parse(e):[],n=Be(t);return t.length!==n.length&&e&&localStorage.setItem(B,JSON.stringify(n)),n}function j(e){localStorage.setItem(B,JSON.stringify(e)),ne(),window.dispatchEvent(new CustomEvent("cart-updated",{detail:e}))}function lt(e,t,n=1,o={}){var l;const i=y(),s=(t==null?void 0:t.size)||"",r=!!o.liveVideoCall,a=i.findIndex(d=>$(d,e.id,s));if(a>-1){const d=(Number(i[a].quantity)||1)+(Number(n)||1);d>10?(alert("You can't add more than 10 items of the same product."),i[a].quantity=10):i[a].quantity=d,i[a].liveVideoCall=!!i[a].liveVideoCall||r,i[a].variantId=t&&t.id?t.id:i[a].variantId}else{const d=Number(n)||1;d>10&&alert("You can't add more than 10 items of the same product."),i.push({productId:e.id,variantId:t&&t.id||null,productName:e.name,productBrand:e.brand,productImage:((l=e.imageUrls)==null?void 0:l[0])||"",size:s,price:e.discountedPrice||e.basePrice,basePrice:e.basePrice,quantity:Math.min(10,d),liveVideoCall:!!o.liveVideoCall})}return j(i),i}function dt(e,t){let n=y();return n=n.filter(o=>!$(o,e,t)),j(n),n}function ct(e,t,n){const o=y(),i=o.find(s=>$(s,e,t));if(i){const s=Number(n)||1;s>10?(alert("You can't add more than 10 items of the same product."),i.quantity=10):i.quantity=Math.max(1,s)}return j(o),o}function pt(){return y()}function ut(){return y().reduce((e,t)=>e+t.price*t.quantity,0)}function Te(){return y().reduce((e,t)=>e+t.quantity,0)}function gt(){localStorage.removeItem(B),ne(),window.dispatchEvent(new CustomEvent("cart-updated",{detail:[]}))}function ne(){const e=document.querySelectorAll(".navbar__cart-count"),t=Te();e.forEach(n=>{n.textContent=t,n.style.display=t>0?"flex":"none"})}const Ae="https://verify.msg91.com/otp-provider.js",z=4,ie=30;let U=!1,I=!1,S=null,oe="",T=null,L=null;async function $e(){if(S)return S;try{const e=await fetch("/api/v1/users/auth/widget-config");if(!e.ok){const t=await e.text().catch(()=>"no body");throw new Error(`HTTP ${e.status}: ${t}`)}return S=await e.json(),S}catch(e){throw console.error("[KicksAura] Could not load MSG91 widget config:",e.message),new Error("API Error: "+e.message)}}function Oe(){return new Promise((e,t)=>{if(window.initSendOTP){e();return}if(I){const i=setInterval(()=>{window.initSendOTP&&(clearInterval(i),e())},100);setTimeout(()=>{clearInterval(i),t(new Error("SDK load timeout"))},1e4);return}I=!0;const n=document.getElementById("msg91-otp-sdk");n&&n.remove();const o=document.createElement("script");o.id="msg91-otp-sdk",o.src=Ae,o.onload=()=>{const i=setInterval(()=>{window.initSendOTP&&(clearInterval(i),I=!1,e())},50);setTimeout(()=>{clearInterval(i),t(new Error("initSendOTP unavailable"))},8e3)},o.onerror=()=>{I=!1,t(new Error("Failed to load MSG91 SDK"))},document.head.appendChild(o)})}function Me(e){U||(window.initSendOTP({widgetId:e.widgetId,tokenAuth:e.widgetToken,exposeMethods:!0,success:t=>{},failure:t=>console.error("MSG91 Init Failure:",t)}),U=!0)}function Ne(e=null){let t=document.getElementById("login-modal-overlay");t||(t=document.createElement("div"),t.id="login-modal-overlay",t.className="login-modal-overlay",t.setAttribute("role","dialog"),t.setAttribute("aria-modal","true"),t.setAttribute("aria-label","Log in to KicksAura"),document.body.appendChild(t)),t.classList.add("checkout-mode");const n=`
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
          ${Array.from({length:z},(r,a)=>`
            <input
              type="text"
              inputmode="numeric"
              maxlength="1"
              class="login-otp-box"
              id="otp-box-${a}"
              aria-label="OTP digit ${a+1}"
              autocomplete="${a===0?"one-time-code":"off"}"
            />`).join("")}
        </div>
        <div class="login-error-msg" id="login-otp-error"></div>
        <button class="login-btn-primary" id="login-verify-btn" style="margin-top: 16px;">
          <span id="login-verify-text">Verify OTP</span>
        </button>
        <div class="login-resend-row">
          <button class="login-resend-btn" id="login-resend-btn" disabled>Resend OTP</button>
          <span class="login-resend-countdown" id="login-resend-countdown"> in <span id="login-countdown-num">${ie}</span>s</span>
        </div>
        <p class="login-back-link">
          Wrong number? <button id="login-change-phone-btn">Change</button>
        </p>
      </div>
  `;let o="";if(e==="checkout"?o=`
      <h3 class="login-modal-left-title">Order summary</h3>
      <div class="login-modal-cart-items" id="login-modal-cart-list">
        <!-- Cart items will be rendered here -->
      </div>
    `:o=`
      <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; text-align: center;">
        <h2 style="color: white; font-size: 28px; margin-bottom: 8px;">Welcome</h2>
        <p style="color: rgba(255, 255, 255, 0.95); font-size: 14px; line-height: 1.5;">Log in to Access your Wishlist, Orders and more</p>
      </div>
    `,t.innerHTML=`
    <div class="login-modal checkout-mode" id="login-modal-panel">
      <button class="login-modal-close" id="login-modal-close" aria-label="Close">✕</button>
      
      <div class="login-modal-left-pane">
        <div class="login-modal-left-content" style="flex: 1;">
          ${o}
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
  `,!document.getElementById("policy-modal-overlay")){const r=document.createElement("div");r.id="policy-modal-overlay",r.className="login-modal-overlay",r.style.zIndex="99999",r.innerHTML=`
      <div class="login-modal" style="max-width: 550px; padding: 0; text-align: left; display: flex; flex-direction: column; max-height: 85vh; border-radius: 20px; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.4);">
        <div style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 28px 32px; position: relative; flex-shrink: 0;">
          <h2 id="policy-modal-title" style="margin: 0; font-size: 26px; color: #ffffff; font-weight: 700; letter-spacing: -0.5px;"></h2>
          <button id="policy-modal-close" style="position: absolute; top: 24px; right: 24px; background: rgba(255,255,255,0.1); border: none; font-size: 16px; cursor: pointer; color: white; width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; transition: all 0.2s ease; outline: none;" onmouseover="this.style.background='rgba(255,255,255,0.2)'" onmouseout="this.style.background='rgba(255,255,255,0.1)'">✕</button>
        </div>
        <div id="policy-modal-content" style="padding: 32px; font-size: 15px; line-height: 1.7; color: #334155; overflow-y: auto; background: #ffffff;"></div>
      </div>
    `,document.body.appendChild(r),document.getElementById("policy-modal-close").addEventListener("click",()=>{document.getElementById("policy-modal-overlay").classList.remove("open")}),r.addEventListener("click",a=>{a.target===r&&r.classList.remove("open")})}qe();const i=document.getElementById("login-about-link");i&&(i.onclick=r=>{r.preventDefault(),document.getElementById("policy-modal-title").textContent="About Us",document.getElementById("policy-modal-content").innerHTML=ce,document.getElementById("policy-modal-overlay").classList.add("open")});const s=document.getElementById("login-shipping-link");s&&(s.onclick=r=>{r.preventDefault(),document.getElementById("policy-modal-title").textContent="Shipping & Delivery Policy",document.getElementById("policy-modal-content").innerHTML=pe,document.getElementById("policy-modal-overlay").classList.add("open")})}function qe(){document.getElementById("login-modal-close").addEventListener("click",P),document.getElementById("login-modal-overlay").addEventListener("click",n=>{n.target===document.getElementById("login-modal-overlay")&&P()}),document.addEventListener("keydown",n=>{n.key==="Escape"&&P()}),document.getElementById("login-send-otp-btn").addEventListener("click",W);const e=document.getElementById("login-phone-input");function t(){const n=document.getElementById("login-phone-display");if(!n)return;const o=e.value.replace(/\D/g,"").slice(0,10);let i="";for(let s=0;s<10;s++){const r=o[s]||"",a=s===o.length,l=s===4?"margin-right: 12px;":"",c=a&&document.activeElement===e?"border-bottom: 2px solid #0f172a;":"border-bottom: 2px solid #cbd5e1;";i+=`<span style="width: 14px; height: 28px; display: inline-flex; justify-content: center; align-items: center; font-size: 18px; font-weight: 600; color: ${r?"#0f172a":"transparent"}; ${c} ${l} transition: all 0.2s;">${r||"0"}</span>`}n.innerHTML=i}e.addEventListener("keydown",n=>{n.key==="Enter"&&W()}),e.addEventListener("input",n=>{let o=n.target.value.replace(/\D/g,"");o.length>10&&(o=o.slice(0,10)),n.target.value=o,t(),ae()}),e.addEventListener("focus",t),e.addEventListener("blur",t),t(),je(),document.getElementById("login-verify-btn").addEventListener("click",C),document.getElementById("login-resend-btn").addEventListener("click",De),document.getElementById("login-change-phone-btn").addEventListener("click",()=>{se()})}function je(){const e=x();e.forEach((t,n)=>{t.addEventListener("input",o=>{const i=o.target.value.replace(/\D/g,"");o.target.value=i.slice(-1),i?(t.classList.add("filled"),t.classList.remove("error"),n<e.length-1?e[n+1].focus():Array.from(e).every(r=>r.value)&&C()):t.classList.remove("filled"),h()}),t.addEventListener("keydown",o=>{o.key==="Backspace"?!t.value&&n>0&&(e[n-1].value="",e[n-1].classList.remove("filled"),e[n-1].focus()):o.key==="Enter"&&C()}),t.addEventListener("paste",o=>{o.preventDefault();const i=(o.clipboardData||window.clipboardData).getData("text").replace(/\D/g,"");if(!i)return;e.forEach((r,a)=>{r.value=i[a]||"",i[a]?r.classList.add("filled"):r.classList.remove("filled")});const s=e.findIndex(r=>!r.value);s===-1?(e[e.length-1].focus(),C()):e[s].focus(),h()})})}function x(){return Array.from({length:z},(e,t)=>document.getElementById(`otp-box-${t}`))}function ze(){return x().map(e=>e.value).join("")}function H(){x().forEach(e=>{e.value="",e.classList.remove("filled","error")})}function se(){w(),document.getElementById("login-step-phone").style.display="",document.getElementById("login-step-otp").style.display="none";const e=document.getElementById("login-modal-title"),t=document.getElementById("login-modal-subtitle");e&&(e.textContent="Log In"),t&&(t.textContent="Enter your mobile number to continue");const n=document.getElementById("login-phone-input");n&&(n.value=""),H(),h(),v(!1),setTimeout(()=>{var o;return(o=document.getElementById("login-phone-input"))==null?void 0:o.focus()},50)}function He(){document.getElementById("login-step-phone").style.display="none",document.getElementById("login-step-otp").style.display="";const e=document.getElementById("login-modal-title"),t=document.getElementById("login-modal-subtitle");e&&(e.textContent="Enter OTP"),t&&(t.textContent="Check your SMS"),document.getElementById("login-otp-phone-display").textContent=`+91 ${oe}`,H(),h(),m(!1),re(),setTimeout(()=>{var n;return(n=document.getElementById("otp-box-0"))==null?void 0:n.focus()},50)}async function W(){const e=document.getElementById("login-phone-input").value.trim().replace(/\D/g,"");if(!e||e.length!==10||!/^[6-9]/.test(e)){q("Please enter a valid 10-digit Indian mobile number.");return}v(!0),ae();try{const t=await $e();await Oe(),Me(t);let n=50;for(;typeof window.sendOtp!="function"&&n>0;)await new Promise(i=>setTimeout(i,100)),n--;if(typeof window.sendOtp!="function")throw new Error("MSG91 SDK not ready. Please refresh and try again.");const o="91"+e;oe=e,window.sendOtp(o,i=>{T=(i==null?void 0:i.reqId)||(i==null?void 0:i.message)||null,He(),v(!1)},i=>{const s=typeof i=="string"?i:(i==null?void 0:i.message)||"Could not send OTP. Please try again.";q(s),v(!1)})}catch(t){q(t.message||"Could not send OTP. Please try again."),v(!1)}}async function C(){const e=ze();if(e.length!==z){f("Please enter all 6 digits.");return}if(!T){f("Session expired. Please resend the OTP.");return}m(!0),h(),window.verifyOtp(e,async t=>{try{const n=(t==null?void 0:t.access_token)||(t==null?void 0:t.token)||(t==null?void 0:t.message);if(!n||n.toLowerCase()==="success"){f("Verification error. Please try again."),m(!1);return}const o=await Z(n);m(!1),w(),P(),window.dispatchEvent(new CustomEvent("auth-changed",{detail:{loggedIn:!0,user:o}})),b&&(window.location.href=b);const i=document.getElementById("profile-dropdown-name");if(i){const s=[o.firstName,o.lastName].filter(Boolean).join(" ").trim()||`+91 ${o.phoneNumber}`;i.textContent=s}}catch(n){f(n.message||"Login failed. Please try again."),m(!1)}},t=>{const o=(typeof t=="string"?t:(t==null?void 0:t.message)||"Incorrect OTP. Please try again.").toLowerCase().includes("expired")?"OTP has expired. Please resend.":"Incorrect OTP. Please try again.";f(o);const i=x();i.forEach(s=>{s.classList.add("error"),s.value=""}),i[0]&&i[0].focus(),m(!1)},T)}function De(){const e=document.getElementById("login-resend-btn");if(!e.disabled){e.disabled=!0,h(),H();try{const t=window.retryOTP||window.retryOtp;if(typeof t!="function")throw new Error("OTP service is currently unavailable.");t("11",n=>{n!=null&&n.reqId&&(T=n.reqId),re()},n=>{const o=typeof n=="string"?n:(n==null?void 0:n.message)||"Could not resend OTP. Please try again.";f(o),e.disabled=!1})}catch(t){f(t.message||"An error occurred while resending OTP."),e.disabled=!1}}}function re(){w();let e=ie;const t=document.getElementById("login-countdown-num"),n=document.getElementById("login-resend-countdown"),o=document.getElementById("login-resend-btn");!t||!o||(o.disabled=!0,n&&(n.style.display=""),t.textContent=e,L=setInterval(()=>{e--,t.textContent=e,e<=0&&(w(),o.disabled=!1,n&&(n.style.display="none"))},1e3))}function w(){L&&(clearInterval(L),L=null)}function q(e){var n;const t=document.getElementById("login-phone-error");t&&(t.textContent=e),(n=document.getElementById("login-phone-wrap"))==null||n.classList.add("error")}function ae(){var t;const e=document.getElementById("login-phone-error");e&&(e.textContent=""),(t=document.getElementById("login-phone-wrap"))==null||t.classList.remove("error")}function f(e){const t=document.getElementById("login-otp-error");t&&(t.textContent=e)}function h(){const e=document.getElementById("login-otp-error");e&&(e.textContent=""),x().forEach(t=>t.classList.remove("error"))}function v(e){const t=document.getElementById("login-send-otp-btn");t&&(t.disabled=e,t.innerHTML=e?'<span class="login-spinner"></span><span>Sending…</span>':'<span id="login-send-otp-text">Continue</span>')}function m(e){const t=document.getElementById("login-verify-btn");t&&(t.disabled=e,t.innerHTML=e?'<span class="login-spinner"></span><span>Verifying…</span>':'<span id="login-verify-text">Verify OTP</span>')}let b=null;function ft(e=null){let t=null;typeof e=="string"?b=e:e&&typeof e=="object"?(b=e.redirectUrl||null,t=e.context||null):b=null,Ne(t);const n=document.getElementById("login-modal-overlay");if(n){if(t==="checkout"){const o=document.getElementById("login-modal-cart-list");if(o)try{const i=localStorage.getItem("kicksaura_cart"),s=i?JSON.parse(i):[];if(s.length===0)o.innerHTML='<p style="color:#888; font-size:14px;">Your cart is empty.</p>';else{o.innerHTML=s.map(l=>{const d=l.productImage&&l.productImage.startsWith("http")?l.productImage:l.productImage?`https://res.cloudinary.com/undefined/image/upload/w_200,h_200,c_fill,q_auto,f_auto/${l.productImage}`:"",c=(l.price*l.quantity).toLocaleString("en-IN");return`
              <div class="login-modal-cart-item" style="display: flex; gap: 16px; padding: 12px 0; border-bottom: 1px solid #e5e5e5; cursor: pointer;">
                <img src="${d}" alt="${l.productName}" style="width: 54px; height: 54px; border-radius: 50%; object-fit: cover; border: 1px solid #eee;" />
                <div style="flex: 1; display: flex; flex-direction: column; justify-content: center;">
                  <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 12px;">
                    <h4 style="margin: 0 0 6px 0; font-size: 14px; font-weight: 600; color: #111; line-height: 1.4;">${l.productName}</h4>
                    <span style="font-weight: 700; font-size: 15px; color: #111;">₹${c}</span>
                  </div>
                  <p style="margin: 0; font-size: 13px; color: #888;">Qty: ${l.quantity}</p>
                </div>
              </div>
            `}).join("");let r=0,a=0;s.forEach(l=>{r+=l.quantity,a+=l.price*l.quantity}),o.innerHTML+=`
            <div id="login-modal-cart-summary" style="display: none; padding-top: 24px; color: #111; cursor: default;">
              <div style="display: flex; justify-content: space-between; font-size: 15px; margin-bottom: 24px; color: #111;">
                <span>Subtotal</span>
                <span>₹${a.toLocaleString("en-IN")}</span>
              </div>
              <div style="border-top: 1.5px solid #111; margin-bottom: 24px;"></div>
              <div style="display: flex; justify-content: space-between; font-size: 18px; font-weight: 800; color: #111; margin-bottom: 8px;">
                <span>Grand Total</span>
                <span>₹${a.toLocaleString("en-IN")}</span>
              </div>
            </div>
          `,o.onclick=l=>{const d=document.getElementById("login-modal-cart-summary");d&&(d.style.display=d.style.display==="none"?"block":"none")}}}catch(i){console.error("Failed to load cart for login modal",i)}}se(),n.classList.add("open"),document.body.style.overflow="hidden"}}function P(){w();const e=document.getElementById("login-modal-overlay");e&&(e.classList.remove("open"),document.body.style.overflow="",e.classList.contains("checkout-mode")&&(X()||(window.location.href="/")))}export{lt as A,Je as B,Ee as C,R as D,Ie as E,nt as F,it as G,Ye as H,me as I,he as J,ye as K,K as L,Ke as M,We as N,Ge as O,ee as P,Ze as Q,ft as R,Xe as S,Te as T,ut as U,Ue as V,ce as a,pt as b,Qe as c,et as d,G as e,gt as f,Y as g,fe as h,X as i,ne as j,st as k,Z as l,Ce as m,at as n,Ve as o,de as p,tt as q,dt as r,pe as s,rt as t,ct as u,ge as v,Fe as w,Re as x,ot as y,D as z};
