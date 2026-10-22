import {resolveArrangement,findContent,replaceArrangementContent} from './booklet-arrangement.js';
import {arrangementItems,arrangementParent,findArrangement} from '../../public/libs/maths-editor/arrangement-model.mjs';
import {bookletLayoutSelection,containerSpacingFields} from './booklet-direct-layout.js';
import {blockDocuments} from './booklet-bulk-spacing.js';
import {tableRowMinimum,tableResponseAnswers,hasTeacherReview} from './booklet-import-spacing.js';
import {estimateWorkedWritingSpace,workingSpaceFloor} from './booklet-working-space.js';
import {clozeHandwritingMm} from '../../public/libs/maths-editor/house-style.mjs';
import {logicalUnits} from './booklet-flow.js';
import {pageBoundaryKind,setPageBoundary} from './booklet-workspace.js';
import {contentSource} from './document-content.js';

const clone=v=>structuredClone(v);
const blocks=p=>p.sections.flatMap(s=>s.blocks);
const visit=(node,fn,context={})=>{if(!node||typeof node!=='object')return;fn(node,context);const inside=node.type==='cell'?{...context,cell:node}:context;for(const value of Object.values(node))if(value&&typeof value==='object'){if(Array.isArray(value))value.flat().forEach(n=>visit(n,fn,inside));else visit(value,fn,inside);}};
const replaceBlock=(p,b)=>({...p,sections:p.sections.map(s=>({...s,blocks:s.blocks.map(x=>x.id===b.id?b:x)}))});
const withTree=(p,id,tree)=>({...p,settings:{...p.settings,layoutOverrides:{...p.settings.layoutOverrides,blockLayouts:{...p.settings.layoutOverrides?.blockLayouts,[id]:{...p.settings.layoutOverrides?.blockLayouts?.[id],arrangement:tree}}}}});
const overrides=p=>p.settings?.layoutOverrides??{};
export const BLOCK_ROLES=[['theory','Theory'],['definition','Definition'],['example','Worked example + Your turn'],['guided-practice','Guided practice'],['question','Exercise question'],['review','Review'],['investigation','Activity / investigation'],['key-ideas','Key Ideas']];
export const blockRole=b=>b?.sourceAtom?.kind??(b?.pedagogyRole==='worked-example'?'example':b?.pedagogyRole==='practice'?'question':b?.pedagogyRole)??(b?.type==='question'?'question':'theory');

export function changeBlockRole(project,blockId,role){
 if(!BLOCK_ROLES.some(([r])=>r===role))throw Error('Choose a supported role.');
 const original=blocks(project).find(b=>b.id===blockId);if(!original)throw Error('Block no longer exists.');
 if(role==='question'&&original.type!=='question')throw Error('This block has no question and answer structure. Add a question before choosing this role.');
 const next=clone(project),unit=logicalUnits(next).find(u=>u.blocks.some(b=>b.id===blockId)),selected=unit?.blocks??[];
 if(!selected.length)throw Error('Block no longer exists.');
 if(role==='example'){
   const demonstration=selected.find(b=>b.type==='worked-example')??selected.find(b=>b.type==='question');
   const response=selected.find(b=>b.id!==demonstration?.id&&b.type==='question');
   const nodes=[];visit(demonstration?.content,n=>{if(n.answer)nodes.push(n);});
   const hasWorking=nodes.some(n=>contentSource(n.answer?.worked).trim())||demonstration?.examples?.some(e=>e.steps?.length||contentSource(e.theorySolution).trim());
   if(!demonstration||!response||!hasWorking)throw Error('A worked example needs existing worked answers and a separate Your turn question. No questions will be invented.');
   const groupId=demonstration.sourceAtom?.id??'role:'+demonstration.id;
   for(const b of selected){b.sourceReview??={};b.sourceReview.roleBefore??={pedagogyRole:b.pedagogyRole,sourceAtom:clone(b.sourceAtom??null)};b.sourceAtom={...b.sourceAtom,id:groupId,kind:'example',label:'Example',visibleSubtitle:'',headerFill:'orange'};b.pedagogyRole=b.id===response.id?'guided-practice':'example';}
   demonstration.presentation={...demonstration.presentation,studentRole:'demonstration'};
   demonstration.pairedBlockId=response.id;
   response.presentation={...response.presentation,studentRole:'your-turn',hideStudentSolutions:true};
 }else for(const b of selected){
   b.sourceReview??={};b.sourceReview.roleBefore??={pedagogyRole:b.pedagogyRole,sourceAtom:clone(b.sourceAtom??null)};
   b.pedagogyRole=role;
   if(role==='question'){delete b.sourceAtom;delete b.pairedBlockId;}
   else b.sourceAtom={...b.sourceAtom,id:selected[0].sourceAtom?.id??'role:'+selected[0].id,kind:role,label:Object.fromEntries(BLOCK_ROLES)[role],visibleSubtitle:'',headerFill:{definition:'red',review:'green',theory:'blue','key-ideas':'blue',investigation:'red','guided-practice':'orange'}[role]};
   if(b.presentation){delete b.presentation.studentRole;delete b.presentation.hideStudentSolutions;}
   if(role==='guided-practice')b.presentation={...b.presentation,hideStudentSolutions:true};
 }
 return next;
}

