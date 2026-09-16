import{k as re,m as ce,n as de,j as Y,o as pe,p as Z,q as ue,A as he,B as me,C as N,z as O,y as G,D as ye,x as ge,E as fe,F as ve,G as be,H as we,I as ke,J as xe,K as Ee}from"./login-modal.js_v_1-vylF9FGw.js";/* empty css                     */import{i as Se,a as Ue,o as Le}from"./cart-sidebar-CO8nBrVq.js";import{i as Ke}from"./profile-DqUfOBpi.js";Ie();document.getElementById("navbar-container").innerHTML=re("product");document.getElementById("footer-container").innerHTML=ce();de();Y();pe();Se();Z();Ke();ue();Ue();const W=e=>e!=null?"₹"+e.toLocaleString("en-IN"):"";async function Ie(){const s=new URLSearchParams(window.location.search).get("id");if(!s){Q("No product ID specified in the URL.");return}try{const u=await he(s);$e(u)}catch(u){console.error("Failed to load product:",u),Q("Could not load product. Please try again.")}}function Q(e){document.getElementById("product-container").innerHTML=`
    <div style="padding: 80px 20px; text-align: center; grid-column: 1/-1;">
      <p style="font-size: 18px; font-weight: 600; color: #222;">⚠️ ${e}</p>
      <a href="/" style="display:inline-block; margin-top: 16px; color: #c82333; font-weight: 600;">← Back to Home</a>
    </div>`}window.initVideoPlayback=function(e,s=!1){if(!e)return;const u=window.matchMedia("(pointer: coarse)").matches;if(e.dataset.initState||(e.dataset.initState="none"),s){if(console.log("[HLS] Warmup requested",{video:e.id}),e.dataset.initState!=="none")return}else{if(console.log("[HLS] User requested playback",{video:e.id}),u&&(e.dataset.initState==="ready"||e.dataset.initState==="playing"))return;if(e.dataset.initState==="ready"||e.dataset.initState==="playing"){if(console.log("[HLS] Already initialized. Toggling play/pause."),e.paused){const i=e.play();i!==void 0&&i.catch(d=>console.warn("[HLS] Resume error:",d))}else e.pause();return}}e.dataset.initState=s?"warmup":"ready",console.log(`[HLS] Initializing (State: ${e.dataset.initState})`);const o=e.dataset.hlsSrc,k=e.dataset.mp4Src;if(e.hlsInstance&&(e.hlsInstance.destroy(),e.hlsInstance=null),e.parentElement&&!e.dataset.listenersAttached){e.dataset.listenersAttached="true";const i=e.parentElement.querySelector(".center-play-btn");!s&&i&&(i.style.display="none");const d='<svg width="34" height="34" viewBox="0 0 24 24" fill="white"><polygon points="6,3 21,12 6,21"/></svg>',g='<svg width="30" height="30" viewBox="0 0 24 24" fill="white"><rect x="5" y="3" width="4" height="18" rx="1"/><rect x="15" y="3" width="4" height="18" rx="1"/></svg>',m=(S=0)=>{clearTimeout(i==null?void 0:i._fadeTimer),i&&(i._fadeTimer=setTimeout(()=>{i.style.opacity="0",i.style.pointerEvents="none"},S))};e.parentElement.addEventListener("mouseleave",()=>{i&&!e.paused&&e.dataset.initState!=="warmup"&&m(0)}),e.addEventListener("playing",()=>{e.dataset.initState="playing",i&&(i.innerHTML=g,i.setAttribute("aria-label","Pause video"),i.style.display="flex",i.style.opacity="1",i.style.pointerEvents="auto",m(600))}),e.addEventListener("mousemove",()=>{i&&!e.paused&&e.dataset.initState!=="warmup"&&(clearTimeout(i._fadeTimer),i.style.opacity="1",i.style.pointerEvents="auto",m(800))}),e.addEventListener("waiting",()=>{e.dataset.initState!=="warmup"&&i&&(i.style.opacity="0",i.style.pointerEvents="none")}),e.addEventListener("pause",()=>{clearTimeout(i==null?void 0:i._fadeTimer),i&&e.dataset.initState!=="warmup"&&(i.innerHTML=d,i.setAttribute("aria-label","Play video"),i.style.opacity="1",i.style.pointerEvents="auto",i.style.display="flex")}),e.addEventListener("ended",()=>{clearTimeout(i==null?void 0:i._fadeTimer),i&&e.dataset.initState!=="warmup"&&(i.innerHTML=d,i.setAttribute("aria-label","Play video"),i.style.opacity="1",i.style.pointerEvents="auto",i.style.display="flex")}),e.addEventListener("error",()=>{i&&e.dataset.initState!=="warmup"&&(i.innerHTML=d,i.style.opacity="1",i.style.pointerEvents="auto",i.style.display="flex")})}if(!o||o==="null"||o==="undefined"){if(console.log("[HLS] No HLS source — falling back directly to mp4"),e.src=k,!s){e.load();const i=e.play();i!==void 0&&i.catch(()=>{})}return}if(window.Hls&&Hls.isSupported()){const i=new Hls({startLevel:-1,capLevelToPlayerSize:!0,maxBufferLength:5,maxMaxBufferLength:10,startFragPrefetch:!0});if(e.hlsInstance=i,i.on(Hls.Events.MEDIA_ATTACHED,function(){console.log("[HLS] MEDIA_ATTACHED"),i.loadSource(o)}),i.on(Hls.Events.MANIFEST_PARSED,function(){if(console.log("[HLS] MANIFEST_PARSED - Ready"),(e.dataset.initState==="ready"||e.dataset.initState==="playing")&&e.paused){const d=e.play();d!==void 0&&d.catch(()=>{})}}),i.on(Hls.Events.ERROR,function(d,g){if(g.fatal){if(g.type===Hls.ErrorTypes.NETWORK_ERROR)i.startLoad();else if(g.type===Hls.ErrorTypes.MEDIA_ERROR)i.recoverMediaError();else if(i.destroy(),e.hlsInstance=null,e.src=k,e.load(),e.dataset.initState==="ready"||e.dataset.initState==="playing"){const m=e.play();m!==void 0&&m.catch(()=>{})}}}),i.attachMedia(e),!s){const d=e.play();d!==void 0&&d.catch(()=>{})}}else if(e.canPlayType("application/vnd.apple.mpegurl")){if(e.src=o,!s){e.load();const i=e.play();i!==void 0&&i.catch(()=>{})}}else if(e.src=k,!s){e.load();const i=e.play();i!==void 0&&i.catch(()=>{})}};window.centerPlayBtnClick=function(e){console.log("[VIDEO UI] play button clicked");const s=e.parentElement?e.parentElement.querySelector("video"):null;if(s){if(s.dataset.initState==="warmup"){s.dataset.initState="ready",e.style.display="none";const u=s.play();u!==void 0&&u.catch(o=>console.warn("[VIDEO UI] Warmup playback failed:",o));return}if(s.dataset.initState==="ready"||s.dataset.initState==="playing")if(s.paused||s.ended){const u=s.play();u!==void 0&&u.catch(o=>{e.style.opacity="1",e.style.pointerEvents="auto"})}else s.pause();else window.initVideoPlayback(s,!1)}};function $e(e){var C,q,P,H,A,V,_,R,D,j,F;document.title=`${e.name} — KicksAura`;const s=(((C=e.imageUrls)==null?void 0:C.length)>0?e.imageUrls:[]).map(me),u=((q=e.videoUrls)==null?void 0:q.length)>0?e.videoUrls:[],o=[...s.map(t=>({type:"image",url:t})),...u.map(t=>({type:"video",url:t}))],k=e.discountedPrice||e.basePrice,i=e.discountedPrice?e.basePrice:null,d=N(e.id);(((P=e.brand)==null?void 0:P.name)||e.brandName||((H=e.category)==null?void 0:H.name)||"KICKS AURA").toUpperCase();const g=i?Math.round((1-k/i)*100):0,m=((A=e.variants)==null?void 0:A.length)>0?e.variants.reduce((t,n)=>t+(n.stockQuantity||0),0):e.stockQuantity??10,S=e.inStockFlag??m>0,J=o.map((t,n)=>{if(t.type==="video"){const a=s.length>0?s[0]:t.url;return`
        <div class="thumb-item thumb-video ${n===0?"active":""}" data-idx="${n}" title="Watch video">
          <div class="thumb-video-placeholder">
            <img src="${a}" loading="lazy" alt="Video cover" />
            <div class="thumb-video-overlay">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="white" stroke="none"><polygon points="5,3 19,12 5,21"/></svg>
            </div>
          </div>
        </div>`}else return`
        <div class="thumb-item ${n===0?"active":""}" data-idx="${n}">
          <img src="${t.url}" alt="${e.name} ${n+1}" loading="${n===0?"eager":"lazy"}" decoding="async" />
        </div>`}).join("");function X(t){const n=`
      <button class="wishlist-btn-detail ${t?"active":""}" id="wishlist-detail-btn" aria-label="Add to wishlist">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="${t?"#c82333":"none"}" stroke="${t?"#c82333":"currentColor"}" stroke-width="2">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
        </svg>
      </button>`,a=`
      <button class="expand-btn" id="expand-btn" aria-label="View larger">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>
        </svg>
      </button>`;return!o||o.length===0?'<div style="display:flex;align-items:center;justify-content:center;height:100%;font-size:48px;background:transparent;">👟</div>'+n:`
      <div class="main-media-track" id="main-media-track">
        ${o.map((l,c)=>`
      <div class="main-media-slide" data-idx="${c}" style="position: relative; display: flex; align-items: center; justify-content: center;">
        ${l.type==="video"?`<video
               class="ka-lazy-video"
               id="main-video-${c}"
               poster="${fe(l.url)||""}"
               data-hls-src="${ve(l.url)||""}"
               data-mp4-src="${be(l.url)||""}"
               controls
               controlsList="nofullscreen nodownload noplaybackrate"
               disablePictureInPicture
               preload="metadata"
               playsinline
               onclick="window.initVideoPlayback(this, false)"
               style="cursor:pointer; width:100%; height:100%; object-fit:contain; background:transparent;"
             ></video>
             <button class="center-play-btn" onclick="window.centerPlayBtnClick(this)" aria-label="Play video">
               <svg width="32" height="32" viewBox="0 0 24 24" fill="white"><polygon points="6,4 20,12 6,20"/></svg>
             </button>`:`<img
               ${c===0?`src="${l.url}"`:`data-src="${l.url}"`}
               alt="${e.name}"
               id="main-image-${c}"
               loading="${c===0?"eager":"lazy"}"
               decoding="async"
               style="width:92%; height:92%; object-fit:contain; background:transparent;"
             />`}
      </div>
    `).join("")}
      </div>
      ${n}
      ${a}
    `}const x=e.variants&&e.variants.length>0,ee=x?[...e.variants].sort((t,n)=>{const a=parseFloat((t.size||"").replace(/[^0-9.]/g,""))||0,r=parseFloat((n.size||"").replace(/[^0-9.]/g,""))||0;return a-r}):[],te=x?ee.map(t=>`
        <button class="size-btn ${t.stockQuantity<=0?"size-btn--oos":""}"
          data-variant-id="${t.id}"
          data-stock="${t.stockQuantity}"
          ${t.stockQuantity<=0?'disabled title="Out of stock"':""}> 
          ${t.size}
        </button>`).join(""):"",ie=x?`
      <div style="margin-bottom: 26px;">
        <button id="size-chart-btn" style="background: none; border: none; padding: 0; color: #000; text-decoration: underline; cursor: pointer; font-size: 14.5px; font-weight: 400; font-family: inherit;">Size Chart</button>
      </div>

      <div class="size-section">
        <p class="size-label">Select Size</p>
        <div class="size-options" id="size-options">
          ${te}
        </div>
      </div>`:"",ne=`https://wa.me/916239379751?text=${encodeURIComponent("I am interested in "+e.name+" - "+window.location.origin+"/product-details?id="+e.id)}`;if(document.getElementById("product-container").innerHTML=`
    <!-- Left: Gallery -->
    <div class="product-gallery">
      <div class="gallery-inner">
        <!-- Vertical thumbnails strip -->
        ${o.length>1?`
        <div class="thumb-strip" id="thumb-strip">
          ${J}
        </div>`:""}
        <!-- Main image -->
        <div class="main-image-container" id="main-media-wrap">
          ${X(d)}
        </div>
      </div>
    </div>

    <!-- Right: Details -->
    <div class="product-details">
      <h1 class="product-title pd-title-modern">${e.name}</h1>
      
      <div class="pd-pricing-section">
        <div class="pd-curr-price">${W(k)}</div>
        ${i&&g>0?`<div class="pd-orig-price">${W(i)}</div>`:""}
      </div>
      
      <p class="pd-shipping-link"><a href="/shipping-policy" class="pd-open-shipping-modal" style="color: #2563eb; text-decoration: underline; cursor: pointer;">Shipping</a> calculated at checkout.</p>
      
      <a href="${ne}" target="_blank" rel="noopener noreferrer" class="pd-whatsapp-inquiry-btn">
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

      ${S?`
      <div class="pd-stock-status-row" style="margin-bottom: 8px;">
        ${e.limitedStock?`
          <span style="display:inline-flex; align-items:center; gap:6px; background: linear-gradient(135deg, #ff6b00, #ff4500); color:#fff; font-size:13px; font-weight:700; letter-spacing:0.04em; padding:5px 13px; border-radius:20px; box-shadow:0 2px 8px rgba(255,100,0,0.35);">
            🔥 SELLING FAST
          </span>
        `:`
          <div class="pd-stock-icon-circle pd-stock-in">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
          </div>
          <span class="pd-stock-text pd-stock-in-text">In stock!</span>
        `}
      </div>
      `:""}
      ${ie}

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

      <div class="action-row">
        <button class="btn-add-to-cart" id="add-to-cart-btn">ADD TO CART</button>
        <button class="btn-buy-now" id="buy-now-btn">BUY NOW</button>
      </div>
      <div style="text-align: left; margin-top: -12px; margin-bottom: 32px; padding-left: 2px;">
        <span style="font-size: 14px; font-weight: 600; color: #475569; display: flex; align-items: center; gap: 6px;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
          Guaranteed Safe Checkout
        </span>
      </div>

    </div>
  `,"IntersectionObserver"in window){const t=new IntersectionObserver((n,a)=>{n.forEach(r=>{if(r.isIntersecting){const l=r.target;l.dataset.initState!=="warmup"&&l.dataset.initState!=="ready"&&l.dataset.initState!=="playing"&&window.initVideoPlayback(l,!0),a.unobserve(l)}})},{rootMargin:"50% 0px 50% 0px"});document.querySelectorAll(".ka-lazy-video").forEach(n=>t.observe(n))}ze(e);let y=0;function U(t){y=t;const n=o[y],a=document.getElementById("img-lightbox"),r=document.getElementById("lightbox-content");if(!a||!r||!n)return;const l=document.querySelector(`.main-media-slide[data-idx="${K}"] video`);l&&l.pause(),r.innerHTML=n.type==="video"?`<div style="position: relative; display: flex; align-items: center; justify-content: center; width: 100%; height: 100%;">
           <video 
             poster="${we(n.url)}"
             data-hls-src="${ke(n.url)}"
             data-mp4-src="${xe(n.url)}"
             controls controlsList="nodownload" playsinline autoplay 
             onclick="window.initVideoPlayback(this, false)"
             style="cursor:pointer; display:block; width:100%; max-height:82vh; object-fit:contain; background:#000; border-radius:8px;">
           </video>
           <button class="center-play-btn" style="display:none;" onclick="window.centerPlayBtnClick(this)" aria-label="Play video">
             <svg width="32" height="32" viewBox="0 0 24 24" fill="white"><polygon points="6,4 20,12 6,20"/></svg>
           </button>
         </div>`:`<img src="${n.url}" alt="" style="display:block; width:100%; max-height:82vh; object-fit:contain; border-radius:8px; background:transparent;" />`,n.type==="video"&&setTimeout(()=>{const f=r.querySelector("video");f&&window.initVideoPlayback(f)},50);const c=document.getElementById("lb-prev"),h=document.getElementById("lb-next");n.type==="video"?(c&&(c.style.display="none"),h&&(h.style.display="none")):(c&&(c.style.display="",c.style.opacity=y===0?"0.3":"1"),h&&(h.style.display="",h.style.opacity=y===o.length-1?"0.3":"1"));const p=document.getElementById("lb-counter");p&&(p.style.display="none"),a.classList.add("open")}function $(){var n,a;const t=document.getElementById("img-lightbox");t==null||t.classList.remove("open"),(a=(n=document.getElementById("lightbox-content"))==null?void 0:n.querySelector("video"))==null||a.pause()}if(!document.getElementById("img-lightbox")){const t=document.createElement("div");t.id="img-lightbox",t.innerHTML=`
      <div class="lightbox-backdrop" id="lightbox-backdrop">
        <div class="lightbox-box">
          <button class="lightbox-close" id="lightbox-close" aria-label="Close">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
          <button class="lb-nav-btn lb-nav-btn--prev" id="lb-prev" aria-label="Previous">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M15 18l-6-6 6-6"/></svg>
          </button>
          <div id="lightbox-content"></div>
          <button class="lb-nav-btn lb-nav-btn--next" id="lb-next" aria-label="Next">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M9 18l6-6-6-6"/></svg>
          </button>

        </div>
      </div>`,document.body.appendChild(t),document.getElementById("lightbox-backdrop").addEventListener("click",n=>{n.target===n.currentTarget&&$()}),document.getElementById("lightbox-close").addEventListener("click",$),document.getElementById("lb-prev").addEventListener("click",()=>{y>0&&U(y-1)}),document.getElementById("lb-next").addEventListener("click",()=>{y<o.length-1&&U(y+1)}),document.addEventListener("keydown",n=>{var a;(a=document.getElementById("img-lightbox"))!=null&&a.classList.contains("open")&&(n.key==="Escape"&&$(),n.key==="ArrowLeft"&&y>0&&U(y-1),n.key==="ArrowRight"&&y<o.length-1&&U(y+1))})}const z=e.brand||e.category||"Kicks Aura";if(document.getElementById("size-chart-drawer")){const t=document.getElementById("sc-brand-name");t&&(t.textContent=`Brand : ${z}`)}else{const t=document.createElement("div");t.id="size-chart-drawer",t.innerHTML=`
      <div class="size-chart-drawer-header">
        <div class="sc-brand-row">
          <h2 id="sc-brand-name">Brand : ${z}</h2>
          <button class="size-chart-close-btn" id="size-chart-close" aria-label="Close">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#666" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>
        <div class="sc-tabs-row">
          <button class="sc-tab active">Size Guide</button>
        </div>
      </div>
      <div class="size-chart-drawer-content" id="size-chart-content">
        <h3 class="sc-content-title">Foot Measurement</h3>
        <!-- Blank content for size chart -->
      </div>
    `;const n=document.createElement("div");n.id="size-chart-backdrop",document.body.appendChild(n),document.body.appendChild(t);const a=()=>{t.classList.remove("open"),n.classList.remove("open")};document.getElementById("size-chart-close").addEventListener("click",a),n.addEventListener("click",a)}(V=document.getElementById("size-chart-btn"))==null||V.addEventListener("click",async()=>{const t=document.getElementById("size-chart-drawer"),n=document.getElementById("size-chart-backdrop");if(t&&n){t.classList.add("open"),n.classList.add("open");const a=document.getElementById("size-chart-content"),r={"new balance":{headers:["UK Size","EU Size","Foot Length (cm)"],rows:[["UK 5","38.5","23.5"],["UK 5.5","39","24"],["UK 6","39.5","24.5"],["UK 6.5","40","25"],["UK 7","40.5","25.5"],["UK 7.5","41.5","26"],["UK 8","42","26.5"],["UK 8.5","42.5","27"],["UK 9","43","27.5"],["UK 9.5","44","28"],["UK 10","44.5","28.5"],["UK 10.5","45","29"],["UK 11","45.5","29.5"],["UK 11.5","46.5","30"]]},nike:{headers:["UK Size","EU Size","Foot Length (cm)"],rows:[["UK 5","38","23.5"],["UK 5.5","38.5","24"],["UK 6 (EU 40)","40","24.5"],["UK 6.5","40.5","25"],["UK 7","41","25.4"],["UK 7.5","42","25.8"],["UK 8","42.5","26.2"],["UK 8.5","43","26.7"],["UK 9","44","27.1"],["UK 9.5","44.5","27.5"],["UK 10","45","27.9"],["UK 10.5","45.5","28.3"],["UK 11.5","47","29.2"]]},adidas:{headers:["UK Size","EU Size","Foot Length (cm)"],rows:[["UK 5","38","23.5"],["UK 5.5","38 2/3","24"],["UK 6","39 1/3","24.5"],["UK 6.5","40","25"],["UK 7","40 2/3","25.5"],["UK 7.5","41 1/3","26"],["UK 8","42","26.5"],["UK 8.5","42 2/3","27"],["UK 9","43 1/3","27.5"],["UK 9.5","44","28"],["UK 10","44 2/3","28.5"],["UK 10.5","45 1/3","29"],["UK 11","46","29.5"],["UK 11.5","46 2/3","30"]]},crocs:{headers:["UK Size","EU Size","Foot Length (cm)"],rows:[["UK 5","36-37","23.5"],["UK 5.5","37-38","24"],["UK 6","37-38","24.5"],["UK 6.5","38-39","25"],["UK 7","39-40","25.5"],["UK 7.5","41-42","26"],["UK 8","41-42","26.5"],["UK 8.5","42-43","27"],["UK 9","42-43","27.5"],["UK 9.5","43-44","28"],["UK 10","45-46","28.5"],["UK 10.5","45-46","29"],["UK 11","46-47","29.5"],["UK 11.5","48-49","30"]]},"on cloud":{headers:["UK Size","EU Size","Foot Length (cm)"],rows:[["UK 5","38","23.5"],["UK 5.5","38.5","24"],["UK 6","39","24.5"],["UK 6.5","40","25"],["UK 7","40.5","25.5"],["UK 7.5","41","26"],["UK 8","42","26.5"],["UK 8.5","42.5","27"],["UK 9","43","27.5"],["UK 9.5","44","28"],["UK 10","44.5","28.5"],["UK 10.5","45","29"],["UK 11","46","29.5"],["UK 11.5","47","30"]]},"onitsuka tiger":{headers:["UK Size","EU Size","Foot Length (cm)"],rows:[["UK 5","37.5","23.5"],["UK 5.5","38","24"],["UK 6","39","24.5"],["UK 6.5","39.5","25"],["UK 7","40.5","25.5"],["UK 7.5","41.5","26"],["UK 8","42","26.5"],["UK 8.5","42.5","27"],["UK 9","43.5","27.5"],["UK 9.5","44","28"],["UK 10","44.5","28.5"],["UK 10.5","45","29"],["UK 11","46","29.5"],["UK 11.5","46.5","30"]]}},l=z.toLowerCase(),c=r[l];if(c){const h=c.headers.map(f=>`<th>${f}</th>`).join(""),p=c.rows.map((f,w)=>`<tr class="${w%2===0?"sc-row-even":"sc-row-odd"}">${f.map((B,M)=>`<td class="${M===0?"sc-td-first":""}">${B}</td>`).join("")}</tr>`).join("");a.innerHTML=`
          <h3 class="sc-content-title">Foot Measurement</h3>
          <div class="sc-table-wrap">
            <table class="sc-table">
              <thead><tr>${h}</tr></thead>
              <tbody>${p}</tbody>
            </table>
          </div>
          <div class="sc-footer">
            Our dedication to craft means that we are committed to getting the right fit. <a href="https://wa.me/916239379751?text=Hi!%20I%20want%20help%20in%20finding%20my%20right%20size" target="_blank" rel="noopener">Contact us</a> with questions on how to find the right size.
          </div>`}else{const h=r.nike,p=h.headers.map(w=>`<th>${w}</th>`).join(""),f=h.rows.map((w,B)=>`<tr class="${B%2===0?"sc-row-even":"sc-row-odd"}">${w.map((M,le)=>`<td class="${le===0?"sc-td-first":""}">${M}</td>`).join("")}</tr>`).join("");a.innerHTML=`
          <h3 class="sc-content-title">Foot Measurement</h3>
          <div class="sc-table-wrap">
            <table class="sc-table">
              <thead><tr>${p}</tr></thead>
              <tbody>${f}</tbody>
            </table>
          </div>
          <div class="sc-footer">
            Our dedication to craft means that we are committed to getting the right fit. <a href="https://wa.me/916239379751?text=Hi!%20I%20want%20help%20in%20finding%20my%20right%20size" target="_blank" rel="noopener">Contact us</a> with questions on how to find the right size.
          </div>`}}});let K=0;function ae(){var t;(t=document.getElementById("expand-btn"))==null||t.addEventListener("click",()=>{U(K)})}function se(){var t;(t=document.getElementById("wishlist-detail-btn"))==null||t.addEventListener("click",()=>{var r,l;Ee(e);const n=document.getElementById("wishlist-detail-btn"),a=N(e.id);n==null||n.classList.toggle("active",a),(r=n==null?void 0:n.querySelector("svg"))==null||r.setAttribute("fill",a?"#c82333":"none"),(l=n==null?void 0:n.querySelector("svg"))==null||l.setAttribute("stroke",a?"#c82333":"currentColor"),Z()})}function oe(t){var h;if(t<0||t>=o.length)return;const n=K;K=t,document.querySelectorAll("#thumb-strip .thumb-item").forEach(p=>p.classList.remove("active"));const a=document.querySelector(`#thumb-strip .thumb-item[data-idx="${t}"]`);a&&(a.classList.add("active"),a.scrollIntoView({behavior:"smooth",block:"nearest"}));const r=document.querySelector(`.main-media-slide[data-idx="${t}"]`);if(r){const p=r.querySelector("img[data-src]");p&&(p.src=p.dataset.src,delete p.dataset.src)}[t-1,t+1].forEach(p=>{if(p<0||p>=o.length)return;const f=document.querySelector(`.main-media-slide[data-idx="${p}"]`);if(!f)return;const w=f.querySelector("img[data-src]");w&&(w.src=w.dataset.src,delete w.dataset.src)});const l=document.querySelector(`.main-media-slide[data-idx="${n}"]`);(h=l==null?void 0:l.querySelector("video"))==null||h.pause();const c=document.getElementById("main-media-track");c&&(c.style.transform=`translate3d(-${t*100}%, 0, 0)`)}document.querySelectorAll("#thumb-strip .thumb-item").forEach(t=>{t.addEventListener("click",()=>{oe(parseInt(t.dataset.idx))})});let L=null;document.querySelectorAll(".size-btn:not([disabled])").forEach(t=>{t.addEventListener("click",()=>{document.querySelectorAll(".size-btn").forEach(n=>n.classList.remove("selected")),t.classList.add("selected"),L=e.variants.find(n=>String(n.id)===String(t.dataset.variantId))})});function T(){const t=document.querySelector(".size-section");t&&(t.classList.remove("size-shake"),t.offsetWidth,t.classList.add("size-shake"),G("Please select a size first","error"))}let v=1;const I=document.getElementById("qty-value");(_=document.getElementById("qty-minus"))==null||_.addEventListener("click",()=>{v>1&&(v--,I&&(I.textContent=v))}),(R=document.getElementById("qty-plus"))==null||R.addEventListener("click",()=>{v<10&&(v++,I&&(I.textContent=v))}),se(),ae(),(D=document.querySelector(".pd-open-shipping-modal"))==null||D.addEventListener("click",t=>{t.preventDefault(),Le()}),window._pdLiveInterval&&clearInterval(window._pdLiveInterval),window._pdLiveInterval=setInterval(()=>{const t=document.getElementById("pd-viewers-num");if(t){let n=parseInt(t.textContent||"8");const a=Math.random()>.5?1:-1,r=Math.max(8,Math.min(15,n+a));t.textContent=r}},9e3);const b=document.getElementById("live-video-option-box"),E=document.getElementById("live-video-check");b&&E&&(b.addEventListener("click",t=>{t.target!==E&&(E.checked=!E.checked),E.checked?(b.style.borderColor="#2563eb",b.style.background="#eff6ff"):(b.style.borderColor="#e2e8f0",b.style.background="#f8fafc")}),E.addEventListener("change",()=>{E.checked?(b.style.borderColor="#2563eb",b.style.background="#eff6ff"):(b.style.borderColor="#e2e8f0",b.style.background="#f8fafc")})),(j=document.getElementById("add-to-cart-btn"))==null||j.addEventListener("click",()=>{var c;if(x&&!L){T();return}const t=x?L:null,n=((c=document.getElementById("live-video-check"))==null?void 0:c.checked)||!1;O(e,t,v,{liveVideoCall:n});const a=x?` (${t.size})`:"",r=v>1?` × ${v}`:"",l=n?" (Live Video Call Requested)":"";G(`${e.name}${a}${r} added to cart!${l}`,"success"),Y()}),(F=document.getElementById("buy-now-btn"))==null||F.addEventListener("click",()=>{var a;if(x&&!L){T();return}const t=x?L:null,n=((a=document.getElementById("live-video-check"))==null?void 0:a.checked)||!1;O(e,t,v,{liveVideoCall:n}),sessionStorage.setItem("checkout_intent","true"),window.location.href="/checkout"})}async function ze(e){var k,i;const s=((k=e.category)==null?void 0:k.name)||e.category||e.brandName||null;if(!s)return;const u=document.querySelector("main.product-page");if(!u)return;(i=document.getElementById("related-products-section"))==null||i.remove();const o=document.createElement("section");o.id="related-products-section",o.className="related-products-section",o.innerHTML=`
    <div class="related-products-inner">
      <h2 class="related-products-title">You May Also Like</h2>
      <div class="related-products-grid" id="related-products-grid">
        ${[...Array(4)].map(()=>`
          <div class="related-skeleton">
            <div class="related-skeleton__img"></div>
            <div class="related-skeleton__line"></div>
            <div class="related-skeleton__line related-skeleton__line--short"></div>
          </div>`).join("")}
      </div>
    </div>
  `,u.appendChild(o);try{const d=await ye(s,e.id,8),g=document.getElementById("related-products-grid");if(!g)return;if(!d||d.length===0){o.remove();return}g.innerHTML=d.map(m=>ge(m)).join(""),g.querySelectorAll(".pc-heart-btn").forEach(m=>{m.addEventListener("click",S=>{S.preventDefault(),S.stopPropagation()})})}catch(d){console.warn("[Related Products] Failed to load:",d),o.remove()}}
