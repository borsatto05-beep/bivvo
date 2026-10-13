## 11.81 — Página de instalação Android
- Redesign responsivo e premium da página `/instalar/`.
- Download do APK e acesso ao navegador separados em botões próprios.
- Melhorias de legibilidade e usabilidade no celular.


## 11.79 — Filtros na aba Usuários
- Botão de filtros recolhível na área de atividade dos usuários.
- Filtros por status online/offline, origem, aba mais usada, dispositivo e sistema operacional.
- Busca ampliada e contador de resultados.
- Botão para limpar todos os filtros.
- Layout responsivo para celular.

## 11.75 — WhatsApp na Administração
- Botão de contato por WhatsApp na aba Usuários online, usando o número cadastrado.

## 11.74 — Usuários online na Administração
- Nova aba educativa de atividade dos usuários.
- Presença online por heartbeat autenticado.
- Último uso, tempo médio por sessão, aba mais usada e tela atual.
- Sem coleta de valores financeiros pessoais.

# 11.72 — vencimentos do dia e filtros no Bivvo Capital

- Mostra no topo o que vence hoje, inclusive parcelas individuais.
- Ordenação compacta por data de vencimento, maior valor e menor valor.
- Mantém filtro de situação combinado com a nova ordenação.

## Próximo passo visível nas missões

- Botão Continuar permanece visível; resposta incorreta mostra orientação para tentar novamente.
- Removido texto null; próxima etapa começa no topo.

## Correção da rolagem nas missões da Órbita

- Painéis preservam a altura natural do conteúdo e rolam por toque, permitindo acessar todas as respostas e avançar.
- Validado em 320, 390 e 590 px, incluindo reprodução do corte anterior.

# 11.64 — saldo de capital recebido separado

- Principal devolvido fica no saldo de capital recebido; juros recebidos entram no saldo geral.
- A separação é aplicada ao histórico existente, pagamentos normais, somente juros e parcelas, sem reescrever os registros.
- O Capital mostra os dois saldos e permite consultar os recebimentos de principal.
- Correções e exclusões atualizam cada saldo; o filtro de mês não altera os saldos acumulados até hoje.
- A referência de gastos, o saldo e as projeções do app excluem o principal recebido.

# 11.64 — baixa correta do cartão + saldo
- Pagamento de fatura passa a ser um lançamento de caixa próprio e vinculado ao mês da fatura.
- Pagamento total ou parcial reduz saldo, dá baixa na fatura e libera limite.
- Histórico de pagamentos visível dentro da fatura.
- Compras não são duplicadas como saída de caixa.
- Estorno seguro do pagamento recalcula saldo, fatura e limite.
- Corrigida normalização que apagava o vínculo `invoice` de pagamentos não classificados como compra no crédito.

# 11.60 — Empresa escola prática
- Ambiente Empresa inteiro com professor contextual.
- Pop-ups: conceito, importância, fórmula, exemplo, interpretação, jeito certo, erros e ação.
- Bivvo Mentor e semáforos de saúde.
- Capital de giro incluído na trilha didática.
- Simuladores de preço, lucro, ponto de equilíbrio, desconto e meta.
- Cadastro de produto/serviço em 4 passos guiados com ajuda por campo.
- 52 suítes aprovadas; SEO 55 URLs / 0 erros.

# Bivvo 11.56 — Demonstração do Casal + lista de compras compartilhada

- A demonstração agora abre o perfil Casal com duas pessoas, rendas, gastos, divisão, agenda e histórico fictícios.
- Nova lista de compras compartilhada no painel Casal.
- Itens com quantidade, unidade, preço estimado, quem adicionou, status comprado/pendente e total efetivamente pago.
- Resumo de itens pendentes, valor estimado e total comprado.
- Adicionar, editar, marcar/desmarcar, excluir e limpar itens concluídos.
- A lista da demonstração já vem preenchida e é interativa sem gravar dados.
- Requer executar `supabase-couple-shopping-11-56.sql` para ativar a lista compartilhada em contas reais.

# Bivvo 11.55 — Gestão empresarial + captura rápida por perfil

