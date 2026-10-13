import {registrationMetadata} from './acquisition.js';
/* Bivvo — autenticação Supabase e sincronização segura.
   - Somente a chave publicável fica no frontend. RLS isola por user_id.
   - Sincronização com controle de versão (payload.rev): uma gravação só substitui
     a versão que este aparelho leu. Se outro aparelho gravou antes (ou zerou os dados),
     a versão remota é lida e mesclada — dados apagados não "ressuscitam". */
import { uid, debounce } from './util.js';
import * as store from './store.js';
import { mergePayload } from './sync-merge.js';
export { mergePayload } from './sync-merge.js';

const SUPABASE_URL = 'https://gqfirbhzjuzspermyvfy.supabase.co';
const SUPABASE_KEY = 'sb_publishable_AGD0F361Dci_rgnplWctlg_cD_9vUoz';
const SDK = '/js/vendor/supabase-2.49.8.js';

let client = null, clientPromise = null, sdkPromise = null;
let user = null;
let baseRev = null;
let basePayload = null;
let baseResetAt = null;
let rowExists = false;
let pushing = null, dirty = false;
const statusListeners = new Set();
let syncState = 'idle';

export const onSyncStatus = fn => {
  statusListeners.add(fn);
  fn(syncState);
  return () => statusListeners.delete(fn);
};

function setStatus(s) {
  syncState = s;
  statusListeners.forEach(fn => fn(s));
}

export const currentUser = () => user;

function loadSdk() {
  if (window.supabase) return Promise.resolve();
  if (sdkPromise) return sdkPromise;

  sdkPromise = new Promise((resolve, reject) => {
    const sc = document.createElement('script');
    sc.src = SDK;
    sc.async = true;
    sc.crossOrigin = 'anonymous';
    sc.onload = resolve;
    sc.onerror = () => {
      sdkPromise = null;
      reject(new Error('Não foi possível carregar o serviço de login. Verifique sua conexão.'));
    };
    document.head.append(sc);
  });

  return sdkPromise;
}

export function sb() {
  if (client) return Promise.resolve(client);
  if (clientPromise) return clientPromise;

  // Várias partes do app podem pedir o Supabase ao mesmo tempo na inicialização.
  // Sem uma Promise compartilhada, duas chamadas podem sair do await loadSdk()
  // juntas e criar dois GoTrueClient usando a mesma chave de storage.
  clientPromise = (async () => {
    await loadSdk();
    if (client) return client;

    client = window.supabase.createClient(
      SUPABASE_URL,
      SUPABASE_KEY,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true
        }
      }
    );

    return client;
  })().catch(err => {
    clientPromise = null;
    throw err;
  });

  return clientPromise;
}

/* ---------------- autenticação ---------------- */

export function friendlyAuthError(err) {
  const m = String(err?.message || err || '');

  if (/invalid login credentials/i.test(m))
    return 'E-mail ou senha incorretos.';

  if (/email not confirmed/i.test(m))
    return 'Confirme seu e-mail antes de entrar. O link foi enviado na criação da conta.';

  if (/already registered|already exists/i.test(m))
    return 'Já existe uma conta com este e-mail. Use "Entrar".';

  if (/rate limit|too many/i.test(m))
    return 'Muitas tentativas seguidas. Aguarde um minuto e tente de novo.';

  if (/password should be|weak/i.test(m))
    return 'Senha fraca. Use pelo menos 10 caracteres, misturando letras e números.';

  if (/network|fetch/i.test(m))
    return 'Sem conexão com o servidor. Verifique sua internet.';

  return m || 'Algo deu errado. Tente novamente.';
}

export async function signIn(email, password, askCode) {
  const c = await sb();

  const { error } = await c.auth.signInWithPassword({
    email,
    password
  });

  if (error) throw error;

  await completeMfa(askCode);

  const { data } = await c.auth.getSession();

  return data.session;
}

/* E-mail e senha autenticam; nome e telefone podem ser preenchidos depois. */
export async function signUp(email, password, name='', phone='') {
  const c = await sb();
  let ref=null;try{ref=localStorage.getItem('bivvo_ref');}catch{}
  const metadata=registrationMetadata(name,phone,ref);
  const { data, error } = await c.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: location.origin + location.pathname,
      data: metadata
    }
  });

  if (error) throw error;

  return data;
}

