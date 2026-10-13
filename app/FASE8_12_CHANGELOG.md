# Fase 8.12 — Testes A/B

Versão 11.12.0.

- Motor A/B persistente por visitante usando localStorage.
- Primeiro experimento: hero da landing (título + CTA), variantes A/B.
- Exposição e conversão medidas por visitante, sem valores financeiros.
- Growth Center mostra exposição, conversões e taxa por variante.
- Eventos novos: `ab_exposure` e `ab_conversion`.
- Sem SQL novo: reutiliza `analytics_events.content`.
- Não troca a variante do mesmo navegador entre visitas.

Critério recomendado: não declarar vencedor com amostra pequena; observar volume suficiente antes de substituir a versão padrão.
