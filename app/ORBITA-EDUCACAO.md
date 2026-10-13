# Bivvo Órbita — educação financeira aplicada

A versão mantém o aplicativo existente e integra uma jornada prática: escolher um objetivo, entender uma ideia, testar um cenário e confirmar uma ação. O visual usa órbitas, luz violeta e ciano, com uma missão por vez.

## O que mudou

- Início Pessoal com uma referência financeira, uma missão e um próximo compromisso. O painel completo continua disponível em uma seção recolhida.
- Quatro objetivos pessoais, três de casal e três de empresa, cada um com sete missões. O progresso fica separado por ambiente.
- Pergunta com feedback, laboratório interativo e ação nas ferramentas existentes. A missão seguinte só abre após entender, experimentar e confirmar a aplicação.
- A simulação usa números ilustrativos e não altera lançamentos, saldo, orçamento nem metas.
- Registros existentes podem ser conferidos. Quando adequado, há alternativas explicitamente confirmadas pela pessoa, sem exigir gastos, contratação de cartão ou criação de registros fictícios. O app distingue a revisão de um registro da confirmação manual.
- Saldo zero confirmado estabelece uma base válida, sem criar receita fictícia; a confirmação pessoal não estabelece o saldo da empresa.
- Revisão semanal com uma decisão possível. Quantidade de conceitos e ações não é um índice de saúde financeira. Não prometemos que um gasto maior representa piora nem que completar missões garante resultado financeiro.
- Página de entrada centrada no objetivo e na demonstração. Planos mostram a opção correspondente ao ambiente e uma saída para continuar no Grátis; preços e direitos dos planos foram mantidos.
- Eventos educativos no painel administrativo: início, entendimento, aplicação e revisão. Não enviam saldos, receitas, despesas ou respostas financeiras. Conversões do Google Ads continuam restritas ao cadastro confirmado e ao consentimento de marketing.

## Dados e compatibilidade

O aprendizado fica em `profile.learningJourneyV1`, usando o mecanismo existente de backup e sincronização. A âncora de saldo conferido fica em `profile.balanceVerifiedV1`, por ambiente. Não há migração de banco de dados. O Casal não lê dados financeiros pessoais nas missões; a evolução educativa de cada conta é individual.

As funções anteriores de cartões, parcelas, empréstimos, planejamento, backup e privacidade continuam incluídas. A aba Você mantém o agrupamento simplificado e ganha acesso à Órbita. A jornada de recuperação de dívidas existente continua disponível.

## Publicação no Netlify

Use o projeto completo contido no ZIP. A configuração `netlify.toml` já define:

- Node 22
- Build: `npm run build`
- Pasta pública: `dist`
- Funções: `netlify/functions`

Mantenha as variáveis de ambiente e credenciais já configuradas no seu projeto Netlify. O pacote não contém credenciais privadas nem altera o banco ou configurações remotas.

Publicar somente a pasta `dist` atualiza a interface, mas não publica as funções novas de métricas. Para a entrega completa, use o build do projeto completo no Netlify (Git ou CLI). Esta entrega não foi publicada no site em produção.

## Validação

62 suítes automatizadas de lógica, finanças, sincronização, permissões, conversões e segurança. Testes de navegador em 320, 390 e 1280 pixels cobrem sete missões, respostas incorretas, travas de progressão, simulação sem alteração financeira, retomada, revisão semanal, recarga do payload, ambientes separados, planos, cancelamento e cadastro real de gasto num diálogo filho. A navegação simplificada da aba Você também foi validada.

Serviços externos foram simulados nos testes de navegador; não realizamos pagamento, cadastro de conta externa nem disparo de conversão real. As métricas administrativas usam as tabelas existentes e precisam das funções publicadas para aparecerem em produção.

As prévias entregues junto do ZIP mostram a implementação com dados fictícios. Elas ficam fora do pacote público para não aumentar o download e o cache offline do app.
