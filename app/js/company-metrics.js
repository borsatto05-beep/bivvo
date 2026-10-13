/* Métricas gerenciais do Bivvo Empresa.
   São indicadores de gestão, não apuração contábil/fiscal. */
import {num,round2} from './util.js';
import * as F from './finance.js';

export const NON_OPERATIONAL_INCOME=new Set(['Aporte dos sócios','Empréstimo empresarial','Reembolso','Saldo inicial']);
export const OWNER_OUT=new Set(['Retirada dos sócios','Investimentos na empresa']);
export const DIRECT_VARIABLE_CATS=new Set([
  'Mercadorias / estoque','Matéria-prima','Fornecedores','Embalagens','Fretes e entregas',
  'Taxas de cartão / marketplace','Comissões de vendas','Serviços terceirizados','Impostos e tributos'
]);
export const FIXED_OPEX_CATS=new Set([
  'Folha de pagamento','Pró-labore','Encargos trabalhistas','Aluguel comercial','Energia e água',
  'Internet e telefone','Softwares e sistemas','Contabilidade','Seguros empresariais'
]);
export const FINANCIAL_CATS=new Set(['Dívidas e financiamentos','Taxas bancárias']);

const sum=(rows,fn=x=>x.value)=>round2(rows.reduce((n,x)=>n+num(fn(x)),0));
export const operationalRevenue=t=>F.isRealIncome(t)&&!NON_OPERATIONAL_INCOME.has(t.cat);
export const businessExpense=t=>F.isSpend(t)&&!OWNER_OUT.has(t.cat);
export function expenseClass(t){
  if(!businessExpense(t))return 'ignored';
  if(FINANCIAL_CATS.has(t.cat))return 'financial';
  if(DIRECT_VARIABLE_CATS.has(t.cat))return 'variable';
  if(t.fixedId||t.recurringKey||FIXED_OPEX_CATS.has(t.cat))return 'fixed';
  return 'opex';
}

export function statement(rows,{periodMonths=1,monthlyFixedFallback=0}={}){
  const revenueRows=rows.filter(operationalRevenue);
  const expenseRows=rows.filter(businessExpense);
  const variableRows=expenseRows.filter(t=>expenseClass(t)==='variable');
  const fixedRows=expenseRows.filter(t=>expenseClass(t)==='fixed');
  const opexRows=expenseRows.filter(t=>expenseClass(t)==='opex');
  const financialRows=expenseRows.filter(t=>expenseClass(t)==='financial');
  const revenue=sum(revenueRows,F.incomeAmount),variableCosts=sum(variableRows),fixedExpenses=sum(fixedRows),otherOpex=sum(opexRows),financialExpenses=sum(financialRows);
  const contribution=round2(revenue-variableCosts),contributionMargin=revenue>0?contribution/revenue:0;
  const ebitdaApprox=round2(contribution-fixedExpenses-otherOpex);
  const netProfit=round2(ebitdaApprox-financialExpenses);
  const monthlyFixedFromRows=periodMonths>0?round2((fixedExpenses+otherOpex)/periodMonths):0;
  const monthlyFixed=Math.max(monthlyFixedFromRows,round2(monthlyFixedFallback));
  const breakEven=contributionMargin>0?round2(monthlyFixed/contributionMargin):0;
  return {revenueRows,expenseRows,variableRows,fixedRows,opexRows,financialRows,revenue,variableCosts,fixedExpenses,otherOpex,financialExpenses,contribution,contributionMargin,ebitdaApprox,netProfit,monthlyFixed,breakEven};
}

