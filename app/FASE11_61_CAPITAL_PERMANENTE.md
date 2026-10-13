# Bivvo 11.61 — Capital permanente

- Concessão privada e permanente do **Bivvo Capital** para a conta autorizada.
- O e-mail é validado no servidor através do JWT do Supabase e comparado por SHA-256; não fica em texto puro no bundle.
- Ao autenticar, o app confirma/idempotentemente cria `owner_permanent_capital` em `entitlements` com validade até 2099.
- A concessão é independente de Mercado Pago, trial e modo de homologação.
- Compatibilidade: se um banco antigo ainda rejeitar `capital`, a linha pode ser armazenada como `family`, mas a source `owner_permanent_capital` é interpretada estritamente como **Capital**, sem liberar Casal/Empresa/Família.
