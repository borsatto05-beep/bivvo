let access={paid:false,loans:false,company:false,couple:false,family:false};
export const hasPaidAccess=(feature=null)=>feature?!!access[feature]:!!access.paid;
export const setPaidAccess=value=>{
  if(value&&typeof value==='object'){access={...access,...value};return;}
  const plan=String(value||'free');
  access={
    paid:plan!=='free',
    loans:['capital','family'].includes(plan),
    company:['entrepreneur','family'].includes(plan),
    couple:['couple','family'].includes(plan),
    family:plan==='family'
  };
};
export const paidAccessSnapshot=()=>({...access});
