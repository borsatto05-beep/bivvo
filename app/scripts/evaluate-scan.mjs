/* Avalia resultados já coletados. Não envia fotos nem faz chamadas pagas. */
import fs from 'node:fs';
import path from 'node:path';
export function evaluateScan(labels,predictions,{inputPrice=null,outputPrice=null}={}) {
 const byId=new Map(predictions.map(x=>[x.id,x]));
 let exact=0,missing=0,errorsFlagged=0,wrong=0,reviewed=0,tokensIn=0,tokensOut=0,hasTokens=true;
 const durations=[];
 for(const item of labels) {
  const p=byId.get(item.id);if(!p){missing++;hasTokens=false;continue;}
  const correct=item.value==null ? p.value==null : p.value!=null && Math.abs(item.value-p.value)<.009;
  const review=(p.reviewFields || []).includes('value');
  if(correct)exact++;else{wrong++;if(review)errorsFlagged++;}
  if(review)reviewed++;
  if(Number.isFinite(p.durationMs))durations.push(p.durationMs);
  if(Number.isFinite(p.usage?.inputTokens)&&Number.isFinite(p.usage?.outputTokens)) {tokensIn+=p.usage.inputTokens;tokensOut+=p.usage.outputTokens;} else hasTokens=false;
 }
 durations.sort((a,b)=>a-b);
 const percentile=q=>durations.length?durations[Math.ceil((durations.length-1)*q)]:null;
 return {samples:labels.length,matched:labels.length-missing,missing,exactAmounts:exact,amountAccuracy:labels.length?exact/labels.length:null,wrongAmounts:wrong,wrongAmountsFlagged:errorsFlagged,reviewRate:labels.length?reviewed/labels.length:null,p50Ms:percentile(.5),p95Ms:percentile(.95),inputTokens:hasTokens?tokensIn:null,outputTokens:hasTokens?tokensOut:null,estimatedCostUsd:hasTokens&&Number.isFinite(inputPrice)&&Number.isFinite(outputPrice)?(tokensIn*inputPrice+tokensOut*outputPrice)/1e6:null};
}
if(process.argv[1] && path.resolve(process.argv[1])===path.resolve(new URL(import.meta.url).pathname)) {
 const [labelsPath,predictionsPath]=process.argv.slice(2);
 if(!labelsPath||!predictionsPath){console.error('Uso: npm run evaluate:scan -- labels.json predictions.json');process.exitCode=1;}
 else {
  const labels=JSON.parse(fs.readFileSync(labelsPath,'utf8')),predictions=JSON.parse(fs.readFileSync(predictionsPath,'utf8'));
  console.log(JSON.stringify({datasetType:labels.datasetType || 'unspecified',...evaluateScan(labels.items || labels,predictions.items || predictions,{inputPrice:process.env.SCAN_INPUT_USD_PER_MILLION?Number(process.env.SCAN_INPUT_USD_PER_MILLION):null,outputPrice:process.env.SCAN_OUTPUT_USD_PER_MILLION?Number(process.env.SCAN_OUTPUT_USD_PER_MILLION):null})},null,2));
 }
}
