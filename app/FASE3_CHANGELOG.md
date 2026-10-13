# Bivvo 10.6 — Fase 3 · Bivvo IA

## Entregue
- Nova tela `Bivvo IA` com Raio-X financeiro.
- Roteador local: perguntas comuns são respondidas no aparelho e não consomem IA.
- Perguntas abertas usam `netlify/functions/assistant.js`.
- O backend recebe apenas resultados agregados calculados por `finance.js`; o extrato bruto não é enviado.
- Consentimento de privacidade na primeira pergunta que exige IA.
- Login obrigatório, rate limit, plano Pro/Família, cota `ai` atômica e reembolso da cota em falha.
- Validação defensiva de números da resposta: cifra não encontrada nos resultados das ferramentas gera resposta segura.
- Entrada do Bivvo IA na tela Início.
- Versão atualizada para 10.6.0.

## Configuração
Reutiliza `GEMINI_API_KEY`, `SUPABASE_SECRET_KEY` e as tabelas/RPCs já usadas na Fase 2. Opcional: `GEMINI_ASSISTANT_MODEL`; sem ela, usa `GEMINI_MODEL`.

## Privacidade
Não envie `transactions`, descrições, estabelecimentos, e-mail ou telefone ao endpoint do assistente. O servidor rejeita payloads com essas chaves.
