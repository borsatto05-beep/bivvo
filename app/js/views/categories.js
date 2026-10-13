/* Bivvo 10.2.4 — categorias e ícones. */
import { h } from '../util.js';
import * as store from '../store.js';
import { openSheet, confirmSheet, toast, field, catIcon } from '../ui.js';

const ICONS = ['🏠','🛒','🍽️','🛵','🍴','🚗','⛽','🅿️','💡','🚿','🔥','📶','📱','🩺','💊','🏋️','📚','🎓','🎟️','🎮','🔁','📺','🛍️','👕','👟','💅','🧴','🛠️','💻','📷','🛡️','🔧','💼','🎁','📉','🧾','🐾','🧸','✈️','💎','🫙','☕','🍺','🏦','💳','🚕','🏍️','🚌','🚲','🏖️','🎵','🎨','⚽','❤️','⭐','📦','🧹','🪑','🌐','🎂','💰','🪙','📌','✂️','🧰','🌱','•'];

function iconPicker(value, onPick) {
  let selected = value || '•';
  const wrap = h('div.icon-picker', { role:'radiogroup', 'aria-label':'Escolha um ícone' });
  const paint = () => [...wrap.children].forEach(b => { const on=b.dataset.icon===selected; b.classList.toggle('on',on); b.setAttribute('aria-checked',on); });
  for (const icon of ICONS) wrap.append(h('button.icon-choice',{type:'button',role:'radio',dataset:{icon},'aria-label':`Ícone ${icon}`,onclick:()=>{selected=icon;paint();onPick(icon);}},icon));
  paint(); return wrap;
}

export function openCategoryManager() {
  const company=store.activeFinanceProfile()==='company';
  const content = h('div.category-manager');
  const sheet = openSheet({ title:company?'Categorias da empresa':'Categorias e ícones', subtitle:company?'Organize custos e despesas do negócio sem misturar com categorias pessoais.':'Organize seus gastos do seu jeito.', content, wide:true });
  const paint = () => {
    const s=store.getState();
    const cats=store.categories('expense');
    content.replaceChildren(
      h('div.category-manager-head', h('p.muted','Os ícones aparecem nos lançamentos, filtros e análises.'), h('button.btn.primary',{type:'button',onclick:()=>openCategoryEditor(null,paint)},'+ Criar categoria')),
      h('div.category-grid', cats.map(name => {
        const custom=s.customCategories.includes(name);
        return h('button.category-tile',{type:'button',onclick:()=>openCategoryEditor(name,paint)},h('span.category-tile-icon',catIcon(name)),h('span',h('b',name),h('small',custom?'Personalizada · editar':'Padrão · trocar ícone')),h('span.mi-chev','›'));
      }))
    );
  };
  paint(); return sheet;
}

function openCategoryEditor(existing, done) {
  const s=store.getState();
  const isCustom=!!existing && s.customCategories.includes(existing);
  const company=store.activeFinanceProfile()==='company';
  const name=h('input.input',{type:'text',maxlength:'36',autocomplete:'off',placeholder:company?'Ex.: Embalagens, Comissão de vendas':'Ex.: Carro, Café, Academia',value:existing||'',disabled:!!existing&&!isCustom});
  let icon=existing?catIcon(existing):'⭐';
  const previewIcon=h('span.category-preview-icon',icon), previewName=h('b',existing||'Nova categoria');
  name.addEventListener('input',()=>previewName.textContent=name.value.trim()||'Nova categoria');
  const picker=iconPicker(icon,v=>{icon=v;previewIcon.textContent=v;});
  const save=h('button.btn.primary',{type:'button'},existing?'Salvar alterações':'Criar categoria');
  const del=isCustom?h('button.btn.ghost.danger-text',{type:'button'},'Excluir categoria'):null;
  const sh=openSheet({title:existing?'Editar categoria':'Criar categoria',subtitle:existing&&!isCustom?'Categorias padrão mantêm o nome para não quebrar seu histórico. Você pode trocar o ícone.':'Escolha um nome e um ícone.',content:h('div.category-editor',h('div.category-preview',previewIcon,previewName),field('Nome da categoria',name),h('div.field',h('span','Ícone'),picker)),footer:[del,h('button.btn.ghost',{type:'button',onclick:()=>sh.close()},'Cancelar'),save]});
  save.addEventListener('click',()=>{
    const n=name.value.trim().replace(/\s+/g,' ');
    if(!n){toast('Digite o nome da categoria.');name.focus();return;}
    const all=store.categories('expense');
    if((!existing||n.toLowerCase()!==existing.toLowerCase())&&all.some(c=>c.toLowerCase()===n.toLowerCase())){toast('Essa categoria já existe.');return;}
    store.commit(st=>{
      if(!existing){st.customCategories.push(n);st.categoryIcons[n]=icon;}
      else if(isCustom&&n!==existing){
        st.customCategories=st.customCategories.map(c=>c===existing?n:c);
        st.transactions.forEach(t=>{if(t.cat===existing)t.cat=n;}); st.fixed.forEach(t=>{if(t.cat===existing)t.cat=n;});
        if(st.budget_limits?.[existing]!=null){st.budget_limits[n]=st.budget_limits[existing];delete st.budget_limits[existing];}
        for(const k of Object.keys(st.categoryRules||{})) if(st.categoryRules[k]===existing) st.categoryRules[k]=n;
        delete st.categoryIcons[existing]; st.categoryIcons[n]=icon;
      } else st.categoryIcons[existing]=icon;
    },{reason:'category-edit'});
    toast(existing?'Categoria atualizada.':'Categoria criada.'); sh.close(); done?.();
  });
  del?.addEventListener('click',async()=>{
    const used=s.transactions.some(t=>t.cat===existing)||s.fixed.some(t=>t.cat===existing);
    const ok=await confirmSheet({title:`Excluir ${existing}?`,message:used?'Ela já é usada em lançamentos. Os registros existentes serão movidos para “Outros”.':'A categoria personalizada será removida.',confirmLabel:'Excluir',danger:true});
    if(!ok)return;
    store.commit(st=>{st.customCategories=st.customCategories.filter(c=>c!==existing);st.transactions.forEach(t=>{if(t.cat===existing)t.cat='Outros';});st.fixed.forEach(t=>{if(t.cat===existing)t.cat='Outros';});delete st.categoryIcons[existing];delete st.budget_limits[existing];for(const k of Object.keys(st.categoryRules||{}))if(st.categoryRules[k]===existing)delete st.categoryRules[k];},{reason:'category-delete'});
    toast('Categoria excluída.');sh.close();done?.();
  });
}
