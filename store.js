/* Margot Acessórios · Vitrine V1
 * Substitua os itens do catálogo por seus produtos reais antes de abrir as vendas.
 * Checkout não é integrado: o pedido é copiado para atendimento manual.
 */
'use strict';
const STORE = {
  name: 'Margot Acessórios',
  currency: 'BRL',
  preview: true,
  products: [
    {id:'brinco-coracao',name:'Brinco Coração Dourado',category:'Brincos',price:14.90},
    {id:'colar-perola',name:'Colar Pérola Delicada',category:'Colares',price:21.90},
    {id:'pulseira-coracao',name:'Pulseira Coração',category:'Pulseiras',price:18.90},
    {id:'argola-classica',name:'Argola Clássica',category:'Brincos',price:14.90},
    {id:'anel-onda',name:'Anel Onda Dourado',category:'Anéis',price:15.90},
    {id:'brinco-luz',name:'Brinco Ponto de Luz',category:'Brincos',price:14.90},
    {id:'colar-coracao',name:'Colar Coração',category:'Colares',price:27.90},
    {id:'kit-delicado',name:'Kit Delicadeza',category:'Kits',price:39.90}
  ]
};
const ICONS = {
  menu:'<path d="M4 6h16M4 12h16M4 18h16"/>',
  close:'<path d="M5 5l14 14M19 5L5 19"/>',
  search:'<circle cx="11" cy="11" r="7"/><path d="m16.5 16.5 4.5 4.5"/>',
  heart:'<path d="M20.8 8.6c0 4.4-8.8 10.7-8.8 10.7S3.2 13 3.2 8.6a4.7 4.7 0 0 1 8.8-2.1 4.7 4.7 0 0 1 8.8 2.1Z"/>',
  bag:'<path d="M4 8h16l-1.3 12H5.3L4 8Z"/><path d="M9 9V6a3 3 0 0 1 6 0v3"/>',
  truck:'<path d="M2 5h12v12H2zM14 10h4l4 4v3h-8"/><circle cx="6" cy="18" r="2"/><circle cx="18" cy="18" r="2"/>',
  shield:'<path d="M12 2 4 5v6c0 5 3.4 8.5 8 11 4.6-2.5 8-6 8-11V5l-8-3Z"/><path d="m8 12 3 3 5-6"/>',
  gift:'<rect x="3" y="9" width="18" height="12" rx="1"/><path d="M2 9h20M12 9v12M12 9c-3-5-8-6-8-2 0 2 2 2 8 2Zm0 0c3-5 8-6 8-2 0 2-2 2-8 2Z"/>'
};
function icon(name){return `<svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">${ICONS[name]||ICONS.heart}</svg>`}
const money = n => new Intl.NumberFormat('pt-BR',{style:'currency',currency:STORE.currency}).format(n);
const $ = id => document.getElementById(id);
const getItem = id => STORE.products.find(p=>p.id===id);
function readStorage(name,fallback){try{const parsed=JSON.parse(localStorage.getItem('margot-'+name));return parsed===null?fallback:parsed}catch{return fallback}}
function saveStorage(name,value){try{localStorage.setItem('margot-'+name,JSON.stringify(value))}catch{}}
const MAX_QUANTITY = 99;
const initialCart = readStorage('cart', {});
const storedCart = initialCart && typeof initialCart === 'object' && !Array.isArray(initialCart)
  ? initialCart : {};
// Recupera também sacolas antigas que excederam o limite, sem perder o item.
const cart = Object.fromEntries(Object.entries(storedCart)
  .filter(([id, quantity]) => getItem(id) && Number.isSafeInteger(quantity) && quantity > 0)
  .map(([id, quantity]) => [id, Math.min(MAX_QUANTITY, quantity)]));
