# Bivvo 8.20.2 — Fix definitivo do evento viral

Problema confirmado: o destino `bivvo_share / referral / viral_8192` registrava visitas, mas a PWA podia ser suspensa pela folha nativa de compartilhamento antes de o JavaScript voltar do `navigator.share()`. Assim, os eventos de compartilhamento não chegavam ao `product_events`.

Correção:
- persiste `story_shared` e `spendable_card_shared` imediatamente **antes** de abrir a folha nativa;
- se o usuário cancelar e o navegador devolver `AbortError`, persiste eventos de cancelamento correspondentes;
- o Growth Center contabiliza compartilhamentos líquidos (iniciados menos cancelados), evitando contar cancelamentos conhecidos;
- preserva UTM/referral e o rastreamento de visitas já validado.

Validação: sintaxe JS OK; 42 testes financeiros, 7 de conversão e 14 de SEO passaram.
