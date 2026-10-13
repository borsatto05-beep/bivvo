# Bivvo 11.80.1 — Hotfix Administração

## Problema corrigido
A versão 11.80 tinha um erro de sintaxe em `js/views/admin.js` na linha do filtro de busca da aba Usuários. Havia um parêntese `)` excedente na condição `includes(q)`, fazendo o navegador interromper o carregamento do módulo com `SyntaxError: Unexpected token ')'`.

## Arquivos alterados
- `js/views/admin.js`
- `dist/js/views/admin.js` (regenerado pelo build)

## Validação executada
- `node --check` do módulo corrigido: aprovado.
- `npm test`: 75 suítes aprovadas, 0 falhas.
- `npm run build`: concluído com sucesso (220 arquivos públicos; 108 assets no precache).

## Observação CSP
Os avisos de CSP de `inline style` / `inline script` exibidos no console não são o erro fatal que impedia o Bivvo de abrir. O erro fatal era o `Unexpected token ')'` em `admin.js`.
