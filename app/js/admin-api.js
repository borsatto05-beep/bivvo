import * as cloud from './cloud.js';
async function req(action, params={}){
  const token=await cloud.accessToken(); if(!token) throw new Error('Sessão inválida.');
  const q=new URLSearchParams({action,...params});
  const r=await fetch('/api/admin?'+q,{headers:{Authorization:'Bearer '+token},cache:'no-store'});
  if(!r.ok){const j=await r.json().catch(()=>({}));throw new Error(j.error||'Admin indisponível.');}
  return r.json();
}
export const adminMe=()=>req('me');
export const adminDashboard=(params={})=>req('dashboard',params);
export const adminClients=(params={})=>req('clients',params);
export const adminActivity=(params={})=>req('activity',params);
export const adminSeo=(params={})=>req('seo',params);
export async function exportClients(){
  const token=await cloud.accessToken(); const r=await fetch('/api/admin?action=export',{headers:{Authorization:'Bearer '+token}}); if(!r.ok)throw new Error('Não foi possível exportar.');
  const blob=await r.blob(),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='bivvo-clientes.csv';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);
}
