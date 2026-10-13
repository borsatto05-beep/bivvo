/* Bivvo 11.52 — interação leve da landing. Sem dependências externas e sem dados do usuário. */
(() => {
  const $=(q,r=document)=>r.querySelector(q), $$=(q,r=document)=>[...r.querySelectorAll(q)];
  const reduced=()=>matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const captions={personal:'Dashboard pessoal · dados demonstrativos',couple:'Perfil Casal · dados demonstrativos',company:'Cockpit Empresa · dados demonstrativos',cards:'Cartões e faturas · dados demonstrativos',ai:'Bivvo IA · exemplo demonstrativo'};
  function init(){
    initReveal();initTour();initBiDemo();initTilt();initCounters();initAging();
  }
  function initReveal(){
    const els=$$('[data-reveal]');
    if(reduced()||!('IntersectionObserver' in window)){els.forEach(x=>x.classList.add('is-visible'));return;}
    const io=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('is-visible');io.unobserve(e.target);}}),{threshold:.12,rootMargin:'0px 0px -5%'});
    els.forEach(x=>io.observe(x));
  }
  function initTour(){
    const tabs=$$('[data-showcase-tab]'); if(!tabs.length)return;
    let timer=null,idx=0,touched=false;
    const show=key=>{
      tabs.forEach(b=>{const on=b.dataset.showcaseTab===key;b.classList.toggle('on',on);b.setAttribute('aria-selected',on?'true':'false');});
      $$('[data-showcase-pane]').forEach(x=>x.classList.toggle('on',x.dataset.showcasePane===key));
      $$('[data-showcase-shot]').forEach(x=>x.classList.toggle('on',x.dataset.showcaseShot===key));
      const cap=$('#showcaseCaption');if(cap)cap.textContent=captions[key]||'';
      idx=Math.max(0,tabs.findIndex(b=>b.dataset.showcaseTab===key));
    };
    tabs.forEach(b=>b.addEventListener('click',()=>{touched=true;show(b.dataset.showcaseTab);}));
    if(!reduced())timer=setInterval(()=>{if(!touched){idx=(idx+1)%tabs.length;show(tabs[idx].dataset.showcaseTab);}},5200);
    document.addEventListener('visibilitychange',()=>{if(document.hidden&&timer){clearInterval(timer);timer=null;}});
  }
  const bi={
    1:{rev:'R$ 29,8 mil',exp:'R$ 21,4 mil',res:'R$ 8,4 mil',margin:'28,2%',cash:'R$ 24,1 mil',bars:[[18,13],[23,16],[26,19],[30,21]]},
    3:{rev:'R$ 84,6 mil',exp:'R$ 61,7 mil',res:'R$ 22,9 mil',margin:'27,1%',cash:'R$ 26,4 mil',bars:[[22,17],[25,18],[30,21]]},
    6:{rev:'R$ 162 mil',exp:'R$ 119 mil',res:'R$ 43 mil',margin:'26,5%',cash:'R$ 28 mil',bars:[[20,15],[22,17],[24,18],[27,20],[29,22],[33,24]]},
    12:{rev:'R$ 308 mil',exp:'R$ 230 mil',res:'R$ 78 mil',margin:'25,3%',cash:'R$ 28 mil',bars:[[16,13],[18,14],[19,15],[20,16],[22,17],[23,18],[24,19],[26,19],[27,20],[29,22],[31,23],[33,24]]}
  };
  function initBiDemo(){
    const host=$('#landingBiBars');if(!host)return;
    const render=n=>{
      const d=bi[n]||bi[6];
      const values=[d.rev,d.exp,d.res,d.margin,d.cash];['revenue','expense','result','margin','cash'].forEach((k,i)=>{const el=$(`[data-bi-kpi="${k}"]`);if(el)el.textContent=values[i];});
      host.replaceChildren();const max=Math.max(...d.bars.flat());
      d.bars.forEach((pair,i)=>{const g=document.createElement('div');g.className='demo-bar-group';const bars=document.createElement('div');bars.className='demo-bar-pair';const r=document.createElement('i');r.className='rev';r.style.setProperty('--h',`${pair[0]/max*100}%`);const e=document.createElement('i');e.className='exp';e.style.setProperty('--h',`${pair[1]/max*100}%`);bars.append(r,e);const l=document.createElement('small');l.textContent=n===1?['S1','S2','S3','S4'][i]:n===3?['Ago','Set','Out'][i]:n===6?['Mai','Jun','Jul','Ago','Set','Out'][i]:['Nov','Dez','Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out'][i];g.append(bars,l);host.append(g);requestAnimationFrame(()=>g.classList.add('ready'));});
    };
    $$('[data-bi-period]').forEach(b=>b.addEventListener('click',()=>{$$('[data-bi-period]').forEach(x=>x.classList.toggle('on',x===b));render(Number(b.dataset.biPeriod)||6);}));
    $$('.demo-cost-list button').forEach(b=>b.addEventListener('click',()=>{$$('.demo-cost-list button').forEach(x=>x.classList.toggle('on',x===b));const donut=$('#landingBiDonut');if(donut)donut.dataset.focus=b.dataset.cost||'';}));
    render(6);
  }
  function initTilt(){
    if(reduced())return;const el=$('[data-tilt]');if(!el)return;
    el.addEventListener('pointermove',e=>{const r=el.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;el.style.setProperty('--rx',`${(-y*4).toFixed(2)}deg`);el.style.setProperty('--ry',`${(x*5).toFixed(2)}deg`);});
    el.addEventListener('pointerleave',()=>{el.style.setProperty('--rx','0deg');el.style.setProperty('--ry','0deg');});
  }
  function initCounters(){
    if(reduced())return;$$('[data-count]').forEach(el=>{const end=Number(el.dataset.count)||0;let started=false;const io=new IntersectionObserver(es=>es.forEach(e=>{if(!e.isIntersecting||started)return;started=true;const start=performance.now(),dur=700;const tick=t=>{const p=Math.min(1,(t-start)/dur),v=Math.round(end*(1-Math.pow(1-p,3)));el.textContent=String(v);if(p<1)requestAnimationFrame(tick);};requestAnimationFrame(tick);io.disconnect();}),{threshold:.5});io.observe(el);});
  }
  function initAging(){ $$('[data-w]').forEach(el=>el.style.setProperty('--w',`${Math.max(0,Math.min(100,Number(el.dataset.w)||0))}%`)); }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
