import {h} from '../util.js';
const sections=new Map([
 ['Resposta direta','Resumo'],['Leitura do cenário:','Seus números'],['Por que isso importa:','O que precisa de atenção'],['Onde investigar primeiro','Onde revisar os gastos'],['Possíveis soluções e cenários','Soluções possíveis'],['Planejamento passo a passo','Seu plano de ação'],['Próximo passo:','Comece por aqui'],['Limites desta análise','Dados e limites da análise']
]);
function content(lines){
 const host=h('div.ai-section-content');let list=null,listType='';
 for(const line of lines){const numbered=/^\d+\.\s+/.test(line),bullet=/^[•*-]\s+/.test(line);const type=numbered?'ol':bullet?'ul':'';
  if(type){if(!list||type!==listType){list=h(type);host.append(list);listType=type;}list.append(h('li',line.replace(/^\d+\.\s+|^[•*-]\s+/,'')));}
  else{list=null;listType='';host.append(h('p',line));}
 }return host;
}
export function assistantMessage(who,title,text){
 const box=h('div.ai-msg.'+who,title?h('b.ai-message-title',title):null);
 const lines=String(text||'').split(/\n+/).map(x=>x.trim()).filter(Boolean);
 if(who!=='bot'||!lines.some(line=>sections.has(line))){box.append(content(lines));return box;}
 const groups=[];let group={title:null,lines:[]};
 for(const line of lines){if(sections.has(line)){if(group.lines.length)groups.push(group);group={title:line,lines:[]};}else group.lines.push(line);}
 if(group.lines.length)groups.push(group);
 for(const entry of groups){
  if(!entry.title){box.append(content(entry.lines));continue;}
  const label=sections.get(entry.title),body=content(entry.lines);
  if(['Resposta direta','Planejamento passo a passo','Próximo passo:'].includes(entry.title))box.append(h('section.ai-answer-section',h('h3',label),body));
  else box.append(h('details.ai-answer-details',h('summary',label),body));
 }
 return box;
}
