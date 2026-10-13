/* Bivvo Empresa 11.60 — camada didática para quem está começando a empreender.
   Explica conceitos gerenciais; não substitui contabilidade, orientação fiscal ou jurídica. */
import {h,money,money0,num,parseMoney,round2} from '../util.js';
import {openSheet} from '../ui.js';
import {businessGuide} from '../company-metrics.js';

const META={
  revenue:{priority:'Essencial',cadence:'Acompanhe semanalmente e feche todo mês',right:['Registre todas as vendas, inclusive as feitas a prazo.','Separe venda operacional de aporte, empréstimo e reembolso.','Compare faturamento com margem e lucro — nunca use faturamento sozinho para decidir se “sobrou dinheiro”.'],mistakes:['Confundir faturamento com dinheiro recebido.','Achar que faturar mais significa lucrar mais.','Misturar aporte dos sócios com venda.']},
  variableCosts:{priority:'Essencial',cadence:'Revise por produto e todo mês',right:['Classifique mercadoria, matéria-prima, frete, embalagem, taxas, comissão e tributos ligados à venda.','Calcule por unidade quando possível.','Negocie primeiro os itens de maior peso.'],mistakes:['Considerar apenas o preço do fornecedor.','Jogar toda despesa como custo variável.','Ignorar taxa de cartão, marketplace, comissão e imposto sobre venda.']},
  contribution:{priority:'Essencial',cadence:'Revise mensalmente e antes de mexer em preço',right:['Calcule em reais e em percentual.','Compare produtos/serviços entre si.','Use a margem para saber quanto cada venda ajuda a pagar a estrutura fixa.'],mistakes:['Confundir margem com markup.','Olhar só o lucro total sem entender a margem por venda.','Dar desconto sem recalcular a margem.']},
  fixedOpex:{priority:'Essencial',cadence:'Revise todo mês',right:['Cadastre aluguel, folha, pró-labore, sistemas, contador e contratos recorrentes.','Separe gasto fixo de gasto diretamente ligado à venda.','Renegocie custos grandes antes de cortar pequenas despesas irrelevantes.'],mistakes:['Não incluir pró-labore.','Misturar compra de estoque com despesa fixa.','Criar estrutura fixa antes de ter receita previsível.']},
  ebitda:{priority:'Avançado',cadence:'Fechamento mensal',right:['Use como visão operacional, não como saldo bancário.','Compare evolução ao longo dos meses.','Valide a DRE contábil com contador quando precisar de números oficiais.'],mistakes:['Tratar EBITDA aproximado como lucro líquido contábil.','Usar o indicador sem conferir a classificação das despesas.']},
  netProfit:{priority:'Essencial',cadence:'Fechamento mensal',right:['Calcule só depois de classificar custos e despesas.','Compare com faturamento para entender a margem final.','Reserve caixa para impostos, capital de giro e reinvestimento antes de retirar tudo.'],mistakes:['Retirar todo o lucro do caixa.','Confundir lucro com saldo bancário.','Ignorar despesas financeiras e custos pequenos recorrentes.']},
  cash:{priority:'Essencial',cadence:'Olhe diariamente',right:['Mantenha entradas e saídas com status Pago/Pendente corretos.','Separe conta pessoal e conta da empresa.','Mantenha reserva de caixa para cobrir os ciclos entre pagar e receber.'],mistakes:['Gastar o saldo atual sem olhar contas futuras.','Registrar venda a prazo como dinheiro já recebido.','Misturar PIX pessoal e empresarial sem registrar.']},
  receivable:{priority:'Essencial',cadence:'Olhe 2–3 vezes por semana',right:['Registre vencimento e cliente.','Faça cobrança antes e depois do vencimento com rotina definida.','Evite concentração excessiva em um único cliente.'],mistakes:['Só cobrar quando o caixa aperta.','Não registrar vendas a prazo.','Não acompanhar atrasos por idade.']},
  payable:{priority:'Essencial',cadence:'Olhe 2–3 vezes por semana',right:['Cadastre vencimentos assim que assumir o compromisso.','Priorize impostos, folha e despesas que interrompem a operação.','Negocie prazo antes de vencer, não depois.'],mistakes:['Usar o saldo de hoje sem descontar contas já assumidas.','Deixar impostos fora do calendário.']},
  cashProjection:{priority:'Essencial',cadence:'Olhe semanalmente',right:['Mantenha contas a receber/pagar atualizadas.','Use cenário conservador para recebimentos incertos.','Tome ação antes da data em que a curva fica negativa.'],mistakes:['Projetar recebimento sem considerar atraso.','Esquecer fatura de cartão e impostos.','Olhar apenas o mês atual.']},
  workingCapital:{priority:'Essencial',cadence:'Revise toda semana',right:['Acompanhe quanto tempo existe entre pagar e receber.','Mantenha uma reserva operacional antes de aumentar retiradas dos sócios.','Negocie prazos de fornecedores e clientes para reduzir o aperto de caixa.'],mistakes:['Confundir saldo de hoje com dinheiro livre.','Financiar clientes com prazo longo sem ter caixa para sustentar a operação.','Retirar do caixa o dinheiro que pagaria fornecedores e impostos.']},
  breakEven:{priority:'Essencial',cadence:'Revise todo mês ou quando preço/custo mudar',right:['Use uma margem de contribuição realista.','Inclua a estrutura fixa mensal.','Converta a meta em quantidade de vendas quando isso ajudar a equipe.'],mistakes:['Usar margem bruta no lugar da margem de contribuição.','Esquecer custos fixos.','Achar que atingir o ponto de equilíbrio significa “lucro alto”.']},
  ticket:{priority:'Importante',cadence:'Acompanhe semanal/mensalmente',right:['Calcule com vendas comparáveis.','Analise ticket junto com número de vendas.','Teste combos, upsell e complementos sem destruir margem.'],mistakes:['Aumentar ticket com desconto excessivo.','Misturar vendas muito diferentes e tirar conclusões erradas.']},
  costMix:{priority:'Importante',cadence:'Revise todo mês',right:['Ataque primeiro categorias de maior peso.','Compare peso percentual, não só valor absoluto.','Investigue causa antes de cortar.'],mistakes:['Cortar despesa pequena enquanto o maior custo segue sem negociação.','Reduzir gasto que gera venda sem medir retorno.']},
  aging:{priority:'Essencial',cadence:'Olhe semanalmente',right:['Separe a vencer, 1–7, 8–30 e 31+ dias.','Tenha uma régua de cobrança.','Revise limite/prazo de clientes reincidentes.'],mistakes:['Somar tudo a receber sem olhar atraso.','Confiar no faturamento sem avaliar qualidade do recebimento.']},
  revenueSource:{priority:'Importante',cadence:'Revise mensal/trimestralmente',right:['Veja quanto cada canal/cliente representa.','Busque diversificação quando a dependência for perigosa.','Compare margem por origem, não só faturamento.'],mistakes:['Depender de um único cliente sem plano B.','Diversificar demais antes de dominar o canal principal.']},
  costStructure:{priority:'Essencial',cadence:'Revise todo mês',right:['Saiba qual parte da estrutura é fixa.','Mantenha custo fixo compatível com receita recorrente.','Prefira custo variável quando ainda estiver validando o negócio.'],mistakes:['Assumir aluguel, equipe ou contratos longos cedo demais.','Confundir recorrente com inevitável.']},
  target:{priority:'Importante',cadence:'Acompanhe semanalmente',right:['Crie meta baseada em ponto de equilíbrio + lucro desejado.','Quebre a meta por semana/dia e por número de vendas.','Acompanhe margem junto da meta.'],mistakes:['Criar meta “redonda” sem base.','Bater faturamento com desconto que elimina lucro.']},
  health:{priority:'Resumo',cadence:'Use como triagem',right:['Abra os indicadores individuais antes de agir.','Considere tendência, não apenas a nota de um único dia.'],mistakes:['Tomar decisão só pela nota.','Tratar o índice interno como métrica contábil oficial.']},
  taxes:{priority:'Essencial',cadence:'Calendário mensal',right:['Separe dinheiro de imposto assim que vender, quando aplicável.','Cadastre vencimentos e regime/obrigações com apoio do contador.','Não use dinheiro reservado para tributos como “caixa livre”.'],mistakes:['Esperar o imposto vencer para separar dinheiro.','Aplicar uma alíquota genérica sem conferir regime tributário.']},
  pricing:{priority:'Essencial',cadence:'Revise sempre que custo/taxa mudar',right:['Some custo direto, custos percentuais e rateio de estrutura.','Defina margem alvo antes de dar desconto.','Teste preço mínimo e preço de mercado juntos.'],mistakes:['Preço = custo do fornecedor + “qualquer porcentagem”.','Copiar concorrente sem saber sua própria estrutura.','Confundir markup com margem.']},
  productProfit:{priority:'Essencial',cadence:'Revise mensalmente',right:['Acompanhe margem e lucro total por produto/serviço.','Considere volume vendido e custo real.','Dê mais espaço aos itens que geram contribuição saudável, não apenas aos campeões de venda.'],mistakes:['Achar que produto que mais vende é o mais lucrativo.','Ignorar frete, taxa, comissão e rateio.']},
  stock:{priority:'Importante',cadence:'Semanalmente para quem vende produto',right:['Defina estoque mínimo e acompanhe giro.','Olhe estoque a custo como dinheiro parado.','Evite ruptura sem comprar além da demanda provável.'],mistakes:['Comprar por “desconto” sem previsão de venda.','Olhar estoque só em quantidade e esquecer capital imobilizado.']},
  proLabore:{priority:'Essencial',cadence:'Defina e revise mensalmente',right:['Defina uma retirada compatível com o caixa e a função dos sócios.','Registre pró-labore separado de distribuição/retirada extraordinária.','Não pague despesas pessoais direto pela conta da empresa sem registrar.'],mistakes:['Usar a conta da empresa como carteira pessoal.','Retirar tudo o que entra.','Mudar pró-labore toda semana conforme o saldo.']},
  pfPj:{priority:'Essencial',cadence:'Regra permanente',right:['Tenha conta/caixa da empresa separado do pessoal.','Registre aporte e retirada de sócios como movimentos próprios.','Pague despesas pessoais no perfil Pessoal e despesas da empresa no perfil Empresa.'],mistakes:['Misturar PIX pessoal e PJ.','Tratar aporte como faturamento.','Pagar conta pessoal e lançar como custo da empresa.']},
  budget:{priority:'Importante',cadence:'Planeje no início do mês e acompanhe semanalmente',right:['Defina limite principalmente para categorias relevantes e controláveis.','Compare gasto real com orçamento e ritmo do mês.','Ajuste o plano quando a realidade mudar — sem esconder o estouro.'],mistakes:['Criar limite para tudo e não acompanhar nada.','Cortar marketing automaticamente sem medir retorno.']},
  recurring:{priority:'Essencial',cadence:'Revise todo mês',right:['Cadastre tudo que se repete, inclusive contratos anuais rateados.','Separe receita recorrente de venda eventual.','Use a lista para calcular o tamanho mínimo da estrutura.'],mistakes:['Esquecer gastos anuais.','Confundir custo recorrente com custo variável por venda.']},
  dre:{priority:'Essencial',cadence:'Fechamento mensal',right:['Leia de cima para baixo: faturamento → custos variáveis → margem → despesas → resultado.','Corrija categorias erradas antes de interpretar.','Use para decisão gerencial e valide a contabilidade oficial com seu contador.'],mistakes:['Montar DRE usando apenas movimentos bancários sem competência.','Misturar aporte/empréstimo com receita operacional.']}
};

