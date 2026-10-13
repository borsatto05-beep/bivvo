# -*- coding: utf-8 -*-
"""Central Aprenda — artigos 11 a 20."""

ARTICLES_B = [
# ---------------------------------------------------------------- 11
dict(
slug="como-organizar-dividas", cat="dividas", featured=False,
title="Como organizar dívidas: monte o mapa antes de negociar",
seo_title="Como organizar dívidas: lista, juros e prioridades | Bivvo",
desc="Como montar a lista completa das suas dívidas, onde consultar o que está no seu CPF e como medir quanto da renda elas comprometem.",
short="A lista que mostra o tamanho real das dívidas e por onde começar.",
answer="""<p>Organizar dívidas é <strong>reunir todas em uma única lista com credor, saldo, parcela, juros e situação</strong>, e comparar o total das parcelas com a sua renda. Com esse mapa, você enxerga quais custam mais, quais estão atrasadas e quanto do salário já está preso. Sem ele, qualquer negociação é feita no escuro.</p>""",
answer_key="Total de parcelas ÷ renda líquida = comprometimento",
sections=[
("Colunas da sua lista", """<div class="table-wrap"><table><thead><tr><th>Coluna</th><th>Por que importa</th></tr></thead><tbody>
<tr><td>Credor e tipo</td><td>Cartão, cheque especial, empréstimo, financiamento, loja.</td></tr>
<tr><td>Saldo devedor atual</td><td>Quanto falta pagar hoje, não o valor original.</td></tr>
<tr><td>Parcela mensal</td><td>Quanto sai do seu orçamento todo mês.</td></tr>
<tr><td>Juros ao mês e CET</td><td>Mostra qual dívida cresce mais rápido.</td></tr>
<tr><td>Parcelas restantes</td><td>Indica quando a parcela vai sumir do orçamento.</td></tr>
<tr><td>Situação</td><td>Em dia, atrasada há quantos dias, negativada.</td></tr>
<tr><td>Garantia</td><td>Se há bem envolvido, como carro ou imóvel.</td></tr>
</tbody></table></div>"""),
("Onde encontrar o que você nem lembra", """<p>Além dos aplicativos dos bancos, o Banco Central oferece o <strong>Registrato</strong>, um serviço gratuito que mostra empréstimos e financiamentos registrados no seu CPF em instituições financeiras. Os birôs de crédito, como Serasa e Boa Vista, mostram dívidas negativadas. Use apenas os sites e aplicativos oficiais.</p>"""),
("Meça o comprometimento da renda", """<p>Some todas as parcelas mensais e divida pela renda líquida. Esse percentual mostra a pressão das dívidas no orçamento. Quanto maior, menor o espaço para imprevistos. Você pode fazer a conta na [[tool:comprometimento|calculadora de comprometimento de renda]].</p>
<p>Não existe um número mágico, mas quando as parcelas de dívidas ocupam uma fatia grande da renda, qualquer imprevisto vira atraso. Esse é o sinal para negociar prazos, juros ou valores.</p>"""),
("Separe por urgência", """<p>Com a lista pronta, marque três grupos:</p>
<ul><li><strong>Urgentes:</strong> atrasadas que ameaçam moradia, serviços essenciais ou bens dados em garantia.</li><li><strong>Caras:</strong> juros altos que crescem todo mês, como rotativo e cheque especial.</li><li><strong>Controladas:</strong> parcelas fixas, juros menores, em dia.</li></ul>
<p>As urgentes e as caras são as que entram primeiro no plano de [[como-sair-das-dividas|como sair das dívidas]].</p>"""),
("Atualize a lista todo mês", """<p>Depois de cada pagamento, atualize o saldo. Ver o total caindo mês a mês é um dos maiores motivadores para manter o plano, principalmente nos primeiros meses, quando o progresso parece lento.</p>"""),
],
example=dict(title="Exemplo de comprometimento", rows=[("Renda líquida","R$ 3.500"),("Financiamento do carro","R$ 690"),("Empréstimo pessoal","R$ 380"),("Parcelas no cartão","R$ 410")], total=("Comprometimento com dívidas","R$ 1.480 · cerca de 42%"), note="Valores fictícios. Com 42% da renda em parcelas, sobra pouco espaço para contas essenciais e imprevistos."),
mistakes=["Anotar o valor original da dívida em vez do saldo atual.","Esquecer parcelas no cartão porque “já estão na fatura”.","Comparar propostas só pela parcela, sem olhar o custo total.","Fazer a lista uma vez e nunca mais atualizar."],
faq=[("O que é CET?","É o Custo Efetivo Total: juros, tarifas, impostos e seguros de uma operação de crédito, expressos em uma taxa. É o número certo para comparar propostas."),
("O Registrato é pago?","Não. É um serviço gratuito do Banco Central, acessado com a conta gov.br."),
("Parcela no cartão sem juros conta como dívida?","Para o seu orçamento, sim. Ela ocupa parte da renda dos próximos meses, como mostra [[como-controlar-compras-parceladas|como controlar compras parceladas]].")],
related=["como-sair-das-dividas","como-controlar-compras-parceladas","como-organizar-o-cartao-de-credito","quanto-posso-gastar-por-mes"],
tools=["comprometimento","parcelas"],
bivvo="No Bivvo, parcelas de cartão, empréstimos e contas aparecem mês a mês, então você vê quando cada compromisso termina e quanto da renda dos próximos meses já está ocupado.",
),
# ---------------------------------------------------------------- 12
dict(
slug="como-organizar-o-cartao-de-credito", cat="cartao-de-credito", featured=True,
title="Como organizar o cartão de crédito e parar de se assustar com a fatura",
seo_title="Como organizar o cartão de crédito sem sustos na fatura | Bivvo",
desc="Limite não é renda. Veja como definir um teto pessoal, acompanhar parcelas futuras e alinhar fechamento e vencimento ao seu salário.",
short="Teto pessoal, datas alinhadas ao salário e parcelas sempre à vista.",
answer="""<p>Para organizar o cartão de crédito, <strong>trate cada compra como dinheiro que já saiu da sua conta</strong>. Defina um teto pessoal menor que o limite do banco, escolha um vencimento logo depois do dia em que você recebe, acompanhe as parcelas futuras e pague sempre a fatura inteira. O limite mostra quanto o banco empresta, não quanto você pode pagar.</p>""",
answer_key="Teto pessoal < limite do banco",
sections=[
("Limite do banco não é o seu limite", """<p>O banco calcula o limite com base no seu histórico e na renda informada, sem saber quais são suas contas. Um limite de R$ 5.000 não significa que você consegue pagar uma fatura de R$ 5.000. Defina um teto pessoal com base no que sobra depois das contas fixas e do valor que você quer guardar.</p>"""),
("Alinhe as datas com o salário", """<p>Escolha um vencimento poucos dias depois do dia em que o salário cai. Assim a fatura é paga com o dinheiro novo, antes que ele seja usado em outras coisas. A maioria dos bancos permite trocar a data pelo aplicativo. Para entender a relação entre as datas, veja [[como-funciona-o-fechamento-da-fatura|como funciona o fechamento da fatura]].</p>"""),
("Use menos cartões", """<p>Cada cartão extra é mais uma fatura, mais uma data e mais um limite para tentar. Um ou dois cartões costumam ser suficientes. Se você tem vários, concentre o uso em um e mantenha os outros guardados ou cancelados.</p>"""),
("Acompanhe as parcelas futuras", """<p>A fatura deste mês é só uma parte do compromisso. Parcelas de compras antigas continuam chegando por meses. Some o que já está comprometido nas próximas faturas antes de fazer uma compra nova. O guia [[como-controlar-compras-parceladas|como controlar compras parceladas]] explica por que esse número costuma surpreender.</p>"""),
("Pague a fatura inteira", """<p>Pagar o mínimo leva o restante para o rotativo, com juros muito altos. Se a fatura não cabe, procure o banco para parcelar antes do vencimento e compare o custo com outras opções de crédito. Ao mesmo tempo, pare de usar o cartão até o problema estar resolvido.</p>"""),
("Revise a fatura antes de pagar", """<p>Confira cobranças desconhecidas, assinaturas esquecidas e compras duplicadas. Contestar logo no primeiro mês é muito mais simples.</p>"""),
],
example=dict(title="Exemplo de teto pessoal", rows=[("Limite do banco","R$ 4.000"),("Renda líquida","R$ 3.000"),("Contas fixas fora do cartão","− R$ 1.700"),("Valor a guardar","− R$ 200")], total=("Teto pessoal para a fatura","R$ 1.100"), note="Valores fictícios. Mesmo com R$ 4.000 de limite, uma fatura acima de R$ 1.100 compromete contas ou a meta do mês."),
mistakes=["Usar o limite disponível como referência de quanto pode gastar.","Ter vencimentos espalhados ao longo do mês, longe do dia do salário.","Olhar só a fatura atual e esquecer as parcelas das próximas.","Pagar o mínimo achando que resolve o mês."],
faq=[("Quantos cartões de crédito devo ter?","Para a maioria das pessoas, um ou dois. O segundo serve como alternativa caso o primeiro seja bloqueado ou não aceito."),
("Vale a pena pedir aumento de limite?","Só se você tem um teto pessoal definido e o aumento serve para emergências ou para concentrar compras planejadas. Mais limite sem teto tende a virar mais gasto."),
("Como saber quanto do limite está comprometido?","Some a fatura atual e as parcelas futuras e compare com o limite. O [[tool:cartao|simulador de cartão]] faz essa conta.")],
related=["como-funciona-o-fechamento-da-fatura","como-controlar-compras-parceladas","como-sair-das-dividas","como-organizar-o-salario"],
tools=["cartao","parcelas"],
bivvo="No Bivvo, cada cartão mostra a fatura atual, as próximas faturas com as parcelas que já existem, as datas de fechamento e vencimento e quanto do limite está realmente comprometido.",
),
# ---------------------------------------------------------------- 13
dict(
slug="como-funciona-o-fechamento-da-fatura", cat="cartao-de-credito", featured=False,
title="Como funciona o fechamento da fatura do cartão",
seo_title="Fechamento da fatura: o que é e qual o melhor dia de compra | Bivvo",
desc="Entenda a diferença entre fechamento e vencimento, por que existe o melhor dia de compra e em qual fatura cada compra e cada parcela vão cair.",
short="Fechamento, vencimento, melhor dia de compra e onde cada parcela cai.",
answer="""<p>O <strong>fechamento</strong> é o dia em que o banco encerra a lista de compras daquela fatura. O <strong>vencimento</strong> é o dia de pagar. Compras feitas até o fechamento entram na fatura atual. Compras feitas depois dele vão para a fatura seguinte, que só vence cerca de um mês depois. Por isso o dia seguinte ao fechamento é chamado de melhor dia de compra.</p>""",
answer_key="Comprou depois do fechamento → paga na fatura seguinte",
sections=[
("Fechamento e vencimento", """<p>Em geral, o fechamento acontece alguns dias antes do vencimento, muitas vezes entre 5 e 10 dias. Esse intervalo é o tempo que você tem para conferir a fatura e se organizar para pagar. As datas exatas aparecem no aplicativo do banco e na própria fatura.</p>"""),
("O melhor dia de compra", """<p>Uma compra feita no dia seguinte ao fechamento só será cobrada na próxima fatura. Isso dá o maior prazo possível entre a compra e o pagamento, perto de 40 dias. Uma compra feita na véspera do fechamento será cobrada em poucos dias.</p>
<p>O prazo maior ajuda no planejamento, mas não muda o fato de que a compra precisa caber no orçamento. Ele é útil para compras que você já ia fazer, não um motivo para comprar.</p>"""),
("Em qual fatura cai cada parcela", """<p>Em uma compra parcelada, a primeira parcela segue a mesma regra de qualquer compra: cai na fatura atual ou na seguinte, conforme a data em relação ao fechamento. Cada parcela seguinte cai uma fatura depois da outra. Uma compra em 10 vezes feita depois do fechamento de março começa na fatura que vence em abril e termina na que vence em janeiro do ano seguinte, considerando a ordem das faturas.</p>"""),
("Compras no dia do fechamento", """<p>O comportamento exato pode variar entre bancos, e o horário de processamento também conta. Se a data importa para a sua organização, evite comprar no próprio dia do fechamento ou confira no aplicativo em qual fatura a compra entrou.</p>"""),
("Se não der para pagar a fatura inteira", """<p>O valor não pago entra no rotativo, que só pode ser usado até o vencimento da fatura seguinte. Depois disso, o banco deve oferecer o parcelamento do saldo. Desde 2024, os juros e encargos do rotativo e do parcelamento da fatura não podem passar de 100% do valor original da dívida. Mesmo com esse teto, é um crédito muito caro. Veja alternativas em [[como-sair-das-dividas|como sair das dívidas]].</p>"""),
],
example=dict(title="Exemplo de datas de um cartão", rows=[("Fechamento","dia 3"),("Vencimento","dia 10"),("Compra no dia 2","fatura que vence dia 10, em 8 dias"),("Compra no dia 4","fatura do mês seguinte, em cerca de 37 dias")], total=("Melhor dia de compra","dia 4"), note="Datas fictícias. Confira as do seu cartão no aplicativo do banco."),
mistakes=["Confundir fechamento com vencimento e achar que uma compra recente só será cobrada no mês seguinte.","Usar o melhor dia de compra como desculpa para compras que não cabem.","Esquecer que cada parcela ocupa uma fatura diferente por vários meses.","Pagar a fatura depois do vencimento e ser cobrado com juros e multa."],
faq=[("Posso mudar a data de fechamento?","Normalmente você escolhe o vencimento, e o fechamento acompanha essa escolha. A troca costuma ser feita pelo aplicativo do banco."),
("Se eu pagar a fatura antes do vencimento, o limite volta mais rápido?","Na maioria dos bancos, sim, o limite é liberado após a compensação do pagamento. O prazo pode variar."),
("Estorno de compra cai em qual fatura?","Depende da data em que o estorno é processado. Ele pode aparecer como crédito na fatura atual ou na seguinte.")],
related=["como-organizar-o-cartao-de-credito","como-controlar-compras-parceladas","como-organizar-o-salario","quanto-posso-gastar-por-mes"],
tools=["cartao","parcelas"],
bivvo="No Bivvo, você cadastra o fechamento e o vencimento de cada cartão uma vez. A partir daí, cada compra e cada parcela já entram na fatura certa, e o valor livre do dia considera quando cada fatura vence.",
),
# ---------------------------------------------------------------- 14
dict(
slug="como-controlar-compras-parceladas", cat="cartao-de-credito", featured=False,
title="Como controlar compras parceladas antes que elas virem uma escada",
seo_title="Como controlar compras parceladas no cartão | Bivvo",
desc="Parcelas pequenas se acumulam e ocupam a renda dos próximos meses. Veja como somar o que já está comprometido e definir um teto para parcelas.",
short="Como as parcelas se acumulam e como definir um teto mensal para elas.",
answer="""<p>Para controlar compras parceladas, <strong>some todas as parcelas que já vão aparecer nos próximos meses e defina um teto mensal para esse total</strong>. Antes de parcelar algo novo, verifique se a nova parcela cabe nesse teto em todos os meses do parcelamento, não só no mês atual. Também compare o preço à vista: “sem juros” nem sempre significa sem custo.</p>""",
answer_key="Nova parcela + parcelas existentes ≤ seu teto mensal",
sections=[
("O efeito escada", """<p>Uma parcela de R$ 120 parece leve. Mas, se em cada mês você faz uma nova compra parcelada, as parcelas se empilham: no terceiro mês, você paga três parcelas ao mesmo tempo. Quando percebe, uma parte grande da fatura já está ocupada antes de você gastar qualquer coisa nova.</p>"""),
("Faça a soma dos próximos meses", """<p>Liste as compras parceladas ativas com o valor da parcela e quantas faltam. Some quanto cada uma das próximas faturas já tem de parcelas. Essa linha do tempo mostra quando o orçamento vai aliviar e quais meses estão mais pesados.</p>"""),
("Defina um teto para parcelas", """<p>Escolha um valor máximo mensal para a soma das parcelas, calculado a partir da sua renda e das contas fixas. Muitas pessoas usam uma fatia pequena da renda como limite para parcelas de consumo, para que a fatura não dependa do mês ser perfeito. O importante é que o teto exista e seja respeitado mês a mês.</p>"""),
("“Sem juros” tem custo?", """<p>Às vezes tem. Se a loja dá desconto para pagamento à vista ou no Pix, o parcelado sem juros sai mais caro na prática. Compare sempre o total parcelado com o preço à vista. Para ver o peso mensal de uma compra, use a [[tool:parcelas|calculadora de parcelas]].</p>"""),
("Antes de parcelar, faça três perguntas", """<ol><li>A parcela cabe no meu teto em todos os meses até o fim?</li><li>Existe desconto à vista que compensa esperar e juntar o dinheiro?</li><li>Vou continuar usando isso até a última parcela?</li></ol>
<p>Se a última pergunta tiver resposta “não”, considere esperar ou comprar à vista. Pagar por algo que já acabou costuma pesar mais do que o valor.</p>"""),
],
example=dict(title="Exemplo: a escada de parcelas", rows=[("Mês 1","Tênis R$ 90"),("Mês 2","Tênis R$ 90 + celular R$ 150"),("Mês 3","Tênis R$ 90 + celular R$ 150 + presente R$ 60"),("Mês 4","Tênis R$ 90 + celular R$ 150 + presente R$ 60 + móvel R$ 110")], total=("Parcelas no mês 4","R$ 410"), note="Valores fictícios. Nenhuma compra parecia pesada, mas no quarto mês as parcelas já ocupam R$ 410 da fatura."),
mistakes=["Avaliar uma nova parcela só pela fatura deste mês.","Parcelar compras pequenas e do dia a dia, como mercado e delivery.","Ignorar o desconto à vista ao escolher o parcelado sem juros.","Esquecer que cada parcela reduz o limite disponível até ser paga."],
faq=[("Parcelar no cartão afeta o limite?","Sim. Em geral, o valor total da compra é bloqueado no limite e liberado aos poucos, conforme as parcelas são pagas."),
("Qual o número ideal de parcelas?","O menor que caiba no seu teto mensal. Parcelamentos longos prendem a renda por mais tempo e aumentam o risco de a compra durar menos que as parcelas."),
("Parcelamento sem juros conta como dívida?","No orçamento, sim. É um compromisso dos próximos meses, como explicamos em [[como-organizar-dividas|como organizar dívidas]].")],
related=["como-funciona-o-fechamento-da-fatura","como-organizar-o-cartao-de-credito","quanto-posso-gastar-por-mes","como-organizar-dividas"],
tools=["parcelas","cartao"],
bivvo="O Bivvo lança cada parcela na fatura certa e mostra o total já comprometido nos próximos meses. Com o recurso Posso comprar?, você simula uma compra parcelada e vê o efeito no dinheiro livre antes de decidir.",
),
# ---------------------------------------------------------------- 15
dict(
slug="como-fazer-orcamento-mensal", cat="orcamento", featured=True,
title="Como fazer um orçamento mensal que você consegue seguir",
seo_title="Como fazer um orçamento mensal passo a passo | Bivvo",
desc="Passo a passo para montar um orçamento mensal: renda líquida, contas fixas, gastos anuais diluídos, limites por categoria e revisão.",
short="Renda, contas, gastos anuais e limites por categoria em um só plano.",
answer="""<p>Um orçamento mensal é <strong>um plano feito antes do mês começar dizendo quanto vai para cada destino</strong>. Para montá-lo: anote a renda líquida, liste as contas fixas, divida os gastos anuais por 12, reserve o valor para guardar e distribua o restante em limites para as categorias variáveis. Depois, acompanhe durante o mês e ajuste na semana seguinte.</p>""",
answer_key="Renda − fixos − anuais ÷ 12 − guardar = limites variáveis",
sections=[
("1. Use a renda líquida", """<p>Considere apenas o que cai na conta. Se a renda varia, use a média dos meses mais fracos. Valores incertos, como comissões e bicos, entram no orçamento só quando o dinheiro chegar.</p>"""),
("2. Liste as contas fixas", """<p>Aluguel ou financiamento, condomínio, energia, água, gás, internet, celular, escola, plano de saúde, transporte e parcelas. Use o valor médio dos últimos meses para contas que variam um pouco, como energia.</p>"""),
("3. Dilua os gastos anuais", """<p>IPVA, IPTU, seguro, licenciamento, material escolar, presentes de fim de ano. Some tudo, divida por 12 e reserve esse valor todo mês. É o que impede janeiro e fevereiro de virarem meses de crise.</p>"""),
("4. Reserve o valor para guardar", """<p>Defina antes de distribuir o resto. Se não sobrar nada para guardar, o orçamento já está mostrando onde precisa de ajuste. Para escolher o valor, veja [[quanto-guardar-do-salario-por-mes|quanto guardar do salário]].</p>"""),
("5. Distribua o restante em limites", """<p>Mercado, alimentação fora, transporte variável, lazer, compras, cuidados pessoais. Use os últimos dois meses de gastos como ponto de partida e corte um pouco onde fizer sentido. Limites irreais são abandonados na primeira semana.</p>"""),
("6. Acompanhe e ajuste", """<p>Uma vez por semana, compare o gasto de cada categoria com o limite. Se uma passar, tire de outra categoria variável, nunca da reserva ou das contas. No fim do mês, use o que aprendeu para ajustar o orçamento do próximo.</p>"""),
("Orçamento base zero, em uma frase", """<p>É a versão em que cada real da renda recebe um destino, até a diferença ser zero. O que sobraria sem destino vai para metas ou para a reserva. Funciona bem para quem quer o máximo de controle.</p>"""),
],
example=dict(title="Exemplo de orçamento", rows=[("Renda líquida","R$ 4.000"),("Contas fixas","− R$ 2.050"),("Gastos anuais ÷ 12","− R$ 180"),("Guardar","− R$ 400"),("Mercado","− R$ 750"),("Transporte variável","− R$ 220"),("Lazer e alimentação fora","− R$ 300")], total=("Sem destino","R$ 100 para imprevistos pequenos"), note="Valores fictícios. O espaço para imprevistos pequenos evita que qualquer variação quebre o plano."),
mistakes=["Montar o orçamento uma vez e nunca comparar com o que aconteceu.","Esquecer gastos anuais e tratá-los como surpresa.","Definir limites baseados no que gostaria de gastar, não no histórico.","Não deixar nenhuma margem para variações pequenas."],
faq=[("Orçamento mensal e orçamento doméstico são a mesma coisa?","São parecidos. O doméstico costuma reunir os gastos da casa e de quem mora nela. Temos uma página sobre [[page:orcamento|orçamento doméstico]]."),
("Quantas categorias devo usar?","Entre 8 e 15 costumam bastar. Mais que isso dificulta o acompanhamento."),
("E se eu estourar uma categoria?","Remaneje de outra categoria variável. Se acontecer todo mês, o limite está irreal e precisa ser revisto.")],
related=["como-dividir-o-salario","quanto-posso-gastar-por-mes","como-fazer-planejamento-financeiro-pessoal","como-controlar-gastos-mensais"],
tools=["comprometimento","gastar-hoje"],
bivvo="No Bivvo, você define limites por categoria e o app mostra quanto já foi usado de cada um ao longo do mês. Ele também sugere limites com base no seu histórico, para você não começar do zero.",
),
# ---------------------------------------------------------------- 16
dict(
slug="como-fazer-planejamento-financeiro-pessoal", cat="planejamento-financeiro", featured=False,
title="Como fazer planejamento financeiro pessoal em três horizontes",
seo_title="Como fazer planejamento financeiro pessoal: guia prático | Bivvo",
desc="Planejamento financeiro vai além do orçamento do mês. Veja como organizar objetivos de curto, médio e longo prazo e revisar o plano ao longo do ano.",
short="Curto, médio e longo prazo: como transformar objetivos em números.",
answer="""<p>Planejamento financeiro pessoal é <strong>decidir para onde o seu dinheiro vai nos próximos meses e anos, não só neste mês</strong>. Ele se organiza em três horizontes: o curto prazo, que é o orçamento e a reserva; o médio prazo, com objetivos de um a cinco anos; e o longo prazo, como aposentadoria. Cada objetivo vira um valor, um prazo e uma contribuição mensal.</p>""",
answer_key="Objetivo = valor + prazo + quanto por mês",
sections=[
("Planejamento não é orçamento", """<p>O orçamento responde “como vou usar o dinheiro deste mês”. O planejamento responde “o que quero que meu dinheiro faça por mim ao longo do tempo”. O orçamento é a ferramenta que executa o plano mês a mês. Se você ainda não tem um, comece por [[como-fazer-orcamento-mensal|como fazer um orçamento mensal]].</p>"""),
("Curto prazo: até 1 ano", """<p>Contas em dia, reserva de emergência em construção, dívidas caras quitadas e gastos sazonais previstos. Sem essa base, qualquer imprevisto derruba os planos maiores.</p>"""),
("Médio prazo: de 1 a 5 anos", """<p>Troca de carro, entrada de um imóvel, curso, casamento, viagem maior. Para cada um, defina o valor aproximado, a data desejada e calcule quanto precisa guardar por mês com a [[tool:guardar|calculadora de quanto guardar]].</p>"""),
("Longo prazo: mais de 5 anos", """<p>Aposentadoria, independência financeira, estudos dos filhos. Aqui o tempo trabalha a favor: pequenas contribuições regulares, começadas cedo, costumam pesar mais do que grandes valores começados tarde. Considere buscar orientação profissional independente para decisões de investimento de longo prazo.</p>"""),
("Ordene os objetivos", """<p>Quando o dinheiro não dá para tudo, uma ordem comum é: base de curto prazo, depois o objetivo de médio prazo mais importante e, em paralelo, uma contribuição pequena e constante para o longo prazo. Escreva a ordem. Ela evita trocar de prioridade a cada vontade nova.</p>"""),
("Revise a cada trimestre", """<p>A cada três meses, confira se as contribuições aconteceram, se algum objetivo mudou e se a renda ou os custos mudaram. Mudanças de vida, como filhos, mudança de cidade e troca de emprego, pedem uma revisão completa do plano.</p>"""),
],
example=dict(title="Exemplo de plano com três horizontes", rows=[("Curto: completar a reserva","R$ 250 por mês"),("Médio: entrada do carro em 2 anos","R$ 400 por mês"),("Longo: aposentadoria","R$ 150 por mês")], total=("Contribuição mensal total","R$ 800"), note="Valores fictícios. Se a soma não cabe no orçamento, ajuste prazos antes de cortar a base de curto prazo."),
mistakes=["Planejar o longo prazo sem ter reserva de emergência.","Ter objetivos sem valor e sem data, que nunca viram plano.","Mudar a prioridade sempre que surge uma vontade nova.","Nunca revisar o plano depois que a vida muda."],
faq=[("Preciso de um planejador financeiro?","Para começar, não. Para decisões complexas, como investimentos de longo prazo, sucessão e impostos, um profissional independente pode ajudar."),
("Como planejar com renda variável?","Use a menor renda dos últimos meses como base e destine o excedente dos meses bons para reserva e metas."),
("Quantos objetivos ao mesmo tempo?","Dois ou três ativos costumam ser o limite para manter o foco.")],
related=["como-fazer-orcamento-mensal","quanto-guardar-do-salario-por-mes","quanto-ter-de-reserva-de-emergencia","como-organizar-a-vida-financeira"],
tools=["guardar","reserva"],
bivvo="O Bivvo reúne metas, reserva e uma previsão do seu saldo para os próximos dias e meses, para você ver se o ritmo atual leva aos objetivos que definiu.",
),
# ---------------------------------------------------------------- 17
dict(
slug="planilha-ou-aplicativo-de-controle-financeiro", cat="organizacao-financeira", featured=False,
title="Planilha ou aplicativo de controle financeiro: qual escolher?",
seo_title="Planilha ou aplicativo de controle financeiro? Comparação | Bivvo",
desc="Uma comparação honesta entre planilha e aplicativo de controle financeiro: esforço, flexibilidade, privacidade e para quem cada um funciona melhor.",
short="Uma comparação honesta, incluindo quando a planilha é a melhor escolha.",
answer="""<p><strong>A planilha é melhor para quem gosta de montar a própria estrutura e não se importa em abrir o computador com frequência. O aplicativo é melhor para quem quer registrar rápido, no celular, e ter os cálculos prontos.</strong> Nenhum dos dois resolve sozinho. A melhor ferramenta é a que você vai continuar usando depois do primeiro mês.</p>""",
answer_key="A melhor ferramenta é a que você usa no segundo mês",
sections=[
("Comparação direta", """<div class="table-wrap"><table><thead><tr><th>Critério</th><th>Planilha</th><th>Aplicativo</th></tr></thead><tbody>
<tr><td>Registrar um gasto</td><td>Abrir arquivo e digitar a linha</td><td>Alguns toques, às vezes por voz ou foto</td></tr>
<tr><td>Flexibilidade</td><td>Total, você define tudo</td><td>Limitada ao que o app oferece</td></tr>
<tr><td>Cálculos e gráficos</td><td>Você monta e mantém as fórmulas</td><td>Prontos e atualizados sozinhos</td></tr>
<tr><td>Cartão e parcelas</td><td>Exige fórmulas trabalhosas</td><td>Normalmente calculado automaticamente</td></tr>
<tr><td>Lembretes</td><td>Não tem</td><td>Avisos de vencimento e resumos</td></tr>
<tr><td>Custo</td><td>Geralmente grátis</td><td>Grátis ou com planos pagos</td></tr>
<tr><td>Privacidade</td><td>Dados ficam com você</td><td>Depende da política do app</td></tr>
</tbody></table></div>"""),
("Quando a planilha é a melhor escolha", """<p>Se você gosta de criar sua própria lógica, precisa de análises muito específicas ou controla finanças de um pequeno negócio junto com as pessoais, a planilha oferece liberdade que nenhum app oferece. Funciona bem para quem já tem o hábito de abrir o computador todos os dias.</p>"""),
("Quando o aplicativo funciona melhor", """<p>Se o problema é esquecer de anotar, se a maior parte dos gastos acontece fora de casa ou se você tem cartões com parcelas e datas diferentes, o app reduz o esforço e faz as contas que a planilha exigiria montar. Funciona bem para quem quer abrir, entender e fechar em poucos segundos.</p>"""),
("O que verificar antes de escolher um aplicativo", """<ul><li><strong>Privacidade:</strong> quais dados são coletados, se há anúncios e se os dados são vendidos ou compartilhados.</li><li><strong>Exportação:</strong> se você consegue levar seus dados embora.</li><li><strong>Segurança:</strong> se oferece verificação em duas etapas.</li><li><strong>Plano gratuito:</strong> se dá para testar o essencial sem pagar.</li><li><strong>Respostas, não só gráficos:</strong> se ele mostra o que fazer com os números.</li></ul>"""),
("Dá para usar os dois?", """<p>Sim. Algumas pessoas registram no app no dia a dia e exportam para a planilha uma vez por mês para análises mais detalhadas. O importante é ter uma única fonte de verdade para o registro, para não duplicar trabalho.</p>"""),
],
example=None,
mistakes=["Escolher a ferramenta mais completa em vez da que você vai usar todo dia.","Baixar vários apps e manter registros espalhados.","Montar uma planilha tão detalhada que preenchê-la vira um trabalho.","Não verificar a política de privacidade antes de cadastrar dados financeiros."],
faq=[("Aplicativo de controle financeiro é seguro?","Depende do app. Verifique se usa conexão segura, oferece verificação em duas etapas, explica como trata seus dados e permite excluir a conta."),
("Preciso conectar minha conta bancária?","Não necessariamente. Muitos apps funcionam com registro manual, o que dá mais controle sobre o que é compartilhado."),
("Qual a diferença entre controle e planejamento?","Controle registra o que aconteceu. Planejamento decide o que vai acontecer. Veja [[como-fazer-controle-financeiro-pessoal|como fazer controle financeiro pessoal]].")],
related=["como-fazer-controle-financeiro-pessoal","melhor-forma-de-controlar-gastos","como-organizar-a-vida-financeira","como-controlar-gastos-mensais"],
tools=["gastar-hoje","comprometimento"],
bivvo="O Bivvo tem plano gratuito para começar, sem anúncios, com verificação em duas etapas e importação de extrato em CSV ou OFX. A exportação em planilha faz parte dos planos pagos. Ele funciona no navegador do celular e pode ser instalado como app.",
),
# ---------------------------------------------------------------- 18
dict(
slug="melhor-forma-de-controlar-gastos", cat="organizacao-financeira", featured=False,
title="Qual a melhor forma de controlar gastos? Escolha pelo seu perfil",
seo_title="Melhor forma de controlar gastos: 4 métodos comparados | Bivvo",
desc="Anotar na hora, revisar o extrato, envelopes ou valor por dia? Compare quatro métodos de controle de gastos e descubra qual combina com você.",
short="Quatro métodos comparados e como escolher o que combina com você.",
answer="""<p>A melhor forma de controlar gastos é <strong>a que você consegue manter</strong>. Os quatro métodos mais usados são: anotar na hora, revisar o extrato uma vez por semana, separar dinheiro em envelopes por categoria e acompanhar um valor diário disponível. Quem esquece de anotar se dá melhor com revisão semanal ou valor diário. Quem gasta por impulso tende a se beneficiar dos envelopes.</p>""",
answer_key="Método certo = esforço que você aceita + problema que você tem",
sections=[
("Método 1: anotar na hora", """<p>Cada gasto é registrado logo depois de acontecer. É o método mais preciso e o que mais ajuda a perceber padrões. Funciona para quem tem o celular sempre à mão e não se importa com alguns segundos por registro. Falha quando a rotina é corrida e os registros começam a acumular.</p>"""),
("Método 2: revisão semanal do extrato", """<p>Uma vez por semana, você abre o extrato e a fatura e classifica tudo. Exige menos disciplina diária e ainda permite corrigir o rumo dentro do mês. A desvantagem é perder a consciência no momento da compra.</p>"""),
("Método 3: envelopes", """<p>Você separa o dinheiro de cada categoria no início do mês, em envelopes físicos ou em “caixinhas” digitais do banco. Quando o envelope do lazer acaba, o lazer acabou. É muito eficaz contra gastos por impulso, mas pede organização no começo do mês e funciona pior com cartão de crédito.</p>"""),
("Método 4: valor por dia", """<p>Em vez de várias categorias, você acompanha um único número: quanto pode gastar hoje sem comprometer as contas. Se gastar menos, sobra para amanhã. Se gastar mais, o valor dos próximos dias diminui. É o mais simples de acompanhar e explicamos o cálculo em [[quanto-posso-gastar-por-dia|quanto posso gastar por dia]].</p>"""),
("Como escolher", """<div class="table-wrap"><table><thead><tr><th>Seu principal problema</th><th>Método que costuma funcionar</th></tr></thead><tbody>
<tr><td>Esqueço de anotar</td><td>Revisão semanal ou valor por dia</td></tr>
<tr><td>Gasto por impulso</td><td>Envelopes ou valor por dia</td></tr>
<tr><td>Não sei para onde vai o dinheiro</td><td>Anotar na hora, por dois meses</td></tr>
<tr><td>Uso muito cartão de crédito</td><td>Anotar na hora com as parcelas</td></tr>
<tr><td>Tenho pouco tempo</td><td>Valor por dia</td></tr>
</tbody></table></div>
<p>Combinar métodos também funciona: registrar na hora e olhar o valor do dia, por exemplo.</p>"""),
],
example=None,
mistakes=["Escolher o método mais detalhado quando o problema é falta de tempo.","Usar envelopes e continuar comprando no crédito como se fosse outra conta.","Trocar de método toda semana sem dar tempo para o hábito se formar.","Controlar sem nunca transformar os números em uma decisão."],
faq=[("Quanto tempo leva para criar o hábito?","Varia muito de pessoa para pessoa. Dê pelo menos um mês completo ao método antes de julgar se funciona."),
("O método dos envelopes funciona com Pix?","Sim. Vários bancos permitem separar o saldo em caixinhas ou cofrinhos, que funcionam como envelopes digitais."),
("Preciso controlar todos os gastos para sempre?","Não necessariamente. Depois de alguns meses, algumas pessoas passam a acompanhar só o valor livre e as categorias que mais variam.")],
related=["como-fazer-controle-financeiro-pessoal","como-controlar-gastos-mensais","quanto-posso-gastar-por-dia","planilha-ou-aplicativo-de-controle-financeiro"],
tools=["gastar-hoje","comprometimento"],
bivvo="O Bivvo combina dois métodos: você anota em segundos, por texto, voz ou foto do comprovante, e a tela inicial mostra o valor que ainda está livre para hoje, já descontando contas e faturas.",
),
# ---------------------------------------------------------------- 19
dict(
slug="quanto-posso-gastar-por-mes", cat="orcamento", featured=False,
title="Quanto posso gastar por mês? Faça a conta do jeito certo",
seo_title="Quanto posso gastar por mês? Como calcular | Bivvo",
desc="O quanto você pode gastar no mês é o que sobra depois dos compromissos, das parcelas, dos gastos anuais e do valor que você quer guardar. Veja a conta.",
short="A conta que separa o que já tem dono do que é realmente livre.",
answer="""<p>Você pode gastar por mês <strong>o que sobra da renda líquida depois de descontar as contas fixas, as parcelas e a fatura já comprometidas, a parcela mensal dos gastos anuais e o valor que você decidiu guardar</strong>. Esse resultado é o limite para gastos variáveis, como mercado, lazer e compras. Se a conta der negativa, o problema está nos compromissos, não no dia a dia.</p>""",
answer_key="Renda − fixos − parcelas − anuais ÷ 12 − guardar",
sections=[
("Cada parte da conta", """<ul><li><strong>Renda líquida:</strong> o que cai na conta, sem contar valores incertos.</li><li><strong>Contas fixas:</strong> moradia, contas da casa, escola, plano de saúde, transporte fixo.</li><li><strong>Parcelas já comprometidas:</strong> as que vão aparecer na fatura do mês, mesmo de compras antigas.</li><li><strong>Gastos anuais ÷ 12:</strong> IPVA, IPTU, seguros e outros que vencem uma vez por ano.</li><li><strong>Valor para guardar:</strong> decidido antes, não o que sobrar.</li></ul>"""),
("O mês do calendário ou o mês do salário?", """<p>Faça a conta do dia em que você recebe até o dia anterior ao próximo pagamento. Se o salário cai no dia 5, o seu “mês” vai do dia 5 ao dia 4 do mês seguinte. Contas que vencem nesse intervalo saem desse salário.</p>"""),
("Por que o saldo da conta engana", """<p>Logo depois do salário, o saldo parece alto. Mas parte dele já pertence às contas que ainda vão vencer. Olhar o saldo como dinheiro livre é o caminho mais comum para chegar ao fim do mês no negativo. A conta acima separa o que já tem dono do que realmente é seu para decidir.</p>"""),
("Do mensal para o diário", """<p>Com o valor mensal em mãos, divida pelos dias até a próxima renda para ter uma referência diária. Ela é mais fácil de usar no momento da compra, como explicamos em [[quanto-posso-gastar-por-dia|quanto posso gastar por dia]]. Para conhecer a abordagem do Bivvo para essa pergunta, veja a página [[page:qpg|quanto posso gastar]].</p>"""),
("Se a conta deu negativa", """<p>Não adianta cortar o cafezinho. O desequilíbrio está nos compromissos: contas fixas, parcelas ou dívidas. Meça quanto da renda eles ocupam com a [[tool:comprometimento|calculadora de comprometimento de renda]] e veja por onde começar em [[como-organizar-dividas|como organizar dívidas]].</p>"""),
],
example=dict(title="Exemplo de cálculo", rows=[("Renda líquida","R$ 3.600"),("Contas fixas","− R$ 1.800"),("Parcelas na fatura do mês","− R$ 350"),("Gastos anuais ÷ 12","− R$ 150"),("Guardar","− R$ 300")], total=("Pode gastar no mês","R$ 1.000"), note="Valores fictícios. Em 30 dias, a referência é de cerca de R$ 33 por dia para gastos variáveis."),
mistakes=["Usar o saldo logo depois do salário como se fosse dinheiro livre.","Esquecer as parcelas de compras antigas que ainda estão na fatura.","Considerar renda extra incerta como se já tivesse entrado.","Deixar o valor para guardar como “o que sobrar”."],
faq=[("A fatura do cartão entra como gasto ou compromisso?","A parte que vem de parcelas antigas é compromisso. As compras novas do mês saem do valor livre para gastar."),
("Devo incluir o mercado nas contas fixas?","Não. O mercado é essencial, mas variável. Ele sai do valor livre, com um limite próprio."),
("E se eu recebo em duas datas?","Faça a conta para cada período separadamente, associando cada conta à entrada que vai pagá-la.")],
related=["quanto-posso-gastar-por-dia","como-fazer-orcamento-mensal","como-controlar-compras-parceladas","como-dividir-o-salario"],
tools=["comprometimento","gastar-hoje"],
bivvo="O Bivvo faz essa conta continuamente: ele considera seu saldo, as contas e faturas que vencem antes da próxima renda e a meta de guardar, e mostra o que está livre de verdade.",
),
# ---------------------------------------------------------------- 20
dict(
slug="quanto-posso-gastar-por-dia", cat="orcamento", featured=True,
title="Quanto posso gastar por dia? A conta até o próximo salário",
seo_title="Quanto posso gastar por dia? Calcule seu valor diário | Bivvo",
desc="Divida o que está livre de verdade pelos dias até a próxima renda. Veja a conta, como lidar com o fim de semana e o que fazer quando estoura.",
short="Um único número para decidir na hora da compra.",
answer="""<p>Para saber quanto pode gastar por dia, <strong>pegue o saldo atual, desconte as contas e faturas que vencem até a próxima renda e o valor que você quer guardar, e divida o resultado pelo número de dias até receber de novo</strong>. Esse valor diário é uma referência para gastos variáveis. Se gastar menos hoje, sobra mais para os próximos dias.</p>""",
answer_key="(Saldo − contas até a renda − guardar) ÷ dias até a renda",
sections=[
("Por que dividir até a próxima renda", """<p>Dividir por 30 só funciona no dia do pagamento. No dia 20, faltam menos dias e talvez menos dinheiro. A conta precisa usar o que existe agora e o tempo que falta até entrar dinheiro de novo. Por isso o valor diário muda todos os dias e é refeito a partir do saldo real.</p>"""),
("O que descontar do saldo", """<ul><li>Contas que vencem antes da próxima renda.</li><li>Faturas de cartão que vencem nesse período.</li><li>O valor que você ainda quer guardar no mês.</li></ul>
<p>Compras novas no cartão de crédito também consomem o valor do dia, mesmo que só sejam pagas depois. Ignorá-las faz o número parecer maior do que é. Quer fazer a conta agora? Use a ferramenta [[tool:gastar-hoje|quanto posso gastar hoje]].</p>"""),
("Como lidar com o fim de semana", """<p>Se os sábados e domingos costumam ser mais caros, guarde parte do valor dos dias úteis para eles. Uma forma simples: gaste até 70% do valor diário de segunda a sexta e acumule a diferença para o fim de semana.</p>"""),
("Gastou mais que o valor do dia?", """<p>Não é motivo para abandonar o controle. O excesso apenas reduz o valor dos próximos dias. Se você gastou R$ 60 a mais hoje e faltam 12 dias, o valor diário cai cerca de R$ 5. Ver essa consequência no dia seguinte é o que torna o método eficiente.</p>"""),
("Quando o resultado é zero ou negativo", """<p>Significa que os compromissos até a próxima renda são maiores do que o dinheiro disponível. Priorize as contas essenciais, procure os credores antes do vencimento e evite cobrir a diferença com cheque especial. Depois, revise o mês seguinte com [[quanto-posso-gastar-por-mes|quanto posso gastar por mês]].</p>"""),
],
example=dict(title="Exemplo de cálculo do valor diário", rows=[("Saldo hoje","R$ 1.500"),("Contas até a próxima renda","− R$ 620"),("Fatura que vence no período","− R$ 380"),("Ainda quero guardar","− R$ 100"),("Dias até a próxima renda","10")], total=("Pode gastar por dia","R$ 40"), note="Valores fictícios. Livre: R$ 400 para 10 dias."),
mistakes=["Dividir o salário por 30 e não refazer a conta durante o mês.","Esquecer que compras no crédito também consomem o valor do dia.","Usar o valor diário para contas fixas, que já foram descontadas.","Abandonar o controle depois de um dia acima do valor."],
faq=[("Posso acumular o que não gastei?","Sim. O que você não gasta hoje aumenta o valor disponível nos próximos dias."),
("O valor diário inclui mercado?","Inclui, se o mercado for pago com esse dinheiro. Se você separa um valor fixo para o mercado no começo do mês, desconte-o antes de calcular."),
("Funciona com renda variável?","Funciona, desde que você use como próxima renda apenas a entrada que tem certeza que vai acontecer.")],
related=["quanto-posso-gastar-por-mes","como-organizar-o-salario","melhor-forma-de-controlar-gastos","como-controlar-gastos-mensais"],
tools=["gastar-hoje","cartao"],
bivvo="Essa é a principal tela do Bivvo: ao abrir o app, você vê quanto pode gastar hoje, já considerando contas, faturas, a meta de guardar e os dias até o próximo dinheiro entrar.",
),
]
