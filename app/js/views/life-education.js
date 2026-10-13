/* Bivvo 11.62 — educação financeira didática para Pessoal e Casal.
   Linguagem simples, exemplos práticos e simuladores. Não substitui orientação profissional individual. */
import {h,money,money0,parseMoney,round2,today,ymOf} from '../util.js';
import {openSheet} from '../ui.js';
import * as store from '../store.js';
import * as F from '../finance.js';

const PERSONAL={
  spendable:{icon:'⚡',title:'Quanto posso gastar',what:'É uma estimativa do que você pode gastar sem comprometer contas, metas e o dinheiro que precisa durar até a próxima entrada.',importance:'Ajuda a evitar gastar o saldo inteiro como se todo dinheiro estivesse livre.',formula:'Dinheiro disponível − compromissos futuros − valor reservado = dinheiro livre\nDinheiro livre ÷ dias restantes = referência por dia',example:'Se você tem R$ 1.000 livres para 10 dias, a referência é cerca de R$ 100 por dia.',mistake:'Olhar só o saldo da conta e esquecer fatura, aluguel e outras contas já assumidas.',better:'Mantenha renda, saldo e contas futuras atualizados. Use a referência como limite de segurança, não como obrigação de gastar.'},
  budget:{icon:'🧭',title:'Orçamento mensal',what:'É um plano para decidir antes do mês quanto pode ir para cada tipo de gasto.',importance:'Sem orçamento, você só descobre que gastou demais depois que o dinheiro acabou.',formula:'Renda do mês − gastos essenciais − metas = limite para gastos variáveis',example:'Renda de R$ 3.000, essenciais de R$ 1.800 e meta de R$ 300 deixam R$ 900 para outras categorias.',mistake:'Criar um orçamento impossível e abandonar tudo na primeira semana.',better:'Comece com poucas categorias importantes e ajuste com base no que realmente acontece.'},
  emergency:{icon:'🛡️',title:'Reserva de emergência',what:'É dinheiro separado para imprevistos importantes, como perda de renda ou uma despesa inesperada.',importance:'Evita transformar imprevisto em dívida cara.',formula:'Reserva alvo = despesas essenciais mensais × número de meses de proteção',example:'Se o essencial custa R$ 2.000 e a meta é 6 meses, a reserva alvo é R$ 12.000.',mistake:'Usar a reserva para compras previsíveis, viagens ou promoções.',better:'Guarde em local de baixo risco e acesso fácil. Monte aos poucos e reponha quando precisar usar.'},
  debt:{icon:'📉',title:'Dívidas',what:'É dinheiro que você já usou e ainda terá de devolver, normalmente com juros.',importance:'Juros altos reduzem sua renda futura e podem virar uma bola de neve.',formula:'Custo da dívida = parcelas + juros + taxas até quitar',example:'Uma dívida de R$ 1.000 que termina em R$ 1.400 custou R$ 400 além do valor original.',mistake:'Escolher só pela parcela pequena e ignorar o valor total pago.',better:'Priorize dívidas caras, negocie juros e evite criar nova dívida enquanto quita as antigas.'},
  cards:{icon:'💳',title:'Cartão de crédito',what:'É um meio de pagamento que adia a saída do dinheiro para a fatura.',importance:'Facilita comprar agora, mas pode esconder quanto da renda futura já está comprometida.',formula:'Limite realmente seguro ≠ limite do banco\nGasto seguro depende da renda, contas e parcelas futuras',example:'Ter R$ 10 mil de limite não significa poder gastar R$ 10 mil se sua renda livre é R$ 800.',mistake:'Tratar limite como renda e parcelar várias compras sem somar as parcelas futuras.',better:'Acompanhe fatura atual, próximas parcelas e vencimento. Tente pagar a fatura integral.'},
  goals:{icon:'🎯',title:'Metas financeiras',what:'É um valor que você quer juntar para um objetivo específico.',importance:'Transforma “quero guardar” em um plano mensurável.',formula:'Valor que falta ÷ meses restantes = contribuição mensal necessária',example:'Faltam R$ 6.000 e você tem 12 meses: cerca de R$ 500 por mês.',mistake:'Criar várias metas ao mesmo tempo sem prioridade.',better:'Dê nome, prazo e valor. Priorize reserva e objetivos importantes antes de metas menos urgentes.'},
  fixed:{icon:'📅',title:'Contas fixas e recorrentes',what:'São compromissos que se repetem e precisam ser considerados antes de gastar.',importance:'Quanto maior a parte fixa da renda, menor sua liberdade para lidar com imprevistos.',formula:'Comprometimento fixo = contas fixas ÷ renda mensal × 100',example:'R$ 1.800 de contas numa renda de R$ 3.000 = 60% da renda comprometida antes dos gastos variáveis.',mistake:'Esquecer assinaturas, anuidades e parcelas pequenas recorrentes.',better:'Revise mensalmente e cancele o que não entrega valor.'},
  cashflow:{icon:'↕',title:'Fluxo de dinheiro',what:'Mostra quando o dinheiro entra e quando sai, não apenas quanto você ganha no mês.',importance:'Você pode ganhar o suficiente no mês e ainda ficar sem dinheiro numa semana se datas não combinarem.',formula:'Saldo futuro = saldo de hoje + entradas previstas − saídas previstas',example:'R$ 500 hoje + R$ 2.000 de salário − R$ 2.200 de contas = R$ 300 previstos.',mistake:'Somar renda do mês sem observar os dias de vencimento.',better:'Use calendário e previsão para enxergar o aperto antes dele acontecer.'},
  invest:{icon:'📈',title:'Investimentos',what:'É dinheiro colocado em ativos com expectativa de preservar ou aumentar valor no tempo.',importance:'Ajuda objetivos de médio e longo prazo, mas vem depois de organizar caixa e reserva.',formula:'Patrimônio investido = soma do valor atual dos ativos',example:'R$ 5.000 em renda fixa + R$ 2.000 em fundos = R$ 7.000 investidos.',mistake:'Investir dinheiro que será necessário para contas próximas ou reserva.',better:'Defina objetivo, prazo e risco antes de escolher produto. Diversifique sem complicar demais.'}
};

