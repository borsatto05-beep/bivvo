import assert from 'node:assert/strict';
import fs from 'node:fs';
const plans=fs.readFileSync('js/plans.js','utf8');
const landing=fs.readFileSync('index.html','utf8');
const billing=fs.readFileSync('netlify/lib/billing.js','utf8');
for(const key of ['plus','pro','couple','capital','entrepreneur','family']){
  assert(plans.includes(`${key}:`),`plano ${key} no catálogo`);
  assert(billing.includes(`${key}:`),`plano ${key} no billing`);
  assert(landing.includes(`data-plan-cta=\"${key}\"`),`CTA ${key} na landing`);
}
assert(plans.includes("capital: [...CORE_PLUS,'loans']"));
assert(plans.includes("entrepreneur: [...CORE_PRO,'company']"));
assert(plans.includes("family: [...CORE_PRO,'couple','family','company','loans']"));
assert(landing.includes('Bivvo Capital é uma ferramenta de organização de empréstimos particulares'));
assert(landing.includes('Em qual plano está cada função?'));
console.log('Landing 11.47 e planos segmentados estão alinhados com recursos e billing.');
