# Bivvo Capital — saldo geral e capital recebido separados

O principal efetivamente devolvido agora fica em **Saldo de capital recebido**. Os juros recebidos continuam entrando em **Saldo geral**, junto às outras entradas e saídas desse saldo.

Exemplo, partindo de saldo geral zero: um recebimento de R$ 1.100 com R$ 1.000 de principal e R$ 100 de juros deixa saldo geral de R$ 100 e capital recebido de R$ 1.000. O total dos dois é R$ 1.100.

## Como funciona

- A tela Bivvo Capital mostra os dois saldos, acumulados até hoje. O seletor de mês abaixo continua filtrando a atividade dos contratos.
- **Ver recebimentos de capital** lista as devoluções de principal e permite abrir o recebimento original. A edição e a exclusão continuam passando pelo histórico do empréstimo.
- Pagamentos comuns, somente juros e parcelas usam a mesma regra. Ao corrigir principal, só o saldo de capital muda; ao corrigir juros, o saldo geral muda. Excluir ou desfazer remove cada parte do saldo correspondente.
- O principal recebido não aumenta renda, lucro, limite diário de gastos nem a previsão do saldo geral.
- Recebimentos pendentes ou datados no futuro não compõem os saldos de hoje. Uma data efetiva de recebimento já registrada é respeitada.
- O ajuste de saldo mostra o capital separado e pede o saldo geral sem incluir esse principal.

## Histórico e dados

Os saldos são calculados a partir dos lançamentos existentes. Não é necessário apagar pagamentos, lançar valores novamente, redefinir saldos ou executar uma migração de banco.

Os lançamentos modernos já identificam principal e juros separadamente. Para registros antigos que juntavam os dois em uma entrada, o cálculo usa o principal explicitamente informado no próprio registro. Não deduzimos principal apenas pela descrição ou pelo nome da categoria.

Este saldo é o **principal recebido acumulado**, separado do saldo geral. Registrar um contrato continua sendo o registro do empréstimo; não cria uma transferência automática entre os dois saldos. As funções existentes de cartões, parcelas, backup, planos, conversão de cadastro e Órbita continuam incluídas.

O saldo geral pode aparecer menor que antes, pois o principal que estava somado ali agora aparece no capital recebido. A soma dos dois preserva o dinheiro recebido anteriormente, considerando os mesmos lançamentos e as mesmas saídas.

## Publicação

O ZIP contém o projeto completo, com a pasta `dist` pronta. Para a entrega completa no Netlify, use o projeto com a configuração existente:

- Node 22
- Build: `npm run build`
- Publicação: `dist`
- Funções: `netlify/functions`

Mantenha as variáveis de ambiente já configuradas. Publicar apenas `dist` atualiza a interface, mas não as funções de servidor; para receber também as métricas educativas da versão Órbita, publique o projeto completo. A entrega não altera automaticamente o site em produção nem contém credenciais privadas.

## Validação

63 suítes automatizadas passaram. Os testes de cálculo cobrem histórico, saldo geral, capital, correção, exclusão, datas, registros antigos, previsão, recarga e separação entre Pessoal e Empresa. Também cobrem parcelas com centavos exatos, desfazer e recebimento simultâneo em dois dispositivos.

Os testes de navegador cobrem recebimento comum, cancelamento, consulta ao capital, correção de principal/juros, principal zero e restauração, recebimento só de juros, renovação mensal, exclusão, parcelas, desfazer, seleção de mês, recarga e telas de 320, 390 e 1280 pixels. A regressão de cartão e parcelamento de contrato existente também passou.

As prévias usam dados fictícios. Serviços externos foram simulados nos testes; não realizamos pagamentos, cadastros externos ou alterações de dados reais.
