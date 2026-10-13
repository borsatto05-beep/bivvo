const crypto = require('node:crypto');
const { rest, userFromJwt, adminKey } = require('../lib/supabase-admin.js');

/*
 * Bivvo 11.61 — concessão permanente privada de Bivvo Capital.
 * A conta é validada pelo e-mail autenticado no Supabase e comparada por SHA-256;
 * o e-mail não fica exposto em texto puro no código distribuído.
 */
const DEFAULT_CAPITAL_EMAIL_SHA256 = '0e7ad9b1445e116ec7acd481bfa8cabe21a27c257e2196c9e59c9da49be8805f';
const CAPITAL_EMAIL_SHA256 = String(process.env.BIVVO_PERMANENT_CAPITAL_EMAIL_SHA256 || DEFAULT_CAPITAL_EMAIL_SHA256).trim().toLowerCase();
const SOURCE = 'owner_permanent_capital';
const EXPIRES_AT = '2099-12-31T23:59:59.000Z';
const headers = {'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
const out=(statusCode,body)=>({statusCode,headers,body:JSON.stringify(body)});
const emailHash=email=>crypto.createHash('sha256').update(String(email||'').trim().toLowerCase()).digest('hex');
const isPermanentCapitalUser=user=>!!user?.email && emailHash(user.email)===CAPITAL_EMAIL_SHA256;

async function upsertGrant(userId){
  const nowIso = new Date().toISOString();
  const payload = { user_id:userId, plan:'capital', source:SOURCE, starts_at:nowIso, expires_at:EXPIRES_AT };
  try {
    await rest('entitlements?on_conflict=user_id,source', {
      method:'POST', body:payload, prefer:'resolution=merge-duplicates,return=minimal'
    });
    return {storagePlan:'capital'};
  } catch (error) {
    // Compatibilidade com um banco ainda preso ao CHECK antigo: guarda family,
    // mas o motor de planos interpreta esta source estritamente como Capital.
    await rest('entitlements?on_conflict=user_id,source', {
      method:'POST', body:{...payload,plan:'family'}, prefer:'resolution=merge-duplicates,return=minimal'
    });
    return {storagePlan:'family',compatibility:true};
  }
}

exports.handler = async event => {
  if(!['GET','POST'].includes(event.httpMethod)) return out(405,{error:'Método não permitido.'});
  if(!adminKey()) return out(503,{error:'Servidor ainda não configurado.'});
  const jwt=String(event.headers.authorization||'').replace(/^Bearer\s+/i,'').trim();
  const user=await userFromJwt(jwt);
  if(!user?.id) return out(401,{error:'Entre na sua conta.'});
  if(!isPermanentCapitalUser(user)) return out(200,{ok:true,granted:false});
  try {
    const grant=await upsertGrant(user.id);
    return out(200,{ok:true,granted:true,plan:'capital',source:SOURCE,expiresAt:EXPIRES_AT,...grant});
  } catch (e) {
    console.error('permanent-grant', e.message);
    return out(502,{error:'Não foi possível confirmar a liberação permanente agora.',detail:String(e.message||'').slice(0,160)});
  }
};

exports._test={emailHash,isPermanentCapitalUser,SOURCE,EXPIRES_AT,DEFAULT_CAPITAL_EMAIL_SHA256};
