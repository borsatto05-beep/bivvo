/* Bivvo 11.47 — planos por perfil: pessoal, casal, família, negócio e capital. */
import { h, money, shortDate } from '../util.js';
import * as store from '../store.js';
import { openSheet, toast, confirmSheet } from '../ui.js';
import { PRICES, PLAN_CATALOG, getPlanInfo, PLAN_LIMITS, refreshPlan } from '../plans.js';
import { track } from '../analytics.js';
import { adminTrack } from '../admin-analytics.js';
import { getConversionOffer, markConversionShown, markConversionClosed } from '../conversion-engine.js';
import { startSubscription, syncBilling, cancelSubscription, pauseSubscription, reactivateSubscription, currentSubscription, startProTrial } from '../billing.js';

const FEATURE_COPY = {
  loans:()=>({title:'Organize sua carteira com o Bivvo Capital',text:'Acompanhe principal, juros, vencimentos, pagamentos e atrasos sem misturar empréstimo com renda comum.'}),
  company:()=>({title:'Separe PF e negócio com o Bivvo Empreendedor',text:'Tenha um ambiente empresarial com caixa, faturamento, custos, impostos, contas a receber e indicadores do negócio.'}),
  couple:()=>({title:'Organize a vida a dois com o Bivvo Casal',text:'Compartilhe somente o que pertence aos dois, acompanhe quem pagou e escolha divisão 50/50 ou proporcional à renda.'}),
  family:()=>({title:'Organize a casa com o Bivvo Família',text:'Crie um espaço compartilhado para até quatro pessoas, com privacidade por padrão e módulos extras incluídos.'}),
  scan:u=>({title:`Você usou suas ${u?.limit ?? PLAN_LIMITS.free.scansPerMonth} leituras inteligentes deste mês.`,text:'Você pode continuar digitando normalmente ou escolher um plano com mais leituras.'}),
  quick:u=>({title:`Você usou suas ${u?.limit ?? PLAN_LIMITS.free.quickCapturePerMonth} anotações rápidas grátis deste mês.`,text:'Texto e voz ficam liberados sem essa trava nos planos pagos. Você também pode continuar lançando manualmente pelo formulário normal.'}),
  cards:()=>({title:'Você chegou ao limite de cartões do Grátis.',text:'O Grátis mantém 1 cartão. Se você voltar de um plano pago com cartões extras, eles ficam disponíveis por 15 dias para você renovar ou escolher qual cartão manter; depois, apenas os excedentes são removidos. Qualquer plano pago libera cartões ilimitados.'}),
  assistant:()=>({title:'Use o Bivvo IA nas suas decisões',text:'Tire dúvidas usando os cálculos do seu Bivvo, simule decisões e entenda o impacto no mês.'}),
  forecast30:()=>({title:'Quer enxergar os próximos 30 dias?',text:'Os planos pagos ampliam a previsão para ajudar a antecipar períodos apertados.'}),
  advancedForecast:()=>({title:'Quer enxergar os próximos 90 dias?',text:'Pro, Empreendedor e Família liberam a previsão estendida.'}),
  advancedSimulator:()=>({title:'Quer analisar uma compra com mais profundidade?',text:'Pro, Empreendedor e Família comparam cenários e impacto futuro.'}),
  futureCards12:()=>({title:'Quer ver até 12 meses de parcelas futuras?',text:'Qualquer plano pago amplia a visão do comprometimento do cartão.'})
};
const recommendationFor=source=>({
  plus:'plus',pro:'pro',capital:'capital',entrepreneur:'entrepreneur',loans:'capital',company:'entrepreneur',couple:'couple',family:'family',advancedForecast:'pro',advancedSimulator:'pro',assistant:'pro',scan:'plus',quick:'plus',cards:'plus',forecast30:'plus',futureCards12:'plus'
}[source]||'pro');

