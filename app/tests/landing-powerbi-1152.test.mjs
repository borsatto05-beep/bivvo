import assert from 'node:assert/strict';
import fs from 'node:fs';
const html=fs.readFileSync('index.html','utf8');
const css=fs.readFileSync('app.css','utf8');
const company=fs.readFileSync('js/views/company-home.js','utf8');
const landingJs=fs.readFileSync('js/landing-showcase.js','utf8');
for(const f of ['app-pessoal.png','app-casal.png','app-empresa.png','app-cartoes.png','app-ia.png']){
  const p=`screenshots/${f}`; assert(fs.existsSync(p),`preview ${f}`); assert(fs.statSync(p).size>10000,`preview ${f} válido`);
}
for(const id of ['landingTour','landingCompany','landingFunctions','landingPricing']) assert(html.includes(`id="${id}"`),id);
for(const label of ['Pessoal','Casal','Empresa','Cartões','IA']) assert(html.includes(`data-showcase-tab="${label.toLowerCase()==='cartões'?'cards':label.toLowerCase()}"`)||html.includes(`>${label}<`),`tour ${label}`);
assert(html.includes('Bivvo Empresa'));
assert(html.includes('Receita x despesas'));
assert(html.includes('Projeção do caixa'));
assert(landingJs.includes('data-bi-period'));
assert(landingJs.includes('IntersectionObserver'));
assert(css.includes('.landing-company-demo'));
assert(css.includes('@media(prefers-reduced-motion:reduce)'));
for(const text of ['Aging de recebíveis','Mapa de custos','Saúde operacional','Estrutura de custos','Receita por origem','Projeção de caixa']) assert(company.includes(text),text);
assert(company.includes('[1,3,6,12]'));
assert(!/<[^>]+style=/.test(html),'landing não deve depender de style inline sob CSP');
console.log('Bivvo 11.52: landing interativa e cockpit Empresa BI com previews e filtros presentes.');
