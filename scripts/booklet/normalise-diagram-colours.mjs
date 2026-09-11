// Reviewed role migration, dry-run by default. Source/evidence trees are read-only.
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {adoptDiagramColours,diagramColourPolicy} from '../../src/lib/diagram-colours.js';
import {prepareAutomaticSync,projectSyncStatus,writeTransaction,revisionHash,bankManifestEntry,registerOwner} from './bank-sync.mjs';
import {sharedQuestion} from '../../src/lib/question-sync.js';
import {rasterColourReplacement} from './diagram-colour-replacements.mjs';

const evidenceKeys=new Set(['source','spec','sourceReview','sourceAtom','sourceLayoutEvidence','originalDiagram','originalContent','before','after','mathematicalModel']);
export function visitActiveDiagrams(value,fn,location=''){
  if(!value||typeof value!=='object')return;
  if(value.format==='tikz'||value.format==='image'||value.type==='image')fn(value,location);
  for(const[key,child]of Object.entries(value))if(!evidenceKeys.has(key))visitActiveDiagrams(child,fn,location+'/'+key);
}
const semanticReasons={
  answerblue:'Response labels distinguish supplied answers from question givens',
  sourceAltitude:'Highlighted perpendicular altitude used in the construction',
  altitudeRed:'Highlighted altitude used in the area construction',
  sourceRed:'Highlighted auxiliary construction or requested unknown angle',
  sourceDiagonal:'Auxiliary diagonal distinguishes the area construction from the perimeter',
  sourceFill:'Shaded region distinguishes the measured area',
  buildingRed:'Building structure distinguished from sight lines and distances',
  buildingFill:'Building silhouette distinguished from open space',
  netRed:'Goal net structure distinguished from measured triangle',
  netPale:'Goal net face shading',
  sourceCyan:'Highlighted bearing or angle sector',
  cliffFill:'Cliff silhouette distinguished from sight lines',
  bearingfill:'Highlighted bearing sector',
  sourceMagenta:'Compass reference directions distinguished from the route',
  planeGrey:'Aircraft silhouette marker',
};
const baseNames=new Set(['outlineblue','labelblue','sourceblue','sourceBlue','sourceOutline','sourceGrey','sourceEdge','sourcegrey','sourceedge','sourceteal','outline','sourceStroke','parkblue','sourceTeal','sourceDark']);
// Literal greys found by full rendered-palette QA: ordinary perimeter, baseline
// and dashed construction strokes. Shaded faces and the filled pole stay intact.
const literalBaseIds=new Set(['nr-p9-q3-a-diagram','nr-p9-q3-b-diagram','nr-p9-q3-c-diagram','nr-p10-q4f-diagram','nr-p22-q3-diagram','nr-p55-q16-diagram','nr-p59-q21-diagram1']);
export function reviewedLiteralInk(node){
  if(!literalBaseIds.has(node.id))return node.code;
  return node.code.replace(/\\draw\[([^\]]+)\]/g,(all,options)=>'\\draw['+options.split(',').map(o=>/^(?:gray|black!(?:60|65|75))$/.test(o.trim())?'black':o).join(',')+']');
}
export function reviewedPolicy(node){
  if(diagramColourPolicy(node.code))return null;
  const id=node.id??'';
  if(!id.startsWith('nr-')&&!id.startsWith('index-doc-')&&id!=='page-58-editable-pattern'){
    // Linear's reviewed native figures are axes, number lines and graphs; the
    // sole geometric matchstick pattern is explicitly excluded above.
    if(id.startsWith('page-')||/\\begin\{axis\}/.test(node.code))return {kind:'graph',base:[],semantic:[],reference:id};
    throw Error('Unreviewed diagram classification: '+id);
  }
  const base=[],semantic=[];
  for(const m of node.code.matchAll(/\\definecolor\{([^}]+)\}\{([^}]+)\}\{([^}]+)\}/g)){
    const [,name,model,hex]=m;
    if(id==='page-58-editable-pattern')continue; // Unused graph palette declarations.
    if(baseNames.has(name))base.push(name);
    else if(semanticReasons[name]&&model==='HTML')semantic.push({name,hex,reason:name==='sourceRed'?(id.includes('p31-')?'Highlighted perpendicular height for area':'Highlighted requested unknown angle'):semanticReasons[name]});
    else throw Error('Unreviewed colour role: '+id+' / '+name);
  }
  return {kind:'geometry',base:[...new Set(base)],semantic,reference:node.spec?.sourcePage?'Source page '+node.spec.sourcePage+', '+id:id};
}
export function migrateDiagramColours(value){
  const next=structuredClone(value),records=[];
  visitActiveDiagrams(next,(node,location)=>{
    if(node.format==='image'){
      const code=rasterColourReplacement(node);if(!code)return;
      const original=structuredClone(node);
      node.format='tikz';node.code=code;
      node.spec={...node.spec,originalDiagram:original,colourOverride:'Black ordinary outlines and labels; native replacement preserves the source arrangement and semantic fill.'};
      delete node.sourceRegion;delete node.colourMode;
      records.push({id:node.id,location,kind:'geometry',replacement:true,source:original.src,before:revisionHash(original),after:revisionHash(node)});
      return;
    }
    if(node.format!=='tikz')return;
    const before=node.code;
    node.code=reviewedLiteralInk(node);
    const policy=reviewedPolicy(node)??(before!==node.code?diagramColourPolicy(node.code):null);if(!policy)return;
    node.code=adoptDiagramColours(node.code,policy);
    records.push({id:node.id,location,kind:policy.kind,base:policy.base,semantic:policy.semantic,originalColours:[...before.matchAll(/\\definecolor\{([^}]+)\}\{([^}]+)\}\{([^}]+)\}/g)].map(m=>({name:m[1],model:m[2],value:m[3]})),before:revisionHash(before),after:revisionHash(node.code)});
  });
  return {next,records};
}
export async function normaliseDiagramColours({apply=false,root=process.cwd(),migrate=migrateDiagramColours,policy='black ordinary lines and labels; semantic colours and graph palettes retained'}={}){
  const projectsRoot=path.join(root,'booklets/projects'),bankRoot=path.join(root,'booklets/question-bank');
  const staged=await fs.mkdtemp(path.join(os.tmpdir(),'mathsmap-colours-'));
  const entries=new Map(),originals=new Map(),report={policy,projects:[],bank:[]};
  try{
    await fs.mkdir(path.join(staged,'.sync'),{recursive:true});
    for(const name of await fs.readdir(bankRoot))if(name.endsWith('.json'))await fs.copyFile(path.join(bankRoot,name),path.join(staged,name));
    await fs.copyFile(path.join(bankRoot,'.sync/links.json'),path.join(staged,'.sync/links.json'));
    const capture=async list=>{
      for(const[file,value]of list){const target=file.startsWith(staged+path.sep)?path.join(bankRoot,path.relative(staged,file)):file;if(!originals.has(target))originals.set(target,await fs.readFile(target,'utf8').catch(e=>{if(e.code==='ENOENT')return null;throw e;}));entries.set(target,value);}
      await writeTransaction(list.filter(([file])=>file.startsWith(staged+path.sep)));
    };
    for(const name of (await fs.readdir(projectsRoot)).filter(f=>f.endsWith('.json')).sort()){
      const file=path.join(projectsRoot,name),raw=await fs.readFile(file,'utf8'),project=JSON.parse(raw);
      const {next,records}=migrate(project);
      report.projects.push({id:project.id,records});if(!records.length)continue;
      const changedIds=new Set(records.map(r=>r.location.match(/^\/sections\/\d+\/blocks\/(\d+)/)?.[0]));
      const changed=next.sections.flatMap((s,si)=>s.blocks.filter((b,bi)=>changedIds.has(`/sections/${si}/blocks/${bi}`)));
      const scoped={...next,sections:[{blocks:changed}]};
      const status=await projectSyncStatus(scoped,staged);
      assert.ok(status.items.every(i=>!['conflict','update','missing'].includes(i.state)),'Diagram sync requires explicit conflict review: '+JSON.stringify(status.items.filter(i=>['conflict','update','missing'].includes(i.state))));
      await capture(await prepareAutomaticSync(scoped,staged));
      next.revision++;next.updatedAt=new Date().toISOString();
      originals.set(file,raw);entries.set(file,next);
      const history=path.join(projectsRoot,'.revisions',project.id,project.revision+'.json');
      if(!await fs.stat(history).catch(()=>null)){originals.set(history,null);entries.set(history,project);}
    }
    // Remaining standalone/unowned bank records also adopt the reviewed policy.
    const updated=[];
    for(const name of (await fs.readdir(staged)).filter(f=>f.endsWith('.json')&&f!=='manifest.json')){
      const file=path.join(staged,name),bank=JSON.parse(await fs.readFile(file,'utf8'));
      const {next,records}=migrate(bank);if(!records.length)continue;
      const links=JSON.parse(await fs.readFile(path.join(staged,'.sync/links.json'),'utf8'));
      next.updatedAt=new Date().toISOString();
      if(links[bank.id]){
        // Derived graph code is deliberately excluded from sharedQuestion. Its
        // style-only adoption needs a bank revision, not a content conflict.
        assert.deepEqual(sharedQuestion(next),sharedQuestion(bank),'Owned bank content was not reconciled through its original: '+bank.id);
        const ownerFile=path.join(projectsRoot,links[bank.id].projectId+'.json');
        const owner=entries.get(ownerFile)??JSON.parse(await fs.readFile(ownerFile,'utf8'));
        const block=owner.sections.flatMap(s=>s.blocks).find(b=>b.id===links[bank.id].blockId);
        assert.ok(block,'Missing bank owner');
        registerOwner(links,owner,block,next);
        if(block.bankRef?.id===bank.id)block.bankRef.revision=revisionHash(next);
        if(!originals.has(ownerFile))originals.set(ownerFile,await fs.readFile(ownerFile,'utf8'));
        entries.set(ownerFile,owner);await capture([[path.join(staged,'.sync/links.json'),links]]);
      }
      updated.push(next);report.bank.push({id:bank.id,records});
      await capture([[path.join(staged,'.revisions',bank.id,revisionHash(bank)+'.json'),bank],[file,next]]);
    }
    if(updated.length)await capture([await bankManifestEntry(staged,updated)]);
    if(apply){
      for(const[file,before]of originals)assert.equal(await fs.readFile(file,'utf8').catch(e=>{if(e.code==='ENOENT')return null;throw e;}),before,'Content changed during migration: '+file);
      await writeTransaction([...entries]);
    }
    return {...report,applied:apply,files:entries.size};
  }finally{
    // mkdtemp generated this exact directory; never touch unrelated temp data.
    await fs.rm(staged,{recursive:true,force:true});
  }
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const report=await normaliseDiagramColours({apply:process.argv.includes('--apply')});
  const i=process.argv.indexOf('--report');if(i>=0)await fs.writeFile(process.argv[i+1],JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify({applied:report.applied,files:report.files,projects:report.projects.map(p=>({id:p.id,diagrams:p.records.length})),standaloneBank:report.bank.length}));
}
