import {createHash} from 'node:crypto';
import {createSharedResourceView,verifySharedResourcePages,hasSharedResourceAnnotations,requireResourceExportProject} from '../src/lib/booklet-shared-resources.js';
import {resourcePrintBindings,resourcePrintPageEvidence} from '../src/lib/booklet-resource-output.js';
export * from '../src/lib/booklet-shared-resources.js';
export const sharedResourceHash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
export const reviewedSharedResourceView=(project,options={})=>createSharedResourceView(project,{...options,hash:sharedResourceHash});

// Actual selected print DOM; final-size human readability still requires QA.
export async function inspectRenderedSharedResources(page,project,{edition,selectedPages=null}={}){
 requireResourceExportProject(project);
 if(!hasSharedResourceAnnotations(project))return {checked:0,pages:[]};
 const bindings=resourcePrintBindings(project,{hash:sharedResourceHash});
 if(['short','worked'].includes(edition))return {checked:0,pages:[],reason:'Answer-only edition has no student Questions consumers'};
 const pages=await page.evaluate(resourcePrintPageEvidence,bindings),selected=selectedPages??pages.map((_,i)=>i);
 verifySharedResourcePages(project,null,{edition,pages,selectedPages:selected,hash:sharedResourceHash});
 return {checked:bindings.length,pages,selectedPages:selected,humanReadabilityReview:'required'};
}