function meta(key){return META[key]||{priority:'Importante',cadence:'Acompanhe periodicamente',right:[],mistakes:[]};}
function pct(v){return Number.isFinite(Number(v))?`${(Number(v)*100).toFixed(1).replace('.',',')}%`:'—';}
function exampleFor(key,c={}){
  const revenue=num(c.revenue),variable=num(c.variableCosts),contribution=c.contribution!=null?num(c.contribution):revenue-variable,fixed=num(c.fixedExpenses),net=num(c.netProfit);
  if(key==='revenue'&&c.revenue!=null)return `No período selecionado, o Bivvo encontrou ${money0(revenue)} de faturamento. Isso é venda registrada — não significa necessariamente que todo esse dinheiro já entrou no caixa.`;
  if(key==='variableCosts'&&c.variableCosts!=null)return `Com faturamento de ${money0(revenue)} e custos variáveis de ${money0(variable)}, sobram ${money0(contribution)} antes de pagar a estrutura fixa.`;
  if(key==='contribution'&&c.revenue!=null)return revenue>0?`Se o faturamento foi ${money0(revenue)} e os custos variáveis foram ${money0(variable)}, a contribuição é ${money0(contribution)}, ou ${pct(contribution/revenue)} do faturamento.`:'Ainda não há faturamento suficiente para formar um exemplo com seus dados.';
  if(key==='fixedOpex'&&c.fixedExpenses!=null)return `A estrutura fixa/operacional considerada no período soma ${money0(fixed)}. Esse valor precisa ser sustentado pela margem de contribuição.`;
  if(key==='ebitda'&&c.ebitda!=null)return `A leitura operacional aproximada do Bivvo está em ${money0(c.ebitda)} no período.`;
  if(key==='netProfit'&&c.netProfit!=null)return `Depois dos custos e despesas classificados, o resultado gerencial está em ${money0(net)}. Isso não é o mesmo que o saldo disponível no banco.`;
  if(key==='cash'&&c.cash!=null)return `Seu caixa atual está em ${money0(c.cash)}. Antes de considerar esse valor “livre”, compare com ${money0(c.payable||0)} a pagar e com a projeção dos próximos dias.`;
  if(key==='receivable'&&c.receivable!=null)return `Há ${money0(c.receivable)} a receber. A parte vencida merece prioridade porque faturamento só ajuda o caixa quando vira recebimento.`;
  if(key==='payable'&&c.payable!=null)return `Há ${money0(c.payable)} de compromissos pendentes. Esse dinheiro já deve ser tratado como comprometido na decisão de gasto.`;
  if(key==='cashProjection'&&c.projectedCash!=null)return `Com as entradas e saídas futuras cadastradas, o Bivvo projeta ${money0(c.projectedCash)} de caixa ao final da janela analisada.`;
  if(key==='workingCapital')return `Caixa ${money0(c.cash||0)} + a receber ${money0(c.receivable||0)} − a pagar ${money0(c.payable||0)} = ${money0(num(c.cash)+num(c.receivable)-num(c.payable))} de folga simples de curto prazo nos dados cadastrados.`;
  if(key==='breakEven'&&c.breakEven!=null)return c.breakEven>0?`Com a margem e estrutura atuais, o ponto de equilíbrio estimado é ${money0(c.breakEven)} por mês. Abaixo disso, a operação tende a não cobrir a estrutura cadastrada.`:'Ainda não há margem positiva suficiente para estimar o ponto de equilíbrio.';
  if(key==='ticket'&&c.ticket!=null)return `O ticket médio do período está em ${money0(c.ticket)} para ${num(c.salesCount)} venda(s) registrada(s).`;
  if(key==='costMix'&&c.categoryValue!=null)return `A categoria selecionada soma ${money0(c.categoryValue)} e representa aproximadamente ${pct(c.share)} do total analisado.`;
  if(key==='aging'&&c.overdue!=null)return `Hoje existem ${money0(c.overdue)} em recebíveis vencidos dentro do recorte informado.`;
  if(key==='revenueSource'&&c.sourceValue!=null)return `A principal origem representa ${money0(c.sourceValue)} (${pct(c.share)}) do faturamento. Quanto maior a concentração, maior a dependência dessa fonte.`;
  if(key==='costStructure'&&c.fixed!=null)return `Dos ${money0(num(c.fixed)+num(c.variable))} analisados, ${money0(c.fixed)} são classificados como fixos e ${money0(c.variable)} como variáveis.`;
  if(key==='target'&&c.target!=null)return `Meta acumulada: ${money0(c.target)}. Realizado: ${money0(c.revenue||0)}. Falta: ${money0(Math.max(0,num(c.target)-num(c.revenue)))}.`;
  if(key==='health'&&c.score!=null)return `O índice interno está em ${c.score}/100. Ele serve para indicar onde olhar primeiro; a decisão vem dos indicadores individuais.`;
  if(key==='pricing'&&c.sale!=null)return `Preço de venda ${money0(c.sale)} − custo variável ${money0(c.variableCost||0)} = ${money0(c.contribution||0)} de contribuição por unidade.`;
  if(key==='productProfit'&&c.productName)return `${c.productName}: venda ${money0(c.sale||0)}, custo real ${money0(c.realCost||0)}, lucro unitário estimado ${money0(c.unitProfit||0)} e margem de contribuição ${pct(c.contributionMargin)}.`;
  if(key==='stock'&&c.inventoryValue!=null)return `O estoque cadastrado representa cerca de ${money0(c.inventoryValue)} a custo. Isso é capital imobilizado até que os itens sejam vendidos.`;
  if(key==='budget'&&c.spent!=null)return `Foram gastos ${money0(c.spent)} de ${money0(c.limit||0)} planejados. Use o limite como sinal para investigar, não como desculpa para deixar de pagar algo essencial.`;
  if(key==='dre'&&c.revenue!=null)return `Sua sequência atual é: faturamento ${money0(revenue)} → custos variáveis ${money0(variable)} → contribuição ${money0(contribution)} → estrutura ${money0(fixed)} → resultado gerencial ${money0(net)}.`;
  return 'Use seus lançamentos reais no Bivvo para transformar a fórmula em uma leitura do seu próprio negócio.';
}


