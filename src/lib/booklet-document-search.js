import {isDocument} from './document-content.js';
import {contentExcerpt} from './booklet-workspace.js';
const fields=new Set(['prompt','short','worked','title','label','description','body','text','solution','visibleSubtitle','content','theorySolution','explanation']);
const omit=new Set(['source','sourceAtom','sourceReview','sourceLayoutEvidence','bankRef','classification','originalDiagram','originalGraph','mathematicalModel','feedback']);
/** Existing block and question-part identities; never index evidence or layout IDs. */
export function questionCodeSearchIndex(project){
  const entries=[];
  for(const section of project?.sections??[])for(const block of section.blocks){
    const seen=new Set();
    const add=node=>{
      if(!node?.id||seen.has(node.id))return;
      seen.add(node.id);
      entries.push({kind:'code',code:node.id,rootId:node.id,blockId:block.id,sectionId:section.id,label:section.title,text:node.id+' · '+contentExcerpt(node===block?block.content:node,120)});
    };
    if(block.type==='question')add(block);
    const visit=node=>{if(!node||typeof node!=='object'||isDocument(node))return;if(node.prompt!==undefined||Array.isArray(node.children))add(node);for(const child of node.children??[])visit(child);};
    visit(block.content);
  }
  return entries;
}
export function searchDocumentEntries(entries,query){
  const needle=query.trim().toLowerCase();
  if(!needle)return [];
  return entries.filter(e=>(e.kind==='code'?e.code:e.text).toLowerCase().includes(needle))
    .sort((a,b)=>Number(b.code?.toLowerCase()===needle)-Number(a.code?.toLowerCase()===needle)).slice(0,100);
}
/** Search semantic fields once when Find opens, independent of mounted pages. */
export function documentSearchIndex(project){
  const entries=questionCodeSearchIndex(project);
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