export function openPaywall({ feature='scan', usage, onUnlocked, placement='feature', explicit=true }={}) {
  const offer=getConversionOffer({feature,placement,explicit,currentPlan:getPlanInfo().plan});
  if(!offer.shouldShow&&!explicit)return null;
  if(offer.shouldShow){markConversionShown(offer);track('conversion_opportunity_shown',{feature,placement,trigger:offer.trigger,plan:offer.recommendedPlan});}
  const copy=(FEATURE_COPY[feature]||FEATURE_COPY.scan)(usage);
  const recommended=offer.recommendedPlan||recommendationFor(feature);
  track('paywall_viewed',{feature,placement,trigger:offer.trigger||'premium_feature_attempt',plan:recommended});
  adminTrack('paywall_viewed','paywall_'+feature).catch(()=>{});
  const info=getPlanInfo(),canTrial=info.plan==='free';
  let sheet;
  const startTrial=async e=>{
    track('conversion_opportunity_clicked',{feature,placement,trigger:offer.trigger||'premium_feature_attempt',plan:'pro'});
    const b=e.currentTarget;b.disabled=true;const old=b.textContent;b.textContent='Ativando Pro…';
    try{const r=await startProTrial();track('trial_started',{source:feature,plan:'pro'});adminTrack('trial_started','paywall_'+feature).catch(()=>{});await refreshPlan();sheet.close();toast(r.message||'Bivvo Pro liberado por 7 dias.');if(typeof onUnlocked==='function')setTimeout(()=>onUnlocked(),80);}catch(err){b.disabled=false;b.textContent=old;toast(err.message||'Não foi possível iniciar o teste.');}
  };
  const footer=[h('button.btn.ghost',{type:'button',onclick:()=>{markConversionClosed(offer);track('paywall_closed',{feature,placement});sheet.close();}},'Agora não')];
  if(canTrial&&['assistant','advancedForecast','advancedSimulator','scan','quick','forecast30','cards','futureCards12'].includes(feature))footer.push(h('button.btn.primary',{type:'button',onclick:startTrial},'Experimentar Pro por 7 dias'));
  else footer.push(h('button.btn.primary',{type:'button',onclick:()=>{sheet.close();setTimeout(()=>openProScreen({source:feature}),150);}},'Ver plano indicado'));
  sheet=openSheet({title:copy.title,label:'Planos Bivvo',content:h('div.paywall',h('p.muted',copy.text),h('p.hint',`Plano indicado: ${PLAN_CATALOG.find(p=>p.key===recommended)?.title||'Pro'}.`),canTrial?h('p.hint','Teste Pro: 7 dias · sem cartão · sem cobrança automática ao final.'):null),footer});
  return sheet;
}

