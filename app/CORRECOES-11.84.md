# BIVVO 11.84.0 — correções de aquisição, compartilhamento e confiabilidade

Data: 13/10/2026.

## Base e entrega

Base: `bivvo_work.zip` da Release 11.42. SHA-256: `599f254c26b5b6b90142f081828f95531ddd7d2f3864808d383cd495509caa4b`.

A Release dizia 11.42, o package.json dizia 11.69.0, a interface e o service worker diziam 11.64.0, e o pacote continha alterações documentadas até 11.83. O código recebido foi preservado como base; as referências centrais da nova entrega são 11.84.0. Documentos históricos não foram usados como comandos nem como prova de testes executados.

O ZIP contém o projeto-fonte, funções Netlify, configurações, assets e testes. Não inclui dist, node_modules, .git, .netlify, caches ou resultados temporários. O dist é regenerado pelo build. O arquivo `.env.example` é apenas um modelo sem credenciais reais. A chave publicável de Supabase do frontend permanece, como no projeto original.

Nenhum deploy, alteração de banco, cobrança, envio de mensagem ou criação de conta em produção foi realizado.

## Correções implementadas

| Área | Correção | Arquivos principais |
|---|---|---|
| Build | Inclui .mjs, valida imports locais estáticos e dinâmicos e scripts HTML. Falha se uma dependência não existir no dist. Precache mantém identidade por conteúdo. | scripts/build.mjs; scripts/verify-dist.mjs; netlify.toml |
| Indicação | Captura código válido na entrada pública, mantém durante navegação e envia referred_by no cadastro. Código inválido não sobrescreve o válido. Autoindicação continua bloqueada pelo servidor. | js/acquisition.js; js/admin-analytics.js; js/cloud.js |
| Cadastro | Nome e telefone opcionais, em seção expansível. Mantém e-mail, senha de no mínimo 10 caracteres, confirmação e validação do telefone quando preenchido. Corrige formulário que era escondido pela inicialização da sessão. | index.html; js/main.js; js/cloud.js |
| Calculadora | Coloca campos no início da página; valida saldo, contas e dias; mostra resultado, premissas e CTA antes do conteúdo complementar. Mantém a matemática saldo − contas, dividido pelos dias, com sobra mínima zero. | quanto-posso-gastar-hoje/index.html; growth-entry.css; seo-interactive.js |
| Métricas | Uma visualização por página/sessão. Conclusão depende do cálculo válido, sem MutationObserver usado como prova de conclusão. IDs de ferramentas e fases não carregam valores financeiros. | js/public-acquisition.js; js/public-tool-events.js; scripts das ferramentas |
| Compartilhamento público | Ações perto da ferramenta, cartão 9:16 e 1:1, marca/endereço/convite. Valores ocultos por padrão; referência diária somente com opção explícita. Distingue cartão de conteúdo de cartão produzido após uso da ferramenta. | growth-share-1142.js; growth-share-1142.css |
| Compartilhamento e painel | Separa tentativa, cancelamento, falha, cópia e retorno do sistema. Mantém cálculo compatível com eventos antigos no painel. Rotula ações sem afirmar entrega, leitura ou postagem. | js/views/stories.js; js/analytics.js; netlify/functions/admin.js; js/views/admin.js; netlify/functions/analytics-event.js |
| Progresso | Card baseado em missões realmente aplicadas, disponível na jornada. Desafios ativos não são apresentados como concluídos. Nome da meta oculto por padrão. Onboarding oferece progresso também com resultado sem sobra. | js/views/stories.js; js/views/learning.js; js/views/onboarding.js |
| Recompensa | Comunicação explica a regra realmente verificada: e-mail confirmado e três lançamentos próprios em pelo menos duas datas diferentes. Não afirma que isso comprova acesso em dois dias. Benefícios e verificação no servidor foram preservados. | js/views/stories.js; teste referral-server-1184.test.mjs |
| Produtos | Merge inclui companyProducts e preserva inclusões concorrentes, alterações de campos independentes e tombstones de exclusão. | js/sync-merge.js |
| Aulas | Usa spend/spendPaid do motor financeiro e separa pago, previsto e planejado. Corrige o uso do campo expense inexistente. | js/views/life-education.js |
| Histórico familiar | Paginação por date.desc,id.desc, mantendo isolamento por family_id. Interrompe em caso de erro/repetição para não mostrar totais parciais. Leitura tem limite de requisições separado de escrita. | netlify/functions/family.js |
| Capital fictício | Restaura demonstração idempotente: dez pessoas, seis meses, contratos abertos, parciais e quitados, com principal e juros separados. Só adiciona dados a estado fictício. | js/demo.js; js/views/loans.js |
| Versão | Package, lock, interface, data, assets centrais, build e service worker alinhados em 11.84.0. | package.json; package-lock.json; js/util.js; index.html; js/main.js; sw.js |

## As quatro falhas originais

- `capital-demo.test.mjs`: faltava a implementação de addCapitalDemoRecords. Implementada com livro-razão consistente e proteção para dados de demonstração.
- `reliability-family-history.test.mjs`: implementação lia apenas 100 registros e sem desempate de ordenação. Corrigida paginação; o mock também foi ordenado de acordo com o contrato date.desc,id.desc, sem retirar as verificações de integridade, quantidade, falha e autorização.
- `reliability-lessons.test.mjs`: função ausente e uso real de um campo inexistente do resumo financeiro. Implementado adaptador usado pela interface.
- `reliability-products.test.mjs`: companyProducts não estava entre os arrays de registros da mesclagem. Corrigido.

