# Bivvo 11.42.5 — Home mais limpa

## Pedido
Ocultar na tela **Início**, por padrão, os blocos **Bivvo Copiloto** e **Bivvo Configurado**, sem remover as funcionalidades.

## Implementação
- `Bivvo Configurado` não aparece mais aberto na carga inicial da Home.
- `Bivvo Copiloto` não aparece mais aberto na carga inicial da Home.
- Ambos continuam disponíveis dentro do recolhível **Mais recursos → Copiloto e status da configuração**.
- O recolhível começa fechado por padrão.
- Para usuário que ainda não terminou a configuração, o card **Primeiro valor / Terminar configuração** continua visível normalmente para não bloquear onboarding.
- O Bivvo IA permanece visível como antes.
- A funcionalidade do Copiloto, SOS financeiro e explicação do cálculo foi preservada.
- Versão atualizada para `11.42.5`.
- Cache-bust de `app.css` e `main.js` atualizado para `11.42.5`.
- Service Worker atualizado para `bivvo-v11-42-5-home-clean`.

## Arquivos alterados
- `js/views/home.js`
- `app.css`
- `js/util.js`
- `js/main.js`
- `index.html`
- `sw.js`
- testes de versão/cache atualizados para a versão atual.

## Testes executados
- `node --check`: 105 arquivos JS/MJS, sem falha de sintaxe.
- 13 arquivos de testes existentes: todos executados sem falha.
- SEO estático: 55 URLs, 0 erros; titles/canonicals/descriptions únicos.
- 8 asserções específicas da mudança: todas passaram.
- Smoke HTTP local: `/`, `/index.html`, `app.css`, `main.js` e `home.js` responderam HTTP 200.
- Segurança defensiva estática nos arquivos alterados: nenhum padrão de segredo crítico; sem `innerHTML`, `eval` ou `new Function` no módulo Home.
- Performance estática: nenhuma biblioteca/dependência nova; mudança usa `<details>/<summary>` nativo e CSS pequeno.

## NÃO TESTADO
- Deploy real no Netlify.
- Comportamento em iPhone/Android físicos.
- Core Web Vitals reais/Lighthouse em produção.
- Sincronização/Supabase real, pois essa mudança não toca persistência.

