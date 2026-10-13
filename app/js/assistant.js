/* Bivvo 11.49 — IA de direção financeira com respostas completas em todos os níveis.
   O extrato nunca sai do aparelho: só resultados agregados e calculados. */
import { today, ymOf, addMonthsYM, money0, parseISO } from './util.js';
import * as store from './store.js';
import * as F from './finance.js';
import * as cloud from './cloud.js';
import { getRemainingUsage, setUsage } from './plans.js';
import { getFinancialStage, getRecoveryPriority } from './recovery.js';
import { recoveryAnalysis } from './copilot.js';

const norm = s => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
const round = n => Math.round((Number(n) || 0) * 100) / 100;
const naturalDate = iso => { try { return parseISO(iso).toLocaleDateString('pt-BR',{day:'numeric',month:'long'}); } catch { return String(iso||''); } };
const pct = n => Math.max(0, Math.round((Number(n)||0) * 100));

export function toolResults(s = store.getState()) {
  const ym = ymOf(today()), prevYm = addMonthsYM(ym, -1);
  const sp = F.spendable(s), month = F.monthSummary(ym, s), prev = F.monthSummary(prevYm, s);
  const f7 = F.dailyForecast(7, s), f30 = F.dailyForecast(30, s), wealth = F.wealth(s), subs = F.subscriptionSummary(s);
  const stage = getFinancialStage(s), priority = getRecoveryPriority(s), recovery = recoveryAnalysis(s);
  const reserveGoal = (s.goals || []).find(g => g.isReserve);
  const cards = s.cards.map(c => { const st = F.cardStatus(c, s), safe = F.safeCardLimit(c, s); return { name:c.name, limit:round(c.limit), used:round(st.used), available:round(st.available), openInvoice:round(st.open.total), safeToUse:round(safe.safe), dueDate:safe.dueDate }; });
  const reserveGap = Math.max(0, round(recovery.reserve.target3 - recovery.reserve.current));
  return {
    asOf: today(),
    spendable: { balance:round(sp.balance), free:round(sp.free), perDay:round(sp.perDay), until:sp.until, bills:round(sp.billsTotal), invoices:round(sp.invoices), saveLeft:round(sp.saveLeft), tone:sp.tone },
    month: { income:round(month.income), incomePaid:round(month.incomePaid), spend:round(month.spend), saved:round(month.saved), planned:round(month.planned), result:round(month.result), savingsRate:month.incomePaid>0?round(month.saved/month.incomePaid):0, topCategories:month.cats.slice(0,5).map(x=>({category:x.cat,value:round(x.value),share:round(x.share)})) },
    previousMonth: { spend:round(prev.spend), income:round(prev.income), saved:round(prev.saved), result:round(prev.result) },
    forecast: { day7:round(f7.endBalance), day30:round(f30.endBalance), riskDate:f30.risk?.date || null, riskBalance:f30.risk ? round(f30.risk.balance) : null, estimated:f30.estimated },
    cards,
    commitments: { installments3Months:round(F.installmentsCommit(3,s)), subscriptionsMonthly:round(subs.monthly), subscriptionsAnnual:round(subs.annual) },
    wealth: { total:round(wealth.total), investments:round(wealth.investments), goals:round(wealth.goals), reserve:round(wealth.reserve), investmentCount:(s.investments||[]).length },
    protection: { avgMonthlySpend:round(recovery.reserve.avgSpend), reserveCurrent:round(recovery.reserve.current), reserveTargetReference:round(recovery.reserve.target3), reserveGap, reserveMonths:round(recovery.reserve.monthsBefore), userReserveGoal:round(reserveGoal?.target || s.emergencyPlan?.target || 0) },
    direction: { stage:stage.id, stageLabel:stage.label, stageReason:stage.reason, priorityId:priority.id, priorityTitle:priority.title, priorityDetail:priority.detail, recoveryProgress:round(recovery.progress), debtsCount:recovery.debts.rows.length, debtsTotal:round(recovery.debts.total), overdueDebts:recovery.debts.rows.filter(x=>x.overdue).length },
    preferences: { savingPercent:round(s.savingPlan?.percent || 0) },
    quality: { transactions:s.transactions.length, cards:s.cards.length, hasBalanceBase:F.hasBalanceBase(s) }
  };
}