export function productMetrics(p,monthlyFixedCost=0){
  const purchase=Math.max(0,num(p?.purchaseCost)),freight=Math.max(0,num(p?.freight)),packaging=Math.max(0,num(p?.packaging)),other=Math.max(0,num(p?.otherDirect));
  const baseDirect=round2(purchase+freight+packaging+other),sale=Math.max(0,num(p?.salePrice));
  const rate=Math.max(0,(num(p?.cardFeePct)+num(p?.taxPct)+num(p?.commissionPct))/100);
  const percentageCosts=round2(sale*rate),variableCost=round2(baseDirect+percentageCosts),contribution=round2(sale-variableCost);
  const contributionMargin=sale>0?contribution/sale:0;
  const fixedAllocation=Math.max(0,num(p?.fixedAllocation)),realCost=round2(variableCost+fixedAllocation),unitProfit=round2(sale-realCost);
  const markup=baseDirect>0?(sale/baseDirect-1):0,grossMargin=sale>0?(sale-baseDirect)/sale:0;
  const targetMargin=Math.max(0,Math.min(.9,num(p?.targetMarginPct||20)/100));
  const denom=1-rate-targetMargin;
  const recommendedMinPrice=denom>0?round2((baseDirect+fixedAllocation)/denom):0;
  const breakEvenUnits=contribution>0?monthlyFixedCost/contribution:0;
  const soldQty=Math.max(0,num(p?.soldQty)),revenueTotal=round2(sale*soldQty),contributionTotal=round2(contribution*soldQty),profitTotal=round2(unitProfit*soldQty);
  const stockQty=p?.kind==='service'?0:Math.max(0,num(p?.stockQty)),inventoryValue=round2(stockQty*purchase);
  return {baseDirect,sale,rate,percentageCosts,variableCost,contribution,contributionMargin,fixedAllocation,realCost,unitProfit,markup,grossMargin,targetMargin,recommendedMinPrice,breakEvenUnits,soldQty,revenueTotal,contributionTotal,profitTotal,stockQty,inventoryValue};
}

export function productPortfolio(products=[],monthlyFixedCost=0){
  const rows=products.map(p=>({...p,metrics:productMetrics(p,monthlyFixedCost)}));
  return {
    rows,
    revenue:sum(rows,x=>x.metrics.revenueTotal),
    contribution:sum(rows,x=>x.metrics.contributionTotal),
    profit:sum(rows,x=>x.metrics.profitTotal),
    inventoryValue:sum(rows,x=>x.metrics.inventoryValue),
    lowStock:rows.filter(x=>x.kind!=='service'&&num(x.minStock)>0&&x.metrics.stockQty<=num(x.minStock)).length
  };
}

/* Conteúdo didático dos indicadores empresariais. Mantido separado dos cálculos para que
   a UI explique a mesma métrica sempre do mesmo jeito em todas as telas. */
