/* Contrato explícito: só o cálculo validado pode sinalizar conclusão. Sem números em eventos. */
(()=>{
 const ids=new Set(['spendable','card_limit','monthly_expenses','salary_2026','vacation_estimate','reserve','commitment','installment','goal','netSalary','vacation','salary','diagnosis','comprometimento','parcelas','reserva']);
 const emit=(phase,tool,root)=>{
  if(!ids.has(tool))return;
  if(phase==='completed'&&root){root.dataset.toolCompleted='true';root.dataset.completedTool=tool;const section=root.closest('section');if(section)section.dataset.toolCompleted='true';}
  document.dispatchEvent(new CustomEvent('bivvo:tool',{detail:{phase,tool}}));
 };
 document.addEventListener('input',e=>{
  const root=e.target.closest('#spendableTool, #salaryCalc, #vacationCalc, #expenseCalc, #diagnosticoForm, form#calcForm');
  if(root){root.removeAttribute('data-tool-completed');root.closest('section')?.removeAttribute('data-tool-completed');}
 },true);
 window.bivvoTool={start:(tool,root)=>emit('started',tool,root),complete:(tool,root)=>emit('completed',tool,root)};
})();
