/* Leitura de texto no aparelho. Não envia a foto para outro serviço. */
const empty = () => ({merchant:null,date:null,value:null});
const validDate = d => /^\d{4}-\d{2}-\d{2}$/.test(d) && Number.isFinite(Date.parse(d)) && new Date(d).toISOString().slice(0,10)===d;
export function parseReceiptText(text) {
  const data=empty(),lines=String(text||'').split(/\r?\n/).map(s=>s.trim()).filter(Boolean);
  const plain=lines.join('\n');
  if(/erro na forma[çc][aã]o do qr|não foi possível realizar a consulta/i.test(plain))return data;
  if(!/cnpj|cupom|nfc.?e|comprovante|valor\s+(?:total|pago)|total\s+a\s+pagar/i.test(plain))return data;
  const dates=[...plain.matchAll(/\b(\d{2})[\/-](\d{2})[\/-](20\d{2})\b/g)].map(m=>`${m[3]}-${m[2]}-${m[1]}`).filter(validDate);
  if(new Set(dates).size===1)data.date=dates[0];
  const candidates=[];
  for(let i=0;i<lines.length;i++){
    const l=lines[i].normalize('NFD').replace(/[\u0300-\u036f]/g,'');
    if(/subtotal|troco|desconto|valor\s*unit|tribut/i.test(l))continue;
    const m=l.match(/valor\s*(?:total|pago|da\s*(?:compra|transacao))|total\s*(?:a\s*pagar|da\s*(?:compra|nota))?\b/i);
    if(!m)continue;
    const nearby=lines.slice(i,i+3).join(' '),tail=nearby.slice(m.index+m[0].length);
    const numbers=[...tail.matchAll(/(?:R\$\s*)?(\d{1,3}(?:[.,]\d{3})*[.,]\d{2}|\d+[.,]\d{2})(?!\d)/g)];
    if(!numbers.length)continue;
    let s=numbers[0][1];if(s.includes(','))s=s.replace(/\./g,'').replace(',','.');
    const n=Number(s);if(n>0&&n<1e7)candidates.push(Math.round(n*100)/100);
  }
  if(new Set(candidates).size===1)data.value=candidates[0];
  for(let i=0;i<Math.min(12,lines.length);i++){
    let l=lines[i];
    if(/cnpj/i.test(l))l=l.replace(/^.*?cnpj\s*[:.]?\s*[\d\s./-]+/i,'');
    if(/^[\s\d./-]*$/.test(l)||/cnpj|documento|auxiliar|consumidor|endere[cç]o|inscri[cç]|^\s*(?:rua|av\.?|avenida|estrada|rodovia|ie\s*[:.]|i\.e\.)/i.test(l))continue;
    if(/[a-z]{3}/i.test(l)&&(/(?:mercado|mercearia|padaria|loja|farm[aá]cia|restaurante|ltda|com[eé]rcio|supermercado|posto|bar\b)/i.test(l)||/cnpj/i.test(lines[i]))) {data.merchant=l.replace(/[<>\u0000-\u001f]/g,'').trim().slice(0,100)||null;break;}
  }
  return data;
}
export async function readLocalText(image, {timeoutMs=25000}={}) {
  let worker=null,expired=false,timer;
  const job=(async()=>{
    await import('./vendor/tesseract.js');
    worker=await window.Tesseract.createWorker('eng',1,{
      workerPath:new URL('./vendor/tesseract-worker.js',import.meta.url).href,
      corePath:'https://cdn.jsdelivr.net/npm/tesseract.js-core@6.0.0',
      langPath:'https://cdn.jsdelivr.net/npm/@tesseract.js-data/eng@1.0.0/4.0.0_best_int',
      workerBlobURL:false,
      errorHandler:()=>{},logger:()=>{}
    });
    if(expired){await worker.terminate();return {data:empty(),status:'timeout'};}
    await worker.setParameters({tessedit_pageseg_mode:'3',preserve_interword_spaces:'1'});
    const result=await worker.recognize(image);
    return {data:parseReceiptText(result.data.text),status:'read'};
  })().catch(()=>({data:empty(),status:'unavailable'}));
  try{return await Promise.race([job,new Promise(resolve=>{timer=setTimeout(()=>{expired=true;resolve({data:empty(),status:'timeout'});},timeoutMs);})]);}
  finally{clearTimeout(timer);if(worker)await worker.terminate().catch(()=>{});}
}
