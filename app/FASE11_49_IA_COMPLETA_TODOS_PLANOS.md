# Bivvo 11.49 — IA completa em todos os planos

## Objetivo
Todas as respostas do Bivvo IA nos planos pagos passam a seguir um padrão mínimo de qualidade: completas, bem elaboradas, contextualizadas e acionáveis. O plano mais barato não recebe uma IA “ruim”; planos superiores aumentam profundidade, contexto, comparação de cenários e capacidade estratégica.

## Mudanças no motor de IA
- Removido fallback `gemini-2.5-flash-lite` do assistente financeiro.
- Todos os níveis usam no mínimo uma família de modelo completa (Flash), com níveis superiores podendo priorizar Pro.
- Ativado orçamento de raciocínio escalonado nos modelos Gemini 2.5 compatíveis.
- Aumentado o orçamento total de saída para não cortar a resposta durante o raciocínio.
- Todos os níveis exigem: resposta direta, leitura dos dados, impacto, opções/cenários quando aplicável, plano de ação e o que acompanhar.
- Mantido o contrato de verdade: não inventar saldos, taxas, cotações, impostos ou rentabilidades.

## Níveis
- Essencial: análise completa, clara e prática.
- Contextual: adiciona cadeia de causa e consequência e mais contexto.
- Avançada: cruza mais variáveis e compara cenários/trade-offs.
- Especialista: causa-raiz, curto/médio prazo e estratégia; visão empresarial quando aplicável.
- Máxima: síntese mais profunda, dependências, cenários, premissas e plano priorizado.

## Respostas locais
Perguntas rápidas respondidas no aparelho continuam privadas e sem gastar cota, mas agora recebem complementos de leitura do cenário, impacto e próximo passo para evitar respostas rasas.

## Interface e landing
A página de planos agora deixa explícito que todas as IAs são completas; o que muda nos planos superiores é o nível de profundidade, contexto e estratégia.

## Validação
- 40 suítes automatizadas: 0 falhas.
- SEO estático: 55 URLs, 0 erros.
- Build: concluído.
- Teste de navegador: não executado neste ambiente porque a dependência Playwright não está instalada.

## Banco de dados
Nenhuma migração SQL nova é necessária para atualizar da 11.48 para a 11.49.