const COUPLE={
  shared:{icon:'💑',title:'Dinheiro do casal x dinheiro pessoal',what:'O espaço Casal guarda apenas o que pertence aos dois. Cada pessoa continua com sua vida financeira individual separada.',importance:'Evita confusão, exposição desnecessária e discussão sobre gastos que não são compartilhados.',formula:'Compartilhado = somente renda/gasto que vocês decidiram colocar no espaço do casal',example:'Aluguel e mercado podem ser compartilhados; uma compra pessoal pode continuar apenas no Pessoal.',mistake:'Misturar tudo e perder a noção do que é responsabilidade individual ou do casal.',better:'Combinem antes quais categorias são compartilhadas e mantenham essa regra consistente.'},
  split:{icon:'⚖️',title:'Divisão justa dos gastos',what:'É a regra usada para decidir quanto cada pessoa contribui para as despesas em comum.',importance:'Uma regra clara reduz sensação de injustiça e evita cobranças baseadas em memória.',formula:'50/50: gasto ÷ 2\nProporcional: gasto × (renda individual ÷ renda conjunta)',example:'Rendas de R$ 3.000 e R$ 2.000: numa conta de R$ 1.000, a divisão proporcional seria R$ 600 e R$ 400.',mistake:'Usar 50/50 automaticamente quando as rendas são muito diferentes e isso pesa demais para uma pessoa.',better:'Escolham 50/50, proporcional ou outra regra consciente e revisem quando a renda mudar.'},
  income:{icon:'💰',title:'Renda conjunta',what:'É a soma das entradas que vocês decidiram considerar para os objetivos e despesas em comum.',importance:'Mostra a capacidade real do casal para sustentar casa, metas e lazer compartilhado.',formula:'Renda conjunta = entradas compartilhadas da pessoa A + pessoa B',example:'R$ 3.000 + R$ 4.000 = R$ 7.000 de renda conjunta registrada.',mistake:'Contar renda incerta como se fosse garantida todos os meses.',better:'Use renda recorrente como base e trate renda extra como bônus ou reforço de metas.'},
  houseBudget:{icon:'🏠',title:'Orçamento da casa',what:'É o plano mensal para aluguel, mercado, contas, transporte e outras despesas do casal.',importance:'Ajuda os dois a saber quanto a casa custa antes de decidir gastos extras.',formula:'Renda conjunta − despesas da casa − metas = valor livre do casal',example:'Renda de R$ 7.000, casa de R$ 4.500 e metas de R$ 700 deixam R$ 1.800 livres.',mistake:'Planejar só aluguel e esquecer mercado, energia, manutenção e compras recorrentes.',better:'Use categorias simples, compare mês a mês e ajuste o limite das maiores despesas.'},
  goals:{icon:'🎯',title:'Metas do casal',what:'São objetivos que os dois decidiram financiar juntos, como viagem, casa, móveis ou reserva.',importance:'Transforma objetivo emocional em contribuição clara e evita que só uma pessoa carregue a meta.',formula:'Valor que falta ÷ meses = quanto o casal precisa guardar por mês',example:'R$ 12.000 para uma viagem em 12 meses = R$ 1.000 por mês para o casal.',mistake:'Criar meta sem definir quem contribui quanto.',better:'Definam valor, prazo e regra de contribuição. Acompanhem o progresso juntos.'},
  reserve:{icon:'🛡️',title:'Reserva do casal',what:'É uma proteção para despesas compartilhadas e períodos em que uma das rendas pode cair.',importance:'Dá segurança à casa sem depender de cartão ou empréstimo quando algo acontece.',formula:'Reserva da casa = despesas essenciais compartilhadas × meses de proteção',example:'Casa essencial de R$ 4.000 por mês × 6 meses = R$ 24.000 como referência.',mistake:'Confundir a reserva do casal com dinheiro para lazer ou compras planejadas.',better:'Definam o que a reserva cobre e mantenham também a autonomia financeira individual quando fizer sentido.'},
  shopping:{icon:'🛒',title:'Lista de compras',what:'É uma lista compartilhada para planejar compras da casa antes de ir ao mercado.',importance:'Reduz duplicidade, esquecimento e compra por impulso.',formula:'Total estimado = soma de quantidade × preço estimado de cada item',example:'2 leites de R$ 6 + arroz de R$ 25 = R$ 37 previstos.',mistake:'Ir ao mercado sem lista e só descobrir o total no caixa.',better:'Preencham preço estimado, marquem o comprado e comparem previsto x pago.'},
  commitment:{icon:'📊',title:'Comprometimento da renda do casal',what:'Mostra quanto da renda conjunta já está sendo consumida pelos gastos compartilhados.',importance:'Ajuda a perceber cedo quando o padrão de vida está apertando a renda.',formula:'Comprometimento = gastos compartilhados ÷ renda conjunta × 100',example:'R$ 5.000 de gastos com R$ 7.000 de renda = cerca de 71%.',mistake:'Interpretar qualquer percentual como regra universal. Cada casal tem realidade diferente.',better:'Compare com o próprio histórico e garanta espaço para metas, imprevistos e despesas individuais.'},
  communication:{icon:'🗣️',title:'Revisão financeira do casal',what:'É uma conversa curta e periódica para olhar números juntos sem transformar dinheiro em acusação.',importance:'Decisões financeiras compartilhadas funcionam melhor quando os dois enxergam a mesma informação.',formula:'Revisão = o que entrou + o que saiu + próximos compromissos + uma decisão prática',example:'15 minutos por semana para revisar mercado, próxima conta e meta da viagem.',mistake:'Só falar de dinheiro quando surge um problema ou cobrança.',better:'Façam revisão curta, objetiva e focada em decisões futuras, não em procurar culpado.'}
};

