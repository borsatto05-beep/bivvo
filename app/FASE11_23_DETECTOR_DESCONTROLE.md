# Bivvo 11.23.0 — Detector de Descontrole Financeiro

Base: 11.22.5 (preserva correção do fluxo Excluir conta).

## Implementado
- Detector local e determinístico dentro do Copiloto.
- Índice de atenção 0–100 para resumir sinais, sem substituir os cálculos financeiros.
- Detecta: déficit até próxima entrada; saldo quase todo comprometido; ritmo de gasto acelerado; gasto mensal acima das entradas recebidas; alta relevante contra mês anterior; peso de parcelas futuras; muitos parcelamentos ativos; concentração elevada em categoria não essencial; pressão de faturas sobre o caixa.
- Cada alerta mostra: o que aconteceu, por que chamou atenção e uma ação prática.
- Home mostra o principal sinal automaticamente.
- Nenhum extrato é enviado para IA/servidor pelo detector.
- Nenhum pagamento ou lançamento é alterado automaticamente.

## Validação
- Financeiro: 42/42
- Conversão: 7/7
- SEO: 14/14
- Total: 63 testes, 0 falhas.
