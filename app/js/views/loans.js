import {addCapitalDemoRecords} from '../demo.js';
import {installmentPrincipal,installmentTerms,installmentSchedule,payInstallment} from '../loan-installments.js';
import { h, money, today, uid, round2, parseMoney, addMonthsDate, addMonthsYM, diffDays, ymOf, monthShort, monthLabel, shortDate } from '../util.js';
import * as store from '../store.js';
import * as F from '../finance.js';
import { openSheet, field, toast, confirmSheet, closeAllSheets } from '../ui.js';
import { donut, bars, progressBar } from '../charts.js';
import { ctx, rerender } from '../nav.js';
import {loanShareText,loanShareSummary} from '../loan-share.js';
import { parcelExistingLoan, paymentBeforeInstallmentAgreement, ensureLoanLedger, loanCapacity, recalculateLoan, relatedPaymentTransactions, findAutoRenewCycle } from '../loan-ledger.js';

const S=()=>store.getState();
const baseInterest=l=>l.interestMode==='fixed'?Number(l.interestFixed||0):round2(Number(l.principal||0)*Number(l.interestRate||0)/100);
const interestDue=l=>Math.max(0,round2((l.interestDue != null ? l.interestDue : baseInterest(l))));
const totalDue=l=>round2(Number(l.principal||0)+interestDue(l));
const isPaid=l=>l.status==='paid'||totalDue(l)<=0.004;
const overdueDays=l=>!isPaid(l)&&l.due&&l.due<today()?Math.max(1,diffDays(l.due,today())):0;
const loanStatus=l=>isPaid(l)?{key:'paid',label:'Quitado'}:overdueDays(l)?{key:'overdue',label:`Vencido há ${overdueDays(l)} dia${overdueDays(l)>1?'s':''}`}:(l.due===today()?{key:'today',label:'Vence hoje'}:{key:'open',label:'Em dia'});
const paidFor=(s,id)=>(s.loanPayments||[]).filter(p=>p.loanId===id);
const principalRecovered=(s,l)=>paidFor(s,l.id).reduce((a,p)=>a+Number(p.principal||0),0);
const interestReceived=(s,l)=>paidFor(s,l.id).reduce((a,p)=>a+Number(p.interest||0),0);
const paymentLabel=p=>Number(p.principal||0)<=0.004&&Number(p.interest||0)>0.004?'Pagamento só de juros':'Pagamento recebido';

const nextLoanDue=(l,payments=[])=>{
  if(isPaid(l))return '';
  if(l.installmentPlan){
    const row=installmentSchedule(l,payments).find(x=>!x.paid);
    return (row&&row.due)||l.due||'';
  }
  return l.due||'';
};
const dueTodayItems=(s)=>{
  const date=today(),items=[];
  (s.loans||[]).filter(l=>!isPaid(l)).forEach(l=>{
    if(l.installmentPlan){
      const rows=installmentSchedule(l,s.loanPayments||[]);
      rows.filter(x=>!x.paid&&x.due===date).forEach(x=>items.push({loan:l,due:x.due,value:Number(x.amount||0),label:`Parcela ${x.number}/${rows.length}`}));
    }else if(l.due===date){
      items.push({loan:l,due:l.due,value:totalDue(l),label:'Vencimento do contrato'});
    }
  });
  return items.sort((a,b)=>b.value-a.value||String(a.loan.person).localeCompare(String(b.loan.person),'pt-BR'));
};

function capitalBalances(s){
  const general=F.computeFresh(()=>F.balance(s)),capital=F.computeFresh(()=>F.capitalBalance(s));
  return h('section.capital-balances',{'aria-label':'Saldos separados do Bivvo Capital'},
    h('section.card.capital-balance-card.general-balance',h('small','SALDO GERAL'),h('strong',money(general)),h('p','Dinheiro disponível fora da carteira de empréstimos.'),h('button.btn.sm',{type:'button',onclick:()=>openCapitalTransfer('in')},'Enviar para o capital')),
    h('section.card.capital-balance-card.received-capital',h('small','SALDO DE CAPITAL'),h('strong',money(capital)),h('p','Capital disponível para novos empréstimos.'),h('div.btn-row',h('button.btn.sm.primary',{type:'button',onclick:()=>openCapitalTransfer('out')},'Retirar para o saldo'),h('button.btn.sm',{type:'button',onclick:openCapitalReceipts},'Movimentações'))),
    h('p.capital-balances-note','Transferências entre saldo e capital não contam como renda nem despesa. Um novo empréstimo reduz somente o capital.'));
}

function openCapitalTransfer(direction='in'){
  const toCapital=direction==='in',s=S(),available=toCapital?F.computeFresh(()=>F.balance(s)):F.computeFresh(()=>F.capitalBalance(s));
  const amount=h('input.input',{inputmode:'decimal',placeholder:'0,00'}),msg=h('p.form-msg');let busy=false;
  const title=toCapital?'Enviar saldo para o capital':'Retirar capital para o saldo';
  const sh=openSheet({title,subtitle:`Disponível: ${money(Math.max(0,available))}`,content:h('div.form',field('Valor',amount),h('p.hint',toCapital?'Sai do saldo geral e entra no capital. Não é despesa.':'Sai do capital e volta ao saldo geral. Não é renda.'),msg),footer:[h('button.btn.primary',{type:'button',onclick:()=>{if(busy)return;const value=parseMoney(amount.value),fresh=S(),limit=toCapital?F.computeFresh(()=>F.balance(fresh)):F.computeFresh(()=>F.capitalBalance(fresh));if(value<=0){msg.textContent='Informe um valor maior que zero.';return;}if(value>limit+0.004){msg.textContent=`Saldo insuficiente. Disponível: ${money(Math.max(0,limit))}.`;return;}busy=true;store.commit(st=>{st.transactions.push({id:uid(),type:toCapital?'expense':'income',value,date:today(),paidAt:today(),status:'Pago',method:'Transferência',cat:'Outros',transactionRole:toCapital?'capital_transfer_in':'capital_transfer_out',desc:toCapital?'Transferência para capital de empréstimos':'Transferência do capital para saldo',createdAt:Date.now()});});sh.close();toast(toCapital?'Capital adicionado.':'Capital transferido para o saldo.');rerender();}},toCapital?'Enviar para capital':'Retirar capital')]});
}

function openCapitalReceipts(){
  const s=S(),rows=(s.transactions||[]).filter(t=>['capital_transfer_in','capital_transfer_out','loan_principal_out','loan_principal_return'].includes(t.transactionRole)).map(t=>({transaction:t,principal:t.value,date:t.paidAt||t.date})).sort((a,b)=>String(b.date).localeCompare(String(a.date))),total=F.computeFresh(()=>F.capitalBalance(s)),host=h('div.capital-receipt-list');let count=50;
  const more=h('button.btn.block',{type:'button',onclick:()=>{count+=50;paint();}},'Mostrar mais recebimentos');
  const paint=()=>{host.replaceChildren(...rows.slice(0,count).map(row=>h('button.capital-receipt',{type:'button',onclick:async()=>{sheet.close();const forms=await import('./forms.js');setTimeout(()=>forms.openTxDetail(row.transaction.id),250);}},h('span',h('b',row.transaction.desc),h('small',shortDate(row.date))),h('strong',`${['capital_transfer_out','loan_principal_out'].includes(row.transaction.transactionRole)?'−':'+'} ${money(row.principal)}`))));more.hidden=count>=rows.length;};
  const sheet=openSheet({title:'Movimentações do capital',subtitle:'Entradas, saídas, empréstimos liberados e principal recebido.',content:h('div',h('div.capital-receipt-total',h('small','CAPITAL DISPONÍVEL'),h('strong',money(total))),h('p.hint','Transferências internas não contam como renda ou despesa. Empréstimos liberados reduzem o capital; principal recebido o recompõe.'),rows.length?host:h('div.empty','Nenhum principal recebido até hoje.'),more)});paint();
}

