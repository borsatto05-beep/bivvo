# BIVVO 11.30.2 — Sincronização na abertura

- Sincronização explícita ao abrir/retomar o PWA (`pageshow` e retorno para `visible`).
- Nova tentativa automática quando a conexão volta (`online`).
- Ordem segura: envia alterações locais pendentes antes de consultar/adotar mudanças remotas.
- Mantém o carregamento remoto já existente no login/boot.
- Mantém `pagehide`/background flush para reduzir a janela de alterações ainda não enviadas.
- Em falha de envio/offline, o app preserva o estado local em vez de puxar uma versão remota potencialmente antiga.

Observação: nenhuma aplicação web pode garantir literalmente perda zero se o aparelho ficar offline e for apagado/reinstalado antes de qualquer sincronização chegar ao servidor. Esta versão reduz essa janela e sincroniza em todos os pontos de ciclo de vida disponíveis no navegador/PWA.
