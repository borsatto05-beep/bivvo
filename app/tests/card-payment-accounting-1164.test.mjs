import assert from 'node:assert/strict';
import fs from 'node:fs';
const RealDate=Date; let FIX=new RealDate(2026,9,8,12).getTime();
globalThis.Date=class extends RealDate{constructor(...a){super(...(a.length?a:[FIX]));} static now(){return FIX;}};
globalThis.window=globalThis.window||{addEventListener(){}};
globalThis.sessionStorage={getItem(){return null;},setItem(){},removeItem(){}};
globalThis.localStorage=globalThis.sessionStorage;
const store=await import('../js/store.js');
const F=await import('../js/finance.js');
const near=(a,b)=>Math.abs(a-b)<0.005;

const s=store.emptyState({onboarded:true,checkins:[],seenAchievements:[],invitesSent:0});
s.transactions.push({id:'income',date:'2026-10-01',desc:'Saldo',cat:'Salário',type:'income',value:1000,status:'Pago',method:'PIX'});
s.cards.push({id:'card1',name:'Nubank',limit:1000,close:20,due:28,tint:'plum'});
const [purchase]=store.addCardPurchase(s,{desc:'Compra',cat:'Compras',total:400,parts:1,card:'Nubank',date:'2026-10-08'});
store.load(s,{demo:true});
assert.ok(near(F.balance(),1000),'compra no crédito não deve sair do saldo antes do pagamento');

store.commit(st=>{
 const t=st.transactions.find(x=>x.id===purchase.id);
 t.cardPaymentManaged=true; t.cardOriginalStatus=t.status; t.cardPaidAmount=150; t.cardPaymentIds=['pay1'];
 st.transactions.push({id:'pay1',date:'2026-10-08',paidAt:'2026-10-08',desc:'Pagamento antecipado · Fatura Nubank outubro',cat:'Cartão de crédito',type:'expense',value:150,status:'Pago',method:'Pagamento de cartão',transactionRole:'card_payment',cardId:'card1',card:'Nubank',invoice:'2026-10',cardPaymentEarly:true,allocations:[{txId:t.id,value:150}]});
});
let inv=F.cardStatus(store.getState().cards[0]).invoices.find(i=>i.ym==='2026-10');
assert.ok(near(F.balance(),850),'pagamento parcial deve sair do saldo');
assert.ok(near(inv.paid,150)&&near(inv.unpaid,250),'pagamento parcial deve dar baixa na fatura');
assert.ok(near(F.cardStatus(store.getState().cards[0]).used,250),'pagamento parcial deve liberar o mesmo valor do limite');
assert.equal(inv.payments.length,1,'pagamento deve aparecer no histórico da fatura');
assert.ok(near(F.monthSummary('2026-10').spend,400),'pagamento da fatura não pode duplicar gasto do mês');

store.commit(st=>{
 const t=st.transactions.find(x=>x.id===purchase.id);
 t.cardPaidAmount=400; t.cardPaymentIds.push('pay2'); t.status='Pago'; t.paidAt='2026-10-08'; t.settledByCardPaymentId='pay2';
 st.transactions.push({id:'pay2',date:'2026-10-08',paidAt:'2026-10-08',desc:'Pagamento · Fatura Nubank outubro',cat:'Cartão de crédito',type:'expense',value:250,status:'Pago',method:'Pagamento de cartão',transactionRole:'card_payment',cardId:'card1',card:'Nubank',invoice:'2026-10',allocations:[{txId:t.id,value:250}]});
});
inv=F.cardStatus(store.getState().cards[0]).invoices.find(i=>i.ym==='2026-10');
assert.ok(near(F.balance(),600),'quitação deve descontar exatamente o total pago do saldo');
assert.ok(near(inv.unpaid,0)&&inv.state==='paga','fatura deve ficar quitada');
assert.ok(near(F.cardStatus(store.getState().cards[0]).used,0),'quitação deve liberar todo o limite da fatura');
assert.equal(inv.payments.length,2,'histórico deve manter pagamentos parcial e final');
assert.ok(near(F.monthSummary('2026-10').spend,400),'quitação não deve contar compras e pagamento em duplicidade');

const forms=fs.readFileSync('js/views/forms.js','utf8');
const cards=fs.readFileSync('js/views/cards.js','utf8');
assert.match(forms,/transactionRole:\s*'card_payment'/,'pagamento precisa ser persistido como lançamento próprio');
assert.match(forms,/cardPaidAmount/,'pagamento precisa dar baixa nas compras da fatura');
assert.match(forms,/deleteCardPayment/,'pagamento deve poder ser estornado com reversão segura');
assert.match(cards,/Pagamentos desta fatura/,'fatura deve exibir histórico dos pagamentos');
console.log('card payment accounting 11.64 ok');
