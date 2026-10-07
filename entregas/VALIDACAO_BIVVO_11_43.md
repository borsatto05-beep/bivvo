# Validação — BIVVO 11.43.0

Concluída em 7 de outubro de 2026, localmente, sem alterar serviços de produção.

| Verificação | Resultado |
| --- | --- |
| Suítes JavaScript | 29 passaram, 0 falharam |
| SEO estático | 55 URLs verificadas, 0 erros |
| Sintaxe JavaScript | 95 arquivos verificados, 0 erros |
| Build Netlify | Concluído; arquivos internos excluídos de dist |
| Navegador Chromium | Consentimento/revogação, SDK local, demonstração no celular, offline, revisão do scanner, fechamento pelo teclado e página de privacidade passaram |
| Integridade do PWA | Módulo instalado mantido durante a sessão; alteração de arquivo durante instalação rejeitada, cache parcial removido |

Os novos testes reproduzem autenticação antiga com token renovado, ausência/falha de MFA, conflito de sincronização, corrida na primeira gravação, exclusões persistidas, desfazer com novos IDs, falha ao sair sem sincronizar, consulta de cobrança indisponível, pagamento antigo, assinatura HMAC, entrega repetida/concorrrente, nova tentativa, confiança zero, data inválida, juiz inconclusivo, QR não confiável, reembolso de cota e uso adaptativo de leitores.

Os endpoints de Supabase, Mercado Pago e Gemini nos testes usam respostas simuladas. O SQL novo foi revisado, mas não executado contra o banco do usuário. Não houve exclusão de conta real, cobrança, envio de foto ao Gemini ou validação de precisão com fotos reais. O teste do avaliador usa exemplos sintéticos e não deve ser divulgado como taxa de acerto do scanner.

Antes de publicar, aplique `supabase-hardening-11-43.sql`, configure `MERCADOPAGO_WEBHOOK_SECRET` e siga `README-11.43.md`. As integrações reais, câmera Android/iOS, condições do provedor de IA e identificação do controlador da política de privacidade ainda exigem validação/configuração do operador.

Atualização visual: botão flutuante Privacidade removido. Revisão de permissões permanece disponível no menu Você e na página de privacidade.

## Scanner simplificado — 07/10/2026

Removido aviso prévio de IA. API e confirmação usam somente local, data e valor. Testadas as sete combinações não vazias de extração parcial, datas inválidas, reembolso de cota em falha e fallback para modelo antigo. No navegador, testadas as oito combinações de campos: dados encontrados preservados e apenas campos faltantes visíveis para preencher. Provedor simulado; leitura real do comprovante do vídeo não foi validada contra Gemini.

## QR prioritário e formulário normal

Novo gasto substitui a tela de confirmação do scanner. Testadas oito combinações de campos preenchidos/ausentes, sem inventar data. QR v2 offline, QR online, HTML/XML fiscal, consulta com erro, redirecionamento para rede privada, prioridade do QR sobre resposta de IA e leitura sem chave Gemini foram testados com respostas simuladas. Consulta real à Fazenda e leitura real de fotos pelo Gemini não foram executadas neste ambiente.

Leitor alternativo jsQR validado em Chromium com `BarcodeDetector` desativado, usando imagem QR sintética, inclusive com aplicativo offline. Não substitui teste em aparelho iOS real.

## Falhas com campos vazios

29 suítes JavaScript passaram. OCR Tesseract real executado em Chromium sob a CSP de produção contra comprovante sintético, sem Gemini, extraiu local, data e valor. Parser conservador recusa totais conflitantes, troco, datas inválidas e páginas de erro fiscal. QR testa regiões ampliadas antes de reduzir a foto e câmera automática aguarda identificação. Diagnósticos não registram conteúdo do documento. OCR local depende do download inicial do motor/modelo; não foi validado em iPhone físico nem medido contra as dez tentativas do usuário.

Validação integrada: API simulada retornou 503 (leitura online indisponível), e `readReceipt` preencheu os três campos pelo motor Tesseract real no navegador. O teste não simulou o texto reconhecido.
