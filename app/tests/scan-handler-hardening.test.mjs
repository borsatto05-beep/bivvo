import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url), fn=require('../netlify/functions/scan-receipt.js');
process.env.SUPABASE_SECRET_KEY='test';process.env.GEMINI_API_KEY='test';
let raw={},reader=0,refunded=0,mode='ok',plan='plus';const saved=global.fetch;
const image=Buffer.concat([Buffer.from([255,216,255]),Buffer.alloc(900)]).toString('base64');
const event={httpMethod:'POST',headers:{authorization:'Bearer test'},body:JSON.stringify({images:[{mediaType:'image/jpeg',image}]})};
global.fetch=async(url,opts={})=>{
 if(url.endsWith('/auth/v1/user'))return Response.json({id:'user'});
 if(url.includes('/rpc/bivvo_rate_limit'))return Response.json(true);
 if(url.includes('/entitlements?'))return Response.json(plan==='free'?[]:[{plan}]);
 if(url.includes('/rpc/bivvo_consume_usage'))return Response.json(1);
 if(url.includes('/rpc/bivvo_refund_usage')){refunded++;return new Response(null,{status:204});}
 if(url.startsWith('https://www.fazenda.rj.gov.br/')) return new Response(mode==='fiscal-page'?'<emit><xNome>QR Loja</xNome></emit><dhEmi>2026-10-04T11:27:48-03:00</dhEmi><vNF>83.54</vNF>':'Não foi possível realizar a consulta.');
 if(url.includes('generativelanguage.googleapis.com')){
  reader++;const config=JSON.parse(opts.body).generationConfig;
  assert.deepEqual(Object.keys(config.responseSchema.properties).sort(),['date','merchant','value']);
  if(url.includes('gemini-2.5'))assert.equal(config.thinkingConfig.thinkingBudget,0);
  if(mode==='failure')return new Response('',{status:503});
  if(mode==='old-model'&&url.includes('gemini-3.6'))return new Response('',{status:404});
  return Response.json({candidates:[{content:{parts:[{thought:true,text:'internal reasoning'}, {text:JSON.stringify(raw)}]}}]});
 }
 throw new Error('Unexpected '+url);
};
try{
 const fields={merchant:'Loja teste',date:'2026-10-06',value:83.7};
 raw=fields;plan='free';let locked=await fn.handler(event);assert.equal(locked.statusCode,200);assert.equal(reader,1);plan='plus';
 for(let mask=1;mask<8;mask++){
  raw=Object.fromEntries(Object.entries(fields).map(([k,v],i)=>[k,mask&(1<<i)?v:null]));reader=0;
  const response=await fn.handler(event);assert.equal(response.statusCode,200);assert.deepEqual(JSON.parse(response.body).data,raw);assert.equal(reader,1);
 }
 raw={merchant:null,date:'2026-02-30',value:null};let response=await fn.handler(event);assert.equal(JSON.parse(response.body).data.date,null);assert.equal(refunded,1);
 mode='failure';response=await fn.handler(event);assert.equal(response.statusCode,504);assert.equal(JSON.parse(response.body).code,'ai_unavailable');assert.equal(refunded,2);
 mode='old-model';process.env.GEMINI_MODEL='gemini-3.6-flash';raw=fields;reader=0;response=await fn.handler(event);assert.equal(response.statusCode,200);assert.equal(reader,2);assert.deepEqual(JSON.parse(response.body).data,fields);
 const qrEvent={...event,body:JSON.stringify({images:[{mediaType:'image/jpeg',image}],qr:{raw:'https://www.fazenda.rj.gov.br/nfce/qrcode?p=33261006947567000156654030009000759009000753|2|1|04|83.54||1|hash'}})};
 delete process.env.GEMINI_MODEL;mode='ok';raw={merchant:'AI Loja',date:'2026-10-06',value:999};
 response=await fn.handler(qrEvent);assert.deepEqual(JSON.parse(response.body).data,{merchant:'AI Loja',date:'2026-10-04',value:83.54},'QR wins; AI fills only missing name');
 delete process.env.GEMINI_API_KEY;mode='failure';reader=0;response=await fn.handler(qrEvent);assert.equal(response.statusCode,200);assert.equal(JSON.parse(response.body).data.value,83.54);assert.equal(reader,0);
 mode='fiscal-page';response=await fn.handler(qrEvent);assert.deepEqual(JSON.parse(response.body).data,{merchant:'QR Loja',date:'2026-10-04',value:83.54});
}finally{global.fetch=saved;delete process.env.GEMINI_MODEL;}
console.log('Scanner: all seven partial combinations, invalid date, refund, thought filtering, legacy model fallback passed.');
