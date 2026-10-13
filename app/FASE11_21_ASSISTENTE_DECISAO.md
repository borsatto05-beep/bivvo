# Bivvo 11.21 — Assistente de Decisão Financeira

## Entregue
- Motor local `js/decision.js` para responder “O que pago primeiro?”.
- Analisa saldo, contas/faturas até a próxima entrada, vencimento, atraso, essencialidade e risco futuro.
- Prioridades automáticas: crítica, alta, média e baixa.
- Não inventa juros ou multas não cadastrados; avisa quando a taxa da fatura é desconhecida.
- Três estratégias comparáveis: menor impacto, vencimentos primeiro e essenciais primeiro (cenários idênticos são removidos).
- Projeção de saldo em 7 e 30 dias usando o motor financeiro existente.
- Níveis de risco e recomendação explicada.
- Modo “Dinheiro apertado” quando compromissos superam o saldo.
- Interface mobile-first em `js/views/decision.js`.
- Integração no Bivvo IA com perguntas rápidas.
- Simulação somente leitura: nenhum lançamento é marcado como pago automaticamente.
- Cache/PWA atualizado para 11.21.0.

## Segurança
O extrato continua no aparelho. A decisão é calculada localmente e não exige envio das descrições das transações para a IA.

## Validação
- finance-regression: 42/42
- conversion-engine: 7/7
- seo-intelligence: 14/14
- Total: 63 testes existentes, 0 falhas.
