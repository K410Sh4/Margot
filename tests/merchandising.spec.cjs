const {test,expect}=require('@playwright/test');

test.use({viewport:{width:390,height:844},isMobile:true,hasTouch:true});

const today=new Date().toISOString().slice(0,10);
const month=today.slice(0,7);
const shift=days=>{
  const d=new Date(today+'T12:00:00Z');
  d.setUTCDate(d.getUTCDate()+days);
  return d.toISOString().slice(0,10);
};
async function withCommercialData(page,products){
  await page.route('**/merchandising-data.js*',route=>route.fulfill({
    status:200,contentType:'text/javascript; charset=utf-8',
    body:'window.MargotCommercialData='+JSON.stringify({products})+';'
  }));
}
const mockItems=()=>({
  'brinco-coracao':{
    inventory:{source:'contagem física interna',confirmed:true,quantity:7,checkedAt:today},
    promotion:{source:'tabela comercial aprovada',confirmed:true,originalPrice:24.90,salePrice:14.90,
      startsAt:shift(-2),endsAt:shift(10),checkedAt:today},
    tags:{source:'relatório comercial interno',confirmed:true,favorite:true,bestSellerMonth:month,checkedAt:today}
  },
  'colar-perola':{
    inventory:{source:'contagem física interna',confirmed:true,quantity:11,checkedAt:today}
  },
  'pulseira-coracao':{
    inventory:{source:'contagem física interna',confirmed:true,quantity:0,checkedAt:today}
  },
  'argola-classica':{
    inventory:{source:'contagem física interna',confirmed:true,quantity:1,checkedAt:today},
    tags:{source:'relatório comercial interno',confirmed:true,favorite:true,checkedAt:today}
  },
  'anel-onda':{
    inventory:{source:'contagem física interna',confirmed:true,quantity:3,checkedAt:shift(-12)},
    tags:{source:'relatório comercial interno',confirmed:true,bestSellerMonth:shift(-45).slice(0,7),checkedAt:today}
  }
});
async function noHorizontalOverflow(page){
  const m=await page.evaluate(()=>({
    width:document.documentElement.clientWidth,
    scrollWidth:document.documentElement.scrollWidth
  }));
  expect(m.scrollWidth).toBeLessThanOrEqual(m.width+1);
}

test('padrão público: nenhuma promoção, etiqueta ou estoque inventado',async({page})=>{
  await page.goto('/',{waitUntil:'domcontentloaded'});
  await expect(page.locator('#promotion-empty')).toBeVisible();
  await expect(page.locator('#promotion-grid')).toBeHidden();
  await expect(page.locator('#product-grid .product-badge')).toHaveCount(0);
  await expect(page.locator('#product-grid .product-stock')).toHaveCount(0);
  await page.goto('/produto.html?id=brinco-coracao',{waitUntil:'domcontentloaded'});
  await expect(page.locator('#pd-badges')).toBeHidden();
  await expect(page.locator('#pd-old-price')).toBeHidden();
  await expect(page.locator('#pd-promotion-panel')).toBeHidden();
  await expect(page.locator('#pd-offers')).toBeHidden();
  await expect(page.locator('#pd-availability-text')).toContainText('a confirmar');
});

test('oferta confirmada gera painel, preço anterior, desconto e etiquetas',async({page})=>{
  await withCommercialData(page,mockItems());
  await page.goto('/',{waitUntil:'domcontentloaded'});
  await expect(page.locator('#promotion-empty')).toBeHidden();
  await expect(page.locator('#promotion-grid .product-card')).toHaveCount(1);
  const offer=page.locator('#promotion-grid .product-card');
  await expect(offer.locator('.product-price-line')).toContainText('R$ 14,90');
  await expect(offer.locator('.product-old-price')).toHaveText('R$ 24,90');
  await expect(offer.locator('.product-badge--discount')).toHaveText('-40%');
  await expect(offer.locator('.product-badge--favorite')).toHaveText('Peça favorita');
  await expect(offer.locator('.product-badge--bestseller')).toHaveText('Mais vendida do mês');
  await expect(offer.locator('.product-stock')).toContainText('Restam 7 unidades');
  await offer.locator('.product-open').click();
  await expect(page.locator('#pd-price')).toHaveText('R$ 14,90');
  await expect(page.locator('#pd-old-price')).toHaveText('R$ 24,90');
  await expect(page.locator('#pd-saving')).toHaveText('Economize R$ 10,00');
  await expect(page.locator('#pd-badges .pd-badge')).toHaveCount(3);
  await expect(page.locator('#pd-promotion-panel')).toBeVisible();
  await expect(page.locator('#pd-availability-text')).toContainText('Restam 7 unidades');
  await expect(page.locator('#pd-offers')).toBeVisible();
  await expect(page.locator('#pd-offers-grid .pd-related-card')).toHaveCount(1);
});

