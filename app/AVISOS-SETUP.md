# Ativar os avisos do Bivvo (Web Push)

O app funciona normalmente sem isto. Os avisos só passam a funcionar depois destes passos.

## 1. Banco de dados
No Supabase → SQL Editor, rode o arquivo `supabase-push.sql` uma vez.

## 2. Chaves
Depois do deploy, abra `https://SEU-SITE/ferramentas/chaves-push.html` e toque em **Gerar chaves**.
As chaves são criadas no seu navegador e não são enviadas a lugar nenhum.

## 3. Variáveis no Netlify
Site configuration → Environment variables:

| Nome | Valor |
|---|---|
| `VAPID_PUBLIC_KEY` | a chave pública gerada |
| `VAPID_PRIVATE_KEY` | a chave privada gerada (secreta) |
| `VAPID_SUBJECT` | `mailto:seu-email@exemplo.com` |
| `SUPABASE_SECRET_KEY` | já existe (usada na exclusão de conta) |

Faça um novo deploy depois de criar as variáveis. **Não troque as chaves depois**: quem já ativou precisaria ativar de novo.

## 4. Forma de deploy
A função `push-cron` é agendada (roda a cada hora). Funções agendadas exigem deploy por **Git** ou pela **Netlify CLI** (`netlify deploy --prod`). O deploy de arrastar e soltar a pasta não publica funções.

## 5. Testar
No celular, com o Bivvo instalado: Você → Avisos e lembretes → **Ativar avisos neste aparelho** → **Enviar teste**.
- iPhone: só com o Bivvo instalado na Tela de Início, iOS 16.4 ou mais novo.
- Android: Chrome, instalado ou não.

## Como funciona
- O app guarda um resumo curto na sua conta (valor livre do dia, contas e faturas dos próximos 2 dias, se você já anotou hoje). Protegido por RLS.
- Todo hora o servidor verifica quem chegou ao horário escolhido no próprio fuso e manda no máximo um aviso por dia.
- Se você já anotou no dia e nada vence amanhã, nenhum aviso é enviado.
- Valores em reais só aparecem no aviso se você ligar "Mostrar valores nos avisos".
