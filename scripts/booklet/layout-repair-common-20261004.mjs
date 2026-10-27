// Shared mechanics for the user-approved, occurrence-scoped layout maintenance.
// Public renderer fields are unchanged. Each cause has a separate dry-run CLI.
import fs from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {loadBookletProject} from './project-studio-server.mjs';
export const REPAIR_DIR='.booklet-work/layout-repairs-20261004';
export const INK='#24282d',BLUE='#268cff';
export const blocks=p=>p.sections.flatMap(s=>s.blocks??[]);
export const block=(p,id)=>blocks(p).find(b=>b.id===id);
export function visit(n,fn){if(!n||typeof n!=='object')return;if(Array.isArray(n)){n.forEach(x=>visit(x,fn));return;}fn(n);for(const [key,v]of Object.entries(n))if(!['sourceReview','sourceAtom','sourceRefs','spec','answer','originalContent','provenance'].includes(key))visit(v,fn);}
export function find(n,id){let found;visit(n,x=>{if(x.id===id)found=x;});if(!found)throw Error('Expected content '+id);return found;}
export const doc=items=>({format:'maths-editor-document-v1',version:1,blocks:items});
export const para=(id,text)=>({id,type:'paragraph',align:'center',inlines:[{type:'text',text,marks:['bold']}]});
export function heading(id,left='Worked Example',right='Your Turn'){return {id,type:'table',widths:[1,1],padding:2,border:false,marginBefore:0.5,marginAfter:0.5,rows:[[{id:id+'-left',type:'cell',align:'center',verticalAlign:'top',paddingTop:0.75,paddingBottom:0.75,blocks:[para(id+'-left-text',left)]},{id:id+'-right',type:'cell',align:'center',verticalAlign:'top',paddingTop:0.75,paddingBottom:0.75,blocks:[para(id+'-right-text',right)]}]]};}
// Explicit maintenance only: callers establish that this is a demonstration /
// independent pupil task pair. Never infer that from two columns on load.
export function addPairedHeadings(project,b){
 if(b.type!=='question'||!b.content?.id)throw Error('Expected a semantic question');
 const root=b.content,id=b.id+'-paired-headings';
 if(root.prompt?.blocks?.some(n=>n.id===id))return false;
 if(root.prompt&&!(root.prompt.format==='maths-editor-document-v1'&&Array.isArray(root.prompt.blocks)))throw Error('Preserve and review the existing root prompt before adding headings: '+b.id);
 root.prompt=doc([...(root.prompt?.blocks??[]),heading(id)]);
 // A legacy column caption is now the heading, rather than a question label.
 for(const child of root.children??[])if(/^(?:your turn|worked example)$/i.test(child.label??'')){
  child.label='';
  for(const response of b.sourceReview?.responses??[])if(response.targetId===child.id&&/^(?:your turn|worked example)$/i.test(response.label??''))response.label='';
 }
 const ref=root.id+'/prompt#'+id;
 for(const layouts of [project.settings?.layoutOverrides?.blockLayouts,b.presentation?.layoutOverrides?.blockLayouts]){
  const arrangement=layouts?.[b.id]?.arrangement;if(!arrangement)continue;
  const contains=n=>n.ref===root.id+'/prompt'||n.ref===ref||(n.children??[]).some(contains);
  if(contains(arrangement.root))continue;
  const slot={id:'layout:'+ref,type:'item',ref,title:'Paired column headings'};
  if(arrangement.root.direction==='stack')arrangement.root.children.unshift(slot);
  else arrangement.root={id:b.id+'-headed-layout',type:'group',direction:'stack',children:[slot,arrangement.root]};
 }
 b.sourceReview??={};b.sourceReview.intentionalDepartures??=[];
 b.sourceReview.intentionalDepartures.push('Feedback 25 October 2026: add editable Worked Example / Your Turn column headings above the paired tasks; preserve source evidence, working, answers and existing arrangements.');
 return true;
}
export function unborder(t){t.border=false;delete t.borderColour;delete t.borderWidthMm;for(const c of t.rows.flat()){delete c.border;delete c.borderColour;delete c.borderWidthMm;}}
export function clearArrangement(p,b,provenance=b){for(const layouts of [p.settings?.layoutOverrides?.blockLayouts,b.presentation?.layoutOverrides?.blockLayouts])if(layouts?.[b.id]){const ids=[];visit(layouts[b.id].arrangement,n=>{if(n.id)ids.push(n.id);});retire(provenance,ids);delete layouts[b.id].arrangement;if(!Object.keys(layouts[b.id]).length)delete layouts[b.id];}if(b.sourceReview)delete b.sourceReview.arrangementOverride;}
export function retire(b,ids){b.sourceReview??={};b.sourceReview.layoutRepairProvenance??={};const v=b.sourceReview.layoutRepairProvenance;v.retainedWrapperIds=[...new Set([...(v.retainedWrapperIds??[]),...ids.filter(Boolean)])];}
export function note(b,cause){b.sourceReview??={};const text=`Approved layout audit 4 October 2026 (${cause}): apply house layout while preserving mathematical content, response ownership and handwriting space; source appearance remains evidence.`;b.sourceReview.intentionalDepartures??=[];if(!b.sourceReview.intentionalDepartures.includes(text))b.sourceReview.intentionalDepartures.push(text);}
export function archiveRequirements(b){if(b.sourceReview?.presentationRequirements){b.sourceReview.layoutRepairProvenance??={};b.sourceReview.layoutRepairProvenance.previousPresentationRequirements=b.sourceReview.presentationRequirements;delete b.sourceReview.presentationRequirements;}}
export function paired(p,b,parts,h,extra=[]){if(b.bankRef?.id)throw Error('Bank-owned consolidation requires reviewed transaction: '+b.id);b.type='question';b.content={...b.content,type:'group',label:'',prompt:doc([...extra,h]),layout:'grid',columns:2,children:parts};clearArrangement(p,b);archiveRequirements(b);}
export function partFromCell(id,cell,{answerSpaceMm=0,...fields}={}){return {id,type:'part',label:'',prompt:doc(cell.blocks),answerSpaceMm,...fields};}
export function unwrap(docValue,b){const list=[];for(const n of docValue.blocks??[]){if(n.type==='table'&&n.rows?.length===1&&n.rows[0].length===1){retire(b,[n.id,n.rows[0][0].id]);list.push(...n.rows[0][0].blocks);}else list.push(n);}return {...docValue,blocks:list};}
export function transform(source,cause,fn){const project=structuredClone(source),before=new Map(blocks(project).map(b=>[b.id,JSON.stringify(b)]));fn(project);const records=[];for(const b of blocks(project))if(before.get(b.id)!==JSON.stringify(b)){note(b,cause);records.push({blockId:b.id,cause});}return {project,records};}
export async function dryRunMain(url,repair,ids){if(!process.argv[1]||url!==pathToFileURL(process.argv[1]).href)return;const only=process.argv.find(x=>x.startsWith('--project='))?.slice(10);if(process.argv.includes('--apply'))throw Error('Use apply-layout-audit-20261004.mjs with reviewed candidate evidence; individual cause CLIs are dry-run only.');await fs.mkdir(REPAIR_DIR,{recursive:true});for(const id of ids.filter(id=>!only||id===only)){const source=await loadBookletProject(id,{refreshRatings:false}),result=repair(source);await fs.writeFile(path.join(REPAIR_DIR,id+'-'+path.basename(new URL(url).pathname,'.mjs')+'-candidate.json'),JSON.stringify(result.project,null,2)+'\n');console.log(JSON.stringify({project:id,revision:source.revision,records:result.records,status:'dry-run'}));}}
