import{k as R,m as _,n as H,j as D,o as N,p as Q,q as U,y as w,M as q,N as j,v as F,O as W}from"./login-modal.js_v_1-CRxYrCk4.js";/* empty css                     */import{i as V,a as G}from"./cart-sidebar-CEMMChaR.js";import{i as K}from"./profile-DIo1KYCe.js";document.getElementById("navbar-container").innerHTML=R("products");document.getElementById("footer-container").innerHTML=_();H();D();N();V();Q();K();G();U();const g=0,p=35e3,z=16;let l=0,f=0,P=0,h=[],d=!1;const t={searchQuery:"",categories:[],brands:[],minPrice:g,maxPrice:p,trending:!1};function C(){const e=new URLSearchParams(window.location.search);t.searchQuery=e.get("search")||"",t.categories=e.get("categories")?e.get("categories").split(",").filter(Boolean):[],t.brands=e.get("brands")?e.get("brands").split(",").filter(Boolean):[],t.minPrice=e.has("minPrice")?Number(e.get("minPrice")):g,t.maxPrice=e.has("maxPrice")?Number(e.get("maxPrice")):p,t.trending=e.get("trending")==="true";const n=e.get("category");n&&n!=="all"&&!t.categories.includes(n)&&t.categories.push(n)}function X(){const e=new URLSearchParams;t.searchQuery&&e.set("search",t.searchQuery),t.categories.length&&e.set("categories",t.categories.join(",")),t.brands.length&&e.set("brands",t.brands.join(",")),t.minPrice!==g&&e.set("minPrice",t.minPrice),t.maxPrice!==p&&e.set("maxPrice",t.maxPrice),t.trending&&e.set("trending","true");const n=`${window.location.pathname}${e.toString()?"?"+e.toString():""}`;history.pushState(null,"",n)}window.addEventListener("popstate",()=>{C(),E(),x(),k()});function Z(){const e=document.getElementById("active-chips-row");if(!e)return;const n=[];if(t.categories.forEach(r=>{n.push({label:r,onRemove:()=>{t.categories=t.categories.filter(a=>a!==r),E(),c()}})}),t.brands.forEach(r=>{n.push({label:r,onRemove:()=>{t.brands=t.brands.filter(a=>a!==r),E(),c()}})}),t.trending&&n.push({label:"Trending 🔥",onRemove:()=>{t.trending=!1,c()}}),(t.minPrice!==g||t.maxPrice!==p)&&n.push({label:`₹${t.minPrice.toLocaleString("en-IN")} – ₹${t.maxPrice.toLocaleString("en-IN")}`,onRemove:()=>{t.minPrice=g,t.maxPrice=p,x(),c()}}),n.length===0){e.innerHTML="";return}e.innerHTML=n.map((r,a)=>`
      <button class="filter-chip filter-chip--active" data-chip-index="${a}">
        ${r.label}
        <span class="filter-chip__remove">✕</span>
      </button>`).join(""),e.querySelectorAll(".filter-chip").forEach((r,a)=>{r.addEventListener("click",()=>n[a].onRemove())})}function J(){const e=document.getElementById("products-page-title");e&&(t.trending?e.textContent="Trending Products":t.searchQuery?e.textContent="Search Results":t.categories.length===1?e.textContent=t.categories[0]:t.categories.length>1?e.textContent="Multiple Categories":e.textContent="All Products")}const y=document.getElementById("toggle-filters-btn"),b=document.getElementById("close-sidebar-btn"),u=document.getElementById("products-sidebar"),o=document.getElementById("filter-overlay");function Y(){u==null||u.classList.add("active"),o==null||o.classList.add("active"),document.body.style.overflow="hidden"}function T(){u==null||u.classList.remove("active"),o==null||o.classList.remove("active"),document.body.style.overflow=""}y==null||y.addEventListener("click",Y);b==null||b.addEventListener("click",T);o==null||o.addEventListener("click",T);async function O(){try{const e=await F(),n=document.getElementById("category-filter-group");if(!n||!(e!=null&&e.length))return;n.innerHTML=e.map(r=>`
        <label class="custom-checkbox">
          <input type="checkbox" ${t.categories.some(i=>i.toLowerCase()===r.name.toLowerCase())?"checked":""} data-cat="${r.name}" />
          <span class="checkmark"></span>
          ${r.name}
        </label>`).join("")}catch(e){console.error("Could not load categories",e)}document.querySelectorAll('#category-filter-group input[type="checkbox"]').forEach(e=>{e.addEventListener("change",n=>{const r=n.target.dataset.cat;n.target.checked?t.categories.includes(r)||t.categories.push(r):t.categories=t.categories.filter(a=>a!==r),c()})})}async function ee(){try{const e=await W(),n=document.getElementById("brand-filter-group");if(!n)return;if(!(e!=null&&e.length)){n.innerHTML="";return}n.innerHTML=e.map(r=>`
        <label class="custom-checkbox">
          <input type="checkbox" ${t.brands.some(i=>i.toLowerCase()===r.name.toLowerCase())?"checked":""} data-brand="${r.name}" />
          <span class="checkmark"></span>
          ${r.name}
        </label>`).join("")}catch(e){console.error("Could not load brands",e)}document.querySelectorAll('#brand-filter-group input[type="checkbox"]').forEach(e=>{e.addEventListener("change",n=>{const r=n.target.dataset.brand;n.target.checked?t.brands.includes(r)||t.brands.push(r):t.brands=t.brands.filter(a=>a!==r),c()})})}function B(){const e=document.getElementById("price-slider-min"),n=document.getElementById("price-slider-max"),r=document.getElementById("price-display"),a=document.querySelector(".range-track");if(!e||!n||!r||!a)return;let i=parseInt(e.value,10),s=parseInt(n.value,10);i>=s&&(i=s-parseInt(e.step,10),e.value=i),r.textContent=`₹${i.toLocaleString("en-IN")} - ₹${s.toLocaleString("en-IN")}`,t.minPrice=i,t.maxPrice=s;const I=i/parseInt(e.max,10)*100,A=s/parseInt(n.max,10)*100;a.style.left=`${I}%`,a.style.width=`${A-I}%`}function x(){const e=document.getElementById("price-slider-min"),n=document.getElementById("price-slider-max");e&&(e.value=t.minPrice),n&&(n.value=t.maxPrice),B()}function te(){const e=document.getElementById("price-slider-min"),n=document.getElementById("price-slider-max");if(!e||!n)return;x();let r;const a=()=>{B(),clearTimeout(r),r=setTimeout(c,400)};e.addEventListener("input",a),n.addEventListener("input",a)}function E(){document.querySelectorAll('#category-filter-group input[type="checkbox"]').forEach(e=>{e.checked=t.categories.includes(e.dataset.cat)}),document.querySelectorAll('#brand-filter-group input[type="checkbox"]').forEach(e=>{e.checked=t.brands.includes(e.dataset.brand)})}function ne(){const e=document.getElementById("nav-search-input");if(!e)return;t.searchQuery&&(e.value=t.searchQuery,e.dispatchEvent(new Event("input",{bubbles:!0})));let n;e.addEventListener("input",()=>{clearTimeout(n),n=setTimeout(()=>{t.searchQuery=e.value.trim(),c()},300)}),e.addEventListener("keydown",r=>{r.key==="Enter"&&(clearTimeout(n),t.searchQuery=e.value.trim(),c())})}let m=null;async function M(){if(m)return m;try{m=(await j()||[]).slice(0,8)}catch{m=[]}return m}let v=!1;async function $(e){if(t.trending){const r=await M();return{content:r,number:0,totalPages:1,totalElements:r.length}}return await q({query:t.searchQuery,categories:t.categories,brands:t.brands,minPrice:t.minPrice,maxPrice:t.maxPrice},e,z)}function L(e){var r;const n=l+1<f;e.innerHTML=`
    ${h.map(w).join("")}
    ${n?`
      <div class="products-view-more">
        <button class="products-view-more-btn" type="button" ${d?"disabled":""}>
          ${d?"Loading...":"View More"}
        </button>
      </div>
    `:""}
  `,(r=e.querySelector(".products-view-more-btn"))==null||r.addEventListener("click",()=>{d||re()})}async function re(){if(d||l+1>=f)return;d=!0;const e=document.getElementById("products-grid");L(e);try{const n=l+1,r=await $(n);h=[...h,...r.content||[]],l=r.number,f=r.totalPages,P=r.totalElements}catch(n){console.error(n)}finally{d=!1,L(e)}}async function k(){if(v)return;v=!0;const e=document.getElementById("products-grid"),n=document.getElementById("results-count");e.innerHTML=`
    <div style="grid-column: 1/-1;">
      <div class="ka-loader">
        <div class="ka-loader__badge">
          <div class="ka-loader__wordmark">KICKS<br>AURA</div>
        </div>
        <span class="ka-loader__text">Loading products…</span>
      </div>
    </div>`,J(),Z(),X();try{l=0,h=[];const r=await $(l);if(h=r.content||[],f=r.totalPages||0,P=r.totalElements||0,n.textContent="",P===0){const a=await M(),i=a.length>0?`
          <p class="trending-section-title">Trending Products</p>
          <div class="products-grid">${a.map(w).join("")}</div>
        `:"",s=t.categories.length>0;e.innerHTML=`
        <div class="no-results-container" style="grid-column: 1/-1;">
          <div class="no-results-hero">
            ${s?`<p class="no-results-title" style="font-size: 2rem; color: #ff3333; margin-bottom: 8px;">Coming Soon!</p>
                 <p class="no-results-subtitle">We are currently working on adding products to this category.</p>`:`<p class="no-results-title">No products found</p>
                 <p class="no-results-subtitle">We couldn't find any products matching your search.</p>`}
          </div>
          ${i}
        </div>
      `}else L(e)}catch(r){console.error("loadAndRender error:",r),e.innerHTML=`
      <div class="empty-state" style="grid-column: 1/-1;">
        <div class="empty-state__icon">⚠️</div>
        <p class="headline-md">Couldn't load products</p>
        <p class="body-md text-muted mt-sm">Make sure the backend services are running.</p>
        <button class="btn btn--secondary mt-md" onclick="location.reload()">Retry</button>
      </div>`}finally{v=!1}}let S;function c(){clearTimeout(S),S=setTimeout(k,0)}C();Promise.all([O(),ee()]).then(()=>{te(),ne(),k()});
