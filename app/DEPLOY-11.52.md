# Deploy Bivvo 11.52

1. Não há migração SQL nova nesta versão.
2. Faça o deploy do conteúdo da pasta `dist/` no Netlify (ou use o fluxo de build já configurado).
3. Após publicar, abra a home em aba anônima e valide o tour, a seção Empresa e os CTAs de planos.
4. Em uma conta Empreendedor/Família, abra o perfil Empresa e teste os filtros 1m/3m/6m/12m.
5. Limpe/recarregue o PWA caso um dispositivo mantenha a versão anterior em cache; o service worker da 11.52 usa identidade de build derivada do conteúdo.
