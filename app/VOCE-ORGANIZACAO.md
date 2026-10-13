# Aba Você organizada

A entrada agora mostra perfil, ambiente atual e dois grupos curtos: Configurações e Mais no Bivvo. Preferências, dados e backup, segurança, ferramentas, progresso e assinatura abrem seus detalhes ao tocar.

Os guias financeiros ficam nas ferramentas e nas outras telas. Conquistas e limites do plano aparecem somente nos seus respectivos grupos. Zerar dados e excluir a conta ficam em Segurança e privacidade → Ações da conta, com as confirmações anteriores preservadas.

Pessoal, Casal e Empresa mantêm seus menus próprios. A troca de ambiente continua acessível no topo. Cadastros, registros financeiros, permissões de planos e conversão Google Ads mantidos. Sem alterações de banco ou publicação automática.

Corrigido o retorno de um formulário para seu menu pai: fechar um diálogo filho não fecha o pai. O botão Voltar do navegador continua fechando o diálogo atual.

Validação: 60 suites existentes; navegador em 320, 390 e 1280 px, abrir grupos, editar perfil e voltar, cancelar backup e zerar, segurança da conta, progresso, assinatura, escola, troca entre três ambientes e preservação de registros financeiros.

Para repetir a verificação no navegador com o dist servido localmente:
```sh
BIVVO_TEST_URL=http://127.0.0.1:8779 CHROMIUM_PATH=/usr/bin/chromium node tests/you-browser.cjs
```

O ZIP inclui o código completo e a pasta dist atualizada para publicação no Netlify.
