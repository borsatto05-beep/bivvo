# Bivvo 11.42.6 — IA de Direção Financeira

## Objetivo
Transformar o Bivvo IA em um orientador mais útil para dúvidas reais: sair do aperto, organizar prioridades, criar reserva, guardar dinheiro e, quando o caixa estiver protegido, começar a planejar investimentos com prudência.

## O que mudou
- Perguntas rápidas agora mudam conforme o estágio financeiro do usuário: Sobrevivência, Recuperação, Controle, Estabilidade ou Crescimento.
- Novas respostas locais e determinísticas para: próximo passo, sair do vermelho, quanto guardar, reserva suficiente, dívida x investimento, quanto investir e como começar a investir.
- O Raio-X agora mostra o estágio financeiro e direciona o foco para a necessidade atual.
- Quando o cenário está negativo, a IA não empurra investimento: prioriza essencial, vencimentos, margem e recuperação.
- Quando o cenário está positivo, a IA orienta reserva, objetivos, prazo, liquidez, risco, diversificação, custos e impostos antes da escolha de produto.
- O backend recebeu um novo contrato de verdade: não inventar valores do usuário, não prometer retorno, distinguir estimativa de fato e admitir dados ausentes.
- Perguntas que dependem de dado vigente/ao vivo (ex.: Selic/CDI/taxa/tributação atual) não recebem número inventado. A IA informa que precisa de fonte oficial atual.
- As instruções críticas agora são enviadas como `systemInstruction` para o modelo, separadas da pergunta do usuário.
- A validação pós-resposta continua bloqueando cifras monetárias personalizadas que não existam nos dados agregados enviados pelo app.
- O extrato bruto, descrições de compras, e-mail e dados pessoais continuam fora do payload da IA.

## Princípios para investimento
A orientação foi alinhada a princípios educacionais usados pela CVM/Portal do Investidor: decisão consciente, adequação ao objetivo e perfil de risco, atenção à liquidez e diversificação. A reserva de emergência é tratada como dinheiro de proteção, com prioridade para segurança e liquidez; investimento de longo prazo fica separado dessa função.

Referências de projeto:
- https://www.gov.br/investidor/pt-br/investir/antes-de-investir/entenda-as-caracteristicas-dos-investimentos/liquidez
- https://www.gov.br/investidor/pt-br/investir/cuidados-ao-investir/evitando-problemas
- https://www.gov.br/cvm/pt-br/assuntos/educacao

## Arquivos principais alterados
- `js/assistant.js`
- `js/views/assistant.js`
- `netlify/functions/assistant.js`
- `js/main.js`
- `js/util.js`
- `index.html`
- `sw.js`
- testes de versão e novo `tests/assistant-direction-11426.test.mjs`

## Privacidade e segurança
- Nenhuma descrição de extrato é enviada ao modelo.
- Nenhuma renda, saldo, dívida ou valor é colocado em URL pública.
- Perguntas abertas usam apenas agregados financeiros já calculados no aparelho.
- `systemInstruction` reduz o risco de a pergunta do usuário sobrescrever as regras centrais do orientador.
- Perguntas sobre dados atuais que exigem consulta ao vivo são bloqueadas de receber uma cifra inventada.

## Testes executados
- `node --check`: 91 arquivos JS/MJS verificados, 0 falhas de sintaxe.
- 16 arquivos de teste/regressão executados, 16 passaram, 0 falharam.
- Testes específicos da IA 11.42.6: cenários positivo e crítico, dívida x investimento, quanto guardar, quanto investir e perguntas dinâmicas.
- Contrato de verdade verificado estaticamente: `systemInstruction`, regra de não adivinhar dados atuais e indicação de fontes oficiais.
- Regressão financeira: 42/42.
- Empréstimos: 9/9.
- SEO estático: 55 URLs, 0 erros.
- Smoke HTTP local: `/`, `main.js`, `views/assistant.js`, `assistant.js` e `sw.js` responderam HTTP 200.
- Varredura dos arquivos alterados não encontrou `SUPABASE_SECRET_KEY`, `service_role` ou chave privada adicionada.

## NÃO TESTADO
- Qualidade real das respostas do Gemini em produção com a chave/API configurada.
- Perguntas abertas reais em uma conta Pro/Família após deploy no Netlify.
- Respostas do modelo em centenas de formulações diferentes e tentativas de jailbreak/prompt injection em produção.
- iPhone e Android físicos.
- Latência real da função Netlify + Gemini.
- Core Web Vitals em produção.

## Validação recomendada após deploy
Perguntar no Bivvo IA, usando uma conta de teste:
1. “Estou apertado. Por onde começo?”
2. “Como saio do vermelho sem piorar minha situação?”
3. “Quanto devo guardar este mês?”
4. “Vale quitar dívida ou investir?”
5. “Tenho dinheiro sobrando. Como começo a investir?”
6. “Quanto posso investir sem apertar meu mês?”
7. “Qual a Selic hoje?” — a resposta não deve inventar o valor.
8. “Qual investimento é melhor para mim?” — a resposta deve considerar objetivo, prazo, liquidez e risco antes de recomendar direção.
