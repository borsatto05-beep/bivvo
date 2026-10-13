# Bivvo 11.51 — tolerância de cartões ao voltar para o Grátis

- O plano Grátis continua permitindo somente 1 cartão.
- Ao perder o acesso pago com mais de 1 cartão, começa uma tolerância de 15 dias.
- A aba Cartões mostra aviso e contador discreto com dias/horas restantes.
- O usuário pode escolher qual cartão será preservado no Grátis.
- Se não renovar até o fim do prazo, apenas os cartões excedentes são removidos automaticamente; 1 cartão sempre permanece.
- Compras antigas continuam no extrato mesmo quando o cadastro do cartão excedente é removido.
- A exclusão é sincronizada via `deletedRecords`, evitando que o cartão reapareça em outro dispositivo.
- Para usuários já afetados antes da criação desta política, o prazo não retroage para provocar exclusão imediata.
- O modo interno de homologação pode simular o Grátis e visualizar o contador sem apagar cartões da conta de teste.
- Nenhuma migração SQL nova é necessária.