function stageDirection(x){
  if (x.direction.stage === 'CRITICAL') return `Seu foco agora é atravessar o período sem piorar o caixa. ${x.direction.priorityTitle}: ${x.direction.priorityDetail}`;
  if (x.direction.stage === 'RECOVERY') return `Você está em recuperação. O melhor próximo passo é ${x.direction.priorityTitle.toLowerCase()}. ${x.direction.priorityDetail}`;
  if (x.direction.stage === 'CONTROL') return `Seu dinheiro cabe, mas ainda pede controle. ${x.direction.priorityTitle}: ${x.direction.priorityDetail}`;
  if (x.direction.stage === 'STABLE') return `Seu caixa está mais estável. Agora faz sentido fortalecer a reserva e transformar sobra em proteção recorrente.`;
  return `Seu caixa está em fase de crescimento. Com proteção e pendências sob controle, você pode organizar objetivos e investimentos sem comprometer o dinheiro do curto prazo.`;
}

function investmentDirection(x){
  if (['CRITICAL','RECOVERY'].includes(x.direction.stage) || x.spendable.free < 0 || x.direction.debtsCount > 0) {
    return `Eu não colocaria investimento como prioridade agora. ${stageDirection(x)} Antes de buscar retorno, proteja o essencial, organize pendências e evite criar novas parcelas. Depois disso, a reserva vira a ponte para começar a investir com mais segurança.`;
  }
  if (x.protection.reserveTargetReference > 0 && x.protection.reserveGap > 0) {
    return `Você já está em uma situação melhor, mas sua proteção ainda está abaixo da referência calculada pelo Bivvo. Sua reserva cadastrada é ${money0(x.protection.reserveCurrent)} e faltam ${money0(x.protection.reserveGap)} para essa referência. Primeiro fortaleça essa base; depois separe o dinheiro por objetivo, prazo, necessidade de liquidez e tolerância a risco antes de escolher investimentos.`;
  }
  return `Seus dados permitem começar a planejar investimentos sem usar o dinheiro dos compromissos. Preserve a reserva, defina o objetivo e o prazo, escolha o nível de liquidez e risco compatível e diversifique aos poucos. Não escolha um investimento só pela rentabilidade passada; custos, impostos, risco e possibilidade de resgate também importam.`;
}

