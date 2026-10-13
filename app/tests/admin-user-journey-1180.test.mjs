import fs from 'node:fs';
const api=fs.readFileSync('netlify/functions/admin.js','utf8');
const view=fs.readFileSync('js/views/admin.js','utf8');
const css=fs.readFileSync('admin-education.css','utf8');
const checks=[
  [api.includes('origin_conversion'), 'API agrega conversão por origem'],
  [api.includes('conversion_stage'), 'API expõe etapa de conversão'],
  [api.includes('engagement_health'), 'API expõe sinal de risco/engajamento'],
  [api.includes('milestones'), 'API expõe marcos da jornada'],
  [api.includes('billing_subscriptions') && api.includes('billing_payments'), 'API cruza plano e pagamento'],
  [view.includes('Ver jornada'), 'UI oferece jornada individual'],
  [view.includes('Conversão por origem'), 'UI mostra conversão por origem'],
  [view.includes("makeSelect('Plano'"), 'UI filtra por plano'],
  [view.includes("makeSelect('Etapa'"), 'UI filtra por etapa'],
  [view.includes("makeSelect('Situação'"), 'UI filtra por situação'],
  [css.includes('.admin-journey-list'), 'CSS da jornada presente']
];
for(const [ok,msg] of checks) if(!ok) throw new Error(msg);
console.log('admin-user-journey-1180.test.mjs PASS');
