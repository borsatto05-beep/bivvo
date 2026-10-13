# Bivvo 10.5 — Monetização: configuração e arquitetura

## O que configurar

| Passo | Obrigatório para | Como |
|---|---|---|
| Rodar `supabase-monetizacao.sql` | plano Pro, cota de leituras, métricas, indicação | Supabase → SQL Editor |
| `GEMINI_API_KEY` | leitura de comprovantes | Netlify → Environment variables |
| `GEMINI_MODEL` (opcional) | trocar o modelo da leitura | padrão: `gemini-3.6-flash` |
| `SUPABASE_SECRET_KEY` | já existe | usada por scan, indicação, avisos e exclusão de conta |
| Deploy por Git ou Netlify CLI | funções | arrastar e soltar não publica funções |

Sem esses passos o app funciona: todos ficam no Grátis e a leitura de comprovante mostra "ainda não ativada".

**API de IA:** a leitura usa a Gemini Developer API. O Grátis do Bivvo tem 5 leituras por mês, conferidas no servidor (`bivvo_consume_usage`, atômica). Se a leitura falhar, o uso é devolvido. A disponibilidade e os limites do nível gratuito da Gemini são definidos pelo Google e podem mudar. No nível gratuito da Gemini, o conteúdo enviado pode ser usado pelo Google para melhorar os produtos; avalie isso antes de usar comprovantes financeiros de usuários reais.

## Onde mexer
- Preços e limites: `js/plans.js` (`PRICES`, `PLAN_LIMITS`) e o espelho do servidor `netlify/lib/plans.js`.
- Ligar a cobrança: `BILLING_LIVE = true` em `js/plans.js` e no botão de `js/views/pro.js` chamar o checkout. A assinatura paga deve gravar uma linha em `entitlements` (source `stripe`, `mercadopago` etc.) por webhook no servidor. Nunca pelo app.
- Conceder teste manual: `insert into entitlements (user_id, plan, source, expires_at) values ('<uuid>', 'pro', 'trial_manual', now() + interval '7 days');`

## Métricas (consultas de exemplo)
- D1/D7/D30: `app_open` é enviado uma vez por dia por aparelho. Cruze com `signup`.
- Funil: `signup → onboarding_done → first_tx → quick_capture_used/voice_used/scan_used`.
- Monetização: `paywall_viewed → pro_screen_viewed → pro_interest`.

## Compartilhar para o Bivvo (comprovante do WhatsApp)
| Plataforma | Funciona? |
|---|---|
| Android (Chrome, Bivvo instalado) | Sim: Compartilhar → Bivvo → leitura → confirmar. |
| iPhone (Safari/PWA) | Não. O iOS não deixa PWAs aparecerem na folha de compartilhamento. Alternativa: salvar a imagem e usar 📸 Comprovante → escolher da galeria. |
| Computador | Não se aplica. Use 📸 Comprovante e escolha o arquivo. |

## Voz
Usa o reconhecimento de fala do navegador: Chrome no Android e no computador; Safari no iPhone (pode depender de internet e do idioma do aparelho). Se o navegador não oferecer, o botão Falar não aparece. Nenhum áudio passa pelos servidores do Bivvo.

## Próximas fases (arquitetura proposta, não implementada)

### Bivvo Assistente (Pro)
- O modelo de IA NÃO calcula. Ele recebe ferramentas que chamam as funções do Bivvo: `spendable`, `spendableExplanation`, `simulatePurchase`, `monthSummary`, `cardStatus`, `activeInstallments`, `monthlyIncomeRef`.
- Fluxo: pergunta → servidor (login + cota `ai`) → modelo escolhe a ferramenta → **o app executa a ferramenta no aparelho** e devolve o resultado → modelo explica. Os números da resposta vêm só dos resultados das ferramentas.
- Envia ao servidor apenas os resultados necessários, nunca o extrato inteiro.

### Bivvo Família
- Separar `finance_data` em espaços: `spaces (id, kind: personal|shared, owner)`, `space_members (space_id, user_id, role)`, `space_data (space_id, payload)`.
- O espaço pessoal continua sendo o atual e nunca é lido por outro membro. Um lançamento só vai para o compartilhado se a pessoa escolher.
- RLS por associação: `exists (select 1 from space_members where space_id = ... and user_id = auth.uid())`.
- "Quanto a família ainda pode gastar" = `spendable()` rodando sobre o espaço compartilhado.

### Resumo semanal
O check-in da semana (`F.weekSummary`) já calcula gasto, maior categoria e comparação. Próximo passo: card compartilhável no composer de Stories e aviso de domingo à noite.
