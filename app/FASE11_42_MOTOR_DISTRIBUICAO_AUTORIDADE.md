# Bivvo 11.42 — Motor de Distribuição, Autoridade e Crescimento Orgânico

## Objetivo
Transformar as páginas públicas e ferramentas do Bivvo em ativos de distribuição: a pessoa encontra, usa, recebe valor, compartilha; outra pessoa entra; sites externos podem citar/incorporar; e o Growth Center mede o que realmente gera visita, cadastro e ativação.

A 11.42 preserva autenticação, Supabase, PWA, Service Worker, RecoveryEngine, finance engine, regras financeiras centrais, billing, notificações, IndexNow e as calculadoras existentes.

## Auditoria inicial
- Base recebida: Bivvo 11.41.
- Sitemap inicial: 51 URLs.
- A camada 11.41 já tinha tracking público e SEO Intelligence.
- Havia tracking legado `seo-track.js` ainda carregado em algumas páginas junto com o tracking novo; a 11.42 unificou as páginas indexáveis em `js/public-acquisition.js?v=11.42.0` para reduzir duplicidade de medição.
- `/ferramentas/` existia apenas como pasta de utilitário interno (`chaves-push`), sem hub público.
- Não havia catálogo público de ferramentas, embeds para terceiros, área de recursos linkáveis ou kit de informações para criadores/imprensa.

## Implementado

### 1. Compartilhamento orgânico nas páginas públicas
Arquivo principal: `growth-share-1142.js` + `growth-share-1142.css`.

Aplicado às 54 páginas indexáveis não-home do sitemap.

Ações:
- Enviar no WhatsApp.
- Web Share API quando disponível.
- Fallback para WhatsApp.
- Copiar link.
- Gerar/baixar cartão visual pelo Canvas nativo.

O componente é inserido como uma área discreta no fim da experiência. Não abre pop-up automático.

### 2. Privacidade do compartilhamento
Os links de compartilhamento usam somente:
- URL da página.
- `utm_source`.
- `utm_medium=share`.
- `utm_campaign=organic_share`.
- `utm_content` com slug controlado.

Não entram na URL:
- salário;
- renda;
- dívida;
- saldo;
- despesa;
- valor calculado;
- nome;
- e-mail.

Na planilha de gastos, o texto compartilhável pode usar apenas um estado categórico (ex.: “margem apertada”), sem compartilhar o percentual ou os valores do usuário.

### 3. Eventos novos no analytics existente
Não foi criado um segundo analytics.

Novos eventos na allowlist do endpoint existente:
- `organic_share_open`
- `organic_share_whatsapp`
- `organic_share_native`
- `organic_share_copy`
- `result_card_generated`
- `result_card_downloaded`
- `embed_code_copied`
- `external_referral_visit`
- `tool_shared`
- `tool_embed_opened`

Os eventos continuam usando o endpoint `/api/analytics/event` e os mesmos identificadores anônimos da infraestrutura existente.

### 4. Atribuição de origem/referral
`js/growth-utils.mjs` adiciona funções puras para:
- gerar links de compartilhamento;
- remover parâmetros financeiros sensíveis;
- classificar origem por UTM/referrer;
- reconhecer Google, Bing, ChatGPT, Copilot, YouTube, Instagram, Facebook, WhatsApp, embeds e sites externos;
- validar ferramentas permitidas em embeds.

Quando o navegador não fornece referrer suficiente, a origem não é inventada.

### 5. Central pública de ferramentas
Nova URL:
- `/ferramentas/`

O hub organiza ferramentas por problema e intenção, com acesso a:
- Planilha de gastos mensais + ferramenta online.
- Calculadora de salário líquido.
- Calculadora de férias.
- Comprometimento de renda.
- Parcelas.
- Reserva de emergência.
- Quanto guardar por mês.
- Até o próximo salário.
- Diagnóstico financeiro.

