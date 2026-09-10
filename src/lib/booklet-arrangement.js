import {group,item,arrangementItems,normalizeArrangement,arrangementParent,findArrangement} from '../../public/libs/maths-editor/arrangement-model.mjs';
import {isDocument,normalizeDocument,fromSource,hasVisibleContent} from './document-content.js';
import {teachingLabels} from './booklet-labels.js';
import {estimateAnswerSpaceMm} from './practice-question-model.js';
import {visibleImportedQuestionTitle} from './booklet-preview.js';

export function arrangementExamTitle(block,entry){
 if(block.type!=='question'||entry?.ownerId!==block.content?.id||entry?.editorKey!==block.content.id+'/prompt')return '';
 return visibleImportedQuestionTitle(block);
}

export function arrangementQuestionBlock(question,number=null){
 return {...question,type:'question',sourceOrder:number??question.sourceOrder};
}

export function arrangementCatalog(block,overrides={},widthMm=180){
 const labels={...teachingLabels([block]),...overrides.labels};
 const entries=new Map(),emptyRefs=new Set();
 const add=(ref,data)=>{entries.set(ref,{ref,...data});return item(ref,data.title);};
 const field=(owner,key,role='content')=>{
   const value=key.split('/').reduce((x,k)=>x?.[k],owner);
   if(!hasVisibleContent(value)&&!(overrides.editable&&isDocument(value))){emptyRefs.add(owner.id+'/'+key);if(isDocument(value))value.blocks.forEach(n=>emptyRefs.add(owner.id+'/'+key+'#'+n.id));return [];}
   const title=key.includes('prompt')?'Text':key.includes('Solution')?'Solution':key;
   // The first native paragraph replaces the legacy field's rendered slot.
   // Keep its editor mounted without changing stored arrangement references.
   if(isDocument(value))return value.blocks.flatMap((n,index)=>{const ref=owner.id+'/'+key+'#'+n.id,doc=normalizeDocument({...value,blocks:[n]});if(!hasVisibleContent(doc)&&!overrides.editable){emptyRefs.add(ref);return [];}return [add(ref,{kind:'document',editorKey:owner.id+'/'+key+(index?'#'+n.id:''),ownerId:owner.id,field:key,nodeId:n.id,value:doc,role,title:n.type==='paragraph'?'Text':n.type})];});
   return [add(owner.id+'/'+key,{kind:'text',editorKey:owner.id+'/'+key,ownerId:owner.id,field:key,value,role,title})];
 };
 const diagrams=(owner,key='questionDiagrams',role='content')=>(owner[key]??[]).map(d=>add(d.id,{kind:'diagram',ownerId:owner.id,field:key,diagramId:d.id,value:d,role,title:d.alt??'Diagram'}));
 function question(n,index=0,root=false){
   const label=labels[n.id]??(root?block.sourceOrder??n.label:n.label??(n.children?.length?'':String.fromCharCode(97+index)));
   const labelItem=(label==null||label==='')&&!(n.id in labels)?[]:[add(n.id+'/label',{kind:'label',ownerId:n.id,value:String(label??''),title:label?'Label '+label:'Unlabelled stem'})];
   const prose=field(n,'prompt'),pics=diagrams(n),children=(n.children??[]).map((c,i)=>question(c,i));
   const childGroup=group(n.id+':parts',children,n.layout==='grid'?'row':'stack');
   if(n.layout==='grid'&&Math.max(2,n.columns||2)<children.length){childGroup.direction='stack';childGroup.children=[];for(let i=0;i<children.length;i+=Math.max(2,n.columns||2))childGroup.children.push(group(n.id+':row:'+i,children.slice(i,i+Math.max(2,n.columns||2)),'row'));}
   let body;
   if(n.representations){
    const slots=['pattern','table','equation','graph'].map(slot=>group(n.id+':'+slot,[...field(n,'representations/'+slot),...pics.filter(p=>(n.representations.diagramSlots?.[p.ref]??'graph')===slot),...(slot==='equation'?children:[])]));
    const hasPattern=hasVisibleContent(n.representations.pattern)||Object.values(n.representations.diagramSlots??{}).includes('pattern');
    const scenario=block.content?.layoutPreset==='scenario';
    if(scenario){slots[0].after=8;slots[2].after=10;}
    const layout=scenario?[group(n.id+':variables-table-equation',slots.slice(0,3)),slots[3]]:hasPattern?[group(n.id+':top',slots.slice(0,2),'row'),group(n.id+':bottom',slots.slice(2),'row')]:[group(n.id+':table-equation',slots.slice(1,3)),slots[3]];
    body=[...prose,group(n.id+':representations',layout,hasPattern&&!scenario?'stack':'row')];
   }
   else if(['beside-prompt','right-of-prompt'].includes(n.diagramPlacement)&&pics.length){const text=group(n.id+':text',[...prose,...children.length?[childGroup]:[]]);const images=group(n.id+':diagrams',pics);body=[group(n.id+':beside',n.diagramPlacement==='beside-prompt'?[images,text]:[text,images],'row')];}
   else body=[...(n.diagramPlacement==='before-prompt'?pics:[]),...prose,...(n.diagramPlacement!=='before-prompt'?pics:[]),...field(n,'afterDiagramPrompt'),...children.length?[childGroup]:[]];
   if(!children.length){body.push(add(n.id+'/space',{kind:'space',ownerId:n.id,value:n.responseSpace==='scaffold'?0:estimateAnswerSpaceMm(n),title:'Answer space'}));}
   field(n,'answer/short','answer-short');field(n,'answer/worked','answer-worked');
   for(const d of n.answer?.solutionDiagrams??[])add(d.id,{kind:'diagram',ownerId:n.id,diagramId:d.id,value:d,role:'answer-worked',title:d.alt??'Solution diagram'});
   return {...group(n.id+':question',[...labelItem,...body]),title:root?'Question '+(label??''):label?'Part '+label:'Unlabelled part '+(index+1)};
 }
 function example(e,index){
   const label=add(e.id+'/label',{kind:'label',ownerId:e.id,value:labels[e.id]??e.label??String.fromCharCode(97+index),title:'Example '+(labels[e.id]??e.label??String.fromCharCode(97+index))});
   const steps=e.steps?.length?e.steps.map((_,i)=>group(e.id+':step:'+i,[...(block.presentation?.numberSteps===true?[add(e.id+'/step-label/'+i,{kind:'label',ownerId:e.id,value:String(i+1)+'.',role:'solution',title:'Step '+(i+1)})]:[]),...field(e,'steps/'+i,'solution')])).flat():field(e,'theorySolution','solution');
   const numberLine=e.numberLineTikz?[add(e.id+'/numberLineTikz',{kind:'diagram',ownerId:e.id,field:'numberLineTikz',value:{id:e.id+'/numberLineTikz',format:'tikz',code:e.numberLineTikz,widthMm:70},role:'solution',title:'Number line'})]:[];
   const bases=diagrams(e),solutions=diagrams(e,'solutionDiagrams','solution');
   const separate=solutions.filter(i=>{const overlay=entries.get(i.ref),base=entries.get(overlay.value.overlayOf);if(base&&bases.some(n=>n.ref===base.ref)){base.overlays??=[];base.overlays.push(overlay.value);overlay.role='solution-overlay';return false;}return true;});
   return group(e.id+':example',[label,...field(e,'prompt'),...bases,...steps,...numberLine,...field(e,'explanation','solution'),...separate]);
 }
 let root;
 if(block.type==='question')root=question(block.content,0,true);
 else {const contents=block.examples?.length?group(block.id+':examples',block.examples.map(example),block.presentation?.layout==='columns'?'row':'stack'):group(block.id+':content',[...field(block,'content'),...field(block,'text'),...field(block,'theorySolution','solution')]);root=group(block.id+':root',[contents]);}
 function applyOverrides(n,available){
   const entry=entries.get(n.ref),layout=overrides.blockLayouts?.[entry?.ownerId??n.id.replace(/:(question|example)$/,'')];
   if(entry?.kind==='space'&&overrides.answerSpaces?.[entry.ownerId]!=null)n.height=overrides.answerSpaces[entry.ownerId];
   if(entry?.kind==='diagram'){if(entry.value.align)n.align=entry.value.align;if(layout?.diagramSizing==='fit')n.align='stretch';else if(layout?.diagramWidthMm!=null)n.width=layout.diagramWidthMm;if(overrides.diagramWidths?.[entry.diagramId]!=null)n.width=overrides.diagramWidths[entry.diagramId];}
   if(n.type==='group'){
    if(layout?.insetMm!=null)n.inset=layout.insetMm;
    if(n.id.endsWith(':beside')){const sourceId=n.id.slice(0,-7),saved=overrides.blockLayouts?.[sourceId],source=findContent(block,sourceId);if(saved){n.gap=saved.gapMm??n.gap;if(saved.textWidthMm!=null){const at=source?.diagramPlacement==='beside-prompt'?1:0;n.children[at].weight=Math.max(15,Math.min(available-15,saved.textWidthMm));n.children[1-at].weight=Math.max(15,available-n.children[at].weight-(n.gap??2));}}}
    const width=available-(n.children[0]&&entries.get(n.children[0].ref)?.kind==='label'&&entries.get(n.children[0].ref)?.value?7:0),sum=n.children.reduce((a,c)=>a+(c.weight??1),0);
    n.children.forEach(c=>applyOverrides(c,n.direction==='row'?(width-(n.gap??2)*(n.children.length-1))*(c.weight??1)/sum:width));
   }
 }
 applyOverrides(root,widthMm);
 return {entries,emptyRefs,initial:{version:1,root}};
}
export function resolveArrangement(block,stored,overrides={},widthMm=180){
 const catalog=arrangementCatalog(block,overrides,widthMm),tree=normalizeArrangement(stored)??catalog.initial;
 // Also collapse blanks saved by older editor versions, including their margins
 // and any groups made empty by removing them. Unknown references still warn.
 const collapse=node=>{
  if(node.type==='item')return !catalog.emptyRefs.has(node.ref);
  const hadChildren=node.children.length>0;
  node.children=node.children.filter(collapse);
  return !hadChildren||node.children.length>0;
 };
 collapse(tree.root);
 if(stored){
  const labels={...teachingLabels([block]),...overrides.labels},refs=new Set(arrangementItems(tree.root).map(n=>n.ref));
  const reconcile=node=>{if(node.type!=='group')return;const target=findArrangement(tree.root,node.id);if(target){for(const child of node.children){const entry=catalog.entries.get(child.ref);if(entry?.kind==='label'&&entry.ownerId in labels&&!refs.has(child.ref)){target.children.unshift({...child});refs.add(child.ref);}}}node.children.forEach(reconcile);};
  reconcile(catalog.initial.root);
 }
 const missing=arrangementItems(tree.root).filter(n=>!catalog.entries.has(n.ref));
 return {...catalog,tree,missing};
}
export function findContent(root,id){if(root?.id===id)return root;for(const [key,v]of Object.entries(root??{})){if(['spec','sourceAtom','sourceLayoutEvidence','sourceReview','originalDiagram','originalGraph','mathematicalModel'].includes(key))continue;if(v&&typeof v==='object'){const found=(Array.isArray(v)?v:[v]).map(x=>findContent(x,id)).find(Boolean);if(found)return found;}}}
export function setGroupAnswerSpaceHeight(tree,entries,groupId,height){
 if(!Number.isFinite(height)||height<0||height>180)throw Error('Answer space height must be between 0 and 180 mm');
 const next=JSON.parse(JSON.stringify(tree)),group=findArrangement(next.root,groupId);
 if(group?.type!=='group')throw Error('Select a group');
 for(const node of arrangementItems(group))if(entries.get(node.ref)?.kind==='space')node.height=height;
 return next;
}
export function replaceArrangementContent(block,entry,value){
 const next=JSON.parse(JSON.stringify(block)),owner=findContent(next,entry.ownerId);
 if(!owner)throw Error('Content is no longer available');
 if(entry.kind==='diagram'){if(entry.diagramId){const d=findContent(next,entry.diagramId);Object.assign(d,value);}else owner[entry.field]=value.code;}
 else {const path=entry.field.split('/');let target=owner;for(const key of path.slice(0,-1))target=target[key];const key=path.at(-1);
   if(entry.nodeId){const doc=target[key],at=doc.blocks.findIndex(n=>n.id===entry.nodeId);if(at<0)throw Error('Content has changed');const blocks=JSON.parse(JSON.stringify(value.blocks));if(blocks[0])blocks[0].id=entry.nodeId;doc.blocks.splice(at,1,...blocks);}
   else target[key]=value;
 }
 return next;
}