- Empreendedor: DRE gerencial simplificada com faturamento, custos variáveis, margem de contribuição, despesas fixas/operacionais, EBITDA aproximado, lucro gerencial e ponto de equilíbrio.
- Produtos/Serviços: custo real, frete, embalagem, taxas, impostos, comissão, markup, margem, lucro unitário, preço mínimo recomendado, estoque e lucro por produto.
- Captura rápida por texto/voz/câmera no Pessoal, Casal e Empresa, sempre salvando no ambiente correto.
- Grátis: 10 anotações rápidas por texto/voz por mês e 5 leituras de comprovante por câmera por mês.
- Planos pagos: texto/voz sem essa trava; scanner continua com a cota própria de cada plano.
- A cota gratuita de texto/voz é validada no servidor usando usage_counters já existente.
- Sem SQL novo: reutiliza a estrutura de monetização já usada pela IA e pelo scanner.


## 11.42.10 — Scanner One Shot 4.0
- Baseado na 11.42.8 (a versão inteligente), não na 11.42.9 de velocidade.
- Uma única foto agora gera até cinco evidências internas: documento completo, contraste, cabeçalho, centro e região do total.
- Dois leitores Gemini independentes analisam a mesma foto em paralelo; se houver conflito, um terceiro juiz automático decide usando a mesma captura.
- Leitura passa a extrair candidatos monetários e classificar cada valor como total pago, subtotal, item, parcela, troco, desconto, saldo, taxa ou desconhecido.
- QR Pix pode fornecer valor/recebedor estruturados quando o navegador consegue ler o QR; NFC-e é identificada sem persistir o QR bruto.
- Confiança e evidência por campo; conflitos retornam opções para confirmação, sem pedir nova foto.
- Falhas de leitura orientam correção manual dos campos em vez de uma nova captura.
- Versão/cache/PWA atualizados para 11.42.10.

## 11.42.8 — Scanner Inteligente 3.0
- Câmera guiada com foco/luz/movimento/reflexo e auto-disparo quando a imagem fica estável.
- Auto-crop e correção de perspectiva quando o contorno do papel é confiável.
- Tratamento de sombras/papel térmico e terceira visão da região provável do TOTAL.
- QR/NFC-e por `BarcodeDetector` quando suportado, sem persistir QR bruto.
- Confiança por campo, revisão somente do que ficou incerto e alerta de possível duplicidade.
- Segunda conferência da mesma foto continua sem consumir outra leitura de cota.
- Versão/cache/PWA atualizados para 11.42.8.

## 11.42.6 — Bivvo IA de Direção Financeira
- Perguntas rápidas adaptadas ao estágio financeiro.
- Respostas locais para sair do vermelho, guardar, reserva, dívida x investimento e quanto investir.
- IA aberta com contrato de verdade e `systemInstruction`.
- Dados atuais de taxa/tributação não são inventados; exigem fonte oficial.
- Versão/cache atualizados para 11.42.6.

# Bivvo 11.27.0 — Bloco D: Recuperação

- Missão Sair do Vermelho adaptativa.
- Plano de quitação com menor impacto conhecido e pequenas vitórias.
- Reserva Inteligente com simulação de retirada e cobertura.
- Sem juros inventados e sem movimentação automática.
- 92 testes automatizados executados sem falhas.

# Bivvo V10.5.0 — Fundação Pro

Objetivo: preparar o Bivvo para receita recorrente sem tirar nada de quem usa hoje.

## Planos e permissões
- `js/plans.js`: único lugar com preços, limites e regras (`getUserPlan`, `getPlanLimits`, `canUseFeature`, `getRemainingUsage`, `canAddCard`).
- `BILLING_LIVE = false`: enquanto não houver cobrança real, nada que já existia é bloqueado. Só a leitura de comprovante (que custa dinheiro) tem cota, conferida no servidor.
- Plano vem da tabela `entitlements` (escrita só pelo servidor). Falha, lentidão ou tabela ausente = Grátis, sem travar a abertura (tempo limite de 4 s).
- Tela "Conhecer Pro" (preços da configuração, recursos prontos × em breve, sem botão de pagar falso) e paywall contextual com "Agora não".
- Cartão "Seu plano" em Você.

