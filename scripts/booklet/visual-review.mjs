// A review record is an explicit assertion by the reviewer, never generated from
// an automated pass. The existing final-review command remains the acceptance gate.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {loadRun} from './transcription.mjs';
import {artifactHash,projectReviewHash} from './page-review.mjs';
import {rendererSignature,contentAssetSignatures} from './verification-cache.mjs';
import {prepareReviewQueue,reviewQueueStatus,beginPageReview,recordPageReview,cancelPageReview,finalReviewRecord} from './visual-review-queue.mjs';
const read=file=>JSON.parse(fs.readFileSync(file,'utf8').replace(/^\uFEFF/,''));
const reference=file=>({path:path.resolve(file),hash:artifactHash(file)});

// Describe already-rendered evidence. Preflight can only make development input.
// Full manifests, with associated full-page images, come from the normal exporter.
export async function describeReview({projectFile,sourceFiles,manifestFiles,preflightFile,projectId,outDir,key}){
 const project=read(projectFile),projectHash=projectReviewHash(project),renderer=rendererSignature(),assets=await contentAssetSignatures(project),editions={};
 if(preflightFile){
  const report=read(preflightFile),values=report.report?.[projectId??project.id];if(!values||report.errors.length)throw Error('Missing project or failed preflight');
  fs.mkdirSync(outDir,{recursive:true});
  for(const [edition,r]of Object.entries(values)){
   if(r.mode!=='diagram-preflight'||r.issues.length||r.printed.some(p=>p.issues.length)||r.projectHash!==projectHash||r.renderer!==renderer)throw Error('Preflight evidence failed or changed: '+edition);
   const file=path.join(outDir,edition+'.review-manifest.json'),manifest={mode:'development',edition,projectHash,renderer,assets:r.assets,pdf:r.pdf,pages:r.pageHashes,images:r.screenshots,preflight:reference(preflightFile)};
   fs.writeFileSync(file,JSON.stringify(manifest,null,2)+'\n');editions[edition]={manifest:reference(file),images:r.screenshots};
  }
 }else for(const file of manifestFiles??[]){const m=read(file);if(editions[m.edition])throw Error('Duplicate edition');editions[m.edition]={manifest:reference(file),images:m.images};}
 return {mode:preflightFile?'development':'final',project:{...reference(projectFile),contentHash:projectHash},renderer,assets,sourceArtifacts:sourceFiles.map(reference),editions,...(key?{key}:{})};
}
export async function main(args=process.argv.slice(2)){
 const command=args[0],options={};for(let i=1;i<args.length;i++){if(!['--run-id','--run-dir','--input','--out'].includes(args[i])||!args[i+1]||args[i+1].startsWith('--'))throw Error('Invalid option '+args[i]);options[args[i]]=args[++i];}
 const runDir=options['--run-dir']??(options['--run-id']?loadRun(options['--run-id']).runDir:null);
 if(!runDir)throw Error('Use describe|prepare|status|begin|record|cancel|final-record --run-id ID (or --run-dir DIR) [--input JSON] [--out JSON]');
 const input=options['--input']?read(options['--input']):null;let result;
 if(command==='describe')result=await describeReview(input);
 else if(command==='prepare')result=await prepareReviewQueue(runDir,input);
 else if(command==='status')result=await reviewQueueStatus(runDir);
 else if(command==='begin')result=await beginPageReview(runDir,input);
 else if(command==='record')result=await recordPageReview(runDir,input);
 else if(command==='cancel')result=await cancelPageReview(runDir,input);
 else if(command==='final-record')result=await finalReviewRecord(runDir,input);
 else throw Error('Unknown review command');
 if(options['--out'])fs.writeFileSync(options['--out'],JSON.stringify(result,null,2)+'\n');
 console.log(JSON.stringify(result,null,2));return result;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))main().catch(error=>{console.error(error.message);process.exitCode=1;});
