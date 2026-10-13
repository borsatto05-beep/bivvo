(()=>{
 const parse=v=>{const text=String(v??'').trim();if(!/^[0-9]+(?:[.,][0-9]+)*$/.test(text))return null;const n=Number(text.includes(',')?text.replace(/\./g,'').replace(',','.'):/^\d{1,3}(?:\.\d{3})+$/.test(text)?text.replace(/\./g,''):text);return Number.isFinite(n)?n:null;};
 const brl=v=>v.toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
 const qBtn=document.getElementById('qCalc');
 if(qBtn)qBtn.addEventListener('click',()=>{
  const root=document.getElementById('spendableTool');
  const s=parse(document.getElementById('qSaldo')?.value),c=parse(document.getElementById('qContas')?.value),d=parse(document.getElementById('qDias')?.value);
  if(s===null||c===null||d===null||d<1||d>366||!Number.isInteger(d)){
   root?.removeAttribute('data-tool-completed');document.getElementById('qResultado').textContent='—';
   document.getElementById('qTexto').textContent='Informe saldo e contas a partir de zero e um número inteiro de dias entre 1 e 366.';
   document.getElementById('qSignup')?.remove();return;
  }
  const livre=Math.max(0,s-c),dia=livre/d;
  document.getElementById('qResultado').textContent=brl(dia);
  document.getElementById('qTexto').textContent=livre>0?`${brl(livre)} livres para ${d} dia${d>1?'s':''}, antes de outros gastos e imprevistos.`:'Pelos valores informados, não há sobra livre antes da próxima renda. O próximo passo é revisar as contas essenciais.';
  const box=document.querySelector('.live-result');
  if(box&&!document.getElementById('qSignup')){
   const a=document.createElement('a');a.id='qSignup';a.className='primary-cta';a.textContent='Salvar meu próximo passo no Bivvo';
   const u=new URL('/',location.origin);u.searchParams.set('signup','1');
   for(const key of ['utm_source','utm_medium','utm_campaign','utm_content','utm_term']){const value=new URLSearchParams(location.search).get(key);if(value)u.searchParams.set(key,value.slice(0,80));}
   if(!u.searchParams.has('utm_source'))u.searchParams.set('utm_source','public_tool');
   if(!u.searchParams.has('utm_campaign'))u.searchParams.set('utm_campaign','quanto_posso_gastar_result');
   let ref;try{ref=localStorage.getItem('bivvo_ref');}catch{}
   if(ref&&/^[a-f0-9]{8}$/.test(ref))u.searchParams.set('ref',ref);
   a.href=u.toString();a.dataset.seo='signup';a.dataset.seoTarget='calculator_result';box.append(a);
  }
  window.bivvoTool?.complete('spendable',root);
 });
 const cBtn=document.getElementById('cCalc');
 if(cBtn)cBtn.addEventListener('click',()=>{
  const l=parse(document.getElementById('cLimite')?.value),fa=parse(document.getElementById('cFatura')?.value),p=parse(document.getElementById('cParcelas')?.value);
  if([l,fa,p].some(v=>v===null))return;
  const usado=fa+p,livre=Math.max(0,l-usado),pct=l?Math.min(100,usado/l*100):0;
  document.getElementById('cResultado').textContent=brl(livre);document.getElementById('cTexto').textContent=`${pct.toFixed(0)}% do limite está comprometido considerando fatura e parcelas informadas.`;
  window.bivvoTool?.complete('card_limit',cBtn.closest('section'));
 });
})();
