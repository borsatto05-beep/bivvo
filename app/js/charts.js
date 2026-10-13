/* Bivvo 10.1 — gráficos SVG leves, interativos e acessíveis. */
import { h, s as svg, money0 } from './util.js';
export function donut(items, { center='Total', onPick }={}) {
  const total=items.reduce((a,x)=>a+(+x.value||0),0), r=42, c=2*Math.PI*r; let acc=0;
  const root=h('div.viz-donut');
  const chart=svg('svg',{viewBox:'0 0 120 120',role:'img','aria-label':`${center}: ${money0(total)}`},svg('circle',{cx:60,cy:60,r,class:'viz-track'}));
  items.filter(x=>x.value>0).forEach((x,i)=>{ const frac=x.value/total, len=frac*c; const seg=svg('circle',{cx:60,cy:60,r,class:`viz-seg v${i%6}`,transform:'rotate(-90 60 60)',pathLength:'100','stroke-dasharray':`${frac*100} ${100-frac*100}`,'stroke-dashoffset':`${-acc*100}`,tabindex:'0',role:'button','aria-label':`${x.label}: ${money0(x.value)}, ${Math.round(frac*100)}%`}); const pick=()=>onPick?.({...x,share:frac,total}); seg.addEventListener('click',pick); seg.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();pick();}}); chart.append(seg); acc+=frac; });
  chart.append(svg('text',{x:60,y:56,'text-anchor':'middle',class:'viz-center-label'},center),svg('text',{x:60,y:72,'text-anchor':'middle',class:'viz-center-value'},money0(total)));
  root.append(chart); return root;
}
export function bars(items,{onPick}={}){ const max=Math.max(1,...items.map(x=>+x.value||0)); return h('div.viz-bars',{role:'list'},items.map((x,i)=>h('button.viz-bar',{type:'button',role:'listitem',onclick:()=>onPick?.(x),'aria-label':`${x.label}: ${money0(x.value)}`},h('span.viz-bar-label',x.label),h('span.viz-bar-track',h('i',{class:`v${i%6}`,vars:{'--p':`${Math.max(2,x.value/max*100)}%`}})),h('b',money0(x.value))))); }
export function progressBar(value,max,label='Progresso'){ const pct=max?Math.min(100,Math.max(0,value/max*100)):0; return h('div.viz-progress',h('div',h('span',label),h('b',`${Math.round(pct)}%`)),h('span.viz-progress-track',h('i',{vars:{'--p':pct+'%'}}))); }
