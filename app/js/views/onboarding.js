/* Bivvo 8.19.3 — ativação rápida: renda → saldo → próximas contas → primeiro valor. */
import { h, today, ymOf, uid, money, num, haptic, addMonthsYM } from '../util.js';
import * as store from '../store.js';
import * as F from '../finance.js';
import { trackOnce } from '../analytics.js';
import { adminTrack } from '../admin-analytics.js';
import { openSheet, toast } from '../ui.js';
import { moneyInput } from './forms.js';
import { enterDemo, go } from '../nav.js';
import { learningGoal } from '../learning.js';

const BILLS = [
  { name: 'Aluguel', icon: '🏠', cat: 'Moradia' }, { name: 'Condomínio', icon: '🏢', cat: 'Moradia' }, { name: 'Luz', icon: '💡', cat: 'Energia' },
  { name: 'Água', icon: '🚿', cat: 'Água' }, { name: 'Internet', icon: '📶', cat: 'Internet' }, { name: 'Celular', icon: '📱', cat: 'Telefone' },
  { name: 'Academia', icon: '🏋️', cat: 'Academia' }, { name: 'Escola/Faculdade', icon: '📚', cat: 'Educação' }, { name: 'Financiamento', icon: '🚗', cat: 'Dívidas e empréstimos' }
];

const onceAdmin = (key, event, route = 'activation') => {
  try { if (localStorage.getItem(key)) return; localStorage.setItem(key, '1'); } catch { /* continua */ }
  adminTrack(event, route).catch(()=>{});
};

