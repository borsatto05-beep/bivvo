# FASE 11.39 — SEO PREMIUM INTERATIVO

## Escopo executado
Reconstrução das cinco páginas prioritárias definidas no briefing: planilha de gastos mensais, calculadora de salário líquido, calculadora de férias, controle financeiro pessoal e sair do aperto.

## Ferramentas
- Planilha: simulador online de renda/despesas, saldo, comprometimento, maior categoria e gráfico.
- Salário líquido: INSS progressivo 2026 + IRRF 2026 + redução mensal da Lei 15.270/2025 + outros descontos.
- Férias: estimativa bruta de remuneração, 1/3 e abono simplificado.

## Fontes oficiais
- INSS — Tabela de contribuição mensal, competência janeiro/2026.
- Receita Federal — Tributação de 2026 e exemplos da Lei 15.270/2025.
- CLT/Planalto — regras de férias e abono pecuniário.

## SEO / GEO / AEO
Titles, descriptions, canonicals, OG, resposta direta, exemplos, headings semânticos, JSON-LD compatível com conteúdo, links internos e fontes.

## Analytics
A nova camada tenta reutilizar `BivvoAcquisition.track` quando disponível e também emite eventos locais `bivvo:public-event`. Eventos: cálculo concluído, vídeo, download e CTA.

## Segurança e privacidade
Calculadoras executam no navegador. Não foi criado endpoint para receber valores financeiros. Inputs numéricos são lidos como números e não são injetados como HTML. Links externos oficiais usam `noopener noreferrer`.

## Testes executados
Preenchido após execução automatizada local.

## NÃO TESTADO
- Core Web Vitals reais em rede/dispositivo físico.
- Reprodução real do YouTube em todos os navegadores.
- Indexação/ranking Google/Bing e citação por IA.
- Fluxo autenticado completo com Supabase em produção.
- Aparência em iPhone/Android físicos.

### Resultados locais executados
- `node --check seo-premium-1139.js`: PASSOU.
- Auditoria das 5 páginas prioritárias: 1 H1, meta description, canonical, JSON-LD parseável e assets CSS/JS existentes: PASSOU (0 erros).
- Teste aritmético do INSS progressivo 2026 contra as faixas oficiais publicadas pelo INSS: executado. Observação: exemplos de IRRF da Receita consultados exibem valores de contribuição previdenciária que não coincidem com a aplicação direta da tabela de empregado do INSS; a calculadora segue as faixas oficiais do INSS para empregado.
- Varredura defensiva nos arquivos novos para `service_role`, `private_key` e tokens `sk-...`: nenhum achado.
- Teste de integridade do ZIP: executado após empacotamento.
