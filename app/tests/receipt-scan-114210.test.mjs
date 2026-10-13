import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
const require=createRequire(import.meta.url);
const root=path.resolve(new URL('..',import.meta.url).pathname);
const fn=require(path.join(root,'netlify/functions/scan-receipt.js'));
const T=fn._test;
let pass=0,fail=0; const t=(n,ok)=>{if(ok){console.log('✓',n);pass++;}else{console.error('✗',n);fail++;}};

const mk=(value,extra={})=>T.normalizeRaw({is_receipt:true,receipt_type:'Cupom fiscal',value_label:'TOTAL',value_text:`R$ ${Number(value).toFixed(2).replace('.',',')}`,value,amount_candidates:[{value,value_text:`R$ ${Number(value).toFixed(2).replace('.',',')}`,label:'TOTAL',context:`TOTAL R$ ${Number(value).toFixed(2).replace('.',',')}`,role:'total_paid',confidence:.95}],date:'2026-10-06',merchant:'Mercado Bom',description:'Compra',payment_method:'PIX',installments:null,category_hint:'Mercado',confidence:.9,confidence_value:.95,confidence_merchant:.9,confidence_date:.9,confidence_payment_method:.85,confidence_category:.8,evidence_value:`TOTAL R$ ${Number(value).toFixed(2).replace('.',',')}`,...extra});
const a=mk(83.70), b=mk(83.70,{confidence:.92,confidence_value:.97});
let m=T.mergeReads(a,b,{issues:[],autoCrop:true,perspectiveCorrected:true,paperCoverage:.7},{detected:false,kind:null},null);
t('duas leituras independentes mantêm total consensual',m.value===83.7);
t('consenso de duas leituras é registrado',m.scanMeta.consensusCount>=2&&m.scanMeta.readers>=2);
t('one shot é sinalizado',m.scanMeta.oneShot===true);
t('alta confiança não exige revisão de valor',!m.reviewFields.includes('value'));

const c=mk(18.90,{confidence_value:.9});
t('conflito entre leitores chama juiz',T.needsJudge(a,c,{issues:[]},{detected:false})===true);
const judge=mk(83.70,{confidence:.96,confidence_value:.98});
m=T.mergeReads(a,c,{issues:[]},{detected:false,kind:null},judge);
t('juiz resolve conflito para valor sustentado',m.value===83.7&&m.scanMeta.judgeUsed===true);
t('juiz de alta confiança evita revisão de valor',!m.reviewFields.includes('value'));

const low=T.normalizeRaw({is_receipt:true,value:null,value_text:null,amount_candidates:[{value:50,value_text:'R$ 50,00',label:'SUBTOTAL',role:'subtotal',confidence:.93},{value:47.5,value_text:'R$ 47,50',label:'TOTAL A PAGAR',role:'total_paid',confidence:.96}],merchant:'Loja',confidence:.6,confidence_value:.2,confidence_merchant:.7,confidence_date:0,confidence_payment_method:0,confidence_category:0});
t('candidato semântico TOTAL pode recuperar valor',low.value===47.5);

const qr={detected:true,kind:'pix_qr',amount:125.4,merchantName:'PADARIA XPTO',merchantCity:'RIO'};
const qa=mk(125.4,{receipt_type:'Pix',merchant:null,confidence_merchant:0});
const qb=mk(125.4,{receipt_type:'Pix',merchant:null,confidence_merchant:0});
m=T.mergeReads(qa,qb,{issues:[]},qr,null);
t('QR Pix confirma valor estruturado',m.value===125.4&&m.scanMeta.qrAmountMatches===true&&m.scanMeta.qrAmountUsed===false);
t('QR Pix pode preencher recebedor quando imagem não lê',m.merchant==='PADARIA XPTO');

const client=fs.readFileSync(path.join(root,'js/scan.js'),'utf8');
const server=fs.readFileSync(path.join(root,'netlify/functions/scan-receipt.js'),'utf8');
const confirm=fs.readFileSync(path.join(root,'js/views/scanconfirm.js'),'utf8');
t('uma foto gera cinco evidências internas quando couber',/header_detail/.test(client)&&/center_detail/.test(client)&&/total_detail/.test(client)&&/slice\(0,5\)/.test(server));
t('scanner tenta extrair valor estruturado de QR Pix',/parsePixQr/.test(client)&&/qrAmountUsed/.test(server));
t('terceiro juiz só entra em conflito',/needsJudge/.test(server)&&/JUDGE_PROMPT/.test(server));
t('prompt exige candidatos monetários com papel semântico',/amount_candidates/.test(server)&&/total_paid/.test(server));
t('falha não manda usuário tirar outra foto',!/tente novamente ou tire outra foto/i.test(server));

console.log(`\n${pass}/${pass+fail} testes Scan 11.43.0 passaram`); if(fail)process.exit(1);