export function startOnboarding({ onDemo, skipLearningGoal=false } = {}) {
  if(!skipLearningGoal&&!learningGoal(store.getState(),'personal')){
    import('./learning.js').then(m=>m.openLearningGoal({space:'personal',onChosen:()=>startOnboarding({onDemo,skipLearningGoal:true})}));
    return;
  }
  const current = store.getState();
  const fixedIncome = current.fixed.find(x => x.type === 'income');
  const data = {
    income: Number(fixedIncome?.value || 0),
    day: Number(current.profile?.incomeDay || fixedIncome?.due || 0),
    balance: F.hasBalanceBase(current) ? Math.max(0, F.balance(current)) : null,
    bills: {},
    save: current.profile?.onboarded ? Number(current.savingPlan?.percent || 0) : 0
  };
  let completed = false;
  adminTrack('onboarding_started','onboarding').catch(()=>{});
  onceAdmin('bivvo_activation_started_8193','activation_started');

  const body = h('div.onb.onb-fast');
  const dots = h('div.onb-dots', [0, 1, 2, 3].map(() => h('i')));
  let step = 0;
  const sheet = openSheet({
    label: 'Configuração rápida', full: true, content: [dots, body],
    onClose: () => {
      if (completed) return;
      store.commit(s => { s.profile.onboardingDeferred = true; }, { reason: 'onboarding-deferred' });
      adminTrack('onboarding_abandoned','onboarding').catch(()=>{});
    }
  });

  const trackStep = name => adminTrack('onboarding_step_completed','onboarding',{ content:name }).catch(()=>{});
  const next = (name) => { if (name) trackStep(name); step++; haptic(6); paint(); };
  const paint = () => {
    [...dots.children].forEach((d, i) => d.classList.toggle('on', i <= step));
    body.replaceChildren(...[sIncome, sBalance, sBills, sResult][step]());
    body.querySelector('input')?.focus({ preventScroll: true });
  };

  function title(stepNo, headline, text) {
    return [
      h('div.onb-fast-head', h('small.eyebrow-soft', `${stepNo} · LEVA CERCA DE 1 MINUTO`), h('h2', headline), h('p.muted', text))
    ];
  }

  function sIncome() {
    const inc = moneyInput(data.income || null, { big: true, label: 'Renda mensal' });
    const day = h('input.input', { type: 'number', inputmode: 'numeric', min: 1, max: 31, placeholder: 'Ex.: 5', value: data.day || '' });
    const msg = h('p.form-msg');
    return [...title('1/3', 'Quanto entra e quando?', 'Comece só pelo essencial. Isso define até quando o Bivvo precisa fazer seu dinheiro durar.'),
      h('div.amount-wrap', h('span.cur', 'R$'), inc),
      h('label.field', h('span', 'Dia em que costuma receber'), day),
      h('p.onb-promise', '🔒 Valores financeiros ficam no seu Bivvo e não entram nas métricas do Growth Center.'), msg,
      h('div.btn-row',
        h('button.btn.ghost', { type:'button', onclick:()=>{ sheet.close(); (onDemo || enterDemo)(); } }, 'Ver demonstração'),
        h('button.btn.primary', { type: 'button', onclick: () => {
          const income = inc.getValue(), payday = Math.floor(num(day.value));
          if (!(income > 0)) { msg.textContent = 'Informe quanto costuma entrar por mês.'; inc.focus(); return; }
          if (!(payday >= 1 && payday <= 31)) { msg.textContent = 'Informe o dia em que costuma receber.'; day.focus(); return; }
          data.income = income; data.day = payday;
          adminTrack('income_added','activation').catch(()=>{});
          next('income');
        } }, 'Continuar'))];
  }

  function sBalance() {
    const bal = moneyInput(data.balance, { big: true, label: 'Saldo de hoje' });
    const msg = h('p.form-msg');
    return [...title('2/3', 'Quanto você tem hoje?', 'Use o saldo que realmente está disponível na conta e na carteira. Ele vira o ponto de partida do cálculo.'),
      F.capitalBalance()>0?h('p.notice',`Você tem ${money(F.capitalBalance())} no saldo de capital recebido. Informe abaixo o saldo geral, sem incluir esse capital.`):null,
      h('div.amount-wrap', h('span.cur', 'R$'), bal),
      h('p.onb-promise', 'Não precisa bater com o histórico antigo. Você poderá corrigir esse saldo a qualquer momento.'), msg,
      h('div.btn-row',
        h('button.btn.ghost', { type:'button', onclick:()=>{ step--; paint(); } }, 'Voltar'),
        h('button.btn.primary', { type: 'button', onclick: () => {
          const value = bal.getValue();
          if (!(value >= 0)) { msg.textContent = 'Informe seu saldo de hoje.'; bal.focus(); return; }
          data.balance = value;
          adminTrack('balance_added','activation').catch(()=>{});
          next('balance');
        } }, 'Continuar'))];
  }

  function sBills() {
    const list = h('div.onb-bills');
    const msg = h('p.form-msg');
    const paintList = () => list.replaceChildren(...Object.entries(data.bills).map(([name, item]) => {
      const val = moneyInput(item.value || null, { label: `Valor de ${name}` });
      const due = h('input.input.onb-due', { type:'number', inputmode:'numeric', min:1, max:31, value:item.due || 10, 'aria-label':`Vencimento de ${name}` });
      val.addEventListener('input', () => { item.value = val.getValue(); });
      due.addEventListener('input', () => { item.due = Math.min(31, Math.max(1, Math.floor(num(due.value)) || 10)); });
      return h('div.onb-bill-v2', h('span.onb-bill-name', name), h('div.onb-bill-fields', val, h('label.onb-due-wrap', h('small','dia'), due)));
    }));
    const chips = h('div.chips.wrap', BILLS.map(b => {
      const c = h('button.chip', { type: 'button', 'aria-pressed': String(b.name in data.bills), onclick: () => {
        if (b.name in data.bills) delete data.bills[b.name]; else data.bills[b.name] = { value:0, due:10 };
        c.classList.toggle('on', b.name in data.bills); c.setAttribute('aria-pressed', String(b.name in data.bills)); paintList();
      } }, `${b.icon} ${b.name}`);
      c.classList.toggle('on', b.name in data.bills);
      return c;
    }));
    paintList();
    const complete = () => {
      const selected = Object.values(data.bills).filter(x => Number(x.value) > 0).length;
      adminTrack('bills_reviewed','activation').catch(()=>{});
      if (selected) adminTrack('bills_added','activation').catch(()=>{});
      finish(); next('bills');
    };
    return [...title('3/3', 'Quais contas ainda vêm pela frente?', 'Selecione só as principais. Isso evita que o Bivvo trate dinheiro reservado para contas como dinheiro livre.'),
      chips, list,
      h('p.onb-promise', 'Você pode completar cartões, metas e outras contas depois. Aqui é só para chegar ao primeiro resultado rápido.'), msg,
      h('div.btn-row',
        h('button.btn.ghost', { type:'button', onclick:()=>{ step--; paint(); } }, 'Voltar'),
        h('button.btn', { type:'button', onclick:()=>{ data.bills={}; complete(); } }, 'Não tenho contas agora'),
        h('button.btn.primary', { type:'button', onclick:complete }, 'Ver meu resultado'))];
  }

  function sResult() {
    const sp = F.spendable();
    const positive = sp.state === 'positive';
    const result = positive
      ? h('div.onb-result.onb-wow', h('p.muted','Referência estimada por dia'), h('strong', money(sp.perDay)), h('p.muted', `por dia até ${sp.next.source === 'mes' ? 'o fim do mês' : 'o próximo dinheiro'}, sem comprometer as contas que você informou.`))
      : sp.state === 'zero'
        ? h('div.onb-result.onb-wow', h('p.muted','Seu dinheiro está exatamente comprometido até o próximo recebimento.'), h('strong','R$ 0'), h('p.muted','Evite novos gastos até entrar dinheiro ou ajustar seus compromissos.'))
        : h('div.onb-result.onb-wow.neg', h('p.muted','Seus compromissos passam do que está disponível em'), h('strong', money(-sp.free)), h('p.muted','Agora você já sabe onde precisa ajustar antes de gastar mais.'));
    trackOnce('spendable_seen');
    adminTrack('first_value_shown','activation').catch(()=>{});
    adminTrack('activation_completed','activation').catch(()=>{});
    return [
      h('small.eyebrow-soft','SEU PRIMEIRO VALOR'),
      h('h2', positive ? 'Seu dinheiro ganhou uma primeira referência.' : 'Você já tem um ponto de partida.'),
      h('p.muted', positive ? 'O Bivvo já descontou do cálculo o que você informou como compromisso antes do próximo dinheiro.' : 'Esse resultado não é uma bronca: é o ponto de partida para organizar o próximo passo.'),
      result,
      h('div.onb-next',
        h('button.btn.primary',{type:'button',onclick:()=>{sheet.close();go('aprender');}},'Abrir minha primeira missão'),
        h('button.btn.primary', { type:'button', onclick:()=>{ adminTrack('activation_cta_accounts','activation').catch(()=>{}); sheet.close(); go('planos',{tab:'fixas'}); } }, 'Adicionar minhas contas'),
        h('button.btn', {type:'button',onclick:()=>{adminTrack('activation_cta_share','activation').catch(()=>{});sheet.close();setTimeout(()=>import('./stories.js').then(m=>m.openStoryComposer({template:positive?'spendable':'health',source:'activation'})),120);}},'Criar meu card de progresso'),
        h('button.btn.ghost', { type:'button', onclick:()=>{ adminTrack('activation_cta_dashboard','activation').catch(()=>{}); sheet.close(); go('inicio'); } }, 'Ver meu painel'))
    ];
  }

  function finish() {
    store.commit(s => {
      const t0 = today(), cur = ymOf(t0), dayNow = Number(t0.slice(8)), nextMonth = addMonthsYM(cur, 1);
      s.profile.onboarded = true;
      s.profile.onboardingDeferred = false;
      s.profile.activationValueSeen = true;
      s.profile.activationAt = s.profile.activationAt || new Date().toISOString();
      const informed = data.balance >= 0;
      if (data.income > 0 && data.day && !s.fixed.some(f => f.type === 'income' && /sal[aá]rio/i.test(f.name))) {
        s.profile.incomeDay = data.day;
        const alreadyReceived = data.day <= dayNow;
        s.fixed.push({ id: uid(), name: 'Salário', value: data.income, due: data.day, cat: 'Salário', rec: 'Mensal', type: 'income', startYM: informed && alreadyReceived ? nextMonth : cur, paidThroughYM: !informed && alreadyReceived ? cur : undefined });
      } else if (data.day) s.profile.incomeDay = data.day;
      for (const [name, item] of Object.entries(data.bills)) {
        const value = Number(item?.value || 0), due = Math.min(31, Math.max(1, Math.floor(Number(item?.due || 10))));
        if (!(value > 0) || s.fixed.some(f => f.type === 'expense' && f.name === name)) continue;
        const b = BILLS.find(x => x.name === name) || { cat: 'Outros' };
        const passed = due <= dayNow;
        s.fixed.push({ id: uid(), name, value: Math.round(value * 100) / 100, due, cat: b.cat, rec: 'Mensal', type: 'expense', startYM: passed && informed ? nextMonth : cur, paidThroughYM: passed && !informed ? cur : undefined });
      }
      s.savingPlan.percent = data.save;
      store.generateRecurring(s);
      if (data.balance !== null && data.balance >= 0) {
        s.profile.balanceVerifiedV1 = {...s.profile.balanceVerifiedV1, [store.activeFinanceProfile()]: new Date().toISOString()};
        const tx = F.adjustmentTx(F.balanceAdjustment(data.balance, s), { first: !s.transactions.some(F.isOpening), id: uid(), date: today() });
        if (tx) s.transactions.push(tx);
      }
    }, { reason: 'onboarding' });
    completed = true;
    trackOnce('onboarding_done');
    adminTrack('onboarding_completed','onboarding').catch(()=>{});
  }
  paint();
}


