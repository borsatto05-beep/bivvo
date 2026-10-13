const crypto = require('crypto');
const { rest, userFromJwt, rateLimit, adminKey } = require('../lib/supabase-admin.js');
const { hasFeature } = require('../lib/plans.js');
const headers={'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
const out=(statusCode,body)=>({statusCode,headers,body:JSON.stringify(body)});
const clean=(s,n=80)=>String(s||'').trim().replace(/[<>]/g,'').slice(0,n);
const code=()=>crypto.randomBytes(12).toString('base64url');
const coupleFamily=f=>String(f?.name||'').startsWith('Casal · ');
async function membership(userId){ const r=await rest(`family_members?user_id=eq.${encodeURIComponent(userId)}&select=id,family_id,user_id,role,display_name,joined_at&limit=1`); return r?.[0]||null; }
async function sharedHistory(familyId) {
 const shared=[],seen=new Set();let cursor=null;
 for(let page=0;page<1000;page++){
  const filter=cursor?`&or=(date.lt.${encodeURIComponent(cursor.date)},and(date.eq.${encodeURIComponent(cursor.date)},id.lt.${encodeURIComponent(cursor.id)}))`:'';
  const rows=await rest(`family_transactions?family_id=eq.${encodeURIComponent(familyId)}&select=id,user_id,source_id,date,description,category,type,value,created_at&order=date.desc,id.desc&limit=100${filter}`);
  if(!Array.isArray(rows))throw Error('Histórico compartilhado inválido');
  for(const row of rows){if(!row.id||seen.has(row.id))throw Error('Paginação do histórico não avançou');seen.add(row.id);shared.push(row);}
  if(rows.length<100)return shared;
  cursor=rows[rows.length-1];
 }
 throw Error('Histórico excede o limite de leitura. Nenhum total parcial será exibido.');
}
async function familyFor(userId){
 const m=await membership(userId);if(!m)return null;
 const f=(await rest(`families?id=eq.${m.family_id}&select=id,name,owner_id,created_at&limit=1`))?.[0];if(!f)return null;
 const members=await rest(`family_members?family_id=eq.${f.id}&select=id,user_id,role,display_name,joined_at&order=joined_at.asc`);
 const shared=await sharedHistory(f.id);
 let shopping=[];try{shopping=await rest(`family_shopping_items?family_id=eq.${f.id}&select=id,family_id,user_id,name,quantity,unit,unit_price,purchased,actual_total,created_at,updated_at&order=purchased.asc,created_at.desc&limit=200`)}catch{}
 const kind=coupleFamily(f)?'couple':'family',active=await hasFeature(rest,f.owner_id,kind);
 return {family:f,membership:m,members:members||[],shared,shopping:shopping||[],active,kind,maxMembers:kind==='couple'?2:4};
}
exports.handler=async event=>{
 if(event.httpMethod!=='POST')return out(405,{error:'Método não permitido.'}); if(!adminKey())return out(503,{error:'Servidor ainda não configurado.'});
 const jwt=String(event.headers.authorization||'').replace(/^Bearer\s+/i,'').trim(); const user=await userFromJwt(jwt); if(!user?.id)return out(401,{error:'Entre na sua conta.'});
 let b={}; try{b=JSON.parse(event.body||'{}')}catch{return out(400,{error:'Pedido inválido.'})} const action=clean(b.action,30);
 if(!(await rateLimit((action==='get'?'family-read:':'family:')+user.id,action==='get'?240:60,3600)))return out(429,{error:'Muitas solicitações. Aguarde um pouco.'});
 try{
  if(action==='get') return out(200,{ok:true,data:await familyFor(user.id)});
  if(action==='create'){
   if(await membership(user.id))return out(409,{error:'Você já participa de um Espaço Família.'});
   const creatingCouple=b.kind==='couple',feature=creatingCouple?'couple':'family';if(!(await hasFeature(rest,user.id,feature)))return out(403,{error:creatingCouple?'O espaço Casal exige Bivvo Casal ou Família.':'O Espaço Família é exclusivo do plano Bivvo Família.'});
   const label=clean(b.name,40).replace(/^Casal · /,'')||'Meu espaço',name=creatingCouple?'Casal · '+label:label; const f=(await rest('families',{method:'POST',body:{name,owner_id:user.id},prefer:'return=representation'}))?.[0];
   await rest('family_members',{method:'POST',body:{family_id:f.id,user_id:user.id,role:'owner',display_name:clean(user.user_metadata?.full_name||user.email?.split('@')[0],50)},prefer:'return=minimal'});
   return out(200,{ok:true,data:await familyFor(user.id)});
  }
  if(action==='accept'){
   if(await membership(user.id))return out(409,{error:'Você já participa de um Espaço Família.'}); const inviteCode=clean(b.code,100);
   const inv=(await rest(`family_invites?code=eq.${encodeURIComponent(inviteCode)}&accepted_at=is.null&expires_at=gt.${encodeURIComponent(new Date().toISOString())}&select=*&limit=1`))?.[0]; if(!inv)return out(404,{error:'Convite inválido ou expirado.'});
   const invitedFamily=(await rest(`families?id=eq.${inv.family_id}&select=owner_id,name&limit=1`))?.[0]; const inviteFeature=coupleFamily(invitedFamily)?'couple':'family'; if(!invitedFamily || !(await hasFeature(rest,invitedFamily.owner_id,inviteFeature)))return out(403,{error:inviteFeature==='couple'?'O plano Casal do responsável precisa estar ativo.':'O plano Família do responsável precisa estar ativo.'});
   const count=(await rest(`family_members?family_id=eq.${inv.family_id}&select=id`))?.length||0; const max=coupleFamily(invitedFamily)?2:4;if(count>=max)return out(409,{error:`Este espaço já tem ${max} membros.`});
   if(coupleFamily(invitedFamily)){await rest('rpc/bivvo_accept_couple_invite',{method:'POST',body:{p_user:user.id,p_code:inviteCode,p_name:clean(user.user_metadata?.full_name||user.email?.split('@')[0],50)}});return out(200,{ok:true,data:await familyFor(user.id)});}
   await rest('family_members',{method:'POST',body:{family_id:inv.family_id,user_id:user.id,role:inv.role==='editor'?'editor':'viewer',display_name:clean(user.user_metadata?.full_name||user.email?.split('@')[0],50)},prefer:'return=minimal'});
   await rest(`family_invites?id=eq.${inv.id}`,{method:'PATCH',body:{accepted_at:new Date().toISOString(),accepted_by:user.id},prefer:'return=minimal'}); return out(200,{ok:true,data:await familyFor(user.id)});
  }
  const data=await familyFor(user.id); if(!data)return out(404,{error:'Você ainda não participa de um Espaço Família.'}); const me=data.membership; const manage=me.role==='owner'; const edit=manage||me.role==='editor'; if(!data.active && !['leave'].includes(action))return out(403,{error:data.kind==='couple'?'O plano Casal ou Família do responsável precisa estar ativo para alterar este espaço.':'O plano Família do responsável precisa estar ativo para alterar este espaço.'});
  if(action==='invite'){
   if(!manage)return out(403,{error:'Só o responsável pode convidar membros.'}); if(data.members.length>=data.maxMembers)return out(409,{error:`Este espaço permite até ${data.maxMembers} pessoas.`});
   const c=code(), expires=new Date(Date.now()+7*86400000).toISOString(), role=b.role==='editor'?'editor':'viewer'; await rest('family_invites',{method:'POST',body:{family_id:data.family.id,created_by:user.id,code:c,role,expires_at:expires},prefer:'return=minimal'}); return out(200,{ok:true,code:c,expiresAt:expires});
  }
  if(action==='role'){
   if(!manage)return out(403,{error:'Só o responsável pode alterar permissões.'}); const target=data.members.find(x=>x.id===b.memberId); if(!target||target.role==='owner')return out(400,{error:'Membro inválido.'}); const role=b.role==='editor'?'editor':'viewer'; await rest(`family_members?id=eq.${encodeURIComponent(target.id)}`,{method:'PATCH',body:{role},prefer:'return=minimal'}); return out(200,{ok:true});
  }
  if(action==='remove'){
   if(!manage)return out(403,{error:'Só o responsável pode remover membros.'}); const target=data.members.find(x=>x.id===b.memberId); if(!target||target.role==='owner')return out(400,{error:'Membro inválido.'}); await rest(`family_members?id=eq.${encodeURIComponent(target.id)}`,{method:'DELETE'}); await rest(`family_transactions?family_id=eq.${data.family.id}&user_id=eq.${target.user_id}`,{method:'DELETE'}).catch(()=>{}); await rest(`family_shopping_items?family_id=eq.${data.family.id}&user_id=eq.${target.user_id}`,{method:'DELETE'}).catch(()=>{}); return out(200,{ok:true});
  }
  if(action==='leave'){
   if(me.role==='owner')return out(409,{error:'O responsável não pode sair enquanto o espaço existir.'}); await rest(`family_members?id=eq.${encodeURIComponent(me.id)}`,{method:'DELETE'}); return out(200,{ok:true});
  }
  if(action==='share_transaction'){
   if(!edit)return out(403,{error:'Seu acesso é somente leitura.'}); const t=b.transaction||{}; if(!Number.isFinite(Number(t.value))||!/^\d{4}-\d{2}-\d{2}$/.test(t.date)||!['income','expense'].includes(t.type)||!(Number(t.value)>=0))return out(400,{error:'Lançamento inválido.'});
   const row={family_id:data.family.id,user_id:user.id,source_id:clean(t.sourceId,80),date:t.date,description:clean(t.desc,120)||'Lançamento',category:clean(t.cat,60)||'Outros',type:t.type,value:Math.round(Number(t.value)*100)/100};
   await rest('family_transactions?on_conflict=family_id,user_id,source_id',{method:'POST',body:row,prefer:'resolution=merge-duplicates,return=minimal'}); return out(200,{ok:true});
  }
  if(action==='unshare_transaction'){
   if(!edit)return out(403,{error:'Seu acesso é somente leitura.'}); await rest(`family_transactions?family_id=eq.${data.family.id}&user_id=eq.${user.id}&source_id=eq.${encodeURIComponent(clean(b.sourceId,80))}`,{method:'DELETE'}); return out(200,{ok:true});
  }
  if(action==='shopping_add'){
   if(data.kind!=='couple')return out(400,{error:'A lista de compras está disponível no Bivvo Casal.'}); if(!edit)return out(403,{error:'Seu acesso é somente leitura.'});
   const i=b.item||{},name=clean(i.name,100),quantity=Math.max(.01,Math.min(9999,Number(i.quantity)||1)),unit=clean(i.unit,12)||'un',unitPrice=Math.max(0,Math.min(9999999,Number(i.unitPrice)||0)); if(!name)return out(400,{error:'Digite o item.'});
   try{await rest('family_shopping_items',{method:'POST',body:{family_id:data.family.id,user_id:user.id,name,quantity,unit,unit_price:Math.round(unitPrice*100)/100},prefer:'return=minimal'});}catch(e){return out(503,{error:'Atualize o banco do Bivvo para ativar a lista de compras compartilhada.'});}
   return out(200,{ok:true});
  }
  if(action==='shopping_toggle'){
   if(data.kind!=='couple'||!edit)return out(403,{error:'Sem permissão para alterar a lista.'}); const id=clean(b.itemId,80),purchased=!!b.purchased,actual=Number(b.actualTotal); const row=(await rest(`family_shopping_items?id=eq.${encodeURIComponent(id)}&family_id=eq.${data.family.id}&select=id&limit=1`))?.[0]; if(!row)return out(404,{error:'Item não encontrado.'});
   await rest(`family_shopping_items?id=eq.${encodeURIComponent(id)}`,{method:'PATCH',body:{purchased,actual_total:purchased&&Number.isFinite(actual)?Math.max(0,Math.round(actual*100)/100):null,updated_at:new Date().toISOString()},prefer:'return=minimal'}); return out(200,{ok:true});
  }
  if(action==='shopping_update'){
   if(data.kind!=='couple'||!edit)return out(403,{error:'Sem permissão para alterar a lista.'}); const id=clean(b.itemId,80),p=b.patch||{},name=clean(p.name,100),quantity=Math.max(.01,Math.min(9999,Number(p.quantity)||1)),unit=clean(p.unit,12)||'un',unitPrice=Math.max(0,Math.min(9999999,Number(p.unitPrice)||0)),actual=Number(p.actualTotal); if(!name)return out(400,{error:'Digite o item.'}); const row=(await rest(`family_shopping_items?id=eq.${encodeURIComponent(id)}&family_id=eq.${data.family.id}&select=id,purchased&limit=1`))?.[0]; if(!row)return out(404,{error:'Item não encontrado.'});
   await rest(`family_shopping_items?id=eq.${encodeURIComponent(id)}`,{method:'PATCH',body:{name,quantity,unit,unit_price:Math.round(unitPrice*100)/100,actual_total:row.purchased&&Number.isFinite(actual)&&actual>0?Math.round(actual*100)/100:null,updated_at:new Date().toISOString()},prefer:'return=minimal'}); return out(200,{ok:true});
  }
  if(action==='shopping_delete'){
   if(data.kind!=='couple'||!edit)return out(403,{error:'Sem permissão para alterar a lista.'}); const id=clean(b.itemId,80); await rest(`family_shopping_items?id=eq.${encodeURIComponent(id)}&family_id=eq.${data.family.id}`,{method:'DELETE'}); return out(200,{ok:true});
  }
  if(action==='shopping_clear_done'){
   if(data.kind!=='couple'||!edit)return out(403,{error:'Sem permissão para alterar a lista.'}); await rest(`family_shopping_items?family_id=eq.${data.family.id}&purchased=eq.true`,{method:'DELETE'}); return out(200,{ok:true});
  }
  return out(400,{error:'Ação desconhecida.'});
 }catch(e){console.error('family',action,e.message); return out(502,{error:'Não foi possível concluir esta ação agora.'});}
};
