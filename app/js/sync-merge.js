/* Mesclagem em três vias; exclusão tem precedência e é persistida no payload. */
export const RECORD_ARRAYS = ['transactions','fixed','cards','installments','investments','goals','subscriptions','challenges','loans','loanPayments','loanCycles','companyProducts'];
const same = (a,b) => JSON.stringify(a) === JSON.stringify(b);
const object = x => x && typeof x === 'object' && !Array.isArray(x);
export function mergeValue(remote, local, base) {
  if (same(local,base)) return remote;
  if (same(remote,base) || same(remote,local)) return local;
  if (object(remote) && object(local)) {
    const out = {};
    for (const k of new Set([...Object.keys(remote),...Object.keys(local),...Object.keys(base || {})])) {
      const value = mergeValue(remote[k],local[k],base?.[k]);
      if (value !== undefined) out[k] = value;
    }
    return out;
  }
  // Concurrent edits to the same scalar retain the local edit.
  return local;
}
export function mergePayload(remote, local, deleted = new Set(), base = null) {
  const out = mergeValue(remote,local,base || {});
  out.deletedRecords = {...remote.deletedRecords,...local.deletedRecords};
  const now = new Date().toISOString();
  for (const id of deleted) out.deletedRecords[id] ||= now;
  for (const k of RECORD_ARRAYS) {
    const r = new Map((remote[k] || []).map(x => [x.id,x]));
    const l = new Map((local[k] || []).map(x => [x.id,x]));
    const b = new Map((base?.[k] || []).map(x => [x.id,x]));
    out[k] = [];
    for (const id of new Set([...r.keys(),...l.keys(),...b.keys()])) {
      if (!id || out.deletedRecords[id]) continue;
      if (b.has(id) && (!r.has(id) || !l.has(id))) { out.deletedRecords[id] = now; continue; }
      const item = r.has(id) && l.has(id) ? mergeValue(r.get(id),l.get(id),b.get(id)) : r.get(id) || l.get(id);
      if (item) out[k].push(item);
    }
  }
  for (const k of ['generatedRecurring','customCategories']) out[k] = [...new Set([...(remote[k] || []),...(local[k] || [])])];
  if(remote.financialProfiles?.company||local.financialProfiles?.company){out.financialProfiles={...out.financialProfiles,company:mergePayload(remote.financialProfiles?.company||{},local.financialProfiles?.company||{},new Set(),base?.financialProfiles?.company||{})};}
  return out;
}
