const {test,expect} = require('@playwright/test');

test.use({viewport:{width:390,height:844},isMobile:true,hasTouch:true});

async function ready(page){
  await page.goto('/',{waitUntil:'domcontentloaded'});
  await expect(page.locator('html')).toHaveClass(/mobile-nav-ready/);
}

test('menu permanece aberto durante a rolagem e devolve foco ao fechar',async({page})=>{
  await ready(page);
  await page.locator('#menu-open').click();
  await expect(page.locator('#main-nav')).toHaveClass(/open/);
  await expect(page.locator('#mobile-menu-close')).toBeFocused();
  await page.evaluate(()=>{window.scrollTo(0,400);window.dispatchEvent(new Event('scroll'))});
  await expect(page.locator('.site-header')).toHaveClass(/is-compact/);
  await expect(page.locator('#main-nav')).toHaveClass(/open/);
  await page.keyboard.press('Escape');
  await expect(page.locator('#main-nav')).not.toHaveClass(/open/);
  await expect(page.locator('#menu-open')).toBeFocused();
  await expect(page.locator('body')).not.toHaveClass(/mobile-menu-open/);
});

test('menu fecha pelo fundo e não deixa conteúdo inerte',async({page})=>{
  await ready(page);
  await page.locator('#menu-open').click();
  await expect(page.locator('main')).toHaveAttribute('inert','');
  await page.locator('#mobile-menu-backdrop').click({position:{x:6,y:400}});
  await expect(page.locator('main')).not.toHaveAttribute('inert','');
  await expect(page.locator('#mobile-menu-backdrop')).toBeHidden();
});

