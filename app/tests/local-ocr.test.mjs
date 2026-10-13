import assert from 'node:assert/strict';
import {parseReceiptText} from '../js/receipt-ocr.js';
const receipt=`MINIMERCADO LIDER LTDA
CNPJ: 06.347.567/0001-56
ESTRADA SAO JOAO MARCOS 18
Documento Auxiliar da NFC-e
ITEM 1 9,99
Valor total R$ 60,97
VALOR PAGO R$ 60,97
04/10/2026 11:27:48`;
assert.deepEqual(parseReceiptText(receipt),{merchant:'MINIMERCADO LIDER LTDA',date:'2026-10-04',value:60.97});
assert.equal(parseReceiptText(receipt.replace('60,97\nVALOR PAGO R$ 60,97','60,97\nVALOR PAGO R$ 83,54')).value,null,'conflicting totals stay empty');
assert.equal(parseReceiptText(receipt.replace('04/10/2026','30/02/2026')).date,null);
assert.equal(parseReceiptText(receipt.replace('Valor total R$ 60,97\nVALOR PAGO R$ 60,97','Troco R$ 60,97')).value,null);
assert.deepEqual(parseReceiptText('Erro na formação do QR Code Valor Total 83,54'),{merchant:null,date:null,value:null});
assert.equal(parseReceiptText('CNPJ: 06.347.567/0001-56 MERCADO TESTE LTDA\nValor total 23,45').merchant,'MERCADO TESTE LTDA');
console.log('Local OCR parser: merchant/date/total, invalid date, ambiguity, change and fiscal error passed.');
