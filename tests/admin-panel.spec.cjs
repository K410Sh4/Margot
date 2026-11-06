const {test,expect}=require('@playwright/test');
const fs=require('node:fs');
const path=require('node:path');
const owner='elgator833@gmail.com';
const today=new Date().toISOString().slice(0,10);
const plus=n=>{const d=new Date(today+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10);};
const mockProduct=(overrides={})=>({
  name:'Brinco Coração Dourado',category:'Brincos',basePrice:24.90,
  description:'Peça para teste de sincronização.',imageUrls:[],imagePaths:[],
  stockCount:7,stockCheckedAt:today,favorite:true,bestSellerMonth:today.slice(0,7),
  salePrice:14.90,saleStart:plus(-1),saleEnd:plus(6),saleCheckedAt:today,
  deleted:false,updatedAt:new Date(),...overrides
});
const sdk={
  'firebase-app.js':"export const getApps=()=>[];export const getApp=()=>({});export const initializeApp=()=>({});",
  'firebase-auth.js':"export const getAuth=()=>({});export class GoogleAuthProvider {setCustomParameters(){}};"+
    "export const onAuthStateChanged=(auth,cb)=>{queueMicrotask(()=>cb(globalThis.__fakeEmail?"+
      "{email:globalThis.__fakeEmail,emailVerified:true,providerData:[{providerId:'google.com'}]}:null));return()=>{}};"+
    "export const signInWithPopup=()=>Promise.resolve({});export const signOut=()=>Promise.resolve();",
  'firebase-firestore.js':"export const getFirestore=()=>({});export const collection=(db,name)=>({name});"+
    "export const doc=(db,name,id)=>({name,id});export const serverTimestamp=()=>new Date();"+
    "const notify=()=>{const docs=Object.entries(globalThis.__fakeDocs||{}).map(([id,data])=>({id,data:()=>data}));"+
      "for(const cb of (globalThis.__fakeListeners||[]))cb({docs})};"+
    "export const onSnapshot=(ref,cb)=>{const all=globalThis.__fakeListeners||(globalThis.__fakeListeners=[]);"+
      "all.push(cb);queueMicrotask(notify);return()=>{const i=all.indexOf(cb);if(i>=0)all.splice(i,1)}};"+
    "export const setDoc=async(ref,data)=>{"+
      "if(ref.name==='productMedia'){const m=globalThis.__fakeMedia||(globalThis.__fakeMedia={});m[ref.id]={...data};return;}"+
      "const all=globalThis.__fakeDocs||(globalThis.__fakeDocs={});all[ref.id]={...data};notify();};"+
    "export const getDoc=async(ref)=>{"+
      "if(ref.name==='productMedia'){if(!globalThis.__fakeMediaAllowed){const e=new Error('permission-denied');e.code='permission-denied';throw e;}"+
        "const d=globalThis.__fakeMedia?.[ref.id];return {exists:()=>Boolean(d),data:()=>d};}"+
      "const d=globalThis.__fakeDocs?.[ref.id];return {exists:()=>Boolean(d),data:()=>d};};"+
    "export const deleteDoc=async(ref)=>{if(ref.name==='productMedia')delete globalThis.__fakeMedia[ref.id];else delete globalThis.__fakeDocs[ref.id];};",
  'firebase-storage.js':"export const getStorage=()=>({});export const ref=(storage,p)=>({fullPath:p});"+
    "export const uploadBytes=async()=>({});"+
    "export const getDownloadURL=async r=>'https://firebasestorage.googleapis.com/v0/b/margot-acessorios-865987.firebasestorage.app/o/'+encodeURIComponent(r.fullPath)+'?alt=media&token=test';"+
    "export const deleteObject=async()=>{};"+
    "export const setMaxUploadRetryTime=()=>{};export const setMaxOperationRetryTime=()=>{};"
};
async function mockFirebase(page,{email=null,docs={},mediaAllowed=false,media={}}={}){
  await page.addInitScript(({email,docs,mediaAllowed,media})=>{
    window.__fakeEmail=email;
    window.__fakeDocs=docs;
    window.__fakeMediaAllowed=mediaAllowed;
    window.__fakeMedia=media;
  },{email,docs,mediaAllowed,media});
  await page.route('https://www.gstatic.com/firebasejs/13.2.0/*',route=>{
    const key=route.request().url().split('/').at(-1);
    const code=sdk[key];
    return route.fulfill({status:code?200:404,contentType:'text/javascript',
      headers:{'access-control-allow-origin':'*'},body:code||'// missing'});
  });
}
async function enabledStorageMock(page){
  // Somente na execução automatizada: na loja pública o Storage continua desativado.
  await page.route('**/firebase-config.js*',async route=>{
    const response=await route.fetch();
    const body=await response.text();
    await route.fulfill({response,body:body+'\nwindow.MARGOT_STORAGE_UPLOADS_ENABLED=true;'});
  });
}
async function noOverflow(page){
  const m=await page.evaluate(()=>[document.documentElement.scrollWidth,document.documentElement.clientWidth]);
  expect(m[0]).toBeLessThanOrEqual(m[1]+1);
}
test('regras: somente Google verificado da administradora pode gravar',()=>{
  const root=path.join(__dirname,'..');
  for(const name of ['firestore.rules','storage.rules']){
    const rules=fs.readFileSync(path.join(root,name),'utf8');
    expect(rules).toContain(owner);
    expect(rules).toContain('email_verified == true');
    expect(rules).toContain("sign_in_provider == 'google.com'");
    expect(rules).not.toMatch(/allow\s+(?:write|create|update)[^;]*:\s*if\s+true/);
  }
});
test('visitante sem login não visualiza controles administrativos',async({page})=>{
  await mockFirebase(page);
  await page.goto('/admin.html',{waitUntil:'domcontentloaded'});
  await expect(page.locator('#admin-gate')).toBeVisible();
  await expect(page.locator('#admin-app')).toBeHidden();
  await expect(page.locator('#admin-login')).toBeEnabled();
  await noOverflow(page);
});
test('Google diferente do administrador não entra',async({page})=>{
  await mockFirebase(page,{email:'cliente@example.com'});
  await page.goto('/admin.html',{waitUntil:'domcontentloaded'});
  await expect(page.locator('#admin-app')).toBeHidden();
  await expect(page.locator('#gate-status')).toContainText(/autorização|conta Google autorizada/);
});
test('administradora altera estoque, preço promocional e selos',async({page})=>{
  await mockFirebase(page,{email:owner});
  await page.goto('/admin.html',{waitUntil:'domcontentloaded'});
  await expect(page.locator('#admin-app')).toBeVisible();
  await expect(page.locator('.product-row')).toHaveCount(8);
  await page.locator('.product-row').first().click();
  await expect(page.locator('#product-dialog')).toBeVisible();
  await page.locator('#field-stock').fill('7');
  await page.locator('#field-favorite').check();
  await page.locator('#field-best-seller').check();
  await page.locator('#field-sale-price').fill('10');
  await page.locator('#field-sale-start').fill(plus(-1));
  await page.locator('#field-sale-end').fill(plus(7));
  await page.locator('#save-product').click();
  await expect(page.locator('#product-dialog')).toBeHidden();
  const d=await page.evaluate(()=>window.__fakeDocs['brinco-coracao']);
  expect(d.stockCount).toBe(7);
  expect(d.favorite).toBe(true);
  expect(d.bestSellerMonth).toBe(today.slice(0,7));
  expect(d.salePrice).toBe(10);
});
test('criar produto, arquivar e restaurar',async({page})=>{
  await mockFirebase(page,{email:owner});
  await page.goto('/admin.html',{waitUntil:'domcontentloaded'});
  await expect(page.locator('#admin-app')).toBeVisible();
  await page.locator('#new-product').click();
  await page.locator('#field-name').fill('Brinco Teste Simulado');
  await page.locator('#field-price').fill('23.50');
  await page.locator('#save-product').click();
  await expect(page.locator('.product-row')).toHaveCount(9);
  await page.getByRole('button',{name:'Editar Brinco Teste Simulado'}).click();
  page.once('dialog',d=>d.accept());
  await page.locator('#archive-product').click();
  await expect(page.locator('.product-row')).toHaveCount(8);
  await page.locator('#admin-filter').selectOption('archived');
  await expect(page.locator('.product-row')).toHaveCount(1);
  await page.locator('.product-row').first().click();
  page.once('dialog',d=>d.accept());
  await page.locator('#archive-product').click();
  await page.locator('#admin-filter').selectOption('active');
  await expect(page.locator('.product-row')).toHaveCount(9);
});
test('Storage não configurado: bloqueia imagens sem impedir cadastro de produtos',async({page})=>{
  await mockFirebase(page,{email:owner});
  await page.goto('/admin.html',{waitUntil:'domcontentloaded'});
  await expect(page.locator('#admin-app')).toBeVisible();
  await page.locator('#new-product').click();
  await expect(page.locator('#storage-notice')).toBeVisible();
  await expect(page.locator('#field-photos')).toBeDisabled();
  await expect(page.locator('#upload-status')).toContainText('Storage');
  await page.locator('#field-name').fill('Brinco Sem Fotografia');
  await page.locator('#field-price').fill('19.90');
  await page.locator('#field-stock').fill('5');
  await page.locator('#save-product').click();
  await expect(page.locator('#product-dialog')).toBeHidden();
  await expect(page.locator('#admin-toast')).toContainText('Produto salvo');
  const product=await page.evaluate(()=>window.__fakeDocs['brinco-sem-fotografia']);
  expect(product.name).toBe('Brinco Sem Fotografia');
  expect(product.stockCount).toBe(5);
  expect(product.imageUrls).toEqual([]);
});

