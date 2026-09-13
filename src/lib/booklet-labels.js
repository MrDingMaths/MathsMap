// Presentation labels never alter source identities or stored question references.
const letterKinds=new Set(['activity','investigation','identify','proof','verify','example','worked-example','guided-practice']);
export const usesReviewNumbers=block=>block?.type==='question'&&(block.sourceAtom?.kind??block.pedagogyRole??block.variant)==='review';
export const usesTeachingLetters=block=>block?.type==='worked-example'||[block?.sourceAtom?.kind,block?.pedagogyRole,block?.variant].some(kind=>letterKinds.has(kind));
export function alphabeticLabel(index){let label='';for(let n=index+1;n>0;n=Math.floor((n-1)/26))label=String.fromCharCode(97+(n-1)%26)+label;return label;}
// A named response cell can carry its visible heading inside its native table.
// Keep the stored label for answer references without printing it twice.
export function hasEmbeddedResponseLabel(node){
 if(node?.responseSpace!=='scaffold'||!node.label||node.children?.length)return false;
 // Answer-only leaves bind to a supplied scaffold elsewhere in the question.
 // Their labels remain available to answer editions, but do not create a
 // second empty labelled response below the native table.
 if(!node.prompt&&!node.questionDiagrams?.length&&node.answer)return true;
 const table=node.prompt?.blocks?.[0];
 if(table?.type!=='table'||table.rows?.[0]?.length!==1)return false;
 const blocks=table.rows[0][0]?.blocks;
 if(blocks?.length!==1||blocks[0].type!=='paragraph')return false;
 const inlines=blocks[0].inlines;
 return inlines?.length>0&&inlines.every(i=>i.type==='text')&&inlines.map(i=>i.text).join('').trim()===String(node.label).trim();
}
export function teachingLabels(blocks=[]){
 const labels={},counts=new Map(),seen=new Set();
 for(const block of blocks){
  if(seen.has(block.id)||!(usesTeachingLetters(block)||usesReviewNumbers(block)))continue;seen.add(block.id);
  const key=block.sourceAtom?.id??block.id;
  if(usesReviewNumbers(block)){
   const continuation=block.flow?.continuationOf??block.continuationOf;
   const original=continuation?blocks.find(b=>b.id===continuation):null;
   const number=original?labels[original.content?.id]??String(counts.get(key)||1):String((counts.get(key)??0)+1);
   labels[block.content.id]=number;
   if(!continuation)counts.set(key,Number(number));
   continue;
  }
  const next=()=>{const index=counts.get(key)??0;counts.set(key,index+1);return alphabeticLabel(index);};
  const visit=node=>{
   if(!node)return;
   // Separately prompted tasks inside one teaching box can each restart a–c.
   // Their explicit source labels are local to that task, unlike a flat set
   // of activity responses continued across blocks.
   if(node!==block.content&&!node.label&&node.prompt&&node.children?.length&&node.children.every((c,i)=>!c.children?.length&&c.label===alphabeticLabel(i))){
    labels[node.id]='';node.children.forEach(c=>{labels[c.id]=c.label;});return;
   }
   if(node.label===''&&!node.children?.length&&block.sourceReview?.responses?.some(r=>r.targetId===node.id&&(r.kind==='cloze'||r.label===''))){labels[node.id]='';return;}
   // A source-labelled task can contain explicitly unlabelled response slots,
   // such as Front/Back/Side/Top views of one solid. Letter the task once.
   if(node.label&&node.children?.length&&node.children.every(c=>!c.children?.length)
      &&(node.children.every(c=>c.label==='')||/^[a-z]$/i.test(String(node.label))&&node.children.every(c=>/^\d+$/.test(String(c.label??''))))){
    labels[node.id]=next();node.children.forEach(c=>{labels[c.id]=String(c.label);});
   }else if(node.children?.length){labels[node.id]='';node.children.forEach(visit);}
   else labels[node.id]=next();
  };
  if(block.type==='question')visit(block.content);
  for(const example of block.examples??[])labels[example.id]='';
 }
 return labels;
}
export function labelledTeachingQuestion(block,labels){
 if(usesReviewNumbers(block))return {...block,sourceOrder:Number(labels[block.content.id]??1)};
 if(!usesTeachingLetters(block))return block;
 const visit=node=>node?{...node,label:labels[node.id]??node.label,...(node.children?{children:node.children.map(visit)}:{})}:node;
 return {...block,sourceOrder:null,content:visit(block.content)};
}
