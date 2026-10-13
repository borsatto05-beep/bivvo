/* Webhook Mercado Pago — Bivvo */

const { adminKey, rest } = require('../lib/supabase-admin.js');
const { syncSubscription, mp } = require('../lib/billing.js');
const { verifySignature, eventKey } = require('../lib/webhook-security.js');
const { randomUUID } = require('node:crypto');

exports.handler = async event => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: '' };
  }

  if (!process.env.MERCADOPAGO_ACCESS_TOKEN || !process.env.MERCADOPAGO_WEBHOOK_SECRET || !adminKey()) {
    return { statusCode: 503, body: '' };
  }

  if ((event.body || '').length > 64000) return {statusCode:413, body:''};
  if (!verifySignature(event,process.env.MERCADOPAGO_WEBHOOK_SECRET)) return {statusCode:401, body:''};
  let body = {};

  try {
    body = JSON.parse(event.body || '{}');
  } catch { return {statusCode:400, body:''}; }

  const type = String(
    body.type ||
    body.topic ||
    event.queryStringParameters?.type ||
    event.queryStringParameters?.topic ||
    ''
  ).trim();

  const id = String(
    body.data?.id ||
    event.queryStringParameters?.['data.id'] ||
    event.queryStringParameters?.id ||
    ''
  ).trim();

  const signedId = String(event.queryStringParameters?.['data.id'] || '').trim();
  if (!id || id.toLowerCase() !== signedId.toLowerCase()) return {statusCode:400, body:''};
  if (!['subscription_preapproval','subscription','preapproval','subscription_authorized_payment'].includes(type))
    return {statusCode:200, body:'ignored'};
  const key = eventKey(body,event,type,id), lease = randomUUID();
  try {
    const state = await rest('rpc/bivvo_claim_webhook', {method:'POST', body:{p_key:key,p_lease:lease}});
    if (state === 'done') return {statusCode:200, body:'duplicate'};
    if (state !== 'claimed') return {statusCode:503, body:'retry'};
  } catch { return {statusCode:503, body:'retry'}; }
  const finish = success => rest('rpc/bivvo_finish_webhook', {method:'POST',body:{p_key:key,p_lease:lease,p_success:success}});

  /*
   * Evento da própria assinatura.
   */
  if (
    type === 'subscription_preapproval' ||
    type === 'subscription' ||
    type === 'preapproval'
  ) {
    try {
      await syncSubscription(id);
      await finish(true);

      console.log(
        'billing-webhook subscription synced',
        id
      );
    } catch (e) {
      console.error(
        'billing-webhook subscription sync error',
        e.message
      );
      await finish(false).catch(() => {});
      return {statusCode:503, body:'retry'};
    }

    return { statusCode: 200, body: 'ok' };
  }

  /*
   * Evento de cobrança recorrente.
   *
   * O ID recebido aqui é da cobrança, NÃO da assinatura.
   * Primeiro consultamos a cobrança no Mercado Pago para
   * descobrir o preapproval_id correspondente.
   */
  if (type === 'subscription_authorized_payment') {
    try {
      const invoice = await mp(
        '/authorized_payments/' + encodeURIComponent(id)
      );

      const subscriptionId = String(
        invoice?.preapproval_id || ''
      ).trim();

      if (!subscriptionId) {
        console.error(
          'billing-webhook payment without preapproval_id',
          id
        );

        throw new Error('Pagamento sem assinatura; aguarde reconciliação.');
      }

      /*
       * syncSubscription consulta novamente tanto a assinatura
       * quanto suas cobranças antes de liberar o plano.
       */
      await syncSubscription(subscriptionId);

      // Guarda somente dados comerciais da cobrança para o Admin.
      // Não registra nenhuma informação financeira pessoal do cliente.
      const subRows = await rest(
        `billing_subscriptions?mp_subscription_id=eq.${encodeURIComponent(subscriptionId)}&select=user_id,plan`
      );
      const subRow = subRows?.[0];
      const paymentStatus = String(invoice?.payment?.status || invoice?.status || 'unknown').toLowerCase();
      const amount = Number(invoice?.transaction_amount || invoice?.payment?.transaction_amount || 0) || null;
      const priorPayment = await rest(`billing_payments?mp_payment_id=eq.${encodeURIComponent(id)}&select=status`);
      await rest('billing_payments?on_conflict=mp_payment_id', {
        method: 'POST',
        body: {
          mp_payment_id: id,
          mp_subscription_id: subscriptionId,
          user_id: subRow?.user_id || null,
          plan: subRow?.plan || null,
          status: paymentStatus,
          amount,
          currency: invoice?.currency_id || 'BRL',
          paid_at: invoice?.debit_date || invoice?.date_created || new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        prefer: 'resolution=merge-duplicates,return=minimal'
      });
      if (paymentStatus === 'approved' && priorPayment?.[0]?.status !== 'approved' && subRow?.user_id) {
        await rest('product_events', { method: 'POST', body: { user_id: subRow.user_id, event: 'payment_approved', props: { plan: subRow.plan || 'unknown' } }, prefer: 'return=minimal' }).catch(() => {});
      }
      if (paymentStatus === 'rejected' && priorPayment?.[0]?.status !== 'rejected' && subRow?.user_id) {
        await rest('product_events', { method: 'POST', body: { user_id: subRow.user_id, event: 'payment_failed', props: { plan: subRow.plan || 'unknown' } }, prefer: 'return=minimal' }).catch(() => {});
      }
      await rest('system_events', { method: 'POST', body: { service: 'mercadopago_webhook', event: 'subscription_authorized_payment', ok: true, message: paymentStatus }, prefer: 'return=minimal' }).catch(() => {});

      await finish(true);
      console.log(
        'billing-webhook payment synced',
        { paymentId: id, subscriptionId, paymentStatus }
      );
    } catch (e) {
      console.error(
        'billing-webhook payment sync error',
        e.message
      );
      await finish(false).catch(() => {});
      return {statusCode:503, body:'retry'};
    }

    return { statusCode: 200, body: 'ok' };
  }

  /*
   * Outros eventos são registrados, mas não liberam plano.
   */
  console.log(
    'billing-webhook ignored event',
    type
  );

  return { statusCode: 200, body: 'ok' };
};