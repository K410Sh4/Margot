const {test,expect}=require('@playwright/test');
const fs=require('node:fs');
const path=require('node:path');

test.use({viewport:{width:390,height:844},isMobile:true,hasTouch:true});

const items=[
  ['brinco-coracao','Brinco Coração Dourado','R$ 14,90'],
  ['colar-perola','Colar Pérola Delicada','R$ 21,90'],
  ['pulseira-coracao','Pulseira Coração','R$ 18,90'],
  ['argola-classica','Argola Clássica','R$ 14,90'],
  ['anel-onda','Anel Onda Dourado','R$ 15,90'],
  ['brinco-luz','Brinco Ponto de Luz','R$ 14,90'],
  ['colar-coracao','Colar Coração','R$ 27,90'],
  ['kit-delicado','Kit Delicadeza','R$ 39,90']
];
async function openProduct(page,id='brinco-coracao'){
  await page.goto('/produto.html?id='+id,{waitUntil:'domcontentloaded'});
  await expect(page.locator('#pd-product')).toBeVisible();
}
async function noOverflow(page){
  const metrics=await page.evaluate(()=>({
    viewport:document.documentElement.clientWidth,
    documentWidth:document.documentElement.scrollWidth,
    x:scrollX
  }));
  expect(metrics.documentWidth).toBeLessThanOrEqual(metrics.viewport+1);
  expect(metrics.x).toBe(0);
}

test('cada produto da vitrine abre seu detalhe correto',async({page})=>{
  await page.goto('/',{waitUntil:'domcontentloaded'});
  await expect(page.locator('#product-grid .product-card')).toHaveCount(8);
  await expect(page.locator('#product-grid .product-open')).toHaveCount(8);
  await page.locator('#product-grid .product-card').first().locator('.product-open').click();
  await expect(page).toHaveURL(/produto\.html\?id=brinco-coracao$/);
  await expect(page.locator('#pd-title')).toHaveText('Brinco Coração Dourado');
  await expect(page.locator('#pd-price')).toHaveText('R$ 14,90');
});

for(const [id,name,price] of items){
  test('produto '+id+' mostra identidade e preço demonstrativo',async({page})=>{
    await openProduct(page,id);
    await expect(page.locator('#pd-title')).toHaveText(name);
    await expect(page.locator('#pd-price')).toHaveText(price);
    await expect(page.locator('.pd-preview-price')).toContainText('ilustrativo');
    await expect(page.locator('.pd-availability')).toContainText('a confirmar');
    await expect(page.locator('#pd-main-image')).toHaveAttribute('src','./assets/foto-em-breve.webp');
    await expect(page.locator('#pd-thumbnails')).toBeHidden();
    await expect(page.locator('#pd-zoom')).toBeHidden();
    await expect(page.locator('#pd-photo-note')).toHaveText('Foto em breve');
    await noOverflow(page);
  });
}

test('detalhes oferecem WhatsApp com contexto da peça selecionada',async({page})=>{
  await openProduct(page,'colar-perola');
  const contact=page.locator('#pd-contact-whatsapp');
  await expect(contact).toBeVisible();
  await expect(contact).toHaveAttribute('target','_blank');
  const href=await contact.getAttribute('href');
  const url=new URL(href);
  expect(url.origin).toBe('https://wa.me');
  expect(url.pathname).toBe('/5535997450100');
  expect(url.searchParams.get('text')).toContain('Colar Pérola Delicada');
  expect(url.searchParams.get('text')).toContain('disponibilidade');
  await expect(page.locator('.pd-help')).toContainText('Fale com a Margot pelo WhatsApp');
});

test('link inválido mostra estado vazio sem falha de JavaScript',async({page})=>{
  await page.goto('/produto.html?id=desconhecido',{waitUntil:'domcontentloaded'});
  await expect(page.locator('#pd-not-found')).toBeVisible();
  await expect(page.locator('#pd-product')).toBeHidden();
  await expect(page.locator('#pd-not-found a')).toHaveAttribute('href','./index.html#produtos');
  await noOverflow(page);
});

test('quantidade respeita 1 a 99 inclusive quando digitada diretamente',async({page})=>{
  await openProduct(page);
  await expect(page.locator('#pd-qty-input')).toHaveValue('1');
  await expect(page.locator('#pd-decrease')).toBeDisabled();
  await page.locator('#pd-increase').click();
  await expect(page.locator('#pd-qty-input')).toHaveValue('2');
  await page.locator('#pd-qty-input').fill('999');
  await page.locator('#pd-qty-input').blur();
  await expect(page.locator('#pd-qty-input')).toHaveValue('99');
  await expect(page.locator('#pd-increase')).toBeDisabled();
  await page.locator('#pd-qty-input').fill('-10');
  await page.locator('#pd-qty-input').blur();
  await expect(page.locator('#pd-qty-input')).toHaveValue('1');
});

test('adicionar na página individual aparece na sacola real da vitrine',async({page})=>{
  await openProduct(page);
  await page.locator('#pd-increase').click();
  await page.locator('#pd-add').click();
  await expect(page.locator('#pd-cart-count')).toHaveText('2');
  await expect(page.locator('#pd-view-cart')).toBeVisible();
  await page.locator('#pd-view-cart').click();
  await expect(page).toHaveURL(/index\.html/);
  await expect(page.locator('#drawer')).toHaveClass(/open/);
  await expect(page.locator('#drawer-title')).toHaveText('Sua sacola');
  await expect(page.locator('#drawer-items')).toContainText('Brinco Coração Dourado');
  await expect(page.locator('#drawer-items .quantity span')).toHaveText('2');
  await expect(page.locator('#drawer-footer')).toContainText('Subtotal estimado');
  await expect(page.locator('#drawer-footer')).toContainText('Valores ilustrativos');
  await page.locator('#drawer-close').click();
  await expect(page.locator('#drawer')).not.toHaveClass(/open/);
  await expect(page).not.toHaveURL(/sacola=1/);
});

