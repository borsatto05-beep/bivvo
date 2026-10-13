/* Bivvo 11.31 — notificações inteligentes, curtas e contextuais. */
const brl = v => 'R$ ' + Math.round(Number(v) || 0).toLocaleString('pt-BR');
const addDays = (iso, n) => { const d = new Date(iso + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
const naturalDate = iso => { try { return new Intl.DateTimeFormat('pt-BR', { day:'numeric', month:'long', timeZone:'UTC' }).format(new Date(iso + 'T12:00:00Z')); } catch { return String(iso || ''); } };
const safeUrl = u => typeof u === 'string' && u.startsWith('./') ? u : './#/inicio';
const msg = (title, body, url, tag, urgency='normal', badge=1) => ({ title, body, url:safeUrl(url), tag, urgency, badge });

/* Uma notificação útil por ciclo. Prioridade: crise > vencimento > cartão > missão/hábito. */
function buildMessage(pref, localDate, premium = false) {
  const dg = pref.digest || {};
  const show = !!pref.show_values;
  const tomorrow = addDays(localDate, 1);
  const events = (dg.events || []).filter(e => e.date === tomorrow || e.date === localDate);
  const firstEvent = events[0];
  const captured = pref.last_capture_date === localDate;
  const free = Number(dg.free);
  const perDay = Number(dg.perDay);
  const days = Math.max(1, Number(dg.days) || 1);
  const stage = String(dg.stage || '');

  if (stage === 'CRITICAL') {
    if (dg.riskDate && dg.riskDate >= localDate) {
      const lead = show && Number.isFinite(free) ? `Você tem ${brl(Math.max(0, free))} livres até receber` : 'Seu dinheiro pede atenção agora';
      const tail = perDay > 0 && show ? ` — cerca de ${brl(perDay)}/dia.` : '.';
      return msg('🚨 Plano de hoje', `${lead}${tail} A projeção pode ficar negativa em ${naturalDate(dg.riskDate)}.`, './#/inicio?crisis=1', 'bivvo-crisis', 'high', 1);
    }
    if (dg.priorityTitle) return msg('🚨 Bivvo está com você', show && free >= 0 ? `${dg.priorityTitle}. ${brl(free)} livres por ${days} dia(s).` : String(dg.priorityTitle), './#/inicio?crisis=1', 'bivvo-crisis', 'high', 1);
  }

  if (firstEvent) {
    const when = firstEvent.date === localDate ? 'Hoje' : 'Amanhã';
    const amount = show && firstEvent.value ? ` · ${brl(firstEvent.value)}` : '';
    const icon = firstEvent.kind?.startsWith('card') ? '💳' : '🧾';
    return msg(`${icon} ${when}: compromisso`, `${firstEvent.text}${amount}. Toque para revisar.`, firstEvent.url || './#/calendario', 'bivvo-due', firstEvent.date === localDate ? 'high' : 'normal', 1);
  }

  if (premium && Number(dg.highCardPct) >= 80) {
    return msg('💳 Cartão pede atenção', `Seu cartão mais comprometido chegou a ${Math.min(999, Number(dg.highCardPct))}% do limite.`, './#/cartoes', 'bivvo-card', 'normal', 1);
  }

  if (premium && dg.riskDate && dg.riskDate >= localDate) {
    return msg('⚠️ Olho nos próximos dias', `Sua projeção pode ficar negativa em ${naturalDate(dg.riskDate)}. Veja o que ajustar antes.`, './#/previsao', 'bivvo-forecast', 'high', 1);
  }

  if (!captured) {
    const fresh = dg.date === localDate;
    if (show && fresh && perDay > 0) return msg('💰 Seu limite de hoje', `${brl(perDay)} é sua referência para continuar dentro do plano.`, './#/inicio?capture=1', 'bivvo-daily', 'normal', 1);
    return msg('📝 Fechou o dia?', 'Anote seus gastos em poucos segundos e deixe o Bivvo recalcular seu amanhã.', './#/inicio?capture=1', 'bivvo-daily', 'low', 1);
  }

  if (stage === 'RECOVERY' || stage === 'CONTROL') {
    return msg('🔥 Continue no controle', dg.priorityTitle || 'Seu plano está atualizado. Veja a próxima ação que mais ajuda agora.', './#/inicio', 'bivvo-progress', 'low', 1);
  }
  return null;
}
module.exports = { buildMessage, addDays, naturalDate };
