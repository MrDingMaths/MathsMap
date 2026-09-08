// Presentation labels never alter source identities or stored question references.
const letterKinds=new Set(['activity','investigation','identify','proof','verify','example','worked-example','guided-practice']);
export const usesTeachingLetters=block=>block?.type==='worked-example'||[block?.sourceAtom?.kind,block?.pedagogyRole,block?.variant].some(kind=>letterKinds.has(kind));
export function alphabeticLabel(index){let label='';for(let n=index+1;n>0;n=Math.floor((n-1)/26))label=String.fromCharCode(97+(n-1)%26)+label;return label;}
export function teachingLabels(blocks=[]){
 const labels={},counts=new Map(),seen=new Set();
 for(const block of blocks){
  if(seen.has(block.id)||!usesTeachingLetters(block))continue;seen.add(block.id);
  const key=block.sourceAtom?.id??block.id;
  const next=()=>{const index=counts.get(key)??0;counts.set(key,index+1);return alphabeticLabel(index);};
  const visit=node=>{if(!node)return;if(node.children?.length){labels[node.id]='';node.children.forEach(visit);}else labels[node.id]=next();};
  if(block.type==='question')visit(block.content);
  for(const example of block.examples??[])labels[example.id]='';
 }
 return labels;
}
export function labelledTeachingQuestion(block,labels){
 if(!usesTeachingLetters(block))return block;
 const visit=node=>node?{...node,label:labels[node.id]??node.label,...(node.children?{children:node.children.map(visit)}:{})}:node;
 return {...block,sourceOrder:null,content:visit(block.content)};
}