const pick=(profile,key)=>profile==='couple'?COUPLE[key]:PERSONAL[key];
export function lessonFinancialValues(summary={},spendable={}) {
  const n=v=>Number.isFinite(Number(v))?Number(v):0;
  const income=n(summary.income),expense=n(summary.spend),planned=n(summary.planned);
  return {income,expense,incomePaid:n(summary.incomePaid),expensePaid:n(summary.spendPaid),planned,
    balance:round2(income-expense-planned),perDay:n(spendable.perDay),free:n(spendable.free)};
}
const values=()=>{try{const s=store.getState();return lessonFinancialValues(F.monthSummary(ymOf(today()),s),F.spendable(s));}catch{return lessonFinancialValues();}};

function box(icon,title,body,cls=''){return h('section.life-lesson-box'+(cls?'.'+cls:''),h('div.life-lesson-box-head',h('span',icon),h('b',title)),h('p',body));}
export function openLifeLesson(profile,key,context={}){
  const d=pick(profile,key);if(!d)return;const v=values();
  let personalExample='';
  if(profile==='personal'&&context.useNumbers!==false){
    if(key==='spendable')personalExample=`Pelos dados atuais, a referência diária calculada pelo Bivvo está em ${money0(v.perDay)} e o valor livre estimado é ${money0(v.free)}.`;
    else if(['budget','fixed','cashflow'].includes(key))personalExample=`Neste mês, o Bivvo encontrou aproximadamente ${money0(v.income)} de entradas e ${money0(v.expense)} de gastos considerados no resumo.`;
  }
  const content=h('div.life-lesson-modal',
    h('div.life-lesson-hero',{class:profile},h('span',d.icon),h('div',h('small',profile==='couple'?'BIVVO · ESCOLA FINANCEIRA A DOIS':'BIVVO · ESCOLA FINANCEIRA'),h('h2',d.title),h('p',d.what))),
    h('div.life-lesson-grid',box('💡','Por que isso importa',d.importance),box('🧮','Como calcular',d.formula,'formula'),box('📌',personalExample?'Exemplo com seus números':'Exemplo prático',personalExample||d.example,'example')),
    h('div.life-lesson-grid.two',box('⚠️','Erro comum',d.mistake,'warn'),box('✅','Jeito certo de fazer',d.better,'good')),
    h('p.life-disclaimer',profile==='couple'?'O Bivvo ajuda vocês a organizar e conversar com base nos dados registrados. A regra “justa” depende do acordo e da realidade de cada casal.':'Conteúdo educativo para organização financeira. Decisões de investimento, crédito e questões tributárias podem exigir orientação profissional específica.'));
  openSheet({wide:true,label:`Aprenda: ${d.title}`,content});
}