test('fotos são adicionadas e retiradas apenas ao salvar',async({page})=>{
  await mockFirebase(page,{email:owner});
  await enabledStorageMock(page);
  await page.goto('/admin.html',{waitUntil:'domcontentloaded'});
  await expect(page.locator('#admin-app')).toBeVisible();
  await page.locator('.product-row').first().click();
  const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+PAb8AAAAASUVORK5CYII=','base64');
  await page.locator('#field-photos').setInputFiles({name:'teste.png',mimeType:'image/png',buffer:png});
  await expect(page.locator('.editor-photo')).toHaveCount(1);
  await page.locator('#save-product').click();
  await expect(page.locator('#product-dialog')).toBeHidden();
  const first=await page.evaluate(()=>window.__fakeDocs['brinco-coracao']);
  expect(first.imageUrls).toHaveLength(1);
  await page.locator('.product-row').first().click();
  await page.getByRole('button',{name:'Remover fotografia 1'}).click();
  await page.locator('#save-product').click();
  const next=await page.evaluate(()=>window.__fakeDocs['brinco-coracao']);
  expect(next.imageUrls).toHaveLength(0);
});
test('vitrine e produto V3 refletem atualizações sem recarregar',async({page})=>{
  await mockFirebase(page,{docs:{'brinco-coracao':mockProduct()}});
  await page.goto('/',{waitUntil:'domcontentloaded'});
  await expect(page.locator('#product-grid .product-card').first().locator('.product-stock')).toContainText('Restam 7 unidades');
  await expect(page.locator('#promotion-grid .product-card')).toHaveCount(1);
  await page.evaluate(()=>{
    window.__fakeDocs['brinco-coracao'].stockCount=4;
    const docs=Object.entries(window.__fakeDocs).map(([id,data])=>({id,data:()=>data}));
    for(const cb of window.__fakeListeners||[])cb({docs});
  });
  await expect(page.locator('#product-grid .product-card').first().locator('.product-stock')).toContainText('Restam 4 unidades');
  await page.goto('/produto.html?id=brinco-coracao',{waitUntil:'domcontentloaded'});
  await expect(page.locator('#pd-availability-text')).toContainText('Restam 7 unidades');
  await page.evaluate(()=>{
    window.__fakeDocs['brinco-coracao'].stockCount=2;
    const docs=Object.entries(window.__fakeDocs).map(([id,data])=>({id,data:()=>data}));
    for(const cb of window.__fakeListeners||[])cb({docs});
  });
  await expect(page.locator('#pd-availability-text')).toContainText('Restam 2 unidades');
});
for(const width of [320,390,700,1280]){
  test('painel responsivo em '+width+'px',async({page})=>{
    await mockFirebase(page,{email:owner});
    await page.setViewportSize({width,height:840});
    await page.goto('/admin.html',{waitUntil:'domcontentloaded'});
    await expect(page.locator('#admin-app')).toBeVisible();
    await noOverflow(page);
    await page.screenshot({path:'test-results/admin-dashboard-'+width+'.png',fullPage:true,animations:'disabled'});
    await page.locator('#new-product').click();
    await expect(page.locator('#product-dialog')).toBeVisible();
    await noOverflow(page);
    await page.screenshot({path:'test-results/admin-editor-'+width+'.png',fullPage:false,animations:'disabled'});
  });
}


