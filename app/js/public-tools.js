import { adminTrack } from './admin-analytics.js';

const BRL = new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'});
const money = n => BRL.format(Number.isFinite(n)?n:0);
const num = v => { const n=Number(String(v||'').replace(/\./g,'').replace(',','.')); return Number.isFinite(n)?n:0; };

const TOOLS = {
  reserve:{title:'Reserva de emergência',desc:'Descubra uma meta de reserva com base nos seus gastos essenciais.',fields:[['Gasto essencial por mês','monthly','number','Ex.: 2500'],['Meses de proteção','months','number','Ex.: 6']],calc:v=>{const m=Math.max(1,num(v.months)||6), monthly=Math.max(0,num(v.monthly));return {headline:`Meta sugerida: ${money(monthly*m)}`,detail:`Equivale a ${m} meses de gastos essenciais. No Bivvo você pode transformar essa estimativa em uma meta e acompanhar a evolução.`};}},
  commitment:{title:'Comprometimento de renda',desc:'Veja quanto da sua renda mensal já está comprometida.',fields:[['Renda mensal','income','number','Ex.: 4000'],['Contas + parcelas mensais','fixed','number','Ex.: 1800']],calc:v=>{const i=Math.max(0,num(v.income)),f=Math.max(0,num(v.fixed)),p=i?f/i*100:0;const tone=p<=50?'Faixa mais confortável':p<=70?'Atenção ao comprometimento':'Comprometimento elevado';return {headline:`${p.toFixed(1).replace('.',',')}% da renda comprometida`,detail:`${tone}. Depois dos compromissos informados, restariam aproximadamente ${money(Math.max(0,i-f))} antes de outros gastos e metas.`};}},
  installment:{title:'Calculadora de parcelas',desc:'Veja o peso de uma compra parcelada no seu mês.',fields:[['Valor da compra','total','number','Ex.: 1200'],['Número de parcelas','parts','number','Ex.: 12']],calc:v=>{const t=Math.max(0,num(v.total)),p=Math.max(1,Math.floor(num(v.parts)||1));return {headline:`${p}x de aproximadamente ${money(t/p)}`,detail:`Total informado: ${money(t)}. No Bivvo você consegue comparar essa parcela com suas contas, fatura e dinheiro livre.`};}},
  goal:{title:'Quanto guardar por mês?',desc:'Calcule quanto separar por mês para chegar a uma meta.',fields:[['Valor da meta','target','number','Ex.: 10000'],['Quanto já tem','saved','number','Ex.: 1500'],['Prazo em meses','months','number','Ex.: 12']],calc:v=>{const t=Math.max(0,num(v.target)),s=Math.max(0,num(v.saved)),m=Math.max(1,Math.floor(num(v.months)||1)),left=Math.max(0,t-s);return {headline:`Guarde cerca de ${money(left/m)} por mês`,detail:`Faltam ${money(left)} para a meta. O Bivvo pode acompanhar o progresso mês a mês e mostrar o impacto no seu dinheiro livre.`};}}
};

function startSignup(){adminTrack('public_tool_signup_clicked','public_tools').catch(()=>{});document.querySelector('#landingStart')?.click();}

function openTool(key){
  const tool=TOOLS[key], box=document.querySelector('#publicToolWorkspace'); if(!tool||!box)return;
  adminTrack('public_tool_opened','public_tools',{error_type:key}).catch(()=>{});
  box.hidden=false; box.innerHTML='';
  const head=document.createElement('div'); head.className='public-tool-head';
  const title=document.createElement('h3'); title.textContent=tool.title;
  const desc=document.createElement('p'); desc.textContent=tool.desc;
  head.append(title,desc); box.append(head);
  const form=document.createElement('form'); form.className='public-tool-form';
  for(const [label,name,type,placeholder] of tool.fields){const wrap=document.createElement('label');wrap.className='public-tool-field';const s=document.createElement('span');s.textContent=label;const input=document.createElement('input');input.name=name;input.type=type;input.inputMode='decimal';input.placeholder=placeholder;input.min='0';input.required=true;wrap.append(s,input);form.append(wrap);}
  const btn=document.createElement('button');btn.type='submit';btn.className='btn primary';btn.textContent='Calcular grátis';form.append(btn);box.append(form);
  const result=document.createElement('div');result.className='public-tool-result';result.hidden=true;box.append(result);
  form.addEventListener('submit',e=>{e.preventDefault();const values=Object.fromEntries(new FormData(form));const out=tool.calc(values);result.innerHTML='';const h=document.createElement('strong');h.textContent=out.headline;const p=document.createElement('p');p.textContent=out.detail;const cta=document.createElement('button');cta.type='button';cta.className='btn primary';cta.textContent='Acompanhar isso no Bivvo';cta.addEventListener('click',startSignup);result.append(h,p,cta);result.hidden=false;adminTrack('public_tool_completed','public_tools',{error_type:key}).catch(()=>{});result.scrollIntoView({behavior:'smooth',block:'nearest'});});
  box.scrollIntoView({behavior:'smooth',block:'center'});
}

export function bindPublicTools(){document.querySelectorAll('[data-public-tool]').forEach(b=>b.addEventListener('click',()=>openTool(b.dataset.publicTool)));}
