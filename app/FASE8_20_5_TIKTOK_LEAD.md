# Bivvo 8.20.5 — TikTok Lead

- Mantém o TikTok Pixel base no site.
- Dispara `Lead` somente depois que o Supabase aceita um cadastro novo.
- Evento: `bivvo_signup` / `Cadastro Bivvo`, valor 0, moeda BRL.
- Não envia e-mail, telefone, nome, external_id ou dados financeiros ao TikTok neste evento.
- Evita contar login, recuperação de senha ou tentativa rejeitada como cadastro.