Não foram criadas dezenas de calculadoras novas sem validação.

### 6. Ferramentas incorporáveis
Novas URLs:
- `/ferramentas/incorporar/` — pública/indexável.
- `/ferramentas/embed/?tool=...` — moldura `noindex` para iframe.

Ferramentas liberadas inicialmente:
- comprometimento de renda;
- parcelas;
- reserva de emergência.

Segurança do embed:
- `tool` passa por allowlist fechada;
- parâmetros desconhecidos caem em `comprometimento`;
- valores financeiros não entram na URL;
- widget não usa `postMessage`;
- cálculo ocorre dentro do iframe;
- a moldura não é indexada;
- rota recebe política específica de `frame-ancestors`;
- branding discreto leva à ferramenta completa.

### 7. Recursos para backlinks naturais
Nova URL:
- `/recursos/`

Inclui atalhos para ativos linkáveis e incorporáveis. O texto deixa claro que backlink não é exigido e que a referência deve existir porque o recurso é útil.

Também foi criada uma área de transparência para futuros estudos próprios. Nenhuma estatística foi inventada. Estudos futuros devem informar amostra, período, metodologia e limitações.

### 8. Imprensa e criadores
Nova URL:
- `/imprensa/`

Contém:
- descrição curta do Bivvo;
- descrição ampliada;
- missão/posicionamento;
- jornada Bivvo;
- identidade visual existente;
- links para ferramentas/recursos;
- aviso para não atribuir números, premiações ou parcerias inexistentes.

Não foi inventado contato de imprensa que não existia no projeto.

### 9. Open Graph específico
Foram criadas imagens 1200×630, leves e próprias, para:
- `media/og/planilha-gastos.png`
- `media/og/salario-liquido.png`
- `media/og/calculadora-ferias.png`
- `media/og/quanto-gastar.png`
- `media/og/ferramentas-bivvo.png`

As páginas prioritárias passaram a usar o card relacionado ao assunto em vez da imagem OG genérica.

### 10. Internal Link Engine
As páginas indexáveis receberam navegação estática compacta para:
- Ferramentas grátis.
- Recursos para citar.
- Metodologia.

O novo hub também organiza clusters por:
- salário/mês;
- aperto/dívidas;
- estabilidade.

### 11. SEO Intelligence ampliado
Administração → SEO Intelligence passou a agregar também:
- compartilhamentos;
- pessoas que compartilharam;
- visitas por referência;
- visitas via WhatsApp;
- visitas via embed;
- visitas identificáveis de IA;
- cadastros referidos;
- compartilhamentos por página;
- referrals por página;
- shares e embeds por ferramenta;
- origens/referrals com conversão.

Classificações exibidas quando há sinal:
- OPORTUNIDADE SEO
- OPORTUNIDADE CTR
- OPORTUNIDADE CONVERSÃO
- OPORTUNIDADE DISTRIBUIÇÃO
- PÁGINA VENCEDORA
- POUCO SINAL

### 12. Período personalizado no SEO Intelligence
Além de 7/30/90 dias, o SEO Intelligence ganhou data inicial/final.

A API administrativa aceita `from` e `to` validados no formato `YYYY-MM-DD`.

A integração do Search Console também ganhou `performanceRange(start,end)` para consultar o mesmo intervalo quando o modo personalizado é usado.

### 13. `llms.txt`, sitemap e IndexNow
- `llms.txt` atualizado com Ferramentas, Incorporar, Recursos e Imprensa.
- Sitemap atualizado de 51 para 55 URLs.
- `/ferramentas/embed/` não entrou no sitemap.
- Parser local do script IndexNow reconhece as 55 URLs com namespace XML atual.
- Chave IndexNow existente foi preservada.

## Matriz de próximas ferramentas
Esta matriz é qualitativa. Onde não existe volume observado no material do projeto, “demanda” significa intenção provável e deve ser validada no Bing Keyword Research/Search Console antes de programar.

