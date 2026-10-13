/* Bivvo v10.4 — service worker.
   HTML, JS e CSS: rede primeiro (nunca mistura versões), cache só como reserva offline.
   Fontes e ícones: cache primeiro. APIs e Supabase: nunca passam pelo cache. */
const VERSION = 'bivvo-v11-84-0';
const SHELL = /* BUILD_PRECACHE */ ['./', './index.html', './app.css?v=11.84.0', './js/main.js?v=11.84.0'];
// All assets of a release must install successfully. No partial offline shell.
self.addEventListener('install', e => e.waitUntil((async()=>{
  const cache=await caches.open(VERSION);
  try {
    for(let start=0;start<SHELL.length;start+=12) {
      const batch=await Promise.allSettled(SHELL.slice(start,start+12).map(async asset=>{
        const url=typeof asset==='string'?asset:asset.url;
        const response=await fetch(url,{cache:'no-cache'});
        if(!response.ok)throw new Error('Precache HTTP failed');
        if(typeof asset==='object') {
          const bytes=await response.clone().arrayBuffer();
          const digest=await crypto.subtle.digest('SHA-256',bytes);
          const hash=Array.from(new Uint8Array(digest),x=>x.toString(16).padStart(2,'0')).join('');
          if(hash!==asset.sha256)throw new Error('Release changed during installation');
        }
        await cache.put(url,response);
      }));
      if(batch.some(x=>x.status==='rejected'))throw new Error('Incomplete release');
    }
  } catch(error) {await caches.delete(VERSION);throw error;}
})()));
// The browser activates a new version after the old clients close. Never replace modules mid-session.
self.addEventListener('activate', e => e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION && k !== 'bivvo-share').map(k => caches.delete(k))))));
self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url);
  /* Android: "Compartilhar → Bivvo" com uma imagem. Guarda só até o app abrir e ler (depois é apagada). */
  if (req.method === 'POST' && url.origin === self.location.origin && url.pathname.endsWith('/share-target')) {
    e.respondWith((async () => {
      try {
        const form = await req.formData();
        const file = form.get('receipt');
        if (file && file.size && file.size < 15e6 && /^image\//.test(file.type)) {
          const c = await caches.open('bivvo-share');
          await c.put('./__shared-receipt', new Response(file, { headers: { 'Content-Type': file.type, 'X-Bivvo-Expires':String(Date.now()+10*60*1000) } }));
          return Response.redirect('./#/inicio?shared=1', 303);
        }
      } catch { /* cai no início normal */ }
      return Response.redirect('./#/inicio', 303);
    })());
    return;
  }
  if (req.method !== 'GET' || url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/.netlify/')) return;
  // Match only within this release; query strings do not create mixed module copies.
  e.respondWith((async()=>{
    const cache=await caches.open(VERSION);
    const key=url.pathname==='/'?'/index.html':url.pathname;
    const hit=await cache.match(key,{ignoreSearch:true});
    if(hit)return hit;
    try { return await fetch(req,{cache:'no-cache'}); }
    catch { return req.mode==='navigate' ? (await cache.match('/index.html')) || Response.error() : Response.error(); }
  })());
});

/* ---------- avisos (Web Push) ---------- */
self.addEventListener('push', e => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch { d = { body: e.data ? e.data.text() : '' }; }
  const title = String(d.title || 'Bivvo').slice(0, 80);
  const badgeCount = Math.max(0, Math.min(99, Number(d.badge) || 1));
  const opts = {
    body: String(d.body || 'Toque para abrir o Bivvo.').slice(0, 240),
    icon: './icon-192.png', badge: './favicon-32.png', tag: d.tag || 'bivvo', renotify: false,
    vibrate: [180, 80, 180],
    timestamp: Date.now(),
    data: { url: typeof d.url === 'string' && d.url.startsWith('./') ? d.url : './#/inicio' },
    actions: [
      { action: 'open', title: 'Abrir no Bivvo' },
      { action: 'later', title: 'Ver depois' }
    ]
  };
  const jobs = [self.registration.showNotification(title, opts)];
  if ('setAppBadge' in self.navigator) jobs.push(self.navigator.setAppBadge(badgeCount).catch(() => {}));
  e.waitUntil(Promise.all(jobs));
});
self.addEventListener('notificationclick', e => {
  if (e.action === 'later') { e.notification.close(); return; }
  e.notification.close();
  const target = new URL(e.notification.data?.url || './#/inicio', self.registration.scope).href;
  const clear = 'clearAppBadge' in self.navigator ? self.navigator.clearAppBadge().catch(() => {}) : Promise.resolve();
  e.waitUntil(clear.then(() => self.clients.matchAll({ type: 'window', includeUncontrolled: true })).then(list => {
    for (const c of list) if (c.url.startsWith(self.registration.scope) && 'focus' in c) { c.navigate?.(target); return c.focus(); }
    return self.clients.openWindow(target);
  }));
});
