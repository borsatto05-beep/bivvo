import {buildShareUrl,safeSlug} from './js/growth-utils.mjs';

(()=>{
 if(document.querySelector('[data-bv42-share]'))return;
 const path=location.pathname;if(path==='/'||path.startsWith('/ferramentas/embed/'))return;
 const main=document.querySelector('main')||document.body,title=(document.querySelector('h1')?.textContent||document.title||'Bivvo').trim().replace(/\s+/g,' ');
 const slug=safeSlug(path.replace(/^\/+|\/+$/g,'').split('/').pop()||'pagina');
 const tool=document.querySelector('#spendableTool, #salaryCalc, #vacationCalc, #expenseCalc, #diagnosticoForm, form#calcForm, [data-seo-tool], .tool, .calc');
 const el=(tag,text,cls)=>{const e=document.createElement(tag);if(text)e.textContent=text;if(cls)e.className=cls;return e;};
 const section=el('section',null,'bv42-share');section.dataset.bv42Share='1';section.setAttribute('aria-labelledby','bv42-share-title');
 const copy=el('div',null,'bv42-share-copy'),kicker=el('span',tool?'Uma ferramenta para compartilhar':'Passe adiante','bv42-kicker');
 const heading=el('h2',tool?'Confira seu cenário e convide alguém a experimentar':'Conhece alguém que precisa deste conteúdo?');heading.id='bv42-share-title';
 const desc=el('p','O link não contém seus valores. O cartão também os oculta por padrão.');
 const status=el('p',null,'bv42-share-status');status.setAttribute('role','status');status.setAttribute('aria-live','polite');
 const options=el('div',null,'bv42-card-options'),formatLabel=el('label','Formato do cartão'),format=el('select');format.setAttribute('aria-label','Formato do cartão');
 for(const [v,t]of[['story','Story 9:16'],['square','Quadrado 1:1']]){const o=el('option',t);o.value=v;format.append(o);}formatLabel.append(format);options.append(formatLabel);
 const values=el('input');values.type='checkbox';values.id='bv84-card-values';
 if(document.getElementById('qResultado')){const l=el('label');l.append(values,el('span','Incluir minha referência diária no cartão'));options.append(l);}
 copy.append(kicker,heading,desc,options,status);
 const actions=el('div',null,'bv42-share-actions');
 const button=(text,primary=false)=>{const b=el('button',text,'bv42-share-btn'+(primary?' is-primary':''));b.type='button';actions.append(b);return b;};
 const wa=button('Enviar no WhatsApp',true),native=button('Compartilhar'),link=button('Copiar link'),card=button('Baixar cartão');section.append(copy,actions);
 // A ação fica junto à ferramenta, antes de textos complementares.
 if(tool){const host=tool.closest('section')||tool;host.insertAdjacentElement('afterend',section);}else main.append(section);
 const track=(event,content=slug)=>document.dispatchEvent(new CustomEvent('bivvo:track',{detail:{event,content:safeSlug(content)}}));
 let opened=false;const markOpen=()=>{if(!opened){opened=true;track('organic_share_open');}};
 const toolTrack=()=>{if(tool)track('tool_shared');};
 const urlFor=source=>buildShareUrl(location.origin+path,source,slug,location.origin);
 const message=()=>`Experimente esta ${tool?'ferramenta gratuita':'página'} do Bivvo:\n${title}`;
 wa.addEventListener('click',()=>{markOpen();track('organic_share_attempt','whatsapp');window.open('https://wa.me/?text='+encodeURIComponent(message()+'\n'+urlFor('whatsapp')),'_blank','noopener,noreferrer');track('organic_share_whatsapp');toolTrack();status.textContent='Solicitada a abertura do WhatsApp. Escolha a pessoa e confirme o envio no aplicativo.';});
 native.addEventListener('click',async()=>{
  markOpen();track('organic_share_attempt','native');native.disabled=true;
  try{
   if(!navigator.share){wa.click();return;}
   await navigator.share({title,text:message(),url:urlFor('native_share')});track('organic_share_native');toolTrack();status.textContent='O sistema concluiu a ação de compartilhar. Isso não confirma postagem ou leitura.';
  }catch(e){if(e?.name==='AbortError'){track('organic_share_canceled','native');status.textContent='Compartilhamento cancelado.';}else{track('organic_share_failed','native');status.textContent='Não foi possível abrir o compartilhamento. Use WhatsApp ou copie o link.';}}
  finally{native.disabled=false;}
 });
 link.addEventListener('click',async()=>{
  markOpen();const u=urlFor('copy_link');let ok=false;
  try{await navigator.clipboard.writeText(u);ok=true;}catch{}
  if(!ok){const t=el('textarea');t.value=u;t.readOnly=true;t.className='bv42-offscreen';document.body.append(t);t.select();try{ok=document.execCommand('copy');}catch{}t.remove();}
  if(ok){track('organic_share_copy');toolTrack();status.textContent='Link copiado. Cole onde quiser compartilhar.';}else{track('organic_share_failed','copy');status.textContent='Não foi possível copiar. Use o endereço da página no navegador.';}
 });
 function makeCard(){
  const c=document.createElement('canvas'),story=format.value==='story';c.width=1080;c.height=story?1920:1080;const x=c.getContext('2d');
  x.fillStyle='#f5effb';x.fillRect(0,0,c.width,c.height);x.fillStyle='#1e1329';x.fillRect(60,60,960,c.height-120);
  const complete=tool?.dataset.toolCompleted==='true';
  x.fillStyle='#fff';x.font='bold 54px Arial';x.fillText('Bivvo',110,160);
  x.fillStyle='#c4a1ff';x.font='bold 30px Arial';x.fillText(complete?'MEU PRÓXIMO PASSO':'EXPERIMENTE GRÁTIS',110,245);
  const lines=(text,y,size=62)=>{x.font=`bold ${size}px Arial`;x.fillStyle='#fff';let line='',count=0;for(const w of text.split(/\s+/)){const t=line?line+' '+w:w;if(x.measureText(t).width>850&&line){x.fillText(line,110,y+count*76);count++;line=w;}else line=t;}if(line)x.fillText(line,110,y+count*76);return y+(count+1)*76;};
  let y=lines(complete?'Conferi meu cenário.':'Saldo não é dinheiro livre.',350);
  if(complete&&values.checked&&document.getElementById('qResultado'))y=lines(document.getElementById('qResultado').textContent+' por dia',y+45,64);
  y=lines(complete?'Agora posso escolher o que revisar.':'Descubra uma referência para decidir.',y+35,45);
  if(story)lines('Uma ferramenta para entender antes de gastar.',y+120,43);
  x.fillStyle='#d8c7ff';x.font='30px Arial';x.fillText(complete?'Estimativa baseada nos dados informados.':'Sem expor seus valores financeiros.',110,c.height-360);
  x.font='bold 38px Arial';x.fillStyle='#fff';x.fillText('Descubra seu próximo passo no Bivvo',110,c.height-245);
  x.font='32px Arial';x.fillText(new URL(document.querySelector('link[rel=canonical]')?.href||location.href).hostname,110,c.height-180);
  x.font='24px Arial';x.fillText(path.slice(0,62),110,c.height-130);
  return {canvas:c,complete};
 }
 card.addEventListener('click',async()=>{
  markOpen();card.disabled=true;
  try{
   const {canvas,complete}=makeCard();
   const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));if(!blob)throw Error('Canvas não disponível');
   track(complete?'result_card_generated':'content_card_generated');
   const url=URL.createObjectURL(blob),a=el('a');a.download=`bivvo-${slug}-${format.value}.png`;a.href=url;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),4000);
   track(complete?'result_card_downloaded':'content_card_downloaded');status.textContent=values.checked&&complete?'Download solicitado com sua referência diária. Confira antes de postar.':'Download solicitado sem seus valores financeiros.';
  }catch{track('organic_share_failed','card');status.textContent='Não foi possível baixar o cartão. Você ainda pode copiar o link.';}
  finally{card.disabled=false;}
 });
 document.addEventListener('bivvo:tool',e=>{if(e.detail?.phase==='completed'&&tool?.dataset.toolCompleted==='true'){section.classList.add('is-ready');kicker.textContent='Resultado pronto';heading.textContent='Seu próximo passo pode ajudar outra pessoa';}});
})();
