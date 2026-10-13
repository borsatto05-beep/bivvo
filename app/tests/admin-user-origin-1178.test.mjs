import fs from 'node:fs';
const admin = fs.readFileSync('netlify/functions/admin.js','utf8');
const view = fs.readFileSync('js/views/admin.js','utf8');
const checks = [
  [admin.includes("event=eq.signup_completed"), 'busca signup_completed para preservar a origem do cadastro'],
  [admin.includes("acquisition_source:acquisitionSource"), 'API expõe acquisition_source'],
  [admin.includes("TikTok") && admin.includes("Facebook") && admin.includes("YouTube") && admin.includes("Google"), 'classifica canais principais'],
  [view.includes("'ORIGEM'"), 'card do usuário mostra ORIGEM'],
  [view.includes('Buscar nome, e-mail ou origem'), 'busca aceita origem']
];
for (const [ok,msg] of checks) if(!ok) throw new Error(msg);
console.log('admin-user-origin-1178.test.mjs PASS');
