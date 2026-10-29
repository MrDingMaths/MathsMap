import {validatePracticeItems} from './practice-item-targets.mjs';
// Reuse a recorded archetype review only after checking every mapped block.
// This module never saves a live project, publishes content or accepts findings.
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
const sha=value=>createHash('sha256').update(value).digest('hex');
const canonical=value=>Array.isArray(value)?value.map(canonical):value&&typeof value==='object'?Object.fromEntries(Object.keys(value).sort().map(key=>[key,canonical(value[key])])):value;
export function archetypeSourceHash(block){
 const source=structuredClone(block);
 if(source.classification){delete source.classification.archetype;delete source.classification.archetypeReview;}
 return sha(JSON.stringify(canonical(source)));
}
const byId=project=>{
 const result=new Map();
 for(const section of project.sections??[])for(const block of section.blocks??[]){if(result.has(block.id))throw Error('Duplicate block ID '+block.id);result.set(block.id,block);}
 return result;
};
export function reuseArchetypeMap({reviewedProject,currentProject,map,snapshotSha256,mapFile,approvedAttributions,responseAnchors}={}){
 const reviewedRevision=map.reviewedRevision??map.revision;
 if(map.projectId!==reviewedProject.id||currentProject.id!==reviewedProject.id)throw Error('Project identity mismatch');
 if(reviewedRevision!==reviewedProject.revision)throw Error('Reviewed revision does not match snapshot');
 if(!snapshotSha256||snapshotSha256!==(map.reviewedSnapshotSha256??map.snapshotSha256))throw Error('Reviewed snapshot hash mismatch');
 const source=byId(reviewedProject),current=byId(currentProject),hashes={},changes=[];
 const attribution=approvedAttributions??map.reuse?.approvedAttributions,approvedSources=attribution?.sources??{},attributionMatches={};
 if(attribution){if(attribution.approvedBy!=='James'||!String(attribution.reason??'').trim()||!Object.keys(approvedSources).length)throw Error('Attribution exception needs named James approval, reason and exact source whitelist');for(const [id,value] of Object.entries(approvedSources)){if(!source.has(id)||!current.has(id))throw Error('Approved attribution block missing '+id);if(!value||typeof value!=='object'||Array.isArray(value)||!Object.keys(value).length||Object.keys(value).some(k=>!['provider','paper','year','label','origin'].includes(k)||!['string','number'].includes(typeof value[k])))throw Error('Attribution whitelist contains unsupported fields: '+id);if(JSON.stringify(canonical(current.get(id).source))!==JSON.stringify(canonical(value)))throw Error('Current source differs from approved attribution: '+id);}}
 const teaching=project=>(project.sections??[]).filter(s=>s.phase==='teaching').flatMap(s=>(s.blocks??[]).map(b=>b.id));
 const reviewedTeaching=teaching(reviewedProject);
 if(JSON.stringify(reviewedTeaching)!==JSON.stringify(teaching(currentProject)))throw Error('Reviewed teaching context order changed');
 const teachingContextHashes={};for(const id of reviewedTeaching){const expected=archetypeSourceHash(source.get(id));if(expected!==archetypeSourceHash(current.get(id)))throw Error('Reviewed teaching context changed: '+id);teachingContextHashes[id]=expected;}
 if(!map.questions||!Object.keys(map.questions).length)throw Error('Map contains no reviewed questions');
 for(const [id,row] of Object.entries(map.questions)){
  if(!source.has(id)||!current.has(id))throw Error('Reviewed block missing: '+id);
  const expected=archetypeSourceHash(source.get(id)),actual=archetypeSourceHash(current.get(id));
  if(expected!==actual){
   if(!Object.hasOwn(approvedSources,id))throw Error('Reviewed block changed: '+id);
   const previous=structuredClone(source.get(id)),target=structuredClone(current.get(id));delete previous.source;delete target.source;
   if(archetypeSourceHash(previous)!==archetypeSourceHash(target))throw Error('Approved attribution also changes mathematics or other metadata: '+id);
   attributionMatches[id]={reviewedSource:source.get(id).source??null,currentSource:current.get(id).source,targetSourceHash:actual};
  }
  if(!row.archetype||!row.practiceItems?.length)throw Error('Missing reviewed archetype/items: '+id);
  const topic=map.topics.find(t=>t.topicId===row.topicId),cluster=topic?.clusters.find(c=>c.id===row.archetype);
  if(!cluster)throw Error('Missing reviewed cluster: '+id);
  validatePracticeItems(source.get(id),row.practiceItems,{responseAnchors});
  validatePracticeItems(current.get(id),row.practiceItems,{responseAnchors});
  hashes[id]=expected;
  const review={reviewedRevision,snapshotSha256,mapFile:mapFile??null,sourceHash:expected,...(attributionMatches[id]?{approvedAttributionReuse:attributionMatches[id]}:{}),model:'gpt-6.1-sol',effort:'low',coverage:cluster.coverage,practiceItems:structuredClone(row.practiceItems),reviewStatus:cluster.coverage==='prior-knowledge'?'pending-James-opening-review-decision':map.status};
  changes.push({blockId:id,expectedSourceHash:actual,classification:{archetype:row.archetype,archetypeReview:review}});
 }
 const candidate=structuredClone(currentProject),candidateBlocks=byId(candidate);
 for(const change of changes){const block=candidateBlocks.get(change.blockId);block.classification={...block.classification,...change.classification};}
 const reboundMap={...structuredClone(map),revision:currentProject.revision,reviewedRevision,reviewedSnapshotSha256:snapshotSha256,reuse:{kind:'per-reviewed-block-content-match',fromReviewedRevision:reviewedRevision,targetRevision:currentProject.revision,sourceHashAlgorithm:'sha256-canonical-entire-block-excluding-classification.archetype-and-archetypeReview',sourceHashes:hashes,teachingContextHashes,...(attribution?{approvedAttributions:structuredClone(attribution),attributionMatches}:{}),reviewAcceptance:'unchanged; no acceptance inferred'}};
 const patch={version:1,kind:'routine-archetype-metadata-only',projectId:currentProject.id,expectedRevision:currentProject.revision,reviewedRevision,snapshotSha256,changes};
 return {candidate,map:reboundMap,patch};
}
export function main(args=process.argv.slice(2)){
 const options={};for(let i=0;i<args.length;i+=2){if(!['--snapshot','--project-file','--map','--out','--approved-attributions'].includes(args[i])||!args[i+1])throw Error('Use --snapshot FILE --project-file FILE --map FILE --out DIR');options[args[i]]=args[i+1];}
 for(const name of ['--snapshot','--project-file','--map','--out'])if(!options[name])throw Error('Missing '+name);
 const read=file=>JSON.parse(fs.readFileSync(file,'utf8').replace(/^\uFEFF/,'')),snapshotBytes=fs.readFileSync(options['--snapshot']);
 const result=reuseArchetypeMap({reviewedProject:JSON.parse(snapshotBytes),currentProject:read(options['--project-file']),map:read(options['--map']),snapshotSha256:sha(snapshotBytes),mapFile:options['--map'],...(options['--approved-attributions']?{approvedAttributions:read(options['--approved-attributions'])}:{})});
 fs.mkdirSync(options['--out'],{recursive:true});for(const [name,value] of Object.entries(result))fs.writeFileSync(path.join(options['--out'],name+'.json'),JSON.stringify(value,null,2)+'\n');
 console.log(JSON.stringify({expectedRevision:result.patch.expectedRevision,reviewedRevision:result.patch.reviewedRevision,blocks:result.patch.changes.length,out:options['--out'],published:false}));
 return result;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))try{main();}catch(error){console.error(error.message);process.exitCode=1;}