function lessonBtn(profile,key,label){const d=pick(profile,key);return h('button.life-learn-btn',{type:'button',onclick:()=>openLifeLesson(profile,key),'aria-label':`Entenda ${d?.title||''}`},label||d?.title||'Entenda');}

const PAGE={
  personal:{
    inicio:{icon:'🎓',title:'Aprenda a cuidar do seu dinheiro enquanto usa o Bivvo',text:'Comece entendendo quanto pode gastar, depois organize orçamento, contas e reserva.',keys:['spendable','budget','emergency']},
    extrato:{icon:'↕',title:'Movimentos contam a história do seu dinheiro',text:'Registrar corretamente entradas e gastos é o que torna todos os outros cálculos confiáveis.',keys:['cashflow','budget','fixed']},
    calendario:{icon:'📅',title:'Calendário é prevenção, não só lembrete',text:'Olhe o que vence antes de gastar o saldo disponível. Datas importam tanto quanto valores.',keys:['cashflow','fixed','cards']},
    cartoes:{icon:'💳',title:'Cartão não aumenta sua renda',text:'Use a fatura e as parcelas futuras para enxergar quanto da sua renda já foi comprometido.',keys:['cards','debt','budget']},
    planos:{icon:'🧭',title:'Planejamento transforma intenção em número',text:'Metas, reserva, orçamento e investimentos funcionam melhor quando têm valor, prazo e prioridade.',keys:['goals','emergency','invest']},
    previsao:{icon:'🔭',title:'Previsão ajuda você a agir antes do aperto',text:'O objetivo não é adivinhar o futuro, mas testar se os compromissos atuais cabem no dinheiro esperado.',keys:['cashflow','spendable','fixed']},
    voce:{icon:'👤',title:'Seu sistema financeiro precisa refletir sua vida real',text:'Categorias, renda, preferências e sincronização corretas tornam as análises mais úteis.',keys:['budget','goals','cashflow']}
  },
  couple:{
    resumo:{icon:'💑',title:'Aprendam a organizar o dinheiro a dois sem misturar tudo',text:'Definam o que é compartilhado, acompanhem a renda conjunta e usem uma regra de divisão que os dois entendam.',keys:['shared','income','houseBudget']},
    gastos:{icon:'🏠',title:'Gasto compartilhado precisa de regra clara',text:'Olhem categorias, tendência e o que realmente pertence aos dois antes de discutir quem gastou mais.',keys:['houseBudget','commitment','shopping']},
    divisao:{icon:'⚖️',title:'Dividir igual e dividir de forma justa podem ser coisas diferentes',text:'Compare 50/50 com divisão proporcional à renda e escolham conscientemente a regra de vocês.',keys:['split','income','communication']},
    agenda:{icon:'📅',title:'Planejem juntos antes do vencimento',text:'Contas futuras, compras da casa e metas ficam mais leves quando os dois sabem o que vem pela frente.',keys:['houseBudget','reserve','communication']},
    voce:{icon:'🔒',title:'Privacidade também faz parte de uma boa vida financeira a dois',text:'O espaço Casal mostra só o que vocês escolherem compartilhar; o restante continua individual.',keys:['shared','communication','goals']}
  }
};

