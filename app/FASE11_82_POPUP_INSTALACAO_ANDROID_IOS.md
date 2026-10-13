# Bivvo 11.82 — Popup de instalação por plataforma

- O popup automático de instalação agora aparece somente em Android e iPhone/iPad.
- Desktop não recebe popup de instalação.
- Android: oferece download do APK e acesso ao guia de instalação.
- iPhone/iPad: não oferece APK; informa que a versão da App Store está em desenvolvimento e ensina a instalação pelo Safari via Compartilhar > Adicionar à Tela de Início.
- Mantido fechamento por sessão para não insistir após o usuário dispensar o aviso.
- Arquivos alterados: `index.html`, `install-android.js`, `install-android.css` e equivalentes em `dist/`.
