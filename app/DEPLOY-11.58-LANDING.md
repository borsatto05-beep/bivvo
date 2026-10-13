# Bivvo — Landing pública redesenhada

Esta atualização substitui apenas a página pública do Bivvo e preserva o app 11.57.

## O que mudou
- Landing isolada em `landing-v4.css` e `landing-v4.js` para evitar conflito com o CSS interno do app.
- Hero novo e responsivo.
- Tour visual por Pessoal, Casal, Empresa/Empreendedor, Capital, Família, Cartões e IA.
- Previews adicionais de Capital e Família.
- Seções detalhadas por perfil com benefícios e CTA para o plano correspondente.
- Atualizações recentes destacadas: captura rápida por perfil, limites do Grátis, tolerância de cartões, demo Casal, lista de compras, gráficos clicáveis, gestão empresarial, Capital no saldo e IA elaborada.
- Tabela de planos atualizada com Grátis, Plus, Pro, Casal, Capital, Empreendedor e Família.
- Layout mobile próprio e animações com suporte a `prefers-reduced-motion`.

## Banco
Nenhum SQL novo é necessário para esta alteração de landing.

## Validação
- `npm test`: 50 suítes, 0 falhas.
- `npm run build`: concluído.
- `npm run test:seo`: 55 URLs, 0 erros.