| Ferramenta | Demanda | Intenção | Relevância Bivvo | Risco | Esforço | Prioridade |
|---|---|---|---|---|---|---|
| 13º salário | Alta provável — validar | Resolver | Alta | Médio (regras) | Médio | Alta |
| Rescisão | Alta provável — validar | Resolver | Alta | Alto (trabalhista) | Alto | Média/Alta após fontes |
| Horas extras | Média/alta provável | Resolver | Média/Alta | Alto (regras) | Médio | Média |
| FGTS | Alta provável | Resolver/consultar | Média | Alto (regras) | Médio | Média |
| Juros do cartão | Alta relevância | Resolver | Muito alta | Baixo/Médio | Médio | Alta |
| Custo da dívida | Alta relevância | Resolver | Muito alta | Baixo | Médio | Alta |
| Quanto falta para quitar dívida | Alta relevância | Resolver | Muito alta | Baixo | Médio | Alta |
| Simulador de parcelamento | Já relacionado ao produto | Resolver | Alta | Baixo | Baixo | Alta |
| Quanto posso gastar por dia | Já existe conteúdo/intenção | Resolver | Muito alta | Baixo | Baixo | Alta (evoluir atual) |
| Orçamento mensal | Já existe cluster | Resolver/organizar | Muito alta | Baixo | Médio | Alta |
| Reserva de emergência | Já existe | Resolver | Alta | Baixo | Baixo | Manter/evoluir |
| Comprometimento de renda | Já existe | Resolver | Alta | Baixo | Baixo | Manter/evoluir |

## Distribuição recomendada por ferramenta

### Salário líquido
- Google/Bing: calculadora.
- YouTube: “Quanto sobra de um salário de R$ 3.000?”.
- Short/Reel: diferença entre bruto e líquido.
- WhatsApp: compartilhar a calculadora, sem compartilhar salário/resultados.

### Planilha de gastos mensais
- Busca: planilha + ferramenta online.
- YouTube: “Monte seu mês em 5 minutos”.
- Carrossel: categorias que normalmente precisam entrar no orçamento.
- WhatsApp: enviar a ferramenta para quem divide contas.

### Sair do aperto / diagnóstico
- Busca: guias orientados ao problema.
- Vídeo curto: “O que pagar primeiro quando não dá para tudo?”.
- WhatsApp: enviar o guia, sem compartilhar dívida/valor pessoal.

### Reserva / parcelas / comprometimento
- Busca: página da calculadora.
- Backlinks: widget incorporável.
- Conteúdo de parceiro: iframe + link para a versão completa.

## Segurança e privacidade
Implementado/validado estaticamente:
- allowlist fechada para ferramentas de embed;
- nenhuma URL de share contém valores financeiros;
- nenhum `eval`, `new Function`, `document.write` ou `postMessage` nos arquivos novos/alterados auditados;
- nenhum `innerHTML` nos novos scripts de distribuição;
- nenhum `FormData` no tracking de aquisição;
- links externos `_blank` auditados para `noopener noreferrer`;
- moldura de embed `noindex`;
- política CSP específica para a rota de embed;
- utilitário interno `ferramentas/chaves-push` continua `noindex`;
- nenhuma chave privada/secret encontrada nos 10 arquivos críticos alterados.

A chave pública do IndexNow existente continua intencionalmente pública e não é tratada como segredo.

## Performance
Assets principais 11.42:
- `growth-share-1142.js`: 6.456 B (2.648 B gzip)
- `growth-share-1142.css`: 6.140 B (1.951 B gzip)
- `js/growth-utils.mjs`: 3.421 B (1.308 B gzip)
- `js/public-acquisition.js`: 3.865 B (1.712 B gzip)

OGs: aproximadamente 21–33 KB cada.

Decisões de performance:
- sem framework novo;
- Canvas só é criado no clique em “Baixar cartão”;
- iframe de prévia usa `loading=lazy`;
- widgets usam JS/CSS nativos;
- sem autoplay;
- nenhuma biblioteca externa adicionada.