test('categoria, histórico e atualização preservam filtro',async({page})=>{
  await ready(page);
  await page.locator('#menu-open').click();
  await page.locator('#main-nav [data-category-link="Brincos"]').click();
  await expect(page).toHaveURL(/categoria=Brincos#produtos/);
  await expect(page.locator('#product-grid .product-card')).toHaveCount(3);
  await page.reload({waitUntil:'domcontentloaded'});
  await expect(page.locator('#product-grid .product-card')).toHaveCount(3);
  // O destaque representa a seção visível, não uma categoria oculta no topo.
  await page.locator('#produtos').scrollIntoViewIfNeeded();
  await expect(page.locator('#main-nav [data-category-link="Brincos"]')).toHaveClass(/active/);
});

test('troca de categoria limpa pesquisa anterior, mostrando filtro ativo',async({page})=>{
  await ready(page);
  await page.locator('#mobile-nav-search').click();
  await page.locator('#search-input').fill('colar');
  await expect(page.locator('#active-search')).toBeVisible();
  await expect(page.locator('#product-grid .product-card')).toHaveCount(2);
  await page.locator('#menu-open').click();
  await page.locator('#main-nav [data-category-link="Brincos"]').click();
  await expect(page.locator('#active-search')).toBeHidden();
  await expect(page.locator('#search-input')).toHaveValue('');
  await expect(page.locator('#product-grid .product-card')).toHaveCount(3);
});

test('sacola e favoritos continuam acessíveis pela barra inferior',async({page})=>{
  await ready(page);
  await page.locator('#mobile-nav-cart').click();
  await expect(page.locator('#drawer')).toHaveClass(/open/);
  await page.locator('#drawer-close').click();
  await expect(page.locator('#drawer')).not.toHaveClass(/open/);
  await page.locator('#mobile-nav-favorites').click();
  await expect(page.locator('#drawer')).toHaveClass(/open/);
});

test('cabeçalho não muda de altura no mobile ao rolar',async({page})=>{
  await ready(page);
  const before=await page.locator('.header-main').boundingBox();
  await page.evaluate(()=>window.scrollTo(0,440));
  await expect(page.locator('.site-header')).toHaveClass(/is-compact/);
  await expect.poll(async()=>{
    const after=await page.locator('.header-main').boundingBox();
    return Math.abs(before.height-after.height);
  }).toBeLessThanOrEqual(1);
  const after=await page.locator('.header-main').boundingBox();
  expect(Math.abs(before.width-after.width)).toBeLessThanOrEqual(1);
});

for(const width of [320,360,390,430,700]){
  test('sem overflow horizontal e com cinco atalhos em '+width+'px',async({page})=>{
    await page.setViewportSize({width,height:844});
    await ready(page);
    await expect(page.locator('#mobile-bottom-nav')).toBeVisible();
    await expect(page.locator('#mobile-bottom-nav .mobile-nav-action')).toHaveCount(5);
    const bounds=await page.evaluate(()=>{
      const nav=document.querySelector('#mobile-bottom-nav').getBoundingClientRect();
      return{doc:document.documentElement.scrollWidth,viewport:document.documentElement.clientWidth,left:nav.left,right:nav.right};
    });
    expect(bounds.doc).toBeLessThanOrEqual(bounds.viewport+1);
    expect(bounds.left).toBeGreaterThanOrEqual(-1);
    expect(bounds.right).toBeLessThanOrEqual(width+1);
  });
}

test('catálogo continua visível em filtros, favoritos e rolagem rápida',async({page})=>{
  // Exerce os efeitos GSAP; configuração padrão da suite usa movimento reduzido.
  await page.emulateMedia({reducedMotion:'no-preference'});
  await ready(page);
  const check=async()=>{
    const values=await page.locator('#product-grid .product-card').evaluateAll(cards=>cards.map(card=>({opacity:getComputedStyle(card).opacity,visibility:getComputedStyle(card).visibility})));
    expect(values.length).toBeGreaterThan(0);
    for(const value of values){expect(Number(value.opacity)).toBeGreaterThan(0.9);expect(value.visibility).toBe('visible')}
  };
  await check();
  await page.locator('#product-grid [data-favorite]').first().click();
  await check();
  await page.locator('#mobile-nav-search').click();
  await page.locator('#search-input').fill('colar');
  await check();
  await page.evaluate(()=>window.scrollTo(0,document.body.scrollHeight));
  await check();
});

test('texto do slide anterior fica oculto imediatamente ao avançar',async({page})=>{
  await ready(page);
  await page.locator('.hero-next').click();
  await expect(page.locator('.hero-slide:not(.is-active) .hero-copy').first()).toHaveCSS('visibility','hidden');
  await expect(page.locator('.hero-slide.is-active .hero-copy')).toBeVisible();
});

test('sacola limita a 99 unidades e mantém quantidade após atualizar',async({page})=>{
  await ready(page);
  await page.locator('#product-grid [data-add="brinco-coracao"]').click();
  await page.locator('#mobile-nav-cart').click();
  await page.evaluate(()=>{
    for(let i=0;i<105;i++){
      const plus=document.querySelector('#drawer-items [data-qty="brinco-coracao"][data-delta="1"]');
      if(!plus||plus.disabled)break;
      plus.click();
    }
  });
  expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('margot-cart'))['brinco-coracao'])).toBe(99);
  await expect(page.locator('#drawer-items [data-delta="1"]')).toBeDisabled();
  await page.reload({waitUntil:'domcontentloaded'});
  await expect(page.locator('#mobile-cart-count')).toHaveText('99');
  await page.locator('#mobile-nav-cart').click();
  await expect(page.locator('.quantity span')).toHaveText('99');
});

test('imagem real esconde etiqueta provisória',async({page})=>{
  await ready(page);
  await page.evaluate(()=>{STORE.products[0].image='./assets/hero-1.webp';renderProducts()});
  const first=page.locator('#product-grid .product-card').first();
  await expect(first.locator('.demo-tag')).toBeHidden();
  await expect(first.locator('img.product-photo')).toHaveAttribute('src','./assets/hero-1.webp');
});