function interpretFor(key,c={}){
  const revenue=num(c.revenue),variable=num(c.variableCosts),contribution=c.contribution!=null?num(c.contribution):revenue-variable;
  const margin=c.contributionMargin!=null?num(c.contributionMargin):(revenue?contribution/revenue:0);
  const fixed=num(c.fixedExpenses),cash=num(c.cash),payable=num(c.payable),receivable=num(c.receivable),projected=num(c.projectedCash),net=num(c.netProfit);
  if(key==='revenue')return 'Não existe um faturamento “bom” universal. Ele só é saudável quando cresce sem destruir margem, cabe na capacidade da operação e vira caixa no prazo esperado.';
  if(key==='variableCosts')return revenue?`Hoje os custos variáveis representam cerca de ${pct(variable/revenue)} do faturamento. O importante é comparar com sua própria margem, concorrência e histórico; custo baixo que piora qualidade também pode sair caro.`:'Primeiro registre vendas e custos de forma consistente. Depois compare o peso dos custos no faturamento e por produto.';
  if(key==='contribution')return revenue?`Sua margem de contribuição está em ${pct(margin)}. Não há uma porcentagem ideal para todo setor: ela precisa ser suficiente para pagar ${money0(fixed)} de estrutura e ainda deixar resultado positivo.`:'Sem faturamento e custos classificados, não há base confiável para dizer se a margem está boa.';
  if(key==='fixedOpex')return 'Estrutura fixa não deve ser julgada apenas por ser “alta” ou “baixa”. Ela precisa caber na margem gerada de forma recorrente. Custos que sustentam venda e qualidade podem ser necessários; desperdício não.';
  if(key==='ebitda')return num(c.ebitda)>=0?'O resultado operacional está positivo nos dados cadastrados. Compare vários meses e confirme se isso também vira caixa.':'O resultado operacional está negativo. Revise margem, custos fixos e classificação antes de tentar crescer faturamento a qualquer custo.';
  if(key==='netProfit')return net>=0?'O resultado gerencial está positivo. Antes de retirar tudo, preserve impostos, capital de giro e reinvestimentos planejados.':'O resultado está negativo. Descubra primeiro se a causa é preço/margem, volume insuficiente ou estrutura fixa alta.';
  if(key==='cash')return cash>=payable?'O caixa atual cobre os compromissos pendentes cadastrados, mas ainda vale olhar datas e projeção.':'O caixa atual é menor que o total a pagar cadastrado. Priorize calendário, cobrança e negociação antes de assumir novos gastos.';
  if(key==='receivable')return receivable?`Há ${money0(receivable)} a receber. A qualidade é melhor quando a maior parte está dentro do prazo e distribuída entre clientes, sem concentração excessiva.`:'Sem valores a receber pendentes no contexto atual. Continue registrando prazo e cliente nas vendas a prazo.';
  if(key==='payable')return payable?`Há ${money0(payable)} a pagar. O sinal saudável é ter previsão de caixa suficiente antes dos vencimentos, sem depender de improviso.`:'Não há compromissos pendentes no contexto atual. Mantenha recorrências e vencimentos cadastrados.';
  if(key==='cashProjection')return projected>=0?'A projeção cadastrada termina positiva. Ainda teste um cenário conservador para recebimentos incertos.':'A projeção termina negativa. A ação deve acontecer antes da data do buraco: cobrar, adiar/negociar saída, reduzir gasto ou reforçar capital de giro.';
  if(key==='workingCapital')return projected>=0?'Seu caixa de curto prazo está positivo com os compromissos cadastrados. Ainda assim, acompanhe o ciclo entre pagar fornecedores e receber clientes.':'Seu capital de giro está pressionado: as saídas de curto prazo superam o caixa e os recebimentos previstos. Antecipe ações antes do vencimento.';
  if(key==='breakEven')return c.breakEven>0&&revenue?`${revenue>=num(c.breakEven)?'Você está acima':'Você está abaixo'} do ponto de equilíbrio estimado no recorte. Use isso como referência gerencial, não como meta única de crescimento.`:'O ponto de equilíbrio precisa de margem positiva e estrutura fixa bem cadastrada.';
  if(key==='ticket')return 'Ticket médio não é “quanto maior, melhor” sozinho. Compare junto com quantidade de vendas, frequência, margem e taxa de conversão.';
  if(key==='costMix')return 'Uma categoria merece atenção quando ganha peso sem explicar aumento de vendas, capacidade ou qualidade. Corte por retorno, não por tamanho isolado.';
  if(key==='aging')return 'Recebíveis antigos são mais críticos que os a vencer. O melhor cenário é pouca inadimplência e uma rotina de cobrança previsível.';
  if(key==='revenueSource')return 'Receita concentrada demais em um cliente/canal aumenta risco. Diversificar faz sentido quando não destrói foco, margem ou eficiência.';
  if(key==='costStructure')return 'Mais custo fixo aumenta a necessidade de vender todo mês; mais custo variável reduz risco fixo, mas pode apertar a margem. O equilíbrio depende do modelo do negócio.';
  if(key==='target')return 'Meta boa é alcançável, ligada à capacidade e à margem. Faturar a meta com preço ruim ou desconto excessivo não é vitória.';
  if(key==='health')return 'Use o índice como sinal de prioridade, nunca como diagnóstico único. Abra os componentes que puxaram a nota para baixo.';
  if(key==='pricing')return 'Preço saudável cobre todos os custos variáveis, contribui para a estrutura e ainda faz sentido para o cliente/mercado. “Preço do concorrente” sozinho não calcula sua margem.';
  if(key==='productProfit')return 'Produto saudável combina margem positiva, volume, giro e baixa necessidade de capital. Compare lucro total e contribuição, não apenas faturamento.';
  if(key==='stock')return 'Estoque bom é o suficiente para atender a demanda sem imobilizar caixa demais. A referência deve vir do giro, prazo de reposição e risco de ruptura.';
  if(key==='proLabore')return 'Pró-labore sustentável cabe no caixa e na capacidade do negócio. Não deve variar toda vez que entra uma venda nem consumir o dinheiro necessário à operação.';
  if(key==='pfPj')return 'O cenário correto é conseguir explicar cada transferência entre sócio e empresa como aporte, pró-labore, reembolso ou retirada — nunca como movimentação “sem nome”.';
  if(key==='budget')return 'Orçamento funciona quando ajuda a decidir antes do gasto. Estourar uma categoria essencial pode ser justificável; ignorar o desvio sem entender a causa não é.';
  if(key==='recurring')return 'A estrutura recorrente é saudável quando a margem de contribuição consegue pagá-la com folga na maior parte dos meses, sem depender de dívida para fechar rotina.';
  if(key==='dre')return 'Leia tendência e relações entre linhas, não só o último número. Faturamento pode subir enquanto margem e resultado pioram — por isso a sequência completa importa.';
  if(key==='taxes')return 'O saudável é imposto previsto, provisionado e pago no prazo. Percentuais e obrigações variam por regime; não use um benchmark genérico como regra tributária.';
  return 'Compare com seu histórico, com a capacidade do negócio e com a lógica econômica da operação. Indicadores isolados raramente têm uma faixa universal.';
}

