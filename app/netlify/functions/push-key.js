/* Entrega a chave pública VAPID ao app (a privada nunca sai do servidor). */
exports.handler = async () => {
  const headers = { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=300', 'X-Content-Type-Options': 'nosniff' };
  const key = process.env.VAPID_PUBLIC_KEY;
  if (!key || !process.env.VAPID_PRIVATE_KEY) return { statusCode: 503, headers, body: JSON.stringify({ error: 'Os avisos ainda não foram configurados no servidor (VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY).' }) };
  return { statusCode: 200, headers, body: JSON.stringify({ publicKey: key }) };
};
