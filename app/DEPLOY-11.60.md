# Deploy Bivvo 11.60

1. Não há SQL novo para executar.
2. Faça o deploy da pasta `dist/` ou publique o pacote normalmente no Netlify conforme o fluxo atual do projeto.
3. Após o deploy, abra o perfil Empresa e valide:
   - cards com semáforo e botão de entendimento;
   - Bivvo Mentor;
   - professor contextual em Caixa, Agenda, Cartões e Gestão;
   - Gestão > Simuladores;
   - Gestão > Produtos e serviços > Novo produto/serviço (wizard de 4 passos).
4. Se o PWA mantiver assets antigos, feche todas as abas do Bivvo e reabra para o novo service worker assumir a versão 11.60.