function lessonBox(icon,title,content,cls=''){
  return h('section.company-lesson-box'+(cls?'.'+cls:''),h('div.company-lesson-box-head',h('span',icon),h('b',title)),typeof content==='string'?h('p',content):content);
}
function bulletList(items){return h('ul.company-lesson-list',...(items||[]).map(x=>h('li',x)));}

export function openBusinessLesson(key,context={}){
  const g=businessGuide(key);if(!g)return;
  const m=meta(key);
  const content=h('div.company-lesson-modal',
    h('div.company-lesson-hero',h('span.company-lesson-icon',g.icon||'📘'),h('div',h('small','BIVVO ESCOLA DO EMPREENDEDOR'),h('h2',g.title),h('p',g.what)),h('div.company-lesson-badges',h('span.priority',m.priority),h('span',m.cadence))),
    h('div.company-lesson-grid',
      lessonBox('💡','Por que isso importa',g.importance||'Ajuda o dono a tomar decisões melhores.'),
      lessonBox('🧮','Como calcular',h('div.company-formula-card',...(String(g.formula||'').split('\n').map(x=>h('code',x))))),
      lessonBox('📌','Exemplo com seus dados',exampleFor(key,context),'example')),
    lessonBox('🩺','Como saber se está bom?',interpretFor(key,context),'interpret'),
    h('div.company-lesson-grid.two',lessonBox('✅','Jeito certo de fazer',bulletList(m.right),'good'),lessonBox('⚠️','Erros comuns',bulletList(m.mistakes),'warn')),
    lessonBox('🎯','O que fazer na prática',g.action||'Acompanhe a evolução e tome uma ação de cada vez.','action'),
    h('p.company-lesson-disclaimer','Conteúdo de gestão para aprendizado e tomada de decisão. Regras fiscais, contábeis, trabalhistas e tributárias variam por empresa e regime; confirme obrigações oficiais com seu contador ou profissional responsável.'));
  openSheet({wide:true,label:`Aprenda: ${g.title}`,content});
}

