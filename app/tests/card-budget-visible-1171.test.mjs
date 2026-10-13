import assert from 'node:assert/strict';
const RealDate=Date; const FIX=new RealDate(2026,9,8,12).getTime();
globalThis.Date=class extends RealDate{constructor(...a){super(...(a.length?a:[FIX]));} static now(){return FIX;}};
globalThis.window=globalThis.window||{addEventListener(){}};
globalThis.sessionStorage={getItem(){return null;},setItem(){},removeItem(){}};
globalThis.localStorage=globalThis.sessionStorage;
const store=await import('../js/store.js');
const F=await import('../js/finance.js');
const near=(a,b)=>Math.abs(a-b)<0.005;
store.load({
  schema:11,
  profile:{onboarded:true,checkins:[],seenAchievements:[],invitesSent:0},
  cards:[{id:'c1',name:'Nubank',limit:3000,close:10,due:20}],
  budget_limits:{Mercado:500},
  transactions:[
    {id:'gift1',date:'2026-10-13',desc:'Presente Aniversário Keller (1/4)',cat:'Presentes e doações',type:'expense',value:115.84,status:'Parcelado',method:'Crédito',card:'Nubank',invoice:'2026-11',installment:'1/4',installmentId:'i1',purchaseTotal:463.34,installmentTotal:4,note:'Compra parcelada'}
  ]
},{demo:true});
const c=F.budgetConsumption('2026-10');
assert.ok(near(c.card,115.84),'compra de cartão já registrada deve consumir o orçamento mesmo com fatura aberta');
assert.ok(near(c.total,115.84),'total consumido deve incluir a parcela');
const row=F.budgetRows('2026-10').find(x=>x.cat==='Presentes e doações');
assert.ok(row,'categoria sem limite deve aparecer no orçamento');
assert.equal(row.unbudgeted,true,'categoria deve ser marcada como sem limite');
assert.ok(near(row.spent,115.84),'linha deve exibir o valor consumido');
assert.equal(row.limit,0,'gasto sem limite não pode aumentar o orçamento planejado');
console.log('card budget visible 11.71 ok');
