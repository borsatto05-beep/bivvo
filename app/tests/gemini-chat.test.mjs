import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const calls=[],refunds=[];
const sandbox={exports:{},process:{env:{GEMINI_API_KEY:'test-key',GEMINI_ASSISTANT_MODEL:'gemini-2.5-flash'}},console,setTimeout,clearTimeout,AbortController,fetch:async(url,options)=>{calls.push({url,options});return {ok:true,json:async()=>({candidates:[{content:{parts:[{text:'Seu saldo livre é R$ 100,00. Confira as próximas contas antes de gastar.'}]}}]})};},require:name=>name.includes('supabase-admin')?{adminKey:()=>true,userFromJwt:async()=>({id:'test'}),rateLimit:async()=>true,rest:async(path)=>{if(path.includes('refund'))refunds.push(path);return 1;}}:{limitsOf:async()=>({plan:'plus',ai:10,aiTier:1}),period:()=> '2026-10'}};
vm.runInNewContext(fs.readFileSync('netlify/functions/assistant.js','utf8'),sandbox);
const tools={spendable:{free:100,balance:300},month:{spend:200},forecast:{day30:100},quality:{transactions:3,cards:1,hasBalanceBase:true}};
const response=await sandbox.exports.handler({httpMethod:'POST',headers:{authorization:'Bearer test'},body:JSON.stringify({question:'Quanto posso gastar?',tools})});
const data=JSON.parse(response.body);assert.equal(response.statusCode,200);assert.equal(data.provider,'gemini');assert.match(data.answer,/saldo livre/);assert.equal(calls.length,1);assert.match(calls[0].url,/generativelanguage.googleapis.com/);assert.equal(calls[0].options.headers['x-goog-api-key'],'test-key');assert.equal(refunds.length,0);
sandbox.fetch=async()=>({ok:true,json:async()=>({candidates:[{content:{parts:[{text:'Seu saldo é R$ 999,00.'}]}}]})});
const bad=JSON.parse((await sandbox.exports.handler({httpMethod:'POST',headers:{authorization:'Bearer test'},body:JSON.stringify({question:'Qual meu saldo?',tools})})).body);assert.equal(bad.verified,false);assert.equal(bad.provider,undefined);assert.equal(refunds.length,1);
console.log('Gemini: resposta do provedor identificada; valor incompatível rejeitado com devolução de cota.');

for(const unsafe of [{...tools,transactions:[]},{...tools,quality:{transactions:[{value:100}]}},{...tools,quality:{transactions:'3'}},{...tools,quality:{transactions:-1}},{...tools,nested:{merchant:'Loja'}}]){
 const result=await sandbox.exports.handler({httpMethod:'POST',headers:{authorization:'Bearer test'},body:JSON.stringify({question:'Qual meu saldo?',tools:unsafe})});
 assert.equal(result.statusCode,400);
}
console.log('Resumo com contador real aceito; extrato bruto e contadores inválidos bloqueados.');
