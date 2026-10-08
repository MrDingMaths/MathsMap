// Only standalone source difficulty labels are metadata. Never search evidence
// trees or remove a word from mathematical prose.
export function standaloneDifficultyHeading(block){
 if(block?.type!=='rich-text')return null;
 const content=block.content;
 let text=typeof content==='string'?content:null;
 if(content?.format==='maths-editor-document-v1'&&content.blocks?.length===1){
  const p=content.blocks[0];
  if(p.type==='paragraph'&&p.inlines?.every(i=>['text','math'].includes(i.type)))text=p.inlines.map(i=>i.text??i.latex??'').join('');
 }
 if(text==null)return null;
 text=text.trim().replace(/^\$+|\$+$/g,'').replace(/\\(?:mathbf|textbf|mathrm|text)\{([^{}]*)\}/g,'$1').replace(/^[*#\s]+|[*\s]+$/g,'').trim();
 return /^(Foundation|Development|Standard|Extension|Mastery|Challenge)$/i.test(text)?text[0].toUpperCase()+text.slice(1).toLowerCase():null;
}
export function retainDifficultyAsMetadata(block){
 const difficulty=standaloneDifficultyHeading(block);
 return difficulty?{...block,presentation:{...block.presentation,editorOnly:true,sourceDifficulty:difficulty}}:block;
}

// Source difficulty pictograms (chillies) are evidence only: Studio draws its own
// from the reasoning score, so one inside rendered content would appear twice.
const evidenceKeys=new Set(['source','spec','sourceReview','sourceAtom','sourceLayoutEvidence','originalContent','originalDiagram','originalGraph','before','after','provenance','studio','review','flags','classification','flow','inventory','presentation']);
const pictogramAlt=/chil+i|chili pepper/i,markerAlt=/difficult|marker|icon|pictogram|symbol/i;
export function sourceDifficultyPictograms(value){
 const found=[];
 function visit(node,path,owner){
  if(!node||typeof node!=='object')return;
  const id=node.id??owner;
  if(typeof node.alt==='string'&&(node.src||node.code)&&pictogramAlt.test(node.alt)&&markerAlt.test(node.alt))found.push({id:id??path,location:path+'/alt'});
  for(const [key,child] of Object.entries(node))if(!evidenceKeys.has(key)){
   if(typeof child==='string'){if(child.includes('\u{1F336}'))found.push({id:id??path,location:path+'/'+key});}
   else visit(child,path+'/'+key,id);
  }
 }
 visit(value,'');return found;
}
