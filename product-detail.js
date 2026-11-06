/* Margot V1.26 — página individual. Compartilha catálogo e localStorage com a vitrine.
 * Não representa pagamento, estoque ou avaliações sem integração oficial.
 */
(() => {
  'use strict';
  const catalog=window.MargotCatalog;
  const fallbackImage='./assets/foto-em-breve.webp';
  const $=id=>document.getElementById(id);
  const money=n=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(n);
  const read=(key,fallback)=>{
    try {const value=JSON.parse(localStorage.getItem('margot-'+key));return value===null?fallback:value;}
    catch {return fallback;}
  };
  const write=(key,value)=>{
    try {localStorage.setItem('margot-'+key,JSON.stringify(value));return true;}
    catch{return false;}
  };
  let product=null;
  let gallery=[];
  let activeImage=0;
  let toastTimeout;

  function toast(message){
    const el=$('pd-toast');
    el.textContent=message;
    el.classList.add('show');
    clearTimeout(toastTimeout);
    toastTimeout=setTimeout(()=>el.classList.remove('show'),3200);
  }

  function countCart(){
    const stored=read('cart',{});
    if(!stored||typeof stored!=='object'||Array.isArray(stored))return 0;
    return Object.values(stored).reduce((sum,q)=>{
      return sum+(Number.isInteger(q)&&q>=1&&q<=99?q:0);
    },0);
  }
  function syncCartCount(){
    const count=countCart(),el=$('pd-cart-count');
    el.textContent=String(count);
    el.hidden=count===0;
  }
  function quantity(){
    const input=$('pd-qty-input');
    const value=Number(input.value);
    const next=Number.isFinite(value)?Math.min(99,Math.max(1,Math.trunc(value))):1;
    input.value=String(next);
    $('pd-decrease').disabled=next<=1;
    $('pd-increase').disabled=next>=99;
    return next;
  }
  function getFavorites(){
    const saved=read('favorites',[]);
    return Array.isArray(saved)?new Set(saved.filter(id=>catalog.products.some(p=>p.id===id))):new Set();
  }
  function syncFavorite(){
    const enabled=getFavorites().has(product.id);
    $('pd-favorite').setAttribute('aria-pressed',String(enabled));
    $('pd-favorite-text').textContent=enabled?'Salvo nos favoritos':'Salvar favorito';
    $('pd-favorite').setAttribute('aria-label',enabled?'Remover '+product.name+' dos favoritos':'Adicionar '+product.name+' aos favoritos');
  }
  function toggleFavorite(){
    const favorite=getFavorites();
    if(favorite.has(product.id))favorite.delete(product.id);
    else favorite.add(product.id);
    if(!write('favorites',[...favorite])){
      toast('Não foi possível salvar favoritos neste navegador.');
      return;
    }
    syncFavorite();
    toast(favorite.has(product.id)?'Peça salva nos favoritos.':'Peça removida dos favoritos.');
  }
  function addToCart(){
    const stored=read('cart',{});
    const cart=stored&&typeof stored==='object'&&!Array.isArray(stored)?{...stored}:{};
    const previous=Number.isInteger(cart[product.id])&&cart[product.id]>0?cart[product.id]:0;
    if(previous>=99){
      toast('Esta peça já atingiu o limite de 99 unidades na sacola.');
      return;
    }
    const requested=quantity();
    const next=Math.min(99,previous+requested);
    cart[product.id]=next;
    if(!write('cart',cart)){
      toast('Não foi possível guardar a sacola neste navegador.');
      return;
    }
    syncCartCount();
    $('pd-view-cart').hidden=false;
    toast(next-previous+' '+(next-previous===1?'unidade adicionada':'unidades adicionadas')+' à sacola.');
    if(next-previous<requested)toast('Limite de 99 unidades atingido. Confira a sacola.');
  }

  function normalizedImages(item){
    if(Array.isArray(item.images)&&item.images.length){
      return item.images.filter(src=>typeof src==='string'&&src.trim()).map(src=>src.trim());
    }
    if(typeof item.image==='string'&&item.image.trim())return [item.image.trim()];
    return [];
  }
  function updateGallery(index){
    activeImage=(index+gallery.length)%gallery.length;
    const image=$('pd-main-image');
    image.src=gallery[activeImage];
    image.alt='Fotografia '+(activeImage+1)+' de '+gallery.length+' — '+product.name;
    $('pd-dialog-image').src=gallery[activeImage];
    $('pd-dialog-image').alt=image.alt;
    $('pd-thumbnails').querySelectorAll('button').forEach((btn,i)=>{
      btn.setAttribute('aria-pressed',String(i===activeImage));
    });
  }
  function showPlaceholder(){
    gallery=[fallbackImage];
    $('pd-main-image').src=fallbackImage;
    $('pd-main-image').alt='Fotografia individual de '+product.name+' ainda não disponível';
    $('pd-photo-note').hidden=false;
    $('pd-image-disclaimer').hidden=false;
    $('pd-zoom').hidden=true;
    $('pd-thumbnails').hidden=true;
    $('pd-thumbnails').replaceChildren();
  }
  function renderGallery(){
    const pictures=normalizedImages(product);
    if(!pictures.length){
      showPlaceholder();
      return;
    }
    gallery=pictures;
    $('pd-photo-note').hidden=true;
    $('pd-image-disclaimer').hidden=true;
    $('pd-zoom').hidden=false;
    $('pd-thumbnails').replaceChildren();
    $('pd-thumbnails').hidden=pictures.length<=1;
    for(let i=0;i<pictures.length;i++){
      const b=document.createElement('button');
      b.type='button';
      b.setAttribute('aria-label','Mostrar fotografia '+(i+1)+' de '+pictures.length);
      b.setAttribute('aria-pressed',String(i===0));
      const img=document.createElement('img');
      img.src=pictures[i];
      img.alt='';
      img.loading='lazy';
      b.append(img);
      b.addEventListener('click',()=>updateGallery(i));
      $('pd-thumbnails').append(b);
    }
    updateGallery(0);
  }
  function renderRelated(){
    const same=catalog.products.filter(p=>p.id!==product.id&&p.category===product.category);
    const other=catalog.products.filter(p=>p.id!==product.id&&p.category!==product.category);
    const recommendations=[...same,...other].slice(0,4);
    const grid=$('pd-related-grid');
    grid.replaceChildren();
    for(const item of recommendations){
      const link=document.createElement('a');
      link.className='pd-related-card';
      link.href='./produto.html?id='+encodeURIComponent(item.id);
      const visual=document.createElement('span');
      visual.className='pd-related-visual';
      const img=document.createElement('img');
      const hasPhoto=Boolean(item.image);
      img.src=hasPhoto?item.image:fallbackImage;
      img.alt=hasPhoto?'Foto de '+item.name:'Imagem pendente de '+item.name;
      img.loading='lazy';
      img.decoding='async';
      img.addEventListener('error',()=>{
        if(img.getAttribute('src')!==fallbackImage)img.src=fallbackImage;
      });
      visual.append(img);
      if(!hasPhoto){
        const label=document.createElement('small');
        label.textContent='Foto em breve';
        visual.append(label);
      }
      const category=document.createElement('span');
      category.className='pd-related-category';
      category.textContent=item.category;
      const name=document.createElement('strong');
      name.textContent=item.name;
      const price=document.createElement('span');
      price.className='pd-related-price';
      price.textContent=money(item.price);
      link.append(visual,category,name,price);
      grid.append(link);
    }
  }

  function init(){
    const id=new URLSearchParams(location.search).get('id');
    product=catalog?.products?.find(item=>item.id===id)||null;
    $('pd-loading').hidden=true;
    if(!product){
      $('pd-not-found').hidden=false;
      document.title='Produto não encontrado | Margot Acessórios';
      return;
    }
    document.title=product.name+' | Margot Acessórios';
    $('pd-product').hidden=false;
    $('pd-crumb-category').textContent=product.category;
    $('pd-crumb-category').href='./index.html?categoria='+encodeURIComponent(product.category)+'#produtos';
    $('pd-crumb-name').textContent=product.name;
    $('pd-title').textContent=product.name;
    $('pd-category').textContent=product.category;
    $('pd-price').textContent=money(product.price);
    $('pd-description').textContent=product.description||
      (product.name+' faz parte da seleção '+product.category.toLocaleLowerCase('pt-BR')+
      ' da Margot. As informações de material, medidas e disponibilidade serão confirmadas antes de qualquer pedido.');
    $('pd-spec-category').textContent=product.category;
    renderGallery();
    renderRelated();
    syncCartCount();
    syncFavorite();
    quantity();
    $('pd-decrease').addEventListener('click',()=>{
      $('pd-qty-input').value=String(quantity()-1);
      quantity();
    });
    $('pd-increase').addEventListener('click',()=>{
      $('pd-qty-input').value=String(quantity()+1);
      quantity();
    });
    $('pd-qty-input').addEventListener('change',quantity);
    $('pd-qty-input').addEventListener('blur',quantity);
    $('pd-add').addEventListener('click',addToCart);
    $('pd-favorite').addEventListener('click',toggleFavorite);
    $('pd-main-image').addEventListener('error',()=>{
      if($('pd-main-image').getAttribute('src')!==fallbackImage){
        showPlaceholder();
        toast('A fotografia não está disponível.');
      }
    });
    $('pd-zoom').addEventListener('click',()=>{
      const dialog=$('pd-image-dialog');
      if(typeof dialog.showModal==='function')dialog.showModal();
    });
    $('pd-image-close').addEventListener('click',()=>$('pd-image-dialog').close());
    $('pd-image-dialog').addEventListener('click',event=>{
      if(event.target===$('pd-image-dialog'))$('pd-image-dialog').close();
    });
    window.addEventListener('storage',event=>{
      if(event.key==='margot-cart')syncCartCount();
      if(event.key==='margot-favorites')syncFavorite();
    });
  }
  document.addEventListener('DOMContentLoaded',init);
})();
