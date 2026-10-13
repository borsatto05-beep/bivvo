# Publicação Bivvo 11.48

## O que mudou

- Preços de todos os planos pagos aumentados em R$ 10/mês.
- Anuais recalculados para manter aproximadamente 2 meses de economia.
- Bivvo IA agora tem níveis Essencial, Contextual, Avançada, Especialista e Máxima.
- Checkout Mercado Pago, landing, tela de planos, MRR administrativo e motor de conversão usam os mesmos preços.

## Banco de dados

Nenhuma migration nova de Supabase é necessária para passar da 11.47 para a 11.48. Os nomes dos planos e entitlements continuam os mesmos.

## Netlify

As variáveis já existentes `GEMINI_API_KEY` e `GEMINI_MODEL` continuam válidas.

Opcionalmente configure modelos diferentes por nível:

- GEMINI_ASSISTANT_MODEL_ESSENTIAL
- GEMINI_ASSISTANT_MODEL_CONTEXTUAL
- GEMINI_ASSISTANT_MODEL_ADVANCED
- GEMINI_ASSISTANT_MODEL_SPECIALIST
- GEMINI_ASSISTANT_MODEL_MAX

Sem essas variáveis, o endpoint usa defaults e fallback automático.

## Publicação

Faça deploy do projeto completo (incluindo `netlify/functions`), preferencialmente por Git ou Netlify CLI para garantir a publicação das Functions.
