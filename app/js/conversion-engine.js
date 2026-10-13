/* Bivvo 11.17 — Motor de Conversão e Receita.
   Regras contextuais, cooldown e frequency cap sem usar situação financeira como pressão. */
const KEY='bivvo_conversion_v1';
const DAY=86400000;
const PLAN_PRICE={plus:19.9,capital:24.9,pro:29.9,couple:29.9,entrepreneur:34.9,family:49.99};
const RULES={
  scan:{trigger:'premium_feature_attempt',plan:'plus',title:'Mais leituras inteligentes',message:'Use mais leituras de comprovantes por mês sem perder a opção de digitar manualmente.',benefit:'Mais praticidade para registrar gastos.'},
  cards:{trigger:'premium_feature_attempt',plan:'plus',title:'Mais cartões no Bivvo',message:'Organize mais cartões sem esconder os que você já cadastrou.',benefit:'Tudo em uma visão só.'},
  forecast30:{trigger:'premium_feature_attempt',plan:'plus',title:'Veja os próximos 30 dias',message:'Amplie sua previsão para antecipar compromissos e decisões.',benefit:'Mais visão do que vem pela frente.'},
  futureCards12:{trigger:'premium_feature_attempt',plan:'plus',title:'Veja até 12 meses de parcelas',message:'Amplie a visão das parcelas futuras do cartão.',benefit:'Entenda o comprometimento futuro.'},
  assistant:{trigger:'premium_feature_attempt',plan:'pro',title:'Bivvo IA para suas decisões',message:'Use os cálculos do Bivvo para tirar dúvidas e simular decisões.',benefit:'Análises mais completas no seu contexto.'},
  advancedForecast:{trigger:'premium_feature_attempt',plan:'pro',title:'Veja os próximos 90 dias',message:'Amplie sua previsão para planejar com mais antecedência.',benefit:'Mais horizonte para decidir.'},
  advancedSimulator:{trigger:'premium_feature_attempt',plan:'pro',title:'Compare cenários antes de gastar',message:'Analise impactos futuros antes de confirmar uma decisão.',benefit:'Decida com mais contexto.'},
  couple:{trigger:'couple_interest',plan:'couple',title:'Organize o dinheiro a dois',message:'Use um espaço compartilhado para o casal sem abrir o financeiro pessoal.',benefit:'Casa e objetivos em conjunto.'},
  company:{trigger:'company_interest',plan:'entrepreneur',title:'Separe seu negócio do pessoal',message:'Use caixa, faturamento, custos e obrigações em um ambiente próprio.',benefit:'Visão de dono sem misturar PF e PJ.'},
  loans:{trigger:'capital_interest',plan:'capital',title:'Gerencie sua carteira de empréstimos',message:'Acompanhe principal, juros, vencimentos e pagamentos.',benefit:'Controle do que saiu e do que precisa voltar.'},
  family:{trigger:'family_interest',plan:'family',title:'Organize dinheiro em família',message:'Crie um espaço para até 4 pessoas com privacidade por padrão.',benefit:'Colaboração sem misturar tudo.'}
};
function read(){try{return JSON.parse(localStorage.getItem(KEY)||'{}')||{}}catch{return{}}}
function write(v){try{localStorage.setItem(KEY,JSON.stringify(v))}catch{}}
function now(){return Date.now()}
export function getConversionOffer({feature='assistant',placement='feature',explicit=false,currentPlan='free'}={}){
  const r=RULES[feature]; if(!r)return{shouldShow:false};
  const s=read(), id=`${feature}:${placement}`, last=s.lastClosed?.[id]||0;
  const sessionKey='bivvo_conversion_session_count'; let sessionCount=0; try{sessionCount=Number(sessionStorage.getItem(sessionKey)||0)}catch{}
  const cooldown=explicit?0:3*DAY;
  if(!explicit && (now()-last<cooldown || sessionCount>=1)) return{shouldShow:false,reason:'cooldown'};
  return{shouldShow:true,feature,placement,explicit,trigger:r.trigger,recommendedPlan:r.plan,title:r.title,message:r.message,benefit:r.benefit,price:PLAN_PRICE[r.plan],priority:explicit?'high':'normal',cooldown};
}
export function markConversionShown(offer){if(!offer?.shouldShow)return;try{const k='bivvo_conversion_session_count';sessionStorage.setItem(k,String(Number(sessionStorage.getItem(k)||0)+1))}catch{} const s=read();s.lastShown={...(s.lastShown||{}),[`${offer.feature}:${offer.placement}`]:now()};write(s)}
export function markConversionClosed(offer){if(!offer)return;const s=read();s.lastClosed={...(s.lastClosed||{}),[`${offer.feature}:${offer.placement}`]:now()};write(s)}
export function clearConversionState(){try{localStorage.removeItem(KEY);sessionStorage.removeItem('bivvo_conversion_session_count')}catch{}}
export const CONVERSION_RULES=RULES;
