const SUPABASE_URL='https://gqfirbhzjuzspermyvfy.supabase.co';
const PUBLIC_KEY=process.env.SUPABASE_PUBLISHABLE_KEY||'sb_publishable_AGD0F361Dci_rgnplWctlg_cD_9vUoz';
async function persistentLimit(key){
  const service=String(process.env.SUPABASE_SERVICE_ROLE_KEY||'').trim();
  if(!service) throw new Error('Rate limit persistente não configurado.');
  const r=await fetch(SUPABASE_URL+'/rest/v1/rpc/bivvo_rate_limit',{method:'POST',headers:{apikey:service,Authorization:'Bearer '+service,'Content-Type':'application/json'},body:JSON.stringify({p_key:key,p_limit:30,p_window_seconds:60})});
  if(!r.ok) throw new Error('Falha no rate limiter.');
  return await r.json();
}
exports.handler=async function(event){
  const headers={'Content-Type':'application/json','Cache-Control':'no-store, max-age=0','X-Content-Type-Options':'nosniff'};
  const out=(statusCode,body)=>({statusCode,headers,body:JSON.stringify(body)});
  if(event.httpMethod!=='GET')return out(405,{error:'Método não permitido.'});
  const jwt=String(event.headers.authorization||'').replace(/^Bearer\s+/i,'').trim();
  if(!jwt)return out(401,{error:'Faça login para consultar cotações.'});
  const vr=await fetch(SUPABASE_URL+'/auth/v1/user',{headers:{apikey:PUBLIC_KEY,Authorization:'Bearer '+jwt}}).catch(()=>null);
  if(!vr||!vr.ok)return out(401,{error:'Sessão inválida ou expirada.'});
  const user=await vr.json().catch(()=>null); if(!user?.id)return out(401,{error:'Sessão inválida.'});
  const ip=String(event.headers['x-nf-client-connection-ip']||event.headers['x-forwarded-for']||'unknown').split(',')[0].trim();
  try{if(!(await persistentLimit('quote:'+user.id+':'+ip)))return out(429,{error:'Muitas consultas. Aguarde um minuto e tente novamente.'})}catch(_){return out(503,{error:'Proteção de limite temporariamente indisponível.'})}
  const ticker=String(event.queryStringParameters?.ticker||'').trim().toUpperCase().replace(/\s+/g,'');
  if(!/^[A-Z0-9.\-]{1,15}$/.test(ticker))return out(400,{error:'Ticker inválido.'});
  const token=String(process.env.BRAPI_API_KEY||'').trim();if(!token)return out(503,{error:'BRAPI_API_KEY não configurada no servidor.'});
  try{const r=await fetch(`https://brapi.dev/api/v2/stocks/quote?symbols=${encodeURIComponent(ticker)}`,{headers:{Authorization:`Bearer ${token}`}});let j=null;try{j=await r.json()}catch(_){}if(!r.ok)return out(r.status===429?429:r.status,{error:r.status===429?'Limite de cotações atingido. Tente novamente.':'Não foi possível consultar este ativo.'});const item=j?.results?.[0],data=item?.data||item||{},price=Number(data.regularMarketPrice??item?.regularMarketPrice);if(!Number.isFinite(price)||price<=0)return out(404,{error:'Ativo sem cotação disponível agora.'});return out(200,{symbol:item?.symbol||ticker,price,change:Number(data.regularMarketChangePercent??0)||0,updatedAt:data.regularMarketTime||new Date().toISOString(),currency:data.currency||'BRL'})}catch(_){return out(500,{error:'Serviço de cotação indisponível.'})}
};