export function profilePageTutor(profile,route,params={}){
  if(!['personal','couple'].includes(profile))return null;
  const page=profile==='couple'?(route==='familia'?(['gastos','divisao','agenda'].includes(params.tab)?params.tab:'resumo'):route):route;
  const cfg=PAGE[profile]?.[page];if(!cfg)return null;
  const setHidden=(hidden)=>store.commit(s=>{
    s.profile.financialGuideHidden={...s.profile.financialGuideHidden,[profile]:hidden};
  },{reason:'financial-guide'});
  if(store.getState().profile.financialGuideHidden?.[profile])return h('div.life-guide-collapsed',
    h('button.life-guide-show',{type:'button',onclick:()=>setHidden(false)},'Mostrar guia financeiro'));
  return h('section.card.life-page-tutor',{class:profile},
    h('button.life-guide-close',{type:'button','aria-label':'Fechar guia financeiro',title:'Fechar guia financeiro',onclick:()=>setHidden(true)},'×'),
    h('span.life-page-tutor-icon',cfg.icon),
    h('div.life-page-tutor-copy',h('small',profile==='couple'?'BIVVO · GUIA FINANCEIRO DO CASAL':'BIVVO · GUIA FINANCEIRO'),h('b',cfg.title),h('p',cfg.text)),
    h('div.life-page-tutor-actions',...cfg.keys.map(k=>lessonBtn(profile,k)),h('button.life-school-btn',{type:'button',onclick:()=>openLifeSchool(profile)},profile==='couple'?'Ver escola do casal':'Ver escola financeira')));
}

export function openLifeSchool(profile='personal'){
  const data=profile==='couple'?COUPLE:PERSONAL;
  const intro=profile==='couple'?'Um guia prático para vocês tomarem decisões juntos sem perder a individualidade.':'Aprenda o essencial para organizar o dinheiro antes de pensar em complicar.';
  let schoolSheet=null;
  const openAfterClose=(fn)=>{schoolSheet?.close();setTimeout(fn,180);};
  const cards=Object.entries(data).map(([key,d])=>h('button.life-school-card',{type:'button',onclick:()=>openAfterClose(()=>openLifeLesson(profile,key))},h('span',d.icon),h('span',h('b',d.title),h('small',d.what))));
  const sims=profile==='couple'?[['split','⚖️','Simular divisão'],['goal','🎯','Simular meta conjunta']]:[['reserve','🛡️','Simular reserva'],['goal','🎯','Simular meta'],['debt','📉','Comparar dívida']];
  schoolSheet=openSheet({wide:true,label:profile==='couple'?'Escola financeira do casal':'Escola financeira pessoal',content:h('div.life-school',h('div.life-school-hero',{class:profile},h('small',profile==='couple'?'APRENDAM JUNTOS':'APRENDA NO SEU RITMO'),h('h2',profile==='couple'?'Escola financeira do casal':'Escola financeira pessoal'),h('p',intro)),h('div.life-school-grid',cards),h('div.life-sim-strip',h('div',h('small','PRATIQUE'),h('b','Simuladores rápidos')),h('div',...sims.map(([type,icon,label])=>h('button.btn.sm',{type:'button',onclick:()=>openAfterClose(()=>openLifeSimulator(profile,type))},icon+' '+label)))))});
}

