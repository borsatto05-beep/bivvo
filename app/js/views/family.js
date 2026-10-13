import {learningLaunchCard} from './learning.js';
/* Bivvo 11.45 — Espaço Família + Painel Casal */
import { h, s, money, money0, uid, today, parseMoney, ymOf, monthName, monthShort, addDays, round2, num } from '../util.js';
import * as store from '../store.js';
import * as family from '../family.js';
import * as cloud from '../cloud.js';
import { toast, openSheet, askSheet, field, confirmSheet, sectionTitle } from '../ui.js';
import { getPlanInfo, canUseFeature } from '../plans.js';
import { openProScreen } from './pro.js';
import { ctx, rerender } from '../nav.js';
import { captureBar, startScan } from '../quickcapture.js';
import { parseQuick } from '../quickparse.js';

let cache = undefined, loading = false;
let coupleMode = false, cacheUser = null, demoCouple = null;
let coupleMonth = ymOf(today());

const roleName = r => ({ owner: 'Responsável', editor: 'Pode editar', viewer: 'Somente leitura' }[r] || r);
const COUPLE_EXPENSE_CATEGORIES = ['Moradia','Mercado','Alimentação / delivery','Água','Energia','Gás','Internet e telefone','Transporte','Combustível','Saúde','Filhos','Pets','Lazer a dois','Viagens','Assinaturas','Compras para casa','Presentes','Dívidas do casal','Objetivos do casal','Outros gastos'];
const COUPLE_INCOME_CATEGORIES = ['Salários / rendas','Renda extra','Benefícios','Reembolso','Venda','Rendimentos','Outras entradas'];
const COUPLE_CAT_ICON = {
  'Moradia':'🏠','Mercado':'🛒','Alimentação / delivery':'🍽️','Água':'💧','Energia':'⚡','Gás':'🔥','Internet e telefone':'📶','Transporte':'🚗','Combustível':'⛽','Saúde':'❤️','Filhos':'🧒','Pets':'🐾','Lazer a dois':'🎬','Viagens':'✈️','Assinaturas':'▶️','Compras para casa':'🛋️','Presentes':'🎁','Dívidas do casal':'🧾','Objetivos do casal':'🎯','Outros gastos':'◉',
  'Salários / rendas':'💼','Renda extra':'✨','Benefícios':'🎫','Reembolso':'↩️','Venda':'🏷️','Rendimentos':'📈','Outras entradas':'＋','Casal':'💑'
};
const sum = rows => round2(rows.reduce((n, x) => n + num(x.value), 0));
const COUPLE_PALETTE=['#B6406A','#7B22C9','#D9863D','#51966D','#D4A72C','#667386','#D67494','#825B4E'];

export function renderFamily(root) {
  const userId = cloud.currentUser()?.id || null;
  if (userId !== cacheUser) { cache = undefined; cacheUser = userId; }
  coupleMode = ctx.params.couple === '1' || cache?.kind === 'couple';
  root.append(h('section.family-head',
    h('div',
      h('span.eyebrow', coupleMode ? 'Bivvo Casal' : 'Bivvo Família'),
      h('h2', coupleMode ? 'O dinheiro dos dois, em uma visão só.' : 'Dinheiro em conjunto, privacidade por padrão.'),
      h('p.muted', coupleMode
        ? 'Organizem o que é compartilhado sem misturar as contas pessoais: renda conjunta, gastos da casa, quem pagou, categorias e equilíbrio entre vocês.'
        : 'Compartilhe só o que fizer sentido. Seus lançamentos pessoais continuam privados até você escolher compartilhar.'))));
  if (ctx.demo) {
    if (coupleMode) {
      demoCouple = demoCouple || buildCoupleDemo();
      cache = demoCouple;
      renderSpace(root, demoCouple);
      return;
    }
    root.append(h('section.card.empty', h('b', 'Espaço Família não funciona na demonstração.'), h('p', 'A demonstração interativa está disponível no perfil Casal. Entre em uma conta para criar um espaço Família.')));
    return;
  }
  if (cache === undefined) { root.append(h('section.card', h('p.muted', 'Carregando seu espaço…'))); load(); return; }
  if (cache?.error) { root.append(h('section.card.empty', h('b', 'Não foi possível abrir o espaço.'), h('p', cache.error), h('button.btn', { onclick: () => { cache = undefined; renderFamily(root); } }, 'Tentar novamente'))); return; }
  if (ctx.params?.family && !sessionStorage.getItem('bivvo_family_accept_' + ctx.params.family)) {
    sessionStorage.setItem('bivvo_family_accept_' + ctx.params.family, '1');
    family.acceptInvite(ctx.params.family).then(r => { cache = r.data; reroute(); }).catch(e => toast(e.message, { tone: 'warn' }));
  }
  if (!cache) { renderEmpty(root); return; }
  renderSpace(root, cache);
}

async function load() {
  if (loading) return;
  loading = true;
  try { cache = (await family.getFamily()).data || null; }
  catch (e) { cache = { error: e.message }; }
  finally { loading = false; if (ctx.route === 'familia') rerender(); }
}

function renderEmpty(root) {
  const plan = getPlanInfo(), allowed = coupleMode ? canUseFeature('couple') : canUseFeature('family');
  if (coupleMode) {
    root.append(h('section.card.couple-empty',
      h('span.couple-empty-icon', { 'aria-hidden': 'true' }, '💑'),
      h('h2', 'Criem o financeiro de vocês'),
      h('p.muted', allowed ? 'Crie o espaço do casal e convide a outra pessoa. Cada um continua com seu financeiro pessoal privado.' : 'O ambiente Casal está disponível no Bivvo Casal ou Família.'),
      h('div.couple-empty-grid',
        miniFeature('🏠', 'Casa', 'Contas e gastos compartilhados'),
        miniFeature('⚖️', 'Equilíbrio', 'Veja quanto cada um pagou'),
        miniFeature('🎯', 'Planos', 'Organize objetivos em comum'),
        miniFeature('🔒', 'Privacidade', 'O pessoal de cada um fica separado')),
      h('div.btn-row',
        allowed ? h('button.btn.primary', { onclick: createSpace }, 'Criar espaço do casal') : h('button.btn.primary', { onclick: () => openProScreen({ source: 'couple' }) }, 'Conhecer planos'),
        h('button.btn', { onclick: acceptInvite }, 'Tenho um convite'))));
    return;
  }
  root.append(h('section.card.family-start', sectionTitle('Começar'), h('p.muted', allowed ? 'Crie seu espaço ou entre com um código de convite.' : 'O Espaço Família para até quatro pessoas exige o Bivvo Família.'),
    h('div.btn-row', allowed ? h('button.btn.primary', { onclick: createSpace }, 'Criar meu espaço') : h('button.btn.primary', { onclick: () => openProScreen({ source: 'family' }) }, 'Conhecer plano Família'), h('button.btn', { onclick: acceptInvite }, 'Tenho um convite'))));
}

async function createSpace() {
  const name = await askSheet({ title: coupleMode ? 'Nome do casal' : 'Nome do espaço', label: coupleMode ? 'Ex.: João & Ana' : 'Ex.: Família Carmo', confirmLabel: 'Criar' });
  if (!name) return;
  try { cache = (await family.createFamily(name, coupleMode ? 'couple' : 'family')).data; toast(coupleMode ? 'Espaço do casal criado' : 'Espaço Família criado'); reroute(); }
  catch (e) { toast(e.message, { tone: 'warn' }); }
}

