// Inspect active question content only. Evidence, feedback and supplied answers
// are not authoring defects and must never be rewritten by maintenance.
const excluded=new Set(['source','spec','sourceReview','sourceAtom','sourceLayoutEvidence','answer','theorySolution','steps','solution_text','originalContent','originalDiagram','originalGraph','before','after','provenance','studio','review','flags']);
export function dottedScaffoldLatex(value){
 return value.replace(/\\underline\{(\\rule\{0pt\}\{[\d.]+mm\})?\\hspace\{([\d.]+)mm\}\}/g,(_,strut,width)=>(strut??'')+'\\mathord{'+('\\ldotp'.repeat(Math.ceil(Number(width))))+'}');
}
export function underlinedQuestionScaffolds(value){
 const found=[];
 function visit(node,path='',owner){
  if(!node||typeof node!=='object')return;
  const id=node.id??owner;
  for(const [key,value] of Object.entries(node))if(!excluded.has(key)){
   const location=path+'/'+key;
   if(typeof value==='string'){
    const replacement=dottedScaffoldLatex(value);
    if(replacement!==value)found.push({id:id??location,location,value,replacement});
   }else visit(value,location,id);
  }
 }
 visit(value);return found;
}
