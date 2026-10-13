# Bivvo 11.42.7 — Leitura de comprovante 2.0

## Objetivo
Reduzir a necessidade de fotografar o mesmo comprovante várias vezes para registrar uma compra.

## Causa técnica encontrada na versão anterior
A leitura anterior tinha quatro limitações principais:
1. a foto era reduzida para no máximo 1600 px com JPEG 0,82, o que podia perder texto pequeno de cupom térmico;
2. somente uma versão da imagem era enviada à IA;
3. havia apenas uma tentativa de interpretação;
4. em leituras incertas, o fluxo frequentemente terminava em erro e pedia outra foto.

## Alterações implementadas
### Preparação da imagem no aparelho
- resolução máxima colorida aumentada para 2200 px;
- versão colorida preservada;
- segunda versão em tons de cinza com auto-level/contraste para facilitar leitura de papel térmico;
- compressão adaptativa para respeitar o limite do payload;
- análise local de brilho, contraste, resolução e nitidez aproximada.

### Leitura no servidor
- Gemini recebe as duas versões da mesma foto no mesmo pedido;
- prompt específico para documentos brasileiros, incluindo Pix, screenshots bancários, cupons, cartão e boleto pago;
- instrução explícita para distinguir TOTAL de subtotal, troco, desconto, limite, saldo e preço de item;
- `temperature: 0` para reduzir variação;
- segunda conferência automática apenas quando a primeira leitura está incerta, divergente, sem total ou quando a qualidade da foto pode ter afetado a leitura;
- a segunda conferência usa a mesma ação/cota do usuário, não consome uma nova leitura;
- falha transitória da primeira chamada também recebe uma tentativa interna antes de devolver erro.

### Confirmação
- se duas leituras encontrarem valores diferentes, a tela mostra até três valores possíveis para o usuário escolher;
- se o documento for reconhecido mas o valor não estiver legível, a tela de confirmação abre mesmo assim e permite digitação manual;
- a interface mostra uma observação quando a foto parece escura, clara, distante, com pouco contraste ou possivelmente desfocada;
- a imagem continua sem ser gravada pelo Bivvo.

## Privacidade
O recurso envia a imagem à função de leitura e ao provedor de IA apenas para processar o comprovante. O código do Bivvo não grava a imagem em banco ou armazenamento persistente. A versão 11.42.7 envia duas representações da mesma foto para aumentar a legibilidade.

## Performance
- não foi adicionada biblioteca pesada;
- processamento de imagem usa Canvas nativo;
- arquivos diretamente alterados continuam pequenos em JS;
- uma segunda chamada à IA ocorre apenas quando há incerteza ou indício de qualidade ruim, para equilibrar confiabilidade, latência e custo.

## Testes executados
- `node --check`: 106 arquivos JS/MJS verificados sem erro de sintaxe.
- regressão geral: todos os arquivos de teste existentes executados após atualização das asserções de versão.
- testes específicos de Scan 11.42.7: 15/15.
- regressão financeira: 42/42.
- empréstimos: 9/9.
- SEO Intelligence: 14/14.
- distribuição: 8/8.
- SEO estático: 55 URLs, 0 erros; titles, descriptions e canonicals únicos.
- varredura defensiva dos arquivos alterados: nenhum segredo/chave privada e nenhum `innerHTML`, `eval` ou `new Function` novo encontrado.

## NÃO TESTADO
- taxa real de acerto do Gemini com comprovantes fotografados em produção;
- comparação A/B de acerto da 11.42.6 versus 11.42.7;
- câmera física de iPhone e Android;
- fotos HEIC/HEIF em todos os modelos de iPhone;
- reflexo forte, papel muito amassado ou impressão térmica extremamente apagada em aparelhos reais;
- latência e custo reais da segunda conferência automática no Netlify/Gemini;
- comportamento com indisponibilidade real do Gemini;
- Core Web Vitals em produção.

## Métrica recomendada depois do deploy
Acompanhar por 7 a 14 dias:
- leituras concluídas na primeira foto;
- leituras que usaram segunda conferência automática;
- falhas por tipo;
- quantas vezes o usuário abandona após abrir a câmera;
- quantas vezes precisa editar o valor manualmente.

A meta de produto deve ser aumentar a taxa de “1 foto → confirmação” e reduzir drasticamente a repetição de captura.
