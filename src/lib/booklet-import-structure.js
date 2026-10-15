// Import diagnostics examine active content only; source inventories stay exact.
import {arrangementCatalog} from './booklet-arrangement.js';
const evidence = new Set(['source','sourceReview','sourceRefs','sourceLayoutEvidence','spec','provenance','answer','originalContent']);
export function walkImportContent(value,visit,path='') {
 if(!value||typeof value!=='object')return;
 if(!Array.isArray(value))visit(value,path);
 for(const [key,child]of Object.entries(value))if(!evidence.has(key))walkImportContent(child,visit,path+'/'+key);
}
const proper=new Map('Pythagoras Pythagorean Cartesian Euler Newton Simpson Venn Pascal Medicare Mon Tue Wed Thu Fri Sat Sun Monday Tuesday Wednesday Thursday Friday Saturday Sunday January February March April May June July August September October November December Australian Australia Nuts Bolts Jenny Ben'.split(' ').map(word=>[word.toLowerCase(),word]));
const acronyms=new Set(['HSC','NAPLAN','ICAS','IB','PAYG','GST','VAT','NSW','NESA','HCF','LCM','BIDMAS','BODMAS','SAS','SSS','ASA','AAS','RHS','SOH','CAH','TOA','FDP','GDP','BMI','ABN','ATO','COVID','USA','UK']);
const unitSymbols=new Set(['mm','cm','km','mg','kg','mL','kW','kWh','kJ','MHz']);
export function sentenceCaseHeader(text) {
 if(typeof text!=='string')return text;
 // Native/TeX spans and single-letter mathematical variables are untouched.
 let first=true;
 return text.replace(/\$[^$]*\$|\\[a-zA-Z]+|[A-Z]{2,}\d+(?:-[A-Z0-9]+)+|[A-Za-z]+(?:[’'][A-Za-z]+)?/g,word=>{
  if(word.startsWith('$')||word.startsWith('\\')||/\d/.test(word))return word;
  if(unitSymbols.has(word)){first=false;return word;}
  const base=word.replace(/[’']s$/i,''),suffix=word.slice(base.length);
  const known=proper.get(base.toLowerCase());
  const next=known?known+suffix:acronyms.has(base.toUpperCase())?base.toUpperCase()+suffix:base.length===1?word:(first?word[0].toUpperCase()+word.slice(1).toLowerCase():word.toLowerCase());
  first=false;return next;
 });
}
export function isTableHeader(cell,rowIndex) {
 if(/(?:name|employee|person)(?:-|$)/i.test(cell.id??'')&&!/header|heading/i.test(cell.id??''))return false;
 return cell.header===true||cell.background&&cell.background!=='transparent'||rowIndex===0&&cell.blocks?.length&&cell.blocks.every(p=>p.type==='paragraph'&&p.inlines?.length&&p.inlines.every(i=>i.type==='text'&&i.marks?.includes('bold')));
}
export function importStructureFindings(project) {
 const findings=[];
 for(const section of project.sections??[])for(const block of section.blocks??[]){
  const syllabus=/syllabus/i.test([section.title,block.title,block.id,block.sourceAtom?.label].filter(Boolean).join(' '));
  if(syllabus&&(block.type==='callout'||block.sourceAtom?.kind==='definition'))findings.push({severity:'error',kind:'boxed-syllabus',blockId:block.id,note:'Syllabus content belongs in an unboxed rich-text block beneath the section header.'});
  const root=block.content,headers=root?.prompt?.blocks?.filter(n=>n.type==='table')??[];
  for(const table of headers.filter(t=>t.border!==false&&t.widths?.length>1)){
   const widths=JSON.stringify(table.widths),rows=(root.children??[]).map(part=>part.prompt?.blocks?.find(n=>n.type==='table'&&JSON.stringify(n.widths)===widths));
   if(rows.length>1&&rows.every(Boolean)&&table.rows?.flat().every(c=>c.header||c.background&&c.background!=='transparent'))findings.push({severity:'error',kind:'fragmented-table',blockId:block.id,targetId:table.id,note:'A table header and its data rows are separate tables; use one native table and retain answer-owning parts.'});
   const layout={...project.settings?.layoutOverrides,...block.presentation?.layoutOverrides,blockLayouts:{...project.settings?.layoutOverrides?.blockLayouts,...block.presentation?.layoutOverrides?.blockLayouts}};
   const arrangement=layout.blockLayouts?.[block.id]?.arrangement;
   if(arrangement&&table.rows.length===1&&table.rows[0].every(c=>isTableHeader(c,0))){
    const catalog=arrangementCatalog(block,layout);let splitRows=0;
    walkImportContent(arrangement,n=>{
     if(n.type!=='group'||n.direction!=='row'||n.children?.length!==table.rows[0].length||!n.children.every(c=>c.type==='item'))return;
     const entries=n.children.map(c=>catalog.entries.get(c.ref));
     if(entries.some(e=>!e)||!entries.some(e=>e.kind==='diagram'))return;
     if(entries.every(e=>e.kind==='diagram'||e.kind==='document'&&e.value?.blocks?.length&&e.value.blocks.every(b=>b.type!=='table'||b.rows?.length===1&&b.rows[0].length===1)))splitRows++;
    });
    if(splitRows&&!findings.some(f=>f.blockId===block.id&&f.targetId===table.id&&f.kind==='fragmented-table'))findings.push({severity:'error',kind:'fragmented-table',blockId:block.id,targetId:table.id,note:'Table columns are separate cell documents and diagrams in an arrangement; use one native table with editable TikZ in its cells and stable row ownership.'});
   }
  }
  walkImportContent(block.content,n=>{
   if(n.type==='table'&&n.border!==false&&n.rows?.length&&n.rows.every(row=>row.length===1&&!(row[0].colspan>1)))findings.push({severity:'review',kind:'single-column-table',blockId:block.id,targetId:n.id,note:'Confirm a mathematical/response purpose; a one-column table used only to frame prose duplicates its teaching container.'});
  });
 }
 return findings;
}
