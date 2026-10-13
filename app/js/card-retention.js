/* Bivvo 11.51 — tolerância de 15 dias para cartões excedentes após voltar ao Grátis. */
import * as store from './store.js';
import {getPlanInfo,getPlanLimits} from './plans.js';

export const FREE_CARD_GRACE_DAYS=15;
export const FREE_CARD_GRACE_MS=FREE_CARD_GRACE_DAYS*24*60*60*1000;
const POLICY_EFFECTIVE_AT=Date.parse('2026-10-07T19:00:00Z');
let timer=null;

const ms=v=>{const n=Date.parse(String(v||''));return Number.isFinite(n)?n:null;};
const iso=n=>new Date(n).toISOString();
const isTesterSource=s=>/^owner_test_/.test(String(s||''));
const cloneGrace=g=>g&&typeof g==='object'?{...g}:null;

function chooseKeepCard(s,meta){
  const wanted=String(meta?.keepCardId||'');
  return s.cards.find(c=>c.id===wanted)||s.cards[0]||null;
}
function clearTimer(){if(timer){clearTimeout(timer);timer=null;}}
function armTimer(expiresAt){
  clearTimer();
  const left=Math.max(0,ms(expiresAt)-Date.now());
  if(!Number.isFinite(left))return;
  timer=setTimeout(()=>{timer=null;reconcileFreeCardGrace().catch?.(()=>{});},Math.min(left+1200,2147480000));
}

export function getFreeCardGraceStatus(now=Date.now()){
  const s=store.getState(), info=getPlanInfo(), limit=getPlanLimits().cards;
  const meta=cloneGrace(s.profile?.cardLimitGrace);
  const excess=Math.max(0,(s.cards?.length||0)-1);
  if(limit!==1||excess<=0||!meta?.expiresAt)return {active:false,excess:0,testMode:false};
  const end=ms(meta.expiresAt), remainingMs=Math.max(0,(end||now)-now), keep=chooseKeepCard(s,meta);
  return {active:true,excess,testMode:!!meta.testMode,startedAt:meta.startedAt,expiresAt:meta.expiresAt,remainingMs,expired:remainingMs<=0,keepCardId:keep?.id||null,keepCardName:keep?.name||'',source:info.source||'default'};
}

export function formatFreeCardGrace(msLeft){
  const total=Math.max(0,Math.ceil(Number(msLeft)||0));
  if(total<=0)return '0h';
  const hours=Math.ceil(total/3600000),days=Math.floor(hours/24),rest=hours%24;
  return days>0?`${days}d ${String(rest).padStart(2,'0')}h`:`${hours}h`;
}

export function setFreeCardToKeep(cardId){
  const s=store.getState();
  if(!s.cards.some(c=>c.id===cardId))return false;
  store.commit(st=>{
    const g=st.profile?.cardLimitGrace;
    if(!g)return;
    st.profile.cardLimitGrace={...g,keepCardId:cardId};
  },{reason:'card-grace-keep'});
  return true;
}

export function reconcileFreeCardGrace({now=Date.now(),silent=false}={}){
  const s=store.getState(), info=getPlanInfo(), limit=getPlanLimits().cards, cards=s.cards||[];
  const current=cloneGrace(s.profile?.cardLimitGrace);
  if(limit===1&&store.activeFinanceProfile()==='company')return {active:false,deleted:0,deferred:true};
  const excess=Math.max(0,cards.length-1);

  if(limit!==1||excess<=0){
    clearTimer();
    if(current)store.commit(st=>{delete st.profile.cardLimitGrace;},{reason:'card-grace-clear',silent});
    return {active:false,deleted:0};
  }

  const testMode=isTesterSource(info.source);
  let meta=current;
  if(!meta){
    const lastPaid=ms(info.lastPaidExpiresAt);
    // Política nova: ninguém perde cartão imediatamente por um downgrade antigo ocorrido
    // antes de esta regra existir. Para downgrades futuros, o prazo começa no fim do acesso pago.
    const anchor=testMode?now:Math.max(lastPaid||now,POLICY_EFFECTIVE_AT);
    const keep=cards[0];
    meta={startedAt:iso(anchor),expiresAt:iso(anchor+FREE_CARD_GRACE_MS),keepCardId:keep?.id||null,testMode};
    store.commit(st=>{st.profile.cardLimitGrace=meta;},{reason:'card-grace-start',silent});
  }else if(meta.testMode!==testMode){
    meta={...meta,testMode};
    store.commit(st=>{st.profile.cardLimitGrace=meta;},{reason:'card-grace-mode',silent:true});
  }

  const end=ms(meta.expiresAt)||now+FREE_CARD_GRACE_MS;
  if(testMode){
    // A conta interna pode simular o Grátis sem risco de apagar dados de homologação.
    if(end<=now){
      meta={...meta,startedAt:iso(now),expiresAt:iso(now+FREE_CARD_GRACE_MS),testMode:true};
      store.commit(st=>{st.profile.cardLimitGrace=meta;},{reason:'card-grace-test-reset',silent:true});
    }
    armTimer(meta.expiresAt);
    return {...getFreeCardGraceStatus(now),deleted:0};
  }

  if(end>now){armTimer(meta.expiresAt);return {...getFreeCardGraceStatus(now),deleted:0};}

  clearTimer();
  let deleted=0,keptName='';
  store.commit(st=>{
    const g=st.profile?.cardLimitGrace||meta;
    const keep=chooseKeepCard(st,g);
    keptName=keep?.name||'';
    const remove=st.cards.filter(c=>c.id!==keep?.id);
    deleted=remove.length;
    const deletedAt=iso(now);
    for(const c of remove){st.deletedRecords[c.id]=deletedAt;}
    st.cards=keep?[keep]:[];
    delete st.profile.cardLimitGrace;
  },{reason:'card-grace-expired',silent});
  return {active:false,deleted,keptName};
}
