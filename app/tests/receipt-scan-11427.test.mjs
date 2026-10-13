import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const root = path.resolve(new URL('..', import.meta.url).pathname);
const scanFn = require(path.join(root, 'netlify/functions/scan-receipt.js'));
const T = scanFn._test;
let pass=0, fail=0;
const t=(name,ok)=>{if(ok){console.log('✓',name);pass++;}else{console.error('✗',name);fail++;}};

// Conversão monetária brasileira
t('R$ 1.234,56 vira 1234.56', T.toNumber('R$ 1.234,56') === 1234.56);
t('83,70 vira 83.70', T.toNumber('83,70') === 83.70);

const a=T.normalizeRaw({is_receipt:true,value_text:'R$ 83,70',value:83.7,date:'2026-10-06',merchant:'Mercado',description:'Compra',payment_method:'PIX',installments:null,category_hint:'Mercado',confidence:.82});
const b=T.normalizeRaw({is_receipt:true,value_text:'83,70',value:83.7,date:'2026-10-06',merchant:'Mercado',description:'Compra',payment_method:'PIX',installments:null,category_hint:'Mercado',confidence:.9});
const agreed=T.mergeReads(a,b,{issues:[]});
t('duas leituras iguais mantêm valor', agreed.value === 83.7);
t('consenso não inventa aumento de confiança', agreed.confidence === .9);
t('retry interno é sinalizado', agreed.autoRetried === true);

const c=T.normalizeRaw({is_receipt:true,value_text:'R$ 18,90',value:18.9,date:null,merchant:null,description:null,payment_method:null,installments:null,category_hint:null,confidence:.76});
const conflict=T.mergeReads(a,c,{issues:['possibly_blurry']});
t('conflito retorna duas opções de valor', conflict.valueOptions.length === 2 && conflict.valueOptions.includes(83.7) && conflict.valueOptions.includes(18.9));
t('conflito exige revisão por mismatch', conflict.mismatch === true && conflict.reviewFields.includes('value') && conflict.confidence <= .65);
t('diagnóstico de qualidade é preservado', conflict.qualityIssues.includes('possibly_blurry'));

const noValue=T.normalizeRaw({is_receipt:true,value_text:null,value:null,date:null,merchant:'Loja',description:null,payment_method:null,installments:null,category_hint:null,confidence:.4});
const manual=T.mergeReads(noValue,null,{issues:['low_contrast']});
t('comprovante sem total ainda retorna para edição manual', manual && manual.value === null && manual.merchant === 'Loja');

const client=fs.readFileSync(path.join(root,'js/scan.js'),'utf8');
const confirm=fs.readFileSync(path.join(root,'js/views/scanconfirm.js'),'utf8');
const server=fs.readFileSync(path.join(root,'netlify/functions/scan-receipt.js'),'utf8');
t('cliente gera versão colorida e melhorada', /variant:\s*'color'/.test(client) && /variant:\s*'enhanced'/.test(client));
t('resolução máxima aumentou para 2200px', /MAX_COLOR = 2200/.test(client));
t('cliente mede nitidez/contraste antes do envio', /possibly_blurry/.test(client) && /low_contrast/.test(client));

console.log(`\n${pass}/${pass+fail} testes Scan 11.42.7 passaram`);
if(fail) process.exit(1);