/* Se o usuário tem 2FA verificado, exige o código e eleva a sessão para AAL2. */
export async function completeMfa(askCode) {
  const c = await sb();

  const { data: f, error } = await c.auth.mfa.listFactors();

  if (error) throw error;

  const factor = (f?.totp || []).find(x => x.status === 'verified');

  if (!factor) return null;

  const { data: aal } = await c.auth.mfa.getAuthenticatorAssuranceLevel();

  if (aal?.currentLevel !== 'aal2') {
    const code = String(await askCode() || '').trim();

    if (!/^\d{6}$/.test(code)) {
      await c.auth.signOut({ scope: 'local' });
      throw new Error('O código de 6 dígitos do autenticador é obrigatório para esta conta.');
    }

    const { data, error: ve } = await c.auth.mfa.challengeAndVerify({
      factorId: factor.id,
      code
    });

    if (ve) {
      await c.auth.signOut({ scope: 'local' });
      throw ve;
    }

    return data?.session || null;
  }

  return null;
}

export async function sendRecovery(email) {
  const c = await sb();

  const { error } = await c.auth.resetPasswordForEmail(
    email,
    {
      redirectTo: location.origin + location.pathname
    }
  );

  if (error) throw error;
}

export async function setNewPassword(password) {
  const c = await sb();

  const { error } = await c.auth.updateUser({
    password
  });

  if (error) throw error;

  securityLog('password_recovered');
}

/* Troca de senha logado: reautenticação com nonce enviado por e-mail. */
export async function changePassword(newPassword, askNonce) {
  const c = await sb();

  const { error: re } = await c.auth.reauthenticate();

  if (re) throw re;

  const nonce = String(await askNonce() || '').trim();

  if (!/^\d{6}$/.test(nonce))
    throw new Error('Código de reautenticação inválido.');

  const { error } = await c.auth.updateUser({
    password: newPassword,
    nonce
  });

  if (error) throw error;

  securityLog('password_changed');
}

export async function mfaStatus() {
  const c = await sb();

  const { data } = await c.auth.mfa.listFactors();

  return (data?.totp || []).some(x => x.status === 'verified');
}

export async function enrollMfa() {
  const c = await sb();

  /* remove fatores não verificados de tentativas anteriores */
  const { data: list } = await c.auth.mfa.listFactors();

  for (const f of (list?.all || []).filter(x => x.status !== 'verified')) {
    await c.auth.mfa.unenroll({
      factorId: f.id
    }).catch(() => {});
  }

  const { data, error } = await c.auth.mfa.enroll({
    factorType: 'totp',
    friendlyName: 'Bivvo ' + new Date().toISOString().slice(0, 10)
  });

  if (error) throw error;

  return {
    factorId: data.id,
    qr: data?.totp?.qr_code || ''
  };
}

export async function verifyMfaEnroll(factorId, code) {
  const c = await sb();

  const { error } = await c.auth.mfa.challengeAndVerify({
    factorId,
    code
  });

  if (error) throw error;

  securityLog('mfa_enabled');
}

export async function signOut(scope = 'local') {
  const c = await sb();

  await flush();

  await c.auth.signOut({ scope });

  resetSyncMemory();
  store.clearSessionCache();
}

export async function accessToken() {
  const c = await sb();

  const { data } = await c.auth.getSession();

  return data?.session?.access_token || '';
}

/* Exclusão: senha de novo + MFA (se houver) + sessão recém-emitida, validada também no servidor. */
export async function deleteAccount(password, askCode) {
  const c = await sb();

  const {
    data: { user: u }
  } = await c.auth.getUser();

  if (!u?.email)
    throw new Error('Não foi possível identificar sua conta.');

  const { data: re, error } = await c.auth.signInWithPassword({
    email: u.email,
    password
  });

  if (error || !re?.session)
    throw new Error('Senha incorreta.');

  const mfaSession = await completeMfa(askCode);

  // Para contas sem 2FA, use explicitamente a sessão recém-emitida pela
  // confirmação da senha. Isso evita enviar ao endpoint um token antigo
  // que ainda estivesse no cache da sessão. Com 2FA, a sessão AAL2
  // retornada pelo desafio continua tendo prioridade.
  const session = mfaSession?.access_token
    ? mfaSession
    : re.session;

  if (!session?.access_token)
    throw new Error('Não foi possível renovar sua sessão para excluir a conta.');

  const r = await fetch('/api/account-delete', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + session.access_token,
      'Content-Type': 'application/json'
    }
  });

  const j = await r.json().catch(() => ({}));

  if (!r.ok)
    throw new Error(j.error || 'Não foi possível excluir a conta.');

  resetSyncMemory();
  store.clearSessionCache();

  await c.auth.signOut({
    scope: 'local'
  }).catch(() => {});
}

