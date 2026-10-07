# BIVVO 11.43.0 — correções e implantação

Validação local: 27 suítes JavaScript, 55 URLs de SEO, 95 arquivos de sintaxe e testes no navegador passaram. Consulte `VALIDACAO-11.43.md`.

Esta versão corrige os pontos identificados na análise do ZIP 11.42.10. O pacote contém o código completo, os testes, o novo SQL e `dist/` já gerado. Nenhuma alteração foi aplicada ao Supabase ou ao site de produção durante esta revisão.

## Antes de publicar

1. No Supabase do Bivvo, execute **supabase-hardening-11-43.sql**, após os scripts SQL já utilizados pelo projeto. O script cria a verificação de MFA usada na exclusão de conta e a tabela/RPCs de deduplicação do webhook. Não apaga dados financeiros nem substitui as políticas de isolamento existentes. Requer as tabelas de monetização da instalação atual.
2. No Netlify, configure **MERCADOPAGO_WEBHOOK_SECRET** com a assinatura secreta fornecida pelo Mercado Pago. Preserve `MERCADOPAGO_ACCESS_TOKEN`, as chaves do Supabase e as demais variáveis já configuradas. Sem o novo segredo, o webhook retorna 503 e não processa notificações.
3. Confira o modelo de IA disponível na sua conta. `GEMINI_MODEL` agora tem padrão `gemini-2.5-flash`; um valor antigo configurado no painel continua prevalecendo. O fallback pode ser configurado com `GEMINI_SCAN_FALLBACK_MODEL`. Configure `GEMINI_ASSISTANT_MODEL` ou o modelo comum para o assistente.
4. Publique pela integração Git do Netlify ou pelo Netlify CLI com build. O `netlify.toml` executa `npm run build`, publica `dist/` e mantém as funções de `netlify/functions`. **Arrastar somente `dist/` para hospedagem estática não implanta as funções de pagamento, autenticação, IA e demais APIs.**
5. No painel de notificações do Mercado Pago, use `/api/billing/webhook` com notificações assinadas contendo `x-signature`, `x-request-id` e `data.id` na URL. A implementação aceita eventos de assinatura e cobrança recorrente. Formatos antigos de IPN sem assinatura são rejeitados. A assinatura é validada com janela de dez minutos; verifique o formato e a entrega em sandbox antes de liberar pagamentos.
6. Feche as abas e janelas antigas do PWA e abra novamente após o deploy. As próximas atualizações ativam quando os clientes da versão anterior fecham, sem trocar módulos durante uma sessão. Não habilite minificação/injeção de conteúdo no painel da hospedagem após o build: o PWA verifica os hashes dos arquivos e rejeita versões transformadas ou incompletas.

## O que mudou

- **Exclusão de conta:** verifica a autenticação por senha nos cinco minutos anteriores usando `amr` do token validado pelo Supabase; consulta MFA no servidor e exige AAL2 quando há fator verificado. Falha de verificação bloqueia a exclusão.
- **Sincronização:** mescla estado remoto, local e base lida; persiste marcadores de exclusão e preserva edições remotas que não foram modificadas localmente. A primeira gravação não sobrescreve outra conta/aparelho que chegou antes. Desfazer uma exclusão usa novos IDs e remapeia o grupo de parcelas. Sair da conta aguarda as alterações pendentes e informa falhas.
- **Limite da mesclagem:** quando dois aparelhos editam exatamente o mesmo campo, prevalece a edição local; exclusão tem precedência sobre edição. Clientes antigos devem ser atualizados para respeitar os marcadores. Os marcadores não são descartados automaticamente, para impedir que um aparelho antigo recupere registros apagados.
- **Cobranças:** indisponibilidade da consulta não expira acesso pago. Renovação pendente/rejeitada não corta o período existente. A concessão usa upsert e não renova indefinidamente um pagamento antigo quando a próxima data está ausente. Reembolsos e estornos continuam revogando o acesso.
- **Webhook:** valida HMAC, rejeita divergência entre ID assinado e conteúdo, deduplica entregas por notificação e usa lease no banco para concorrência. Retorna 503 em falhas transitórias, permitindo nova tentativa. Escritas de planos e histórico são idempotentes. Métricas auxiliares continuam sendo registradas sem bloquear o fluxo.
- **Scanner:** preserva confiança zero, valida datas, estrutura JSON e assinaturas básicas das imagens; deixa valor vazio em conflitos não resolvidos e respeita abstinência do juiz. QR enviado pelo navegador é sugestão, sem substituir total visual ou comprovar pagamento. Consenso não acrescenta porcentagens artificiais. O modelo é limitado por um esquema de resposta.
- **Revisão do scanner:** foto temporária para conferir, campos incertos destacados, até 48 parcelas e fechamento por teclado. A foto é descartada ao fechar a revisão. Corrigir perspectiva cede tempo à interface e arquivos acima de 15 MB são recusados antes de decodificar.
- **Privacidade:** confirmação antes de enviar cada comprovante ao Gemini; controles de consentimento/revogação do TikTok em todas as páginas. O SDK de publicidade não carrega antes da autorização. O evento de servidor exige sessão correspondente ao cadastro, consentimento e rate limit. A URL enviada não inclui query nem fragmento. Página `/privacidade/` e menu Você para revisar permissões, sem botão flutuante; opção de limpar a permissão do assistente.
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

O modo **dual** continua sendo o padrão. Para comparar custo, há modo opcional `GEMINI_SCAN_READER_MODE=adaptive`: usa uma leitura somente quando há evidência de total, consistência alta, ausência de problemas de qualidade e ausência de conflito com o QR; nos demais casos faz conferências adicionais. Isso é uma heurística, não uma garantia de precisão. O fallback é o mesmo modelo por padrão; duas chamadas não constituem fontes estatisticamente independentes.

O servidor registra somente métricas operacionais do scanner: tempo, quantidade de leitores, revisão exigida, modelo e tokens das respostas bem-sucedidas. Não registra fotos ou texto extraído. Tokens de chamadas que falharam podem não estar disponíveis; a fatura do provedor é a referência para custo total.

Para medir precisão, monte um conjunto de fotos anonimizadas e rotuladas que inclua comprovantes borrados, reflexos, sombras, cartão parcelado, subtotal/troco e Pix. Colete as saídas de cada configuração e use:

```sh
npm run evaluate:scan -- labels.json predictions.json
```

Há exemplos **sintéticos** em `tests/fixtures/scan-labels-example.json` e `scan-predictions-example.json`. Eles demonstram o avaliador; não representam testes em fotos reais. O avaliador mede acerto de valor, revisões, tempos p50/p95 e custo quando há tokens e preços configurados em `SCAN_INPUT_USD_PER_MILLION`/`SCAN_OUTPUT_USD_PER_MILLION`. Ele não envia imagens nem faz chamadas pagas.

## Validações ainda necessárias em produção/sandbox

- Aplicar e validar as RPCs no Supabase, inclusive isolamento entre usuários e concorrência real do webhook.
- Confirmar os headers assinados dos eventos reais do Mercado Pago e o ciclo de cobrança, cancelamento e reembolso.
- Confirmar disponibilidade/modelo/esquema Gemini e avaliar as fotos reais antes de optar pelo modo adaptive.
- Conferir o PWA instalado e a câmera em Android e iOS; a leitura nativa de QR depende de `BarcodeDetector` e pode não existir em todos os navegadores.
- Completar a política com identificação e contato do controlador, prazos de retenção efetivos e condições dos provedores contratados. Esses dados comerciais não constavam no pacote e não foram inventados.
