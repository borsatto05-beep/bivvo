const crypto = require('node:crypto');
function verifySignature(event, secret, now = Date.now()) {
  const h = Object.fromEntries(Object.entries(event.headers || {}).map(([k,v]) => [k.toLowerCase(),v]));
  const requestId = String(h['x-request-id'] || '');
  const pieces = Object.fromEntries(String(h['x-signature'] || '').split(',').map(x => x.trim().split('=')));
  const ts = String(pieces.ts || ''), v1 = String(pieces.v1 || '');
  const id = String(event.queryStringParameters?.['data.id'] || '').toLowerCase();
  if (!secret || !id || !requestId || !/^\d{10,13}$/.test(ts) || !/^[a-f0-9]{64}$/i.test(v1)) return false;
  const millis = ts.length === 13 ? Number(ts) : Number(ts)*1000;
  if (Math.abs(now - millis) > 10*60*1000) return false;
  const manifest = `id:${id};request-id:${requestId};ts:${ts};`;
  const expected = crypto.createHmac('sha256',secret).update(manifest).digest();
  return crypto.timingSafeEqual(expected, Buffer.from(v1,'hex'));
}
function eventKey(body,event,type,id) {
  const identity = body.id != null ? `notification:${body.id}` :
    `${event.headers?.['x-request-id'] || event.headers?.['X-Request-Id']}:${body.date_created || ''}:${body.action || ''}`;
  return crypto.createHash('sha256').update(`${type}:${id}:${identity}`).digest('hex');
}
module.exports = {verifySignature,eventKey};