test('não duplica quantidade acima de 99 e preserva o limite da vitrine',async({page})=>{
  await openProduct(page);
  await page.locator('#pd-qty-input').fill('99');
  await page.locator('#pd-qty-input').blur();
  await page.locator('#pd-add').click();
  await expect(page.locator('#pd-cart-count')).toHaveText('99');
  await expect(page.locator('#pd-add-label')).toHaveText('Adicionado ao carrinho');
  await page.locator('#pd-add').click();
  await expect(page.locator('#drawer')).toHaveClass(/open/);
  await expect(page.locator('#cart-count')).toHaveText('99');
  const cart=await page.evaluate(()=>JSON.parse(localStorage.getItem('margot-cart')));
  expect(cart['brinco-coracao']).toBe(99);
});

test('favoritos são compartilhados com a vitrine e persistem no reload',async({page})=>{
  await openProduct(page,'colar-perola');
  await expect(page.locator('#pd-favorite')).toHaveAttribute('aria-pressed','false');
  await page.locator('#pd-favorite').click();
  await expect(page.locator('#pd-favorite')).toHaveAttribute('aria-pressed','true');
  await page.reload({waitUntil:'domcontentloaded'});
  await expect(page.locator('#pd-favorite')).toHaveAttribute('aria-pressed','true');
  await page.goto('/',{waitUntil:'domcontentloaded'});
  await expect(page.locator('[data-favorite="colar-perola"]')).toHaveAttribute('aria-pressed','true');
  await page.goto('/produto.html?id=colar-perola',{waitUntil:'domcontentloaded'});
  await page.locator('#pd-favorite').click();
  await expect(page.locator('#pd-favorite')).toHaveAttribute('aria-pressed','false');
});

test('não inventa avaliações nem especificações dos produtos',async({page})=>{
  await openProduct(page);
  await expect(page.locator('.pd-accordions details')).toHaveCount(4);
  await page.locator('.pd-accordions summary').filter({hasText:'Avaliações'}).click();
  await expect(page.locator('.pd-accordions details').filter({hasText:'Avaliações'}).locator('.pd-accordion-content')).toContainText('avaliações verificadas');
  await page.locator('.pd-accordions summary').filter({hasText:'Especificações'}).click();
  await expect(page.locator('.pd-accordions')).toContainText('A confirmar com a loja');
  await expect(page.locator('.pd-promises')).toContainText('Sem cobrança agora');
  await expect(page.locator('body')).not.toContainText('Comprar agora');
  await expect(page.locator('body')).not.toContainText('3x sem juros');
});

test('recomendações ligam para produtos realmente cadastrados',async({page})=>{
  await openProduct(page,'colar-perola');
  const cards=page.locator('#pd-related-grid .pd-related-card');
  await expect(cards).toHaveCount(4);
  await expect(cards.first()).toHaveAttribute('href','./produto.html?id=colar-coracao');
  await cards.first().click();
  await expect(page.locator('#pd-title')).toHaveText('Colar Coração');
});

for(const width of [320,390,700,1024,1280]){
  test('layout V3 sem overflow em '+width+'px',async({page})=>{
    await page.setViewportSize({width,height:850});
    await openProduct(page,'anel-onda');
    await expect(page.locator('#pd-title')).toBeVisible();
    await expect(page.locator('#pd-add')).toBeVisible();
    await expect(page.locator('#pd-main-image')).toBeVisible();
    await page.locator('.pd-details').scrollIntoViewIfNeeded();
    await noOverflow(page);
    await page.locator('.pd-related').scrollIntoViewIfNeeded();
    await noOverflow(page);
    const positions=await page.evaluate(()=>{
      const main=document.querySelector('.pd-grid').getBoundingClientRect();
      const photo=document.querySelector('.pd-picture-frame').getBoundingClientRect();
      const panel=document.querySelector('.pd-buy-panel').getBoundingClientRect();
      return {mainWidth:main.width,photoWidth:photo.width,panelWidth:panel.width,
        photoBottom:photo.bottom,panelTop:panel.top,photoRight:photo.right,panelLeft:panel.left};
    });
    expect(positions.photoWidth).toBeGreaterThan(200);
    expect(positions.panelWidth).toBeGreaterThan(220);
    if(width<=700)expect(positions.panelTop).toBeGreaterThanOrEqual(positions.photoBottom-2);
    else expect(positions.panelLeft).toBeGreaterThanOrEqual(positions.photoRight-2);
  });
}

test('capturas V3 desktop e mobile são geradas com o conteúdo final',async({page})=>{
  const folder=path.join('test-results','product-detail-previews');
  fs.mkdirSync(folder,{recursive:true});
  for(const [label,width,height] of [['mobile-390',390,844],['desktop-1280',1280,850],['mobile-320',320,720]]){
    await page.setViewportSize({width,height});
    await openProduct(page,'brinco-coracao');
    await page.screenshot({path:path.join(folder,'margot-produto-v3-'+label+'.png'),
      fullPage:true,animations:'disabled',caret:'hide'});
    await noOverflow(page);
  }
});
