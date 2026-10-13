/* Somente contexto técnico de aquisição; nunca valores financeiros. */
export const validReferral = value => /^[a-f0-9]{8}$/.test(String(value||''));
export function captureReferralCode(rawUrl,storage=localStorage) {
 try{const ref=new URL(rawUrl).searchParams.get('ref');if(validReferral(ref)){storage.setItem('bivvo_ref',ref);return ref;}return null;}catch{return null;}
}
export function signupUrl(rawUrl,origin=location.origin,storage=localStorage) {
 const input=new URL(rawUrl,origin),url=new URL('/',origin);url.searchParams.set('signup','1');
 for(const key of ['utm_source','utm_medium','utm_campaign','utm_content','utm_term']){
  const value=input.searchParams.get(key);if(value)url.searchParams.set(key,value.slice(0,80));
 }
 let ref=input.searchParams.get('ref');try{if(!validReferral(ref))ref=storage.getItem('bivvo_ref');}catch{}
 if(validReferral(ref))url.searchParams.set('ref',ref);
 if(!url.searchParams.has('utm_source'))url.searchParams.set('utm_source','public_tool');
 return url.toString();
}
export function registrationMetadata(name,phone,ref){
 const fullName=String(name||'').trim().slice(0,100),phoneValue=String(phone||'').trim().slice(0,20);
 if(phoneValue&&phoneValue.replace(/\D/g,'').length<10)throw Error('Informe um telefone/WhatsApp válido ou deixe em branco.');
 const metadata={full_name:fullName,phone:phoneValue};
 if(validReferral(ref))metadata.referred_by=ref;
 return metadata;
}
