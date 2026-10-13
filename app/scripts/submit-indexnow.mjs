import fs from 'node:fs/promises';

const host = 'maisbivvo.netlify.app';
const key = '7b81b179f23a404ab6ece070dca8e7f8';
const keyLocation = `https://${host}/${key}.txt`;
const sitemapPath = new URL('../sitemap.xml', import.meta.url);
const xml = await fs.readFile(sitemapPath, 'utf8');
const urls = [...xml.matchAll(/<(?:[A-Za-z_][\w.-]*:)?loc\b[^>]*>(.*?)<\/(?:[A-Za-z_][\w.-]*:)?loc>/gi)].map(m => m[1].trim())
  .filter(u => {
    try { return new URL(u).host === host; } catch { return false; }
  });
if (!urls.length) throw new Error('Nenhuma URL valida encontrada no sitemap.xml');
const res = await fetch('https://api.indexnow.org/indexnow', {
  method: 'POST',
  headers: {'content-type':'application/json; charset=utf-8'},
  body: JSON.stringify({host, key, keyLocation, urlList: urls})
});
console.log(`IndexNow HTTP ${res.status} - ${urls.length} URLs enviadas`);
if (![200,202].includes(res.status)) {
  const body = await res.text().catch(()=>'');
  if (body) console.error(body.slice(0,1000));
  process.exitCode = 1;
}