test('mobile restaura geometria e classes após compactar e descompactar',async({page})=>{
  await ready(page);
  const measure=()=>page.evaluate(()=>{
    const selectors=['.header-main','.brand','#menu-open','#account-open','#mobile-bottom-nav'];
    return Object.fromEntries(selectors.map(selector=>{
      const rect=document.querySelector(selector).getBoundingClientRect();
      return[selector,{x:rect.x,width:rect.width,height:rect.height}];
    }));
  });
  const initial=await measure();
  await page.evaluate(()=>window.scrollTo({top:520,behavior:'instant'}));
  await expect(page.locator('.site-header')).toHaveClass(/is-compact/);
  await expect(page.locator('html')).toHaveClass(/has-compact-header/);
  await page.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));
  await expect(page.locator('.site-header')).not.toHaveClass(/is-compact/);
  await expect(page.locator('html')).not.toHaveClass(/has-compact-header/);
  const restored=await measure();
  for(const selector of Object.keys(initial)){
    for(const key of ['x','width','height']){
      expect(Math.abs(restored[selector][key]-initial[selector][key])).toBeLessThanOrEqual(1);
    }
  }
});

test('rolagem para cima restaura o cabeçalho mesmo longe do topo',async({page})=>{
  await ready(page);
  await page.evaluate(()=>window.scrollTo({top:500,behavior:'instant'}));
  await expect(page.locator('.site-header')).toHaveClass(/is-compact/);
  await page.evaluate(()=>window.scrollTo({top:430,behavior:'instant'}));
  await expect(page.locator('.site-header')).not.toHaveClass(/is-compact/);
  await page.evaluate(()=>window.scrollTo({top:500,behavior:'instant'}));
  await expect(page.locator('.site-header')).toHaveClass(/is-compact/);
});

test('mobile e desktop restauram menu, busca, foco e inert ao alternar',async({page})=>{
  await ready(page);
  await page.locator('#menu-open').click();
  await expect(page.locator('#main-nav')).toHaveClass(/open/);
  await expect(page.locator('main')).toHaveAttribute('inert','');
  await page.setViewportSize({width:1024,height:800});
  await expect(page.locator('#main-nav')).not.toHaveClass(/open/);
  await expect(page.locator('main')).not.toHaveAttribute('inert','');
  await expect(page.locator('#mobile-menu-backdrop')).toBeHidden();
  await page.setViewportSize({width:390,height:844});
  await expect(page.locator('#mobile-bottom-nav')).toBeVisible();
  await page.locator('#mobile-nav-search').click();
  await expect(page.locator('.site-header')).toHaveClass(/searching/);
  await page.setViewportSize({width:1024,height:800});
  await expect(page.locator('.site-header')).not.toHaveClass(/searching/);
  await page.setViewportSize({width:390,height:844});
  await expect(page.locator('.site-header')).not.toHaveClass(/searching/);
  await expect(page.locator('#mobile-nav-search')).toHaveAttribute('aria-pressed','false');
  await expect(page.locator('#main-nav')).not.toHaveClass(/open/);
  await expect(page.locator('body')).not.toHaveClass(/mobile-menu-open/);
  const layout=await page.evaluate(()=>({
    viewport:document.documentElement.clientWidth,
    scroll:document.documentElement.scrollWidth,
    x:window.scrollX
  }));
  expect(layout.scroll).toBeLessThanOrEqual(layout.viewport+1);
  expect(layout.x).toBe(0);
});

test('desktop abre menu compacto e retorna à navegação normal',async({page})=>{
  await page.setViewportSize({width:1100,height:800});
  await ready(page);
  const initial=await page.locator('.header-main').boundingBox();
  await expect(page.locator('.site-header')).not.toHaveClass(/is-compact/);
  await page.evaluate(()=>window.scrollTo({top:500,behavior:'instant'}));
  await expect(page.locator('.site-header')).toHaveClass(/is-compact/);
  await page.locator('#menu-open').click();
  await expect(page.locator('#main-nav')).toHaveClass(/open/);
  await expect(page.locator('#menu-open')).toHaveAttribute('aria-expanded','true');
  await page.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));
  await expect(page.locator('.site-header')).not.toHaveClass(/is-compact/);
  await expect(page.locator('#main-nav')).not.toHaveClass(/open/);
  await expect(page.locator('#main-nav')).toBeVisible();
  await expect.poll(async()=>{
    const rect=await page.locator('.header-main').boundingBox();
    return Math.abs(rect.height-initial.height);
  }).toBeLessThanOrEqual(1);
  const restored=await page.locator('.header-main').boundingBox();
  expect(Math.abs(restored.width-initial.width)).toBeLessThanOrEqual(1);
});


