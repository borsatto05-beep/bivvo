exports.handler=async function(event){
  const headers={
    'Content-Type':'application/json; charset=utf-8',
    'Cache-Control':'public, max-age=900, s-maxage=900',
    'X-Content-Type-Options':'nosniff'
  };
  if(event.httpMethod!=='GET')return {statusCode:405,headers,body:JSON.stringify({error:'Método não permitido.'})};
  try{
    const q=String(event.queryStringParameters?.search||'').trim();
    const url='https://brapi.dev/api/available'+(q?'?search='+encodeURIComponent(q):'');
    const r=await fetch(url,{headers:{Accept:'application/json'}});
    const j=await r.json().catch(()=>null);
    if(!r.ok||!j)return {statusCode:r.status||502,headers,body:JSON.stringify({error:'Não foi possível carregar os ativos da B3.'})};
    return {statusCode:200,headers,body:JSON.stringify({stocks:Array.isArray(j.stocks)?j.stocks:[],indexes:Array.isArray(j.indexes)?j.indexes:[]})};
  }catch(_){
    return {statusCode:502,headers,body:JSON.stringify({error:'Serviço de ativos B3 indisponível.'})};
  }
};
