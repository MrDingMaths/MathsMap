import fs from 'node:fs';
import {createHash} from 'node:crypto';
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
export function renderedPageHashes(pages,{renderer,settings,assets}){
 const global=structuredClone(settings);delete global.flowEdition;
 return pages.map((p,i)=>({page:i+1,blocks:p.blocks,hash:hash({html:p.html,renderer,settings:global,assets})}));
}
// Compare physical positions, not source-page IDs: pagination may shift a tail.
export function affectedPages(previous,current){
 const changed=new Set(),old=new Map((previous??[]).map(p=>[p.page,p.hash]));
 for(const p of current)if(old.get(p.page)!==p.hash)changed.add(p.page);
 for(const p of previous??[])if(p.page>current.length&&current.length)changed.add(current.length);
 return [...new Set([...changed].flatMap(p=>[p-1,p,p+1]).filter(p=>p>=1&&p<=current.length))].sort((a,b)=>a-b);
}
export function validateFinalManifest(review,{edition,key,projectHash,renderer}){
 const reference=review.manifest;
 if(!reference?.path||!fs.existsSync(reference.path)||reference.hash!==artifactHash(reference.path))throw Error('Missing or stale full render manifest: '+edition);
 const manifest=JSON.parse(fs.readFileSync(reference.path,'utf8'));
 if(manifest.mode!=='full'||manifest.passed!==true||manifest.edition!==edition||manifest.workflowKey!==key||manifest.projectHash!==projectHash||manifest.renderer!==renderer)throw Error('Final manifest is not a current full-edition check: '+edition);
 if(!manifest.pdf?.path||!fs.existsSync(manifest.pdf.path)||artifactHash(manifest.pdf.path)!==manifest.pdf.hash)throw Error('Final PDF changed: '+edition);
 if(!manifest.pages?.length||manifest.pages.length!==review.pages.length||manifest.pages.some((p,i)=>p.page!==i+1||p.hash!==review.pages[i]?.hash||review.pages[i]?.page!==p.page||review.pages[i]?.checked!==true))throw Error('Final visual review must match every rendered page: '+edition);
 return [reference,manifest.pdf];
}