test('barra inferior e viewport não crescem após rolagem e retorno ao topo',async({page})=>{
  await page.emulateMedia({reducedMotion:'no-preference'});
  await ready(page);
  // Regressão do diagnóstico: largura 390 → 602 → 772 px com barra fixa.
  // Evita que aria-label e texto duplicado criem elementos absolutos fora dos cards.
  await expect(page.locator('#category-grid .visually-hidden')).toHaveCount(0);
  const assertViewport = async (targetWidth) => {
    const metrics = await page.evaluate(() => {
      const bar=document.querySelector('#mobile-bottom-nav').getBoundingClientRect();
      const doc=document.documentElement;
      return {
        clientWidth:doc.clientWidth,innerWidth:window.innerWidth,
        documentWidth:doc.scrollWidth,barX:bar.x,barRight:bar.right,
        barWidth:bar.width,drawerHidden:document.querySelector('#drawer').getAttribute('aria-hidden')==='true',
        visualWidth:window.visualViewport?.width
      };
    });
    expect(metrics.clientWidth).toBe(targetWidth);
    expect(metrics.innerWidth).toBeLessThanOrEqual(targetWidth+1);
    expect(metrics.documentWidth).toBeLessThanOrEqual(targetWidth+1);
    expect(Math.abs(metrics.barWidth-targetWidth)).toBeLessThanOrEqual(1);
    expect(Math.abs(metrics.barX)).toBeLessThanOrEqual(1);
    expect(metrics.barRight).toBeLessThanOrEqual(targetWidth+1);
    expect(metrics.drawerHidden).toBe(true);
  };
  for(const y of [0,230,520,430,0,520,0]){
    await page.evaluate(y=>window.scrollTo({top:y,behavior:'instant'}),y);
    await page.waitForTimeout(520);
    await assertViewport(390);
  }
});

test('drawer abre e fecha sem causar overflow após fechar',async({page})=>{
  await ready(page);
  await expect(page.locator('#drawer')).toHaveAttribute('aria-hidden','true');
  await page.locator('#mobile-nav-cart').click();
  await expect(page.locator('#drawer')).toBeVisible();
  // Mede após o término dos 250 ms da animação original de abertura.
  await page.waitForTimeout(350);
  const opened=await page.evaluate(()=>{
    const r=document.getElementById('drawer').getBoundingClientRect();
    return{x:r.x,right:r.right,width:r.width,viewport:document.documentElement.clientWidth};
  });
  expect(opened.right).toBeLessThanOrEqual(opened.viewport+1);
  expect(opened.x).toBeGreaterThanOrEqual(-1);
  await page.locator('#drawer-close').click();
  await expect(page.locator('#drawer')).toHaveAttribute('aria-hidden','true');
  await page.evaluate(()=>window.scrollTo({top:520,behavior:'instant'}));
  await page.waitForTimeout(500);
  const values=await page.evaluate(()=>({
    document:document.documentElement.scrollWidth,
    viewport:document.documentElement.clientWidth,
    bar:document.querySelector('#mobile-bottom-nav').getBoundingClientRect().width
  }));
  expect(values.document).toBeLessThanOrEqual(values.viewport+1);
  expect(values.bar).toBeLessThanOrEqual(values.viewport+1);
});

