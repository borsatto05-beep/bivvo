const { analyze, classifyInbound } = require('../netlify/lib/seo-intelligence.js');
let pass=0,fail=0;const ok=(c,n,x='')=>{if(c){pass++;console.log('  ✓',n)}else{fail++;console.log('  ✗',n,x)}};
const at=m=>new Date(Date.UTC(2026,9,5,12,m)).toISOString();
const e=(visitor,event,route,m,extra={})=>({visitor_id:visitor,user_id:null,event,route,source:'direct',medium:'',content:'',landing:'/planilha-de-gastos-mensais/',created_at:at(m),...extra});
const R='/planilha-de-gastos-mensais';
const events=[
 e('a','seo_page_viewed',R,1),e('a','organic_share_whatsapp',R,2,{source:'direct'}),e('a','tool_shared',R,2,{source:'direct'}),
 e('b','external_referral_visit',R,3,{source:'whatsapp',medium:'share',content:'share:whatsapp'}),e('b','seo_page_viewed',R,4,{source:'whatsapp',medium:'share'}),
 e('b','seo_tool_started',R,5,{source:'whatsapp',medium:'share'}),e('b','seo_tool_completed',R,6,{source:'whatsapp',medium:'share'}),
 e('b','signup_completed','signup',7,{user_id:'u1',source:'whatsapp',medium:'share'}),
 e('c','external_referral_visit','/calculadoras/parcelas',8,{source:'example.com',content:'embed:example.com'}),
 e('c','tool_embed_opened','/calculadoras/parcelas',9,{content:'parcelas'}),
 e('d','external_referral_visit',R,10,{source:'chatgpt.com',content:'ai:chatgpt'}),
];
const r=analyze({events,payments:[],productEvents:[],since:at(0),minVolume:1});
ok(r.kpis.shares===1&&r.kpis.sharers===1,'conta compartilhamentos e compartilhadores',JSON.stringify(r.kpis));
ok(r.kpis.referred_visitors===3&&r.kpis.whatsapp_visitors===1&&r.kpis.embed_visitors===1&&r.kpis.ai_visitors===1,'separa visitas por referência',JSON.stringify(r.kpis));
ok(r.kpis.referred_signups===1&&r.kpis.signups===1,'atribui cadastro vindo de share',JSON.stringify(r.kpis));
ok(r.distribution.sources.some(x=>x.source==='whatsapp'&&x.visits===1),'origem WhatsApp aparece na distribuição',JSON.stringify(r.distribution));
const budget=r.tools.find(x=>x.slug==='planilha-de-gastos-mensais');ok(budget&&budget.shares===1&&budget.referral_visits>=2&&budget.whatsapp_visits===1,'ferramenta agrega share e referrals',JSON.stringify(budget));
const tool=r.tools.find(x=>x.slug==='parcelas');ok(tool&&tool.embed_opens===1&&tool.referral_visits===1,'ferramenta agrega abertura por embed',JSON.stringify(tool));
ok(classifyInbound({source:'chatgpt.com',content:'',medium:''})==='chatgpt','classifica origem de IA sem inventar');
ok(!JSON.stringify(r).match(/3200|9000|R\$/),'agregados não carregam valores financeiros');
console.log(`\n${pass} passaram, ${fail} falharam`);process.exit(fail?1:0);