export function localAnswer(question, tools = toolResults()) {
  const q = norm(question), x = tools;
  if (!q) return null;
  if (/qual.*proximo passo|o que devo fazer agora|por onde comeco|me de uma direcao|preciso de uma direcao/.test(q)) return {kind:'local',title:'Seu próximo passo',text:stageDirection(x)};
  if (/o que.*faco.*hoje|missao.*hoje|qual.*prioridade.*hoje/.test(q)) { const risk=x.forecast.riskDate; return {kind:'local',title:'Sua missão de hoje',text:risk ? `Hoje, proteja seu caixa e tente ficar dentro de ${money0(Math.max(0,x.spendable.perDay))}. Com os dados atuais, a projeção pode ficar negativa em ${naturalDate(risk)}. ${x.direction.priorityTitle} é a prioridade.` : x.spendable.free < 0 ? `Hoje, evite assumir novos gastos e priorize os compromissos essenciais. Seu dinheiro livre está negativo em ${money0(Math.abs(x.spendable.free))}. ${x.direction.priorityTitle} é a prioridade.` : `Hoje, mantenha seus gastos dentro de ${money0(Math.max(0,x.spendable.perDay))}. Não há quebra de caixa projetada nos próximos 30 dias. ${x.direction.priorityTitle} é o próximo ponto a observar.`}; }
  if (/quanto.*(posso|livre).*(gastar|usar)|quanto.*gastar|livre.*gastar/.test(q)) return { kind:'local', title:'Quanto você pode gastar', text:x.spendable.free >= 0 ? `Você tem ${money0(x.spendable.free)} livres até ${x.spendable.until}, cerca de ${money0(x.spendable.perDay)} por dia. Esse valor já desconta contas, faturas e a parte que falta da sua meta de guardar.` : `Seu livre está negativo em ${money0(Math.abs(x.spendable.free))}. Pelos dados atuais, contas, faturas e meta de guardar ultrapassam o saldo disponível até ${x.spendable.until}.` };
  if (/como.*(esta|vai).*mes|resumo.*mes|meu mes|gastei.*mes/.test(q)) return { kind:'local', title:'Seu mês agora', text:`Entraram ${money0(x.month.incomePaid)}, você gastou ${money0(x.month.spend)} e guardou ${money0(x.month.saved)}. O resultado do mês, considerando o que já está previsto, é ${money0(x.month.result)}.` };
  if (/previs|30 dias|7 dias|saldo futuro|vai faltar/.test(q)) return { kind:'local', title:'Sua previsão', text:x.forecast.riskDate ? `A projeção encontra risco de saldo negativo em ${naturalDate(x.forecast.riskDate)}, chegando a ${money0(x.forecast.riskBalance)}. Em 7 dias a estimativa é ${money0(x.forecast.day7)} e em 30 dias, ${money0(x.forecast.day30)}.` : `Não aparece saldo negativo nos próximos 30 dias. A estimativa é ${money0(x.forecast.day7)} em 7 dias e ${money0(x.forecast.day30)} em 30 dias.` };
  if (/cartao|fatura|limite/.test(q) && x.cards.length) { const c=[...x.cards].sort((a,b)=>b.used-a.used)[0]; return { kind:'local', title:'Seu cartão', text:`No ${c.name}, há ${money0(c.used)} comprometidos e ${money0(c.available)} de limite disponível. Pelo seu caixa projetado, o limite financeiramente seguro para novas compras agora é cerca de ${money0(c.safeToUse)}.` }; }
  if (/como.*sair.*vermelho|sair.*aperto|sair.*merda|na merda|estou.*ferrad|estou.*afundad|nao consigo.*sair.*divid|minha vida financeira.*bagunc/.test(q)) return {kind:'local',title:'Direção para sair do aperto',text:`Você não precisa resolver tudo de uma vez. ${stageDirection(x)} Depois, ataque uma pendência por vez e só aumente a meta de guardar quando o caixa parar de apertar. O objetivo agora é ganhar margem e previsibilidade, não perfeição.`};
  if (/quanto.*guardar|quanto.*economizar|quanto.*poupar|quero guardar dinheiro/.test(q)) {
    if(x.spendable.free<=0) return {kind:'local',title:'Quanto guardar agora',text:`Hoje eu não transformaria guardar em obrigação. Seu dinheiro livre está em ${money0(x.spendable.free)}. Primeiro faça o caixa voltar a caber; quando houver sobra real, comece com um valor que possa repetir sem atrasar contas.`};
    const target=x.protection.reserveTargetReference, gap=x.protection.reserveGap;
    return {kind:'local',title:'Quanto guardar agora',text:gap>0?`Você tem ${money0(x.spendable.free)} livres no período. Sua reserva atual é ${money0(x.protection.reserveCurrent)} e faltam ${money0(gap)} para a referência de proteção do Bivvo. Não precisa guardar toda a sobra: escolha um valor recorrente que preserve suas contas e aumente a reserva mês após mês.`:`Você tem ${money0(x.spendable.free)} livres e sua reserva já alcançou a referência calculada pelo Bivvo. Agora vale dividir a sobra entre objetivos de curto prazo e investimentos de prazo maior, sem usar o dinheiro dos compromissos.`};
  }
  if (/reserva.*(suficiente|boa|pronta)|quanto.*reserva|preciso.*reserva/.test(q)) {
    if(x.protection.avgMonthlySpend<=0) return {kind:'local',title:'Sua reserva',text:'Ainda falta histórico de gastos para o Bivvo estimar sua cobertura. Registre seus gastos e marque uma meta como reserva de emergência; aí eu consigo comparar a proteção com sua média real.'};
    return {kind:'local',title:'Sua reserva',text:x.protection.reserveGap>0?`Sua reserva cadastrada é ${money0(x.protection.reserveCurrent)} e cobre cerca de ${x.protection.reserveMonths.toFixed(1).replace('.',',')} mês(es) da sua média de gastos. A referência atual do Bivvo é ${money0(x.protection.reserveTargetReference)}. Ela é uma referência, não uma regra universal; sua necessidade real depende de estabilidade de renda, dependentes e facilidade de repor renda.`:`Sua reserva cadastrada é ${money0(x.protection.reserveCurrent)} e já alcançou a referência atual do Bivvo. Preserve esse dinheiro com foco em segurança e liquidez; objetivos de longo prazo podem ficar separados da reserva.`};
  }
  if (/vale.*(quitar|pagar).*(divid|fatura).*invest|invest.*ou.*(quitar|pagar)|divida.*ou.*invest/.test(q)) return {kind:'local',title:'Dívida ou investimento?',text:x.direction.debtsCount>0?`O Bivvo encontrou ${x.direction.debtsCount} pendência(s) ou fatura(s) no plano, somando ${money0(x.direction.debtsTotal)}. Como as taxas de juros dessas dívidas não estão cadastradas, eu não vou fingir saber qual é a mais cara. Primeiro proteja o essencial, confira o custo real das dívidas e evite investir dinheiro que pode faltar para vencimentos próximos.`:investmentDirection(x)};
  if (/quanto.*(investir|aplicar)|quanto.*posso.*invest/.test(q)) {
    if(x.spendable.free<=0) return {kind:'local',title:'Quanto investir agora',text:`Com ${money0(x.spendable.free)} de dinheiro livre, eu não separaria valor para investimento agora. Primeiro faça os próximos compromissos caberem e recupere margem.`};
    if(x.direction.debtsCount>0) return {kind:'local',title:'Quanto investir agora',text:`Você tem ${money0(x.spendable.free)} livres, mas ainda há pendências no plano. Eu não trataria toda essa sobra como dinheiro investível: preserve vencimentos e compare o custo real das dívidas antes de separar um valor para longo prazo.`};
    if(x.protection.reserveGap>0) return {kind:'local',title:'Quanto investir agora',text:`Você tem ${money0(x.spendable.free)} livres, mas ainda faltam ${money0(x.protection.reserveGap)} para a referência de reserva do Bivvo. Fortaleça a proteção primeiro; o que sobrar depois disso pode ser planejado para objetivos e investimentos.`};
    return {kind:'local',title:'Quanto investir agora',text:`Você tem ${money0(x.spendable.free)} livres no período e sua reserva alcançou a referência atual do Bivvo. Esse valor é margem, não uma ordem para investir tudo. Separe primeiro o que pode ser necessário no curto prazo; só a parte que não fará falta deve ir para objetivos de prazo maior.`};
  }
  if (/invest|aplicar|onde colocar.*dinheiro|tenho dinheiro sobrando|dinheiro sobrando/.test(q)) return {kind:'local',title:'Seu próximo passo para investir',text:investmentDirection(x)};
  if (/patrimonio|reserva|guardad/.test(q)) return { kind:'local', title:'Seu patrimônio', text:`Seu total acompanhado no Bivvo é ${money0(x.wealth.total)}: ${money0(x.wealth.investments)} em investimentos e ${money0(x.wealth.goals)} em metas. A reserva marcada soma ${money0(x.wealth.reserve)}.` };
  if (/assinatura|recorr/.test(q)) return { kind:'local', title:'Assinaturas', text:`As recorrências identificadas equivalem a ${money0(x.commitments.subscriptionsMonthly)} por mês, ou aproximadamente ${money0(x.commitments.subscriptionsAnnual)} por ano.` };
  return null;
}

