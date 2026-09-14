// Reconcile a native field without replacing its live mathematics or text nodes.
// moveBefore preserves custom-element state and browser selection on supported hosts.
export function moveConnected(parent,node,before=null){
  if(node.parentNode===parent&&node.nextSibling===before)return;
  if(parent.moveBefore&&node.isConnected&&parent.isConnected)parent.moveBefore(node,before);
  else parent.insertBefore(node,before);
}
export function reconcileDocumentDOM(surface,html){
  const template=document.createElement('template');template.innerHTML=html;
  const key=(node,index)=>node.nodeType===1?(node.dataset.id?'id:'+node.dataset.id:node.matches('[data-math]')?'math:'+index:node.tagName+':'+index):'#text:'+index;
  const attributes=(old,next)=>{for(const attr of [...old.attributes])if(!next.hasAttribute(attr.name))old.removeAttribute(attr.name);for(const attr of next.attributes)if(old.getAttribute(attr.name)!==attr.value)old.setAttribute(attr.name,attr.value);};
  const patch=(parent,source)=>{
    const children=[...parent.childNodes],desired=[...source.childNodes],byKey=new Map(children.map((n,i)=>[key(n,i),n]));let cursor=parent.firstChild;const retained=new Set();
    desired.forEach((fresh,i)=>{
      let node=byKey.get(key(fresh,i));if(node?.nodeType!==fresh.nodeType||node?.nodeName!==fresh.nodeName)node=null;
      if(!node){node=fresh.cloneNode(true);parent.insertBefore(node,cursor);}
      else{
        moveConnected(parent,node,cursor===node?node.nextSibling:cursor);
        if(node.nodeType===3){if(node.data!==fresh.data)node.data=fresh.data;}
        else if(node.nodeType===1){
          attributes(node,fresh);
          if(node.matches('[data-math]')){const field=node.querySelector('math-field'),next=fresh.querySelector('math-field');if(field&&next&&field.getValue('latex')!==next.textContent)field.setValue(next.textContent,{silenceNotifications:true});const preview=node.querySelector('[data-math-preview]'),newPreview=fresh.querySelector('[data-math-preview]');if(preview&&newPreview&&preview.innerHTML!==newPreview.innerHTML)preview.innerHTML=newPreview.innerHTML;}
          else if(node.tagName!=='MATH-FIELD')patch(node,fresh);
        }
      }
      retained.add(node);cursor=node.nextSibling;
    });
    for(const node of children)if(!retained.has(node))node.remove();
  };patch(surface,template.content);
}
