/* Órbita: aprendizado separado dos cálculos e dos registros financeiros. */
import * as store from './store.js';
import * as F from './finance.js';
import { today, isoWeek } from './util.js';

export const LEARNING_SCHEMA = 1;
export const LEARNING_GOALS = {
  personal: [
    { id:'expenses', icon:'↗', title:'Organizar meus gastos', detail:'Entender o mês e decidir com clareza.', path:['foundation','record','commitments','budget','decision','reserve','review'] },
    { id:'cards', icon:'▣', title:'Entender meus cartões', detail:'Enxergar a fatura e o que vem depois.', path:['foundation','cards','commitments','decision','budget','reserve','review'] },
    { id:'debt', icon:'◈', title:'Organizar minhas dívidas', detail:'Proteger o essencial e entender o custo.', path:['foundation','debt','commitments','budget','decision','reserve','review'] },
    { id:'reserve', icon:'✧', title:'Começar minha reserva', detail:'Construir proteção no meu ritmo.', path:['foundation','reserve','budget','record','commitments','decision','review'] }
  ],
  couple: [
    { id:'household', icon:'⌂', title:'Organizar a casa', detail:'Planejar juntos e manter a autonomia.', path:['shared','communication','split','commitments','budget','reserve','review'] },
    { id:'fairness', icon:'⇄', title:'Dividir com clareza', detail:'Escolher um acordo que faça sentido.', path:['shared','split','communication','budget','commitments','reserve','review'] },
    { id:'protection', icon:'✧', title:'Criar uma reserva a dois', detail:'Dar segurança aos planos da casa.', path:['shared','reserve','split','budget','communication','commitments','review'] }
  ],
  company: [
    { id:'cash', icon:'↗', title:'Entender meu caixa', detail:'Separar dinheiro disponível de resultado.', path:['foundation','record','cashflow','costs','margin','reserve','review'] },
    { id:'profit', icon:'◈', title:'Entender meu lucro', detail:'Conhecer o custo antes de definir o preço.', path:['foundation','costs','margin','pricing','cashflow','reserve','review'] },
    { id:'stability', icon:'✧', title:'Proteger meu negócio', detail:'Planejar compromissos e capital de giro.', path:['foundation','cashflow','costs','budget','reserve','pricing','review'] }
  ]
};