## Testes executados

### Sintaxe
- `node --check`: 113 arquivos JS/MJS.
- Resultado: 0 falhas.

### Regressão existente + 11.42
Foram executados todos os testes locais em `tests/*.mjs` e `tests/*.js`:
- compra/decisão;
- sobrevivência;
- comportamento;
- recuperação;
- motivação;
- copiloto;
- conversão;
- finance regression;
- growth utils 11.42;
- distribuição 11.42;
- SEO Intelligence.

Total: 125 testes passaram, 0 falharam.

### SEO estático
`tests/static-seo-1142.py`:
- 55 URLs no sitemap;
- 55 titles únicos;
- 55 canonicals únicos;
- 55 descriptions únicas;
- exatamente 1 H1 por URL;
- JSON-LD parseável quando presente;
- assets locais existentes;
- links internos auditados;
- 1 tracking 11.42 por página pública não-home;
- nenhum `seo-track.js` legado nas páginas indexáveis;
- OGs prioritários 1200×630.

Resultado: 0 erros.

### Configuração / IndexNow
- `netlify.toml` parseado com `tomllib`: OK.
- parser do `scripts/submit-indexnow.mjs`: 55 URLs reconhecidas.
- Não foi feito novo envio real ao IndexNow antes do deploy, pois as URLs novas ainda não estão publicadas.

### Smoke HTTP local
Servidor HTTP local retornou 200 para:
- `/ferramentas/`
- `/ferramentas/incorporar/`
- `/ferramentas/embed/?tool=parcelas`
- `/recursos/`
- `/imprensa/`
- `/planilha-de-gastos-mensais/`
- `/growth-share-1142.js`
- `/media/og/ferramentas-bivvo.png`

### Segurança defensiva
- 10 arquivos críticos alterados varridos para padrões de private key, service role, client secret, `eval`, `new Function`, `document.write` e `postMessage`.
- Achados: 0.
- Verificação específica de `innerHTML` e `FormData` nos scripts novos de distribuição/tracking: 0 usos.

## NÃO TESTADO
- Web Share API em iPhone/Android físico.
- Abertura real do WhatsApp em dispositivos físicos.
- Download do Canvas em Safari/iOS físico.
- Embed carregado dentro de um domínio externo real após o deploy Netlify.
- Efetividade do override de `X-Frame-Options`/CSP na CDN do Netlify em produção.
- Eventos 11.42 chegando ao Supabase em produção.
- Atribuição real compartilhamento → segunda pessoa → cadastro em produção.
- Search Console com credenciais reais e período personalizado após deploy.
- Lighthouse/Core Web Vitals reais.
- Ranking, backlinks, citações por IA e crescimento orgânico real.
- IndexNow real para as 4 URLs novas após publicação.

## Riscos conhecidos
1. O navegador pode não enviar referrer ao sair de alguns apps; essas visitas podem continuar como direto/desconhecido.
2. Detecção de ChatGPT/Copilot depende de referrer/UTM e não é completa.
3. `navigator.share` varia por navegador; existe fallback para WhatsApp.
4. Embed precisa ser validado em um domínio externo real após Netlify aplicar os headers específicos.
5. Cards Canvas usam fontes disponíveis no sistema do usuário; pequenas diferenças visuais entre plataformas são esperadas.

## Próximos passos depois do deploy
1. Testar uma ferramenta no celular e compartilhar pelo WhatsApp.
2. Abrir o link compartilhado em outro aparelho/navegador.
3. Conferir Administração → SEO Intelligence para origem e visita referida.
4. Testar um iframe em um domínio externo simples.
5. Enviar IndexNow novamente para incluir as 55 URLs publicadas.
6. Acumular dados por 2–4 semanas antes de decidir novas ferramentas pelo volume e conversão reais.