export function openProScreen({source='menu'}={}){
  track('pro_screen_viewed',{source});track('plans_viewed',{source});
  const info=getPlanInfo();const active=(info.plans||[]).some(p=>p!=='free');
  let interval='monthly';
  let screen;
  const pricingHost=h('div');
  const intervalLabel=h('p.plan-cycle-note');
  const monthlyBtn=h('button.plan-cycle-btn',{type:'button',onclick:()=>setIntervalChoice('monthly')},'Mensal');
  const annualBtn=h('button.plan-cycle-btn',{type:'button',onclick:()=>setIntervalChoice('annual')},'Anual · 2 meses grátis');
  const financeSpace=document.body.dataset.financeProfile||store.activeFinanceProfile();
  const contextual=['menu','voce','learning'].includes(source);
  const recommended=contextual?(financeSpace==='company'?'entrepreneur':financeSpace==='couple'?'couple':'plus'):recommendationFor(source);

  const subscribe=async(e,key)=>{
    const b=e.currentTarget;b.disabled=true;const old=b.textContent;b.textContent='Preparando checkout…';
    track('plan_selected',{plan:key,source,interval});
    const price=interval==='annual'?PRICES[key].annual:PRICES[key].monthly;
    const def=PLAN_CATALOG.find(x=>x.key===key);
    const ok=await confirmSheet({title:`Assinar Bivvo ${def?.title||key}?`,message:interval==='annual'?`${money(price)} por ano. Equivale a ${money(price/12)}/mês. Pagamento processado com segurança pelo Mercado Pago.`:`${money(price)} por mês, com cobrança recorrente pelo Mercado Pago. Você pode gerenciar ou cancelar a renovação pelo Bivvo.`,confirmLabel:'Ir para pagamento'});
    if(!ok){b.disabled=false;b.textContent=old;return;}
    try{track('checkout_started',{plan:key,source,interval});await startSubscription(key,interval);}catch(err){b.disabled=false;b.textContent=old;toast(err.message||'Não foi possível abrir o pagamento.');}
  };

  function renderPrices(){
    const cards=PLAN_CATALOG.map(def=>{
      const key=def.key,annual=interval==='annual',total=annual?PRICES[key].annual:PRICES[key].monthly,monthlyEq=PRICES[key].annual/12,saving=PRICES[key].monthly*12-PRICES[key].annual,current=(info.plans||[]).includes(key),isRecommended=key===recommended;
      return h('article.pro-price'+(isRecommended?'.recommended':''),
        isRecommended?h('span.plan-badge','INDICADO PARA VOCÊ'):null,
        h('span.plan-card-icon',{'aria-hidden':'true'},def.icon),h('small',def.audience),h('h3','Bivvo '+def.title),h('p.plan-card-short',def.short),
        h('div.plan-price-line',h('b',annual?money(monthlyEq):money(total)),h('span','/mês')),
        annual?h('small.plan-total',`${money(total)}/ano · economize ${money(saving)}`):h('small.plan-total','cobrança mensal'),
        h('ul.plan-card-features',def.bullets.map(x=>h('li','✓ '+x))),
        h('button.btn.primary.block',{type:'button',disabled:current,onclick:e=>subscribe(e,key)},current?'Seu plano atual':annual?`Assinar ${def.title} anual`:`Assinar ${def.title}`));
    });
    const focus=cards.filter((_,i)=>PLAN_CATALOG[i].key===recommended);
    const others=cards.filter((_,i)=>PLAN_CATALOG[i].key!==recommended);
    pricingHost.replaceChildren(h('div.pro-prices.orbit-plan-focus',focus),h('details.orbit-other-plans',h('summary','Ver os outros planos'),h('div.pro-prices',others)));
    intervalLabel.textContent=interval==='annual'?'No anual, o valor total equivale aproximadamente a 10 mensalidades e o acesso dura 12 meses.':'No mensal, a cobrança é renovada mês a mês.';
    monthlyBtn.classList.toggle('active',interval==='monthly');annualBtn.classList.toggle('active',interval==='annual');
  }
  function setIntervalChoice(next){interval=next;track('billing_interval_selected',{interval:next,source});renderPrices();}
  renderPrices();

  const sync=h('button.btn.ghost.block',{type:'button',onclick:async e=>{const b=e.currentTarget;b.disabled=true;b.textContent='Atualizando…';try{await syncBilling();await refreshPlan();toast('Assinatura atualizada.');b.textContent='Atualizado ✓';}catch(err){toast(err.message);b.textContent='Atualizar assinatura';b.disabled=false;}}},'Já paguei · atualizar assinatura');
  const trial=!active?h('button.btn.ghost.block',{type:'button',onclick:async e=>{const b=e.currentTarget;b.disabled=true;const old=b.textContent;b.textContent='Ativando teste…';try{const r=await startProTrial();track('trial_started',{source,plan:'pro'});await refreshPlan();toast(r.message||'Teste Pro ativado.');b.textContent='Pro liberado por 7 dias ✓';}catch(err){b.disabled=false;b.textContent=old;toast(err.message);}}},'Experimentar Pro por 7 dias · sem cartão'):null;
  const manage=active?h('button.btn.ghost.block',{type:'button',onclick:()=>openSubscriptionManager()},'Gerenciar minha assinatura'):null;
  screen=openSheet({label:'Planos Bivvo',wide:true,content:h('div.pro-screen',h('p.pro-kicker','Bivvo · PLANOS'),h('h2','Aprenda no seu ritmo. Amplie quando precisar.'),h('p.muted','As missões pessoais de educação financeira estão no Grátis. Os planos pagos ampliam automação, ferramentas e ambientes.'),!active?h('section.orbit-free-plan',h('b','Seu aprendizado pode começar no Grátis'),h('p','A Órbita pessoal, orçamento, metas e organização básica já fazem parte do seu ponto de partida.'),h('button.btn.ghost',{type:'button',onclick:()=>screen.close()},'Continuar com o Grátis')):null,active?h('p.pro-active',info.expiresAt==='infinity'?`Você está no ${info.name} vitalício.`:`Plano principal: ${info.name}.`):null,h('div.plan-cycle',monthlyBtn,annualBtn),intervalLabel,pricingHost,trial,manage,sync,h('div.checkout-trust',h('b','Pagamento seguro'),h('small','Processado pelo Mercado Pago. O Bivvo não armazena os dados do seu cartão.'),h('small','Bivvo Capital é uma ferramenta de organização de empréstimos particulares; o Bivvo não concede crédito.')))});
}