export async function securityLog(action) {
  try {
    const c = await sb();

    const {
      data: { user: u }
    } = await c.auth.getUser();

    if (u) {
      await c.from('security_events').insert({
        user_id: u.id,
        event_type: String(action).slice(0, 64)
      });
    }
  } catch {
    /* registro opcional */
  }
}

/* ---------------- sessão ---------------- */

let handlers = {};

/* Abre o app somente se a sessão já cumpre o nível exigido (AAL2 quando há 2FA). */
let opening = null;

export function openCurrentSession() {
  if (!opening) {
    opening = doOpen().finally(() => {
      opening = null;
    });
  }

  return opening;
}

async function doOpen() {
  const c = await sb();

  const { data } = await c.auth.getSession();
  const session = data?.session;

  if (!session?.user)
    return false;

  const { data: f } = await c.auth.mfa
    .listFactors()
    .catch(() => ({ data: null }));

  const needs = (f?.totp || [])
    .some(x => x.status === 'verified');

  if (needs) {
    const { data: aal } =
      await c.auth.mfa.getAuthenticatorAssuranceLevel();

    if (aal?.currentLevel !== 'aal2')
      return false;
  }

  if (user?.id === session.user.id)
    return true;

  user = session.user;

  await handlers.onSignedIn?.(session.user);

  return true;
}

export async function initAuth(h) {
  handlers = h;

  const c = await sb();

  c.auth.onAuthStateChange((event, session) => {
    if (event === 'PASSWORD_RECOVERY') {
      handlers.onRecovery?.();
      return;
    }

    if (event === 'SIGNED_OUT') {
      user = null;
      handlers.onSignedOut?.();
      return;
    }

    if (
      (
        event === 'MFA_CHALLENGE_VERIFIED' ||
        event === 'SIGNED_IN'
      ) &&
      session?.user &&
      session.user.id !== user?.id
    ) {
      setTimeout(() => openCurrentSession(), 0);
    }
  });

  const ok = await openCurrentSession();

  if (!ok)
    handlers.onSignedOut?.();
}

/* ---------------- dados ---------------- */

function resetSyncMemory() {
  baseRev = null;
  basePayload = null;
  baseResetAt = null;
  rowExists = false;
  dirty = false;
  user = null;
  setStatus('idle');
}

export async function pull() {
  const c = await sb();

  const { data, error } = await c
    .from('finance_data')
    .select('payload,updated_at')
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) throw error;

  return data?.payload
    ? data.payload
    : null;
}

/* Carrega a nuvem como fonte da verdade. */
export async function loadRemote() {
  const remote = await pull();

  basePayload = remote ? JSON.parse(JSON.stringify(remote)) : null;
  rowExists = !!remote;
  baseRev = remote?.rev || null;
  baseResetAt = remote?.resetAt || null;

  return remote;
}

const schedule = debounce(() => {
  push().catch(() => {});
}, 900);

store.setPersistHook(() => {
  if (!user || store.isDemo())
    return;

  dirty = true;
  setStatus('pending');
  schedule();
});

export async function push({ force = false } = {}) {
  if (!user || store.isDemo())
    return false;

  if (pushing) {
    dirty = true;

    await pushing;

    if (!dirty && !force)
      return true;
  }

  dirty = false;

  pushing = (async () => {
    setStatus('saving');

    const c = await sb();

    const rev = uid();
    const updated_at = new Date().toISOString();

    const payload = {
      ...store.serialize(),
      rev,
      updated_at
    };

    if (force || !rowExists) {
      const row = {user_id:user.id, payload, updated_at};
      const { error } = force
        ? await c.from('finance_data').upsert(row, {onConflict:'user_id'})
        : await c.from('finance_data').insert(row);
      if (error?.code === '23505' && !force) { await reconcile(); return false; }
      if (error) throw error;

      rowExists = true;
      baseRev = rev;
      basePayload = JSON.parse(JSON.stringify(payload));
      baseResetAt = payload.resetAt || baseResetAt;

      return true;
    }

    let q = c
      .from('finance_data')
      .update({
        payload,
        updated_at
      })
      .eq('user_id', user.id);

    q = baseRev
      ? q.eq('payload->>rev', baseRev)
      : q.is('payload->>rev', null);

    const { data, error } =
      await q.select('user_id');

    if (error) throw error;

    if (data && data.length) {
      baseRev = rev;
      basePayload = JSON.parse(JSON.stringify(payload));
      return true;
    }

    /* conflito: alguém gravou antes */
    await reconcile();

    return false;
  })();

  try {
    const ok = await pushing;

    setStatus(
      dirty
        ? 'pending'
        : 'saved'
    );

    return ok;
  } catch (e) {
    dirty = true;

    setStatus(
      navigator.onLine
        ? 'error'
        : 'offline'
    );

    throw e;
  } finally {
    pushing = null;

    if (
      dirty &&
      syncState !== 'error' &&
      syncState !== 'offline'
    ) {
      schedule();
    }
  }
}

