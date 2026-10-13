/* Bivvo 11.42 — SEO + Distribuição Intelligence.
   Função pura: recebe eventos técnicos e devolve somente agregados.
   Nunca recebe renda, saldo, dívida, valor digitado ou resultado financeiro. */

const SEO_PATH = /^\/(aprenda\/|calculadoras\/|calculadora-|planilha-de-gastos-mensais|quanto-posso-gastar|controle-financeiro-pessoal|app-controle-financeiro|planejamento-financeiro-pessoal|orcamento-domestico|organizar-cartao-de-credito|como-|dinheiro-nao-da|sair-do-aperto|diagnostico-financeiro|ferramentas\/|recursos\/)/;
const pct = (a, b) => (b ? (100 * a) / b : null);
const slugOfRoute = r => String(r || '').split('/').filter(Boolean).pop() || 'inicio';
const typeOfRoute = r => {
  const v=String(r||'');
  if (v.startsWith('seo/')) return v.split('/')[1] || '';
  const p=v.split('?')[0].replace(/^\/+|\/+$/g,'');
  const seg=p.split('/').filter(Boolean);
  if (seg[0]==='aprenda') return seg.length>=3?'artigo':seg.length===2?'categoria':'hub';
  if (seg[0]==='calculadoras' || /^calculadora-/.test(seg[0]||'') || ['planilha-de-gastos-mensais','diagnostico-financeiro','quanto-posso-gastar-hoje'].includes(seg[0])) return 'ferramenta';
  if (['ferramentas','recursos','imprensa'].includes(seg[0])) return 'hub';
  return seg.length?'landing':'';
};
const canonRoute = r => String(r || '').replace(/\/quanto-posso-gastar$/, '/quanto-posso-gastar-hoje');
const pathToSlug = p => String(p || '').split('?')[0].split('#')[0].replace(/\/+$/, '').split('/').pop() || 'inicio';
const SHARE_EVENTS = new Set(['organic_share_whatsapp','organic_share_native','organic_share_copy']);
const shareSource = e => {
  const s = String(e.source || '').toLowerCase();
  const c = String(e.content || '').toLowerCase();
  if (s === 'whatsapp' || c.includes('whatsapp')) return 'whatsapp';
  if (s === 'native_share') return 'native_share';
  if (s === 'copy_link') return 'copy_link';
  return s || 'share';
};
const classifyInbound = e => {
  const c = String(e.content || '').toLowerCase();
  const source = String(e.source || '').toLowerCase();
  if (c.startsWith('share:') || ['whatsapp','native_share','copy_link','tool_result','result_card'].includes(source)) return source === 'whatsapp' || c.includes('whatsapp') ? 'whatsapp' : 'share';
  if (c.startsWith('embed:') || source === 'embed') return 'embed';
  if (c.startsWith('ai:') || source.includes('chatgpt') || source.includes('openai') || source.includes('copilot')) return source.includes('copilot') ? 'copilot' : 'chatgpt';
  if (c.startsWith('social:') || /instagram|facebook|youtube|youtu\.be/.test(source)) return source.includes('instagram')?'instagram':source.includes('facebook')?'facebook':'youtube';
  if (c.startsWith('organic:') || /google|bing/.test(source) || e.medium === 'organic') return source.includes('bing')?'bing':source.includes('google')?'google':source||'organic';
  if (c.startsWith('external:')) return 'external';
  return source || 'external';
};

const referralSource = e => {
  const c=String(e.content||'').toLowerCase();
  if (c.startsWith('external:')) return c.slice(9,69) || 'site externo';
  if (c.startsWith('embed:')) return 'embed:' + (c.slice(6,66) || 'desconhecido');
  if (c.startsWith('ai:')) return c.slice(3,63) || 'ia';
  if (c.startsWith('social:')) return c.slice(7,67) || 'social';
  if (c.startsWith('organic:')) return c.slice(8,68) || 'orgânico';
  if (c.startsWith('share:')) return c.slice(6,66) || 'share';
  return classifyInbound(e);
};