## Captura: voz e comprovante
- 🎙 Falar: reconhecimento de fala do próprio navegador (sem servidor, sem custo, sem gravar áudio). Entende números por extenso ("mil e duzentos", "trinta e dois e cinquenta"), "no pix", "no débito", "em seis vezes no Nubank". Sempre passa pela prévia antes de salvar.
- 📸 Comprovante (Bivvo Scan): imagem reduzida no aparelho → `/api/scan-receipt` (login, limite por minuto e cota mensal no servidor) → tela "Confirmar lançamento". Nunca salva sozinho. Imagem não é guardada. Valor lido em texto e número são conferidos no servidor e de novo no aparelho (18,90 não vira 189,00 em silêncio).
- Android: "Compartilhar → Bivvo" com uma imagem abre a leitura (`share_target` no manifest + service worker).
- Microfone e câmera liberados no `Permissions-Policy` (antes bloqueados, o que impediria a voz).

## Posso comprar?
- `js/simulate.js`: aplica a compra numa cópia do estado com as mesmas regras (parcelamento, ciclo de fatura) e recalcula com as mesmas funções. Nada é gravado.
- Mostra parcela, livre antes → depois, fatura mais pesada, limite usado e TRANQUILO / ATENÇÃO / APERTADO, com alternativa mais segura (entrada e/ou mais parcelas). "Registrar esta compra" só com toque explícito.
- Acesso pela Início ("Posso comprar? Simule antes"), pelo menu Adicionar e pelo atalho do ícone.

## Livre para gastar
- `F.spendableExplanation()` centraliza a explicação usada na Início (e pronta para o Assistente). O cálculo continua em `F.spendable()`; nada mudou nas regras.
- `F.computeFresh()` permite simular sem usar o cache do estado real.

## Onboarding
- Novo passo: principais contas (toque e informe o valor) + quanto quer guardar (0–20%).
- Final mostra o número: "você pode gastar R$ X por dia" (ou o total livre quando o próximo dinheiro é em até 3 dias).
- Correção: quando o saldo de hoje é informado, salário e contas que já venceram neste mês começam no próximo mês. Antes, o salário já recebido era somado de novo ao saldo informado.

## Crescimento
- Indicação com recompensa real (`/api/referral-activate`): quem chega ganha 7 dias de Pro; quem indica ganha 30 dias a cada 3 indicações ATIVAS (e-mail confirmado, 3+ lançamentos em 2+ dias, conta com até 60 dias, máx. 4 recompensas/ano, uma por conta). Abrir o link não dá nada.
- Página de cobrança dividida: "Fulano te enviou uma cobrança de R$ X pelo Bivvo" e chamada discreta "Organize seu dinheiro sem planilhas".

## Métricas com privacidade
- `js/analytics.js`: lista fechada de eventos e propriedades; nunca envia valores, descrições, categorias, nomes ou cartões. Só para quem está logado, nunca na demo. Falhas ignoradas.

## Banco e servidor
- Novo SQL: `supabase-monetizacao.sql` (entitlements, usage_counters, product_events, referrals + funções atômicas de cota).
- Novas funções: `scan-receipt`, `referral-activate`. Novo `netlify/lib/plans.js`.
- Detalhes, variáveis de ambiente e arquitetura futura em `MONETIZACAO.md`.

# Bivvo V10.4.0 — Captura confiável, avisos de verdade e crescimento

## Captura rápida
- Novo interpretador (`js/quickparse.js`): entende milhar e centavos ("1.250,00", "2.500", "2,5k"), datas ("ontem", "sexta", "dia 3", "03/10"), parcelas ("tv 3x 900", "tv 10x de 90"), "no crédito" e nome do cartão.
- Prévia permite trocar categoria e cartão antes de salvar. Todo salvamento mostra **Desfazer**.
- Barra fixa "⚡ Anote: mercado 45" na Início, logo abaixo do valor livre do dia.
- Popup ao abrir: só depois das 18h, só se nada foi anotado no dia, uma vez por dia, nunca na demonstração. Opção "Não lembrar à noite" e chave em Você → Avisos e lembretes.
- Corrigidos: botão "Agora não" cortado em 390px, título duplicado, aviso cobrindo o campo (toast sobe para o topo com folha aberta).

