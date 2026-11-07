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

test('após adicionar o card muda de estado e abre a sacola sem duplicar a unidade',async({page})=>{
  await staticCatalog(page);
  await page.goto('/',{waitUntil:'domcontentloaded'});
  const card=page.locator('#product-grid .product-card').first();
  const button=card.locator('.add-to-cart');
  await expect(button.locator('.product-cart-label')).toHaveText('Adicionar à sacola');
  await button.click();
  await expect(button).toHaveClass(/is-in-cart/);
  await expect(button.locator('.product-cart-label')).toHaveText('Adicionado ao carrinho');
  await expect(button).toHaveAttribute('aria-label',/Ver .* na sacola/);
  await expect(page.locator('#cart-count')).toHaveText('1');

  await button.click();
  await expect(page.locator('#drawer')).toHaveClass(/open/);
  await expect(page.locator('#drawer-title')).toHaveText('Sua sacola');
  await expect(page.locator('#cart-count')).toHaveText('1');
  await expect(page.locator('#drawer-items .quantity span')).toHaveText('1');

  // A sacola ainda permite aumentar ou remover a quantidade manualmente.
  await page.locator('#drawer-items [data-qty="brinco-coracao"][data-delta="1"]').click();
  await expect(page.locator('#cart-count')).toHaveText('2');
  await expect(button.locator('.product-cart-label')).toHaveText('Adicionado ao carrinho');
  await page.locator('#drawer-items [data-remove="brinco-coracao"]').click();
  await expect(page.locator('#cart-count')).toBeHidden();
  await expect(button.locator('.product-cart-label')).toHaveText('Adicionar à sacola');
  await page.locator('#drawer-close').click();
  await button.click();
  await expect(page.locator('#cart-count')).toHaveText('1');
  await expect(button.locator('.product-cart-label')).toHaveText('Adicionado ao carrinho');
  await page.reload({waitUntil:'domcontentloaded'});
  await expect(page.locator('#product-grid .product-card').first().locator('.product-cart-label')).toHaveText('Adicionado ao carrinho');
});

test('sacola monta seleção e subtotal para envio seguro via SAITE',async({page})=>{
  await staticCatalog(page);
  await page.goto('/',{waitUntil:'domcontentloaded'});
  await page.locator('#product-grid [data-add="brinco-coracao"]').click();
  await page.locator('#product-grid [data-add="colar-perola"]').click();
  await page.locator('#cart-open').click();
  const link=page.locator('#whatsapp-order');
  await expect(link).toBeVisible();
  await expect(link).toHaveAttribute('href','https://k410sh4.github.io/SAITE/contato.html?origem=margot');
  await expect(link).toHaveAttribute('target','_self');
  await expect(link).toContainText('Enviar pedido por e-mail');
  await expect(page.locator('#drawer-items')).toContainText('Brinco Coração Dourado');
  await expect(page.locator('#drawer-items')).toContainText('Colar Pérola Delicada');
  await expect(page.locator('#drawer-footer .subtotal')).toContainText('R$ 36,80');
  await page.locator('#drawer-items [data-qty="brinco-coracao"][data-delta="1"]').click();
  await expect(page.locator('#drawer-footer .subtotal')).toContainText('R$ 51,70');
  await expect(page.locator('#drawer-items .quantity span').first()).toHaveText('2');
  await page.locator('#drawer-items [data-remove="colar-perola"]').click();
  await expect(page.locator('#drawer-footer .subtotal')).toContainText('R$ 29,80');
  await page.locator('#drawer-items [data-remove="brinco-coracao"]').click();
  await expect(link).toHaveCount(0);
  await expect(page.locator('#drawer-items')).toContainText('Sua sacola ainda está vazia');
});

test('rodapé oferece contato seguro pela central privada',async({page})=>{
  await staticCatalog(page);
  await page.goto('/',{waitUntil:'domcontentloaded'});
  const contact=page.locator('#atendimento .margot-whatsapp-contact');
  await expect(contact).toHaveAttribute('href','https://k410sh4.github.io/SAITE/contato.html?origem=margot');
  await expect(contact).toContainText('Enviar mensagem à Margot');
  await expect(page.locator('.online-notice')).toContainText('não finaliza pagamentos nem reserva estoque');
});

test('o card de promoções acompanha o estado da vitrine e abre a sacola',async({page})=>{
  await staticCatalog(page);
  await verifiedOffer(page);
  await page.goto('/',{waitUntil:'domcontentloaded'});
  const catalogButton=page.locator('#product-grid .product-card').first().locator('.add-to-cart');
  const promotionButton=page.locator('#promotion-grid .product-card').first().locator('.add-to-cart');
  await catalogButton.click();
  await expect(promotionButton.locator('.product-cart-label')).toHaveText('Adicionado ao carrinho');
  await promotionButton.click();
  await expect(page.locator('#drawer-title')).toHaveText('Sua sacola');
  await expect(page.locator('#drawer')).toHaveClass(/open/);
  await expect(page.locator('#cart-count')).toHaveText('1');
});

