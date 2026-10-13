# Bivvo 11.31 — Inteligência em segundo plano

## Implementado
- Web Push contextual usando o resumo financeiro já protegido por RLS.
- Prioridade de mensagens: crise/sobrevivência > conta/fatura > cartão > previsão > limite diário/hábito.
- Deep links: cada aviso abre a área relacionada.
- Badge no ícone via Badging API quando suportado; limpa ao tocar no aviso.
- Modo discreto continua padrão quando “Mostrar valores” está desligado.
- Digest ganhou estágio de recuperação, dinheiro livre, protegido, dias e prioridade do RecoveryEngine.
- Mensagens usam datas naturais em pt-BR.
- Teste de push atualizado.

## iPhone
Web Push para PWA instalado na Tela de Início é suportado no iOS/iPadOS 16.4+. Dynamic Island / Live Activities não foram implementados: não fazem parte do Web Push padrão de Home Screen PWAs usado pelo projeto.
