import {h} from '../util.js';
import * as store from '../store.js';
import {canUseFeature} from '../plans.js';
import {openPaywall} from './pro.js';
import {closeAllSheets} from '../ui.js';
import {go,ctx} from '../nav.js';

const labels={
  personal:{icon:'👤',name:'Pessoal',short:'Seu dinheiro',desc:'Seu espaço individual para salário, contas, cartões, metas e investimentos.'},
  couple:{icon:'💑',name:'Casal',short:'Dinheiro a dois',desc:'Um espaço compartilhado para organizar entradas e gastos do casal sem misturar o seu histórico pessoal.'},
  company:{icon:'🏢',name:'Empresa',short:'Dinheiro do negócio',desc:'Um ambiente separado para acompanhar entradas, despesas, caixa e planejamento da empresa.'}
};

export function currentFinanceContext(){
  const visual=document.body?.dataset?.financeProfile;
  if(['personal','couple','company'].includes(visual))return visual;
  return ctx.route==='familia'&&ctx.params.couple==='1'?'couple':store.activeFinanceProfile();
}

function selectFinanceProfile(key){
  closeAllSheets();
  if(key==='company'&&!store.isDemo()&&!canUseFeature('company')){openPaywall({feature:'company'});return;}
  if(key==='couple'&&!store.isDemo()&&!canUseFeature('couple')){openPaywall({feature:'couple'});return;}
  if(key==='couple'){
    store.switchFinanceProfile('personal');
    go('familia',{couple:'1'});
    return;
  }
  store.switchFinanceProfile(key);
  go('inicio');
}

/* Indicador passivo: a troca de ambiente fica centralizada em Você. */
export function financeProfileBar(){
  const active=currentFinanceContext();
  if(active==='personal')return null;
  const p=labels[active];
  return h('aside.finance-context.finance-context-'+active,
    h('span.finance-context-icon',{'aria-hidden':'true'},p.icon),
    h('span.finance-context-copy',h('small','Ambiente atual'),h('b',p.name),h('span',active==='couple'?'Compartilhado entre vocês · seus dados pessoais continuam separados.':'Dados da empresa separados das suas finanças pessoais.')),
    h('button.finance-context-change',{type:'button',onclick:()=>go('voce',active==='couple'?{finance:'couple'}:{})},'Alterar em Você'));
}

export function financeProfileSettings(){
  const active=currentFinanceContext();
  const cards=['personal','couple','company'].map(key=>{
    const p=labels[key],locked=!store.isDemo()&&((key==='company'&&!canUseFeature('company'))||(key==='couple'&&!canUseFeature('couple')));
    return h('button.finance-space-card.finance-space-'+key+(active===key?'.on':''),{
      type:'button','aria-pressed':active===key,onclick:()=>selectFinanceProfile(key)
    },
      h('span.finance-space-icon',{'aria-hidden':'true'},p.icon),
      h('span.finance-space-copy',h('span.finance-space-title',h('b',p.name),active===key?h('em','Ativo'):locked?h('em.locked',key==='company'?'Empreendedor':'Casal'):null),h('small',p.short),h('p',p.desc)),
      h('span.finance-space-arrow',{'aria-hidden':'true'},active===key?'✓':'›'));
  });
  return h('section.card.finance-space-settings',
    h('div.finance-space-heading',h('div',h('span.eyebrow','Ambientes financeiros'),h('h3','Escolha onde você quer organizar o dinheiro')),h('span.finance-space-current',`${labels[active].icon} ${labels[active].name}`)),
    h('p.muted.sm','Cada ambiente tem visual e finalidade próprios. Pessoal e Empresa mantêm dados separados; Casal abre o espaço compartilhado a dois.'),
    h('div.finance-space-grid',cards));
}