/* "Quanto você tem hoje?" — define o saldo de hoje (não soma). Use sempre que o saldo do Bivvo
   não bater com o da sua conta. Cria um ajuste que não conta como renda nem como gasto. */
export function openOpeningBalance({ onDone } = {}) {
  const s0 = store.getState(), company=store.activeFinanceProfile()==='company';
  const current = F.balance(s0);
  const bal = moneyInput(null, { big: true, label: company?'Quanto há no caixa da empresa hoje':'Quanto você tem hoje' }); bal.autofocus = true;
  const preview = h('p.hint', { 'aria-live': 'polite' });
  const paint = () => { const v = bal.getValue(); const d = v >= 0 ? F.balanceAdjustment(v, s0) : 0; preview.textContent = !(v >= 0) ? '' : Math.abs(d) < 0.005 ? 'Igual ao que o Bivvo já calculou. Nada muda.' : `O Bivvo vai ${d > 0 ? 'somar' : 'tirar'} ${money(Math.abs(d))} como ajuste de saldo. Não conta como renda nem gasto.`; };
  bal.addEventListener('input', paint);
  const has = F.hasBalanceBase(s0);
  const capital=F.computeFresh(()=>F.capitalBalance(s0));
  const sheet = openSheet({ title: company?'Quanto há no caixa hoje?':'Quanto você tem hoje?', subtitle: has ? `O Bivvo calcula ${money(current)}. Se ${company?'o caixa/conta PJ':'sua conta'} mostra outro valor, informe o real.` : (company?'Some conta PJ + caixa físico. Esse valor vira o ponto de partida do negócio e não conta como faturamento.':'Conta corrente + carteira. Vira o ponto de partida do Bivvo e não conta como renda.'),
    content: [capital>0?h('p.notice',`Capital recebido separado: ${money(capital)}. Informe somente o saldo geral, sem incluir esse capital.`):null,h('div.amount-wrap', h('span.cur', 'R$'), bal), preview],
    footer: [h('button.btn.primary', { type: 'button', onclick: () => {
      const v = bal.getValue(); if (!(v >= 0)) return;
      let diff = 0;
      store.commit(s => { diff = F.balanceAdjustment(v, s); const tx = F.adjustmentTx(diff, { first: !s.transactions.some(F.isOpening), id: uid(), date: today() }); if (tx) s.transactions.push(tx); s.profile.balanceVerifiedV1 = {...s.profile.balanceVerifiedV1, [company ? 'company' : 'personal']: new Date().toISOString()}; });
      sheet.close(); toast(Math.abs(diff) < 0.005 ? (company?'O caixa já estava certo.':'Seu saldo já estava certo.') : `${company?'Caixa de hoje':'Saldo de hoje'}: ${money(v)}`); onDone?.();
    } }, 'Salvar')] });
}
