# BIVVO 11.43.0 — correções e implantação

Validação local: 29 suítes JavaScript, 55 URLs de SEO, 95 arquivos de sintaxe e testes no navegador passaram. Consulte `VALIDACAO-11.43.md`.

Esta versão corrige os pontos identificados na análise do ZIP 11.42.10. O pacote contém o código completo, os testes, o novo SQL e `dist/` já gerado. Nenhuma alteração foi aplicada ao Supabase ou ao site de produção durante esta revisão.

## Antes de publicar

1. No Supabase do Bivvo, execute **supabase-hardening-11-43.sql**, após os scripts SQL já utilizados pelo projeto. O script cria a verificação de MFA usada na exclusão de conta e a tabela/RPCs de deduplicação do webhook. Não apaga dados financeiros nem substitui as políticas de isolamento existentes. Requer as tabelas de monetização da instalação atual.
2. No Netlify, configure **MERCADOPAGO_WEBHOOK_SECRET** com a assinatura secreta fornecida pelo Mercado Pago. Preserve `MERCADOPAGO_ACCESS_TOKEN`, as chaves do Supabase e as demais variáveis já configuradas. Sem o novo segredo, o webhook retorna 503 e não processa notificações.
3. Confira o modelo de IA disponível na sua conta. `GEMINI_MODEL` agora tem padrão `gemini-2.5-flash`; modelos antigos que retornem 400/404 usam automaticamente esse padrão. Configure `GEMINI_ASSISTANT_MODEL` ou o modelo comum para o assistente.
4. Publique pela integração Git do Netlify ou pelo Netlify CLI com build. O `netlify.toml` executa `npm run build`, publica `dist/` e mantém as funções de `netlify/functions`. **Arrastar somente `dist/` para hospedagem estática não implanta as funções de pagamento, autenticação, IA e demais APIs.**
5. No painel de notificações do Mercado Pago, use `/api/billing/webhook` com notificações assinadas contendo `x-signature`, `x-request-id` e `data.id` na URL. A implementação aceita eventos de assinatura e cobrança recorrente. Formatos antigos de IPN sem assinatura são rejeitados. A assinatura é validada com janela de dez minutos; verifique o formato e a entrega em sandbox antes de liberar pagamentos.
6. Feche as abas e janelas antigas do PWA e abra novamente após o deploy. As próximas atualizações ativam quando os clientes da versão anterior fecham, sem trocar módulos durante uma sessão. Não habilite minificação/injeção de conteúdo no painel da hospedagem após o build: o PWA verifica os hashes dos arquivos e rejeita versões transformadas ou incompletas.

## O que mudou

- **Exclusão de conta:** verifica a autenticação por senha nos cinco minutos anteriores usando `amr` do token validado pelo Supabase; consulta MFA no servidor e exige AAL2 quando há fator verificado. Falha de verificação bloqueia a exclusão.
- **Sincronização:** mescla estado remoto, local e base lida; persiste marcadores de exclusão e preserva edições remotas que não foram modificadas localmente. A primeira gravação não sobrescreve outra conta/aparelho que chegou antes. Desfazer uma exclusão usa novos IDs e remapeia o grupo de parcelas. Sair da conta aguarda as alterações pendentes e informa falhas.
- **Limite da mesclagem:** quando dois aparelhos editam exatamente o mesmo campo, prevalece a edição local; exclusão tem precedência sobre edição. Clientes antigos devem ser atualizados para respeitar os marcadores. Os marcadores não são descartados automaticamente, para impedir que um aparelho antigo recupere registros apagados.
- **Cobranças:** indisponibilidade da consulta não expira acesso pago. Renovação pendente/rejeitada não corta o período existente. A concessão usa upsert e não renova indefinidamente um pagamento antigo quando a próxima data está ausente. Reembolsos e estornos continuam revogando o acesso.
- **Webhook:** valida HMAC, rejeita divergência entre ID assinado e conteúdo, deduplica entregas por notificação e usa lease no banco para concorrência. Retorna 503 em falhas transitórias, permitindo nova tentativa. Escritas de planos e histórico são idempotentes. Métricas auxiliares continuam sendo registradas sem bloquear o fluxo.
- **Scanner:** extrai somente nome do local, data e valor total. Uma chamada curta, com raciocínio interno desativado no Gemini 2.5, reduz o risco de timeout/resposta truncada. A foto original acompanha os detalhes corrigidos para evitar perda de dados por recorte.
- **Revisão do scanner:** abre o formulário normal **Novo gasto**, com dados encontrados preenchidos e campos ausentes em branco. Não mostra a tela separada de confirmação nem a foto. Data ausente deve ser preenchida, sem assumir hoje.
- **Privacidade:** scanner abre diretamente, sem aviso prévio; controles de consentimento/revogação do TikTok em todas as páginas. O SDK de publicidade não carrega antes da autorização. O evento de servidor exige sessão correspondente ao cadastro, consentimento e rate limit. A URL enviada não inclui query nem fragmento. Página `/privacidade/` e menu Você para revisar permissões, sem botão flutuante; opção de limpar a permissão do assistente.
- **Dependências:** SDK Supabase 2.49.8 passa a ser servido localmente. A licença e o hash estão em `THIRD_PARTY_NOTICES.md`. Ferramentas de teste têm versões fixadas e lockfile.
- **Publicação/PWA:** build com lista de extensões públicas; documentos internos, SQL, testes, scripts, `node_modules` e código das funções não entram em `dist/`. Precache completo, identificado pelo conteúdo e com SHA-256 por arquivo. Uma mudança durante a instalação remove o cache parcial e impede ativação. APIs continuam fora do cache.

