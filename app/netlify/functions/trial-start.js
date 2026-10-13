const { rest, userFromJwt, rateLimit, adminKey } = require('../lib/supabase-admin.js');
exports.handler = async event => {
  const headers = { 'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff' };
  const out=(statusCode,body)=>({statusCode,headers,body:JSON.stringify(body)});
  if(event.httpMethod!=='POST') return out(405,{error:'Método não permitido.'});
  if(!adminKey()) return out(503,{error:'Servidor ainda não configurado.'});
  const jwt=String(event.headers.authorization||'').replace(/^Bearer\s+/i,'').trim();
  const user=await userFromJwt(jwt); if(!user?.id) return out(401,{error:'Entre na sua conta.'});
  if(!(await rateLimit('trial-start:'+user.id,3,3600))) return out(429,{error:'Aguarde antes de tentar novamente.'});
  try {
    const old=await rest(`entitlements?user_id=eq.${user.id}&source=eq.trial_pro&select=id,expires_at`);
    if(old?.length) return out(409,{error:'O teste Pro gratuito já foi utilizado nesta conta.'});
    const paid=await rest(`billing_subscriptions?user_id=eq.${user.id}&status=eq.authorized&select=id&limit=1`).catch(()=>[]);
    if(paid?.length) return out(409,{error:'Sua conta já possui uma assinatura ativa.'});
    const starts=new Date(), expires=new Date(starts.getTime()+7*86400000);
    await rest('entitlements',{method:'POST',body:{user_id:user.id,plan:'pro',source:'trial_pro',starts_at:starts.toISOString(),expires_at:expires.toISOString()},prefer:'return=minimal'});
    await rest('product_events',{method:'POST',body:{user_id:user.id,event:'trial_started',props:{plan:'pro'}},prefer:'return=minimal'}).catch(()=>{});
    return out(200,{ok:true,expiresAt:expires.toISOString(),message:'Seu teste Pro de 7 dias começou. Não haverá cobrança automática.'});
  } catch(e){ console.error('trial-start',e.message); return out(502,{error:'Não consegui iniciar o teste agora.'}); }
};