const lesson = (title, concept, example, question, options, correct, feedback, exercise, task, actionLabel) => ({title,concept,example,question,options,correct,feedback,exercise,task,actionLabel});
export const LEARNING_LESSONS = {
  foundation:lesson('Seu saldo tem destinos', 'O saldo mostra dinheiro disponível agora. Uma parte pode já ter destino: contas, faturas e proteção. Antes de gastar, olhe o que vence até a próxima entrada.', 'Você tem R$ 1.200 e compromissos de R$ 800. Sobram R$ 400 antes de considerar outros gastos ainda não registrados.', 'Com R$ 1.200 na conta e R$ 800 reservados para contas, quanto sobra antes de novos gastos?', ['R$ 1.200, porque está na conta','R$ 400, considerando essas contas','R$ 800, porque é o valor das contas'],1,'Saldo e dinheiro livre são diferentes. O cálculo só conhece os compromissos que você informou.','free','balance','Conferir meu ponto de partida'),
  record:lesson('Registre para enxergar', 'Um registro representa algo que aconteceu ou foi programado. Quando as informações ficam mais completas, o total pode subir sem que seu comportamento tenha piorado.', 'Se você gastou R$ 20 ontem e só anotou hoje, o gasto aconteceu ontem. A data correta ajuda a entender seu mês.', 'O total de gastos aumentou depois de importar seu extrato. O que isso pode significar?', ['Que você necessariamente gastou mais hoje','Que o app criou uma dívida','Que registros antes ausentes ficaram visíveis'],2,'Mais informação pode explicar o aumento. Compare períodos com registros igualmente completos.','free','record','Registrar ou revisar um gasto'),
  commitments:lesson('O futuro já ocupa espaço', 'Contas e parcelas futuras precisam entrar no planejamento. Uma previsão não inclui despesas que ainda não foram cadastradas.', 'R$ 600 em contas conhecidas deixam R$ 600 de um saldo de R$ 1.200. Uma conta esquecida de R$ 200 muda essa estimativa.', 'Uma previsão sem contas cadastradas significa que não há contas para pagar?', ['Não. Ela pode estar incompleta','Sim. O app conhece todas as contas','Sim, desde que o saldo seja positivo'],0,'A previsão depende dos seus registros. Confira compromissos antes de usar o resultado para decidir.','free','commitments','Revisar meus compromissos'),
  budget:lesson('Dê um papel ao dinheiro', 'Orçamento é uma escolha antecipada. Comece com limites possíveis e poucas categorias; ajuste conforme aprende sobre sua rotina.', 'De uma renda de R$ 3.000, R$ 1.800 vão para essenciais e R$ 300 para uma meta. Restam R$ 900 para outros usos.', 'Um orçamento que você não consegue cumprir deve ser:', ['Mantido a qualquer custo','Revisto com base na sua realidade','Abandonado para sempre'],1,'Um orçamento útil cabe na vida real. Revisar é parte do aprendizado.','budget','budget','Definir ou revisar meu orçamento'),
  cards:lesson('Parcela não apaga o total', 'Parcelar distribui um compromisso no tempo. O cartão não aumenta a renda. Observe o valor total, possíveis juros e as parcelas futuras.', 'Uma compra de R$ 1.200 em 12 parcelas sem juros custa R$ 100 por mês e compromete R$ 1.200 no total.', 'Uma compra de R$ 1.200 em 12 vezes de R$ 100 sem juros custa quanto no total?', ['R$ 100','R$ 1.200','Depende apenas do limite do cartão'],1,'A parcela cabe no mês, mas o compromisso total permanece. Com juros, confira o total final.','cards','cards','Conferir cartão e parcelas'),
  debt:lesson('Entenda o custo completo', 'Antes de comparar dívidas ou negociar, reúna saldo devido, prazo, parcelas e custo total. Uma parcela menor pode custar mais ao longo do tempo.', 'Você recebe R$ 1.000 e paga 12 parcelas de R$ 120. O total é R$ 1.440; a diferença de R$ 440 é custo, sem separar juros e taxas.', 'Para comparar duas propostas de dívida, o que precisa olhar?', ['Somente a parcela menor','Somente o prazo maior','Parcela, prazo e custo total, incluindo taxas'],2,'Compare o compromisso completo e preserve os gastos essenciais. Reduzir a parcela pode aumentar o total.','debt','debt','Revisar minhas pendências'),
  decision:lesson('Teste antes de decidir', 'Uma compra possível hoje pode apertar o mês seguinte. Simule o compromisso e confira se ainda há espaço para o essencial.', 'Uma despesa de R$ 200 reduz em R$ 200 o dinheiro livre estimado. O efeito depende de quando você paga e do que já está comprometido.', 'Um resultado positivo na simulação garante que você pode comprar?', ['Sim, qualquer valor','Não. Depende dos dados, imprevistos e prioridades','Sim, se houver limite no cartão'],1,'A simulação é apoio à decisão. Confira os dados e mantenha margem para o que ainda não sabe.','free','decision','Simular uma decisão'),
  reserve:lesson('Proteção tem um tamanho', 'A reserva ajuda a atravessar imprevistos. Comece com uma meta possível. O tamanho depende dos gastos essenciais, estabilidade da renda e suas responsabilidades.', 'R$ 1.800 de essenciais por mês × 3 meses = R$ 5.400 como cenário de proteção, não como obrigação igual para todos.', 'O tamanho da reserva deve considerar:', ['A realidade dos gastos e a estabilidade da renda','O mesmo valor fixo para qualquer pessoa','O limite do cartão como proteção'],0,'Use seus gastos essenciais como referência e adapte o prazo à sua realidade. Uma pequena primeira meta também é válida.','reserve','reserve','Criar ou revisar uma reserva'),
  review:lesson('Uma revisão, uma decisão', 'Revisar é olhar o que entrou, o que saiu e o que vem depois. Escolha uma decisão pequena. Um mês diferente não significa fracasso.', 'Você pode ter registrado mais gastos porque anotou melhor. Antes de concluir que perdeu o controle, confira a qualidade dos dados e os compromissos.', 'Ao revisar a semana, qual próximo passo é mais útil?', ['Escolher uma ação possível com base no que conferiu','Cobrar uma redução de gastos a qualquer custo','Avaliar apenas quantos dias abriu o app'],0,'O objetivo é decidir melhor. Registro, aprendizado e resultado financeiro são coisas diferentes.','free','review','Revisar minha semana'),
  shared:lesson('Compartilhar por escolha', 'O espaço do casal organiza o que pertence aos dois. Gastos pessoais continuam pessoais quando vocês não escolhem compartilhá-los.', 'Aluguel pode ser compartilhado; um gasto individual pode continuar separado. O acordo deve ser claro para os dois.', 'Criar um espaço do casal deve significar:', ['Expor automaticamente todos os dados pessoais','Combinar o que será compartilhado','Misturar dinheiro da empresa com a casa'],1,'Compartilhem de forma consciente. O Bivvo mantém os ambientes separados.','split','shared','Revisar nosso espaço'),
  communication:lesson('Conversa que vira acordo', 'Uma revisão curta deve tratar dos números e das decisões futuras. Evite transformar um gasto em acusação.', 'Uma conversa de 15 minutos pode terminar com um acordo: quem cuida da próxima conta e qual valor ficará para a meta.', 'Qual pergunta ajuda numa revisão a dois?', ['Quem é culpado pelo mês?','Como podemos decidir juntos o próximo compromisso?','Por que você nunca faz tudo certo?'],1,'Conversem sobre uma decisão concreta e combinem o próximo passo.','split','communication','Abrir o painel do casal'),
  split:lesson('Igual ou proporcional?', 'Dividir metade para cada um é uma opção. Dividir de acordo com a renda é outra. A regra deve considerar o acordo e a realidade de vocês.', 'Com rendas de R$ 3.000 e R$ 2.000, uma conta de R$ 1.500 fica em R$ 900 e R$ 600 na divisão proporcional.', 'Divisão proporcional considera:', ['A participação de cada renda no total','Sempre metade para cada pessoa','Somente quem fez a compra'],0,'Não existe uma regra universalmente justa. Compare os cenários e façam um acordo.','split','split','Comparar nossa divisão'),
  cashflow:lesson('Dinheiro tem data', 'Venda feita e dinheiro recebido são informações diferentes. Organize datas de entrada e saída para saber quando o caixa pode apertar.', 'Uma venda de R$ 2.000 para receber no próximo mês não paga uma conta que vence hoje.', 'Uma venda a prazo representa dinheiro disponível hoje?', ['Sempre','Só se a margem for positiva','Não, até o recebimento ocorrer'],2,'Resultado e caixa são diferentes. Confira quando o dinheiro realmente entra.','free','commitments','Revisar contas a pagar e receber'),
  costs:lesson('O custo vai além do produto', 'Inclua embalagem, taxas, comissão e outros custos ligados à venda. A estrutura fixa precisa ser coberta pelo que sobra das vendas.', 'Um produto de R$ 100 com R$ 55 de custos variáveis deixa R$ 45 para cobrir custos fixos e gerar resultado.', 'Além do fornecedor, que custo pode fazer parte de uma venda?', ['Taxas, embalagem e comissão','Nenhum outro','Todo gasto pessoal do dono'],0,'Custos variáveis acompanham a venda. Separe também os custos fixos e as finanças pessoais.','margin','costs','Revisar custos do negócio'),
  margin:lesson('O que sobra da venda', 'Margem de contribuição é o preço menos os custos variáveis. Esse valor ainda precisa ajudar a pagar os custos fixos.', 'R$ 100 de preço − R$ 55 de custos variáveis = R$ 45 de contribuição, ou 45% do preço.', 'R$ 45 de contribuição em uma venda são automaticamente lucro líquido?', ['Sim, sempre','Não. Ainda há custos fixos e outros itens','Só quando a venda é a prazo'],1,'Contribuição e lucro líquido são diferentes. Preserve espaço para estrutura, tributos e outras obrigações.','margin','margin','Conferir um produto ou serviço'),
  pricing:lesson('Preço com fundamento', 'Um preço precisa considerar custo, despesas, volume e contexto do negócio. Markup sobre custo e margem sobre preço são percentuais diferentes.', 'Custo de R$ 80 e preço de R$ 100 geram R$ 20 de diferença: 25% sobre o custo e 20% sobre o preço, antes de outros custos.', 'Markup e margem usam a mesma base?', ['Sim, sempre o custo','Sim, sempre a receita','Não: um usa custo e o outro preço'],2,'Compare percentuais na base correta e inclua todos os custos relevantes.','margin','pricing','Revisar minha precificação')
};