export function lessonButton(key,context={},label='? Entenda'){
  return h('button.company-learn-btn',{type:'button',onclick:e=>{e?.stopPropagation?.();openBusinessLesson(key,context);},'aria-label':`${label} ${businessGuide(key)?.title||''}`},label);
}

export function importanceBadge(key){const m=meta(key);return h('span.company-importance',{class:m.priority.toLowerCase().replace(/\s+/g,'-')},m.priority);}
export function cadenceText(key){return meta(key).cadence;}

const FIELD_HELP={
  name:{icon:'🏷️',title:'Nome do produto ou serviço',what:'É como você identifica o que vende. Use um nome claro para conseguir comparar margem e lucro de cada item.',importance:'Um cadastro bem identificado evita misturar produtos diferentes e ajuda a descobrir o que realmente dá dinheiro.',how:'Use o mesmo nome que você usa na venda, catálogo ou orçamento.',example:'Ex.: Camiseta Premium, Instalação de ar-condicionado, Corte masculino.'},
  category:{icon:'🗂️',title:'Categoria',what:'Agrupa produtos e serviços parecidos.',importance:'Facilita comparar desempenho por linha de produto e encontrar onde a empresa ganha ou perde margem.',how:'Crie grupos simples: Roupas, Alimentação, Consultoria, Instalação, Manutenção etc.',example:'Ex.: “Camiseta Premium” → categoria “Roupas”.'},
  purchaseCost:{icon:'📦',title:'Compra / matéria-prima / mão de obra direta',what:'É o custo principal para produzir ou entregar uma unidade.',importance:'É a base do custo. Se estiver errado, margem, markup, lucro e preço mínimo também ficam errados.',how:'Some somente o que pertence diretamente a uma unidade. Em serviço, use o custo direto de mão de obra quando fizer sentido.',example:'Você compra uma peça por R$ 50: informe R$ 50.'},
  freight:{icon:'🚚',title:'Frete por unidade',what:'É a parcela do transporte necessária para trazer ou entregar uma unidade.',importance:'Frete esquecido faz o produto parecer mais lucrativo do que é.',how:'Divida o frete total pela quantidade de unidades quando a compra vier em lote.',example:'Frete de R$ 100 para 20 unidades = R$ 5 por unidade.'},
  packaging:{icon:'📦',title:'Embalagem por unidade',what:'É o custo de caixa, saco, etiqueta, proteção ou material usado para entregar uma unidade.',importance:'Pequenos custos repetidos podem consumir bastante margem no mês.',how:'Some todos os materiais usados em uma venda e transforme em custo por unidade.',example:'Caixa R$ 1,20 + etiqueta R$ 0,30 = R$ 1,50 por unidade.'},
  otherDirect:{icon:'🧩',title:'Outros custos diretos',what:'São outros gastos que só existem porque aquela unidade foi vendida.',importance:'Evita deixar custos importantes fora da precificação.',how:'Inclua itens realmente ligados à entrega da unidade; não coloque aluguel ou contador aqui.',example:'Personalização, terceirização específica ou insumo adicional.'},
  salePrice:{icon:'💵',title:'Preço de venda',what:'É quanto o cliente paga por uma unidade do produto ou serviço.',importance:'É a referência usada para calcular margem, markup, taxas e lucro unitário.',how:'Informe o preço normal antes de descontos. Depois use o simulador de desconto para testar promoções.',example:'Se você vende por R$ 100, informe 100.'},
  cardFeePct:{icon:'💳',title:'Taxa de cartão / marketplace',what:'Percentual cobrado sobre a venda pelo meio de pagamento ou plataforma.',importance:'A taxa diminui diretamente o valor que sobra da venda.',how:'Use a taxa média real do canal. Se varia muito, faça um cenário conservador.',example:'Taxa de 4% numa venda de R$ 100 = R$ 4.'},
  taxPct:{icon:'🧾',title:'Impostos sobre a venda',what:'Percentual estimado de tributos que incidem sobre a venda.',importance:'Preço sem considerar imposto pode transformar venda em prejuízo.',how:'Use a alíquota efetiva informada pela sua apuração/contador. Regimes tributários variam.',example:'Alíquota efetiva de 6% numa venda de R$ 100 = R$ 6.'},
  commissionPct:{icon:'🤝',title:'Comissão',what:'Percentual pago a vendedor, parceiro ou canal quando a venda acontece.',importance:'Comissão é custo variável e reduz a margem de contribuição.',how:'Informe a porcentagem realmente paga sobre a venda.',example:'5% de comissão numa venda de R$ 100 = R$ 5.'},
  fixedAllocation:{icon:'🏢',title:'Rateio fixo por unidade',what:'É uma parcela estimada das despesas fixas atribuída a cada unidade.',importance:'Ajuda a visualizar se o preço também contribui para aluguel, folha, sistemas e estrutura.',how:'Pode ser estimado dividindo uma parte dos custos fixos pela quantidade esperada de unidades. Use como referência gerencial.',example:'R$ 3.000 de estrutura ÷ 300 unidades = R$ 10 por unidade.'},
  targetMarginPct:{icon:'🎯',title:'Margem desejada',what:'É a porcentagem que você quer que sobre da venda depois dos custos variáveis, antes de pagar a estrutura fixa.',importance:'Permite calcular um preço mínimo coerente em vez de escolher preço “no chute”.',how:'Defina uma meta realista e compare com mercado, posicionamento e capacidade do cliente pagar.',example:'Margem desejada de 30% significa tentar deixar R$ 30 de contribuição em cada R$ 100 vendidos.'},
  soldQty:{icon:'🧮',title:'Quantidade vendida no mês',what:'É quantas unidades você vendeu ou espera vender no período.',importance:'Transforma lucro unitário em impacto total no mês.',how:'Use quantidade real para analisar histórico e quantidade provável para simulações.',example:'Lucro de R$ 12 por unidade × 100 unidades = R$ 1.200.'},
  stockQty:{icon:'📦',title:'Estoque atual',what:'Quantidade disponível agora.',importance:'Mostra capital parado e ajuda a evitar falta ou excesso de mercadoria.',how:'Atualize quando houver compra, perda ou venda. Para serviços, esse campo não é necessário.',example:'25 unidades em estoque × custo de R$ 50 = R$ 1.250 imobilizados.'},
  minStock:{icon:'🔔',title:'Estoque mínimo',what:'É o nível em que você quer receber um alerta para recomprar.',importance:'Ajuda a evitar ruptura sem exagerar na compra.',how:'Considere velocidade de venda e prazo do fornecedor.',example:'Se vende 3/dia e fornecedor demora 5 dias, um mínimo pode começar perto de 15 unidades + segurança.'}
};