const favoriteList=readStorage('favorites',[]);
const favorites=new Set(Array.isArray(favoriteList)?favoriteList.filter(id=>getItem(id)):[]);
let category='Todos',query='',drawerMode='cart',previousFocus=null,toastTimer;
const categories=['Brincos','Colares','Pulseiras','Anéis','Kits'];
// A categoria da URL é a fonte de verdade para recarregamento, links e voltar/avançar.
function categoryFromUrl(){
  const selected=new URLSearchParams(window.location.search).get('categoria');
  return categories.includes(selected) ? selected : 'Todos';
}
category=categoryFromUrl();
function writeCategoryUrl(selected){
  const url=new URL(window.location.href);
  if(selected==='Todos')url.searchParams.delete('categoria');
  else url.searchParams.set('categoria',selected);
  url.hash='produtos';
  const next=url.pathname+url.search+url.hash;
  const current=window.location.pathname+window.location.search+window.location.hash;
  if(next!==current)window.history.pushState({margotCategory:selected},'',next);
}
function notifyCategoryChange(){
  window.dispatchEvent(new CustomEvent('margot:categorychange',{detail:{category}}));
}
function restoreCategoryFromUrl(){
  const restored=categoryFromUrl();
  if(restored!==category){
    category=restored;
    renderFilters();
    renderProducts();
  }
  notifyCategoryChange();
}
window.addEventListener('popstate',restoreCategoryFromUrl);
function populateIcons(root=document){root.querySelectorAll('[data-icon]').forEach(el=>{el.innerHTML=icon(el.dataset.icon)})}
function renderCategories(){
  const images={Brincos:'brincos',Colares:'colares',Pulseiras:'pulseiras','Anéis':'aneis',Kits:'kits'};
  $('category-grid').innerHTML=categories.map(c=>`<button class="category-card category-card-photo" type="button" data-cat="${c}" aria-label="Ver ${c}"><img class="category-photo" src="./assets/categories/${images[c]}.webp" alt="" width="300" height="404" loading="lazy" decoding="async"><span class="visually-hidden">${c}</span></button>`).join('');
  $('category-grid').querySelectorAll('[data-cat]').forEach(el=>el.addEventListener('click',()=>chooseCategory(el.dataset.cat)))
}
function renderFilters() {
  const root = $('category-chips');
  if (!root.children.length) {
    root.innerHTML = ['Todos', ...categories].map(c => `<button type="button" class="chip" data-filter="${c}">${c}</button>`).join('');
    root.addEventListener('click', event => {
      const button = event.target.closest('[data-filter]');
      if (button) chooseCategory(button.dataset.filter, false);
    });
  }
  root.querySelectorAll('[data-filter]').forEach(button => {
    button.setAttribute('aria-pressed', String(category === button.dataset.filter));
  });
}
function filteredProducts(){return STORE.products.filter(p=>(category==='Todos'||p.category===category)&&`${p.name} ${p.category}`.toLocaleLowerCase('pt-BR').includes(query.toLocaleLowerCase('pt-BR')))}
const PRODUCT_PLACEHOLDER = './assets/foto-em-breve.webp';
function productImage(p){
  const hasPhoto = typeof p.image === 'string' && p.image.trim().length > 0;
  return `<img class="product-photo" src="${hasPhoto ? p.image : PRODUCT_PLACEHOLDER}" alt="${hasPhoto ? `Foto de ${p.name}` : `Foto de ${p.name} em breve`}" loading="lazy" decoding="async">`;
}
function applyProductPhotoFallback(root){
  root.addEventListener('error', event => {
    const img = event.target;
    if (!(img instanceof HTMLImageElement) || !img.matches('img.product-photo')) return;
    if (img.getAttribute('src') === PRODUCT_PLACEHOLDER) return;
    img.src = PRODUCT_PLACEHOLDER;
    img.alt = 'Foto em breve';
  }, true);
}
function syncSearchBadge(){const el=$('active-search');if(el){el.hidden=!query;el.querySelector('[data-search-term]').textContent=query}}
function renderProducts(){const found=filteredProducts();$('product-grid').innerHTML=found.map(p=>`<article class="product-card"><div class="product-visual"><span class="demo-tag">Foto em breve</span>${productImage(p)}<button class="heart-btn" type="button" data-favorite="${p.id}" aria-pressed="${favorites.has(p.id)}" aria-label="${favorites.has(p.id)?'Remover dos':'Adicionar aos'} favoritos: ${p.name}"><span class="icon" data-icon="heart"></span></button></div><div class="product-info"><span class="category-label">${p.category}</span><h3>${p.name}</h3><span class="price">${money(p.price)}</span><button class="add-to-cart" type="button" data-add="${p.id}" aria-label="Adicionar ${p.name} à sacola"><span class="icon" data-icon="bag"></span></button></div></article>`).join('');populateIcons($('product-grid'));$('catalog-status').textContent=`${found.length} ${found.length===1?'produto':'produtos'} em exibição`;$('empty-results').hidden=found.length>0;syncSearchBadge();document.querySelectorAll('[data-add]').forEach(el=>el.addEventListener('click',()=>addToCart(el.dataset.add)));document.querySelectorAll('[data-favorite]').forEach(el=>el.addEventListener('click',()=>toggleFavorite(el.dataset.favorite)))}
function chooseCategory(c,scroll=true){
  if(c!=='Todos'&&!categories.includes(c))return;
  query='';$('search-input').value='';$('clear-search').hidden=true;
  window.dispatchEvent(new CustomEvent('margot:search-close'));
  category=c;
  renderFilters();
  renderProducts();
  writeCategoryUrl(category);
  closeMobileMenu();
  notifyCategoryChange();
  if(scroll){$('produtos').focus({preventScroll:true});$('produtos').scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});}
}
function updateCounts(){const num=Object.values(cart).reduce((a,n)=>a+n,0);$('cart-count').textContent=num;$('cart-count').hidden=!num;$('favorite-count').textContent=favorites.size;$('favorite-count').hidden=!favorites.size}
function addToCart(id) {
  if (!getItem(id)) return;
  if ((cart[id] || 0) >= MAX_QUANTITY) {
    notify(`O limite é de ${MAX_QUANTITY} unidades por peça.`);
    return;
  }
  cart[id] = (cart[id] || 0) + 1;
  saveStorage('cart', cart);
  updateCounts();
  notify('Peça adicionada à sacola');
  if ($('drawer').classList.contains('open')) renderDrawer();
}
function toggleFavorite(id) {
  const product = getItem(id);
  if (!product) return;
  favorites.has(id) ? favorites.delete(id) : favorites.add(id);
  saveStorage('favorites', [...favorites]);
  updateCounts();
  // Atualizar o botão existente preserva foco, posição e animação do catálogo.
  document.querySelectorAll('[data-favorite]').forEach(button => {
    if (button.dataset.favorite !== id) return;
    button.setAttribute('aria-pressed', String(favorites.has(id)));
    button.setAttribute('aria-label', `${favorites.has(id) ? 'Remover dos' : 'Adicionar aos'} favoritos: ${product.name}`);
  });
  if ($('drawer').classList.contains('open')) renderDrawer();
  notify(favorites.has(id) ? 'Adicionado aos favoritos' : 'Removido dos favoritos');
}
function changeQuantity(id, delta) {
  if (!getItem(id) || !Number.isSafeInteger(delta)) return;
  const next = (cart[id] || 0) + delta;
  if (next > MAX_QUANTITY) {
    notify(`O limite é de ${MAX_QUANTITY} unidades por peça.`);
    return;
  }
  if (next <= 0) delete cart[id];
  else cart[id] = next;
  saveStorage('cart', cart);
  updateCounts();
  renderDrawer();
}
function cartLine(p){return `<div class="drawer-item"><div class="drawer-item-thumb">${productImage(p)}</div><div><h3>${p.name}</h3><p>${money(p.price)} · Prévia</p><div class="quantity"><button type="button" data-qty="${p.id}" data-delta="-1" aria-label="Remover uma unidade de ${p.name}">−</button><span>${cart[p.id]}</span><button type="button" data-qty="${p.id}" data-delta="1" aria-label="Adicionar uma unidade de ${p.name}">+</button></div></div><button type="button" class="remove" data-remove="${p.id}" aria-label="Excluir ${p.name} da sacola">×</button></div>`}
function favoriteLine(p){return `<div class="drawer-item"><div class="drawer-item-thumb">${productImage(p)}</div><div><h3>${p.name}</h3><p>${money(p.price)} · Prévia</p><button class="text-link" type="button" data-fav-add="${p.id}">Adicionar à sacola</button></div><button type="button" class="remove" data-fav-remove="${p.id}" aria-label="Remover ${p.name} dos favoritos">×</button></div>`}
function captureDrawerFocus() {
  const active = document.activeElement;
  const drawer = $('drawer');
  if (!drawer.contains(active) || active === $('drawer-close')) return () => {};
  const buttons = [...$('drawer-items').querySelectorAll('button')];
  const index = buttons.indexOf(active);
  const attributes = ['data-qty', 'data-delta', 'data-remove', 'data-fav-remove', 'data-fav-add']
    .filter(name => active.hasAttribute(name)).map(name => [name, active.getAttribute(name)]);
  const id = active.id;
  return () => {
    const updated = [...$('drawer-items').querySelectorAll('button')];
    const equivalent = attributes.length && updated.find(button =>
      attributes.every(([name, value]) => button.getAttribute(name) === value));
    const target = (id && $(id)) || equivalent || updated[Math.min(index, updated.length - 1)] || $('drawer-close');
    target.focus({preventScroll: true});
  };
}
const drawerBackground = new Map();
let drawerOverflow = '';
function renderDrawer(){const restoreFocus = captureDrawerFocus();const isCart=drawerMode==='cart';$('drawer-title').textContent=isCart?'Sua sacola':'Meus favoritos';let items=isCart?Object.keys(cart).map(getItem):[...favorites].map(getItem);items=items.filter(Boolean);$('drawer-items').innerHTML=items.length?items.map(isCart?cartLine:favoriteLine).join(''):`<div class="drawer-empty"><span class="icon" data-icon="${isCart?'bag':'heart'}"></span><p>${isCart?'Sua sacola ainda está vazia.':'Você ainda não salvou favoritos.'}</p><p>Descubra os detalhes da coleção Margot.</p></div>`;populateIcons($('drawer-items'));if(isCart&&items.length){const subtotal=items.reduce((s,p)=>s+p.price*cart[p.id],0);$('drawer-footer').innerHTML=`<div class="subtotal"><span>Subtotal estimado</span><span>${money(subtotal)}</span></div><p class="checkout-note">Valores ilustrativos. Não há cobrança automática nem reserva de estoque. O pedido deve ser confirmado com a loja.</p><button type="button" id="copy-order" class="button primary">Copiar lista de interesse</button><button type="button" id="continue-shopping" class="button outline">Continuar olhando</button>`;$('copy-order').addEventListener('click',copyOrder);$('continue-shopping').addEventListener('click',closeDrawer)}else{$('drawer-footer').innerHTML=`<button class="button outline" type="button" id="continue-shopping">Explorar coleção</button>`;$('continue-shopping').addEventListener('click',closeDrawer)}$('drawer-items').querySelectorAll('[data-qty]').forEach(btn=>btn.addEventListener('click',()=>changeQuantity(btn.dataset.qty,Number(btn.dataset.delta))));$('drawer-items').querySelectorAll('[data-remove]').forEach(btn=>btn.addEventListener('click',()=>changeQuantity(btn.dataset.remove,-99)));$('drawer-items').querySelectorAll('[data-fav-remove]').forEach(btn=>btn.addEventListener('click',()=>toggleFavorite(btn.dataset.favRemove)));$('drawer-items').querySelectorAll('[data-fav-add]').forEach(btn=>btn.addEventListener('click',()=>addToCart(btn.dataset.favAdd)));restoreFocus();}
function openDrawer(mode, opener = document.activeElement) {
  closeMobileMenu();
  window.dispatchEvent(new CustomEvent('margot:search-close'));
  const drawer = $('drawer');
  if (!drawer.classList.contains('open')) {
    previousFocus = opener;
    drawerOverflow = document.body.style.overflow;
    for (const element of document.body.children) {
      if (['drawer', 'overlay', 'toast'].includes(element.id) || element.tagName === 'SCRIPT') continue;
      drawerBackground.set(element, element.inert);
      element.inert = true;
    }
  }
  drawerMode = mode;
  renderDrawer();
  drawer.inert = false;
  drawer.setAttribute('aria-hidden', 'false');
  $('overlay').hidden = false;
  drawer.classList.add('open');
  $('overlay').classList.add('show');
  document.body.style.overflow = 'hidden';
  $('drawer-close').focus({preventScroll: true});
}
function closeDrawer() {
  const drawer = $('drawer');
  if (!drawer.classList.contains('open')) return;
  drawer.classList.remove('open');
  $('overlay').classList.remove('show');
  $('overlay').hidden = true;
  for (const [element, previous] of drawerBackground) element.inert = previous;
  drawerBackground.clear();
  document.body.style.overflow = drawerOverflow;
  if (previousFocus?.isConnected && previousFocus.getClientRects().length) {
    previousFocus.focus({preventScroll: true});
  }
  drawer.inert = true;
  drawer.setAttribute('aria-hidden', 'true');
}

