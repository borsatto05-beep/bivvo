/* Atualização compartilhada: uma consulta por vez, respostas presas à conta
   original e frequência limitada. O chamador controla foco e formulários. */
export function createSharedRefresh({fetchData,getIdentity,canRefresh,onData,onStatus=()=>{},now=()=>Date.now(),minInterval=15000}){
 let epoch=0,pending=null,lastAttempt=-Infinity,identity=getIdentity();
 const reset=()=>{epoch++;pending=null;lastAttempt=-Infinity;identity=getIdentity();};
 async function refresh({force=false}={}){
  if(identity!==getIdentity())reset();
  if(!identity||!canRefresh())return false;
  if(pending)return pending;
  if(!force&&now()-lastAttempt<minInterval)return false;
  const requestEpoch=epoch,user=identity;lastAttempt=now();
  const valid=()=>epoch===requestEpoch&&getIdentity()===user;
  onStatus({loading:true,error:null});
  pending=(async()=>{
   try{
    const data=await fetchData();
    if(!valid())return false;
    if(!canRefresh()){onStatus({loading:false});return false;}
    onData(data);onStatus({loading:false,error:null,updatedAt:now()});return true;
   }catch(e){
    if(valid())onStatus({loading:false,error:e.message||'Não foi possível atualizar.'});return false;
   }finally{if(valid())pending=null;}
  })();
  return pending;
 }
 return {refresh,reset};
}
