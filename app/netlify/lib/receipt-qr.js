/* QR é dado não confiável: consulta restrita aos portais fiscais oficiais. */
const clean = s => typeof s==='string'?s.replace(/[<>\u0000-\u001f]/g,'').trim().slice(0,100)||null:null;
const date = s => /^\d{4}-\d{2}-\d{2}$/.test(s||'') && Number.isFinite(Date.parse(s)) && new Date(s).toISOString().slice(0,10)===s?s:null;
const amount = s => {let t=String(s??'').replace(/[^\d.,]/g,'');if(t.includes(','))t=t.replace(/\./g,'').replace(',','.');const n=Number(t);return n>0&&n<1e7?Math.round(n*100)/100:null;};
function fiscalUrl(raw){
 try{const u=new URL(raw);if(!['http:','https:'].includes(u.protocol)||u.username||u.password||u.port||!/^([a-z0-9-]+\.)*(fazenda|sefaz)\.[a-z]{2}\.gov\.br$/.test(u.hostname))return null;return u;}catch{return null;}
}
function parse(raw){
 const data={merchant:null,date:null,value:null};raw=String(raw||'').trim();
 const u=fiscalUrl(raw);
 if(u){
  const p=(u.searchParams.get('p')||'').split('|'),key=p[0];
  // QR NFC-e v2 offline: chave|versão|ambiente|dia|total|digVal|CSC|hash.
  if(/^\d{44}$/.test(key)&&key.slice(20,22)==='65'&&p[1]==='2'&&p.length>=8){
   data.value=amount(p[4]);
   if(/^\d{2}$/.test(p[3]))data.date=date(`20${key.slice(2,4)}-${key.slice(4,6)}-${p[3]}`);
  }
  return {data,url:u.href,kind:'nfce'};
 }
 const tlv=t=>{const o={};let i=0;while(i+4<=t.length){const k=t.slice(i,i+2),l=t.slice(i+2,i+4);if(!/^\d{2}$/.test(k)||!/^\d{2}$/.test(l)||i+4+Number(l)>t.length)break;o[k]=t.slice(i+4,i+4+Number(l));i+=4+Number(l);}return o;};
 const tags=tlv(raw);let pix=false;for(let i=26;i<=51;i++){if((tlv(tags[i]||'')['00']||'').toLowerCase()==='br.gov.bcb.pix')pix=true;}
 if(pix){data.merchant=clean(tags['59']);data.value=amount(tags['54']);}
 return {data,url:null,kind:pix?'pix':null};
}
function pageData(html){
 const decode=s=>s.replace(/&nbsp;|&#160;/gi,' ').replace(/&amp;/gi,'&').replace(/&quot;/gi,'"').replace(/&#(\d+);/g,(_,n)=>String.fromCharCode(Number(n)));
 const tag=(text,name)=>{const m=text.match(new RegExp('<(?:\\w+:)?'+name+'(?:\\s[^>]*)?>([\\s\\S]*?)</(?:\\w+:)?'+name+'>','i'));return m?decode(m[1].replace(/<[^>]+>/g,'')).trim():null;};
 const issuer=html.match(/<(?:\w+:)?emit(?:\s[^>]*)?>([\s\S]*?)<\/(?:\w+:)?emit>/i)?.[1];
 const text=decode(html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,'').replace(/<[^>]+>/g,'\n')).replace(/[\t \r]+/g,' ').replace(/\n\s*\n/g,'\n');
 const failed=/não foi possível realizar a consulta|erro na formação do qr|captcha/i.test(text);
 if(failed)return {merchant:null,date:null,value:null};
 const top=html.match(/<[^>]+class=["'][^"']*\btxtTopo\b[^"']*["'][^>]*>([\s\S]*?)<\//i)?.[1];
 const money=text.match(/(?:valor\s*(?:total|pago)|total\s*(?:da\s*(?:nota|nf))?)[^\d]{0,60}([\d.,]+)/i)?.[1];
 const total=html.match(/<[^>]+class=["'][^"']*\btotalNumb\b[^"']*["'][^>]*>([\s\S]*?)<\//i)?.[1];
 const dm=text.match(/(?:emiss[aã]o|data\s*(?:da\s*)?compra)[^\d]{0,40}(\d{2})\/(\d{2})\/(\d{4})/i);
 const iso=tag(html,'dhEmi')||tag(html,'dEmi');
 return {merchant:clean(issuer?tag(issuer,'xFant')||tag(issuer,'xNome'):top?decode(top.replace(/<[^>]+>/g,'')):null),date:date(iso?.slice(0,10)|| (dm?`${dm[3]}-${dm[2]}-${dm[1]}`:'')),value:amount(tag(html,'vNF')||total||money)};
}
async function resolve(raw,{diagnostics={}}={}){
 const info=parse(raw);let data=info.data;
 diagnostics.qrStatus=info.kind?'data_only':raw?'unsupported':'not_detected';
 if(info.url){
  diagnostics.qrStatus='querying';
  const ctrl=new AbortController(),timer=setTimeout(()=>ctrl.abort(),5500);
  try{
   let url=info.url;
   for(let i=0;i<3;i++){
    if(!fiscalUrl(url)){diagnostics.qrStatus='blocked_redirect';break;}
    const r=await fetch(url,{signal:ctrl.signal,redirect:'manual',headers:{Accept:'text/html,application/xml'}});
    if([301,302,303,307,308].includes(r.status)){const loc=r.headers.get('location');if(!loc)break;url=new URL(loc,url).href;continue;}
    if(!r.ok){diagnostics.qrStatus='http_'+r.status;break;}
    if(Number(r.headers.get('content-length'))>1_000_000)break;
    const reader=r.body?.getReader();let text='',size=0;
    if(reader){const decoder=new TextDecoder();while(true){const chunk=await reader.read();if(chunk.done)break;size+=chunk.value.length;if(size>1_000_000){await reader.cancel();throw new Error('QR_PAGE_SIZE');}text+=decoder.decode(chunk.value,{stream:true});}text+=decoder.decode();}else text=await r.text();
    diagnostics.qrStatus=/erro na forma[çc][aã]o do qr/i.test(text)?'invalid_qr':/captcha/i.test(text)?'captcha':'empty_page';
    const found=pageData(text);if(Object.values(found).some(x=>x!=null))diagnostics.qrStatus='resolved';data={merchant:found.merchant||data.merchant,date:found.date||data.date,value:found.value??data.value};break;
   }
  }catch(e){diagnostics.qrStatus=e.name==='AbortError'?'timeout':'connection_error';}finally{clearTimeout(timer);}
 }
 return data;
}
module.exports={parse,resolve,fiscalUrl,pageData};
