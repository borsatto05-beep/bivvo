/* Bivvo — dados de demonstração (fictícios, gerados em memória, relativos à data de hoje).
   Nunca são gravados na nuvem nem no navegador. */
import { today, ymOf, addMonthsYM, dateInYM, addDays, seeded, uid, round2, daysInMonth, isoWeek } from './util.js';
import { emptyState, addCardPurchase, generateRecurring, invoiceKeyFor } from './store.js';

export function buildDemo() {
  const rnd = seeded(20261003);
  const r = (a, b) => round2(a + rnd() * (b - a));
  const t0 = today(), cur = ymOf(t0), day0 = Number(t0.slice(8));
  /* Salário sempre já caiu neste mês (dia 1 a 5), para a demonstração nunca abrir com "Entrou R$ 0". */
  const payDay = Math.max(1, Math.min(5, day0 - 3));
  const s = emptyState({ name: 'Ana', goal: 'economizar', incomeDay: payDay, onboarded: true, checkins: [], seenAchievements: [], invitesSent: 0 });
  s.savingPlan = { percent: 12 };
  s.emergencyPlan = { target: 15000 };
  s.cards = [
    { id: uid(), name: 'Roxinho', limit: 6500, close: 3, due: 10, tint: 'plum' },
    { id: uid(), name: 'Black', limit: 9000, close: 20, due: 28, tint: 'graphite' }
  ];
  s.fixed = [
    { id: uid(), name: 'Salário', value: 6200, due: payDay, cat: 'Salário', rec: 'Mensal', type: 'income', startYM: addMonthsYM(cur, -4) },
    { id: uid(), name: 'Aluguel', value: 1380, due: 10, cat: 'Moradia', rec: 'Mensal', type: 'expense', startYM: addMonthsYM(cur, -4) },
    { id: uid(), name: 'Internet fibra', value: 109.9, due: 15, cat: 'Internet', rec: 'Mensal', type: 'expense', startYM: addMonthsYM(cur, -4) },
    { id: uid(), name: 'Energia', value: 187.4, due: 18, cat: 'Energia', rec: 'Mensal', type: 'expense', startYM: addMonthsYM(cur, -4) },
    { id: uid(), name: 'Academia', value: 99.9, due: 7, cat: 'Saúde', rec: 'Mensal', type: 'expense', startYM: addMonthsYM(cur, -4) }
  ];
  const tx = (date, desc, cat, value, extra = {}) => s.transactions.push({ id: uid(), date, desc, cat, type: 'expense', value: round2(value), status: 'Pago', method: 'PIX', createdAt: new Date(date + 'T20:00').getTime(), demoSeed: true, ...extra });
  const inc = (date, desc, cat, value, extra = {}) => s.transactions.push({ id: uid(), date, desc, cat, type: 'income', value: round2(value), status: 'Pago', method: 'Transferência', createdAt: new Date(date + 'T09:00').getTime(), demoSeed: true, ...extra });

  inc(dateInYM(addMonthsYM(cur, -4), 1), 'Saldo inicial', 'Saldo inicial', 600, { kind: 'opening' });
  for (let i = 4; i >= 0; i--) {
    const ym = addMonthsYM(cur, -i), [y, m] = ym.split('-').map(Number);
    const lastDay = i === 0 ? day0 : daysInMonth(y, m);
    /* recorrentes do passado já pagos */
    for (const f of s.fixed) {
      const d = dateInYM(ym, f.due);
      if (i === 0 && d > t0) continue;
      const key = `fixed|${f.id}|${ym}`; s.generatedRecurring.push(key);
      s.transactions.push({ id: uid(), date: d, desc: f.name, cat: f.cat, type: f.type, value: f.value, status: 'Pago', method: f.type === 'income' ? 'Transferência' : 'Boleto', recurringKey: key, fixedId: f.id, demoSeed: true, createdAt: new Date(d + 'T08:00').getTime() });
    }
    if (i === 2) inc(dateInYM(ym, 22), 'Freela identidade visual', 'Freelance', 900);
    if (i === 1) inc(dateInYM(ym, 14), 'Venda da bike', 'Venda', 650);
    /* gastos variáveis: delivery cai nos últimos meses (história para os insights) */
    const deliveryPerMonth = [9, 8, 7, 4, 3][4 - i];
    for (let d = 1; d <= lastDay; d++) {
      const date = dateInYM(ym, d);
      if (d % 3 === 1) tx(date, ['Mercado Dia', 'Assaí', 'Hortifruti', 'Pão de Açúcar'][d % 4], 'Mercado', r(42, 160), { method: 'Débito' });
      if (d % 2 === 0) tx(date, ['Padaria', 'Café', 'Almoço'][d % 3], 'Alimentação', r(9, 38), { method: d % 4 ? 'PIX' : 'Débito' });
      if (d % 4 === 2) tx(date, ['Uber', '99', 'Metrô'][d % 3], 'Transporte', r(8, 34));
      if (d % 10 === 6) tx(date, 'Posto Shell', 'Combustível', r(140, 210), { method: 'Débito' });
      if (d % 9 === 4) tx(date, ['Farmácia', 'Drogasil'][d % 2], 'Saúde', r(18, 85));
    }
    for (let k = 0; k < deliveryPerMonth; k++) { const d = 2 + Math.floor(rnd() * (lastDay - 1)); if (d <= lastDay) tx(dateInYM(ym, d), ['iFood', 'Rappi', 'iFood'][k % 3], 'Delivery', r(32, 74)); }
    if (lastDay >= 12) tx(dateInYM(ym, 12), 'Cinema', 'Lazer', r(48, 90), { method: 'Crédito', card: 'Roxinho', status: i === 0 ? 'Pendente' : 'Pago' });
    if (lastDay >= 6) tx(dateInYM(ym, 6), 'Spotify', 'Assinaturas', 21.9, { method: 'Crédito', card: 'Roxinho', status: 'Pago' });
    if (lastDay >= 9) tx(dateInYM(ym, 9), 'Netflix', 'Assinaturas', 44.9, { method: 'Crédito', card: 'Black', status: 'Pago' });
    if (lastDay >= 16) tx(dateInYM(ym, 16), ['Shein', 'Renner', 'Amazon', 'Mercado Livre', 'Shopee'][i], ['Roupas', 'Roupas', 'Compras', 'Compras', 'Compras'][i], r(90, 240), { method: 'Crédito', card: i % 2 ? 'Black' : 'Roxinho', status: i <= 1 ? 'Pendente' : 'Pago' });
    /* guardado no mês */
    s.transactions.push({ id: uid(), date: dateInYM(ym, Math.min(6, lastDay)), desc: 'Guardar na reserva', cat: 'Reserva de Emergência', type: 'expense', value: 450 + (4 - i) * 60, status: 'Pago', method: 'Transferência', kind: 'save', goalId: 'demo-reserve', demoSeed: true, createdAt: Date.now() });
  }
  /* começo de mês: alguns lançamentos a mais para a tela nunca parecer vazia */
  if (day0 < 8) {
    const early = [['Padaria', 'Alimentação', 14.5], ['Mercado Dia', 'Mercado', 96.3], ['Uber', 'Transporte', 18.9], ['iFood', 'Delivery', 41.9], ['Farmácia', 'Saúde', 27.4], ['Café', 'Alimentação', 9.5]];
    early.forEach(([desc, cat, v], k) => tx(dateInYM(cur, 1 + (k % day0)), desc, cat, v, { method: k % 2 ? 'Débito' : 'PIX' }));
    inc(dateInYM(cur, Math.min(2, day0)), 'Freela de design', 'Freelance', 480);
  }
  /* parceladas no cartão */
  addCardPurchase(s, { desc: 'Notebook', cat: 'Compras', total: 3600, parts: 12, card: 'Black', date: dateInYM(addMonthsYM(cur, -3), 21) });
  addCardPurchase(s, { desc: 'Geladeira', cat: 'Moradia', total: 2400, parts: 10, card: 'Roxinho', date: dateInYM(addMonthsYM(cur, -2), 8) });
  addCardPurchase(s, { desc: 'Passagem Recife', cat: 'Viagens', total: 1180, parts: 4, card: 'Roxinho', date: addDays(t0, -9) });
  /* faturas cujo vencimento já passou estão pagas; as demais seguem em aberto */
  for (const t of s.transactions) {
    if (t.method !== 'Crédito') continue;
    const c = s.cards.find(x => x.name === t.card) || s.cards[0];
    const ym = t.invoice || invoiceKeyFor(c, t.date);
    const due = dateInYM(c.due > c.close ? ym : addMonthsYM(ym, 1), c.due);
    t.status = due < t0 ? 'Pago' : (t.installmentId ? 'Parcelado' : 'Pendente');
    if (t.status === 'Pago') t.paidAt = due;
  }
  /* metas e reserva */
  const reserve = { id: 'demo-reserve', name: 'Reserva de emergência', emoji: '🛡️', target: 15000, saved: 0, date: '', isReserve: true };
  reserve.saved = round2(s.transactions.filter(t => t.goalId === 'demo-reserve').reduce((a, t) => a + t.value, 2400));
  s.goals = [reserve, { id: uid(), name: 'Viagem pro Nordeste', emoji: '🏝️', target: 6000, saved: 2150, date: dateInYM(addMonthsYM(cur, 7), 15) }, { id: uid(), name: 'Trocar o celular', emoji: '📱', target: 2800, saved: 2800, date: '' }];
  s.budget_limits = { Mercado: 1100, Delivery: 250, Alimentação: 420, Transporte: 320, Lazer: 200, Compras: 350 };
  s.investments = [
    { id: uid(), type: 'CDB', name: 'CDB Banco Inter', desc: '110% do CDI', value: 3000, costBasis: 3000, purchaseDate: dateInYM(addMonthsYM(cur, -10), 3), yieldType: 'Pós-fixado', yieldRate: 110, yieldIndex: 'CDI' },
    { id: uid(), type: 'Renda fixa', name: 'Tesouro IPCA+ 2035', desc: 'Aposentadoria', value: 1800, costBasis: 1800, purchaseDate: dateInYM(addMonthsYM(cur, -7), 12), yieldType: 'Prefixado', yieldRate: 11.2 },
    { id: uid(), type: 'Fundos', name: 'MXRF11', desc: 'Fundo imobiliário', quantity: 120, purchasePrice: 9.85, marketPrice: 10.12, value: 1182, costBasis: 1182, purchaseDate: dateInYM(addMonthsYM(cur, -5), 18) },
    { id: uid(), type: 'Ações', name: 'WEGE3', desc: 'WEG ON', quantity: 20, purchasePrice: 38.4, marketPrice: 41.9, value: 768, costBasis: 768, purchaseDate: dateInYM(addMonthsYM(cur, -3), 9) }
  ];
  s.challenges = [
    { id: uid(), type: 'cut', cat: 'Delivery', value: 0, startedAt: dateInYM(cur, 1), endsAt: dateInYM(cur, 31), baseline: 330, status: 'active' },
    { id: uid(), type: 'log7', value: 0, startedAt: addDays(t0, -12), endsAt: addDays(t0, -6), status: 'done', completedAt: addDays(t0, -6) }
  ];
  s.profile.checkins = [1, 2, 3].map(n => isoWeek(addDays(t0, -7 * n)));
  /* 11.52: o modo demonstração também traz um negócio fictício completo para
     mostrar o cockpit Empresa e permitir explorar os dashboards sem cadastro. */
  s.profile.companyName = 'Ateliê Aurora';
  s.profile.companyType = 'ME';
  s.profile.companyRevenueTarget = 30000;
  s.financialProfiles = { company: buildCompanyDemo(t0, cur, day0, rnd) };
  generateRecurring(s);
  return s;
}

