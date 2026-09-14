import {isDocument,toSource} from './document-content.js';
const fields=new Set(['prompt','short','worked','title','label','description','body','text','solution','visibleSubtitle','content','theorySolution','explanation']);
const omit=new Set(['source','sourceAtom','sourceReview','sourceLayoutEvidence','bankRef','classification','originalDiagram','originalGraph','mathematicalModel','feedback']);
/** Search semantic fields once when Find opens, independent of mounted pages. */
export function documentSearchIndex(project){
  const entries=[];
  for(const section of project.sections){for(const block of section.blocks){
    const visit=(value,rootId=block.id,pointer='')=>{
      if(!value||typeof value!=='object')return;
      if(value.id){rootId=value.id;pointer='';}
      for(const [key,child] of Object.entries(value)){
        if(omit.has(key))continue;const path=pointer+'/'+key;
        if(fields.has(key)&&(typeof child==='string'||isDocument(child))){const base={rootId,pointer:path,blockId:block.id,sectionId:section.id,label:section.title};if(isDocument(child)){const scan=node=>{if(node.inlines){const text=node.inlines.map(i=>i.type==='text'?i.text:'\ufffc').join('');if(text.trim())entries.push({...base,nodeId:node.id,text});}for(const key of ['blocks','rows','slots','items'])for(const n of (node[key]??[]).flat())scan(n);};scan(child);}else if(child.trim())entries.push({...base,text:child});}
        else if(Array.isArray(child))child.forEach((item,index)=>visit(item,rootId,path+'/'+index));
        else if(child&&typeof child==='object'&&!isDocument(child))visit(child,rootId,path);
      }
    };visit(block);
  }}return entries;
}
