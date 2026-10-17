import {questionSpacing,applyQuestionSpacing} from './booklet-document-tools.js';
import {setTableRowHeights,setTablePadding,tablePadding} from '../../public/libs/maths-editor/document-operations.mjs';

// One value for every like item in the selected blocks. Answer editions keep
// their own spacing, and source evidence is never an editing target.
const skipped=new Set(['answer','source','sourceAtom','sourceReview','sourceLayoutEvidence','originalDiagram','originalGraph','mathematicalModel','bankRef','classification','flow']);
const PARAGRAPH={lineHeight:[1.4,1,3],spaceBefore:[0,0,40],spaceAfter:[2,0,40]};
const TABLE={rowHeight:[10,4,80],padding:[2,0,20]};
const EXAMPLE={aboveMm:[2,0,120],belowMm:[4,0,120],gapMm:[3,0,120],minHeightMm:[29,0,120]};
const QUESTION={height:[0,0,180],gap:[2,0,30]};
export const BLOCK_SPACING_FIELDS={...QUESTION,...PARAGRAPH,...TABLE,...EXAMPLE};

const isDocument=value=>!!value&&typeof value==='object'&&!Array.isArray(value)&&typeof value.format==='string'&&Array.isArray(value.blocks);
export function blockDocuments(block){
  const found=[];
  const visit=(node,path)=>{
    if(!node||typeof node!=='object')return;
    if(isDocument(node)){found.push({path,document:node});return;}
    for(const [key,value]of Object.entries(node))if(!skipped.has(key))visit(value,[...path,key]);
  };
  visit(block,[]);return found;
}
// Paragraphs inside a table cell take the cell's spacing unless the cell keeps
// its own, so before/after only reaches paragraphs where the value is rendered.
function documentTargets(document){
  const paragraphs=[],tables=[];
  const visit=(node,cell)=>{
    if(!node||typeof node!=='object')return;
    if(node.type==='paragraph')paragraphs.push({node,spaced:!cell||!!cell.preserveParagraphSpacing});
    if(node.type==='table')tables.push(node);
    const inside=node.type==='cell'?node:cell;
    for(const key of ['blocks','rows','slots','items'])for(const child of (node[key]??[]).flat())visit(child,inside);
  };
  visit(document,null);return {paragraphs,tables};
}
const blocksOf=(project,blockIds)=>{const ids=new Set(blockIds);return project.sections.flatMap(s=>s.blocks).filter(b=>ids.has(b.id));};
const common=values=>values.length&&values.every(v=>v===values[0])?values[0]:'';

export function blockSpacing(project,blockIds){
  const blocks=blocksOf(project,blockIds),paragraphs=[],tables=[],examples=[],questions=[];
  for(const block of blocks){
    for(const {document}of blockDocuments(block)){const targets=documentTargets(document);paragraphs.push(...targets.paragraphs);tables.push(...targets.tables);}
    examples.push(...(block.examples??[]));
    try{questions.push(questionSpacing(project,block));}catch{/* blocks without an arrangement have no answer spaces */}
  }
  const spaced=paragraphs.filter(p=>p.spaced);
  const values={
    height:questions.some(q=>q.spaces.length)?common(questions.filter(q=>q.spaces.length).map(q=>q.height)):'',
    gap:questions.some(q=>q.stacks.length)?common(questions.filter(q=>q.stacks.length).map(q=>q.gap)):'',
    lineHeight:common(paragraphs.map(p=>p.node.lineHeight??1.4)),
    spaceBefore:common(spaced.map(p=>p.node.spaceBefore??0)),
    spaceAfter:common(spaced.map(p=>p.node.spaceAfter??2)),
    rowHeight:common(tables.flatMap(t=>t.rows.map((_,i)=>t.rowHeights?.[i]??10))),
    padding:common(tables.map(t=>tablePadding(t)??'')),
  };
  for(const [key,[fallback]]of Object.entries(EXAMPLE))values[key]=common(examples.map(e=>e.rowLayout?.[key]??fallback));
  return {blocks:blocks.length,counts:{spaces:questions.reduce((n,q)=>n+q.spaces.length,0),stacks:questions.reduce((n,q)=>n+q.stacks.length,0),paragraphs:paragraphs.length,spaced:spaced.length,tables:tables.length,rows:tables.reduce((n,t)=>n+t.rows.length,0),examples:examples.length},values};
}

const replace=(root,path,value)=>{if(!path.length)return value;const [key,...tail]=path,next=Array.isArray(root)?[...root]:{...root};next[key]=replace(root[key],tail,value);return next;};
function spaceBlock(block,key,value){
  let next=block;
  if(key in EXAMPLE){if(block.examples?.length)next={...block,examples:block.examples.map(e=>({...e,rowLayout:{...e.rowLayout,[key]:value}}))};return next;}
  for(const {path,document}of blockDocuments(block)){
    const copy=structuredClone(document),targets=documentTargets(copy);
    let changed=false;
    if(key in PARAGRAPH)for(const p of targets.paragraphs)if(key==='lineHeight'||p.spaced){p.node[key]=value;changed=true;}
    if(key==='rowHeight')for(const table of targets.tables){setTableRowHeights(table,value);changed=true;}
    if(key==='padding')for(const table of targets.tables){setTablePadding(table,value);changed=true;}
    if(changed)next=replace(next,path,copy);
  }
  return next;
}
export function applyBlockSpacing(project,blockIds,key,value){
  const limits=BLOCK_SPACING_FIELDS[key];
  if(!limits)throw Error('Unknown spacing setting.');
  if(!Number.isFinite(value)||value<limits[1]||value>limits[2])throw Error(`Enter a value between ${limits[1]} and ${limits[2]}.`);
  if(key in QUESTION){
    let next=project;
    for(const block of blocksOf(project,blockIds)){
      let state;try{state=questionSpacing(next,block);}catch{continue;}
      if((key==='height'?state.spaces:state.stacks).length)next=applyQuestionSpacing(next,block.id,key,value);
    }
    return next;
  }
  const ids=new Set(blockIds);let touched=false;
  const sections=project.sections.map(section=>{
    let changed=false;
    const blocks=section.blocks.map(block=>{if(!ids.has(block.id))return block;const next=spaceBlock(block,key,value);if(next!==block)changed=true;return next;});
    if(!changed)return section;touched=true;return {...section,blocks};
  });
  return touched?{...project,sections}:project;
}
