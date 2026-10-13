import * as store from './store.js';
import {isSpend} from './finance.js';
export const normalizeSearch = value => String(value??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
export function matchesTransaction(tx, query) {
 const q=normalizeSearch(query);if(!q)return true;
 const text=normalizeSearch([tx.desc,tx.cat,tx.card,tx.note,tx.method,tx.date,tx.date?.split('-').reverse().join('/')].join(' '));
 const amount=Number(tx.value).toFixed(2),br=Number(tx.value).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2});
 return q.split(/\s+/).every(word=>text.includes(word)||amount.includes(word.replace(',','.'))||br.includes(word.replace(/^r\$/,'')));
}
export const canFavorite = tx => !!tx && isSpend(tx) && tx.method!=='Crédito' && !tx.locked && !tx.immutable && !tx.loanPaymentId && !tx.isLoan;
export const favorites = (state=store.getState()) => Array.isArray(state.profile.favoriteExpenses)?state.profile.favoriteExpenses:[];
export const isFavorite = id => favorites().some(x=>x.id===id);
export function toggleFavorite(tx){
 if(!canFavorite(tx))return false;
 const exists=isFavorite(tx.id);
 store.commit(s=>{const list=favorites(s).filter(x=>x.id!==tx.id);if(!exists)list.push({id:tx.id,desc:tx.desc,value:tx.value,cat:tx.cat,method:tx.method});s.profile.favoriteExpenses=list.slice(-30);});
 return !exists;
}

export function removeFavorite(id){store.commit(s=>{s.profile.favoriteExpenses=favorites(s).filter(x=>x.id!==id);});}
