import {uid,paragraph,visitDocument,toSource,normalizeDocument,renderDocument} from './document-model.mjs';
import {equationTargets,changeEquation,anchorResolved} from './annotated-equation.mjs';
export const equationControls={
 equationProperties(n){
  const wrap=document.createElement('label');wrap.textContent='Equation ';const field=document.createElement('math-field');field.value=n.latex;field.readOnly=this.host.readonly;field.setAttribute('aria-label','Equation');field.style.cssText='min-width:180px;max-width:100%';
  const finish=()=>{this.finishEquationEdit?.();};
  const apply=()=>{if(this.rendering||this.host.readonly||!field.isConnected)return;this.capture();let current;visitDocument(this.doc,x=>{if(x.id===n.id)current=x;});if(!current||current.latex===field.value)return;changeEquation(current,field.value);this.doc=normalizeDocument(this.doc);
   const element=this.surface.querySelector('[data-id="'+CSS.escape(n.id)+'"]');if(element)element.outerHTML=renderDocument({blocks:[current]},{editable:true,annotationMath:latex=>MathLive.convertLatexToMarkup(latex)});
   this.equationObserver?.update();this.mathEditing?.selectBlock(this.surface.querySelector(`[data-id="${CSS.escape(n.id)}"]`));this.finishEquationEdit=()=>{this.remember();this.finishEquationEdit=null;};refreshTargets(field.value);this.emit();
  };
  field.addEventListener('input',apply);field.addEventListener('change',()=>{if(field.isConnected){apply();finish();}});field.addEventListener('focusout',finish);wrap.append(field);this.inspector.append(wrap);
  this.field('Equation size (pt)',n.fontSize,v=>this.modify(x=>x.fontSize=v));this.field('Equation width (mm)',n.width,v=>this.modify(x=>x.width=v));this.field('Annotation gap (mm)',n.gap,v=>this.modify(x=>x.gap=v));
  this.button(this.inspector,'Use surrounding text size',()=>this.modify(x=>x.fontSize=null));
  this.field('Equation margin (mm)',n.margin??2,v=>this.modify(x=>x.margin=v));
  this.field('Equation alignment',n.align??'center',v=>this.modify(x=>x.align=v),'text',['left','center','right']);
  const targets=[],targetLabel=document.createElement('label'),target=document.createElement('select');targetLabel.textContent='Term ';target.setAttribute('aria-label','Annotation term');target.disabled=this.host.readonly;
  const refreshTargets=latex=>{targets.splice(0,targets.length,...equationTargets(latex));target.replaceChildren();const counts=new Map();for(const [index,t] of targets.entries()){const count=(counts.get(t.text)??0)+1;counts.set(t.text,count);const option=document.createElement('option');option.value=index;option.textContent=t.text+' (occurrence '+count+')';target.append(option);}};refreshTargets(n.latex);targetLabel.append(target);this.inspector.append(targetLabel);
  const attach=(node,a)=>{const chosen=targets[Number(target.value)];if(!chosen)return;let anchor=node.anchors.find(t=>anchorResolved(node,t)&&t.start===chosen.start&&t.end===chosen.end);if(!anchor){anchor={id:uid(),...chosen};node.anchors.push(anchor);}a.targetId=anchor.id;};
  this.button(this.inspector,'Add annotation',()=>this.modify(node=>{if(!targets.length)return;const a={id:uid(),colour:'#268cff',placement:'below',decoration:'arrow',blocks:[paragraph([{type:'text',text:'Explain this term',marks:[]}])]};attach(node,a);node.annotations.push(a);this.equationAnnotationId=a.id;}));
  const info=document.createElement('p');info.textContent='Choose a term and add an annotation. Edit the label text and maths in the document below.';this.inspector.append(info);
  const connectAnchor=(node,index)=>{const chosen=equationTargets(node.latex)[Number(index)];if(!chosen)return '';let a=node.anchors.find(a=>anchorResolved(node,a)&&a.start===chosen.start&&a.end===chosen.end);if(!a){a={id:uid(),...chosen};node.anchors.push(a);}return a.id;};
  this.button(this.inspector,'Add term-to-term arrow',()=>this.modify(node=>{const fromId=connectAnchor(node,target.value);node.connections??=[];node.connections.push({id:uid(),fromId,toId:fromId,colour:'#ff616b',height:3});}));
  for(const connection of n.connections??[]){
   const edit=(key,value)=>this.modify(node=>node.connections.find(c=>c.id===connection.id)[key]=value);
   for(const [label,key]of [['Arrow from','fromId'],['Arrow to','toId']]){
    const anchor=n.anchors.find(a=>a.id===connection[key]);
    const selected=targets.findIndex(t=>anchor&&t.start===anchor.start&&t.end===anchor.end);
    const options=targets.map((t,i)=>`${i+1}: ${t.text}`);
    this.field(label,options[selected]??'',v=>this.modify(node=>node.connections.find(c=>c.id===connection.id)[key]=connectAnchor(node,parseInt(v,10)-1)),'text',options);
   }
   this.colourField('Arrow colour',connection.colour,v=>edit('colour',v));
   this.field('Arrow height (mm)',connection.height,v=>edit('height',v));
   this.button(this.inspector,'Remove term arrow',()=>this.modify(node=>node.connections=node.connections.filter(c=>c.id!==connection.id)));
  }
  if(!n.annotations.length)return;
  const label=document.createElement('label'),select=document.createElement('select');label.textContent='Annotation ';select.setAttribute('aria-label','Selected equation annotation');select.disabled=this.host.readonly;
  for(const a of n.annotations){const option=document.createElement('option');option.value=a.id;option.textContent=(n.anchors.find(t=>t.id===a.targetId)?.text??'Missing term')+': '+toSource({blocks:a.blocks}).slice(0,65);select.append(option);}
  const a=n.annotations.find(a=>a.id===this.equationAnnotationId)??n.annotations[0];select.value=a.id;select.onchange=()=>{this.equationAnnotationId=select.value;this.properties();};label.append(select);this.inspector.append(label);
  const set=(key,value)=>this.modify(node=>{node.annotations.find(x=>x.id===a.id)[key]=value;});
  this.colourField('Annotation colour',a.colour,v=>set('colour',v));this.field('Annotation placement',a.placement,v=>set('placement',v),'text',['above','below']);this.field('Annotation style',a.decoration,v=>set('decoration',v),'text',['arrow','bracket','highlight','none']);
  this.button(this.inspector,'Attach annotation to selected term',()=>this.modify(node=>attach(node,node.annotations.find(x=>x.id===a.id))));
  this.button(this.inspector,'Remove annotation',()=>this.modify(node=>{node.annotations=node.annotations.filter(x=>x.id!==a.id);}));
  if(!n.anchors.some(t=>t.id===a.targetId&&anchorResolved(n,t))){const warning=document.createElement('output');warning.textContent='This annotation has lost its term. Choose a term and attach it again.';warning.setAttribute('role','status');this.inspector.append(warning);}
 }
};