test('estoque baixo aparece apenas entre uma e dez unidades',async({page})=>{
  await withCommercialData(page,mockItems());
  await page.goto('/',{waitUntil:'domcontentloaded'});
  await expect(page.locator('#product-grid [data-favorite="brinco-coracao"]')).toHaveCount(1);
  const cards=page.locator('#product-grid .product-card');
  await expect(cards.nth(0).locator('.product-stock')).toContainText('Restam 7 unidades');
  await expect(cards.nth(1).locator('.product-stock')).toHaveCount(0);
  await expect(cards.nth(2).locator('.product-stock')).toContainText('Indisponível');
  await expect(cards.nth(3).locator('.product-stock')).toContainText('Resta 1 unidade');
  await expect(cards.nth(4).locator('.product-stock')).toHaveCount(0);
  await expect(cards.nth(2).locator('[data-add]')).toBeDisabled();
  await page.goto('/produto.html?id=colar-perola',{waitUntil:'domcontentloaded'});
  await expect(page.locator('#pd-availability-text')).not.toContainText('Restam');
  await page.goto('/produto.html?id=argola-classica',{waitUntil:'domcontentloaded'});
  await expect(page.locator('#pd-availability-text')).toContainText('Resta 1 unidade');
  await expect(page.locator('.pd-qty-hint')).toContainText('1 unidade');
});

test('vitrine bloqueia unidades acima do estoque informado',async({page})=>{
  await withCommercialData(page,mockItems());
  await page.goto('/',{waitUntil:'domcontentloaded'});
  for(let n=0;n<7;n++){
    await page.locator('#product-grid [data-add="brinco-coracao"]').click();
  }
  await expect(page.locator('#cart-count')).toHaveText('7');
  await expect(page.locator('#product-grid [data-add="brinco-coracao"]')).toBeDisabled();
  await page.locator('#mobile-nav-cart').click();
  await expect(page.locator('#drawer-items .quantity span').first()).toHaveText('7');
  await expect(page.locator('#drawer-items [data-delta="1"]').first()).toBeDisabled();
});

test('página V3 limita quantidade ao saldo informado sem alegar reserva',async({page})=>{
  await withCommercialData(page,mockItems());
  await page.goto('/produto.html?id=brinco-coracao',{waitUntil:'domcontentloaded'});
  await page.locator('#pd-qty-input').fill('13');
  await page.locator('#pd-qty-input').blur();
  await expect(page.locator('#pd-qty-input')).toHaveValue('7');
  await page.locator('#pd-add').click();
  await expect(page.locator('#pd-cart-count')).toHaveText('7');
  await page.locator('#pd-add').click();
  await expect(page.locator('#pd-cart-count')).toHaveText('7');
  await expect(page.locator('.pd-disclosure')).toContainText('não efetua compra');
  await page.locator('#pd-view-cart').click();
  await expect(page.locator('#drawer')).toHaveClass(/open/);
  await expect(page.locator('#drawer-items .quantity span')).toHaveText('7');
});

test('produto esgotado desativa adicionar sem desativar favoritos',async({page})=>{
  await withCommercialData(page,mockItems());
  await page.goto('/produto.html?id=pulseira-coracao',{waitUntil:'domcontentloaded'});
  await expect(page.locator('#pd-availability-text')).toContainText('Sem unidades');
  await expect(page.locator('#pd-add')).toBeDisabled();
  await page.locator('#pd-favorite').click();
  await expect(page.locator('#pd-favorite')).toHaveAttribute('aria-pressed','true');
});

