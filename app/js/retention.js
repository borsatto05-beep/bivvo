/* Bivvo 10.8 — retenção útil: relatório mensal e marcos D30/D90, sem dados financeiros em analytics. */
import { h, today, ymOf, addMonthsYM } from './util.js';
import * as store from './store.js';
import { openSheet } from './ui.js';
import { openRetrospective } from './views/stories.js';
import { track, trackOnce } from './analytics.js';

export function markRetentionMilestones(user) {
  const created = new Date(user?.created_at || 0).getTime(); if (!created) return;
  const days = Math.floor((Date.now() - created) / 86400000);
  if (days >= 30) trackOnce('retention_d30', 'life');
  if (days >= 90) trackOnce('retention_d90', 'life');
}
export function maybeOfferMonthlyReport() {
  if (today().slice(8) !== '01' || store.isDemo()) return;
  const ym = addMonthsYM(ymOf(today()), -1), key = 'bivvo_month_report_' + ym;
  if (!store.getState().transactions.some(t => String(t.date || '').startsWith(ym))) return;
  try { if (localStorage.getItem(key)) return; localStorage.setItem(key, '1'); } catch {}
  let sheet;
  sheet = openSheet({ title:'Seu mês está pronto', content:h('div', h('p.muted','O Bivvo preparou a retrospectiva do mês passado: entradas, gastos, categorias e quanto você guardou.')), footer:[
    h('button.btn.ghost',{type:'button',onclick:()=>sheet.close()},'Agora não'),
    h('button.btn.primary',{type:'button',onclick:()=>{sheet.close();track('monthly_report_opened');setTimeout(()=>openRetrospective(ym),120);}},'Ver meu mês')
  ]});
}


/* Bivvo 8.18 — Retenção Inteligente.
   Mede retorno sem enviar saldo, renda, compras ou descrições. */
const RETENTION_VISIT_KEY = 'bivvo_retention_last_visit_v1';
const RETENTION_NUDGE_KEY = 'bivvo_retention_nudge_v1';
export function markSmartReturn() {
  if (store.isDemo()) return;
  const now = Date.now();
  let previous = 0;
  try { previous = Number(localStorage.getItem(RETENTION_VISIT_KEY) || 0); } catch {}
  if (previous > 0) {
    const days = Math.floor((now - previous) / 86400000);
    if (days >= 3) track('retention_returned', { reason: days >= 14 ? 'inactive_14d' : days >= 7 ? 'inactive_7d' : 'inactive_3d' });
  }
  try { localStorage.setItem(RETENTION_VISIT_KEY, String(now)); } catch {}
}
export function maybeOfferSmartReturn() {
  if (store.isDemo()) return;
  const now = Date.now(); let lastNudge = 0, previous = 0;
  try { lastNudge = Number(localStorage.getItem(RETENTION_NUDGE_KEY) || 0); previous = Number(localStorage.getItem(RETENTION_VISIT_KEY) || 0); } catch {}
  if (!previous) return;
  const awayDays = Math.floor((now - previous) / 86400000);
  if (awayDays < 7 || now - lastNudge < 7 * 86400000) return;
  try { localStorage.setItem(RETENTION_NUDGE_KEY, String(now)); } catch {}
  track('retention_nudge_shown', { reason: awayDays >= 14 ? 'inactive_14d' : 'inactive_7d', placement: 'app_open' });
}
