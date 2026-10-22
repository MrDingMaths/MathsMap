// Teaching presets (22 October 2026, user approved).
//
// For theory, definition, worked-example, scaffold and guided-practice blocks the source
// decides STRUCTURE and house style decides every MEASUREMENT. A preset turns a structural
// signature (teaching-signature.js) into exact-field patches that only write fields the
// renderer already reads, with every number taken from the house scale:
//   match(signature, {block})  -> {score, params} | null   how well the preset expresses it
//   build(block, params, house, context) -> patches[] | null
//                              null: the preset cannot realise the signature on this block;
//                              []:   it is already in place
//   expected(params)           -> the relationships the render should show afterwards
// A patch is {targetId, field, original, corrected}: a node id (or "project" for settings),
// a JSON pointer relative to that node, the exact current value and the new one. A
// `corrected` of undefined removes the field.
//
// The first seven presets are the house-presets-v1 presets of HOUSE_AUTHORING_PROMPT
// (scripts/booklet/house-authoring.mjs); the rest are the teaching presets added with
// source-match. Where no preset expresses a signature the caller records
// sourceReview.customArrangement.reason and the structure as 'custom'.
import {BOOKLET_HOUSE_STYLE,TEACHING_SCALE} from './booklet-house-style.js';
import {IMPORT_SPACING} from './booklet-import-spacing.js';
import {signatureHash,normKey} from './teaching-signature.js';
import {fromSource} from './document-content.js';

export const HOUSE={BOOKLET_HOUSE_STYLE,IMPORT_SPACING,TEACHING_SCALE};
export const PRESET_THRESHOLD=.5;

// ---- helpers -----------------------------------------------------------------------------