for(const width of [320,360,430,700]){
  test('barra e documento não ultrapassam viewport depois do scroll em '+width+'px',async({page})=>{
    await page.setViewportSize({width,height:844});
    await page.emulateMedia({reducedMotion:'no-preference'});
    await ready(page);
    for(const y of [260,520,0]){
      await page.evaluate(y=>scrollTo({top:y,behavior:'instant'}),y);
      await page.waitForTimeout(350);
      const v=await page.evaluate(()=>({
        clientWidth:document.documentElement.clientWidth,
        documentWidth:document.documentElement.scrollWidth,
        innerWidth:innerWidth,
        barWidth:document.querySelector('#mobile-bottom-nav').getBoundingClientRect().width
      }));
      expect(v.documentWidth).toBeLessThanOrEqual(v.clientWidth+1);
      expect(v.innerWidth).toBeLessThanOrEqual(v.clientWidth+1);
      expect(v.barWidth).toBeLessThanOrEqual(v.clientWidth+1);
    }
  });
}

test('categorias preservam nomes acessíveis sem elementos absolutos soltos',async({page})=>{
  await ready(page);
  const cards=page.locator('#category-grid .category-card-photo');
  await expect(cards).toHaveCount(5);
  for(const card of await cards.all()){
    await expect(card).toHaveAttribute('aria-label',/Ver (Brincos|Colares|Pulseiras|Anéis|Kits)/);
    await expect(card).toHaveCSS('position','relative');
    await expect(card.locator('.visually-hidden')).toHaveCount(0);
  }
});


test('desktop não pisca durante pequenas oscilações de rolagem',async({page})=>{
  await page.setViewportSize({width:1100,height:800});
  await page.emulateMedia({reducedMotion:'no-preference'});
  await ready(page);
  await page.evaluate(()=>{
    window.__headerStateChanges=[];
    const el=document.querySelector('.site-header');
    new MutationObserver(()=>{
      window.__headerStateChanges.push({
        compact:el.classList.contains('is-compact'),
        y:window.scrollY,
        height:el.getBoundingClientRect().height,
        logo:el.querySelector('.brand img').getBoundingClientRect().width
      });
    }).observe(el,{attributes:true,attributeFilter:['class']});
  });

  const jump=async y=>{
    await page.evaluate(y=>scrollTo({top:y,behavior:'instant'}),y);
    await page.waitForTimeout(65);
  };
  await jump(520);
  await expect(page.locator('.site-header')).toHaveClass(/is-compact/);

  // Scroll anchoring e pequenos movimentos não devem expandir e recompactar.
  for(const y of [510,518,499,513,505,520]){
    await jump(y);
    await expect(page.locator('.site-header')).toHaveClass(/is-compact/);
  }
  await page.waitForTimeout(560);
  await expect(page.locator('.site-header')).toHaveClass(/is-compact/);
  await jump(512);
  await jump(520);
  await expect(page.locator('.site-header')).toHaveClass(/is-compact/);

  await jump(410);
  await expect(page.locator('.site-header')).not.toHaveClass(/is-compact/);
  await page.waitForTimeout(550);
  // A expansão acrescenta altura ao sticky: a descida precisa ser efetiva,
  // independentemente do ajuste automático de scroll anchoring.
  await jump(760);
  await expect(page.locator('.site-header')).toHaveClass(/is-compact/);
  const history=await page.evaluate(()=>window.__headerStateChanges);
  expect(history.map(e=>e.compact)).toEqual([true,false,true]);
});

test('desktop mantém tamanho estável após compactar e restaurar',async({page})=>{
  await page.setViewportSize({width:1200,height:800});
  await page.emulateMedia({reducedMotion:'no-preference'});
  await ready(page);
  const dimensions=()=>page.evaluate(()=>{
    const head=document.querySelector('.header-main').getBoundingClientRect();
    const logo=document.querySelector('.brand img').getBoundingClientRect();
    return{header:head.height,logo:logo.width,scrollWidth:document.documentElement.scrollWidth,
      viewport:document.documentElement.clientWidth};
  });
  const original=await dimensions();
  await page.evaluate(()=>scrollTo({top:500,behavior:'instant'}));
  await expect(page.locator('.site-header')).toHaveClass(/is-compact/);
  await page.waitForTimeout(560);
  const compact=await dimensions();
  expect(compact.header).toBeLessThan(original.header);
  expect(compact.logo).toBeLessThan(original.logo);
  expect(compact.scrollWidth).toBeLessThanOrEqual(compact.viewport+1);
  await page.setViewportSize({width:1220,height:800});
  await page.waitForTimeout(130);
  await expect(page.locator('.site-header')).toHaveClass(/is-compact/);
  await page.evaluate(()=>scrollTo({top:0,behavior:'instant'}));
  await expect(page.locator('.site-header')).not.toHaveClass(/is-compact/);
  await page.waitForTimeout(150);
  const restored=await dimensions();
  expect(Math.abs(restored.header-original.header)).toBeLessThanOrEqual(1);
  expect(Math.abs(restored.logo-original.logo)).toBeLessThanOrEqual(1);
});

