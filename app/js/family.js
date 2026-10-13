/* Bivvo 10.7 — Espaço Família. Dados familiares vivem separados do payload financeiro pessoal. */
import * as cloud from './cloud.js';
async function call(action, body = {}) {
  const token = await cloud.accessToken();
  if (!token) throw new Error('Entre na sua conta para usar o Espaço Família.');
  const r = await fetch('/api/family', { method:'POST', headers:{ Authorization:'Bearer '+token, 'Content-Type':'application/json' }, body:JSON.stringify({ action, ...body }) });
  const j = await r.json().catch(()=>({}));
  if (!r.ok) throw new Error(j.error || 'Não foi possível atualizar o Espaço Família.');
  return j;
}
export const getFamily = () => call('get');
export const createFamily = (name,kind='family') => call('create',{name,kind});
export const createInvite = role => call('invite',{role});
export const acceptInvite = code => call('accept',{code});
export const setRole = (memberId, role) => call('role',{memberId,role});
export const removeMember = memberId => call('remove',{memberId});
export const leaveFamily = () => call('leave');
export const shareTransaction = tx => call('share_transaction',{ transaction:{ sourceId:tx.id, date:tx.date, desc:tx.desc, cat:tx.cat, type:tx.type, value:tx.value } });
export const unshareTransaction = sourceId => call('unshare_transaction',{sourceId});

export const shoppingAdd = item => call('shopping_add',{item});
export const shoppingToggle = (itemId,purchased,actualTotal=null) => call('shopping_toggle',{itemId,purchased,actualTotal});
export const shoppingUpdate = (itemId,patch) => call('shopping_update',{itemId,patch});
export const shoppingDelete = itemId => call('shopping_delete',{itemId});
export const shoppingClearDone = () => call('shopping_clear_done');
