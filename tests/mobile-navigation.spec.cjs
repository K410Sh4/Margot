const {test,expect} = require('@playwright/test');

test.use({viewport:{width:390,height:844},hasTouch:true});

test.beforeEach(async ({page}) => { await page.route('https://www.gstatic.com/firebasejs/**', route => route.abort()); });

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