## Instalação e testes

Requisitos: Node 22 ou superior e Python 3.11 ou superior.

```sh
npm ci
npm test
python -m venv .venv
.venv/bin/pip install -r requirements-test.txt
.venv/bin/python tests/static-seo-1142.py
npm run build
```

No Windows, os executáveis do ambiente Python ficam em `.venv/Scripts/`.

Para testar no navegador:

```sh
npx playwright install chromium
npm run serve
```

Em outro terminal:

```sh
npm run test:browser
```

O teste usa Chromium do sistema quando disponível; caso contrário, usa o instalado pelo Playwright. O servidor usa `127.0.0.1:8765` e reproduz a CSP principal. O teste de integridade altera temporariamente um arquivo de `dist/` e o restaura; não execute esse teste contra produção.

## Precisão e custo do scanner

A leitura usa uma extração de três campos. Não há segunda leitura nem juiz no fluxo ativo. A imagem é enviada ao Gemini e não é armazenada no servidor. Precisão real depende da foto e deve ser medida com comprovantes anotados.

O servidor registra somente tempo de leitura e quantidade de campos encontrados, sem fotos ou texto extraído.

Para medir precisão, monte um conjunto de fotos anonimizadas e rotuladas que inclua comprovantes borrados, reflexos, sombras, cartão parcelado, subtotal/troco e Pix. Colete as saídas de cada configuração e use:

```sh
npm run evaluate:scan -- labels.json predictions.json
```

Há exemplos **sintéticos** em `tests/fixtures/scan-labels-example.json` e `scan-predictions-example.json`. Eles demonstram o avaliador; não representam testes em fotos reais. O avaliador mede acerto de valor, revisões, tempos p50/p95 e custo quando há tokens e preços configurados em `SCAN_INPUT_USD_PER_MILLION`/`SCAN_OUTPUT_USD_PER_MILLION`. Ele não envia imagens nem faz chamadas pagas.

## Validações ainda necessárias em produção/sandbox

- Aplicar e validar as RPCs no Supabase, inclusive isolamento entre usuários e concorrência real do webhook.
- Confirmar os headers assinados dos eventos reais do Mercado Pago e o ciclo de cobrança, cancelamento e reembolso.
- Confirmar disponibilidade/modelo/esquema Gemini e avaliar as fotos reais antes de optar pelo modo adaptive.
- Conferir o PWA instalado e a câmera em Android e iOS; o QR usa `BarcodeDetector` quando disponível e jsQR 1.4.0 local como alternativa, inclusive no iPhone.
- Completar a política com identificação e contato do controlador, prazos de retenção efetivos e condições dos provedores contratados. Esses dados comerciais não constavam no pacote e não foram inventados.

## QR como prioridade

Consulta o QR fiscal internamente, sem abrir o navegador. Dados do portal oficial têm prioridade, seguidos dos campos diretamente codificados no QR; a foto completa somente os campos ausentes. URLs, redirecionamentos, tamanho e tempo de consulta são limitados. QR NFC-e v2 offline pode conter valor e dia; no QR online normalmente esses dados e o nome dependem da consulta fiscal. Falha da Fazenda preserva os dados disponíveis. QR funciona sem chave Gemini; completar a foto requer `GEMINI_API_KEY`. Consulta completa de QR não consome leitura de IA. Nenhum QR é tratado como prova de pagamento; os dados permanecem editáveis no formulário normal.

## Campos vazios: leitura alternativa

QR é decodificado antes de reduzir a foto, com ampliações de regiões quando necessário. Na câmera, o disparo automático espera identificar o QR; o botão manual continua disponível. Uma leitura de texto local Tesseract.js 6.0.1 trabalha em paralelo à API e preenche somente campos ausentes. No primeiro uso, baixa o motor e modelo de idioma por URLs fixas do jsDelivr; a foto não é enviada ao CDN. O modelo pode ficar no cache do navegador. A primeira leitura local precisa de conexão. Sem QR nem texto legível, o formulário fica aberto e mostra um aviso claro. Diagnósticos operacionais distinguem QR, consulta fiscal, API e OCR local, sem armazenar imagem ou texto extraído. Não há precisão comprovada de 90%/100%; condições reais continuam exigindo validação.
