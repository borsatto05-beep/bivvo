import assert from 'node:assert/strict';
import fs from 'node:fs';

const client=fs.readFileSync('js/plans.js','utf8');
const server=fs.readFileSync('netlify/lib/plans.js','utf8');
const billing=fs.readFileSync('netlify/lib/billing.js','utf8');
const assistant=fs.readFileSync('netlify/functions/assistant.js','utf8');
const landing=fs.readFileSync('index.html','utf8');
const conversion=fs.readFileSync('js/conversion-engine.js','utf8');
const admin=fs.readFileSync('netlify/functions/admin.js','utf8');

const expected={
  plus:{monthly:'19.90',annual:'199.00',tier:1,ai:30},
  capital:{monthly:'24.90',annual:'249.00',tier:2,ai:60},
  pro:{monthly:'29.90',annual:'299.00',tier:3,ai:300},
  couple:{monthly:'29.90',annual:'299.00',tier:3,ai:300},
  entrepreneur:{monthly:'34.90',annual:'349.00',tier:4,ai:500},
  family:{monthly:'49.99',annual:'499.00',tier:5,ai:800}
};
for(const [key,v] of Object.entries(expected)){
  assert(client.includes(`${key}: { monthly: ${v.monthly}, annual: ${v.annual} }`),`preço client ${key}`);
  assert(billing.includes(`${key}: { name:`),`billing ${key}`);
  assert(billing.includes(`amount: ${v.monthly}, annual: ${v.annual}`),`preço billing ${key}`);
  assert(client.includes(`${key}: { cards: Infinity`),`limite client ${key}`);
  assert(client.includes(`aiPerMonth: ${v.ai}, aiTier: ${v.tier}`),`cota/tier client ${key}`);
  assert(server.includes(`${key}:{scan:`),`limite server ${key}`);
  assert(server.includes(`ai:${v.ai},aiTier:${v.tier}`),`cota/tier server ${key}`);
}
assert(client.includes("1: { label:'IA Essencial'"));
assert(client.includes("5: { label:'IA Máxima'"));
assert(assistant.includes("GEMINI_ASSISTANT_MODEL_ESSENTIAL"));
assert(assistant.includes("GEMINI_ASSISTANT_MODEL_SPECIALIST"));
assert(assistant.includes("GEMINI_ASSISTANT_MODEL_MAX"));
assert(assistant.includes("'gemini-2.5-pro'"));
assert(assistant.includes('aiTier=Math.max(1,Math.min(5'));
assert(assistant.includes('${aiLevel.depth}'));
assert(landing.includes('Todas as IAs entregam respostas completas e bem elaboradas.'));
assert(landing.includes('Quanto mais completo o plano, maior a profundidade')); 
for(const label of ['IA Essencial','IA Contextual','IA Avançada','IA Especialista','IA Máxima']) assert(landing.includes(label),`landing ${label}`);
assert(conversion.includes('plus:19.9'));
assert(admin.includes('family:49.99'));
console.log('Bivvo 11.48: preços e inteligência escalonada da IA estão alinhados entre landing, app, servidor e cobrança.');
