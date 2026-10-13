import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),qr=require('../netlify/lib/receipt-qr.js');
const key='33261006947567000156654030009000759009000753';
const url=`https://www.fazenda.rj.gov.br/nfce/qrcode?p=${key}|2|1|04|83.54||1|hash`;
assert.equal(key.length,44);
assert.deepEqual(qr.parse(url).data,{merchant:null,date:'2026-10-04',value:83.54});
assert.equal(qr.parse(`https://www.fazenda.rj.gov.br/nfce/qrcode?p=${key}|2|1|1|hash`).data.value,null,'online CSC is not the amount');
assert.equal(qr.parse(url.replace('|04|','|32|')).data.date,null);
for(const bad of ['https://fazenda.rj.gov.br.evil.test/a','http://127.0.0.1','https://evil.test','https://user@fazenda.rj.gov.br/a','https://fazenda.rj.gov.br:8080/a'])assert.equal(qr.fiscalUrl(bad),null);
assert.deepEqual(qr.pageData('<emit><xNome>Mercado teste</xNome></emit><dhEmi>2026-10-04T11:27:48-03:00</dhEmi><ICMSTot><vNF>60.97</vNF></ICMSTot>'),{merchant:'Mercado teste',date:'2026-10-04',value:60.97});
assert.deepEqual(qr.pageData('<span class="txtTopo">Mercado teste</span><span class="totalNumb">60,97</span><p>Emissão: 04/10/2026 11:27</p>'),{merchant:'Mercado teste',date:'2026-10-04',value:60.97});
const original=global.fetch;let calls=0;
try{
 global.fetch=async()=>{calls++;return new Response('Não foi possível realizar a consulta. Erro na formação do QR Code: Valor Total da NF R$: 999,99');};
 assert.deepEqual(await qr.resolve(url),{merchant:null,date:'2026-10-04',value:83.54});
 global.fetch=async()=>{calls++;return new Response(null,{status:302,headers:{location:'http://127.0.0.1/private'}});};calls=0;await qr.resolve(url);assert.equal(calls,1,'redirect to private network is never fetched');
 global.fetch=async()=>{throw Error('offline');};assert.equal((await qr.resolve(url)).value,83.54);
}finally{global.fetch=original;}
console.log('QR: offline fields, online QR, dates, fiscal page/XML, failed consultation, redirects and offline preservation passed.');
