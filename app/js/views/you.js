/* Bivvo — Você: progresso, compartilhar, dados, preferências e segurança. */
import { h, money, today, ymOf, monthLabel, num, VERSION, RELEASE_DATE, uid, parseMoney, round2, monthName } from '../util.js';
import * as store from '../store.js';
import * as F from '../finance.js';
import { ACHIEVEMENTS, unlockedAchievements } from '../insights.js';
import { openSheet, toast, confirmSheet, askSheet, sectionTitle, field } from '../ui.js';
import { stat } from './components.js';
import * as cloud from '../cloud.js';
import { ctx, go, leaveDemo } from '../nav.js';
import { openRetrospective, openStoryComposer, inviteFriend, openYearWrapped, wrappedDefaultYear } from './stories.js';
import { openInstallGuide, isPwaInstalled } from '../platform.js';
import { pushSupport, pushActive, enablePush, disablePush, readPrefs, savePrefs, sendTest } from '../push.js';
import { openSplitForm } from './split.js';
import { canUseFeature,getPlanInfo, getAiLevel, getRemainingUsage } from '../plans.js';
import { openProScreen } from './pro.js';
import {openHomePreferences} from './homeprefs.js';
import { openCategoryManager } from './categories.js';
import { adminTrack } from '../admin-analytics.js';
import { financeProfileSettings } from './finance-profiles.js';
import { mountTesterPlanSwitch } from '../tester-plan.js';
import { openLifeSchool } from './life-education.js';
import { openBusinessLesson } from './company-education.js';

const askMfa = () => askSheet({ title: 'Código do autenticador', label: 'Código de 6 dígitos', inputmode: 'numeric', autocomplete: 'one-time-code', pattern: /^\d{6}$/, confirmLabel: 'Verificar' });

