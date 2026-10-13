/* Google Ads: somente após permissão explícita para medição de campanhas. */
(() => {
  const TAG_ID='AW-18502157854';
  // Rótulo da ação Inscrição fornecido pelo proprietário da conta.
  const SIGNUP_CONVERSION_LABEL='QTYvCJ7J7ZUdEJ6MwvZE';
  let initialized=false,loaded=false;
  const seen=new Set();
  const allowed=()=>window.bivvoPrivacy?.marketingAllowed()===true;
  const consent=value=>({ad_storage:value,analytics_storage:value,ad_user_data:value,ad_personalization:value});
  function init(){
    if(initialized)return;
    initialized=true;window.dataLayer=window.dataLayer||[];
    window.gtag=window.gtag||function(){window.dataLayer.push(arguments);};
    window.gtag('consent','default',consent('denied'));
    window.gtag('js',new Date());
  }
  function start(loadTag=false){
    if(!allowed())return;
    init();window.gtag('consent','update',consent('granted'));
    // Do not load Google's advertising runtime on every authenticated app visit.
    // It creates third-party iframe/srcdoc requests that conflict with the app's strict CSP.
    // Load it only when there is an actual signup conversion to send.
    if(!loadTag||loaded)return;
    loaded=true;window.gtag('config',TAG_ID,{allow_enhanced_conversions:false});
    const script=document.createElement('script');script.async=true;
    script.src='https://www.googletagmanager.com/gtag/js?id='+TAG_ID;
    script.onerror=()=>{loaded=false;};
    document.head.append(script);
  }
  window.bivvoGoogleAds={
    registration(key){
      if(!allowed()||!SIGNUP_CONVERSION_LABEL||!key||seen.has(key))return false;
      start(true);seen.add(key);
      window.gtag('event','conversion',{send_to:TAG_ID+'/'+SIGNUP_CONVERSION_LABEL,value:1.0,currency:'BRL',transaction_id:crypto.randomUUID()});
      return true;
    }
  };
  window.bivvoPrivacy?.onChange(ok=>{if(ok)start(false);else if(initialized)window.gtag('consent','update',consent('denied'));});
  start(false);
})();
