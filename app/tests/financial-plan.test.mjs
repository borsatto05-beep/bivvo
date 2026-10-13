import assert from 'node:assert/strict';
import {detailedFinancialPlan} from '../js/financial-plan.js';
const base={spendable:{balance:100,free:-400,perDay:0,until:'2026-11-05',bills:300,invoices:200,saveLeft:0},month:{incomePaid:1000,income:1200,spend:800,saved:0,result:200,topCategories:[{category:'Mercado',value:600},{category:'Lazer',value:200}]},forecast:{day30:-400,riskDate:'2026-10-20',riskBalance:-400},protection:{reserveGap:300,reserveCurrent:100,reserveTargetReference:400},direction:{stageLabel:'Sobrevivência',debtsCount:1,debtsTotal:200,overdueDebts:1},quality:{transactionCount:5,hasBalanceBase:true}};
const before=JSON.stringify(base),negative=detailedFinancialPlan(base);
assert.match(negative,/Planejamento passo a passo/);assert.match(negative,/R\$\s*40,00/);assert.match(negative,/R\$\s*360,00/);assert.match(negative,/não dinheiro recuperado/);assert.match(negative,/Não é possível escolher a dívida mais cara/);assert.equal(JSON.stringify(base),before);
const positive=detailedFinancialPlan({...base,spendable:{...base.spendable,free:200,perDay:10},forecast:{day30:200},direction:{debtsCount:0},quality:{transactionCount:0,hasBalanceBase:false}});
assert.match(positive,/R\$\s*50,00/);assert.match(positive,/R\$\s*150,00/);assert.match(positive,/saldo inicial não foi informado/);assert.match(positive,/Ainda não há lançamentos suficientes/);
console.log('Plano interno: déficit, cenário de cortes flexíveis, reserva, falta de dados e ausência de mutação passaram.');
