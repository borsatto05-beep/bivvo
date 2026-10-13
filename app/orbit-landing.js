(function(){
 const copy={expenses:['Saiba o que cabe no seu dia.','Veja uma referência para gastar sem esquecer os próximos compromissos.'],cards:['O limite do cartão não é sua renda.','Acompanhe faturas e parcelas futuras antes de assumir outra compra.'],debt:['Descubra o que merece atenção primeiro.','Reúna vencimentos e compromissos para revisar seu próximo passo.'],reserve:['Uma reserva começa com um plano possível.','Defina uma meta que caiba depois das contas e acompanhe seu progresso.']};
 function init(){
  document.querySelectorAll('[data-orbit-intent]').forEach(button=>button.addEventListener('click',()=>{const goal=button.dataset.orbitIntent;if(!copy[goal])return;document.querySelectorAll('[data-orbit-intent]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));document.querySelector('#orbitPreviewTitle').textContent=copy[goal][0];document.querySelector('#orbitPreviewText').textContent=copy[goal][1];try{sessionStorage.setItem('bivvo_learning_intent_v1',goal);}catch{}}));
  document.querySelectorAll('[data-conversion-signup]').forEach(button=>button.addEventListener('click',()=>document.querySelector('#landingStartHero')?.click()));
  const slider=document.querySelector('#conversionPurchase'),brl=new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'});
  slider?.addEventListener('input',()=>{const purchase=Number(slider.value)||0,free=1200-purchase;document.querySelector('#conversionPurchaseValue').textContent=brl.format(purchase);document.querySelector('#conversionFree').textContent=brl.format(free);document.querySelector('#conversionSimulation').textContent=`Depois da compra, a referência fica em ${brl.format(free/15)} por dia.`;});
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
