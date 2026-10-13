import {h} from '../util.js';
import * as store from '../store.js';
import {openSheet,toast} from '../ui.js';
export const HOME_WIDGETS={month:['Resumo do mês',false],favorites:['Repetir um gasto',false],weekly:['Últimos 7 dias',false],agenda:['Próximas contas',true],cards:['Cartões',true],recent:['Últimas movimentações',true],insights:['Análises do mês',false],forecast:['Previsão de saldo',false]};
export function homeVisible(key,state=store.getState()){return ['month','favorites','weekly'].includes(key) ? (state.profile.homeLayoutVersion===2 && state.profile.homeWidgets?.[key]===true) : (state.profile.homeWidgets?.[key]??HOME_WIDGETS[key]?.[1]??true);}
export function openHomePreferences(){
 const inputs={};
 const content=h('div.form',h('p.muted','Escolha o que quer acompanhar no início. Você pode mudar a qualquer momento.'));
 for(const [key,[label]] of Object.entries(HOME_WIDGETS)){
  const input=h('input',{type:'checkbox',checked:homeVisible(key)});inputs[key]=input;
  content.append(h('label.home-pref',h('span',label),input));
 }
 const sheet=openSheet({title:'Personalizar início',content,footer:[h('button.btn.ghost',{type:'button',onclick:()=>{store.commit(s=>{s.profile.homeLayoutVersion=2;s.profile.homeWidgets=Object.fromEntries(Object.entries(HOME_WIDGETS).map(([k,v])=>[k,v[1]]));});sheet.close();toast('Layout padrão restaurado.');}},'Restaurar padrão'),h('button.btn.primary',{type:'button',onclick:()=>{store.commit(s=>{s.profile.homeLayoutVersion=2;s.profile.homeWidgets=Object.fromEntries(Object.entries(inputs).map(([k,input])=>[k,input.checked]));});sheet.close();toast('Início atualizado.');}},'Salvar')]});
}