export function elaborateLocalAnswer(local, tools = toolResults()) {
  if (!local?.text) return local;
  const x=tools;
  const stage=`Seu momento financeiro está classificado como ${x.direction.stageLabel}. ${x.direction.stageReason}`;
  const month=`Neste mês, entraram ${money0(x.month.incomePaid)}, saíram ${money0(x.month.spend)} e o resultado acompanhado está em ${money0(x.month.result)}.`;
  let outlook;
  if (x.forecast.riskDate) outlook=`A projeção indica risco de o saldo cruzar zero em ${naturalDate(x.forecast.riskDate)}; isso torna liquidez e vencimentos mais urgentes do que novos compromissos.`;
  else outlook=`A projeção de 30 dias está em ${money0(x.forecast.day30)} e, com os dados atuais, não aparece quebra de caixa nesse horizonte.`;
  let action;
  if (x.spendable.free < 0) action=`Priorize o essencial, revise o que vence primeiro e evite criar novas parcelas até recuperar margem. A prioridade registrada pelo Bivvo é: ${x.direction.priorityTitle}.`;
  else if (x.direction.debtsCount > 0) action=`Use a sobra com cautela: preserve os próximos vencimentos e compare o custo real das pendências antes de decidir entre antecipar dívida, guardar ou investir.`;
  else if (x.protection.reserveGap > 0) action=`Como ainda existe uma diferença de ${money0(x.protection.reserveGap)} para a referência de proteção do Bivvo, vale fortalecer a reserva sem comprometer as contas do período.`;
  else action=`Com o caixa mais protegido, você pode dividir a margem entre objetivos de curto prazo e decisões de longo prazo, sempre preservando o dinheiro dos compromissos.`;
  return {...local,text:`${local.text}\n\nLeitura do cenário: ${month} ${stage}\n\nPor que isso importa: ${outlook}\n\nPróximo passo: ${action}`};
}

