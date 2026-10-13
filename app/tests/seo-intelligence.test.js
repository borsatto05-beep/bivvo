/* Bivvo 11.16 — teste do SEO Intelligence com eventos sintéticos (sem dados reais).  node tests/seo-intelligence.test.js */
const { analyze } = require('../netlify/lib/seo-intelligence.js');
let pass = 0, fail = 0; const ok = (c, n, x = '') => { if (c) { pass++; console.log('  ✓', n); } else { fail++; console.log('  ✗', n, x); } };
const t = m => new Date(Date.UTC(2026, 9, 1, 12, m)).toISOString();
const ev = (visitor_id, event, route, m, extra = {}) => ({ visitor_id, user_id: null, event, route, medium: 'organic', content: '', landing: '/aprenda/', created_at: t(m), ...extra });
const A = 'seo/artigo/quanto-posso-gastar-por-dia', A2 = 'seo/artigo/como-sair-das-dividas', TOOL = 'seo/ferramenta/parcelas';
const events = [];
/* 30 visitantes no artigo A; 10 clicam na calculadora; 4 se cadastram; 2 ativam; 1 trial; 1 checkout */
for (let i = 0; i < 30; i++) { events.push(ev('v' + i, 'seo_page_viewed', A, i, { content: 'orcamento' }), ev('v' + i, 'seo_article_viewed', A, i, { content: 'orcamento' })); }
for (let i = 0; i < 10; i++) { events.push(ev('v' + i, 'seo_tool_clicked', A, 40 + i, { content: 'tool:parcelas' }), ev('v' + i, 'public_tool_opened', TOOL, 41 + i), ev('v' + i, 'public_tool_completed', TOOL, 42 + i)); }
for (let i = 10; i < 20; i++) events.push(ev('v' + i, 'public_tool_opened', TOOL, 41 + i)); /* 10 abriram direto, sem clicar no artigo */
for (let i = 0; i < 6; i++) events.push(ev('v' + i, 'public_tool_signup_clicked', TOOL, 60 + i));
for (let i = 0; i < 4; i++) events.push(ev('v' + i, 'signup_completed', 'signup', 80 + i, { user_id: 'u' + i }));
events.push(ev(null, 'activation_completed', 'home', 100, { user_id: 'u0' }), ev(null, 'activation_completed', 'home', 101, { user_id: 'u1' }), ev(null, 'checkout_started', 'plan', 120, { user_id: 'u0' }));
/* 25 visitantes no artigo A2, nenhum clique em ferramenta */
for (let i = 0; i < 25; i++) events.push(ev('w' + i, 'seo_page_viewed', A2, 5 + i, { content: 'dividas' }), ev('w' + i, 'seo_article_viewed', A2, 5 + i, { content: 'dividas' }));
/* cadastro sem visita SEO e sem landing SEO: não conta */
events.push(ev('x1', 'signup_completed', 'signup', 90, { user_id: 'ux', landing: '/' , medium: '' }));
/* cadastro que entrou pela página antiga /quanto-posso-gastar/ (landing): conta como SEO, entrada unificada */
events.push(ev('y1', 'signup_completed', 'signup', 95, { user_id: 'uy', landing: '/quanto-posso-gastar/' }));
const r = analyze({ events, productEvents: [{ user_id: 'u0', event: 'trial_started', created_at: t(110) }], payments: [{ user_id: 'u0', status: 'approved' }, { user_id: 'ux', status: 'approved' }], since: t(0), minVolume: 20 });
ok(r.kpis.seo_visitors === 55 && r.kpis.organic_visitors === 55, 'visitantes SEO/orgânicos', JSON.stringify(r.kpis));
ok(r.kpis.article_views === 55, 'visitas em artigos');
ok(r.kpis.tool_from_content === 10, 'abriram calculadora a partir de conteúdo');
ok(r.kpis.signups === 5, '4 cadastros pelo artigo + 1 pela entrada antiga; cadastro sem SEO fora', r.kpis.signups);
ok(r.kpis.activated === 2 && r.kpis.trials === 1 && r.kpis.checkouts === 1 && r.kpis.paid === 1, 'ativação, trial, checkout e pagante seguem o usuário', JSON.stringify(r.kpis));
const pa = r.pages.find(p => p.slug === 'quanto-posso-gastar-por-dia');
ok(pa.visits === 30 && pa.tool_clicks === 10 && pa.signups === 4 && pa.activations === 2 && pa.paid === 1, 'ranking do artigo A', JSON.stringify(pa));
ok(r.pages[0].slug === 'quanto-posso-gastar-por-dia', 'ranking ordena por pagantes, não por visitas');
const tool = r.tools.find(x => x.slug === 'parcelas');
ok(tool.opens === 20 && tool.completes === 10 && tool.signup_clicks === 6 && tool.signups === 4, 'calculadora: aberturas, conclusões, cliques e cadastros', JSON.stringify(tool));
ok(r.opportunities.some(o => /como sair das dividas/.test(o.title) && /calculadora/.test(o.title)), 'oportunidade: artigo com visitas e sem cliques na calculadora');
ok(r.opportunities.some(o => /parcelas/.test(o.title) && /cadastro/.test(o.title)), 'oportunidade: calculadora com muitos cliques para cadastro');
ok(r.pages.some(p => p.route === 'seo/entrada/quanto-posso-gastar'), 'entrada antiga aparece com o slug de entrada', JSON.stringify(r.pages.map(p => p.route)));
const rate = k => r.rates.find(x => x.key === k).value;
ok(Math.abs(rate('article_tool') - 100 * 10 / 55) < 0.01 && Math.abs(rate('signup_activation') - 40) < 0.01, 'taxas calculadas a partir das contagens');
const empty = analyze({ events: [], since: t(0) });
ok(empty.kpis.signups === 0 && empty.opportunities[0].tone === 'neutral' && empty.rates.every(x => x.value === null), 'sem dados: zeros, taxas vazias e aviso de volume baixo');
const json = JSON.stringify(r);
ok(!/saldo|renda|R\$/.test(json), 'saída não contém dados financeiros');
console.log(`\n${pass} passaram, ${fail} falharam`); process.exit(fail ? 1 : 0);
