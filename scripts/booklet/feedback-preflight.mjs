// Read-only structural discovery and scope checks, before expensive rendering.
import fs from 'node:fs';
import {pathToFileURL} from 'node:url';
import {isDeepStrictEqual} from 'node:util';
import {normalizeEditableProject} from '../../src/lib/editable-booklet-model.js';
import {resolveArrangement} from '../../src/lib/booklet-arrangement.js';

const blocks=p=>(p.sections??[]).flatMap(s=>s.blocks??[]);
const escape=s=>String(s).replaceAll('~','~0').replaceAll('/','~1');
function walk(value,visit,at=''){
 if(!value||typeof value!=='object')return;
 if(!Array.isArray(value))visit(value,at);
 for(const [key,child] of Object.entries(value))walk(child,visit,at+'/'+escape(key));
}
export function changedPaths(a,b,at=''){
 if(isDeepStrictEqual(a,b))return [];
 if(!a||!b||typeof a!=='object'||typeof b!=='object'||Array.isArray(a)!==Array.isArray(b))return [at];
 return [...new Set([...Object.keys(a),...Object.keys(b)])].flatMap(key=>changedPaths(a[key],b[key],at+'/'+escape(key)));
}
// Blocks may move, but the order/section membership of untouched blocks must stay.
// Global changes require explicit JSON pointers; a block ID never permits them.
export function assertRepairScope(before,candidate,{blockIds=[],allowedPaths=[]}={}){
 const a=normalizeEditableProject(before),b=normalizeEditableProject(candidate),wanted=new Set(blockIds);
 for(const pointer of allowedPaths)if(!pointer.startsWith('/')||['/','/sections','/settings','/studio'].includes(pointer))throw Error('Use block IDs for content scope and explicit JSON pointers for project settings: '+pointer);
 const all=new Set([...blocks(a),...blocks(b)].map(v=>v.id));
 for(const id of wanted)if(!all.has(id))throw Error('Repair scope block not found: '+id);
 const old=new Map(blocks(a).map(v=>[v.id,v])),next=new Map(blocks(b).map(v=>[v.id,v]));
 const unexpected=[...all].filter(id=>!wanted.has(id)&&!isDeepStrictEqual(old.get(id),next.get(id))).map(id=>'block:'+id);
 const strip=p=>({...p,sections:p.sections.map(s=>({...s,blocks:s.blocks.filter(v=>!wanted.has(v.id)).map(v=>v.id)}))});
 const paths=changedPaths(strip(a),strip(b));
 const permitted=[...allowedPaths,...blockIds.map(id=>'/settings/layoutOverrides/blockLayouts/'+escape(id))];
 unexpected.push(...paths.filter(p=>!permitted.some(allow=>p===allow||p.startsWith(allow+'/'))));
 if(unexpected.length)throw Object.assign(Error('Repair changed content outside its declared scope: '+unexpected.join(', ')),{unexpected});
 return {blockIds:[...wanted],allowedPaths,projectPaths:paths};
}