export function suggestedQuestions(tools = toolResults()) {
  const stage = tools.direction?.stage || 'CONTROL';
  const base = ['🧭 Qual é meu próximo passo?','💰 Quanto posso guardar este mês?','💳 Meu cartão está me atrapalhando?'];
  if (stage === 'CRITICAL') return ['🚨 Como faço meu dinheiro durar até receber?','💰 O que pago primeiro?','📉 Como começo a sair do vermelho?','🧾 O que posso cortar sem piorar minha vida?','🛡️ Posso mexer na reserva?',...base];
  if (stage === 'RECOVERY') return ['📉 Como saio do vermelho de forma realista?','💰 Vale quitar dívida ou investir?','💰 O que pago primeiro?','🔮 E se eu parar de parcelar?','🛡️ Como começo minha reserva?',...base];
  if (stage === 'STABLE' || stage === 'GROWTH') return ['💚 Tenho dinheiro sobrando. O que faço agora?','🛡️ Minha reserva está suficiente?','📈 Como começo a investir sem me enrolar?','🎯 Como dividir dinheiro entre metas e investimentos?','💰 Quanto posso investir sem apertar meu mês?','🧠 O que devo olhar antes de escolher um investimento?',...base];
  return ['🧭 Qual é meu próximo passo?','📉 Como evitar voltar para o vermelho?','💰 Quanto posso guardar este mês?','🛡️ Como montar minha reserva?','📈 Quando faz sentido começar a investir?','💳 Meu cartão está me atrapalhando?','🔎 Onde meu dinheiro está vazando?'];
}

export function rayX(tools = toolResults()) {
  const notes=[];
  notes.push(`${tools.direction.stageLabel}: ${tools.direction.stageReason}`);
  if (!tools.quality.hasBalanceBase) notes.push('Informe seu saldo atual para deixar as análises mais confiáveis.');
  if (tools.spendable.free < 0) notes.push(`Seu caixa está pressionado: faltam cerca de ${money0(Math.abs(tools.spendable.free))} até a próxima entrada considerada.`);
  else notes.push(`Você tem ${money0(tools.spendable.free)} livres no período, cerca de ${money0(tools.spendable.perDay)} por dia.`);
  if (tools.forecast.riskDate) notes.push(`Seu dinheiro pode não chegar até ${naturalDate(tools.forecast.riskDate)}. Proteger o essencial e reduzir gastos adiáveis antes dessa data é a prioridade.`);
  else notes.push('A projeção de 30 dias não cruza zero com os dados atuais.');
  if (!tools.forecast.riskDate && tools.spendable.free >= 0 && tools.month.incomePaid > 0) { const rate=tools.month.saved/tools.month.incomePaid; notes.push(rate >= .1 ? `Você guardou ${pct(rate)}% do que já entrou neste mês.` : `Você guardou ${pct(rate)}% do que já entrou neste mês. Quando o caixa estiver protegido, você pode revisar sua meta.`); }
  if (tools.month.topCategories[0]) notes.push(`${tools.month.topCategories[0].category} é sua maior categoria no mês, com ${money0(tools.month.topCategories[0].value)}.`);
  if ((tools.direction.stage==='STABLE'||tools.direction.stage==='GROWTH') && tools.protection.reserveGap<=0) notes.push('Sua proteção já permite pensar em objetivos e investimentos sem misturar esse dinheiro com a reserva.');
  return notes.slice(0,5);
}

export async function askAI(question, tools = toolResults()) {
  const token = await cloud.accessToken(); if (!token) throw new Error('Entre novamente para usar o Bivvo IA.');
  const r = await fetch('/api/assistant', { method:'POST', headers:{'Content-Type':'application/json', Authorization:'Bearer '+token}, body:JSON.stringify({ question:String(question||'').slice(0,500), tools }) });
  const j = await r.json().catch(()=>({}));
  if (j.usage?.used != null) setUsage('ai', j.usage.used);
  if (!r.ok) { const e=new Error(j.error || 'Não consegui responder agora.'); e.code=j.code; e.usage=j.usage; throw e; }
  return j;
}
export const aiUsage = () => getRemainingUsage('ai');
