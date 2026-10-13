/* Fase 7 — telemetria técnica sem dados financeiros. Nunca deve impedir o app de abrir. */
import { VERSION } from './util.js';
import { adminTrack } from './admin-analytics.js';
import { featureOn } from './features.js';
const seen=new Map();
const sanitize=v=>String(v||'Erro desconhecido').replace(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g,'[email]').replace(/(bearer|token|jwt|password|senha)[=: ]+[^ ]+/ig,'$1=[redacted]').replace(/R\$\s*[\d.,]+/g,'[valor]').slice(0,180);
function send(type,message){if(!featureOn('clientErrorTracking'))return;const msg=sanitize(message),key=type+'|'+msg,now=Date.now();if(now-(seen.get(key)||0)<60000)return;seen.set(key,now);adminTrack('client_error',location.hash.replace(/^#\/?/,'').split('?')[0]||'landing',{error_type:type,error_message:msg,app_version:VERSION}).catch(()=>{});}
export function initErrorTracking(){window.addEventListener('error',e=>send('window_error',e.message||e.error?.message));window.addEventListener('unhandledrejection',e=>send('unhandled_rejection',e.reason?.message||e.reason));}