export function openBusinessFieldHelp(key){
  const f=FIELD_HELP[key];if(!f)return;
  openSheet({label:`Entenda: ${f.title}`,content:h('div.company-field-help',
    h('div.company-field-help-hero',h('span',f.icon),h('div',h('small','AJUDA DO BIVVO'),h('h2',f.title))),
    lessonBox('📘','O que é',f.what),lessonBox('🎯','Por que importa',f.importance),lessonBox('🧮','Como fazer',f.how),lessonBox('💡','Exemplo',f.example,'example'),
    h('p.company-lesson-disclaimer','Use esta explicação como orientação gerencial. Impostos, obrigações e critérios contábeis podem variar; valide regras oficiais com seu contador.'))});
}
export function fieldHelpButton(key,label='?'){
  const f=FIELD_HELP[key];return h('button.company-field-help-btn',{type:'button',onclick:e=>{e?.stopPropagation?.();openBusinessFieldHelp(key);},title:f?`Entenda ${f.title}`:'Ajuda','aria-label':f?`Entenda ${f.title}`:'Ajuda'},label);
}

function simulatorInput(label,value,{suffix='',hint=''}={}){
  const input=h('input.input',{type:'text',inputmode:'decimal',value:String(value??0).replace('.',','),'aria-label':label});
  return {input,node:h('label.company-sim-field',h('span',label),h('div.company-sim-input',input,suffix?h('b',suffix):null),hint?h('small',hint):null)};
}
function simMetric(label,value,tone=''){return h('article.company-sim-result-card'+(tone?'.'+tone:''),h('small',label),h('b',value));}
export function openBusinessSimulator(type,defaults={}){
  const defs={
    price:{title:'Simulador de preço ideal',icon:'🏷️',desc:'Descubra o preço mínimo para cobrir custo, taxas e a margem de contribuição desejada.'},
    profit:{title:'Simulador de lucro por produto',icon:'📈',desc:'Veja quanto um produto ou serviço pode gerar por unidade e no volume vendido.'},
    breakeven:{title:'Simulador de ponto de equilíbrio',icon:'🎯',desc:'Calcule quanto precisa faturar para pagar a estrutura antes de começar a gerar lucro.'},
    discount:{title:'Simulador de desconto',icon:'🏷️',desc:'Teste desconto antes de oferecer e veja o efeito na margem.'},
    target:{title:'Simulador de meta de faturamento',icon:'🚀',desc:'Descubra quanto precisa faturar para pagar a estrutura e alcançar um lucro desejado.'}
  };
  const d=defs[type];if(!d)return;
  const result=h('div.company-sim-results');let fields=[];
  const add=(label,value,opt)=>{const f=simulatorInput(label,value,opt);fields.push(f);return f.input;};
  let calculate=()=>{};
  if(type==='price'){
    const cost=add('Custo direto + rateio',defaults.cost||0,{hint:'R$ por unidade'}),rate=add('Taxas + impostos + comissão',defaults.ratePct||0,{suffix:'%'}),margin=add('Margem desejada',defaults.marginPct||20,{suffix:'%'});
    calculate=()=>{const c=parseMoney(cost.value),r=parseMoney(rate.value)/100,m=parseMoney(margin.value)/100,den=1-r-m,price=den>0?c/den:0;result.replaceChildren(simMetric('Preço mínimo sugerido',price?money(price):'—',price?'good':'bad'),simMetric('Custos percentuais',`${(r*100).toFixed(1).replace('.',',')}%`),simMetric('Margem desejada',`${(m*100).toFixed(1).replace('.',',')}%`),h('p.company-sim-explain',den>0?'Esse preço cobre o custo informado, os percentuais e deixa a margem escolhida. Compare também com o valor percebido e o mercado.':'Taxas + margem chegaram a 100% ou mais. Reduza os percentuais para existir um preço calculável.'));};
  }else if(type==='profit'){
    const price=add('Preço de venda',defaults.price||0),cost=add('Custo variável por unidade',defaults.variableCost||0),fixed=add('Rateio fixo por unidade',defaults.fixedAllocation||0),qty=add('Quantidade vendida',defaults.qty||1);
    calculate=()=>{const p=parseMoney(price.value),c=parseMoney(cost.value),f=parseMoney(fixed.value),q=parseMoney(qty.value),unit=p-c-f,total=unit*q,margin=p>0?unit/p:0;result.replaceChildren(simMetric('Lucro unitário estimado',money(unit),unit>=0?'good':'bad'),simMetric('Lucro no volume',money(total),total>=0?'good':'bad'),simMetric('Margem final',`${(margin*100).toFixed(1).replace('.',',')}%`,margin>0?'good':'bad'),h('p.company-sim-explain','Use essa leitura para comparar itens. Um produto pode vender menos e ainda gerar mais lucro total.'));};
  }else if(type==='breakeven'){
    const fixed=add('Custos/despesas fixas mensais',defaults.fixed||0),margin=add('Margem de contribuição média',defaults.marginPct||20,{suffix:'%'});
    calculate=()=>{const f=parseMoney(fixed.value),m=parseMoney(margin.value)/100,be=m>0?f/m:0;result.replaceChildren(simMetric('Faturamento para empatar',be?money(be):'—',be?'warn':'bad'),simMetric('Estrutura fixa',money(f)),simMetric('Margem usada',`${(m*100).toFixed(1).replace('.',',')}%`),h('p.company-sim-explain',be?'Acima desse faturamento começa a existir espaço para lucro, desde que as premissas continuem válidas.':'Informe uma margem positiva para calcular.'));};
  }else if(type==='discount'){
    const price=add('Preço atual',defaults.price||0),cost=add('Custo variável por unidade',defaults.variableCost||0),disc=add('Desconto que pretende dar',defaults.discountPct||10,{suffix:'%'});
    calculate=()=>{const p=parseMoney(price.value),c=parseMoney(cost.value),d=parseMoney(disc.value)/100,np=p*(1-d),before=p-c,after=np-c,margin=np>0?after/np:0,loss=before-after;result.replaceChildren(simMetric('Novo preço',money(np)),simMetric('Contribuição após desconto',money(after),after>=0?'good':'bad'),simMetric('Margem após desconto',`${(margin*100).toFixed(1).replace('.',',')}%`,margin>0?'good':'bad'),simMetric('Contribuição perdida/unidade',money(loss),loss>0?'warn':''),h('p.company-sim-explain',after>=0?'O desconto ainda deixa contribuição positiva. Confira se ela continua suficiente para pagar a estrutura fixa.':'Esse desconto faz o item ficar abaixo do custo variável informado.'));};
  }else if(type==='target'){
    const fixed=add('Custos fixos mensais',defaults.fixed||0),profit=add('Lucro que deseja no mês',defaults.profit||0),margin=add('Margem de contribuição média',defaults.marginPct||20,{suffix:'%'});
    calculate=()=>{const f=parseMoney(fixed.value),p=parseMoney(profit.value),m=parseMoney(margin.value)/100,target=m>0?(f+p)/m:0;result.replaceChildren(simMetric('Meta de faturamento sugerida',target?money(target):'—',target?'good':'bad'),simMetric('Ponto de equilíbrio',m>0?money(f/m):'—'),simMetric('Lucro desejado',money(p)),h('p.company-sim-explain',target?'Quebre essa meta por semanas, dias e quantidade de vendas. Depois acompanhe margem para não “bater meta” vendendo sem lucro.':'Informe uma margem positiva para calcular.'));};
  }
  fields.forEach(f=>{f.input.addEventListener('input',calculate);f.input.addEventListener('change',calculate);});
  const content=h('div.company-simulator',h('div.company-sim-hero',h('span',d.icon),h('div',h('small','SIMULADOR DIDÁTICO'),h('h2',d.title),h('p',d.desc))),h('div.company-sim-form',...fields.map(f=>f.node)),result,h('p.company-lesson-disclaimer','Simulação gerencial. Use como apoio à decisão e valide impostos, custos e obrigações específicas do seu negócio com profissionais responsáveis.'));
  openSheet({wide:true,label:d.title,content});calculate();
}