export function renderYou(root) {
  const s = store.getState(), u = cloud.currentUser();
  const financeMode = document.body?.dataset?.financeProfile || store.activeFinanceProfile();
  const company = financeMode === 'company', couple = financeMode === 'couple';
  const environment = company ? 'Empresa' : couple ? 'Casal' : 'Pessoal';
  const name = s.profile.name || (u?.email ? u.email.split('@')[0] : 'Você');
  const plan = getPlanInfo();
  const page = h('div.you-overview');
  const item = (icon, title, sub, fn, cls = '') => h('button.menu-item' + (cls ? '.' + cls : ''), {
    type: 'button', onclick: async event => {
      try { await fn?.(event); }
      catch (error) { toast(error.message || 'Não foi possível concluir agora.', { tone: 'warn' }); }
    }
  }, h('span.mi-ico', { 'aria-hidden': 'true' }, icon),
  h('span.mi-copy', h('b', title), sub ? h('small', sub) : null),
  h('span.mi-chev', { 'aria-hidden': 'true' }, '›'));
  const menu = (title, content) => openSheet({ title, content: h('div.you-menu-sheet', content) });

  page.append(h('section.card.me.you-profile',
    h('span.avatar.lg', { 'aria-hidden': 'true' }, name.charAt(0).toUpperCase()),
    h('div.you-profile-copy', h('h2', name), h('p.muted.sm', ctx.demo ? 'Demonstração' : u?.email || 'Sua conta Bivvo')),
    h('button.link.sm', { type: 'button', onclick: editProfile, 'aria-label': 'Editar perfil' }, 'Editar')));

  page.append(h('section.card.you-environment',
    item(company ? '🏢' : couple ? '💑' : '👤', `Ambiente ${environment}`, 'Trocar entre Pessoal, Casal e Empresa',
      () => menu('Ambientes financeiros', financeProfileSettings()))));

  const preferences = () => {
    const current = store.getState();
    menu(company ? 'Preferências da empresa' : couple ? 'Configurações do Casal' : 'Preferências', [
      couple ? item('💑', 'Painel do Casal', 'Renda conjunta, gastos e divisão', () => go('familia', { couple: '1' })) : null,
      company ? item('🏢', 'Dados do negócio', current.profile.companyName || 'Nome e tipo da empresa', editCompanyProfile)
        : couple ? null : item('◫', 'Personalizar início', 'Escolha o que aparece primeiro', openHomePreferences),
      item('👤', 'Meu perfil', 'Nome, dia de receber e horas de trabalho', editProfile),
      company ? item('📊', 'Controle de custos', 'Limites por categoria', () => go('planos', { tab: 'orcamento' }))
        : couple ? null : item('🎯', 'Meta de guardar', `${current.savingPlan.percent}% da renda`, () => go('planos', { tab: 'orcamento' })),
      couple ? null : item('🔁', company ? 'Custos e receitas recorrentes' : 'Contas fixas', `${current.fixed.length} cadastrada(s)`, () => go('planos', { tab: 'fixas' })),
      item('◉', couple ? 'Categorias do casal' : company ? 'Categorias da empresa' : 'Categorias e ícones', 'Organize os tipos de gastos', couple ? openCoupleCategories : openCategoryManager),
      couple ? null : item('🔔', 'Avisos e lembretes', pushActive() ? 'Ativos neste aparelho' : 'Contas, faturas e lembretes', openNotifySettings),
      item('📱', 'Instalar Bivvo', isPwaInstalled() ? 'Já instalado neste aparelho' : 'Acesse direto pelo celular', () => openInstallGuide('auto', 'settings')),
      !company && !couple ? h('section.you-sheet-section', h('h3', 'Módulos opcionais'),
        moduleToggle('◈', 'Bivvo Capital', 'Mostrar gestão de empréstimos. Desligar mantém seus dados guardados.', store.loansEnabled(current), on => {
          if (on && !canUseFeature('loans')) { openProScreen({ source: 'loans' }); return; }
          store.commit(st => { st.profile.modules = { ...(st.profile.modules || {}), loans: on }; });
        })) : null
    ]);
  };

  const dataMenu = () => menu('Dados e backup', [
    item('⇣', 'Importar extrato', 'CSV, OFX ou Excel do seu banco', importFile),
    item('⇡', 'Exportar planilha (CSV)', 'Excel e Google Planilhas', exportCSV),
    item('🖨', 'Relatório do mês', 'Imprimir ou salvar em PDF', printReport),
    h('section.you-sheet-section', h('h3', 'Cópia dos seus dados'),
      item('💾', 'Backup completo', 'Salvar uma cópia em arquivo', exportJSON),
      item('♻', 'Restaurar backup', 'Substitui os dados atuais', restoreJSON))
  ]);

  const accountActions = () => menu('Ações da conta', h('section.you-account-actions',
    h('p.muted.sm', couple ? 'Zerar atua nos seus ambientes individuais. O espaço compartilhado do casal é separado e não é apagado por esta opção.' : 'Zerar apaga seus dados financeiros. Sua conta e seu login continuam ativos. Faça um backup antes se quiser guardar uma cópia.'),
    item('⚠', 'Zerar todos os dados', 'Apaga lançamentos e configurações financeiras', resetAll, 'danger-text'),
    ctx.demo ? null : item('⎋', 'Excluir minha conta', 'Exclusão permanente da conta', deleteAccount, 'danger-text')));

  const security = () => {
    const mfaLabel = h('small', 'Verificando…');
    if (!ctx.demo) cloud.mfaStatus().then(on => { mfaLabel.textContent = on ? 'Ativada' : 'Adicione um código extra ao entrar'; }).catch(() => { mfaLabel.textContent = 'Consultar configuração'; });
    menu('Segurança e privacidade', [
      item('⚙', 'Revisar permissões', 'Medição de campanhas e permissões de IA', () => window.bivvoPrivacy?.open()),
      couple ? item('🔒', 'Privacidade entre vocês', 'Veja o que é compartilhado', openCouplePrivacy) : null,
      ctx.demo ? null : item('🔑', 'Trocar senha', 'Confirmação pelo seu e-mail', changePassword),
      ctx.demo ? null : h('button.menu-item', { type: 'button', onclick: setupMfa }, h('span.mi-ico', { 'aria-hidden': 'true' }, '🛡'), h('span.mi-copy', h('b', 'Verificação em duas etapas'), mfaLabel), h('span.mi-chev', { 'aria-hidden': 'true' }, '›')),
      ctx.demo ? null : item('↪', 'Sair deste aparelho', null, async () => { await cloud.signOut('local'); }),
      ctx.demo ? null : item('⎋', 'Sair de todos os aparelhos', null, async () => {
        if (await confirmSheet({ title: 'Sair de todos os aparelhos?', message: 'Todas as sessões abertas serão encerradas.', confirmLabel: 'Sair de todos' })) await cloud.signOut('global');
      }),
      h('section.you-sheet-section', item('⚠', 'Ações da conta', 'Zerar dados ou excluir a conta', accountActions))
    ]);
  };

  const tools = () => menu('Ferramentas e compartilhar', [
    couple ? item('💑', 'Painel do Casal', 'Abra o espaço compartilhado', () => go('familia', { couple: '1' }))
      : item('⌂', 'Espaço Família', 'Compartilhe só o que escolher', () => go('familia')),
    item('➗', 'Dividir uma conta', 'Calcule e compartilhe a parte de cada um', () => openSplitForm()),
    company ? item('🎓', 'Guia da empresa', 'Separar finanças pessoais e empresariais', () => openBusinessLesson('pfPj'))
      : item('🎓', couple ? 'Escola financeira do casal' : 'Escola financeira', 'Aprenda no seu ritmo', () => openLifeSchool(financeMode)),
    !couple ? h('section.you-sheet-section', h('h3', 'Compartilhar'),
      item('✦', 'Meu número de hoje', 'Sem expor saldo ou dívidas', () => openStoryComposer({ template: 'spendable', source: 'you' })),
      item('▶', 'Meu mês em 15 segundos', `Retrospectiva de ${monthName(ymOf(today()))}`, () => openRetrospective(ymOf(today()))),
      item('◫', 'Bivvo Wrapped & Stories', 'Sua evolução em imagens', () => openStoryComposer({})),
      item('✦', `Retrospectiva de ${wrappedDefaultYear()}`, 'Seu ano em slides', () => openYearWrapped())) : null,
    item('✉', 'Indique e ganhe Pro', 'Confira seu convite e benefícios', () => inviteFriend()),
    document.querySelector('#adminNav')?.hidden === false ? item('▥', 'Administração', 'Indicadores e gestão do aplicativo', () => go('admin')) : null
  ]);

  const progress = () => {
    const current = store.getState(), ps = F.positiveStreak(current);
    const unlocked = new Set(unlockedAchievements(current).map(a => a.id));
    menu(company ? 'Desempenho da empresa' : 'Seu progresso', [
      h('div.stats', stat(company ? 'Meses com resultado positivo' : 'Meses no positivo', String(ps.months), ps.liveThisMonth ? 'este mês também, até agora' : null, ps.months ? 'in' : ''),
        stat(company ? 'Revisões seguidas' : 'Check-ins seguidos', String(F.checkinStreak(current))), stat(company ? 'Dias com lançamentos' : 'Dias anotando', String(F.loggingStreak(current)))),
      h('section.you-sheet-section', h('h3', 'Conquistas'), h('div.badges', ACHIEVEMENTS.map(a => h('div.badge-a' + (unlocked.has(a.id) ? '.on' : ''), { title: a.text },
        h('span', { 'aria-hidden': 'true' }, a.icon), h('b', a.title), h('small', unlocked.has(a.id) ? a.text : 'Ainda não')))))
    ]);
  };

  const subscription = () => {
    const currentPlan = getPlanInfo(), scan = getRemainingUsage('scan'), ai = getRemainingUsage('ai');
    const testerPlanHost = h('div.tester-plan-host');
    menu('Assinatura Bivvo', [
      h('section.you-plan-detail', h('small.muted', 'Seu plano'), h('h3', currentPlan.name),
        h('p.muted.sm', ctx.demo ? 'Demonstração' : currentPlan.plan === 'free' ? `Perguntas rápidas locais · até ${scan.limit === Infinity ? '∞' : scan.limit} scanners` : `${getAiLevel().label} · ${ai.used}/${ai.limit === Infinity ? '∞' : ai.limit} perguntas IA · ${scan.used}/${scan.limit === Infinity ? '∞' : scan.limit} scanners`)),
      item('✦', currentPlan.plan === 'free' ? 'Conhecer planos' : 'Ver assinatura', 'Planos, limites e benefícios', () => openProScreen({ source: 'voce' })),
      testerPlanHost
    ]);
    if (!ctx.demo) mountTesterPlanSwitch(testerPlanHost);
  };

  page.append(h('section.card.menu.you-settings', sectionTitle('Configurações'),
    item('⚙', 'Preferências', company ? 'Dados do negócio e organização' : couple ? 'Perfil e categorias do casal' : 'Início, categorias e lembretes', preferences),
    couple ? null : item('💾', 'Dados e backup', 'Importar, exportar e guardar uma cópia', dataMenu),
    item('🔒', 'Segurança e privacidade', 'Permissões e acesso à conta', security)));
  page.append(h('section.card.menu.you-more', sectionTitle('Mais no Bivvo'),
    item('✦', 'Órbita de aprendizado', 'Meu objetivo, missões e evolução', () => go('aprender', couple ? {finance:'couple'} : {})),
    item('◫', 'Ferramentas e compartilhar', 'Família, divisão de contas e histórias', tools),
    couple ? null : item('✧', company ? 'Desempenho da empresa' : 'Seu progresso', 'Hábitos e conquistas', progress),
    item('✦', 'Assinatura', `Plano ${plan.name}`, subscription)));

  if (ctx.demo) page.append(h('div.you-demo-actions',
    h('button.btn.primary.sm', { type: 'button', onclick: () => leaveDemo(true) }, 'Criar minha conta'),
    h('button.link.sm', { type: 'button', onclick: () => leaveDemo(false) }, 'Sair da demonstração')));
  page.append(h('p.version', `Bivvo v${VERSION} · ${RELEASE_DATE}`));
  root.append(page);
}