## Avisos (Web Push)
- Lembrete no horário escolhido, mesmo com o app fechado, só se nada foi anotado no dia; inclui faturas e contas que vencem amanhã.
- Valores ficam fora da tela bloqueada por padrão. Botão "Enviar teste".
- Novas funções: `push-key`, `push-test` e `push-cron` (agendada, a cada hora). Sem dependências externas.
- Novo SQL: `supabase-push.sql`. Passo a passo em `AVISOS-SETUP.md`.

## Navegação e módulos
- Empréstimos virou módulo opcional (Você → Módulos). Liga sozinho para quem já tem contratos.
- Com o módulo ligado, o menu do celular mostra **Empréstimos** no lugar do Calendário (que segue acessível pela Início e pelo menu do computador).
- "Próximos 15 dias" → Calendário agora abre a aba Calendário.

## Crescimento
- **Bivvo Wrapped**: retrospectiva do ano em slides e card "Meu ano" (barras dos 12 meses). Aparece na Início em dezembro e janeiro; em Você o ano todo.
- **Dividir conta**: registra o total, anota "a receber" de cada pessoa e gera um link por pessoa com a parte dela e a chave Pix. A página do link é pública, não carrega conta nenhuma e convida a testar o Bivvo.
- Partes de contas divididas não contam como "próximo dinheiro" no cálculo do dia.

## Demonstração e identidade
- Demo sempre com o mês cheio: salário entre os dias 1 e 5 e lançamentos extras no começo do mês.
- Ícone sem azul: o degradê agora vai do magenta ao violeta.

# Bivvo V10.3.2 — Captura rápida ao abrir

- Novo popup automático **Anotar em 2 segundos** ao abrir o aplicativo.
- O popup aparece uma única vez por abertura real, depois do app carregar.
- Não aparece sobre login nem onboarding.
- Campo recebe foco automaticamente; Enter salva no desktop.
- `Agora não` fecha sem criar lançamento e `Adicionar detalhes` abre o formulário completo.
- Mantida a captura inteligente, categorização automática e todas as correções de empréstimos/calendário.
- Cache/PWA atualizado para 10.3.2.

# Bivvo V10.3.1 — Seletor de categorias em lista

- Categorias nos formulários deixaram de aparecer como chips lado a lado.
- Ao tocar no campo Categoria, abre a lista nativa de seleção com ícone + nome.
- Aplicado ao lançamento de gasto/entrada/cartão e às contas fixas.
- Categorias personalizadas continuam sendo carregadas dinamicamente.
- Autocategorização continua selecionando a categoria correspondente.
- Cache/PWA atualizado para 10.3.1.

# Bivvo V10.3.0 — detalhe de vencimento no Calendário

- Vencimentos de empréstimos no Calendário agora são clicáveis como lançamentos.
- Ao tocar, abre detalhe no mesmo padrão visual da transação, com cliente, total a receber, vencimento, principal, juros, taxa e situação.
- Ações: Registrar pagamento, Editar empréstimo e Ver histórico.
- Abrir o vencimento não altera saldo; somente Registrar pagamento cria movimentação financeira.
- Mantidas renovação automática, vencimento individual, filtro mensal e regras de principal/juros.

# Bivvo V10.2.9 — Empréstimos e Calendário corrigidos

- Novo contrato de empréstimo não cria mais uma transação financeira artificial de saída.
- Lançamentos legados `loan_principal_out` e `loan_principal_return` deixam de aparecer no Extrato/Calendário financeiro.
- Vencimentos aparecem exclusivamente pela data `due` de cada contrato, como eventos informativos separados.
- Vencimentos não entram em Entradas, Saídas ou Resultado do dia.
- Somente juros efetivamente recebidos entram como renda/saldo; principal continua sendo controle patrimonial.
- Renovação automática mantém o vencimento individual do contrato no calendário.
- Cache/PWA atualizado para 10.2.9.

# V10.2.8 — Correção dos vencimentos no calendário