test('foto premium de presentes carrega no desktop sem duplicar o texto HTML',async({page})=>{
  await page.setViewportSize({width:1280,height:800});
  await ready(page);
  await page.locator('#presentes').scrollIntoViewIfNeeded();
  const photo=page.locator('#presentes .gift-photo');
  await expect(photo).toHaveAttribute('src',/presentes-margot-premium\.jpg\?v=1\.21$/);
  await expect.poll(()=>photo.evaluate(el=>el.complete&&el.naturalWidth)).toBe(1021);
  await expect(page.locator('#gift-title')).toHaveCount(1);
  await expect(page.locator('#presentes .gift-copy .button')).toBeVisible();
  await expect(page.locator('#presentes .gift-photo')).toHaveCSS('object-fit','contain');
  const dimension=await page.evaluate(()=>{
    const photo=document.querySelector('#presentes .gift-photo').getBoundingClientRect();
    const section=document.querySelector('#presentes').getBoundingClientRect();
    return{imageWidth:photo.width,sectionWidth:section.width,documentWidth:document.documentElement.scrollWidth,viewport:document.documentElement.clientWidth};
  });
  expect(dimension.imageWidth).toBeLessThan(dimension.sectionWidth);
  expect(dimension.documentWidth).toBeLessThanOrEqual(dimension.viewport+1);
});

test('foto de presentes continua nítida e proporcional no mobile',async({page})=>{
  await ready(page);
  await page.locator('#presentes').scrollIntoViewIfNeeded();
  const photo=page.locator('#presentes .gift-photo');
  await expect.poll(()=>photo.evaluate(el=>el.complete&&el.naturalWidth)).toBe(1021);
  await expect(photo).toHaveCSS('object-fit','cover');
  const dimensions=await photo.boundingBox();
  expect(dimensions.width).toBeGreaterThan(300);
  expect(dimensions.height).toBeGreaterThan(200);
  await expect(page.locator('#presentes .gift-copy .button')).toBeVisible();
  const metrics=await page.evaluate(()=>({documentWidth:document.documentElement.scrollWidth,viewport:document.documentElement.clientWidth}));
  expect(metrics.documentWidth).toBeLessThanOrEqual(metrics.viewport+1);
});


test('fotografia da conexão carrega e substitui a logo da assinatura no desktop',async({page})=>{
  await page.setViewportSize({width:1280,height:800});
  await ready(page);
  await page.locator('.closing-note').scrollIntoViewIfNeeded();
  const section=page.locator('.closing-note');
  const photo=section.locator('.closing-note__photo');
  await expect(photo).toHaveAttribute('src',/margot-conexao-feminina\.jpg\?v=1\.23$/);
  await expect.poll(()=>photo.evaluate(el=>el.complete&&el.naturalWidth)).toBe(2016);
  await expect(section.locator('.closing-note__logo')).toHaveCount(0);
  await expect(section.locator('.closing-note__pearl')).toHaveCount(0);
  await expect(section.locator('.closing-note__sparkle')).toHaveCount(0);
  await expect(section.locator('h2')).toHaveText('Seu brilho está nos detalhes.');
  await expect(section.locator('.closing-note__link')).toBeVisible();
  const layout=await page.evaluate(()=>{
    const panel=document.querySelector('.closing-note__panel').getBoundingClientRect();
    const copy=document.querySelector('.closing-note__copy').getBoundingClientRect();
    const photo=document.querySelector('.closing-note__photo');
    return {panelX:panel.x,panelWidth:panel.width,copyX:copy.x,
      // clientWidth é a largura do layout; getBoundingClientRect inclui o scale do GSAP.
      photoWidth:photo.clientWidth,doc:document.documentElement.scrollWidth,
      viewport:document.documentElement.clientWidth};
  });
  expect(layout.copyX).toBeGreaterThan(layout.panelX+layout.panelWidth*.45);
  expect(Math.abs(layout.photoWidth-layout.panelWidth)).toBeLessThanOrEqual(2);
  expect(layout.doc).toBeLessThanOrEqual(layout.viewport+1);
});

