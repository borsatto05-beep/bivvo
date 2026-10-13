# Bivvo 11.22 — Copiloto Financeiro

Implementado sobre a 11.21, sem alterar a estrutura persistida de dados.

- Novo módulo local `js/copilot.js`: transforma saldo livre, compromissos, previsão e motor de decisão em orientação prática.
- Nova interface `js/views/copilot.js`: "O que você precisa saber hoje", dinheiro realmente livre, limite diário, próximo risco, ação recomendada e plano de recuperação.
- Modo SOS Financeiro com acesso direto ao comparador "O que pago primeiro?".
- Home ganhou card do Bivvo Copiloto e atalho SOS.
- Bivvo IA ganhou perguntas rápidas "SOS financeiro" e "O que preciso saber hoje?"; essas rotas são locais e não gastam cota de IA.
- Nenhuma conta é marcada como paga e nenhuma movimentação é feita automaticamente.
- Cache/PWA atualizado para 11.22.0.
