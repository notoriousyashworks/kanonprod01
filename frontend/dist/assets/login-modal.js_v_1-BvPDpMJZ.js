(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const o of document.querySelectorAll('link[rel="modulepreload"]'))i(o);new MutationObserver(o=>{for(const s of o)if(s.type==="childList")for(const a of s.addedNodes)a.tagName==="LINK"&&a.rel==="modulepreload"&&i(a)}).observe(document,{childList:!0,subtree:!0});function n(o){const s={};return o.integrity&&(s.integrity=o.integrity),o.referrerPolicy&&(s.referrerPolicy=o.referrerPolicy),o.crossOrigin==="use-credentials"?s.credentials="include":o.crossOrigin==="anonymous"?s.credentials="omit":s.credentials="same-origin",s}function i(o){if(o.ep)return;o.ep=!0;const s=n(o);fetch(o.href,s)}})();const oe="kicksaura_wishlist";function W(){const e=localStorage.getItem(oe);return e?JSON.parse(e):[]}function $e(e){localStorage.setItem(oe,JSON.stringify(e))}function se(e){return W().some(n=>n.id===e)}function ae(e){var s,a,r,l,d,c;let t=e;if(typeof e=="string"&&(t=(s=window._allProducts)==null?void 0:s.find(p=>p.id===e),!t)){const p=document.querySelector(`[data-product-id="${e}"]`);p?t={id:e,name:((a=p.querySelector(".pc-name"))==null?void 0:a.textContent)||"Product",imageUrls:[(r=p.querySelector("img"))==null?void 0:r.src],discountedPrice:parseFloat(((d=(l=p.querySelector(".pc-price"))==null?void 0:l.textContent)==null?void 0:d.replace(/[^0-9.]/g,""))||"0")}:t={id:e}}let n=W();const i=n.findIndex(p=>p.id===t.id);let o=!1;return i>-1?n.splice(i,1):(n.push({id:t.id,name:t.name,image:((c=t.imageUrls)==null?void 0:c[0])||"/images/products/redjordanface1.png",price:t.discountedPrice||t.basePrice,originalPrice:t.discountedPrice?t.basePrice:null}),o=!0),$e(n),Le(),re(),o?ee("Added to wishlist!","success"):ee("Removed from wishlist.","info"),o}function Le(){const e=W(),t=document.getElementById("wishlist-badge");t&&(t.textContent=e.length,t.style.display=e.length>0?"flex":"none")}function re(){const e=document.getElementById("wishlist-items-container");if(!e)return;const t=W();if(t.length===0){e.innerHTML=`
      <div class="empty-state" style="margin-top: 64px; text-align: center;">
        <div style="font-size: 32px; margin-bottom: 16px;">🤍</div>
        <p style="font-weight: 600; color: #333; font-size: 16px;">Your wishlist is empty</p>
      </div>
    `;return}e.innerHTML=t.map(n=>{const i=n.image||"",o=Number(n.price||0),s=Number(n.originalPrice||0),a=`Rs. ${o.toLocaleString("en-IN")}.00`,r=s&&s>o?`Rs. ${s.toLocaleString("en-IN")}.00`:null,l=r?`<span style="text-decoration: line-through; color: #888; font-size: 13px; margin-right: 6px;">${r}</span><span style="font-weight: 700; color: #111; font-size: 15px;">${a}</span>`:`<span style="font-weight: 700; color: #111; font-size: 15px;">${a}</span>`;return`
      <div class="wishlist-sidebar-item modern-cart-item" data-id="${n.id}" style="cursor: pointer; position: relative; transition: background 0.2s; padding: 14px 12px; border-bottom: 1px solid #eee; display: flex; align-items: flex-start; gap: 14px;">
        <div class="cart-sidebar-img modern-item-img" style="flex: 0 0 74px; width: 74px; height: 74px; border-radius: 12px; overflow: hidden; background: #f9f9f9; display: flex; align-items: center; justify-content: center;">
          ${i?`<img src="${i}" alt="${n.name}" style="width: 100%; height: 100%; object-fit: contain;" />`:'<span style="font-size: 24px;">👟</span>'}
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
    `}).join(""),e.querySelectorAll(".remove-wishlist-btn").forEach(n=>{n.addEventListener("click",i=>{i.stopPropagation();const o=n.dataset.id;ae({id:o});const s=document.querySelector(`.product-card-new[data-product-id="${o}"] .pc-heart-btn`);if(s){s.classList.remove("active");const a=s.querySelector("svg");a&&(a.setAttribute("fill","none"),a.setAttribute("stroke","currentColor"))}})}),e.querySelectorAll(".wishlist-sidebar-item").forEach(n=>{n.addEventListener("click",i=>{if(i.target.closest(".remove-wishlist-btn"))return;const o=n.dataset.id;o&&(window.location.href=`/product-details?id=${o}`)})})}function ft(){const e=document.getElementById("wishlist-sidebar"),t=document.getElementById("wishlist-overlay"),n=document.getElementById("wishlist-trigger"),i=document.getElementById("close-wishlist");if(!e||!n)return;function o(){e.classList.add("open"),t==null||t.classList.add("open"),document.body.classList.add("sidebar-lock"),re()}function s(){e.classList.remove("open"),t==null||t.classList.remove("open"),document.body.classList.remove("sidebar-lock")}n.addEventListener("click",a=>{a.preventDefault(),o()}),i==null||i.addEventListener("click",s),t==null||t.addEventListener("click",s),document.addEventListener("keydown",a=>{a.key==="Escape"&&e.classList.contains("open")&&s()})}window.toggleWishlistItem=ae;window.isWishlisted=se;const D="kicksaura_auth_user";function le(){const e=localStorage.getItem(D);try{return e?JSON.parse(e):null}catch{return null}}function de(e){e?localStorage.setItem(D,JSON.stringify(e)):localStorage.removeItem(D)}function ce(){localStorage.removeItem(D)}function pe(){return!!le()}async function ue(e){const t=await fetch("/api/v1/users/auth/login",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({accessToken:e})});if(!t.ok){const i=await t.json().catch(()=>({}));throw new Error(i.error||"Login failed. Please try again.")}const n=await t.json();return de({uuid:n.uuid,firstName:n.firstName,lastName:n.lastName,phoneNumber:n.phoneNumber,role:n.role,addresses:n.addresses||[]}),n}async function ge(){try{await fetch("/api/v1/users/auth/logout",{method:"POST",credentials:"include"})}catch(e){console.error("Logout request failed",e)}ce(),window.dispatchEvent(new CustomEvent("auth-changed",{detail:{loggedIn:!1}})),window.location.href="/"}const mt=Object.freeze(Object.defineProperty({__proto__:null,clearAuthUser:ce,getAuthUser:le,isLoggedIn:pe,loginWithBackend:ue,logout:ge,setAuthUser:de},Symbol.toStringTag,{value:"Module"})),Pe=`
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
`,Ce=`
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
`,Be="/api/v1";async function y(e,t={}){const n=`${Be}${e}`,i={headers:{"Content-Type":"application/json",...t.headers},credentials:"include",...t};try{const o=await fetch(n,i);if(!o.ok){if(o.status===401)throw console.warn("Session expired or unauthorized. Logging out..."),ge(),new Error("Session expired. Please log in again.");const s=await o.json().catch(()=>({}));throw new Error(s.error||`Request failed with status ${o.status}`)}return o.status===204?null:await o.json()}catch(o){throw console.error(`API Error [${e}]:`,o),o}}async function _e(){return y("/categories")}async function ht(e=0,t=16){return y(`/products/new-arrivals?page=${e}&size=${t}`)}async function yt(e=0,t=16){const n=await y(`/products/new-arrivals?page=${e}&size=${t}`);return n.content||n}async function vt(){const e=await y("/products/trending");return e.content||e}async function Te(e,t=0,n=16){const i=new URLSearchParams;e.query&&i.append("query",e.query),e.categories&&e.categories.length>0&&i.append("categories",e.categories.join(",")),e.brands&&e.brands.length>0&&i.append("brands",e.brands.join(",")),e.minPrice!==void 0&&e.minPrice>0&&i.append("minPrice",e.minPrice),e.maxPrice!==void 0&&e.maxPrice<35e3&&i.append("maxPrice",e.maxPrice),e.sizes&&e.sizes.length>0&&i.append("sizes",e.sizes.join(",")),i.append("page",t),i.append("size",n);const s=`/products/filter?${i.toString()}`;return y(s)}async function bt(e){return y(`/products/${e}`)}async function wt(e,t,n=8){const i=await Te({categories:[e]},0,40),s=(i.content||i||[]).filter(a=>String(a.id)!==String(t)&&a.inStockFlag!==!1);for(let a=s.length-1;a>0;a--){const r=Math.floor(Math.random()*(a+1));[s[a],s[r]]=[s[r],s[a]]}return s.slice(0,n)}async function xt(){return y("/brands")}async function kt(e){return y("/orders/checkout",{method:"POST",body:JSON.stringify(e)})}async function Et(e){return y(`/orders/user/${e}?t=${Date.now()}`)}async function St(e){return y("/users/profile",{method:"PUT",body:JSON.stringify(e)})}async function It(e){return y("/users/profile/address",{method:"POST",body:JSON.stringify(e)})}const Ae={"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"};function f(e){return e==null?"":String(e).replace(/[&<>"']/g,t=>Ae[t])}const u=f;function fe(e){return!e||typeof e!="string"||!e.includes("res.cloudinary.com")?e:e.includes("/upload/")&&!e.includes("/f_auto")?e.replace("/upload/","/upload/f_auto,q_auto,w_800/"):e}function Me(e){return!e||typeof e!="string"||!e.includes("res.cloudinary.com")?e:e.replace("/upload/","/upload/so_0,w_800,q_auto/f_jpg/")}function Oe(e){return!e||typeof e!="string"||!e.includes("res.cloudinary.com")?e:e.replace("/upload/","/upload/sp_auto:maxres_720p/").replace(/\.mp4$/i,".m3u8")}function Ne(e){return!e||typeof e!="string"||!e.includes("res.cloudinary.com")?e:e.replace("/upload/","/upload/q_auto,vc_h264,w_800/")}function ze(e){return!e||typeof e!="string"||!e.includes("res.cloudinary.com")?e:e.replace("/upload/","/upload/q_auto,vc_h264,w_400/")}function v(e){return typeof e=="string"&&e.includes("ik.imagekit.io")}function qe(e){return!v(e)||e.includes("tr=")||e.includes("/tr:")?e:e+(e.includes("?")?"&":"?")+"tr=q-auto,f-auto,w-800"}function He(e){return!v(e)||e.includes("tr=")||e.includes("/tr:")?e:e+(e.includes("?")?"&":"?")+"tr=orig"}function je(e){return!v(e)||e.includes("tr=")||e.includes("/tr:")?e:e+(e.includes("?")?"&":"?")+"tr=orig"}function De(e){return!v(e)||e.includes("tr=")||e.includes("/tr:")?e:e+(e.includes("?")?"&":"?")+"tr=orig"}function me(e){return!e||typeof e!="string"?e:e.includes("res.cloudinary.com")?fe(e):v(e)?qe(e):e}function Ue(e){return typeof e=="string"&&e.includes(".b-cdn.net")&&!e.includes("?")?`${e}?width=480&quality=75`:me(e)}function K(e){return!e||typeof e!="string"?e:e.includes("res.cloudinary.com")?Me(e):v(e)?He(e):e.includes(".b-cdn.net")&&e.includes(".m3u8")?e.replace("playlist.m3u8","thumbnail.jpg"):e.includes(".b-cdn.net")?"":e}function Ve(e){return!e||typeof e!="string"?e:e.includes("res.cloudinary.com")?Oe(e):v(e)||e.includes(".b-cdn.net")&&e.includes(".m3u8")?e:e.includes(".b-cdn.net")&&e.includes(".mp4")?null:e}function We(e){return!e||typeof e!="string"?e:e.includes("res.cloudinary.com")?Ne(e):v(e)?je(e):e.includes(".b-cdn.net")&&e.includes(".m3u8")?e.replace("playlist.m3u8","play_720p.mp4"):(e.includes(".b-cdn.net")&&e.includes(".mp4"),e)}function Fe(e){return!e||typeof e!="string"?e:e.includes("res.cloudinary.com")?ze(e):v(e)?De(e):e.includes(".b-cdn.net")&&e.includes(".m3u8")?e.replace("playlist.m3u8","play_480p.mp4"):e}const Re="916239379751";function he(e,t=80){return String(e||"").toLowerCase().replace(/[^a-z0-9]+/g,"-").slice(0,t).replace(/^-+|-+$/g,"")}function ye(e){return`/category/${he(e)}`}function J(e,t){const n=String(e).toLowerCase();if(t===void 0)return`/product-details?id=${encodeURIComponent(n)}`;const i=he(t);return`/product/${i?`${i}-`:""}${encodeURIComponent(n)}`}function $t(e=[]){return e.length?`<nav class="ka-breadcrumbs" aria-label="Breadcrumb">${e.map((n,i)=>n.href&&i<e.length-1?`<a href="${u(n.href)}">${f(n.name)}</a>`:`<span aria-current="page">${f(n.name)}</span>`).join('<span class="ka-breadcrumbs__sep" aria-hidden="true">/</span>')}</nav>`:""}function Lt(e,{loading:t=!1}={}){return`
      <div class="products-view-more">
        <a class="products-view-more-btn" href="${u(e)}" style="display:inline-block;text-decoration:none;${t?"pointer-events:none;opacity:.7;":""}">${t?"Loading...":"View More"}</a>
      </div>`}function Ke(e){const t=String(e.description||"").trim();return t.length<40||!/belt/i.test(String(e.category||""))&&/\bbelts?\b/i.test(t)?"":t}function ve(e=[]){return e.map(t=>`
      <a href="${u(ye(t.name))}" class="nav-dropdown-link">${f(t.name)}</a>
    `).join("")}function Je(e,{liked:t=!1,eager:n=!1}={}){var M,O;const i=Ue(((M=e.imageUrls)==null?void 0:M[0])||""),s=((O=e.videoUrls)==null?void 0:O.length)>0?e.videoUrls[0]:null,a=g=>g!=null?"₹"+g.toLocaleString("en-IN"):"",r=e.discountedPrice||e.basePrice,l=e.discountedPrice?e.basePrice:null,d=t,c=u(e.id),p=f(e.name||"");let m="";i?m=`<img src="${u(i)}" alt="${p}" width="400" height="432" loading="${n?"eager":"lazy"}" decoding="async" />`:s?m=`<video 
      poster="${u(K(s))}"
      data-src="${u(Fe(s))}"
      class="pc-video-preview" 
      muted playsinline loop 
      onmouseover="if (!this.src && this.dataset.src) { this.src = this.dataset.src; } this.play();" 
      onmouseout="this.pause()" 
      style="width:100%; height:100%; object-fit:contain; background:transparent;">
    </video>`:m='<div class="pc-no-image">👟</div>';const P="",b=(e.category||"").trim().toLowerCase()==="handbags",w=e.inStockFlag===!1,x=w?`
    <div class="pc-sold-out-overlay">
      <span class="pc-sold-out-label">SOLD OUT</span>
    </div>
  `:"";return`
    <a href="${u(J(e.id,e.name||""))}" class="product-card-link" aria-label="${p}">
      <article class="product-card product-card-new ${b?"is-handbag":""} ${w?"is-sold-out":""}" data-product-id="${c}">
        <div class="pc-image-wrap">
          ${P}
          <button class="pc-heart-btn ${d?"active":""}" onclick="event.preventDefault(); event.stopPropagation(); toggleWishlistItem('${c}'); this.classList.toggle('active'); this.querySelector('svg').setAttribute('fill', this.classList.contains('active') ? '#c82333' : 'none'); this.querySelector('svg').setAttribute('stroke', this.classList.contains('active') ? '#c82333' : 'currentColor')">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="${d?"#c82333":"none"}" stroke="${d?"#c82333":"currentColor"}" stroke-width="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
            </svg>
          </button>
          <button class="pc-whatsapp-btn" aria-label="Contact on WhatsApp" data-product-id="${c}" data-product-name="${p}" onclick="event.preventDefault(); event.stopPropagation(); window.openProductWhatsApp(this.dataset.productName, this.dataset.productId)">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="none">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"></path>
            </svg>
          </button>
          ${m}
          ${x}
        </div>
        <div class="pc-body">
          ${e.category?`<div class="pc-category">${f(e.category)}</div>`:""}
          <h3 class="pc-name">${p}</h3>
          <div class="pc-price-row">
            <span class="pc-price ${l?"pc-price--sale":"pc-price--normal"}">${a(r)}</span>
            ${l?`<span class="pc-original-price">${a(l)}</span>`:""}
          </div>
        </div>
      </article>
    </a>
  `}function Ge(e="home",{categories:t}={}){return`
    <header class="header">
      <!-- Top Bar: Logo, Search, Icons -->
      <div class="header__top" style="background-color: #000000; border-bottom: none;">
        <div class="container header__top-inner">
          <!-- Hamburger + Home (mobile only) -->
          <div class="mobile-left-actions">
            <button class="icon-btn mobile-menu-btn" id="mobile-menu-btn" aria-label="Open menu" aria-expanded="false" style="color: #fff;">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round">
                <line x1="3" y1="6" x2="21" y2="6"/>
                <line x1="3" y1="12" x2="21" y2="12"/>
                <line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
            </button>
            <a href="/" class="icon-btn mobile-home-btn" aria-label="Home" style="color: #fff;">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
            </a>
          </div>
          
          <a href="/" class="header__logo">
            <div class="header__logo-text-wrapper">
              <div class="header__logo-brand">
                <span class="brand-kicks">Kicks</span><span class="brand-aura">Aura</span>
              </div>
              <div class="header__logo-sub">
                <span>PREMIUM</span> <span class="sub-divider">|</span> <span class="sub-highlight">UNISEX</span> <span class="sub-divider">|</span> <span>CURATED</span>
              </div>
            </div>
          </a>
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
            <button class="icon-btn nav-icon" id="wishlist-trigger" aria-label="Wishlist" style="position: relative; background:none; border:none; cursor:pointer; color: #fff;">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
              </svg>
              <span class="cart-badge nav-badge" id="wishlist-badge" style="display: none;">0</span>
            </button>
            <button class="icon-btn" id="cart-trigger" style="position: relative; background:none; border:none; cursor:pointer; color: #fff;">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
              <span class="cart-badge navbar__cart-count" id="cart-badge">0</span>
            </button>
            <div class="profile-dropdown-wrap" id="profile-dropdown-wrap">
              <button class="icon-btn profile-icon-btn" id="profile-icon-btn" aria-label="Account" aria-haspopup="true" style="color: #fff;">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              </button>
              <div class="profile-dropdown" id="profile-dropdown" role="menu">
                <div class="profile-dropdown-header" id="profile-dropdown-header" style="padding: 16px 20px 12px; border-bottom: none;">
                  <h3 class="profile-dropdown-label" style="font-size: 16px; color: #111; font-weight: 700; text-transform: none; letter-spacing: 0; margin: 0;">Account</h3>
                  <p class="profile-dropdown-name" id="profile-dropdown-name" style="display:none;"></p>
                </div>
                <div class="profile-dropdown-auth" id="profile-dropdown-auth" style="display:flex; flex-direction:column; gap:10px; padding:0 20px 16px;">
                  <button class="profile-auth-btn" id="profile-login-btn" style="background:#315bfb; color:#fff; border-radius:10px; padding:12px; font-size:14px; font-weight:600; border:none; cursor:pointer; width: 100%;">Log In with Mobile</button>
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
      
      <!-- Nav Links -->
      <nav class="header__nav">
        <div class="header__nav-inner desktop-nav-centered">
          <a href="/" class="nav-link ${e==="home"?"nav-link--active":""}">HOME</a>
          <div class="nav-item-dropdown">
            <a href="/#shop-category" class="nav-link ${e==="products"?"nav-link--active":""}">
              CATEGORIES
              <svg width="10" height="6" viewBox="0 0 10 6" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M1 1l4 4 4-4"/></svg>
            </a>
            <div class="nav-dropdown-content" id="desktop-nav-categories">
              ${t&&t.length?ve(t):"<!-- Categories injected via JS -->"}
            </div>
          </div>
          <a href="/new-arrivals" class="nav-link">NEW ARRIVALS</a>
          <a href="/shipping-policy" class="nav-link ${e==="shipping"?"nav-link--active":""}">SHIPPING POLICY</a>
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
          <a href="/new-arrivals" class="mobile-nav-link">
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

    <div class="header__promo-bar">
      <div class="promo-slide promo-slide-1">
        <strong>Extra Rs 200 Off</strong> <span class="promo-subtext">on Prepaid Orders</span>
      </div>
      <div class="promo-slide promo-slide-2">
        <strong>COD Available</strong> <span class="promo-subtext">(₹ 99 Advance)</span>
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
  `}function Ye(){return`
    <footer id="footer" class="footer">
      <div class="footer__features">
        <div class="footer__feature">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
          <h5>COD AVAILABLE</h5>
          <p>(Only Rs 99 advance)</p>
        </div>
        <div class="footer__feature">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="1" y="3" width="15" height="13"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle></svg>
          <h5>RS 200 OFF ON PREPAID</h5>
          <p>Shipping</p>
        </div>
        <div class="footer__feature">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 2v6h-6"></path><path d="M3 12a9 9 0 0 1 15-6.7L21 8"></path><path d="M3 22v-6h6"></path><path d="M21 12a9 9 0 0 1-15 6.7L3 16"></path></svg>
          <h5>EASY RETURNS & EXCHANGE</h5>
          <p>Hassle-free within 7 days</p>
        </div>
      </div>
      
      <div class="footer__main">
        <div class="footer__col footer__col--contact">
          <h4>CUSTOMER CARE</h4>
          <p><span>Address:</span> Phase 2, Chandigarh, India</p>
          <p><span>Mobile:</span> +91 6239379751</p>
          <p><span>Email:</span> kicksauraa@gmail.com</p>
          <p><span>Store Time:</span> 11:00 AM - 8:00 PM, Monday - Saturday</p>
        </div>
        
        <div class="footer__col footer__col--links-wrapper">
          <div class="footer__links-col">
            <a href="/">Home</a>
            <a href="/products">All Products</a>
            <a href="/new-arrivals">New Arrivals</a>
            <a href="/blog">Blog</a>
            <a href="/about-us">About Us</a>
            <a href="/contact-us">Contact Us</a>
          </div>
          <div class="footer__links-col">
            <a href="/shipping-policy">Shipping & Delivery Policy</a>
            <a href="/return-exchange">Return & Exchange</a>
            <a href="/refund-policy">Refund Policy</a>
            <a href="/terms-conditions">Terms & Conditions</a>
            <a href="/privacy-policy">Privacy Policy</a>
          </div>
        </div>
        
        <div class="footer__col footer__col--social">
          <a href="https://instagram.com/kicksauraa" target="_blank" rel="noopener" aria-label="Instagram">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
              <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
              <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
            </svg>
          </a>
        </div>
      </div>

      <div class="footer__bottom">
        <p>© 2026 Kicks Aura. All rights reserved.</p>
      </div>
    </footer>
  `}function Pt(e=[]){return e.map((t,n)=>`
      <button class="filter-chip filter-chip--active" data-chip-index="${n}">
        ${f(t)}
        <span class="filter-chip__remove">✕</span>
      </button>`).join("")}function Ct(e){return`
      <a href="${u(ye(e.name))}" class="category-card">
        <div class="category-image-wrap">
          ${e.imageUrl?`<img src="${u(fe(e.imageUrl))}" alt="${u(e.name)}" loading="lazy">`:'<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:#f5f5f5;color:#aaa;font-size:13px;">No image</div>'}
        </div>
        <div class="category-name">${f(e.name)}</div>
      </a>`}const Z=e=>e!=null?"₹"+e.toLocaleString("en-IN"):"";function Qe(e){var l,d;const t=(((l=e.imageUrls)==null?void 0:l.length)>0?e.imageUrls:[]).map(me),n=((d=e.videoUrls)==null?void 0:d.length)>0?e.videoUrls:[],i=[...t.map(c=>({type:"image",url:c})),...n.map(c=>({type:"video",url:c}))],o=e.discountedPrice||e.basePrice,s=e.discountedPrice?e.basePrice:null,a=s?Math.round((1-o/s)*100):0,r=!!(e.variants&&e.variants.length>0);return{images:t,videos:n,mediaItems:i,currentPrice:o,originalPrice:s,discountPct:a,hasVariants:r}}function Bt(e,t=Qe(e),{liked:n=!1,whatsappNumber:i,origin:o="https://kicksaura.in"}={}){const s=Ke(e),{images:a,mediaItems:r,currentPrice:l,originalPrice:d,discountPct:c,hasVariants:p}=t,m=f(e.name||""),P=r.map((g,h)=>{if(g.type==="video"){const C=K(g.url)||a[0]||"";return`
        <div class="thumb-item thumb-video ${h===0?"active":""}" data-idx="${h}" title="Watch video">
          <div class="thumb-video-placeholder">
            <img src="${u(C)}" loading="lazy" alt="${m} video" />
            <div class="thumb-video-overlay">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="white" stroke="none"><polygon points="5,3 19,12 5,21"/></svg>
            </div>
          </div>
        </div>`}else return`
        <div class="thumb-item ${h===0?"active":""}" data-idx="${h}">
          <img src="${u(g.url)}" alt="${m} ${h+1}" loading="${h===0?"eager":"lazy"}" decoding="async" />
        </div>`}).join("");function b(g){const h=`
      <button class="wishlist-btn-detail ${g?"active":""}" id="wishlist-detail-btn" aria-label="Add to wishlist">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="${g?"#c82333":"none"}" stroke="${g?"#c82333":"currentColor"}" stroke-width="2">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
        </svg>
      </button>`,C=`
      <button class="expand-btn" id="expand-btn" aria-label="View larger">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>
        </svg>
      </button>`;return!r||r.length===0?'<div style="display:flex;align-items:center;justify-content:center;height:100%;font-size:48px;background:transparent;">👟</div>'+h:`
      <div class="main-media-track" id="main-media-track">
        ${r.map((E,S)=>`
      <div class="main-media-slide" data-idx="${S}" style="position: relative; display: flex; align-items: center; justify-content: center;">
        ${E.type==="video"?`<video
               class="ka-lazy-video"
               id="main-video-${S}"
               poster="${u(K(E.url)||"")}"
               data-hls-src="${u(Ve(E.url)||"")}"
               data-mp4-src="${u(We(E.url)||"")}"
               controls
               controlsList="nodownload noplaybackrate"
               disablePictureInPicture
               preload="metadata"
               playsinline
               onclick="window.initVideoPlayback(this, false)"
               style="cursor:pointer; width:100%; height:100%; object-fit:contain; background:transparent;"
             ></video>
             <button class="center-play-btn" onclick="window.centerPlayBtnClick(this)" aria-label="Play video">
               <svg width="32" height="32" viewBox="0 0 24 24" fill="white"><polygon points="6,4 20,12 6,20"/></svg>
             </button>`:`<img
               ${S===0?`src="${u(E.url)}"`:`data-src="${u(E.url)}"`}
               alt="${m}"
               id="main-image-${S}"
               loading="${S===0?"eager":"lazy"}"
               ${S===0?'fetchpriority="high"':""}
               decoding="async"
               style="width:100%; max-width:100%; height:100%; max-height:100%; object-fit:contain; background:transparent; display:block;"
             />`}
      </div>
    `).join("")}
      </div>
      ${h}
      ${C}
    `}const w=p?[...e.variants].sort((g,h)=>{const C=parseFloat(String(g.size||"").replace(/[^0-9.]/g,""))||0,X=parseFloat(String(h.size||"").replace(/[^0-9.]/g,""))||0;return C-X}):[],x=p?w.map(g=>`
        <button class="size-btn ${g.stockQuantity<=0?"size-btn--oos":""}"
          data-variant-id="${u(g.id)}"
          data-stock="${u(g.stockQuantity)}"
          ${g.stockQuantity<=0?'disabled title="Out of stock"':""}> 
          ${f(g.size)}
        </button>`).join(""):"",M=p?`
      <div style="margin-bottom: 26px;">
        <button id="size-chart-btn" style="background: none; border: none; padding: 0; color: #000; text-decoration: underline; cursor: pointer; font-size: 14.5px; font-weight: 400; font-family: inherit;">Size Chart</button>
      </div>

      <div class="size-section">
        <p class="size-label">Select Size</p>
        <div class="size-options" id="size-options">
          ${x}
        </div>
      </div>`:"",O=`https://wa.me/${i||Re}?text=${encodeURIComponent("I am interested in "+e.name+" - "+o+J(e.id,e.name||""))}`;return`
    <!-- Left: Gallery -->
    <div class="product-gallery">
      <div class="gallery-inner">
        <!-- Vertical thumbnails strip -->
        ${r.length>1?`
        <div class="thumb-strip" id="thumb-strip">
          ${P}
        </div>`:""}
        <!-- Main image -->
        <div class="main-image-container" id="main-media-wrap">
          ${b(n)}
        </div>
      </div>
    </div>

    <!-- Right: Details -->
    <div class="product-details">
      <h1 class="product-title pd-title-modern">${m}</h1>
      
      <div class="pd-pricing-section">
        <div class="pd-curr-price">${Z(l)}</div>
        ${d&&c>0?`<div class="pd-orig-price">${Z(d)}</div>`:""}
      </div>
      
      <p class="pd-shipping-link"><a href="/shipping-policy" class="pd-open-shipping-modal" style="color: #2563eb; text-decoration: underline; cursor: pointer;">Shipping</a> calculated at checkout.</p>
      
      <a href="${u(O)}" target="_blank" rel="noopener noreferrer" class="pd-whatsapp-inquiry-btn">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" stroke="none">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
        </svg>
        WhatsApp Inquiry
      </a>

      ${e.withOgBox?`
      <div class="pd-og-box-row" style="margin-bottom: 16px; display: flex; align-items: center; gap: 10px;">
        <div style="font-size: 22px; display: flex; align-items: center; justify-content: center;">
          📦
        </div>
        <span style="font-size: 15px; font-weight: 600; color: #111;">With OG Box</span>
      </div>
      `:""}

      ${e.inStockFlag===!1?"":`
      ${M}

      <div class="quantity-section">
        <p class="quantity-label">Quantity</p>
        <div class="quantity-stepper" id="quantity-stepper">
          <button class="qty-btn qty-btn--minus" id="qty-minus" aria-label="Decrease quantity">−</button>
          <span class="qty-value" id="qty-value">1</span>
          <button class="qty-btn qty-btn--plus" id="qty-plus" aria-label="Increase quantity">+</button>
        </div>
      </div>

      <div id="live-video-option-box" style="margin: 20px 0 22px; padding: 14px 16px; background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 12px; display: flex; align-items: flex-start; gap: 12px; cursor: pointer; transition: all 0.2s ease; box-shadow: 0 1px 3px rgba(0,0,0,0.03);">
        <input type="checkbox" id="live-video-check" checked style="margin-top: 2px; width: 18px; height: 18px; accent-color: #2563eb; cursor: pointer; flex-shrink: 0;" />
        <div style="display: flex; flex-direction: column; gap: 4px; flex: 1;">
          <label for="live-video-check" style="font-size: 14.5px; font-weight: 700; color: #1e293b; cursor: pointer; margin: 0; display: flex; align-items: center; justify-content: space-between; gap: 6px;">
            <span style="display: flex; align-items: center; gap: 6px;">
              <span>📹 Live video call before dispatch</span>
            </span>
          </label>
          <span style="font-size: 12.5px; color: #64748b; line-height: 1.4; cursor: pointer;">Get a 1-on-1 live video call with our team to verify quality right before dispatch.</span>
        </div>
      </div>
      `}

      ${e.inStockFlag===!1?`
      <div class="action-row" style="display:flex;width:100%;">
        <button class="btn-out-of-stock" disabled style="flex:1;background:#e2e8f0;color:#64748b;font-weight:700;font-size:15px;letter-spacing:1px;border:none;border-radius:30px;padding:16px;cursor:not-allowed;">OUT OF STOCK</button>
      </div>
      `:`
      <div class="action-row">
        <button class="btn-add-to-cart" id="add-to-cart-btn">ADD TO CART</button>
        <button class="btn-buy-now" id="buy-now-btn">BUY NOW</button>
      </div>
      `}
      <div style="text-align: left; margin-top: -12px; margin-bottom: 32px; padding-left: 2px;">
        <span style="font-size: 14px; font-weight: 600; color: #475569; display: flex; align-items: center; gap: 6px;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
          Guaranteed Safe Checkout
        </span>
      </div>

      <section class="pd-info" aria-label="Product information">
        ${s?`<p class="pd-info__description">${f(s)}</p>`:""}
        <ul class="pd-info__list">
          ${e.category?`<li><strong>Category:</strong> ${f(e.category)}</li>`:""}
          <li><strong>Delivery:</strong> 4–5 working days across India. See our <a href="/shipping-policy">shipping policy</a>.</li>
          <li><strong>Payment:</strong> Prepaid or cash on delivery (₹99 advance per product).</li>
          <li><strong>Returns:</strong> See our <a href="/return-exchange">return and exchange policy</a>.</li>
        </ul>
      </section>

    </div>
  `}function ee(e,t="info"){let n=document.querySelector(".toast-container");n||(n=document.createElement("div"),n.className="toast-container",document.body.appendChild(n));const i=n.querySelectorAll(".toast");for(let s of i)if(s.textContent===e)return;const o=document.createElement("div");o.className=`toast toast--${t}`,o.textContent=e,n.appendChild(o),setTimeout(()=>{o.remove()},3e3)}function _t(){const e=document.getElementById("nav-search-input"),t=document.getElementById("nav-search-btn"),n=()=>{e&&e.value.trim()&&(window.location.href=`/products?search=${encodeURIComponent(e.value.trim())}`)};e&&e.addEventListener("keydown",a=>{a.key==="Enter"&&n()}),t&&t.addEventListener("click",n);const i=document.getElementById("nav-animated-placeholder"),o=document.getElementById("placeholder-text-1"),s=document.getElementById("placeholder-text-2");if(e&&i&&o&&s){const a=["Search for Sneakers...","Search for Apparel...","Search for Perfumes...","Search for Watches...","Search for Nike Pandas...","Search for Adidas Sambas...","Search for New Balance 9060...","Search for Air Force 1...","Search for Onitsuka Tiger...","Search for Air Jordan 1...","Search for Sunglasses...","Search for Nike Dunks...","Search for Adidas Campus...","Search for Belts...","Search for New Balance 530...","Search for Air Jordan 4...","Search for Adidas Spezial...","Search for Nike Vomero...","Search for Wallets...","Search for ASICS Gel-NYC...","Search for Nike P-6000...","Search for New Balance 550...","Search for Travis Scott...","Search for Accessories...","Search for Yeezy 350..."];let r=0,l=0,d=!1,c=null;const p=()=>{const w=a[r];d?(o.textContent=w.substring(0,l-1),l--):(o.textContent=w.substring(0,l+1),l++);let x=d?30:60;!d&&l===w.length?(x=2e3,d=!0):d&&l===0&&(d=!1,r=(r+1)%a.length,x=500),c=setTimeout(p,x)},m=()=>{c||(s&&(s.style.display="none"),o.className="animated-placeholder-text visible",c=setTimeout(p,500))},P=()=>{c&&(clearTimeout(c),c=null)},b=()=>{document.activeElement===e||e.value.trim()!==""?(i.style.display="none",P()):(i.style.display="flex",m())};e.addEventListener("focus",b),e.addEventListener("blur",b),e.addEventListener("input",b),b()}}function Xe(e,t){const n="916239379751",i=`I am interested in ${e} - ${window.location.origin}${J(t,e||"")}`,o=`https://wa.me/${n}?text=${encodeURIComponent(i)}`;window.open(o,"_blank","noopener,noreferrer")}typeof window<"u"&&(window.openProductWhatsApp=Xe);function Tt(e){return Je(e,{liked:se(e.id)})}function At(e="home"){return setTimeout(()=>be(),0),Ge(e)}function Ze(){return Ye()}function et(){const e=document.getElementById("footer-container");e&&(e.innerHTML=Ze())}function Mt(){const e=document.getElementById("mobile-menu-btn"),t=document.getElementById("mobile-nav-drawer"),n=document.getElementById("mobile-nav-overlay"),i=document.getElementById("mobile-nav-close");if(!e||!t||!n)return;const o=()=>{t.classList.add("is-open"),n.classList.add("is-open"),e.setAttribute("aria-expanded","true"),document.body.style.overflow="hidden"},s=()=>{t.classList.remove("is-open"),n.classList.remove("is-open"),e.setAttribute("aria-expanded","false"),document.body.style.overflow=""};e.addEventListener("click",o),i&&i.addEventListener("click",s),n.addEventListener("click",s),t.querySelectorAll(".mobile-nav-link").forEach(a=>{a.addEventListener("click",s)})}async function be(){const e=document.getElementById("desktop-nav-categories");if(e)try{const t=await _e();if(!t||t.length===0)return;e.innerHTML=ve(t)}catch(t){console.error("Failed to load categories for dropdown:",t)}}function te(){et(),be()}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",te):te();const U="kicksaura_cart";function tt(e,t){if(e==null&&t==null)return!0;if(e==null||t==null){const n=String(e??"").trim(),i=String(t??"").trim();return(n===""||n==="null"||n==="undefined")&&(i===""||i==="null"||i==="undefined")}return String(e).trim()===String(t).trim()}function F(e,t,n){return!(!tt(e.productId,t)||String(e.size).trim()!==String(n).trim())}function nt(e){if(!Array.isArray(e)||e.length<=1)return e||[];const t=[];for(const n of e){const i=t.find(o=>F(o,n.productId,n.size));i?(i.quantity=(Number(i.quantity)||1)+(Number(n.quantity)||1),i.liveVideoCall=!!i.liveVideoCall||!!n.liveVideoCall,i.variantId=n.variantId||i.variantId):t.push({...n,quantity:Number(n.quantity)||1})}return t}function L(){const e=localStorage.getItem(U),t=e?JSON.parse(e):[],n=nt(t);return t.length!==n.length&&e&&localStorage.setItem(U,JSON.stringify(n)),n}function G(e){localStorage.setItem(U,JSON.stringify(e)),we(),window.dispatchEvent(new CustomEvent("cart-updated",{detail:e}))}function Ot(e,t,n=1,i={}){var l;const o=L(),s=(t==null?void 0:t.size)||"",a=!!i.liveVideoCall,r=o.findIndex(d=>F(d,e.id,s));if(r>-1){const d=(Number(o[r].quantity)||1)+(Number(n)||1);d>10?(alert("You can't add more than 10 items of the same product."),o[r].quantity=10):o[r].quantity=d,o[r].liveVideoCall=!!o[r].liveVideoCall||a,o[r].variantId=t&&t.id?t.id:o[r].variantId}else{const d=Number(n)||1;d>10&&alert("You can't add more than 10 items of the same product."),o.push({productId:e.id,variantId:t&&t.id||null,productName:e.name,productBrand:e.brand,productImage:((l=e.imageUrls)==null?void 0:l[0])||"",size:s,price:e.discountedPrice||e.basePrice,basePrice:e.basePrice,quantity:Math.min(10,d),liveVideoCall:!!i.liveVideoCall})}return G(o),o}function Nt(e,t){let n=L();return n=n.filter(i=>!F(i,e,t)),G(n),n}function zt(e,t,n){const i=L(),o=i.find(s=>F(s,e,t));if(o){const s=Number(n)||1;s>10?(alert("You can't add more than 10 items of the same product."),o.quantity=10):o.quantity=Math.max(1,s)}return G(i),i}function qt(){return L()}function Ht(){return L().reduce((e,t)=>e+t.price*t.quantity,0)}function it(){return L().reduce((e,t)=>e+t.quantity,0)}function jt(){localStorage.removeItem(U),we(),window.dispatchEvent(new CustomEvent("cart-updated",{detail:[]}))}function we(){const e=document.querySelectorAll(".navbar__cart-count"),t=it();e.forEach(n=>{n.textContent=t,n.style.display=t>0?"flex":"none"})}const ot="https://verify.msg91.com/otp-provider.js",Y=4,xe=30;let ne=!1,N=!1,z=null,ke="",V=null,q=null;async function st(){if(z)return z;try{const e=await fetch("/api/v1/users/auth/widget-config");if(!e.ok){const t=await e.text().catch(()=>"no body");throw new Error(`HTTP ${e.status}: ${t}`)}return z=await e.json(),z}catch(e){throw console.error("[KicksAura] Could not load MSG91 widget config:",e.message),new Error("API Error: "+e.message)}}function at(){return new Promise((e,t)=>{if(window.initSendOTP){e();return}if(N){const o=setInterval(()=>{window.initSendOTP&&(clearInterval(o),e())},100);setTimeout(()=>{clearInterval(o),t(new Error("SDK load timeout"))},1e4);return}N=!0;const n=document.getElementById("msg91-otp-sdk");n&&n.remove();const i=document.createElement("script");i.id="msg91-otp-sdk",i.src=ot,i.onload=()=>{const o=setInterval(()=>{window.initSendOTP&&(clearInterval(o),N=!1,e())},50);setTimeout(()=>{clearInterval(o),t(new Error("initSendOTP unavailable"))},8e3)},i.onerror=()=>{N=!1,t(new Error("Failed to load MSG91 SDK"))},document.head.appendChild(i)})}function rt(e){ne||(window.initSendOTP({widgetId:e.widgetId,tokenAuth:e.widgetToken,exposeMethods:!0,success:t=>{},failure:t=>console.error("MSG91 Init Failure:",t)}),ne=!0)}function lt(e=null){let t=document.getElementById("login-modal-overlay");t||(t=document.createElement("div"),t.id="login-modal-overlay",t.className="login-modal-overlay",t.setAttribute("role","dialog"),t.setAttribute("aria-modal","true"),t.setAttribute("aria-label","Log in to KicksAura"),document.body.appendChild(t)),t.classList.add("checkout-mode");const n=`
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
          ${Array.from({length:Y},(a,r)=>`
            <input
              type="text"
              inputmode="numeric"
              maxlength="1"
              class="login-otp-box"
              id="otp-box-${r}"
              aria-label="OTP digit ${r+1}"
              autocomplete="${r===0?"one-time-code":"off"}"
            />`).join("")}
        </div>
        <div class="login-error-msg" id="login-otp-error"></div>
        <button class="login-btn-primary" id="login-verify-btn" style="margin-top: 16px;">
          <span id="login-verify-text">Verify OTP</span>
        </button>
        <div class="login-resend-row">
          <button class="login-resend-btn" id="login-resend-btn" disabled>Resend OTP</button>
          <span class="login-resend-countdown" id="login-resend-countdown"> in <span id="login-countdown-num">${xe}</span>s</span>
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
  `,!document.getElementById("policy-modal-overlay")){const a=document.createElement("div");a.id="policy-modal-overlay",a.className="login-modal-overlay",a.style.zIndex="99999",a.innerHTML=`
      <div class="login-modal" style="max-width: 550px; padding: 0; text-align: left; display: flex; flex-direction: column; max-height: 85vh; border-radius: 20px; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.4);">
        <div style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 28px 32px; position: relative; flex-shrink: 0;">
          <h2 id="policy-modal-title" style="margin: 0; font-size: 26px; color: #ffffff; font-weight: 700; letter-spacing: -0.5px;"></h2>
          <button id="policy-modal-close" style="position: absolute; top: 24px; right: 24px; background: rgba(255,255,255,0.1); border: none; font-size: 16px; cursor: pointer; color: white; width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; transition: all 0.2s ease; outline: none;" onmouseover="this.style.background='rgba(255,255,255,0.2)'" onmouseout="this.style.background='rgba(255,255,255,0.1)'">✕</button>
        </div>
        <div id="policy-modal-content" style="padding: 32px; font-size: 15px; line-height: 1.7; color: #334155; overflow-y: auto; background: #ffffff;"></div>
      </div>
    `,document.body.appendChild(a),document.getElementById("policy-modal-close").addEventListener("click",()=>{document.getElementById("policy-modal-overlay").classList.remove("open")}),a.addEventListener("click",r=>{r.target===a&&a.classList.remove("open")})}dt();const o=document.getElementById("login-about-link");o&&(o.onclick=a=>{a.preventDefault(),document.getElementById("policy-modal-title").textContent="About Us",document.getElementById("policy-modal-content").innerHTML=Pe,document.getElementById("policy-modal-overlay").classList.add("open")});const s=document.getElementById("login-shipping-link");s&&(s.onclick=a=>{a.preventDefault(),document.getElementById("policy-modal-title").textContent="Shipping & Delivery Policy",document.getElementById("policy-modal-content").innerHTML=Ce,document.getElementById("policy-modal-overlay").classList.add("open")})}function dt(){document.getElementById("login-modal-close").addEventListener("click",j),document.getElementById("login-modal-overlay").addEventListener("click",n=>{n.target===document.getElementById("login-modal-overlay")&&j()}),document.addEventListener("keydown",n=>{n.key==="Escape"&&j()}),document.getElementById("login-send-otp-btn").addEventListener("click",ie);const e=document.getElementById("login-phone-input");function t(){const n=document.getElementById("login-phone-display");if(!n)return;const i=e.value.replace(/\D/g,"").slice(0,10);let o="";for(let s=0;s<10;s++){const a=i[s]||"",r=s===i.length,l=s===4?"margin-right: 12px;":"",c=r&&document.activeElement===e?"border-bottom: 2px solid #0f172a;":"border-bottom: 2px solid #cbd5e1;";o+=`<span style="width: 14px; height: 28px; display: inline-flex; justify-content: center; align-items: center; font-size: 18px; font-weight: 600; color: ${a?"#0f172a":"transparent"}; ${c} ${l} transition: all 0.2s;">${a||"0"}</span>`}n.innerHTML=o}e.addEventListener("keydown",n=>{n.key==="Enter"&&ie()}),e.addEventListener("input",n=>{let i=n.target.value.replace(/\D/g,"");i.length>10&&(i=i.slice(0,10)),n.target.value=i,t(),Ie()}),e.addEventListener("focus",t),e.addEventListener("blur",t),t(),ct(),document.getElementById("login-verify-btn").addEventListener("click",H),document.getElementById("login-resend-btn").addEventListener("click",gt),document.getElementById("login-change-phone-btn").addEventListener("click",()=>{Ee()})}function ct(){const e=A();e.forEach((t,n)=>{t.addEventListener("input",i=>{const o=i.target.value.replace(/\D/g,"");i.target.value=o.slice(-1),o?(t.classList.add("filled"),t.classList.remove("error"),n<e.length-1?e[n+1].focus():Array.from(e).every(a=>a.value)&&H()):t.classList.remove("filled"),$()}),t.addEventListener("keydown",i=>{i.key==="Backspace"?!t.value&&n>0&&(e[n-1].value="",e[n-1].classList.remove("filled"),e[n-1].focus()):i.key==="Enter"&&H()}),t.addEventListener("paste",i=>{i.preventDefault();const o=(i.clipboardData||window.clipboardData).getData("text").replace(/\D/g,"");if(!o)return;e.forEach((a,r)=>{a.value=o[r]||"",o[r]?a.classList.add("filled"):a.classList.remove("filled")});const s=e.findIndex(a=>!a.value);s===-1?(e[e.length-1].focus(),H()):e[s].focus(),$()})})}function A(){return Array.from({length:Y},(e,t)=>document.getElementById(`otp-box-${t}`))}function pt(){return A().map(e=>e.value).join("")}function Q(){A().forEach(e=>{e.value="",e.classList.remove("filled","error")})}function Ee(){T(),document.getElementById("login-step-phone").style.display="",document.getElementById("login-step-otp").style.display="none";const e=document.getElementById("login-modal-title"),t=document.getElementById("login-modal-subtitle");e&&(e.textContent="Log In"),t&&(t.textContent="Enter your mobile number to continue");const n=document.getElementById("login-phone-input");n&&(n.value=""),Q(),$(),B(!1),setTimeout(()=>{var i;return(i=document.getElementById("login-phone-input"))==null?void 0:i.focus()},50)}function ut(){document.getElementById("login-step-phone").style.display="none",document.getElementById("login-step-otp").style.display="";const e=document.getElementById("login-modal-title"),t=document.getElementById("login-modal-subtitle");e&&(e.textContent="Enter OTP"),t&&(t.textContent="Check your SMS"),document.getElementById("login-otp-phone-display").textContent=`+91 ${ke}`,Q(),$(),I(!1),Se(),setTimeout(()=>{var n;return(n=document.getElementById("otp-box-0"))==null?void 0:n.focus()},50)}async function ie(){const e=document.getElementById("login-phone-input").value.trim().replace(/\D/g,"");if(!e||e.length!==10||!/^[6-9]/.test(e)){R("Please enter a valid 10-digit Indian mobile number.");return}B(!0),Ie();try{const t=await st();await at(),rt(t);let n=50;for(;typeof window.sendOtp!="function"&&n>0;)await new Promise(o=>setTimeout(o,100)),n--;if(typeof window.sendOtp!="function")throw new Error("MSG91 SDK not ready. Please refresh and try again.");const i="91"+e;ke=e,window.sendOtp(i,o=>{V=(o==null?void 0:o.reqId)||(o==null?void 0:o.message)||null,ut(),B(!1)},o=>{const s=typeof o=="string"?o:(o==null?void 0:o.message)||"Could not send OTP. Please try again.";R(s),B(!1)})}catch(t){R(t.message||"Could not send OTP. Please try again."),B(!1)}}async function H(){const e=pt();if(e.length!==Y){k("Please enter all 6 digits.");return}if(!V){k("Session expired. Please resend the OTP.");return}I(!0),$(),window.verifyOtp(e,async t=>{try{const n=(t==null?void 0:t.access_token)||(t==null?void 0:t.token)||(t==null?void 0:t.message);if(!n||n.toLowerCase()==="success"){k("Verification error. Please try again."),I(!1);return}const i=await ue(n);I(!1),T(),j(),window.dispatchEvent(new CustomEvent("auth-changed",{detail:{loggedIn:!0,user:i}})),_&&(window.location.href=_);const o=document.getElementById("profile-dropdown-name");if(o){const s=[i.firstName,i.lastName].filter(Boolean).join(" ").trim()||`+91 ${i.phoneNumber}`;o.textContent=s}}catch(n){k(n.message||"Login failed. Please try again."),I(!1)}},t=>{const i=(typeof t=="string"?t:(t==null?void 0:t.message)||"Incorrect OTP. Please try again.").toLowerCase().includes("expired")?"OTP has expired. Please resend.":"Incorrect OTP. Please try again.";k(i);const o=A();o.forEach(s=>{s.classList.add("error"),s.value=""}),o[0]&&o[0].focus(),I(!1)},V)}function gt(){const e=document.getElementById("login-resend-btn");if(!e.disabled){e.disabled=!0,$(),Q();try{const t=window.retryOTP||window.retryOtp;if(typeof t!="function")throw new Error("OTP service is currently unavailable.");t("11",n=>{n!=null&&n.reqId&&(V=n.reqId),Se()},n=>{const i=typeof n=="string"?n:(n==null?void 0:n.message)||"Could not resend OTP. Please try again.";k(i),e.disabled=!1})}catch(t){k(t.message||"An error occurred while resending OTP."),e.disabled=!1}}}function Se(){T();let e=xe;const t=document.getElementById("login-countdown-num"),n=document.getElementById("login-resend-countdown"),i=document.getElementById("login-resend-btn");!t||!i||(i.disabled=!0,n&&(n.style.display=""),t.textContent=e,q=setInterval(()=>{e--,t.textContent=e,e<=0&&(T(),i.disabled=!1,n&&(n.style.display="none"))},1e3))}function T(){q&&(clearInterval(q),q=null)}function R(e){var n;const t=document.getElementById("login-phone-error");t&&(t.textContent=e),(n=document.getElementById("login-phone-wrap"))==null||n.classList.add("error")}function Ie(){var t;const e=document.getElementById("login-phone-error");e&&(e.textContent=""),(t=document.getElementById("login-phone-wrap"))==null||t.classList.remove("error")}function k(e){const t=document.getElementById("login-otp-error");t&&(t.textContent=e)}function $(){const e=document.getElementById("login-otp-error");e&&(e.textContent=""),A().forEach(t=>t.classList.remove("error"))}function B(e){const t=document.getElementById("login-send-otp-btn");t&&(t.disabled=e,t.innerHTML=e?'<span class="login-spinner"></span><span>Sending…</span>':'<span id="login-send-otp-text">Continue</span>')}function I(e){const t=document.getElementById("login-verify-btn");t&&(t.disabled=e,t.innerHTML=e?'<span class="login-spinner"></span><span>Verifying…</span>':'<span id="login-verify-text">Verify OTP</span>')}let _=null;function Dt(e=null){let t=null;typeof e=="string"?_=e:e&&typeof e=="object"?(_=e.redirectUrl||null,t=e.context||null):_=null,lt(t);const n=document.getElementById("login-modal-overlay");if(n){if(t==="checkout"){const i=document.getElementById("login-modal-cart-list");if(i)try{const o=localStorage.getItem("kicksaura_cart"),s=o?JSON.parse(o):[];if(s.length===0)i.innerHTML='<p style="color:#888; font-size:14px;">Your cart is empty.</p>';else{i.innerHTML=s.map(l=>{const d=l.productImage&&l.productImage.startsWith("http")?l.productImage:l.productImage?`https://res.cloudinary.com/undefined/image/upload/w_200,h_200,c_fill,q_auto,f_auto/${l.productImage}`:"",c=(l.price*l.quantity).toLocaleString("en-IN");return`
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
            `}).join("");let a=0,r=0;s.forEach(l=>{a+=l.quantity,r+=l.price*l.quantity}),i.innerHTML+=`
            <div id="login-modal-cart-summary" style="display: none; padding-top: 24px; color: #111; cursor: default;">
              <div style="display: flex; justify-content: space-between; font-size: 15px; margin-bottom: 24px; color: #111;">
                <span>Subtotal</span>
                <span>₹${r.toLocaleString("en-IN")}</span>
              </div>
              <div style="border-top: 1.5px solid #111; margin-bottom: 24px;"></div>
              <div style="display: flex; justify-content: space-between; font-size: 18px; font-weight: 800; color: #111; margin-bottom: 8px;">
                <span>Grand Total</span>
                <span>₹${r.toLocaleString("en-IN")}</span>
              </div>
            </div>
          `,i.onclick=l=>{const d=document.getElementById("login-modal-cart-summary");d&&(d.style.display=d.style.display==="none"?"block":"none")}}}catch(o){console.error("Failed to load cart for login modal",o)}}Ee(),n.classList.add("open"),document.body.style.overflow="hidden"}}function j(){T();const e=document.getElementById("login-modal-overlay");e&&(e.classList.remove("open"),document.body.style.overflow="",e.classList.contains("checkout-mode")&&(pe()||(window.location.href="/")))}export{Ot as A,bt as B,Qe as C,se as D,Bt as E,wt as F,Me as G,Oe as H,Ne as I,ae as J,he as K,$t as L,Pt as M,ye as N,ht as O,Te as P,Lt as Q,xt as R,ge as S,St as T,Dt as U,Et as V,it as W,Ht as X,mt as Y,Pe as a,qt as b,kt as c,It as d,de as e,jt as f,le as g,fe as h,pe as i,we as j,At as k,ue as l,Ze as m,Mt as n,ft as o,Le as p,_t as q,Nt as r,Ce as s,_e as t,zt as u,Ct as v,yt as w,Tt as x,vt as y,ee as z};