- Cada empréstimo agora é posicionado exclusivamente na sua própria data de vencimento.
- Datas persistidas com horário/ISO são normalizadas para YYYY-MM-DD.
- Ciclo do próprio contrato é usado apenas como fallback para registros antigos sem `due`.
- Nenhuma data global, data atual ou data de outro cliente é usada para posicionar vencimentos.
- Cache/PWA atualizado para evitar calendário antigo em cache.

## 10.2.6 — Renovação automática de empréstimos

- Ao quitar os juros de um ciclo mensal e ainda existir principal, o contrato renova automaticamente para o mês seguinte.
- Se houver amortização do principal, os novos juros percentuais são calculados sobre o principal restante.
- Se pagar somente os juros, o principal permanece e recebe novos juros no ciclo seguinte.
- Pagamento parcial que não quita todos os juros não inicia novo ciclo.
- Quitação total encerra o contrato sem renovação.
- Renovação não gera lançamento financeiro nem altera o saldo; somente pagamentos efetivamente registrados geram movimentos.
- Mantido o filtro mensal da aba Empréstimos.

## 10.2.5 — Empréstimos: saldo e filtro mensal
- Contratos de empréstimo não alteram mais o Saldo Atual apenas por serem cadastrados.
- Principal emprestado/devolvido fica fora do saldo; juros entram somente após pagamento efetivamente registrado.
- Aba Empréstimos ganhou seletor de mês com setas, no padrão do Extrato.
- Lista mensal considera criação, vencimento ou pagamento no período selecionado.
- KPI de juros recebidos respeita o mês selecionado.

# Bivvo V10.2.3 — Gráfico interativo da carteira

- Aba Investimentos agora mostra um gráfico donut/pizza por ativo individual (ticker/nome), e não apenas por tipo.
- Registros repetidos do mesmo ativo são consolidados em uma única fatia.
- Legenda mostra participação percentual e valor atual de cada ativo.
- Clique/toque em uma fatia ou item da legenda abre um popup com participação, valor atual, aplicado, resultado, tipo, quantidade, cotação/preço e dados de rendimento disponíveis.
- Animações e navegação por teclado preservadas pelo motor de gráficos do Bivvo.

# Bivvo 10.2.2 — visual claro restaurado

- Removido o modo escuro automático/manual e a opção Aparência das configurações.
- Bivvo volta a usar somente a identidade visual clara original.
- Nenhuma microcopy/humor ou animação extra foi adicionada nesta revisão; Stories e celebrações que já pertenciam à base anterior foram preservados.
- Mantidos captura rápida, landing, instalação iPhone/Android e demais recursos da 10.2.x.

# Bivvo 10.2.0 — captura instantânea e crescimento

- Captura em uma linha: “mercado 45”, “ifood 32 nubank” e “+ salario 2200”.
- Categoria automática e reconhecimento de cartão cadastrado; formulário completo continua em “Mais opções”.
- Landing pública antes do login com demonstração em um clique e CTA de instalação.
- Imagem Open Graph 1200×630 para compartilhamento.
- Guia de instalação PWA específico por plataforma.
- Opt-in de notificações do navegador. Avisos realmente em segundo plano exigem Web Push/VAPID no servidor e não são simulados por esta versão.
- Mantidos calendário, FAB, gráficos e módulo de empréstimos da 10.1.x.

# Bivvo 10.1.2 — Editar e excluir contratos de empréstimo

## Empréstimos
- Adicionados botões **Editar** e **Excluir** na tela de detalhes de cada contrato.
- Edição permite alterar pessoa, juros, periodicidade, vencimento e observação.
- O valor principal pode ser corrigido enquanto o contrato ainda não possui pagamentos; depois do primeiro pagamento ele fica bloqueado para preservar o histórico financeiro.
- Ao editar um contrato sem pagamentos, a saída original de principal e o ciclo inicial são sincronizados com o novo valor.
- Exclusão remove o contrato, pagamentos, ciclos e todas as movimentações financeiras vinculadas, evitando resíduos no saldo e nos relatórios.
- Exclusão exige confirmação e informa o impacto antes de concluir.
- Contratos quitados também podem ser editados ou excluídos.

# Bivvo 10.1.1 — Empréstimos aprimorados

