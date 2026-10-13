# Deploy Bivvo 11.50

1. Publique esta pasta/ZIP no Netlify normalmente.
2. Não há SQL novo para executar no Supabase.
3. O modo privado de homologação usa a mesma `SUPABASE_SECRET_KEY`/`SUPABASE_SERVICE_ROLE_KEY` já utilizada pelas funções de cobrança e administração.
4. Na conta autorizada, abra **Você** e use o cartão **Modo de homologação → Trocar plano sem cobrança**.
5. É possível simular Grátis, Plus, Capital, Pro, Casal, Empreendedor e Família. Escolha **Usar plano real da conta** para encerrar a simulação.
6. O Bivvo Grátis agora permite criar no máximo **1 cartão de crédito**. Cartões que já existiam antes de um downgrade não são apagados.

Segurança: a autorização do tester é validada no servidor com o JWT do Supabase e um hash SHA-256 do e-mail; o e-mail autorizado não fica em texto puro no código distribuído.