// Preserve identity of unchanged branches so review reconciliation stays local.
export function shareUnchanged(previous,next){
 if(previous===next)return previous;if(!previous||!next||typeof previous!=='object'||typeof next!=='object')return next;
 const keys=Object.keys(next);if(Array.isArray(previous)!==Array.isArray(next))return next;
 let equal=keys.length===Object.keys(previous).length;const result=Array.isArray(next)?[]:{};
 for(const k of keys){result[k]=shareUnchanged(previous[k],next[k]);if(result[k]!==previous[k])equal=false;}return equal?previous:result;
}

// Use the same content/reference reconciliation for a live draft and its applied edit.
export function applyArrangementContent(block,tree,selected,entry,value){
 if(entry.kind==='diagram'){
  const nextTree=JSON.parse(JSON.stringify(tree)),node=findArrangement(nextTree.root,selected);
  if(node){node.width=value.widthMm;if(['left','center','right','stretch'].includes(value.align))node.align=value.align;else if(node.align==='stretch'&&value.widthMm!==entry.value.widthMm)node.align='start';}
  return {block:replaceArrangementContent(block,entry,value),tree:nextTree,selected};
 }
 if(isDocument(value))value={...value,blocks:value.blocks.filter(n=>hasVisibleContent({...value,blocks:[n]}))};
 else if(!hasVisibleContent(value))value='';
 const nextBlock=replaceArrangementContent(block,entry,value);
 const updated=resolveArrangement(nextBlock,tree),used=new Set(arrangementItems(tree.root).map(n=>n.ref));
 const fieldEntries=[...updated.entries.values()].filter(e=>e.ownerId===entry.ownerId&&e.field===entry.field);
 const nextTree=JSON.parse(JSON.stringify(tree)),parent=arrangementParent(nextTree.root,selected),node=findArrangement(nextTree.root,selected);
 if(node&&!updated.entries.has(node.ref)){
  const replacement=fieldEntries.find(e=>!used.has(e.ref));
  if(replacement){node.ref=replacement.ref;used.add(replacement.ref);}
  else if(parent){parent.children=parent.children.filter(n=>n.id!==selected);selected=parent.id;}
 }
 const extras=fieldEntries.filter(e=>!used.has(e.ref));
 if(extras.length&&parent)parent.children.splice(Math.max(0,parent.children.findIndex(n=>n.id===selected)+1),0,...extras.map(e=>({id:'layout:'+e.ref,type:'item',ref:e.ref})));
 return {block:nextBlock,tree:resolveArrangement(nextBlock,nextTree).tree,selected};
}

