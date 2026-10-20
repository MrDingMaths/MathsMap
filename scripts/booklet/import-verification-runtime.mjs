// Frozen copies include current uncommitted application bytes. No live server
// or project is stopped, migrated, saved or overwritten by this helper.
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {spawn} from 'node:child_process';
import {parseAst} from 'rollup/parseAst';
import {projectReviewHash} from './page-review.mjs';
import {isLeanReview} from './lean-profile.mjs';
import {visitFigures,isSolidCandidate} from '../audit-solid-visibility.mjs';
import {firstAnswerNode} from '../../src/lib/booklet-exercises.js';
const hash=f=>createHash('sha256').update(fs.readFileSync(f)).digest('hex');
const entries=['src','data','public','scripts','index.html','vite.config.js','package.json','package-lock.json'];
// These host coordinators never run in the frozen print checker. Exclude them
// only while their imports remain confined to the known parent CLI callers.
// A renderer/checker import restores the dependency, including old manifests.
function printDependencyFiles(root,files){
 const callers=new Map([
  ['scripts/booklet/lean-import.mjs',new Set()],
  ['scripts/booklet/semantic-packets.mjs',new Set()],
  ['scripts/booklet/practice-only-scope.mjs',new Set(['scripts/booklet/semantic-workflow.mjs'])],
  ['scripts/booklet/lean-review.mjs',new Set()],
  ['scripts/content/lean-route.mjs',new Set()],
  ['scripts/booklet/assemble-semantic-packets.mjs',new Set()],
  ['scripts/booklet/packet-continuations.mjs',new Set(['scripts/booklet/assemble-semantic-packets.mjs','scripts/booklet/author-assignments.mjs'])],
  ['scripts/booklet/answer-evidence.mjs',new Set(['scripts/booklet/assemble-semantic-packets.mjs'])],
  ['scripts/booklet/group-concept-questions.mjs',new Set()],
  ['scripts/booklet/check-diagram-shading.mjs',new Set(['scripts/booklet/group-concept-questions.mjs','scripts/booklet/lean-review.mjs'])],
  ['scripts/booklet/lean-shading.mjs',new Set(['scripts/booklet/check-diagram-shading.mjs','scripts/booklet/lean-review.mjs'])],
  ['scripts/booklet/import-verification-runtime.mjs',new Set(['scripts/booklet/lean-import.mjs','scripts/booklet/lean-review.mjs','scripts/booklet/lean-visual.mjs'])],
  ['scripts/booklet/review-reuse.mjs',new Set(['scripts/booklet/lean-review.mjs'])],
 ]);
 const sources=new Map(files.filter(row=>/\.(?:m?js|svelte|html)$/.test(row.path)&&fs.existsSync(path.join(root,row.path))).map(row=>[row.path,fs.readFileSync(path.join(root,row.path),'utf8')]));
 const paths=new Set(files.map(row=>row.path)),runtime=new Set();
 const pending=[...sources.keys()].filter(file=>file.startsWith('src/')||['vite.config.js','index.html','scripts/booklet/check-compact-exercises.mjs'].includes(file));
 // A known host caller becoming a renderer dependency also restores its
 // helpers. This prevents a transitive import from bypassing the direct guard.
 while(pending.length){
  const file=pending.pop();if(runtime.has(file))continue;runtime.add(file);
  for(const match of (sources.get(file)??'').matchAll(/(?:\bfrom\s*|\b(?:import|require)\s*(?:\(\s*)?)['"]([^'"]+)['"]/g)){
   const specifier=match[1].split('?')[0];let targets=[];
   if(specifier.startsWith('.')){
    const relative=path.relative(root,path.resolve(root,path.dirname(file),specifier)).replaceAll('\\','/');
    targets=[relative,...['.js','.mjs','.svelte','.json','/index.js'].map(extension=>relative+extension)].filter(candidate=>paths.has(candidate));
   }else if(/\.(?:m?js|svelte)$/.test(specifier)){
    // Conservatively include matching modules for quoted aliases/absolute URLs.
    targets=[...paths].filter(candidate=>path.basename(candidate)===path.basename(specifier));
   }
   pending.push(...targets);
  }
 }
 return files.filter(row=>{
  const allowed=callers.get(row.path);if(!allowed)return true;
  if(runtime.has(row.path))return true;
  const name=path.basename(row.path).replaceAll('.','\\.');
  const imports=new RegExp('(?:from\\s*|(?:import|require)\\s*(?:\\(\\s*)?)[\'\"](?:[^\'\"]*/)?'+name+'[\'\"]');
  return [...sources].some(([file,source])=>file!==row.path&&!allowed.has(file)&&imports.test(source));
 });
}
export function snapshotFiles(root,names=entries){
 const files=[];const walk=relative=>{const file=path.join(root,relative);if(!fs.existsSync(file))return;const stat=fs.lstatSync(file);if(stat.isSymbolicLink())throw Error('Snapshot source must not be symbolic: '+relative);if(stat.isDirectory())for(const name of fs.readdirSync(file).sort())walk(path.join(relative,name));else if(stat.isFile())files.push({path:relative.replaceAll('\\','/'),hash:hash(file)});};
 names.forEach(walk);
 return printDependencyFiles(root,files);
}
export function snapshotDifferences(root,files){
 const actual=snapshotFiles(root),hashes=new Map(actual.map(row=>[row.path,row.hash]));
 const applicable=printDependencyFiles(root,files);
 const expected=new Set(applicable.map(row=>row.path));
 return [...applicable.filter(row=>hashes.get(row.path)!==row.hash).map(row=>row.path),...actual.filter(row=>!expected.has(row.path)).map(row=>row.path)];
}
// A skill campaign writes public/content and public/quizzes JSON while imports
// run. A booklet export does not load a skill file its project never names, so
// such a write is not a change to that export. Everything else under the frozen
// entries (renderer, data, scripts, referenced assets) still counts.
export function unrelatedCampaignFile(file,project){
 const match=/^public\/(?:content|quizzes)\/([a-z0-9-]+)\.json$/.exec(file);
 return !!match&&!JSON.stringify(project).includes(match[1]);
}
// Private images belonging to another project cannot affect this lean booklet
// unless it references that project. Shared assets and our own namespace stay
// strict, including files whose explicit image references are URL-encoded.
export function unrelatedProjectAssetFile(file,project,root=process.cwd()){
 let match=/^public\/booklet-assets\/projects\/([^/]+)\//.exec(file);
 if(!match){
  const owned=/^public\/booklet-assets\/([a-zA-Z0-9_-]+)\//.exec(file);
  if(owned&&!['shared','projects'].includes(owned[1].toLowerCase())){
   // Existing Studio masters use the same private asset namespace as imports,
   // even when they have no canonical transcription run. Prove ownership from
   // an actual project ID; unknown directories and shared assets stay strict.
   try{
    const owner=JSON.parse(fs.readFileSync(path.join(root,'booklets/projects',owned[1]+'.json'),'utf8'));
    if(owner.id===owned[1])match=owned;
   }catch{}
   if(!match)try{
    const run=JSON.parse(fs.readFileSync(path.join(root,'.booklet-work/full-imports',owned[1],'manifest.json'),'utf8'));
    if(run.format==='mathsmap-booklet-transcription-run-v1'&&run.id===owned[1])match=owned;
   }catch{}
  }
 }
 if(!match||!isLeanReview(project)||typeof project.id!=='string'||!project.id||match[1].toLowerCase()===project.id.toLowerCase())return false;
 const namespace=match[1].toLowerCase();
 const referenced=value=>{
  if(typeof value==='string'){
   if(value.toLowerCase().includes(namespace))return true;
   try{return decodeURIComponent(value).toLowerCase().includes(namespace);}catch{return false;}
  }
  return value&&typeof value==='object'&&Object.values(value).some(referenced);
 };
 return !referenced(project);
}
// The generated index carries skill counts plus a generation timestamp. Only
// counts for skills named by this booklet can affect its loaded content.
export function unrelatedCampaignManifest(before,after,project){
 if(!before||!after||!isLeanReview(project))return false;
 for(const value of [before,after])if(Object.keys(value).some(key=>!['generated','content','quiz'].includes(key))||!value.content||!value.quiz)return false;
 const text=JSON.stringify(project);
 for(const kind of ['content','quiz'])for(const id of new Set([...Object.keys(before[kind]),...Object.keys(after[kind])]))if(text.includes(id)&&JSON.stringify(before[kind][id])!==JSON.stringify(after[kind][id]))return false;
 return true;
}
const readCampaignManifest=root=>{try{return JSON.parse(fs.readFileSync(path.join(root,'public/content-manifest.json'),'utf8'));}catch{return null;}};
// The solid-edge auditor cannot affect a booklet with no solid candidates or
// retained images. Candidate detection and renderer dependencies stay strict.
export function unrelatedSolidAuditFile(file,project){
 if(file!=='scripts/lib/solid-audit.mjs'||!isLeanReview(project))return false;
 let affected=false;
 visitFigures(project,figure=>{if(figure.image||figure.code&&isSolidCandidate(figure.code,figure.context))affected=true;});
 return !affected;
}
// Already-authored projects do not call contentProject while printing. Keep
// every import, signature and source-review function bound, but allow edits
// confined to that unused authoring function's body. Unknown callers stay strict.
export function unrelatedSourceImportChange(file,project,root,snapshot){
 if(file!=='src/lib/booklet-source-content.js'||!isLeanReview(project)||!Array.isArray(project.sections))return false;
 const skeleton=directory=>{
  const source=fs.readFileSync(path.join(directory,file),'utf8'),ast=parseAst(source);
  const node=ast.body.find(node=>node.type==='ExportNamedDeclaration'&&node.declaration?.type==='FunctionDeclaration'&&node.declaration.id?.name==='contentProject');
  if(!node||/\bcontentProject\b/.test(source.slice(0,node.start)+source.slice(node.end)))return null;
  return source.slice(0,node.declaration.body.start)+'{}'+source.slice(node.declaration.body.end);
 };
 const hasCaller=directory=>{
  const walk=relative=>{
   const absolute=path.join(directory,relative);if(!fs.existsSync(absolute))return false;
   if(fs.statSync(absolute).isDirectory())return fs.readdirSync(absolute).some(name=>walk(path.join(relative,name)));
   if(relative.replaceAll('\\','/')===file||!(/\.(?:m?js|svelte|html)$/.test(relative)))return false;
   const source=fs.readFileSync(absolute,'utf8');
   if(/\bcontentProject\b/.test(source))return true;
   const rest=source.replace(/\bimport\s*\{([^}]*)\}\s*from\s*(['"])[^'"]*booklet-source-content\.js\2\s*;?/g,(statement,names)=>names.split(',').every(name=>/^(?:sourceReferences|sourcePageOptions|sourceInventories)(?:\s+as\s+\w+)?$/.test(name.trim()))?'':statement);
   return rest.includes('booklet-source-content');
  };
  return ['src','scripts/booklet/check-compact-exercises.mjs','scripts/booklet/diagram-preflight.mjs'].some(walk);
 };
 try{const before=skeleton(snapshot),after=skeleton(root);return before!==null&&before===after&&!hasCaller(root)&&!hasCaller(snapshot);}catch{return false;}
}
export function inactiveSqrtClozeChange(before,after,project){
 if(!isLeanReview(project))return false;
 const active=value=>value&&typeof value==='object'&&(value.enclosure==='sqrt'||Object.values(value).some(active));
 if(active(project))return false;
 before=before.replaceAll('\r\n','\n');after=after.replaceAll('\r\n','\n');
 const field="...(x.enclosure==='sqrt'?{enclosure:'sqrt'}:{}), ";
 const strip=source=>{
  const start=source.indexOf("    if(n.enclosure==='sqrt'){"),end=source.indexOf('    const content=fillCloze?',start);
  if(start<0)return source.includes(field)?null:source;
  if(end<0||!source.includes(field))return null;
  const branch=source.slice(start,end),hash=createHash('sha256').update(branch).digest('hex');
  if(!['9dcc3acb33f8c35f56883dc827694b9a97e3d20575c9a586fb9cf9002dd1957d','a5c3e44cf779b6cafd0fa0e5d817159963c5e8c9f1b93dce24b49913aa19d0eb'].includes(hash))return null;
  return source.replace(field,'').replace(branch,'');
 };
 const original=strip(before),current=strip(after);return original!==null&&current!==null&&original===current;
}
export function unrelatedInactiveClozeChange(file,project,root,snapshot){
 if(file!=='public/libs/maths-editor/document-model.mjs')return false;
 try{return inactiveSqrtClozeChange(fs.readFileSync(path.join(snapshot,file),'utf8'),fs.readFileSync(path.join(root,file),'utf8'),project);}catch{return false;}
}
export function answerLinkRefactorEquivalent(file,before,after,project){
 if(!isLeanReview(project)||!Array.isArray(project.sections))return false;
 const old=node=>!node?.children?.length||node.answer?.short||node.answer?.worked?node:old(node.children[0]);
 const equivalent=node=>!!node&&old(node)?.id===firstAnswerNode(node)?.id&&(node.children??[]).every(equivalent);
 if(!project.sections.flatMap(s=>s.blocks??[]).every(b=>equivalent(b.content)))return false;
 before=before.replaceAll('\r\n','\n');after=after.replaceAll('\r\n','\n');
 const replacements=file==='src/components/PracticeQuestionRenderer.svelte'?[
  ['answerNodeContext,isGivenFigureNode}', 'answerNodeContext,isGivenFigureNode,firstAnswerNode}'],
  ["  const answeredNode = (node) => !node.children?.length || node.answer?.short || node.answer?.worked ? node : answeredNode(node.children[0]);\n  const partHref = (node, depth) => depth === 0 || !answerPartHref ? answerHref : answerPartHref + answeredNode(node).id;", "  const partHref = (node, depth) => depth === 0 || !answerPartHref || !firstAnswerNode(node) ? answerHref : answerPartHref + firstAnswerNode(node).id;"]
 ]:file==='src/components/BookletArrangement.svelte'?[
  [" import {hasStandaloneMathTable} from '../lib/booklet-labels.js';", " import {hasStandaloneMathTable} from '../lib/booklet-labels.js';\n import {firstAnswerNode} from '../lib/booklet-exercises.js';"],
  ["  let node=find(block.content);while(node?.children?.length&&!node.answer?.short&&!node.answer?.worked)node=node.children[0];\n  return answerPartHref+(node?.id??ownerId);", "  const node=firstAnswerNode(find(block.content));\n  return node?answerPartHref+node.id:answerHref;"]
 ]:null;
 if(!replacements)return false;
 for(const [original,corrected]of replacements){if(!before.includes(original))return false;before=before.replace(original,corrected);}
 return before===after;
}
export function unrelatedAnswerLinkRefactor(file,project,root,snapshot){
 if(!['src/components/PracticeQuestionRenderer.svelte','src/components/BookletArrangement.svelte'].includes(file))return false;
 try{
  if(hash(path.join(root,'src/lib/booklet-exercises.js'))!==hash(path.join(snapshot,'src/lib/booklet-exercises.js')))return false;
  return answerLinkRefactorEquivalent(file,fs.readFileSync(path.join(snapshot,file),'utf8'),fs.readFileSync(path.join(root,file),'utf8'),project);
 }catch{return false;}
}
export function unrelatedPracticeScopeHostChange(file,project,root,snapshot){
 if(file!=='scripts/booklet/practice-only-scope.mjs'||!isLeanReview(project))return false;
 try{return !snapshotFiles(root).some(row=>row.path===file)&&!snapshotFiles(snapshot).some(row=>row.path===file);}catch{return false;}
}
// This exact importer guard hardening cannot run for a materialized project
// whose bound workflow contains no applicable absent-parent correction.
// Do not exempt the whole workflow module: all other edits/callers stay bound.
export function inactiveAbsentParentGuardChange(file,project,root,snapshot){
 if(file!=='scripts/booklet/workflow-review.mjs'||!isLeanReview(project)||!Array.isArray(project.sections))return false;
 const original="      const parent=json(ref.path,null)?.entries?.find(e=>e.id===patch.corrected);";
 const corrected="      const parentSource=json(ref.path,null);\n      if(parentSource?.pageNumber!==ref.pageNumber)throw Error('Absent inventory parent evidence page mismatch '+patch.targetId);\n      const parent=parentSource.entries?.find(e=>e.id===patch.corrected);";
 const callers=new Set(['assemble-semantic-packets','bounded-stages','check-compact-exercises','dependency-runner','efficiency-tools','import-closeout','import-project-bank','inventory-reuse','lean-visual','local-attempt-repair','multi-source-review','prepare-pipeline-pilot','review-reuse','review-workflow','run-workflow','seed-final-export-cache','semantic-workflow','visual-review-queue','workflow-controller'].map(name=>'scripts/booklet/'+name+'.mjs'));
 try{
  const read=directory=>fs.readFileSync(path.join(directory,file),'utf8').replaceAll('\r\n','\n'),before=read(snapshot),after=read(root);
  const node=parseAst(before).body.find(n=>n.type==='ExportNamedDeclaration'&&n.declaration?.type==='FunctionDeclaration'&&n.declaration.id?.name==='materializeCorrections')?.declaration;
  const at=before.indexOf(original);
  if(!node||at<node.body.start||at>=node.body.end||before.split(original).length!==2||after.split(corrected).length!==2||before.replace(original,corrected)!==after)return false;
  parseAst(after);
  const printing=new Map([root,snapshot].map(directory=>[directory,new Set(snapshotFiles(directory).map(row=>row.path))]));
  for(const directory of [root,snapshot]){
   const scan=relative=>{
    const absolute=path.join(directory,relative);if(!fs.existsSync(absolute))return true;
    const stat=fs.lstatSync(absolute);if(stat.isSymbolicLink())return false;
    if(stat.isDirectory())return fs.readdirSync(absolute).every(name=>scan(path.join(relative,name)));
    const name=relative.replaceAll('\\','/');
    if(!/\.(?:m?js|svelte|html)$/.test(name)||[file,'scripts/booklet/import-verification-runtime.mjs'].includes(name))return true;
    const source=fs.readFileSync(absolute,'utf8');
    if(!/workflow-review|\bmaterializeCorrections\b/.test(source))return true;
    if(!callers.has(name))return false;
    if(!printing.get(root).has(name)&&!printing.get(snapshot).has(name))return true;
    const other=path.join(directory===root?snapshot:root,name);
    return fs.existsSync(other)&&source.replaceAll('\r\n','\n')===fs.readFileSync(other,'utf8').replaceAll('\r\n','\n');
   };
   if(!['src','scripts','public','vite.config.js','index.html'].every(scan))return false;
  }
  const id=project.source?.runId,refs=[project.source?.workflow,project.source?.inventory?.workflow].filter(Boolean);
  if(!/^[a-zA-Z0-9_-]+$/.test(id??'')||!refs.length||refs.some(ref=>ref.runId!==id))return false;
  const run=path.join(root,'.booklet-work/full-imports',id),state=JSON.parse(fs.readFileSync(path.join(run,'workflow/issues.json'))),manifest=JSON.parse(fs.readFileSync(path.join(run,'manifest.json')));
  if(manifest.id!==id||!Array.isArray(state.corrections)||state.corrections.some(c=>c.status==='approved'&&c.patches?.some(p=>p.scope==='inventory'&&p.field==='/parentId'&&p.originalAbsent===true&&p.original===null)))return false;
  if(refs.some(ref=>!Array.isArray(ref.correctionIds)||ref.correctionIds.some(id=>!state.corrections.some(c=>c.id===id&&c.status==='approved'))))return false;
  for(const [key,local]of [['pdf','booklet.pdf'],['teacherPdf','teacher.pdf']]){
   const expected=project.source?.sourceHashes?.[key];
   if(!expected||manifest.source?.[key+'Hash']!==expected||hash(manifest.source[key])!==expected||hash(path.join(run,'source',local))!==expected)return false;
  }
  return true;
 }catch{return false;}
}
export function answerResponseNavigationEquivalent(file,before,after,project){
 if(!isLeanReview(project)||!Array.isArray(project.sections))return false;
 const blocks=project.sections.flatMap(s=>s.blocks??[]);
 for(const block of blocks){const responses=block.sourceReview?.responses??[],same=node=>!!node&&firstAnswerNode(node,[])?.id===firstAnswerNode(node,responses)?.id&&(node.children??[]).every(same);if(!same(block.content))return false;}
 before=before.replaceAll('\r\n','\n');after=after.replaceAll('\r\n','\n');
 const oldHelper="export function firstAnswerNode(node){\n  if(!node||isGivenFigureNode(node))return null;\n  if(node.answer?.short||node.answer?.worked||!node.children?.length)return node;\n  return node.children.map(firstAnswerNode).find(Boolean)??null;\n}",newHelper="export function firstAnswerNode(node,responses=[]){\n  if(!node||isGivenFigureNode(node))return null;\n  if(!node.children?.length&&!node.answer?.short&&!node.answer?.worked&&responses.some(r=>r.targetId===node.id&&r.kind==='none'))return null;\n  if(node.answer?.short||node.answer?.worked||!node.children?.length)return node;\n  return node.children.map(child=>firstAnswerNode(child,responses)).find(Boolean)??null;\n}";
 if(file==='src/lib/booklet-exercises.js'){if(!before.includes(oldHelper))return false;return before.replace(oldHelper,newHelper)===after;}
 if(file==='src/components/BookletArrangement.svelte'){
  const original='const node=firstAnswerNode(find(block.content));',corrected='const node=firstAnswerNode(find(block.content),block.sourceReview?.responses??[]);';
  return before.includes(original)&&before.replace(original,corrected)===after;
 }
 if(file==='src/components/PracticeQuestionRenderer.svelte'){
  const original='firstAnswerNode(node)',corrected='firstAnswerNode(node,question.sourceReview?.responses??[])';
  if(before.split(original).length!==3)return false;let expected=before.replaceAll(original,corrected);
  const row="<tr id={answerAnchorPrefix?answerAnchorPrefix+'part-'+row.id:undefined}>";
  if(expected!==after&&expected.includes(row)){
   const rewrite=block=>/^Fill in the table\b/i.test(block.content?.prompt??'')&&block.content?.layout==='grid'&&Number(block.content?.columns)===2&&(block.content?.children?.length??0)>=4&&block.content.children.every(child=>!child.children?.length);
   if(blocks.some(rewrite))return false;expected=expected.replace(row,'<tr>');
  }
  return expected===after;
 }
 return false;
}
export function unrelatedResponseNavigationChange(file,project,root,snapshot){
 if(!['src/lib/booklet-exercises.js','src/components/PracticeQuestionRenderer.svelte','src/components/BookletArrangement.svelte'].includes(file))return false;
 try{
  const helper='src/lib/booklet-exercises.js',a=fs.readFileSync(path.join(snapshot,helper),'utf8'),b=fs.readFileSync(path.join(root,helper),'utf8');
  if(a!==b&&!answerResponseNavigationEquivalent(helper,a,b,project))return false;
  return answerResponseNavigationEquivalent(file,fs.readFileSync(path.join(snapshot,file),'utf8'),fs.readFileSync(path.join(root,file),'utf8'),project);
 }catch{return false;}
}
const scopedCampaignFile=(file,project,root,snapshot)=>unrelatedCampaignFile(file,project)||unrelatedProjectAssetFile(file,project,root)||unrelatedSolidAuditFile(file,project)||unrelatedSourceImportChange(file,project,root,snapshot)||unrelatedInactiveClozeChange(file,project,root,snapshot)||unrelatedAnswerLinkRefactor(file,project,root,snapshot)||unrelatedResponseNavigationChange(file,project,root,snapshot)||unrelatedPracticeScopeHostChange(file,project,root,snapshot)||inactiveAbsentParentGuardChange(file,project,root,snapshot)||(file==='public/content-manifest.json'&&unrelatedCampaignManifest(readCampaignManifest(snapshot),readCampaignManifest(root),project));
// Resume an already successful checker after an unrelated skill campaign writes
// public JSON. Never relax the frozen renderer, project or PDF checks.
export function verifyCompletedFrozenExport({out,projectId,projectFile,artifactReview=false}){
 if(typeof artifactReview!=='boolean')throw Error('Artifact review must be explicitly true or false');
 const manifest=JSON.parse(fs.readFileSync(path.join(out,'runtime-manifest.json'))),project=JSON.parse(fs.readFileSync(projectFile));
 if(!isLeanReview(project))throw Error('Scoped export reuse requires the lean profile');
 const receipts=fs.readdirSync(out).filter(name=>/^frozen-export-receipt-.*\.json$/.test(name)).sort();
 const attempt=receipts.length?JSON.parse(fs.readFileSync(path.join(out,receipts.at(-1)))):null;
 if(attempt?.status!==0||attempt.error)throw Error('The complete five-edition checker has not passed');
 if(artifactReview&&attempt.changedDependencies?.some(file=>!scopedCampaignFile(file,project,manifest.root,manifest.snapshot)))throw Error('Dependencies changed during the completed export');
 if(snapshotDifferences(manifest.snapshot,manifest.files).length)throw Error('Frozen renderer changed');
 const changed=snapshotDifferences(manifest.root,manifest.files),unrelated=changed.every(file=>scopedCampaignFile(file,project,manifest.root,manifest.snapshot));
 // A fill review reads already completed PDF bytes. Later tool/renderer edits
 // cannot alter those pages; project, frozen runtime and PDF guards still apply.
 // Ordinary export reuse keeps its current-runtime dependency check.
 if(!unrelated&&!artifactReview)throw Error('Current export dependencies changed: '+changed.join(', '));
 if(artifactReview&&changed.some(file=>file.startsWith('public/booklet-assets/')&&!unrelatedProjectAssetFile(file,project,manifest.root)))throw Error('Referenced diagram assets changed');
 const report=JSON.parse(fs.readFileSync(path.join(out,'report.json'))).report?.[projectId];
 for(const edition of ['student','short','worked','with-short','with-worked']){
  const entry=report?.[edition];
  if(!entry||entry.projectHash!==projectReviewHash(project)||entry.issues?.length||!entry.pageHashes?.length)throw Error('Current project or checks differ for '+edition);
  if(!entry.pdf?.path||!fs.existsSync(entry.pdf.path)||hash(entry.pdf.path)!==entry.pdf.hash)throw Error('PDF changed for '+edition);
 }
 const scoped=changed.filter(file=>scopedCampaignFile(file,project,manifest.root,manifest.snapshot));
 return {reused:true,...(artifactReview?{artifactReview:true,laterDependencyChanges:changed.filter(file=>!scoped.includes(file))}:{}),unrelatedCampaignChanges:scoped.filter(file=>!unrelatedProjectAssetFile(file,project,manifest.root)&&!unrelatedSolidAuditFile(file,project)),unrelatedProjectAssetChanges:scoped.filter(file=>unrelatedProjectAssetFile(file,project,manifest.root)),unrelatedSolidAuditChanges:scoped.filter(file=>unrelatedSolidAuditFile(file,project))};
}
function attachSharedRenderCache(root,snapshot){
 const source=path.join(root,'.booklet-work/render-cache'),target=path.join(snapshot,'.booklet-work/render-cache');
 // The server has GET-only access; existing version/checksum guards validate
 // each SVG. Trusted export tools keep publishing through their usual path.
 if(fs.existsSync(source)&&!fs.existsSync(target)){fs.mkdirSync(path.dirname(target),{recursive:true});fs.symlinkSync(source,target,process.platform==='win32'?'junction':'dir');}
}
export function prepareVerificationSnapshot({root=process.cwd(),out,project}){
 root=path.resolve(root);out=path.resolve(out);const snapshot=path.join(out,'runtime'),manifestFile=path.join(out,'runtime-manifest.json');
 const initialIndex=readCampaignManifest(root);
 const unrelated=file=>project&&isLeanReview(project)&&(unrelatedCampaignFile(file,project)||unrelatedProjectAssetFile(file,project,root)||(file==='public/content-manifest.json'&&unrelatedCampaignManifest(initialIndex,readCampaignManifest(root),project)&&unrelatedCampaignManifest(initialIndex,readCampaignManifest(snapshot),project)));
 const relative=path.relative(root,out);if(!relative||relative.startsWith('..')||path.isAbsolute(relative)||!relative.replaceAll('\\','/').startsWith('.booklet-work/'))throw Error('Verification output must be a separate local .booklet-work directory');
 if(fs.existsSync(manifestFile)){
  const manifest=JSON.parse(fs.readFileSync(manifestFile,'utf8'));
  if(manifest.root!==root||manifest.snapshot!==snapshot)throw Error('Verification snapshot belongs to another workspace');
  const changed=[...snapshotDifferences(root,manifest.files).filter(file=>!unrelated(file)),...snapshotDifferences(snapshot,manifest.files)];
  if(changed.length)throw Error('Verification snapshot changed; preserve this output and use a new output directory: '+[...new Set(changed)].slice(0,12).join(', '));
  attachSharedRenderCache(root,snapshot);
  return manifest;
 }
 if(fs.existsSync(snapshot))throw Error('Incomplete runtime snapshot; preserve it and select a fresh output directory');
 const files=snapshotFiles(root);fs.mkdirSync(snapshot,{recursive:true});
 for(const row of files){const target=path.join(snapshot,row.path);fs.mkdirSync(path.dirname(target),{recursive:true});fs.copyFileSync(path.join(root,row.path),target);}
 const changed=[...snapshotDifferences(root,files),...snapshotDifferences(snapshot,files)].filter(file=>!unrelated(file));
 if(changed.length)throw Error('Source changed while freezing the verification runtime: '+[...new Set(changed)].slice(0,12).join(', '));
 // Record the bytes actually frozen when an unrelated campaign wrote during
 // copying. Referenced skill files and every non-campaign dependency stay strict.
 for(const row of files)if(unrelated(row.path))row.hash=hash(path.join(snapshot,row.path));
 fs.symlinkSync(path.join(root,'node_modules'),path.join(snapshot,'node_modules'),process.platform==='win32'?'junction':'dir');
 attachSharedRenderCache(root,snapshot);
 const manifest={version:1,root,snapshot,files,createdAt:new Date().toISOString(),watch:false,hmr:false};
 fs.writeFileSync(manifestFile,JSON.stringify(manifest,null,2),{flag:'wx'});return manifest;
}
export async function startFrozenVerificationServer(manifest,out){
 // Plugins using process.cwd() and module constants must also see the frozen
 // root. Passing Vite's root in the parent's process does not isolate those.
 // Vite ignores an inline null when the config file sets server.watch, so the
 // resolved config is loaded and its server block is overridden directly.
 const script=`import {createServer,loadConfigFromFile} from 'vite';import path from 'node:path';import fs from 'node:fs';
 const loaded=await loadConfigFromFile({command:'serve',mode:'development'},path.join(process.cwd(),'vite.config.js'),process.cwd());
 const config=loaded?.config??{},dependencies=fs.realpathSync(path.join(process.cwd(),'node_modules'));
 const server=await createServer({...config,configFile:false,root:process.cwd(),cacheDir:process.argv[1],server:{...config.server,fs:{...config.server?.fs,allow:[process.cwd(),dependencies]},host:'127.0.0.1',port:0,strictPort:false,open:false,hmr:false,watch:null}});
 let closing=false;const close=async()=>{if(closing)return;closing=true;await server.close();process.exit(0);};process.on('message',m=>{if(m==='close')close();});process.on('disconnect',close);
 await server.listen();process.send({port:server.httpServer.address().port,cwd:process.cwd(),hmr:server.config.server.hmr,watch:server.config.server.watch});`;
 const child=spawn(process.execPath,['--input-type=module','-e',script,path.resolve(out,'vite-cache')],{cwd:manifest.snapshot,windowsHide:true,stdio:['ignore','pipe','pipe','ipc']});
 const log=fs.createWriteStream(path.join(out,'frozen-server.log'),{flags:'a'});child.stdout.pipe(log,{end:false});child.stderr.pipe(log,{end:false});
 let exited=false;const ended=new Promise(resolve=>child.once('close',()=>{exited=true;log.end();resolve();}));
 let info;
 try{info=await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('Frozen server startup timed out')),60000);const finish=(error,value)=>{clearTimeout(timer);error?reject(error):resolve(value);};child.once('message',m=>finish(null,m));child.once('error',e=>finish(e));child.once('exit',code=>finish(Error('Frozen server exited before readiness: '+code)));});}
 catch(error){child.kill();await ended;const diagnostic=fs.readFileSync(path.join(out,'frozen-server.log'),'utf8').slice(-2000);throw Error(error.message+'\n'+diagnostic);}
 const close=async()=>{if(exited)return;const timer=setTimeout(()=>child.kill(),10000);try{if(child.connected)child.send('close');else child.kill();await ended;}finally{clearTimeout(timer);}};
 if(path.resolve(info.cwd)!==manifest.snapshot||info.hmr!==false||info.watch!==null){await close();throw Error('Frozen server isolation configuration mismatch');}
 return {info,listen:async()=>{},httpServer:{address:()=>({port:info.port})},close};
}
export async function exportWithFrozenRuntime({root=process.cwd(),out,projectId,runDir,visibilityReviews,projectFile,regenerationReason,extraArgs=[],execute=runChecker,createServer}){
 if(!out||!projectId||!runDir)throw Error('Frozen export requires project ID, source run and output directory');
 const attempts=fs.existsSync(out)?fs.readdirSync(out).filter(n=>/^frozen-export-receipt-.*\.json$/.test(n)).map(n=>JSON.parse(fs.readFileSync(path.join(out,n),'utf8'))):[];
 if(attempts.filter(r=>r.status!==0).length>=2&&!regenerationReason?.trim())throw Error('Diagnose repeated export failure before a third attempt; provide --regenerate-reason with the cause and changed approach');
 const sourceProjectFile=projectFile??path.join(root,'booklets/projects',projectId+'.json');
 const sourceProject=JSON.parse(fs.readFileSync(sourceProjectFile,'utf8').replace(/^\uFEFF/,''));
 const inputs=[sourceProjectFile,...(visibilityReviews?[visibilityReviews]:[])].map(file=>({file,hash:hash(file)}));
 const manifest=prepareVerificationSnapshot({root,out,project:sourceProject});
 let server,status,error;
 try{
  try{
   server=createServer?await createServer({root:manifest.snapshot,configFile:path.join(manifest.snapshot,'vite.config.js'),cacheDir:path.join(out,'vite-cache'),server:{host:'127.0.0.1',port:0,strictPort:false,open:false,hmr:false,watch:null}}):await startFrozenVerificationServer(manifest,out);
   await server.listen();const address=server.httpServer.address();if(!address||typeof address==='string')throw Error('Verification server address unavailable');
   const args=['scripts/booklet/check-compact-exercises.mjs','--projects',projectId,'--out',path.resolve(out),'--run-dir',path.resolve(runDir),'--base','http://127.0.0.1:'+address.port,'--fresh-edition-document',...(visibilityReviews?['--visibility-reviews',path.resolve(visibilityReviews)]:[]),...(projectFile?['--project-file',path.resolve(projectFile)]:[]),...extraArgs];
   status=await execute({root:manifest.root,args});
  }catch(e){status=null;error=e.message;}
  let project=null;try{project=JSON.parse(fs.readFileSync(inputs[0].file,'utf8').replace(/^\uFEFF/,''));}catch{}
  const live=snapshotDifferences(manifest.root,manifest.files),unrelated=project?live.filter(file=>scopedCampaignFile(file,project,manifest.root,manifest.snapshot)):[];
  const changed=[...live.filter(file=>!unrelated.includes(file)),...snapshotDifferences(manifest.snapshot,manifest.files),...inputs.filter(i=>!fs.existsSync(i.file)||hash(i.file)!==i.hash).map(i=>i.file)];
  const receipt={version:1,at:new Date().toISOString(),status,error,regenerationReason:regenerationReason??null,changedDependencies:[...new Set(changed)],unrelatedCampaignChanges:unrelated.filter(file=>!unrelatedProjectAssetFile(file,project,manifest.root)),unrelatedProjectAssetChanges:unrelated.filter(file=>unrelatedProjectAssetFile(file,project,manifest.root)),runtimeManifest:path.join(path.resolve(out),'runtime-manifest.json'),freshEditionDocuments:true,visualAcceptance:false};
  fs.writeFileSync(path.join(out,'frozen-export-receipt-'+Date.now()+'.json'),JSON.stringify(receipt,null,2),{flag:'wx'});
  if(changed.length)throw Error('Export snapshot no longer matches live dependencies; passing artifacts remain preserved: '+changed.slice(0,12).join(', '));
  if(status!==0)throw Error('Export failed; resume the same output directory to reuse passed editions. Diagnose repeated failure before a third attempt.');
  return receipt;
 }finally{if(server)await server.close();}
}
async function runChecker({root,args}){
 const child=spawn(process.execPath,args,{cwd:root,windowsHide:true,stdio:'inherit'});return new Promise((resolve,reject)=>{child.on('error',reject);child.on('close',resolve);});
}