async function openSubscriptionManager() {
  try {
    const sub = await currentSubscription();
    if (!sub) return toast('Nenhuma assinatura encontrada.');
    const activeRenewal = sub.status === 'authorized';
    const paused = sub.status === 'paused';
    const statusText = activeRenewal ? 'Renovação automática ativa' : paused ? 'Assinatura pausada' : sub.status === 'cancelled' ? 'Renovação cancelada' : `Status: ${sub.status}`;
    const content = h('div.pro-screen', h('p.pro-kicker','MINHA ASSINATURA'), h('h2',getPlanInfo().name), h('p.muted',statusText),
      sub.next_payment_date ? h('p.hint', `${activeRenewal ? 'Próxima cobrança prevista' : 'Período informado'}: ${shortDate(String(sub.next_payment_date).slice(0,10))}`) : null,
      h('p.hint','Você pode cancelar sem obstáculos. Antes da confirmação final, o Bivvo mostra no máximo uma alternativa de pausa; se não quiser, o cancelamento segue normalmente.'));
    let sheet;
    let cancelReason = 'other';
    const doCancel = async b => {
      b.disabled=true; const old=b.textContent; b.textContent='Cancelando…';
      try {
        const r=await cancelSubscription();
        track('subscription_canceled',{plan:sub.plan,reason:cancelReason});
        track('cancellation_completed',{plan:sub.plan,reason:cancelReason});
        await refreshPlan(); sheet.close(); toast(r.message||'Renovação cancelada.');
      } catch(err){ b.disabled=false;b.textContent=old;toast(err.message||'Não foi possível cancelar.'); }
    };
    const showPauseOffer = () => {
      track('cancel_offer_viewed',{plan:sub.plan,reason:cancelReason});
      const offer = openSheet({
        title:'Antes de cancelar',
        content:h('div.pro-screen',
          h('h3','Quer só dar uma pausa?'),
          h('p.muted','Você pode pausar a renovação e reativar depois. É uma única alternativa, sem insistência.'),
          h('p.hint','Se preferir cancelar, seguimos normalmente. Seu acesso já pago é preservado conforme o período vigente.')
        ),
        footer:[
          h('button.btn.ghost',{type:'button',onclick:async e=>{const b=e.currentTarget;b.disabled=true;b.textContent='Pausando…';try{const r=await pauseSubscription();track('subscription_paused',{plan:sub.plan,reason:cancelReason});track('cancel_retained_pause',{plan:sub.plan,reason:cancelReason});await refreshPlan();offer.close();sheet.close();toast(r.message||'Assinatura pausada.');}catch(err){b.disabled=false;b.textContent='Pausar assinatura';toast(err.message);}}},'Pausar assinatura'),
          h('button.btn.danger',{type:'button',onclick:async e=>{offer.close(); if(await confirmSheet({title:'Cancelar renovação?',message:'Não haverá novas cobranças. O acesso já pago é preservado conforme o período vigente.',confirmLabel:'Confirmar cancelamento',danger:true})) await doCancel(e.currentTarget);}},'Continuar cancelamento')
        ]
      });
    };
    const cancelFlow = () => {
      track('cancel_flow_started',{plan:sub.plan});
      const reasons = [
        ['price','Está caro para mim'],
        ['low_use','Não estou usando'],
        ['missing_feature','Faltou um recurso'],
        ['technical','Tive problema técnico'],
        ['temporary','Quero parar por um tempo'],
        ['other','Outro motivo']
      ];
      let reasonSheet;
      const buttons = reasons.map(([reason,label])=>h('button.btn.ghost.block',{type:'button',onclick:()=>{cancelReason=reason;track('cancel_reason_selected',{plan:sub.plan,reason});reasonSheet.close();setTimeout(showPauseOffer,80);}},label));
      reasonSheet=openSheet({
        title:'Por que você quer cancelar?',
        content:h('div.pro-screen',h('p.muted','Sua resposta ajuda a melhorar o Bivvo. Não pedimos detalhes financeiros.'),...buttons),
        footer:[h('button.btn.ghost',{type:'button',onclick:()=>reasonSheet.close()},'Voltar')]
      });
    };
    const footer=[h('button.btn.ghost',{type:'button',onclick:()=>sheet.close()},'Fechar')];
    if (activeRenewal) footer.push(h('button.btn.danger',{type:'button',onclick:cancelFlow},'Cancelar renovação'));
    if (paused) footer.push(h('button.btn.primary',{type:'button',onclick:async e=>{const b=e.currentTarget;b.disabled=true;b.textContent='Reativando…';try{const r=await reactivateSubscription();track('subscription_reactivated',{plan:sub.plan});await refreshPlan();sheet.close();toast(r.message||'Assinatura reativada.');}catch(err){b.disabled=false;b.textContent='Reativar assinatura';toast(err.message);}}},'Reativar assinatura'));
    sheet=openSheet({label:'Minha assinatura',content,footer});
  } catch(e){ toast(e.message||'Não foi possível carregar sua assinatura.'); }
}