function shareLoan(id){
  const loan=S().loans.find(x=>x.id===id);
  if(!loan){toast('Empréstimo não encontrado.');return;}
  const text=loanShareText(loan,S().loanPayments),summary=loanShareSummary(loan),box=h('textarea.input',{readOnly:true,rows:12,'aria-label':'Mensagem para o cliente'},text);
  const row=(label,value)=>h('div.loan-share-row',h('span',label),h('strong',value));
  const preview=h('section.loan-share-card',{'aria-label':'Resumo para o cliente'},
    h('div.loan-share-heading',h('span',{'aria-hidden':'true'},'📋'),h('div',h('small','RESUMO DO EMPRÉSTIMO'),h('h3',loan.person))),
    h('div.loan-share-total',h('span',summary.paid?'Empréstimo quitado':'Total a pagar'),h('strong',money(summary.total)),h('span.loan-share-due','📅 Vencimento: '+summary.due)),
    h('div.loan-share-breakdown',row('💵 Valor emprestado',money(summary.original)),row('📈 Juros combinados',summary.terms),summary.principal!==summary.original?row('✅ Valor já devolvido',money(Math.max(0,round2(summary.original-summary.principal)))):null),
    h('div.loan-share-breakdown',h('h4','O que falta pagar'),row('Valor emprestado restante',money(summary.principal)),row('Juros a pagar',money(summary.interest))),
    h('p.muted.sm',summary.paid?'Tudo certo: não há saldo pendente.':'O total já considera os pagamentos registrados.'));
  const message=h('details.loan-share-message',h('summary','Ver mensagem que será enviada'),box);
  const content=h('div.loan-share-content',preview,message);
  if(loan.installmentPlan){const rows=installmentSchedule(loan,S().loanPayments);preview.append(h('h4',`${rows.filter(x=>x.paid).length}/${rows.length} parcelas pagas`),h('div.loan-share-installments',rows.map(x=>h('div.loan-share-row',h('span',`${x.paid?'✅':x.overdue?'🔴':'⏳'} ${x.number}/${rows.length} · ${shortDate(x.due)}`),h('strong',money(x.amount))))));}
  const copy=async()=>{try{await navigator.clipboard.writeText(text);toast('Mensagem copiada.');}catch{message.open=true;box.focus();box.select();toast('Selecione e copie a mensagem para enviar.');}};
  const actions=[h('a.btn.primary',{href:'https://wa.me/?text='+encodeURIComponent(text),target:'_blank',rel:'noopener noreferrer'},'Enviar pelo WhatsApp'),h('button.btn',{type:'button',onclick:copy},'Copiar mensagem')];
  if(navigator.share)actions.unshift(h('button.btn',{type:'button',onclick:async()=>{try{await navigator.share({title:'Resumo do empréstimo',text});}catch(e){if(e.name!=='AbortError')toast('Não foi possível compartilhar. Use WhatsApp ou copie a mensagem.');}}},'Compartilhar'));
  openSheet({title:'Compartilhar empréstimo',subtitle:'Confira os valores e escolha como enviar ao cliente.',content,footer:actions});
}

function newLoan(){
  openSheet({title:'Novo empréstimo',content:h('div.btn-row',h('button.btn',{type:'button',onclick:()=>{closeAllSheets();setTimeout(newStandardLoan,150);}},'Valor normal + juros'),h('button.btn.primary',{type:'button',onclick:()=>{closeAllSheets();setTimeout(newInstallmentLoan,150);}},'Parcelado'))});
}
function newStandardLoan(){
  const person=h('input.input',{placeholder:'Nome da pessoa',maxlength:60}), principal=h('input.input',{inputmode:'decimal',placeholder:'0,00'}), mode=h('select.input',h('option',{value:'percent'},'Percentual (%)'),h('option',{value:'fixed'},'Valor fixo (R$)')), interest=h('input.input',{inputmode:'decimal',placeholder:'10'}), periodicity=h('select.input',h('option',{value:'monthly'},'Mensal'),h('option',{value:'single'},'Único')), due=h('input.input',{type:'date',value:today()}), note=h('textarea.input',{rows:2,placeholder:'Observação (opcional)',maxlength:180}), preview=h('div.loan-preview'), msg=h('p.form-msg');
  const update=()=>{const p=parseMoney(principal.value),v=parseMoney(interest.value),i=mode.value==='fixed'?v:round2(p*v/100);preview.replaceChildren(h('small','PRÉVIA'),h('div.loan-preview-grid',h('span','Principal',h('b',money(p))),h('span','Juros',h('b',money(i))),h('span','Total a receber',h('b',money(p+i)))));};
  [principal,interest,mode].forEach(x=>x.addEventListener('input',update)); update();
  const sh=openSheet({title:'Novo empréstimo',subtitle:'Principal e juros ficam separados para não inflar sua renda.',content:h('div.form',field('Pessoa',person),field('Valor principal',principal),field('Tipo de juros',mode),field('Juros',interest),field('Periodicidade',periodicity),field('Vencimento',due),field('Observação',note),preview,msg),footer:[h('button.btn.primary',{type:'button',onclick:()=>{const p=parseMoney(principal.value),v=parseMoney(interest.value);if(!person.value.trim()||p<=0||v<0||!due.value){msg.textContent='Informe pessoa, valor e vencimento.';return;}const capital=F.computeFresh(()=>F.capitalBalance(S()));if(p>capital+0.004){msg.textContent=`Capital insuficiente. Você possui ${money(Math.max(0,capital))} disponíveis.`;return;}store.commit(s=>{const id=uid(),createdAt=Date.now(), l={id,person:person.value.trim(),principalOriginal:p,principal:p,interestMode:mode.value,interestRate:mode.value==='percent'?v:0,interestFixed:mode.value==='fixed'?v:0,periodicity:periodicity.value,due:due.value,initialDue:due.value,status:'open',note:note.value.trim(),createdAt};l.interestDue=baseInterest(l);s.loans.push(l);s.loanCycles.push({id:uid(),loanId:id,date:today(),due:l.due,principal:p,interest:l.interestDue,type:'created',createdAt});s.transactions.push({id:uid(),loanId:id,isLoan:true,loanAction:'created',transactionRole:'loan_principal_out',capitalManaged:true,type:'expense',value:p,date:today(),paidAt:today(),status:'Pago',method:'Capital',cat:'Dívidas e empréstimos',desc:`Empréstimo para ${l.person}`,createdAt});});sh.close();toast('Empréstimo registrado e descontado do capital.');rerender();}},'Salvar')]});
}

