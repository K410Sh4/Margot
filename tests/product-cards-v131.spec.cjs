const {test,expect}=require('@playwright/test');
const fs=require('node:fs');
const path=require('node:path');

// O Firestore real não é necessário para validar apresentação: dados simulados
// ficam somente no navegador de testes e não alteram o catálogo público.
const today=new Date().toISOString().slice(0,10);
const month=today.slice(0,7);
function shift(days){
  const d=new Date(today+'T12:00:00Z');
  d.setUTCDate(d.getUTCDate()+days);
  return d.toISOString().slice(0,10);
}
async function staticCatalog(page){
  await page.route('**/site-live.js*',route=>route.fulfill({
    status:200,contentType:'text/javascript',body:'// catálogo estático nos testes'
  }));
}
async function verifiedOffer(page){
  await page.route('**/merchandising-data.js*',route=>route.fulfill({
    status:200,contentType:'text/javascript',
    body:'window.MargotCommercialData='+JSON.stringify({products:{
      'brinco-coracao':{
        promotion:{confirmed:true,source:'Tabela de preços validada',
          originalPrice:24.90,salePrice:14.90,checkedAt:today,
          startsAt:shift(-1),endsAt:shift(10)},
        tags:{confirmed:true,source:'Relatório mensal de vendas',
          favorite:true,bestSellerMonth:month,checkedAt:today},
        inventory:{confirmed:true,source:'Contagem física conferida',
          quantity:5,checkedAt:today}
      }
    }})+';'
  }));
}
async function widthCheck(page){
  const sizes=await page.evaluate(()=>({
    viewport:document.documentElement.clientWidth,
    page:document.documentElement.scrollWidth
  }));
  expect(sizes.page).toBeLessThanOrEqual(sizes.viewport+1);
}

test('nova estrutura: imagem, nome, valor, sacola completa e link para detalhes',async({page})=>{
  await staticCatalog(page);
  await page.goto('/',{waitUntil:'domcontentloaded'});
  const cards=page.locator('#product-grid .product-card');
  await expect(cards).toHaveCount(8);
  const first=cards.first();
  await expect(first.locator('.product-visual .product-photo')).toBeVisible();
  await expect(first.locator('.product-title-link')).toBeVisible();
  await expect(first.locator('.product-price-line .price')).toHaveText('R$ 14,90');
  await expect(first.locator('.product-savings')).toHaveCount(0);
  await expect(first.locator('.product-photo-signature')).toHaveCount(0);
  await expect(first.locator('.add-to-cart .product-cart-label')).toHaveText('Adicionar à sacola');
  await expect(first.locator('.add-to-cart .product-cart-arrow')).toBeVisible();
  await expect(first.locator('.product-open')).toHaveAttribute('href','./produto.html?id=brinco-coracao');
  await expect(page.locator('#product-grid .product-badge--discount')).toHaveCount(0);
  await expect(page.locator('#product-grid .product-stock')).toHaveCount(0);
  await expect(page.locator('body')).not.toContainText('203 avaliações');
  await expect(page.locator('body')).not.toContainText('Hipoalergênica');
});

test('oferta verificada mostra economia, desconto, estoque e tema premium mensal',async({page})=>{
  await staticCatalog(page);
  await verifiedOffer(page);
  await page.goto('/',{waitUntil:'domcontentloaded'});
  const card=page.locator('#product-grid .product-card').first();
  await expect(card).toHaveClass(/product-card--signature/);
  await expect(card.locator('.product-badge--favorite')).toHaveText('Peça favorita');
  await expect(card.locator('.product-badge--bestseller')).toHaveText('Mais vendida do mês');
  await expect(card.locator('.product-badge--discount')).toHaveText('-40%');
  await expect(card.locator('.product-price-line .price')).toHaveText('R$ 14,90');
  await expect(card.locator('.product-old-price')).toHaveText('R$ 24,90');
  await expect(card.locator('.product-savings')).toContainText('Economize');
  await expect(card.locator('.product-savings strong')).toHaveText('R$ 10,00');
  await expect(card.locator('.product-stock')).toContainText('Restam 5 unidades');
  await expect(card.locator('.product-info .add-to-cart')).toBeEnabled();
  const promo=page.locator('#promotion-grid .product-card');
  await expect(promo).toHaveCount(1);
  await expect(promo.locator('.product-savings strong')).toHaveText('R$ 10,00');
  await promo.locator('.add-to-cart').click();
  await expect(page.locator('#cart-count')).toHaveText('1');
  await expect(promo.locator('.add-to-cart')).toBeEnabled();
  await page.locator('#cart-open').click();
  await expect(page.locator('#drawer-items')).toContainText('Brinco Coração Dourado');
  await expect(page.locator('#drawer-items')).toContainText('R$ 14,90');
});