const SKIP=new Set(['sourceReview','sourceLayoutEvidence','sourceAtom','provenance','spec','originalDiagram','classification','bankRef']);
// Every node with an id inside a block, by id. The block itself is included.
export function nodeIndex(block){
 const map=new Map();
 const walk=(node,parent)=>{
  if(Array.isArray(node)){node.forEach(child=>walk(child,parent));return;}
  if(!node||typeof node!=='object')return;
  if(typeof node.id==='string'&&!map.has(node.id))map.set(node.id,{node,parent});
  for(const [key,child] of Object.entries(node))if(!SKIP.has(key)&&child&&typeof child==='object')walk(child,typeof node.id==='string'?node:parent);
 };
 walk(block,null);
 return map;
}
const escapeKey=key=>String(key).replace(/~/g,'~0').replace(/\//g,'~1');
// A patch on one field of a node (a single key, or a pointer path below the node).
export function fieldPatch(index,targetId,field,corrected){
 const hit=index.get(targetId);if(!hit)return null;
 const parts=field.split('/').filter(Boolean);
 let current=hit.node;for(const part of parts){current=current==null?undefined:current[part];}
 return {targetId,field:'/'+parts.map(escapeKey).join('/'),original:current===undefined?null:current,corrected};
}
const same=(a,b)=>JSON.stringify(a??null)===JSON.stringify(b??null);
// Drop patches that change nothing; null/undefined fields compare equal.
const effective=patches=>patches.filter(Boolean).filter(p=>!same(p.original,p.corrected));
const snapHalf=value=>Math.round(value*2)/2;
export const snapGap=(value,scale=TEACHING_SCALE.gapsMm)=>scale.reduce((best,s)=>Math.abs(s-value)<Math.abs(best-value)?s:best,scale[0]);
const lineById=signature=>new Map(signature.lines.map(l=>[l.id,l]));

// ---- paragraph editing -------------------------------------------------------------------------

// Writes paragraph fields (indent, spaceAfter, align) for the lines of a block. A line whose
// node is a paragraph is patched in place. A line whose text is a plain-string `prompt` of a
// question or part has no paragraph to patch: the minimal renderer-supported patch is to
// give that prompt its document form (the same text as one paragraph per line, through
// fromSource, which the renderer already reads in place of a string) and carry the field on
// those paragraphs. The text is unchanged; the content guard in trialApply checks that.
export class ParagraphEditor{
 constructor(index){this.index=index;this.fields=new Map();}
 // The node a line names, or null when it cannot be edited.
 node(nodeId){
  const hit=nodeId?this.index.get(nodeId)?.node:null;
  if(!hit)return null;
  return hit.type==='paragraph'||typeof hit.prompt==='string'&&hit.prompt.trim()?hit:null;
 }
 current(nodeId,field){
  const node=this.node(nodeId);if(!node)return undefined;
  const set=this.fields.get(nodeId)?.get(field);if(set!==undefined)return set;
  return node.type==='paragraph'?node[field]:undefined;
 }
 set(nodeId,field,value){
  if(!this.node(nodeId))return false;
  if(!this.fields.has(nodeId))this.fields.set(nodeId,new Map());
  this.fields.get(nodeId).set(field,value);return true;
 }
 patches(){
  const out=[];
  for(const [id,fields] of this.fields){
   const node=this.index.get(id).node;
   if(node.type==='paragraph'){for(const [field,value] of fields)out.push(fieldPatch(this.index,id,field,value));continue;}
   const doc=fromSource(node.prompt);
   if(!doc?.blocks?.length)continue;
   doc.blocks=doc.blocks.map(block=>block.type==='paragraph'?{...block,...Object.fromEntries(fields)}:block);
   out.push({targetId:id,field:'/prompt',original:node.prompt,corrected:doc});
  }
  return effective(out);
 }
}

// ---- structure record --------------------------------------------------------------------------

// sourceReview.structure = {preset|'custom', signatureHash}; a custom arrangement also records why.
export function structurePatches(block,{preset,presets=[],signature,reason=null}){
 const review=block.sourceReview??{};
 const value={preset:preset??'custom',...(presets.length>1?{presets}:{}),signatureHash:signatureHash(signature)};
 const out=[];
 if(!same(review.structure,value))out.push({targetId:block.id,field:'/sourceReview/structure',original:review.structure??null,corrected:value});
 if(preset==='custom'&&reason&&!same(review.customArrangement?.reason,reason))out.push({targetId:block.id,field:'/sourceReview/customArrangement',original:review.customArrangement??null,corrected:{...(review.customArrangement??{}),reason}});
 return out;
}

// ---- the presets ------------------------------------------------------------------------------

const questionRoot=block=>block.type==='question'?block.content:null;
const hasDiagrams=block=>!!(block.content?.questionDiagrams?.length||block.examples?.some(e=>e.questionDiagrams?.length));
const PLACEMENT={above:'before-prompt',left:'beside-prompt',right:'right-of-prompt',below:undefined,inline:undefined};

export const TEACHING_PRESETS=Object.freeze([
 // --- house-presets-v1 ----------------------------------------------------------------------
 {
  id:'stacked-parts',dimension:'layout',summary:'Parts stacked: omit layout (house preset 1).',
  match:(sig,{block})=>block.type==='question'&&sig.lanes===1?{score:.7,params:{}}:null,
  build(block){
   const root=questionRoot(block);if(!root)return null;
   const index=nodeIndex(block);
   return effective([root.layout==='grid'?fieldPatch(index,root.id,'layout',undefined):null]);
  },
  expected:()=>({layout:'stacked',lanes:1})
 },
 {
  id:'parts-grid',dimension:'layout',summary:'Parts in equal columns: layout "grid" with 2-5 columns (house preset 2).',
  match:(sig,{block})=>block.type==='question'&&sig.lanes>=TEACHING_SCALE.columnCounts.min&&sig.lanes<=TEACHING_SCALE.columnCounts.max?{score:.9,params:{columns:sig.lanes}}:null,
  build(block,params){
   const root=questionRoot(block);if(!root)return null;
   const index=nodeIndex(block);
   return effective([fieldPatch(index,root.id,'layout','grid'),fieldPatch(index,root.id,'columns',params.columns)]);
  },
  expected:params=>({layout:'side-by-side',lanes:params.columns})
 },
 ...[
  ['diagram-above','above','Diagram above the prompt (house preset 3).'],
  ['diagram-after','below','Diagram after the prompt: omit diagramPlacement (house preset 4).'],
  ['diagram-left','left','Diagram left of the prompt and parts (house preset 5).'],
  ['diagram-right','right','Diagram right of the prompt and parts (house preset 6).'],
 ].map(([id,side,summary])=>({
  id,dimension:'figure',summary,
  match:(sig,{block})=>block.type==='question'&&hasDiagrams(block)&&sig.figure&&(side==='below'?['below','inline'].includes(sig.figure.side):sig.figure.side===side)?{score:.9,params:{side}}:null,
  build(block){
   const root=questionRoot(block);if(!root)return null;
   return effective([fieldPatch(nodeIndex(block),root.id,'diagramPlacement',PLACEMENT[side])]);
  },
  expected:()=>({figure:{side}})
 })),
 {
  // Authoring-time only: one question block for the whole activity cannot be made from an existing one by field patches.
  id:'paired-worked-your-turn',dimension:'layout',summary:'Paired Worked Example | Your Turn rows in one question block (house preset 7); authored, never patched in.',authoringOnly:true,
  match:(sig)=>{const keys=sig.lines.slice(0,3).map(l=>l.tokens);return sig.lanes===2&&keys.some(k=>k.includes('workedexample'))&&keys.some(k=>k.includes('yourturn'))?{score:1,params:{}}:null;},
  build:()=>null,
  expected:()=>({layout:'side-by-side',lanes:2})
 },
 // --- teaching presets ---------------------------------------------------------------------------
 {
  id:'two-column-worked-example',dimension:'layout',summary:'Worked examples side by side: presentation.layout "columns".',
  match:(sig,{block})=>block.type==='worked-example'&&sig.lanes>=2&&sig.lanes<=TEACHING_SCALE.columnCounts.max?{score:.9,params:{columns:sig.lanes}}:null,
  build(block,params){
   if(block.type!=='worked-example')return null;
   if((block.examples?.length??0)<params.columns)return null;
   const next={...(block.presentation??{}),layout:'columns',columns:params.columns};
   return effective([{targetId:block.id,field:'/presentation',original:block.presentation??null,corrected:next}]);
  },
  expected:params=>({layout:'side-by-side',lanes:params.columns})
 },
 {
  id:'worked-rows',dimension:'layout',summary:'Worked examples stacked as rows: presentation.layout "worked-rows", operation arrows on the right through annotated equations.',
  match:(sig,{block})=>block.type==='worked-example'&&sig.lanes===1?{score:.6+(sig.arrows.some(a=>a.side==='right')?.2:0),params:{}}:null,
  build(block){
   if(block.type!=='worked-example')return null;
   if(block.presentation?.layout==='worked-rows'&&(block.presentation.columns??1)===1)return [];
   const next={...(block.presentation??{}),layout:'worked-rows',columns:1};
   return effective([{targetId:block.id,field:'/presentation',original:block.presentation??null,corrected:next}]);
  },
  expected:()=>({layout:'stacked',lanes:1})
 },
 {
  id:'ratio-table',dimension:'column',summary:'Ratio scaffold: terms beside a narrow colon column, no borders or header fill (sweep ratio convention).',
  match:(sig)=>sig.columns.some(c=>c.relation===':')?{score:.9,params:{}}:null,
  // The sweep rule is injected (it lives outside src/): context.ratioFix(block) returns the block after the rule.
  build(block,params,house,context={}){
   if(!context.ratioFix)return null;
   const before=nodeIndex(block),after=context.ratioFix(structuredClone(block));
   return diffPatches(before,after);
  },
  expected:()=>({columns:[{relation:':'}]})
 },
 {
  id:'equals-column',dimension:'column',summary:'Aligned relation signs: paragraphs indented, from the rendered positions, until each sign lies in one column (house equals-sign gutter).',
  match:(sig)=>sig.columns.length?{score:.8,params:{columns:sig.columns.map(c=>c.lineIds)}}:null,
  // Needs the render: context.render (its signature) and context.map (source line id -> render line id).
  build(block,params,house,context={}){
   const {render,map}=context;if(!render||!map)return null;
   const index=nodeIndex(block),lines=lineById(render),editor=new ParagraphEditor(index),shifts=new Map();
   for(const ids of params.columns){
    const rows=ids.map(id=>lines.get(map.get(id))).filter(Boolean);
    if(rows.length<2||rows.some(r=>!r.nodeId||r.geometry.relationX==null))return null;
    const target=Math.max(...rows.map(r=>r.geometry.relationX));
    for(const row of rows){
     const node=editor.node(row.nodeId);if(!node)return null;
     const delta=target-row.geometry.relationX;
     if(Math.abs(delta)<=TEACHING_SCALE.alignToleranceMm)continue;
     // Padding on the left moves a centred line by half as much.
     const align=(node.type==='paragraph'?node.align:null)??'left';
     if(align==='right')return null;
     shifts.set(row.nodeId,(shifts.get(row.nodeId)??0)+snapHalf(align==='center'?2*delta:delta));
    }
   }
   for(const [id,add] of shifts)editor.set(id,'indent',snapHalf(Math.max(0,(editor.current(id,'indent')??0)+add)));
   return editor.patches();
  },
  expected:params=>({columns:params.columns.map(lineIds=>({lineIds}))})
 },
 {
  id:'relative-indent',dimension:'indent',summary:'Indent levels as in the source, one house indent step per level.',
  match:(sig)=>sig.lines.some(l=>l.indent>0)?{score:.6,params:{}}:null,
  // context.levels: [{sourceId, level, lane}] for the lines of every lane whose indents differ;
  // context.render, context.map as above. Indents are only ever added (left padding): the base
  // is the smallest one that leaves every line at or right of where it stands.
  build(block,params,house,context={}){
   const {render,map,levels}=context;if(!render||!map||!levels?.length)return null;
   const index=nodeIndex(block),lines=lineById(render),step=TEACHING_SCALE.indentStepMm,editor=new ParagraphEditor(index);
   for(const lane of new Set(levels.map(l=>l.lane))){
    const rows=[];
    for(const {sourceId,level,lane:laneOf} of levels){
     if(laneOf!==lane)continue;
     const line=lines.get(map.get(sourceId)),node=line?.nodeId?editor.node(line.nodeId):null;
     if(!line||!node||(node.type==='paragraph'&&(node.align??'left')!=='left')||rows.some(r=>r.node===node))continue;
     rows.push({line,node,level:Math.min(level,TEACHING_SCALE.maxIndentLevels)});
    }
    // Every source line of the lane must meet a paragraph, or the lines left out would sit at
    // other indents than their equals in the source: decline rather than half-apply.
    if(rows.length<Math.ceil(.9*levels.filter(l=>l.lane===lane).length))return null;
    if(rows.length<2)continue;
    const base=Math.max(...rows.map(r=>r.line.geometry.x0-r.level*step));
    for(const r of rows){
     const delta=base+r.level*step-r.line.geometry.x0;
     if(Math.abs(delta)<=TEACHING_SCALE.alignToleranceMm/3)continue;
     editor.set(r.node.id,'indent',snapHalf(Math.max(0,(editor.current(r.node.id,'indent')??0)+delta)));
    }
   }
   return editor.patches();
  },
  expected:()=>({})
 },
 {
  id:'group-spacing',dimension:'groups',summary:'Relative grouping: within a group 1 mm, between groups 2 or 4 mm by the rank of the source gap.',
  match:(sig)=>sig.boundaries.some(b=>b.reliable)?{score:.6,params:{}}:null,
  // context.boundaries: [{lineId (render line above the gap), split, rank (0..1 among the source's splits)}]
  build(block,params,house,context={}){
   const {render,boundaries}=context;if(!render||!boundaries?.length)return null;
   const index=nodeIndex(block),lines=lineById(render),editor=new ParagraphEditor(index);
   for(const {lineId,split,rank=0} of boundaries){
    const line=lines.get(lineId);if(!line?.nodeId)continue;
    editor.set(line.nodeId,'spaceAfter',split?TEACHING_SCALE.betweenGroupMm[rank>=.5?1:0]:TEACHING_SCALE.withinGroupMm);
   }
   return editor.patches();
  },
  expected:()=>({})
 },
 {
  id:'line-alignment',dimension:'align',summary:'Centred and right-aligned display lines as in the source.',
  match:(sig)=>sig.lines.some(l=>['center','right'].includes(l.align))?{score:.5,params:{}}:null,
  // context.aligns: [{lineId (render line), align}]
  build(block,params,house,context={}){
   const {render,aligns}=context;if(!render||!aligns?.length)return null;
   const index=nodeIndex(block),lines=lineById(render);
   return effective(aligns.map(({lineId,align})=>{const line=lines.get(lineId);return line?.nodeId&&index.get(line.nodeId)?.node.type==='paragraph'?fieldPatch(index,line.nodeId,'align',align):null;}));
  },
  expected:()=>({})
 },
 {
  id:'numbered-steps',dimension:'markers',summary:'Numbered steps in worked examples: presentation.numberSteps.',
  match:(sig,{block})=>block.type==='worked-example'&&sig.lines.some(l=>l.marker)?{score:.7,params:{}}:null,
  build(block){
   if(block.type!=='worked-example')return null;
   if(block.presentation?.numberSteps===true)return [];
   return effective([{targetId:block.id,field:'/presentation',original:block.presentation??null,corrected:{...(block.presentation??{}),numberSteps:true}}]);
  },
  expected:()=>({})
 },
 {
  id:'emphasis-marks',dimension:'emphasis',summary:'Colour and bold of a source line, on the inlines of its paragraph, with palette colours.',
  match:(sig)=>sig.lines.some(l=>l.boldWords.length||!['ink','mixed'].includes(l.hue))?{score:.6,params:{}}:null,
  // context.emphases: [{lineId (render line), kind:'colour'|'bold', hue, words}].
  build(block,params,house,context={}){
   const {render,emphases}=context;if(!render||!emphases?.length)return null;
   const index=nodeIndex(block),lines=lineById(render),colours=BOOKLET_HOUSE_STYLE.colours,patches=[];
   for(const {lineId,kind,hue,words=[]} of emphases){
    const line=lines.get(lineId),node=line?.nodeId?index.get(line.nodeId)?.node:null;
    if(!node||node.type!=='paragraph')return null;
    node.inlines?.forEach((inline,i)=>{
     if(kind==='colour'&&['text','math'].includes(inline.type)&&colours[hue]&&inline.colour!==colours[hue]){
      // A line is one colour: only inlines that carry the line's text are recoloured.
      if(inline.type==='text'&&!normKey(inline.text))return;
      patches.push(fieldPatch(index,node.id,`inlines/${i}/colour`,colours[hue]));
     }
     // Bold only where an inline is exactly the bold word: splitting text would change content.
     if(kind==='bold'&&inline.type==='text'&&words.includes(normKey(inline.text))&&!(inline.marks??[]).includes('bold'))patches.push(fieldPatch(index,node.id,`inlines/${i}/marks`,[...(inline.marks??[]),'bold']));
    });
   }
   return effective(patches);
  },
  expected:()=>({})
 },
 {
  id:'figure-beside-working',dimension:'figure',summary:'Figure left (or right) of the working: an arrangement row of the figure and the rest of the block.',
  match:(sig,{block})=>block.type!=='question'&&hasDiagrams(block)&&sig.figure&&['left','right'].includes(sig.figure.side)?{score:.8,params:{side:sig.figure.side}}:null,
  // context.catalog: the block's default arrangement ({entries, initial}) from arrangementCatalog(block).
  build(block,params,house,context={}){
   const {catalog,settings}=context;if(!catalog)return null;
   const root=catalog.initial.root,items=[],collect=n=>n.type==='item'?items.push(n):n.children?.forEach(collect);collect(root);
   const figures=items.filter(i=>catalog.entries.get(i.ref)?.kind==='diagram'&&catalog.entries.get(i.ref)?.role==='content');
   const rest=items.filter(i=>!figures.includes(i));
   if(!figures.length||!rest.length)return null;
   const figureGroup={id:block.id+':figure',type:'group',direction:'stack',gap:IMPORT_SPACING.gap,children:figures.map(i=>({...i}))};
   const working={id:block.id+':working',type:'group',direction:'stack',gap:IMPORT_SPACING.gap,children:rest.map(i=>({...i}))};
   const row={id:block.id+':figure-row',type:'group',direction:'row',gap:IMPORT_SPACING.rowGap,children:params.side==='left'?[figureGroup,working]:[working,figureGroup]};
   const stored=settings?.layoutOverrides?.blockLayouts?.[block.id]??null,next={...(stored??{}),arrangement:{version:1,root:row}};
   return effective([{targetId:'project',field:'/settings/layoutOverrides/blockLayouts/'+escapeKey(block.id),original:stored,corrected:next}]);
  },
  expected:params=>({figure:{side:params.side}})
 },
 {
  id:'scaffold-table-column-arrows',dimension:'arrows',summary:'Arrows between cells of a native scaffold table: table.annotations.',
  match:(sig)=>sig.arrows.length?{score:.7,params:{arrows:sig.arrows}}:null,
  // context.render, context.map; arrows come from the source signature (params.arrows).
  build(block,params,house,context={}){
   const {render,map}=context;if(!render||!map)return null;
   const index=nodeIndex(block),lines=lineById(render),colours=BOOKLET_HOUSE_STYLE.colours,patches=[];
   const cellOf=nodeId=>{let hit=index.get(nodeId);while(hit&&hit.node.type!=='cell')hit=hit.parent?index.get(hit.parent.id):null;return hit?{cell:hit.node,table:index.get(hit.node.id)?.parent}:null;};
   const tableOf=nodeId=>{for(let hit=index.get(nodeId);hit;hit=hit.parent?index.get(hit.parent.id):null)if(hit.node.type==='table')return hit.node;return null;};
   let counter=0;const adds=new Map();
   for(const arrow of params.arrows){
    if(!arrow.from||!arrow.to)return null;
    // The printed label (×3, ÷5) is content: carry the source text, or queue the block when the signature kept only its key.
    if(arrow.label&&!arrow.labelText)return null;
    const from=lines.get(map.get(arrow.from)),to=lines.get(map.get(arrow.to));
    if(!from?.nodeId||!to?.nodeId)return null;
    const a=cellOf(from.nodeId),b=cellOf(to.nodeId),table=tableOf(from.nodeId);
    if(!a||!b||!table||table!==tableOf(to.nodeId))return null;
    const side=arrow.side==='between'||arrow.direction==='up'||arrow.direction==='down'?'middle':arrow.side==='above'?'top':'bottom';
    if((table.annotations??[]).some(x=>x.type==='arrow'&&x.cellId===a.cell.id&&x.toCellId===b.cell.id))continue;
    const colour=arrow.hue==='red'?colours.red:colours.ink;
    if(!adds.has(table.id))adds.set(table.id,{table,entries:[]});
    adds.get(table.id).entries.push({id:`${table.id}-arrow-${++counter}`,type:'arrow',cellId:a.cell.id,toCellId:b.cell.id,side,label:arrow.labelText??'',colour,heads:'end'});
   }
   for(const {table,entries} of adds.values())patches.push({targetId:table.id,field:'/annotations',original:table.annotations??null,corrected:[...(table.annotations??[]),...entries]});
   return effective(patches);
  },
  expected:params=>({arrows:params.arrows.map(a=>({direction:a.direction}))})
 },
]);
export const presetById=id=>TEACHING_PRESETS.find(p=>p.id===id)??null;

// Patches that turn the block indexed by `before` into `after`: one per changed scalar field
// (or list of numbers, such as widths) of a node that exists in both. Structure is not compared.
export function diffPatches(before,after){
 const out=[],afterIndex=nodeIndex(after),plain=v=>v===undefined||v===null||typeof v!=='object'||Array.isArray(v)&&v.every(x=>typeof x==='number');
 for(const [id,{node}] of before){
  const next=afterIndex.get(id)?.node;if(!next)continue;
  for(const key of new Set([...Object.keys(node),...Object.keys(next)])){
   if(key==='id'||key==='type'||!plain(node[key])||!plain(next[key]))continue;
   if(!same(node[key],next[key]))out.push({targetId:id,field:'/'+escapeKey(key),original:node[key]===undefined?null:node[key],corrected:next[key]});
  }
 }
 return out;
}

// ---- choosing --------------------------------------------------------------------------------------

// Rank the presets that match a source signature on a block, best first.
export function matchPresets(signature,block,{threshold=PRESET_THRESHOLD}={}){
 return TEACHING_PRESETS.map(preset=>({preset,hit:preset.match(signature,{block})})).filter(row=>row.hit&&row.hit.score>=threshold)
  .sort((a,b)=>b.hit.score-a.hit.score).map(row=>({preset:row.preset,score:row.hit.score,params:row.hit.params}));
}
// The preset for one dimension of mismatch (layout, column, indent, groups, align, markers, figure, arrows).
export function presetFor(dimension,signature,block){
 return matchPresets(signature,block).find(row=>row.preset.dimension===dimension&&!row.preset.authoringOnly)??null;
}