function parentOf(root,id){if(root?.children?.some(c=>c.id===id))return root;for(const c of root?.children??[]){const parent=parentOf(c,id);if(parent)return parent;}return null;}
export function siblingParts(project,blockId,partId){const b=blocks(project).find(b=>b.id===blockId),parent=parentOf(b?.content,partId);return parent?.children??[];}
const layoutKeys=['layout','columns','diagramPlacement','align','answerSpaceMm'];
// Structural mapping preserves target identifiers, answers, text and diagrams.
function mapShape(source,target,ids=new Map()){
 if(!source||!target||typeof source!=='object'||typeof target!=='object')return ids;
 if(source.type!==target.type)throw Error('Sibling structures differ; select compatible parts.');
 if(source.type==='cell'&&((source.colspan??1)!==(target.colspan??1)||(source.rowspan??1)!==(target.rowspan??1)))throw Error('Sibling tables have different merged-cell structures.');
 if(source.id&&target.id)ids.set(source.id,target.id);
 for(const key of ['children','blocks','rows','slots','questionDiagrams']){
   const a=source[key],b=target[key];if(!a&&!b)continue;
   if(!Array.isArray(a)||!Array.isArray(b)||a.length!==b.length)throw Error('Sibling structures differ; select compatible parts.');
   if(key==='rows'&&a.some((row,i)=>row.length!==b[i].length))throw Error('Sibling tables have different row structures.');
   a.flat().forEach((n,i)=>mapShape(n,b.flat()[i],ids));
 }
 const sourceDocument=!!source.prompt&&typeof source.prompt==='object',targetDocument=!!target.prompt&&typeof target.prompt==='object';
 if(sourceDocument!==targetDocument)throw Error('Sibling prompt formats differ; choose compatible parts.');
 if(sourceDocument)mapShape(source.prompt,target.prompt,ids);
 return ids;
}
const siblingProperties=['arrangement','workingSpace','clozeWidths','alignment','diagramWidth'];
function copyPartLayout(source,target,properties){
 for(const key of layoutKeys){if(!properties.includes(key==='answerSpaceMm'?'workingSpace':key==='align'?'alignment':'arrangement'))continue;if(key==='answerSpaceMm'){
   if(source[key]!=null){let minimum=target.responseSpace==='scaffold'?0:target.answerSpaceMm??0;try{minimum=estimateWorkedWritingSpace(target,{preserveExplicit:false});}catch{}target[key]=Math.max(source[key],minimum);}
 }else if(key in source)target[key]=clone(source[key]);else delete target[key];}
 for(let i=0;i<(source.questionDiagrams?.length??0);i++)for(const key of ['widthMm','align']){if(!properties.includes(key==='widthMm'?'diagramWidth':'alignment'))continue;if(source.questionDiagrams[i][key]!=null)target.questionDiagrams[i][key]=source.questionDiagrams[i][key];else delete target.questionDiagrams[i][key];}
 const copyDoc=(a,b)=>{if(!a||!b||typeof a!=='object'||typeof b!=='object')return;
   if(a.type==='cloze'&&b.type==='cloze'&&properties.includes('clozeWidths'))b.width=Math.max(a.width??0,clozeHandwritingMm(b.answer??''));
   for(const key of ['align','verticalAlign','spaceBefore','spaceAfter','gap','padding','margin','columns','layout']){if(!properties.includes(['align','verticalAlign'].includes(key)?'alignment':'arrangement'))continue;if(a[key]!=null)b[key]=clone(a[key]);else delete b[key];}
   for(const key of ['blocks','rows','slots','inlines'])if(Array.isArray(a[key]))a[key].flat().forEach((n,i)=>copyDoc(n,b[key].flat()[i]));
 };
 copyDoc(source.prompt,target.prompt);
 const clozes=[];visit(source.prompt,n=>{if(n.type==='cloze')clozes.push(n);});let clozeIndex=0;
 if(clozes.length&&properties.includes('clozeWidths'))visit(target.prompt,n=>{if(n.type==='cloze'){const from=clozes[Math.min(clozeIndex++,clozes.length-1)];n.width=Math.max(from.width??0,clozeHandwritingMm(n.answer??''));}});
 source.children?.forEach((c,i)=>copyPartLayout(c,target.children[i],properties));
}
export function matchSiblingLayout(project,blockId,partId,properties=siblingProperties){
 if(!properties.length||properties.some(p=>!siblingProperties.includes(p)))throw Error('Choose layout properties to copy.');
 const next=clone(project),b=blocks(next).find(b=>b.id===blockId),source=findContent(b,partId),siblings=siblingParts(next,blockId,partId);
 if(!source||siblings.length<2)throw Error('Select a part with sibling parts.');
 const o=overrides(next),resolved=resolveArrangement(b,o.blockLayouts?.[blockId]?.arrangement,o),tree=clone(resolved.tree);
 const sourceGroup=findArrangement(tree.root,partId+':question');
 const widths=new Map();const measure=(n,width=170)=>{if(!n)return;widths.set(n.id,width);const cols=n.layout==='grid'?Math.max(1,n.columns??1):1;n.children?.forEach(c=>measure(c,(width-(cols-1)*6)/cols-6));};measure(b.content);
 for(const target of siblings.filter(n=>n.id!==partId)){
   const ids=mapShape(source,target);copyPartLayout(source,target,properties);
   const sync=(a,z)=>{
    if(properties.includes('workingSpace')&&a.answer&&z.answer){const sourceSpace=o.answerSpaces?.[a.id]??a.answerSpaceMm;let minimum=z.answerSpaceMm??0;try{minimum=estimateWorkedWritingSpace(z,{preserveExplicit:false,widthMm:widths.get(z.id)??80});}catch{}if(sourceSpace!=null){z.answerSpaceMm=Math.max(sourceSpace,minimum);next.settings.layoutOverrides.answerSpaces={...next.settings.layoutOverrides.answerSpaces,[z.id]:z.answerSpaceMm};}}
    if(properties.includes('diagramWidth'))(a.questionDiagrams??[]).forEach((d,i)=>{const targetDiagram=z.questionDiagrams[i],item=arrangementItems(resolved.tree.root).find(n=>n.ref===d.id),sourceLayout=o.blockLayouts?.[d.id]??{},width=item?.width??sourceLayout.diagramWidthMm??d.widthMm,layout={...next.settings.layoutOverrides.blockLayouts?.[targetDiagram.id]};if(width!=null)layout.diagramWidthMm=width;else delete layout.diagramWidthMm;if(sourceLayout.diagramSizing!=null)layout.diagramSizing=sourceLayout.diagramSizing;else delete layout.diagramSizing;next.settings.layoutOverrides.blockLayouts={...next.settings.layoutOverrides.blockLayouts,[targetDiagram.id]:layout};if(next.settings.layoutOverrides.diagramWidths){if(width!=null)next.settings.layoutOverrides.diagramWidths[targetDiagram.id]=width;else delete next.settings.layoutOverrides.diagramWidths[targetDiagram.id];}});
    a.children?.forEach((c,i)=>sync(c,z.children[i]));
   };sync(source,target);
   if(sourceGroup){
     const replaceRefs=value=>{if(typeof value!=='string')return value;const prefix=value.startsWith('layout:')?'layout:':'';value=value.slice(prefix.length);for(const [from,to]of [...ids].sort((a,b)=>b[0].length-a[0].length))if(value===from||value.startsWith(from+'/')||value.startsWith(from+':'))return prefix+to+value.slice(from.length).replace(/#([^#]+)$/,(_,id)=>'#'+(ids.get(id)??id));return prefix+value;};
     const translated=clone(sourceGroup);visit(translated,n=>{for(const key of ['id','ref'])if(n[key])n[key]=replaceRefs(n[key]);});
     for(const item of arrangementItems(translated)){
       const old=arrangementItems(tree.root).find(n=>n.ref===item.ref),entry=resolved.entries.get(item.ref);
       if(!properties.includes('alignment')){if(old?.align!=null)item.align=old.align;else delete item.align;}
       if(entry?.kind==='diagram'&&!properties.includes('diagramWidth')){if(old?.width!=null)item.width=old.width;else delete item.width;}
       if(entry?.kind==='space'){
         if(!properties.includes('workingSpace')){if(old?.height!=null)item.height=old.height;else delete item.height;}
         else {const node=findContent(b,entry.ownerId);if(node?.answer){const minimum=estimateWorkedWritingSpace(node,{preserveExplicit:false,widthMm:widths.get(node.id)??80});if(item.height!=null)item.height=Math.max(item.height,minimum);}}
       }
     }
     const parent=arrangementParent(tree.root,target.id+':question'),existing=parent?.children.findIndex(n=>n.id===target.id+':question');
     if(properties.includes('arrangement')){if(existing>=0)parent.children[existing]=translated;}
     else for(const item of arrangementItems(translated)){
       const targetItem=arrangementItems(tree.root).find(n=>n.ref===item.ref),entry=resolved.entries.get(item.ref);if(!targetItem)continue;
       const fields=[...(properties.includes('alignment')?['align']:[]),...(entry?.kind==='diagram'&&properties.includes('diagramWidth')?['width']:[]),...(entry?.kind==='space'&&properties.includes('workingSpace')?['height']:[])];
       for(const key of fields){if(item[key]!=null)targetItem[key]=item[key];else delete targetItem[key];}
     }
   }
 }
 return withTree(next,blockId,tree);
}

export function matchTableRows(project,blockId,tableId,sourceRows,targetRows,properties=['alignment','padding','rowHeight']){
 if(!properties.length||properties.some(p=>!['alignment','padding','rowHeight'].includes(p)))throw Error('Choose row properties to copy.');
 const next=clone(project),b=blocks(next).find(b=>b.id===blockId);let table;
 for(const {document}of blockDocuments(b))visit(document,n=>{if(n.type==='table'&&n.id===tableId)table=n;});
 if(!table||!sourceRows.length||!targetRows.length||sourceRows.some(i=>!table.rows[i])||targetRows.some(i=>!table.rows[i])||targetRows.some(i=>sourceRows.includes(i)))throw Error('Choose existing, separate source and target rows.');
 for(let index=0;index<targetRows.length;index++){
   const from=sourceRows[index%sourceRows.length],to=targetRows[index],a=table.rows[from],z=table.rows[to];
   if(a.length!==z.length||a.some((c,i)=>(c.colspan??1)!==(z[i].colspan??1)||(c.rowspan??1)!==(z[i].rowspan??1)))throw Error('Rows have different merged-cell structures.');
   a.forEach((cell,i)=>{for(const key of ['align','verticalAlign','paddingTop','paddingRight','paddingBottom','paddingLeft','preserveParagraphAlignment','preserveParagraphSpacing']){if(!properties.includes(key.startsWith('padding')||key==='preserveParagraphSpacing'?'padding':'alignment'))continue;if(cell[key]!=null)z[i][key]=clone(cell[key]);else delete z[i][key];}});
   if(properties.includes('rowHeight')||properties.includes('padding')){
     const minimum=tableRowMinimum(table,to,table.widthMm??170,tableResponseAnswers(b));if(minimum==null)throw Error('The expected response or drawing space for this row is unknown; keep its existing height.');
     table.rowHeights??=[];table.rowHeights[to]=Math.max(properties.includes('rowHeight')?table.rowHeights[from]??minimum:table.rowHeights[to]??minimum,minimum);
   }
 }
 return next;
}

export function layoutSpaceChain(project,selection){
 const info=bookletLayoutSelection(project,selection);if(!info)return [];
 const chain=[];let n=info.node;
 while(n){chain.push({kind:'arrangement',id:n.id,label:n.title??info.entries.get(n.ref)?.title??(n.direction==='row'?'Row':'Group'),values:n,fields:[['before','Space above',0,80],['after','Space below',0,80],['minHeight','Minimum height',0,180],...(n.type==='group'?[['gap','Gap',2,30]]:[])]});n=arrangementParent(info.tree.root,n.id);}
 const entry=info.entry;
 if(entry?.value?.blocks?.length===1){const document=entry.value,findPath=(node,target,path=[])=>{if(!node||typeof node!=='object')return null;if(node.id===target)return [...path,node];for(const value of Object.values(node))if(value&&typeof value==='object')for(const child of Array.isArray(value)?value.flat():[value]){const found=findPath(child,target,[...path,node]);if(found)return found;}return null;};
   const path=findPath(document,selection.nativeId??document.blocks[0].id)??[],table=path.find(n=>n.type==='table'),cell=path.find(n=>n.type==='cell');
   for(const node of path.reverse()){
     let fields=containerSpacingFields(node);if(node.type==='paragraph'&&cell&&!cell.preserveParagraphSpacing)fields=fields.filter(([key])=>key!=='spaceAfter');
     if(fields.length)chain.unshift({kind:'document',id:node.id,label:node.arrangement??node.type,values:node.type==='cell'?{...node,...Object.fromEntries(['Top','Right','Bottom','Left'].map(side=>['padding'+side,node['padding'+side]??table?.padding??2]))}:node,fields,entry});
   }
 }
 const section=project.sections.find(s=>s.blocks.some(b=>b.id===info.block.id));
 const origin=pageBoundaryKind(project,info.block.id);
 chain.push({kind:'boundary',id:info.block.id,label:origin==='automatic'&&section?.phase==='practice'&&section.blocks[0]?.id===info.block.id&&section.pageBreakBefore!==false?'Exercise start':origin==='automatic'?'Automatic pagination':origin==='source'?'Source boundary':'Forced page break',removable:origin!=='automatic'||section?.phase==='practice'&&section.blocks[0]?.id===info.block.id});
 return chain;
}
export function changeSpaceChain(project,selection,item,key,value){
 if(item.kind==='boundary')return setPageBoundary(project,selection.blockId,'remove');
 if(!item.fields.some(([field,,fallback,max=20,min=0])=>field===key&&Number.isFinite(value)&&value>=min&&value<=max))throw Error('Enter a value within the displayed limits.');
 const info=bookletLayoutSelection(project,selection);
 if(item.kind==='arrangement'){const tree=clone(info.tree);findArrangement(tree.root,item.id)[key]=value;return withTree(project,selection.blockId,tree);}
 const doc=clone(item.entry.value);let found=false;visit(doc,n=>{if(n.id===item.id){n[key]=value;found=true;}});if(!found)throw Error('Container no longer exists.');
 return replaceBlock(project,replaceArrangementContent(info.block,item.entry,doc));
}

// Cumulative stages are measured by the real paginator before any save/history edit.
// Working space never tightens below the shared floor (workingSpaceFloor): calibrated for unreviewed booklets,
// the estimator for teacher-reviewed ones (22 October 2026).
export function tightenStages(project,blockId){
 const original=blocks(project).find(b=>b.id===blockId);if(!original)throw Error('Select a block.');
 const usesArrangement=original.type==='question'||!!(overrides(project).blockLayouts?.[blockId]?.arrangement??original.presentation?.layoutOverrides?.blockLayouts?.[blockId]?.arrangement);
 const storeTree=(p,tree)=>usesArrangement?withTree(p,blockId,tree):p;
 const reviewed=hasTeacherReview(project);
 let next=clone(project);const stages=[];
 const save=label=>stages.push({label,project:clone(next)});
 const docNodes=fn=>{const b=blocks(next).find(b=>b.id===blockId);for(const {document}of blockDocuments(b))visit(document,fn);};
 docNodes((n,ctx)=>{if(n.type==='paragraph'&&(!ctx.cell||ctx.cell.preserveParagraphSpacing)){if((n.spaceBefore??0)>0)n.spaceBefore=0;if((n.spaceAfter??2)>1)n.spaceAfter=1;}});
 if(original.type==='worked-example'&&original.presentation?.layout==='worked-rows')for(const e of blocks(next).find(b=>b.id===blockId).examples??[])e.rowLayout={...e.rowLayout,aboveMm:0,belowMm:Math.min(e.rowLayout?.belowMm??4,1)};
 save('Paragraph spacing');
 let b=blocks(next).find(b=>b.id===blockId),o=overrides(next),resolved=resolveArrangement(b,o.blockLayouts?.[blockId]?.arrangement,o),tree=clone(resolved.tree);
 visit(tree.root,n=>{if(n.type==='group'&&n.gap>1)n.gap=1;if(n.before>0)n.before=0;if(n.after>1)n.after=1;});next=storeTree(next,tree);
 docNodes(n=>{if(n.type==='layout'&&!['speech-bubble','cards'].includes(n.arrangement)){if((n.gap??3)>1)n.gap=1;if((n.margin??3)>0)n.margin=0;}});save('Gaps');
 docNodes(n=>{if(n.type==='table'&&(n.padding??2)>(n.border===false?0:1))n.padding=n.border===false?0:1;if(n.type==='layout'&&!['speech-bubble','cards'].includes(n.arrangement)&&(n.padding??3)>(n.border?1:0))n.padding=n.border?1:0;});save('Padding');
 docNodes(n=>{if(n.type==='table')n.rows.forEach((row,i)=>{if(row.some(c=>c.header))return;const minimum=tableRowMinimum(n,i,n.widthMm??170,tableResponseAnswers(blocks(next).find(b=>b.id===blockId)));if(minimum!=null&&n.rowHeights?.[i]>minimum)n.rowHeights[i]=minimum;});});save('Row heights');
 b=blocks(next).find(b=>b.id===blockId);o=overrides(next);resolved=resolveArrangement(b,o.blockLayouts?.[blockId]?.arrangement,o);tree=clone(resolved.tree);
 for(const item of arrangementItems(tree.root)){const entry=resolved.entries.get(item.ref);if(entry?.kind!=='space')continue;const node=findContent(b,entry.ownerId);if(!node?.answer)continue;try{const minimum=workingSpaceFloor(b,node,{reviewed});const height=item.height??entry.value;if(height>minimum){item.height=minimum;next.settings.layoutOverrides.answerSpaces={...next.settings.layoutOverrides.answerSpaces,[entry.ownerId]:minimum};}}catch{}}
 next=storeTree(next,tree);save('Surplus working space');
 // Width reductions are bounded, keep 10 pt labels, and do not shrink supplied drawing grids.
 for(const item of arrangementItems(tree.root)){const entry=resolved.entries.get(item.ref);if(entry?.kind!=='diagram')continue;const d=entry.value,description=[d.spec?.description,d.spec?.mathematics,d.id].join(' ');if(/blank|draw|sketch|plot|construct|grid/i.test(description))continue;const minimum=/graph|axes|cartesian/i.test(description)?70:b.content?.layout==='grid'?32:50;const width=item.width??d.widthMm;if(width>minimum)item.width=minimum;}
 next=storeTree(next,tree);save('Diagram widths');
 return stages.filter((s,i)=>JSON.stringify(s.project)!==JSON.stringify(i?stages[i-1].project:project));
}

const identity=b=>b.flow?.continuationOf??b.continuationOf??b.id;
export function blockPages(map,id){return (map?.pages??[]).flatMap((p,i)=>p.blocks.some(b=>b.id===id||identity(b)===id)?[i]:[]);}
export function fitIsSafe(before,after,blockId,targetId){
 const a=blockPages(after,blockId),z=blockPages(after,targetId),old=blockPages(before,blockId);
 if(a.length!==1||z.length!==1||a[0]!==z[0]||a.length>old.length||after.issues?.some(issue=>!(before.issues??[]).some(old=>old.id===issue.id&&old.message===issue.message)))return false;
 const ids=new Set((before.pages??[]).flatMap(p=>p.blocks.map(identity)));
 for(const id of ids)if(blockPages(after,id).length>blockPages(before,id).length)return false;
 return true;
}

// Blocks that occupy more pages after a change than before, for every block rather
// than one chosen pair: a block newly split across pages is a new split. Returns
// the block identities (continuations count as their first block).
export function newSplits(before,after,ids=null){
 const found=ids??[...new Set((before.pages??[]).flatMap(p=>p.blocks.map(identity)))];
 return found.filter(id=>blockPages(after,id).length>blockPages(before,id).length);
}
// Issues the change adds (same id and message in the older map do not count).
export function newIssues(before,after){
 return (after.issues??[]).filter(issue=>!(before.issues??[]).some(old=>old.id===issue.id&&old.message===issue.message));
}
