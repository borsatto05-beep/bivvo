import { safeEmbedTool, classifyReferral } from '../../js/growth-utils.mjs';
import { adminTrack } from '../../js/admin-analytics.js';
const qs=new URLSearchParams(location.search),tool=safeEmbedTool(qs.get('tool')),root=document.getElementById('embedApp'),full=document.getElementById('fullLink');
const routeByTool={comprometimento:'/calculadoras/comprometimento-de-renda',parcelas:'/calculadoras/parcelas',reserva:'/calculadoras/reserva-de-emergencia'};
const trackedRoute=routeByTool[tool]||routeByTool.comprometimento;
adminTrack('tool_embed_opened',trackedRoute,{content:tool}).catch(()=>{});
try{const inbound=classifyReferral(location.href,document.referrer);adminTrack('external_referral_visit',trackedRoute,{content:`embed:${inbound.source||'unknown'}`}).catch(()=>{});}catch{}
const n=v=>{const x=Number(String(v||'').replace(/\./g,'').replace(',','.').replace(/[^0-9.-]/g,''));return Number.isFinite(x)?Math.max(0,x):0};
const money=v=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(v||0);
const el=(tag,text,cls)=>{const e=document.createElement(tag);if(text!=null)e.textContent=text;if(cls)e.className=cls;return e};
const field=(label,name,placeholder)=>{const w=el('label');w.textContent=label;const i=el('input');i.name=name;i.inputMode='decimal';i.required=true;i.placeholder=placeholder;w.append(i);return w};
let started=false,completed=false;
function base(title,desc,fields){root.replaceChildren();root.append(el('h1',title),el('p',desc));const f=el('form');f.className='bv42-embed-fields';fields.forEach(x=>f.append(field(...x)));const b=el('button','Calcular','bv42-btn');b.type='submit';f.append(b);f.addEventListener('input',()=>{if(!started){started=true;adminTrack('seo_tool_started',trackedRoute,{content:tool}).catch(()=>{});}});const result=el('div','', 'bv42-embed-result');result.hidden=true;root.append(f,result);return {f,result};}
function show(result,headline,detail,valid=true){if(valid&&!completed){completed=true;adminTrack('seo_tool_completed',trackedRoute,{content:tool}).catch(()=>{});}result.hidden=false;result.replaceChildren(el('b',headline),el('p',detail));}
if(tool==='parcelas'){
  full.href='/calculadoras/parcelas/?utm_source=embed&utm_medium=embed&utm_campaign=tool_embed';const {f,result}=base('Simulador de parcelas','Veja o peso mensal de uma compra antes de assumir o compromisso.',[['Valor da compra','total','Ex.: 1200'],['Número de parcelas','months','Ex.: 12']]);f.addEventListener('submit',e=>{e.preventDefault();const total=n(f.total.value),m=Math.max(1,Math.min(120,n(f.months.value)||1));show(result,`${money(total/m)} por mês`,`${m} parcelas. Simulação simples, sem juros adicionais.`);});
}else if(tool==='reserva'){
  full.href='/calculadoras/reserva-de-emergencia/?utm_source=embed&utm_medium=embed&utm_campaign=tool_embed';const {f,result}=base('Reserva de emergência','Transforme despesas essenciais em uma referência de proteção.',[['Despesas essenciais por mês','monthly','Ex.: 2200'],['Meses de proteção','months','Ex.: 6']]);f.addEventListener('submit',e=>{e.preventDefault();const monthly=n(f.monthly.value),m=Math.max(1,Math.min(24,n(f.months.value)||6));show(result,`Meta estimada: ${money(monthly*m)}`,`${m} meses de despesas essenciais informadas.`);});
}else{
  full.href='/calculadoras/comprometimento-de-renda/?utm_source=embed&utm_medium=embed&utm_campaign=tool_embed';const {f,result}=base('Comprometimento de renda','Veja quanto da renda já está destinada a contas e parcelas.',[['Renda mensal','income','Ex.: 4000'],['Contas + parcelas','fixed','Ex.: 1800']]);f.addEventListener('submit',e=>{e.preventDefault();const income=n(f.income.value),fixed=n(f.fixed.value);if(!income){show(result,'Informe uma renda maior que zero.','O cálculo precisa de uma base mensal.',false);return;}const pct=Math.min(999,(fixed/income)*100);show(result,`${pct.toFixed(1).replace('.',',')}% comprometido`,`${money(Math.max(0,income-fixed))} permanecem antes dos demais gastos informais/variáveis.`);});
}
