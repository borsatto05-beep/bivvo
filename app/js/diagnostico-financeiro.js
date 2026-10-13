import {signupUrl} from './acquisition.js';
import { adminTrack } from './admin-analytics.js';
const $ = s => document.querySelector(s);
const form = $('#diagnosticoForm');
const result = $('#diagnosticoResultado');
const num = v => { const n = Number(String(v || '').replace(/\./g,'').replace(',','.')); return Number.isFinite(n) ? Math.max(0,n) : 0; };
const brl = new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'});
function classify({income,essential,debt,days}) {
  const committed = income ? (essential + debt) / income : 1;
  const free = Math.max(0, income - essential - debt);
  const daily = days ? free / days : free;
  if (!income || essential + debt > income) return {stage:'Sobrevivência', title:'Primeiro, proteja o essencial.', text:'Se os compromissos passam da renda, não tente resolver tudo de uma vez. Separe moradia, alimentação, água, energia, transporte necessário e saúde. Depois organize o restante por urgência e negociação.', daily};
  if (committed >= .85) return {stage:'Recuperação', title:'Sua margem está muito apertada.', text:'Você já consegue enxergar uma pequena margem, mas ela precisa ser protegida. Evite assumir novas parcelas e escolha uma redução ou negociação que abra espaço no próximo mês.', daily};
  if (committed >= .65) return {stage:'Controle', title:'Você já tem espaço para decidir antes de gastar.', text:'Use a margem para evitar novos apertos, organizar vencimentos e começar uma reserva pequena sem comprometer o básico.', daily};
  return {stage:'Estabilidade', title:'Há margem para construir segurança.', text:'Mantenha o essencial protegido, defina uma reserva e direcione parte da sobra para metas. O objetivo agora é consistência, não perfeição.', daily};
}
form?.addEventListener('submit', e => {
  e.preventDefault();
  const v = Object.fromEntries(new FormData(form));
  const data = {income:num(v.income), essential:num(v.essential), debt:num(v.debt), days:Math.max(1,Math.floor(num(v.days)||30))};
  if(!form.checkValidity()||Object.values(v).some(x=>!String(x).trim()||!Number.isFinite(Number(String(x).replace(/\./g,'').replace(',','.')))||num(x)<0)||num(v.days)<1)return;
  const out = classify(data);
  result.hidden = false;
  result.innerHTML = `<span class="eyebrow">Seu momento: ${out.stage}</span><h2>${out.title}</h2><p>${out.text}</p><div class="answer"><strong>Referência até a próxima entrada:</strong> cerca de ${brl.format(out.daily)} por dia, considerando apenas os números que você informou.</div><p class="muted">Este diagnóstico é educativo e simplificado. Ele não envia os valores preenchidos para o Bivvo.</p><div class="actions"><a class="btn" href="/?signup=1&utm_source=seo&utm_medium=organic&utm_campaign=diagnostico_financeiro">Acompanhar meu dinheiro no Bivvo</a><button class="btn secondary" type="button" id="shareDiagnosis">Compartilhar ferramenta</button></div>`;
  window.bivvoTool?.complete('diagnosis',form);
  result.querySelector('a').href=signupUrl(location.href);
  $('#shareDiagnosis')?.addEventListener('click', async () => {
    const share = {title:'Diagnóstico financeiro gratuito — Bivvo', text:'Faça um diagnóstico financeiro simples e descubra qual deve ser seu próximo passo.', url:location.origin+location.pathname};
    try { if(navigator.share) await navigator.share(share); else { await navigator.clipboard.writeText(location.href); $('#shareDiagnosis').textContent='Link copiado'; } } catch {}
  });
  result.scrollIntoView({behavior:'smooth',block:'start'});
});
