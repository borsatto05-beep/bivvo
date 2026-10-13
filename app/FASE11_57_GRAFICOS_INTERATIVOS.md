# Bivvo 11.57 — Gráficos interativos em Casal e Empreendedor

## Empreendedor
- Todos os principais cards gráficos do cockpit agora são interativos e acessíveis por teclado.
- Desempenho mensal, projeção de caixa, mapa de custos, aging de recebíveis, meta de faturamento, receita por origem, estrutura de custos e saúde operacional abrem drill-down em modal animado.
- Os modais mostram KPIs, composição, comparações, listas detalhadas e uma leitura prática do indicador.
- Mantidas as interações internas já existentes, como selecionar mês/categoria.

## Casal
- Novo mini-dashboard visual no resumo do casal.
- Evolução de entradas x gastos em 6 meses.
- Donut de gastos por categoria.
- Comparação de quem colocou renda x quem pagou.
- Linhas de categoria também são clicáveis e abrem detalhes dos lançamentos.
- Todos os cards abrem drill-down animado com números e interpretação.

## UX e acessibilidade
- Hover, foco e feedback visual para gráficos clicáveis.
- Animações de entrada e crescimento de barras.
- Bottom sheet no celular e modal central no desktop.
- `prefers-reduced-motion` respeitado.
- Sem biblioteca pesada de gráficos.

## Validação
- 50 suítes automatizadas: 0 falhas.
- SEO: 55 URLs, 0 erros.
- Build concluído.
- Performance budget e hardening de segurança aprovados.
- Playwright não executado porque a dependência não está instalada no ambiente.
- Nenhum SQL novo necessário.
