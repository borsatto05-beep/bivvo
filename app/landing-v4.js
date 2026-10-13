(() => {
  const $$=(q,r=document)=>[...r.querySelectorAll(q)];
  const $=(q,r=document)=>r.querySelector(q);
  const reduced=()=>matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  function reveal(){const els=$$('.l4-reveal');if(reduced()||!('IntersectionObserver'in window)){els.forEach(x=>x.classList.add('is-visible'));return}const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('is-visible');io.unobserve(e.target)}}),{threshold:.1});els.forEach(x=>io.observe(x))}
  function profiles(){const tabs=$$('[data-l4-tab]');const show=k=>{tabs.forEach(b=>b.classList.toggle('on',b.dataset.l4Tab===k));$$('[data-l4-shot]').forEach(x=>x.classList.toggle('on',x.dataset.l4Shot===k));$$('[data-l4-pane]').forEach(x=>x.classList.toggle('on',x.dataset.l4Pane===k))};tabs.forEach(b=>b.addEventListener('click',()=>show(b.dataset.l4Tab)))}
  function pricing(){const buttons=$$('[data-price-mode]');const set=mode=>{buttons.forEach(b=>b.classList.toggle('on',b.dataset.priceMode===mode));$$('.l4-plan').forEach(p=>p.dataset.annualView=String(mode==='annual'))};buttons.forEach(b=>b.addEventListener('click',()=>set(b.dataset.priceMode)));set('monthly')}
  function nav(){document.addEventListener('click',e=>{const b=e.target.closest('[data-scroll]');if(!b)return;const target=document.getElementById(b.dataset.scroll);const details=target?.closest('details');if(details)details.open=true;target?.scrollIntoView({behavior:reduced()?'auto':'smooth',block:'start'})})}
  function init(){reveal();profiles();pricing();nav()}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
