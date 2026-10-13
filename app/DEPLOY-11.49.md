# Deploy Bivvo 11.49

1. Não há SQL novo para esta versão.
2. Publique o conteúdo desta pasta no Netlify.
3. Preserve as variáveis de ambiente já usadas pelo Bivvo, especialmente `GEMINI_API_KEY` e os modelos opcionais `GEMINI_ASSISTANT_MODEL_*`.
4. Após o deploy, abra o app e faça uma pergunta aberta no Bivvo IA para validar o endpoint `/api/assistant`.
5. As respostas agora podem consumir mais tokens por pergunta porque todos os níveis foram configurados para análises mais elaboradas.