/* ---------------- perfil ---------------- */
function editProfile() {
  const s = store.getState();
  const name = h('input.input', { value: s.profile.name || '', maxLength: 30, autocomplete: 'given-name' });
  const day = h('input.input', { type: 'number', inputmode: 'numeric', min: 1, max: 31, value: s.profile.incomeDay || '' });
  const hours = h('input.input', { type: 'number', inputmode: 'numeric', min: 20, max: 400, value: s.profile.hoursPerMonth || 176 });
  const sheet = openSheet({ title: 'Seu perfil', content: [field('Como te chamamos', name), field('Dia em que costuma receber', day, 'Define até quando vai o "livre para gastar hoje".'), field('Horas trabalhadas por mês', hours, 'Usado para mostrar quanto tempo de trabalho um gasto representa. 176 h = 8 h × 22 dias.')],
    footer: [h('button.btn.primary', { type: 'button', onclick: () => { store.commit(st => { st.profile.name = name.value.trim().slice(0, 30); const d = Math.floor(num(day.value)); st.profile.incomeDay = d >= 1 && d <= 31 ? d : null; const hr = Math.floor(num(hours.value)); st.profile.hoursPerMonth = hr >= 20 ? hr : 176; }); sheet.close(); toast('Perfil salvo'); } }, 'Salvar')] });
}


