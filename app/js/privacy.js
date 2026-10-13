/* Escolha explícita antes de carregar publicidade. Sem escolha = sem rastreamento. */
(() => {
  const KEY='bivvo_privacy_v1', listeners=new Set();
  let choice=null;
  try { const v=JSON.parse(localStorage.getItem(KEY)||'null');
    if (v && typeof v.marketing==='boolean' && Number.isFinite(v.at) && Date.now()-v.at<180*86400000) choice=v;
  } catch {}
  const allowed=()=>choice?.marketing===true;
  let panel;
  function choose(marketing) {
    choice={marketing,at:Date.now()};
    try { localStorage.setItem(KEY,JSON.stringify(choice)); } catch {}
    if (!marketing) for (const name of ['_ttp','_tt_enable_cookie','ttcsid']) document.cookie=`${name}=; Max-Age=0; Path=/; SameSite=Lax`;
    panel?.remove(); panel=null;
    listeners.forEach(fn=>fn(marketing));
  }
  function button(text,fn) { const b=document.createElement('button');b.type='button';b.textContent=text;b.onclick=fn;return b; }
  function open() {
    if(panel)return;
    panel=document.createElement('section');panel.className='privacy-panel';panel.setAttribute('role','region');panel.setAttribute('aria-label','Escolhas de privacidade');
    const title=document.createElement('strong');title.textContent='Suas escolhas de privacidade';
    const p=document.createElement('p');p.textContent='Podemos usar Google Ads e TikTok para medir campanhas, com cookies e informações de navegação. Você pode usar o Bivvo sem esse rastreamento e mudar sua escolha a qualquer momento.';
    const link=document.createElement('a');link.href='/privacidade/';link.textContent='Como seus dados são usados';
    const actions=document.createElement('div');actions.className='privacy-actions';
    actions.append(button('Continuar sem rastreamento',()=>choose(false)),button('Permitir medição de campanhas',()=>choose(true)),button('Limpar permissões de IA',()=>{try{localStorage.removeItem('bivvo_ai_consent_v1');}catch{} actions.lastChild.textContent='Permissões de IA removidas';}));
    panel.append(title,p,link,actions);document.body.append(panel);
  }
  window.bivvoPrivacy={marketingAllowed:allowed,onChange(fn){listeners.add(fn);return()=>listeners.delete(fn);},open};
  const mount=()=>{
    document.querySelectorAll('[data-privacy-settings]').forEach(el=>el.addEventListener('click',open));
    if(!choice)open();
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})();
