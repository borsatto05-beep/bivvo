# Bivvo 8.20.9 — TikTok Events API + deduplicação

- Adicionada Netlify Function `tiktok-event` para enviar `Lead` pela Events API 2.0 do TikTok.
- Token lido apenas de `TIKTOK_EVENTS_API_TOKEN` no servidor; nunca é exposto ao navegador.
- Pixel e Events API usam o mesmo `event_id` para deduplicação.
- O servidor confirma que o `user_id` corresponde a um usuário Supabase criado recentemente antes de enviar o Lead.
- `user_id`, e-mail, telefone, nome e dados financeiros não são enviados ao TikTok.
- O servidor pode enviar apenas sinais técnicos disponíveis: IP, user-agent, `_ttp`, `ttclid` e URL.
- Eventos repetidos de servidor para o mesmo cadastro são bloqueados pelo registro `tiktok_lead_server_sent`.
- Para teste da Events API, pode-se definir temporariamente `TIKTOK_TEST_EVENT_CODE` no Netlify.