function openCoupleCategories(){
  const expense=['🏠 Moradia','🛒 Mercado','🍽️ Alimentação / delivery','💧 Água','⚡ Energia','🔥 Gás','📶 Internet e telefone','🚗 Transporte','⛽ Combustível','❤️ Saúde','🧒 Filhos','🐾 Pets','🎬 Lazer a dois','✈️ Viagens','▶️ Assinaturas','🛋️ Compras para casa','🎁 Presentes','🧾 Dívidas do casal','🎯 Objetivos do casal','◉ Outros gastos'];
  const income=['💼 Salários / rendas','✨ Renda extra','🎫 Benefícios','↩️ Reembolso','🏷️ Venda','📈 Rendimentos','＋ Outras entradas'];
  openSheet({title:'Categorias do Casal',subtitle:'Essas categorias aparecem somente ao registrar diretamente no ambiente Casal.',content:h('div.form',h('div',h('b','Gastos compartilhados'),h('p.muted.sm',expense.join(' · '))),h('div',h('b','Entradas compartilhadas'),h('p.muted.sm',income.join(' · '))))});
}
function openCouplePrivacy(){
  openSheet({title:'Privacidade no Bivvo Casal',subtitle:'Compartilhar o espaço não libera seu financeiro inteiro.',content:h('div.form',
    h('p',h('b','O casal vê:'),' somente lançamentos registrados diretamente no Casal ou que você escolher trazer do seu ambiente pessoal.'),
    h('p',h('b','O casal não vê automaticamente:'),' saldo pessoal, cartões, dívidas, empréstimos, metas, investimentos, Empresa ou outros lançamentos individuais.'),
    h('p.muted.sm','Ao trazer um lançamento pessoal, o Bivvo envia apenas uma cópia resumida para o espaço do casal. O original continua no seu financeiro pessoal.'))});
}

function editCompanyProfile(){
  const s=store.getState();
  const name=h('input.input',{value:s.profile.companyName||'',maxLength:60,autocomplete:'organization',placeholder:'Ex.: Borsatto Serviços'});
  const type=h('select.input',{ariaLabel:'Tipo do negócio'},['MEI','Microempresa (ME)','EPP','Autônomo / profissional','Outro'].map(v=>h('option',{value:v},v)));type.value=s.profile.companyType||'MEI';
  const target=h('input.input',{type:'text',inputmode:'decimal',value:s.profile.companyRevenueTarget?money(s.profile.companyRevenueTarget).replace('R$','').trim():'',placeholder:'Opcional'});
  const sheet=openSheet({title:'Dados do negócio',subtitle:'Essas informações aparecem somente no ambiente Empresa.',content:[field('Nome da empresa / negócio',name),field('Tipo do negócio',type),field('Meta de faturamento mensal',target,'Opcional. Ajuda a comparar o faturamento do mês com a meta do negócio.')],footer:[h('button.btn.primary',{type:'button',onclick:()=>{store.commit(st=>{st.profile.companyName=name.value.trim().slice(0,60);st.profile.companyType=type.value;st.profile.companyRevenueTarget=Math.max(0,parseMoney(target.value));});sheet.close();toast('Dados da empresa salvos');}},'Salvar')]});
}

