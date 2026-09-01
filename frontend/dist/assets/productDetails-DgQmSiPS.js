import{k as re,m as ce,n as de,j as Y,o as pe,p as Z,q as ue,B as he,C as ye,D as N,A as O,z as W,E as me,F as ge,G as ve,H as fe,y as be,I as we,J as ke,K as xe,L as Ee}from"./login-modal.js_v_1-YKruNoRe.js";/* empty css                     */import{i as Le,a as Ue,o as Se}from"./cart-sidebar-CJ3T726Z.js";import{i as Ie}from"./profile-de7xj6fW.js";document.getElementById("navbar-container").innerHTML=re("product");document.getElementById("footer-container").innerHTML=ce();de();Y();pe();Le();Z();Ie();ue();Ue();const G=e=>e!=null?"₹"+e.toLocaleString("en-IN"):"";async function Ke(){const d=new URLSearchParams(window.location.search).get("id");if(!d){Q("No product ID specified in the URL.");return}try{const h=await he(d);$e(h)}catch(h){console.error("Failed to load product:",h),Q("Could not load product. Please try again.")}}function Q(e){document.getElementById("product-container").innerHTML=`
    <div style="padding: 80px 20px; text-align: center; grid-column: 1/-1;">
      <p style="font-size: 18px; font-weight: 600; color: #222;">⚠️ ${e}</p>
      <a href="/" style="display:inline-block; margin-top: 16px; color: #c82333; font-weight: 600;">← Back to Home</a>
    </div>`}window.initVideoPlayback=function(e){console.log("[HLS] User requested playback",{video:e.id});const d=window.matchMedia("(pointer: coarse)").matches;if(e.dataset.initialized==="true"){if(d){console.log("[HLS] Mobile: already initialized, deferring to native controls.");return}if(console.log("[HLS] Already initialized. Toggling play/pause."),e.paused){const a=e.play();a!==void 0&&a.catch(i=>console.warn("[HLS] Resume error:",i)),console.log("[HLS] Playback resumed")}else e.pause();return}e.dataset.initialized="true",console.log("[HLS] Initializing");const h=e.dataset.hlsSrc,o=e.dataset.mp4Src;if(e.hlsInstance&&(e.hlsInstance.destroy(),e.hlsInstance=null),e.parentElement&&!e.dataset.listenersAttached){e.dataset.listenersAttached="true";let a=e.parentElement.querySelector(".hls-loader");a||(a=document.createElement("div"),a.className="hls-loader",a.innerHTML='<div style="width:40px;height:40px;border:3px solid rgba(255,255,255,0.3);border-top-color:#fff;border-radius:50%;animation:spin 1s linear infinite;"></div><style>@keyframes spin{100%{transform:rotate(360deg)}}</style>',a.style.cssText="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);z-index:10;pointer-events:none;",e.parentElement.style.position="relative",e.parentElement.appendChild(a)),a.style.display="block";const i=e.parentElement.querySelector(".center-play-btn");i&&(i.style.display="none");const r='<svg width="34" height="34" viewBox="0 0 24 24" fill="white"><polygon points="6,3 21,12 6,21"/></svg>',y='<svg width="30" height="30" viewBox="0 0 24 24" fill="white"><rect x="5" y="3" width="4" height="18" rx="1"/><rect x="15" y="3" width="4" height="18" rx="1"/></svg>',g=(x=0)=>{clearTimeout(i._fadeTimer),i._fadeTimer=setTimeout(()=>{i&&(i.style.opacity="0",i.style.pointerEvents="none")},x)};e.parentElement.addEventListener("mouseleave",()=>{i&&!e.paused&&g(0)}),e.addEventListener("playing",()=>{console.log("[VIDEO UI] playback started"),a.style.display="none",i&&(i.innerHTML=y,i.setAttribute("aria-label","Pause video"),i.style.display="flex",i.style.opacity="1",i.style.pointerEvents="auto",g(600))}),e.addEventListener("mousemove",()=>{i&&!e.paused&&(clearTimeout(i._fadeTimer),i.style.opacity="1",i.style.pointerEvents="auto",g(800))}),e.addEventListener("waiting",()=>{console.log("[HLS] Playback waiting/buffering"),a.style.display="block",i&&(i.style.opacity="0",i.style.pointerEvents="none")}),e.addEventListener("pause",()=>{clearTimeout(i==null?void 0:i._fadeTimer),i&&(i.innerHTML=r,i.setAttribute("aria-label","Play video"),i.style.opacity="1",i.style.pointerEvents="auto",i.style.display="flex"),a.style.display="none"}),e.addEventListener("ended",()=>{clearTimeout(i==null?void 0:i._fadeTimer),i&&(i.innerHTML=r,i.setAttribute("aria-label","Play video"),i.style.opacity="1",i.style.pointerEvents="auto",i.style.display="flex"),a.style.display="none"}),e.addEventListener("error",()=>{a.style.display="none",i&&(i.innerHTML=r,i.style.opacity="1",i.style.pointerEvents="auto",i.style.display="flex")})}else if(e.parentElement){const a=e.parentElement.querySelector(".hls-loader");a&&(a.style.display="block");const i=e.parentElement.querySelector(".center-play-btn");i&&(i.style.display="none")}if(window.Hls&&Hls.isSupported()){const a=new Hls({startLevel:-1});e.hlsInstance=a,a.on(Hls.Events.MEDIA_ATTACHED,function(){console.log("[HLS] MEDIA_ATTACHED"),console.log("[HLS] Loading source"),a.loadSource(h)}),a.on(Hls.Events.MANIFEST_PARSED,function(){if(console.log("[HLS] MANIFEST_PARSED"),console.log("[HLS] Video ready for playback"),e.paused){const r=e.play();r!==void 0&&r.catch(()=>{})}}),a.on(Hls.Events.ERROR,function(r,y){if(console.error("[HLS] Playback error:",y),y.fatal)if(y.type===Hls.ErrorTypes.NETWORK_ERROR)a.startLoad();else if(y.type===Hls.ErrorTypes.MEDIA_ERROR)a.recoverMediaError();else{console.error("[HLS] Fatal unrecoverable error, falling back to MP4"),a.destroy(),e.hlsInstance=null,e.src=o,e.load();const g=e.play();g!==void 0&&g.catch(x=>console.warn("[HLS] Fallback MP4 error:",x))}}),a.attachMedia(e);const i=e.play();i!==void 0&&i.catch(r=>console.warn("[HLS] Initial synchronous play error (expected):",r))}else if(e.canPlayType("application/vnd.apple.mpegurl")){console.log("[HLS] Native HLS supported (Safari)"),e.src=h,e.load();const a=e.play();a!==void 0&&a.catch(i=>console.warn("[HLS] Native initial play error:",i)),e.addEventListener("loadedmetadata",function(){if(e.paused){const i=e.play();i!==void 0&&i.catch(()=>{})}},{once:!0}),e.addEventListener("error",function(i){console.error("[HLS] Playback error (Native HLS), falling back to MP4",i),e.src=o,e.load();const r=e.play();r!==void 0&&r.catch(y=>console.warn("[HLS] Fallback MP4 error:",y))},{once:!0})}else{console.log("[HLS] No HLS support, falling back to MP4"),e.src=o,e.load();const a=e.play();a!==void 0&&a.catch(i=>console.warn("[HLS] MP4 play error:",i))}};window.centerPlayBtnClick=function(e){console.log("[VIDEO UI] play button clicked");const d=e.parentElement?e.parentElement.querySelector("video"):null;if(d)if(d.dataset.initialized==="true")if(d.paused||d.ended){console.log("[VIDEO UI] video.play() requested (already initialized)");const h=d.play();h!==void 0&&h.then(()=>{console.log("[VIDEO UI] playback started")}).catch(o=>{console.warn("[VIDEO UI] playback failed:",o),e.style.opacity="1",e.style.pointerEvents="auto"})}else console.log("[VIDEO UI] video.pause() requested"),d.pause();else console.log("[VIDEO UI] video.play() requested (triggering init)"),window.initVideoPlayback(d)};function $e(e){var T,P,q,C,A,V,D,_,R,j,F;document.title=`${e.name} — KicksAura`;const d=(((T=e.imageUrls)==null?void 0:T.length)>0?e.imageUrls:[]).map(ye),h=((P=e.videoUrls)==null?void 0:P.length)>0?e.videoUrls:[],o=[...d.map(t=>({type:"image",url:t})),...h.map(t=>({type:"video",url:t}))],a=e.discountedPrice||e.basePrice,i=e.discountedPrice?e.basePrice:null,r=N(e.id);(((q=e.brand)==null?void 0:q.name)||e.brandName||((C=e.category)==null?void 0:C.name)||"KICKS AURA").toUpperCase();const y=i?Math.round((1-a/i)*100):0,g=((A=e.variants)==null?void 0:A.length)>0?e.variants.reduce((t,n)=>t+(n.stockQuantity||0),0):e.stockQuantity??10,x=e.inStockFlag??g>0,J=o.map((t,n)=>{if(t.type==="video"){const s=d.length>0?d[0]:t.url;return`
        <div class="thumb-item thumb-video ${n===0?"active":""}" data-idx="${n}" title="Watch video">
          <div class="thumb-video-placeholder">
            <img src="${s}" loading="lazy" alt="Video cover" />
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
      </button>`,s=`
      <button class="expand-btn" id="expand-btn" aria-label="View larger">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>
        </svg>
      </button>`;return!o||o.length===0?'<div style="display:flex;align-items:center;justify-content:center;height:100%;font-size:48px;background:transparent;">👟</div>'+n:`
      <div class="main-media-track" id="main-media-track">
        ${o.map((c,l)=>`
      <div class="main-media-slide" data-idx="${l}" style="position: relative; display: flex; align-items: center; justify-content: center;">
        ${c.type==="video"?`<video
               id="main-video-${l}"
               poster="${me(c.url)}"
               data-hls-src="${ge(c.url)}"
               data-mp4-src="${ve(c.url)}"
               controls
               controlsList="nofullscreen nodownload noplaybackrate"
               disablePictureInPicture
               preload="none"
               playsinline
               onclick="window.initVideoPlayback(this)"
               style="cursor:pointer; width:100%; height:100%; object-fit:contain; background:transparent;"
             ></video>
             <button class="center-play-btn" onclick="window.centerPlayBtnClick(this)" aria-label="Play video">
               <svg width="32" height="32" viewBox="0 0 24 24" fill="white"><polygon points="6,4 20,12 6,20"/></svg>
             </button>`:`<img
               ${l===0?`src="${c.url}"`:`data-src="${c.url}"`}
               alt="${e.name}"
               id="main-image-${l}"
               loading="${l===0?"eager":"lazy"}"
               decoding="async"
               style="width:100%; height:100%; object-fit:contain; background:transparent;"
             />`}
      </div>
    `).join("")}
      </div>
      ${n}
      ${s}
    `}const E=e.variants&&e.variants.length>0,ee=E?[...e.variants].sort((t,n)=>{const s=parseFloat((t.size||"").replace(/[^0-9.]/g,""))||0,p=parseFloat((n.size||"").replace(/[^0-9.]/g,""))||0;return s-p}):[],te=E?ee.map(t=>`
        <button class="size-btn ${t.stockQuantity<=0?"size-btn--oos":""}"
          data-variant-id="${t.id}"
          data-stock="${t.stockQuantity}"
          ${t.stockQuantity<=0?'disabled title="Out of stock"':""}> 
          ${t.size}
        </button>`).join(""):"",ie=E?`
      <div style="margin-bottom: 26px;">
        <button id="size-chart-btn" style="background: none; border: none; padding: 0; color: #000; text-decoration: underline; cursor: pointer; font-size: 14.5px; font-weight: 400; font-family: inherit;">Size Chart</button>
      </div>

      <div class="size-section">
        <p class="size-label">Select Size</p>
        <div class="size-options" id="size-options">
          ${te}
        </div>
      </div>`:"",ne=`https://wa.me/916239379751?text=${encodeURIComponent("I am interested in "+e.name+" - "+window.location.origin+"/product-details?id="+e.id)}`;document.getElementById("product-container").innerHTML=`
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
          ${X(r)}
        </div>
      </div>
    </div>

    <!-- Right: Details -->
    <div class="product-details">
      <h1 class="product-title pd-title-modern">${e.name}</h1>
      
      <div class="pd-pricing-section">
        <div class="pd-curr-price">${G(a)}</div>
        ${i&&y>0?`<div class="pd-orig-price">${G(i)}</div>`:""}
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

      ${x?`
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

      ${e.description?`
        <div class="product-description-section">
          <h2>Description</h2>
          <p>${e.description}</p>
        </div>`:""}
    </div>
  `,ze(e);let v=0;function U(t){v=t;const n=o[v],s=document.getElementById("img-lightbox"),p=document.getElementById("lightbox-content");if(!s||!p||!n)return;const c=document.querySelector(`.main-media-slide[data-idx="${I}"] video`);c&&c.pause(),p.innerHTML=n.type==="video"?`<div style="position: relative; display: flex; align-items: center; justify-content: center; width: 100%; height: 100%;">
           <video 
             poster="${we(n.url)}"
             data-hls-src="${ke(n.url)}"
             data-mp4-src="${xe(n.url)}"
             controls controlsList="nodownload" playsinline autoplay 
             onclick="window.initVideoPlayback(this)"
             style="cursor:pointer; display:block; width:100%; max-height:82vh; object-fit:contain; background:#000; border-radius:8px;">
           </video>
           <button class="center-play-btn" style="display:none;" onclick="window.centerPlayBtnClick(this)" aria-label="Play video">
             <svg width="32" height="32" viewBox="0 0 24 24" fill="white"><polygon points="6,4 20,12 6,20"/></svg>
           </button>
         </div>`:`<img src="${n.url}" alt="" style="display:block; width:100%; max-height:82vh; object-fit:contain; border-radius:8px; background:transparent;" />`,n.type==="video"&&setTimeout(()=>{const f=p.querySelector("video");f&&window.initVideoPlayback(f)},50);const l=document.getElementById("lb-prev"),m=document.getElementById("lb-next");n.type==="video"?(l&&(l.style.display="none"),m&&(m.style.display="none")):(l&&(l.style.display="",l.style.opacity=v===0?"0.3":"1"),m&&(m.style.display="",m.style.opacity=v===o.length-1?"0.3":"1"));const u=document.getElementById("lb-counter");u&&(u.style.display="none"),s.classList.add("open")}function $(){var n,s;const t=document.getElementById("img-lightbox");t==null||t.classList.remove("open"),(s=(n=document.getElementById("lightbox-content"))==null?void 0:n.querySelector("video"))==null||s.pause()}if(!document.getElementById("img-lightbox")){const t=document.createElement("div");t.id="img-lightbox",t.innerHTML=`
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
      </div>`,document.body.appendChild(t),document.getElementById("lightbox-backdrop").addEventListener("click",n=>{n.target===n.currentTarget&&$()}),document.getElementById("lightbox-close").addEventListener("click",$),document.getElementById("lb-prev").addEventListener("click",()=>{v>0&&U(v-1)}),document.getElementById("lb-next").addEventListener("click",()=>{v<o.length-1&&U(v+1)}),document.addEventListener("keydown",n=>{var s;(s=document.getElementById("img-lightbox"))!=null&&s.classList.contains("open")&&(n.key==="Escape"&&$(),n.key==="ArrowLeft"&&v>0&&U(v-1),n.key==="ArrowRight"&&v<o.length-1&&U(v+1))})}const z=e.brand||e.category||"Kicks Aura";if(document.getElementById("size-chart-drawer")){const t=document.getElementById("sc-brand-name");t&&(t.textContent=`Brand : ${z}`)}else{const t=document.createElement("div");t.id="size-chart-drawer",t.innerHTML=`
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
    `;const n=document.createElement("div");n.id="size-chart-backdrop",document.body.appendChild(n),document.body.appendChild(t);const s=()=>{t.classList.remove("open"),n.classList.remove("open")};document.getElementById("size-chart-close").addEventListener("click",s),n.addEventListener("click",s)}(V=document.getElementById("size-chart-btn"))==null||V.addEventListener("click",async()=>{const t=document.getElementById("size-chart-drawer"),n=document.getElementById("size-chart-backdrop");if(t&&n){t.classList.add("open"),n.classList.add("open");const s=document.getElementById("size-chart-content"),p={"new balance":{headers:["UK Size","EU Size","Foot Length (cm)"],rows:[["UK 5","38.5","23.5"],["UK 5.5","39","24"],["UK 6","39.5","24.5"],["UK 6.5","40","25"],["UK 7","40.5","25.5"],["UK 7.5","41.5","26"],["UK 8","42","26.5"],["UK 8.5","42.5","27"],["UK 9","43","27.5"],["UK 9.5","44","28"],["UK 10","44.5","28.5"],["UK 10.5","45","29"],["UK 11","45.5","29.5"],["UK 11.5","46.5","30"]]},nike:{headers:["UK Size","EU Size","Foot Length (cm)"],rows:[["UK 5","38","23.5"],["UK 5.5","38.5","24"],["UK 6 (EU 40)","40","24.5"],["UK 6.5","40.5","25"],["UK 7","41","25.4"],["UK 7.5","42","25.8"],["UK 8","42.5","26.2"],["UK 8.5","43","26.7"],["UK 9","44","27.1"],["UK 9.5","44.5","27.5"],["UK 10","45","27.9"],["UK 10.5","45.5","28.3"],["UK 11.5","47","29.2"]]},adidas:{headers:["UK Size","EU Size","Foot Length (cm)"],rows:[["UK 5","38","23.5"],["UK 5.5","38 2/3","24"],["UK 6","39 1/3","24.5"],["UK 6.5","40","25"],["UK 7","40 2/3","25.5"],["UK 7.5","41 1/3","26"],["UK 8","42","26.5"],["UK 8.5","42 2/3","27"],["UK 9","43 1/3","27.5"],["UK 9.5","44","28"],["UK 10","44 2/3","28.5"],["UK 10.5","45 1/3","29"],["UK 11","46","29.5"],["UK 11.5","46 2/3","30"]]},crocs:{headers:["UK Size","EU Size","Foot Length (cm)"],rows:[["UK 5","36-37","23.5"],["UK 5.5","37-38","24"],["UK 6","37-38","24.5"],["UK 6.5","38-39","25"],["UK 7","39-40","25.5"],["UK 7.5","41-42","26"],["UK 8","41-42","26.5"],["UK 8.5","42-43","27"],["UK 9","42-43","27.5"],["UK 9.5","43-44","28"],["UK 10","45-46","28.5"],["UK 10.5","45-46","29"],["UK 11","46-47","29.5"],["UK 11.5","48-49","30"]]},"on cloud":{headers:["UK Size","EU Size","Foot Length (cm)"],rows:[["UK 5","38","23.5"],["UK 5.5","38.5","24"],["UK 6","39","24.5"],["UK 6.5","40","25"],["UK 7","40.5","25.5"],["UK 7.5","41","26"],["UK 8","42","26.5"],["UK 8.5","42.5","27"],["UK 9","43","27.5"],["UK 9.5","44","28"],["UK 10","44.5","28.5"],["UK 10.5","45","29"],["UK 11","46","29.5"],["UK 11.5","47","30"]]},"onitsuka tiger":{headers:["UK Size","EU Size","Foot Length (cm)"],rows:[["UK 5","37.5","23.5"],["UK 5.5","38","24"],["UK 6","39","24.5"],["UK 6.5","39.5","25"],["UK 7","40.5","25.5"],["UK 7.5","41.5","26"],["UK 8","42","26.5"],["UK 8.5","42.5","27"],["UK 9","43.5","27.5"],["UK 9.5","44","28"],["UK 10","44.5","28.5"],["UK 10.5","45","29"],["UK 11","46","29.5"],["UK 11.5","46.5","30"]]}},c=z.toLowerCase(),l=p[c];if(l){const m=l.headers.map(f=>`<th>${f}</th>`).join(""),u=l.rows.map((f,k)=>`<tr class="${k%2===0?"sc-row-even":"sc-row-odd"}">${f.map((B,M)=>`<td class="${M===0?"sc-td-first":""}">${B}</td>`).join("")}</tr>`).join("");s.innerHTML=`
          <h3 class="sc-content-title">Foot Measurement</h3>
          <div class="sc-table-wrap">
            <table class="sc-table">
              <thead><tr>${m}</tr></thead>
              <tbody>${u}</tbody>
            </table>
          </div>
          <div class="sc-footer">
            Our dedication to craft means that we are committed to getting the right fit. <a href="https://wa.me/916239379751?text=Hi!%20I%20want%20help%20in%20finding%20my%20right%20size" target="_blank" rel="noopener">Contact us</a> with questions on how to find the right size.
          </div>`}else{const m=p.nike,u=m.headers.map(k=>`<th>${k}</th>`).join(""),f=m.rows.map((k,B)=>`<tr class="${B%2===0?"sc-row-even":"sc-row-odd"}">${k.map((M,le)=>`<td class="${le===0?"sc-td-first":""}">${M}</td>`).join("")}</tr>`).join("");s.innerHTML=`
          <h3 class="sc-content-title">Foot Measurement</h3>
          <div class="sc-table-wrap">
            <table class="sc-table">
              <thead><tr>${u}</tr></thead>
              <tbody>${f}</tbody>
            </table>
          </div>
          <div class="sc-footer">
            Our dedication to craft means that we are committed to getting the right fit. <a href="https://wa.me/916239379751?text=Hi!%20I%20want%20help%20in%20finding%20my%20right%20size" target="_blank" rel="noopener">Contact us</a> with questions on how to find the right size.
          </div>`}}});let I=0;function ae(){var t;(t=document.getElementById("expand-btn"))==null||t.addEventListener("click",()=>{U(I)})}function se(){var t;(t=document.getElementById("wishlist-detail-btn"))==null||t.addEventListener("click",()=>{var p,c;Ee(e);const n=document.getElementById("wishlist-detail-btn"),s=N(e.id);n==null||n.classList.toggle("active",s),(p=n==null?void 0:n.querySelector("svg"))==null||p.setAttribute("fill",s?"#c82333":"none"),(c=n==null?void 0:n.querySelector("svg"))==null||c.setAttribute("stroke",s?"#c82333":"currentColor"),Z()})}function oe(t){var m;if(t<0||t>=o.length)return;const n=I;I=t,document.querySelectorAll("#thumb-strip .thumb-item").forEach(u=>u.classList.remove("active"));const s=document.querySelector(`#thumb-strip .thumb-item[data-idx="${t}"]`);s&&(s.classList.add("active"),s.scrollIntoView({behavior:"smooth",block:"nearest"}));const p=document.querySelector(`.main-media-slide[data-idx="${t}"]`);if(p){const u=p.querySelector("img[data-src]");u&&(u.src=u.dataset.src,delete u.dataset.src)}[t-1,t+1].forEach(u=>{if(u<0||u>=o.length)return;const f=document.querySelector(`.main-media-slide[data-idx="${u}"]`);if(!f)return;const k=f.querySelector("img[data-src]");k&&(k.src=k.dataset.src,delete k.dataset.src)});const c=document.querySelector(`.main-media-slide[data-idx="${n}"]`);(m=c==null?void 0:c.querySelector("video"))==null||m.pause();const l=document.getElementById("main-media-track");l&&(l.style.transform=`translate3d(-${t*100}%, 0, 0)`)}document.querySelectorAll("#thumb-strip .thumb-item").forEach(t=>{t.addEventListener("click",()=>{oe(parseInt(t.dataset.idx))})});let S=null;document.querySelectorAll(".size-btn:not([disabled])").forEach(t=>{t.addEventListener("click",()=>{document.querySelectorAll(".size-btn").forEach(n=>n.classList.remove("selected")),t.classList.add("selected"),S=e.variants.find(n=>String(n.id)===String(t.dataset.variantId))})});function H(){const t=document.querySelector(".size-section");t&&(t.classList.remove("size-shake"),t.offsetWidth,t.classList.add("size-shake"),W("Please select a size first","error"))}let b=1;const K=document.getElementById("qty-value");(D=document.getElementById("qty-minus"))==null||D.addEventListener("click",()=>{b>1&&(b--,K&&(K.textContent=b))}),(_=document.getElementById("qty-plus"))==null||_.addEventListener("click",()=>{b<10&&(b++,K&&(K.textContent=b))}),se(),ae(),(R=document.querySelector(".pd-open-shipping-modal"))==null||R.addEventListener("click",t=>{t.preventDefault(),Se()}),window._pdLiveInterval&&clearInterval(window._pdLiveInterval),window._pdLiveInterval=setInterval(()=>{const t=document.getElementById("pd-viewers-num");if(t){let n=parseInt(t.textContent||"8");const s=Math.random()>.5?1:-1,p=Math.max(8,Math.min(15,n+s));t.textContent=p}},9e3);const w=document.getElementById("live-video-option-box"),L=document.getElementById("live-video-check");w&&L&&(w.addEventListener("click",t=>{t.target!==L&&(L.checked=!L.checked),L.checked?(w.style.borderColor="#2563eb",w.style.background="#eff6ff"):(w.style.borderColor="#e2e8f0",w.style.background="#f8fafc")}),L.addEventListener("change",()=>{L.checked?(w.style.borderColor="#2563eb",w.style.background="#eff6ff"):(w.style.borderColor="#e2e8f0",w.style.background="#f8fafc")})),(j=document.getElementById("add-to-cart-btn"))==null||j.addEventListener("click",()=>{var l;if(E&&!S){H();return}const t=E?S:null,n=((l=document.getElementById("live-video-check"))==null?void 0:l.checked)||!1;O(e,t,b,{liveVideoCall:n});const s=E?` (${t.size})`:"",p=b>1?` × ${b}`:"",c=n?" (Live Video Call Requested)":"";W(`${e.name}${s}${p} added to cart!${c}`,"success"),Y()}),(F=document.getElementById("buy-now-btn"))==null||F.addEventListener("click",()=>{var s;if(E&&!S){H();return}const t=E?S:null,n=((s=document.getElementById("live-video-check"))==null?void 0:s.checked)||!1;O(e,t,b,{liveVideoCall:n}),sessionStorage.setItem("checkout_intent","true"),window.location.href="/checkout"})}async function ze(e){var a,i;const d=((a=e.category)==null?void 0:a.name)||e.category||e.brandName||null;if(!d)return;const h=document.querySelector("main.product-page");if(!h)return;(i=document.getElementById("related-products-section"))==null||i.remove();const o=document.createElement("section");o.id="related-products-section",o.className="related-products-section",o.innerHTML=`
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
  `,h.appendChild(o);try{const r=await fe(d,e.id,8),y=document.getElementById("related-products-grid");if(!y)return;if(!r||r.length===0){o.remove();return}y.innerHTML=r.map(g=>be(g)).join(""),y.querySelectorAll(".pc-heart-btn").forEach(g=>{g.addEventListener("click",x=>{x.preventDefault(),x.stopPropagation()})})}catch(r){console.warn("[Related Products] Failed to load:",r),o.remove()}}Ke();