## Empréstimos
- Cards com principal, juros pendentes, total a receber, status e progresso de recuperação.
- Status automáticos: Em dia, Vence hoje, Vencido e Quitado.
- Filtros para abertos, vencidos, quitados e todos.
- Tela de detalhes do contrato com histórico/timeline, valores e observações.
- Visão por pessoa/devedor, agrupando múltiplos empréstimos.
- Gráficos interativos da carteira por pessoa e juros recebidos por mês.
- Registro de pagamento com prévia da divisão entre juros e amortização.
- Correção importante: pagamentos parciais sucessivos não cobram novamente juros já pagos no mesmo ciclo.
- Renovação com novo vencimento/taxa e capitalização opcional, nunca automática.
- Novo empréstimo aceita juros percentuais ou fixos e mostra prévia antes de salvar.

## Integridade financeira
- Principal devolvido continua separado de renda.
- Somente juros efetivamente recebidos contam como renda.
- Pagamento acima do saldo do contrato é bloqueado.
- Ciclos de renovação são registrados em `loanCycles`.

# Bivvo 10.1.0

## Adicionado
- Calendário financeiro mensal interativo, responsivo em 7 colunas, com resumo do mês e detalhe por dia.
- Botão flutuante global de ação rápida, respeitando safe-area no mobile/PWA.
- Motor reutilizável de visualizações (`js/charts.js`) com donut, barras e progresso, SVG/DOM acessível e animações.
- Módulo próprio de empréstimos (`loans`, `loanPayments`, `loanCycles`) com principal e juros separados.
- Dashboard de empréstimos com principal pendente, juros a receber/recebidos, gráficos e progresso por contrato.
- Registro de pagamento parcial: juros são liquidados primeiro e o restante amortiza principal.

## Integridade financeira
- Saída de principal de empréstimo reduz caixa, mas não entra como gasto de consumo.
- Retorno de principal aumenta caixa, mas não entra como renda real.
- Apenas juros recebidos entram como renda.
- Estruturas novas entram na serialização, migração, sincronização e reset pelo estado central.

## Interface
- Calendário incluído na navegação mobile e desktop.
- Empréstimos incluído na navegação desktop e na ação rápida.
- Gráficos respeitam `prefers-reduced-motion` pelo CSS global existente.

## Limitações desta etapa
- Migração automática de empréstimos legados embutidos em transações não é feita de forma destrutiva; registros antigos permanecem preservados.
- Alertas, previsão 30/60/90, fechamento mensal, busca global e Stories 2.0 ficam para etapas seguintes para evitar regressões em uma única entrega.


## 10.2.1 — instalação simplificada por plataforma
- Configurações agora mostra dois botões grandes: iPhone e Android.
- Android usa o prompt nativo de instalação quando o navegador o disponibiliza; caso contrário mostra o caminho mínimo pelo menu do navegador.
- iPhone abre instruções curtas para Safari → Compartilhar → Adicionar à Tela de Início, pois o iOS não oferece um prompt programático equivalente.
- Detecção do aparelho destaca por texto qual botão usar.


## 10.2.4 — Categorias e ícones
- Nova central **Categorias e ícones** em Você → Preferências.
- Mais categorias padrão com ícones próprios.
- Criação de categoria personalizada com seletor visual de ícone.
- Edição do nome/ícone de categorias personalizadas; categorias padrão permitem trocar o ícone.
- Exclusão segura: lançamentos antigos da categoria removida são enviados para Outros.
- Ícones personalizados sincronizam no payload e aparecem nos chips/formulários.
- Mesclagem em nuvem atualizada para categorias/ícones e arrays de empréstimos.

## 10.2.7 — Vencimentos de empréstimos no calendário
- Vencimentos de clientes cadastrados em Empréstimos agora aparecem no Calendário.
- O evento mostra o cliente e o total a receber, sem criar transação nem alterar saldo.
- Ao renovar um empréstimo, o novo vencimento passa automaticamente a aparecer no mês correspondente.

## 10.5 Mercado Pago
- Checkout recorrente mensal para Plus (R$ 9,90), Pro (R$ 19,90) e Família (R$ 39,99).
- Preço validado no servidor; Access Token somente no Netlify.
- Sincronização de assinatura autenticada + reconciliação horária.
- Tela de planos com checkout Mercado Pago e atualização manual após retorno.