/* ---------------- importação ---------------- */
function importFile() {
  const input = h('input', { type: 'file', accept: '.csv,.ofx,.xlsx,.xls,.txt' });
  input.addEventListener('change', async () => {
    const file = input.files?.[0]; if (!file) return;
    adminTrack('import_started','voce').catch(()=>{});
    if (file.size > 5 * 1024 * 1024) return toast('Arquivo maior que 5 MB.');
    try {
      let rows = [];
      const n = file.name.toLowerCase();
      if (n.endsWith('.xlsx') || n.endsWith('.xls')) rows = await readXlsx(file);
      else { const text = await file.text(); rows = n.endsWith('.ofx') || /<OFX>|<STMTTRN>/i.test(text) ? parseOFX(text) : parseCSV(text); }
      const items = rows.map(normalizeImported).filter(Boolean);
      if (!items.length) return toast('Não encontramos lançamentos nesse arquivo.');
      const s = store.getState();
      const key = t => `${t.date}|${t.value.toFixed(2)}|${t.type}|${t.desc.toLowerCase()}`;
      const existing = new Set(s.transactions.map(key));
      const fresh = items.filter(t => !existing.has(key(t)));
      const sample = fresh.slice(0, 8).map(t => `${t.date.split('-').reverse().join('/')} · ${t.desc} · ${t.cat}`).join('\n');
      const ok = await confirmSheet({ title: `Prévia · ${fresh.length} novo(s)`, message: `${items.length} encontrados${items.length-fresh.length?` · ${items.length-fresh.length} duplicado(s) ignorado(s)`:''}.\n\n${sample}${fresh.length>8?'\n… e mais '+(fresh.length-8):''}\n\nConfira a prévia antes de importar.`, confirmLabel: 'Confirmar importação' });
      if (!ok || !fresh.length) return;
      store.commit(st => { st.transactions.push(...fresh); });
      toast(`${fresh.length} lançamento(s) importado(s)`); adminTrack('import_completed','voce').catch(()=>{});
    } catch (e) { adminTrack('import_failed','voce').catch(()=>{}); toast('Não foi possível ler o arquivo: ' + (e.message || e)); }
  });
  input.click();
}
function splitCSVLine(line, sep) { const out = []; let cur = '', q = false; for (let i = 0; i < line.length; i++) { const c = line[i]; if (c === '"') { if (q && line[i + 1] === '"') { cur += '"'; i++; } else q = !q; } else if (c === sep && !q) { out.push(cur); cur = ''; } else cur += c; } out.push(cur); return out.map(x => x.trim()); }
function parseCSV(text) {
  const lines = text.replace(/^\uFEFF/, '').split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) return [];
  const sep = (lines[0].match(/;/g) || []).length >= (lines[0].match(/,/g) || []).length ? ';' : ',';
  const head = splitCSVLine(lines[0], sep).map(x => x.toLowerCase());
  return lines.slice(1).map(l => { const c = splitCSVLine(l, sep), o = {}; head.forEach((k, i) => { o[k] = c[i] ?? ''; }); return o; });
}
function parseOFX(text) {
  const out = []; const re = /<STMTTRN>([\s\S]*?)(<\/STMTTRN>|(?=<STMTTRN>)|<\/BANKTRANLIST>)/gi; let m;
  const tag = (b, t) => { const r = new RegExp('<' + t + '>([^<\\r\\n]*)', 'i').exec(b); return r ? r[1].trim() : ''; };
  while ((m = re.exec(text))) { const b = m[1], d = tag(b, 'DTPOSTED'); out.push({ data: d ? `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}` : '', descricao: tag(b, 'MEMO') || tag(b, 'NAME') || 'Lançamento importado', valor: tag(b, 'TRNAMT') }); }
  return out;
}
async function readXlsx(file) {
  if (!window.XLSX) await new Promise((res, rej) => { const sc = document.createElement('script'); sc.src = 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js'; sc.onload = res; sc.onerror = () => rej(new Error('leitor de Excel indisponível')); document.head.append(sc); });
  const wb = window.XLSX.read(await file.arrayBuffer(), { type: 'array', cellDates: true });
  return window.XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: '', raw: false }).map(r => Object.fromEntries(Object.entries(r).map(([k, v]) => [k.toLowerCase(), v])));
}
function toISODate(v) {
  const s = String(v || '').trim();
  let m = s.match(/^(\d{4})-(\d{2})-(\d{2})/); if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})/); if (m) { const y = m[3].length === 2 ? '20' + m[3] : m[3]; return `${y}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`; }
  return null;
}
function normalizeImported(o) {
  const pick = (...keys) => { for (const k of keys) if (o[k] !== undefined && o[k] !== '') return o[k]; return ''; };
  const date = toISODate(pick('date', 'data', 'data lançamento', 'data de lançamento', 'dt'));
  if (!date) return null;
  const desc = String(pick('desc', 'descricao', 'descrição', 'description', 'histórico', 'historico', 'título', 'titulo', 'estabelecimento') || 'Lançamento importado').slice(0, 120);
  let value = parseMoney(pick('value', 'valor', 'amount', 'quantia', 'valor (r$)'));
  if (!value) return null;
  const typeRaw = String(pick('type', 'tipo')).toLowerCase();
  const type = /entrada|receita|income|cr[eé]dito$/.test(typeRaw) ? 'income' : /sa[ií]da|despesa|expense|d[eé]bito$/.test(typeRaw) ? 'expense' : value < 0 ? 'expense' : 'income';
  value = round2(Math.abs(value));
  return { id: uid(), date, desc, type, value, cat: store.autoCategory(desc, type) || (store.activeFinanceProfile()==='company'?(type==='income'?'Outras receitas':'Outras despesas'):'Outros'), status: 'Pago', method: 'Outro', note: 'Importado', createdAt: Date.now() };
}