function editLoan(l, parentSheet){
  if(l.installmentPlan){openInstallmentSchedule(l);return;}
  const s=S(), payments=paidFor(s,l.id), hasPayments=payments.length>0;
  const person=h('input.input',{value:l.person||'',maxlength:60,placeholder:'Nome da pessoa'}),
    principal=h('input.input',{inputmode:'decimal',value:String((l.principalOriginal != null ? l.principalOriginal : (l.principal != null ? l.principal : 0))).replace('.',','),disabled:hasPayments}),
    mode=h('select.input',h('option',{value:'percent'},'Percentual (%)'),h('option',{value:'fixed'},'Valor fixo (R$)')),
    interest=h('input.input',{inputmode:'decimal'}),
    periodicity=h('select.input',h('option',{value:'monthly'},'Mensal'),h('option',{value:'single'},'Único')),
    due=h('input.input',{type:'date',value:l.due||today()}),
    note=h('textarea.input',{rows:3,maxlength:180,placeholder:'Observação (opcional)'},l.note||''),
    preview=h('div.loan-preview'), msg=h('p.form-msg');
  mode.value=l.interestMode||'percent'; periodicity.value=l.periodicity||'monthly';
  interest.value=String(mode.value==='fixed'?(l.interestFixed||0):(l.interestRate||0)).replace('.',',');
  if(hasPayments){ mode.disabled=true; interest.disabled=true; periodicity.disabled=true; }
  const update=()=>{const p=hasPayments?Number(l.principal||0):parseMoney(principal.value),v=parseMoney(interest.value),i=mode.value==='fixed'?v:round2(p*v/100);preview.replaceChildren(h('small','PRÉVIA DO CONTRATO'),h('div.loan-preview-grid',h('span',hasPayments?'Principal atual':'Principal',h('b',money(p))),h('span','Juros do ciclo',h('b',money(i))),h('span','Total estimado',h('b',money(p+i)))));};
  [principal,interest,mode].forEach(x=>x.addEventListener('input',update)); update();
  const sh=openSheet({title:`Editar · ${l.person}`,subtitle:hasPayments?'Os pagamentos podem ser corrigidos ou excluídos pelo histórico. Para não reescrever contratos já movimentados, principal, taxa e periodicidade continuam fixos aqui.':'Você pode corrigir os dados financeiros enquanto ainda não houver pagamentos.',content:h('div.form',field('Pessoa',person),field('Valor principal',principal,hasPayments?'Edite pagamentos pelo histórico do empréstimo.':''),field('Tipo de juros',mode,hasPayments?'Fixo após o primeiro pagamento.':''),field('Juros',interest,hasPayments?'Fixo após o primeiro pagamento.':''),field('Periodicidade',periodicity,hasPayments?'Fixa após o primeiro pagamento.':''),field('Vencimento',due),field('Observação',note),preview,msg),footer:[h('button.btn.primary',{type:'button',onclick:()=>{const name=person.value.trim(),p=parseMoney(principal.value),v=parseMoney(interest.value);if(!name||(!hasPayments&&p<=0)||(!hasPayments&&v<0)||!due.value){msg.textContent='Revise pessoa, valor, juros e vencimento.';return;}store.commit(st=>{const loan=st.loans.find(x=>x.id===l.id);if(!loan)return;loan.person=name;loan.due=due.value;loan.note=note.value.trim();if(!hasPayments){loan.interestMode=mode.value;loan.interestRate=mode.value==='percent'?v:0;loan.interestFixed=mode.value==='fixed'?v:0;loan.periodicity=periodicity.value;loan.principalOriginal=p;loan.principal=p;loan.interestDue=baseInterest(loan);loan.initialDue=due.value;}for(const tx of st.transactions.filter(x=>x.loanId===loan.id)){if(tx.transactionRole==='loan_principal_out'){if(!hasPayments)tx.value=p;tx.desc=`Empréstimo para ${name}`;}else if(tx.transactionRole==='loan_principal_return')tx.desc=`Principal recebido · ${name}`;else if(tx.transactionRole==='loan_interest_income')tx.desc=`Juros recebidos · ${name}`;}if(!hasPayments){const created=st.loanCycles.find(c=>c.loanId===loan.id&&c.type==='created');if(created){created.principal=p;created.interest=loan.interestDue;created.due=loan.due;}}});sh.close();if(parentSheet && typeof parentSheet.close === 'function') parentSheet.close();toast('Empréstimo atualizado.');rerender();}},'Salvar alterações')]});
}

async function deleteLoan(l, parentSheet){
  const s=S(), payments=paidFor(s,l.id), txs=(s.transactions||[]).filter(x=>x.loanId===l.id), cycles=(s.loanCycles||[]).filter(x=>x.loanId===l.id);
  const hasPayments=payments.length>0;
  const ok=await confirmSheet({title:`Excluir contrato de ${l.person}?`,message:hasPayments?`Este contrato possui ${payments.length} pagamento${payments.length>1?'s':''}. Ao excluir, o contrato, pagamentos, lançamentos de principal/juros e ciclos associados serão removidos.`:'Ao excluir, o cadastro e os ciclos associados serão removidos.',confirmLabel:'Excluir contrato',danger:true,requireText:hasPayments?'EXCLUIR':''});
  if(!ok)return;
  store.markDeleted(l.id,payments.map(x=>x.id),txs.map(x=>x.id),cycles.map(x=>x.id));
  store.commit(st=>{st.loans=st.loans.filter(x=>x.id!==l.id);st.loanPayments=st.loanPayments.filter(x=>x.loanId!==l.id);st.loanCycles=st.loanCycles.filter(x=>x.loanId!==l.id);st.transactions=st.transactions.filter(x=>x.loanId!==l.id);});
  if(parentSheet && typeof parentSheet.close === 'function') parentSheet.close(); toast('Contrato e histórico removidos.');rerender();
}

function payLoan(l,{interestOnly=false}={}){
  if(l.installmentPlan){openInstallmentSchedule(l);return;}
  const amount=h('input.input',{inputmode:'decimal',placeholder:'0,00'}), method=h('select.input',h('option',{value:'Transferência'},'Transferência'),h('option',{value:'PIX'},'PIX'),h('option',{value:'Dinheiro'},'Dinheiro'),h('option',{value:'Outro'},'Outro')), preview=h('div.loan-preview'), msg=h('p.form-msg');
  if(interestOnly&&interestDue(l)>0) amount.value=String(interestDue(l)).replace('.',',');
  const update=()=>{const a=Math.max(0,parseMoney(amount.value)), i=Math.min(a,interestDue(l)), p=interestOnly?0:Math.min(Number(l.principal||0),Math.max(0,a-i)), rest=round2(totalDue(l)-i-p);preview.replaceChildren(h('small',interestOnly?'RECEBIMENTO DE JUROS':'COMO O BIVVO VAI DISTRIBUIR'),h('div.loan-preview-grid',h('span','Para o saldo geral (juros)',h('b',money(i))),h('span','Para o capital (principal)',h('b',money(p))),h('span','Restará',h('b',money(rest)))));};amount.addEventListener('input',update);update();
  let busy=false;
  const confirmBtn=h('button.btn.primary',{type:'button',onclick:async()=>{if(busy)return;const requested=parseMoney(amount.value), current=S().loans.find(x=>x.id===l.id);if(!current||isPaid(current)){msg.textContent='Este contrato já foi quitado ou não está mais disponível.';return;}const max=interestOnly?interestDue(current):totalDue(current);if(requested<=0){msg.textContent='Informe o valor recebido.';return;}if(requested>max+0.004){msg.textContent=`O máximo permitido aqui é ${money(max)}.`;return;}const a=Math.min(requested,max), i=Math.min(a,interestDue(current)), p=interestOnly?0:Math.min(current.principal,Math.max(0,a-i));busy=true;confirmBtn.disabled=true;const ok=await confirmSheet({title:interestOnly?'Confirmar recebimento de juros?':'Confirmar pagamento?',message:`Você está registrando ${money(round2(i+p))}: ${money(i)} em juros e ${money(p)} em principal. Juros entram no saldo geral; principal fica no saldo de capital recebido. Você poderá corrigir ou excluir pelo histórico.`,confirmLabel:'Confirmar',danger:false});if(!ok){busy=false;confirmBtn.disabled=false;return;}try{store.commit(s=>{const loan=s.loans.find(x=>x.id===l.id);if(!loan||isPaid(loan))return;ensureLoanLedger(s,loan.id);const amountNow=Math.min(requested,interestOnly?interestDue(loan):totalDue(loan)), interestNow=Math.min(amountNow,interestDue(loan)), principalNow=interestOnly?0:Math.min(loan.principal,Math.max(0,amountNow-interestNow));loan.interestDue=round2(interestDue(loan)-interestNow);loan.principal=round2(loan.principal-principalNow);const currentInterestCleared=loan.interestDue<=0.004;const shouldAutoRenew=loan.periodicity==='monthly'&&loan.principal>0.004&&currentInterestCleared;const pid=uid(), createdAt=Date.now();if(loan.principal<=0.004&&currentInterestCleared){loan.status='paid';loan.interestDue=0;}else if(shouldAutoRenew){const previousDue=loan.due||today();loan.due=addMonthsDate(previousDue,1);loan.status='open';const newInterest=baseInterest(loan);loan.interestDue=round2(newInterest);s.loanCycles.push({id:uid(),loanId:loan.id,paymentId:pid,date:today(),due:loan.due,principal:loan.principal,interest:newInterest,capitalized:0,type:'renewal',automatic:true,createdAt});}else loan.status='open';s.loanPayments.push({id:pid,loanId:loan.id,date:today(),amount:round2(interestNow+principalNow),interest:interestNow,principal:principalNow,method:method.value,autoRenewed:shouldAutoRenew,createdAt,editable:true});if(principalNow>0)s.transactions.push({id:uid(),loanId:loan.id,loanPaymentId:pid,transactionRole:'loan_principal_return',type:'income',value:principalNow,cat:'Juros / Empréstimo',date:today(),desc:`Principal recebido · ${loan.person}`,method:method.value,status:'Pago',createdAt});if(interestNow>0)s.transactions.push({id:uid(),loanId:loan.id,loanPaymentId:pid,transactionRole:'loan_interest_income',type:'income',value:interestNow,cat:'Juros / Empréstimo',date:today(),desc:`Juros recebidos · ${loan.person}`,method:method.value,status:'Pago',createdAt});});sh.close();toast(interestOnly?'Juros registrados e adicionados ao saldo.':'Pagamento registrado: juros no saldo geral e principal no capital.');rerender();}finally{busy=false;confirmBtn.disabled=false;}}},interestOnly?'Registrar juros':'Registrar pagamento');
  const sh=openSheet({title:interestOnly?`Receber só juros · ${l.person}`:`Receber de ${l.person}`,subtitle:`Saldo a receber ${money(totalDue(l))} · juros no saldo geral e principal no capital`,content:h('div.form',h('p.notice',interestOnly?`Este lançamento afeta somente os juros. O principal de ${money(l.principal)} não será amortizado.`:`Principal ${money(l.principal)} · juros pendentes ${money(interestDue(l))}. O pagamento quita juros primeiro e depois amortiza o principal.`),field(interestOnly?'Juros recebidos':'Valor recebido',amount),field('Forma de recebimento',method),preview,msg),footer:[confirmBtn]});
}

