/* Margot Admin V1.28
 * Autenticação do Google + Firestore/Storage. Autorizações efetivas nas regras Firebase.
 * Nenhum salvamento acontece sem clique explícito em Salvar.
 */
const OWNER='elgator833@gmail.com';
const $=id=>document.getElementById(id);
let BASE=[];
const TODAY=()=>new Date().toISOString().slice(0,10);
const MONTH=()=>TODAY().slice(0,7);
const PLACEHOLDER='./assets/foto-em-breve.webp';
const IMAGE_TYPES=['image/jpeg','image/png','image/webp'];
const STORAGE_READY=window.MARGOT_STORAGE_UPLOADS_ENABLED===true;
const STORAGE_WARNING='O envio gratuito de fotos ainda não está autorizado no Firestore. Implante as regras V1.30 no Firebase para habilitá-lo.';
const FREE_MEDIA_PREFIX='productMedia/';
let freeMediaReady=false;
let api=null,auth=null,db=null,storage=null,unsubscribe=null;
let records=new Map(),editingId=null,selectedImages=[],removedPaths=[],pendingFiles=[];
let currentProduct=null,busy=false,toastTimer;
let authorized=false;
const money=n=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(n);
const form=$('product-form'),dialog=$('product-dialog');

function status(message,error=false){
  $('gate-status').textContent=message;
  const led=$('connection-state');
  led.textContent=message;
  led.classList.toggle('is-error',error);
  led.classList.toggle('is-connected',!error&&message==='Sincronizado');
}
function toast(message){
  const box=$('admin-toast');
  box.textContent=message;box.classList.add('is-visible');
  clearTimeout(toastTimer);
  toastTimer=setTimeout(()=>box.classList.remove('is-visible'),3800);
}
function activeOffer(p){
  return typeof p.salePrice==='number'&&p.salePrice>0&&p.salePrice<p.basePrice&&
    p.saleStart<=TODAY()&&p.saleEnd>=TODAY()&&
    /^\d{4}-\d{2}-\d{2}$/.test(p.saleStart)&&
    /^\d{4}-\d{2}-\d{2}$/.test(p.saleEnd)&&
    typeof p.saleCheckedAt==='string'&&p.saleCheckedAt!==''&&
    (Date.now()-Date.parse(p.saleCheckedAt+'T00:00:00Z'))<=31*86400000;
}
function validStock(p){
  const stock=p.stockCount;
  return Number.isInteger(stock)&&stock>=0&&
    typeof p.stockCheckedAt==='string'&&p.stockCheckedAt!==''&&
    Date.now()-Date.parse(p.stockCheckedAt+'T00:00:00Z')<=8*86400000;
}
function baseRecord(p){
  return {
    name:p.name,category:p.category,basePrice:p.referencePrice||p.price,
    description:p.description||'',imageUrls:[],imagePaths:[],
    stockCount:null,stockCheckedAt:'',favorite:false,bestSellerMonth:'',
    salePrice:null,saleStart:'',saleEnd:'',saleCheckedAt:'',
    deleted:false,updatedAt:null
  };
}
function allProducts(){
  const found=[];
  const ids=new Set();
  for(const p of BASE){
    ids.add(p.id);
    found.push({id:p.id,...(records.get(p.id)||baseRecord(p))});
  }
  for(const [id,item] of records){
    if(!ids.has(id))found.push({id,...item});
  }
  return found;
}
function currentRecord(id){
  const saved=records.get(id);
  if(saved)return {id,...saved};
  const fallback=BASE.find(p=>p.id===id);
  return fallback?{id,...baseRecord(fallback)}:null;
}
function render(){
  if(!authorized)return;
  const items=allProducts();
  const active=items.filter(item=>!item.deleted);
  $('metric-products').textContent=active.length;
  $('metric-low').textContent=active.filter(p=>validStock(p)&&p.stockCount>=1&&p.stockCount<=10).length;
  $('metric-sales').textContent=active.filter(activeOffer).length;
  $('metric-images').textContent=active.reduce((sum,p)=>sum+(p.imageUrls?.length||0),0);
  const query=$('admin-search').value.trim().toLocaleLowerCase('pt-BR');
  const view=$('admin-filter').value;
  const shown=items.filter(p=>{
    if(query&&!((p.name||'')+' '+p.category+' '+p.id).toLocaleLowerCase('pt-BR').includes(query))return false;
    if(view==='active')return !p.deleted;
    if(view==='archived')return p.deleted;
    if(view==='low')return !p.deleted&&validStock(p)&&p.stockCount>=1&&p.stockCount<=10;
    if(view==='offer')return !p.deleted&&activeOffer(p);
    return true;
  });
  const root=$('admin-list');root.replaceChildren();
  for(const p of shown){
    const button=document.createElement('button');
    button.type='button';button.className='product-row';
    button.dataset.id=p.id;button.setAttribute('aria-label','Editar '+p.name);
    if(p.deleted)button.dataset.archived='true';
    const img=document.createElement('img');
    img.src=p.imageUrls?.[0]||PLACEHOLDER;
    img.alt='';img.loading='lazy';img.addEventListener('error',()=>{img.src=PLACEHOLDER},{once:true});
    const basic=document.createElement('span');
    basic.className='product-primary';
    const name=document.createElement('strong');name.textContent=p.name;
    const category=document.createElement('small');
    category.textContent=p.category+(p.deleted?' · Arquivado':'');
    basic.append(name,category);
    const price=document.createElement('span');price.className='row-price';
    price.textContent=money(activeOffer(p)?p.salePrice:p.basePrice);
    const stock=document.createElement('span');stock.className='row-status';
    if(p.deleted)stock.textContent='Retirado';
    else if(!validStock(p))stock.textContent='Estoque não confirmado';
    else if(p.stockCount===0)stock.textContent='Sem estoque';
    else if(p.stockCount<=10){stock.textContent=p.stockCount+' unidades';stock.classList.add('is-low')}
    else stock.textContent='Estoque informado';
    const edit=document.createElement('span');edit.className='row-edit';edit.textContent=p.deleted?'Restaurar ↗':'Editar ↗';
    button.append(img,basic,price,stock,edit);
    button.addEventListener('click',()=>openEditor(p.id));
    root.append(button);
  }
  $('admin-empty').hidden=shown.length!==0;
}
function updateStorageUI(){
  const input=$('field-photos');
  const enabled=STORAGE_READY||freeMediaReady;
  input.disabled=!enabled;
  const area=input.closest('.upload-area');
  area.classList.toggle('is-unavailable',!enabled);
  area.setAttribute('aria-disabled',String(!enabled));
  $('storage-notice').hidden=STORAGE_READY;
  $('storage-notice').classList.toggle('is-ready',freeMediaReady);
  $('image-backend-title').textContent=freeMediaReady?
    'Fotos grátis ativadas no Firestore.':'Fotografias aguardando autorização.';
  $('image-backend-description').textContent=freeMediaReady?
    'As fotografias serão otimizadas para WebP e guardadas em documentos separados do Firestore. O tamanho e a resolução serão reduzidos para respeitar a cota gratuita.':
    STORAGE_WARNING;
  $('upload-status').textContent=enabled?'':STORAGE_WARNING;
}
function saveStage(value){
  $('save-progress').textContent=value;
}
function resetUpload(){
  selectedImages=[];removedPaths=[];pendingFiles=[];
  $('field-photos').value='';
  $('upload-status').textContent='';
}
function openEditor(id=null){
  if(!authorized)return;
  editingId=id;
  currentProduct=id?currentRecord(id):null;
  resetUpload();
  updateStorageUI();
  saveStage('');
  const p=currentProduct||{
    name:'',category:'Brincos',basePrice:0,description:'',stockCount:null,stockCheckedAt:'',
    salePrice:null,saleStart:'',saleEnd:'',saleCheckedAt:'',
    favorite:false,bestSellerMonth:'',imageUrls:[],imagePaths:[],deleted:false
  };
  $('editor-title').textContent=id?'Editar produto':'Novo produto';
  $('editor-subtitle').textContent=id?'ID: '+id:'O produto receberá um identificador permanente.';
  $('field-name').value=p.name||'';
  $('field-category').value=p.category||'Brincos';
  $('field-price').value=p.basePrice||'';
  $('field-description').value=p.description||'';
  $('field-stock').value=p.stockCount===null||p.stockCount===undefined?'':p.stockCount;
  $('field-recheck').checked=false;
  $('stock-last-checked').textContent=p.stockCheckedAt?'Última conferência: '+p.stockCheckedAt.split('-').reverse().join('/'):'Sem estoque conferido';
  $('field-sale-price').value=p.salePrice===null||p.salePrice===undefined?'':p.salePrice;
  $('field-sale-start').value=p.saleStart||'';
  $('field-sale-end').value=p.saleEnd||'';
  $('field-favorite').checked=p.favorite===true;
  $('field-best-seller').checked=p.bestSellerMonth===MONTH();
  const urls=Array.isArray(p.imageUrls)?p.imageUrls:[];
  const paths=Array.isArray(p.imagePaths)?p.imagePaths:[];
  selectedImages=urls.map((url,i)=>({url,path:paths[i]})).filter(i=>Boolean(i.path&&i.url));
  $('archive-product').hidden=!id;
  $('archive-product').textContent=p.deleted?'Restaurar na vitrine':'Retirar da vitrine';
  renderImages();
  dialog.showModal();
  $('field-name').focus();
}
function renderImages(){
  const el=$('editor-photos');el.replaceChildren();
  const draw=(image,index,isNew=false)=>{
    const card=document.createElement('div');card.className='editor-photo';
    const img=document.createElement('img');
    img.src=isNew?URL.createObjectURL(image):image.url;
    img.alt='Prévia da fotografia '+(index+1);
    const rm=document.createElement('button');rm.type='button';
    rm.textContent='Remover';rm.setAttribute('aria-label','Remover fotografia '+(index+1));
    rm.addEventListener('click',()=>{
      if(isNew){pendingFiles.splice(index-selectedImages.length,1);}
      else{
        const removed=selectedImages.splice(index,1)[0];
        if(removed?.path)removedPaths.push(removed.path);
      }
      renderImages();
    });
    if(isNew)img.addEventListener('load',()=>URL.revokeObjectURL(img.src),{once:true});
    card.append(img,rm);el.append(card);
  };
  selectedImages.forEach((image,i)=>draw(image,i));
  pendingFiles.forEach((file,i)=>draw(file,selectedImages.length+i,true));
}
function slug(name){
  return name.toLocaleLowerCase('pt-BR').normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,45)||'produto';
}
function makeId(name){
  let id=slug(name);
  const taken=new Set(allProducts().map(p=>p.id));
  if(taken.has(id))id+='-'+crypto.randomUUID().slice(0,7);
  return id;
}
function assertFiles(files){
  for(const file of files){
    if(!IMAGE_TYPES.includes(file.type))throw new Error('Formato não aceito: utilize JPEG, PNG ou WebP.');
    if(file.size>5*1024*1024||file.size<=0)throw new Error('Cada imagem deve ter entre 1 byte e 5 MB.');
  }
  if(selectedImages.length+pendingFiles.length+files.length>8)throw new Error('Máximo de 8 imagens por produto.');
}
function setBusy(value){
  busy=value;
  $('save-product').disabled=value;
  $('archive-product').disabled=value;
  $('cancel-edit').disabled=value;
  $('close-editor').disabled=value;
  $('save-product').textContent=value?'Salvando…':'Salvar alterações';
}
async function uploadFiles(id){
  if(!pendingFiles.length)return [];
  if(!STORAGE_READY&&!freeMediaReady)throw Error(STORAGE_WARNING);
  const created=[];
  try{
    for(let i=0;i<pendingFiles.length;i++){
      const file=pendingFiles[i];
      $('upload-status').textContent='Preparando fotografia '+(i+1)+' de '+pendingFiles.length+'…';
      if(freeMediaReady&&!STORAGE_READY){
        if(!window.MargotImageTools)throw Error('O compactador de imagens não foi carregado.');
        const optimized=await window.MargotImageTools.optimize(file);
        const mediaId=crypto.randomUUID();
        const path=FREE_MEDIA_PREFIX+mediaId;
        $('upload-status').textContent='Gravando fotografia '+(i+1)+' de '+pendingFiles.length+' no Firestore…';
        await api.setDoc(api.doc(db,'productMedia',mediaId),{
          productId:id,
          data:optimized.full.data,
          createdAt:api.serverTimestamp()
        });
        created.push({path,url:optimized.thumb.data});
      }else{
        const ext=file.type==='image/png'?'png':file.type==='image/webp'?'webp':'jpg';
        const path='product-images/'+id+'/'+crypto.randomUUID()+'.'+ext;
        const storageRef=api.storageRef(storage,path);
        await api.uploadBytes(storageRef,file,{contentType:file.type,cacheControl:'public,max-age=3600'});
        const url=await api.getDownloadURL(storageRef);
        created.push({path,url});
      }
    }
    return created;
  }catch(error){
    // Fotos criadas nesta tentativa não podem ficar órfãs em caso de falha parcial.
    if(created.length)await removeStoredImages(created.map(item=>item.path));
    throw error;
  }
}
async function removeStoredImages(paths){
  let failures=0;
  for(const path of paths){
    try{
      if(path.startsWith(FREE_MEDIA_PREFIX)){
        const id=path.slice(FREE_MEDIA_PREFIX.length);
        if(!/^[a-f0-9-]{36}$/.test(id))throw Error('Identificador de foto inválido');
        await api.deleteDoc(api.doc(db,'productMedia',id));
      }else if(STORAGE_READY){
        await api.deleteObject(api.storageRef(storage,path));
      }else failures++;
    }catch{failures++}
  }
  return failures;
}
function readForm(){
  const name=$('field-name').value.trim();
  if(name.length<2||name.length>90||/[<>]/.test(name))throw Error('Informe um nome válido, com 2 a 90 caracteres.');
  const basePrice=Number($('field-price').value);
  if(!Number.isFinite(basePrice)||basePrice<=0||basePrice>100000)throw Error('Preço de referência inválido.');
  const stockText=$('field-stock').value.trim();
  const stock=stockText===''?null:Number(stockText);
  if(stock!==null&&(!Number.isInteger(stock)||stock<0||stock>100000))throw Error('O estoque deve ser um número inteiro de 0 a 100.000.');
  const saleText=$('field-sale-price').value.trim();
  const sale=saleText===''?null:Number(saleText);
  let start=$('field-sale-start').value||'',end=$('field-sale-end').value||'';
  if(sale!==null){
    if(!(sale>0&&sale<basePrice))throw Error('O preço promocional precisa ser menor que o de referência.');
    if(!start||!end||start>end)throw Error('Informe o período correto da promoção.');
  }else{start='';end='';}
  const description=$('field-description').value.trim();
  if(/[<>]/.test(description))throw Error('Descrição não pode conter tags HTML.');
  const category=$('field-category').value;
  if(!['Brincos','Colares','Pulseiras','Anéis','Kits'].includes(category))throw Error('Categoria inválida.');
  const p=currentProduct;
  const stockCheckedAt=stock===null?'':(p?.stockCount!==stock||$('field-recheck').checked)?TODAY():(p?.stockCheckedAt||TODAY());
  const changedSale=!p||p.salePrice!==sale||p.saleStart!==start||p.saleEnd!==end||p.basePrice!==basePrice;
  const saleCheckedAt=sale===null?'':changedSale?TODAY():(p?.saleCheckedAt||TODAY());
  return {
    name,category,basePrice,description:description.slice(0,1600),
    stockCount:stock,stockCheckedAt,
    favorite:$('field-favorite').checked,
    bestSellerMonth:$('field-best-seller').checked?MONTH():'',
    salePrice:sale,saleStart:start,saleEnd:end,saleCheckedAt,
    deleted:p?.deleted===true,
    imageUrls:[],imagePaths:[],
    updatedAt:api.serverTimestamp()
  };
}
async function save(event){
  event.preventDefault();
  if(!authorized||busy)return;
  let newUploads=[],saved=false;
  setBusy(true);
  try{
    saveStage('Validando informações…');
    const docData=readForm();
    const id=editingId||makeId(docData.name);
    assertFiles([]);
    if(pendingFiles.length)saveStage('Enviando fotografias…');
    newUploads=await uploadFiles(id);
    const images=[...selectedImages,...newUploads];
    docData.imageUrls=images.map(i=>i.url);
    docData.imagePaths=images.map(i=>i.path);
    saveStage('Gravando produto no Firestore…');
    await api.setDoc(api.doc(db,'products',id),docData);
    saved=true;
    saveStage('Produto salvo.');
    const failed=await removeStoredImages(removedPaths);
    dialog.close();
    toast(failed?'Produto salvo. Algumas fotos antigas exigem limpeza manual.':'Produto salvo e sincronizado.');
  }catch(error){
    const message=error?.code?.startsWith('storage/')?
      'Não foi possível enviar as fotos: verifique o Firebase Storage e suas permissões.':
      error?.message?.includes('permission')?
      'Sem permissão de gravação. Confirme as regras Firebase.':
      (error?.message||'Não foi possível salvar o produto.');
    saveStage('Falha: '+message);
    toast(message);
  }finally{
    if(!saved&&newUploads.length)await removeStoredImages(newUploads.map(i=>i.path));
    setBusy(false);
  }
}
async function archive(){
  if(!authorized||busy||!editingId)return;
  const old=currentRecord(editingId);
  if(!old)return;
  const restore=old.deleted===true;
  if(!window.confirm(restore?'Restaurar este produto na vitrine?':'Retirar este produto da vitrine? A edição poderá ser restaurada.'))return;
  setBusy(true);
  try{
    const data={...baseRecord(old),...old};
    delete data.id;
    data.updatedAt=api.serverTimestamp();
    data.deleted=!restore;
    await api.setDoc(api.doc(db,'products',editingId),data);
    dialog.close();
    toast(restore?'Produto restaurado na vitrine.':'Produto retirado da vitrine.');
  }catch(error){
    toast(error?.message||'Falha ao alterar a visibilidade.');
  }finally{setBusy(false);}
}
async function checkFreeImageAccess(){
  if(STORAGE_READY){freeMediaReady=false;return}
  try{
    // Leitura de um documento inexistente: nenhuma gravação ou alteração de dados.
    await api.getDoc(api.doc(db,'productMedia','00000000-0000-0000-0000-000000000000'));
    freeMediaReady=true;
  }catch(error){
    freeMediaReady=false;
  }
  if(dialog.open)updateStorageUI();
}
function authorizedUser(user){
  return Boolean(user&&user.emailVerified&&user.email?.toLowerCase()===OWNER&&
    user.providerData?.some(provider=>provider.providerId==='google.com'));
}
function listen(){
  if(unsubscribe)unsubscribe();
  unsubscribe=api.onSnapshot(api.collection(db,'products'),snapshot=>{
    records=new Map(snapshot.docs.map(doc=>[doc.id,doc.data()]));
    $('admin-gate').hidden=true;
    $('admin-app').hidden=false;
    status('Sincronizado');
    render();
  },error=>{
    status('Firestore indisponível ou sem regras de acesso. Confira a configuração.',true);
    $('admin-app').hidden=true;
    $('admin-gate').hidden=false;
  });
}
async function start(){
  BASE=window.MargotCatalog?.products||[];
  const config=window.MARGOT_FIREBASE_CONFIG;
  if(!config?.projectId){
    status('Firebase não configurado. Verifique firebase-config.js.',true);return;
  }
  try{
    const [appSdk,authSdk,dbSdk,storageSdk]=await Promise.all([
      import('https://www.gstatic.com/firebasejs/13.2.0/firebase-app.js'),
      import('https://www.gstatic.com/firebasejs/13.2.0/firebase-auth.js'),
      import('https://www.gstatic.com/firebasejs/13.2.0/firebase-firestore.js'),
      STORAGE_READY?import('https://www.gstatic.com/firebasejs/13.2.0/firebase-storage.js'):Promise.resolve(null)
    ]);
    const app=appSdk.getApps().length?appSdk.getApp():appSdk.initializeApp(config);
    auth=authSdk.getAuth(app);
    db=dbSdk.getFirestore(app);
    storage=storageSdk?.getStorage(app)||null;
    if(storage){
      storageSdk.setMaxUploadRetryTime(storage,15000);
      storageSdk.setMaxOperationRetryTime(storage,10000);
    }
    api={
      signInWithPopup:authSdk.signInWithPopup,GoogleAuthProvider:authSdk.GoogleAuthProvider,
      signOut:authSdk.signOut,
      onSnapshot:dbSdk.onSnapshot,collection:dbSdk.collection,doc:dbSdk.doc,
      setDoc:dbSdk.setDoc,getDoc:dbSdk.getDoc,deleteDoc:dbSdk.deleteDoc,
      serverTimestamp:dbSdk.serverTimestamp,
      storageRef:storageSdk?.ref,uploadBytes:storageSdk?.uploadBytes,
      getDownloadURL:storageSdk?.getDownloadURL,deleteObject:storageSdk?.deleteObject
    };
    $('admin-login').disabled=false;
    status('Entre com a conta administradora para continuar.');
    authSdk.onAuthStateChanged(auth,async user=>{
      if(unsubscribe){unsubscribe();unsubscribe=null}
      authorized=authorizedUser(user);
      $('admin-app').hidden=true;
      $('admin-gate').hidden=false;
      if(!user){status('Entre com a conta Google autorizada.');return;}
      if(!authorized){
        status('Esta conta não tem autorização para editar a loja.',true);
        await authSdk.signOut(auth);
        return;
      }
      $('admin-account').textContent=user.email||'Administradora';
      status('Conferindo permissões no Firebase…');
      listen();
      checkFreeImageAccess();
    },()=>status('Não foi possível verificar a conta Google.',true));
  }catch(error){
    status('Não foi possível carregar a conexão Firebase. Verifique a rede.',true);
  }
}
$('admin-login').addEventListener('click',async()=>{
  if(!api||!auth)return;
  $('admin-login').disabled=true;
  status('Abrindo login do Google…');
  try{
    const provider=new api.GoogleAuthProvider();
    provider.setCustomParameters({prompt:'select_account'});
    await api.signInWithPopup(auth,provider);
  }catch(error){
    status(error.code==='auth/unauthorized-domain'?
      'Autorize o domínio k410sh4.github.io no Firebase Authentication.':
      'Login não concluído. Confira a conta e tente novamente.',true);
  }finally{$('admin-login').disabled=false;}
});
$('admin-logout').addEventListener('click',async()=>{
  if(auth&&api)await api.signOut(auth);
});
$('new-product').addEventListener('click',()=>openEditor());
$('new-product-secondary').addEventListener('click',()=>openEditor());
$('admin-search').addEventListener('input',render);
$('admin-filter').addEventListener('change',render);
$('close-editor').addEventListener('click',()=>{if(!busy)dialog.close()});
$('cancel-edit').addEventListener('click',()=>{if(!busy)dialog.close()});
dialog.addEventListener('cancel',event=>{if(busy)event.preventDefault()});
form.addEventListener('submit',save);
$('archive-product').addEventListener('click',archive);
$('field-photos').addEventListener('change',event=>{
  try{
    if(!STORAGE_READY&&!freeMediaReady)throw Error(STORAGE_WARNING);
    const files=Array.from(event.target.files||[]);
    assertFiles(files);
    pendingFiles.push(...files);
    $('upload-status').textContent=pendingFiles.length+' foto(s) pronta(s) para envio ao salvar.';
    renderImages();
  }catch(error){toast(error.message);}
  event.target.value='';
});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});
else start();
