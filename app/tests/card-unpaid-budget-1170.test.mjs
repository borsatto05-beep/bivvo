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
  cards:[{id:'c1',name:'Nubank',limit:3000,close:20,due:28}],
  budget_limits:{Mercado:500},
  transactions:[
    {id:'cc1',date:'2026-10-05',desc:'Mercado no crédito',cat:'Mercado',type:'expense',value:180,status:'Pendente',method:'Crédito',card:'Nubank',invoice:'2026-10',cardPaymentManaged:true,cardPaidAmount:0}
  ]
},{demo:true});
const inv=F.cardStatus(store.getState().cards[0]).invoices.find(x=>x.ym==='2026-10');
assert.ok(inv && near(inv.unpaid,180),'a fatura deve continuar em aberto/não paga');
const c=F.budgetConsumption('2026-10');
assert.ok(near(c.card,180),'compra no cartão deve consumir o orçamento mesmo sem pagar a fatura');
assert.ok(near(c.total,180),'o total consumido deve incluir a compra não paga');
assert.ok(near(F.budgetRows('2026-10').find(x=>x.cat==='Mercado').spent,180),'a categoria deve mostrar o consumo da compra no crédito não paga');
console.log('card unpaid budget 11.70 ok');
