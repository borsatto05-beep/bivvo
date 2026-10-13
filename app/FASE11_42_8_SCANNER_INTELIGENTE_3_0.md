# Bivvo 11.42.8 — Scanner Inteligente 3.0

## Objetivo
Reduzir ao máximo a necessidade de repetir fotos de comprovantes e transformar a captura em um scanner guiado, com correção local, leitura redundante da mesma foto e confirmação somente dos campos incertos.

## O que foi implementado

### 1. Câmera guiada em tempo real
- Nova captura via `getUserMedia` quando suportado.
- Orientação para câmera traseira.
- Tentativa de foco contínuo quando o aparelho permite.
- Indicadores locais de movimento, iluminação, reflexo, contraste e nitidez.
- Mensagens em tempo real: segurar firme, aproximar, procurar luz, evitar reflexo e aguardar foco.
- Auto-disparo após uma sequência de quadros considerados bons.
- Botão manual de captura continua disponível.
- Botão de galeria como fallback.
- Controle de luz/torch aparece quando o navegador/aparelho expõe essa capacidade.
- `ImageCapture.takePhoto()` é priorizado para preservar mais resolução; frame do vídeo é fallback.

### 2. Corte e correção de perspectiva
- O cliente procura localmente a maior região clara/neutra compatível com papel.
- Quando o contorno tem confiança geométrica suficiente, o scanner identifica quatro extremos e aplica transformação de perspectiva.
- Quando a detecção não é confiável, a foto original é preservada para evitar cortes destrutivos.
- Nenhuma imagem é persistida.

### 3. Tratamento de sombra e papel térmico
- Compensação local de iluminação usando um mapa desfocado de fundo.
- Auto-level e aumento suave de contraste.
- Preserva a versão colorida junto da versão tratada.

### 4. Três visões da mesma foto
O backend pode receber, dentro da mesma leitura de cota:
1. foto colorida/corrigida;
2. versão com sombras reduzidas e alto contraste;
3. detalhe da parte inferior, útil para encontrar TOTAL em cupons.

O payload é reduzido automaticamente quando necessário e nunca passa do limite definido pelo cliente.

### 5. QR Code / NFC-e
- O cliente tenta usar `BarcodeDetector` nativo quando disponível.
- O conteúdo bruto do QR não é persistido nem enviado para analytics.
- O backend recebe apenas uma pista categórica (`nfce_url`, `pix_qr` ou `qr_detected`).
- A leitura normal continua funcionando em navegadores sem `BarcodeDetector`.

### 6. Confiança por campo
O modelo agora devolve confiança separada para:
- valor;
- estabelecimento/recebedor;
- data;
- forma de pagamento;
- categoria.

A tela mostra quais campos realmente precisam ser conferidos, em vez de tratar o comprovante inteiro como duvidoso.

### 7. Tipo de documento
A leitura classifica, quando possível:
- NFC-e;
- cupom fiscal;
- Pix;
- cartão;
- banco;
- boleto;
- compra online;
- recibo;
- outro.

### 8. Segunda conferência automática
- Continua sendo uma única leitura de cota para a ação do usuário.
- Uma segunda análise da mesma foto é feita somente quando valor/confiança/campos críticos ficam incertos.
- Leituras concordantes aumentam a confiança.
- Leituras divergentes geram opções de valor para o usuário escolher.

### 9. Possível duplicidade
A confirmação compara valor, data e descrição/estabelecimento com lançamentos existentes.
Quando há forte indício de duplicidade, mostra aviso antes do salvamento.

### 10. Aprendizado de categoria
O fluxo continua usando `store.learnCategory`, então a categoria confirmada pelo usuário para uma descrição/estabelecimento passa a ajudar lançamentos futuros.

### 11. Analytics sem dados financeiros
Foram adicionados eventos já suportados pela infraestrutura:
- `receipt_scanner_opened`;
- `receipt_scanner_completed`;
- `receipt_scanner_failed`.

Nenhum salário, saldo, valor da compra, dívida, nome ou outro dado financeiro é enviado nesses eventos.

## Privacidade
- Imagem não é gravada em banco pelo fluxo do Bivvo.
- QR bruto não é persistido.
- A leitura usa a imagem somente para processamento.
- Resultado continua passando por confirmação humana antes de criar lançamento.

## Arquivos principais alterados
- `js/scan.js`
- `js/quickcapture.js`
- `js/views/scanconfirm.js`
- `netlify/functions/scan-receipt.js`
- `app.css`
- `index.html`
- `js/main.js`
- `js/util.js`
- `sw.js`
- testes de versão e scanner

## Testes executados

### Sintaxe
- 108 arquivos JS/MJS submetidos a `node --check`: sem falhas.

### Testes automatizados
- 15 arquivos `.mjs`: todos executados sem falha.
- 2 arquivos `.js`: todos executados sem falha.
- auditoria Python de SEO executada sem falha.
- testes específicos Scanner 11.42.8: 23/23.
- testes anteriores Scanner 11.42.7: 15/15.
- regressão financeira: 42/42.
- empréstimos: 9/9.
- SEO Intelligence: 14/14.
- distribuição: 8/8.
- demais suítes do projeto também executadas sem falhas.

### SEO estático
- sitemap: 55 URLs.
- titles únicos: 55.
- canonicals únicos: 55.
- descriptions únicas: 55.
- erros detectados: 0.

### Smoke HTTP local
Retorno HTTP 200 para:
- `/`
- `/index.html`
- `/app.css?v=11.42.8`
- `/js/main.js?v=11.42.8`
- `/js/scan.js?v=11.42.8`
- `/js/views/scanconfirm.js?v=11.42.8`
- `/sw.js`

### Segurança defensiva estática
Nos arquivos alterados:
- nenhum `eval`;
- nenhum `new Function`;
- nenhum `document.write`;
- nenhum `innerHTML` dinâmico no scanner;
- nenhum segredo/chave privada hardcoded encontrado pelos padrões verificados;
- analytics do scanner não envia valores financeiros;
- `Permissions-Policy` existente permite câmera apenas para `self`.

### Performance estática
- Scanner implementado sem biblioteca pesada de visão computacional.
- Usa Canvas/Web APIs nativas.
- `js/scan.js`: aproximadamente 24 KB não minificado.
- Correção de perspectiva só é executada quando a detecção do papel tem confiança suficiente.
- Terceira imagem é descartada/reduzida automaticamente quando o payload fica grande.

## NÃO TESTADO
- câmera física de iPhone;
- câmera física de Android;
- auto-disparo em diferentes aparelhos/lentes;
- torch em aparelhos reais;
- `ImageCapture.takePhoto()` em todos os browsers móveis;
- `BarcodeDetector` em todos os browsers;
- precisão real do auto-crop em fotos de comprovantes amassados, papel branco sobre fundo branco e ambientes muito escuros;
- taxa real de acerto Gemini após deploy no Netlify;
- comparação real de 10/50/100 comprovantes entre 11.42.7 e 11.42.8;
- Core Web Vitals de produção.

## Meta recomendada de validação
Após o deploy, usar pelo menos 20 comprovantes reais diferentes e registrar:
- quantos acertaram na primeira foto;
- quantos exigiram só correção de um campo;
- quantos exigiram nova foto;
- tempo médio até a tela de confirmação;
- principais tipos de falha.

A meta de produto recomendada é reduzir progressivamente o percentual de usuários que precisam repetir a foto, sem prometer 100% de reconhecimento.