export function structuralPreflight(project,{blockIds=[]}={}){
 const all=blocks(project),ids=new Set(blockIds.length?blockIds:all.map(b=>b.id)),known=new Set();
 walk(project.sections,n=>{if(n.id)known.add(n.id);});
 const owners=new Map(),settingsByBlock=new Map();
 for(const block of all)walk(block,n=>{if(n.id)owners.set(n.id,block.id);});
 // Index saved settings once, rather than walking a whole book's overrides for
 // every selected block. Keys can name a node or a node/field reference.
 walk(project.settings,(value,at)=>{
  const key=(at.split('/').at(-1)??'').replaceAll('~1','/').replaceAll('~0','~');
  const owner=owners.get(key)??owners.get(key.split('/')[0]);
  if(owner){if(!settingsByBlock.has(owner))settingsByBlock.set(owner,[]);settingsByBlock.get(owner).push({path:at,value});}
  for(const [key,child] of Object.entries(value))if(typeof child==='number'){
   const owner=owners.get(key)??owners.get(key.split('/')[0]);
   if(owner){if(!settingsByBlock.has(owner))settingsByBlock.set(owner,[]);settingsByBlock.get(owner).push({path:at+'/'+escape(key),value:child});}
  }
 });
 const rows=[],issues=[];
 for(const id of ids){
  const block=all.find(b=>b.id===id);
  if(!block){issues.push({blockId:id,kind:'missing-block'});continue;}
  const row={blockId:id,flow:block.flow??null,layouts:[],overrides:[],widths:[],tables:[],responses:[],dependencies:[],annotations:[]};
  walk(block,(n,at)=>{
   const widths=Object.fromEntries(Object.entries(n).filter(([k,v])=>/width/i.test(k)&&typeof v==='number'));
   if(Object.keys(widths).length)row.widths.push({source:'content',path:at,...widths});
   if(n.answer||n.responseSpace!==undefined)row.responses.push({id:n.id,path:at,responseSpace:n.responseSpace,answerEditions:n.answer?Object.keys(n.answer).filter(k=>['short','worked'].includes(k)):[]});
   for(const target of [...(n.dependsOn??[]),n.pairedBlockId].filter(Boolean)){
    row.dependencies.push({id:n.id,target});
    if(!known.has(target))issues.push({blockId:id,kind:'missing-dependency',ownerId:n.id,target});
   }
   if(n.type==='table')row.tables.push({id:n.id,path:at,rows:n.rows?.length??0,cells:n.rows?.map(r=>(r.cells??r).length),content:n.rows,continuation:block.flow?.tableContinuation??null});
   if(n.annotations?.length)row.annotations.push({path:at,annotations:n.annotations});
  });
  // Keep exact saved values: widths, crop/diagram overrides and table padding can
  // be intentional. This inventory is not authority to discard them.
  const layouts=[...(settingsByBlock.get(id)??[]).map(v=>({...v,source:'project'})),{source:'block',path:'',value:block.presentation?.layoutOverrides}];
  for(const {source,value,path:basePath} of layouts){
   if(value!==undefined)row.overrides.push({source,path:basePath,value});
   if(typeof value==='number'&&/width/i.test(basePath))row.widths.push({source,path:basePath,width:value});
   walk(value,(n,suffix)=>{
   const at=basePath+suffix;
   if(n.arrangement){
    row.layouts.push({source,path:at,arrangement:n.arrangement});
    try{
     const resolved=resolveArrangement(block,structuredClone(n.arrangement),source==='project'?project.settings.layoutOverrides:value);
     for(const node of resolved.missing)issues.push({blockId:id,kind:'missing-arrangement-ref',path:at,ref:node.ref});
     row.layouts.at(-1).responseSpaces=[...resolved.entries.values()].filter(e=>e.kind==='space').map(e=>({ref:e.ref,ownerId:e.ownerId,value:e.value}));
    }catch(error){issues.push({blockId:id,kind:'invalid-arrangement',path:at,message:error.message});}
   }
   const widths=Object.fromEntries(Object.entries(n).filter(([k,v])=>/width/i.test(k)&&typeof v==='number'));
   if(Object.keys(widths).length)row.widths.push({source,path:at,...widths});
   });
  }
  row.presentation=block.presentation??null;
  rows.push(row);
 }
 return {projectId:project.id,revision:project.revision,blocks:rows,issues};
}

if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const args=process.argv.slice(2),arg=name=>args[args.indexOf(name)+1],read=file=>JSON.parse(fs.readFileSync(file,'utf8').replace(/^\uFEFF/,''));
 if(!args.includes('--project-file'))throw Error('Use --project-file FILE [--before FILE] --blocks ID,ID [--allow-path JSON_POINTER] [--out FILE]');
 const candidate=read(arg('--project-file')),blockIds=(args.includes('--blocks')?arg('--blocks'):'').split(',').filter(Boolean);
 const report=structuralPreflight(candidate,{blockIds});
 if(args.includes('--before'))report.scope=assertRepairScope(read(arg('--before')),candidate,{blockIds,allowedPaths:args.flatMap((v,i)=>v==='--allow-path'?[args[i+1]]:[])});
 if(args.includes('--out'))fs.writeFileSync(arg('--out'),JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify({projectId:report.projectId,blocks:report.blocks.length,issues:report.issues,scope:report.scope}));
 if(report.issues.length)process.exitCode=1;
}
