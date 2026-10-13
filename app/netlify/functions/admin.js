const { rest, userFromJwt, adminKey } = require('../lib/supabase-admin.js');
const seoIntel = require('../lib/seo-intelligence.js');
const gsc = require('../lib/search-console.js');
const {learningMetrics}=require('../lib/learning-metrics.js');
const SUPABASE_URL='https://gqfirbhzjuzspermyvfy.supabase.co';
const out=(code,data,headers={})=>({statusCode:code,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store',...headers},body:JSON.stringify(data)});
async function adminAuth(event){const jwt=(event.headers.authorization||'').replace(/^Bearer\s+/i,'');const user=await userFromJwt(jwt);if(!user)return{error:out(401,{error:'Não autenticado'})};const rows=await rest(`admin_roles?user_id=eq.${user.id}&select=role`);if(!rows?.[0])return{error:out(403,{error:'Sem permissão administrativa'})};return{user,role:rows[0].role}}
async function authUsers(page=1,perPage=1000){const key=adminKey(),h={apikey:key,Authorization:'Bearer '+key,'Cache-Control':'no-store'};const r=await fetch(`${SUPABASE_URL}/auth/v1/admin/users?page=${page}&per_page=${perPage}`,{headers:h});if(!r.ok)throw new Error('Auth admin '+r.status);const j=await r.json();return j.users||[]}
const ago=d=>new Date(Date.now()-d*86400000).toISOString(), sum=a=>a.reduce((s,x)=>s+Number(x.amount||0),0), pct=(a,b)=>b?100*a/b:0;
const countBy=(rows,key)=>Object.entries(rows.reduce((o,x)=>{const k=x[key]||'unknown';o[k]=(o[k]||0)+1;return o},{})).sort((a,b)=>b[1]-a[1]);
const uniq=(rows,key)=>new Set(rows.map(x=>x[key]).filter(Boolean));
async function dashboard(q={}){
 const days=Math.min(90,Math.max(7,Number(q.days)||30)), since=ago(days), eventSince=ago(Math.max(180,days*2));
 const [users,subs,pays,events,productEvents,systems,refs]=await Promise.all([
  authUsers(),rest('billing_subscriptions?select=user_id,plan,status,next_payment_date,created_at,last_sync_at&order=created_at.desc&limit=5000'),rest('billing_payments?select=mp_payment_id,user_id,plan,status,amount,paid_at,created_at&order=created_at.desc&limit=5000'),rest(`analytics_events?created_at=gte.${encodeURIComponent(eventSince)}&select=visitor_id,session_id,user_id,event,route,source,medium,campaign,content,term,landing,referrer,language,screen,device,browser,os,error_type,error_message,app_version,created_at&order=created_at.desc&limit=30000`),rest(`product_events?created_at=gte.${encodeURIComponent(eventSince)}&select=user_id,event,props,created_at&order=created_at.desc&limit=20000`).catch(()=>[]),rest('system_events?select=service,event,ok,message,created_at&order=created_at.desc&limit=300'),rest('referrals?select=referrer,referred_user,status,created_at,activated_at,reward_status&limit=5000').catch(()=>[])
 ]);
 const range=events.filter(e=>e.created_at>=since), approved=pays.filter(x=>x.status==='approved'), approvedRange=approved.filter(x=>(x.paid_at||x.created_at)>=since), approvedUsers=uniq(approved,'user_id');
 const latestPaidSub=new Map();subs.forEach(x=>{if(x.status==='authorized'&&approvedUsers.has(x.user_id)&&!latestPaidSub.has(x.user_id))latestPaidSub.set(x.user_id,x)});const paidUsers=new Set(latestPaidSub.keys());
 const plans={free:Math.max(0,users.length-paidUsers.size),plus:0,pro:0,couple:0,capital:0,entrepreneur:0,family:0};latestPaidSub.forEach(x=>{if(plans[x.plan]!=null)plans[x.plan]++});
 const month=new Date();month.setUTCDate(1);month.setUTCHours(0,0,0,0);const revenueMonth=sum(approved.filter(x=>(x.paid_at||x.created_at)>=month.toISOString()));const mrr=[...latestPaidSub.values()].reduce((s,x)=>s+({plus:19.9,capital:24.9,pro:29.9,couple:29.9,entrepreneur:34.9,family:49.99}[x.plan]||0),0);
 const visitors=uniq(range,'visitor_id'), sessions=uniq(range,'session_id'), realtime=uniq(events.filter(e=>e.created_at>=new Date(Date.now()-15*60000).toISOString()),'visitor_id');
 const activeUsersSince=d=>uniq(events.filter(e=>e.user_id&&e.created_at>=ago(d)),'user_id').size,dau=activeUsersSince(1),wau=activeUsersSince(7),mau=activeUsersSince(30);
 const retained=(age,minDay,maxDay)=>{const cohort=users.filter(u=>{const a=(Date.now()-new Date(u.created_at))/86400000;return a>=age&&a<age+30});if(!cohort.length)return null;return pct(cohort.filter(u=>events.some(e=>e.user_id===u.id&&(()=>{const d=(new Date(e.created_at)-new Date(u.created_at))/86400000;return d>=minDay&&d<maxDay})())).length,cohort.length)};
 const analyticsStep=(label,event)=>{const rs=range.filter(e=>e.event===event);return{label,event,count:uniq(rs,'user_id').size||uniq(rs,'visitor_id').size}};
 const productStep=(label,event)=>{const rs=productEvents.filter(e=>e.created_at>=since&&e.event===event);return{label,event,count:uniq(rs,'user_id').size}};
 const funnel=[
  analyticsStep('Visitou','site_visit'),
  analyticsStep('Criou conta','signup_completed'),
  analyticsStep('Concluiu onboarding','onboarding_completed'),
  analyticsStep('Ativou o Bivvo','activation_completed'),
  productStep('Iniciou Trial Pro','trial_started'),
  analyticsStep('Iniciou checkout','checkout_started'),
  {label:'Virou pagante',event:'paid',count:uniq(approvedRange,'user_id').size}
 ];
 for(let i=0;i<funnel.length;i++)funnel[i].rate=i===0?100:pct(funnel[i].count,funnel[i-1].count);

 /* Fase 8.19.3 — funil de ativação por coorte: nunca mistura usuários antigos com cadastros novos. */
 const cohortSignupRows=range.filter(e=>e.event==='signup_completed'&&e.user_id), cohortIds=uniq(cohortSignupRows,'user_id');
 const cohortStep=(label,event,{optional=false}={})=>{const rs=events.filter(e=>cohortIds.has(e.user_id)&&e.event===event);return{label,event,count:uniq(rs,'user_id').size,optional}};
 const activationSteps=[
  {label:'Criou conta',event:'signup_completed',count:cohortIds.size},
  cohortStep('Informou renda','income_added'),
  cohortStep('Informou saldo','balance_added'),
  cohortStep('Adicionou contas','bills_added',{optional:true}),
  cohortStep('Viu R$/dia','first_value_shown')
 ];
 let prevRequired=activationSteps[0]; for(const st of activationSteps){if(st===activationSteps[0]){st.rate=100;continue}if(st.optional){st.rate=pct(st.count,activationSteps[0].count);continue}st.rate=pct(st.count,prevRequired.count);prevRequired=st}
 const cohortUsers=users.filter(u=>cohortIds.has(u.id)), d1Eligible=cohortUsers.filter(u=>(Date.now()-new Date(u.created_at).getTime())>=20*3600000);
 const d1Returned=d1Eligible.filter(u=>events.some(e=>e.user_id===u.id&&(()=>{const dt=new Date(e.created_at).getTime()-new Date(u.created_at).getTime();return dt>=20*3600000&&dt<=72*3600000&&e.event!=='signup_completed'})())).length;
 const cohortPaid=approved.filter(p=>cohortIds.has(p.user_id)), paidCohort=uniq(cohortPaid,'user_id').size;
 const requiredActivation=activationSteps.filter(x=>!x.optional); const activationDrops=requiredActivation.slice(1).map((x,i)=>({from:requiredActivation[i],to:x,drop:100-Number(x.rate||0)})).filter(x=>x.from.count>=5);
 const activationBottleneck=activationDrops.sort((a,b)=>b.drop-a.drop)[0]||null;
 const activationFlow={cohort_signups:cohortIds.size,steps:activationSteps,bills_added:activationSteps.find(x=>x.event==='bills_added')?.count||0,d1_eligible:d1Eligible.length,d1_returned:d1Returned,d1_rate:pct(d1Returned,d1Eligible.length),paid:paidCohort,paid_rate:pct(paidCohort,cohortIds.size),activation_rate:pct(activationSteps.find(x=>x.event==='first_value_shown')?.count||0,cohortIds.size),bottleneck:activationBottleneck?{from:activationBottleneck.from.label,to:activationBottleneck.to.label,rate:activationBottleneck.to.rate,drop:activationBottleneck.drop,count:activationBottleneck.to.count,base:activationBottleneck.from.count}:null};

 const userSource=new Map(),userCampaign=new Map();[...events].reverse().forEach(e=>{if(e.user_id&&!userSource.has(e.user_id))userSource.set(e.user_id,e.source||'direct');if(e.user_id&&!userCampaign.has(e.user_id))userCampaign.set(e.user_id,{source:e.source||'direct',medium:e.medium||'',campaign:e.campaign||'(sem campanha)'})});
 const acquisition={};range.forEach(e=>{const k=e.source||'direct';acquisition[k]??={source:k,sessions:new Set(),visitors:new Set(),signups:new Set(),paid:new Set(),revenue:0};if(e.event==='site_visit'||e.event==='page_view'||e.event==='seo_page_viewed'){acquisition[k].visitors.add(e.visitor_id);acquisition[k].sessions.add(e.session_id)}if(e.event==='signup_completed'&&e.user_id)acquisition[k].signups.add(e.user_id)});approvedRange.forEach(p=>{const k=userSource.get(p.user_id)||'unknown';acquisition[k]??={source:k,sessions:new Set(),visitors:new Set(),signups:new Set(),paid:new Set(),revenue:0};acquisition[k].paid.add(p.user_id);acquisition[k].revenue+=Number(p.amount||0)});
 const sources=Object.values(acquisition).map(x=>({source:x.source,sessions:x.sessions.size,visitors:x.visitors.size,signups:x.signups.size,paid:x.paid.size,revenue:x.revenue,conversion:pct(x.paid.size,x.visitors.size)})).sort((a,b)=>b.visitors-a.visitors).slice(0,15);
 const campaignMap={};range.forEach(e=>{const campaign=e.campaign||'(sem campanha)',source=e.source||'direct',medium=e.medium||'';const k=`${source}|${medium}|${campaign}`;campaignMap[k]??={source,medium,campaign,sessions:new Set(),visitors:new Set(),signups:new Set(),paid:new Set(),revenue:0};if(e.event==='site_visit'||e.event==='page_view'||e.event==='seo_page_viewed'){campaignMap[k].visitors.add(e.visitor_id);campaignMap[k].sessions.add(e.session_id)}if(e.event==='signup_completed'&&e.user_id)campaignMap[k].signups.add(e.user_id)});approvedRange.forEach(p=>{const a=userCampaign.get(p.user_id)||{source:'unknown',medium:'',campaign:'(sem campanha)'};const k=`${a.source}|${a.medium}|${a.campaign}`;campaignMap[k]??={...a,sessions:new Set(),visitors:new Set(),signups:new Set(),paid:new Set(),revenue:0};campaignMap[k].paid.add(p.user_id);campaignMap[k].revenue+=Number(p.amount||0)});const campaigns=Object.values(campaignMap).map(x=>({source:x.source,medium:x.medium,campaign:x.campaign,sessions:x.sessions.size,visitors:x.visitors.size,signups:x.signups.size,paid:x.paid.size,revenue:x.revenue,signup_rate:pct(x.signups.size,x.visitors.size),paid_rate:pct(x.paid.size,x.visitors.size)})).sort((a,b)=>b.visitors-a.visitors).slice(0,20);
 const daily={};for(let i=days-1;i>=0;i--){const d=new Date(Date.now()-i*86400000).toISOString().slice(0,10);daily[d]={users:0,revenue:0,visitors:new Set()}}users.forEach(u=>{const d=u.created_at?.slice(0,10);if(daily[d])daily[d].users++});approved.forEach(p=>{const d=(p.paid_at||p.created_at)?.slice(0,10);if(daily[d])daily[d].revenue+=Number(p.amount||0)});range.forEach(e=>{const d=e.created_at?.slice(0,10);if(daily[d])daily[d].visitors.add(e.visitor_id)});
 const routeCounts=countBy(range.filter(e=>e.route),'route').slice(0,15), eventCounts=countBy(range,'event').slice(0,15), devices=countBy(range,'device'), browsers=countBy(range,'browser'), systemsOS=countBy(range,'os'), screens=countBy(range,'screen'), languages=countBy(range,'language');
 const featureCounts=countBy(productEvents.filter(e=>e.created_at>=since),'event').slice(0,15);
 const pe=productEvents.filter(e=>e.created_at>=since); const paywallRows=pe.filter(e=>e.event==='paywall_viewed'); const paywalls={}; paywallRows.forEach(e=>{const k=e.props?.feature||'unknown';paywalls[k]=(paywalls[k]||0)+1});
 const evCount=name=>pe.filter(e=>e.event===name).length; const opp=evCount('conversion_opportunity_shown'), oppClicks=evCount('conversion_opportunity_clicked'), planViews=evCount('plans_viewed')||range.filter(e=>e.event==='plans_viewed').length, planSelected=evCount('plan_selected')||range.filter(e=>e.event==='plan_selected').length, checkouts=range.filter(e=>e.event==='checkout_started').length||evCount('checkout_started'), paidCount=uniq(approvedRange,'user_id').size;
 const byPlan=Object.fromEntries(['plus','pro','couple','capital','entrepreneur','family'].map(k=>[k,{selected:0,checkouts:0,payments:0,revenue:0}])); pe.filter(e=>e.event==='plan_selected').forEach(e=>{const k=e.props?.plan;if(byPlan[k])byPlan[k].selected++}); range.filter(e=>e.event==='checkout_started').forEach(e=>{const raw=e.content||e.route||'';for(const k of Object.keys(byPlan))if(raw.includes(k))byPlan[k].checkouts++}); approvedRange.forEach(x=>{if(byPlan[x.plan]){byPlan[x.plan].payments++;byPlan[x.plan].revenue+=Number(x.amount||0)}});
 const triggerMap={}; pe.filter(e=>e.event==='conversion_opportunity_shown'||e.event==='conversion_opportunity_clicked').forEach(e=>{const k=e.props?.trigger||'unknown';triggerMap[k]??={trigger:k,shown:0,clicks:0};if(e.event==='conversion_opportunity_shown')triggerMap[k].shown++;else triggerMap[k].clicks++});
 const monetization={opportunities_shown:opp,opportunity_clicks:oppClicks,paywall_views:paywallRows.length,paywall_closed:evCount('paywall_closed'),plans_viewed:planViews,plans_selected:planSelected,paywalls:Object.entries(paywalls).sort((a,b)=>b[1]-a[1]),trial_starts:evCount('trial_started'),checkout_starts:checkouts,paid_users:paidCount,premium_feature_uses:evCount('premium_feature_used'),rates:{opportunity_click:pct(oppClicks,opp),click_plan:pct(planSelected,oppClicks),plan_checkout:pct(checkouts,planSelected),checkout_paid:pct(paidCount,checkouts)},by_plan:Object.entries(byPlan).map(([plan,v])=>({plan,...v,conversion:pct(v.payments,v.selected)})),by_trigger:Object.values(triggerMap).map(v=>({...v,conversion:pct(v.clicks,v.shown)}))};
 const viralPE=productEvents.filter(e=>e.created_at>=since);
 const storyCreated=viralPE.filter(e=>e.event==='story_created'), storySharedRaw=viralPE.filter(e=>e.event==='story_shared'), storyShareCanceled=viralPE.filter(e=>e.event==='story_share_canceled'), storyDownloaded=viralPE.filter(e=>e.event==='story_downloaded'), referralSent=viralPE.filter(e=>e.event==='referral_sent');
 const completedCount=(rows,canceled)=>rows.filter(e=>e.props?.result==='system_completed').length+Math.max(0,rows.filter(e=>e.props?.result!=='system_completed').length-canceled.filter(e=>e.props?.result!=='attempt_canceled').length);
 const storySharedCount=completedCount(storySharedRaw,storyShareCanceled);
 const spendableSharedRaw=viralPE.filter(e=>e.event==='spendable_card_shared'), spendableShareCanceled=viralPE.filter(e=>e.event==='spendable_card_share_canceled');
 const spendableSharedCount=completedCount(spendableSharedRaw,spendableShareCanceled);
 const viralTraffic=range.filter(e=>e.source==='bivvo_share'||e.campaign==='viral_8192');
 const viralViews=viralTraffic.filter(e=>e.event==='site_visit'||e.event==='page_view'||e.event==='seo_page_viewed');
 const viralSignupRows=viralTraffic.filter(e=>e.event==='signup_completed');
 const activatedRefs=(refs||[]).filter(r=>r.status==='activated'&&(r.activated_at||r.created_at)>=since);
 const uniqueSharers=new Set([...storySharedRaw,...referralSent].map(e=>e.user_id).filter(Boolean));
 const activatedUsers=new Set(activatedRefs.map(r=>r.referred_user).filter(Boolean));
 const viral={
  created:storyCreated.length,downloaded:storyDownloaded.length,shared:storySharedCount,
  spendable_opened:viralPE.filter(e=>e.event==='spendable_card_opened').length,
  spendable_shared:spendableSharedCount,
  spendable_downloaded:viralPE.filter(e=>e.event==='spendable_card_downloaded').length,
  referral_sent:referralSent.length,
  referral_activated:Math.max(viralPE.filter(e=>e.event==='referral_activated').length,activatedUsers.size),
  wrapped_opened:viralPE.filter(e=>e.event==='wrapped_opened').length,
  viral_visits:uniq(viralViews,'visitor_id').size,viral_signups:uniq(viralSignupRows,'user_id').size,
  unique_sharers:uniqueSharers.size,activated_referrals:activatedUsers.size,
  share_rate:pct(storySharedCount,storyCreated.length),visit_signup_rate:pct(uniq(viralSignupRows,'user_id').size,uniq(viralViews,'visitor_id').size),
  activated_per_sharer:uniqueSharers.size?activatedUsers.size/uniqueSharers.size:0
 };
 const canceledRange=subs.filter(x=>x.status==='cancelled'&&x.last_sync_at&&x.last_sync_at>=since).length, lifecycle={};productEvents.filter(e=>e.created_at>=since).forEach(e=>lifecycle[e.event]=(lifecycle[e.event]||0)+1);
 const cancelReasonRows=productEvents.filter(e=>e.created_at>=since&&e.event==='cancel_reason_selected'); const cancelReasons={}; cancelReasonRows.forEach(e=>{const k=e.props?.reason||'other';cancelReasons[k]=(cancelReasons[k]||0)+1});
 const lastActivity=new Map(); productEvents.forEach(e=>{if(e.user_id&&!lastActivity.has(e.user_id))lastActivity.set(e.user_id,e.created_at)});
 const ageDays=iso=>iso?Math.floor((Date.now()-new Date(iso).getTime())/86400000):9999;
 const active1=[...lastActivity.values()].filter(x=>ageDays(x)<1).length, active7=[...lastActivity.values()].filter(x=>ageDays(x)<7).length, active30=[...lastActivity.values()].filter(x=>ageDays(x)<30).length;
 const atRisk=[...lastActivity.values()].filter(x=>ageDays(x)>=7&&ageDays(x)<30).length, dormant=Math.max(0,users.length-active30);
 const installOffers=lifecycle.pwa_install_offer_shown||0,installClicks=lifecycle.pwa_install_clicked||0,installAccepted=lifecycle.pwa_install_prompt_accepted||0,installConfirmed=lifecycle.pwa_installed||0; const retention={cancel_flow_started:lifecycle.cancel_flow_started||0,pause_offers:lifecycle.cancel_offer_viewed||0,paused:lifecycle.subscription_paused||0,reactivated:lifecycle.subscription_reactivated||0,canceled:lifecycle.cancellation_completed||lifecycle.subscription_canceled||canceledRange,reasons:Object.entries(cancelReasons).sort((a,b)=>b[1]-a[1]),active_1d:active1,active_7d:active7,active_30d:active30,at_risk:atRisk,dormant,returned:lifecycle.retention_returned||0,nudges_shown:lifecycle.retention_nudge_shown||0,nudges_clicked:lifecycle.retention_nudge_clicked||0,return_rate:pct(lifecycle.retention_nudge_clicked||0,lifecycle.retention_nudge_shown||0),frequency:active30?pct(active7,active30):0,install_offers:installOffers,install_clicks:installClicks,install_accepted:installAccepted,install_confirmed:installConfirmed,install_dismissed:(lifecycle.pwa_install_dismissed||0)+(lifecycle.pwa_install_prompt_dismissed||0),install_ios:lifecycle.pwa_ios_instructions_shown||0,install_offer_click_rate:pct(installClicks,installOffers),install_click_accept_rate:pct(installAccepted,installClicks),install_offer_confirmed_rate:pct(installConfirmed,installOffers)};
 const health={};systems.forEach(s=>{if(!health[s.service])health[s.service]=s}); const clientErrors=range.filter(e=>e.event==='client_error'); health.client={ok:clientErrors.length===0,event:'client_error',created_at:clientErrors[0]?.created_at||null,count:clientErrors.length,versions:countBy(clientErrors,'app_version').slice(0,5)};
 const abRows=range.filter(e=>e.event==='ab_exposure'||e.event==='ab_conversion'); const ab={}; abRows.forEach(e=>{const raw=e.content||'';const parts=raw.split(':');if(parts.length!==2)return;const [experiment,variant]=parts;ab[experiment]??={};ab[experiment][variant]??={variant,exposures:new Set(),conversions:new Set()};const id=e.visitor_id||e.user_id;if(!id)return;if(e.event==='ab_exposure')ab[experiment][variant].exposures.add(id);if(e.event==='ab_conversion')ab[experiment][variant].conversions.add(id)}); const experiments=Object.entries(ab).map(([experiment,variants])=>({experiment,variants:Object.values(variants).map(v=>({variant:v.variant,exposures:v.exposures.size,conversions:v.conversions.size,rate:pct(v.conversions.size,v.exposures.size)})).sort((a,b)=>a.variant.localeCompare(b.variant))}));
 const opportunities=[];const signup=funnel.find(x=>x.event==='signup_completed'),activation=funnel.find(x=>x.event==='activation_completed'),trial=funnel.find(x=>x.event==='trial_started'),visit=funnel[0],checkout=funnel.find(x=>x.event==='checkout_started'),paid=funnel.at(-1);
 const eligibleDrops=funnel.slice(1).map((x,i)=>({from:funnel[i],to:x,drop:100-x.rate})).filter(x=>x.from.count>=10);
 const biggestDrop=eligibleDrops.sort((a,b)=>b.drop-a.drop)[0];
 if(biggestDrop&&biggestDrop.drop>=25)opportunities.push({tone:'warn',title:`Maior gargalo: ${biggestDrop.from.label} → ${biggestDrop.to.label}`,text:`${biggestDrop.to.rate.toFixed(1)}% avançam para a próxima etapa (${biggestDrop.to.count} de ${biggestDrop.from.count}). Priorize este ponto antes de aumentar tráfego.`});
 if(activationFlow.bottleneck&&activationFlow.bottleneck.drop>=25)opportunities.push({tone:'warn',title:`Ativação: ${activationFlow.bottleneck.from} → ${activationFlow.bottleneck.to}`,text:`${Number(activationFlow.bottleneck.rate||0).toFixed(1)}% avançam (${activationFlow.bottleneck.count} de ${activationFlow.bottleneck.base}). Esse é o ponto prioritário do onboarding.`});
 if(activationFlow.d1_eligible>=5&&activationFlow.d1_rate<30)opportunities.push({tone:'warn',title:'Poucos voltam no dia seguinte',text:`D1 está em ${activationFlow.d1_rate.toFixed(1)}% (${activationFlow.d1_returned} de ${activationFlow.d1_eligible} elegíveis). Reforce um motivo útil para voltar depois do primeiro valor.`});
 if(visit.count>=10&&pct(signup.count,visit.count)<25)opportunities.push({tone:'warn',title:'Cadastro abaixo do potencial',text:`Só ${pct(signup.count,visit.count).toFixed(1)}% dos visitantes criaram conta. Teste uma proposta de valor mais clara na entrada.`});
 if(checkout.count>=5&&pct(paid.count,checkout.count)<50)opportunities.push({tone:'bad',title:'Perda no checkout',text:`${(100-pct(paid.count,checkout.count)).toFixed(1)}% dos checkouts não viraram pagamento no período. Revise oferta, confiança e cobrança.`});
 if(sources[0]?.paid>0)opportunities.push({tone:'good',title:'Canal com tração',text:`${sources[0].source} lidera aquisição com ${sources[0].visitors} visitantes e ${sources[0].paid} pagante(s) no período.`});
 if(mau&&dau/mau<.12)opportunities.push({tone:'warn',title:'Frequência de uso baixa',text:`DAU/MAU está em ${(dau/mau*100).toFixed(1)}%. Trabalhe motivos para o usuário voltar ao Bivvo durante a semana.`});
 if(!opportunities.length)opportunities.push({tone:'good',title:'Sem gargalo crítico',text:'Ainda não há volume suficiente ou nenhum gargalo forte foi detectado neste período.'});

 /* Fase 8.20 — Growth Autopilot + Resumo do Fundador. Somente métricas técnicas/agregadas. */
 const now=Date.now(), h24=new Date(now-86400000).toISOString(), h48=new Date(now-2*86400000).toISOString();
 const last24=events.filter(e=>e.created_at>=h24), prev24=events.filter(e=>e.created_at>=h48&&e.created_at<h24);
 const uniqueEvent=(rows,event,key='user_id')=>uniq(rows.filter(e=>e.event===event),key).size||uniq(rows.filter(e=>e.event===event),'visitor_id').size;
 const periodStart=new Date(now-days*86400000), prevStart=new Date(now-days*2*86400000);
 const previous=events.filter(e=>{const t=new Date(e.created_at);return t>=prevStart&&t<periodStart});
 const prevVisitors=uniq(previous.filter(e=>e.event==='site_visit'||e.event==='page_view'||e.event==='seo_page_viewed'),'visitor_id').size;
 const prevSignups=uniqueEvent(previous,'signup_completed');
 const prevActivated=uniqueEvent(previous,'first_value_shown');
 const prevPaid=uniq(approved.filter(p=>{const t=new Date(p.paid_at||p.created_at);return t>=prevStart&&t<periodStart}),'user_id').size;
 const change=(cur,prev)=>prev?((cur-prev)/prev)*100:(cur?100:0);
 const firstValueCount=activationSteps.find(x=>x.event==='first_value_shown')?.count||0;
 const topSource=[...sources].sort((a,b)=>b.signups-a.signups||b.paid-a.paid||b.visitors-a.visitors)[0]||null;
 const topCampaign=[...campaigns].filter(x=>x.campaign&&x.campaign!=='(sem campanha)').sort((a,b)=>b.signups-a.signups||b.paid-a.paid||b.visitors-a.visitors)[0]||null;
 const founder={
  last24:{visitors:uniq(last24,'visitor_id').size,signups:uniqueEvent(last24,'signup_completed'),activated:uniqueEvent(last24,'first_value_shown'),checkouts:uniqueEvent(last24,'checkout_started'),paid:uniq(approved.filter(p=>(p.paid_at||p.created_at)>=h24),'user_id').size},
  previous24:{visitors:uniq(prev24,'visitor_id').size,signups:uniqueEvent(prev24,'signup_completed'),activated:uniqueEvent(prev24,'first_value_shown'),checkouts:uniqueEvent(prev24,'checkout_started')},
  period:{visitors:visitors.size,signups:signup.count,activated:firstValueCount,paid:paid.count,revenue:sum(approvedRange),mrr,dau,wau,mau,churn:paidUsers.size?pct(canceledRange,paidUsers.size+canceledRange):0},
  change_vs_previous:{visitors:change(visitors.size,prevVisitors),signups:change(signup.count,prevSignups),activated:change(firstValueCount,prevActivated),paid:change(paid.count,prevPaid)},
  top_source:topSource,top_campaign:topCampaign
 };
 const autopilot=[];
 const addAction=(priority,tone,title,why,action)=>autopilot.push({priority,tone,title,why,action});
 if(activationFlow.bottleneck&&activationFlow.bottleneck.drop>=25)addAction(100,'bad',`Corrigir ${activationFlow.bottleneck.from} → ${activationFlow.bottleneck.to}`,`Só ${Number(activationFlow.bottleneck.rate||0).toFixed(1)}% avançam nessa etapa.`,`Simplifique essa etapa do onboarding antes de aumentar tráfego.`);
 if(visit.count>=10&&pct(signup.count,visit.count)<25)addAction(95,'warn','Melhorar visitante → cadastro',`A conversão para cadastro está em ${pct(signup.count,visit.count).toFixed(1)}%.`,'Teste o benefício “quanto posso gastar por dia” mais cedo na landing e no anúncio.');
 if(firstValueCount>=5&&activationFlow.d1_eligible>=5&&activationFlow.d1_rate<30)addAction(90,'warn','Aumentar retorno no D1',`Apenas ${activationFlow.d1_rate.toFixed(1)}% dos elegíveis voltaram no dia seguinte.`,'Reforce um motivo útil para voltar: contas próximas, limite diário atualizado ou check-in.');
 if(checkout.count>=5&&pct(paid.count,checkout.count)<50)addAction(88,'bad','Recuperar checkout',`${(100-pct(paid.count,checkout.count)).toFixed(1)}% dos checkouts não viraram pagamento.`,'Revise oferta, confiança, preço e falhas de cobrança antes de escalar mídia.');
 if(topCampaign&&topCampaign.visitors>=5&&topCampaign.signups===0)addAction(82,'warn',`Campanha ${topCampaign.campaign} traz visita, mas não cadastro`,`${topCampaign.visitors} visitantes e nenhum cadastro no período.`,'Não aumente investimento nessa campanha até ajustar criativo, promessa ou landing.');
 if(topSource&&topSource.signups>0)addAction(60,'good',`Canal com melhor sinal: ${topSource.source}`,`${topSource.signups} cadastro(s), ${topSource.paid} pagante(s) e ${topSource.visitors} visitante(s).`,'Produza mais conteúdo/criativos nesse canal e compare a qualidade das ativações.');
 if(viral.unique_sharers>0&&viral.viral_visits===0)addAction(70,'warn','Compartilhamento sem visita rastreada',`${viral.unique_sharers} pessoa(s) compartilharam, mas nenhuma visita viral foi atribuída.`,'Confira o link compartilhado e a preservação de UTM/referral no destino.');
 if(mau>=10&&dau/mau<.12)addAction(75,'warn','Frequência de uso baixa',`DAU/MAU está em ${(dau/mau*100).toFixed(1)}%.`,'Priorize motivos recorrentes para abrir o Bivvo durante a semana.');
 if(!autopilot.length)addAction(20,'good','Continuar coletando sinal','Nenhum gargalo com volume suficiente ultrapassou os limites de alerta.','Mantenha aquisição e acompanhe ativação, D1 e pagamento antes de mudar o produto.');
 autopilot.sort((a,b)=>b.priority-a.priority);
 const growth_autopilot={status:'active',primary:autopilot[0],actions:autopilot.slice(0,5),generated_at:new Date().toISOString(),privacy:'Somente eventos técnicos, origem/UTM e métricas agregadas; sem valores financeiros pessoais.'};
 return{generated_at:new Date().toISOString(),days,learning:learningMetrics(range),founder_summary:founder,growth_autopilot,metrics:{users:users.length,new_today:users.filter(u=>u.created_at>=ago(1)).length,new_7d:users.filter(u=>u.created_at>=ago(7)).length,new_30d:users.filter(u=>u.created_at>=ago(30)).length,paid:paidUsers.size,plans,revenue_month:revenueMonth,revenue_period:sum(approvedRange),mrr,arr:mrr*12,ticket:approvedRange.length?sum(approvedRange)/approvedRange.length:0,visitors:visitors.size,sessions:sessions.size,realtime:realtime.size,conversion:pct(paid.count,visit.count),signup_rate:pct(signup.count,visit.count),activation_rate:activationFlow.activation_rate,trial_rate:pct(trial.count,activation.count),trial_to_paid:pct(paid.count,trial.count),checkout_to_paid:pct(paid.count,checkout.count),dau,wau,mau,retention_d7:retained(7,6,9),retention_d30:retained(30,28,33),retention_d90:retained(90,88,95),canceled_period:canceledRange,churn:paidUsers.size?pct(canceledRange,paidUsers.size+canceledRange):0,referrals:refs.length,payments_approved:approvedRange.length,payments_failed:lifecycle.payment_failed||0},daily:Object.entries(daily).map(([date,v])=>({date,users:v.users,revenue:v.revenue,visitors:v.visitors.size})),funnel,sources,campaigns,routes:routeCounts,events:eventCounts,features:featureCounts,audience:{devices,browsers,os:systemsOS,screens,languages},health,opportunities,monetization,viral,retention,experiments,activation_flow:activationFlow};
}
/* Fase 11.74 — atividade individual para administração.\n   Apenas metadados operacionais: usuário, rota, sessão e horário.\n   Nenhum saldo, compra, renda, dívida ou valor financeiro pessoal é consultado. */
async function activity(q={}){
 const days=Math.min(90,Math.max(7,Number(q.days)||30));
 const since=ago(days);
 const [users,events,signupEvents,subs,payments]=await Promise.all([
  authUsers(),
  rest(`analytics_events?created_at=gte.${encodeURIComponent(since)}&user_id=not.is.null&select=user_id,session_id,event,route,source,medium,campaign,landing,referrer,device,browser,os,created_at&order=created_at.desc&limit=50000`),
  rest('analytics_events?event=eq.signup_completed&user_id=not.is.null&select=user_id,source,medium,campaign,landing,referrer,created_at&order=created_at.asc&limit=50000').catch(()=>[]),
  rest('billing_subscriptions?select=user_id,plan,status,created_at,next_payment_date&order=created_at.desc&limit=10000').catch(()=>[]),
  rest('billing_payments?status=eq.approved&select=user_id,status,paid_at,created_at&order=created_at.asc&limit=10000').catch(()=>[])
 ]);
 const signupByUser=new Map();
 for(const e of signupEvents||[]){ if(e.user_id&&!signupByUser.has(e.user_id)) signupByUser.set(e.user_id,e); }
 const latestSub=new Map();
 for(const s of subs||[]){ if(s.user_id&&!latestSub.has(s.user_id)) latestSub.set(s.user_id,s); }
 const paidAtByUser=new Map();
 for(const p of payments||[]){ if(p.user_id&&!paidAtByUser.has(p.user_id)) paidAtByUser.set(p.user_id,p.paid_at||p.created_at||null); }
 const byUser=new Map();
 for(const e of events||[]){
  if(!e.user_id)continue;
  if(!byUser.has(e.user_id))byUser.set(e.user_id,[]);
  byUser.get(e.user_id).push(e);
 }
 const classifySource=(e)=>{
  if(!e)return 'Desconhecido';
  const rawSource=String(e.source||'').trim().toLowerCase();
  const rawRef=String(e.referrer||'').trim().toLowerCase();
  const signal=`${rawSource} ${rawRef}`;
  if(/tiktok/.test(signal))return 'TikTok';
  if(/facebook|fb\.com|meta/.test(signal))return 'Facebook';
  if(/youtube|youtu\.be/.test(signal))return 'YouTube';
  if(/google|gclid/.test(signal))return 'Google';
  if(/instagram/.test(signal))return 'Instagram';
  if(rawSource==='direct')return 'Direto';
  if(rawSource)return rawSource.replace(/^www\./,'').replace(/\.(com|com\.br|net|org)$/,'');
  return 'Desconhecido';
 };
 const onlineCutoff=Date.now()-150000;
 const rows=users.map(u=>{
  const ev=(byUser.get(u.id)||[]).slice().sort((a,b)=>new Date(a.created_at)-new Date(b.created_at));
  const last=ev.length?ev[ev.length-1]:null;
  const online=!!last&&new Date(last.created_at).getTime()>=onlineCutoff;
  const sessions=new Map();
  const routeTime=new Map(), routeViews=new Map();
  for(const e of ev){
   const sid=e.session_id||`single:${e.created_at}`;
   if(!sessions.has(sid))sessions.set(sid,{first:e.created_at,last:e.created_at,count:0});
   const ss=sessions.get(sid);ss.count++;ss.last=e.created_at;
   if(e.route){
    if(e.event==='session_heartbeat')routeTime.set(e.route,(routeTime.get(e.route)||0)+60);
    if(e.event==='page_view')routeViews.set(e.route,(routeViews.get(e.route)||0)+1);
   }
  }
  const durations=[...sessions.values()].map(ss=>Math.max(0,(new Date(ss.last)-new Date(ss.first))/1000)).filter(v=>Number.isFinite(v));
  const avgSession=durations.length?durations.reduce((a,b)=>a+b,0)/durations.length:0;
  let topRoute='';
  if(routeTime.size)topRoute=[...routeTime.entries()].sort((a,b)=>b[1]-a[1])[0][0];
  else if(routeViews.size)topRoute=[...routeViews.entries()].sort((a,b)=>b[1]-a[1])[0][0];
  const currentRoute=online?(last?.route||topRoute||''):'';
  const signupEvent=signupByUser.get(u.id)||ev.find(e=>e.event==='signup_completed');
  const touchEvents=ev.filter(e=>e.source||e.referrer);
  const firstTouch=signupEvent||touchEvents[0]||null;
  const lastTouch=touchEvents.length?touchEvents[touchEvents.length-1]:firstTouch;
  const firstEvent=(name)=>ev.find(e=>e.event===name)?.created_at||null;
  const acquisitionSource=classifySource(firstTouch);
  const sub=latestSub.get(u.id)||null;
  const paidAt=paidAtByUser.get(u.id)||firstEvent('payment_approved')||null;
  const milestones={
   signup_at: signupEvent?.created_at||u.created_at||null,
   activation_at:firstEvent('activation_completed'),
   first_transaction_at:firstEvent('first_transaction'),
   first_card_at:firstEvent('first_card'),
   trial_at:firstEvent('trial_started'),
   checkout_at:firstEvent('checkout_started'),
   paid_at:paidAt
  };
  const isPaid=!!paidAt||sub?.status==='authorized'||sub?.status==='active';
  const activated=!!milestones.activation_at;
  let stage='Cadastrou';
  if(activated)stage='Ativado';
  if(milestones.trial_at)stage='Em teste';
  if(milestones.checkout_at)stage='Checkout';
  if(isPaid)stage='Pagante';
  const activeDays=new Set(ev.map(e=>String(e.created_at||'').slice(0,10)).filter(Boolean)).size;
  const lastSeen=last?.created_at||u.last_sign_in_at||null;
  const daysSinceLast=lastSeen?Math.max(0,Math.floor((Date.now()-new Date(lastSeen).getTime())/86400000)):9999;
  let health='Novo';
  if(isPaid)health=daysSinceLast>14?'Pagante inativo':'Pagante ativo';
  else if(!activated&&daysSinceLast>=3)health='Risco de abandono';
  else if(daysSinceLast>=7)health='Inativo 7+ dias';
  else if(activated)health='Ativo';
  return {
   id:u.id,
   name:u.user_metadata?.full_name||u.user_metadata?.name||'',
   email:u.email||'',
   phone:u.phone||u.user_metadata?.phone||'',
   created_at:u.created_at||null,
   online,
   last_seen_at:lastSeen,
   current_route:currentRoute,
   last_route:last?.route||null,
   most_used_route:topRoute||null,
   average_session_seconds:Math.round(avgSession),
   sessions:sessions.size,
   active_days:activeDays,
   events:ev.length,
   device:last?.device||null,
   browser:last?.browser||null,
   os:last?.os||null,
   acquisition_source:acquisitionSource,
   acquisition_source_raw:firstTouch?.source||null,
   acquisition_medium:firstTouch?.medium||null,
   acquisition_campaign:firstTouch?.campaign||null,
   acquisition_landing:firstTouch?.landing||null,
   acquisition_at:firstTouch?.created_at||null,
   last_source:classifySource(lastTouch),
   last_campaign:lastTouch?.campaign||null,
   plan:sub?.plan||'free',
   subscription_status:sub?.status||'none',
   activated,
   is_paid:isPaid,
   conversion_stage:stage,
   engagement_health:health,
   days_since_last:daysSinceLast,
   milestones
  };
 }).sort((a,b)=>(Number(b.online)-Number(a.online))||(new Date(b.last_seen_at||0)-new Date(a.last_seen_at||0)));
 const originMap=new Map();
 for(const r of rows){
  const key=r.acquisition_source||'Desconhecido';
  if(!originMap.has(key))originMap.set(key,{source:key,users:0,activated:0,paid:0});
  const o=originMap.get(key);o.users++;if(r.activated)o.activated++;if(r.is_paid)o.paid++;
 }
 const origin_conversion=[...originMap.values()].map(o=>({...o,activation_rate:o.users?o.activated/o.users*100:0,paid_rate:o.users?o.paid/o.users*100:0})).sort((a,b)=>b.users-a.users);
 const recentCutoff=Date.now()-days*86400000;
 return {
  generated_at:new Date().toISOString(),days,
  online_count:rows.filter(x=>x.online).length,
  tracked_count:rows.filter(x=>x.events>0).length,
  new_users_count:rows.filter(x=>x.created_at&&new Date(x.created_at).getTime()>=recentCutoff).length,
  activated_count:rows.filter(x=>x.activated).length,
  paid_count:rows.filter(x=>x.is_paid).length,
  risk_count:rows.filter(x=>x.engagement_health==='Risco de abandono'||x.engagement_health==='Inativo 7+ dias').length,
  origin_conversion,
  rows
 };
}
/* Fase 8.16 — SEO Intelligence: só eventos técnicos e pagamentos aprovados (sem valores) */
async function seo(q={}){
 const days=Math.min(90,Math.max(7,Number(q.days)||30));
 const validDate=v=>/^\d{4}-\d{2}-\d{2}$/.test(String(v||''))?String(v):'';
 const from=validDate(q.from),to=validDate(q.to);
 const since=from?new Date(from+'T00:00:00.000Z').toISOString():ago(days);
 const until=to?new Date(to+'T23:59:59.999Z').toISOString():null;
 const spanDays=from&&to?Math.max(1,Math.ceil((new Date(to)-new Date(from))/86400000)+1):days;
 const eventSince=from?new Date(new Date(since).getTime()-120*86400000).toISOString():ago(Math.max(120,days));
 const EV='seo_page_viewed,seo_article_viewed,seo_tool_clicked,seo_signup_clicked,seo_related_article_clicked,seo_engaged,seo_tool_started,seo_tool_completed,seo_tool_downloaded,seo_video_played,public_tool_opened,public_tool_completed,public_tool_signup_clicked,signup_completed,activation_completed,trial_started,checkout_started,organic_share_open,organic_share_whatsapp,organic_share_native,organic_share_copy,result_card_generated,result_card_downloaded,embed_code_copied,external_referral_visit,tool_shared,tool_embed_opened';
 const [events,productEvents,payments,gscData]=await Promise.all([
  rest(`analytics_events?created_at=gte.${encodeURIComponent(eventSince)}&event=in.(${EV})&select=visitor_id,user_id,event,route,source,medium,campaign,content,landing,referrer,created_at&order=created_at.asc&limit=50000`),
  rest(`product_events?created_at=gte.${encodeURIComponent(eventSince)}&event=eq.trial_started&select=user_id,event,created_at&limit=20000`),
  rest('billing_payments?status=eq.approved&select=user_id,status&limit=10000'),
  (from&&to?gsc.performanceRange(from,to):gsc.performance(Math.min(spanDays,90))).catch(e=>({connected:true,error:e.message}))
 ]);
 const r=seoIntel.analyze({events:events||[],productEvents:productEvents||[],payments:payments||[],since,until,minVolume:Number(q.min)||20});
 return {generated_at:new Date().toISOString(),days:spanDays,range:{from:from||null,to:to||null},...r,search_console:gscData};
}
async function clients(q){const users=await authUsers(),subs=await rest('billing_subscriptions?select=user_id,plan,status,next_payment_date,created_at&order=created_at.desc&limit=5000');const latest=new Map();subs.forEach(s=>{if(!latest.has(s.user_id))latest.set(s.user_id,s)});let rows=users.map(u=>{const s=latest.get(u.id);return{id:u.id,name:u.user_metadata?.full_name||u.user_metadata?.name||'',email:u.email||'',phone:u.phone||u.user_metadata?.phone||'',created_at:u.created_at,last_sign_in_at:u.last_sign_in_at,plan:s?.plan||'free',subscription_status:s?.status||'none',next_payment_date:s?.next_payment_date||null}});const search=String(q.search||'').toLowerCase().trim();if(search)rows=rows.filter(x=>(x.name+' '+x.email+' '+x.phone).toLowerCase().includes(search));if(q.plan)rows=rows.filter(x=>x.plan===q.plan);const page=Math.max(1,Number(q.page)||1),size=Math.min(5000,Math.max(10,Number(q.size)||25));return{total:rows.length,page,size,rows:rows.slice((page-1)*size,page*size)}}
exports.handler=async event=>{if(!adminKey())return out(503,{error:'Admin indisponível'});const a=await adminAuth(event);if(a.error)return a.error;const q=event.queryStringParameters||{},action=q.action||'me';try{if(action==='me')return out(200,{admin:true,role:a.role});if(action==='dashboard')return out(200,await dashboard(q));if(action==='activity')return out(200,await activity(q));if(action==='clients')return out(200,await clients(q));if(action==='seo')return out(200,await seo(q));if(action==='export'){const d=await clients({...q,page:1,size:10000}),esc=v=>'"'+String(v??'').replace(/"/g,'""')+'"',csv='Nome,Email,Telefone,Plano,Status,Data cadastro,Próxima cobrança\n'+d.rows.map(x=>[x.name,x.email,x.phone,x.plan,x.subscription_status,x.created_at,x.next_payment_date].map(esc).join(',')).join('\n');await rest('admin_audit_logs',{method:'POST',body:{admin_user_id:a.user.id,action:'export_clients',detail:{count:d.rows.length}},prefer:'return=minimal'}).catch(()=>{});return{statusCode:200,headers:{'Content-Type':'text/csv; charset=utf-8','Content-Disposition':'attachment; filename="bivvo-clientes.csv"','Cache-Control':'no-store'},body:'\ufeff'+csv}}return out(404,{error:'Ação não encontrada'})}catch(e){console.error('admin',e);return out(500,{error:'Não foi possível carregar a administração.'})}};
