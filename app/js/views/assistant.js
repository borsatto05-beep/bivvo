/* Bivvo 11.49 — tela do Bivvo IA: respostas completas em todos os planos. */
import { h } from '../util.js';
import { canUseFeature, getAiLevel } from '../plans.js';
import { openPaywall } from './pro.js';
import { toast } from '../ui.js';
import { track } from '../analytics.js';
import { toolResults, localAnswer, elaborateLocalAnswer, rayX, askAI, aiUsage, suggestedQuestions } from '../assistant.js?v=11.64.0';
import { openDecisionAssistant } from './decision.js';
import { openCopilot, openWhatIf } from './copilot.js';
import { openSimulator } from './simulator.js';

const CONSENT='bivvo_ai_consent_v1', CRISIS_CTX='bivvo_recovery_crisis_context_v1';
function hasConsent(){ try{return localStorage.getItem(CONSENT)==='1';}catch{return false;} }
function consent(){ try{localStorage.setItem(CONSENT,'1');}catch{} }
function welcome(tools,crisis){
  if(crisis) return `Você veio do modo "Meu dinheiro não vai dar". Vou manter o foco no essencial, no que vence primeiro e em uma saída possível sem piorar o caixa.`;
  const stage=tools.direction?.stage;
  if(stage==='CRITICAL'||stage==='RECOVERY') return 'Pode perguntar como sair do aperto, o que priorizar, como lidar com cartão, dívidas e como fazer o dinheiro durar. Vou usar seus números para apontar uma direção prática.';
  if(stage==='STABLE'||stage==='GROWTH') return 'Seu cenário permite olhar além do aperto. Posso ajudar a guardar melhor, avaliar sua reserva e organizar o começo dos investimentos sem misturar dinheiro de emergência com objetivos de longo prazo.';
  return 'Pode tirar dúvidas reais sobre seu dinheiro. Eu uso os cálculos do Bivvo para explicar o cenário, apontar o próximo passo e mostrar quando faz sentido guardar ou começar a investir.';
}

export function renderAssistant(root) {
  const allowed=canUseFeature('assistant'), tools=toolResults(), usage=aiUsage(), aiLevel=getAiLevel();
  let crisis=null; try{crisis=JSON.parse(sessionStorage.getItem(CRISIS_CTX)||'null'); if(crisis && Date.now()-Number(crisis.at||0)>30*60*1000) crisis=null;}catch{}
  root.append(h('div.page-head', h('div', h('p.eyebrow-soft','BIVVO IA'), h('h2.h2','Pergunte o que você realmente quer resolver'), h('p.muted',allowed?`${aiLevel.label} · ${aiLevel.short}. Respostas baseadas no seu cenário; o extrato bruto não é enviado para a IA.`:'Do aperto ao investimento: respostas baseadas no seu cenário. O extrato bruto não é enviado para a IA.'))));
  if (!allowed) { root.append(h('section.card.ai-lock', h('h3','Seu copiloto financeiro'), h('p.muted','O Bivvo IA está disponível nos planos pagos. Ele usa os cálculos do app para explicar seu cenário, ajudar a organizar prioridades e orientar seus próximos passos sem enviar seu extrato bruto.'), h('button.btn.primary',{type:'button',onclick:()=>openPaywall({feature:'assistant',onUnlocked:()=>{root.innerHTML='';renderAssistant(root);}})},'Experimentar Bivvo IA'))); return; }

  const chat=h('div.ai-chat');
  const input=h('textarea.ai-input',{rows:3,maxlength:500,placeholder:'Ex.: Estou apertado. Por onde começo? Ou: tenho sobra, como começo a investir?'});
  const send=h('button.btn.primary',{type:'button'},'Perguntar');
  const add=(who,title,text)=>{
    const box=h('div.ai-msg.'+who, title?h('b',title):null);
    String(text||'').split(/\n+/).map(x=>x.trim()).filter(Boolean).forEach(line=>box.append(h('p',line)));
    chat.append(box);
  };
  add('bot',crisis?'Plano de recuperação':'Bivvo IA',welcome(tools,crisis));
  const run=async q=>{
    q=String(q||'').trim(); if(!q)return; add('me',null,q); input.value='';
    const nq=q.normalize('NFD').replace(/[\u0300-\u036f]/g,'');
    if(/o que preciso saber|sos financeiro|vida financeira.*ordem|estou descontrolad|dinheiro.*nao vai dar|monte.*plano|montar.*plano/i.test(nq)){ add('bot','Bivvo Copiloto','Vou transformar seus números em uma ação prática para hoje.'); openCopilot({sos:/sos|nao vai dar|descontrolad/i.test(nq)}); track('assistant_used',{source:'copilot'}); return; }
    if(/posso comprar|devo comprar|comprar agora/i.test(nq)){ add('bot','Posso comprar?','Vou simular o impacto antes de você decidir.'); openSimulator(); track('assistant_used',{source:'purchase'}); return; }
    if(/e se|simular.*cenario|parar de parcelar|renda cair|usar.*reserva/i.test(nq)){ add('bot','Central E se?','Vou abrir simulações locais que não alteram seus dados.'); openWhatIf(); track('assistant_used',{source:'whatif'}); return; }
    if(/o que.*pago.*primeiro|nao tenho dinheiro.*pagar tudo|pago.*fatura.*conta|organize.*pagamentos/i.test(nq)){ add('bot','Decisão financeira','Vou comparar seus compromissos, vencimentos e saldo sem alterar nenhum lançamento.'); openDecisionAssistant(); track('assistant_used',{source:'decision'}); return; }
    const local=localAnswer(q,tools); if(local){ const detailed=elaborateLocalAnswer(local,tools); add('bot',detailed.title,detailed.text); track('assistant_used',{source:'local',stage:tools.direction?.stage}); return; }
    if(!hasConsent()){
      const ok=confirm('Para responder esta pergunta, o Bivvo enviará somente números agregados e resultados calculados (como saldo livre, previsão, reserva e estágio financeiro) ao serviço de IA. Descrições do extrato, nomes de compras e o extrato bruto não são enviados. Continuar?');
      if(!ok){add('bot','Privacidade','Tudo bem. Você pode usar as perguntas rápidas, que são respondidas somente no aparelho.');return;} consent();
    }
    send.disabled=true; send.textContent='Pensando…';
    try{ const r=await askAI(q,tools); add('bot',r.title||'Bivvo IA',r.answer); track('assistant_used',{source:'ai',stage:tools.direction?.stage,verified:r.verified!==false}); }
    catch(e){ if(e.code==='quota') openPaywall({feature:'assistant',usage:e.usage,onUnlocked:()=>{root.innerHTML='';renderAssistant(root);}}); else toast(e.message); add('bot','Não consegui responder',e.message); }
    finally{send.disabled=false;send.textContent='Perguntar';}
  };
  send.onclick=()=>run(input.value); input.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();run(input.value);}});
  const quick=suggestedQuestions(tools);
  root.append(h('section.card.ai-ray', h('div.card-head',h('h3','Raio-X financeiro'),h('span.muted.sm',tools.direction?.stageLabel||'Agora')), h('div.ai-ray-list',rayX(tools).map(x=>h('p',x)))));
  root.append(h('section.card.ai-box', chat, h('div.ai-quick',quick.map(q=>h('button.chip',{type:'button',onclick:()=>run(q)},q))), h('div.ai-compose',input,send), h('p.hint',`Perguntas abertas com IA: ${usage.remaining === Infinity ? 'sem limite' : usage.remaining+' restantes neste mês'}. Perguntas rápidas locais não gastam cota.`)));
}