function buildCompanyDemo(t0, cur, day0, rnd) {
  const c = emptyState();
  const r = (a,b)=>round2(a+rnd()*(b-a));
  const push=(date,desc,cat,type,value,status='Pago',method='PIX',extra={})=>c.transactions.push({id:uid(),date,desc,cat,type,value:round2(value),status,method,createdAt:new Date(date+'T12:00').getTime(),demoSeed:true,...extra});
  c.cards=[{id:uid(),name:'PJ Platinum',limit:18000,close:7,due:14,tint:'graphite'}];
  c.fixed=[
    {id:uid(),name:'Aluguel comercial',value:2600,due:8,cat:'Aluguel comercial',rec:'Mensal',type:'expense',startYM:addMonthsYM(cur,-11)},
    {id:uid(),name:'Contabilidade',value:690,due:10,cat:'Contabilidade',rec:'Mensal',type:'expense',startYM:addMonthsYM(cur,-11)},
    {id:uid(),name:'ERP + ferramentas',value:480,due:12,cat:'Softwares e sistemas',rec:'Mensal',type:'expense',startYM:addMonthsYM(cur,-11)},
    {id:uid(),name:'Pró-labore',value:3200,due:5,cat:'Pró-labore',rec:'Mensal',type:'expense',startYM:addMonthsYM(cur,-11)}
  ];
  push(dateInYM(addMonthsYM(cur,-11),1),'Saldo inicial','Saldo inicial','income',12800,'Pago','Transferência',{kind:'opening'});
  const clients=['Studio Lume','Clínica Horizonte','Norte Engenharia','Casa Nativa','Grupo Mosaico'];
  for(let i=11;i>=0;i--){
    const ym=addMonthsYM(cur,-i),[y,m]=ym.split('-').map(Number),last=i===0?day0:daysInMonth(y,m);
    const growth=1+(11-i)*.025;
    const sales=Math.max(3,Math.floor(5+rnd()*4));
    for(let k=0;k<sales;k++){
      const d=Math.min(last,2+Math.floor(rnd()*Math.max(1,last-2)));
      const services=k%3!==0;
      push(dateInYM(ym,d),clients[(k+i)%clients.length],services?'Prestação de serviços':'Vendas de produtos','income',r(2200,5200)*growth,(i===0&&k===sales-1)?'Pendente':'Pago','Transferência');
    }
    const exp=[
      ['Fornecedor de materiais','Fornecedores',r(1800,3600)],['Meta Ads','Marketing e anúncios',r(850,1700)],['Fretes do mês','Fretes e entregas',r(420,950)],['Equipe operacional','Folha de pagamento',r(4800,5900)],['DAS / impostos','Impostos e tributos',r(900,1800)],['Taxas de cartão','Taxas de cartão / marketplace',r(380,780)]
    ];
    exp.forEach(([desc,cat,val],k)=>{const d=Math.min(last,4+k*3);push(dateInYM(ym,d),desc,cat,'expense',val,(i===0&&k===4)?'Pendente':'Pago',k===0?'Boleto':'PIX');});
    for(const f of c.fixed){const d=dateInYM(ym,Math.min(f.due,last)),key=`fixed|${f.id}|${ym}`;c.generatedRecurring.push(key);push(d,f.name,f.cat,'expense',f.value,'Pago','Boleto',{fixedId:f.id,recurringKey:key});}
  }
  /* títulos futuros para contas a receber/pagar e projeção */
  push(addDays(t0,5),'Clínica Horizonte · projeto outubro','Recebimentos de clientes','income',4800,'Pendente','Transferência');
  push(addDays(t0,17),'Grupo Mosaico · mensalidade','Contratos / mensalidades','income',3200,'Pendente','Transferência');
  push(addDays(t0,-6),'Studio Lume · parcela vencida','Recebimentos de clientes','income',1850,'Pendente','Transferência');
  push(addDays(t0,8),'Fornecedor de materiais','Fornecedores','expense',2400,'Pendente','Boleto');
  push(addDays(t0,14),'DAS do mês','Impostos e tributos','expense',1350,'Pendente','Boleto');
  push(addDays(t0,-3),'Frete pendente','Fretes e entregas','expense',620,'Pendente','Boleto');
  generateRecurring(c);
  return c;
}

