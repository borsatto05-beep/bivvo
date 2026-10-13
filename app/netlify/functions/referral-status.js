/* Fase 8.7 — progresso do programa de indicação. Não retorna dados dos amigos. */
const { rest, userFromJwt, rateLimit, adminKey } = require('../lib/supabase-admin.js');
const DAY = 86400000;
exports.handler = async event => {
  const headers={ 'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff' };
  const out=(statusCode,body)=>({statusCode,headers,body:JSON.stringify(body)});
  if(event.httpMethod!=='GET') return out(405,{error:'Método não permitido.'});
  if(!adminKey()) return out(503,{code:'not_configured'});
  const jwt=String(event.headers.authorization||event.headers.Authorization||'').replace(/^Bearer\s+/i,'').trim();
  const user=await userFromJwt(jwt); if(!user) return out(401,{error:'Sessão inválida.'});
  if(!(await rateLimit('ref-status:'+user.id,30,3600))) return out(429,{error:'Tente mais tarde.'});
  try{
    const since=new Date(Date.now()-365*DAY).toISOString();
    const rows=await rest(`referrals?referrer=eq.${user.id}&activated_at=gt.${encodeURIComponent(since)}&select=status,reward_status,activated_at`)||[];
    const activated=rows.filter(x=>x.status==='activated').length;
    const rewards=Math.min(4,Math.floor(activated/3));
    const progress=activated>=12?3:activated%3;
    return out(200,{ok:true,activated,rewards,progress,needed:activated>=12?0:3-progress,max_rewards:4,reward_days:30,welcome_days:7});
  }catch(e){ console.error('referral-status',e.message); return out(503,{error:'Não foi possível carregar suas indicações.'}); }
};
