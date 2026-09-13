import {visitDocument} from './document-model.mjs';
import {locateDocumentNode,transformDocumentLayout} from './document-operations.mjs';

export const documentLayoutTools={
 installObjectHandles(){
  if(this.host.getAttribute('controls')!=='contextual'||this.host.readonly)return;
  for(const el of this.surface.querySelectorAll('[data-id][data-type]')){
   const at=locateDocumentNode(this.doc,el.dataset.id);if(!at||at.nodes!==at.parent.blocks)continue;
   let shell=el;
   if(el.matches('table'))shell=el.closest('[data-table-wrap]')??el;
   if(el.matches('ul,ol')){if(el.parentElement.hasAttribute('data-object-wrap'))shell=el.parentElement;else{shell=document.createElement('div');shell.dataset.objectWrap='';el.before(shell);shell.append(el);}}
   if(shell.querySelector(`:scope > [data-native-handle="${CSS.escape(el.dataset.id)}"]`))continue;
   shell.classList.add('me-object');
   el.classList.add('me-object');const handle=document.createElement('button');handle.type='button';handle.contentEditable='false';handle.dataset.nativeHandle=el.dataset.id;handle.className='me-object-handle';handle.setAttribute('aria-label','Select '+at.node.type+' block');handle.draggable=true;
   if(at.node.type==='layout')handle.style.cssText=`right:${at.ancestors.length*18}px;top:-16px`;
   handle.onpointerdown=e=>e.preventDefault();handle.onclick=e=>{e.preventDefault();e.stopPropagation();this.selectedId=el.dataset.id;this.objectIds=e.ctrlKey?[...new Set([...(this.objectIds??[]),this.selectedId])]:[this.selectedId];this.surface.querySelectorAll('.me-object-selected').forEach(n=>n.classList.remove('me-object-selected'));for(const id of this.objectIds)this.surface.querySelector(`[data-id="${CSS.escape(id)}"]`)?.classList.add('me-object-selected');handle.focus({preventScroll:true});this.properties();};
   handle.onkeydown=e=>{if(['Delete','Backspace'].includes(e.key)){e.preventDefault();e.stopImmediatePropagation();this.deleteNode(el.dataset.id);}};
   handle.ondragend=()=>this.surface.querySelectorAll('[data-native-drop]').forEach(n=>delete n.dataset.nativeDrop);
   handle.ondragstart=e=>{e.stopPropagation();e.dataTransfer.setData('application/x-maths-block',el.dataset.id);};
   el.addEventListener('dragover',e=>{if([...e.dataTransfer.types].includes('application/x-maths-block')){e.preventDefault();e.stopPropagation();el.dataset.nativeDrop=e.clientY<el.getBoundingClientRect().top+el.clientHeight/2?'before':'after';}});
   el.addEventListener('dragleave',()=>delete el.dataset.nativeDrop);
   el.addEventListener('drop',e=>{const id=e.dataTransfer.getData('application/x-maths-block');if(!id)return;e.preventDefault();e.stopPropagation();const position=el.dataset.nativeDrop;delete el.dataset.nativeDrop;this.transact(doc=>{this.selectedId=transformDocumentLayout(doc,id,'move',{targetId:el.dataset.id,position});});});
   shell.append(handle);
  }
 },
 mountLayoutPanel(panel){
  const refresh=()=>{
   panel.replaceChildren();const at=locateDocumentNode(this.doc,this.selectedId);if(!at)return;
   const title=document.createElement('strong');title.textContent='Selected '+at.node.type;panel.append(title);
   const command=(name,options={})=>this.transact(doc=>{this.selectedId=transformDocumentLayout(doc,this.selectedId,name,options);});
   const table=at.node.type==='table'?at.node:[...at.ancestors].reverse().find(n=>n.type==='table');
   if(table){
    const field=(label,value,change)=>{const wrap=document.createElement('label'),input=document.createElement('input');wrap.textContent=label;input.type='number';input.min='0';input.max='80';input.step='.5';input.value=value;input.setAttribute('aria-label',label);input.onchange=()=>{if(input.value!==''&&input.validity.valid)this.transact(doc=>change(locateDocumentNode(doc,table.id).node,Number(input.value)));};wrap.append(input);panel.append(wrap);};
    field('Table cell padding (mm)',table.padding??2,(n,v)=>n.padding=v);
    table.rows.forEach((row,i)=>field(`Table row ${i+1} minimum height (mm)`,table.rowHeights?.[i]??4,(n,v)=>{n.rowHeights??=[];n.rowHeights[i]=Math.max(4,v);}));
   }
   const buttons=document.createElement('div');buttons.className='me-layout-actions';panel.append(buttons);
   for(const [label,name]of [['Move block before','before'],['Move block after','after'],['Move block out','out'],['Full-width block','full-width'],['Group blocks','group'],['Ungroup blocks','ungroup']])this.button(buttons,label,()=>command(name,{ids:this.objectIds?.includes(this.selectedId)?this.objectIds:[this.selectedId]}));
   if(at.node.type==='layout'){this.button(buttons,'Stack blocks',()=>command('direction',{value:'stack'}));this.button(buttons,'Blocks side by side',()=>command('direction',{value:'row'}));}
   const dest=document.createElement('select');dest.setAttribute('aria-label','Block destination');dest.append(new Option('Choose another block',''));
   visitDocument(this.doc,n=>{const target=locateDocumentNode(this.doc,n.id);if(target&&target.nodes===target.parent.blocks&&n.id!==at.node.id&&!target.ancestors.some(p=>p.id===at.node.id))dest.append(new Option(n.type+': '+(n.inlines?.filter(i=>i.type==='text').map(i=>i.text).join('').slice(0,45)||n.alt||n.title||n.id.slice(0,8)),n.id));});panel.append(dest);
   for(const [label,position]of [['Above block','before'],['Below block','after'],['Left of block','left'],['Right of block','right'],['Move into block group','inside']])this.button(panel,label,()=>{if(dest.value)command('move',{targetId:dest.value,position});});
   const slot=[...at.ancestors].reverse().find(n=>n.blocks&&!n.type);
   if(slot){const label=document.createElement('label');label.textContent='Column vertical alignment ';const input=document.createElement('select');input.setAttribute('aria-label','Block vertical alignment');for(const v of ['top','middle','bottom'])input.append(new Option(v[0].toUpperCase()+v.slice(1),v));input.value=slot.verticalAlign??'top';input.onchange=()=>command('vertical',{value:input.value});label.append(input);panel.append(label);}
   if(slot){const layout=[...at.ancestors].reverse().find(n=>n.type==='layout');if(layout?.columns>1){const label=document.createElement('label'),input=document.createElement('input'),index=layout.slots.findIndex(s=>s.id===slot.id);label.textContent='Column proportion ';input.type='number';input.min='.1';input.step='.1';input.value=layout.tracks?.[index]??1;input.setAttribute('aria-label','Native column proportion');input.onchange=()=>this.transact(doc=>{const n=locateDocumentNode(doc,layout.id).node;n.tracks??=n.slots.map(()=>1);n.tracks[index]=Math.max(.1,Number(input.value));});label.append(input);panel.append(label);}}
   for(const [key,label]of ['image','inline-image'].includes(at.node.type)?[['width','Image width (mm)']]:at.node.type==='table'?[['widthMm','Table width (mm)']]:[]){const wrap=document.createElement('label'),input=document.createElement('input');wrap.textContent=label;input.type='number';input.min='5';input.max='190';input.step='.5';input.value=at.node[key]??80;input.setAttribute('aria-label',label);input.onchange=()=>this.modify(n=>n[key]=Number(input.value));wrap.append(input);panel.append(wrap);}
   if(at.node.type==='image'){const wrap=document.createElement('label'),input=document.createElement('input');wrap.textContent='Space above image (mm)';input.type='number';input.min='0';input.max='80';input.step='.5';input.value=at.node.spaceBefore??0;input.setAttribute('aria-label','Space above image (mm)');input.onchange=()=>this.modify(n=>n.spaceBefore=Number(input.value));wrap.append(input);panel.append(wrap);}
   if(['image','paragraph'].includes(at.node.type)){const input=document.createElement('select');input.setAttribute('aria-label','Block alignment');for(const v of ['left','center','right'])input.append(new Option(v==='center'?'Centre':v[0].toUpperCase()+v.slice(1),v));input.value=at.node.align;input.onchange=()=>this.modify(n=>n.align=input.value);panel.append(input);}
   this.button(panel,at.node.type==='paragraph'?'Delete paragraph':'Delete selected block',()=>this.deleteNode());
  };
  this.host.addEventListener('document-selection',refresh);this.host.addEventListener('document-change',refresh);refresh();return {destroy:()=>{this.host.removeEventListener('document-selection',refresh);this.host.removeEventListener('document-change',refresh);}};
 }
};
