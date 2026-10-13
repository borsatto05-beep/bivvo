# Bivvo Capital — parcelamento

Base: ZIP BIVVO_11_64_CARTAO_BAIXA_SALDO enviado nesta conversa.

Use Novo empréstimo → Parcelado. Informe cliente, valor emprestado, total combinado incluindo juros, número de parcelas (2 a 120) e primeiro vencimento. Os vencimentos são mensais, ajustados ao último dia nos meses mais curtos. Não altera contratos existentes automaticamente.

Exemplo: R$ 4.000 emprestados e total de R$ 8.000 em 10 parcelas de R$ 800. Cada parcela separa R$ 400 de principal e R$ 400 de juros. Pequenas diferenças de centavos são distribuídas preservando os totais exatos.

Em Ver parcelas / Detalhes, acompanhe pagas, pendentes e vencidas. Marcar como paga abre confirmação de valor, data e forma de recebimento. Principal devolvido vai para o saldo de capital recebido; juros vão para o saldo geral. Desfazer pagamento pede confirmação, remove os lançamentos relacionados e reabre a parcela. Datas de recebimento futuras são rejeitadas. Pagamento duplicado local ou simultâneo em dois dispositivos usa a mesma identidade de pagamento, evitando duas baixas para a mesma parcela.

Compartilhar com cliente abre o cartão visual e a mensagem organizada, com principal, juros do acordo, total, parcelas pagas, saldo pendente, vencimentos e data dos pagamentos. WhatsApp, copiar e compartilhamento nativo são acionados somente pelo usuário.

59 conjuntos de testes passaram nesta base. Teste de navegador validou criação 4000→8000 em 10 parcelas, pagar, compartilhar, desfazer e telas de 320, 390 e 1280 pixels. As verificações locais não substituem a conferência de duas contas reais depois da publicação.

Publicação: use o projeto completo no Netlify, npm run build, pasta dist e funções netlify/functions. Não exige migração do banco. O pacote não atualiza automaticamente o site.

## Parcelar um contrato já aberto

No Bivvo Capital, clique em **Parcelar saldo** no contrato ou em seus detalhes. Informe o total do novo acordo, já com os juros, o número de parcelas e o primeiro vencimento. O principal é o saldo que ainda falta devolver, mesmo que já existam amortizações ou pagamentos só de juros. Os juros do novo acordo substituem os juros pendentes anteriores.

O contrato continua com o mesmo cliente, identificador e valor original. Os recebimentos e lançamentos anteriores ficam preservados e podem ser consultados em **Histórico anterior ao parcelamento**. Durante o acordo, esses recebimentos anteriores ficam protegidos contra alteração para manter a base das parcelas consistente. As novas parcelas podem ser pagas e seus pagamentos podem ser desfeitos. Não cria uma nova saída de dinheiro ao parcelar.

## Cartões e Movimentações

- **+ → Pagar cartão** permite escolher qualquer fatura pendente e pagar o total ou uma parte.
- Início mostra **Pagar fatura** também para faturas ainda abertas.
- Cartões abre primeiro a fatura mais antiga vencida/fechada que ainda está pendente; as setas permitem navegar pelos meses anteriores e seguintes.
- Movimentações mostra a fatura no vencimento, com valor restante, total e valor pago. Tocar nela abre o pagamento. O filtro Cartão inclui compras, pagamentos e faturas pendentes.
- A linha da fatura é calculada para exibição: não cria uma segunda despesa. O pagamento efetivo é registrado, reduz o saldo e libera o limite, mantendo as compras no histórico.

Validação adicional: contrato com pagamentos anteriores, principal parcial, renegociação dos juros (aumento e redução), saldo composto somente de juros, pagamento/estorno de parcela, fatura vencida, pagamento parcial/total de fatura aberta, atalho + e Movimentações. Interface conferida em 320, 390 e 1280 pixels. Mantido o botão para fechar/reabrir o guia financeiro.
