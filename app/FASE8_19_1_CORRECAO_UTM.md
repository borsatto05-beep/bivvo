# Bivvo 8.19.1 — Correção de atribuição UTM

- Corrige o rastreamento que prendia todas as visitas à primeira origem do navegador.
- UTMs presentes na URL agora representam a origem da visita atual.
- Mantém `bivvo_first_touch_v1` para a primeira origem e adiciona `bivvo_last_touch_v1` para a origem mais recente.
- `site_visit` passa a ser deduplicado por origem/meio/campanha dentro da sessão, permitindo testar campanhas diferentes sem inflar recarregamentos da mesma campanha.
- Growth Center passa a mostrar Sessões e Visitantes separadamente em Aquisição por origem e Campanhas/UTMs.
- Nenhum dado financeiro é enviado para analytics.
