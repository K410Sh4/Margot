/* Margot Acessórios · Vitrine V1
 * Substitua os itens do catálogo por seus produtos reais antes de abrir as vendas.
 * Checkout não é integrado: o pedido é copiado para atendimento manual.
 */
'use strict';
let STORE = window.MargotCatalog;

const ICONS = {
  menu:'<path d="M4 6h16M4 12h16M4 18h16"/>',
  close:'<path d="M5 5l14 14M19 5L5 19"/>',
  search:'<circle cx="11" cy="11" r="7"/><path d="m16.5 16.5 4.5 4.5"/>',
  heart:'<path d="M20.8 8.6c0 4.4-8.8 10.7-8.8 10.7S3.2 13 3.2 8.6a4.7 4.7 0 0 1 8.8-2.1 4.7 4.7 0 0 1 8.8 2.1Z"/>',
  bag:'<path d="M4 8h16l-1.3 12H5.3L4 8Z"/><path d="M9 9V6a3 3 0 0 1 6 0v3"/>',
  check:'<path d="m4 12 5 5L20 6"/>',
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
const initialCart=readStorage('cart',{});
const cart=Object.fromEntries(Object.entries(initialCart||{}).filter(([id,q])=>getItem(id)&&Number.isInteger(q)&&q>0&&q<100));
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
const ornaments={
  'heart-earrings':`<g transform="translate(0,8)"><path d="M80 87c-9-16-38-12-34 8 3 14 25 30 34 39 10-9 32-25 34-39 4-20-25-24-34-8Z"/><path d="M160 87c-9-16-38-12-34 8 3 14 25 30 34 39 10-9 32-25 34-39 4-20-25-24-34-8Z"/></g>`,
  'pearl-necklace':`<path d="M52 34c8 56 34 83 68 83s60-27 68-83" fill="none" stroke-width="4"/><path d="M108 121l12 12 12-12" fill="none" stroke-width="3"/><circle cx="120" cy="146" r="25" fill="url(#pearl)" stroke="#d2b89f" stroke-width="2"/>`,
  'heart-bracelet':`<ellipse cx="120" cy="118" rx="85" ry="33" fill="none" stroke-width="7" stroke-dasharray="9 2"/><path d="M120 116c-8-12-29-9-28 7 1 11 19 22 28 29 9-7 27-18 28-29 1-16-20-19-28-7Z"/>`,
  'hoop-earrings':`<ellipse cx="80" cy="115" rx="26" ry="55" fill="none" stroke-width="9"/><ellipse cx="160" cy="115" rx="26" ry="55" fill="none" stroke-width="9"/><circle cx="80" cy="59" r="4"/><circle cx="160" cy="59" r="4"/>`,
  'rings':`<ellipse cx="91" cy="126" rx="42" ry="50" transform="rotate(-20 91 126)" fill="none" stroke-width="11"/><ellipse cx="148" cy="117" rx="42" ry="50" transform="rotate(24 148 117)" fill="none" stroke-width="11"/>`,
  'pearl-earrings':`<path d="M79 53v40M160 53v40" fill="none" stroke-width="5"/><circle cx="79" cy="113" r="27" fill="url(#pearl)" stroke="#d2b89f" stroke-width="2"/><circle cx="160" cy="113" r="27" fill="url(#pearl)" stroke="#d2b89f" stroke-width="2"/>`,
  'heart-necklace':`<path d="M42 30c8 55 35 80 78 93 43-13 70-38 78-93" fill="none" stroke-width="4"/><path d="M120 132c-8-12-26-9-25 5 1 10 17 21 25 27 8-6 24-17 25-27 1-14-17-17-25-5Z"/>`,
  'gift':`<rect x="52" y="84" width="136" height="102" rx="10"/><path d="M49 83h142v27H49z"/><path d="M120 83v103" fill="none" stroke-width="13"/><path d="M120 81c-62-3-60-51-30-44 19 4 30 44 30 44Zm0 0c62-3 60-51 30-44-19 4-30 44-30 44Z"/>`
};
function jewelrySvg(art){return `<svg viewBox="0 0 240 230" role="img" aria-label="Ilustração vetorial provisória" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="metal" x1="0" x2="1" y1="0" y2="1"><stop stop-color="#946539"/><stop offset=".27" stop-color="#f4da91"/><stop offset=".52" stop-color="#b98549"/><stop offset=".75" stop-color="#f4d58d"/><stop offset="1" stop-color="#9f6637"/></linearGradient><radialGradient id="pearl" cx="32%" cy="22%" r="74%"><stop stop-color="#fff"/><stop offset=".44" stop-color="#fff8f0"/><stop offset=".82" stop-color="#e8d1cd"/><stop offset="1" stop-color="#b48b84"/></radialGradient></defs><g stroke="url(#metal)" fill="url(#metal)" stroke-linejoin="round" stroke-linecap="round">${ornaments[art]||ornaments.gift}</g></svg>`}
function populateIcons(root=document){root.querySelectorAll('[data-icon]').forEach(el=>{el.innerHTML=icon(el.dataset.icon)})}
// Botões de categoria já têm aria-label; evitar filhos posicionados absolutamente que escapem do scroll horizontal.
function renderCategories(){
  const images={Brincos:'brincos',Colares:'colares',Pulseiras:'pulseiras','Anéis':'aneis',Kits:'kits'};
  $('category-grid').innerHTML=categories.map(c=>`<button class="category-card category-card-photo" type="button" data-cat="${c}" aria-label="Ver ${c}"><img class="category-photo" src="./assets/categories/${images[c]}.webp" alt="" width="300" height="404" loading="lazy" decoding="async"></button>`).join('');
  $('category-grid').querySelectorAll('[data-cat]').forEach(el=>el.addEventListener('click',()=>chooseCategory(el.dataset.cat)))
}
function renderFilters(){ $('category-chips').innerHTML=['Todos',...categories].map(c=>`<button type="button" class="chip" data-filter="${c}" aria-pressed="${category===c}">${c}</button>`).join('');$('category-chips').querySelectorAll('[data-filter]').forEach(el=>el.addEventListener('click',()=>chooseCategory(el.dataset.filter,false)))}
function filteredProducts(){return STORE.products.filter(p=>(category==='Todos'||p.category===category)&&`${p.name} ${p.category}`.toLocaleLowerCase('pt-BR').includes(query.toLocaleLowerCase('pt-BR')))}
const PRODUCT_PLACEHOLDER = './assets/foto-em-breve.webp';
const hasProductPhoto = p => typeof p.image === 'string' && p.image.trim().length > 0;
function productImage(p){
  const hasPhoto = hasProductPhoto(p);
  return `<img class="product-photo" src="${hasPhoto ? p.image : PRODUCT_PLACEHOLDER}" alt="${hasPhoto ? `Foto de ${p.name}` : `Foto de ${p.name} em breve`}" loading="lazy" decoding="async">`;
}
function applyProductPhotoFallback(root){
  root.addEventListener('error', event => {
    const img = event.target;
    if (!(img instanceof HTMLImageElement) || !img.matches('img.product-photo')) return;
    if (img.getAttribute('src') === PRODUCT_PLACEHOLDER) return;
    img.src = PRODUCT_PLACEHOLDER;
    img.alt = 'Foto em breve';
    const tag = img.closest('.product-visual')?.querySelector('.demo-tag');
    if (tag) tag.hidden = false;
    img.closest('.product-visual')?.classList.add('is-photo-missing');
  }, true);
}
function syncSearchBadge(){const el=$('active-search');if(el){el.hidden=!query;el.querySelector('[data-search-term]').textContent=query}}
function priceMarkup(p){
  return '<span class="price">'+money(p.price)+'</span>'+
    (p.promotion?'<del class="product-old-price">'+money(p.promotion.originalPrice)+'</del>':'');
}
function badgesMarkup(p){
  const labels=Array.isArray(p.labels)?p.labels:[];
  const highlights=labels.map(label=>{
    if(label==='favorite')return '<span class="product-badge product-badge--favorite">Peça favorita</span>';
    if(label==='bestSeller')return '<span class="product-badge product-badge--bestseller">Mais vendida do mês</span>';
    return '';
  }).filter(Boolean);
  return (highlights.length?'<div class="product-badges" aria-label="Classificações da peça">'+highlights.join('')+'</div>':'')+
    (p.promotion?'<span class="product-badge product-badge--discount" aria-label="Desconto de '+p.promotion.percent+' por cento">-'+p.promotion.percent+'%</span>':'');
}
function lowStockMarkup(p){
  if(p.stock===0)return '<span class="product-stock product-stock--out">Indisponível no estoque informado</span>';
  if(window.MargotMerchandising?.lowStock(p)){
    return '<span class="product-stock">'+(p.stock===1?'Resta ':'Restam ')+p.stock+
      (p.stock===1?' unidade':' unidades')+' · sob confirmação</span>';
  }
  return '';
}
function canAdd(p){
  return p.stock===null||p.stock===undefined?
    (cart[p.id]||0)<99:(cart[p.id]||0)<Math.min(99,p.stock);
}
function productCard(p){
  const hasPhoto=hasProductPhoto(p);
  const available=canAdd(p);
  const inCart=(cart[p.id]||0)>0;
  const actionable=inCart||available;
  const stockMarkup=lowStockMarkup(p);
  const savings=p.promotion?money(p.promotion.originalPrice-p.price):'';
  const buttonLabel=inCart?'Adicionado ao carrinho':p.stock===0?'Indisponível':available?'Adicionar à sacola':'Limite atingido';
  const buttonAria=inCart?'Ver '+p.name+' na sacola':available?'Adicionar '+p.name+' à sacola':'Não é possível adicionar '+p.name+' à sacola';
  return '<article class="product-card'+(p.promotion?' product-card--offer':'')+(p.labels?.includes('bestSeller')?' product-card--signature':'')+'">'+
    '<div class="product-visual'+(hasPhoto?'':' is-photo-missing')+'">'+
      '<span class="demo-tag"'+(hasPhoto?' hidden':'')+'>Foto em breve</span>'+
      '<a class="product-open" href="./produto.html?id='+encodeURIComponent(p.id)+'" aria-label="Ver detalhes de '+p.name+'">'+productImage(p)+'</a>'+
      (hasPhoto?'<span class="product-photo-signature" aria-hidden="true"><strong>MARGOT</strong><small>acessórios</small></span>':'')+
      badgesMarkup(p)+
      '<button class="heart-btn" type="button" data-favorite="'+p.id+'" aria-pressed="'+favorites.has(p.id)+'" aria-label="'+(favorites.has(p.id)?'Remover dos':'Adicionar aos')+' favoritos: '+p.name+'"><span class="icon" data-icon="heart"></span></button>'+
    '</div>'+
    '<div class="product-info">'+
      '<span class="category-label">'+p.category+'</span>'+
      '<h3><a class="product-title-link" href="./produto.html?id='+encodeURIComponent(p.id)+'">'+p.name+'</a></h3>'+
      '<div class="product-price-summary">'+
        '<div class="product-price-line">'+priceMarkup(p)+'</div>'+
        (p.promotion?'<span class="product-savings">Economize <strong>'+savings+'</strong></span>':'')+
      '</div>'+
      (stockMarkup||'<span class="product-stock-spacer" aria-hidden="true"></span>')+
       '<button class="add-to-cart'+(inCart?' is-in-cart':'')+'" type="button" data-add="'+p.id+'" aria-label="'+buttonAria+'"'+(actionable?'':' disabled')+'>'+
        '<span class="icon" data-icon="'+(inCart?'check':'bag')+'"></span><span class="product-cart-label">'+buttonLabel+'</span><span class="product-cart-arrow" aria-hidden="true">→</span>'+
      '</button>'+
    '</div></article>';
}
function bindProductActions(root){
  populateIcons(root);
  root.querySelectorAll('[data-add]').forEach(el=>el.addEventListener('click',()=>{
    const id=el.dataset.add;
    if((cart[id]||0)>0){openDrawer('cart');return;}
    addToCart(id);
  }));
  root.querySelectorAll('[data-favorite]').forEach(el=>el.addEventListener('click',()=>toggleFavorite(el.dataset.favorite)));
}
function renderProducts(){
  const found=filteredProducts();
  $('product-grid').innerHTML=found.map(productCard).join('');
  bindProductActions($('product-grid'));
  $('catalog-status').textContent=found.length+' '+(found.length===1?'produto':'produtos')+' em exibição';
  $('empty-results').hidden=found.length>0;
  syncSearchBadge();
}
function renderPromotionPanel(){
  const panel=$('promotion-grid');
  if(!panel)return;
  const available=window.MargotMerchandising?.promotions||[];
  panel.hidden=available.length===0;
  $('promotion-empty').hidden=available.length!==0;
  panel.innerHTML=available.map(productCard).join('');
  bindProductActions(panel);
}

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

/* Preserve o foco quando cards e linhas da sacola são recriados. */
function captureActionFocus(){
  const el=document.activeElement;
  const root=el?.closest?.('#product-grid,#promotion-grid,#drawer-items');
  if(!root)return null;
  for(const key of ['add','favorite','qty','remove','favAdd','favRemove']){
    if(el.dataset?.[key])return {rootId:root.id,key,id:el.dataset[key],delta:el.dataset.delta};
  }
  return null;
}
function restoreActionFocus(focus){
  if(!focus)return;
  const root=$(focus.rootId);
  const elements=[...root?.querySelectorAll('button')||[]];
  const same=elements.find(el=>el.dataset[focus.key]===focus.id&&
    (focus.key!=='qty'||el.dataset.delta===focus.delta)&&!el.disabled);
  const fallback=focus.key==='qty'?
    elements.find(el=>el.dataset.qty===focus.id&&!el.disabled):null;
  (same||fallback||(focus.rootId==='drawer-items'?$('drawer-close'):null))
    ?.focus({preventScroll:true});
}
function refreshShoppingView(){
  const focus=captureActionFocus();
  updateCounts();
  renderProducts();
  renderPromotionPanel();
  if($('drawer').classList.contains('open'))renderDrawer();
  restoreActionFocus(focus);
}
function syncExternalStorage(event){
  if(event.storageArea&&event.storageArea!==localStorage)return;
  if(event.key!==null&&event.key!=='margot-cart'&&event.key!=='margot-favorites')return;
  if(event.key===null||event.key==='margot-cart'){
    const data=readStorage('cart',{});
    const valid=data&&typeof data==='object'&&!Array.isArray(data)?data:{};
    for(const id of Object.keys(cart))delete cart[id];
    for(const [id,qty] of Object.entries(valid)){
      if(getItem(id)&&Number.isInteger(qty)&&qty>0&&qty<100)cart[id]=qty;
    }
  }
  if(event.key===null||event.key==='margot-favorites'){
    const data=readStorage('favorites',[]);
    favorites.clear();
    if(Array.isArray(data))for(const id of data){
      if(getItem(id))favorites.add(id);
    }
  }
  if($('product-grid'))refreshShoppingView();
}
window.addEventListener('storage',syncExternalStorage);

function addToCart(id){
  const p=getItem(id);
  if(!p)return;
  if((cart[id]||0)>0){openDrawer('cart');return;}
  if(p.stock===0){notify('Peça indisponível no estoque informado.');return;}
  if(!canAdd(p)){
    notify(p.stock!==null&&p.stock!==undefined?'Limite do estoque informado atingido. Confirme a disponibilidade.':'Limite de 99 unidades por peça.');
    return;
  }
  cart[id]=(cart[id]||0)+1;
  saveStorage('cart',cart);
  refreshShoppingView();
  notify('Peça adicionada à sacola');
}
function toggleFavorite(id){favorites.has(id)?favorites.delete(id):favorites.add(id);saveStorage('favorites',[...favorites]);refreshShoppingView();notify(favorites.has(id)?'Adicionado aos favoritos':'Removido dos favoritos')}
function changeQuantity(id,delta){
  const p=getItem(id);if(!p)return;
  const next=(cart[id]||0)+delta;
  if(next<=0)delete cart[id];
  else if(delta>0){
    const cap=p.stock===null||p.stock===undefined?99:Math.min(99,p.stock);
    if(next>cap){notify('Quantidade acima do estoque informado. Confirme a disponibilidade.');return;}
    cart[id]=Math.min(99,next);
  }else cart[id]=Math.min(99,next);
  saveStorage('cart',cart);refreshShoppingView();
}
function cartLine(p){return `<div class="drawer-item"><div class="drawer-item-thumb">${productImage(p)}</div><div><h3>${p.name}</h3><p>${money(p.price)} · Prévia</p>${lowStockMarkup(p)}<div class="quantity"><button type="button" data-qty="${p.id}" data-delta="-1" aria-label="Remover uma unidade de ${p.name}">−</button><span>${cart[p.id]}</span><button type="button" data-qty="${p.id}" data-delta="1" aria-label="Adicionar uma unidade de ${p.name}"${canAdd(p)?'':' disabled'}>+</button></div></div><button type="button" class="remove" data-remove="${p.id}" aria-label="Excluir ${p.name} da sacola">×</button></div>`}
function favoriteLine(p){return `<div class="drawer-item"><div class="drawer-item-thumb">${productImage(p)}</div><div><h3>${p.name}</h3><p>${money(p.price)} · Prévia</p><button class="text-link" type="button" data-fav-add="${p.id}">${(cart[p.id]||0)>0?'Ver na sacola':'Adicionar à sacola'}</button></div><button type="button" class="remove" data-fav-remove="${p.id}" aria-label="Remover ${p.name} dos favoritos">×</button></div>`}
function renderDrawer(){const isCart=drawerMode==='cart';$('drawer-title').textContent=isCart?'Sua sacola':'Meus favoritos';let items=isCart?Object.keys(cart).map(getItem):[...favorites].map(getItem);items=items.filter(Boolean);$('drawer-items').innerHTML=items.length?items.map(isCart?cartLine:favoriteLine).join(''):`<div class="drawer-empty"><span class="icon" data-icon="${isCart?'bag':'heart'}"></span><p>${isCart?'Sua sacola ainda está vazia.':'Você ainda não salvou favoritos.'}</p><p>Descubra os detalhes da coleção Margot.</p></div>`;populateIcons($('drawer-items'));if(isCart&&items.length){const subtotal=items.reduce((s,p)=>s+p.price*cart[p.id],0);$('drawer-footer').innerHTML=`<div class="subtotal"><span>Subtotal estimado</span><span>${money(subtotal)}</span></div><p class="checkout-note">Valores ilustrativos. Não há cobrança automática nem reserva de estoque. O pedido deve ser confirmado com a loja.</p><button type="button" id="copy-order" class="button primary">Copiar lista de interesse</button><button type="button" id="continue-shopping" class="button outline">Continuar olhando</button>`;$('copy-order').addEventListener('click',copyOrder);$('continue-shopping').addEventListener('click',closeDrawer)}else{$('drawer-footer').innerHTML=`<button class="button outline" type="button" id="continue-shopping">Explorar coleção</button>`;$('continue-shopping').addEventListener('click',closeDrawer)}$('drawer-items').querySelectorAll('[data-qty]').forEach(btn=>btn.addEventListener('click',()=>changeQuantity(btn.dataset.qty,Number(btn.dataset.delta))));$('drawer-items').querySelectorAll('[data-remove]').forEach(btn=>btn.addEventListener('click',()=>changeQuantity(btn.dataset.remove,-99)));$('drawer-items').querySelectorAll('[data-fav-remove]').forEach(btn=>btn.addEventListener('click',()=>toggleFavorite(btn.dataset.favRemove)));$('drawer-items').querySelectorAll('[data-fav-add]').forEach(btn=>btn.addEventListener('click',()=>addToCart(btn.dataset.favAdd)))}
function openDrawer(mode){if($('drawer').classList.contains('open')){drawerMode=mode;renderDrawer();$('drawer-close').focus();return;}previousFocus=document.activeElement;drawerMode=mode;renderDrawer();$('drawer').inert=false;$('drawer').setAttribute('aria-hidden','false');$('overlay').hidden=false;requestAnimationFrame(()=>{$('drawer').classList.add('open');$('overlay').classList.add('show')});document.body.style.overflow='hidden';$('drawer-close').focus()}
function closeDrawer(){$('drawer').classList.remove('open');$('overlay').classList.remove('show');$('drawer').inert=true;$('drawer').setAttribute('aria-hidden','true');$('overlay').hidden=true;document.body.style.overflow='';if(previousFocus&&document.contains(previousFocus))previousFocus.focus()}
function copyOrder(){const lines=Object.keys(cart).map(id=>`• ${getItem(id).name} — ${cart[id]} un. × ${money(getItem(id).price)}`);const subtotal=Object.keys(cart).reduce((s,id)=>s+getItem(id).price*cart[id],0);const msg=`Olá! Tenho interesse nestas peças da Margot Acessórios:\n${lines.join('\n')}\nSubtotal demonstrativo: ${money(subtotal)}\nGostaria de confirmar disponibilidade, valores e entrega.`;const fallback=()=>{const ta=document.createElement('textarea');ta.value=msg;ta.style.position='fixed';ta.style.left='-9999px';document.body.appendChild(ta);ta.select();const ok=document.execCommand('copy');ta.remove();if(!ok)throw new Error('Falha ao copiar')};Promise.resolve(navigator.clipboard?.writeText?navigator.clipboard.writeText(msg).catch(fallback):fallback()).then(()=>notify('Lista copiada. Cole no atendimento da loja quando estiver disponível.')).catch(()=>notify('Não foi possível copiar automaticamente.'))}
function notify(msg){const el=$('toast');el.textContent=msg;el.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('show'),2800)}
function closeMobileMenu(){window.dispatchEvent(new CustomEvent('margot:menu-close'))}
function init(){applyProductPhotoFallback($('product-grid'));applyProductPhotoFallback($('drawer-items'));populateIcons();renderCategories();renderFilters();applyProductPhotoFallback($('promotion-grid'));renderProducts();renderPromotionPanel();updateCounts();$('drawer').inert=true;$('year').textContent=new Date().getFullYear();$('cart-open').addEventListener('click',()=>openDrawer('cart'));$('favorites-open').addEventListener('click',()=>openDrawer('favorites'));$('drawer-close').addEventListener('click',closeDrawer);$('overlay').addEventListener('click',closeDrawer);$('show-all').addEventListener('click',()=>chooseCategory('Todos'));$('search-input').addEventListener('input',e=>{query=e.target.value.trim();$('clear-search').hidden=!query;renderProducts()});$('search-form').addEventListener('submit',e=>{e.preventDefault();window.dispatchEvent(new CustomEvent('margot:search-close'));$('produtos').focus({preventScroll:true});$('produtos').scrollIntoView({behavior:'smooth'});$('search-input').blur()});$('clear-search').addEventListener('click',()=>{query='';$('search-input').value='';$('clear-search').hidden=true;renderProducts();$('search-input').focus()});$('clear-active-search').addEventListener('click',()=>{query='';$('search-input').value='';$('clear-search').hidden=true;renderProducts()});document.querySelectorAll('[data-category-link]').forEach(link=>link.addEventListener('click',e=>{e.preventDefault();chooseCategory(link.dataset.categoryLink)}));document.addEventListener('keydown',e=>{if(e.key==='Escape'&&$('drawer').classList.contains('open'))closeDrawer();if(e.key==='Tab'&&$('drawer').classList.contains('open')){const nodes=[...$('drawer').querySelectorAll('button:not([disabled]),a[href],input:not([disabled])')].filter(n=>n.getClientRects().length);if(!nodes.length)return;const first=nodes[0],last=nodes[nodes.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}}})}

function applyCatalogLive(){
  STORE=window.MargotCatalog;
  let changed=false;
  for(const id of Object.keys(cart)){
    if(!getItem(id)){delete cart[id];changed=true}
  }
  if(changed)saveStorage('cart',cart);
  let favoritesChanged=false;
  for(const id of [...favorites]){
    if(!getItem(id)){favorites.delete(id);favoritesChanged=true}
  }
  if(favoritesChanged)saveStorage('favorites',[...favorites]);
  renderCategories();
  renderFilters();
  refreshShoppingView();
}
window.addEventListener('margot:catalog-updated',()=>{
  if($('product-grid'))applyCatalogLive();
});
document.addEventListener('DOMContentLoaded',()=>{
  init();
  // Link vindo da página individual: sacola do MESMO armazenamento local.
  const url=new URL(location.href);
  if(url.searchParams.get('sacola')==='1'){
    url.searchParams.delete('sacola');
    history.replaceState(history.state,'',url.pathname+url.search+url.hash);
    openDrawer('cart');
  }
});