function renewLoan(l){
  if(l.installmentPlan){openInstallmentSchedule(l);return;}
  const capitalize=h('input',{type:'checkbox'}), rate=h('input.input',{inputmode:'decimal',value:String(l.interestMode==='fixed'?(l.interestFixed||0):(l.interestRate||0)).replace('.',',')}), due=h('input.input',{type:'date',value:addMonthsDate(l.due||today(),1)}), msg=h('p.form-msg');
  const sh=openSheet({title:`Renovar · ${l.person}`,subtitle:'Nada é capitalizado automaticamente.',content:h('div.form',h('label.check',capitalize,h('span','Capitalizar juros pendentes no principal')),field(l.interestMode==='fixed'?'Juros do novo ciclo (R$)':'Taxa do novo ciclo (%)',rate),field('Novo vencimento',due),h('p.notice','Se capitalizar, os juros pendentes viram principal. Se não capitalizar, continuam separados do principal.'),msg),footer:[h('button.btn.primary',{type:'button',onclick:()=>{const v=parseMoney(rate.value);if(v<0||!due.value){msg.textContent='Revise taxa e vencimento.';return;}store.commit(s=>{const loan=s.loans.find(x=>x.id===l.id), oldInterest=interestDue(loan);ensureLoanLedger(s,loan.id);if(capitalize.checked&&oldInterest>0){loan.principal=round2(loan.principal+oldInterest);loan.interestDue=0;}if(loan.interestMode==='fixed')loan.interestFixed=v;else loan.interestRate=v;loan.due=due.value;loan.status='open';loan.interestDue=round2(interestDue(loan)+baseInterest(loan));s.loanCycles.push({id:uid(),loanId:loan.id,date:today(),due:loan.due,principal:loan.principal,interest:baseInterest(loan),capitalized:capitalize.checked?oldInterest:0,type:'renewal',createdAt:Date.now()});});sh.close();toast('Empréstimo renovado.');rerender();}},'Confirmar renovação')]});
}

function syncPaymentTransactions(st,loan,payment,removedIds){
  const rows=relatedPaymentTransactions(st,payment.id);
  const syncRole=(role,value,desc)=>{
    let tx=rows.find(x=>x.transactionRole===role);
    if(value<=0.004){if(tx){removedIds.push(tx.id);st.transactions=st.transactions.filter(x=>x.id!==tx.id);}return;}
    if(!tx){tx={id:uid(),loanId:loan.id,loanPaymentId:payment.id,transactionRole:role,type:'income',cat:'Juros / Empréstimo',status:'Pago',createdAt:Date.now()};st.transactions.push(tx);}
    Object.assign(tx,{value:round2(value),date:payment.date,desc,method:payment.method||'Transferência',status:'Pago'});delete tx.locked;delete tx.immutable;
  };
  syncRole('loan_principal_return',payment.principal,`Principal recebido · ${loan.person}`);
  syncRole('loan_interest_income',payment.interest,`Juros recebidos · ${loan.person}`);
}