function field(label,value,suffix=''){const input=h('input.input',{type:'text',inputmode:'decimal',value:String(value??0).replace('.',','),'aria-label':label});return {input,node:h('label.life-sim-field',h('span',label),h('div',input,suffix?h('b',suffix):null))};}
function metric(label,value,tone=''){return h('article.life-sim-metric',{class:tone},h('small',label),h('b',value));}
export function openLifeSimulator(profile,type){
  const result=h('div.life-sim-results');let fields=[],calc=()=>{};const add=(l,v,s='')=>{const f=field(l,v,s);fields.push(f);return f.input;};
  let title='Simulador';
  if(profile==='personal'&&type==='reserve'){
    title='Simulador de reserva de emergência';const essential=add('Despesas essenciais por mês',2000),months=add('Meses de proteção',6);
    calc=()=>{const e=parseMoney(essential.value),m=Math.max(0,parseMoney(months.value)),target=e*m;result.replaceChildren(metric('Reserva alvo',money(target),'good'),metric('Proteção',`${m} mês(es)`),h('p.life-sim-note','Essa é uma referência simples. Ajuste ao seu tipo de renda, estabilidade e responsabilidades.'));};
  }else if(profile==='personal'&&type==='goal'){
    title='Simulador de meta';const target=add('Valor da meta',6000),saved=add('Já guardado',0),months=add('Meses restantes',12);
    calc=()=>{const t=parseMoney(target.value),s=parseMoney(saved.value),m=Math.max(1,parseMoney(months.value)),left=Math.max(0,t-s);result.replaceChildren(metric('Falta',money(left)),metric('Por mês',money(left/m),'good'),metric('Progresso',t>0?`${Math.min(100,Math.round(s/t*100))}%`:'0%'));};
  }else if(profile==='personal'&&type==='debt'){
    title='Comparar custo de uma dívida';const principal=add('Valor que recebeu/usou',1000),total=add('Total que vai pagar',1400),months=add('Número de parcelas',10);
    calc=()=>{const p=parseMoney(principal.value),t=parseMoney(total.value),m=Math.max(1,parseMoney(months.value)),cost=t-p;result.replaceChildren(metric('Custo além do principal',money(cost),cost>0?'warn':''),metric('Parcela média',money(t/m)),metric('Acréscimo total',p>0?`${Math.round(cost/p*100)}%`:'—'));};
  }else if(profile==='couple'&&type==='split'){
    title='Simulador de divisão do casal';const a=add('Renda da pessoa A',3000),b=add('Renda da pessoa B',2000),expense=add('Gasto compartilhado',1000);
    calc=()=>{const av=parseMoney(a.value),bv=parseMoney(b.value),e=parseMoney(expense.value),sum=av+bv,pa=sum>0?e*av/sum:e/2,pb=sum>0?e*bv/sum:e/2;result.replaceChildren(metric('50/50 por pessoa',money(e/2)),metric('Proporcional · A',money(pa),'good'),metric('Proporcional · B',money(pb),'good'),h('p.life-sim-note','Nenhuma regra é automaticamente a “correta”. Usem a simulação para conversar e escolher o acordo de vocês.'));};
  }else if(profile==='couple'&&type==='goal'){
    title='Simulador de meta conjunta';const target=add('Valor da meta',12000),saved=add('Já juntaram',2000),months=add('Meses restantes',10),share=add('Participação da pessoa A',50,'%');
    calc=()=>{const t=parseMoney(target.value),s=parseMoney(saved.value),m=Math.max(1,parseMoney(months.value)),p=Math.max(0,Math.min(100,parseMoney(share.value)))/100,left=Math.max(0,t-s),monthly=left/m;result.replaceChildren(metric('Casal por mês',money(monthly),'good'),metric('Pessoa A',money(monthly*p)),metric('Pessoa B',money(monthly*(1-p))),metric('Falta',money(left)));};
  }else return;
  fields.forEach(f=>f.input.addEventListener('input',calc));
  openSheet({wide:true,label:title,content:h('div.life-simulator',h('div.life-sim-hero',{class:profile},h('small','SIMULADOR DIDÁTICO'),h('h2',title),h('p','Mude os valores e veja o efeito na hora. O objetivo é aprender antes de decidir.')),h('div.life-sim-form',...fields.map(f=>f.node)),result)});calc();
}