export function learningSpace(value) { return ['personal','couple','company'].includes(value) ? value : 'personal'; }
export function getLearningSpace(s=store.getState(), space='personal') { return s.profile?.learningJourneyV1?.spaces?.[learningSpace(space)] || {}; }
export function learningGoal(s=store.getState(), space='personal') { const p=learningSpace(space);return LEARNING_GOALS[p].find(g=>g.id===getLearningSpace(s,p).goal)||null; }
const validRecord = r => r && typeof r==='object' && !Array.isArray(r) ? r : {};
export function journeySnapshot(s=store.getState(), space='personal') {
  const p=learningSpace(space), data=getLearningSpace(s,p), goal=learningGoal(s,p);
  const steps=(goal?.path||[]).map((id,index)=>{const saved=validRecord(data.lessons?.[id]);return {id,index,...LEARNING_LESSONS[id],started:!!saved.startedAt,understood:!!saved.understoodAt,practiced:!!saved.practicedAt,applied:!!saved.understoodAt&&!!saved.practicedAt&&!!saved.appliedAt,evidence:saved.evidence||null};});
  const current=steps.find(x=>!x.applied)||null;
  return {space:p,goal,steps,current,understood:steps.filter(x=>x.understood).length,applied:steps.filter(x=>x.applied).length,total:steps.length,complete:!!goal&&!current,startedAt:data.startedAt||null};
}
function updateSpace(space, fn) {
  store.commit(s=>{const p=learningSpace(space);const existing=validRecord(s.profile.learningJourneyV1);const spaces=validRecord(existing.spaces);const data=validRecord(spaces[p]);const next={...data,lessons:{...validRecord(data.lessons)}};fn(next);s.profile.learningJourneyV1={schema:LEARNING_SCHEMA,spaces:{...spaces,[p]:next}};},{reason:'learning'});
}
export function chooseLearningGoal(id, space='personal') {
  const p=learningSpace(space), goal=LEARNING_GOALS[p].find(g=>g.id===id);if(!goal)throw Error('Escolha um objetivo válido.');
  if(learningGoal(store.getState(),p)?.id===id)return false;
  updateSpace(p,d=>{d.goal=id;d.startedAt ||= new Date().toISOString();d.goalChangedAt=new Date().toISOString();});return true;
}
function allowedLesson(id, space) {
  const snap=journeySnapshot(store.getState(),space), found=snap.steps.find(x=>x.id===id);
  if(!found || (!found.applied&&snap.current?.id!==id))throw Error('Conclua a missão atual antes de avançar.');return found;
}
export function startLearningLesson(id, space='personal') {
  const step=allowedLesson(id,space);if(step.started)return false;
  updateSpace(space,d=>{d.lessons[id]={...validRecord(d.lessons[id]),startedAt:new Date().toISOString()};});return true;
}
export function answerLearningLesson(id, choice, space='personal') {
  const step=allowedLesson(id,space);if(!Number.isInteger(choice)||choice<0||choice>=step.options.length)throw Error('Selecione uma resposta.');
  const correct=choice===step.correct;
  updateSpace(space,d=>{const old=validRecord(d.lessons[id]);d.lessons[id]={...old,startedAt:old.startedAt||new Date().toISOString(),attempts:Math.min(999,(Number(old.attempts)||0)+1),...(correct?{understoodAt:old.understoodAt||new Date().toISOString()}:{} )};});return {correct,changed:correct&&!step.understood};
}
export function practiceLearningLesson(id, space='personal') {
  const step=allowedLesson(id,space);if(!step.understood)throw Error('Responda à pergunta antes da simulação.');if(step.practiced)return false;
  updateSpace(space,d=>{d.lessons[id]={...validRecord(d.lessons[id]),practicedAt:new Date().toISOString()};});return true;
}

