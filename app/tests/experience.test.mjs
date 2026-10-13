import assert from 'node:assert/strict';
import {matchesTransaction,canFavorite} from '../js/experience.js';
const tx={id:'test',type:'expense',desc:'Padaria São João',cat:'Alimentação',date:'2026-09-03',method:'Débito',value:1234.56};
for(const q of ['sao joao','padaria alimentação','1.234,56','1234.56','03/09/2026','2026-09-03','debito'])assert(matchesTransaction(tx,q),q);
assert(!matchesTransaction(tx,'sao farmacia'));assert(canFavorite(tx));
for(const extra of [{method:'Crédito'},{kind:'save'},{transactionRole:'loan_principal_out'},{loanPaymentId:'payment'},{locked:true},{type:'income'}])assert(!canFavorite({...tx,...extra}));
assert(!canFavorite(null));console.log('Experience: accent, amount/date/multiple-term search and protected transaction favorite rules passed.');