/* Histórico fictício de Capital. Só pode ser adicionado a um estado de demonstração. */
export function addCapitalDemoRecords(s) {
  if(!s?.transactions?.some(t=>t.demoSeed))throw Error('Capital fictício exige dados de demonstração.');
  if(s.loans.some(l=>l.id.startsWith('demo-capital-')))return s;
  const names=['Ana Ribeiro','Bruno Almeida','Carla Santos','Diego Lima','Elisa Costa','Felipe Rocha','Gabriela Alves','Hugo Martins','Isabela Souza','João Pereira'];
  const principals=[1200,1800,2200,1400,2500,1600,2000,900,1700,1900];
  const current=ymOf(today()),lastDay=Number(today().slice(8)),paymentDay=Math.min(5,lastDay);
  const date=(offset,day=paymentDay)=>dateInYM(addMonthsYM(current,offset),day);
  const stamp=d=>new Date(d+'T12:00:00').getTime();
  const create=(id,person,principal,interest,d,periodicity='single')=>{
    const l={id,person,principalOriginal:principal,principal,interestDue:interest,interestMode:'fixed',interestFixed:interest,interestRate:0,periodicity,initialDue:d,due:d,status:'open',createdAt:stamp(d),demoSeed:true,note:'Contrato fictício para explorar a demonstração.'};
    s.loans.push(l);s.loanCycles.push({id:id+'-created',loanId:id,type:'created',date:d,due:d,principal,interest,createdAt:stamp(d),demoSeed:true});return l;
  };
  const pay=(l,date,principal,interest,k)=>{
    const id=l.id+'-pay-'+k;s.loanPayments.push({id,loanId:l.id,date,principal,interest,total:round2(principal+interest),createdAt:stamp(date),demoSeed:true});
    for(const [value,role,label] of [[principal,'loan_principal_return','Principal recebido'],[interest,'loan_interest_income','Juros recebidos']])if(value>0)s.transactions.push({id:id+'-'+role,loanId:l.id,loanPaymentId:id,transactionRole:role,isLoan:true,type:'income',value,date,paidAt:date,status:'Pago',method:'Capital',cat:'Juros / Empréstimo',desc:label+' · '+l.person,createdAt:stamp(date),demoSeed:true});
    l.principal=round2(l.principal-principal);l.interestDue=round2(l.interestDue-interest);l.status=l.principal===0&&l.interestDue===0?'paid':'open';
  };
  names.forEach((person,i)=>{
    const interest=principals[i]*.05,l=create('demo-capital-monthly-'+i,person,principals[i],0,date(-5,1),'monthly');
    for(let m=-5;m<=0;m++){
      const d=date(m),due=date(m===0?1:m+1);
      s.loanCycles.push({id:l.id+'-renew-'+m,loanId:l.id,type:'renewal',date:d,due,principal:l.principal,interest,createdAt:stamp(d),demoSeed:true});
      l.interestDue=interest;pay(l,d,0,interest,m);l.due=due;
    }
  });
  const interest=[100,150,160,125,180,140,170,120,120];
  for(let i=0;i<19;i++){
    const d=date(-(i%6),1),l=create('demo-capital-single-'+i,names[(i+1)%10],600+i*100,i<9?interest[i]:50,date(-(i%6),Math.min(paymentDay,2)));
    l.createdAt=stamp(d);
    if(i<3){pay(l,date(-(i%6)),l.principalOriginal/4,interest[i]/2,1);pay(l,date(-(i%6)),l.principalOriginal/4,interest[i]/2,2);}
    else if(i<9)pay(l,date(-(i%6)),l.principalOriginal,interest[i],1);
    else l.due=date(-(i%6),1);
  }
  return s;
}
