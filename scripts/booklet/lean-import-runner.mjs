import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {runAstraTask} from './codex-transcription.mjs';
import {compactImportPrompt} from './import-prompt-codec.mjs';
import {validateNativeTemplates,expandNativeTemplates} from './import-native-templates.mjs';
import {bytesHash} from './workflow-review.mjs';
import {contentNodes} from '../../src/lib/booklet-content-verification.js';
import {importReviewSupplement} from './import-review-supplement.mjs';
const digest=text=>createHash('sha256').update(text).digest('hex');
export function createLeanImportRunner({templatesFile,execute=runAstraTask}={}){
 const templateRef=templatesFile?{path:path.resolve(templatesFile),hash:bytesHash(templatesFile)}:null;
 const templates=templateRef?validateNativeTemplates(JSON.parse(fs.readFileSync(templateRef.path,'utf8'))):null;
 return async prepared=>{
  if(templateRef&&bytesHash(templateRef.path)!==templateRef.hash)throw Error('Native author templates changed before dispatch');
  const compact=compactImportPrompt(prepared.prompt);
  const author=prepared.profile==='transcription'||!prepared.ticket;
  let prompt=compact.prompt;
  if(templates&&author)prompt+='\n\nOptional native author recipes: return {$nativeTemplate:ID,values:{JSON_POINTER:VALUE}} in place of a native subtree. Supply every slot, including IDs and mathematical values. Templates supply structure only. The normal author validators and independent content review still apply.\n'+JSON.stringify(templates);
  const images=[...new Set(prepared.images??[])];
  // Canonical review tickets already contain the scoped source text/metadata.
  // Attach every declared image so a rejected linked-file read cannot lose it.
  if(prepared.ticket){
   if(bytesHash(prepared.ticket.path)!==prepared.ticket.hash)throw Error('Import ticket changed before delivery');
   const request=JSON.parse(fs.readFileSync(prepared.ticket.path,'utf8'));
   for(const a of request.job.evidence??[])if(/\.(png|jpe?g|webp)$/i.test(a.path)){
    if(bytesHash(a.path)!==a.hash)throw Error('Assigned source image changed');if(!images.includes(a.path))images.push(a.path);
   }
   if(request.job.stage==='assessment'){
    const nodes=[...contentNodes({sections:[{blocks:request.job.context.questions}]}).values()];
    if(!request.job.promptProfile)prompt+=importReviewSupplement(request.job);
    const imagesToReview=nodes.filter(({node})=>node.format==='image'||node.type==='image').map(({node})=>({id:node.id,src:node.src??node.attrs?.src}));
    for(const row of imagesToReview){const file=typeof row.src==='string'?fs.existsSync(row.src)?path.resolve(row.src):row.src.startsWith('/')?path.resolve('public','.'+row.src):path.resolve(row.src):null;if(file&&fs.existsSync(file)&&!images.includes(file))images.push(file);}
   }
  }else{
   // Assignment context is the trailing JSON in the canonical author prompt.
   const positions=[...prepared.prompt.matchAll(/(?:^|\n\n)(?=\{)/g)].map(m=>m.index+m[0].length).reverse();
   for(const start of positions){let context;try{context=JSON.parse(prepared.prompt.slice(start));}catch{continue;}for(const a of context.evidence??[])if(/\.(png|jpe?g|webp)$/i.test(a.path)){if(bytesHash(a.path)!==a.hash)throw Error('Assigned author source image changed');if(!images.includes(a.path))images.push(a.path);}break;}
  }
  const delivery={version:1,ticket:prepared.ticket??null,canonicalPromptHash:digest(prepared.prompt),deliveredPromptHash:digest(prompt),canonicalCharacters:prepared.prompt.length,deliveredCharacters:prompt.length,sharedValues:compact.sharedValues,templates:author?templateRef:null,images};
  const file=path.join(path.dirname(prepared.out),'lean-delivery.json');fs.writeFileSync(file,JSON.stringify({...delivery,prompt},null,2),{flag:'wx'});
  let reply;
  try{reply=await execute({...prepared,prompt,images,profile:author?'transcription':prepared.profile});}
  catch(error){if(error.metrics)error.metrics={...error.metrics,importDelivery:delivery};throw error;}
  try{
   if(templateRef&&bytesHash(templateRef.path)!==templateRef.hash)throw Error('Native author templates changed during dispatch');
   if(templates&&author)reply.result=expandNativeTemplates(reply.result,templates);
  }catch(error){error.metrics={...reply.metrics,importDelivery:delivery};throw error;}
  // Preserve actual provider usage, model, effort and Standard-speed evidence.
  reply.metrics={...reply.metrics,importDelivery:delivery};return reply;
 };
}