function editLoanPayment(l,p,parentSheet){
  if(paymentBeforeInstallmentAgreement(l,p)){toast('Este recebimento integra o histórico anterior ao parcelamento e está preservado.');return;}
  if(l.installmentPlan){openInstallmentSchedule(l);return;}
  const interest=h('input.input',{inputmode:'decimal',value:String(Number(p.interest||0)).replace('.',',')}), principal=h('input.input',{inputmode:'decimal',value:String(Number(p.principal||0)).replace('.',',')}), date=h('input.input',{type:'date',value:p.date||today()}), method=h('select.input',h('option',{value:'Transferência'},'Transferência'),h('option',{value:'PIX'},'PIX'),h('option',{value:'Dinheiro'},'Dinheiro'),h('option',{value:'Outro'},'Outro')), preview=h('div.loan-preview'), msg=h('p.form-msg');
  method.value=p.method||((relatedPaymentTransactions(S(),p.id)[0] && relatedPaymentTransactions(S(),p.id)[0].method) || 'Transferência');
  const update=()=>{const i=Math.max(0,parseMoney(interest.value)),pr=Math.max(0,parseMoney(principal.value));preview.replaceChildren(h('small','NOVO LANÇAMENTO'),h('div.loan-preview-grid',h('span','Juros',h('b',money(i))),h('span','Principal',h('b',money(pr))),h('span','Total',h('b',money(i+pr)))));};
  [interest,principal].forEach(x=>x.addEventListener('input',update));update();
  const sh=openSheet({title:`Editar pagamento · ${l.person}`,subtitle:p.principal<=0.004?'Este lançamento foi registrado somente como juros.':'Corrija juros e principal separadamente para manter o empréstimo consistente.',content:h('div.form',field('Juros recebidos',interest),field('Principal recebido',principal),h('p.notice','Juros vão para o saldo geral; principal vai para o capital. Para manter somente juros, deixe Principal recebido em R$ 0,00.'),field('Data',date),field('Forma de recebimento',method),preview,msg),footer:[h('button.btn.primary',{type:'button',onclick:()=>{const st=S();const current=st.loanPayments.find(x=>x.id===p.id),loan=st.loans.find(x=>x.id===l.id);if(!current||!loan){msg.textContent='Pagamento não encontrado.';return;}const i=Math.max(0,parseMoney(interest.value)),pr=Math.max(0,parseMoney(principal.value));if(i+pr<=0.004){msg.textContent='Informe algum valor em juros ou principal.';return;}store.commit(state=>{ensureLoanLedger(state,loan.id);});const cap=loanCapacity(S(),loan.id,p.id);if(i>cap.interest+0.004){msg.textContent=`Juros acima do disponível para este contrato. Máximo: ${money(cap.interest)}.`;return;}if(pr>cap.principal+0.004){msg.textContent=`Principal acima do disponível para este contrato. Máximo: ${money(cap.principal)}.`;return;}const removed=[];store.commit(state=>{const pay=state.loanPayments.find(x=>x.id===p.id),ln=state.loans.find(x=>x.id===l.id);if(!pay||!ln)return;const oldInterest=Number(pay.interest||0),oldPrincipal=Number(pay.principal||0),auto=findAutoRenewCycle(state,pay);pay.interest=round2(i);pay.principal=round2(pr);pay.amount=round2(i+pr);pay.date=date.value||today();pay.method=method.value;pay.editable=true;delete pay.immutable;if(auto){if(i+0.004<oldInterest){removed.push(auto.id);state.loanCycles=state.loanCycles.filter(c=>c.id!==auto.id);pay.autoRenewed=false;}else{const oldCyclePrincipal=Math.max(0,Number(auto.principal||0));const nextPrincipal=Math.max(0,round2(oldCyclePrincipal+oldPrincipal-pr));if(ln.interestMode==='percent'&&oldCyclePrincipal>0){const effective=Number(auto.interest||0)/oldCyclePrincipal;auto.interest=round2(nextPrincipal*effective);}auto.principal=nextPrincipal;auto.date=pay.date;auto.paymentId=pay.id;}}
        syncPaymentTransactions(state,ln,pay,removed);recalculateLoan(state,ln.id);});if(removed.length)store.markDeleted(removed);sh.close();if(parentSheet && typeof parentSheet.close === 'function') parentSheet.close();toast('Pagamento atualizado. Saldos de principal e juros foram recalculados.');rerender();}},'Salvar correção')]});
}

async function deleteLoanPayment(l,p,parentSheet){
  if(paymentBeforeInstallmentAgreement(l,p)){toast('Este recebimento integra o histórico anterior ao parcelamento e está preservado.');return;}
  const ok=await confirmSheet({title:'Excluir pagamento?',message:`Será removido ${money(p.amount)} do histórico (${money(p.interest)} em juros e ${money(p.principal)} em principal). Juros serão retirados do saldo geral e principal do saldo de capital. O contrato será recalculado.`,confirmLabel:'Excluir pagamento',danger:true});
  if(!ok)return;
  const s=S(), related=relatedPaymentTransactions(s,p.id), auto=findAutoRenewCycle(s,p);const removed=[p.id,...related.map(x=>x.id),...(auto?[auto.id]:[])];
  store.markDeleted(removed);
  store.commit(st=>{ensureLoanLedger(st,l.id);st.loanPayments=st.loanPayments.filter(x=>x.id!==p.id);st.transactions=st.transactions.filter(x=>x.loanPaymentId!==p.id);if(auto)st.loanCycles=st.loanCycles.filter(x=>x.id!==auto.id);recalculateLoan(st,l.id);});
  if(parentSheet && typeof parentSheet.close === 'function') parentSheet.close();toast('Pagamento excluído e empréstimo recalculado.');rerender();
}

export function openLoanPaymentEditor(paymentId){
 if(!store.loansEnabled())return;
  const s=S(),p=(s.loanPayments||[]).find(x=>x.id===paymentId);if(!p){toast('Pagamento de empréstimo não encontrado.');return;}const l=(s.loans||[]).find(x=>x.id===p.loanId);if(!l){toast('Empréstimo não encontrado.');return;}editLoanPayment(l,p);
}

export async function deleteLoanPaymentById(paymentId){
  const s=S(),p=(s.loanPayments||[]).find(x=>x.id===paymentId);if(!p){toast('Pagamento de empréstimo não encontrado.');return;}const l=(s.loans||[]).find(x=>x.id===p.loanId);if(!l){toast('Empréstimo não encontrado.');return;}await deleteLoanPayment(l,p);
}

function timeline(s,l,onEdit,onDelete){
  const events=[];
  events.push({date:(l.createdAt?new Date(l.createdAt):null),iso:null,label:'Dinheiro emprestado',value:l.principalOriginal,kind:'out'});
  (s.loanCycles||[]).filter(c=>c.loanId===l.id).forEach(c=>{if(c.type==='renewal')events.push({date:null,iso:c.date,label:c.capitalized?`Renovado · ${money(c.capitalized)} capitalizados`:'Empréstimo renovado',value:c.interest,kind:'cycle'});});
  paidFor(s,l.id).forEach(p=>events.push({date:p.createdAt?new Date(p.createdAt):null,iso:p.date,label:`${paymentLabel(p)} · juros ${money(p.interest)} · principal ${money(p.principal)}`,value:p.amount,kind:'in',payment:p}));
  events.sort((a,b)=>String(b.iso||(b.date && b.date.toISOString ? b.date.toISOString() : '')||'').localeCompare(String(a.iso||(a.date && a.date.toISOString ? a.date.toISOString() : '')||'')));
  return h('div.loan-timeline',events.map(e=>{const d=e.iso||(e.date?`${e.date.getFullYear()}-${String(e.date.getMonth()+1).padStart(2,'0')}-${String(e.date.getDate()).padStart(2,'0')}`:today());return h('div.loan-event',h('span.loan-dot',{class:e.kind}),h('div',h('b',e.label),h('small',shortDate(d))),h('div.loan-event-side',h('strong',money(e.value)),e.payment?h('div.loan-event-actions',h('button.btn.sm',{type:'button',onclick:()=>onEdit(e.payment)},'Editar'),h('button.btn.sm.ghost.danger-text',{type:'button',onclick:()=>onDelete(e.payment)},'Excluir')):null));}));
}