export function companyPageTutor(route){
  const cfg={
    inicio:{icon:'🎓',title:'Aprenda a ler o negócio',text:'Comece pela sequência faturamento → custos → margem → despesas → lucro. Depois confira caixa e contas futuras.',keys:['revenue','contribution','cash']},
    extrato:{icon:'↕',title:'Caixa: registre o que realmente entrou e saiu',text:'Venda e recebimento podem acontecer em dias diferentes. Use Pago/Pendente corretamente para a projeção não enganar.',keys:['cash','receivable','payable']},
    calendario:{icon:'📅',title:'Agenda: evite surpresa de caixa',text:'Cadastre vencimentos e recebimentos antes que aconteçam. O objetivo é descobrir o aperto com antecedência.',keys:['cashProjection','payable','taxes']},
    cartoes:{icon:'💳',title:'Cartão empresarial: custo futuro também é compromisso',text:'Compra no cartão adia a saída do dinheiro, mas não elimina o custo. Confira faturas e taxas antes de considerar o saldo “livre”.',keys:['payable','costStructure','cashProjection']},
    planos:{icon:'📊',title:'Gestão: aprenda, simule e depois decida',text:'Use Comece aqui para fundamentos, Produtos para precificação e Simuladores para testar preço, desconto, lucro e metas sem arriscar dinheiro real.',keys:['dre','pricing','breakEven']},
    voce:{icon:'🏢',title:'Configuração da empresa também faz parte da gestão',text:'Defina dados do negócio, metas, categorias e recorrências. Separe sempre as finanças pessoais das empresariais.',keys:['pfPj','proLabore','recurring']}
  }[route];
  if(!cfg)return null;
  return h('section.card.company-page-tutor',h('span.company-page-tutor-icon',cfg.icon),h('div',h('small','BIVVO · PROFESSOR DO EMPREENDEDOR'),h('b',cfg.title),h('p',cfg.text)),h('div.company-page-tutor-actions',...cfg.keys.map(k=>lessonButton(k,{},businessGuide(k)?.title?.split(' ').slice(0,3).join(' ')||'Entenda'))));
}