async function acceptInvite() {
  const raw = await askSheet({ title: coupleMode ? 'Entrar no espaço do casal' : 'Entrar no Espaço Família', message: 'Cole o código recebido do responsável.', label: 'Código do convite', confirmLabel: 'Entrar' });
  if (!raw) return;
  const code = String(raw).trim().replace(/^.*[?&#]family=/, '').split(/[&#]/)[0];
  try { cache = (await family.acceptInvite(code)).data; toast(cache?.kind === 'couple' ? 'Você entrou no espaço do casal' : 'Você entrou no Espaço Família'); reroute(); }
  catch (e) { toast(e.message, { tone: 'warn' }); }
}

function reroute() {
  const tab = coupleMode && ['gastos','divisao','agenda'].includes(ctx.params?.tab) ? `&tab=${ctx.params.tab}` : '';
  location.hash = '#/familia' + (coupleMode ? `?couple=1${tab}` : '');
  document.querySelector('#view')?.replaceChildren();
  import('../nav.js').then(m => m.rerender());
}

function renderSpace(root, d) {
  if (d.kind === 'couple') { renderCoupleSpace(root, d); return; }
  renderFamilySpace(root, d);
}

function renderCoupleSpace(root, d) {
  const me = d.membership, canManage = me.role === 'owner', canEdit = (canManage || me.role === 'editor') && d.active;
  const members = d.members || [];
  const t0 = today(), rows = (d.shared || []).slice().sort((a, b) => b.date.localeCompare(a.date));
  const monthRows = rows.filter(x => x.date.startsWith(coupleMonth));
  const incomes = monthRows.filter(x => x.type === 'income'), expenses = monthRows.filter(x => x.type === 'expense');
  const income = sum(incomes), expense = sum(expenses), monthBalance = round2(income - expense);
  const expenseRatio = income > 0 ? expense / income : 0;
  const prevYm = shiftYm(coupleMonth, -1), prevExpense = sum(rows.filter(x => x.type === 'expense' && x.date.startsWith(prevYm)));
  const trend = prevExpense > 0 ? (expense - prevExpense) / prevExpense : null;
  const futureEnd = addDays(t0, 30), upcoming = rows.filter(x => x.type === 'expense' && x.date > t0 && x.date <= futureEnd).sort((a, b) => a.date.localeCompare(b.date));
  const upcomingTotal = sum(upcoming);
  const catMap = new Map();
  for (const x of expenses) catMap.set(x.category || 'Outros gastos', round2((catMap.get(x.category || 'Outros gastos') || 0) + num(x.value)));
  const topCats = [...catMap.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
  const incomeBy = totalsByUser(incomes), expenseBy = totalsByUser(expenses);
  const pairBalance = splitAdvice(members, incomeBy, expenseBy, expense, income);
  const allBalance = round2(sum(rows.filter(x => x.type === 'income')) - sum(rows.filter(x => x.type === 'expense')));
  const coupleName = String(d.family?.name || 'Nosso casal').replace(/^Casal ·\s*/, '');
  const tab = ['gastos','divisao','agenda'].includes(ctx.params?.tab) ? ctx.params.tab : 'resumo';

  if (!d.active) root.append(h('section.card.notice', h('b', 'Ambiente Casal inativo'), h('p.muted.sm', 'O responsável precisa reativar um plano pago para voltar a adicionar ou alterar informações. Os dados existentes permanecem preservados.')));

  if (tab === 'resumo') {
    root.append(learningLaunchCard('couple'));
    root.append(
      h('section.couple-hero',
        h('div.couple-hero-copy', h('span.eyebrow-soft', 'PAINEL DO CASAL'), h('h1', coupleName), h('p', `${monthName(coupleMonth)} · ${members.length === 2 ? 'vocês dois conectados' : 'convide a outra pessoa para completar o espaço'}`)),
        h('div.couple-hero-balance', h('small', 'SALDO COMPARTILHADO REGISTRADO'), h('strong', money(allBalance)), h('span', 'Somente o que vocês colocaram neste espaço'))),
      coupleMonthBar(),
      h('section.couple-kpis',
        coupleKpi('Renda conjunta', income, `${incomes.length} entrada(s) registrada(s)`, '💰', 'income'),
        coupleKpi('Gastos em comum', expense, trend == null ? `${expenses.length} gasto(s)` : `${trend > 0 ? '↑' : '↓'} ${Math.abs(trend * 100).toFixed(0)}% vs. mês anterior`, '🏠', trend != null && trend > .15 ? 'warn' : ''),
        coupleKpi('Saldo do mês', monthBalance, income ? `${Math.max(0, 1 - expenseRatio) * 100 | 0}% da renda ficou livre` : 'entradas − gastos', monthBalance < 0 ? '⚠️' : '✨', monthBalance < 0 ? 'bad' : 'good'),
        coupleKpi('Comprometimento', income ? `${Math.round(expenseRatio * 100)}%` : '—', income ? (expenseRatio > 1 ? 'gastando acima da renda conjunta' : expenseRatio > .8 ? 'orçamento apertado' : 'dentro da renda registrada') : 'registre as rendas do casal', '⚖️', expenseRatio > 1 ? 'bad' : expenseRatio > .8 ? 'warn' : '')),
      coupleActions(d, members, canManage, canEdit));
    root.append(coupleAnalyticsSection({rows,members,incomeBy,expenseBy,income,expense,expenses,topCats,mode:'summary'}));
    root.append(renderShoppingList(d, canEdit));
  } else {
    const copy = {
      gastos: ['🏠', 'Gastos do casal', 'Tudo que vocês pagaram juntos, por categoria e por pessoa.'],
      divisao: ['⚖️', 'Divisão entre vocês', 'Veja quem colocou renda, quem pagou e referências para equilibrar o mês.'],
      agenda: ['📅', 'Agenda do casal', 'Compromissos compartilhados que vencem ou estão previstos para os próximos dias.']
    }[tab];
    root.append(h('section.couple-tab-intro', h('span', {'aria-hidden':'true'}, copy[0]), h('div', h('small', 'BIVVO CASAL'), h('h1', copy[1]), h('p', copy[2]))));
    if (tab !== 'agenda') root.append(coupleMonthBar());
  }

  if (canEdit && (tab === 'resumo' || tab === 'gastos')) root.append(
    h('section.qc-shell.profile-qc.couple-qc',
      h('div.profile-qc-head',h('div',h('h2','Anotar por texto ou voz'),h('p.muted.sm','O lançamento entra direto no espaço compartilhado do casal.'))),
      captureBar(coupleCaptureOptions(d,canEdit))));

  if (tab === 'divisao') root.append(coupleAnalyticsSection({rows,members,incomeBy,expenseBy,income,expense,expenses,topCats,mode:'divisao'}));

  if ((tab === 'resumo' || tab === 'divisao') && members.length === 2) {
    root.append(h('section.card.couple-balance-card',
      h('div.couple-section-head', h('div', h('span.eyebrow-soft', 'DIVISÃO'), h('h3', 'Quem colocou e quem pagou')), h('small', 'Baseado no que foi registrado neste mês')),
      h('div.couple-person-grid', members.map(m => couplePerson(m, incomeBy.get(m.user_id) || 0, expenseBy.get(m.user_id) || 0, income, expense))),
      pairBalance ? h('div.couple-split-advice',
        h('div', h('span', '⚖️'), h('p', h('b', 'Se vocês dividirem 50/50'), h('small', pairBalance.equalText))),
        pairBalance.proportionalText ? h('div', h('span', '💰'), h('p', h('b', 'Se dividirem proporcional à renda'), h('small', pairBalance.proportionalText))) : null,
        h('p.muted.xs', 'Sugestão matemática com base apenas nos lançamentos deste espaço; vocês decidem a regra que faz sentido.')) : h('p.muted.sm', 'Registrem os gastos do mês para o Bivvo calcular o equilíbrio entre vocês.')));
  } else if (tab === 'divisao') {
    root.append(h('section.card.couple-balance-card', emptyMini('Conecte vocês dois', 'A divisão aparece quando as duas pessoas estiverem conectadas ao espaço do casal.')));
  }

  if (tab === 'resumo' || tab === 'gastos') {
    if (tab === 'gastos') {
      root.append(coupleActions(d, members, canManage, canEdit));
      root.append(coupleAnalyticsSection({rows,members,incomeBy,expenseBy,income,expense,expenses,topCats,mode:'gastos'}));
    }
    root.append(h('section.card',
      h('div.couple-section-head', h('div', h('span.eyebrow-soft', 'ONDE FOI'), h('h3', 'Gastos por categoria')), topCats.length ? h('b', money(expense)) : null),
      topCats.length ? h('div.couple-cat-list', topCats.map(([cat, value]) => categoryRow(cat, value, expense, expenses))) : emptyMini('Sem gastos neste mês', 'Quando vocês registrarem despesas, as maiores categorias aparecem aqui.')));
  }

  if (tab === 'resumo' || tab === 'agenda') {
    root.append(h('section.card.couple-agenda-card',
      h('div.couple-section-head', h('div', h('span.eyebrow-soft', 'PRÓXIMOS 30 DIAS'), h('h3', 'Compromissos compartilhados')), upcoming.length ? h('b', money(upcomingTotal)) : null),
      upcoming.length ? h('div.couple-upcoming-list', (tab === 'agenda' ? upcoming : upcoming.slice(0, 5)).map(x => simpleCoupleRow(x, d, canEdit))) : emptyMini('Nada previsto', 'Lancem uma despesa com data futura para ela aparecer na agenda do casal.')));
  }

  if (tab === 'resumo' || tab === 'gastos') {
    const historyRows = tab === 'gastos' ? rows : rows.slice(0, 12);
    root.append(h('section.card.couple-recent',
      h('div.couple-section-head', h('div', h('span.eyebrow-soft', 'HISTÓRICO'), h('h3', 'Movimentações do casal')), h('small', `${rows.length} registro(s)`)),
      historyRows.length ? h('div.family-tx-list', historyRows.map(x => sharedRow(x, d, canEdit, true))) : emptyMini('Comecem pelo primeiro lançamento', 'Adicione uma entrada ou um gasto que pertença aos dois.')));
  }

  if (tab === 'resumo') root.append(h('section.card.couple-privacy',
    h('span', { 'aria-hidden': 'true' }, '🔒'),
    h('div', h('b', 'O que é pessoal continua pessoal'), h('p.muted.sm', 'O Bivvo Casal mostra somente o que vocês registrarem ou compartilharem aqui. Extrato pessoal, Empresa, cartões, dívidas e outros dados individuais não são exibidos automaticamente.'))));

  if (members.length < 2 && canManage) root.append(h('section.card.couple-invite-callout', h('div', h('b', 'Falta conectar a outra pessoa'), h('p.muted.sm', 'Convide seu parceiro ou parceira para cada um registrar o que recebeu e o que pagou.')), h('button.btn.primary', { onclick: () => invite('editor') }, 'Criar convite')));
  if (me.role !== 'owner' && tab === 'resumo' && !ctx.demo) root.append(h('section.card', h('button.btn.ghost.danger-text', { onclick: leave }, 'Sair deste espaço do casal')));
}

function coupleMonthBar() {
  return h('section.card.couple-monthbar',
    h('button.icon-btn', { type: 'button', title: 'Mês anterior', onclick: () => changeCoupleMonth(-1) }, '‹'),
    h('div', h('b', monthName(coupleMonth)), h('small', 'Visão mensal do casal')),
    h('button.icon-btn', { type: 'button', title: 'Próximo mês', disabled: coupleMonth >= ymOf(today()), onclick: () => changeCoupleMonth(1) }, '›'));
}

function coupleActions(d, members, canManage, canEdit) {
  return h('section.card.couple-actions-card', sectionTitle('Ações do casal'), h('div.couple-action-grid',
    coupleAction('＋', 'Entrada conjunta', 'Salário, renda ou benefício', () => addCoupleTransaction('income'), 'income', canEdit),
    coupleAction('−', 'Gasto compartilhado', 'Casa, mercado, lazer…', () => addCoupleTransaction('expense'), 'expense', canEdit),
    coupleAction('↗', 'Trazer do meu pessoal', 'Compartilhe só um lançamento', () => openSharePicker(d), 'share', canEdit),
    coupleAction('🛒', 'Lista de compras', 'Mercado e itens da casa', () => document.querySelector('#couple-shopping')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 'shopping', true),
    coupleAction('👥', members.length < 2 ? 'Convidar parceiro(a)' : 'Ver vocês dois', members.length < 2 ? 'Conecte a outra pessoa' : 'Acessos e permissões', members.length < 2 ? () => invite('editor') : () => openMembers(d, canManage), 'people', true)));
}


function buildCoupleDemo() {
  const meId = 'demo-ana', otherId = 'demo-caio', ym = ymOf(today()), prev = shiftYm(ym, -1);
  const d = {
    family:{ id:'demo-couple', name:'Casal · Ana & Caio', owner_id:meId, created_at:today() },
    membership:{ id:'demo-member-1', family_id:'demo-couple', user_id:meId, role:'editor', display_name:'Ana' },
    members:[
      { id:'demo-member-1', family_id:'demo-couple', user_id:meId, role:'editor', display_name:'Ana' },
      { id:'demo-member-2', family_id:'demo-couple', user_id:otherId, role:'editor', display_name:'Caio' }
    ],
    shared:[], shopping:[], active:true, kind:'couple', maxMembers:2, demo:true
  };
  const push=(date,description,category,type,value,user_id=meId)=>d.shared.push({id:uid(),source_id:'demo-'+uid(),date,description,category,type,value,user_id,created_at:Date.now()});
  push(`${prev}-05`,'Salário Ana','Salários / rendas','income',3900,meId);
  push(`${prev}-05`,'Salário Caio','Salários / rendas','income',4700,otherId);
  push(`${prev}-08`,'Aluguel','Moradia','expense',1650,otherId);
  push(`${prev}-11`,'Mercado do mês','Mercado','expense',742.35,meId);
  push(`${prev}-18`,'Energia','Energia','expense',196.42,otherId);
  push(`${prev}-22`,'Jantar a dois','Lazer a dois','expense',148.9,meId);
  const day=Math.max(1,Number(today().slice(8)));
  const safe=(n)=>String(Math.min(Math.max(1,n),28)).padStart(2,'0');
  push(`${ym}-${safe(Math.min(day,5))}`,'Salário Ana','Salários / rendas','income',3900,meId);
  push(`${ym}-${safe(Math.min(day,5))}`,'Salário Caio','Salários / rendas','income',4700,otherId);
  push(`${ym}-${safe(Math.min(day,8))}`,'Aluguel','Moradia','expense',1650,otherId);
  push(`${ym}-${safe(Math.min(day,9))}`,'Mercado Assaí','Mercado','expense',486.72,meId);
  push(`${ym}-${safe(Math.min(day,12))}`,'Internet fibra','Internet e telefone','expense',119.9,otherId);
  push(`${ym}-${safe(Math.min(day,14))}`,'Farmácia','Saúde','expense',83.5,meId);
  push(`${ym}-${safe(Math.min(day,16))}`,'Combustível','Combustível','expense',210,otherId);
  push(`${ym}-${safe(Math.min(day,18))}`,'Cinema','Lazer a dois','expense',92,meId);
  const future=addDays(today(),7), future2=addDays(today(),15);
  push(future,'Conta de energia','Energia','expense',205.8,otherId);
  push(future2,'Mercado quinzenal','Mercado','expense',430,meId);
  d.shared.sort((a,b)=>b.date.localeCompare(a.date));
  const shop=(name,quantity,unit,unit_price,purchased=false,user_id=meId,actual_total=null)=>d.shopping.push({id:uid(),family_id:d.family.id,user_id,name,quantity,unit,unit_price,purchased,actual_total:purchased?(actual_total ?? round2(quantity*unit_price)):null,created_at:new Date().toISOString(),updated_at:new Date().toISOString()});
  shop('Arroz 5 kg',1,'un',29.9,false,meId);
  shop('Feijão',2,'pct',8.49,false,otherId);
  shop('Leite',6,'cx',5.79,true,meId,33.9);
  shop('Frango',2,'kg',18.9,false,otherId);
  shop('Café',2,'pct',19.9,false,meId);
  shop('Sabão em pó',1,'un',24.9,true,otherId,22.99);
  shop('Papel higiênico',1,'pct',18.5,false,meId);
  shop('Pasta de dente',2,'un',7.5,false,otherId);
  return d;
}

function demoSharedRow({date,desc,cat,type,value}) {
  return { id:uid(), source_id:'demo-'+uid(), date, description:desc, category:cat, type, value:round2(value), user_id:'demo-ana', created_at:Date.now() };
}

function shoppingEstimate(item) { return round2(num(item.quantity || 1) * num(item.unit_price || 0)); }
function shoppingOwner(item,d) { return d.members?.find(m=>m.user_id===item.user_id)?.display_name || 'Pessoa'; }

function renderShoppingList(d, canEdit) {
  const items=(d.shopping||[]).slice().sort((a,b)=>Number(a.purchased)-Number(b.purchased)||String(b.created_at||'').localeCompare(String(a.created_at||'')));
  const pending=items.filter(x=>!x.purchased), done=items.filter(x=>x.purchased);
  const estimated=round2(pending.reduce((n,x)=>n+shoppingEstimate(x),0));
  const purchased=round2(done.reduce((n,x)=>n+num(x.actual_total ?? shoppingEstimate(x)),0));
  return h('section.card.couple-shopping-card',{id:'couple-shopping'},
    h('div.couple-section-head',
      h('div',h('span.eyebrow-soft','LISTA DE COMPRAS'),h('h3','Compras de vocês'),h('p.muted.sm','Os dois podem adicionar e marcar itens. A lista fica sincronizada no espaço Casal.')),
      canEdit?h('button.btn.primary.sm',{type:'button',onclick:()=>openShoppingItem(d)},'＋ Adicionar'):null),
    h('div.couple-shopping-kpis',
      h('div',h('small','Faltam comprar'),h('b',String(pending.length)),h('span',estimated?`≈ ${money(estimated)}`:'sem valor estimado')),
      h('div',h('small','Já comprados'),h('b',String(done.length)),h('span',purchased?money(purchased):'R$ 0')),
      h('div',h('small','Itens na lista'),h('b',String(items.length)),h('span','compartilhados'))),
    items.length?h('div.couple-shopping-list',items.map(x=>shoppingRow(x,d,canEdit))):emptyMini('Lista vazia','Adicionem mercado, produtos da casa ou qualquer item que vocês precisam comprar.'),
    done.length&&canEdit?h('div.couple-shopping-footer',h('button.link.sm',{type:'button',onclick:()=>clearPurchasedShopping(d)},'Limpar itens comprados')):null);
}

function shoppingRow(item,d,canEdit) {
  const estimate=shoppingEstimate(item), total=item.purchased?num(item.actual_total ?? estimate):estimate;
  return h('div.couple-shopping-item'+(item.purchased?'.done':''),
    h('button.shopping-check',{type:'button',disabled:!canEdit,'aria-label':item.purchased?'Marcar como pendente':'Marcar como comprado',onclick:()=>toggleShoppingItem(item,d)},item.purchased?'✓':''),
    h('div.shopping-copy',h('b',item.name),h('small',`${num(item.quantity||1)} ${item.unit||'un'} · por ${shoppingOwner(item,d)}`)),
    h('div.shopping-value',h('b',total?money(total):'—'),h('small',item.purchased?'comprado':'estimado')),
    canEdit?h('button.icon-btn.shopping-edit',{type:'button',title:'Editar item',onclick:()=>openShoppingItem(d,item)},'⋯'):null);
}

function openShoppingItem(d,item=null) {
  const name=h('input.input',{maxlength:100,placeholder:'Ex.: arroz 5 kg',value:item?.name||''});
  const qty=h('input.input',{inputmode:'decimal',placeholder:'1',value:String(item?.quantity||1).replace('.',',')});
  const unit=h('select.input',{},['un','pct','kg','g','L','cx','dz'].map(x=>h('option',{value:x},x))); unit.value=item?.unit||'un';
  const unitPrice=h('input.input',{inputmode:'decimal',placeholder:'0,00',value:item?.unit_price?String(item.unit_price).replace('.',','):''});
  const actual=h('input.input',{inputmode:'decimal',placeholder:'0,00',value:item?.actual_total?String(item.actual_total).replace('.',','):''});
  const msg=h('p.form-msg'); let busy=false; let sh;
  const content=h('div.form',field('Item',name),h('div.form-grid-2',field('Quantidade',qty),field('Unidade',unit)),field('Preço estimado por unidade',unitPrice),item?.purchased?field('Total pago (opcional)',actual):null,msg);
  const buttons=[];
  if(item) buttons.push(h('button.btn.ghost.danger-text',{onclick:()=>deleteShoppingItem(item,d,sh)},'Excluir'));
  buttons.push(h('button.btn.primary',{onclick:async()=>{
    if(busy)return; const quantity=Math.max(.01,parseMoney(qty.value)||1), price=Math.max(0,parseMoney(unitPrice.value)||0), actualTotal=Math.max(0,parseMoney(actual.value)||0);
    if(!name.value.trim()){msg.textContent='Digite o item.';return;} busy=true;
    try{
      if(ctx.demo){
        if(item){Object.assign(item,{name:name.value.trim(),quantity,unit:unit.value,unit_price:price,actual_total:item.purchased?(actualTotal||item.actual_total||round2(quantity*price)):null,updated_at:new Date().toISOString()});}
        else demoCouple.shopping.unshift({id:uid(),family_id:demoCouple.family.id,user_id:'demo-ana',name:name.value.trim(),quantity,unit:unit.value,unit_price:price,purchased:false,actual_total:null,created_at:new Date().toISOString(),updated_at:new Date().toISOString()});
        cache=demoCouple;
      }else if(item){
        await family.shoppingUpdate(item.id,{name:name.value.trim(),quantity,unit:unit.value,unitPrice:price,actualTotal:item.purchased?(actualTotal||null):null}); cache=(await family.getFamily()).data;
      }else{
        await family.shoppingAdd({name:name.value.trim(),quantity,unit:unit.value,unitPrice:price}); cache=(await family.getFamily()).data;
      }
      sh.close(); rerender();
    }catch(e){msg.textContent=e.message;busy=false;}
  }},item?'Salvar':'Adicionar'));
  sh=openSheet({title:item?'Editar item':'Adicionar à lista',subtitle:'A lista é compartilhada entre vocês dois.',content,footer:buttons});
}

async function toggleShoppingItem(item,d){
  try{
    const next=!item.purchased;
    if(ctx.demo){item.purchased=next;item.actual_total=next?(item.actual_total??shoppingEstimate(item)):null;item.updated_at=new Date().toISOString();cache=demoCouple;}
    else {await family.shoppingToggle(item.id,next,next?(item.actual_total??shoppingEstimate(item)):null);cache=(await family.getFamily()).data;}
    rerender();
  }catch(e){toast(e.message,{tone:'warn'});}
}
async function deleteShoppingItem(item,d,sh){
  if(!await confirmSheet({title:'Excluir item?',message:`Remover “${item.name}” da lista de compras?`,confirmLabel:'Excluir',danger:true}))return;
  try{if(ctx.demo){demoCouple.shopping=demoCouple.shopping.filter(x=>x.id!==item.id);cache=demoCouple;}else{await family.shoppingDelete(item.id);cache=(await family.getFamily()).data;}sh?.close();rerender();}catch(e){toast(e.message,{tone:'warn'});}
}
async function clearPurchasedShopping(d){
  if(!await confirmSheet({title:'Limpar comprados?',message:'Os itens já marcados como comprados serão removidos da lista.',confirmLabel:'Limpar'}))return;
  try{if(ctx.demo){demoCouple.shopping=demoCouple.shopping.filter(x=>!x.purchased);cache=demoCouple;}else{await family.shoppingClearDone();cache=(await family.getFamily()).data;}rerender();}catch(e){toast(e.message,{tone:'warn'});}
}

function renderFamilySpace(root, d) {
  const me = d.membership, canManage = me.role === 'owner', canEdit = (canManage || me.role === 'editor') && d.active;
  const income = d.shared.filter(x => x.type === 'income').reduce((a, x) => a + Number(x.value || 0), 0), expense = d.shared.filter(x => x.type === 'expense').reduce((a, x) => a + Number(x.value || 0), 0);
  if (!d.active) root.append(h('section.card.notice', h('b', 'Plano Família inativo'), h('p.muted.sm', 'O responsável precisa reativar o Bivvo Família para voltar a compartilhar ou administrar este espaço. Os dados existentes permanecem preservados.')));
  root.append(h('section.card.family-summary', h('div', h('small', 'Espaço'), h('h3', d.family.name), h('p.muted.sm', `${d.members.length} de ${d.maxMembers || 4} membros · você: ${roleName(me.role)}`)), h('div.stats', h('div.stat', h('small', 'Entradas compartilhadas'), h('b', money(income))), h('div.stat', h('small', 'Gastos compartilhados'), h('b', money(expense))), h('div.stat', h('small', 'Saldo compartilhado'), h('b', money(income - expense))))));
  const members = h('div.family-members', d.members.map(m => memberRow(m, d, canManage)));
  root.append(h('section.card', sectionTitle('Membros'), members, canManage && d.members.length < (d.maxMembers || 4) ? h('button.btn.primary.block', { onclick: () => invite() }, 'Convidar membro') : null));
  if (canEdit) root.append(h('section.card', sectionTitle('Privado x compartilhado'), h('p.muted.sm', 'Nada do seu extrato pessoal entra aqui automaticamente. Escolha abaixo o que a família pode ver.'), h('button.btn.block', { onclick: () => openSharePicker(d) }, 'Escolher lançamentos para compartilhar')));
  else root.append(h('section.card', sectionTitle('Seu acesso'), h('p.muted.sm', 'Você pode acompanhar o que foi compartilhado, mas não pode adicionar ou alterar informações familiares.')));
  root.append(h('section.card', sectionTitle('Movimentações compartilhadas'), d.shared.length ? h('div.family-tx-list', d.shared.map(x => sharedRow(x, d, canEdit))) : h('div.empty', h('b', 'Nada compartilhado ainda.'), h('p', 'Os dados pessoais continuam privados.'))));
  if (me.role !== 'owner') root.append(h('section.card', h('button.btn.ghost.danger-text', { onclick: leave }, 'Sair deste Espaço Família')));
}

function shiftYm(ym, delta) {
  const [y, m] = ym.split('-').map(Number), d = new Date(y, m - 1 + delta, 1, 12);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}
function changeCoupleMonth(delta) { coupleMonth = shiftYm(coupleMonth, delta); rerender(); }
function totalsByUser(rows) { const m = new Map(); for (const x of rows) m.set(x.user_id, round2((m.get(x.user_id) || 0) + num(x.value))); return m; }
function miniFeature(icon, title, text) { return h('div.couple-mini-feature', h('span', { 'aria-hidden': 'true' }, icon), h('div', h('b', title), h('small', text))); }
function coupleKpi(label, value, hint, icon, tone = '') { return h('article.couple-kpi' + (tone ? '.' + tone : ''), h('span.couple-kpi-icon', { 'aria-hidden': 'true' }, icon), h('small', label), h('strong', typeof value === 'number' ? money(value) : value), h('p', hint)); }
function coupleAction(icon, title, hint, fn, tone, enabled) { return h('button.couple-action.' + tone, { type: 'button', disabled: !enabled, onclick: fn }, h('span', { 'aria-hidden': 'true' }, icon), h('div', h('b', title), h('small', enabled ? hint : 'Sem permissão para editar'))); }
function couplePerson(m, inc, exp, totalInc, totalExp) {
  const incomeShare = totalInc > 0 ? inc / totalInc : 0;
  const expenseShare = totalExp > 0 ? exp / totalExp : 0;
  return h('article.couple-person',
    h('div.couple-person-head',
      h('span.avatar', String(m.display_name || '?').charAt(0).toUpperCase()),
      h('div', h('b', m.display_name || 'Pessoa'), h('small', roleName(m.role)))),
    h('div.couple-person-values',
      h('div', h('small', 'Entradas'), h('b', money(inc)), totalInc ? h('span', `${Math.round(incomeShare * 100)}% da renda`) : null),
      h('div', h('small', 'Pagou'), h('b', money(exp)), totalExp ? h('span', `${Math.round(expenseShare * 100)}% dos gastos`) : null)));
}
function splitAdvice(members, incomeBy, expenseBy, totalExpense, totalIncome) {
  if (members.length !== 2 || totalExpense <= 0) return null;
  const [a, b] = members, paidA = expenseBy.get(a.user_id) || 0, half = totalExpense / 2;
  const deltaA = round2(paidA - half);
  const equalText = Math.abs(deltaA) < .01 ? 'Os gastos registrados já estão equilibrados.' : deltaA > 0 ? `${b.display_name || 'A outra pessoa'} teria ${money(Math.abs(deltaA))} para repassar a ${a.display_name || 'você'}.` : `${a.display_name || 'Você'} teria ${money(Math.abs(deltaA))} para repassar a ${b.display_name || 'outra pessoa'}.`;
  let proportionalText = '';
  if (totalIncome > 0) {
    const incA = incomeBy.get(a.user_id) || 0, expectedA = totalExpense * (incA / totalIncome), propDeltaA = round2(paidA - expectedA);
    proportionalText = Math.abs(propDeltaA) < .01 ? 'Os gastos registrados já estão proporcionais às rendas informadas.' : propDeltaA > 0 ? `${b.display_name || 'A outra pessoa'} teria ${money(Math.abs(propDeltaA))} para repassar a ${a.display_name || 'você'}.` : `${a.display_name || 'Você'} teria ${money(Math.abs(propDeltaA))} para repassar a ${b.display_name || 'outra pessoa'}.`;
  }
  return { equalText, proportionalText };
}
function categoryRow(cat, value, total, expenses=[]) {
  const pct = total > 0 ? Math.max(2, Math.round(value / total * 100)) : 0;
  const detail=()=>openCoupleInsight({icon:COUPLE_CAT_ICON[cat]||'◉',title:cat,subtitle:'Detalhes dos gastos do casal nesta categoria.',stats:[['Total',money0(value)],['Peso',`${Math.round(value/Math.max(total,1)*100)}%`],['Lançamentos',String(expenses.filter(x=>(x.category||'Outros gastos')===cat).length)],['Média',money0(value/Math.max(1,expenses.filter(x=>(x.category||'Outros gastos')===cat).length))]],sections:[{title:'Movimentações',rows:expenses.filter(x=>(x.category||'Outros gastos')===cat).map(x=>[x.description||cat,`${money0(x.value)} · ${x.date}`,''])}],note:'Use essa visão para entender o que está puxando o orçamento do casal e decidir onde ajustar juntos.'});
  return h('button.couple-cat-row.couple-chart-row',{type:'button',onclick:detail,'aria-label':`${cat}: ${money0(value)}. Abrir detalhes`}, h('span.couple-cat-icon', { 'aria-hidden': 'true' }, COUPLE_CAT_ICON[cat] || '◉'), h('div', h('span', h('b', cat), h('small', `${Math.round(value / Math.max(total, 1) * 100)}%`)), h('i', h('em', { vars: { '--couple-pct': `${pct}%` } }))), h('b', money0(value)));
}

function coupleAnalyticsSection({rows,members,incomeBy,expenseBy,income,expense,expenses,topCats,mode='summary'}){
  const cards=[];
  if(mode==='summary'||mode==='gastos')cards.push(coupleTrendCard(rows));
  if(mode==='summary'||mode==='gastos')cards.push(coupleExpenseDonut(expenses,expense,topCats));
  if(mode==='summary'||mode==='divisao')cards.push(coupleContributionCard(members,incomeBy,expenseBy,income,expense));
  return h('section.couple-bi-grid'+(mode==='summary'?'.triple':''),cards);
}
function coupleTrendCard(rows){
  const months=Array.from({length:6},(_,i)=>shiftYm(coupleMonth,i-5));
  const data=months.map(ym=>{const mr=rows.filter(x=>x.date.startsWith(ym));return {ym,income:sum(mr.filter(x=>x.type==='income')),expense:sum(mr.filter(x=>x.type==='expense'))};});
  const max=Math.max(1,...data.flatMap(x=>[x.income,x.expense]));
  const totalIn=round2(data.reduce((n,x)=>n+x.income,0)),totalOut=round2(data.reduce((n,x)=>n+x.expense,0)),detail=()=>openCoupleInsight({icon:'📈',title:'Evolução do casal',subtitle:'Entradas e gastos compartilhados dos últimos 6 meses.',stats:[['Entradas',money0(totalIn)],['Gastos',money0(totalOut)],['Saldo',money0(totalIn-totalOut)],['Média de gastos',money0(totalOut/6)]],sections:[{title:'Mês a mês',rows:data.slice().reverse().map(x=>[monthName(x.ym),`Entradas ${money0(x.income)} · Gastos ${money0(x.expense)}`,x.income>=x.expense?'ok':'atenção'])}],note:totalIn>=totalOut?'No acumulado de 6 meses, o que entrou no espaço do casal cobriu os gastos compartilhados.':'No acumulado de 6 meses, os gastos compartilhados superaram as entradas registradas.'});
  return coupleInteractiveCard('📈','Evolução 6 meses','Entradas x gastos do casal',detail,h('div.couple-trend-chart',data.map(x=>h('button.couple-trend-month',{type:'button',onclick:detail,title:`${monthName(x.ym)}: entradas ${money(x.income)}, gastos ${money(x.expense)}`},h('div',h('i.income',{vars:{'--h':`${Math.max(3,x.income/max*100)}%`}}),h('i.expense',{vars:{'--h':`${Math.max(3,x.expense/max*100)}%`}})),h('small',monthShort(x.ym))))),h('div.couple-chart-legend',h('span',h('i.income'),'Entradas'),h('span',h('i.expense'),'Gastos')));
}
function coupleExpenseDonut(expenses,total,topCats){
  const data=(topCats||[]).map(([cat,value])=>({cat,value,share:total?value/total:0}));
  const r=43,c=2*Math.PI*r;let off=0;
  const detail=()=>openCoupleInsight({icon:'🏠',title:'Gastos por categoria',subtitle:'Onde o dinheiro compartilhado foi usado neste mês.',stats:[['Gastos do mês',money0(total)],['Categorias',String(data.length)],['Maior categoria',data[0]?.cat||'—'],['Maior peso',data[0]?`${Math.round(data[0].share*100)}%`:'—']],sections:[{title:'Categorias',rows:data.map(x=>[x.cat,`${money0(x.value)} · ${Math.round(x.share*100)}%`,x.share>.3?'atenção':''])}],note:data[0]?.share>.4?'Uma categoria representa mais de 40% dos gastos compartilhados. Vale abrir os lançamentos e conferir se é esperado.':'Os gastos estão distribuídos entre as categorias registradas.'});
  const segs=data.map((x,i)=>{const len=x.share*c,start=off;off+=len;return s('circle',{cx:55,cy:55,r,fill:'none',stroke:COUPLE_PALETTE[i%COUPLE_PALETTE.length],'stroke-width':15,'stroke-dasharray':`${len} ${Math.max(0,c-len)}`,'stroke-dashoffset':`${-start}`,transform:'rotate(-90 55 55)'},s('title',{},`${x.cat}: ${money(x.value)}`));});
  const donut=total?s('svg',{viewBox:'0 0 110 110',role:'img','aria-label':'Gastos do casal por categoria'},s('circle',{cx:55,cy:55,r,fill:'none',class:'couple-donut-bg','stroke-width':15}),...segs,s('text',{x:55,y:51,'text-anchor':'middle',class:'couple-donut-label'},'GASTOS'),s('text',{x:55,y:67,'text-anchor':'middle',class:'couple-donut-value'},money0(total))):h('div.couple-chart-empty','Sem gastos');
  return coupleInteractiveCard('🏠','Gastos por categoria','Participação no mês',detail,h('div.couple-donut-layout',h('div.couple-donut',donut),h('div.couple-donut-mini',data.slice(0,4).map((x,i)=>h('button',{type:'button',onclick:detail},h('i',{vars:{'--dot':COUPLE_PALETTE[i%COUPLE_PALETTE.length]}}),h('span',h('b',x.cat),h('small',`${Math.round(x.share*100)}%`)))))));
}
function coupleContributionCard(members,incomeBy,expenseBy,totalIncome,totalExpense){
  const data=members.map(m=>({name:m.display_name||'Pessoa',income:incomeBy.get(m.user_id)||0,expense:expenseBy.get(m.user_id)||0}));
  const max=Math.max(1,...data.flatMap(x=>[x.income,x.expense]));
  const detail=()=>openCoupleInsight({icon:'⚖️',title:'Participação de vocês',subtitle:'Quanto cada pessoa colocou de renda e quanto pagou no mês.',stats:[['Renda conjunta',money0(totalIncome)],['Gastos',money0(totalExpense)],['Pessoas',String(members.length)],['Saldo',money0(totalIncome-totalExpense)]],sections:[{title:'Por pessoa',rows:data.map(x=>[x.name,`Entradas ${money0(x.income)} · Pagou ${money0(x.expense)}`,x.expense>totalExpense/2?'maior participação':''])}],note:'Esse gráfico não define o que é justo; ele só mostra os valores registrados para vocês decidirem se preferem 50/50, proporcional à renda ou outra regra.'});
  return coupleInteractiveCard('⚖️','Quem colocou e quem pagou','Comparação entre vocês',detail,h('div.couple-contribution-chart',data.map((x,i)=>h('button',{type:'button',onclick:detail},h('div.couple-contribution-head',h('b',x.name),h('small',`${money0(x.expense)} pagos`)),h('div.couple-contribution-bars',h('i.income',{vars:{'--w':`${x.income/max*100}%`}}),h('i.expense',{vars:{'--w':`${x.expense/max*100}%`}}))))),h('div.couple-chart-legend',h('span',h('i.income'),'Entradas'),h('span',h('i.expense'),'Pagou')));
}
function coupleInteractiveCard(icon,title,sub,detail,...content){
  return h('article.card.couple-bi-card',{tabindex:'0',role:'button','aria-label':`${title}. Abrir detalhes`,onclick:e=>{if(e.target.closest('button,a,input,select,textarea'))return;detail();},onkeydown:e=>{if((e.key==='Enter'||e.key===' ')){e.preventDefault();detail();}}},h('div.couple-bi-head',h('div',h('span',icon),h('span',h('b',title),h('small',sub))),h('button.bi-expand',{type:'button',onclick:e=>{e.stopPropagation();detail();},'aria-label':`Abrir detalhes de ${title}`},'↗')),...content);
}
function openCoupleInsight({icon='💑',title,subtitle='',stats=[],sections=[],note=''}){
  const statGrid=h('div.bi-modal-stats.couple-modal-stats',stats.map(([label,value])=>h('article',h('small',label),h('b',value))));
  const blocks=sections.map(sec=>h('section.bi-modal-section',h('div.bi-modal-section-head',h('b',sec.title)),h('div.bi-modal-list',sec.rows?.length?sec.rows.map(([label,value,tone])=>h('div.bi-modal-row',h('span',h('b',label),tone?h('small',{class:tone==='atenção'?'bad':tone==='ok'?'good':''},tone):null),h('strong',value))):h('p.muted.sm','Sem dados suficientes.'))));
  openSheet({wide:true,label:`Detalhes: ${title}`,content:h('div.bi-detail-modal.couple-detail-modal',h('div.bi-modal-hero.couple-modal-hero',h('span',{'aria-hidden':'true'},icon),h('div',h('small','DETALHES DO CASAL'),h('h2',title),subtitle?h('p',subtitle):null)),statGrid,...blocks,note?h('div.bi-modal-note.couple-modal-note',h('span','💡'),h('p',note)):null)});
}

function emptyMini(title, text) { return h('div.couple-empty-mini', h('b', title), h('p.muted.sm', text)); }
function simpleCoupleRow(x, d, canEdit) { return sharedRow(x, d, canEdit, true); }

function memberRow(m, d, canManage) {
  const mine = m.id === d.membership.id, actions = [];
  if (canManage && m.role !== 'owner') { actions.push(h('button.link.sm', { onclick: () => changeRole(m) }, roleName(m.role))); actions.push(h('button.link.sm.danger-text', { onclick: () => remove(m) }, 'Remover')); }
  return h('div.family-member', h('span.avatar', String(m.display_name || '?').charAt(0).toUpperCase()), h('span', h('b', m.display_name || 'Membro'), h('small', mine ? 'Você · ' + roleName(m.role) : roleName(m.role))), h('span.family-member-actions', actions));
}

function openMembers(d, canManage) {
  openSheet({ title: d.kind === 'couple' ? 'Vocês dois' : 'Membros', subtitle: d.kind === 'couple' ? 'O financeiro pessoal de cada pessoa continua privado.' : 'Acessos do espaço compartilhado.', content: h('div.family-members', d.members.map(m => memberRow(m, d, canManage))) });
}

async function invite(forcedRole = '') {
  try {
    const role = forcedRole || await chooseRole(); if (!role) return;
    const r = await family.createInvite(role), link = `${location.origin}${location.pathname}#/familia?family=${r.code}`;
    const box = h('textarea.input', { readOnly: true, rows: 3 }, link);
    openSheet({ title: coupleMode ? 'Convite do casal criado' : 'Convite criado', subtitle: 'Válido por 7 dias. Envie este link para a pessoa.', content: [box, h('button.btn.primary.block', { onclick: async () => { try { await navigator.clipboard.writeText(link); toast('Link copiado'); } catch { box.select(); document.execCommand('copy'); toast('Link copiado'); } } }, 'Copiar convite')] });
  } catch (e) { toast(e.message, { tone: 'warn' }); }
}

function chooseRole() {
  return new Promise(resolve => {
    const sh = openSheet({ title: 'Permissão do novo membro', content: h('div.family-role-choices',
      h('button.menu-item', { onclick: () => { sh.close(); resolve('editor'); } }, h('span.mi-ico', '✎'), h('span', h('b', 'Pode editar'), h('small', 'Pode compartilhar e remover os próprios lançamentos compartilhados.'))),
      h('button.menu-item', { onclick: () => { sh.close(); resolve('viewer'); } }, h('span.mi-ico', '◉'), h('span', h('b', 'Somente leitura'), h('small', 'Acompanha o espaço sem alterar dados.')))) });
  });
}

async function changeRole(m) { const role = await chooseRole(); if (!role) return; try { await family.setRole(m.id, role); cache = (await family.getFamily()).data; reroute(); } catch (e) { toast(e.message, { tone: 'warn' }); } }
async function remove(m) { if (!await confirmSheet({ title: `Remover ${m.display_name || 'membro'}?`, message: 'A pessoa perderá acesso ao espaço e os lançamentos que ela compartilhou serão removidos.', confirmLabel: 'Remover', danger: true })) return; try { await family.removeMember(m.id); cache = (await family.getFamily()).data; reroute(); } catch (e) { toast(e.message, { tone: 'warn' }); } }
async function leave() { if (!await confirmSheet({ title: coupleMode ? 'Sair do espaço do casal?' : 'Sair do Espaço Família?', message: 'Você perderá acesso aos dados compartilhados. Seus dados pessoais não serão apagados.', confirmLabel: 'Sair', danger: true })) return; try { await family.leaveFamily(); cache = null; reroute(); } catch (e) { toast(e.message, { tone: 'warn' }); } }

function openSharePicker(d) {
  const mine = new Set(d.shared.filter(x => x.user_id === d.membership.user_id).map(x => x.source_id));
  const tx = store.getState().transactions.slice().sort((a, b) => b.date.localeCompare(a.date)).slice(0, 80);
  const list = h('div.family-picker', tx.map(t => {
    const on = mine.has(t.id);
    return h('button.menu-item', { onclick: async e => { const btn = e.currentTarget; btn.disabled = true; try {
      if (ctx.demo && d.kind === 'couple') {
        if (on) demoCouple.shared = demoCouple.shared.filter(x => x.source_id !== t.id);
        else demoCouple.shared.unshift({id:uid(),source_id:t.id,date:t.date,description:t.desc,category:t.cat,type:t.type,value:t.value,user_id:d.membership.user_id,created_at:Date.now()});
        cache = demoCouple;
      } else {
        if (on) await family.unshareTransaction(t.id); else await family.shareTransaction(t);
        cache = (await family.getFamily()).data;
      }
      toast(on ? 'Voltou a ser privado' : (d.kind === 'couple' ? 'Compartilhado com o casal' : 'Compartilhado com a família')); document.querySelector('.sheet-wrap')?.remove(); reroute();
    } catch (err) { toast(err.message, { tone: 'warn' }); btn.disabled = false; } } }, h('span.mi-ico', on ? '✓' : '○'), h('span', h('b', t.desc), h('small', `${t.date.split('-').reverse().join('/')} · ${t.cat}`)), h('b', money(t.value)));
  }));
  openSheet({ title: d.kind === 'couple' ? 'Trazer do meu financeiro pessoal' : 'O que compartilhar', subtitle: d.kind === 'couple' ? 'Escolha um lançamento. Só uma cópia resumida aparece para o casal; o original continua no seu financeiro pessoal.' : 'Toque para alternar. Só uma cópia resumida é compartilhada; o lançamento original continua no seu extrato pessoal.', content: tx.length ? list : h('div.empty', h('b', 'Nenhum lançamento pessoal encontrado.'), h('p', 'Adicione primeiro no seu ambiente Pessoal ou registre direto no Casal.')) });
}

function sharedRow(x, d, canEdit, showOwner = false) {
  const mine = x.user_id === d.membership.user_id, owner = d.members.find(m => m.user_id === x.user_id)?.display_name || (mine ? 'Você' : 'Pessoa');
  return h('div.family-shared-row' + (d.kind === 'couple' ? '.couple-row' : ''),
    h('span', h('b', x.description), h('small', `${x.date.split('-').reverse().join('/')} · ${x.category}${showOwner ? ` · ${owner}` : mine ? ' · você' : ''}`)),
    h('b', { class: x.type === 'income' ? 'in' : '' }, `${x.type === 'income' ? '+' : '−'} ${money(x.value)}`),
    mine && canEdit ? h('button.icon-btn', { title: 'Remover do compartilhado', onclick: async () => { try { await family.unshareTransaction(x.source_id); cache = (await family.getFamily()).data; reroute(); } catch (e) { toast(e.message, { tone: 'warn' }); } } }, '×') : null);
}

function coupleAutoCategory(desc, type) {
  const s = String(desc || '').toLowerCase();
  if (type === 'income') {
    if (/sal[aá]rio|pagamento|renda mensal|holerite/.test(s)) return 'Salários / rendas';
    if (/freela|extra|bico|comiss[aã]o/.test(s)) return 'Renda extra';
    if (/vr|va|vale|benef[ií]cio/.test(s)) return 'Benefícios';
    if (/reembolso|devolu/.test(s)) return 'Reembolso';
    if (/venda|vendi/.test(s)) return 'Venda';
    if (/rendimento|juros|dividendo/.test(s)) return 'Rendimentos';
    return 'Outras entradas';
  }
  if (/aluguel|condom[ií]nio|iptu|moradia/.test(s)) return 'Moradia';
  if (/mercado|supermercado|a[cç]ougue|hortifruti|padaria/.test(s)) return 'Mercado';
  if (/ifood|delivery|restaurante|lanche|pizza|jantar|almo[cç]o/.test(s)) return 'Alimentação / delivery';
  if (/luz|energia|enel|light/.test(s)) return 'Energia';
  if (/água|agua|cedae/.test(s)) return 'Água';
  if (/g[aá]s|botij[aã]o/.test(s)) return 'Gás';
  if (/internet|telefone|celular|vivo|claro|tim/.test(s)) return 'Internet e telefone';
  if (/uber|99|ônibus|onibus|passagem|transporte/.test(s)) return 'Transporte';
  if (/gasolina|etanol|combust[ií]vel|posto/.test(s)) return 'Combustível';
  if (/farm[aá]cia|m[eé]dico|consulta|exame|sa[uú]de/.test(s)) return 'Saúde';
  if (/escola|creche|filho|filha|fralda/.test(s)) return 'Filhos';
  if (/pet|ração|racao|veterin/.test(s)) return 'Pets';
  if (/cinema|show|bar|passeio|lazer/.test(s)) return 'Lazer a dois';
  if (/hotel|pousada|viagem|airbnb|passagem a[eé]rea/.test(s)) return 'Viagens';
  if (/netflix|spotify|prime|hbo|assinatura/.test(s)) return 'Assinaturas';
  if (/sof[aá]|m[oó]vel|eletro|casa|decora/.test(s)) return 'Compras para casa';
  if (/presente|anivers[aá]rio/.test(s)) return 'Presentes';
  if (/parcela|empr[eé]stimo|d[ií]vida|financiamento/.test(s)) return 'Dívidas do casal';
  if (/meta|objetivo|reserva|guardar/.test(s)) return 'Objetivos do casal';
  return 'Outros gastos';
}


function coupleCaptureOptions(d,canEdit) {
  return {
    draftKey:'couple',
    placeholder:'Ex.: mercado 120 ou + salário 2200',
    ariaLabel:'Anotar entrada ou gasto do casal',
    examples:'Exemplos: mercado 120 · luz 95 · + salário 2200 · jantar 80 ontem',
    title:'Anotar no casal',
    subtitle:'O Bivvo identifica entrada ou gasto, categoria e data. O lançamento fica somente no espaço do casal.',
    label:'Anotação rápida do casal',
    voicePrompt:'Ouvindo… ex.: "mercado cento e vinte" ou "recebi dois mil e duzentos"',
    parseFn:(text,{spoken=false}={})=>parseQuick(text,{cards:[],autoCategory:coupleAutoCategory,spoken}),
    categoriesFn:type=>type==='income'?COUPLE_INCOME_CATEGORIES:COUPLE_EXPENSE_CATEGORIES,
    cardsFn:()=>[],
    saveFn:async(p,{cat})=>{
      if(!canEdit)throw new Error('Seu acesso ao Casal está somente para leitura.');
      if (ctx.demo) {
        const row = demoSharedRow({ date:p.date, desc:p.desc, cat:cat||p.cat, type:p.type, value:p.value });
        demoCouple.shared.unshift(row); cache = demoCouple;
      } else {
        await family.shareTransaction({id:'couple-'+uid(),date:p.date,desc:p.desc,cat:cat||p.cat,type:p.type,value:p.value});
        cache=(await family.getFamily()).data;
      }
      toast(`${p.type==='income'?'Entrada':'Gasto'} do casal anotado: ${p.desc}, ${money(p.value)}`);
      rerender();
    },
    detailsFn:(p,c)=>addCoupleTransaction(p.type||'expense',{desc:p.desc||'',value:p.value,date:p.date||today(),cat:c.cat||p.cat}),
    scanFn:()=>startScan(null,{onResult:r=>addCoupleTransaction('expense',{desc:r?.merchant||'',value:r?.value??'',date:r?.date||today()})})
  };
}

export function openCoupleQuickAdd() {
  if (!cache || cache?.kind !== 'couple') { location.hash = '#/familia?couple=1'; return; }
  const me = cache.membership, canEdit = (me?.role === 'owner' || me?.role === 'editor') && cache.active;
  if (!canEdit) { toast('Seu acesso ao Casal está somente para leitura.', { tone: 'warn' }); return; }
  let sh;
  const choose = type => { sh.close(); setTimeout(() => addCoupleTransaction(type), 120); };
  sh = openSheet({
    title: 'Adicionar no casal', subtitle: 'Este lançamento ficará somente no espaço compartilhado dos dois.',
    content: h('div.couple-quick-add',
      h('button.couple-action.income', { type: 'button', onclick: () => choose('income') }, h('span', {'aria-hidden':'true'}, '＋'), h('div', h('b', 'Entrada conjunta'), h('small', 'Renda, benefício ou valor que pertence aos dois'))),
      h('button.couple-action.expense', { type: 'button', onclick: () => choose('expense') }, h('span', {'aria-hidden':'true'}, '−'), h('div', h('b', 'Gasto compartilhado'), h('small', 'Casa, mercado, lazer ou outro gasto do casal'))))
  });
}

function addCoupleTransaction(type, preset = {}) {
  const categories = type === 'income' ? COUPLE_INCOME_CATEGORIES : COUPLE_EXPENSE_CATEGORIES;
  const desc = h('input.input', { maxlength: 120, placeholder: type === 'income' ? 'Ex.: salário do mês' : 'Ex.: mercado da semana', value: preset.desc || '' });
  const value = h('input.input', { inputmode: 'decimal', placeholder: '0,00', value: preset.value != null ? String(preset.value).replace('.', ',') : '' });
  const date = h('input.input', { type: 'date', value: preset.date || today() });
  const cat = h('select.input', { 'aria-label': 'Categoria' }, categories.map(c => h('option', { value: c }, `${COUPLE_CAT_ICON[c] || '◉'} ${c}`)));
  cat.value = preset.cat && categories.includes(preset.cat) ? preset.cat : (preset.desc ? coupleAutoCategory(preset.desc, type) : (type === 'income' ? 'Salários / rendas' : 'Outros gastos'));
  let categoryTouched = false; cat.addEventListener('change', () => { categoryTouched = true; });
  desc.addEventListener('input', () => { if (!categoryTouched) cat.value = coupleAutoCategory(desc.value, type); });
  const msg = h('p.form-msg'); let busy = false;
  const sh = openSheet({
    title: type === 'income' ? 'Entrada do casal' : 'Gasto do casal',
    subtitle: type === 'income' ? 'Registre apenas o que faz parte da renda compartilhada.' : 'A pessoa que registrar fica identificada como quem pagou este gasto.',
    content: h('div.form', field('Descrição', desc), field('Valor', value), field('Categoria', cat), field('Data', date), msg),
    footer: [h('button.btn.primary', { onclick: async () => {
      if (busy) return; const amount = parseMoney(value.value);
      if (!desc.value.trim() || amount <= 0 || !date.value) { msg.textContent = 'Preencha descrição, valor e data.'; return; }
      busy = true;
      try {
        if (ctx.demo) {
          demoCouple.shared.unshift(demoSharedRow({ date:date.value, desc:desc.value.trim(), cat:cat.value, type, value:amount }));
          cache = demoCouple;
        } else {
          await family.shareTransaction({ id: 'couple-' + uid(), date: date.value, desc: desc.value.trim(), cat: cat.value, type, value: amount });
          cache = (await family.getFamily()).data;
        }
        sh.close(); reroute();
      }
      catch (e) { msg.textContent = e.message; busy = false; }
    } }, 'Salvar')]
  });
}