function analyze({ events = [], productEvents = [], payments = [], since, until, minVolume = 20 }) {
  const asc = [...events].sort((a, b) => String(a.created_at).localeCompare(String(b.created_at)));
  const inRange = e => (!since || e.created_at >= since) && (!until || e.created_at <= until);
  const seoViews = asc.filter(e => e.event === 'seo_page_viewed').map(e => ({ ...e, route: canonRoute(e.route) }));

  const seoVisitorFirst = new Map();
  for (const e of seoViews) if (e.visitor_id && !seoVisitorFirst.has(e.visitor_id)) seoVisitorFirst.set(e.visitor_id, e.created_at);
  const rangeViews = seoViews.filter(inRange);
  const seoVisitors = new Set(rangeViews.map(e => e.visitor_id).filter(Boolean));
  const organicVisitors = new Set(rangeViews.filter(e => e.medium === 'organic' || ['google','bing'].includes(String(e.source||'').toLowerCase())).map(e => e.visitor_id).filter(Boolean));
  const articleRows = asc.filter(e => e.event === 'seo_article_viewed' && inRange(e));
  const articleVisitors = new Set(articleRows.map(e => e.visitor_id).filter(Boolean));

  const toolClicks = asc.filter(e => e.event === 'seo_tool_clicked' && inRange(e) && typeOfRoute(e.route) !== 'ferramenta');
  const toolFromContent = new Set(toolClicks.map(e => e.visitor_id).filter(Boolean));
  const toolOpens = asc.filter(e => (e.event === 'public_tool_opened' || e.event === 'seo_tool_started') && inRange(e));
  const toolOpeners = new Set(toolOpens.map(e => e.visitor_id).filter(Boolean));
  const signupClicks = asc.filter(e => (e.event === 'seo_signup_clicked' || e.event === 'public_tool_signup_clicked') && inRange(e));
  const signupClickers = new Set(signupClicks.map(e => e.visitor_id).filter(Boolean));
  const shareRows = asc.filter(e => SHARE_EVENTS.has(e.event) && inRange(e));
  const sharers = new Set(shareRows.map(e=>e.visitor_id).filter(Boolean));
  const referralRows = asc.filter(e => e.event === 'external_referral_visit' && inRange(e));
  const referredVisitors = new Set(referralRows.map(e=>e.visitor_id).filter(Boolean));
  const whatsappVisitors = new Set(referralRows.filter(e=>classifyInbound(e)==='whatsapp').map(e=>e.visitor_id).filter(Boolean));
  const embedVisitors = new Set(referralRows.filter(e=>classifyInbound(e)==='embed').map(e=>e.visitor_id).filter(Boolean));
  const aiVisitors = new Set(referralRows.filter(e=>['chatgpt','copilot'].includes(classifyInbound(e))).map(e=>e.visitor_id).filter(Boolean));

  const lastSeoBefore = (visitor, at) => { let r = null; for (const e of seoViews) { if (e.visitor_id !== visitor) continue; if (e.created_at > at) break; r = e; } return r; };
  const lastToolBefore = (visitor, at) => { let r = null; for (const e of asc) { if (e.created_at > at) break; if (e.visitor_id === visitor && (e.event === 'public_tool_opened' || e.event === 'seo_tool_started')) r = e; } return r; };
  const signups = [];
  for (const e of asc) {
    if (e.event !== 'signup_completed' || !e.user_id || !inRange(e)) continue;
    const viaVisit = e.visitor_id && seoVisitorFirst.has(e.visitor_id) && seoVisitorFirst.get(e.visitor_id) <= e.created_at;
    const viaLanding = SEO_PATH.test(String(e.landing || ''));
    if (!viaVisit && !viaLanding) continue;
    const page = lastSeoBefore(e.visitor_id, e.created_at);
    const tool = lastToolBefore(e.visitor_id, e.created_at);
    const viewedArticle = !!e.visitor_id && seoViews.some(v => v.visitor_id === e.visitor_id && typeOfRoute(v.route) === 'artigo' && v.created_at <= e.created_at);
    const inbound = classifyInbound(e);
    signups.push({ user: e.user_id, visitor: e.visitor_id, at: e.created_at, route: page ? page.route : `seo/entrada/${pathToSlug(e.landing)}`, category: page?.content || '', tool: tool ? tool.route : null, viewedArticle, organic: e.medium === 'organic', inbound, source: e.source || '' });
  }
  const byUser = new Map(); for (const s of signups) if (!byUser.has(s.user)) byUser.set(s.user, s);
  const seoUsers = new Set(byUser.keys());

  const usersWith = (ev, rows = asc) => new Set(rows.filter(e => e.event === ev && e.user_id && seoUsers.has(e.user_id)).map(e => e.user_id));
  const activated = usersWith('activation_completed');
  const trials = new Set([...usersWith('trial_started'), ...usersWith('trial_started', productEvents)]);
  const checkouts = usersWith('checkout_started');
  const paid = new Set(payments.filter(p => p.status === 'approved' && seoUsers.has(p.user_id)).map(p => p.user_id));
  const referredSignups = new Set([...byUser.values()].filter(s=>['whatsapp','share','embed','chatgpt','copilot','external'].includes(s.inbound)).map(s=>s.user));

  const kpis = {
    seo_visitors: seoVisitors.size, organic_visitors: organicVisitors.size,
    article_views: articleRows.length, article_visitors: articleVisitors.size,
    tool_from_content: toolFromContent.size, tool_openers: toolOpeners.size,
    signup_clicks: signupClickers.size, signups: seoUsers.size,
    activated: activated.size, trials: trials.size, checkouts: checkouts.size, paid: paid.size,
    shares: shareRows.length, sharers: sharers.size, referred_visitors: referredVisitors.size,
    whatsapp_visitors: whatsappVisitors.size, embed_visitors: embedVisitors.size, ai_visitors: aiVisitors.size,
    referred_signups: referredSignups.size
  };
  const fromTool = [...byUser.values()].filter(s => s.tool).length;
  const fromArticle = [...byUser.values()].filter(s => s.viewedArticle).length;
  const rates = [
    { key: 'article_tool', label: 'Artigo → ferramenta', value: pct([...toolFromContent].filter(v => articleVisitors.has(v)).length, articleVisitors.size) },
    { key: 'tool_signup', label: 'Ferramenta → cadastro', value: pct(fromTool, toolOpeners.size) },
    { key: 'share_visit', label: 'Compartilhamento → visita', value: pct(referredVisitors.size, sharers.size) },
    { key: 'referral_signup', label: 'Referência → cadastro', value: pct(referredSignups.size, referredVisitors.size) },
    { key: 'article_signup', label: 'Artigo → cadastro', value: pct(fromArticle, articleVisitors.size) },
    { key: 'signup_activation', label: 'Cadastro → ativação', value: pct(activated.size, seoUsers.size) },
    { key: 'activation_trial', label: 'Ativação → trial', value: pct([...trials].filter(u => activated.has(u)).length, activated.size) },
    { key: 'trial_checkout', label: 'Trial → checkout', value: pct([...checkouts].filter(u => trials.has(u)).length, trials.size) },
    { key: 'checkout_paid', label: 'Checkout → pago', value: pct([...paid].filter(u => checkouts.has(u)).length, checkouts.size) },
    { key: 'seo_paid', label: 'SEO → pagante', value: pct(paid.size, seoVisitors.size) }
  ];

  const pages = new Map();
  const page = route => { const rr=String(route||''); if (!pages.has(rr)) pages.set(rr, { route: rr, type: typeOfRoute(rr), slug: slugOfRoute(rr), category: '', visits: 0, visitors: new Set(), tool_clicks: 0, signup_clicks: 0, shares: 0, whatsapp_shares: 0, referral_visits: 0, embed_visits: 0, signups: 0, activations: 0, trials: 0, paid: 0 }); return pages.get(rr); };
  for (const e of rangeViews) { const p = page(e.route); p.visits++; if (e.visitor_id) p.visitors.add(e.visitor_id); if (e.content && !p.category) p.category = e.content; }
  for (const e of asc) {
    if (!inRange(e)) continue;
    const p=page(e.route);
    if (e.event === 'seo_tool_clicked' && typeOfRoute(canonRoute(e.route)) !== 'ferramenta') p.tool_clicks++;
    if (e.event === 'seo_signup_clicked' || e.event === 'public_tool_signup_clicked') p.signup_clicks++;
    if (SHARE_EVENTS.has(e.event)) { p.shares++; if (e.event === 'organic_share_whatsapp') p.whatsapp_shares++; }
    if (e.event === 'external_referral_visit') { p.referral_visits++; if (classifyInbound(e)==='embed') p.embed_visits++; }
  }
  for (const s of byUser.values()) { const p = page(s.route); p.signups++; if (activated.has(s.user)) p.activations++; if (trials.has(s.user)) p.trials++; if (paid.has(s.user)) p.paid++; }
  const pageRows = [...pages.values()].filter(p => p.type !== 'ferramenta').map(p => ({ ...p, visitors: p.visitors.size, conversion: pct(p.signups, p.visitors.size), share_rate: pct(p.shares, p.visitors.size) }))
    .sort((a, b) => b.paid - a.paid || b.signups - a.signups || b.shares - a.shares || b.visits - a.visits).slice(0, 40);

  const tools = new Map();
  const tool = route => { const rr=canonRoute(route); if (!tools.has(rr)) tools.set(rr, { route: rr, slug: slugOfRoute(rr), opens: 0, completes: 0, signup_clicks: 0, shares: 0, embed_opens: 0, referral_visits: 0, whatsapp_visits: 0, signups: 0 }); return tools.get(rr); };
  for (const e of asc) {
    if (!inRange(e)) continue;
    const r = canonRoute(e.route);
    if (e.event === 'public_tool_opened' || e.event === 'seo_tool_started') tool(r).opens++;
    else if (e.event === 'public_tool_completed' || e.event === 'seo_tool_completed') tool(r).completes++;
    else if (e.event === 'public_tool_signup_clicked') tool(r).signup_clicks++;
    else if (e.event === 'tool_shared') tool(r).shares++;
    else if (e.event === 'tool_embed_opened') tool(r).embed_opens++;
    else if (e.event === 'external_referral_visit' && typeOfRoute(r)==='ferramenta') { tool(r).referral_visits++; if (classifyInbound(e)==='whatsapp') tool(r).whatsapp_visits++; }
  }
  for (const s of byUser.values()) if (s.tool) tool(canonRoute(s.tool)).signups++;
  const toolRows = [...tools.values()].map(t => ({ ...t, conversion: pct(t.signups, t.opens), signup_click_rate: pct(t.signup_clicks, t.opens), share_rate: pct(t.shares,t.opens) })).sort((a, b) => b.signups - a.signups || b.shares-a.shares || b.opens - a.opens);

  const sources = new Map();
  for (const e of referralRows) { const source=referralSource(e); const x=sources.get(source)||{source,visits:0,visitors:new Set(),signups:0}; x.visits++; if(e.visitor_id)x.visitors.add(e.visitor_id); sources.set(source,x); }
  for (const s of byUser.values()) { const x=sources.get(s.inbound); if(x)x.signups++; }
  const sourceRows=[...sources.values()].map(x=>({...x,visitors:x.visitors.size,conversion:pct(x.signups,x.visitors.size)})).sort((a,b)=>b.signups-a.signups||b.visits-a.visits);

  const cats = new Map();
  for (const p of pageRows) { if (!p.category || p.category === 'produto') continue; const c = cats.get(p.category) || { category: p.category, visits: 0, signups: 0, activations: 0 }; c.visits += p.visits; c.signups += p.signups; c.activations += p.activations; cats.set(p.category, c); }
  const catRows = [...cats.values()].sort((a, b) => b.activations - a.activations || b.signups - a.signups);

  const opp = [];
  const name = p => p.slug.replace(/-/g, ' ');
  for (const p of pageRows) {
    if (p.type === 'artigo' && p.visitors >= minVolume && pct(p.tool_clicks, p.visitors) < 5) opp.push({ tone: 'warn', kind:'OPORTUNIDADE CONVERSÃO', title: `“${name(p)}” recebe visitas, mas quase ninguém abre a calculadora`, text: `${p.visitors} visitantes e ${p.tool_clicks} clique(s) em ferramenta.` });
    if (p.visitors >= minVolume && p.conversion != null && p.conversion >= 3) opp.push({ tone: 'good', kind:'PÁGINA VENCEDORA', title: `“${name(p)}” converte bem para cadastro`, text: `${p.conversion.toFixed(1)}% dos visitantes criaram conta (${p.signups}).` });
    if (p.visitors >= minVolume && (p.share_rate||0) >= 5) opp.push({ tone:'good',kind:'PÁGINA VENCEDORA',title:`“${name(p)}” é compartilhada acima da média`,text:`${p.shares} compartilhamento(s) para ${p.visitors} visitante(s).`});
    if (p.visitors >= minVolume && p.shares === 0) opp.push({ tone:'neutral',kind:'OPORTUNIDADE DISTRIBUIÇÃO',title:`“${name(p)}” tem tráfego, mas ainda não gera compartilhamentos`,text:`${p.visitors} visitantes e nenhum compartilhamento registrado no período.`});
  }
  for (const t of toolRows) if (t.opens >= minVolume && t.signup_click_rate >= 15) opp.push({ tone: 'good', kind:'PÁGINA VENCEDORA', title: `A ferramenta “${name(t)}” gera muitos cliques para cadastro`, text: `${t.signup_click_rate.toFixed(1)}% de quem abre clica em “Começar grátis”.` });
  if (whatsappVisitors.size >= Math.max(3,Math.floor(minVolume/4))) opp.push({tone:'good',kind:'OPORTUNIDADE DISTRIBUIÇÃO',title:'WhatsApp já está trazendo visitas rastreadas',text:`${whatsappVisitors.size} visitante(s) chegaram por links compartilhados.`});
  if (catRows.length >= 2 && catRows[0].activations >= 3 && catRows[0].activations >= 2 * Math.max(1, catRows[1].activations)) opp.push({ tone: 'good', kind:'PÁGINA VENCEDORA', title: `Conteúdos de ${catRows[0].category.replace(/-/g, ' ')} lideram as ativações`, text: `${catRows[0].activations} ativação(ões).` });
  const enough = seoVisitors.size >= minVolume;
  if (!opp.length) opp.push({ tone: 'neutral', kind:'POUCO SINAL', title: enough ? 'Nenhum ponto fora da curva' : 'Volume ainda baixo para conclusões', text: enough ? 'Nenhum conteúdo se destacou para melhor ou pior no período.' : `As oportunidades aparecem a partir de ${minVolume} visitantes por página. Hoje são ${seoVisitors.size} visitante(s) SEO no período.` });

  const distribution={
    shares:shareRows.length, sharers:sharers.size, referral_visits:referredVisitors.size, whatsapp_visits:whatsappVisitors.size,
    embed_visits:embedVisitors.size, ai_visits:aiVisitors.size, referred_signups:referredSignups.size, sources:sourceRows
  };
  return { kpis, rates, pages: pageRows, tools: toolRows, categories: catRows, distribution, opportunities: opp.slice(0, 12), min_volume: minVolume };
}
module.exports = { analyze, SEO_PATH, classifyInbound };
