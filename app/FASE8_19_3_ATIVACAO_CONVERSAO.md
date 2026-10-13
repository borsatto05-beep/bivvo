# BIVVO 8.19.3 — Ativação & Conversão

Base: `BIVVO_8_19_2_MOTOR_VIRAL_CONVERSAO.zip`.

## Objetivo
Fazer o novo usuário chegar ao primeiro valor útil do Bivvo — **quanto pode gastar por dia** — antes de recursos avançados, paywalls ou configuração extensa.

## Implementado

### 1. Onboarding rápido em 3 etapas
O fluxo inicial foi reduzido para:
1. renda mensal + dia em que costuma receber;
2. saldo real de hoje;
3. principais contas que ainda vêm pela frente.

O usuário pode informar valor e dia de vencimento das contas selecionadas. Cartões, metas, orçamento e investimentos ficam para depois.

### 2. Primeiro valor imediatamente
Ao concluir as três etapas, o Bivvo calcula imediatamente o resultado real:
- `R$ X por dia` quando positivo;
- limite zerado quando exatamente comprometido;
- déficit quando os compromissos ultrapassam o saldo.

A tela reforça: **“Agora você sabe quanto realmente pode gastar.”**

### 3. Próximas ações após perceber valor
Depois do primeiro resultado:
- `Adicionar minhas contas` → abre Planos > Contas fixas;
- `Compartilhar meu número` → disponível quando o resultado é positivo;
- `Ver meu painel` → volta para a Home.

Nenhum paywall foi inserido no onboarding.

### 4. Abandono sem marcar onboarding como concluído
Fechar o onboarding antes do resultado não marca mais o usuário como configurado. O Bivvo registra o abandono e deixa a Home oferecer a retomada sem forçar o modal novamente na mesma configuração.

### 5. Usuários antigos preservados
Contas antigas já configuradas recebem automaticamente `activationValueSeen` durante a migração. Isso evita mostrar o novo onboarding para quem já usava o Bivvo.

### 6. Growth Center — Ativação & Primeiro Valor
Novo bloco em **Aquisição & Funil** com coorte real de novos cadastros:
- criou conta;
- informou renda;
- informou saldo;
- adicionou contas (etapa opcional);
- viu `R$/dia`;
- retorno D1;
- pagantes da coorte.

O funil usa a mesma coorte de cadastros para evitar taxas impossíveis acima de 100% causadas por misturar usuários antigos com cadastros novos.

### 7. Gargalo automático do onboarding
O Growth Center identifica automaticamente o maior abandono entre as etapas obrigatórias de ativação e cria um alerta quando houver volume suficiente. Também alerta quando o retorno D1 ficar baixo.

### 8. Eventos técnicos novos
Sem enviar valores financeiros:
- `income_added`
- `balance_added`
- `bills_reviewed`
- `bills_added`
- `first_value_shown`
- `activation_cta_accounts`
- `activation_cta_share`
- `activation_cta_dashboard`

Renda, saldo, valores de contas e valor diário não são enviados ao Growth Center.

### 9. Posicionamento da landing
A abertura da landing agora reforça:
**“Seu banco mostra quanto você tem. O Bivvo mostra quanto você pode gastar.”**

## Preservado
- campos obrigatórios de nome e telefone no cadastro;
- armazenamento/sincronização financeira existente;
- Motor Viral 8.19.2;
- UTM e atribuição;
- programa de indicação;
- monetização e planos existentes.

## Versão técnica
- App: `11.19.0`
- Service Worker/cache: `bivvo-v11-19-0-fase8-19-3`
