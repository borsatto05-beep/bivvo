# BIVVO 11.85 — clareza com profundidade discreta

A revisão visual percorreu entrada, cadastro, Início, movimentações, cartões, calendário, previsão, orçamento, metas, desafios, recorrências, assistente, jornada, configurações, aprendizado, Casal, Empresa, Capital, formulário de gasto e páginas públicas. Foram capturadas 30 situações em celular e computador com dados fictícios.

## Diagnóstico

A identidade estava fragmentada: entrada escura com cores luminosas, app claro com vários tons e áreas de Casal/Empresa com superfícies próprias. Guias e atalhos apareciam antes do dado central, com muitas mensagens disputando atenção. O número útil precisava de maior prioridade. Alguns textos secundários tinham pouco contraste; no modo escuro, fundos claros antigos prejudicavam a leitura.

## Implementado

- Claro como padrão, roxo como destaque, fundos suaves e sombras discretas.
- Escuro opcional; controle na entrada, no topo do app e navegação pública. Preferência local persistente, sincronizada entre abas. Não armazena informações financeiras.
- Números com largura uniforme, contraste maior, cartões e campos com identidade comum.
- Referência diária antes da anotação rápida; aprendizado depois do conteúdo financeiro na área pessoal.
- Navegação, formulários, estados de atenção e áreas didáticas com superfícies consistentes.
- Nome curto “Planos” na barra inferior evita truncamento.
- Respeito ao movimento reduzido; foco visível e botão de tema com estado e nome acessível.
- Tema e CSS incluídos no pacote offline gerado.

## O que o layout ainda não pode provar

Um visual bonito não garante viralidade. As próximas decisões precisam de observação de pessoas usando o app: tempo até entender a referência diária, conclusão do primeiro registro, retorno em 7 dias e visitantes que chegam por compartilhamento e concluem o cadastro. Testar com usuários reais se a explicação do cálculo transmite confiança e se a próxima ação é clara. Conteúdo compartilhável deve revelar progresso somente por escolha do usuário.

Esta versão altera a interface web. O APK anexado continua sendo a versão anterior; precisa ser recompilado para receber este visual.
