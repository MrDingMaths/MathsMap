import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {normaliseQuestion,difficultyBandForScore} from '../../src/lib/practice-question-model.js';
import {sharedQuestion} from '../../src/lib/question-sync.js';
import {reasoningTaskHash,validRawRating} from './reasoning-ratings.mjs';
import {ratingImageReferences} from './rating-images.mjs';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const read=file=>JSON.parse(fs.readFileSync(file,'utf8').replace(/^\uFEFF/,''));
const exists=file=>fs.existsSync(file);

export function studioProjects(root=ROOT,projectId){
 return fs.readdirSync(path.join(root,'booklets/projects')).filter(f=>f.endsWith('.json')).map(f=>({file:path.join(root,'booklets/projects',f),project:read(path.join(root,'booklets/projects',f))})).filter(({project})=>!projectId||project.id===projectId);
}
export function canonicalRun(project,root){
 const id=project.runId??project.source?.runId;
 if(id&&/^[\w.-]+$/.test(id)&&exists(path.join(root,'.booklet-work/full-imports',id)))return path.join(root,'.booklet-work/full-imports',id);
 return path.join(root,'.booklet-work/reasoning-ratings',project.id);
}
export function supplementalRatingEvidence(block,evidence){
 const task=JSON.stringify(block.content);return (evidence?.sources??[]).filter(source=>typeof source.url==='string'&&task.includes(source.url));
}
function inputQuestion({block,section,projectTitle,topicTitle,supplementalEvidence}){
 const before=(section.blocks??[]).slice(0,(section.blocks??[]).findIndex(b=>b.id===block.id));
 const instructions=before.filter(b=>['heading','rich-text','narrative'].includes(b.type)).map(b=>({title:b.title,content:b.content??b.text}));
 return {id:block.id,taskHash:reasoningTaskHash(block),booklet:projectTitle,topic:topicTitle,section:section.title,instructions,teachingContext:block.sourceReview?.teachingContext??null,...(supplementalEvidence?.length?{supplementalEvidence}:{}),task:sharedQuestion({...normaliseQuestion(block),title:''}).content};
}
export function ratingBatches(rows,{characters=100000,questions=60,images=8}={}){
 const batches=[];let batch=[],size=0,imageRefs=new Set();
 for(const row of rows){const input=inputQuestion(row),length=JSON.stringify(input).length;
  const refs=ratingImageReferences(input.task);
  if(batch.length&&(size+length>characters||batch.length>=questions||new Set([...imageRefs,...refs]).size>images)){batches.push(batch);batch=[];size=0;imageRefs=new Set();}
  batch.push({...row,input});size+=length;for(const ref of refs)imageRefs.add(ref);
 }
 if(batch.length)batches.push(batch);return batches;
}
export function validateRatingReply(result,rows){
 if(!Array.isArray(result?.ratings)||result.ratings.length!==rows.length)throw Error('Return exactly one reasoning rating or blocker per requested question');
 const seen=new Set(),byId=new Map(rows.map(row=>[row.block.id,row]));
 for(const rating of result.ratings){
  const row=byId.get(rating.id);
  if(!row||seen.has(rating.id)||rating.taskHash!==undefined&&rating.taskHash!==row.input.taskHash)throw Error('Mismatched or duplicate assessment identity');
  seen.add(rating.id);
  if(rating.blocker){if(typeof rating.blocker!=='string'||!rating.blocker.trim())throw Error('Invalid blocker');continue;}
  if(!validRawRating({...rating,difficulty:difficultyBandForScore(rating.reasoningScore)}))throw Error('Invalid individual reasoning assessment: '+rating.id);
 }
 return result.ratings;
}
