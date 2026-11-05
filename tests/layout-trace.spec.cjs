/* Diagnóstico reproduzível da Margot. Sem capturar ações de visitantes reais. */
const fs=require('node:fs');
const path=require('node:path');
const {test,expect}=require('@playwright/test');
test.use({viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'no-preference'});
const targets=[
 ['Cabeçalho','.site-header'],['Grid cabeçalho','.header-main'],
 ['Logo','.brand'],['Imagem logo','.brand img'],['Botão menu','#menu-open'],
 ['Conta','#account-open'],['Menu','#main-nav'],['Barra inferior','#mobile-bottom-nav'],
 ['Busca','#search-form'],['Banner','.hero-carousel'],
 ['Categorias','#category-grid'],['Card categoria','#category-grid .category-card'],
 ['Filtros','#category-chips'],['Produtos','#product-grid'],
 ['Card produto','#product-grid .product-card'],['Sacola','#drawer']
];
const slug=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const escape=s=>String(s??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const csv=s=>'"'+String(s??'').replace(/"/g,'""')+'"';
function reports(dir,snapshots,errors){
 fs.writeFileSync(path.join(dir,'medicoes.json'),JSON.stringify({
   description:'Ações automatizadas em navegador de teste; nenhuma ação de clientes reais é capturada.',
   generatedAt:new Date().toISOString(),selectors:targets,snapshots,errors
 },null,2));
 const records=[['etapa','fase','imagem','viewport','documento','scrollX','scrollY','zoom',
 'elemento','visivel','x','y','largura','altura','scrollWidth','clientWidth','transform'].join(',')];
 for(const s of snapshots)for(const [label,g] of Object.entries(s.elements)){
   records.push([s.step,s.phase,s.image,s.viewport.width,s.viewport.documentWidth,
   s.viewport.scrollX,s.viewport.scrollY,s.viewport.scale,label,g.visible,g.x,g.y,
   g.width,g.height,g.scrollWidth,g.clientWidth,g.transform].map(csv).join(','));
 }
 fs.writeFileSync(path.join(dir,'medicoes.csv'),records.join('\n')+'\n');
 const css=['*{box-sizing:border-box}body{background:#f6f4f6;color:#29262e;font:14px/1.5 system-ui;margin:0}',
 'header{background:#fff;padding:24px;border-bottom:1px solid #ddd}',
 'main{max-width:1400px;margin:auto;padding:18px}',
 'table{width:100%;border-collapse:collapse;font-size:12px}',
 'th,td{padding:8px;border-bottom:1px solid #dedade;text-align:left;vertical-align:top}',
 'tr:nth-child(even){background:#faf9fa}',
 '.frame{background:#fff;padding:16px;margin:18px 0;border:1px solid #ddd;border-radius:10px}',
 '.shot{display:block;max-height:740px;max-width:100%;width:auto;border:1px solid #ccc}',
 'details{margin:12px 0}summary{cursor:pointer}a{color:#8d3f62}',
 '.warning{color:#b22e20;font-weight:bold}.muted{color:#625d69;font-size:12px}'
 ].join('');
 const rows=snapshots.map((s,i)=>{
   const overflow=s.viewport.documentWidth>s.viewport.width+1;
   return '<tr><td><a href="#frame-'+i+'">'+escape(s.step)+'</a></td><td>'+
     escape(s.phase)+'</td><td>'+s.viewport.width+'×'+s.viewport.height+'</td><td>'+
     s.viewport.scrollY+'</td><td>'+String(s.flags.compact)+'</td><td>'+
     (s.elements['Imagem logo']?.width??'-')+'</td><td>'+
     (s.elements['Grid cabeçalho']?.width??'-')+'</td><td class="'+
     (overflow?'warning':'')+'">'+s.viewport.documentWidth+
     (overflow?' OVERFLOW':'')+'</td></tr>';
 }).join('\n');
 const frames=snapshots.map((s,i)=>{
   const details=Object.entries(s.elements).map(([label,e])=>
     '<tr><td>'+escape(label)+'</td><td>'+e.visible+'</td><td>'+e.x+'</td>'+
     '<td>'+e.y+'</td><td>'+e.width+'</td><td>'+e.height+'</td><td>'+
     e.scrollWidth+'</td><td>'+escape(e.transform)+'</td></tr>').join('');
   return '<section class="frame" id="frame-'+i+'"><h2>'+(i+1)+'. '+
     escape(s.step)+' / '+escape(s.phase)+'</h2><p class="muted">Viewport '+
     s.viewport.width+'×'+s.viewport.height+' · documento '+s.viewport.documentWidth+
     'px · scrollX '+s.viewport.scrollX+' · scrollY '+s.viewport.scrollY+
     ' · zoom '+s.viewport.scale+' · menu '+s.flags.menuOpen+
     ' · busca '+s.flags.searching+'</p><a href="'+escape(s.image)+'">'+
     '<img loading="lazy" class="shot" src="'+escape(s.image)+'" alt="Captura '+(i+1)+'"></a>'+
     (s.fullImage?'<p><a href="'+escape(s.fullImage)+'">Print completo da página</a></p>':'')+
     (s.flags.duplicateIds.length?'<p class="warning">IDs repetidos: '+
       escape(s.flags.duplicateIds.join(', '))+'</p>':'')+
     '<details><summary>Medidas detalhadas (X/Y/largura/altura)</summary>'+
     '<table><tr><th>Elemento</th><th>Visível</th><th>X</th><th>Y</th>'+
     '<th>Largura</th><th>Altura</th><th>Largura interna</th><th>Transform</th></tr>'+
     details+'</table></details>'+
     (s.flags.offscreen.length?'<details><summary>Elementos fora da tela ('+
       s.flags.offscreen.length+')</summary><pre>'+escape(JSON.stringify(s.flags.offscreen,null,2))+
       '</pre></details>':'')+'</section>';
 }).join('\n');
 const document='<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">'+
   '<meta name="viewport" content="width=device-width,initial-scale=1"><title>Margot — Rastreamento por ação</title>'+
   '<style>'+css+'</style></head><body><header><h1>Margot — Prints e tamanhos por ação</h1>'+
   '<p>Captura automatizada para diagnóstico. Não monitora clientes.</p>'+
   '<p><a href="medicoes.json">JSON</a> · <a href="medicoes.csv">CSV</a> · '+
   '<a href="playwright-trace.zip">Linha do tempo interativa do Playwright</a></p></header>'+
   '<main><h2>Resumo ('+snapshots.length+' prints)</h2><table><thead><tr>'+
   '<th>Ação</th><th>Fase</th><th>Viewport</th><th>Y</th><th>Compacto</th>'+
   '<th>Logo px</th><th>Header px</th><th>Documento px</th></tr></thead><tbody>'+
   rows+'</tbody></table>'+(errors.length?'<p class="warning">'+
   escape(errors.join(' | '))+'</p>':'')+frames+'</main></body></html>';
 fs.writeFileSync(path.join(dir,'relatorio.html'),document);
}
test('@visual-trace: prints e dimensões em cada ação',async({page,context})=>{
 test.setTimeout(180000);
 page.setDefaultTimeout(6000);
 const dir=path.resolve('test-results/layout-trace');
 fs.mkdirSync(dir,{recursive:true});
 const snapshots=[],errors=[];
 let count=0;
 await context.tracing.start({screenshots:true,snapshots:true,sources:true});
 async function capture(step,phase,fullPage=false){
   await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(resolve)));
   const data=await page.evaluate(targets=>{
     const r=n=>Number((n||0).toFixed(2));
     const root=document.documentElement,vv=window.visualViewport, elements={};
     for(const [label,selector] of targets){
       const el=document.querySelector(selector);if(!el)continue;
       const b=el.getBoundingClientRect(),c=getComputedStyle(el);
       elements[label]={selector,x:r(b.x),y:r(b.y),width:r(b.width),height:r(b.height),
         visible:c.display!=='none'&&c.visibility!=='hidden'&&b.width>0,
         display:c.display,position:c.position,opacity:c.opacity,transform:c.transform,
         scrollLeft:r(el.scrollLeft),scrollWidth:el.scrollWidth,
         clientWidth:el.clientWidth,overflowX:c.overflowX};
     }
     const ids={};
     document.querySelectorAll('[id]').forEach(el=>ids[el.id]=(ids[el.id]||0)+1);
     const offscreen=[...document.querySelectorAll('body *')].filter(el=>{
       const c=getComputedStyle(el),b=el.getBoundingClientRect();
       return c.display!=='none'&&c.visibility!=='hidden'&&b.width>0&&
         (b.left < -2||b.right > root.clientWidth+2);
     }).slice(0,20).map(el=>{
       const b=el.getBoundingClientRect();
       return {tag:el.tagName.toLowerCase(),id:el.id||'',
         className:typeof el.className==='string'?el.className.slice(0,80):'',
         x:r(b.x),right:r(b.right),width:r(b.width)};
     });
     return {
       viewport:{width:root.clientWidth,height:innerHeight,documentWidth:root.scrollWidth,
         scrollX:r(scrollX),scrollY:r(scrollY),scale:r(vv?.scale||1),
         visualWidth:r(vv?.width||innerWidth),visualOffsetX:r(vv?.offsetLeft||0)},
       elements,
       flags:{mobile:matchMedia('(max-width: 700px)').matches,
         compact:document.querySelector('.site-header')?.classList.contains('is-compact'),
         menuOpen:document.querySelector('#main-nav')?.classList.contains('open'),
         searching:document.querySelector('.site-header')?.classList.contains('searching'),
         duplicateIds:Object.entries(ids).filter(([,n])=>n>1).map(([id])=>id),offscreen}
     };
   },targets);
   const name=String(++count).padStart(3,'0')+'-'+slug(step)+'-'+phase+'.png';
   await page.screenshot({path:path.join(dir,name),animations:'allow',caret:'hide'});
   let fullImage=null;
   if(fullPage){
     fullImage=name.replace(/\.png$/,'-pagina-completa.png');
     await page.screenshot({path:path.join(dir,fullImage),fullPage:true,
       animations:'allow',caret:'hide'});
   }
   snapshots.push({step,phase,image:name,fullImage,...data});
   reports(dir,snapshots,errors);
   console.log('[LAYOUT] '+step+'/'+phase+' viewport='+data.viewport.width+
     ' document='+data.viewport.documentWidth+' x='+data.viewport.scrollX+
     ' zoom='+data.viewport.scale+' header='+data.elements['Grid cabeçalho']?.width+
     ' logo='+data.elements['Imagem logo']?.width);
 }
 async function clickForTrace(locator,description){
   try{
     await locator.click({timeout:3000});
   }catch(error){
     errors.push('CLIQUE INTERCEPTADO: '+description+'; '+String(error.message||error).split('\n')[0]+
       ' — ação acionada por JavaScript para concluir a medição.');
     await capture('Clique bloqueado '+description,'bloqueio');
     await locator.evaluate(element=>element.click());
   }
 }
 async function action(label,fn,options={}){
   try{
     await fn();
     if(options.transition){
       await page.waitForTimeout(70);await capture(label,'transicao');
     }
     await page.waitForTimeout(options.transition?650:220);
     await capture(label,'estavel',!!options.fullPage);
   }catch(e){
     errors.push(label+': '+String(e.message||e));
     try{await capture(label+' erro','falha')}catch{}
     throw e;
   }
 }
 try{
   await action('Inicio mobile 390',async()=>{
     await page.goto('/',{waitUntil:'domcontentloaded'});
     await expect(page.locator('html')).toHaveClass(/mobile-nav-ready/);
   },{fullPage:true});
   await action('Descer 230',()=>page.evaluate(()=>scrollTo({top:230,behavior:'instant'})),{transition:true});
   await action('Descer 520',()=>page.evaluate(()=>scrollTo({top:520,behavior:'instant'})),{transition:true});
   await action('Subir 430',()=>page.evaluate(()=>scrollTo({top:430,behavior:'instant'})),{transition:true});
   await action('Voltar topo',()=>page.evaluate(()=>scrollTo({top:0,behavior:'instant'})),{transition:true});
   await action('Abrir menu mobile',()=>clickForTrace(page.locator('#menu-open'),'menu'),{transition:true});
   await action('Selecionar brincos',()=>clickForTrace(page.locator('#main-nav [data-category-link="Brincos"]'),'categoria Brincos'));
   await action('Mostrar todos',()=>clickForTrace(page.locator('#show-all'),'Ver todos'));
   await action('Abrir busca',()=>clickForTrace(page.locator('#mobile-nav-search'),'busca mobile'),{transition:true});
   await action('Pesquisar colar',()=>page.locator('#search-input').fill('colar'));
   await action('Fechar busca',()=>clickForTrace(page.locator('#mobile-nav-search'),'busca mobile'));
   await action('Favoritar primeiro',()=>clickForTrace(page.locator('#product-grid .heart-btn').first(),'favorito'));
   await action('Adicionar sacola',()=>clickForTrace(page.locator('#product-grid .add-to-cart').first(),'adicionar sacola'));
   await action('Abrir sacola',()=>clickForTrace(page.locator('#mobile-nav-cart'),'abrir sacola'),{transition:true});
   await action('Fechar sacola',()=>clickForTrace(page.locator('#drawer-close'),'fechar sacola'),{transition:true});
   await action('Rolar categorias',()=>page.evaluate(()=>{
     const el=document.querySelector('#category-grid');
     el.scrollIntoView({block:'center',behavior:'instant'});el.scrollLeft=170;
   }));
   await action('Rolar filtros',()=>page.evaluate(()=>{
     const el=document.querySelector('#category-chips');
     el.scrollIntoView({block:'center',behavior:'instant'});el.scrollLeft=130;
   }));
   await action('Tela 320',()=>page.setViewportSize({width:320,height:700}),{transition:true});
   await action('Tela 360',()=>page.setViewportSize({width:360,height:780}));
   await action('Tela 430',()=>page.setViewportSize({width:430,height:844}));
   await action('Limite mobile 700',()=>page.setViewportSize({width:700,height:844}),{transition:true});
   await action('Inicio desktop 701',()=>page.setViewportSize({width:701,height:844}),{transition:true,fullPage:true});
   await action('Desktop 1024',()=>page.setViewportSize({width:1024,height:800}));
   await action('Desktop rolar 520',async()=>{
     await page.evaluate(()=>scrollTo({top:0,behavior:'instant'}));
     await page.waitForTimeout(250);
     await page.evaluate(()=>scrollTo({top:520,behavior:'instant'}));
   },{transition:true});
   await action('Desktop oscilação de 12px',async()=>{
     for(const y of [509,520,508,518]){
       await page.evaluate(y=>scrollTo({top:y,behavior:'instant'}),y);
       await page.waitForTimeout(50);
     }
   },{transition:true});
   await expect(page.locator('.site-header')).toHaveClass(/is-compact/);
   await action('Desktop abrir menu',()=>clickForTrace(page.locator('#menu-open'),'menu'),{transition:true});
   await action('Desktop restaurar',()=>page.evaluate(()=>scrollTo({top:0,behavior:'instant'})),{transition:true});
   await action('Voltar mobile 390',()=>page.setViewportSize({width:390,height:844}),{transition:true});
   await action('Landscape 844',()=>page.setViewportSize({width:844,height:390}),{transition:true});
   await action('Portrait 390',()=>page.setViewportSize({width:390,height:844}),{transition:true});
   await action('Proximo banner',()=>clickForTrace(page.locator('.hero-next'),'próximo banner'),{transition:true});
   await action('Recarregar',async()=>{
     await page.reload({waitUntil:'domcontentloaded'});
     await expect(page.locator('html')).toHaveClass(/mobile-nav-ready/);
   },{fullPage:true});
 }finally{
   try{await context.tracing.stop({path:path.join(dir,'playwright-trace.zip')})}
   catch(e){errors.push('Trace: '+String(e))}
   reports(dir,snapshots,errors);
 }
});