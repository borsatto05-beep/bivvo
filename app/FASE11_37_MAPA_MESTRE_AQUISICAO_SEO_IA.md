# Bivvo 11.37 — Mapa Mestre de Aquisição SEO + IA

## Objetivo
Transformar demanda orgânica em uso real do Bivvo por meio de ferramentas gratuitas, conteúdo de resposta direta e páginas fáceis de compreender por buscadores tradicionais e sistemas de IA.

## Evidências da pesquisa manual no Bing (12 meses)
Prioridades observadas na pesquisa feita no Bing Webmaster Tools: `planilha de gastos mensais` 19,7K; `salario liquido` 19,3K; `calculo salario liquido` 19K; `calculo de ferias` 17K; `calculadora salário líquido` 9K; `planilha financeira` 9K; `planilha de controle financeiro` 5,7K; `controle financeiro` 3,1K; `controle de gastos` 1,1K. Estes números são sinais do Bing e não devem ser tratados como volume total de buscas da internet.

## Arquitetura implementada
1. `/calculadora-salario-liquido/` — ferramenta gratuita com INSS/IRRF 2026, resposta direta, decomposição do resultado e fontes oficiais.
2. `/planilha-de-gastos-mensais/` — landing útil + download real de planilha `.xlsx`, sem captura obrigatória de e-mail.
3. `/calculadora-de-ferias/` — estimativa bruta simples de férias + 1/3, com limitações explícitas.
4. Links cruzados entre as três ferramentas e páginas centrais do Bivvo.
5. Sitemap atualizado de 48 para 51 URLs.
6. `robots.txt` permite explicitamente `OAI-SearchBot` para elegibilidade no ChatGPT Search.
7. `llms.txt` documenta as ferramentas e o princípio editorial.
8. Eventos de aquisição preservados e novo evento `seo_tool_downloaded` para a planilha.

## Estratégia de IA / GEO
- Resposta principal próxima do topo da página.
- Headings descritivos e blocos curtos.
- Ferramentas que produzem uma resposta aplicável, não apenas texto SEO.
- JSON-LD coerente com conteúdo visível (`WebApplication` + `BreadcrumbList`).
- Fontes oficiais em cálculos regulatórios.
- Conteúdo consistente sobre a entidade Bivvo e sua proposta.
- Páginas públicas rastreáveis, canonicals próprios e sitemap.
- OAI-SearchBot liberado; GPTBot não foi usado como requisito para busca.
- Medição futura no Bing AI Performance por páginas citadas e grounding queries.

## Funil
Busca → ferramenta/planilha → resultado útil → próxima ação → CTA Bivvo → cadastro → ativação.

## Próximas expansões sugeridas (somente após dados)
- cluster `planilha financeira`;
- calculadoras trabalhistas/financeiras adicionais quando houver relação clara com o Bivvo;
- páginas de comparação “planilha x aplicativo” sem duplicar intenção;
- atualizar títulos/conteúdo com dados reais de Search Console e Bing AI Performance.

## Testes executados
- `node --check` em JS/MJS do projeto: PASS.
- HTML das 3 novas páginas: title, description, canonical, robots e exatamente um H1: PASS.
- JSON-LD das 3 páginas: parse válido: PASS.
- Links internos das 3 páginas: PASS no pacote local.
- Sitemap XML: PASS; 51 URLs e 3 novas presentes.
- `robots.txt`: OAI-SearchBot explicitamente permitido: PASS.
- Planilha `.xlsx`: criada e verificada; resumo e fórmulas principais inspecionados: PASS.
- Regressão da contribuição progressiva do INSS 2026 nos quatro limites de faixa oficiais: PASS (R$ 121,57; R$ 236,94; R$ 411,11; R$ 988,09, com arredondamento da ferramenta).
- Constantes de tabela mensal e redução do IRRF 2026 conferidas com a Receita Federal: PASS de revisão estática; cálculo real de folha com todas as particularidades: NÃO TESTADO.
- Regressão férias brutas para 30 e 15 dias: PASS.
- Varredura simples de segredos nos arquivos alterados: 0 ocorrências.
- Tamanho dos novos HTMLs ~5–6 KB; JS alterados pequenos: PASS de orçamento estático.

## NÃO TESTADO
- Deploy real no Netlify.
- Renderização visual em iPhone/Android físicos.
- Core Web Vitals reais (CrUX/Lighthouse publicado).
- Indexação/ranking real no Google/Bing.
- Citações reais em ChatGPT/Copilot.
- Envio IndexNow após esta versão: NÃO TESTADO no ambiente local (o teste tentou rede e falhou por indisponibilidade de acesso externo do runtime).