function loanDetail(l){
  if(l.installmentPlan){openInstallmentSchedule(l);return;}
  const s=S();
  const st=loanStatus(l);
  const rec=principalRecovered(s,l);
  const ints=interestReceived(s,l);
  let sh;
  const hasPayments=paidFor(s,l.id).length>0;
  const footer=[
    h('button.btn.ghost.danger-text',{type:'button',onclick:()=>deleteLoan(l,sh)},'Excluir contrato'),
    h('button.btn',{type:'button',onclick:()=>editLoan(l,sh)},'Editar empréstimo'),
    h('button.btn',{type:'button',onclick:()=>shareLoan(l.id)},'Compartilhar empréstimo')
  ];

  if(!isPaid(l)){
    footer.push(h('button.btn',{type:'button',onclick:()=>{sh.close();setTimeout(()=>parcelOpenLoan(l),250);}},'Parcelar saldo'));
    footer.push(h('button.btn',{type:'button',onclick:()=>renewLoan(l)},'Renovar'));
    if(interestDue(l)>0.004){
      footer.push(h('button.btn',{type:'button',onclick:()=>payLoan(l,{interestOnly:true})},'Receber só juros'));
    }
    footer.push(h('button.btn.primary',{type:'button',onclick:()=>payLoan(l)},'Registrar pagamento'));
  }else{
    footer.push(h('button.btn',{type:'button',disabled:true},'Quitado'));
  }

  const kpis=h('div.loan-detail-kpis',
    h('div.stat',h('span','Principal original'),h('b',money(l.principalOriginal))),
    h('div.stat',h('span','Principal atual'),h('b',money(l.principal))),
    h('div.stat',h('span','Juros pendentes'),h('b',money(interestDue(l)))),
    h('div.stat',h('span','Total a receber'),h('b',money(totalDue(l))))
  );

  const meta=h('div.loan-meta',
    h('span',`Juros recebidos: ${money(ints)}`),
    h('span',`Vencimento: ${l.due?shortDate(l.due):'—'}`),
    h('span',l.interestMode==='fixed'?`Juros fixos: ${money(l.interestFixed)}`:`Taxa: ${l.interestRate||0}%`)
  );

  const historyNotice=hasPayments
    ? h('p.notice','Pagamentos do histórico podem ser editados ou excluídos. O Bivvo recalcula principal e juros automaticamente.')
    : null;

  const history=timeline(
    s,
    l,
    p=>{
      sh.close();
      setTimeout(()=>editLoanPayment(l,p),120);
    },
    p=>deleteLoanPayment(l,p,sh)
  );

  const content=h('div.loan-detail',
    kpis,
    progressBar(rec,l.principalOriginal,'Principal recuperado'),
    meta,
    h('div.section-head',h('h3','Histórico')),
    historyNotice,
    history,
    l.note?h('p.notice',l.note):null
  );

  sh=openSheet({
    title:l.person,
    subtitle:st.label,
    wide:true,
    content,
    footer:footer.filter(Boolean)
  });
}

export function openLoanCalendarDetail(id){
 if(!store.loansEnabled())return;
  const s=S(), l=(s.loans||[]).find(x=>x.id===id);
  if(!l) return;
  const st=loanStatus(l), total=totalDue(l), interest=interestDue(l);
  const rows=[];
  const row=(k,v)=>rows.push(h('div.kv',h('span',k),h('b',v)));
  row('Vencimento',l.due?shortDate(l.due):'—');
  row('Principal restante',money(l.principal));
  row('Juros do ciclo',money(interest));
  row(l.interestMode==='fixed'?'Juros':'Taxa',l.interestMode==='fixed'?money(l.interestFixed||0):`${Number(l.interestRate||0)}%`);
  row('Situação',st.label);
  if(l.note) row('Observação',l.note);
  let sheet;
  const actions=[];
  if(!isPaid(l)) actions.push(interest>0.004?h('button.btn',{type:'button',onclick:()=>{sheet.close();setTimeout(()=>payLoan(l,{interestOnly:true}),120);}},'Receber só juros'):null,h('button.btn.primary',{type:'button',onclick:()=>{sheet.close();setTimeout(()=>payLoan(l),120);}},'Registrar pagamento'));
  actions.push(h('button.btn',{type:'button',onclick:()=>{sheet.close();setTimeout(()=>editLoan(l),120);}},'Editar empréstimo'));
  actions.push(h('button.btn',{type:'button',onclick:()=>{sheet.close();setTimeout(()=>loanDetail(l),120);}},'Ver histórico'));
  sheet=openSheet({label:`Vencimento de ${l.person}`,content:[
    h('div.detail-head',h('span.tx-ico.lg.loan-due-icon',{'aria-hidden':'true'},'💰'),h('h2',l.person),h('p.detail-amount.in',money(total)),h('span.loan-status',{class:st.key},st.label)),
    h('div.kvs',rows),
    h('div.stack-actions',actions.filter(Boolean))
  ]});
}

function personDetail(person){const s=S(), list=(s.loans||[]).filter(l=>l.person===person), active=list.filter(l=>!isPaid(l)), principal=active.reduce((a,l)=>a+Number(l.principal||0),0), due=active.reduce((a,l)=>a+totalDue(l),0), ints=list.reduce((a,l)=>a+interestReceived(s,l),0), overdue=active.filter(l=>overdueDays(l)).length;openSheet({title:person,subtitle:`${list.length} empréstimo${list.length===1?'':'s'} · ${overdue?`${overdue} vencido${overdue>1?'s':''}`:'sem atrasos'}`,wide:true,content:h('div',h('div.loan-detail-kpis',h('div.stat',h('span','Principal pendente'),h('b',money(principal))),h('div.stat',h('span','Total a receber'),h('b',money(due))),h('div.stat',h('span','Juros recebidos'),h('b',money(ints)))),h('div.loan-list',list.map(l=>loanCard(s,l,true))))});}

function loanCard(s,l,compact=false){const st=loanStatus(l), rec=principalRecovered(s,l), ints=interestReceived(s,l);return h('section.card.loan-row',{class:`loan-${st.key}`},h('div.loan-row-head',h('div',h('b',l.person),h('small',l.due?`Vence ${shortDate(l.due)}`:'Sem vencimento')),h('span.loan-status',{class:st.key},st.label)),h('div.loan-amounts',h('span',h('small','Principal'),h('strong',money(l.principal))),h('span',h('small','Juros'),h('strong',money(interestDue(l)))),h('span',h('small','A receber'),h('strong',money(totalDue(l))))),progressBar(rec,l.principalOriginal,'Principal recuperado'),h('small.loan-earned',`Juros já recebidos: ${money(ints)}`),h('div.btn-row',h('button.btn',{type:'button',onclick:()=>loanDetail(l)},'Detalhes'),h('button.btn',{type:'button',onclick:()=>shareLoan(l.id)},'Compartilhar'),!isPaid(l)&&!compact&&!l.installmentPlan?h('button.btn',{type:'button',onclick:()=>parcelOpenLoan(l)},'Parcelar saldo'):null,!isPaid(l)&&!compact&&!l.installmentPlan&&interestDue(l)>0.004?h('button.btn',{type:'button',onclick:()=>payLoan(l,{interestOnly:true})},'Só juros'):null,!isPaid(l)&&!compact?h('button.btn.primary',{type:'button',onclick:()=>payLoan(l)},l.installmentPlan?'Ver parcelas':'Registrar pagamento'):null));}