for(const width of [320,390,700,900,1280]){
  test('cena de encerramento responsiva sem overflow em '+width+'px',async({page})=>{
    await page.setViewportSize({width,height:800});
    await ready(page);
    await page.locator('.closing-note').scrollIntoViewIfNeeded();
    await expect(page.locator('.closing-note__photo')).toBeVisible();
    await expect(page.locator('.closing-note__title')).toBeVisible();
    await expect(page.locator('.closing-note__link')).toBeVisible();
    const geometry=await page.evaluate(()=>{
      const panel=document.querySelector('.closing-note__panel').getBoundingClientRect();
      const media=document.querySelector('.closing-note__media').getBoundingClientRect();
      const copy=document.querySelector('.closing-note__copy').getBoundingClientRect();
      return{viewport:document.documentElement.clientWidth,
        doc:document.documentElement.scrollWidth, panelLeft:panel.left,panelRight:panel.right,
        mediaBottom:media.bottom,copyTop:copy.top,photoWidth:media.width};
    });
    expect(geometry.doc).toBeLessThanOrEqual(geometry.viewport+1);
    expect(geometry.panelLeft).toBeGreaterThanOrEqual(0);
    expect(geometry.panelRight).toBeLessThanOrEqual(geometry.viewport+1);
    if(width<=900)expect(geometry.copyTop).toBeGreaterThanOrEqual(geometry.mediaBottom-2);
  });
}

test('cena sem movimento conserva imagem, título e link',async({page})=>{
  await page.emulateMedia({reducedMotion:'reduce'});
  await ready(page);
  await page.locator('.closing-note').scrollIntoViewIfNeeded();
  await expect(page.locator('.closing-note__photo')).toHaveCSS('transform','none');
  await expect(page.locator('.closing-note__title')).toBeVisible();
  await expect(page.locator('.closing-note__link')).toBeVisible();
});

