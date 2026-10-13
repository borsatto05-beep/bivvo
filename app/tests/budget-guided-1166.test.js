const fs=require('fs');
const finance=fs.readFileSync('js/finance.js','utf8');
const plans=fs.readFileSync('js/views/plans.js','utf8');
const forms=fs.readFileSync('js/views/forms.js','utf8');
const css=fs.readFileSync('budget-guided.css','utf8');
function ok(v,msg){if(!v)throw new Error(msg)}
ok(finance.includes('export function plannedMonthlyIncome'), 'plannedMonthlyIncome ausente');
ok(finance.includes('export function budgetPlan'), 'budgetPlan ausente');
ok(finance.includes('savingTarget + categoryLimits'), 'meta não integrada ao orçamento');
ok(plans.includes('Monte seu orçamento passo a passo'), 'guia passo a passo ausente');
ok(plans.includes('Meta de guardar + categorias nunca podem passar'), 'regra educativa ausente');
ok(plans.includes('openBudgetCategoryLesson'), 'ajuda por categoria ausente');
ok(forms.includes('Seu orçamento passa da renda'), 'bloqueio de excesso ausente');
ok(forms.includes('Meta de guardar + categorias nunca podem ultrapassar sua receita.'), 'regra no formulário ausente');
ok(css.includes('.budget-wizard'), 'estilos do guia ausentes');
console.log('budget guided 11.66 ok');
