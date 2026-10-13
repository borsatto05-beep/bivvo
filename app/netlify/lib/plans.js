/* Bivvo 11.49 — permissões, cotas e nível de inteligência da IA no servidor. */
const PLAN_LIMITS = {
  free:{scan:5,quick:10,ai:0,aiTier:0},
  plus:{scan:30,quick:Infinity,ai:30,aiTier:1},
  capital:{scan:60,quick:Infinity,ai:60,aiTier:2},
  pro:{scan:200,quick:Infinity,ai:300,aiTier:3},
  couple:{scan:200,quick:Infinity,ai:300,aiTier:3},
  entrepreneur:{scan:300,quick:Infinity,ai:500,aiTier:4},
  family:{scan:500,quick:Infinity,ai:800,aiTier:5}
};
const CORE_PLUS=['unlimitedCards','assistant','forecast30','futureCards12','smartAlerts'];
const CORE_PRO=[...CORE_PLUS,'advancedForecast','advancedSimulator'];
const PLAN_FEATURES={
  free:[], plus:CORE_PLUS, pro:CORE_PRO,
  couple:[...CORE_PLUS,'couple'],
  capital:[...CORE_PLUS,'loans'],
  entrepreneur:[...CORE_PRO,'company'],
  family:[...CORE_PRO,'couple','family','company','loans']
};
const PRIORITY={free:0,plus:10,capital:20,couple:30,pro:40,entrepreneur:50,family:60};
const KNOWN=new Set(Object.keys(PLAN_LIMITS));
const TEST_PLAN_SOURCE='owner_test_plan';
const PERMANENT_CAPITAL_SOURCE='owner_permanent_capital';
const testPlanFromRow=r=>{
  const source=String(r?.source||'');
  if(source===TEST_PLAN_SOURCE&&KNOWN.has(String(r?.plan||'')))return String(r.plan);
  if(source.startsWith(TEST_PLAN_SOURCE+'_')){const plan=source.slice((TEST_PLAN_SOURCE+'_').length);if(KNOWN.has(plan)&&plan!=='free')return plan;}
  return null;
};

async function activePlansOf(rest,userId){
  try{
    const now=encodeURIComponent(new Date().toISOString());
    const rows=await rest(`entitlements?user_id=eq.${encodeURIComponent(userId)}&starts_at=lte.${now}&expires_at=gt.${now}&select=plan,source`);
    const testFree=(rows||[]).find(r=>r.source==='owner_test_free');
    if(testFree)return ['free'];
    const testPaid=(rows||[]).find(r=>testPlanFromRow(r));
    if(testPaid)return [testPlanFromRow(testPaid)];
    const plans=[...new Set((rows||[]).map(r=>r.source===PERMANENT_CAPITAL_SOURCE?'capital':String(r.plan||'')).filter(p=>KNOWN.has(p)&&p!=='free'))];
    return plans.length?plans:['free'];
  }catch{return ['free'];}
}
async function planOf(rest,userId){
  const plans=await activePlansOf(rest,userId);
  return [...plans].sort((a,b)=>(PRIORITY[b]||0)-(PRIORITY[a]||0))[0]||'free';
}
async function hasFeature(rest,userId,feature){
  const plans=await activePlansOf(rest,userId);
  return plans.some(p=>(PLAN_FEATURES[p]||[]).includes(feature));
}
async function limitsOf(rest,userId){
  const plans=await activePlansOf(rest,userId); let scan=0,quick=0,ai=0,aiTier=0;
  for(const p of plans){scan=Math.max(scan,PLAN_LIMITS[p]?.scan||0);quick=Math.max(quick,PLAN_LIMITS[p]?.quick||0);ai=Math.max(ai,PLAN_LIMITS[p]?.ai||0);aiTier=Math.max(aiTier,PLAN_LIMITS[p]?.aiTier||0);}
  return {scan,quick,ai,aiTier,plans,plan:[...plans].sort((a,b)=>(PRIORITY[b]||0)-(PRIORITY[a]||0))[0]||'free'};
}
const period=()=>new Date().toISOString().slice(0,7);
module.exports={PLAN_LIMITS,PLAN_FEATURES,activePlansOf,planOf,hasFeature,limitsOf,period};
