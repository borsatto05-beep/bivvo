import assert from 'node:assert/strict';
const RealDate=Date; const FIX=new RealDate(2026,9,8,12).getTime();
globalThis.Date=class extends RealDate{constructor(...a){super(...(a.length?a:[FIX]));} static now(){return FIX;}};
globalThis.window=globalThis.window||{addEventListener(){}};
globalThis.sessionStorage={getItem(){return null;},setItem(){},removeItem(){}};
globalThis.localStorage=globalThis.sessionStorage;
const store=await import('../js/store.js');
const F=await import('../js/finance.js');
const near=(a,b)=>Math.abs(a-b)<0.005;

const s=store.emptyState({onboarded:true,checkins:[],seenAchievements:[],invitesSent:0});
s.budget_limits={Mercado:500,Compras:300};
s.cards.push({id:'c1',name:'Nubank',limit:2000,close:20,due:28,tint:'plum'});
s.transactions.push({id:'pix',date:'2026-10-02',desc:'Mercado Pix',cat:'Mercado',type:'expense',value:100,status:'Pago',method:'PIX'});
const [card]=store.addCardPurchase(s,{desc:'Mercado cartão',cat:'Mercado',total:120,parts:1,card:'Nubank',date:'2026-10-08'});
store.load(s,{demo:true});
let c=F.budgetConsumption('2026-10');
assert.ok(near(c.total,220),'compra efetivada no cartão precisa consumir orçamento antes da fatura ser paga');
assert.ok(near(c.card,120),'consumo no cartão deve ser separado');
assert.ok(near(c.other,100),'outros meios devem permanecer separados');
let mercado=F.budgetRows('2026-10').find(x=>x.cat==='Mercado');
assert.ok(near(mercado.spent,220)&&near(mercado.left,280),'categoria deve incluir compra no cartão imediatamente');

store.commit(st=>{
 const t=st.transactions.find(x=>x.id===card.id);
 t.cardPaymentManaged=true;t.cardPaidAmount=120;t.status='Pago';t.paidAt='2026-10-08';
 st.transactions.push({id:'pay',date:'2026-10-08',desc:'Pagamento fatura',cat:'Cartão de crédito',type:'expense',value:120,status:'Pago',method:'Pagamento de cartão',transactionRole:'card_payment',card:'Nubank',invoice:'2026-10'});
});
c=F.budgetConsumption('2026-10');
assert.ok(near(c.total,220),'pagamento da fatura não pode consumir o orçamento novamente');

store.commit(st=>{store.addCardPurchase(st,{desc:'Tênis',cat:'Compras',total:300,parts:3,card:'Nubank',date:'2026-10-08'});});
assert.ok(near(F.budgetRows('2026-10').find(x=>x.cat==='Compras').spent,100),'parcelada deve consumir apenas a parcela do mês atual');
assert.ok(near(F.budgetRows('2026-11').find(x=>x.cat==='Compras').spent,100),'parcela futura deve consumir o orçamento do mês correspondente');
console.log('budget card consumption 11.68 ok');
