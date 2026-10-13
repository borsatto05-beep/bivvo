# BIVVO — código corrigido 11.84.0

O projeto completo está em **[app/](app/)**. O diagnóstico, as mudanças e a validação estão em **[app/CORRECOES-11.84.md](app/CORRECOES-11.84.md)**.

Para baixar todos os arquivos, use **Code → Download ZIP** nesta branch. Depois de extrair, entre na pasta `app`, instale as dependências com `npm ci` e execute `npm run build`. O diretório público gerado é `app/dist`; as funções permanecem em `app/netlify/functions`.

O APK recebido foi preservado sem recompilação. Por causa do limite de tamanho da conexão usada para enviar arquivos, ele é armazenado em três partes. O build reconstitui o arquivo original e confere tamanho e SHA-256 antes de publicá-lo. Essas partes não são servidas ao usuário do app. O APK não incorpora as correções web até ser recompilado em um ambiente Android.

Validação das correções: 84 suítes JS/MJS, 55 páginas de SEO e testes locais de navegador. Nenhum serviço de produção foi alterado. Para configurar deploy a partir deste código, a pasta base do projeto é `app`.

O ZIP antigo da versão 11.41 permanece no repositório como referência histórica.
