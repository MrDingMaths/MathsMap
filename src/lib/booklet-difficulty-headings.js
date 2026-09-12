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
