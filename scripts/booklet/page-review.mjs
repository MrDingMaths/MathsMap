import fs from 'node:fs';
import {isDeepStrictEqual} from 'node:util';
import {validateSelectedPageReuse,selectedPageReuseArtifacts,withSelectedPageReuseValidation} from './selected-page-review-reuse.mjs';
import {isLeanReview,printableProject} from './lean-profile.mjs';
import {createHash} from 'node:crypto';
import {normaliseSvgPaintScopes} from '../../src/lib/svg-paint-scope.js';
import {validatePdfRasters} from './pdf-rasters.mjs';
const hash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
export const artifactHash=file=>createHash('sha256').update(fs.readFileSync(file)).digest('hex');
export function readPageManifest(file){
 try{const value=JSON.parse(fs.readFileSync(file,'utf8'));return Array.isArray(value.pages)&&value.pages.every((p,i)=>p.page===i+1&&typeof p.hash==='string')?value:null;}catch{return null;}
}
export function projectReviewHash(project){
 if(isLeanReview(project))return hash(printableProject(project));
 const value=structuredClone(project);delete value.revision;delete value.updatedAt;
 if(value.settings)delete value.settings.flowEdition;
 return hash(value);
}
export function requireFinalCandidateSettlement(project,workflow){
 if(!workflow?.settled?.project?.file||workflow.settled.project.hash!==projectReviewHash(project)||!fs.existsSync(workflow.settled.project.file)||projectReviewHash(JSON.parse(fs.readFileSync(workflow.settled.project.file,'utf8')))!==workflow.settled.project.hash)throw Error('A final isolated candidate requires a current review-first settlement of that exact project.');
}
function normaliseEditorHostIds(html){
 // EditableBookletText's UUID identifies a mounted editor, not printed content.
 // Scan complete tags/attributes so prose, quoted examples and raw text survive.
 const tags=/<!--[\s\S]*?(?:-->|$)|<!\[CDATA\[[\s\S]*?(?:\]\]>|$)|<![^>]*>|<([a-z][a-z\d:-]*)(?=[\t\n\f\r />])(?:[^"'<>]|"[^"]*"|'[^']*')*>/gi;
 let result='',copied=0,tag;
 while((tag=tags.exec(html))){
  const name=tag[1]?.toLowerCase();
  if(/^(?:script|style|textarea|title|xmp|iframe|noembed|noframes|noscript|plaintext)$/.test(name)){
   const close=new RegExp('</'+name+'\\s*>','gi');close.lastIndex=tags.lastIndex;
   const end=name==='plaintext'?null:close.exec(html);
   tags.lastIndex=end?close.lastIndex:html.length;continue;
  }
  if(name!=='span')continue;
  const attributes=[...tag[0].matchAll(/[\t\n\f\r ]+([^\s"'<>/=]+)(?:[\t\n\f\r ]*=[\t\n\f\r ]*("[^"]*"|'[^']*'|[^\s"'=<>`]+))?/g)];
  const value=attribute=>attribute?.[2]?.replace(/^(?:"([\s\S]*)"|'([\s\S]*)')$/,'$1$2');
  const classes=value(attributes.find(attribute=>attribute[1].toLowerCase()==='class'));
  if(!classes?.split(/[\t\n\f\r ]+/).includes('editable-booklet-text'))continue;
  const host=attributes.find(attribute=>attribute[1].toLowerCase()==='data-host-id'),uuid=value(host);
  if(!/^[\da-f]{8}-[\da-f]{4}-4[\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/i.test(uuid))continue;
  const start=tag.index+host.index+host[0].length-host[2].length+(/^["']/.test(host[2])?1:0);
  result+=html.slice(copied,start)+'editor-host';copied=start+uuid.length;
 }
 return result+html.slice(copied);
}
export function renderedPageHashes(pages,{renderer,settings,assets}){
 const global=structuredClone(settings);delete global.flowEdition;
 return pages.map((p,i)=>({page:i+1,blocks:p.blocks,hash:hash({html:normaliseEditorHostIds(normaliseSvgPaintScopes(p.html)),renderer,settings:global,assets}),...(p.mode?{mode:p.mode,isAnswer:p.isAnswer,isCover:p.isCover,answerSectionStart:p.answerSectionStart}:{})}));
}
// Compare physical positions, not source-page IDs: pagination may shift a tail.
export function affectedPages(previous,current){
 const changed=new Set(),old=new Map((previous??[]).map(p=>[p.page,p.hash]));
 for(const p of current)if(old.get(p.page)!==p.hash)changed.add(p.page);
 for(const p of previous??[])if(p.page>current.length&&current.length)changed.add(current.length);
 return [...new Set([...changed].flatMap(p=>[p-1,p,p+1]).filter(p=>p>=1&&p<=current.length))].sort((a,b)=>a-b);
}
export function requireBoundedDevelopmentExport({projectId,edition,hasBaseline,baselineRenderer,currentRenderer,selectedPages,totalPages,reason}){
 const justification=typeof reason==='string'?reason.trim():'';
 if(!hasBaseline&&!justification)throw Error(`No page baseline for ${projectId} ${edition}. A development export would select the whole booklet. Reuse a valid baseline or pass --full-development-reason with the reason for a deliberate full render.`);
 if(hasBaseline&&baselineRenderer&&currentRenderer&&baselineRenderer!==currentRenderer&&!justification)throw Error(`The page baseline renderer differs for ${projectId} ${edition}, so the development hashes would select the whole booklet. Review the dependency change or pass --full-development-reason with the reason for a deliberate full render.`);
 if(totalPages>0&&selectedPages===totalPages&&!justification)throw Error(`Development export selected all ${totalPages} pages for ${projectId} ${edition}. Inspect the scope or pass --full-development-reason with the reason for a deliberate full render.`);
}
function checkedReviewJson(reference){
 if(!reference?.path||!fs.existsSync(reference.path)||reference.hash!==artifactHash(reference.path))throw Error('Missing or stale final review evidence');
 return JSON.parse(fs.readFileSync(reference.path,'utf8').replace(/^\uFEFF/,''));
}
function completedSelectedBodyQueue(review,{edition,key,projectHash,renderer}){
 const candidates=[];
 for(const reference of review.artifacts??[]){
  if(!reference?.path||!fs.existsSync(reference.path)||reference.hash!==artifactHash(reference.path))throw Error('Missing or stale completed queue evidence');
  let value;try{value=JSON.parse(fs.readFileSync(reference.path,'utf8').replace(/^\uFEFF/,''));}catch{continue;}
  if(value?.input&&Array.isArray(value.rows))candidates.push({reference,queue:value});
 }
 if(candidates.length!==1)throw Error('Selected-body review requires exactly one completed queue');
 const result=candidates[0],{input,rows}=result.queue;
 if(input.mode!=='final'||!isLeanReview(input)||input.key!==key||input.renderer!==renderer||input.project?.contentHash!==projectHash)throw Error('Selected-body queue is not the current lean final settlement');
 const editions=['student','short','worked','with-short','with-worked'];
 if(!isDeepStrictEqual(Object.keys(input.editions??{}).sort(),editions.sort())||!isDeepStrictEqual(input.editions[edition]?.manifest,review.manifest))throw Error('Selected-body queue does not identify the current five editions');
 let selectedCount=0;
 for(const name of editions){
  const entry=input.editions[name],manifest=checkedReviewJson(entry.manifest);
  if(!isLeanReview(manifest)||manifest.mode!=='full'||manifest.passed!==true||manifest.edition!==name||manifest.workflowKey!==key||manifest.projectHash!==projectHash||manifest.renderer!==renderer||!isDeepStrictEqual(manifest.assets,input.assets)||!isDeepStrictEqual(manifest.images,entry.images))throw Error('Selected-body queue has a stale edition: '+name);
  if(!Array.isArray(manifest.pages)||!manifest.pages.length||manifest.pages.some((page,i)=>page.page!==i+1)||!Array.isArray(manifest.visualPages)||!manifest.visualPages.length||new Set(manifest.visualPages).size!==manifest.visualPages.length)throw Error('Invalid selected-body queue manifest: '+name);
  selectedCount+=manifest.visualPages.length;
  for(const page of manifest.visualPages){
   const matches=rows.filter(row=>row.edition===name&&row.page===page),rendered=manifest.pages[page-1];
   if(matches.length!==1||!rendered||matches[0].pageHash!==rendered.hash||matches[0].review?.outcome!=='accepted'||!entry.images.some(image=>image.page===page&&isDeepStrictEqual(image,matches[0].image)))throw Error('Completed queue does not cover the exact selected page: '+name+' '+page);
  }
 }
 if(rows.length!==selectedCount||new Set(rows.map(row=>row.key)).size!==rows.length)throw Error('Completed queue contains orphan or duplicate rows');
 return result;
}
function selectedBodyProtectedPages(manifest){
 const boundaries=new Set([1,manifest.pages.length]);
 for(const [i,page]of manifest.pages.entries()){
  const previous=manifest.pages[i-1];
  if(page.isCover||page.mode==='cover'||page.answerSectionStart||(page.isAnswer&&(!previous?.isAnswer||page.mode!==previous.mode))||(previous?.isAnswer&&!page.isAnswer))boundaries.add(page.page);
 }
 return new Set([...boundaries].flatMap(page=>[page-1,page,page+1]).filter(page=>page>=1&&page<=manifest.pages.length));
}
export function validateFinalManifest(review,options){
 return withSelectedPageReuseValidation(()=>validateFinalManifestContents(review,options));
}
function validateFinalManifestContents(review,{edition,key,projectHash,renderer}){
 const reference=review.manifest;
 if(!reference?.path||!fs.existsSync(reference.path)||reference.hash!==artifactHash(reference.path))throw Error('Missing or stale full render manifest: '+edition);
 const manifest=JSON.parse(fs.readFileSync(reference.path,'utf8'));
 if(manifest.mode!=='full'||manifest.passed!==true||manifest.edition!==edition||manifest.workflowKey!==key||manifest.projectHash!==projectHash||manifest.renderer!==renderer)throw Error('Final manifest is not a current full-edition check: '+edition);
 if(!manifest.pdf?.path||!fs.existsSync(manifest.pdf.path)||artifactHash(manifest.pdf.path)!==manifest.pdf.hash)throw Error('Final PDF changed: '+edition);
 if(!manifest.pages?.length||manifest.pages.length!==review.pages.length||manifest.pages.some((p,i)=>p.page!==i+1||p.hash!==review.pages[i]?.hash||review.pages[i]?.page!==p.page||review.pages[i]?.checked!==true))throw Error('Final visual review must match every rendered page: '+edition);
 if(review.visualPages&&!isLeanReview(manifest))throw Error('Targeted review requires a three-pass manifest');
 const retained=[];
 if(isLeanReview(manifest)){
  const selected=new Set(manifest.visualPages??[]);
  if(!manifest.visualPages?.length||JSON.stringify(review.visualPages)!==JSON.stringify(manifest.visualPages)||manifest.visualPages.some(page=>!['visual','selected-body'].includes(review.pages[page-1]?.reviewMethod))||review.pages.some(page=>((page.reviewMethod==='selected-body'||page.reuseKind==='selected-body')&&!selected.has(page.page))||(page.reviewMethod==='visual'&&page.reuseKind==='selected-body')))throw Error('Selected pages require actual visual inspection or verified selected-body retention: '+edition);
  let completed,protectedPages;
  for(const number of manifest.visualPages){
   const page=review.pages[number-1];
   if(page.reviewMethod!=='selected-body')continue;
   if(page.reuseKind!=='selected-body'||!page.provenance)throw Error('Selected-body page requires its immutable proof: '+edition+' '+number);
   protectedPages??=selectedBodyProtectedPages(manifest);
   if(protectedPages.has(number))throw Error('Cover, answer boundary and physical neighbour pages require actual visual inspection: '+edition+' '+number);
   completed??=completedSelectedBodyQueue(review,{edition,key,projectHash,renderer});
   const row=completed.queue.rows.find(row=>row.edition===edition&&row.page===number);
   if(!row||row.pageHash!==page.hash||row.review?.reuseKind!=='selected-body'||!isDeepStrictEqual(page.provenance,row.review.artifact))throw Error('Selected-body proof is orphaned from its exact completed queue row');
   const proof=checkedReviewJson(page.provenance);
   if(['outcome','reviewer','note'].some(field=>proof[field]!==row.review[field]))throw Error('Selected-body review summary differs from its proof');
   validateSelectedPageReuse(proof,row,completed.queue.input);
   retained.push(completed.reference,page.provenance,...selectedPageReuseArtifacts(proof,row,completed.queue.input));
  }
 }else if(review.pages.some(page=>page.reviewMethod==='selected-body'||page.reuseKind==='selected-body'))throw Error('Selected-body retention requires a three-pass manifest');
 return [reference,manifest.pdf,...validatePdfRasters(manifest),...retained];
}