async function copyOrder() {
  const items = Object.keys(cart).map(getItem).filter(Boolean);
  if (!items.length) return;
  const lines = items.map(p => `• ${p.name} — ${cart[p.id]} un. × ${money(p.price)}`);
  const subtotal = items.reduce((sum, p) => sum + p.price * cart[p.id], 0);
  const msg = `Olá! Tenho interesse nestas peças da Margot Acessórios:\n${lines.join('\n')}\nSubtotal demonstrativo: ${money(subtotal)}\nGostaria de confirmar disponibilidade, valores e entrega.`;
  const fallback = () => {
    const active = document.activeElement;
    const textarea = document.createElement('textarea');
    textarea.value = msg;
    textarea.setAttribute('aria-label', 'Lista de interesse para copiar');
    textarea.style.cssText = 'position:fixed;left:-9999px;top:0;font-size:16px';
    // O campo temporário deve ficar dentro do diálogo, pois o fundo está inerte.
    $('drawer').appendChild(textarea);
    try {
      textarea.focus({preventScroll: true});
      textarea.select();
      textarea.setSelectionRange(0, textarea.value.length);
      if (!document.execCommand('copy')) throw new Error('Falha ao copiar');
    } finally {
      textarea.remove();
      if (active?.isConnected && !active.closest('[inert]')) active.focus({preventScroll: true});
    }
  };
  try {
    if (navigator.clipboard?.writeText) {
      try { await navigator.clipboard.writeText(msg); }
      catch { fallback(); }
    } else {
      fallback();
    }
    notify('Lista copiada. Cole no atendimento da loja quando estiver disponível.');
  } catch {
    notify('Não foi possível copiar automaticamente. Tente novamente ou anote as peças da sacola.');
  }
}
function notify(msg){const el=$('toast');el.textContent=msg;el.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('show'),2800)}
function closeMobileMenu(){window.dispatchEvent(new CustomEvent('margot:menu-close'))}
function init(){applyProductPhotoFallback($('product-grid'));applyProductPhotoFallback($('drawer-items'));populateIcons();renderCategories();renderFilters();renderProducts();updateCounts();$('drawer').inert=true;$('year').textContent=new Date().getFullYear();$('cart-open').addEventListener('click',event=>openDrawer('cart',event.currentTarget));$('favorites-open').addEventListener('click',event=>openDrawer('favorites',event.currentTarget));window.addEventListener('margot:drawer-open',event=>{if(['cart','favorites'].includes(event.detail?.mode))openDrawer(event.detail.mode,event.detail.opener)});$('drawer-close').addEventListener('click',closeDrawer);$('overlay').addEventListener('click',closeDrawer);$('show-all').addEventListener('click',()=>chooseCategory('Todos'));$('search-input').addEventListener('input',e=>{query=e.target.value.trim();$('clear-search').hidden=!query;renderProducts()});$('search-form').addEventListener('submit',e=>{e.preventDefault();window.dispatchEvent(new CustomEvent('margot:search-close'));$('produtos').focus({preventScroll:true});$('produtos').scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});$('search-input').blur()});$('clear-search').addEventListener('click',()=>{query='';$('search-input').value='';$('clear-search').hidden=true;renderProducts();$('search-input').focus()});$('clear-active-search').addEventListener('click',()=>{query='';$('search-input').value='';$('clear-search').hidden=true;renderProducts()});document.querySelectorAll('[data-category-link]').forEach(link=>link.addEventListener('click',e=>{e.preventDefault();chooseCategory(link.dataset.categoryLink)}));document.addEventListener('keydown',e=>{if(e.key==='Escape'&&$('drawer').classList.contains('open'))closeDrawer();if(e.key==='Tab'&&$('drawer').classList.contains('open')){const nodes=[...$('drawer').querySelectorAll('button:not([disabled]),a[href],input:not([disabled])')].filter(n=>n.getClientRects().length);if(!nodes.length)return;const first=nodes[0],last=nodes[nodes.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}else if(!e.shiftKey&&(document.activeElement===last||!$('drawer').contains(document.activeElement))){e.preventDefault();first.focus()}}})}
document.addEventListener('DOMContentLoaded',init);