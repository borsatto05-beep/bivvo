import assert from 'node:assert/strict';
const RealDate=Date; const FIX=new RealDate(2026,9,8,12).getTime();
globalThis.Date=class extends RealDate{constructor(...a){super(...(a.length?a:[FIX]));} static now(){return FIX;}};
globalThis.window=globalThis.window||{addEventListener(){}};
globalThis.sessionStorage={getItem(){return null;},setItem(){},removeItem(){}};
globalThis.localStorage=globalThis.sessionStorage;
const store=await import('../js/store.js');
const F=await import('../js/finance.js');
const near=(a,b)=>Math.abs(a-b)<0.005;

// Simula um payload salvo antes da 11.69: uma compra 1x com nomes de campos
// legados e um parcelamento que existia apenas no registro installments.
const payload={
  schema:10,
  profile:{onboarded:true,checkins:[],seenAchievements:[],invitesSent:0},
  cards:[{id:'c1',name:'Nubank',limit:3000,close:20,due:28}],
  budget_limits:{Mercado:600,Compras:500},
  transactions:[
    {id:'old1',data:'2026-10-03',description:'Mercado antigo',categoria:'Mercado',type:'expense',valor:150,status:'Pendente',paymentMethod:'Cartão de crédito',cardName:'Nubank'}
  ],
  installments:[
    {id:'inst-old',name:'Tênis antigo',card:'Nubank',cat:'Compras',total:300,parts:3,date:'2026-10-04'}
  ]
};
store.load(payload,{demo:true});
const s=store.getState();
assert.equal(s.schema,11,'payload antigo deve migrar para schema 11');
const old=s.transactions.find(t=>t.id==='old1');
assert.equal(old.method,'Crédito','forma de pagamento antiga deve virar Crédito');
assert.equal(old.cat,'Mercado');
assert.ok(near(old.value,150));
assert.equal(old.date,'2026-10-03');
assert.equal(old.card,'Nubank');

const oct=F.budgetConsumption('2026-10');
assert.ok(near(oct.card,250),'compra antiga 1x + parcela antiga do mês devem consumir orçamento');
assert.ok(near(F.budgetRows('2026-10').find(x=>x.cat==='Mercado').spent,150));
assert.ok(near(F.budgetRows('2026-10').find(x=>x.cat==='Compras').spent,100));
assert.ok(near(F.budgetRows('2026-11').find(x=>x.cat==='Compras').spent,100),'parcelas históricas futuras também devem ser reconstruídas');
console.log('budget history migration 11.69 ok');