test('promoções expiradas, estoque antigo ou dados não confirmados não aparecem',async({page})=>{
  const m=mockItems();
  m['brinco-coracao'].promotion.endsAt=shift(-1);
  m['brinco-coracao'].tags.confirmed=false;
  m['brinco-coracao'].inventory.checkedAt=shift(-15);
  await withCommercialData(page,m);
  await page.goto('/produto.html?id=brinco-coracao',{waitUntil:'domcontentloaded'});
  await expect(page.locator('#pd-promotion-panel')).toBeHidden();
  await expect(page.locator('#pd-badges')).toBeHidden();
  await expect(page.locator('#pd-stock-note')).toBeHidden();
  await expect(page.locator('#pd-availability-text')).toContainText('a confirmar');
  await page.goto('/',{waitUntil:'domcontentloaded'});
  await expect(page.locator('#promotion-empty')).toBeVisible();
});

test('não aceitar valor de preço, etiqueta ou estoque sem comprovação explícita',async({page})=>{
  const m=mockItems();
  m['brinco-coracao'].promotion.confirmed=false;
  m['brinco-coracao'].inventory.quantity=-3;
  m['brinco-coracao'].tags.bestSellerMonth=shift(-50).slice(0,7);
  await withCommercialData(page,m);
  await page.goto('/produto.html?id=brinco-coracao',{waitUntil:'domcontentloaded'});
  await expect(page.locator('#pd-promotion-panel')).toBeHidden();
  await expect(page.locator('#pd-availability-text')).toContainText('a confirmar');
  await expect(page.locator('#pd-badges .pd-badge--bestSeller')).toHaveCount(0);
  await expect(page.locator('#pd-badges .pd-badge--favorite')).toHaveCount(1);
});

for(const width of [320,390,700,1280]){
  test('painel com ofertas e selos mantém responsividade em '+width+'px',async({page})=>{
    await withCommercialData(page,mockItems());
    await page.setViewportSize({width,height:840});
    await page.goto('/',{waitUntil:'domcontentloaded'});
    await page.locator('#promocoes').scrollIntoViewIfNeeded();
    await expect(page.locator('#promotion-grid .product-card')).toHaveCount(1);
    await noHorizontalOverflow(page);
    await page.goto('/produto.html?id=brinco-coracao',{waitUntil:'domcontentloaded'});
    await page.locator('#pd-badges').scrollIntoViewIfNeeded();
    await expect(page.locator('#pd-badges')).toBeVisible();
    await noHorizontalOverflow(page);
    await page.locator('#pd-offers').scrollIntoViewIfNeeded();
    await noHorizontalOverflow(page);
  });
}


test('limite de dez unidades aparece em cards e detalhes',async({page})=>{
  const items=mockItems();
  items['colar-perola'].inventory.quantity=10;
  await withCommercialData(page,items);
  await page.goto('/',{waitUntil:'domcontentloaded'});
  await expect(page.locator('#product-grid .product-card').nth(1).locator('.product-stock')).toContainText('Restam 10 unidades');
  await page.goto('/produto.html?id=colar-perola',{waitUntil:'domcontentloaded'});
  await expect(page.locator('#pd-availability-text')).toContainText('Restam 10 unidades');
});


test('sem fonte documentada, a interface ignora suposto estoque e desconto',async({page})=>{
  const items=mockItems();
  items['brinco-coracao'].inventory.source='';
  items['brinco-coracao'].promotion.source='';
  items['brinco-coracao'].tags.source='';
  await withCommercialData(page,items);
  await page.goto('/produto.html?id=brinco-coracao',{waitUntil:'domcontentloaded'});
  await expect(page.locator('#pd-stock-note')).toBeHidden();
  await expect(page.locator('#pd-promotion-panel')).toBeHidden();
  await expect(page.locator('#pd-badges')).toBeHidden();
});
