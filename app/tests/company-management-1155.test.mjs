import assert from 'node:assert/strict';
import {productMetrics,statement,productPortfolio} from '../js/company-metrics.js';

const p=productMetrics({purchaseCost:50,freight:5,packaging:2,salePrice:100,cardFeePct:4,taxPct:6,commissionPct:5,targetMarginPct:20,soldQty:10},10000);
assert.equal(p.baseDirect,57,'custo direto deve somar compra, frete e embalagem');
assert.equal(p.percentageCosts,15,'taxas percentuais da venda');
assert.equal(p.variableCost,72,'custo variável real do exemplo');
assert.equal(p.contribution,28,'margem de contribuição em reais');
assert(Math.abs(p.contributionMargin-.28)<1e-9,'margem de contribuição de 28%');
assert(Math.abs(p.markup-(100/57-1))<1e-9,'markup deve ser sobre custo direto');
assert(Math.abs(p.breakEvenUnits-(10000/28))<1e-9,'ponto de equilíbrio em unidades');

const markup=productMetrics({purchaseCost:50,salePrice:100},0);
assert.equal(markup.markup,1,'R$50 para R$100 = markup de 100%');
assert.equal(markup.grossMargin,.5,'R$50 para R$100 = margem bruta de 50%');

const rows=[
 {type:'income',value:100,date:'2026-10-01',cat:'Vendas de produtos',status:'Pago'},
 {type:'expense',value:72,date:'2026-10-01',cat:'Mercadorias / estoque',status:'Pago'}
];
const dre=statement(rows,{periodMonths:1,monthlyFixedFallback:10000});
assert.equal(dre.revenue,100);
assert.equal(dre.variableCosts,72);
assert.equal(dre.contribution,28);
assert(Math.abs(dre.contributionMargin-.28)<1e-9);
assert(Math.abs(dre.breakEven-(10000/.28))<.01,'ponto de equilíbrio em faturamento');

const port=productPortfolio([
 {id:'a',name:'A',purchaseCost:27,salePrice:30,soldQty:100},
 {id:'b',name:'B',purchaseCost:7,salePrice:15,soldQty:100}
],0);
assert(port.rows.length===2&&port.revenue===4500,'portfólio soma faturamento por produto');
assert(port.rows[1].metrics.profitTotal>port.rows[0].metrics.profitTotal,'produto com menor faturamento unitário pode gerar lucro maior por volume/custo');
console.log('Bivvo 11.55: gestão empresarial calcula custo real, margem, markup, lucro e ponto de equilíbrio.');

import fs from 'node:fs';
const companyUi=fs.readFileSync('js/views/plans.js','utf8');
for(const label of ['DRE GERENCIAL SIMPLIFICADA','Faturamento','Custos variáveis','Margem de contribuição','EBITDA aprox.','Lucro gerencial','Ponto de equilíbrio','Lucro por produto / serviço']) assert(companyUi.includes(label),`indicador empresarial ausente: ${label}`);
assert(companyUi.includes('Produtos, serviços e precificação'));