export function learningEvidence(id, s=store.getState(), space='personal') {
  const task=LEARNING_LESSONS[id]?.task;if(!task)return {ready:false,manual:false,label:'Missão inválida'};
  if(space==='couple')return {ready:false,manual:true,label:'Confira o espaço compartilhado e confirme o acordo. Seus dados pessoais não são usados nesta missão.'};
  const rows=s.transactions||[], fixed=s.fixed||[], company=space==='company';
  const evidence={
    balance:[F.hasBalanceBase(s),'Ponto de partida registrado'],
    record:[rows.some(t=>F.isSpend(t)&&!F.isOpening(t)),'Há um gasto registrado'],
    commitments:[fixed.some(t=>t.type==='expense')||s.cards?.length>0||rows.some(t=>t.type==='expense'&&t.status!=='Pago'),'Há compromissos registrados'],
    budget:[Object.values(s.budget_limits||{}).some(v=>Number(v)>0),'Há um limite de orçamento definido'],
    cards:[s.cards?.length>0,'Há um cartão cadastrado'],
    reserve:[s.goals?.some(g=>g.isReserve||/reserva/i.test(g.name||'')),'Há uma reserva cadastrada'],
    costs:[fixed.some(t=>t.type==='expense')||rows.some(t=>F.isSpend(t)),'Há custos registrados'],
    margin:[s.companyProducts?.length>0,'Há produto ou serviço cadastrado'],
    pricing:[s.companyProducts?.length>0,'Há produto ou serviço cadastrado']
  }[task];
  if(evidence)return {ready:!!evidence[0],manual:['record','commitments','cards','budget','reserve','costs','margin','pricing'].includes(task),label:evidence[0]?evidence[1]:'Complete a ação no Bivvo ou confira a alternativa disponível.',company};
  return {ready:false,manual:true,label:task==='review'?'Revise entradas, gastos e próximos compromissos.':'Faça a simulação ou revise a pendência e confirme o próximo passo.'};
}
export function applyLearningLesson(id, {confirmed=false,alternative=false}={}, space='personal') {
  const step=allowedLesson(id,space);if(!step.understood||!step.practiced)throw Error('Conclua a pergunta e a simulação primeiro.');
  if(!confirmed)throw Error('Confirme que você revisou a ação.');if(step.applied)return false;
  const evidence=learningEvidence(id,store.getState(),space);
  if(!evidence.ready&&!(evidence.manual&&alternative))throw Error('Complete a ação ou confirme a alternativa disponível.');
  updateSpace(space,d=>{const old=validRecord(d.lessons[id]);d.lessons[id]={...old,appliedAt:new Date().toISOString(),evidence:evidence.ready?'record-reviewed':'self-confirmed'};if(id==='review')d.lastReviewDate=today();});return true;
}
export function exerciseResult(type, value) {
  const n=Number(value);if(!Number.isFinite(n))throw Error('Informe um valor válido.');
  if(type==='cards'){const months=Math.min(12,Math.max(1,Math.round(n)));return {primary:1200/months,total:1200,months};}
  if(type==='reserve'){const months=Math.min(12,Math.max(1,Math.round(n)));return {primary:1800*months,months};}
  if(type==='debt'){const months=Math.min(24,Math.max(1,Math.round(n)));return {primary:120*months,total:120*months,cost:120*months-1000,months};}
  if(type==='split'){const income=Math.min(6000,Math.max(0,n));const total=income+2000;const a=1500*income/total;return {primary:a,other:1500-a,share:income/total};}
  if(type==='margin'){const cost=Math.min(100,Math.max(0,n));return {primary:100-cost,share:(100-cost)/100};}
  if(type==='budget'){const variable=Math.min(1500,Math.max(0,n));return {primary:3000-1800-300-variable,variable};}
  const committed=Math.min(1600,Math.max(0,n));return {primary:1200-committed,committed};
}

export function reviewLearningWeek(decision, space='personal') {
  if(!['records','bills','budget','reserve'].includes(decision))throw Error('Escolha um próximo passo válido.');
  if(journeySnapshot(store.getState(),space).applied<1)throw Error('Aplique uma missão antes da revisão.');
  const week=isoWeek(today()), existing=getLearningSpace(store.getState(),space).reviewWeeks?.[week];
  updateSpace(space,d=>{d.reviewWeeks={...validRecord(d.reviewWeeks),[week]:{at:new Date().toISOString(),decision}};});
  return !existing;
}