export const BUSINESS_GUIDES={
  revenue:{title:'Faturamento',icon:'💰',what:'É tudo que a empresa vendeu em produtos ou serviços no período, mesmo que parte ainda esteja para receber.',importance:'Mostra o tamanho das vendas, mas sozinho não diz se a empresa deu lucro.',formula:'Faturamento = soma das receitas operacionais do período.',action:'Se o faturamento cair, investigue volume de vendas, ticket médio, preço, mix de produtos e clientes perdidos.'},
  variableCosts:{title:'Custos variáveis',icon:'📦',what:'São gastos diretamente ligados ao que foi vendido. Quanto mais a empresa vende, normalmente mais esses custos aumentam.',importance:'Eles determinam quanto da venda realmente sobra para pagar a estrutura da empresa.',formula:'Custos variáveis = mercadoria/matéria-prima + frete + embalagem + taxas + comissão + tributos ligados à venda + outros custos diretos.',action:'Negocie fornecedores, frete, taxas e comissões e reveja produtos cuja venda deixa pouca sobra.'},
  contribution:{title:'Margem de contribuição',icon:'🧮',what:'É quanto sobra do faturamento depois de pagar os custos variáveis.',importance:'Essa sobra é o dinheiro que precisa pagar aluguel, folha, sistemas e demais despesas fixas. Só depois disso aparece lucro.',formula:'Margem de contribuição (R$) = faturamento − custos variáveis.\nMargem de contribuição (%) = margem de contribuição ÷ faturamento × 100.',action:'Se estiver baixa, reveja preço, custo do produto, descontos, taxas, comissões e mix de vendas.'},
  fixedOpex:{title:'Despesas fixas e operacionais',icon:'🏢',what:'São gastos para manter a empresa funcionando, mesmo quando vende pouco ou nada.',importance:'Quanto maior a estrutura fixa, maior o faturamento necessário apenas para empatar.',formula:'Despesas fixas/operacionais = folha + pró-labore + aluguel + sistemas + contabilidade + energia + outros gastos de estrutura.',action:'Separe o que é essencial, renegocie contratos e evite transformar gastos temporários em custos permanentes.'},
  ebitda:{title:'EBITDA aproximado',icon:'📈',what:'É uma visão gerencial do resultado da operação antes das despesas financeiras cadastradas.',importance:'Ajuda a responder se o negócio principal consegue gerar resultado antes do peso de juros e financiamentos.',formula:'EBITDA aprox. = margem de contribuição − despesas fixas − outras despesas operacionais.',action:'Se estiver negativo, a operação ainda não se paga: aumente margem/faturamento ou reduza estrutura.'},
  netProfit:{title:'Lucro gerencial',icon:'✅',what:'É o que sobra, na visão gerencial do Bivvo, depois dos custos, despesas operacionais e despesas financeiras cadastradas.',importance:'É o indicador que mostra se a empresa está gerando resultado econômico depois de pagar a estrutura registrada.',formula:'Lucro gerencial = EBITDA aproximado − despesas financeiras cadastradas.',action:'Não confunda lucro com dinheiro disponível em conta. Venda a prazo pode gerar lucro sem ter colocado dinheiro no caixa ainda.'},
  cash:{title:'Caixa atual',icon:'🏦',what:'É o dinheiro que efetivamente está disponível hoje nas contas/caixa considerados pelo Bivvo.',importance:'Uma empresa pode ter lucro e mesmo assim faltar dinheiro para pagar contas, por causa de prazos de recebimento e pagamento.',formula:'Caixa = saldo inicial + entradas efetivamente recebidas − saídas efetivamente pagas.',action:'Acompanhe diariamente quando houver pouco capital de giro ou muitos recebimentos a prazo.'},
  receivable:{title:'Contas a receber',icon:'🤝',what:'São vendas e receitas já registradas que ainda não entraram no caixa.',importance:'Mostra dinheiro esperado e ajuda a prever se haverá caixa para pagar os próximos compromissos.',formula:'A receber = soma das receitas pendentes ainda não pagas/recebidas.',action:'Priorize cobranças vencidas e acompanhe a concentração em poucos clientes.'},
  payable:{title:'Contas a pagar',icon:'🧾',what:'São despesas e compromissos já conhecidos que ainda não foram pagos.',importance:'Evita olhar apenas o saldo de hoje e gastar um dinheiro que já está comprometido.',formula:'A pagar = soma das despesas pendentes + faturas/obrigações ainda não quitadas.',action:'Organize vencimentos e antecipe problemas antes que o caixa fique negativo.'},
  cashProjection:{title:'Projeção de caixa',icon:'🔭',what:'É uma simulação de como o caixa pode ficar depois das entradas e saídas futuras já cadastradas.',importance:'Permite enxergar falta de dinheiro antes que ela aconteça.',formula:'Caixa projetado = caixa atual + recebimentos previstos − pagamentos previstos.',action:'Se a projeção ficar negativa, acelere cobranças, negocie prazos ou adie gastos não essenciais.'},
  workingCapital:{title:'Capital de giro',icon:'🛟',what:'É a folga financeira usada para manter a operação funcionando entre o momento em que a empresa paga suas contas e o momento em que recebe dos clientes.',importance:'Mesmo uma empresa lucrativa pode quebrar se faltar dinheiro no meio do caminho. Capital de giro protege folha, fornecedores, impostos e despesas do dia a dia.',formula:'Referência simples = caixa disponível + contas a receber de curto prazo − contas a pagar de curto prazo. Para uma análise completa, considere também estoque e o ciclo financeiro do negócio.',action:'Acompanhe o ciclo de recebimento e pagamento, crie uma reserva operacional e evite retirar do caixa o dinheiro que ainda será necessário para manter a empresa funcionando.'},
  breakEven:{title:'Ponto de equilíbrio',icon:'🎯',what:'É quanto a empresa precisa faturar para cobrir a estrutura e ficar no zero a zero, antes de começar a gerar lucro.',importance:'Mostra a meta mínima de faturamento que o negócio precisa atingir para se sustentar.',formula:'Ponto de equilíbrio = custos/despesas fixas mensais ÷ margem de contribuição %.',action:'Se o ponto de equilíbrio estiver muito alto, trabalhe margem, preço e estrutura fixa.'},
  ticket:{title:'Ticket médio',icon:'🧾',what:'É o valor médio de cada venda registrada.',importance:'Ajuda a entender se o crescimento vem de mais vendas ou de vendas maiores.',formula:'Ticket médio = faturamento ÷ número de vendas.',action:'Para elevar o ticket, avalie combos, upsell, produtos complementares e política de preços.'},
  costMix:{title:'Mapa de custos',icon:'🧩',what:'Mostra quais categorias mais consomem dinheiro no período.',importance:'Ajuda a localizar onde uma pequena melhora pode gerar mais impacto no resultado.',formula:'Peso da categoria (%) = valor da categoria ÷ total de custos/despesas × 100.',action:'Comece pelas categorias de maior peso e procure causas, desperdícios e oportunidades de negociação.'},
  aging:{title:'Aging de recebíveis',icon:'⏳',what:'Separa o que ainda vai vencer do que já está atrasado por faixas de dias.',importance:'Mostra a qualidade dos recebimentos e o risco de o faturamento não virar caixa no prazo esperado.',formula:'Aging = agrupar contas a receber por dias até/depois do vencimento.',action:'Quanto mais antigo o atraso, maior deve ser a prioridade de cobrança e revisão de crédito ao cliente.'},
  revenueSource:{title:'Receita por origem',icon:'💼',what:'Mostra de onde vem o faturamento: vendas, serviços, contratos, clientes ou outros canais.',importance:'Ajuda a perceber dependência excessiva de uma única fonte de receita.',formula:'Participação da origem (%) = receita da origem ÷ faturamento total × 100.',action:'Se uma única origem dominar a receita, avalie diversificação para reduzir risco.'},
  costStructure:{title:'Estrutura de custos',icon:'⚖️',what:'Compara gastos mais rígidos/fixos com gastos que variam conforme a operação.',importance:'Uma estrutura muito fixa exige faturamento mais previsível para não pressionar o caixa.',formula:'Peso fixo (%) = custos fixos ÷ custos totais × 100.',action:'Quanto maior a rigidez da estrutura, maior a necessidade de receita recorrente e reserva de caixa.'},
  target:{title:'Meta de faturamento',icon:'🎯',what:'É o objetivo de vendas definido para o período.',importance:'Transforma faturamento em uma meta operacional e mostra quanto ainda precisa ser vendido.',formula:'Progresso da meta (%) = faturamento realizado ÷ meta de faturamento × 100.',action:'Acompanhe ritmo de vendas, dias restantes e margem; vender mais sem margem não resolve o negócio.'},
  health:{title:'Saúde operacional',icon:'🧭',what:'É uma leitura resumida que combina margem, caixa futuro e atrasos registrados.',importance:'Serve como sinal rápido para saber onde olhar primeiro, não como nota contábil oficial.',formula:'Índice interno do Bivvo = combinação ponderada de margem, caixa projetado, contas vencidas e impostos pendentes.',action:'Use a nota como porta de entrada. Abra os indicadores individuais antes de tomar decisões.'},
  taxes:{title:'Impostos e tributos',icon:'🧾',what:'São obrigações tributárias ligadas ao funcionamento e às vendas da empresa. A forma de cálculo depende do regime, atividade e local.',importance:'Imposto ignorado vira dívida, multa e pressão de caixa. O valor reservado para tributos não deve ser tratado como dinheiro livre.',formula:'O cálculo oficial varia conforme regime tributário, atividade, faturamento e município/estado. No Bivvo, registre o valor devido e o vencimento informado pela sua apuração.',action:'Mantenha calendário de vencimentos, separe caixa para tributos e valide alíquotas/obrigações com seu contador.'},
  pricing:{title:'Precificação',icon:'🏷️',what:'É o processo de definir um preço que cubra custos, taxas, impostos e estrutura e ainda deixe uma margem coerente com o mercado.',importance:'Preço baixo demais pode gerar venda e prejuízo. Preço alto sem valor percebido pode reduzir volume.',formula:'Preço mínimo gerencial = (custos diretos + rateio fixo) ÷ (1 − taxas% − impostos% − comissão% − margem desejada%).',action:'Calcule seu preço mínimo, compare com o mercado e só então decida desconto, posicionamento e margem alvo.'},
  productProfit:{title:'Lucro por produto ou serviço',icon:'📊',what:'Mostra quanto cada item gera de resultado depois dos custos atribuídos e do volume vendido informado.',importance:'O campeão de vendas pode não ser o campeão de lucro. Esse indicador ajuda a decidir mix, estoque, promoção e foco comercial.',formula:'Lucro estimado por item = (preço de venda − custo real por unidade) × quantidade vendida.',action:'Compare margem e lucro total. Dê atenção especial a itens que vendem muito com margem fraca.'},
  stock:{title:'Estoque',icon:'📦',what:'É mercadoria comprada que ainda não virou venda. Enquanto está parada, representa dinheiro imobilizado.',importance:'Estoque demais prende caixa; estoque de menos gera ruptura e perda de venda.',formula:'Estoque a custo = quantidade em estoque × custo de compra unitário.',action:'Defina estoque mínimo, acompanhe giro e evite comprar só porque o fornecedor ofereceu desconto.'},
  proLabore:{title:'Pró-labore e retirada dos sócios',icon:'👤',what:'Pró-labore é a remuneração do sócio pelo trabalho na empresa. Retirada/distribuição é outra coisa e deve ser tratada separadamente.',importance:'Separar remuneração do sócio evita usar a conta da empresa como carteira pessoal e protege o caixa do negócio.',formula:'Não existe uma fórmula universal. Defina um valor compatível com função, capacidade de caixa e regras contábeis/tributárias aplicáveis.',action:'Defina valor e data, registre como recorrência e valide o tratamento contábil e tributário com seu contador.'},
  pfPj:{title:'Separação entre pessoa física e empresa',icon:'🏦',what:'É manter dinheiro, contas, cartões e lançamentos do negócio separados da vida pessoal.',importance:'Sem separação, você perde a noção de lucro, caixa, custo real e pode tomar decisões com números contaminados.',formula:'Regra prática: entrada/saída da empresa fica no ambiente Empresa; aporte e retirada do sócio são registrados como movimentos próprios, não como venda/despesa operacional comum.',action:'Use conta PJ ou um caixa separado, defina pró-labore e registre qualquer transferência entre você e a empresa.'},
  budget:{title:'Orçamento e limite por centro de custo',icon:'📋',what:'É o valor que você planeja gastar por categoria antes do mês acontecer.',importance:'Ajuda a perceber desvios cedo e evita que uma categoria cresça sem controle.',formula:'Desvio do orçamento = gasto real − limite planejado. Uso (%) = gasto real ÷ limite × 100.',action:'Defina limite para categorias relevantes, acompanhe semanalmente e investigue estouros antes de simplesmente cortar.'},
  recurring:{title:'Custos e receitas recorrentes',icon:'🔁',what:'São valores que se repetem com frequência, como aluguel, folha, sistemas, contratos e mensalidades.',importance:'Eles determinam o tamanho da estrutura que precisa ser sustentada todos os meses.',formula:'Custo recorrente mensal = soma das recorrências mensais + valor anual ÷ 12.',action:'Cadastre também custos anuais e revise contratos regularmente para saber quanto custa manter a operação aberta.'},
  dre:{title:'DRE gerencial simplificada',icon:'📑',what:'É uma leitura organizada do resultado econômico: começa no faturamento, desconta custos variáveis, mostra a margem, desconta a estrutura e chega ao resultado gerencial.',importance:'Evita olhar apenas saldo bancário e ajuda a descobrir onde o resultado está sendo ganho ou perdido.',formula:'Faturamento − custos variáveis = margem de contribuição; margem − despesas fixas/operacionais = resultado operacional; depois entram despesas financeiras cadastradas.',action:'Feche todo mês, corrija classificações e compare evolução. Para demonstrações contábeis oficiais, use a apuração do contador.'}
};
export const businessGuide=key=>BUSINESS_GUIDES[key]||null;