export function removeArrangementText(block,tree,selected,entry){
 if(!entry||!['text','document'].includes(entry.kind))throw Error('Select text to remove');
 return applyArrangementContent(block,tree,selected,entry,entry.nodeId?{...entry.value,blocks:[]}: '');
}

export function addArrangementText(block,tree,selected){
 const resolved=resolveArrangement(block,tree),node=findArrangement(resolved.tree.root,selected),entry=resolved.entries.get(node?.ref);
 const paragraph=fromSource('New text').blocks[0];
 // Adding beside text retains its content field and position, even in a custom column.
 if(entry&&['text','document'].includes(entry.kind)){
  const doc=isDocument(entry.value)?normalizeDocument(entry.value):fromSource(entry.value);
  const result=applyArrangementContent(block,resolved.tree,selected,entry,{...doc,blocks:[...doc.blocks,paragraph]});
  result.selected='layout:'+entry.ownerId+'/'+entry.field+'#'+paragraph.id;
  return result;
 }
 let container=node?.type==='group'?node:arrangementParent(resolved.tree.root,selected),owner;
 for(let ancestor=container;ancestor&&!owner;ancestor=arrangementParent(resolved.tree.root,ancestor.id)){
  owner=findContent(block,ancestor.id.replace(/:(question|example|root|content)$/,''));
 }
 owner??=block.type==='question'?block.content:block;
 // Worked examples store their prose on each example, not the outer block.
 if(owner===block&&block.examples?.length){owner=block.examples[0];container=findArrangement(resolved.tree.root,owner.id+':example')??container;}
 const field=owner===block&&block.type!=='question'?'content':'prompt';
 const nextBlock=JSON.parse(JSON.stringify(block)),target=findContent(nextBlock,owner.id);
 const doc=isDocument(target[field])?normalizeDocument(target[field]):fromSource(target[field]??'');
 const nextTree=JSON.parse(JSON.stringify(resolved.tree));
 // Converting legacy text to a document must update its old reference as well.
 if(!isDocument(target[field])){
  const old=arrangementItems(nextTree.root).find(n=>n.ref===owner.id+'/'+field);
  if(old&&doc.blocks.length){old.ref=owner.id+'/'+field+'#'+doc.blocks[0].id;const parent=arrangementParent(nextTree.root,old.id);parent.children.splice(parent.children.indexOf(old)+1,0,...doc.blocks.slice(1).map(n=>item(owner.id+'/'+field+'#'+n.id)));}
 }
 target[field]={...doc,blocks:[...doc.blocks,paragraph]};
 const added=item(owner.id+'/'+field+'#'+paragraph.id,'Text');
 container=findArrangement(nextTree.root,container?.id)??nextTree.root;
 // A group's new prompt goes before its parts or diagrams; a selected item gets a sibling.
 const at=node?.type==='item'?container.children.findIndex(n=>n.id===selected)+1:container.children.findIndex(n=>resolved.entries.get(n.ref)?.kind!=='label');
 container.children.splice(Math.max(0,at),0,added);
 return {block:nextBlock,tree:resolveArrangement(nextBlock,nextTree).tree,selected:added.id};
}
