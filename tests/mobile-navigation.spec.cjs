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
  await page.evaluate(()=>{for(let i=0;i<105;i++) document.querySelector('[data-add="brinco-coracao"]').click()});
  expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('margot-cart'))['brinco-coracao'])).toBe(99);
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
  const assertViewport = async (targetWidth) => {
    const metrics = await page.evaluate(() => {
      const bar=document.querySelector('#mobile-bottom-nav').getBoundingClientRect();
      const doc=document.documentElement;
      return {
        clientWidth:doc.clientWidth,innerWidth:window.innerWidth,
        documentWidth:doc.scrollWidth,barX:bar.x,barRight:bar.right,
        barWidth:bar.width,drawerDisplay:getComputedStyle(document.querySelector('#drawer')).display,
        visualWidth:window.visualViewport?.width
      };
    });
    expect(metrics.clientWidth).toBe(targetWidth);
    expect(metrics.innerWidth).toBeLessThanOrEqual(targetWidth+1);
    expect(metrics.documentWidth).toBeLessThanOrEqual(targetWidth+1);
    expect(Math.abs(metrics.barWidth-targetWidth)).toBeLessThanOrEqual(1);
    expect(Math.abs(metrics.barX)).toBeLessThanOrEqual(1);
    expect(metrics.barRight).toBeLessThanOrEqual(targetWidth+1);
    expect(metrics.drawerDisplay).toBe('none');
  };
  for(const y of [0,230,520,430,0,520,0]){
    await page.evaluate(y=>window.scrollTo({top:y,behavior:'instant'}),y);
    await page.waitForTimeout(520);
    await assertViewport(390);
  }
});

test('drawer só aparece aberto e não causa overflow após fechar',async({page})=>{
  await ready(page);
  await expect(page.locator('#drawer')).toBeHidden();
  await expect(page.locator('#drawer')).toHaveCSS('display','none');
  await page.locator('#mobile-nav-cart').click();
  await expect(page.locator('#drawer')).toBeVisible();
  const opened=await page.evaluate(()=>{
    const r=document.getElementById('drawer').getBoundingClientRect();
    return{x:r.x,right:r.right,width:r.width,viewport:document.documentElement.clientWidth};
  });
  expect(opened.right).toBeLessThanOrEqual(opened.viewport+1);
  expect(opened.x).toBeGreaterThanOrEqual(-1);
  await page.locator('#drawer-close').click();
  await expect(page.locator('#drawer')).toHaveCSS('display','none');
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


test('ISOLAMENTO TEMPORÁRIO: identificar causa da expansão do layout viewport',async({page})=>{
  test.setTimeout(120000);
  const cases=[
    ['baseline',''],
    ['ocultar-barra','.mobile-bottom-nav{display:none!important}'],
    ['barra-absoluta','.mobile-bottom-nav{position:absolute!important}'],
    ['ocultar-categorias','#category-grid{display:none!important}'],
    ['ocultar-filtros','#category-chips{display:none!important}'],
    ['ocultar-categorias-filtros','#category-grid,#category-chips{display:none!important}'],
    ['conter-categorias','#category-grid{contain:layout paint!important}'],
    ['categorias-overflow-clip','#category-grid{overflow-x:clip!important}'],
    ['ocultar-todos-fixed','.mobile-bottom-nav,.toast,.overlay,.drawer,.account-dialog,.mobile-menu-backdrop{display:none!important}'],
    ['overflow-hidden','html,body{overflow-x:hidden!important}'],
    ['overflow-visible','html,body{overflow-x:visible!important}'],
    ['overflow-root-hidden','html{overflow-x:hidden!important}body{overflow-x:clip!important}'],
    ['sem-gsap-transform','*{transform:none!important}'],
    ['ocultar-presentes','#presentes{display:none!important}'],
    ['ocultar-produtos','#produtos{display:none!important}'],
    ['ocultar-main','main{display:none!important}'],
    ['remover-sticky','.site-header{position:relative!important}'],
    ['barra-width-vw','.mobile-bottom-nav{width:100vw!important;max-width:100vw!important;right:auto!important;left:0!important}']
  ];
  const observations=[];
  for(let i=0;i<cases.length;i++){
    const [name,css]=cases[i];
    await page.goto('/?viewport-isolation='+i,{waitUntil:'domcontentloaded'});
    await expect(page.locator('html')).toHaveClass(/mobile-nav-ready/);
    if(css)await page.addStyleTag({content:css});
    await page.evaluate(()=>window.scrollTo({top:520,behavior:'instant'}));
    await page.waitForTimeout(440);
    const dimensions=await page.evaluate(()=>{
      const root=document.documentElement;
      const bar=document.getElementById('mobile-bottom-nav').getBoundingClientRect();
      const category=document.getElementById('category-grid');
      return{
        css:root.clientWidth,inner:innerWidth,height:innerHeight,document:root.scrollWidth,
        body:document.body.scrollWidth,bar:bar.width,barY:bar.y,
        vv:visualViewport?.width,scrollY:scrollY,
        categoryScrollWidth:category?.scrollWidth,categoryClientWidth:category?.clientWidth
      };
    });
    observations.push({case:name,...dimensions});
  }
  console.log('VIEWPORT_ISOLATION_JSON_START');
  console.log(JSON.stringify(observations));
  console.log('VIEWPORT_ISOLATION_JSON_END');
});
