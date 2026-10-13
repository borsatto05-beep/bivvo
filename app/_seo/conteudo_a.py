# -*- coding: utf-8 -*-
"""Central Aprenda — artigos 1 a 10.
Links internos: [[slug|texto]] para artigos e [[tool:id|texto]] para ferramentas.
Todos os números são exemplos fictícios, sempre rotulados como exemplo."""

ARTICLES_A = [
# ---------------------------------------------------------------- 1
dict(
slug="como-organizar-a-vida-financeira", cat="organizacao-financeira", featured=True,
title="Como organizar a vida financeira: um roteiro para a primeira semana",
seo_title="Como organizar a vida financeira em 5 passos | Bivvo",
desc="Um roteiro prático para organizar a vida financeira em uma semana: o que levantar, como separar as contas e qual rotina manter depois.",
short="Um roteiro de cinco etapas para sair da bagunça e saber para onde vai cada real.",
answer="""<p>Organizar a vida financeira é responder três perguntas: <strong>quanto entra, quanto já está comprometido e quanto sobra de verdade</strong>. Na prática, você faz isso em cinco etapas: levantar a situação atual, listar os compromissos, separar gastos fixos e variáveis, decidir um plano simples para o mês e manter uma revisão curta toda semana.</p>""",
answer_key="Entradas − compromissos = o que você pode decidir",
sections=[
("Etapa 1: fotografe a situação de hoje", """<p>Antes de qualquer plano, anote a posição atual sem julgamento. Você precisa de quatro números: saldo nas contas, valor da próxima fatura de cada cartão, dívidas em aberto e dinheiro guardado. Não precisa ser exato no centavo. O objetivo é sair do “acho que está tudo bem” para um retrato real.</p>
<p>Se esse passo assusta, comece só pelo saldo e pela fatura. Já é suficiente para a primeira decisão da semana.</p>"""),
("Etapa 2: liste tudo o que já tem dono", """<p>Compromisso é o dinheiro que já tem destino antes mesmo de você gastar: aluguel, condomínio, energia, internet, plano de celular, escola, parcelas no cartão, empréstimos. Escreva o valor e o dia em que vence.</p>
<p>Inclua também os gastos que aparecem uma vez por ano, como IPVA, IPTU, seguro e material escolar. Eles costumam desorganizar o mês porque ninguém lembra deles até chegarem.</p>"""),
("Etapa 3: separe fixo de variável", """<p>Gastos fixos têm valor parecido todo mês e são difíceis de mudar de um dia para o outro. Gastos variáveis mudam conforme as escolhas do dia a dia: mercado, delivery, transporte por aplicativo, lazer, compras.</p>
<p>Essa separação mostra onde existe margem de manobra. Cortar um gasto fixo exige negociação ou mudança de contrato. Ajustar um variável depende da decisão de hoje. Por isso o controle diário quase sempre começa pelos variáveis, como mostra o guia [[como-controlar-gastos-mensais|como controlar gastos mensais]].</p>"""),
("Etapa 4: monte um plano simples para o mês", """<p>Com renda, compromissos e variáveis na mesa, defina só três coisas:</p>
<ul><li><strong>Quanto vai para os compromissos</strong>, que é um número que você já conhece.</li><li><strong>Quanto você quer guardar</strong>, mesmo que seja pouco. Separar no dia em que o dinheiro entra funciona melhor do que esperar sobrar.</li><li><strong>Quanto fica livre para o dia a dia</strong>, que é o que sobra das duas linhas anteriores.</li></ul>
<p>Esse é o esqueleto de um orçamento. Se quiser aprofundar com categorias e limites, veja [[como-fazer-orcamento-mensal|como fazer um orçamento mensal]].</p>"""),
("Etapa 5: crie uma rotina de dez minutos por semana", """<p>Organização não é um evento, é um hábito curto. Escolha um dia fixo da semana e responda: quanto gastei nos variáveis, o que vence nos próximos sete dias e se o plano do mês ainda cabe. Se não couber, ajuste agora, não no fim do mês.</p>
<p>Dez minutos semanais evitam a sensação de descobrir tudo no extrato quando já não dá para mudar nada.</p>"""),
],
example=dict(title="Exemplo de retrato inicial", rows=[("Renda líquida do mês","R$ 3.200"),("Compromissos fixos","− R$ 1.650"),("Parcelas e fatura já comprometidas","− R$ 480"),("Guardar no dia do pagamento","− R$ 200")], total=("Livre para o dia a dia","R$ 870"), note="Valores fictícios. Com R$ 870 para 30 dias, a referência fica perto de R$ 29 por dia."),
mistakes=["Começar comprando planilha, curso ou app antes de saber quanto entra e quanto sai.","Esquecer gastos anuais e tratá-los como “imprevistos” todo ano.","Tentar cortar tudo de uma vez e desistir na segunda semana.","Olhar só o saldo da conta, sem descontar o que ainda vai vencer."],
faq=[("Quanto tempo leva para organizar a vida financeira?","O primeiro retrato leva de uma a duas horas. A organização de verdade aparece depois de dois ou três meses de rotina, quando você passa a prever o mês em vez de reagir a ele."),
("Preciso quitar as dívidas antes de organizar?","Não. Organizar vem primeiro, porque é o que mostra quanto você pode destinar às dívidas sem atrasar as contas essenciais. Depois, siga o roteiro de [[como-sair-das-dividas|como sair das dívidas]]."),
("E se a renda não é fixa?","Use como base a menor renda dos últimos três a seis meses. O que entrar acima disso vai primeiro para a reserva e para os compromissos dos meses mais fracos.")],
related=["como-fazer-controle-financeiro-pessoal","como-fazer-orcamento-mensal","como-controlar-gastos-mensais","como-montar-reserva-de-emergencia"],
tools=["comprometimento","gastar-hoje"],
bivvo="No Bivvo, o retrato inicial vira um número que se atualiza sozinho: você informa renda, contas e cartões uma vez e o app mostra quanto está livre hoje, o que vence nos próximos dias e se o mês continua cabendo.",
),
# ---------------------------------------------------------------- 2
dict(
slug="como-fazer-controle-financeiro-pessoal", cat="organizacao-financeira", featured=True,
title="Como fazer controle financeiro pessoal sem desistir no primeiro mês",
seo_title="Como fazer controle financeiro pessoal na prática | Bivvo",
desc="O que registrar, com que frequência revisar e quais números acompanhar para que o controle financeiro pessoal funcione de verdade.",
short="O que registrar, quando revisar e quais números realmente importam.",
answer="""<p>Controle financeiro pessoal é <strong>registrar o que entra e sai e revisar esses registros com uma pergunta clara</strong>. O registro sozinho não muda nada. O que muda é olhar, toda semana, se o dinheiro está indo para onde você decidiu. Para funcionar, o método precisa ser rápido de alimentar e mostrar poucos números importantes.</p>""",
answer_key="Registrar + revisar com uma pergunta = controle",
sections=[
("O que registrar (e o que pode ficar de fora)", """<p>Você precisa de três tipos de informação:</p>
<ul><li><strong>Entradas:</strong> salário, renda extra, reembolsos.</li><li><strong>Saídas:</strong> cada gasto com valor, data e uma categoria.</li><li><strong>Compromissos futuros:</strong> contas que vão vencer e parcelas que ainda vão aparecer na fatura.</li></ul>
<p>A terceira lista é a que mais gente esquece, e é ela que explica o “mas eu tinha dinheiro na conta”. Detalhes como a loja exata ou observações longas podem ficar de fora. Quanto mais trabalho cada registro der, menor a chance de você continuar.</p>"""),
("Use poucas categorias", """<p>Dez a quinze categorias bastam: moradia, mercado, alimentação fora, transporte, saúde, educação, lazer, compras, assinaturas, dívidas e “outros”. Categorias demais fazem você perder tempo decidindo onde encaixar cada gasto e dificultam a comparação entre meses.</p>
<p>Uma boa regra é: se uma categoria ficar abaixo de 2% dos gastos por três meses, junte com outra.</p>"""),
("Quando registrar", """<p>O melhor momento é logo depois do gasto, porque leva segundos e você ainda lembra o que foi. Se isso não combina com sua rotina, registre uma vez por dia, à noite, olhando o extrato e o app do cartão. O pior cenário é deixar para o fim do mês: a memória falha e o controle vira arqueologia.</p>"""),
("Os quatro números que valem a revisão", """<p>Na revisão semanal, olhe só isto:</p>
<ol><li>Quanto ainda está livre até a próxima renda.</li><li>Quais contas e faturas vencem nos próximos sete dias.</li><li>Qual categoria variável mais cresceu em relação ao mês passado.</li><li>Quanto você já guardou no mês.</li></ol>
<p>Se esses quatro estão sob controle, o resto está bem encaminhado. Se não estão, você sabe exatamente onde agir.</p>"""),
("Planilha, caderno ou aplicativo?", """<p>Qualquer ferramenta funciona se você usa. A diferença está no esforço: planilha dá liberdade, mas exige que você monte fórmulas e lembre de abrir. App reduz o trabalho de registro e faz as contas sozinho. Fizemos uma comparação honesta em [[planilha-ou-aplicativo-de-controle-financeiro|planilha ou aplicativo de controle financeiro]].</p>"""),
],
example=dict(title="Exemplo de revisão semanal", rows=[("Livre até o dia 5","R$ 640"),("Vence nos próximos 7 dias","Internet R$ 99 · Celular R$ 55"),("Categoria que mais cresceu","Delivery, +R$ 85"),("Guardado no mês","R$ 150 de R$ 250")], total=("Decisão da semana","Segurar o delivery até sexta"), note="Valores fictícios. A revisão termina com uma decisão concreta, não só com números."),
mistakes=["Criar categorias demais e passar mais tempo classificando do que decidindo.","Registrar só o débito e esquecer as compras no cartão de crédito.","Revisar sem uma pergunta definida e terminar apenas “vendo números”.","Recomeçar do zero toda vez que falha um dia de registro."],
faq=[("Preciso anotar gastos pequenos?","Sim, pelo menos no começo. Compras pequenas e frequentes costumam somar mais do que parece. Depois de dois meses você saberá se vale continuar detalhando."),
("Controle financeiro é o mesmo que orçamento?","Não. Controle olha o que aconteceu. Orçamento decide o que vai acontecer. Os dois se completam: veja [[como-fazer-orcamento-mensal|como fazer um orçamento mensal]]."),
("E se eu esquecer de registrar alguns dias?","Registre o que conseguir lembrar pelo extrato e siga em frente. Um controle com pequenas falhas ainda é muito melhor do que nenhum.")],
related=["como-organizar-a-vida-financeira","melhor-forma-de-controlar-gastos","planilha-ou-aplicativo-de-controle-financeiro","como-controlar-gastos-mensais"],
tools=["gastar-hoje","comprometimento"],
bivvo="O Bivvo foi feito para reduzir o trabalho do registro: você anota por texto rápido, por voz ou lendo um comprovante, e os quatro números da revisão aparecem na tela inicial sem montar nenhuma fórmula.",
),
# ---------------------------------------------------------------- 3
dict(
slug="como-controlar-gastos-mensais", cat="economia", featured=False,
title="Como controlar gastos mensais: foque no que muda todo dia",
seo_title="Como controlar gastos mensais sem planilha complicada | Bivvo",
desc="Os gastos que mais fogem do controle são os variáveis. Veja como definir um teto semanal, identificar vazamentos e ajustar o mês antes que ele acabe.",
short="Teto semanal, vazamentos pequenos e ajustes no meio do mês.",
answer="""<p>Para controlar gastos mensais, <strong>separe os fixos dos variáveis e coloque um teto semanal só nos variáveis</strong>. Contas fixas você já conhece e paga. O que estoura o mês é mercado, delivery, transporte e compras por impulso. Um teto por semana é mais fácil de seguir do que um limite mensal, porque você corrige o rumo quatro vezes por mês em vez de uma.</p>""",
answer_key="Teto semanal = dinheiro livre do mês ÷ semanas restantes",
sections=[
("Por que o limite mensal costuma falhar", """<p>Um limite de R$ 1.200 para o mês parece confortável no dia 3. No dia 20, você descobre que já usou R$ 1.050. O problema não é falta de disciplina: um número grande e distante não ajuda a decidir o gasto de hoje.</p>
<p>Quebrar o valor em semanas devolve a sensação de escala. R$ 300 por semana é uma referência que você consegue comparar com o carrinho do mercado.</p>"""),
("Como calcular o teto semanal", """<p>Pegue o que sobra depois dos compromissos e do valor que você quer guardar. Divida pelo número de semanas que faltam até a próxima renda. Se uma semana passar do teto, a diferença sai da semana seguinte, não da reserva.</p>
<p>Quem prefere um número por dia pode usar a mesma lógica, explicada em [[quanto-posso-gastar-por-dia|quanto posso gastar por dia]].</p>"""),
("Procure os vazamentos pequenos", """<p>Gastos de R$ 10 a R$ 30 raramente parecem um problema isoladamente. Juntos, viram uma das maiores categorias do mês. Exemplos comuns: café, lanche, taxa de entrega, transporte por aplicativo em trajetos curtos, assinaturas esquecidas.</p>
<p>Não precisa eliminar tudo. Escolha um vazamento por mês e defina uma regra simples para ele, como “delivery só no fim de semana”.</p>"""),
("Use a regra das 24 horas para compras não planejadas", """<p>Para compras acima de um valor que você define, por exemplo R$ 150, espere 24 horas antes de pagar. Se no dia seguinte ainda fizer sentido e couber no teto, compre sem culpa. Muitas vontades passam sozinhas nesse intervalo.</p>"""),
("Ajuste no meio do mês, não no fim", """<p>No dia 15, compare quanto já gastou nos variáveis com quanto tinha planejado para a primeira metade. Se estiver acima, você ainda tem duas semanas para compensar. No dia 30, a única coisa possível é lamentar.</p>"""),
],
example=dict(title="Exemplo: o efeito dos gastos pequenos", rows=[("Café e lanche","18 vezes de R$ 14 = R$ 252"),("Taxas de entrega","9 vezes de R$ 8 = R$ 72"),("Corridas curtas por aplicativo","12 vezes de R$ 15 = R$ 180")], total=("Total no mês","R$ 504"), note="Valores fictícios. Nenhum gasto passou de R$ 15, mas juntos somaram mais que uma conta de luz e internet."),
mistakes=["Colocar teto também nas contas fixas, que não mudam com força de vontade.","Compensar a semana estourada usando a reserva de emergência.","Cortar todos os pequenos prazeres ao mesmo tempo e abandonar o plano.","Olhar os gastos só quando a fatura chega."],
faq=[("Qual a diferença entre gasto fixo e variável?","Fixo tem valor previsível e se repete, como aluguel e internet. Variável depende das suas escolhas no período, como mercado, lazer e delivery."),
("O mercado é fixo ou variável?","Variável. Ele é essencial, mas o valor muda conforme o que você escolhe comprar, então vale ter um teto semanal para ele também."),
("Como lidar com gastos que caem todos de uma vez?","Divida o valor anual por 12 e trate como um compromisso mensal. Assim o mês em que ele vence não estoura.")],
related=["melhor-forma-de-controlar-gastos","quanto-posso-gastar-por-dia","como-economizar-dinheiro-ganhando-pouco","como-fazer-orcamento-mensal"],
tools=["gastar-hoje","comprometimento"],
bivvo="O Bivvo compara seus gastos de cada categoria com o mesmo período do mês anterior e avisa quando algo cresce, como delivery 30% acima. Assim você ajusta no meio do mês, quando ainda dá tempo.",
),
# ---------------------------------------------------------------- 4
dict(
slug="como-organizar-o-salario", cat="orcamento", featured=True,
title="Como organizar o salário no dia em que ele cai",
seo_title="Como organizar o salário: a ordem certa de pagar | Bivvo",
desc="A ordem para organizar o salário assim que ele cai: essenciais, fatura, valor guardado e o que fica livre até o próximo pagamento.",
short="A ordem certa para distribuir o dinheiro assim que ele entra.",
answer="""<p>Organize o salário em uma ordem fixa, no próprio dia do pagamento: <strong>primeiro as contas essenciais, depois a fatura do cartão, em seguida o valor que você quer guardar e, por último, o que sobra para gastar até o próximo salário</strong>. Inverter essa ordem, gastando primeiro e guardando “o que sobrar”, é o motivo mais comum de nunca sobrar nada.</p>""",
answer_key="Essenciais → fatura → guardar → livre",
sections=[
("Por que a ordem importa", """<p>O salário é o momento em que você tem mais dinheiro e mais sensação de folga. Se as decisões ficam para depois, cada pequena compra parece caber, até que uma conta importante encontra a conta vazia. Distribuir no primeiro dia transforma a folga aparente em um valor real e limitado.</p>"""),
("1. Separe as contas essenciais", """<p>Moradia, energia, água, gás, internet, transporte para o trabalho, saúde e escola. Se elas vencem em datas diferentes, separe o valor delas logo no dia do salário, mesmo que o pagamento seja só daqui a duas semanas. Uma conta separada ou um “cofrinho” no banco ajuda a não usar esse dinheiro sem perceber.</p>"""),
("2. Reserve o valor da fatura", """<p>A fatura do cartão já é um gasto feito. Trate-a como conta essencial e reserve o valor integral. Pagar só o mínimo leva ao crédito rotativo, um dos juros mais altos do mercado. Se a fatura não cabe, esse é um sinal para ler [[como-organizar-o-cartao-de-credito|como organizar o cartão de crédito]].</p>"""),
("3. Guarde antes de gastar", """<p>Defina um valor, mesmo pequeno, e mova no mesmo dia para a reserva ou para uma meta. Transferências automáticas programadas para o dia do pagamento funcionam muito bem. Para escolher o valor, veja [[quanto-guardar-do-salario-por-mes|quanto guardar do salário por mês]].</p>"""),
("4. O que sobra é seu dinheiro livre", """<p>Esse é o valor para mercado, lazer e imprevistos pequenos até o próximo pagamento. Divida pelos dias até a próxima renda para ter uma referência diária. Se você recebe adiantamento ou salário em duas parcelas, faça a conta para cada período separadamente.</p>"""),
("Se você recebe em mais de uma data", """<p>Com adiantamento no dia 20 e restante no dia 5, por exemplo, associe cada conta a uma das entradas. Contas que vencem entre os dias 5 e 19 saem do pagamento do dia 5. As que vencem entre 20 e 4 saem do adiantamento. Assim você evita usar o dinheiro de uma conta futura achando que é sobra.</p>"""),
],
example=dict(title="Exemplo de distribuição no dia do salário", rows=[("Salário líquido","R$ 2.800"),("Contas essenciais","− R$ 1.420"),("Fatura do cartão","− R$ 530"),("Guardar","− R$ 150")], total=("Livre até o próximo salário","R$ 700"), note="Valores fictícios. Com 30 dias até o próximo pagamento, a referência é de cerca de R$ 23 por dia."),
mistakes=["Pagar só as contas que vencem no dia e esquecer de separar as do fim do mês.","Contar o limite do cartão como se fosse parte do salário.","Deixar para guardar no fim do mês o que sobrar.","Ignorar o desconto de benefícios e impostos e planejar com o salário bruto."],
faq=[("Devo organizar com o salário bruto ou líquido?","Sempre com o líquido, o valor que realmente cai na conta."),
("E se o salário não cobre as contas essenciais?","Então o primeiro passo é rever compromissos e dívidas, não cortar o lazer. Veja [[como-economizar-dinheiro-ganhando-pouco|como economizar ganhando pouco]] e [[como-organizar-dividas|como organizar dívidas]]."),
("Qual a diferença entre organizar e dividir o salário?","Organizar é a ordem de pagamento. Dividir é decidir percentuais para cada grupo de gastos, como no método 50/30/20. Explicamos em [[como-dividir-o-salario|como dividir o salário]].")],
related=["como-dividir-o-salario","quanto-guardar-do-salario-por-mes","quanto-posso-gastar-por-dia","como-fazer-orcamento-mensal"],
tools=["gastar-hoje","guardar"],
bivvo="No Bivvo, você cadastra o dia em que recebe e as contas com vencimento. O app já desconta o que vence antes do próximo salário e mostra só o que está livre de verdade, dividido pelos dias que faltam.",
),
# ---------------------------------------------------------------- 5
dict(
slug="como-dividir-o-salario", cat="orcamento", featured=False,
title="Como dividir o salário: 50/30/20 e alternativas para cada renda",
seo_title="Como dividir o salário: método 50/30/20 e variações | Bivvo",
desc="Entenda o método 50/30/20, quando ele não funciona e como adaptar a divisão do salário para rendas mais apertadas ou mais altas.",
short="O método 50/30/20, suas variações e como escolher a sua divisão.",
answer="""<p>Uma forma popular de dividir o salário é o <strong>50/30/20: 50% para necessidades, 30% para desejos e 20% para guardar ou quitar dívidas</strong>. Ele é um ponto de partida, não uma lei. Quando a renda é mais apertada, uma divisão como 60/30/10 ou 70/20/10 costuma ser mais realista. O que importa é que a parte de guardar exista e seja separada primeiro.</p>""",
answer_key="Necessidades / desejos / futuro",
sections=[
("O que entra em cada grupo", """<ul><li><strong>Necessidades:</strong> moradia, contas da casa, mercado básico, transporte, saúde, educação, parcelas de dívidas que você é obrigado a pagar.</li><li><strong>Desejos:</strong> restaurantes, delivery, lazer, viagens, roupas além do básico, assinaturas de entretenimento.</li><li><strong>Futuro:</strong> reserva de emergência, metas, investimentos e pagamentos extras para quitar dívidas mais rápido.</li></ul>
<p>Algumas despesas ficam na fronteira. Um plano de celular básico é necessidade. O modelo mais caro, com mais franquia do que você usa, tem uma parte de desejo.</p>"""),
("Quando o 50/30/20 não cabe", """<p>Em muitas cidades brasileiras, só aluguel e transporte já passam de 50% de uma renda menor. Nesse caso, forçar o método gera frustração. Ajuste os percentuais à sua realidade e trate a mudança como algo temporário, com um plano para voltar a aumentar a fatia do futuro.</p>"""),
("Variações mais comuns", """<div class="table-wrap"><table><thead><tr><th>Divisão</th><th>Para quem costuma servir</th></tr></thead><tbody>
<tr><td>50/30/20</td><td>Renda com folga razoável e custos fixos sob controle.</td></tr>
<tr><td>60/30/10</td><td>Custo de moradia alto, mas ainda com espaço para lazer.</td></tr>
<tr><td>70/20/10</td><td>Renda apertada, quando as necessidades ocupam quase tudo.</td></tr>
<tr><td>50/20/30</td><td>Quem está quitando dívidas caras e quer acelerar.</td></tr>
</tbody></table></div>"""),
("Como escolher a sua divisão", """<p>Some seus gastos essenciais reais e calcule quanto eles representam da renda líquida. Esse é o seu primeiro número. Depois defina uma fatia para o futuro que você consiga manter por seis meses, mesmo que seja 5%. O restante fica para desejos. Em três meses, revise e tente mover um ou dois pontos percentuais dos desejos para o futuro.</p>
<p>Se quiser saber quanto da renda já está preso em compromissos, use a [[tool:comprometimento|calculadora de comprometimento de renda]].</p>"""),
],
example=dict(title="Exemplo com renda líquida de R$ 2.000", rows=[("Necessidades (70%)","R$ 1.400"),("Desejos (20%)","R$ 400"),("Futuro (10%)","R$ 200")], total=("Total","R$ 2.000"), note="Valores fictícios. Com R$ 5.000, o mesmo raciocínio no 50/30/20 daria R$ 2.500, R$ 1.500 e R$ 1.000."),
mistakes=["Copiar o 50/30/20 sem checar se suas necessidades cabem em 50%.","Classificar quase tudo como necessidade para justificar o gasto.","Deixar a fatia do futuro para o fim do mês.","Nunca revisar a divisão quando a renda ou os custos mudam."],
faq=[("Quem criou o método 50/30/20?","Ele ficou conhecido pelo livro “All Your Worth”, de Elizabeth Warren e Amelia Warren Tyagi, publicado nos Estados Unidos em 2005."),
("Pagar dívida entra em necessidade ou futuro?","A parcela mínima obrigatória é necessidade. O que você paga além disso para quitar antes entra na fatia do futuro."),
("Posso usar porcentagens diferentes a cada mês?","Pode, mas mudar todo mês dificulta perceber evolução. Prefira revisar a cada três meses.")],
related=["como-organizar-o-salario","quanto-guardar-do-salario-por-mes","como-fazer-orcamento-mensal","quanto-posso-gastar-por-mes"],
tools=["comprometimento","guardar"],
bivvo="No Bivvo, você define quanto quer guardar por mês e acompanha os gastos por categoria. O app desconta essa meta do valor livre do dia, então a fatia do futuro deixa de depender de sobrar.",
),
# ---------------------------------------------------------------- 6
dict(
slug="quanto-guardar-do-salario-por-mes", cat="planejamento-financeiro", featured=False,
title="Quanto guardar do salário por mês",
seo_title="Quanto guardar do salário por mês? Como definir o valor | Bivvo",
desc="Uma referência comum é de 10% a 20% do salário, mas o valor certo depende do seu objetivo e do que cabe hoje. Veja como calcular o seu.",
short="Uma faixa de referência e o jeito de chegar ao seu próprio número.",
answer="""<p>Uma referência bastante usada é guardar <strong>entre 10% e 20% do salário líquido</strong>. Mas o valor certo para você sai de duas contas: quanto cabe hoje sem atrasar compromissos e quanto o seu objetivo exige. Se o objetivo pede mais do que cabe, você ajusta o prazo ou a meta, não as contas essenciais. Começar com 3% e aumentar aos poucos é melhor do que planejar 20% e desistir.</p>""",
answer_key="Valor mensal = (meta − já guardado) ÷ meses até o prazo",
sections=[
("Primeiro: o que cabe hoje", """<p>Pegue sua renda líquida e desconte compromissos fixos, fatura e uma estimativa realista dos gastos variáveis. O que sobra é o teto do que dá para guardar sem criar problema em outro lugar. Se esse número for zero ou negativo, o foco do momento é ajustar gastos ou dívidas, como mostra [[como-economizar-dinheiro-ganhando-pouco|como economizar ganhando pouco]].</p>"""),
("Depois: o que o objetivo pede", """<p>Para uma meta com valor e prazo, a conta é direta: o que falta dividido pelos meses até a data. Uma viagem de R$ 6.000 em 12 meses, com R$ 1.200 já guardados, pede R$ 400 por mês. Para fazer essa conta com os seus números, use a [[tool:guardar|calculadora de quanto guardar por mês]].</p>"""),
("Qual objetivo vem primeiro", """<p>Uma ordem que costuma funcionar para quem está começando:</p>
<ol><li>Um colchão inicial equivalente a um mês de gastos essenciais.</li><li>Quitar dívidas com juros altos, como rotativo e cheque especial.</li><li>Completar a reserva de emergência, assunto de [[quanto-ter-de-reserva-de-emergencia|quanto ter de reserva]].</li><li>Metas de médio prazo e investimentos de longo prazo.</li></ol>
<p>Guardar dinheiro rendendo pouco enquanto paga juros altos em outra dívida costuma ser um mau negócio, com exceção desse primeiro colchão, que evita novas dívidas.</p>"""),
("Como aumentar o percentual sem sofrer", """<p>Sempre que a renda subir, por reajuste, promoção ou renda extra, destine parte do aumento ao valor guardado antes de o padrão de vida se acostumar. Subir um ponto percentual a cada aumento parece pouco, mas em alguns anos muda completamente a sua fatia do futuro.</p>"""),
],
example=dict(title="Exemplo de cálculo", rows=[("Meta","R$ 6.000"),("Já guardado","R$ 1.200"),("Prazo","12 meses"),("Cabe no orçamento hoje","R$ 300 por mês")], total=("Valor necessário","R$ 400 por mês"), note="Valores fictícios. Como cabem R$ 300, a meta é atingida em 16 meses em vez de 12. Ajustar o prazo é melhor do que apertar as contas essenciais."),
mistakes=["Escolher um percentual alto que não se sustenta por mais de dois meses.","Guardar sem objetivo e acabar usando o dinheiro em compras.","Investir enquanto paga juros de rotativo do cartão.","Não considerar a rentabilidade, deixando a reserva parada sem render."],
faq=[("10% do salário é suficiente?","Para começar, sim. Para objetivos maiores ou para quem começou tarde, pode ser pouco. O ideal é calcular a partir do objetivo, não do percentual."),
("Devo guardar o 13º salário?","Ele é uma ótima oportunidade de reforçar a reserva ou quitar dívidas caras. Planeje antes de recebê-lo para não virar gasto de fim de ano."),
("Onde deixar o dinheiro guardado?","Depende do objetivo e do prazo. Para a reserva de emergência, o importante é segurança e resgate rápido, como explicamos em [[como-montar-reserva-de-emergencia|como montar uma reserva]].")],
related=["como-dividir-o-salario","como-montar-reserva-de-emergencia","como-fazer-planejamento-financeiro-pessoal","como-organizar-o-salario"],
tools=["guardar","reserva"],
bivvo="No Bivvo, cada meta mostra quanto falta e em quanto tempo você chega lá no ritmo atual. Você também define um percentual para guardar e o app já tira esse valor do que está livre para gastar.",
),
# ---------------------------------------------------------------- 7
dict(
slug="como-economizar-dinheiro-ganhando-pouco", cat="economia", featured=True,
title="Como economizar dinheiro ganhando pouco",
seo_title="Como economizar dinheiro ganhando pouco: o que funciona | Bivvo",
desc="Quando a renda é curta, cortar cafezinho não resolve. Veja onde estão os ajustes de maior impacto e como começar a guardar com valores pequenos.",
short="Onde estão os ajustes que realmente fazem diferença quando a renda é curta.",
answer="""<p>Quando se ganha pouco, a maior economia raramente vem de pequenos cortes do dia a dia. Ela vem de <strong>renegociar contas fixas, evitar juros e planejar as compras de mercado</strong>. Comece pelos gastos que se repetem todo mês, porque uma redução neles vale para todos os meses seguintes. Em paralelo, guarde um valor simbólico, como R$ 20, para criar o hábito.</p>""",
answer_key="Reduzir o que se repete vale mais que cortar o eventual",
sections=[
("Comece pelas contas que se repetem", """<p>Planos de celular, internet, TV e seguros costumam ter versões mais baratas ou descontos para quem pede. Ligue, compare ofertas de outras empresas e pergunte por planos menores. Uma redução de R$ 40 por mês é uma economia de R$ 480 por ano sem mudar nenhum hábito.</p>
<p>Revise também assinaturas: muitas vezes uma ou duas continuam ativas sem uso.</p>"""),
("Juros são o gasto mais caro de quem ganha pouco", """<p>Rotativo do cartão, cheque especial e atrasos com multa consomem dinheiro sem entregar nada em troca. Evitar um único mês de rotativo pode valer mais do que um mês inteiro de cortes no lazer. Se já existe dívida, veja [[como-organizar-dividas|como organizar dívidas]] antes de tentar guardar.</p>"""),
("Mercado com plano", """<ul><li>Faça uma lista a partir do que já existe em casa.</li><li>Compare o preço por quilo ou por litro, não o preço da embalagem.</li><li>Concentre as compras em menos idas: cada ida extra tende a trazer itens fora da lista.</li><li>Defina um teto por compra e leve esse número em mente.</li></ul>"""),
("Transporte e deslocamento", """<p>Verifique se o vale-transporte cobre todo o trajeto, se existe passe mensal mais barato e se algumas viagens por aplicativo podem ser substituídas. Transporte costuma ser uma das maiores despesas variáveis em cidades grandes.</p>"""),
("Guarde pouco, mas sempre", """<p>Guardar R$ 20 por semana parece insignificante, mas soma mais de R$ 1.000 em um ano e, mais importante, cria o hábito. Quando a renda melhorar, o hábito já existe e só o valor muda.</p>"""),
("Renda extra com cuidado", """<p>Às vezes o problema não é o gasto, é a renda. Trabalhos extras, venda de itens parados e serviços que você já sabe fazer podem ajudar. Desconfie de promessas de ganho fácil, “investimentos” com retorno garantido e qualquer oportunidade que peça pagamento antecipado para você começar.</p>"""),
],
example=dict(title="Exemplo: economia anual de ajustes recorrentes", rows=[("Plano de celular menor","R$ 25 por mês"),("Assinatura cancelada","R$ 22 por mês"),("Internet renegociada","R$ 30 por mês")], total=("Economia em 12 meses","R$ 924"), note="Valores fictícios. Nenhum desses ajustes muda a rotina, e o efeito se repete todo mês."),
mistakes=["Cortar só pequenos prazeres e manter contas fixas caras.","Guardar dinheiro enquanto paga juros de rotativo ou cheque especial.","Comprar no atacado itens que estragam antes de serem usados.","Cair em promessas de renda fácil que pedem pagamento antecipado."],
faq=[("Vale a pena guardar R$ 20 por mês?","Sim. O valor importa menos que o hábito e a sensação de ter uma reserva, por menor que seja, para não recorrer ao cartão em um imprevisto."),
("Devo usar a regra 50/30/20 ganhando pouco?","Provavelmente não de forma literal. Uma divisão como 70/20/10 costuma ser mais realista, como explicamos em [[como-dividir-o-salario|como dividir o salário]]."),
("Por onde começar se nada sobra?","Pela lista de compromissos fixos e dívidas. Ali estão as negociações com maior efeito ao longo do ano.")],
related=["como-controlar-gastos-mensais","como-dividir-o-salario","como-sair-das-dividas","quanto-guardar-do-salario-por-mes"],
tools=["comprometimento","guardar"],
bivvo="O Bivvo reúne suas assinaturas e contas fixas num só lugar, com o custo total por mês e por ano, e avisa quando uma categoria cresce em relação ao mês anterior. Isso ajuda a achar os ajustes recorrentes primeiro.",
),
# ---------------------------------------------------------------- 8
dict(
slug="como-montar-reserva-de-emergencia", cat="reserva-de-emergencia", featured=True,
title="Como montar uma reserva de emergência do zero",
seo_title="Como montar uma reserva de emergência do zero | Bivvo",
desc="Passo a passo para montar a reserva de emergência: definir o valor, começar com uma meta curta, escolher onde guardar e quando usar.",
short="Do primeiro mês de proteção até a reserva completa, passo a passo.",
answer="""<p>Para montar uma reserva de emergência, <strong>calcule seus gastos essenciais por mês, defina uma primeira meta de um mês de proteção e guarde todo mês em um lugar seguro e de resgate rápido</strong>. Depois que o primeiro mês estiver completo, aumente a meta aos poucos até a cobertura indicada para o seu perfil. A reserva só deve ser usada para emergências reais.</p>""",
answer_key="Primeira meta: 1 mês de gastos essenciais",
sections=[
("Passo 1: descubra seus gastos essenciais", """<p>Some o que você precisaria pagar mesmo em um mês difícil: moradia, contas da casa, mercado, transporte, saúde, escola e parcelas obrigatórias. Deixe de fora lazer, restaurantes e compras. Esse total é a unidade de medida da sua reserva.</p>"""),
("Passo 2: comece por uma meta curta", """<p>Mirar logo em seis meses de gastos pode parecer impossível. Comece com um mês. Ele já cobre boa parte dos imprevistos comuns, como conserto do carro, consulta, remédio ou um eletrodoméstico quebrado, sem recorrer ao cartão. Quanto deve ser a meta final é tema de [[quanto-ter-de-reserva-de-emergencia|quanto ter de reserva de emergência]].</p>"""),
("Passo 3: escolha onde guardar", """<p>Para a reserva, três características importam mais que rentabilidade:</p>
<ul><li><strong>Segurança:</strong> baixo risco de perder valor.</li><li><strong>Liquidez:</strong> resgate no mesmo dia ou no dia seguinte.</li><li><strong>Rendimento razoável:</strong> pelo menos acompanhar a inflação, para não perder poder de compra.</li></ul>
<p>Aplicações com liquidez diária e baixo risco costumam reunir essas características, como títulos públicos atrelados à Selic e CDBs com liquidez diária de bancos sólidos. Os CDBs contam com a garantia do FGC até o limite vigente por pessoa e instituição. Isto é informação educativa, não recomendação de investimento.</p>"""),
("Passo 4: automatize", """<p>Programe uma transferência para o dia em que o salário cai. Guardar no começo do mês evita que o valor seja consumido pelos gastos do dia a dia. Se a renda é variável, defina um percentual de cada entrada em vez de um valor fixo.</p>"""),
("Passo 5: defina o que é emergência", """<p>Emergência é algo inesperado e necessário: perda de renda, problema de saúde, conserto essencial. Viagem, promoção e presente não são emergência, por melhores que pareçam. Escrever essa regra antes evita discussões consigo mesmo depois.</p>"""),
("Passo 6: usou? Reponha", """<p>Se precisar usar a reserva, não há motivo para culpa: ela existe para isso. Volte a guardar no mês seguinte até repor o valor, antes de retomar outras metas.</p>"""),
],
example=dict(title="Exemplo de construção da reserva", rows=[("Gastos essenciais por mês","R$ 2.100"),("Primeira meta (1 mês)","R$ 2.100"),("Guardando por mês","R$ 300")], total=("Primeira meta atingida em","7 meses"), note="Valores fictícios, sem considerar rendimento. Com o mesmo ritmo, três meses de proteção levariam cerca de 21 meses."),
mistakes=["Deixar a reserva na conta corrente, misturada com o dinheiro do mês.","Escolher aplicações com carência ou que podem oscilar muito.","Usar a reserva para compras planejadas.","Parar de guardar depois de usar e não repor o valor."],
faq=[("Posso montar a reserva tendo dívidas?","Um primeiro colchão pequeno, de algumas centenas de reais a um mês de gastos, ajuda a não criar novas dívidas. Depois, priorize quitar as dívidas com juros altos."),
("Poupança serve para reserva?","Tem liquidez e é simples, mas costuma render menos que outras opções de baixo risco com liquidez diária. Compare antes de decidir."),
("A reserva pode ficar em mais de um lugar?","Pode. Algumas pessoas deixam uma parte com resgate imediato e o restante em uma aplicação de liquidez diária.")],
related=["quanto-ter-de-reserva-de-emergencia","quanto-guardar-do-salario-por-mes","como-organizar-o-salario","como-fazer-planejamento-financeiro-pessoal"],
tools=["reserva","guardar"],
bivvo="No Bivvo, você marca uma meta como reserva de emergência. O app mostra quantos dias ou meses dos seus gastos ela já cobre e acompanha o quanto você guardou em cada mês.",
),
# ---------------------------------------------------------------- 9
dict(
slug="quanto-ter-de-reserva-de-emergencia", cat="reserva-de-emergencia", featured=False,
title="Quanto devo ter de reserva de emergência?",
seo_title="Quanto devo ter de reserva de emergência? Calcule | Bivvo",
desc="A referência é de 3 a 12 meses de gastos essenciais, conforme a estabilidade da renda. Veja como calcular o valor ideal para o seu perfil.",
short="De 3 a 12 meses de gastos essenciais, conforme o seu perfil de renda.",
answer="""<p>A referência mais comum é ter <strong>de 3 a 6 meses de gastos essenciais</strong> para quem tem renda estável e <strong>de 6 a 12 meses</strong> para quem tem renda variável, é autônomo ou é a única fonte de renda da família. A conta é simples: gastos essenciais mensais multiplicados pelo número de meses de proteção que faz sentido para você.</p>""",
answer_key="Reserva = gastos essenciais × meses de proteção",
sections=[
("Por que gastos essenciais e não o salário", """<p>Em uma emergência, você corta lazer, restaurantes e compras. O que precisa continuar pago são as despesas básicas. Usar o salário inteiro como base inflaciona a meta e pode deixá-la tão distante que você desiste. Usar só o essencial chega a um número mais honesto.</p>"""),
("Quantos meses para cada perfil", """<div class="table-wrap"><table><thead><tr><th>Perfil</th><th>Referência</th></tr></thead><tbody>
<tr><td>Emprego com carteira assinada e renda estável</td><td>3 a 6 meses</td></tr>
<tr><td>Servidor público com estabilidade</td><td>3 meses</td></tr>
<tr><td>Autônomo, freelancer ou renda por comissão</td><td>6 a 12 meses</td></tr>
<tr><td>Única renda da casa ou com dependentes</td><td>6 meses ou mais</td></tr>
<tr><td>Empreendedor</td><td>6 a 12 meses, separados do caixa da empresa</td></tr>
</tbody></table></div>
<p>São referências, não regras. Se você tem plano de saúde, seguro ou outra rede de apoio, pode ficar no limite inferior. Se trabalha em um setor instável, no superior.</p>"""),
("Como calcular o seu valor", """<p>Some os gastos essenciais de um mês típico e multiplique pelos meses escolhidos. Para fazer a conta agora, use a [[tool:reserva|calculadora de reserva de emergência]]. Depois, divida o valor que falta pelo que você consegue guardar por mês para saber o prazo.</p>"""),
("E se o valor parecer impossível?", """<p>Divida em etapas: um mês, depois três, depois a meta final. Cada etapa já reduz bastante a chance de recorrer ao cartão ou ao cheque especial em um imprevisto. O passo a passo está em [[como-montar-reserva-de-emergencia|como montar uma reserva de emergência]].</p>"""),
("Quando revisar a meta", """<p>Sempre que seus gastos essenciais mudarem de forma duradoura: mudança de casa, filho, novo financiamento, troca de emprego para uma renda menos estável. Uma revisão por ano também ajuda a acompanhar a inflação.</p>"""),
],
example=dict(title="Exemplo de cálculo para um autônomo", rows=[("Gastos essenciais por mês","R$ 2.400"),("Meses de proteção","8"),("Já guardado","R$ 4.800")], total=("Meta total","R$ 19.200"), note="Valores fictícios. Faltam R$ 14.400. Guardando R$ 600 por mês, a meta seria atingida em 24 meses, sem considerar rendimento."),
mistakes=["Calcular a reserva com base no salário inteiro em vez dos gastos essenciais.","Considerar o limite do cartão ou do cheque especial como reserva.","Nunca atualizar a meta depois de mudanças grandes de vida.","Misturar a reserva com o dinheiro para metas planejadas."],
faq=[("Reserva de emergência e investimento são a mesma coisa?","Não. A reserva prioriza segurança e resgate rápido. Investimentos de longo prazo podem aceitar mais risco e prazo em troca de retorno potencial maior."),
("Casal precisa de uma reserva ou duas?","Depende de como as contas são divididas. Se os gastos essenciais são compartilhados, uma reserva da casa costuma fazer sentido, além de algo individual para cada um."),
("Ter seguro-desemprego reduz a reserva necessária?","Pode ajudar, mas o benefício tem prazo e valor limitados e não cobre todos os casos. Considere-o como complemento.")],
related=["como-montar-reserva-de-emergencia","quanto-guardar-do-salario-por-mes","como-fazer-planejamento-financeiro-pessoal","como-organizar-a-vida-financeira"],
tools=["reserva","guardar"],
bivvo="No Bivvo, sua reserva aparece em meses de cobertura dos seus próprios gastos, calculados a partir do que você registra, e não de uma média genérica.",
),
# ---------------------------------------------------------------- 10
dict(
slug="como-sair-das-dividas", cat="dividas", featured=True,
title="Como sair das dívidas: um plano em etapas",
seo_title="Como sair das dívidas: plano prático em etapas | Bivvo",
desc="Pare de aumentar a dívida, liste tudo, priorize as mais caras e negocie com segurança. Um plano em etapas para sair das dívidas sem cair em armadilhas.",
short="Parar de aumentar, priorizar as mais caras e negociar com segurança.",
answer="""<p>Para sair das dívidas, <strong>primeiro pare de criar dívidas novas, depois liste todas as que existem, priorize as de juros mais altos e as que ameaçam itens essenciais, e só então negocie</strong>. Negociar sem saber quanto cabe no seu orçamento por mês costuma gerar acordos que quebram em poucos meses. O plano funciona melhor quando o valor das parcelas sai de um orçamento real.</p>""",
answer_key="Parar → listar → priorizar → negociar → acompanhar",
sections=[
("Etapa 1: pare o crescimento", """<p>Enquanto a dívida aumenta todo mês, qualquer pagamento parece inútil. Corte o uso do cartão e do cheque especial para despesas do dia a dia, mesmo que por alguns meses. Se for preciso, tire o cartão da carteira e dos aplicativos de compra.</p>"""),
("Etapa 2: faça a lista completa", """<p>Anote credor, valor atual, parcela, juros e se está em atraso. Muita gente se surpreende ao ver tudo junto, mas só assim dá para decidir. O guia [[como-organizar-dividas|como organizar dívidas]] mostra como montar essa lista e onde consultar o que existe no seu CPF.</p>"""),
("Etapa 3: priorize", """<p>Duas perguntas definem a ordem:</p>
<ol><li><strong>Essa dívida ameaça algo essencial?</strong> Aluguel, financiamento da casa, contas de luz e água vêm primeiro.</li><li><strong>Qual tem os juros mais altos?</strong> Rotativo do cartão e cheque especial costumam liderar.</li></ol>
<p>Depois disso, existem dois métodos populares para atacar o resto. No <strong>método avalanche</strong>, você paga o mínimo de todas e coloca o extra na de juros mais altos. Ele economiza mais dinheiro. No <strong>método bola de neve</strong>, o extra vai para a menor dívida, para quitá-la rápido e ganhar motivação. Escolha o que você consegue manter.</p>"""),
("Etapa 4: negocie com um número na mão", """<p>Antes de ligar para o credor, saiba quanto cabe por mês sem atrasar as contas essenciais. Use a [[tool:comprometimento|calculadora de comprometimento de renda]] para ver quanto da renda já está preso. Peça o Custo Efetivo Total (CET) de cada proposta e compare. Desconto à vista vale muito quando você tem o dinheiro. Parcelamento longo só vale se a parcela realmente couber.</p>"""),
("Etapa 5: troque dívida cara por barata, com cuidado", """<p>Às vezes, um empréstimo com juros menores para quitar o rotativo ou o cheque especial reduz bastante o custo total. Isso só funciona se você parar de usar o crédito antigo. Caso contrário, você termina com as duas dívidas.</p>"""),
("Cuidado com golpes", """<p>Desconfie de quem promete “limpar seu nome” mediante pagamento antecipado, de mensagens com boletos de acordo que você não pediu e de sites que imitam empresas de cobrança. Negocie pelos canais oficiais do credor ou por plataformas conhecidas de renegociação.</p>"""),
],
example=dict(title="Exemplo de priorização", rows=[("Rotativo do cartão","R$ 1.800 · juros altos"),("Cheque especial","R$ 600 · juros altos"),("Empréstimo pessoal","R$ 4.200 · juros médios"),("Parcela do celular","R$ 900 · sem juros")], total=("Ordem pelo método avalanche","Rotativo → cheque especial → empréstimo → celular"), note="Exemplo fictício. Na prática, compare as taxas reais de cada contrato antes de definir a ordem."),
mistakes=["Negociar uma parcela que não cabe e atrasar de novo dois meses depois.","Continuar usando o cartão enquanto paga o acordo do rotativo.","Pegar um empréstimo para quitar outro sem comparar o custo total.","Pagar alguém para “limpar o nome” sem passar pelo credor."],
faq=[("Pagar o mínimo do cartão é uma boa ideia?","Só em último caso. O saldo restante entra no rotativo, com juros altos. Desde 2024, a lei limita os juros e encargos do rotativo e do parcelamento da fatura a 100% do valor original da dívida, mas ainda assim é uma das formas mais caras de crédito."),
("Dívida prescreve depois de cinco anos?","Depois de cinco anos, a dívida deixa de aparecer nos cadastros de inadimplentes, mas isso não significa que deixou de existir. Avalie com cuidado antes de contar com isso."),
("Devo guardar dinheiro enquanto pago dívidas?","Um pequeno colchão evita novas dívidas em imprevistos. Fora isso, o dinheiro extra costuma render mais quitando dívidas caras do que aplicado.")],
related=["como-organizar-dividas","como-organizar-o-cartao-de-credito","como-economizar-dinheiro-ganhando-pouco","como-fazer-orcamento-mensal"],
tools=["comprometimento","parcelas"],
bivvo="O Bivvo ajuda a encontrar o valor que cabe para pagar dívidas: ele desconta contas, faturas e parcelas futuras e mostra quanto realmente sobra no mês, antes de você fechar um acordo.",
),
]
