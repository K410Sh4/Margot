/* Margot V1.28 — catálogo público em tempo real pelo Cloud Firestore.
 * Leitura pública; gravações protegidas por regras do Firebase implantadas separadamente.
 * Se Firestore estiver indisponível, preserva a vitrine estática atual.
 */
let fallback=null;
const config=window.MARGOT_FIREBASE_CONFIG;
const PHOTO_PREFIX='https://firebasestorage.googleapis.com/v0/b/margot-acessorios-865987.firebasestorage.app/o/';
const TODAY=()=>new Date().toISOString().slice(0,10);
let overlays=[];
const safeText=(value,max=100)=>typeof value==='string'?
  value.replace(/[<>&"']/g,'').trim().slice(0,max):'';
const money=value=>typeof value==='number'&&Number.isFinite(value)&&value>0;
function ageOk(date,maxDays){
  if(typeof date!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(date))return false;
  const checked=Date.parse(date+'T00:00:00Z');
  return Number.isFinite(checked)&&checked<=Date.now()+86400000&&
    Date.now()-checked<=(maxDays+1)*86400000;
}
function normalize(doc,id,base){
  if(doc.deleted===true)return null;
  if(!money(doc.basePrice)||typeof doc.name!=='string')return base||null;
  const title=safeText(doc.name,90);
  if(!title)return base||null;
  const checked=TODAY();
  const images=Array.isArray(doc.imageUrls)?doc.imageUrls.filter(u=>
    typeof u==='string'&&u.startsWith(PHOTO_PREFIX)&&u.includes('product-images%2F')).slice(0,8):[];
  const stock=Number.isInteger(doc.stockCount)&&doc.stockCount>=0&&
    ageOk(doc.stockCheckedAt,7)?doc.stockCount:null;
  const sale=doc.salePrice;
  const active=money(sale)&&sale<doc.basePrice&&
    typeof doc.saleStart==='string'&&typeof doc.saleEnd==='string'&&
    doc.saleStart<=checked&&doc.saleEnd>=checked&&
    ageOk(doc.saleCheckedAt,30);
  const promotion=active?{
    originalPrice:doc.basePrice,
    salePrice:sale,
    percent:Math.round(100*(1-sale/doc.basePrice)),
    endsAt:doc.saleEnd
  }:null;
  const labels=[];
  if(doc.favorite===true)labels.push('favorite');
  if(doc.bestSellerMonth===checked.slice(0,7))labels.push('bestSeller');
  if(promotion)labels.push('discount');
  return {
    ...(base||{}),id,
    name:title,category:doc.category,
    description:safeText(doc.description,1600),
    referencePrice:doc.basePrice,
    price:promotion?promotion.salePrice:doc.basePrice,
    image:images[0]||undefined,
    images,
    stock,
    stockCheckedAt:stock===null?null:doc.stockCheckedAt,
    labels,promotion
  };
}
function publish(){
  const byId=new Map(overlays.map(({id,...doc})=>[id,doc]));
  const products=[];
  for(const base of fallback.products){
    if(!byId.has(base.id)){products.push(base);continue;}
    const doc=byId.get(base.id);byId.delete(base.id);
    const normalized=normalize(doc,base.id,base);
    if(normalized)products.push(normalized);
  }
  for(const [id,doc] of byId){
    const normalized=normalize(doc,id,null);
    if(normalized)products.push(normalized);
  }
  window.MargotCatalog={...fallback,products};
  window.MargotMerchandising={
    ...window.MargotMerchandising,
    promotions:products.filter(p=>Boolean(p.promotion)),
    lowStock:p=>Number.isInteger(p?.stock)&&p.stock>=1&&p.stock<=10
  };
  window.dispatchEvent(new CustomEvent('margot:catalog-updated',{
    detail:{count:products.length,live:true}
  }));
}
async function start(){
  fallback=window.MargotCatalog;
  if(!fallback||!config?.projectId)return;
  try{
    const [appSdk,dbSdk]=await Promise.all([
      import('https://www.gstatic.com/firebasejs/13.2.0/firebase-app.js'),
      import('https://www.gstatic.com/firebasejs/13.2.0/firebase-firestore.js')
    ]);
    const app=appSdk.getApps().length?appSdk.getApp():appSdk.initializeApp(config);
    dbSdk.onSnapshot(dbSdk.collection(dbSdk.getFirestore(app),'products'),snapshot=>{
      overlays=snapshot.docs.map(doc=>({id:doc.id,...doc.data()}));
      publish();
    },error=>{
      console.warn('Margot: sincronização do catálogo não disponível:',error.code||error.message);
      window.dispatchEvent(new CustomEvent('margot:catalog-error',{detail:{code:error.code||'unknown'}}));
    });
    setInterval(()=>{if(overlays.length)publish()},120000);
  }catch(error){
    console.warn('Margot: banco de dados indisponível; catálogo local preservado.');
  }
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});
else start();
