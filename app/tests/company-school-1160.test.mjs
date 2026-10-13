import assert from 'node:assert/strict';
import fs from 'node:fs';
import {businessGuide} from '../js/company-metrics.js';

const guide=businessGuide('workingCapital');
assert(guide,'capital de giro precisa ter aula');
for(const field of ['title','what','importance','formula','action']) assert(String(guide[field]||'').trim(),`capital de giro sem ${field}`);

const edu=fs.readFileSync('js/views/company-education.js','utf8');
const home=fs.readFileSync('js/views/company-home.js','utf8');
const plans=fs.readFileSync('js/views/plans.js','utf8');
const main=fs.readFileSync('js/main.js','utf8');
const css=fs.readFileSync('company-education.css','utf8');
const store=fs.readFileSync('js/store.js','utf8');

for(const text of ['openBusinessSimulator','Simulador de preço ideal','Simulador de lucro por produto','Simulador de ponto de equilíbrio','Simulador de desconto','Simulador de meta de faturamento','companyPageTutor','FIELD_HELP']) assert(edu.includes(text),`camada educativa 11.60 sem ${text}`);
for(const text of ['Simuladores','LABORATÓRIO DO EMPREENDEDOR','Cadastro guiado · o Bivvo explica cada etapa','Identificação','Custo real','Venda e taxas','Resultado automático']) assert(plans.includes(text),`gestão 11.60 sem ${text}`);
for(const text of ['BIVVO MENTOR','O que seus números estão tentando te dizer','Capital de giro apertado']) assert(home.includes(text),`home empresarial sem leitura inteligente: ${text}`);
assert(main.includes('companyPageTutor(name)'),'professor contextual precisa aparecer nas telas da Empresa');
assert(store.includes("category: String(x.category || 'Geral')"),'produto precisa persistir categoria');
for(const cls of ['.company-page-tutor','.company-product-wizard','.company-wizard-stepper','.company-simulator-grid','.company-mentor-card','.company-kpi-signal']) assert(css.includes(cls),`CSS 11.60 ausente: ${cls}`);
console.log('Bivvo 11.60: ambiente Empresa inteiro funciona como gestão + escola prática para empreendedor iniciante.');
