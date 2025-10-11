const CURRENCY="₡";
const WHATSAPP_PHONE="";
const DEFAULT_OPTIONS={protein:["Carne","Pollo","Sin proteína"],toppings:[{id:"aderezo",label:"Aderezo",default:!0},{id:"queso",label:"Queso",default:!0},{id:"salsas",label:"Salsas",default:!0}]};
let DATA=null;let cart=JSON.parse(localStorage.getItem("ts_cart")||"[]");
const qs=(s,el=document)=>el.querySelector(s);
const productsEl=qs("#products"),tabsEl=qs("#categoryTabs"),searchInput=qs("#searchInput"),cartCountEl=qs("#cartCount"),cartTotalEl=qs("#cartTotal"),cartModal=qs("#cartModal"),cartItemsEl=qs("#cartItems"),cartTotalModalEl=qs("#cartTotalModal"),orderNotesEl=qs("#orderNotes"),custNameEl=qs("#custName"),deliveryTypeEl=qs("#deliveryType"),custAddressEl=qs("#custAddress"),payMethodEl=qs("#payMethod");
const itemOptionsModal=qs("#itemOptionsModal"),optTitle=qs("#optTitle"),optBody=qs("#optBody"),optCloseBtn=qs("#optCloseBtn"),optAddBtn=qs("#optAddBtn"),optQtyInput=qs("#optQty"),optQtyMinus=qs("#optQtyMinus"),optQtyPlus=qs("#optQtyPlus");
let _currentItemForOptions=null;
function money(n){return new Intl.NumberFormat('es-CR').format(n)}
async function loadData(){
  const res=await fetch("data.json?_="+Date.now());
  if(!res.ok) throw new Error("No se pudo cargar data.json");
  const data=await res.json(); DATA=data;
  if(data.brand?.name) qs("#brand-name").textContent=data.brand.name;
  if(data.whatsapp_phone) window.__WAPP=String(data.whatsapp_phone); else if(WHATSAPP_PHONE) window.__WAPP=WHATSAPP_PHONE; else window.__WAPP="50624610007";
  renderTabs(); renderProducts(data.categories?.[0]?.id||null); updateCartBadge();
}
function renderTabs(){
  tabsEl.innerHTML=""; (DATA.categories||[]).forEach((cat,idx)=>{
    const b=document.createElement("button"); b.className="tab"+(idx===0?" active":""); b.textContent=cat.name; b.dataset.cat=cat.id;
    b.addEventListener("click",()=>{ tabsEl.querySelectorAll(".tab").forEach(x=>x.classList.remove("active")); b.classList.add("active"); renderProducts(cat.id); });
    tabsEl.appendChild(b);
  });
}
function normText(s){return (s||"").toLowerCase()}
function renderProducts(catId){
  productsEl.innerHTML=""; const term=normText(searchInput.value); let items=[];
  (DATA.categories||[]).forEach(c=>{ if(!catId||c.id===catId){ (c.items||[]).forEach(it=>{ if(!it.options) it.options=JSON.parse(JSON.stringify(DEFAULT_OPTIONS)); items.push({...it,_cat:c}); }); } });
  if(term){ items=items.filter(i=> normText(i.name).includes(term)); }
  items.forEach(item=>{
    const card=document.createElement("article"); card.className="card";
    card.innerHTML=`
      <img src="${item.img||'assets/placeholder.jpg'}" alt="${item.name}">
      <div class="p16">
        <div style="display:flex;justify-content:space-between;gap:8px;align-items:center">
          <div>
            <div style="font-weight:700">${item.name}</div>
            <div class="price">${CURRENCY}${money(item.price)}</div>
          </div>
          <button class="cta add-btn">Agregar</button>
        </div>
      </div>`;
    card.querySelector(".add-btn").addEventListener("click",()=>{ if(item.options) openItemOptions(item); else addToCart({...item,quantity:1,note:""}); });
    productsEl.appendChild(card);
  });
}
searchInput.addEventListener("input",()=>{ const active=tabsEl.querySelector(".tab.active"); renderProducts(active?.dataset.cat||null); });
function updateCartBadge(){
  const totalQty=cart.reduce((a,b)=>a+(b.quantity||1),0);
  const totalSum=cart.reduce((a,b)=>a+(b.price*(b.quantity||1)),0);
  cartCountEl.textContent=totalQty; cartTotalEl.textContent=money(totalSum);
}
function saveCart(){ localStorage.setItem("ts_cart", JSON.stringify(cart)); }
function renderCart(){
  cartItemsEl.innerHTML="";
  if(cart.length===0){ cartItemsEl.innerHTML=`<p>Tu carrito está vacío.</p>`; }
  else {
    cart.forEach((item,idx)=>{
      const line=document.createElement("div"); line.className="line";
      line.innerHTML=`
        <div>
          <div><strong>${item.name}</strong> x${item.quantity||1} — ${CURRENCY}${money(item.price*(item.quantity||1))}</div>
          ${item.note?`<div class="note">(${item.note})</div>`:""}
        </div>
        <div style="display:flex;gap:6px">
          <button class="icon-btn" data-act="minus">−</button>
          <button class="icon-btn" data-act="plus">+</button>
          <button class="icon-btn" data-act="del">🗑️</button>
        </div>`;
      line.querySelector('[data-act="minus"]').addEventListener("click",()=>{ item.quantity=Math.max(1,(item.quantity||1)-1); saveCart(); renderCart(); updateCartBadge(); });
      line.querySelector('[data-act="plus"]').addEventListener("click",()=>{ item.quantity=(item.quantity||1)+1; saveCart(); renderCart(); updateCartBadge(); });
      line.querySelector('[data-act="del"]').addEventListener("click",()=>{ cart.splice(idx,1); saveCart(); renderCart(); updateCartBadge(); });
      cartItemsEl.appendChild(line);
    });
  }
  const total=cart.reduce((a,b)=>a+(b.price*(b.quantity||1)),0);
  cartTotalModalEl.textContent=money(total);
}
function addToCart(item){
  const key=`${item.id}::${item.note||""}`;
  const found=cart.find(x=> `${x.id}::${x.note||""}`===key);
  if(found){ found.quantity=(found.quantity||1)+(item.quantity||1); }
  else { cart.push({id:item.id,name:item.name,price:item.price,note:item.note||"",quantity:item.quantity||1}); }
  saveCart(); updateCartBadge();
}
function openCartModal(){ renderCart(); cartModal.classList.add("show"); cartModal.setAttribute("aria-hidden","false"); }
function closeCartModal(){ cartModal.classList.remove("show"); cartModal.setAttribute("aria-hidden","true"); }
qs("#openCartBtn").addEventListener("click", openCartModal);
qs("#openCartBtnFooter").addEventListener("click", openCartModal);
qs("#closeCartBtn").addEventListener("click", closeCartModal);
cartModal.addEventListener("click",(e)=>{ if(e.target===cartModal) closeCartModal(); });
qs("#clearCartBtn").addEventListener("click",()=>{ cart=[]; saveCart(); renderCart(); updateCartBadge(); });
qs("#sendWhatsAppBtn").addEventListener("click",()=>{
  if(cart.length===0) return;
  const lines=cart.map(it=>`- ${it.name} x${it.quantity}${it.note?` (${it.note})`:''} = ${CURRENCY}${money(it.price*it.quantity)}`);
  const total=cart.reduce((a,b)=>a+b.price*b.quantity,0);
  const info=[`Nombre: ${custNameEl.value||'-'}`,`Entrega: ${deliveryTypeEl.value}`,`Dirección/Mesa: ${custAddressEl.value||'-'}`,`Pago: ${payMethodEl.value}`].join("\n");
  const text=`*Pedido Taco's Serrano*\n\n${lines.join("\n")}\n\n*Total:* ${CURRENCY}${money(total)}\n\n${info}\n\n${orderNotesEl.value?`Notas: ${orderNotesEl.value}\n`:''}`;
  const url=`https://wa.me/${encodeURIComponent(window.__WAPP||"50624610007")}?text=${encodeURIComponent(text)}`;
  window.open(url,"_blank");
});
function openItemOptions(item){
  _currentItemForOptions=item; optTitle.textContent=item.name; optQtyInput.value=1;
  const opts={...DEFAULT_OPTIONS, ...(item.options||{})};
  let html="";
  html+=`<div class="option-group"><h4>Proteína</h4><select id="optProtein" class="opt-protein-select">${opts.protein.map(p=>`<option value="${p}">${p}</option>`).join('')}</select></div>`;
  html+=`<div class="option-group"><h4>Preferencias</h4><div class="opt-toppings">${opts.toppings.map(t=>`
      <label class="opt-chip">
        <input type="checkbox" class="opt-top" value="${t.id}" ${t.default?'checked':''}>
        <span>${t.label}</span>
      </label>`).join('')}</div></div>`;
  optBody.innerHTML=html;
  itemOptionsModal.classList.add("show"); itemOptionsModal.setAttribute("aria-hidden","false");
}
function closeItemOptions(){ itemOptionsModal.classList.remove("show"); itemOptionsModal.setAttribute("aria-hidden","true"); _currentItemForOptions=null; }
qs("#optCloseBtn").addEventListener("click", closeItemOptions);
itemOptionsModal.addEventListener("click",(e)=>{ if(e.target===itemOptionsModal) closeItemOptions(); });
qs("#optQtyMinus").addEventListener("click",()=>{ const n=Math.max(1,parseInt(optQtyInput.value||"1",10)-1); optQtyInput.value=n; });
qs("#optQtyPlus").addEventListener("click",()=>{ const n=Math.max(1,parseInt(optQtyInput.value||"1",10)+1); optQtyInput.value=n; });
qs("#optAddBtn").addEventListener("click",()=>{
  if(!_currentItemForOptions) return;
  const qty=Math.max(1,parseInt(optQtyInput.value||"1",10));
  const proteinSel=qs("#optProtein"); const protein=proteinSel?proteinSel.value:null;
  const tops=Array.from(optBody.querySelectorAll(".opt-top"));
  const disabled=tops.filter(ch=>!ch.checked).map(ch=>ch.nextElementSibling?.textContent?.trim()).filter(Boolean);
  const parts=[]; if(protein) parts.push(protein);
  if(disabled.length===1){ parts.push(`sin ${disabled[0].toLowerCase()}`); }
  else if(disabled.length>1){ const last=disabled.pop(); parts.push(`sin ${disabled.map(s=>s.toLowerCase()).join(', ')} y ${last.toLowerCase()}`); }
  const note=parts.join(", ");
  addToCart({..._currentItemForOptions, quantity:qty, note}); closeItemOptions(); openCartModal();
});
loadData().catch(err=>{ productsEl.innerHTML=`<div style="padding:16px;color:#b00">No se pudo cargar el menú (data.json). ${err?.message||''}</div>`; });
