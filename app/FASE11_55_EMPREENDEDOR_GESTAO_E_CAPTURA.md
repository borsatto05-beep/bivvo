# Fase 11.55 — Empreendedor + captura rápida contextual

## Empreendedor
A Gestão da Empresa agora separa faturamento, custos variáveis e despesas, calcula margem de contribuição, EBITDA aproximado, lucro gerencial e ponto de equilíbrio. A área Produtos e serviços calcula custo real, markup, margem, lucro unitário, preço mínimo e lucro por item.

## Captura rápida
O bloco “Anotar por texto ou voz” passa a existir no Pessoal, Casal e Empresa com comportamento contextual. No Casal, os lançamentos vão para o espaço compartilhado; na Empresa, para o caixa empresarial. A câmera devolve a leitura ao ambiente correto.

## Grátis
- 10 anotações rápidas de texto/voz por mês.
- 5 leituras de comprovante por câmera por mês.
- Formulário manual continua disponível.

## Pagos
Texto/voz não possui essa trava mensal. Scanner respeita a cota do plano.

## Segurança
A cota de texto/voz é consumida de forma atômica no servidor por `bivvo_consume_usage`, usando a tabela existente `usage_counters`.