test('na página de detalhes a segunda ação leva à sacola sem repetir a adição',async({page})=>{
  await staticCatalog(page);
  await page.goto('/produto.html?id=brinco-coracao',{waitUntil:'domcontentloaded'});
  const button=page.locator('#pd-add');
  await expect(button).toBeVisible();
  await expect(page.locator('#pd-add-label')).toHaveText('Adicionar à sacola');
  await button.click();
  await expect(page.locator('#pd-cart-count')).toHaveText('1');
  await expect(page.locator('#pd-add-label')).toHaveText('Adicionado ao carrinho');
  await expect(page.locator('#pd-qty-input')).toBeDisabled();
  await button.click();
  await expect(page).toHaveURL(/index\.html\?sacola=1|index\.html#produtos/);
  await expect(page.locator('#drawer')).toHaveClass(/open/);
  await expect(page.locator('#cart-count')).toHaveText('1');
});

test('vitrine sincroniza sacola e favoritos modificados em outra aba',async({page,context})=>{
  await staticCatalog(page);
  await page.goto('/',{waitUntil:'domcontentloaded'});
  const other=await context.newPage();
  await staticCatalog(other);
  await other.goto('/',{waitUntil:'domcontentloaded'});
  const product=page.locator('#product-grid [data-add="brinco-coracao"]');
  await other.locator('#product-grid [data-add="brinco-coracao"]').click();
  await expect(page.locator('#cart-count')).toHaveText('1');
  await expect(product.locator('.product-cart-label')).toHaveText('Adicionado ao carrinho');
  await product.click();
  await expect(page.locator('#drawer')).toHaveClass(/open/);
  await expect(page.locator('#drawer-items .quantity span')).toHaveText('1');
  await page.locator('#drawer-close').click();
  await other.locator('#product-grid [data-favorite="brinco-coracao"]').click();
  await expect(page.locator('#product-grid [data-favorite="brinco-coracao"]')).toHaveAttribute('aria-pressed','true');
  await other.locator('#cart-open').click();
  await other.locator('#drawer-items [data-remove="brinco-coracao"]').click();
  await expect(page.locator('#cart-count')).toBeHidden();
  await expect(product.locator('.product-cart-label')).toHaveText('Adicionar à sacola');
  await other.close();
});

test('o foco permanece no botão após atualização dos cards e da sacola',async({page})=>{
  await staticCatalog(page);
  await page.goto('/',{waitUntil:'domcontentloaded'});
  const add=page.locator('#product-grid [data-add="brinco-coracao"]');
  await add.focus();
  await page.keyboard.press('Enter');
  await expect(add).toBeFocused();
  await expect(add.locator('.product-cart-label')).toHaveText('Adicionado ao carrinho');
  await add.press('Enter');
  await expect(page.locator('#drawer')).toHaveClass(/open/);
  const increase=page.locator('#drawer-items [data-qty="brinco-coracao"][data-delta="1"]');
  await increase.focus();
  await page.keyboard.press('Enter');
  await expect(increase).toBeFocused();
  await expect(page.locator('#cart-count')).toHaveText('2');
  await page.locator('#drawer-close').click();
  await expect(add).toBeFocused();
  const favorite=page.locator('#product-grid [data-favorite="brinco-coracao"]');
  await favorite.focus();
  await page.keyboard.press('Enter');
  await expect(favorite).toBeFocused();
  await expect(favorite).toHaveAttribute('aria-pressed','true');
});

test('promoção da vitrine respeita o calendário da loja de São Paulo',async({page})=>{
  // 01h30 UTC do dia 7 ainda é 22h30 do dia 6 no horário da loja.
  await page.clock.install({time:new Date('2026-11-07T01:30:00.000Z')});
  await staticCatalog(page);
  await page.route('**/merchandising-data.js*',route=>route.fulfill({
    status:200,contentType:'text/javascript',
    body:'window.MargotCommercialData='+JSON.stringify({products:{
      'brinco-coracao':{
        promotion:{confirmed:true,source:'Preço comercial conferido',
          originalPrice:24.90,salePrice:14.90,checkedAt:'2026-11-06',
          startsAt:'2026-11-06',endsAt:'2026-11-06'}
      }
    }})+';'
  }));
  await page.goto('/',{waitUntil:'domcontentloaded'});
  const card=page.locator('#product-grid .product-card').first();
  await expect(card.locator('.price')).toHaveText('R$ 14,90');
  await expect(card.locator('.product-old-price')).toHaveText('R$ 24,90');
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
  const photo='./assets/hero-1.webp';
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

test('visual editorial compacto: foto e painel separados com CTA consistente',async({page})=>{
  await staticCatalog(page);
  await verifiedOffer(page);
  await page.setViewportSize({width:1280,height:850});
  await page.goto('/',{waitUntil:'domcontentloaded'});
  const normal=page.locator('#product-grid .product-card').nth(1);
  const special=page.locator('#product-grid .product-card').first();
  await expect(special).toHaveClass(/product-card--signature/);
  await expect(special.locator('.product-savings strong')).toHaveText('R$ 10,00');
  await expect(special.locator('.product-badge--bestseller')).toBeVisible();
  await expect(normal.locator('.product-savings')).toHaveCount(0);
  const visuals=await page.evaluate(()=>{
    const normal=document.querySelectorAll('#product-grid .product-card')[1];
    const special=document.querySelector('#product-grid .product-card--signature');
    const info=normal.querySelector('.product-info').getBoundingClientRect();
    const photo=normal.querySelector('.product-visual').getBoundingClientRect();
    return {
      panelFollowsPhoto:Math.abs(info.top-photo.bottom)<=1,
      infoPadding:parseFloat(getComputedStyle(normal.querySelector('.product-info')).paddingLeft),
      imageRatio:photo.width/photo.height,
      normalButton:getComputedStyle(normal.querySelector('.add-to-cart')).backgroundImage,
      specialButton:getComputedStyle(special.querySelector('.add-to-cart')).backgroundImage,
      brandMissing:normal.querySelector('.product-photo-signature')===null
    };
  });
  expect(visuals.panelFollowsPhoto).toBe(true);
  expect(visuals.infoPadding).toBeGreaterThanOrEqual(13);
  expect(visuals.imageRatio).toBeGreaterThan(1.55);
  expect(visuals.imageRatio).toBeLessThan(1.61);
  expect(visuals.normalButton).toContain('gradient');
  expect(visuals.specialButton).toContain('gradient');
  expect(visuals.normalButton).toBe(visuals.specialButton);
  expect(visuals.brandMissing).toBe(true);
});

for(const width of [320,360,390,430,560,600,640,700,768,920,1024,1150,1280]){
  test('layout editorial sem overflow, CTA legível e grade adaptativa em '+width+'px',async({page})=>{
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
      const gridStyle=getComputedStyle(el);
      return {columns:gridStyle.gridTemplateColumns.split(' ').filter(Boolean).length,
        gap:parseFloat(gridStyle.columnGap),
        cardWidth:a.width,buttonWidth:b.width,buttonHeight:b.height,
        buttonText:button.querySelector('.product-cart-label').getBoundingClientRect().width,
        titleFontSize:parseFloat(getComputedStyle(card.querySelector('h3')).fontSize),
        width:root.width};
    });
    const expectedColumns=width<=700?3:Math.max(1,Math.floor((dims.width+dims.gap)/(210+dims.gap)));
    expect(dims.columns).toBe(expectedColumns);
    expect(dims.cardWidth).toBeGreaterThan(width<=700?80:205);
    expect(dims.buttonWidth).toBeGreaterThan(dims.cardWidth*.75);
    expect(dims.buttonHeight).toBeGreaterThanOrEqual(44);
    expect(dims.buttonText).toBeGreaterThan(width<=700?35:75);
    expect(dims.titleFontSize).toBeGreaterThanOrEqual(width<=700?10:18);
    if(width===1280)expect(dims.cardWidth).toBeGreaterThan(210);
    if(width===390)expect(dims.cardWidth).toBeLessThan(140);
    const contained=await page.evaluate(()=>{
      const cards=[...document.querySelectorAll('#product-grid .product-card')];
      return cards.every(card=>{
        const rect=card.getBoundingClientRect();
        const items=[card.querySelector('.product-info'),card.querySelector('.price'),card.querySelector('.add-to-cart'),card.querySelector('.product-title-link')].filter(Boolean);
        return items.every(item=>{
          const a=item.getBoundingClientRect();
          return a.left>=rect.left-1 && a.right<=rect.right+1;
        });
      });
    });
    expect(contained).toBe(true);
    if(width<=700){
      // Três cards reais na primeira linha e nenhuma invasão lateral.
      const firstRow=await page.evaluate(()=>{
        const cards=[...document.querySelectorAll('#product-grid .product-card')].slice(0,4);
        const rects=cards.map(card=>card.getBoundingClientRect());
        return {
          aligned:Math.abs(rects[0].top-rects[1].top)<2&&Math.abs(rects[1].top-rects[2].top)<2,
          nextRow:rects[3].top>rects[0].top,
          smallEnough:rects[0].width<225,
          targets:cards.slice(0,3).every(card=>card.querySelector('.add-to-cart').getBoundingClientRect().height>=44)
        };
      });
      expect(firstRow.aligned).toBe(true);
      expect(firstRow.nextRow).toBe(true);
      expect(firstRow.smallEnough).toBe(true);
      expect(firstRow.targets).toBe(true);
    }
    await page.locator('#promocoes').scrollIntoViewIfNeeded();
    await widthCheck(page);
    const artifact=path.join('test-results','product-cards-v136');
    fs.mkdirSync(artifact,{recursive:true});
    await page.locator('#product-grid').scrollIntoViewIfNeeded();
    await page.locator('#product-grid').screenshot({
      path:path.join(artifact,'margot-editorial-cards-'+width+'.png'),
      animations:'disabled'
    });
  });
}