test('link do encerramento retorna para produtos',async({page})=>{
  await ready(page);
  const link=page.locator('.closing-note__link');
  await link.scrollIntoViewIfNeeded();
  await link.click();
  await expect(page).toHaveURL(/#produtos$/);
});

test('paleta de encerramento conecta marfim e vinho com o rodapé rosé',async({page})=>{
  await page.setViewportSize({width:1280,height:800});
  await ready(page);
  await page.locator('.closing-note').scrollIntoViewIfNeeded();
  const colors=await page.evaluate(()=>{
    const cs=selector=>getComputedStyle(document.querySelector(selector));
    return{
      panel:cs('.closing-note__panel').backgroundColor,
      title:cs('.closing-note__title').color,
      message:cs('.closing-note__message').color,
      eyebrow:cs('.closing-note__eyebrow').color,
      link:cs('.closing-note__link').color,
      fade:cs('.closing-note__panel').getPropertyValue('background-color'),
      overlay:getComputedStyle(document.querySelector('.closing-note__panel'),'::after').backgroundImage,
      footer:cs('.footer').backgroundImage,
      documentWidth:document.documentElement.scrollWidth,
      viewportWidth:document.documentElement.clientWidth
    };
  });
  expect(colors.panel).toBe('rgb(249, 245, 240)');
  expect(colors.title).toBe('rgb(117, 74, 85)');
  expect(colors.message).toBe('rgb(100, 92, 84)');
  expect(colors.eyebrow).toBe('rgb(95, 117, 94)');
  expect(colors.link).toBe('rgb(117, 74, 85)');
  expect(colors.overlay).toContain('rgba(249, 245, 240, 0.98)');
  expect(colors.footer).toContain('linear-gradient');
  expect(colors.footer).toContain('rgb(242, 222, 219)');
  expect(colors.documentWidth).toBeLessThanOrEqual(colors.viewportWidth+1);
});

test('mobile mantém foto livre e contraste no texto com paleta rosé',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await ready(page);
  await page.locator('.closing-note').scrollIntoViewIfNeeded();
  const state=await page.evaluate(()=>{
    const copy=document.querySelector('.closing-note__copy');
    const photo=document.querySelector('.closing-note__photo');
    const media=document.querySelector('.closing-note__media');
    const footer=document.querySelector('.footer');
    return{
      background:getComputedStyle(copy).backgroundColor,
      title:getComputedStyle(document.querySelector('.closing-note__title')).color,
      imgLoaded:photo.complete&&photo.naturalWidth>0,
      imageBottom:media.getBoundingClientRect().bottom,
      copyTop:copy.getBoundingClientRect().top,
      footerGradient:getComputedStyle(footer).backgroundImage,
      pageWidth:document.documentElement.scrollWidth,
      viewport:document.documentElement.clientWidth
    };
  });
  expect(state.background).toBe('rgb(249, 245, 240)');
  expect(state.title).toBe('rgb(117, 74, 85)');
  expect(state.imgLoaded).toBe(true);
  expect(state.copyTop).toBeGreaterThanOrEqual(state.imageBottom-2);
  expect(state.footerGradient).toContain('linear-gradient');
  expect(state.pageWidth).toBeLessThanOrEqual(state.viewport+1);
});

test('logo minimalista do rodapé substitui a antiga sem frase duplicada',async({page})=>{
  await ready(page);
  const brand=page.locator('footer .footer-brand');
  const img=brand.locator('img');
  await brand.scrollIntoViewIfNeeded();
  await expect(img).toHaveAttribute('src',/margot-logo-minimal-footer\.png\?v=1\.25$/);
  await expect.poll(()=>img.evaluate(el=>el.complete ? el.naturalWidth : 0)).toBe(753);
  await expect.poll(()=>img.evaluate(el=>el.complete ? el.naturalHeight : 0)).toBe(440);
  await expect(brand).toHaveCSS('background-color','rgba(0, 0, 0, 0)');
  await expect(page.locator('footer')).not.toContainText('Delicadeza em cada detalhe.');
  // A logo oficial das outras áreas não é substituída.
  await expect(page.locator('.site-header .brand img')).toHaveAttribute('src',/margot-logo\.webp/);
});

for(const width of [320,390,1280]){
  test('logo do rodapé permanece discreta e dentro da tela em '+width+'px',async({page})=>{
    await page.setViewportSize({width,height:800});
    await ready(page);
    await page.locator('footer .footer-brand').scrollIntoViewIfNeeded();
    const m=await page.evaluate(()=>{
      const brand=document.querySelector('footer .footer-brand').getBoundingClientRect();
      const img=document.querySelector('footer .footer-brand img').getBoundingClientRect();
      return{brandWidth:brand.width,imgWidth:img.width,brandLeft:brand.left,
        brandRight:brand.right,documentWidth:document.documentElement.scrollWidth,
        viewport:document.documentElement.clientWidth};
    });
    expect(m.brandWidth).toBeLessThanOrEqual(width<=700?141:155);
    expect(Math.abs(m.imgWidth-m.brandWidth)).toBeLessThanOrEqual(2);
    expect(m.brandLeft).toBeGreaterThanOrEqual(0);
    expect(m.brandRight).toBeLessThanOrEqual(m.viewport+1);
    expect(m.documentWidth).toBeLessThanOrEqual(m.viewport+1);
  });
}
