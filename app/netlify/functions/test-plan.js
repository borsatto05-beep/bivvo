const crypto = require('node:crypto');
const { rest, userFromJwt, adminKey } = require('../lib/supabase-admin.js');

/*
 * Conta interna de homologação do proprietário.
 * O e-mail não fica em texto puro no código; apenas o SHA-256 normalizado.
 * BIVVO_TESTER_EMAIL_SHA256 pode substituir o hash padrão no Netlify.
 *
 * 11.54: planos especializados são gravados com um entitlement compatível
 * (family) e o plano simulado fica codificado na source. Isso permite testar
 * Capital/Casal/Empreendedor mesmo quando o banco publicado ainda tem o
 * CHECK antigo de planos. O override vale somente para a conta de homologação.
 */
const DEFAULT_TESTER_EMAIL_SHA256 = 'c031836a65414ee39a057e75c0ac42e6ed64bbe275c372ffa6de7ee8390b2b16';
const TESTER_EMAIL_SHA256 = String(process.env.BIVVO_TESTER_EMAIL_SHA256 || DEFAULT_TESTER_EMAIL_SHA256).trim().toLowerCase();
const PAID_SOURCE = 'owner_test_plan';
const FREE_SOURCE = 'owner_test_free';
const ALLOWED = new Set(['real','free','plus','capital','pro','couple','entrepreneur','family']);
const SPECIALIZED = new Set(['capital','couple','entrepreneur']);
const headers = {'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
const out=(statusCode,body)=>({statusCode,headers,body:JSON.stringify(body)});
const emailHash=email=>crypto.createHash('sha256').update(String(email||'').trim().toLowerCase()).digest('hex');
const isTester=user=>!!user?.email && emailHash(user.email)===TESTER_EMAIL_SHA256;
const sourceForPlan=plan=>`${PAID_SOURCE}_${plan}`;
const simulatedPlanFromRow=row=>{
  const source=String(row?.source||'');
  if(source===FREE_SOURCE)return 'free';
  if(source===PAID_SOURCE && ALLOWED.has(String(row?.plan||'')))return String(row.plan);
  if(source.startsWith(PAID_SOURCE+'_')){
    const plan=source.slice((PAID_SOURCE+'_').length);
    if(ALLOWED.has(plan) && plan!=='real' && plan!=='free')return plan;
  }
  return null;
};
const storagePlanFor=plan=>SPECIALIZED.has(plan)?'family':plan;
const isTestSource=source=>source===FREE_SOURCE || source===PAID_SOURCE || String(source||'').startsWith(PAID_SOURCE+'_');

async function expirePreviousOverrides(userId, nowIso){
  const rows=await rest(`entitlements?user_id=eq.${encodeURIComponent(userId)}&select=id,source`).catch(()=>[]);
  for(const row of rows||[]){
    if(!isTestSource(row.source))continue;
    await rest(`entitlements?id=eq.${encodeURIComponent(row.id)}`,{
      method:'PATCH',body:{expires_at:nowIso},prefer:'return=minimal'
    }).catch(()=>null);
  }
}

exports.handler = async event => {
  if(!['GET','POST'].includes(event.httpMethod)) return out(405,{error:'Método não permitido.'});
  if(!adminKey()) return out(503,{error:'Servidor ainda não configurado.'});
  const jwt=String(event.headers.authorization||'').replace(/^Bearer\s+/i,'').trim();
  const user=await userFromJwt(jwt);
  if(!user?.id) return out(401,{error:'Entre na sua conta.'});
  if(!isTester(user)) return out(403,{allowed:false,error:'Esta conta não possui acesso ao modo de teste.'});

  try {
    if(event.httpMethod==='GET'){
      const now=new Date().toISOString();
      const rows=await rest(`entitlements?user_id=eq.${encodeURIComponent(user.id)}&expires_at=gt.${encodeURIComponent(now)}&select=plan,source,expires_at`).catch(()=>[]);
      const testRows=(rows||[]).filter(r=>isTestSource(r.source));
      const free=testRows.find(r=>r.source===FREE_SOURCE);
      const paid=testRows.find(r=>simulatedPlanFromRow(r) && r.source!==FREE_SOURCE);
      const active=free||paid;
      return out(200,{ok:true,allowed:true,testPlan:free?'free':simulatedPlanFromRow(paid)||'real',expiresAt:active?.expires_at||null});
    }

    let body={};
    try{body=JSON.parse(event.body||'{}');}catch{return out(400,{error:'JSON inválido.'});}
    const plan=String(body.plan||'').trim().toLowerCase();
    if(!ALLOWED.has(plan)) return out(400,{error:'Plano de teste inválido.'});

    const now=new Date(), nowIso=now.toISOString(), expires=new Date(now.getTime()+3650*86400000);
    await expirePreviousOverrides(user.id,nowIso);

    if(plan==='real') return out(200,{ok:true,allowed:true,testPlan:'real',message:'Modo de teste desligado. O Bivvo voltou a usar o plano real da conta.'});
    if(plan==='free'){
      await rest('entitlements?on_conflict=user_id,source',{
        method:'POST',body:{user_id:user.id,plan:'plus',source:FREE_SOURCE,starts_at:nowIso,expires_at:expires.toISOString()},
        prefer:'resolution=merge-duplicates,return=minimal'
      });
      return out(200,{ok:true,allowed:true,testPlan:'free',expiresAt:expires.toISOString(),message:'Simulação alterada para Bivvo Grátis.'});
    }

    const source=sourceForPlan(plan);
    const storagePlan=storagePlanFor(plan);
    await rest('entitlements?on_conflict=user_id,source',{
      method:'POST',
      body:{user_id:user.id,plan:storagePlan,source,starts_at:nowIso,expires_at:expires.toISOString()},
      prefer:'resolution=merge-duplicates,return=minimal'
    });
    return out(200,{ok:true,allowed:true,testPlan:plan,expiresAt:expires.toISOString(),message:`Bivvo ${plan==='capital'?'Capital':plan==='couple'?'Casal':plan==='entrepreneur'?'Empreendedor':plan[0].toUpperCase()+plan.slice(1)} ativado para teste, sem cobrança.`});
  }catch(e){
    console.error('test-plan',e.message);
    return out(502,{error:'Não foi possível trocar o plano de teste agora.',detail:String(e.message||'').slice(0,160)});
  }
};

exports._test = { emailHash, isTester, PAID_SOURCE, FREE_SOURCE, ALLOWED, DEFAULT_TESTER_EMAIL_SHA256, simulatedPlanFromRow, storagePlanFor, sourceForPlan };
