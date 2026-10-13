/* Bivvo 11.49 — tela do Bivvo IA: respostas completas em todos os planos. */
import { h } from '../util.js';
import { assistantMessage } from './assistant-message.js';
import { canUseFeature, getAiLevel } from '../plans.js';
import { openPaywall } from './pro.js';
import { toast } from '../ui.js';
import { track } from '../analytics.js';
import { toolResults, localAnswer, elaborateLocalAnswer, rayX, askAI, aiUsage, suggestedQuestions } from '../assistant.js?v=11.85.0-gemini-fix2';

const CONSENT='bivvo_ai_consent_gemini_v2', CRISIS_CTX='bivvo_recovery_crisis_context_v1';
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
    const box=assistantMessage(who,title,text);
    chat.append(box);
  };
  add('bot',crisis?'Plano de recuperação':'Bivvo IA',welcome(tools,crisis));
  const run=async q=>{
    q=String(q||'').trim(); if(!q||send.disabled)return; add('me',null,q); input.value='';
    const currentTools=toolResults();
    const local=localAnswer(q,currentTools);
    if(local){const analysis=elaborateLocalAnswer(local,currentTools);add('bot','Análise interna · '+analysis.title,analysis.text);track('assistant_used',{source:'local',stage:currentTools.direction?.stage});return;}
    if(!hasConsent()){
      const ok=confirm('Para responder esta pergunta, o Bivvo enviará somente números agregados e resultados calculados (como saldo livre, previsão, reserva e estágio financeiro) ao Google Gemini, junto com sua pergunta. Descrições do extrato, nomes de compras e o extrato bruto não são enviados. Continuar?');
      if(!ok){add('bot','Privacidade','Tudo bem. Você pode continuar consultando os cálculos do app sem enviar perguntas ao Gemini.');return;} consent();
    }
    send.disabled=true; send.textContent='Pensando…';
    try{ const r=await askAI(q,currentTools); add('bot',r.provider==='gemini'?'Bivvo IA · Gemini':r.title||'Aviso do Bivvo',r.answer); track('assistant_used',{source:'ai',stage:tools.direction?.stage,verified:r.verified!==false}); }
    catch(e){ if(e.code==='quota') openPaywall({feature:'assistant',usage:e.usage,onUnlocked:()=>{root.innerHTML='';renderAssistant(root);}}); else toast(e.message); add('bot','Não consegui responder',e.message); }
    finally{send.disabled=false;send.textContent='Perguntar';}
  };
  send.onclick=()=>run(input.value); input.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();run(input.value);}});
  const quick=['Montar meu plano passo a passo',...suggestedQuestions(tools)];
  root.append(h('section.card.ai-ray', h('div.card-head',h('h3','Raio-X financeiro'),h('span.muted.sm',tools.direction?.stageLabel||'Agora')), h('div.ai-ray-list',rayX(tools).map(x=>h('p',x)))));
  root.append(h('section.card.ai-box', chat, h('div.ai-quick',quick.map(q=>h('button.chip',{type:'button',onclick:()=>run(q)},q))), h('div.ai-compose',input,send), h('p.hint',`Perguntas ao Gemini: ${usage.remaining === Infinity ? 'sem limite' : usage.remaining+' restantes neste mês'}. Análises internas são feitas no aparelho e não gastam cota do Gemini.`)));
}