export function renderLoans(root){
  if(store.isDemo()&&!S().loans.some(l=>l.id.startsWith('demo-capital-')))store.commit(addCapitalDemoRecords,{reason:'capital-demo'});

  if(!store.loansEnabled())return;
  const s=S(), loans=s.loans||[], selectedYM=ctx.month||ymOf(today());
  const loanCreatedYM=l=>{if(!l.createdAt)return '';const d=new Date(l.createdAt);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;};
  const hasActivityInMonth=l=>loanCreatedYM(l)===selectedYM||String(l.due||'').startsWith(selectedYM)||installmentSchedule(l,s.loanPayments).some(x=>x.due.startsWith(selectedYM))||paidFor(s,l.id).some(p=>String(p.date||'').startsWith(selectedYM));
  const monthLoans=loans.filter(hasActivityInMonth);
  const active=loans.filter(l=>!isPaid(l)), principal=active.reduce((a,l)=>a+Number(l.principal||0),0), ints=active.reduce((a,l)=>a+interestDue(l),0);
  const monthPayments=(s.loanPayments||[]).filter(p=>String(p.date||'').startsWith(selectedYM));
  const received=monthPayments.reduce((a,p)=>a+Number(p.interest||0),0), overdue=active.filter(l=>overdueDays(l)).reduce((a,l)=>a+totalDue(l),0), total=principal+ints;
  const shift=n=>{ctx.month=addMonthsYM(selectedYM,n);rerender();};
  const monthSwitch=h('div.month-switch',{role:'group','aria-label':'Mês dos empréstimos'},
    h('button.icon-btn',{type:'button','aria-label':'Mês anterior',onclick:()=>shift(-1)},'‹'),
    h('button.month-label',{type:'button',onclick:()=>{if(ctx.month!==ymOf(today())){ctx.month=ymOf(today());rerender();}}},monthLabel(selectedYM)),
    h('button.icon-btn',{type:'button','aria-label':'Próximo mês',onclick:()=>shift(1)},'›'));
  const filter=h('select.input.loan-filter',{'aria-label':'Filtrar situação dos empréstimos'},h('option',{value:'active'},'Em aberto'),h('option',{value:'overdue'},'Vencidos'),h('option',{value:'paid'},'Quitados'),h('option',{value:'all'},'Todos'));
  const sort=h('select.input.loan-filter.loan-sort',{'aria-label':'Ordenar empréstimos'},h('option',{value:'due'},'Data de vencimento'),h('option',{value:'high'},'Maior valor'),h('option',{value:'low'},'Menor valor'));
  const listHost=h('div.loan-list');
  const draw=()=>{let list=monthLoans;if(filter.value==='active')list=monthLoans.filter(l=>!isPaid(l));if(filter.value==='overdue')list=monthLoans.filter(l=>overdueDays(l));if(filter.value==='paid')list=monthLoans.filter(isPaid);list=[...list].sort((a,b)=>{if(sort.value==='high')return totalDue(b)-totalDue(a);if(sort.value==='low')return totalDue(a)-totalDue(b);const ad=nextLoanDue(a,s.loanPayments)||'9999-12-31',bd=nextLoanDue(b,s.loanPayments)||'9999-12-31';return ad.localeCompare(bd)||totalDue(b)-totalDue(a);});listHost.replaceChildren(...(list.length?list.map(l=>loanCard(s,l)): [h('div.empty',h('b',`Nenhum empréstimo com atividade em ${monthLabel(selectedYM).toLowerCase()}.`),h('p','O filtro considera criação, vencimento ou pagamento no mês selecionado.'))]));};
  filter.addEventListener('change',draw);sort.addEventListener('change',draw);
  root.append(h('div.page-head',h('div',h('span.eyebrow','Carteira a receber'),h('h2','Bivvo Capital'),h('p',active.length?`${money(total)} a receber · ${overdue?`${money(overdue)} vencidos`:'nenhum valor vencido'}`:'Acompanhe principal, juros, pagamentos e atrasos.')),h('button.btn.primary',{type:'button',onclick:newLoan},'Novo empréstimo')),
    capitalBalances(s),
    (()=>{
      const due=dueTodayItems(s),sum=due.reduce((a,x)=>a+x.value,0);
      return h('section.card.loan-due-today',{'aria-label':'Vencimentos de hoje'},
        h('div.loan-due-today-head',
          h('div',
            h('span.eyebrow','VENCE HOJE'),
            h('h3',due.length?`${due.length} cobrança${due.length===1?'':'s'} para receber`:'Nada vence hoje'),
            h('p.muted.sm',due.length?`${money(sum)} previstos para hoje.`:'Sua carteira não tem vencimentos para hoje.')
          ),
          due.length?h('strong',money(sum)):h('span.loan-status.paid','Em dia')
        ),
        due.length
          ? h('div.loan-due-today-list',...due.map(item=>h('button.loan-due-today-item',{
              type:'button',
              onclick:()=>item.loan.installmentPlan?openInstallmentSchedule(item.loan):loanDetail(item.loan)
            },h('span',h('b',item.loan.person),h('small',item.label)),h('strong',money(item.value)))))
          : null
      );
    })(),
    h('div.page-head',monthSwitch,h('span.muted.sm',`Filtro: ${monthLabel(selectedYM)}`)),
    h('div.loan-kpis',h('div.stat',h('span','Principal pendente'),h('b',money(principal))),h('div.stat',h('span','Total a receber'),h('b',money(total))),h('div.stat',h('span','Juros a receber'),h('b',money(ints))),h('div.stat',h('span',`Juros recebidos · ${monthShort(selectedYM)}`),h('b',money(received))),h('div.stat.danger',h('span','Vencido'),h('b',money(overdue)))));
  if(loans.length){
    const people=[...new Set(active.map(l=>l.person))].map(person=>({label:person,value:active.filter(l=>l.person===person).reduce((a,l)=>a+totalDue(l),0),person})).sort((a,b)=>b.value-a.value);
    const months={};(s.loanPayments||[]).forEach(p=>{const ym=ymOf(p.date);months[ym]=(months[ym]||0)+Number(p.interest||0);});const interestMonths=Object.entries(months).sort(([a],[b])=>a.localeCompare(b)).slice(-6).map(([ym,value])=>({label:monthShort(ym).toUpperCase(),value}));
    root.append(h('div.loans-grid',h('section.card',h('div.section-head',h('div',h('h3','Carteira Bivvo Capital'),h('p','Toque em uma pessoa para ver os contratos.'))),donut(people,{center:'A receber',onPick:x=>personDetail(x.person)})),h('section.card',h('div.section-head',h('div',h('h3','Por pessoa'),h('p','Principal + juros pendentes.'))),bars(people,{onPick:x=>personDetail(x.person)}))),interestMonths.length?h('section.card.loan-interest-chart',h('div.section-head',h('div',h('h3','Juros recebidos'),h('p','Últimos meses com recebimento.'))),bars(interestMonths)):null);
    root.append(h('div.loan-list-head',h('div',h('h3','Contratos do mês'),h('p.muted.sm','Criação, vencimento ou pagamento no período selecionado.')),h('div.loan-filter-group',filter,sort)),listHost);draw();
  } else root.append(h('div.empty',h('b','Nenhum empréstimo cadastrado.'),h('p','Cadastre um empréstimo e acompanhe principal, juros, pagamentos e vencimentos.')));
}
export function openLoanForm(){if(store.loansEnabled())newLoan();}

