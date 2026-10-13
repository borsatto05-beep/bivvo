import {h,money,monthName} from '../util.js';
import {openSheet} from '../ui.js';
const COLORS=['#7651c8','#347b91','#b96d35','#a54f78','#508155','#7971ae','#397cba','#a58a32'];
export function budgetPie({rows,ym,onEdit}) {
 const items=rows.filter(r=>r.spent>0).sort((a,b)=>b.spent-a.spent),total=items.reduce((sum,r)=>sum+r.spent,0);
 const card=h('section.card.budget-pie',h('div.card-head',h('div',h('span.eyebrow','SEU DINHEIRO EM PERSPECTIVA'),h('h3','Para onde foi seu dinheiro')),h('small.muted',monthName(ym))),h('p.muted.sm','Toque em uma fatia ou categoria para entender os gastos e o limite.'));
 if(!total){card.append(h('p.muted','Ainda não há gastos neste mês. O gráfico aparece quando você registrar o primeiro gasto.'));return card;}
 const ns='http://www.w3.org/2000/svg',svg=document.createElementNS(ns,'svg');svg.setAttribute('viewBox','0 0 240 240');svg.setAttribute('aria-label','Distribuição dos gastos por categoria');svg.classList.add('budget-pie-svg');
 const ring=h('div.budget-pie-ring',svg,h('div.budget-pie-center',h('small','Gastos do mês'),h('strong',money(total))));
 const legend=h('div.budget-pie-legend');let angle=-Math.PI/2;
 const show=r=>{const pct=(r.spent/total*100).toLocaleString('pt-BR',{maximumFractionDigits:1});const configured=!r.unbudgeted&&r.limit>0,left=r.limit-r.spent;
  openSheet({title:r.cat,subtitle:'Orçamento de '+monthName(ym),content:h('div.budget-pie-detail',h('strong.budget-pie-value',money(r.spent)),h('p',`${pct}% dos gastos deste mês estão nesta categoria.`),h('div.stats',h('div.stat',h('small','Limite mensal'),h('b',configured?money(r.limit):'Não definido')),h('div.stat',h('small',left<0&&configured?'Acima do limite':'Disponível no limite'),h('b',configured?money(Math.abs(left)):'—'))),h('h3','O que isso significa?'),h('p',!configured?'Essa categoria já tem gastos, mas ainda não tem um limite positivo. Defina um limite que caiba na sua renda para acompanhar o que resta.':left<0?`Você passou ${money(-left)} do limite. Revise os próximos gastos e ajuste o plano sem ultrapassar sua renda.`:`Você ainda tem ${money(left)} no limite desta categoria. Isso é uma referência do orçamento; confira também seu saldo e as próximas contas antes de gastar.`),h('p.hint','O gráfico mostra a participação nos gastos, não na renda. Compras no cartão seguem o cálculo do orçamento; pagar a fatura não conta a mesma compra novamente. Valores guardados e categorias sem gastos não entram nas fatias.')),footer:[h('button.btn.primary',{type:'button',onclick:onEdit},'Revisar limites')]});};
 items.forEach((r,i)=>{const share=r.spent/total,end=angle+share*Math.PI*2,color=COLORS[i%COLORS.length];const path=document.createElementNS(ns,'path');
  const point=a=>[120+91*Math.cos(a),120+91*Math.sin(a)].map(n=>n.toFixed(4)).join(' ');
  const middle=angle+Math.PI;
  path.setAttribute('d',share>.999999?`M ${point(angle)} A 91 91 0 1 1 ${point(middle)} A 91 91 0 1 1 ${point(end)}`:`M ${point(angle)} A 91 91 0 ${share>.5?1:0} 1 ${point(end)}`);
  path.setAttribute('fill','none');path.setAttribute('stroke',color);path.setAttribute('stroke-width','34');path.setAttribute('role','button');path.setAttribute('tabindex','0');path.setAttribute('aria-label',`${r.cat}: ${money(r.spent)}, ${(share*100).toLocaleString('pt-BR',{maximumFractionDigits:1})}% dos gastos. Abrir detalhes`);
  path.addEventListener('click',()=>show(r));path.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();show(r);}});svg.append(path);
  const dot=document.createElementNS(ns,'svg');dot.setAttribute('viewBox','0 0 16 16');dot.setAttribute('aria-hidden','true');const circle=document.createElementNS(ns,'circle');circle.setAttribute('cx','8');circle.setAttribute('cy','8');circle.setAttribute('r','6');circle.setAttribute('fill',color);dot.append(circle);
  const button=h('button.budget-pie-category',{type:'button',onclick:()=>show(r)},dot,h('span',h('b',r.cat),h('small',`${(share*100).toLocaleString('pt-BR',{maximumFractionDigits:1})}% dos gastos`)),h('strong',money(r.spent)));legend.append(button);
  const highlight=on=>{path.classList.toggle('highlight',on);button.classList.toggle('highlight',on);};button.addEventListener('mouseenter',()=>highlight(true));button.addEventListener('mouseleave',()=>highlight(false));path.addEventListener('mouseenter',()=>highlight(true));path.addEventListener('mouseleave',()=>highlight(false));angle=end;
 });
 card.append(h('div.budget-pie-layout',ring,legend),h('p.hint','Gastos reais do mês por categoria. As cores identificam categorias; não representam alertas.'));return card;
}