export async function flush() {
  for (let attempt=0; attempt<3 && (dirty || pushing); attempt++) await push();
  if (dirty || pushing) throw new Error('Ainda há alterações sem sincronizar. Confira sua conexão antes de sair.');
}

/* Sincronização explícita para abertura/retorno do app.
   1) envia alterações locais pendentes; 2) só depois consulta a nuvem.
   Se o envio falhar/offline, não substitui o estado local por uma versão remota antiga. */
export async function syncNow() {
  if (!user || store.isDemo()) return { ok: false, reason: 'no-user' };

  if (dirty || pushing) {
    try {
      await push();
    } catch (error) {
      return { ok: false, reason: navigator.onLine ? 'push-error' : 'offline', error };
    }
  }

  try {
    const changed = await refreshIfChanged();
    return { ok: true, changed };
  } catch (error) {
    setStatus(navigator.onLine ? 'error' : 'offline');
    return { ok: false, reason: navigator.onLine ? 'pull-error' : 'offline', error };
  }
}

/* Busca a versão remota. Se foi zerada depois da nossa base, adota a remota.
   Caso contrário, mescla por id (o local vence; o que foi apagado aqui continua apagado). */
async function reconcile() {
  const remote = await pull();

  if (!remote) {
    rowExists = false;
    dirty = true;
    return;
  }

  const remoteReset =
    remote.resetAt &&
    remote.resetAt !== baseResetAt;

  if (remoteReset) {
    baseRev = remote.rev || null;
    basePayload = JSON.parse(JSON.stringify(remote));
    baseResetAt = remote.resetAt;
    rowExists = true;

    store.load(
      remote,
      { userId: user.id }
    );

    window.dispatchEvent(
      new CustomEvent('bivvo:remote-reset')
    );

    return;
  }

  const merged = mergePayload(
    remote,
    store.serialize(),
    store.deletedIds(),
    basePayload
  );

  baseRev = remote.rev || null;
  basePayload = JSON.parse(JSON.stringify(remote));
  rowExists = true;

  store.load(
    merged,
    { userId: user.id }
  );

  dirty = true;
}

/* Ao voltar para o app, confere se outro aparelho mudou algo. */
export async function refreshIfChanged() {
  if (
    !user ||
    store.isDemo() ||
    dirty ||
    pushing
  ) {
    return false;
  }

  const remote = await pull();

  if (
    !remote ||
    (remote.rev || null) === baseRev
  ) {
    return false;
  }

  baseRev = remote.rev || null;
  basePayload = JSON.parse(JSON.stringify(remote));
  baseResetAt = remote.resetAt || null;
  rowExists = true;

  store.load(
    remote,
    { userId: user.id }
  );

  return true;
}

/* Zerar dados: grava um payload vazio com resetAt e confere lendo de volta. */
export async function resetAllData() {
  const s = store.getState();

  const profile = {
    ...s.profile,
    checkins: [],
    seenAchievements: []
  };

  const empty = {
    ...store.emptyState(profile),
    resetAt: new Date().toISOString()
  };

  empty.savingPlan = {
    percent: s.savingPlan.percent
  };

  store.load(
    empty,
    { userId: user?.id }
  );

  if (!user)
    return true;

  dirty = false;

  await push({
    force: true
  });

  const check = await pull();

  const leftovers = [
    'transactions',
    'fixed',
    'cards',
    'installments',
    'investments',
    'goals',
    'challenges'
  ].some(
    k => (check?.[k] || []).length
  ) ||
  Object.keys(
    check?.budget_limits || {}
  ).length;

  if (leftovers) {
    throw new Error(
      'A nuvem ainda contém dados após a limpeza. Tente novamente.'
    );
  }

  baseResetAt = check.resetAt;
  baseRev = check.rev;

  securityLog('data_reset');

  return true;
}