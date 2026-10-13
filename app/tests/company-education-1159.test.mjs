import assert from 'node:assert/strict';
import fs from 'node:fs';
import {businessGuide} from '../js/company-metrics.js';

const keys=['revenue','variableCosts','contribution','fixedOpex','ebitda','netProfit','cash','receivable','payable','cashProjection','breakEven','ticket','costMix','aging','revenueSource','costStructure','target','health','taxes','pricing','productProfit','stock','proLabore','pfPj','budget','recurring','dre'];
for(const key of keys){
  const g=businessGuide(key);
  assert(g,`guia empresarial ausente: ${key}`);
  for(const field of ['title','what','importance','formula','action']) assert(String(g[field]||'').trim(),`${key} precisa de ${field}`);
}

const edu=fs.readFileSync('js/views/company-education.js','utf8');
const home=fs.readFileSync('js/views/company-home.js','utf8');
const plans=fs.readFileSync('js/views/plans.js','utf8');
const css=fs.readFileSync('company-education.css','utf8');

for(const text of ['BIVVO ESCOLA DO EMPREENDEDOR','Por que isso importa','Como calcular','Exemplo com seus dados','Como saber se está bom?','Jeito certo de fazer','Erros comuns','O que fazer na prática']) assert(edu.includes(text),`modal didático precisa de: ${text}`);
for(const text of ['Primeiro: descubra se vender está gerando resultado','Depois: cuide do dinheiro que realmente entra e sai','Agora: entenda por que os números estão mudando','Por fim: transforme leitura em ação','ROTEIRO DA PRIMEIRA SEMANA']) assert(home.includes(text),`cockpit didático precisa de: ${text}`);
for(const text of ['Comece aqui','O Bivvo vai te ensinar a pensar como dono','Rotina simples do dono','O que é importante primeiro — e o que pode esperar','Aprenda primeiro','Depois melhore','Aprofunde quando fizer sentido']) assert(plans.includes(text),`gestão didática precisa de: ${text}`);
for(const cls of ['.company-learning-hub','.company-lesson-modal','.company-guide-lessons','.company-first-week-grid','.company-edu-stat']) assert(css.includes(cls),`CSS didático ausente: ${cls}`);
assert(home.includes("openBusinessLesson('pricing'"),'onboarding sem dados deve ensinar precificação');
assert(home.includes("openBusinessLesson('pfPj'"),'onboarding sem dados deve ensinar separação PF/PJ');
console.log('Bivvo 11.59: Empresa funciona como escola prática de gestão para empreendedor iniciante.');