## 8.18 — Convite Inteligente de Instalação PWA
- Instalação nativa em um clique quando `beforeinstallprompt` está disponível.
- Instruções mínimas no iOS, cooldown de 7 dias e métricas no Growth Center > Retenção.


## Bivvo 8.19 — Aquisição Orgânica & Growth
- Ferramenta pública até o próximo salário e painel de campanhas/UTMs no Growth Center.

## 11.18.0 — Fase 8.19.2 Motor Viral & Conversão
- “Meu número de hoje” compartilhável a partir do cálculo real de quanto pode gastar.
- Compartilhamentos e convites passam pela calculadora pública antes do cadastro.
- CTA de conversão após resultado da calculadora pública, preservando UTM/referral.
- Growth Center ganhou funil viral e métricas de compartilhamento/indicação.
- Privacidade preservada: valores em reais ficam ocultos por padrão nos cards e nunca entram no analytics.

## 11.19.0 — Fase 8.19.3: Ativação & Conversão
- Onboarding reduzido para renda, saldo e próximas contas.
- Primeiro `R$/dia` exibido imediatamente após a configuração essencial.
- Growth Center ganhou funil de ativação por coorte e gargalo automático.
- Retorno D1 e conversão da coorte passaram a ser acompanhados.
- Usuários antigos não recebem o novo onboarding.
- Landing reforça o posicionamento “Seu banco mostra quanto você tem. O Bivvo mostra quanto você pode gastar.”

## 11.20.0 — Fase 8.20
- Growth Autopilot.
- Resumo do Fundador.
- Comparação com período anterior.
- Priorização automática de gargalos e próximas ações.


## 11.20.1 — Correção do rastreamento de compartilhamento
- Após o compartilhamento nativo concluir, `story_shared` e `spendable_card_shared` são enviados imediatamente ao backend.
- Evita perder o evento quando o navegador/PWA é suspenso ao abrir WhatsApp, Instagram ou outro app de destino.
- Mantém o rastreamento de visita viral `bivvo_share / referral / viral_8192`.
- Corrige a versão exibida no app para 11.20.1 e atualiza o cache do Service Worker.

## 11.20.2 — Fix definitivo do evento viral
- Compartilhamento é persistido antes de abrir a folha nativa, evitando perda quando a PWA é suspensa.
- Cancelamentos conhecidos via `AbortError` são registrados e descontados no Growth Center.
- Mantidos UTM/referral `bivvo_share / referral / viral_8192`.

## 11.26.0 — Bloco C: Comportamento
- Detector de vazamentos por pequenos gastos com limiar conservador e linguagem não julgadora.
- Assinaturas explícitas + recorrências prováveis detectadas no histórico, sem conversão automática.
- Bola de neve dos parcelamentos com timeline de 6 meses.
- Simulador “E se eu parar de parcelar hoje?” somente leitura.
- Cache/PWA atualizado para 11.26.0.

## 11.28.0 — Bloco E: Motivação
- Vitórias Financeiras comprovadas por dados reais.
- Sequências positivas mensais sem punição.
- Bivvo Score 0–100 explicável em cinco fatores.
- Ações concretas para melhorar a organização financeira.
- Score explicitamente não relacionado a crédito/Serasa.
- 99 testes executados, 99 aprovados.

## 11.29.0 — Bloco F: Copiloto Final
- Orquestração diária com ação prioritária explicável.
- Ações rápidas integradas aos motores locais.
- Central E se? somente leitura.
- Bivvo IA roteia intenções conhecidas localmente antes de IA aberta.
- 106 testes executados, 106 aprovados.

## 11.42.3 — Pagamentos de empréstimos editáveis
- Histórico de pagamentos de empréstimos pode ser editado e excluído.
- Correção separada de juros/principal, data e forma de recebimento.
- Novo fluxo “Receber só juros”.
- Recálculo automático de principal/juros via livro-razão.
- Exclusão de contrato com histórico mediante confirmação forte.
- Versão/cache do PWA atualizados para 11.42.3.

