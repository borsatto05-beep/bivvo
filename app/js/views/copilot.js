import { h, money, shortDate, monthLabel } from '../util.js';
import { openSheet } from '../ui.js';
import { copilotSnapshot, financialControlDetector, survivalPlan, behaviorAnalysis, recoveryAnalysis, motivationAnalysis, todayBrief, whatIfIncomeDrop } from '../copilot.js';
import { openDecisionAssistant } from './decision.js';
import { openSimulator } from './simulator.js';


function reserveSimulator(base){
  const amount=h('input.input',{type:'number',min:'0',step:'0.01',placeholder:'Valor que pensa em retirar'});
  const reason=h('select.input',h('option',{value:''},'Motivo da retirada'),...['Emergência médica','Desemprego','Reparo essencial','Conta inesperada','Compra','Outro'].map(x=>h('option',{value:x},x)));
  const out=h('div.reserve-result',h('p.muted.sm','Digite um valor para simular. Nada será retirado da sua reserva.'));
  const simulate=()=>{const v=Math.max(0,Number(amount.value)||0), r=recoveryAnalysis(undefined,v).reserve;out.innerHTML='';out.append(h('div.reserve-kpis',h('div',h('small','Reserva atual'),h('b',money(r.current))),h('div',h('small','Depois da retirada'),h('b',money(r.after))),h('div',h('small','Cobertura'),h('b',r.avgSpend>0?`${r.monthsBefore.toFixed(1)} → ${r.monthsAfter.toFixed(1)} meses`:'Sem histórico suficiente'))),h('p.hint',v>r.current?'O valor informado é maior que a reserva cadastrada; a simulação limita o saldo final a zero.':reason.value?`Motivo informado: ${reason.value}. Esta é apenas uma simulação.`:'Escolha o motivo para deixar a decisão mais consciente.'))};
  return h('section.reserve-smart',h('div.card-head',h('div',h('small.eyebrow-soft','RESERVA INTELIGENTE'),h('h3','Antes de mexer na reserva')),h('span.control-score ok',money(base.reserve.current))),h('p.muted.sm','Veja quanto de proteção permanece antes de decidir. O Bivvo não movimenta sua reserva.'),h('div.reserve-form',amount,reason,h('button.btn',{type:'button',onclick:simulate},'Simular retirada')),out);
}

export function openWhatIf(){
  const behavior=behaviorAnalysis(), recovery=recoveryAnalysis();
  const pct=h('input.input',{type:'number',min:'0',max:'100',step:'5',value:'20'}), incomeOut=h('div.whatif-result');
  const paintIncome=()=>{const r=whatIfIncomeDrop(Number(pct.value)||0);incomeOut.replaceChildren(h('p',r.current>0?`Se a próxima entrada cair ${r.percent}%, ela passaria de ${money(r.current)} para ${money(r.after)}.`:'O Bivvo não encontrou valor suficiente para simular a próxima entrada.'),r.current>0?h('b',r.freeAfter<0?`Nesse cenário faltariam ${money(Math.abs(r.freeAfter))} antes da próxima entrada.`:`A margem calculada ficaria em ${money(r.freeAfter)}.`):null,h('small','Simulação somente leitura. Nenhuma renda ou lançamento é alterado.'));};
  pct.oninput=paintIncome; paintIncome();
  return openSheet({label:'Central E se?',wide:true,content:h('div.copilot-screen',
    h('section.copilot-hero.ok',h('small.eyebrow-soft','CENTRAL E SE?'),h('h2','Teste decisões sem mexer nos seus dados'),h('p','Escolha um cenário. O Bivvo usa os mesmos motores financeiros do app e não grava o resultado.')),
    h('div.quick-action-grid',
      h('button.btn',{type:'button',onclick:()=>openSimulator()},'🛒 E se eu comprar isso?'),
      h('button.btn',{type:'button',onclick:()=>openDecisionAssistant()},'💰 E se eu priorizar outra conta?'),
      h('button.btn',{type:'button',onclick:()=>openCopilot()},'🛡️ E se eu usar a reserva?')),
    h('section.behavior-panel',h('small.eyebrow-soft','E SE EU PARAR DE PARCELAR HOJE?'),h('h3',behavior.stopToday.lastWithLoad?`A carga cadastrada diminui até ${monthLabel(behavior.stopToday.lastWithLoad.ym)}`:'Sem parcelas futuras para simular'),behavior.installments.timeline.some(x=>x.value>0)?h('div.installment-timeline',behavior.installments.timeline.map(x=>h('div',h('small',monthLabel(x.ym)),h('b',money(x.value))))):null,h('p.hint','Considera apenas parcelas já cadastradas e pressupõe nenhuma nova compra parcelada.')),
    h('section.reserve-smart',h('small.eyebrow-soft','E SE MINHA PRÓXIMA RENDA CAIR?'),h('div.reserve-form',pct,h('span.muted.sm','% de redução')),incomeOut),
    h('p.hint',`Plano de recuperação atual: ${recovery.progress}% concluído. A Central E se? não altera esse progresso.`)
  )});
}

