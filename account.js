/* Margot Acessórios — Google/Firebase Authentication */
document.addEventListener('DOMContentLoaded', () => {
  'use strict';
  const get=id=>document.getElementById(id);
  const dialog=get('account-dialog');
  const accountButton=get('account-open');
  const login=get('google-signin');
  const logout=get('google-signout');
  const status=get('account-auth-status');
  const logoutStatus=get('account-signout-status');
  const signedOut=get('account-signed-out');
  const signedIn=get('account-signed-in');
  const avatar=get('account-avatar');
  const accountIcon=get('account-icon');
  const photo=get('account-photo');
  const photoFallback=get('account-photo-fallback');
  const cfg=window.MARGOT_FIREBASE_CONFIG;
  const configured=Boolean(cfg&&['apiKey','authDomain','projectId','appId'].every(k=>typeof cfg[k]==='string'&&cfg[k].trim()&&!cfg[k].includes('SUBSTITUIR')));
  let auth=null, sdk=null;
  const say=s=>{status.textContent=s};
  accountButton.addEventListener('click',()=>{if(!dialog.open)dialog.showModal()});
  get('account-close').addEventListener('click',()=>dialog.close());
  dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close()});
  dialog.addEventListener('close',()=>accountButton.focus({preventScroll:true}));
  function render(user){
    const isIn=Boolean(user);
    signedOut.hidden=isIn;
    signedIn.hidden=!isIn;
    const hasImage=isIn&&typeof user.photoURL==='string'&&user.photoURL.startsWith('https://');
    avatar.hidden=!hasImage;
    accountIcon.hidden=hasImage;
    if(!isIn){avatar.removeAttribute('src');photo.removeAttribute('src');accountButton.title='Entrar com Google';accountButton.setAttribute('aria-label','Entrar ou criar conta');return}
    get('account-name').textContent=user.displayName||'Cliente Margot';
    get('account-email').textContent=user.email||'Conta Google';
    photo.hidden=!hasImage;
    photoFallback.hidden=hasImage;
    accountButton.title='Minha conta';
    accountButton.setAttribute('aria-label','Abrir minha conta');
    if(hasImage){avatar.src=user.photoURL;photo.src=user.photoURL}
  }
  avatar.addEventListener('error',()=>{avatar.hidden=true;accountIcon.hidden=false});
  photo.addEventListener('error',()=>{photo.hidden=true;photoFallback.hidden=false});
  render(null);
  if(!configured){say('Login com Google em preparação. A ativação depende da configuração oficial da loja.');return}
  say('Carregando conexão com o Google…');
  Promise.all([
    import('https://www.gstatic.com/firebasejs/13.2.0/firebase-app.js'),
    import('https://www.gstatic.com/firebasejs/13.2.0/firebase-auth.js')
  ]).then(([appSdk,authSdk])=>{
    sdk=authSdk;
    auth=authSdk.getAuth(appSdk.initializeApp(cfg));
    authSdk.onAuthStateChanged(auth,user=>{
      render(user);
      if(!user)say('Escolha sua conta Google para entrar ou criar seu cadastro.');
    },()=>say('Não foi possível verificar sua sessão. Recarregue a página.'));
    login.disabled=false;
  }).catch(()=>say('O login não pôde ser carregado. Confira a conexão e a configuração Firebase.'));
  function errorMessage(err){
    switch(err&&err.code){
      case 'auth/popup-closed-by-user':return 'Login cancelado. Tente novamente quando quiser.';
      case 'auth/cancelled-popup-request':return 'Outra janela de login já está aberta.';
      case 'auth/popup-blocked':return 'Seu navegador bloqueou a janela. Libere pop-ups para este site.';
      case 'auth/unauthorized-domain':return 'Domínio não autorizado. Adicione k410sh4.github.io aos domínios autorizados do Firebase.';
      case 'auth/operation-not-allowed':return 'Ative o provedor Google no Firebase Authentication.';
      case 'auth/network-request-failed':return 'Falha na conexão. Tente novamente.';
      case 'auth/too-many-requests':return 'Muitas tentativas. Tente mais tarde.';
      default:return 'Não foi possível entrar com Google. Tente novamente.';
    }
  }
  login.addEventListener('click',()=>{
    if(!auth||!sdk)return;
    login.disabled=true;
    say('Abrindo uma janela do Google…');
    const provider=new sdk.GoogleAuthProvider();
    provider.setCustomParameters({prompt:'select_account'});
    const result=sdk.signInWithPopup(auth,provider);
    result.then(()=>{say('Login concluído.');dialog.close()})
      .catch(err=>say(errorMessage(err)))
      .finally(()=>{login.disabled=false});
  });
  logout.addEventListener('click',()=>{
    if(!auth||!sdk)return;
    logout.disabled=true;
    logoutStatus.textContent='Encerrando sessão…';
    sdk.signOut(auth).then(()=>{logoutStatus.textContent='';say('Você saiu da sua conta.')})
      .catch(()=>{logoutStatus.textContent='Não foi possível encerrar sua sessão.'})
      .finally(()=>{logout.disabled=false});
  });
});
