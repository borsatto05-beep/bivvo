# BIVVO 8.19.2 — Motor Viral & Conversão

Base: `BIVVO_8_19_1_CORRECAO_UTM.zip`.

## Objetivo
Transformar momentos de valor do produto em aquisição orgânica, sem expor dados financeiros sensíveis e sem criar pop-ups genéricos.

## Implementado

### 1. “Meu número de hoje” compartilhável
- Novo modelo de Story: **Quanto posso gastar**.
- Usa o cálculo real de `finance.spendable()`.
- Por padrão, o card **não mostra valor em reais**.
- O usuário pode ativar “Mostrar valores em reais” se quiser exibir o valor diário.
- Saldo, dívidas, cartões e descrições de lançamentos continuam fora do card.
- Atalho direto na Home: **Compartilhar meu número**.
- Atalho em Você → Compartilhar: **Meu número de hoje**.

### 2. Compartilhamento levando para experiência antes do cadastro
- Stories e convite agora levam para `/quanto-posso-gastar-hoje/`.
- Link usa `utm_source=bivvo_share`, `utm_medium=referral`, `utm_campaign=viral_8192`.
- Quando existe código de indicação, ele segue no link como `ref`.
- A página pública guarda somente o código anônimo de indicação no navegador para manter a atribuição até o cadastro.

### 3. Conversão da calculadora pública
- Depois do cálculo “Quanto posso gastar hoje?”, aparece o CTA **Quero isso automático no Bivvo**.
- O CTA preserva UTM e indicação.
- Nenhum valor digitado ou resultado financeiro é enviado para analytics.

### 4. Programa de indicação preservado
- Mantido o mecanismo existente:
  - amigo indicado ganha 7 dias de Pro depois da ativação real;
  - a cada 3 amigos ativados, quem indicou ganha 30 dias de Pro;
  - limites e validações continuam no servidor.

### 5. Growth Center — Motor Viral
Novas métricas:
- Meu número aberto;
- Meu número compartilhado;
- cards compartilhados e taxa de compartilhamento;
- visitas geradas por compartilhamento;
- cadastros vindos da campanha viral;
- taxa visita → cadastro;
- pessoas únicas que compartilharam;
- indicações ativadas;
- coeficiente viral estimado (amigos ativados por pessoa que compartilhou).

Também foi adicionado um mini funil:
**Cards criados → Compartilhados → Visitas → Cadastros → Amigos ativados**.

### 6. Métricas de produto
Novos eventos privados e sem valores financeiros:
- `spendable_card_opened`
- `spendable_card_shared`
- `spendable_card_downloaded`

## Versão técnica
- App: `11.18.0`
- Service Worker/cache: `bivvo-v11-18-0-fase8-19-2`
- Assets públicos alterados receberam cache-bust `11.18.0`.