function newInstallmentLoan(){
 const person=h('input.input',{maxlength:60,placeholder:'Nome do cliente'}),principal=h('input.input',{inputmode:'decimal',placeholder:'Ex.: 4.000,00'}),total=h('input.input',{inputmode:'decimal',placeholder:'Ex.: 8.000,00'}),count=h('input.input',{type:'number',min:2,max:120,value:10}),due=h('input.input',{type:'date',value:today()}),note=h('textarea.input',{rows:2,maxlength:180}),preview=h('div.loan-preview'),msg=h('p.form-msg');
 const update=()=>{try{const p=parseMoney(principal.value),terms=installmentTerms(p,parseMoney(total.value),Number(count.value),due.value),rows=installmentSchedule({id:'preview',principalOriginal:p,installmentPlan:terms});preview.replaceChildren(h('b',`${terms.count} parcelas de ${money(rows[0].amount)}`),h('p',`Valor emprestado: ${money(p)} · Juros do acordo: ${money(terms.total-p)} · Total: ${money(terms.total)}`),h('small','Valores divididos em centavos; pequenas diferenças de arredondamento aparecem nas parcelas.'));}catch{preview.textContent='Exemplo: emprestou R$ 4.000 e combinou R$ 8.000 em 10 parcelas de R$ 800.';}};
 [principal,total,count,due].forEach(x=>x.addEventListener('input',update));update();
 let busy=false;const sh=openSheet({title:'Empréstimo parcelado',subtitle:'Informe o total combinado com o cliente, já incluindo os juros.',content:h('div.form',field('Cliente',person),field('Valor emprestado',principal),field('Total combinado (com juros)',total),field('Número de parcelas',count),field('Primeiro vencimento',due),field('Observação',note),preview,msg),footer:[h('button.btn.primary',{type:'button',onclick:()=>{if(busy)return;try{if(!person.value.trim())throw Error('Informe o cliente.');const p=parseMoney(principal.value),terms=installmentTerms(p,parseMoney(total.value),Number(count.value),due.value);const capital=F.computeFresh(()=>F.capitalBalance(S()));if(p>capital+0.004)throw Error(`Capital insuficiente. Você possui ${money(Math.max(0,capital))} disponíveis.`);busy=true;store.commit(s=>{const id=uid(),createdAt=Date.now(),interest=round2(terms.total-p),name=person.value.trim();s.loans.push({id,person:name,principalOriginal:p,principal:p,interestMode:'fixed',interestFixed:interest,interestDue:interest,periodicity:'single',due:terms.firstDue,initialDue:terms.firstDue,status:'open',note:note.value.trim(),createdAt,installmentPlan:terms});s.loanCycles.push({id:uid(),loanId:id,date:today(),due:terms.firstDue,principal:p,interest,type:'created',createdAt});s.transactions.push({id:uid(),loanId:id,isLoan:true,loanAction:'created',transactionRole:'loan_principal_out',capitalManaged:true,type:'expense',value:p,date:today(),paidAt:today(),status:'Pago',method:'Capital',cat:'Dívidas e empréstimos',desc:`Empréstimo para ${name}`,createdAt});});sh.close();toast('Parcelamento criado e descontado do capital.');rerender();}catch(e){busy=false;msg.textContent=e.message;}}},'Criar parcelamento')]});
}
function openInstallmentSchedule(l){
 const current=S().loans.find(x=>x.id===l.id);if(!current)return;
 const rows=installmentSchedule(current,S().loanPayments),paid=rows.filter(x=>x.paid).length;
 let sh;const list=h('div.loan-installment-list',rows.map(row=>h('article.loan-installment-row'+(row.paid?'.paid':row.overdue?'.overdue':''),
  h('div',h('b',`Parcela ${row.number}/${rows.length}`),h('small',`Vence ${shortDate(row.due)} · ${row.paid?'Paga em '+shortDate(row.paidAt):row.overdue?'Vencida':'Pendente'}`),h('small',`Principal ${money(row.principal)} + juros ${money(row.interest)}`)),
  h('div',h('strong',money(row.amount)),row.paid?h('button.btn.sm',{type:'button',onclick:async()=>{const p=S().loanPayments.find(p=>p.id===row.paymentIds[0]);if(p){sh.close();await new Promise(resolve=>setTimeout(resolve,250));await deleteLoanPayment(current,p);setTimeout(()=>openInstallmentSchedule(current),250);}}},'Desfazer pagamento'):h('button.btn.sm.primary',{type:'button',onclick:()=>{sh.close();setTimeout(()=>receiveInstallment(current,row.number),160);}},'Marcar como paga')))));
 sh=openSheet({title:`Parcelas · ${current.person}`,subtitle:`${paid}/${rows.length} pagas · ${rows.length-paid} pendentes`,wide:true,content:h('div',h('section.loan-share-card',h('div.loan-share-total',h('span','Saldo pendente'),h('strong',money(totalDue(current)))),h('p',`Emprestado originalmente ${money(current.principalOriginal)} · Principal parcelado ${money(installmentPrincipal(current))} · Juros do acordo ${money(current.installmentPlan.total-installmentPrincipal(current))} · Total combinado ${money(current.installmentPlan.total)}`),progressBar(paid,rows.length,'Parcelas pagas')),list,installmentPreviousHistory(current)),footer:[h('button.btn.primary',{type:'button',onclick:()=>{sh.close();setTimeout(()=>shareLoan(current.id),250);}},'Compartilhar com cliente'),h('button.btn.ghost.danger-text',{type:'button',onclick:()=>deleteLoan(current,sh)},'Excluir contrato')]});
 sh.el.classList.add('loan-installment-sheet');
}
function receiveInstallment(l,number){
 const row=installmentSchedule(l,S().loanPayments).find(x=>x.number===number);if(!row)return;
 const date=h('input.input',{type:'date',value:today(),max:today()}),method=h('select.input',['PIX','Transferência','Dinheiro','Outro'].map(v=>h('option',{value:v},v))),msg=h('p.form-msg');let busy=false;
 const sh=openSheet({title:`Receber parcela ${number}/${l.installmentPlan.count}`,subtitle:l.person,content:h('div.form',h('p',`${money(row.amount)}: ${money(row.principal)} para o saldo de capital + ${money(row.interest)} de juros para o saldo geral.`),field('Data do pagamento',date),field('Forma de recebimento',method),msg),footer:[h('button.btn.primary',{type:'button',onclick:()=>{if(busy)return;try{busy=true;store.commit(s=>payInstallment(s,l.id,number,date.value,method.value));sh.close();toast('Parcela paga: juros no saldo geral e principal no capital.');rerender();setTimeout(()=>openInstallmentSchedule(S().loans.find(x=>x.id===l.id)),160);}catch(e){busy=false;msg.textContent=e.message;}}},'Confirmar pagamento')]});
}

function installmentPreviousHistory(loan){
 const previous=paidFor(S(),loan.id).filter(p=>paymentBeforeInstallmentAgreement(loan,p));
 if(!previous.length)return null;
 return h('details.card',h('summary',`Histórico anterior ao parcelamento (${previous.length})`),h('p.hint','Recebimentos preservados. Estes valores já foram considerados no saldo parcelado.'),...previous.map(p=>h('div.loan-event',h('div',h('b',paymentLabel(p)),h('small',shortDate(p.date)),h('small',`Principal ${money(p.principal)} · juros ${money(p.interest)}`)),h('strong',money(p.amount)))));
}
function parcelOpenLoan(l){
 const current=S().loans.find(x=>x.id===l.id);if(!current||isPaid(current)||current.installmentPlan)return;
 const total=h('input.input',{inputmode:'decimal',value:totalDue(current).toLocaleString('pt-BR',{minimumFractionDigits:2})}),count=h('input.input',{type:'number',min:2,max:120,value:10}),due=h('input.input',{type:'date',value:current.due||today()}),preview=h('div.loan-preview'),msg=h('p.form-msg',{role:'alert'});
 const update=()=>{try{const terms=installmentTerms(current.principal,parseMoney(total.value),Number(count.value),due.value,{allowZeroPrincipal:true}),rows=installmentSchedule({id:'preview',principalOriginal:current.principal,installmentPlan:terms});preview.replaceChildren(h('b',`${terms.count} parcelas · primeira de ${money(rows[0].amount)}`),h('p',`Principal restante ${money(current.principal)} · juros do novo acordo ${money(terms.total-current.principal)} · total ${money(terms.total)}`));}catch(e){preview.textContent=e.message;}};
 [total,count,due].forEach(x=>x.addEventListener('input',update));update();let busy=false;
 const sh=openSheet({title:`Parcelar saldo · ${current.person}`,subtitle:'Transforme a dívida em parcelas, mantendo o histórico.',content:h('div.form',h('p.notice',`Saldo atual: ${money(totalDue(current))} (${money(current.principal)} de principal + ${money(interestDue(current))} de juros). O total abaixo substitui os juros pendentes pelo novo acordo. Você estará parcelando apenas o saldo que falta pagar.`),field('Total do novo acordo (com juros)',total),field('Número de parcelas',count),field('Primeiro vencimento',due),preview,msg),footer:[h('button.btn.primary',{type:'button',onclick:()=>{if(busy)return;try{const terms=installmentTerms(current.principal,parseMoney(total.value),Number(count.value),due.value,{allowZeroPrincipal:true});busy=true;store.commit(s=>parcelExistingLoan(s,current.id,terms.total,terms.count,terms.firstDue));sh.close();toast('Saldo parcelado. Histórico preservado.');setTimeout(()=>openInstallmentSchedule(S().loans.find(x=>x.id===current.id)),250);}catch(e){busy=false;msg.textContent=e.message;}}},'Confirmar parcelamento')]});
}
