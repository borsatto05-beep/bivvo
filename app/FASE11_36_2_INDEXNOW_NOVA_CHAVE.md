# Bivvo 11.36.2 — IndexNow

## Implementado
- Arquivo de verificação IndexNow na raiz do site.
- Script `scripts/submit-indexnow.mjs` para ler o `sitemap.xml` e enviar em lote apenas URLs do host `maisbivvo.netlify.app`.
- `keyLocation` aponta para o arquivo de verificação público na raiz.
- O script aceita HTTP 200 (OK) e 202 (validação pendente) como respostas válidas do protocolo.

## Uso após o deploy
1. Publicar o projeto no Netlify.
2. Confirmar que o arquivo de chave abre pela URL na raiz.
3. Executar `node scripts/submit-indexnow.mjs` a partir da pasta do projeto para notificar o IndexNow.

## Segurança / comportamento
- O script não aceita URL fornecida por usuário e só envia URLs do sitemap cujo host seja exatamente `maisbivvo.netlify.app`.
- Nenhuma função HTTP pública foi criada para evitar abuso e spam de submissões.
- A chave do IndexNow precisa ser publicamente verificável no domínio conforme o protocolo; ela não é usada como credencial de acesso ao Bivvo.

## Testes locais
- Arquivo da chave: validado localmente.
- Sitemap: parseado e URLs filtradas por host.
- Sintaxe do script: validada com Node.
- Envio real ao IndexNow: NÃO TESTADO antes do deploy da chave.
- Verificação pública do arquivo no Netlify: NÃO TESTADO antes do deploy.

## Correção 11.36.2
- Chave IndexNow anterior substituída pela nova chave gerada pelo usuário.
- Arquivo antigo de verificação removido.
- Script de submissão atualizado para usar exclusivamente a nova chave.
