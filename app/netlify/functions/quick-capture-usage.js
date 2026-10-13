/* Bivvo 11.55 — cota da anotação rápida por texto/voz.
   O scanner possui sua própria cota; aqui contamos somente texto/voz. */
const {rest,userFromJwt,rateLimit,adminKey}=require('../lib/supabase-admin.js');
const {limitsOf,period}=require('../lib/plans.js');
const out=(statusCode,body)=>({statusCode,headers:{'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'},body:JSON.stringify(body)});
exports.handler=async event=>{
  if(event.httpMethod!=='POST')return out(405,{error:'Método não permitido.'});
  if(!adminKey())return out(503,{code:'not_configured',error:'Não foi possível validar a cota agora.'});
  const jwt=String(event.headers.authorization||event.headers.Authorization||'').replace(/^Bearer\s+/i,'').trim();
  const user=await userFromJwt(jwt);if(!user)return out(401,{error:'Sessão inválida. Entre novamente.'});
  if(!(await rateLimit('quick-capture:'+user.id,40,60)))return out(429,{error:'Muitas anotações seguidas. Espere um minuto.'});
  let body={};try{body=JSON.parse(event.body||'{}')}catch{return out(400,{error:'Pedido inválido.'})}
  const access=await limitsOf(rest,user.id),limit=access.quick;
  if(limit===Infinity)return out(200,{ok:true,unlimited:true,plan:access.plan,usage:{used:0,limit:null}});
  const per=period(),feature='quick_capture';
  if(body.action==='refund'){
    await rest('rpc/bivvo_refund_usage',{method:'POST',body:{p_user:user.id,p_feature:feature,p_period:per}}).catch(()=>{});
    return out(200,{ok:true,refunded:true});
  }
  let used;
  try{used=await rest('rpc/bivvo_consume_usage',{method:'POST',body:{p_user:user.id,p_feature:feature,p_period:per,p_limit:limit}})}
  catch(e){console.error('quick capture quota',e.message);return out(503,{code:'not_configured',error:'Não foi possível validar a cota de anotações rápidas.'})}
  if(used===-1)return out(402,{code:'quota',plan:access.plan,usage:{used:limit,limit},error:`Você usou as ${limit} anotações rápidas grátis deste mês.`});
  return out(200,{ok:true,plan:access.plan,usage:{used,limit}});
};
