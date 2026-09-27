import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {normaliseSvgPaintScopes} from '../../src/lib/svg-paint-scope.js';
import {validatePdfRasters} from './pdf-rasters.mjs';
const hash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
export const artifactHash=file=>createHash('sha256').update(fs.readFileSync(file)).digest('hex');
export function readPageManifest(file){
 try{const value=JSON.parse(fs.readFileSync(file,'utf8'));return Array.isArray(value.pages)&&value.pages.every((p,i)=>p.page===i+1&&typeof p.hash==='string')?value:null;}catch{return null;}
}
export function projectReviewHash(project){
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
 return pages.map((p,i)=>({page:i+1,blocks:p.blocks,hash:hash({html:normaliseEditorHostIds(normaliseSvgPaintScopes(p.html)),renderer,settings:global,assets})}));
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
export function validateFinalManifest(review,{edition,key,projectHash,renderer}){
 const reference=review.manifest;
 if(!reference?.path||!fs.existsSync(reference.path)||reference.hash!==artifactHash(reference.path))throw Error('Missing or stale full render manifest: '+edition);
 const manifest=JSON.parse(fs.readFileSync(reference.path,'utf8'));
 if(manifest.mode!=='full'||manifest.passed!==true||manifest.edition!==edition||manifest.workflowKey!==key||manifest.projectHash!==projectHash||manifest.renderer!==renderer)throw Error('Final manifest is not a current full-edition check: '+edition);
 if(!manifest.pdf?.path||!fs.existsSync(manifest.pdf.path)||artifactHash(manifest.pdf.path)!==manifest.pdf.hash)throw Error('Final PDF changed: '+edition);
 if(!manifest.pages?.length||manifest.pages.length!==review.pages.length||manifest.pages.some((p,i)=>p.page!==i+1||p.hash!==review.pages[i]?.hash||review.pages[i]?.page!==p.page||review.pages[i]?.checked!==true))throw Error('Final visual review must match every rendered page: '+edition);
 return [reference,manifest.pdf,...validatePdfRasters(manifest)];
}
