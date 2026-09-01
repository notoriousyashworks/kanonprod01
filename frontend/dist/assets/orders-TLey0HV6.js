import{g as P,k as H,n as M,j,o as B,p as U,q as F,h as S,B as V}from"./login-modal.js_v_1-piEKMiWK.js";/* empty css                       */import{i as q,g as _}from"./profile-BNE5rrE9.js";import{i as W,a as G}from"./cart-sidebar-B4Ab0AY2.js";P()||(window.location.href="/?login=1");document.getElementById("navbar-container").innerHTML=H();M();j();q();B();W();U();F();G();const v=document.getElementById("orders-list-view"),k=document.getElementById("order-detail-view");let d=[];function Y(e){const t=String(e??"").trim();return t&&t.toLowerCase()!=="one size"&&t.toLowerCase()!=="n/a"}const L={ORDER_PLACED:"Order Placed",ORDER_CONFIRMED:"Order Confirmed",ORDER_DISPATCHED:"Order Dispatched",ORDER_DELIVERED:"Order Delivered",CANCELLED:"Cancelled",PENDING_REVIEW:"Pending Review",PENDING:"Processing",CONFIRMED:"Confirmed",SHIPPED:"On its way",DELIVERED:"Delivered"};function D(e,t=!0){if(!e)return"Unknown date";try{const r=new Date(e),i={day:"numeric",month:"short"};return t&&(i.year="numeric"),r.toLocaleDateString("en-IN",i)}catch{return e}}async function J(){const e=await _();return e?await Promise.all(e.map(async t=>{const r=await Promise.all((t.items||[]).map(async i=>{var l,u;try{const s=await V(i.productId),o=(l=s==null?void 0:s.variants)==null?void 0:l.find(p=>p.id===i.variantId);return{...i,productName:(s==null?void 0:s.name)||i.productName||"Product",productImage:((u=s==null?void 0:s.imageUrls)==null?void 0:u[0])||i.productImage||i.imageUrl||"https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=2370",size:(o==null?void 0:o.size)||i.size||"",price:i.purchasePrice||i.price||0}}catch{return{...i,productName:i.productName||"Product",productImage:i.productImage||i.imageUrl||"https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=2370",size:i.size||"",price:i.purchasePrice||i.price||0}}}));return{...t,items:r,total:t.totalAmount,placedAt:t.createdAt,orderId:t.orderNumber}})):[]}function O(){if(v.style.display="block",k.style.display="none",!d||d.length===0){v.innerHTML=`
      <div class="orders-empty">
        <div class="orders-empty-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
            <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
            <line x1="12" y1="22.08" x2="12" y2="12"></line>
          </svg>
        </div>
        <h2>No orders yet</h2>
        <p>Looks like you haven't placed any orders yet.<br>Discover our latest collection of premium kicks.</p>
        <a href="/products" class="orders-empty-btn">Start Shopping</a>
      </div>`;return}const e=d.map((t,r)=>{var y;const i=t.orderId?`${t.orderId}`:`Order ${d.length-r}`,l=(t.total||0).toLocaleString("en-IN",{minimumFractionDigits:2}),u=L[t.status]||L[(t.status||"").toUpperCase()]||"Order Placed";(t.items||[]).reduce((m,w)=>m+(w.quantity||1),0);const s=D(t.placedAt),o=(y=t.items)==null?void 0:y[0],p=o!=null&&o.productImage?S(o.productImage):"",E=p?`<img src="${p}" alt="${o==null?void 0:o.productName}" loading="lazy" />`:'<div style="width:100%; height:100%; display:flex; align-items:center; justify-content:center; font-size:24px;">👟</div>';let b=(o==null?void 0:o.productName)||"Sneakers";return t.items&&t.items.length>1&&(b+=` (+${t.items.length-1})`),`
      <div class="new-order-card" data-index="${r}">
        <div class="noc-image">${E}</div>
        <div class="noc-info">
          <h3 class="noc-status">${b}</h3>
          <p class="noc-meta">#${i}</p>
          <div class="noc-extra-row">
            <span class="noc-chip noc-chip--status">${u}</span>
            <span class="noc-chip">${s}</span>
          </div>
        </div>
        <div class="noc-actions">
          <p class="noc-total">₹${l}</p>
          <button class="noc-details-btn" type="button">View Details</button>
        </div>
      </div>
    `}).join("");v.innerHTML=`
    <div class="orders-page-head">
      <div>
        <a href="/" class="account-back-btn">
          <span aria-hidden="true">←</span>
          Back
        </a>
        <h1>My Orders</h1>
        <p>Track your purchases, payments, and delivery updates in one place.</p>
      </div>
    </div>
    <div class="orders-list-stack">
      ${e}
    </div>
  `,v.querySelectorAll(".new-order-card").forEach(t=>{t.addEventListener("click",()=>{const r=t.getAttribute("data-index");history.pushState({view:"orderDetail",idx:r},"","#detail"),R(d[r],d.length-r)})})}function R(e,t){v.style.display="none",k.style.display="block";const r=e.orderId?`${e.orderId}`:`Order ${t}`,i=(e.total||0).toLocaleString("en-IN",{minimumFractionDigits:2});let l=0;(e.items||[]).forEach(a=>{l+=a.quantity||1});const u=(e.paymentMethod||"").toUpperCase()==="PREPAID",s=!u&&l>0?l*99:0;let p=(e.totalPrice||e.total||0)-s;p<0&&(p=0);const E=p.toLocaleString("en-IN",{minimumFractionDigits:2}),b=s>0?`₹${s.toLocaleString("en-IN",{minimumFractionDigits:2})}`:"Free",y=(e.items||[]).map(a=>{const c=a.productImage?S(a.productImage):"",C=c?`<img src="${c}" />`:"",I=((a.price||0)*(a.quantity||1)).toLocaleString("en-IN",{minimumFractionDigits:2});return`
      <div class="od-item">
        <div class="od-item-img">
          ${C}
          <div class="od-item-qty">${a.quantity||1}</div>
        </div>
        <div class="od-item-info">
          <h4>${a.productName||"Product"}</h4>
          ${Y(a.size)?`<p>${a.size}</p>`:""}
        </div>
        <div class="od-item-price">₹${I}</div>
      </div>
    `}).join(""),m=e.shippingAddress||{},w=[m.houseNumberOrAddress,m.landmark,m.city,m.state,m.pinCode,"India"].filter(Boolean).join("<br>"),x=P()||{};x.email;const $=x.phoneNumber||m.phone||"",A=[x.firstName,x.lastName].filter(Boolean).join(" ")||"Guest";let n="PLACED";const f=(e.status||"").toUpperCase();f.includes("CONFIRM")&&(n="CONFIRMED"),(f.includes("DISPATCH")||f.includes("SHIP"))&&(n="DISPATCHED"),f.includes("DELIVER")&&(n="DELIVERED"),f.includes("CANCEL")&&(n="CANCELLED"),f.includes("RETURN")&&(n="RETURNED");const h=D(e.placedAt,!1);let g=[];g.push({title:'Order Placed <span style="font-weight: normal;">(pls wait for confirmation by Sales Team! They will reach out to you on Whats app)</span>',date:h,status:n==="PLACED"?"active":"completed",emoji:"🛒"}),["CONFIRMED","DISPATCHED","DELIVERED","RETURNED"].includes(n)&&g.push({title:"Order Confirmed",date:h,status:n==="CONFIRMED"?"active":"completed",desc:n==="CONFIRMED"?"Your order has been confirmed and is being dispatched":void 0,emoji:"✅"}),["DISPATCHED","DELIVERED","RETURNED"].includes(n)&&g.push({title:"Order Dispatched",date:h,status:n==="DISPATCHED"?"active":"completed",emoji:"🚚"}),["DELIVERED"].includes(n)&&g.push({title:"Order Delivered",date:h,status:"active",emoji:"📦"}),n==="CANCELLED"&&g.push({title:"Order Cancelled",date:h,status:"active",emoji:"🚫"}),n==="RETURNED"&&g.push({title:"Order Returned",date:h,status:"active",desc:"Refund Completed",emoji:"↩️"});const T=g.reverse().map(a=>{let c="mt-icon";return a.status==="completed"?c+=" completed":a.status==="active"&&(c+=" active"),`
      <div class="mt-step ${a.status}">
        <div class="${c}">${a.emoji}</div>
        <div class="mt-content">
          <strong>${a.title}</strong>
          <span>${a.date}</span>
          ${a.desc?`<div style="font-size:13px; color:#64748b; margin-top:2px;">${a.desc}</div>`:""}
        </div>
      </div>
    `}).join("");let N="";if(n==="DISPATCHED"){const a=e.trackingId||"Pending (will be assigned shortly)",c=e.trackingLink||"#",I=a.toLowerCase().includes("pending")||c==="#"?'<button disabled style="width:100%; padding: 10px; background: #94a3b8; color: #fff; border: none; border-radius: 6px; font-weight: 600; cursor: not-allowed; font-size: 14px;">Track Order</button>':`<a href="${c}" target="_blank" style="display:block; text-align:center; width:100%; padding: 10px; background: #0f172a; color: #fff; border: none; border-radius: 6px; font-weight: 600; cursor: pointer; font-size: 14px; text-decoration: none; transition: background 0.2s;" onmouseover="this.style.background='#1e293b';" onmouseout="this.style.background='#0f172a';">Track Order</a>`;N=`
      <div style="margin-top: 24px; padding: 16px; background: #f8fafc; border-radius: 8px; font-size: 13px; color: #475569; border: 1px solid #e2e8f0;">
        <div style="margin-bottom:12px;">
          <strong style="color:#0f172a;">Tracking ID:</strong> ${a}
        </div>
        ${I}
      </div>
    `}const z=`
    
  <style>
    .modern-timeline {
      position: relative;
      padding-left: 32px;
      margin-top: 24px;
      margin-bottom: 8px;
    }
    .mt-step {
      position: relative;
      margin-bottom: 24px;
    }
    .mt-step:not(:last-child)::before {
      content: '';
      position: absolute;
      left: -20px;
      top: 26px;
      bottom: -24px;
      width: 2px;
      background: #e2e8f0;
      z-index: 1;
    }
    .mt-step:last-child {
      margin-bottom: 0;
    }
    .mt-icon {
      position: absolute;
      left: -32px;
      top: 0;
      width: 26px;
      height: 26px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #fff;
      z-index: 2;
      font-size: 14px;
      border: 2px solid #e2e8f0;
    }
    .mt-icon.completed {
      border-color: #22c55e;
    }
    .mt-icon.active {
      border-color: #22c55e;
      box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.2);
    }
    .mt-content strong {
      display: block;
      font-size: 15px;
      color: #0f172a;
      margin-bottom: 2px;
    }
    .mt-content span {
      font-size: 13px;
      color: #64748b;
    }
    .mt-step.active .mt-content strong {
      color: #111;
    }
    .mt-step.completed .mt-content strong {
      color: #475569;
    }
    .order-summary-card {
      display: flex;
      align-items: center;
      gap: 20px;
      padding: 24px;
      background: #fff;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
      margin-bottom: 20px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.02);
    }
    .osc-icon {
      font-size: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 64px;
      height: 64px;
      background: #f8fafc;
      border-radius: 50%;
      color: #0f172a;
    }
    .osc-info h3 {
      margin: 0 0 6px 0;
      font-size: 18px;
      color: #0f172a;
    }
    .osc-info p {
      margin: 0;
      color: #64748b;
      font-size: 14px;
      line-height: 1.5;
    }
  </style>
  
    
    <div class="od-card">
      <div class="modern-timeline">
        ${T}
      </div>
      ${N}
    </div>
  `;k.innerHTML=`
    <div class="od-header">
      <div class="od-header-left">
        <button id="od-back-btn" class="od-back-btn" type="button">
          <span aria-hidden="true">←</span>
          Back
        </button>
        <div>
          <h2 class="od-title">Order #${r}</h2>
          <p class="od-date">Confirmed ${D(e.placedAt,!1)}</p>
        </div>
      </div>
    </div>

    ${z}

    <div class="od-card">
      ${y}
      <div class="od-summary">
        <div class="od-summary-row"><span>Subtotal</span><span>₹${E}</span></div>
        <div class="od-summary-row"><span>Shipping</span><span>${b}</span></div>
        <div class="od-summary-row total"><span>Total</span><span><small>INR</small> ₹${i}</span></div>
      </div>
    </div>

    <div class="od-card p-0">
      <table class="od-info-table">
        <tr>
          <td>Phone number</td>
          <td>${$||"N/A"}</td>
        </tr>
        <tr>
          <td>Ship to</td>
          <td>${A}<br>${w}<br>${$}</td>
        </tr>
        <tr>
          <td>Payment</td>
          <td>${u?"Prepaid":"Cash on Delivery (COD)"}<br>₹${i} INR • ${D(e.placedAt,!1)}</td>
        </tr>
      </table>
    </div>

    <a href="https://wa.me/916239379751?text=Hi!%20I%20need%20help%20with%20an%20order%20I%20placed%0AOrder%20Id%20-%20${r}" target="_blank" style="
      position: fixed;
      bottom: 24px;
      left: 24px;
      background: #fff;
      border-radius: 30px;
      padding: 6px 16px 6px 6px;
      display: flex;
      align-items: center;
      gap: 12px;
      box-shadow: 0 4px 14px rgba(0,0,0,0.15);
      text-decoration: none;
      z-index: 100;
      transition: transform 0.2s ease;
    " onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
      <div style="
        width: 36px;
        height: 36px;
        background: #25D366;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.888-.788-1.487-1.761-1.66-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.575-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.052 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
      </div>
      <div style="display: flex; flex-direction: column; line-height: 1.2;">
        <span style="font-size: 11px; color: #64748b; font-weight: 500;">Need help with</span>
        <span style="font-size: 13px; color: #0f172a; font-weight: 700;">your order?</span>
      </div>
    </a>
  `,document.getElementById("od-back-btn").addEventListener("click",()=>{history.back()})}async function K(){history.replaceState({view:"orderList"},"",window.location.pathname),d=await J(),O()}window.addEventListener("popstate",e=>{if(e.state&&e.state.view==="orderDetail"){const t=e.state.idx;d&&d[t]&&R(d[t],d.length-t)}else O()});K();
