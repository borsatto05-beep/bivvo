# Bivvo — Segurança v4

## Obrigatório após publicar
1. No Supabase > SQL Editor, execute **supabase-security.sql** novamente. Além do RLS, ele cria o rate limiter persistente `bivvo_rate_limit`.
2. No Netlify > Site configuration > Environment variables, mantenha `BRAPI_API_KEY` e adicione `SUPABASE_SERVICE_ROLE_KEY`. Essa chave é somente do servidor; nunca coloque no HTML/JS e nunca compartilhe em chat.
3. No Supabase > Authentication > Sign In / Password security, use mínimo de **10 caracteres**, confirmação de e-mail e habilite reautenticação para troca de senha. Se o plano permitir, habilite proteção contra senhas vazadas.
4. No Supabase > Authentication > MFA, mantenha TOTP habilitado. O Bivvo agora conclui enroll + challenge/verify e exige o segundo fator no login de usuários que optaram por 2FA.

## Mudanças v4
- Dados financeiros legados são removidos do `localStorage`; sessão usa `sessionStorage` apenas como cache e Supabase como persistência.
- Configuração manual/legada Firebase/Supabase foi removida.
- Senhas do app: mínimo 10 caracteres.
- Troca de senha usa `reauthenticate()` + nonce.
- 2FA TOTP conclui verificação e é desafiado no login.
- `/api/quote` usa rate limiting persistente no Postgres por usuário + IP; se a proteção falhar, a API falha fechada (503).
- JavaScript inline foi externalizado para `app.js`; handlers estáticos foram convertidos para listeners externos. CSP bloqueia script inline.
- Saídas de texto financeiro de maior risco foram escapadas antes de entrar em templates HTML.

## Observação CSP
O JavaScript não usa `unsafe-inline`. Alguns gráficos legados ainda geram estilos inline dinamicamente; por compatibilidade visual, `style-src-attr 'unsafe-inline'` permanece temporariamente. Isso não autoriza JavaScript inline.

## Bivvo V5
- O SQL agora remove as policies RLS legadas/duplicadas antes de criar somente `finance_select_own`, `finance_insert_own`, `finance_update_own` e `finance_delete_own`.
- Exclusão de conta exige confirmação, senha novamente, MFA quando habilitado e uma sessão recém-emitida (máximo de 5 minutos no endpoint servidor).
- Pontos de HTML dinâmico que recebiam nomes de ativos/cartões/categorias foram migrados para DOM/textContent ou escapados antes da renderização.
- Após publicar a V5, execute novamente `supabase-security.sql` no SQL Editor do Supabase.

## V6 — hardening final
- Rode novamente `supabase-security.sql` no SQL Editor. A V6 adiciona `bivvo_user_has_verified_mfa(uuid)`, disponível somente ao `service_role`.
- A exclusão de conta agora falha fechada se o servidor não conseguir verificar MFA.
- Se existir fator MFA verificado, o JWT da exclusão deve estar em `aal2` e ter sido emitido há no máximo 5 minutos.
- Renderizações identificadas com texto controlável pelo usuário foram convertidas para `textContent` ou passaram a escapar explicitamente os valores antes de qualquer markup estrutural.

## V6.1 — correção MFA/exclusão
- O segredo TOTP não é mais escrito em texto na página. O cadastro 2FA mostra apenas o QR Code temporário e o remove após a verificação.
- Após challenge/verify do MFA, o frontend usa a sessão AAL2 recém-emitida/refrescada para a exclusão.
- `account-delete` aceita tanto a nova `SUPABASE_SECRET_KEY` (`sb_secret_*`) quanto a `SUPABASE_SERVICE_ROLE_KEY` legada. Chaves `sb_secret_*` são enviadas somente no header `apikey`; não são tratadas como JWT Bearer.
- Recomendado no Netlify: definir `SUPABASE_SECRET_KEY` com uma Secret API Key do Supabase e, após validar a migração, remover a variável legada quando não for mais necessária.

## V10.0.0 — reescrita do frontend
- **Nenhuma mudança de banco é obrigatória.** As tabelas, policies RLS, `bivvo_rate_limit` e `bivvo_user_has_verified_mfa` continuam as mesmas. As variáveis do Netlify (`BRAPI_API_KEY`, `SUPABASE_SECRET_KEY`/`SUPABASE_SERVICE_ROLE_KEY`) também.
- CSP endurecida: removido `style-src-attr 'unsafe-inline'` (agora `'none'`) e `data:` de `font-src`; o app não usa estilo inline nem `innerHTML`.
- Sincronização com controle de versão (`payload.rev`): uma gravação só substitui a versão que o aparelho leu. Isso impede que um aparelho aberto com dados antigos regrave por cima de um "Zerar todos os dados" feito em outro aparelho.
- Nenhum dado financeiro em `localStorage`. `sessionStorage` guarda apenas um cache da sessão, marcado com o id do usuário e apagado ao sair. Resíduos `mf_*` da v9 são removidos automaticamente.
- Recuperação de senha agora tem fluxo completo (evento `PASSWORD_RECOVERY`). Em Supabase > Authentication > URL Configuration, confirme que a URL do site está em *Redirect URLs*.
- Indicação: quem chega por `?ref=xxxxxxxx` recebe `referred_by` nos metadados do usuário no cadastro (código = 8 primeiros caracteres do SHA-256 de `bivvo:<user_id>`; não revela o id). Nenhuma recompensa é concedida ainda.
- A busca de ativos internacionais (chamada direta ao Yahoo, bloqueada pela CSP desde a v4) foi removida. Busca B3 e cotações continuam via `/api/b3-assets` e `/api/quote`.