Testes antigos com versão fixa foram atualizados para a nova versão. Testes de navegador foram ajustados aos menus atuais: privacidade dentro de Segurança, rótulo Capital, captura rápida da Home e botão Salvar do diálogo. As verificações funcionais foram preservadas.

## Validação executada localmente

- 84 suítes JS/MJS: 84 passaram; 0 falharam.
- Sintaxe de 238 arquivos JS/MJS/CJS, distinguindo módulos ES de CommonJS: 0 falhas.
- SEO estático: 55 URLs; 55 titles, canonicals e descriptions únicos; 0 erros.
- Build e validação das dependências do dist: passaram. growth-utils.mjs também está no precache.
- Navegador com CSP local: calculadora, entradas inválidas, resultado positivo e sem sobra, indicação até cadastro com backend simulado, origem UTM, eventos sem valores/e-mail, visualização sem duplicar após reload, segunda sessão abrindo link compartilhado, cancelamento e retorno simulado da API de compartilhamento.
- Downloads Canvas: PNG 1080×1920 e 1080×1080; valores ocultos e inclusão apenas após escolha explícita.
- Embed local de parcelas: cálculo validado.
- Demonstração pessoal e Capital, consentimento/revogação, cache offline completo, instalação interrompida em caso de conteúdo inconsistente, revisão do scanner e fechamento por teclado.
- Configurações, backup/cancelamentos, navegação entre ambientes, favoritos, repetição confirmada, busca, agenda, preferências e indicador de sincronização.
- Viewports 320, 390 e 1280 px sem overflow nos fluxos testados.

Na viewport 390×844, o primeiro campo da calculadora passou de aproximadamente 3.170 px para 487 px do topo. O bloco de compartilhar ficou próximo ao resultado: aproximadamente 1.154 px do topo, em vez dos cerca de 9.737 px observados no pacote anterior. Esses números descrevem o teste local, não métricas de conversão.

Varredura defensiva de padrões de chave privada e chave secreta Supabase: nenhum achado nos arquivos de texto inspecionados. Os testes de aquisição verificam que URLs de compartilhamento excluem parâmetros financeiros, pessoais e desconhecidos. O evento de conclusão contém apenas fase e identificador controlado da ferramenta.

## Como testar e publicar

1. Extraia o ZIP e use a pasta que contém package.json e netlify.toml.
2. Use Node.js 22 ou superior.
3. Instale dependências: `npm ci`.
4. Execute `npm test`, `npm run build` e `npm run test:modules`.
5. Para SEO, instale `requirements-test.txt` com Python/pip e execute `npm run test:seo`.
6. Para navegador, instale o Chromium do Playwright com `npx playwright install chromium` (ou use Chromium do sistema). Inicie `npm run serve` em um terminal; em outro, execute `npm run test:growth` e `npm run test:browser`. O servidor local usa 127.0.0.1:8765 por padrão. Resultados do teste de crescimento ficam em work/validation.
7. No GitHub, publique os arquivos extraídos do projeto para a integração de deploy do Netlify, ou use a CLI Netlify a partir dessa pasta. Um ZIP anexado a uma Release serve para download; sozinho não atualiza o site.
8. No Netlify, mantenha `npm run build` como comando de build, `dist` como diretório público e `netlify/functions` como diretório das funções. Preserve as variáveis de ambiente existentes. Não coloque credenciais no repositório.
9. Depois do deploy, confira v11.84.0 na interface e teste em dois aparelhos: convite → ferramenta → cadastro → uso → recompensa conforme os critérios. Confira origem, início/conclusão, tentativas e novas visitas no painel.
10. Verifique compartilhamento/download em Android e iPhone e embed dentro de um domínio externo real. Feche e reabra sessões antigas da PWA para ativar a nova versão, sem apagar dados para forçar atualização.

Não foram alterados arquivos SQL; não há nova migração de banco exigida por estas mudanças.

## Limites da validação

Cadastro, autenticação de testes e APIs usadas nos testes de navegador foram simulados; não validam configuração real do Supabase, e-mails, pagamentos ou entrega de notificações. O retorno de navigator.share não comprova publicação ou leitura. Compartilhamento físico no WhatsApp/Instagram/Safari, cabeçalhos efetivos da CDN, recompensas e cobrança em produção precisam ser conferidos após deploy.

O APK em downloads foi preservado do ZIP original, sem recompilação. Ele não deve ser anunciado como Android 11.84.0. Para distribuir estas mudanças no app Android empacotado, regenere o projeto Android, compile e assine um novo APK/AAB usando o ambiente Android apropriado. Este trabalho entregou o código web e não um binário Android atualizado.

## Representação no GitHub

O repositório guarda o código em app/. O APK original é representado por três partes em downloads/apk-parts, com manifesto de tamanho e SHA-256 em assets/binary-assets.json. O script de build reconstitui e verifica o APK original; as partes não entram no dist. A validação de transporte confirmou igualdade byte a byte com o APK recebido. Há uma suíte adicional de integridade/idempotência/isolamento de caminhos para essa representação, além das 84 suítes das correções. O arquivo Android continua sem recompilação.
