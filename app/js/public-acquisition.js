import { adminTrack } from './admin-analytics.js';
import { classifyReferral, safeSlug } from './growth-utils.mjs';

const route = location.pathname.replace(/\/+$/, '') || '/';
const once = new Set();
const sendOnce = (event, content='') => { const k=event+'|'+content; if(once.has(k)) return; once.add(k); adminTrack(event, route, {content}).catch(()=>{}); };
const slug = s => safeSlug(s);
const isSignup = a => /signup=1/.test(a.getAttribute('href') || '');
const isInternalContent = a => { try { const u=new URL(a.href,location.href); return u.origin===location.origin&&!isSignup(a)&&u.pathname!==location.pathname&&!u.pathname.startsWith('/#/'); } catch{return false;} };

// Uma visualização de cada página por sessão, inclusive após recarregar.
let viewed=false;
try{const key='bivvo_public_view:'+route;viewed=sessionStorage.getItem(key)==='1';if(!viewed)sessionStorage.setItem(key,'1');}catch{}
if(!viewed)adminTrack(route.startsWith('/aprenda/') ? 'seo_article_viewed' : 'seo_page_viewed', route).catch(()=>{});

// 11.42: registra apenas a origem técnica (share/embed/IA/site externo). Não envia valores financeiros.
try {
  const inbound = classifyReferral(location.href, document.referrer);
  if (inbound.channel !== 'direct') sendOnce('external_referral_visit', `${inbound.channel}:${inbound.source}`);
  if (inbound.channel === 'embed') sendOnce('tool_embed_opened', 'embed');
} catch {}

// Engajamento: sem enviar texto digitado, renda, gastos ou resultados financeiros.
let maxDepth=0;
const depth=()=>{ const d=document.documentElement, max=Math.max(1,d.scrollHeight-d.clientHeight); const p=Math.round((scrollY/max)*100); for(const mark of [25,50,75,90]) if(p>=mark&&maxDepth<mark){maxDepth=mark;sendOnce('seo_engaged', 'scroll_'+mark);} };
addEventListener('scroll',depth,{passive:true});
setTimeout(()=>sendOnce('seo_engaged','time_30s'),30000);

// Os próprios cálculos anunciam conclusão; mudanças no DOM não são evidência.
const toolRoots=[...document.querySelectorAll('#spendableTool, #salaryCalc, #vacationCalc, #expenseCalc, #diagnosticoForm, form#calcForm')];
const toolId=root=>root.dataset.seoTool||({spendableTool:'spendable',salaryCalc:'salary_2026',vacationCalc:'vacation_estimate',expenseCalc:'monthly_expenses',diagnosticoForm:'diagnosis'}[root.id])||document.body.dataset.tool||'embedded';
for(const root of toolRoots){
 const start=()=>sendOnce('seo_tool_started',toolId(root));
 root.addEventListener('input',start,{passive:true});root.addEventListener('change',start,{passive:true});
}
document.addEventListener('bivvo:tool',e=>{
 const tool=slug(e.detail?.tool||'');if(!tool)return;
 if(e.detail?.phase==='started')sendOnce('seo_tool_started',tool);
 if(e.detail?.phase==='completed'){sendOnce('seo_tool_started',tool);sendOnce('seo_tool_completed',tool);}
});

// Eventos disparados por componentes de distribuição 11.42.
const GROWTH_EVENTS = new Set([
  'organic_share_open','organic_share_attempt','organic_share_canceled','organic_share_failed','organic_share_whatsapp','organic_share_native','organic_share_copy',
  'content_card_generated','content_card_downloaded','result_card_generated','result_card_downloaded','embed_code_copied','tool_shared','tool_embed_opened'
]);
document.addEventListener('bivvo:track', e => {
  const ev=String(e?.detail?.event||''); if(!GROWTH_EVENTS.has(ev)) return;
  const content=slug(e?.detail?.content||'').slice(0,80);
  adminTrack(ev,route,{content}).catch(()=>{});
});

document.addEventListener('click', e => {
  const video=e.target.closest('[data-bv-video]');
  if(video) sendOnce('seo_video_played', slug(video.getAttribute('aria-label')||video.textContent||'video'));
  const a=e.target.closest('a[href]'); if(!a)return;
  if(a.matches('.download-sheet,[download]')) sendOnce('seo_tool_downloaded', slug(a.getAttribute('download')||a.textContent||'download'));
  if(isSignup(a)) adminTrack('seo_signup_clicked',route,{content:slug(a.textContent||'cta')}).catch(()=>{});
  else if(isInternalContent(a)) {
    const target=new URL(a.href,location.href).pathname;
    const isTool=/^\/(calculadoras\/|calculadora-|planilha-de-gastos-mensais\/?$|diagnostico-financeiro\/?$|quanto-posso-gastar-hoje\/?$)/.test(target);
    adminTrack(isTool?'seo_tool_clicked':'seo_related_article_clicked',route,{content:target.slice(0,80)}).catch(()=>{});
  }
});
