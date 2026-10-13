/* Bivvo 11.50 — seletor privado de planos para a conta interna de homologação. */
import * as cloud from './cloud.js';
import {h} from './util.js';
import {toast} from './ui.js';
import {PLAN_NAMES, refreshPlan} from './plans.js';

const ORDER=['real','free','plus','capital','pro','couple','entrepreneur','family'];
const LABELS={real:'Usar plano real da conta',...PLAN_NAMES};
async function authHeaders(){
  const c=await cloud.sb();
  const {data}=await c.auth.getSession();
  const token=data?.session?.access_token;
  if(!token) throw new Error('Entre na sua conta para usar o modo de teste.');
  return {'Content-Type':'application/json',Authorization:'Bearer '+token};
}
export async function testerPlanStatus(){
  const r=await fetch('/api/test-plan',{headers:await authHeaders(),cache:'no-store'});
  const j=await r.json().catch(()=>({}));
  if(r.status===403)return {allowed:false};
  if(!r.ok)throw new Error(j.error||'Não foi possível verificar o modo de teste.');
  return j;
}
export async function setTesterPlan(plan){
  const r=await fetch('/api/test-plan',{method:'POST',headers:await authHeaders(),body:JSON.stringify({plan})});
  const j=await r.json().catch(()=>({}));
  if(!r.ok)throw new Error(j.detail?`${j.error||'Não foi possível trocar o plano de teste.'} (${j.detail})`:(j.error||'Não foi possível trocar o plano de teste.'));
  return j;
}

export async function mountTesterPlanSwitch(host){
  if(!host||!cloud.currentUser())return;
  let status;
  try{status=await testerPlanStatus();}catch{return;}
  if(!status?.allowed)return;

  const select=h('select.input',{'aria-label':'Plano usado no modo de teste'},ORDER.map(key=>h('option',{value:key,selected:key===status.testPlan},LABELS[key]||key)));
  const apply=h('button.btn.primary',{type:'button',onclick:async()=>{
    const next=select.value;
    apply.disabled=true;const old=apply.textContent;apply.textContent='Aplicando…';
    try{
      const result=await setTesterPlan(next);
      await refreshPlan({timeout:6000});
      toast(result.message||'Plano de teste alterado.');
      setTimeout(()=>location.reload(),250);
    }catch(e){apply.disabled=false;apply.textContent=old;toast(e.message||'Não foi possível trocar o plano.',{tone:'warn'});}
  }},'Aplicar plano para teste');

  host.replaceChildren(h('section.card.tester-plan-card',
    h('div.tester-plan-head',h('span.tester-plan-icon',{'aria-hidden':'true'},'🧪'),h('div',h('small','MODO DE HOMOLOGAÇÃO'),h('h3','Trocar plano sem cobrança'),h('p.muted.sm','Disponível somente para esta conta de teste. A troca cria uma permissão interna e não abre o Mercado Pago.'))),
    h('div.tester-plan-controls',select,apply),
    h('p.hint','Simule Grátis, Plus, Capital, Pro, Casal, Empreendedor ou Família para conferir limites, menus, IA e permissões. Use “plano real” para encerrar a simulação.')
  ));
}