test('modo Spark: imagens WebP compactadas ficam em documento separado do Firestore',async({page})=>{
  await mockFirebase(page,{email:owner,mediaAllowed:true});
  await page.goto('/admin.html',{waitUntil:'domcontentloaded'});
  await expect(page.locator('#admin-app')).toBeVisible();
  await page.locator('.product-row').first().click();
  await expect(page.locator('#field-photos')).toBeEnabled();
  await expect(page.locator('#image-backend-title')).toContainText('Fotos grátis ativadas');

  const source=await page.evaluate(()=>{
    const canvas=document.createElement('canvas');
    canvas.width=740;canvas.height=740;
    const ctx=canvas.getContext('2d');
    ctx.fillStyle='#f7e4df';ctx.fillRect(0,0,740,740);
    ctx.fillStyle='#ad6d7c';ctx.beginPath();ctx.arc(370,370,200,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#fff6ef';ctx.beginPath();ctx.arc(370,370,165,0,Math.PI*2);ctx.fill();
    return canvas.toDataURL('image/png').split(',')[1];
  });
  await page.locator('#field-photos').setInputFiles({
    name:'foto-joia.png',mimeType:'image/png',buffer:Buffer.from(source,'base64')
  });
  await expect(page.locator('.editor-photo')).toHaveCount(1);
  await page.locator('#save-product').click();
  await expect(page.locator('#product-dialog')).toBeHidden();
  const saved=await page.evaluate(()=>({
    product:window.__fakeDocs['brinco-coracao'],
    media:Object.values(window.__fakeMedia)
  }));
  expect(saved.product.imageUrls).toHaveLength(1);
  expect(saved.product.imagePaths).toHaveLength(1);
  expect(saved.product.imageUrls[0]).toMatch(/^data:image\/webp;base64,/);
  expect(saved.product.imageUrls[0].length).toBeLessThan(30000);
  expect(saved.product.imagePaths[0]).toMatch(/^productMedia\/[a-f0-9-]{36}$/);
  expect(saved.media).toHaveLength(1);
  expect(saved.media[0].data).toMatch(/^data:image\/webp;base64,/);
  expect(saved.media[0].data.length).toBeLessThanOrEqual(230000);
  await page.locator('.product-row').first().click();
  await expect(page.locator('.editor-photo')).toHaveCount(1);
  await page.getByRole('button',{name:'Remover fotografia 1'}).click();
  await page.locator('#save-product').click();
  await expect.poll(()=>page.evaluate(()=>Object.keys(window.__fakeMedia).length)).toBe(0);
  const revised=await page.evaluate(()=>window.__fakeDocs['brinco-coracao']);
  expect(revised.imageUrls).toEqual([]);
});

test('vitrine usa miniatura e página V3 carrega imagem maior sob demanda',async({page})=>{
  const imageId='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  const images=await page.evaluate(()=>{
    const canvas=document.createElement('canvas');
    canvas.width=400;canvas.height=400;
    const ctx=canvas.getContext('2d');
    ctx.fillStyle='#f9e6ec';ctx.fillRect(0,0,400,400);
    const thumb=canvas.toDataURL('image/webp',.5);
    ctx.fillStyle='#9c5265';ctx.fillRect(100,100,200,200);
    const full=canvas.toDataURL('image/webp',.85);
    return {thumb,full};
  });
  const thumbnail=images.thumb;
  const full=images.full;
  const product=mockProduct({imageUrls:[thumbnail],imagePaths:['productMedia/'+imageId]});
  await mockFirebase(page,{
    mediaAllowed:true,docs:{'brinco-coracao':product},
    media:{[imageId]:{productId:'brinco-coracao',data:full,createdAt:new Date()}}
  });
  await page.goto('/',{waitUntil:'domcontentloaded'});
  await expect(page.locator('#product-grid .product-card').first().locator('img')).toHaveAttribute('src',thumbnail);
  await page.goto('/produto.html?id=brinco-coracao',{waitUntil:'domcontentloaded'});
  await expect(page.locator('#pd-main-image')).toHaveAttribute('src',full);
  await expect(page.locator('#pd-photo-note')).toBeHidden();
  await expect(page.locator('#pd-zoom')).toBeVisible();
});
