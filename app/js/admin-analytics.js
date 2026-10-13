import {captureReferralCode} from './acquisition.js';
import * as cloud from './cloud.js';
const id=(key,storage=localStorage)=>{try{let v=storage.getItem(key);if(!v){v=crypto.randomUUID();storage.setItem(key,v)}return v}catch{return crypto.randomUUID()}};
const visitor=id('bivvo_visitor_id');
const session=id('bivvo_session_id',sessionStorage);
const qs=new URLSearchParams(location.search);
captureReferralCode(location.href);
const domain=v=>{try{return new URL(v).hostname.replace(/^www\./,'').slice(0,80)}catch{return ''}};
function attribution(){
  const firstKey='bivvo_first_touch_v1', lastKey='bivvo_last_touch_v1';
  try{
    const refHost=domain(document.referrer);
    const ref=refHost===location.hostname.replace(/^www\./,'')?'':refHost;
    const hasUtm=['utm_source','utm_medium','utm_campaign','utm_content','utm_term'].some(k=>qs.has(k));
    const current={source:qs.get('utm_source')||(!ref?'direct':ref),medium:qs.get('utm_medium')||(ref?'referral':''),campaign:qs.get('utm_campaign')||'',content:qs.get('utm_content')||'',term:qs.get('utm_term')||'',landing:(location.pathname+location.hash).slice(0,80),referrer:ref};
    const oldFirst=JSON.parse(localStorage.getItem(firstKey)||'null');
    if(!oldFirst)localStorage.setItem(firstKey,JSON.stringify(current));
    if(hasUtm||!localStorage.getItem(lastKey))localStorage.setItem(lastKey,JSON.stringify(current));
    const first=oldFirst||current;
    const last=JSON.parse(localStorage.getItem(lastKey)||'null')||current;
    return {current:hasUtm?current:last,first,last};
  }catch{const d={source:'direct',medium:'',campaign:'',content:'',term:'',landing:'',referrer:''};return{current:d,first:d,last:d}}
}
const touch=attribution();
const screenBucket=()=>innerWidth<480?'xs':innerWidth<768?'sm':innerWidth<1024?'md':innerWidth<1440?'lg':'xl';
export async function adminTrack(event,route='',extra={}){
  const payload={visitor_id:visitor,session_id:session,event,route,source:touch.current.source,medium:touch.current.medium,campaign:touch.current.campaign,content:String(extra.content||touch.current.content||'').slice(0,80),term:touch.current.term,landing:touch.current.landing,referrer:touch.current.referrer,language:(navigator.language||'').slice(0,16),screen:screenBucket(),error_type:String(extra.error_type||'').slice(0,40),error_message:String(extra.error_message||'').slice(0,180),app_version:String(extra.app_version||'').slice(0,20)};
  const token=await cloud.accessToken().catch(()=>null);
  fetch('/api/analytics/event',{method:'POST',headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},body:JSON.stringify(payload),keepalive:true}).catch(()=>{});
}
export function trackVisit(){
  const sig=[touch.current.source,touch.current.medium,touch.current.campaign].join('|'); const k='bivvo_visit_sent:'+sig; try{if(sessionStorage.getItem(k))return;sessionStorage.setItem(k,'1')}catch{}
  adminTrack('site_visit','landing').catch(()=>{});
}
export function trackSignupStart(){ const k='bivvo_signup_started'; try{if(sessionStorage.getItem(k))return;sessionStorage.setItem(k,'1')}catch{} adminTrack('signup_started','signup').catch(()=>{}); }


// Fase 11.74 — presença autenticada para a Administração.
// Não envia dados financeiros: apenas sessão, rota atual e horário técnico.
let presenceTimer = null;
let presenceBound = false;
function currentRoute(){
  try { return (location.hash.replace(/^#\/?/, '').split('?')[0] || 'inicio').slice(0,80); } catch { return 'inicio'; }
}
async function sendPresence(){
  if (document.visibilityState === 'hidden') return;
  try { if (!cloud.currentUser?.()) return; } catch { return; }
  await adminTrack('session_heartbeat', currentRoute()).catch(()=>{});
}
export function startPresenceTracking(){
  if (presenceTimer) return;
  sendPresence();
  presenceTimer = setInterval(sendPresence, 60000);
  if (!presenceBound) {
    presenceBound = true;
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') sendPresence(); });
    window.addEventListener('focus', sendPresence);
  }
}
