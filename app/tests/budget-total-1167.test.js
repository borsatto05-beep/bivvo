const fs=require('fs');
const plans=fs.readFileSync('js/views/plans.js','utf8');
const css=fs.readFileSync('budget-guided.css','utf8');
function ok(v,msg){if(!v)throw new Error(msg)}
ok(plans.includes('Orçamento total do mês'),'card de orçamento total ausente');
ok(plans.includes('Já consumido'),'indicador já consumido ausente');
ok(plans.includes('totalConsumed'),'cálculo total consumido ausente');
ok(plans.includes('savedTowardTarget'),'meta guardada não integrada ao consumo');
ok(plans.includes('Ainda disponível'),'restante do orçamento ausente');
ok(plans.includes('% consumido'),'percentual consumido ausente');
ok(css.includes('.budget-total-overview'),'estilos do resumo total ausentes');
console.log('budget total 11.67 ok');
