# Ativar respostas do Gemini no BIVVO

O chat envia perguntas e o resumo financeiro agregado ao endpoint `/api/assistant`. O servidor autentica a sessão, valida o plano e a cota e consulta o Google Gemini. Perguntas rápidas também usam o Gemini. Avisos de erro, consentimento e validação são mensagens do próprio Bivvo, identificadas separadamente; não simulam uma resposta do Gemini.

## Netlify

1. Crie uma chave do Gemini no Google AI Studio: https://aistudio.google.com/apikey
2. No painel do site, abra a configuração de variáveis de ambiente e adicione `GEMINI_API_KEY`. Use o escopo das Functions. Não coloque a chave em HTML, JavaScript do navegador ou no GitHub.
3. Opcionalmente adicione `GEMINI_ASSISTANT_MODEL=gemini-2.5-flash`. Sem configuração, esse é o modelo de entrada. Os planos superiores conservam os modelos e níveis já configurados.
4. Mantenha as variáveis do Supabase exigidas pelo app, autenticação, tabelas/RPCs de cota e um plano com acesso à IA.
5. Faça o deploy com build `npm run build`, publicação `dist` e Functions `netlify/functions`, usando `app` como diretório base neste repositório. Arrastar só a pasta estática não instala as Functions.
6. Entre com uma conta com acesso à IA, aceite o envio da pergunta e faça uma pergunta. Uma resposta gerada aparece como “Bivvo IA · Gemini”.

O uso pode gerar cobrança ou atingir limites da API do Google. Falha, ausência de chave ou valores não validados geram avisos do Bivvo; nenhuma resposta local é apresentada como se fosse do Gemini. Dados atuais como taxas e regras fiscais precisam de fonte oficial; este chat não faz consulta ao vivo dessas fontes.

A integração foi verificada com chamadas simuladas. Uma chamada real depende da chave e das configurações do seu ambiente de produção.
