# Fase 11.34 — Identidade Visual Pública Unificada

Objetivo: colocar as páginas públicas de aquisição, Aprenda e calculadoras no mesmo tom visual claro da landing principal do Bivvo, preservando conteúdo, URLs, metadata, canonical, JSON-LD e regras de negócio.

## Alterações
- Fundo claro com halo/degradê lilás.
- Tipografia Bricolage e títulos escuros de alto contraste.
- Cards brancos, bordas suaves, detalhes roxos e CTAs escuros.
- Jornada Bivvo redesenhada no tema claro em todas as famílias públicas.
- Blocos escuros da Central Aprenda convertidos para o mesmo sistema visual.
- Cache-busting dos CSS públicos para `v=11.34.0`.
- Nenhuma URL pública, canonical ou regra financeira alterada.

## Testes executados
- Estrutura HTML/SEO das páginas públicas: PASS.
- CSS referenciado existe: PASS.
- Canonical preservado: PASS.
- H1 único: PASS nas páginas SEO verificadas.
- JSON-LD parseável: PASS onde presente.
- JavaScript `node --check`: PASS.
- Varredura defensiva por secrets literais novos: PASS (nenhum novo secret encontrado).
- Teste visual no domínio publicado: NÃO TESTADO.
- iPhone/Android físico: NÃO TESTADO.
- Core Web Vitals reais: NÃO TESTADO.
