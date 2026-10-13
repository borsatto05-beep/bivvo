import assert from 'node:assert/strict';
globalThis.window = globalThis.window || { addEventListener() {} };
globalThis.localStorage = globalThis.localStorage || {getItem(){return null},setItem(){},removeItem(){}};
globalThis.sessionStorage = globalThis.sessionStorage || globalThis.localStorage;
const { localAnswer, suggestedQuestions } = await import('../js/assistant.js');
const base={
  spendable:{free:1200,balance:3000,perDay:100,until:'2026-10-20',bills:500,invoices:300,saveLeft:0,tone:'ok'},
  month:{income:4000,incomePaid:4000,spend:2500,saved:500,planned:0,result:1000,savingsRate:.125,topCategories:[]},
  previousMonth:{spend:2700,income:4000,saved:300,result:1000},
  forecast:{day7:2200,day30:1800,riskDate:null,riskBalance:null,estimated:false},
  cards:[],commitments:{installments3Months:0,subscriptionsMonthly:0,subscriptionsAnnual:0},
  wealth:{total:10000,investments:3000,goals:7000,reserve:6000,investmentCount:2},
  protection:{avgMonthlySpend:2000,reserveCurrent:6000,reserveTargetReference:6000,reserveGap:0,reserveMonths:3,userReserveGoal:6000},
  direction:{stage:'GROWTH',stageLabel:'CRESCIMENTO',stageReason:'Caixa estável.',priorityId:'steady',priorityTitle:'Mantenha o plano',priorityDetail:'Sem risco forte.',recoveryProgress:100,debtsCount:0,debtsTotal:0,overdueDebts:0},
  preferences:{savingPercent:10},quality:{transactions:20,cards:0,hasBalanceBase:true}
};
let a=localAnswer('Tenho dinheiro sobrando. Como começo a investir?',base);
assert.match(a.text,/reserva|objetivo|prazo|liquidez|risco/i);
assert.ok(!/prioridade agora/i.test(a.text));
const qGrowth=suggestedQuestions(base).join(' ');
assert.match(qGrowth,/investir/i);
const critical=structuredClone(base);
critical.spendable.free=-400; critical.direction.stage='CRITICAL'; critical.direction.stageLabel='SOBREVIVÊNCIA'; critical.direction.debtsCount=2; critical.direction.debtsTotal=900;
a=localAnswer('Quero investir. Onde coloco meu dinheiro?',critical);
assert.match(a.text,/não colocaria investimento como prioridade agora|nao colocaria investimento como prioridade agora/i);
assert.match(suggestedQuestions(critical).join(' '),/durar até receber|sair do vermelho/i);
a=localAnswer('Vale quitar dívida ou investir?',critical);
assert.match(a.text,/taxas de juros.*não estão cadastradas|taxas de juros.*nao estao cadastradas/i);
a=localAnswer('Quanto devo guardar?',base);
assert.match(a.text,/R\$|livres|reserva/i);
console.log('8 testes Bivvo IA 11.42.6: OK');
const fs = await import('node:fs');
const fn = fs.readFileSync(new URL('../netlify/functions/assistant.js', import.meta.url),'utf8');
assert.match(fn,/systemInstruction/);
assert.match(fn,/não adivinhe|nao adivinhe/i);
assert.match(fn,/Banco Central, CVM, Receita Federal/);
assert.match(fn,/Nunca sugira usar reserva de emergência ou pegar crédito para investir em ativos de risco/);

a=localAnswer('Quanto posso investir sem apertar meu mês?',base);
assert.match(a.text,/R\$|margem|investir tudo/i);
const fn2 = fs.readFileSync(new URL('../netlify/functions/assistant.js', import.meta.url),'utf8');
assert.match(fn2,/needsLiveOfficialCheck/);
assert.match(fn2,/eu não vou chutar|eu nao vou chutar/i);

console.log('6 testes de contrato de verdade da IA: OK');
