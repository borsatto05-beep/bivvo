import { h, clear } from '../util.js';
import { adminDashboard, adminClients, adminActivity, exportClients, adminSeo } from '../admin-api.js';

const money = (n) => Number(n || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const num = (n) => Number(n || 0).toLocaleString('pt-BR');
const pc = (n) => `${Number(n || 0).toFixed(1)}%`;

const ADMIN_HELP = {
  'Visitantes': ['O que é', 'Pessoas diferentes que entraram no Bivvo no período.', 'Por que importa', 'Mostra se sua divulgação está conseguindo trazer gente para conhecer o produto.', 'Como interpretar', 'Se visitantes sobem e cadastros não, o problema costuma estar na página, mensagem ou proposta de valor.'],
  'Cadastros': ['O que é', 'Pessoas que criaram uma conta no Bivvo.', 'Por que importa', 'Mostra quantos visitantes decidiram experimentar o produto.', 'Como interpretar', 'Compare com Visitantes. Muitos visitantes e poucos cadastros indicam baixa conversão.'],
  'Pagantes': ['O que é', 'Clientes com pagamento aprovado.', 'Por que importa', 'É o número que mostra quantas pessoas realmente viraram clientes pagos.', 'Como interpretar', 'Compare com Cadastros para entender se o produto e os planos estão convencendo.'],
  'MRR': ['O que é', 'Receita mensal recorrente estimada das assinaturas ativas.', 'Por que importa', 'Ajuda a entender quanto o Bivvo gera de receita previsível por mês.', 'Como interpretar', 'O ideal é crescer ao longo do tempo com churn controlado.'],
  'Receita do período': ['O que é', 'Total de pagamentos aprovados dentro do período selecionado.', 'Por que importa', 'Mostra quanto dinheiro realmente entrou no intervalo analisado.', 'Como interpretar', 'Não confunda com MRR: receita do período pode incluir cobranças pontuais ou efeitos de datas.'],
  'Ticket médio': ['O que é', 'Valor médio pago por cliente pagante.', 'Por que importa', 'Ajuda a entender quanto, em média, cada cliente gera de receita.', 'Como interpretar', 'Pode subir com planos maiores, upgrades ou mudança no mix de clientes.'],
  'DAU / MAU': ['O que é', 'Percentual de usuários mensais que também usam o app em um dia típico.', 'Por que importa', 'É uma medida simples de frequência de uso.', 'Como interpretar', 'Quanto maior, mais frequentemente as pessoas voltam ao Bivvo.'],
  'Churn': ['O que é', 'Percentual de clientes que cancelaram.', 'Por que importa', 'Se muita gente cancela, crescer fica mais caro porque é preciso repor quem saiu.', 'Como interpretar', 'Analise junto com motivos de cancelamento e retenção.'],
  'Sessões': ['O que é', 'Quantidade de visitas/sessões no app ou site.', 'Por que importa', 'Ajuda a medir volume de uso, mas uma pessoa pode gerar várias sessões.', 'Como interpretar', 'Use junto com visitantes únicos para não confundir volume com pessoas.'],
  'D7': ['O que é', 'Retenção de 7 dias: quantos usuários voltaram cerca de uma semana depois.', 'Por que importa', 'Mostra se o Bivvo gera valor suficiente para a pessoa voltar.', 'Como interpretar', 'Quanto maior, melhor. Compare períodos semelhantes.'],
  'D30': ['O que é', 'Retenção de 30 dias.', 'Por que importa', 'Mostra se o uso continua depois do entusiasmo inicial.', 'Como interpretar', 'Queda grande entre D7 e D30 pode indicar falta de hábito ou valor recorrente.'],
  'D90': ['O que é', 'Retenção de 90 dias.', 'Por que importa', 'Ajuda a enxergar relacionamento de longo prazo com o produto.', 'Como interpretar', 'É mais lenta para formar e precisa de volume suficiente para ser confiável.'],
  'Checkout → pago': ['O que é', 'Percentual de pessoas que iniciaram checkout e tiveram pagamento aprovado.', 'Por que importa', 'Mostra se existe atrito no pagamento.', 'Como interpretar', 'Se estiver baixo, investigue preço, erro de pagamento, confiança e experiência do checkout.'],
};

let ADMIN_HELP_MODAL = null;
function showAdminHelp(title, parts = []) {
  if (ADMIN_HELP_MODAL) ADMIN_HELP_MODAL.remove();
  const rows = [];
  for (let i = 0; i < parts.length; i += 2) {
    rows.push(h('div.admin-help-block', h('b', parts[i] || ''), h('p', parts[i + 1] || '')));
  }
  ADMIN_HELP_MODAL = h('div.admin-help-backdrop', { onclick: (e) => { if (e.target === ADMIN_HELP_MODAL) { ADMIN_HELP_MODAL.remove(); ADMIN_HELP_MODAL = null; } } },
    h('section.admin-help-modal',
      h('button.admin-help-close', { type: 'button', 'aria-label': 'Fechar', onclick: () => { ADMIN_HELP_MODAL?.remove(); ADMIN_HELP_MODAL = null; } }, '×'),
      h('small', 'EXPLICAÇÃO SIMPLES'), h('h2', title), ...rows
    )
  );
  document.body.append(ADMIN_HELP_MODAL);
}

function metric(label, value, sub = '') {
  const help = ADMIN_HELP[label] || ['O que é', `Este indicador mostra ${label.toLowerCase()} dentro do período selecionado.`, 'Por que importa', 'Ele ajuda a entender uma parte do funcionamento do Bivvo. Evite tomar decisões olhando apenas este número.', 'Como interpretar', sub ? `Use o contexto mostrado abaixo do número (${sub}) e compare com períodos anteriores.` : 'Compare com outros indicadores da mesma tela e com períodos anteriores.'];
  return h('article.admin-kpi',
    h('div.admin-kpi-label', h('span', label), h('button.admin-help-btn', { type: 'button', title: `Entender ${label}`, 'aria-label': `Entender ${label}`, onclick: () => showAdminHelp(label, help) }, '?')),
    h('b', value),
    sub ? h('small', sub) : null
  );
}

function bars(title, items = []) {
  const max = Math.max(1, ...items.map((x) => Number(x?.[1] || 0)));
  return h('section.admin-card',
    h('div.admin-card-head', h('h3', title)),
    h('div.admin-bars', ...items.map(([key, value]) =>
      h('div.admin-bar-row',
        h('span', key || '—'),
        h('progress.admin-progress', { max, value: Number(value || 0), 'aria-label': `${key}: ${num(value)}` }),
        h('b', num(value))
      )
    ))
  );
}

function lineChart(rows = [], key, title, format = (v) => num(v)) {
  const vals = rows.map((x) => Number(x?.[key] || 0));
  const max = Math.max(1, ...vals);
  const width = 720;
  const height = 190;
  const pad = 18;
  const points = vals.map((value, i) => {
    const x = pad + (i * (width - 2 * pad) / Math.max(1, vals.length - 1));
    const y = height - pad - (value / max) * (height - 2 * pad);
    return `${x},${y}`;
  }).join(' ');

  return h('section.admin-card',
    h('div.admin-card-head', h('h3', title), h('small', `Máx. ${format(max)}`)),
    h('div.admin-chart-scroll',
      h('svg.admin-line', { viewBox: `0 0 ${width} ${height}`, role: 'img', 'aria-label': title },
        h('polyline', { points, fill: 'none', 'stroke-width': '4', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' })
      )
    )
  );
}

function empty(text) {
  return h('div.empty', h('b', text || 'Não foi possível carregar.'), h('p', 'Os dados aparecerão conforme o Bivvo for utilizado.'));
}

let DAYS = 30;
let CACHE = null;

async function data() {
  CACHE = await adminDashboard({ days: DAYS });
  return CACHE;
}

async function overview(root) {
  clear(root);
  root.append(h('div.admin-loading', h('div.skeleton'), h('div.skeleton'), h('div.skeleton')));
  try {
    const d = await data();
    const m = d.metrics || {};
    clear(root);
    root.append(
      h('div.admin-hero',
        h('div', h('small', 'GROWTH CENTER'), h('h2', 'Bivvo em tempo real'), h('p', 'Aquisição, conversão, receita, retenção e saúde do produto.')),
        h('span.admin-live', `● ${num(m.realtime)} online · 15 min`)
      ),
      h('div.admin-kpis',
        metric('Visitantes', num(m.visitors), `${DAYS} dias`),
        metric('Cadastros', num(m.new_30d), 'últimos 30d'),
        metric('Pagantes', num(m.paid), `${pc(m.conversion)} conversão`),
        metric('MRR', money(m.mrr)),
        metric('Receita do período', money(m.revenue_period)),
        metric('Ticket médio', money(m.ticket)),
        metric('DAU / MAU', m.mau ? pc((m.dau / m.mau) * 100) : '—', 'frequência'),
        metric('Churn', pc(m.churn), `${num(m.canceled_period)} cancelamento(s)`)
      ),
      h('div.admin-grid-2', lineChart(d.daily || [], 'visitors', 'Visitantes'), lineChart(d.daily || [], 'revenue', 'Receita aprovada', money)),
      h('section.admin-card',
        h('div.admin-card-head', h('h3', 'Oportunidades detectadas')),
        h('div.admin-opportunities', ...(d.opportunities || []).map((x) =>
          h(`article.admin-opportunity.${x.tone || 'info'}`, h('b', x.title), h('p', x.text))
        ))
      )
    );
  } catch (e) {
    clear(root);
    root.append(empty(e?.message));
  }
}

async function founderSummary(root) {
  clear(root);
  root.append(h('div.admin-loading', h('div.skeleton'), h('div.skeleton'), h('div.skeleton')));
  try {
    const d = CACHE || await data();
    const f = d.founder_summary || {};
    const a = d.growth_autopilot || {};
    const l = f.last24 || {}, p = f.period || {}, ch = f.change_vs_previous || {};
    const delta = (v) => `${Number(v || 0) >= 0 ? '+' : ''}${Number(v || 0).toFixed(1)}% vs. período anterior`;
    const primary = a.primary;
    clear(root);
    root.append(
      h('div.admin-hero',
        h('div', h('small', 'BIVVO 8.20 · RESUMO DO FUNDADOR'), h('h2', 'O que precisa da sua atenção'), h('p', 'Um resumo operacional para decidir o próximo movimento sem caçar números pelo painel.')),
        h('span.admin-live', `● Autopilot ${a.status === 'active' ? 'ativo' : 'indisponível'}`)
      ),
      primary ? h(`section.admin-card.admin-opportunity.${primary.tone || 'info'}`,
        h('div.admin-card-head', h('div', h('small', 'PRIORIDADE AGORA'), h('h3', primary.title))),
        h('p', primary.why), h('p', h('b', 'Próxima ação: '), primary.action)
      ) : null,
      h('section.admin-card',
        h('div.admin-card-head', h('div', h('h3', 'Últimas 24 horas'), h('small', 'Pulso rápido do Bivvo'))),
        h('div.admin-kpis',
          metric('Visitantes', num(l.visitors), `${num(f.previous24?.visitors || 0)} nas 24h anteriores`),
          metric('Cadastros', num(l.signups), `${num(f.previous24?.signups || 0)} nas 24h anteriores`),
          metric('Chegaram ao R$/dia', num(l.activated), `${num(f.previous24?.activated || 0)} nas 24h anteriores`),
          metric('Checkouts', num(l.checkouts), `${num(f.previous24?.checkouts || 0)} nas 24h anteriores`),
          metric('Pagantes', num(l.paid), 'pagamentos aprovados')
        )
      ),
      h('section.admin-card',
        h('div.admin-card-head', h('div', h('h3', `Resumo dos últimos ${DAYS} dias`), h('small', 'Comparação com o período imediatamente anterior'))),
        h('div.admin-kpis',
          metric('Visitantes', num(p.visitors), delta(ch.visitors)),
          metric('Cadastros', num(p.signups), delta(ch.signups)),
          metric('Ativados', num(p.activated), delta(ch.activated)),
          metric('Pagantes', num(p.paid), delta(ch.paid)),
          metric('MRR', money(p.mrr)),
          metric('Receita', money(p.revenue)),
          metric('DAU / MAU', p.mau ? pc((p.dau / p.mau) * 100) : '—'),
          metric('Churn', pc(p.churn))
        )
      ),
      h('div.admin-grid-2',
        h('section.admin-card', h('div.admin-card-head', h('h3', 'Melhor origem')), f.top_source ? h('div', h('h2', f.top_source.source || 'direct'), h('p', `${num(f.top_source.visitors)} visitantes · ${num(f.top_source.signups)} cadastros · ${num(f.top_source.paid)} pagantes`)) : h('small', 'Sem dados suficientes.')),
        h('section.admin-card', h('div.admin-card-head', h('h3', 'Melhor campanha')), f.top_campaign ? h('div', h('h2', f.top_campaign.campaign), h('p', `${f.top_campaign.source || 'direct'}${f.top_campaign.medium ? ' / ' + f.top_campaign.medium : ''} · ${num(f.top_campaign.visitors)} visitantes · ${num(f.top_campaign.signups)} cadastros`)) : h('small', 'Nenhuma campanha com UTM no período.'))
      ),
      h('section.admin-card',
        h('div.admin-card-head', h('div', h('h3', 'Growth Autopilot'), h('small', 'Ações ordenadas por impacto provável'))),
        h('div.admin-opportunities', ...(a.actions || []).map((x, i) => h(`article.admin-opportunity.${x.tone || 'info'}`, h('b', `${i + 1}. ${x.title}`), h('p', x.why), h('p', h('b', 'Fazer: '), x.action)))),
        h('p.admin-note', a.privacy || 'O Autopilot usa somente métricas agregadas e eventos técnicos.')
      )
    );
  } catch (e) { clear(root); root.append(empty(e?.message)); }
}

async function growth(root) {
  clear(root);
  try {
    const d = CACHE || await data();
    const funnel = d.funnel || [];
    const sources = d.sources || [];

    const drops = funnel.slice(1).map((x, i) => ({ ...x, from: funnel[i]?.label, drop: 100 - Number(x.rate || 0) }));
    const eligible = drops.filter((x, i) => Number(funnel[i]?.count || 0) >= 10).sort((a,b) => b.drop - a.drop);
    const bottleneck = eligible[0];
    const funnelCard = h('section.admin-card.admin-funnel-card',
      h('div.admin-card-head', h('div', h('h3', 'Funil de crescimento'), h('small', 'Visitante → cliente pagante'))),
      bottleneck ? h('div.admin-bottleneck', h('b', `Gargalo: ${bottleneck.from} → ${bottleneck.label}`), h('span', `${pc(bottleneck.rate)} avançam`)) : h('small', 'Dados insuficientes para apontar gargalo'),
      h('div.admin-funnel', ...funnel.map((x, i) =>
        h('div.admin-funnel-step',
          h('span', `${i + 1}. ${x.label}`),
          h('b', num(x.count)),
          h('small', i ? `${pc(x.rate)} da etapa anterior` : '100% da entrada')
        )
      ))
    );

    const sourceTable = h('section.admin-card',
      h('div.admin-card-head', h('h3', 'Aquisição e receita por origem')),
      h('div.admin-table-wrap',
        h('table.admin-table',
          h('thead', h('tr', ...['Origem', 'Sessões', 'Visitantes', 'Cadastros', 'Pagantes', 'Conversão', 'Receita'].map((x) => h('th', x)))),
          h('tbody', ...sources.map((x) =>
            h('tr',
              h('td', h('b', x.source || 'Direto')),
              h('td', num(x.sessions)),
              h('td', num(x.visitors)),
              h('td', num(x.signups)),
              h('td', num(x.paid)),
              h('td', pc(x.conversion)),
              h('td', money(x.revenue))
            )
          ))
        )
      )
    );

    const campaigns=d.campaigns||[];
    const campaignTable = h('section.admin-card',
      h('div.admin-card-head', h('div', h('h3', 'Campanhas e UTMs'), h('small', 'Descubra quais conteúdos e anúncios trazem cadastro e receita'))),
      campaigns.length ? h('div.admin-table-wrap',
        h('table.admin-table',
          h('thead', h('tr', ...['Campanha', 'Origem / meio', 'Sessões', 'Visitantes', 'Cadastros', 'Taxa cadastro', 'Pagantes', 'Receita'].map((x) => h('th', x)))),
          h('tbody', ...campaigns.map((x) => h('tr',
            h('td', h('b', x.campaign || '(sem campanha)')),
            h('td', `${x.source || 'direct'}${x.medium ? ' / '+x.medium : ''}`),
            h('td', num(x.sessions)), h('td', num(x.visitors)), h('td', num(x.signups)), h('td', pc(x.signup_rate)), h('td', num(x.paid)), h('td', money(x.revenue))
          )))
        )
      ) : h('small','As campanhas aparecerão quando chegarem acessos com utm_campaign.')
    );

    const m=d.metrics||{};
    const retention=d.retention||{};
    const reasonLabels={price:'Preço',low_use:'Pouco uso',missing_feature:'Faltou recurso',technical:'Problema técnico',temporary:'Pausa temporária',other:'Outro'};
    const retentionCard=h('section.admin-card',
      h('div.admin-card-head',h('div',h('h3','Retenção & cancelamento'),h('small','Entenda por que clientes saem e quantos foram recuperados'))),
      h('div.admin-kpis',
        metric('Iniciaram cancelamento',num(retention.cancel_flow_started||0),'intenção de sair'),
        metric('Pausaram',num(retention.paused||0),'retenção sem cobrança'),
        metric('Reativaram',num(retention.reactivated||0),'voltaram ao plano'),
        metric('Cancelaram',num(retention.canceled||0),'renovação encerrada')
      ),
      (retention.reasons||[]).length ? h('div.admin-bars',...(retention.reasons||[]).map(([reason,value])=>h('div.admin-bar-row',h('span',reasonLabels[reason]||reason),h('progress.admin-progress',{max:Math.max(1,...retention.reasons.map(x=>Number(x[1]||0))),value:Number(value||0)}),h('b',num(value))))) : h('small','Os motivos aparecerão quando houver pedidos de cancelamento.')
    );
    const experiments=d.experiments||[];
    const abCard=h('section.admin-card',
      h('div.admin-card-head',h('div',h('h3','Testes A/B'),h('small','Experimentos de conversão · visitante único'))),
      experiments.length ? h('div.admin-ab-list',...experiments.map(exp=>h('div.admin-ab-test',
        h('b',exp.experiment==='landing_hero'?'Landing principal':exp.experiment),
        h('div.admin-ab-variants',...(exp.variants||[]).map(v=>h('div.admin-ab-variant',h('span',`Variante ${v.variant}`),h('b',pc(v.rate)),h('small',`${num(v.conversions)} conversão(ões) / ${num(v.exposures)} exposição(ões)`))))
      ))) : h('small','Os resultados aparecerão após visitantes entrarem nos experimentos.')
    );
    const learning=d.learning||{};
    const educationCard=h('section.admin-card',
      h('div.admin-card-head',h('div',h('h3','Órbita · Aprendizado e aplicação'),h('small','Missões iniciadas no período → conceito entendido → ação aplicada'))),
      h('div.admin-kpis',metric('Pessoas aprendendo',num(learning.learners||0)),metric('Missões iniciadas',num(learning.missions_started||0)),metric('Conceitos entendidos',num(learning.concepts_understood||0)),metric('Ações aplicadas',num(learning.actions_applied||0)),metric('Jornadas concluídas',num(learning.people_completed||0)),metric('Pessoas que revisaram',num(learning.people_reviewed||0))),
      h('p.admin-note',learning.missions_started?`${pc(learning.understanding_rate||0)} entenderam o conceito e ${pc(learning.application_rate||0)} aplicaram a ação, entre missões iniciadas no período.`:'As métricas aparecem conforme pessoas usam a jornada. A demonstração não entra nestes eventos.'),
      learning.bottleneck?h('p.admin-note',`Missão para revisar: ${learning.bottleneck.id} · ${num(learning.bottleneck.applied)} de ${num(learning.bottleneck.started)} aplicaram. Investigue a experiência antes de concluir a causa.`):h('p.admin-note','Precisamos de pelo menos cinco inícios na mesma missão para destacar um ponto de atenção.'),
      h('p.admin-note','Somente eventos e IDs de conteúdo. Renda, saldo, dívidas e valores financeiros não são enviados pela Órbita.')
    );
    const af=d.activation_flow||{};
    const activationSteps=af.steps||[];
    const activationCard=h('section.admin-card',
      h('div.admin-card-head',h('div',h('h3','Ativação & Primeiro Valor'),h('small','Cadastro → renda → saldo → R$/dia → retorno'))),
      af.bottleneck
        ? h('div.admin-bottleneck',h('b',`Gargalo: ${af.bottleneck.from} → ${af.bottleneck.to}`),h('span',`${pc(af.bottleneck.rate)} avançam`))
        : h('small','Ainda não há volume suficiente para apontar um gargalo de ativação.'),
      h('div.admin-funnel',...activationSteps.map((x,i)=>h('div.admin-funnel-step',
        h('span',`${i+1}. ${x.label}${x.optional?' · opcional':''}`),
        h('b',num(x.count)),
        h('small',x.optional?`${pc(x.rate)} dos cadastros`:i?`${pc(x.rate)} da etapa anterior`:'coorte do período')
      ))),
      h('div.admin-kpis',
        metric('Chegaram ao R$/dia',pc(af.activation_rate||0),`${num(activationSteps.find(x=>x.event==='first_value_shown')?.count||0)} usuário(s)`),
        metric('Adicionaram contas',num(af.bills_added||0),'etapa opcional'),
        metric('Voltaram no D1',af.d1_eligible?pc(af.d1_rate||0):'—',`${num(af.d1_returned||0)} de ${num(af.d1_eligible||0)} elegíveis`),
        metric('Viraram pagantes',pc(af.paid_rate||0),`${num(af.paid||0)} da coorte`)
      ),
      h('p.admin-note','Privacidade: este funil registra somente a conclusão das etapas. Renda, saldo, valores de contas e o R$/dia não são enviados ao Growth Center.')
    );

    const viral=d.viral||{};
    const viralCard=h('section.admin-card',
      h('div.admin-card-head',h('div',h('h3','Motor Viral & Indicação'),h('small','Compartilhamento → visita → cadastro → amigo ativado'))),
      h('div.admin-kpis',
        metric('Meu número aberto',num(viral.spendable_opened||0),'card “quanto posso gastar”'),
        metric('Meu número compartilhado',num(viral.spendable_shared||0),'share nativo'),
        metric('Cards aceitos pelo sistema',num(viral.shared||0),`${pc(viral.share_rate||0)} dos cards criados`),
        metric('Visitas por compartilhamento',num(viral.viral_visits||0),'campanha viral_8192'),
        metric('Cadastros por compartilhamento',num(viral.viral_signups||0),`${pc(viral.visit_signup_rate||0)} visita → cadastro`),
        metric('Indicações ativadas',num(viral.activated_referrals||viral.referral_activated||0),'amigos que começaram'),
        metric('Pessoas que acionaram o envio',num(viral.unique_sharers||0),'usuários únicos'),
        metric('Ativados por pessoa que indicou',`${Number(viral.activated_per_sharer||0).toFixed(2)}x`,'ativados por pessoa que compartilhou')
      ),
      h('div.admin-funnel',
        h('div',h('small','Cards criados'),h('b',num(viral.created||0))),
        h('div',h('small','Compartilhados'),h('b',num(viral.shared||0))),
        h('div',h('small','Visitas geradas'),h('b',num(viral.viral_visits||0))),
        h('div',h('small','Cadastros'),h('b',num(viral.viral_signups||0))),
        h('div',h('small','Amigos ativados'),h('b',num(viral.activated_referrals||0)))
      )
    );
    root.append(
      h('div.admin-kpis',
        metric('Visitante → cadastro', pc(m.signup_rate), `${num(funnel.find(x=>x.event==='signup_completed')?.count)} cadastro(s)`),
        metric('Cadastro → ativação', pc(m.activation_rate), 'primeiro valor'),
        metric('Ativação → trial', pc(m.trial_rate), 'Pro 7 dias'),
        metric('Checkout → pago', pc(m.checkout_to_paid), `${num(funnel.at(-1)?.count)} pagante(s)`)
      ),
      h('div.admin-grid-2', funnelCard, bars('Telas mais acessadas', d.routes || [])), activationCard, educationCard, abCard, retentionCard, viralCard, sourceTable, campaignTable
    );
  } catch (e) {
    root.append(empty(e?.message));
  }
}


async function retentionIntel(root) {
  clear(root);
  try {
    const d = CACHE || await data();
    const r = d.retention || {}, m = d.metrics || {};
    const riskTotal = Number(r.at_risk || 0) + Number(r.dormant || 0);
    root.append(
      h('section.admin-card',
        h('div.admin-card-head', h('div', h('h3','Retenção Inteligente'), h('small','Quem voltou, quem está esfriando e onde agir sem expor finanças pessoais'))),
        h('div.admin-kpis',
          metric('Ativos hoje', num(r.active_1d || 0), 'últimas 24h'),
          metric('Ativos 7 dias', num(r.active_7d || 0), 'usuários recentes'),
          metric('Ativos 30 dias', num(r.active_30d || 0), 'base ativa'),
          metric('Em risco', num(r.at_risk || 0), '7–29 dias sem atividade'),
          metric('Adormecidos', num(r.dormant || 0), '30+ dias sem atividade'),
          metric('Retornaram', num(r.returned || 0), 'após período de ausência'),
          metric('D7', m.retention_d7 == null ? '—' : pc(m.retention_d7), 'retenção de coorte'),
          metric('D30', m.retention_d30 == null ? '—' : pc(m.retention_d30), 'retenção de coorte')
        ),
        h('div.admin-funnel',
          h('div',h('small','7d / 30d ativos'),h('b',pc(r.frequency||0))),
          h('div',h('small','Lembretes úteis exibidos'),h('b',num(r.nudges_shown||0))),
          h('div',h('small','Ações após lembrete'),h('b',num(r.nudges_clicked||0))),
          h('div',h('small','Resposta ao lembrete'),h('b',pc(r.return_rate||0)))
        )
      ),
      h('section.admin-card',
        h('div.admin-card-head',h('div',h('h3','Instalação do Bivvo'),h('small','Convite PWA e instalação confirmada quando a plataforma informa'))),
        h('div.admin-kpis',
          metric('Ofertas',num(r.install_offers||0),'convites exibidos'),
          metric('Cliques',num(r.install_clicks||0),'tocaram em instalar'),
          metric('Prompt aceito',num(r.install_accepted||0),'confirmação do navegador'),
          metric('Instalações',num(r.install_confirmed||0),'confirmadas por appinstalled'),
          metric('Recusas',num(r.install_dismissed||0),'convite ou prompt'),
          metric('iOS instruções',num(r.install_ios||0),'não conta como instalação')
        ),
        h('div.admin-funnel',
          h('div',h('small','Oferta → clique'),h('b',pc(r.install_offer_click_rate||0))),
          h('div',h('small','Clique → aceite'),h('b',pc(r.install_click_accept_rate||0))),
          h('div',h('small','Oferta → instalação'),h('b',pc(r.install_offer_confirmed_rate||0)))
        ),
        h('p.admin-note','No iPhone, abrir as instruções não é contado como instalação confirmada.')
      ),
      h('section.admin-card',
        h('div.admin-card-head',h('div',h('h3','Leitura automática'),h('small','Prioridade para retenção'))),
        riskTotal > 0
          ? h('div.admin-opportunity.warn',h('b',`${num(riskTotal)} usuário(s) precisam de atenção`),h('p',`${num(r.at_risk||0)} estão entre 7 e 29 dias sem atividade e ${num(r.dormant||0)} estão há 30 dias ou mais. Priorize motivos úteis para voltar, não promoções agressivas.`))
          : h('div.admin-opportunity.good',h('b','Nenhum grupo crítico agora'),h('p','Continue acompanhando frequência, D7 e D30 conforme a base crescer.')),
        h('p.admin-note','Privacidade: a retenção usa somente atividade e eventos técnicos. O Growth Center não recebe saldo, renda, compras, descrições ou valores financeiros.')
      )
    );
  } catch (e) { root.append(empty(e?.message)); }
}

async function monetization(root) {
  clear(root);
  try {
    const d = CACHE || await data();
    const mon=d.monetization||{};
    const rates=mon.rates||{};
    root.append(
      h('section.admin-card',
        h('div.admin-card-head',h('div',h('h3','Conversão & Receita'),h('small','Oportunidade → plano → checkout → pagamento'))),
        h('div.admin-kpis',
          metric('Oportunidades',num(mon.opportunities_shown||0),'ofertas contextuais'),
          metric('Cliques',num(mon.opportunity_clicks||0),pc(rates.opportunity_click||0)+' das oportunidades'),
          metric('Paywalls',num(mon.paywall_views||0),'benefício apresentado'),
          metric('Planos vistos',num(mon.plans_viewed||0),'intenção explícita'),
          metric('Planos selecionados',num(mon.plans_selected||0),'escolha de plano'),
          metric('Checkouts',num(mon.checkout_starts||0),pc(rates.plan_checkout||0)+' após seleção'),
          metric('Pagantes',num(mon.paid_users||0),pc(rates.checkout_paid||0)+' dos checkouts')
        ),
        h('div.admin-funnel',
          h('div',h('small','Exibição → clique'),h('b',pc(rates.opportunity_click||0))),
          h('div',h('small','Clique → plano'),h('b',pc(rates.click_plan||0))),
          h('div',h('small','Plano → checkout'),h('b',pc(rates.plan_checkout||0))),
          h('div',h('small','Checkout → pago'),h('b',pc(rates.checkout_paid||0)))
        ),
        (mon.by_plan||[]).length ? h('div.admin-table-wrap',h('table.admin-table',h('thead',h('tr',...['Plano','Seleções','Checkouts','Pagamentos','Conversão','Receita'].map(x=>h('th',x)))),h('tbody',...(mon.by_plan||[]).map(x=>h('tr',h('td',h('b',x.plan)),h('td',num(x.selected)),h('td',num(x.checkouts)),h('td',num(x.payments)),h('td',pc(x.conversion)),h('td',money(x.revenue))))))) : h('p.admin-note','Os planos aparecerão conforme houver seleções e checkouts.'),
        (mon.by_trigger||[]).length ? h('div.admin-table-wrap',h('table.admin-table',h('thead',h('tr',...['Gatilho','Exibições','Cliques','Conversão'].map(x=>h('th',x)))),h('tbody',...(mon.by_trigger||[]).map(x=>h('tr',h('td',x.trigger),h('td',num(x.shown)),h('td',num(x.clicks)),h('td',pc(x.conversion))))))) : h('small','Os gatilhos aparecerão conforme houver volume de uso.')
      )
    );
  } catch (e) {
    root.append(empty(e?.message));
  }
}

async function millionGoal(root) {
  clear(root);
  try {
    const d = CACHE || await data();
    const m = d.metrics || {};
    const target = 1000000;
    const mrr = Math.max(0, Number(m.mrr || 0));
    const paid = Math.max(0, Number(m.paid || 0));
    const arpu = paid > 0 ? mrr / paid : 0;
    const gap = Math.max(0, target - mrr);
    const progress = target ? Math.min(100, (mrr / target) * 100) : 0;
    const payersNeeded = arpu > 0 ? Math.max(0, Math.ceil(target / arpu) - paid) : null;
    const totalPayersTarget = arpu > 0 ? Math.ceil(target / arpu) : null;
    const visitorToPaid = Math.max(0, Number(m.conversion || 0));
    const visitorsNeeded = payersNeeded != null && visitorToPaid > 0 ? Math.ceil(payersNeeded / (visitorToPaid / 100)) : null;

    const monthsAt = (rate) => {
      if (mrr <= 0 || mrr >= target || rate <= 0) return mrr >= target ? 0 : null;
      return Math.ceil(Math.log(target / mrr) / Math.log(1 + rate));
    };
    const scenarios = [[.05, '5% ao mês'], [.10, '10% ao mês'], [.20, '20% ao mês']].map(([rate, label]) => ({ label, months: monthsAt(rate) }));

    const milestoneValues = [1000, 10000, 50000, 100000, 250000, 500000, 1000000];
    const nextMilestone = milestoneValues.find(v => v > mrr) || target;

    root.append(
      h('section.admin-card.admin-million-hero',
        h('div.admin-card-head', h('div', h('small', 'META PRINCIPAL'), h('h3', 'R$ 1 milhão de MRR'), h('p', 'Acompanhe a distância até a meta usando apenas métricas agregadas do negócio.'))),
        h('div.admin-million-number', h('b', money(mrr)), h('span', `de ${money(target)} / mês`)),
        h('progress.admin-million-progress', { max: target, value: Math.min(target, mrr), 'aria-label': `Progresso da meta: ${pc(progress)}` }),
        h('div.admin-million-progress-label', h('b', pc(progress)), h('span', `${money(gap)} ainda faltam`))
      ),
      h('div.admin-kpis',
        metric('MRR atual', money(mrr), `${pc(progress)} da meta`),
        metric('Pagantes atuais', num(paid), 'assinaturas com pagamento aprovado'),
        metric('ARPU mensal', arpu ? money(arpu) : '—', 'MRR ÷ pagantes'),
        metric('Pagantes que faltam', payersNeeded == null ? '—' : num(payersNeeded), totalPayersTarget == null ? 'sem base de ARPU' : `meta estimada: ${num(totalPayersTarget)}`),
        metric('Churn', pc(m.churn), `${num(m.canceled_period)} cancelamento(s) no período`),
        metric('Visitante → pago', pc(visitorToPaid), visitorsNeeded == null ? 'sem base para estimar tráfego' : `≈ ${num(visitorsNeeded)} visitantes para cobrir a lacuna*`)
      ),
      h('div.admin-grid-2',
        h('section.admin-card',
          h('div.admin-card-head', h('div', h('h3', 'Próximo marco'), h('small', 'Uma meta de cada vez'))),
          h('div.admin-million-milestone', h('b', money(nextMilestone)), h('span', mrr >= target ? 'Meta principal atingida.' : `${money(Math.max(0, nextMilestone - mrr))} para chegar lá`)),
          h('div.admin-million-steps', ...milestoneValues.map(v => h('span', { class: mrr >= v ? 'done' : (v === nextMilestone ? 'next' : '') }, money(v))))
        ),
        h('section.admin-card',
          h('div.admin-card-head', h('div', h('h3', 'Cenários de crescimento'), h('small', 'Simulação matemática, não previsão'))),
          h('div.admin-scenarios', ...scenarios.map(x => h('div', h('span', x.label), h('b', x.months == null ? '—' : (x.months === 0 ? 'Meta atingida' : `${x.months} meses`))))),
          h('small', mrr > 0 ? 'Os cenários supõem crescimento composto constante do MRR e não descontam churn adicional.' : 'Assim que houver MRR, o Bivvo calcula os cenários automaticamente.')
        )
      ),
      h('section.admin-card',
        h('div.admin-card-head', h('div', h('h3', 'Alavancas para chegar à meta'), h('small', 'Indicadores que movem receita recorrente'))),
        h('div.admin-kpis',
          metric('Cadastro', pc(m.signup_rate), 'visitante → conta'),
          metric('Ativação', pc(m.activation_rate), 'cadastro → primeiro valor'),
          metric('Trial', pc(m.trial_rate), 'ativação → Pro'),
          metric('Trial → pago', pc(m.trial_to_paid), 'conversão do teste'),
          metric('Checkout → pago', pc(m.checkout_to_paid), 'eficiência da cobrança'),
          metric('D30', m.retention_d30 == null ? '—' : pc(m.retention_d30), 'retenção')
        ),
        h('p.admin-million-note', '* A estimativa de visitantes mantém a taxa visitante → pagante observada no período. Com amostra pequena, use como referência e não como previsão.')
      )
    );
  } catch (e) {
    root.append(empty(e?.message));
  }
}

async function audience(root) {
  clear(root);
  try {
    const d = CACHE || await data();
    const a = d.audience || {};
    root.append(
      h('div.admin-kpis',
        metric('Sessões', num(d.metrics?.sessions), `${DAYS} dias`),
        metric('D7', d.metrics?.retention_d7 == null ? '—' : pc(d.metrics.retention_d7)),
        metric('D30', d.metrics?.retention_d30 == null ? '—' : pc(d.metrics.retention_d30)),
        metric('D90', d.metrics?.retention_d90 == null ? '—' : pc(d.metrics.retention_d90))
      ),
      h('div.admin-grid-2',
        bars('Dispositivos', a.devices || []),
        bars('Sistemas operacionais', a.os || []),
        bars('Navegadores', a.browsers || []),
        bars('Tamanho de tela', a.screens || []),
        bars('Idiomas do navegador', a.languages || []),
        bars('Recursos / eventos do produto', d.features || [])
      )
    );
  } catch (e) {
    root.append(empty(e?.message));
  }
}

async function clients(root) {
  clear(root);
  const search = h('input.input', { placeholder: 'Buscar nome, e-mail ou telefone' });
  const select = h('select.input', h('option', { value: '' }, 'Todos os planos'), ...['free', 'plus', 'pro', 'couple', 'capital', 'entrepreneur', 'family'].map((x) => h('option', { value: x }, x)));
  const body = h('div');

  const load = async () => {
    body.replaceChildren(h('div.admin-loading', h('div.skeleton')));
    try {
      const d = await adminClients({ search: search.value, plan: select.value });
      body.replaceChildren(
        h('div.admin-table-wrap',
          h('table.admin-table',
            h('thead', h('tr', ...['Cliente', 'Telefone', 'Plano', 'Status', 'Cadastro', 'Último acesso'].map((x) => h('th', x)))),
            h('tbody', ...(d.rows || []).map((x) =>
              h('tr',
                h('td', h('b', x.name || 'Sem nome'), h('small', x.email || '—')),
                h('td', x.phone || '—'),
                h('td', h('span.admin-pill', x.plan || 'free')),
                h('td', x.subscription_status || '—'),
                h('td', x.created_at ? new Date(x.created_at).toLocaleDateString('pt-BR') : '—'),
                h('td', x.last_sign_in_at ? new Date(x.last_sign_in_at).toLocaleDateString('pt-BR') : '—')
              )
            ))
          ),
          h('p.admin-table-foot', `${num(d.total)} cliente(s)`)
        )
      );
    } catch (e) {
      body.replaceChildren(empty(e?.message));
    }
  };

  let timer;
  search.oninput = () => { clearTimeout(timer); timer = setTimeout(load, 300); };
  select.onchange = load;
  root.append(h('div.admin-toolbar', search, select, h('button.btn.primary', { onclick: () => exportClients().catch((e) => alert(e.message)) }, 'Exportar CSV')), body);
  load();
}

async function health(root) {
  clear(root);
  try {
    const d = CACHE || await data();
    const names = { supabase: 'Supabase', mercadopago_webhook: 'Mercado Pago / Webhook', gemini: 'Gemini', push: 'Web Push', netlify: 'Netlify Functions', client: 'Frontend / Navegador' };
    root.append(h('div.admin-health', ...Object.entries(names).map(([key, name]) => {
      const x = d.health?.[key];
      return h('article.admin-card',
        h('h3', name),
        h('b', { class: x?.ok === false ? 'bad' : 'good' }, x ? (x.ok ? '● Operacional' : '● Atenção') : '● Sem telemetria'),
        h('small', x?.created_at ? `Último evento: ${new Date(x.created_at).toLocaleString('pt-BR')}${x?.count != null ? ` · ${x.count} erro(s) no período` : ''}` : 'Ainda não há evento registrado.')
      );
    })));
  } catch (e) {
    root.append(empty(e?.message));
  }
}

/* ---------------- Fase 8.16 — SEO Intelligence ---------------- */
const pcOrDash = v => v == null ? '—' : pc(v);
const pretty = slug => String(slug || '').replace(/-/g, ' ').replace(/^./, c => c.toUpperCase());
const TYPE_LABEL = { artigo: 'Guia', categoria: 'Categoria', hub: 'Central', landing: 'Página', ferramenta: 'Calculadora', entrada: 'Entrada' };
/* tabela que vira cartões no celular: cada célula leva o rótulo da coluna */
function cardTable(cols, rows, empty) {
  if (!rows.length) return h('p.admin-empty-line', empty);
  return h('div.admin-table-wrap.seo-table-wrap', h('table.admin-table.seo-table',
    h('thead', h('tr', ...cols.map(c => h('th', { scope: 'col' }, c[0])))),
    h('tbody', ...rows.map(r => h('tr', ...cols.map(([label, fn], i) => h('td', { 'data-label': label, class: i === 0 ? 'seo-first' : '' }, fn(r))))))));
}
let SEO_CACHE = null;
let SEO_CUSTOM = null;
async function seoIntel(root) {
  clear(root);
  root.append(h('div.admin-loading', h('div.skeleton'), h('div.skeleton'), h('div.skeleton')));
  try {
    const cacheKey = SEO_CUSTOM ? `${SEO_CUSTOM.from}|${SEO_CUSTOM.to}` : `days:${DAYS}`;
    const d = SEO_CACHE && SEO_CACHE.key === cacheKey ? SEO_CACHE.data : await adminSeo(SEO_CUSTOM ? { from: SEO_CUSTOM.from, to: SEO_CUSTOM.to } : { days: DAYS });
    SEO_CACHE = { key: cacheKey, data: d };
    clear(root);
    const k = d.kpis || {}, dist=d.distribution||{};
    const from = h('input', { type: 'date', class: 'input seo-date', value: SEO_CUSTOM?.from || '' });
    const to = h('input', { type: 'date', class: 'input seo-date', value: SEO_CUSTOM?.to || '' });
    const apply = h('button.btn.primary', { type: 'button', onclick: () => {
      if(!from.value || !to.value) return alert('Escolha a data inicial e final.');
      if(from.value > to.value) return alert('A data inicial precisa ser anterior à final.');
      SEO_CUSTOM={from:from.value,to:to.value}; SEO_CACHE=null; seoIntel(root);
    } }, 'Aplicar período');
    const reset = h('button.btn', { type:'button', onclick:()=>{SEO_CUSTOM=null;SEO_CACHE=null;seoIntel(root);} }, 'Voltar ao período padrão');
    const range = h('section.admin-card.seo-range',
      h('div.admin-card-head', h('div', h('h3','Período do crescimento orgânico'), h('small', SEO_CUSTOM ? `Personalizado: ${SEO_CUSTOM.from} até ${SEO_CUSTOM.to}` : `${DAYS} dias`))),
      h('div.admin-toolbar', from, to, apply, SEO_CUSTOM ? reset : null)
    );
    const kpis = h('div.admin-kpis.seo-kpis',
      metric('Visitantes orgânicos', num(k.organic_visitors), `${num(k.seo_visitors)} visitante(s) em páginas SEO`),
      metric('Ações de compartilhar', num(k.shares), `${num(k.sharers)} pessoa(s) · não confirma entrega`),
      metric('Visitas por referência', num(k.referred_visitors), `${num(k.whatsapp_visitors)} via WhatsApp`),
      metric('Visitas por embed', num(k.embed_visitors), 'widgets incorporados'),
      metric('Visitas de IA', num(k.ai_visitors), 'origem identificável'),
      metric('Cadastros referidos', num(k.referred_signups), 'share / embed / referência'),
      metric('Cliques para cadastro', num(k.signup_clicks), 'visitantes únicos'),
      metric('Cadastros do SEO', num(k.signups)),
      metric('Usuários ativados', num(k.activated)),
      metric('Pagantes do SEO', num(k.paid)));
    const flow = h('section.admin-card',
      h('div.admin-card-head', h('div', h('h3', 'Funil orgânico + distribuição'), h('small', 'Busca → conteúdo/ferramenta → compartilhamento/referência → cadastro → ativação → receita'))),
      h('div.admin-funnel.seo-rates', ...(d.rates || []).map(x => h('div.admin-funnel-step', h('span', x.label), h('b', pcOrDash(x.value))))),
      h('p.admin-note', 'Origem é inferida apenas quando há UTM/referrer disponível. Tráfego sem sinal suficiente continua como direto/desconhecido.'));
    const distribution = h('section.admin-card',
      h('div.admin-card-head',h('div',h('h3','Distribuição e referências'),h('small','WhatsApp, embeds, IA, redes e sites externos'))),
      cardTable([
        ['Origem',r=>h('b',pretty(r.source))],['Visitas',r=>num(r.visits)],['Visitantes',r=>num(r.visitors)],['Cadastros',r=>num(r.signups)],['Conversão',r=>pcOrDash(r.conversion)]
      ],dist.sources||[],'Ainda não há visitas referidas suficientes no período.'),
      h('p.admin-note','Detecção de ChatGPT/Copilot depende de referrer/UTM disponível e não é perfeita; o painel não inventa origem.'));
    const pages = h('section.admin-card',
      h('div.admin-card-head', h('div', h('h3', 'Conteúdos que mais geram resultado'), h('small', 'Resultado + distribuição, não apenas visitas'))),
      cardTable([
        ['Página', r => h('span', h('b', pretty(r.slug)), h('small', TYPE_LABEL[r.type] || r.type))],
        ['Visitas', r => num(r.visits)], ['Compart.', r => num(r.shares)], ['Referrals', r => num(r.referral_visits)], ['Cliques ferramenta', r => num(r.tool_clicks)], ['Cliques cadastro', r => num(r.signup_clicks)],
        ['Cadastros', r => num(r.signups)], ['Ativações', r => num(r.activations)], ['Pagantes', r => num(r.paid)], ['Conversão', r => pcOrDash(r.conversion)]
      ], d.pages || [], 'Ainda não há visitas registradas nas páginas públicas neste período.'));
    const tools = h('section.admin-card',
      h('div.admin-card-head', h('div', h('h3', 'Ferramentas'), h('small', 'Uso, compartilhamento, embeds e aquisição'))),
      cardTable([
        ['Ferramenta', r => h('b', pretty(r.slug))], ['Aberturas', r => num(r.opens)], ['Conclusões', r => num(r.completes)], ['Compart.',r=>num(r.shares)], ['Embeds',r=>num(r.embed_opens)],
        ['Cliques cadastro', r => num(r.signup_clicks)], ['Cadastros', r => num(r.signups)], ['Conversão', r => pcOrDash(r.conversion)]
      ], d.tools || [], 'Nenhuma ferramenta foi aberta neste período.'));
    const opp = h('section.admin-card',
      h('div.admin-card-head', h('h3', 'Oportunidades de crescimento')),
      h('div.admin-opportunities', ...(d.opportunities || []).map(o => h('article.admin-opportunity.' + (o.tone || 'neutral'), h('small',o.kind||'LEITURA'),h('b', o.title), h('p', o.text)))),
      h('p.admin-note', `Baseado só em sinais observados. Páginas com menos de ${d.min_volume} visitantes não recebem diagnóstico forte.`));
    const g = d.search_console || {};
    const gscCard = h('section.admin-card.seo-gsc',
      h('div.admin-card-head', h('div', h('h3', 'Google Search Console'), h('small', 'Impressões, posição, CTR e consultas'))),
      !g.connected ? h('div.seo-gsc-off', h('p', h('b', 'Conecte o Google Search Console para visualizar impressões, posição e CTR.')), h('p', 'O Bivvo não estima esses números. Veja GOOGLE_SEARCH_CONSOLE_SETUP.md.'))
        : g.error ? h('p.admin-note', `Search Console configurado, mas indisponível agora: ${g.error}`)
        : h('div',
            h('div.admin-kpis', metric('Cliques no Google', num(g.totals.clicks)), metric('Impressões', num(g.totals.impressions)), metric('CTR', pc(g.totals.ctr)), metric('Posição média', g.totals.position.toFixed(1))),
            h('h4.seo-sub', 'Consultas'), cardTable([['Consulta', r => h('b', r.key)], ['Cliques', r => num(r.clicks)], ['Impressões', r => num(r.impressions)], ['CTR', r => pc(r.ctr)], ['Posição', r => r.position.toFixed(1)]], g.queries || [], 'Sem consultas no período.'),
            h('h4.seo-sub', 'Páginas no Google'), cardTable([
              ['Página', r => h('b', (()=>{try{return new URL(r.key).pathname}catch{return r.key}})())],
              ['Cliques', r => num(r.clicks)], ['Impressões', r => num(r.impressions)], ['CTR', r => pc(r.ctr)], ['Posição', r => r.position.toFixed(1)],
              ['Leitura', r => h('span', r.impressions >= 20 && r.position >= 5 && r.position <= 20 ? 'OPORTUNIDADE SEO' : r.impressions >= 20 && r.position < 8 && r.ctr < 2 ? 'OPORTUNIDADE CTR' : r.impressions >= 20 ? 'ACOMPANHAR' : 'POUCO SINAL')]
            ], g.pages || [], 'Sem páginas com dados no período.'),
            h('p.admin-note', `Dados do Google de ${g.start} a ${g.end}. O Google normalmente tem atraso de processamento.`)));
    root.append(range,kpis,flow,opp,distribution,pages,tools,gscCard,
      h('p.admin-note', 'Privacidade: este painel usa páginas, cliques, origem/UTM, compartilhamentos e etapas do funil. Nenhum saldo, renda, dívida, compra ou resultado de calculadora é enviado.'));
  } catch (e) { clear(root); root.append(empty(e.message)); }
}


const ADMIN_ROUTE_LABELS = {
  inicio:'Início', extrato:'Movimentações', cartoes:'Cartões', calendario:'Calendário', previsao:'Previsão',
  assistente:'Bivvo IA', familia:'Casal/Família', emprestimos:'Bivvo Capital', jornada:'Minha Jornada',
  planos:'Planejamento', voce:'Você', aprender:'Órbita de aprendizado', admin:'Administração'
};
const routeLabel = (route) => ADMIN_ROUTE_LABELS[route] || route || '—';
const dateTime = (value) => value ? new Intl.DateTimeFormat('pt-BR',{dateStyle:'short',timeStyle:'short'}).format(new Date(value)) : 'Nunca registrado';
const duration = (seconds) => {
  const s=Math.max(0,Number(seconds)||0);
  if(s<60)return s?`${Math.round(s)} s`:'—';
  const m=Math.round(s/60); if(m<60)return `${m} min`;
  const h=Math.floor(m/60), rest=m%60; return rest?`${h} h ${rest} min`:`${h} h`;
};

const whatsappNumber = (phone) => {
  let digits=String(phone||'').replace(/\D/g,'');
  if(!digits)return '';
  // Cadastros brasileiros antigos podem estar sem DDI.
  if((digits.length===10||digits.length===11)&&!digits.startsWith('55'))digits='55'+digits;
  return digits.length>=10&&digits.length<=15?digits:'';
};
const whatsappUrl = (phone,name='') => {
  const number=whatsappNumber(phone);
  if(!number)return '';
  const first=String(name||'').trim().split(/\s+/)[0];
  const text=`Olá${first?', '+first:''}! Tudo bem? Aqui é da equipe Bivvo.`;
  return `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
};
const acquisitionLabel = (source) => String(source||'Desconhecido');

function stageTone(stage='') {
  const v=String(stage).toLowerCase();
  if(v.includes('pagante'))return 'paid';
  if(v.includes('checkout')||v.includes('teste'))return 'warm';
  if(v.includes('ativ'))return 'active';
  return 'neutral';
}
function planLabel(plan){const p=String(plan||'free').toLowerCase();return ({free:'Grátis',plus:'Plus',pro:'Pro',family:'Família'})[p]||plan||'Grátis';}
function openUserJourney(x){
  if(ADMIN_HELP_MODAL)ADMIN_HELP_MODAL.remove();
  const milestones=[
    ['Cadastro',x.milestones?.signup_at],
    ['Ativou o Bivvo',x.milestones?.activation_at],
    ['Primeiro lançamento',x.milestones?.first_transaction_at],
    ['Primeiro cartão',x.milestones?.first_card_at],
    ['Iniciou teste',x.milestones?.trial_at],
    ['Iniciou checkout',x.milestones?.checkout_at],
    ['Virou pagante',x.milestones?.paid_at]
  ];
  const journey=h('div.admin-journey-list',...milestones.map(([label,at],i)=>h('div.admin-journey-step'+(at?'.done':''),
    h('span.admin-journey-dot',at?'✓':String(i+1)),
    h('div',h('b',label),h('small',at?dateTime(at):'Ainda não aconteceu'))
  )));
  ADMIN_HELP_MODAL=h('div.admin-help-backdrop',{onclick:(e)=>{if(e.target===ADMIN_HELP_MODAL){ADMIN_HELP_MODAL.remove();ADMIN_HELP_MODAL=null;}}},
    h('section.admin-help-modal.admin-user-journey-modal',
      h('button.admin-help-close',{type:'button','aria-label':'Fechar',onclick:()=>{ADMIN_HELP_MODAL?.remove();ADMIN_HELP_MODAL=null;}},'×'),
      h('small','JORNADA DO USUÁRIO'),h('h2',x.name||x.email||'Usuário'),
      h('div.admin-journey-summary',
        h('div',h('small','ORIGEM INICIAL'),h('b',acquisitionLabel(x.acquisition_source))),
        h('div',h('small','CAMPANHA'),h('b',x.acquisition_campaign||'—')),
        h('div',h('small','ÚLTIMA ORIGEM'),h('b',acquisitionLabel(x.last_source))),
        h('div',h('small','PLANO'),h('b',planLabel(x.plan)))
      ),
      journey,
      h('p.admin-note','A jornada mostra somente eventos técnicos do produto. Etapas sem evento confiável permanecem como “Ainda não aconteceu”.')
    )
  );
  document.body.append(ADMIN_HELP_MODAL);
}

async function userActivity(root) {
  clear(root);
  root.append(h('div.admin-loading', h('div.skeleton'), h('div.skeleton'), h('div.skeleton')));
  try {
    const d = await adminActivity({ days: DAYS });
    let status='all', search='', origin='all', route='all', device='all', os='all', plan='all', stage='all', health='all';
    const controls=h('div.admin-activity-controls');
    const filterPanel=h('div.admin-user-filter-panel',{hidden:true});
    const list=h('div.admin-activity-list');
    const rowsAll=d.rows||[];
    const avg=(()=>{const vals=rowsAll.filter(x=>x.average_session_seconds>0).map(x=>Number(x.average_session_seconds));return vals.length?vals.reduce((a,b)=>a+b,0)/vals.length:0})();
    const unique=(key)=>[...new Set(rowsAll.map(x=>String(x[key]||'').trim()).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'pt-BR'));
    const origins=unique('acquisition_source'), routes=unique('most_used_route'), devices=unique('device'), systems=unique('os'), plans=unique('plan'), stages=unique('conversion_stage'), healths=unique('engagement_health');
    const resultCount=h('small.admin-filter-result');
    const filterBtn=h('button.btn.admin-filter-toggle',{type:'button'});
    const clearBtn=h('button.btn.admin-filter-clear',{type:'button'},'Limpar filtros');

    const filteredRows=()=>{const q=search.trim().toLowerCase();return rowsAll.filter(x=>{
      if(status==='online'&&!x.online)return false;if(status==='offline'&&x.online)return false;
      if(origin!=='all'&&String(x.acquisition_source||'')!==origin)return false;
      if(route!=='all'&&String(x.most_used_route||'')!==route)return false;
      if(device!=='all'&&String(x.device||'')!==device)return false;
      if(os!=='all'&&String(x.os||'')!==os)return false;
      if(plan!=='all'&&String(x.plan||'')!==plan)return false;
      if(stage!=='all'&&String(x.conversion_stage||'')!==stage)return false;
      if(health!=='all'&&String(x.engagement_health||'')!==health)return false;
      if(q&&!(`${x.name||''} ${x.email||''} ${x.phone||''} ${x.acquisition_source||''} ${x.acquisition_campaign||''} ${x.last_source||''} ${routeLabel(x.most_used_route)} ${x.device||''} ${x.os||''} ${x.plan||''} ${x.conversion_stage||''} ${x.engagement_health||''}`).toLowerCase().includes(q))return false;
      return true;
    });};
    const activeFilterCount=()=>[status!=='all',origin!=='all',route!=='all',device!=='all',os!=='all',plan!=='all',stage!=='all',health!=='all'].filter(Boolean).length;
    const syncFilterUi=()=>{const n=activeFilterCount();filterBtn.textContent=n?`⚙ Filtros (${n})`:'⚙ Filtros';clearBtn.disabled=!n&&!search;};
    const renderRows=()=>{
      const rows=filteredRows();resultCount.textContent=`Mostrando ${num(rows.length)} de ${num(rowsAll.length)} usuário(s)`;syncFilterUi();clear(list);
      if(!rows.length){list.append(empty('Nenhum usuário corresponde aos filtros selecionados.'));return;}
      rows.forEach(x=>{const wa=whatsappUrl(x.phone,x.name);list.append(h('article.admin-user-activity',
        h('div.admin-user-main',h('div.admin-user-avatar',(x.name||x.email||'?').trim().slice(0,1).toUpperCase()),h('div.admin-user-id',
          h('div',h('b',x.name||'Sem nome'),x.online?h('span.admin-online-badge','● Online'):h('span.admin-offline-badge','Offline'),h(`span.admin-stage-badge.${stageTone(x.conversion_stage)}`,x.conversion_stage||'Cadastrou')),
          h('small',x.email||'Sem e-mail'),
          h('div.admin-user-contact',x.phone?h('small',`WhatsApp: ${x.phone}`):h('small','WhatsApp não cadastrado'),wa?h('a.btn.admin-whatsapp-btn',{href:wa,target:'_blank',rel:'noopener noreferrer'},'💬 WhatsApp'):null,h('button.btn.admin-journey-btn',{type:'button',onclick:()=>openUserJourney(x)},'🧭 Ver jornada'))
        )),
        h('div.admin-user-facts',
          h('div',h('small','CADASTRO'),h('b',dateTime(x.created_at))),
          h('div',h('small','ÚLTIMO USO'),h('b',dateTime(x.last_seen_at))),
          h('div',h('small','PLANO'),h('b',planLabel(x.plan))),
          h('div',h('small','ORIGEM'),h('b',acquisitionLabel(x.acquisition_source))),
          h('div',h('small','CAMPANHA'),h('b',x.acquisition_campaign||'—')),
          h('div',h('small','ABA MAIS USADA'),h('b',routeLabel(x.most_used_route))),
          h('div',h('small','DIAS ATIVOS'),h('b',num(x.active_days||0))),
          h('div',h('small','TEMPO MÉDIO POR SESSÃO'),h('b',duration(x.average_session_seconds))),
          h('div',h('small','SITUAÇÃO'),h('b',x.engagement_health||'—'))
        ),
        h('div.admin-user-meta',h('small',`${num(x.sessions)} sessão(ões) nos últimos ${DAYS} dias · média ${duration(x.average_session_seconds)}${x.device?' · '+x.device:''}${x.os?' · '+x.os:''}`))
      ));});
    };

    const input=h('input.input.admin-user-search',{type:'search',placeholder:'Buscar nome, e-mail ou origem, telefone, campanha, plano…',oninput:(e)=>{search=e.target.value;renderRows();}});
    filterBtn.onclick=()=>{filterPanel.hidden=!filterPanel.hidden;filterBtn.classList.toggle('on',!filterPanel.hidden);};
    const makeSelect=(label,values,get,set,formatter=(v)=>v)=>h('label.admin-user-filter-field',h('span',label),h('select.input',{onchange:(e)=>{set(e.target.value);renderRows();}},h('option',{value:'all'},'Todos'),...values.map(v=>h('option',{value:v},formatter(v)))));
    const statusSelect=h('label.admin-user-filter-field',h('span','Status'),h('select.input',{onchange:(e)=>{status=e.target.value;renderRows();}},h('option',{value:'all'},'Todos'),h('option',{value:'online'},'Online agora'),h('option',{value:'offline'},'Offline')));
    const originSelect=makeSelect('Origem',origins,()=>origin,v=>origin=v,v=>acquisitionLabel(v));
    const planSelect=makeSelect('Plano',plans,()=>plan,v=>plan=v,v=>planLabel(v));
    const stageSelect=makeSelect('Etapa',stages,()=>stage,v=>stage=v);
    const healthSelect=makeSelect('Situação',healths,()=>health,v=>health=v);
    const routeSelect=makeSelect('Aba mais usada',routes,()=>route,v=>route=v,v=>routeLabel(v));
    const deviceSelect=makeSelect('Dispositivo',devices,()=>device,v=>device=v);
    const osSelect=makeSelect('Sistema',systems,()=>os,v=>os=v);
    clearBtn.onclick=()=>{status=origin=route=device=os=plan=stage=health='all';search='';input.value='';[statusSelect,originSelect,planSelect,stageSelect,healthSelect,routeSelect,deviceSelect,osSelect].forEach(label=>{const select=label.querySelector('select');if(select)select.value='all';});renderRows();};
    filterPanel.append(statusSelect,originSelect,planSelect,stageSelect,healthSelect,routeSelect,deviceSelect,osSelect,h('div.admin-user-filter-actions',clearBtn));
    controls.append(h('div.admin-activity-filter',filterBtn,resultCount),input);

    const originRows=d.origin_conversion||[];
    const acquisitionCard=h('section.admin-card.admin-origin-conversion',
      h('div.admin-card-head',h('div',h('h3','Conversão por origem'),h('small','Descubra quais canais trazem usuários que realmente ativam e pagam'))),
      originRows.length?h('div.admin-origin-table',
        h('div.admin-origin-row.head',h('b','Origem'),h('b','Usuários'),h('b','Ativados'),h('b','Pagantes'),h('b','Conv. paga')),
        ...originRows.slice(0,12).map(o=>h('div.admin-origin-row',h('b',acquisitionLabel(o.source)),h('span',num(o.users)),h('span',`${num(o.activated)} · ${pc(o.activation_rate)}`),h('span',num(o.paid)),h('strong',pc(o.paid_rate))))
      ):h('p.admin-note','Ainda não há dados suficientes de origem para comparar conversão.')
    );

    clear(root);root.append(
      h('div.admin-hero',h('div',h('small','USUÁRIOS E JORNADA'),h('h2','Da origem até virar cliente'),h('p','Veja quem chegou, quem ativou, quem está em risco e quais canais trazem os melhores clientes.')),h('span.admin-live',`● ${num(d.online_count)} online agora`)),
      h('div.admin-kpis',
        metric('Usuários acompanhados',num(d.tracked_count),`${DAYS} dias`),
        metric('Novos usuários',num(d.new_users_count),`últimos ${DAYS} dias`),
        metric('Ativados',num(d.activated_count),'concluíram ativação'),
        metric('Pagantes',num(d.paid_count),'pagamento/assinatura identificada'),
        metric('Em risco',num(d.risk_count),'sem ativação ou retorno recente'),
        metric('Tempo médio',duration(avg),'média por sessão')
      ),
      acquisitionCard,
      h('section.admin-card.admin-activity-help',h('div.admin-card-head',h('h3','Como interpretar esta aba'),h('button.admin-help-btn',{type:'button',onclick:()=>showAdminHelp('Usuários e jornada',[
        'Origem inicial','Canal identificado no cadastro ou no primeiro toque autenticado: Google, TikTok, Facebook, YouTube e outros.',
        'Campanha','Valor UTM da campanha quando o link de divulgação contém utm_campaign.',
        'Etapa','Mostra o ponto mais avançado conhecido da jornada: cadastro, ativação, teste, checkout ou pagante.',
        'Risco de abandono','Usuário ainda não ativado e sem atividade recente, ou que ficou 7+ dias sem voltar. É um sinal operacional, não uma certeza.',
        'Conversão por origem','Compara quantos usuários cada canal trouxe e quantos chegaram à ativação ou pagamento.',
        'Privacidade','A tela usa somente metadados de produto, aquisição e assinatura. Não exibe saldos, compras, dívidas, renda ou outros valores financeiros pessoais.'
      ])},'?')),h('p.admin-note','Use “Ver jornada” para entender o caminho individual sem acessar dados financeiros da pessoa.')),
      controls,filterPanel,list
    );renderRows();
  } catch (e) { clear(root); root.append(empty(e?.message)); }
}

export function renderAdmin(root) {
  const tabs = h('div.admin-tabs');
  const content = h('div.admin-content');
  const period = h('select.input.admin-period', ...[[7, '7 dias'], [30, '30 dias'], [90, '90 dias']].map(([value, label]) => h('option', { value, selected: value === DAYS }, label)));

  const defs = [
    ['overview', 'Resumo', overview, 'Veja rapidamente quantas pessoas chegaram, se cadastraram, pagaram e quanto o Bivvo faturou.'],
    ['activity', 'Usuários online', userActivity, 'Veja quem está online, último uso, tempo médio no app e a aba que cada pessoa mais utiliza.'],
    ['founder', 'O que precisa de atenção', founderSummary, 'O Bivvo destaca os pontos mais importantes para você não precisar analisar dezenas de números.'],
    ['growth', 'De onde vêm os usuários', growth, 'Entenda anúncios, campanhas, origens e em qual etapa as pessoas desistem.'],
    ['monetization', 'Vendas e receita', monetization, 'Acompanhe checkout, pagamentos, planos e quanto o negócio está gerando.'],
    ['retention', 'Quem continua usando', retentionIntel, 'Veja se as pessoas voltam, cancelam ou reativam o Bivvo.'],
    ['seo', 'Google e conteúdo', seoIntel, 'Mostra o desempenho das páginas públicas, SEO e tráfego orgânico.'],
    ['million', 'Meta de crescimento', millionGoal, 'Simulação para entender o caminho até uma meta grande de receita.'],
    ['audience', 'Quem usa o Bivvo', audience, 'Dispositivos, navegadores, frequência e recursos mais usados.'],
    ['clients', 'Clientes', clients, 'Lista de clientes, planos, status e último acesso.'],
    ['health', 'Erros e serviços', health, 'Mostra se banco de dados, pagamentos, IA e outros serviços estão funcionando.']
  ];

  const simpleIds = new Set(['overview', 'activity', 'founder', 'growth', 'monetization', 'retention', 'clients', 'health']);
  let current = 'overview';
  let simpleMode = true;

  const glossary = h('button.btn.admin-glossary-btn', { type: 'button', onclick: () => showAdminHelp('Como ler a Administração', [
    'Comece pelo Resumo', 'Olhe primeiro Visitantes, Cadastros, Pagantes, Receita e Churn. Esses números contam a história principal do negócio.',
    'Depois procure o gargalo', 'Se há visitantes mas poucos cadastros, melhore a apresentação. Se há cadastros mas poucos pagantes, investigue produto, preço e checkout. Se há pagantes mas muitos cancelamentos, investigue retenção.',
    'Não decida por um número isolado', 'Compare períodos semelhantes e espere volume suficiente antes de concluir que uma mudança funcionou.',
    'Modo simples', 'Mostra apenas as áreas essenciais para administrar o Bivvo. O modo completo libera SEO, audiência e análises mais avançadas.'
  ]) }, '📘 Como entender esta tela');

  const modeBtn = h('button.btn.admin-mode-btn', { type: 'button' });
  const refreshTabs = () => {
    clear(tabs);
    defs.filter(([id]) => !simpleMode || simpleIds.has(id)).forEach(([id, label, , desc]) => {
      tabs.append(h('button', { type: 'button', 'data-id': id, title: desc, onclick: () => open(id) }, label));
    });
    modeBtn.textContent = simpleMode ? 'Mostrar modo completo' : 'Voltar ao modo simples';
    if (simpleMode && !simpleIds.has(current)) current = 'overview';
  };

  const sectionIntro = h('section.admin-beginner-guide',
    h('div', h('small', 'ADMINISTRAÇÃO SIMPLES'), h('h3', 'Entenda o negócio sem precisar saber marketing ou tecnologia'),
      h('p', 'Passe o mouse ou toque no ? dos indicadores para ver o que significa, por que importa e como interpretar.')),
    h('div.admin-beginner-steps',
      h('span', h('b', '1'), ' Pessoas chegaram'),
      h('span', h('b', '2'), ' Criaram conta'),
      h('span', h('b', '3'), ' Viraram clientes'),
      h('span', h('b', '4'), ' Continuaram usando')
    )
  );

  const currentHelp = h('div.admin-section-explain');
  const open = (id) => {
    current = id;
    [...tabs.children].forEach((button) => button.classList.toggle('on', button.dataset.id === id));
    const def = defs.find((x) => x[0] === id);
    currentHelp.replaceChildren(
      h('div', h('small', 'O QUE VOCÊ VAI VER AQUI'), h('b', def?.[1] || 'Administração')),
      h('p', def?.[3] || '')
    );
    def?.[2](content);
  };

  modeBtn.onclick = () => { simpleMode = !simpleMode; refreshTabs(); open(current); };
  period.onchange = () => { DAYS = Number(period.value); CACHE = null; SEO_CACHE = null; SEO_CUSTOM = null; open(current); };

  refreshTabs();
  root.append(h('div.admin-shell',
    h('div.admin-title',
      h('div', h('small', 'ADMINISTRAÇÃO'), h('h2', 'Painel do Bivvo'), h('p', 'Uma visão simples para entender crescimento, clientes e receita.')),
      h('div.admin-title-actions', glossary, modeBtn, period)
    ),
    sectionIntro,
    tabs,
    currentHelp,
    content
  ));
  open('overview');
}

