# Bivvo 8.20.1 — Fix Compartilhamento

Problema observado: a visita `viral_8192` era registrada, mas o contador de compartilhamento nativo podia permanecer em zero.

Causa: os eventos de produto usam uma fila com atraso de 3 segundos. Ao abrir um app de compartilhamento, o navegador/PWA pode ser suspenso antes do envio da fila.

Correção: após `navigator.share()` concluir com sucesso, os eventos `story_shared` e `spendable_card_shared` são adicionados à fila e o `flush()` é executado imediatamente. Cancelamentos (`AbortError`) continuam sem contar como compartilhamento.

Versão: 11.20.1.