export function openCopilot({sos=false}={}){
  const c=copilotSnapshot(), sp=c.sp, detector=financialControlDetector(), survival=survivalPlan(), behavior=behaviorAnalysis(), recovery=recoveryAnalysis(), motivation=motivationAnalysis(), brief=todayBrief();
  const status=c.level==='danger'?'🔴 Ação necessária':c.level==='warn'?'🟡 Atenção':'🟢 Sob controle';
  const risk=c.urgent?h('div.copilot-risk',h('small','PRÓXIMO PONTO DE ATENÇÃO'),h('b',c.urgent.label),h('span',`${money(c.urgent.value)} · ${shortDate(c.urgent.date)}`)):h('div.copilot-risk',h('small','PRÓXIMO PONTO DE ATENÇÃO'),h('b','Nenhum compromisso pendente na janela analisada'));
  const content=h('div.copilot-screen',
    h('section.copilot-hero.'+c.level,h('small.eyebrow-soft',sos?'SOS FINANCEIRO':'BIVVO COPILOTO'),h('h2',sos?'Vamos organizar o que dá para pagar agora.':'O que você precisa saber hoje'),h('span.copilot-status',status),h('p',c.headline)),
    h('div.copilot-numbers',h('div',h('small','Saldo atual'),h('b',money(sp.balance))),h('div',h('small','Já comprometido'),h('b',money(sp.commitments+sp.saveLeft))),h('div.emphasis',h('small','Realmente livre'),h('b',money(c.free))),h('div',h('small','Limite por dia'),h('b',money(c.perDay)))),
    h('p.copilot-until',`Até ${shortDate(sp.until)} · ${c.days} dia${c.days===1?'':'s'} considerados.`),risk,
    h('section.copilot-survival',
      h('div.card-head',h('div',h('small.eyebrow-soft','ATÉ A PRÓXIMA ENTRADA'),h('h3','Plano para atravessar o período')),h('span.survival-daily',money(survival.daily)+'/dia')),
      h('p.muted.sm',`Próxima referência: ${shortDate(survival.next.date)} · ${survival.sourceLabel}. O limite é recalculado conforme seus lançamentos mudam.`),
      h('div.protected-grid',
        h('div',h('small','🏠 Contas protegidas'),h('b',money(survival.protectedMoney.bills))),
        h('div',h('small','💳 Faturas protegidas'),h('b',money(survival.protectedMoney.cards))),
        h('div',h('small','🛡️ Meta de segurança'),h('b',money(survival.protectedMoney.safety))),
        h('div.free',h('small','💚 Realmente livre'),h('b',money(Math.max(0,survival.protectedMoney.free))))),
      h('p.hint',`Saldo ${money(survival.protectedMoney.balance)} · protegido ${money(survival.protectedMoney.protected)}. O saldo continua visível; o valor livre é o que sobra depois dos compromissos considerados.`)),
    survival.risk?h('section.negative-prevention.danger',h('small.eyebrow-soft','PREVENÇÃO DE SALDO NEGATIVO'),h('h3',`🔴 Risco em ${shortDate(survival.risk.date)}`),h('p',`A projeção chega a ${money(survival.risk.balance)}. Para criar margem até essa data, o valor de referência é ${money(survival.deficit)}.`),survival.knownEvents.length?h('div.risk-events',survival.knownEvents.map(e=>h('div',h('span',e.label),h('b',(e.type==='income'?'+ ':'− ')+money(e.value))))):null,h('b',survival.action),survival.estimated?h('small','A projeção inclui uma estimativa de gastos variáveis baseada no histórico; não é uma garantia do saldo futuro.'):null):h('section.negative-prevention.ok',h('small.eyebrow-soft','PREVENÇÃO DE SALDO NEGATIVO'),h('h3','🟢 Nenhuma quebra de caixa projetada'),h('p','Com os dados cadastrados e a estimativa atual, a previsão não cruza zero nos próximos 45 dias.')),
    h('section.copilot-action',h('small','AÇÃO RECOMENDADA AGORA'),h('b',brief.primary.title),h('p.muted.sm',brief.primary.detail),h('div.btn-row',h('button.btn.primary',{type:'button',onclick:()=>openDecisionAssistant()},sos?'Montar ordem de pagamento':'O que pago primeiro?'),h('button.btn',{type:'button',onclick:()=>openSimulator()},'Posso comprar?'))),
    h('section.behavior-panel',h('div.card-head',h('div',h('small.eyebrow-soft','AÇÕES RÁPIDAS'),h('h3','O que você quer decidir agora?')),h('span.control-score '+(brief.score>=70?'ok':'attention'),`Score ${brief.score}`)),h('div.quick-action-grid',h('button.btn',{type:'button',onclick:()=>openDecisionAssistant()},'💰 O que pago primeiro?'),h('button.btn',{type:'button',onclick:()=>openSimulator()},'🛒 Posso comprar?'),h('button.btn',{type:'button',onclick:()=>openCopilot({sos:true})},'🚨 Meu dinheiro não vai dar'),h('button.btn',{type:'button',onclick:()=>openWhatIf()},'🔮 Central E se?'))),
    h('section.copilot-detector',h('div.card-head',h('div',h('small.eyebrow-soft','DETECTOR DE DESCONTROLE'),h('h3',detector.alerts.length?'O que está puxando você para o risco':'Nenhum sinal forte de descontrole agora')),h('span.control-score '+detector.level,detector.alerts.length?`${detector.score}/100`:'OK')),detector.alerts.length?detector.alerts.slice(0,4).map(a=>h('div.control-alert '+a.severity,h('span.control-dot'),h('div',h('b',a.title),h('small',a.why),h('p',a.action)))):h('p.muted.sm','Continue registrando os gastos. O Bivvo observa ritmo, compromissos, faturas e parcelamentos sem enviar seu extrato.')),
    h('section.behavior-panel',
      h('div.card-head',h('div',h('small.eyebrow-soft','COMPORTAMENTO'),h('h3','Onde o dinheiro pode estar escapando')),behavior.leak.relevant?h('span.control-score attention','ATENÇÃO'):h('span.control-score ok','OK')),
      behavior.leak.relevant?h('div.behavior-callout',h('b',`${behavior.leak.count} pequenos gastos somaram ${money(behavior.leak.total)}`),h('p',`Eles representam ${Math.round(behavior.leak.share*100)}% dos gastos do mês. Isso não significa desperdício; é um ponto útil para revisar.`),behavior.leak.categories.length?h('small',`Mais presentes: ${behavior.leak.categories.map(x=>`${x.cat} (${money(x.value)})`).join(' · ')}`):null):h('p.muted.sm','Nenhum conjunto de pequenos gastos ganhou peso relevante neste mês.'),
      h('div.behavior-split',
        h('div',h('small.eyebrow-soft','ASSINATURAS E RECORRÊNCIAS'),h('b',money(behavior.subscriptions.monthly)+'/mês'),h('span',`${money(behavior.subscriptions.annual)} em 12 meses, mantendo o padrão atual.`),behavior.subscriptions.detected.length?h('small',`${behavior.subscriptions.detected.length} recorrência(s) provável(is) percebida(s) no histórico; revise antes de tratar como assinatura.`):h('small','Somente cadastros explícitos ou padrões fortes entram nesta visão.')),
        h('div',h('small.eyebrow-soft','BOLA DE NEVE DO CARTÃO'),h('b',`${behavior.installments.activeCount} parcelamento(s) ativo(s)`),h('span',`${money(behavior.installments.futureTotal)} ainda aparecem nas parcelas futuras cadastradas.`),behavior.installments.firstLower?h('small',`A carga mensal cai cerca de ${money(behavior.installments.released)} em ${monthLabel(behavior.installments.firstLower.ym)} se não surgirem novas parcelas.`):h('small','A projeção usa somente parcelas já cadastradas.'))),
      behavior.installments.timeline.some(x=>x.value>0)?h('div.installment-timeline',behavior.installments.timeline.map(x=>h('div',h('small',monthLabel(x.ym)),h('b',money(x.value))))):null,
      h('div.stop-today',h('b','E se eu parar de parcelar hoje?'),h('p',behavior.stopToday.lastWithLoad?`Sem novos parcelamentos, os compromissos já cadastrados vão diminuindo até ${monthLabel(behavior.stopToday.lastWithLoad.ym)} nesta janela. Isso é uma simulação, não uma previsão do seu comportamento.`:'Não há parcelas futuras cadastradas para simular agora.'))),
    h('section.recovery-panel',
      h('div.card-head',h('div',h('small.eyebrow-soft','MISSÃO SAIR DO VERMELHO'),h('h3','Seu plano de recuperação')),h('span.control-score '+(recovery.progress>=70?'ok':recovery.progress>=35?'attention':'high'),`${recovery.progress}%`)),
      h('p.muted.sm',`${recovery.done} de ${recovery.total} etapas concluídas. Próxima prioridade: ${recovery.current.title}.`),
      recovery.steps.map((x,i)=>h('div.copilot-step'+(x.done?'.done':''),h('span',x.done?'✓':String(i+1)),h('div',h('b',x.title),h('small',x.text))))),
    h('section.debt-plan',
      h('div.card-head',h('div',h('small.eyebrow-soft','PLANO DE QUITAÇÃO'),h('h3','Compare a ordem das pendências')),h('span.control-score '+(recovery.debts.rows.length?'attention':'ok'),recovery.debts.rows.length?`${recovery.debts.rows.length} pendência(s)`:'OK')),
      recovery.debts.rows.length?h('div.debt-strategies',
        h('div',h('b','Menor impacto conhecido'),h('p','Prioriza essencialidade, vencimento e risco de atraso usando o motor de decisão do Bivvo.'),recovery.debts.lowerImpact.slice(0,3).map((d,i)=>h('small',`${i+1}. ${d.label} · ${money(d.amount)}`))),
        h('div',h('b','Pequenas vitórias'),h('p','Prioriza os menores valores para reduzir a quantidade de pendências mais rapidamente.'),recovery.debts.smallest.slice(0,3).map((d,i)=>h('small',`${i+1}. ${d.label} · ${money(d.amount)}`)))):h('p.muted.sm','Nenhuma fatura pendente ou compromisso vencido foi encontrado para montar uma ordem de quitação.'),
      recovery.debts.missingInterest?h('p.hint','O Bivvo não possui a taxa de juros dessas pendências. Por isso, “menor impacto” não significa “menor custo de juros”. A ordem pode mudar quando taxas reais estiverem cadastradas.'):null),
    reserveSimulator(recovery),
    h('section.motivation-panel',
      h('div.card-head',h('div',h('small.eyebrow-soft','VITÓRIAS FINANCEIRAS'),h('h3',motivation.victories.length?'O que você já está fazendo bem':'As vitórias aparecem conforme houver histórico')),h('span.control-score ok',`${motivation.victories.length} vitória${motivation.victories.length===1?'':'s'}`)),
      motivation.victories.length?h('div.victory-list',motivation.victories.map(v=>h('div.victory-item',h('span',v.icon),h('div',h('b',v.title),h('small',v.detail))))):h('p.muted.sm','Continue registrando entradas, gastos e reserva. O Bivvo só mostra conquistas que consegue comprovar pelos seus dados.'),
      h('div.streak-box',h('small.eyebrow-soft','SEQUÊNCIAS POSITIVAS'),motivation.streaks.length?motivation.streaks.map(x=>h('div.streak-item',h('b',`${x.icon} ${x.label}`),h('small',x.detail))):h('p.muted.sm','Ainda não há uma sequência mensal comprovável. Se uma sequência for interrompida, ela apenas recomeça — sem punição.'))),
    h('section.score-panel',
      h('div.score-head',h('div',h('small.eyebrow-soft','BIVVO SCORE'),h('h3',`${motivation.score}/100`),h('b',motivation.level)),h('div.score-ring',{'style':`--score:${motivation.score}`},h('span',motivation.score))),
      h('p.hint','Índice pessoal de organização financeira do Bivvo. Não é score de crédito e não tem relação com Serasa, bancos ou bureaus de crédito.'),
      h('div.score-factors',motivation.factors.map(f=>h('div.score-factor',h('span',h('b',f.label),h('small',f.why)),h('strong',`${f.points}/${f.max}`)))),
      motivation.positives.length?h('div.score-note.good',h('b','O que está ajudando'),motivation.positives.map(x=>h('small',`+ ${x.label}: ${x.why}`))):null,
      h('div.score-note.improve',h('b',`Para avançar em direção a ${motivation.target}`),motivation.improve.map((x,i)=>h('small',`${i+1}. ${x.action}`)))),
    h('p.hint','O Copiloto usa os dados cadastrados no Bivvo e não movimenta dinheiro nem marca contas como pagas automaticamente.'));
  return openSheet({label:sos?'SOS financeiro':'Bivvo Copiloto',wide:true,content});
}
