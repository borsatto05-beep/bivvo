# BIVVO 11.47 — Landing e planos segmentados

## O que mudou
- Home pública reconstruída para apresentar Pessoal, Casal, Empresa, Família e Bivvo Capital.
- Tabela pública mostra os principais recursos e em qual plano cada um está disponível.
- Planos agora são segmentados por necessidade, não apenas por uma hierarquia simples.
- A antiga área de empréstimos passa a ser apresentada comercialmente como **Bivvo Capital**.
- CTAs de plano na home levam ao cadastro e preservam o plano de interesse para destacá-lo depois da entrada.

## Planos
- **Grátis** — R$ 0.
- **Plus** — R$ 9,90/mês ou R$ 99/ano.
- **Pro** — R$ 19,90/mês ou R$ 199/ano.
- **Casal** — R$ 19,90/mês ou R$ 199/ano.
- **Capital** — R$ 14,90/mês ou R$ 149/ano.
- **Empreendedor** — R$ 24,90/mês ou R$ 249/ano.
- **Família** — R$ 39,99/mês ou R$ 399/ano.

## Permissões especializadas
- Casal: plano Casal ou Família.
- Empresa: plano Empreendedor ou Família.
- Capital: plano Capital ou Família.
- Família: plano Família.
- Família reúne Pro + Casal + Empresa + Capital.

## Banco de dados
Antes de publicar, execute `supabase-planos-11-47.sql` no Supabase SQL Editor para aceitar os novos nomes de plano e atualizar as proteções server-side dos perfis especializados.

## Posicionamento do Capital
Bivvo Capital é somente uma ferramenta de organização de empréstimos particulares. O Bivvo não concede crédito e não intermedeia operações.
