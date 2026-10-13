(()=>{
  const APK='/downloads/Bivvo-Controle-Financeiro.apk';
  const ua=navigator.userAgent||'';
  const isAndroid=/Android/i.test(ua);
  const isiOS=/iPhone|iPad|iPod/i.test(ua) || (navigator.platform==='MacIntel' && navigator.maxTouchPoints>1);
  const isInstalled=()=>{
    try{
      if(window.Capacitor?.isNativePlatform?.()) return true;
      if(window.matchMedia?.('(display-mode: standalone)').matches) return true;
      if(window.navigator.standalone===true) return true;
      if(/^(capacitor|ionic):$/i.test(location.protocol)) return true;
    }catch{}
    return false;
  };

  function init(){
    document.querySelectorAll('[data-bivvo-apk]').forEach(a=>{
      a.setAttribute('href',APK);
      a.setAttribute('download','Bivvo-Controle-Financeiro.apk');
    });

    // Não ofereça instalação quando o Bivvo já estiver rodando instalado
    // (APK/Capacitor ou PWA adicionado à Tela de Início).
    const sheet=document.getElementById('bivvoInstallSheet');
    if(isInstalled()){
      sheet?.classList.remove('is-open');
      if(sheet) sheet.hidden=true;
      document.querySelectorAll('[data-bivvo-android-only]').forEach(el=>el.hidden=true);
      return;
    }

    // O convite automático existe somente em Android e iPhone/iPad.
    if(!sheet || (!isAndroid && !isiOS)) return;

    const title=sheet.querySelector('[data-install-title]');
    const desc=sheet.querySelector('[data-install-desc]');
    const downloadBtn=sheet.querySelector('[data-bivvo-apk]');
    const helpBtn=sheet.querySelector('[data-install-help]');
    const note=sheet.querySelector('[data-install-note]');
    const close=sheet.querySelector('[data-install-close]');

    if(isiOS){
      sheet.dataset.platform='ios';
      if(title) title.textContent='Instale o Bivvo no iPhone';
      if(desc) desc.textContent='A versão do Bivvo para a App Store ainda está em desenvolvimento. Enquanto isso, você pode instalar pelo Safari: toque em Compartilhar e depois em “Adicionar à Tela de Início”.';
      if(downloadBtn) downloadBtn.hidden=true;
      if(helpBtn){
        helpBtn.textContent='Abrir Bivvo no navegador';
        helpBtn.setAttribute('href','/');
        helpBtn.classList.add('bivvo-install-web-primary');
      }
      if(note) note.textContent='No iPhone não é necessário baixar APK. Estamos preparando a versão oficial para a App Store.';
    }else{
      sheet.dataset.platform='android';
      if(title) title.textContent='Instale o Bivvo no Android';
      if(desc) desc.textContent='Baixe o aplicativo oficial do Bivvo e tenha acesso direto pela tela inicial do seu celular.';
      if(downloadBtn) downloadBtn.hidden=false;
      if(helpBtn){
        helpBtn.textContent='Como instalar';
        helpBtn.setAttribute('href','/instalar/');
        helpBtn.classList.remove('bivvo-install-web-primary');
      }
      if(note) note.textContent='Download oficial do Bivvo para Android.';
    }

    close?.addEventListener('click',()=>{
      sheet.classList.remove('is-open');
      try{sessionStorage.setItem('bivvo_install_sheet_closed','1')}catch{}
    });

    const show=()=>{
      let closed=false;
      try{closed=sessionStorage.getItem('bivvo_install_sheet_closed')==='1'}catch{}
      if(!closed) sheet.classList.add('is-open');
    };

    if(!document.body.classList.contains('booting')) show();
    else setTimeout(show,1200);
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();
