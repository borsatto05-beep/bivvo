# BIVVO 11.48 — Novos preços + IA escalonada por plano

## Preços

| Plano | Mensal | Anual |
|---|---:|---:|
| Grátis | R$ 0 | R$ 0 |
| Plus | R$ 19,90 | R$ 199 |
| Capital | R$ 24,90 | R$ 249 |
| Pro | R$ 29,90 | R$ 299 |
| Casal | R$ 29,90 | R$ 299 |
| Empreendedor | R$ 34,90 | R$ 349 |
| Família | R$ 49,99 | R$ 499 |

O anual continua próximo de 10 mensalidades para manter aproximadamente 2 meses de economia.

## Níveis de Bivvo IA

- Plus — IA Essencial: resposta direta + próxima ação.
- Capital — IA Contextual: causa, consequência, risco/oportunidade e até 2 próximos passos.
- Pro e Casal — IA Avançada: compara cenários, trade-offs e prioridades.
- Empreendedor — IA Especialista: análise mais profunda, causa-raiz, curto/médio prazo e lente empresarial quando aplicável.
- Família — IA Máxima: maior profundidade, síntese, cenários, dependências e plano priorizado.

A diferenciação é validada no servidor pelo entitlement do usuário. O cliente não escolhe o nível da IA.

## Cotas mensais

| Plano | Perguntas abertas IA | Scanner |
|---|---:|---:|
| Plus | 30 | 30 |
| Capital | 60 | 60 |
| Pro | 300 | 200 |
| Casal | 300 | 200 |
| Empreendedor | 500 | 300 |
| Família | 800 | 500 |

Perguntas rápidas resolvidas localmente continuam sem consumir cota.

## Modelos

O endpoint tenta modelos progressivamente mais capazes e possui fallback automático. Variáveis opcionais no Netlify:

- `GEMINI_ASSISTANT_MODEL_ESSENTIAL`
- `GEMINI_ASSISTANT_MODEL_CONTEXTUAL`
- `GEMINI_ASSISTANT_MODEL_ADVANCED`
- `GEMINI_ASSISTANT_MODEL_SPECIALIST`
- `GEMINI_ASSISTANT_MODEL_MAX`

Os defaults estão documentados em `.env.example`. Se um modelo de nível superior não estiver disponível para a chave Gemini configurada, o servidor cai para um modelo compatível sem interromper o usuário; as instruções de profundidade e limites de resposta do nível continuam sendo aplicadas.

## Segurança

- Nível da IA é derivado no servidor a partir dos `entitlements`.
- Continua proibido enviar extrato bruto ao endpoint de IA.
- Continua existindo validação dos valores monetários gerados contra os números agregados enviados pelo Bivvo.
- Perguntas que dependem de taxa/regra atual não são inventadas.

## Validação

- 39 suítes automatizadas: 0 falhas.
- SEO estático: 55 URLs, 0 erros.
- Build: concluído.
- Orçamento estático de desempenho: aprovado.
- Teste de navegador: não executado neste ambiente porque a dependência Playwright não está instalada.