/* ---------------- exportação ---------------- */
const csvCell = v => { let s = String(v ?? ''); if (/^[=+\-@\t\r]/.test(s)) s = "'" + s; return /[;"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
function exportCSV() {
  const s = store.getState();
  const rows = [['Data', 'Descrição', 'Categoria', 'Tipo', 'Valor', 'Situação', 'Forma', 'Cartão', 'Parcela', 'Fatura']];
  for (const t of s.transactions.slice().sort((a, b) => a.date.localeCompare(b.date))) rows.push([t.date.split('-').reverse().join('/'), t.desc, t.cat, t.type === 'income' ? 'Entrada' : 'Saída', t.value.toFixed(2).replace('.', ','), t.status, t.method, t.card || '', t.installment || '', t.method === 'Crédito' ? F.txInvoice(t) : '']);
  download('\uFEFF' + rows.map(r => r.map(csvCell).join(';')).join('\r\n'), `bivvo-lancamentos-${today()}.csv`, 'text/csv;charset=utf-8');
  toast('Planilha exportada');
}
async function exportJSON() {
  if (!(await confirmSheet({ title: 'Gerar backup?', message: 'O arquivo contém suas informações financeiras. Guarde-o em local seguro e não envie para outras pessoas.', confirmLabel: 'Gerar backup' }))) return;
  const data = { app: 'Bivvo', version: VERSION, exportedAt: new Date().toISOString(), payload: store.serialize() };
  download(JSON.stringify(data, null, 1), `bivvo-backup-${today()}.json`, 'application/json');
  if (!ctx.demo) cloud.securityLog('export_json');
}
function restoreJSON() {
  const input = h('input', { type: 'file', accept: '.json,application/json' });
  input.addEventListener('change', async () => {
    const file = input.files?.[0]; if (!file) return;
    try {
      const raw = JSON.parse(await file.text());
      const payload = raw && raw.payload && typeof raw.payload === 'object' ? raw.payload : raw;
      if (!payload || typeof payload !== 'object' || !Array.isArray(payload.transactions)) throw new Error('arquivo não parece um backup do Bivvo');
      const m = store.migrate(payload);
      if (!(await confirmSheet({ title: 'Restaurar backup?', message: `${m.transactions.length} lançamentos, ${m.cards.length} cartões e ${m.goals.length} metas vão substituir os dados atuais.`, confirmLabel: 'Restaurar', danger: true }))) return;
      store.commit(s => { const profile = s.profile; Object.keys(s).forEach(k => delete s[k]); Object.assign(s, m, { profile: { ...m.profile, onboarded: true }, resetAt: undefined }); if (!m.profile.name && profile.name) s.profile.name = profile.name; });
      toast('Backup restaurado');
    } catch (e) { toast('Não foi possível restaurar: ' + e.message); }
  });
  input.click();
}
function download(content, name, type) { const url = URL.createObjectURL(new Blob([content], { type })); const a = h('a', { href: url, download: name }); document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 4000); }

function printReport() {
  const s = store.getState(), company=store.activeFinanceProfile()==='company', ym = ctx.month || ymOf(today()), sm = F.monthSummary(ym, s);
  const host = document.getElementById('print'); host.replaceChildren();
  const rows = F.monthTx(ym, s).slice().sort((a, b) => a.date.localeCompare(b.date));
  host.append(h('h1', `Bivvo${company?' Empresa':''} · Relatório de ${monthLabel(ym)}`),
    h('p', company?`Receitas ${money(sm.income)} · Despesas ${money(sm.spend)} · Resultado ${money(sm.result)}`:`Entradas ${money(sm.income)} · Gastos ${money(sm.spend)} · Guardado ${money(sm.saved)} · Resultado ${money(sm.result)}`),
    h('h2', company?'Despesas por categoria':'Gastos por categoria'), h('table', h('tbody', sm.cats.map(c => h('tr', h('td', c.cat), h('td', money(c.value)), h('td', Math.round(c.share * 100) + '%'))))),
    h('h2', 'Lançamentos'), h('table', h('thead', h('tr', ['Data', 'Descrição', 'Categoria', 'Valor', 'Situação'].map(x => h('th', x)))),
      h('tbody', rows.map(t => h('tr', h('td', t.date.split('-').reverse().join('/')), h('td', t.desc), h('td', t.cat), h('td', (t.type === 'income' ? '+' : '−') + money(t.value)), h('td', t.status))))),
    h('p.small', `Gerado em ${new Date().toLocaleString('pt-BR')} · Bivvo v${VERSION}`));
  window.print();
}

/* ---------------- segurança ---------------- */
async function changePassword() {
  const p = await askSheet({ title: 'Nova senha', label: 'Nova senha (mínimo 10 caracteres)', type: 'password', autocomplete: 'new-password', pattern: /^.{10,}$/ });
  if (!p) return;
  try { await cloud.changePassword(p, () => askSheet({ title: 'Confirme pelo e-mail', message: 'Enviamos um código de 6 dígitos para o seu e-mail.', label: 'Código', inputmode: 'numeric', autocomplete: 'one-time-code', pattern: /^\d{6}$/ })); toast('Senha atualizada'); }
  catch (e) { toast(cloud.friendlyAuthError(e), { tone: 'warn' }); }
}
async function setupMfa() {
  try {
    if (await cloud.mfaStatus()) return toast('A verificação em duas etapas já está ativa nesta conta.');
    const { factorId, qr } = await cloud.enrollMfa();
    const code = h('input.input', { inputmode: 'numeric', autocomplete: 'one-time-code', placeholder: '000000', maxLength: 6 });
    const msg = h('p.form-msg');
    const sheet = openSheet({ title: 'Ativar verificação em duas etapas', subtitle: 'Escaneie o código com Google Authenticator, Authy ou 1Password e digite o código gerado.',
      content: [qr ? h('img.qr', { src: qr, alt: 'QR Code para o aplicativo autenticador', width: 200, height: 200 }) : null, field('Código de 6 dígitos', code), msg],
      footer: [h('button.btn.primary', { type: 'button', onclick: async () => { if (!/^\d{6}$/.test(code.value.trim())) { msg.textContent = 'Digite os 6 números.'; return; } try { await cloud.verifyMfaEnroll(factorId, code.value.trim()); sheet.close(); toast('Verificação em duas etapas ativada'); go('voce'); } catch (e) { msg.textContent = cloud.friendlyAuthError(e); } } }, 'Ativar')] });
  } catch (e) { toast(cloud.friendlyAuthError(e), { tone: 'warn' }); }
}
async function deleteAccount() {
  // Feedback imediato: se o clique chegou aqui, o usuário sempre vê uma resposta.
  toast('Abrindo confirmação para excluir a conta…');
  let confirmed = false;
  try {
    confirmed = await confirmSheet({ title: 'Excluir conta definitivamente?', message: 'Sua conta e todos os dados financeiros serão apagados para sempre. Esta ação não pode ser desfeita. Digite EXCLUIR no campo abaixo para liberar o botão.', confirmLabel: 'Continuar', danger: true, requireText: 'EXCLUIR' });
  } catch (e) {
    console.error('Falha ao abrir confirmação de exclusão:', e);
    toast('Não foi possível abrir a confirmação. Atualize o Bivvo e tente novamente.', { tone: 'warn' });
    return;
  }
  if (!confirmed) return;
  const pass = await askSheet({ title: 'Confirme sua senha', label: 'Senha', type: 'password', autocomplete: 'current-password' });
  if (!pass) return;
  try {
    await cloud.deleteAccount(pass, askMfa);
    toast('Conta excluída definitivamente.');
    // Não deixe a tela da conta antiga visível enquanto o evento SIGNED_OUT
    // termina de propagar pelo app.
    setTimeout(() => { location.href = location.origin + location.pathname; }, 350);
  } catch (e) {
    const message = cloud.friendlyAuthError(e);
    toast(message, { tone: 'warn' });
    console.warn('Falha ao excluir conta:', e);
  }
}
async function resetAll() {
  if (!(await confirmSheet({ title: 'Zerar todos os dados?', message: 'Lançamentos, cartões, parcelas, contas fixas, orçamento, metas, investimentos e desafios serão apagados aqui e na nuvem. Sua conta continua ativa. Se quiser guardar uma cópia, faça um backup antes.', confirmLabel: 'Zerar tudo', danger: true, requireText: 'ZERAR' }))) return;
  try {
    if (ctx.demo) store.load(store.emptyState({ ...store.getState().profile }), { demo: true });
    else await cloud.resetAllData();
    toast('Todos os dados foram apagados.');
    go('inicio');
  } catch (e) { toast('A limpeza não foi concluída: ' + (e.message || e), { tone: 'warn' }); }
}

/* ---------------- módulos opcionais ---------------- */
function moduleToggle(icon, title, sub, on, onChange) {
  const input = h('input', { type: 'checkbox', role: 'switch', checked: !!on, 'aria-label': title });
  input.addEventListener('change', () => { onChange(input.checked); toast(input.checked ? `${title} ligado` : `${title} desligado. Seus dados continuam guardados.`); });
  return h('label.menu-item.toggle-row', h('span.mi-ico', { 'aria-hidden': 'true' }, icon), h('span', h('b', title), h('small', sub)), h('span.toggle.inline', input, h('i', { 'aria-hidden': 'true' })));
}

/* ---------------- avisos e lembretes ---------------- */
function openNotifySettings() {
  const s = store.getState();
  const sup = pushSupport();
  const sw = (label, hint, checked) => { const input = h('input', { type: 'checkbox', role: 'switch', checked: !!checked }); const el = h('label.toggle', h('span', h('b', label), hint ? h('small', hint) : null), input, h('i', { 'aria-hidden': 'true' })); el.input = input; return el; };
  const evening = sw('Perguntar ao abrir à noite', 'Se nada foi anotado no dia, a partir das 18h o Bivvo pergunta uma vez.', s.profile.eveningCapture !== false);
  evening.input.addEventListener('change', () => store.commit(st => { st.profile.eveningCapture = evening.input.checked; }));
  const hours = h('select.input', { 'aria-label': 'Horário do lembrete' }, Array.from({ length: 24 }, (_, i) => h('option', { value: i }, `${String(i).padStart(2, '0')}:00`)));
  hours.value = '20';
  const values = sw('Mostrar valores nos avisos', 'Privacidade: desligado, a tela bloqueada mostra apenas alertas discretos. Ligado, pode mostrar limite diário e valores.', false);
  const status = h('p.form-msg', { role: 'status' });
  const pushBox = h('div.notify-push');
  const paintPush = () => {
    pushBox.replaceChildren();
    if (ctx.demo) { pushBox.append(h('p.muted.sm', 'Na demonstração os avisos ficam desligados. Crie sua conta para receber.')); return; }
    if (!sup.ok && !sup.needsInstall) { pushBox.append(h('p.muted.sm', 'Este navegador não recebe avisos. No celular, use o Bivvo instalado na tela inicial.')); return; }
    if (sup.needsInstall) { pushBox.append(h('p.muted.sm', 'No iPhone, os avisos só funcionam com o Bivvo instalado na Tela de Início (iOS 16.4 ou mais novo).'), h('button.btn.primary.block', { type: 'button', onclick: () => openInstallGuide('ios') }, 'Ver como instalar')); return; }
    const active = pushActive();
    pushBox.append(
      h('div.row2', h('label.field', h('span', 'Horário do lembrete'), hours)), values,
      active
        ? h('div.btn-row', h('button.btn', { type: 'button', onclick: test }, 'Enviar teste'), h('button.btn.ghost.danger-text', { type: 'button', onclick: off }, 'Desligar avisos'))
        : h('button.btn.primary.block', { type: 'button', onclick: on }, 'Ativar avisos neste aparelho'));
  };
  async function on() { status.textContent = 'Ativando…'; try { await enablePush({ hour: Number(hours.value), showValues: values.input.checked }); status.textContent = ''; toast('Avisos ativados'); paintPush(); } catch (e) { status.textContent = e.message; } }
  async function off() { try { await disablePush(); toast('Avisos desligados neste aparelho'); paintPush(); } catch (e) { status.textContent = e.message; } }
  async function test() { status.textContent = 'Enviando…'; try { await sendTest(); status.textContent = 'Teste enviado. Deve chegar em alguns segundos.'; } catch (e) { status.textContent = e.message; } }
  const persist = () => { if (pushActive()) savePrefs({ hour: Number(hours.value), showValues: values.input.checked }).then(() => toast('Preferência salva')).catch(e => { status.textContent = e.message; }); };
  hours.addEventListener('change', persist); values.input.addEventListener('change', persist);
  if (!ctx.demo && cloud.currentUser()) readPrefs().then(p => { if (p) { hours.value = String(p.hour ?? 20); values.input.checked = !!p.show_values; } }).catch(() => {});
  paintPush();
  openSheet({
    title: 'Bivvo em segundo plano', subtitle: 'Avisos inteligentes no iPhone e Android: risco de faltar dinheiro, contas e faturas, cartão, limite do dia e progresso — com prioridade para o que realmente importa.',
    content: h('div.form', h('p.sub-title', 'No celular, mesmo com o app fechado'), h('p.muted.sm', sup.android ? 'No Android, o Bivvo pode mostrar avisos mesmo fechado, usar vibração do sistema, aparecer na tela bloqueada e atualizar o selo do ícone quando o aparelho permitir.' : 'No iPhone, o Bivvo instalado na Tela de Início pode mostrar avisos na Tela Bloqueada, Central de Notificações e atualizar o selo do ícone.'), pushBox, status, h('p.sub-title', 'Dentro do app'), evening)
  });
}