## 11.42.7 — Leitura de comprovante 2.0
- A foto agora é preparada em até 2200 px e enviada em duas versões da mesma captura: colorida e contraste otimizado.
- Pré-análise local detecta sinais de baixa resolução, pouca luz, excesso de luz, pouco contraste e possível desfoque.
- Prompt de visão reforçado para comprovantes brasileiros, Pix, cupom fiscal, cartão, boleto pago e screenshots bancários.
- Quando a primeira leitura fica incerta, o servidor faz uma segunda conferência automática da MESMA foto sem consumir outra leitura da cota.
- Leituras divergentes retornam valores candidatos para o usuário escolher, em vez de obrigar nova foto.
- Se o comprovante for reconhecido mas o total não ficar legível, a confirmação abre para digitação manual sem fotografar novamente.
- Cache/PWA atualizado para 11.42.7.

## 11.52.0 — Landing interativa + Empresa BI
- Nova landing pública com prévias do app, tour, animações e demonstrações interativas.
- Perfil Empresa reconstruído como cockpit gerencial com múltiplos dashboards e filtros.
- Demo passa a incluir dados empresariais fictícios para exploração sem cadastro.

## 11.53.0 — Bivvo Capital: pagamento recebido no saldo
- Pagamentos registrados no Capital agora aumentam o saldo pelo valor integral recebido.
- A devolução do principal movimenta o caixa, mas não é classificada como renda/lucro.
- Juros continuam sendo contabilizados como renda.
- Edição e exclusão de pagamentos atualizam o saldo sem dupla contabilização.

## 11.57.0 — Gráficos interativos e drill-down
- Cockpit Empreendedor com todos os principais gráficos clicáveis e pop-ups detalhados.
- Casal ganha dashboard visual de 6 meses, categorias e participação de cada pessoa.
- Drill-down animado, acessível por teclado e responsivo.
- Animações respeitam `prefers-reduced-motion`.
- Sem migração nova no Supabase.

## 11.59.0 — Empreendedor didático: gestão + aprendizado
- Aba Empresa reorganizada para ensinar gestão a quem está começando a empreender.
- Fluxo principal: faturamento → custos variáveis → margem de contribuição → estrutura → EBITDA aproximado → lucro gerencial → caixa.
- Todos os principais conceitos empresariais ganham aulas em pop-up com significado, importância, fórmula, exemplo usando dados reais, interpretação, jeito certo, erros comuns e ação prática.
- Indicadores recebem prioridade Essencial / Importante / Avançado e frequência recomendada de acompanhamento.
- Nova área `Gestão > Comece aqui` com trilha de fundamentos, rotina diária/semanal/mensal e ordem de aprendizado.
- Empresa vazia ganha onboarding da primeira semana, sem dashboard confuso.
- Produtos/serviços, precificação, margem, ponto de equilíbrio, estoque, clientes a receber, orçamento, metas, pró-labore, impostos e DRE integram a camada de aprendizado.
- CSS didático separado para preservar fluidez e orçamento de desempenho.
- 51 suítes aprovadas, 0 falhas; SEO 55 URLs, 0 erros.

## 11.61 — Capital permanente
- Liberação permanente e privada do Bivvo Capital para a conta autorizada pelo proprietário.
- Validação server-side por sessão Supabase + hash SHA-256 do e-mail.
- Concessão independente de assinatura, cobrança e modo de homologação.

## 11.66 — Orçamento guiado
- Integra orçamento à renda planejada e à meta de guardar.
- Bloqueia meta + categorias acima da receita.
- Adiciona guia educativo em 4 passos e ajuda por categoria.
- Separa valor planejado para guardar do valor efetivamente guardado.

## 11.72.2 — Console limpo
- Corrige instalação do service worker, ruído CSP/DoubleClick e mantém o hotfix do Bivvo Capital.

## 11.80 — Jornada do usuário e conversão por origem
- Jornada individual por usuário na Administração.
- Etapas: cadastro, ativação, primeiro lançamento, primeiro cartão, teste, checkout e pagamento.
- Conversão por origem com usuários, ativados, pagantes e taxa paga.
- Filtros por plano, etapa e situação de engajamento.
- Sinal de risco de abandono baseado em ativação e recência de uso.
