# Bivvo 11.42.10 — Scanner One Shot 4.0

## Objetivo
Maximizar a taxa de reconhecimento com **uma única foto**, priorizando inteligência e confiabilidade em vez de reduzir agressivamente o tempo de análise. Esta versão parte da 11.42.8, que o usuário preferiu por ser mais inteligente.

## O que mudou
- A mesma foto gera internamente até cinco evidências visuais: colorida/corrigida, alto contraste, cabeçalho, região central e região inferior/total.
- Dois leitores independentes analisam a mesma captura **em paralelo**.
- Quando as leituras divergem, um terceiro passe atua como **juiz** e reconstrói a hierarquia dos valores antes de decidir.
- O modelo precisa listar `amount_candidates` e classificar cada valor como `total_paid`, `subtotal`, `item`, `installment`, `change`, `discount`, `balance`, `fee` ou `unknown`.
- O servidor faz consenso de leituras, preserva opções conflitantes e pede revisão apenas quando necessário.
- O scanner tenta decodificar QR Pix no aparelho. Quando o payload contém valor, recebedor e cidade, esses dados viram evidência estruturada adicional. O QR bruto não é persistido.
- NFC-e por QR continua sendo identificada.
- A tela de confirmação mostra `1 foto`, consenso de duas leituras, uso de juiz e confirmação por QR quando aplicável.
- Em leitura incompleta, o usuário corrige o campo; a mensagem não exige nova fotografia.

## Privacidade
- A foto continua não sendo persistida pelo Bivvo.
- O servidor recebe apenas as versões derivadas da mesma foto durante a leitura.
- Para QR, são enviados apenas sinais derivados necessários (tipo, valor quando houver, nome/cidade do recebedor e host fiscal), não o payload bruto completo.

## Performance
Esta versão prioriza a chance de acertar com uma foto. Duas análises rodam em paralelo para evitar o custo de uma espera totalmente serial. O terceiro juiz só é usado quando há conflito ou confiança insuficiente. Em casos difíceis, ela pode consumir mais processamento/API que a 11.42.8 e mais tempo que a 11.42.9.

## Testes executados
- `node --check`: **109 arquivos JS/MJS**, sem falha de sintaxe.
- **18 arquivos de testes/regressão** executados sem falhas.
- Scanner 11.42.10: **17/17**.
- Scanner 11.42.8: **23/23**.
- Scanner 11.42.7: **15/15**.
- Regressão financeira: **42/42**.
- Empréstimos: **9/9**.
- SEO Intelligence: **14/14**.
- Distribuição/crescimento: testes existentes sem falha.
- SEO estático: **55 URLs**, `ERRORS 0`, titles/canonicals/descriptions únicos.
- Smoke HTTP local: `/`, `index.html`, `js/scan.js`, `js/views/scanconfirm.js`, `netlify/functions/scan-receipt.js`, `sw.js` e `app.css` responderam HTTP 200.
- Varredura defensiva nos arquivos alterados: nenhum padrão comum de chave privada/API hardcoded encontrado; nenhum `eval`/`new Function`/atribuição nova de `innerHTML`.

## NÃO TESTADO
- Precisão real com comprovantes fotografados em iPhone/Android físico.
- Taxa real de acerto em primeira foto após deploy Netlify + Gemini.
- Papel térmico extremamente apagado, rasgado ou com reflexo severo em variedade ampla de aparelhos.
- `BarcodeDetector`/QR em todos os navegadores.
- Custo real de API da estratégia com dois leitores + juiz condicional.
- Latência real em produção.

## Critério de sucesso recomendado
Após publicar, testar pelo menos 20 comprovantes diferentes e registrar:
1. acertou valor/estabelecimento/data na primeira foto;
2. acertou valor mas pediu confirmação de outro campo;
3. apresentou dois valores e o correto estava entre eles;
4. precisou de correção manual;
5. falhou totalmente.

A meta é reduzir ao mínimo o item 5 e evitar exigir uma segunda fotografia.