test('produto sem estoque desabilita ação e mantém detalhes e favoritos',async({page})=>{
  await staticCatalog(page);
  const data={products:{
    'brinco-coracao':{inventory:{confirmed:true,source:'Contagem física conferida',quantity:0,checkedAt:today}}
  }};
  await page.route('**/merchandising-data.js*',route=>route.fulfill({
    status:200,contentType:'text/javascript',
    body:'window.MargotCommercialData='+JSON.stringify(data)+';'
  }));
  await page.goto('/',{waitUntil:'domcontentloaded'});
  const card=page.locator('#product-grid .product-card').first();
  await expect(card.locator('.product-stock')).toContainText('Indisponível');
  await expect(card.locator('.product-cart-label')).toHaveText('Indisponível');
  await expect(card.locator('.add-to-cart')).toBeDisabled();
  await card.locator('[data-favorite]').click();
  await expect(page.locator('#product-grid .product-card').first().locator('[data-favorite]')).toHaveAttribute('aria-pressed','true');
  await page.locator('#product-grid .product-card').first().locator('.product-title-link').click();
  await expect(page).toHaveURL(/produto\.html\?id=brinco-coracao/);
});

test('foto real apresenta assinatura discreta; fallback não deixa assinatura sobre placeholder',async({page})=>{
  await staticCatalog(page);
  await page.goto('/',{waitUntil:'domcontentloaded'});
  const photo='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+PAb8AAAAASUVORK5CYII=';
  await page.evaluate(image=>{
    const base=window.MargotCatalog;
    window.MargotCatalog={...base,products:base.products.map(p=>
      p.id==='brinco-coracao'?{...p,image}:p)};
    window.dispatchEvent(new CustomEvent('margot:catalog-updated'));
  },photo);
  let card=page.locator('#product-grid .product-card').first();
  await expect(card.locator('.product-photo-signature')).toBeVisible();
  await expect(card.locator('.demo-tag')).toBeHidden();
  await expect(card.locator('.product-photo')).toHaveAttribute('src',photo);
  await page.evaluate(()=>{
    const base=window.MargotCatalog;
    window.MargotCatalog={...base,products:base.products.map(p=>
      p.id==='brinco-coracao'?{...p,image:'./assets/arquivo-inexistente.jpg'}:p)};
    window.dispatchEvent(new CustomEvent('margot:catalog-updated'));
  });
  card=page.locator('#product-grid .product-card').first();
  await expect(card.locator('.demo-tag')).toBeVisible();
  await expect(card.locator('.product-visual')).toHaveClass(/is-photo-missing/);
});

for(const width of [320,390,640,768,1024,1280]){
  test('layout premium sem overflow, CTA legível e grid correto em '+width+'px',async({page})=>{
    await staticCatalog(page);
    await verifiedOffer(page);
    await page.setViewportSize({width,height:850});
    await page.goto('/',{waitUntil:'domcontentloaded'});
    const grid=page.locator('#product-grid');
    await grid.scrollIntoViewIfNeeded();
    await expect(grid.locator('.product-card').first()).toBeVisible();
    await widthCheck(page);
    const dims=await page.evaluate(()=>{
      const el=document.querySelector('#product-grid');
      const card=el.querySelector('.product-card');
      const button=card.querySelector('.add-to-cart');
      const root=el.getBoundingClientRect();
      const a=card.getBoundingClientRect(),b=button.getBoundingClientRect();
      return {columns:getComputedStyle(el).gridTemplateColumns.split(' ').filter(Boolean).length,
        cardWidth:a.width,buttonWidth:b.width,buttonHeight:b.height,
        buttonText:button.querySelector('.product-cart-label').getBoundingClientRect().width,
        width:root.width};
    });
    expect(dims.columns).toBe(width<=359?1:width<=800?2:width<=1120?3:4);
    expect(dims.cardWidth).toBeGreaterThan(width<=359?200:140);
    expect(dims.buttonWidth).toBeGreaterThan(dims.cardWidth*.75);
    expect(dims.buttonHeight).toBeGreaterThanOrEqual(44);
    expect(dims.buttonText).toBeGreaterThan(width>=360&&width<=640?70:90);
    if(width===1280)expect(dims.cardWidth).toBeLessThan(315);
    if(width===390)expect(dims.cardWidth).toBeLessThan(200);
    await page.locator('#promocoes').scrollIntoViewIfNeeded();
    await widthCheck(page);
    const artifact=path.join('test-results','product-cards-v131');
    fs.mkdirSync(artifact,{recursive:true});
    await page.locator('#product-grid').scrollIntoViewIfNeeded();
    await page.locator('#product-grid').screenshot({
      path:path.join(artifact,'margot-cards-'+width+'.png'),
      animations:'disabled'
    });
  });
}
