# Bivvo 11.80 — Jornada do usuário e conversão por origem

## O que mudou
- Administração > Usuários online ganhou visão de jornada individual.
- Cada usuário agora mostra data de cadastro, plano, origem inicial, campanha, dias ativos, etapa de conversão e situação de engajamento.
- Novo botão **Ver jornada** exibe os marcos conhecidos: cadastro, ativação, primeiro lançamento, primeiro cartão, teste, checkout e pagamento.
- Nova tabela **Conversão por origem** compara usuários, ativados, pagantes e taxa de conversão paga por canal.
- Novos filtros: Plano, Etapa e Situação, além dos filtros existentes por status, origem, aba, dispositivo e sistema.
- Novo sinal operacional de risco de abandono baseado apenas em ativação e recência de uso.
- A API administrativa cruza eventos técnicos com assinatura/pagamentos aprovados, sem ler saldos, compras, dívidas ou renda pessoal.

## Arquivos alterados
- `netlify/functions/admin.js`
- `js/views/admin.js`
- `admin-education.css`
- `CHANGELOG.md`

## Arquivos criados
- `tests/admin-user-journey-1180.test.mjs`
- `FASE11_80_JORNADA_USUARIO_CONVERSAO.md`

## Testes
- `npm test`: 75 suítes aprovadas, 0 falhas.
- `npm run build`: concluído com sucesso antes da inclusão do teste final; alterações funcionais já estavam incluídas no build validado.
- Teste defensivo de segurança: suítes `security-hardening`, `billing-hardening`, `webhook-hardening` e demais testes da regressão passaram.
- Testes de performance/fluidez estáticos existentes passaram dentro da suíte, incluindo `performance-budget-1148`.
- `npm run test:browser`: NÃO TESTADO com sucesso neste ambiente porque o módulo `playwright` não está instalado no runtime atual (`MODULE_NOT_FOUND`).

## Observações
- A origem não é inventada: quando não há UTM/referrer confiável, permanece como Direto ou Desconhecido.
- Os marcos da jornada só aparecem como concluídos quando existe evento técnico confiável.
