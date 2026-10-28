// Read-only calibration: no live save or generation is permitted by this entry point.
import fs from 'node:fs';
import {pathToFileURL} from 'node:url';
import {isPractice} from '../src/lib/booklet-flow.js';
export function challengeSplitReport(project,{archetypes={},maxStep=10,minimum=3,routineCeiling=64,targetOverrides={}}={}){
 if(archetypes.projectId&&archetypes.projectId!==project.id)throw Error('Archetype map belongs to another project');
 if(archetypes.revision!==undefined&&archetypes.revision!==project.revision)throw Error('Archetype map revision is stale');
 const sections=(project.sections??[]).filter(s=>s.phase==='practice'&&!['challenge','exam','mixed-review','candidate-pool'].includes(s.role));
 const entries=sections.flatMap(s=>(s.blocks??[]).map(b=>({b,s}))),byId=new Map(entries.map(e=>[e.b.id,e]));
 for(const {b} of entries){const items=archetypes.questions?.[b.id]?.practiceItems;if(items===undefined)continue;
  const ids=new Set(),ancestors=new Map();const visit=(n,parents=[])=>{if(n?.id){ids.add(n.id);ancestors.set(n.id,parents);}for(const c of n?.children??[])visit(c,[...parents,n.id]);};visit(b.content);
  const seen=new Set();if(!Array.isArray(items)||!items.length)throw Error('Invalid practice items for '+b.id);
  for(const item of items){if(!Array.isArray(item.nodeIds)||!item.nodeIds.length)throw Error('Practice item needs nodeIds: '+b.id);for(const id of item.nodeIds){if(!ids.has(id)||seen.has(id)||[...seen].some(other=>ancestors.get(id)?.includes(other)||ancestors.get(other)?.includes(id)))throw Error('Invalid or reused practice node '+id);seen.add(id);}}
 }
 const multipart=b=>{let responses=0;const walk=n=>{if(n?.type==='part')responses++;for(const c of n?.children??[])walk(c);};walk(b.content);return responses>1;};
 const parent=new Map(entries.map(e=>[e.b.id,e.b.id]));
 const root=id=>{while(parent.get(id)!==id)id=parent.get(id);return id;};
 for(const {b} of entries)for(const id of b.flow?.dependsOn??[])if(parent.has(id))parent.set(root(b.id),root(id));
 const movedRoots=new Set(entries.filter(({b})=>isPractice(b)&&Number.isFinite(b.classification?.reasoningScore)&&b.classification.reasoningScore>=65).map(({b})=>root(b.id)));
 const moves=entries.filter(({b})=>movedRoots.has(root(b.id))).map(({b,s})=>({id:b.id,from:s.id,topicId:s.topicId,score:b.classification?.reasoningScore,linked:b.classification?.reasoningScore<65}));
 const moved=new Set(moves.map(x=>x.id)),topics=[];
 for(const topicId of new Set(sections.map(s=>s.topicId))){
  const original=entries.filter(e=>e.s.topicId===topicId&&isPractice(e.b));
  const retained=original.filter(e=>!moved.has(e.b.id)).sort((a,b)=>(a.b.classification?.reasoningScore??Infinity)-(b.b.classification?.reasoningScore??Infinity));
  const key=b=>{const a=archetypes.questions?.[b.id]??archetypes[b.id]??b.classification?.archetype??b.archetype;return typeof a==='string'?a:a?.archetype;};
  const missingArchetypes=original.filter(e=>!(e.b.classification?.reasoningScore>=65)&&!key(e.b)).map(e=>e.b.id),missingRatings=original.filter(e=>!Number.isFinite(e.b.classification?.reasoningScore)).map(e=>e.b.id);
  const topicMap=archetypes.topics?.find(t=>t.topicId===topicId);
  const taught=(topicMap?.archetypes??topicMap?.clusters??[]).filter(a=>a.routine!==false&&a.taught!==false&&a.challengeOnly!==true&&a.newOnly!==true&&(['covered','bridge'].includes(a.coverage)||a.taught===true));
  const missingItemReview=original.filter(({b})=>!(b.classification?.reasoningScore>=65)&&multipart(b)&&!archetypes.questions?.[b.id]?.practiceItems).map(({b})=>b.id);
  const assessable=!!topicMap&&!missingArchetypes.length&&!missingRatings.length&&!missingItemReview.length;
  const units=b=>{const assignment=archetypes.questions?.[b.id];return Array.isArray(assignment?.practiceItems)?assignment.practiceItems.length:1;};
  const itemBasis=original.map(({b})=>({id:b.id,basis:archetypes.questions?.[b.id]?.practiceItems?'reviewed-independent-attempts':multipart(b)?'unreviewed-multipart':'whole-question',items:archetypes.questions?.[b.id]?.practiceItems??[{nodeIds:[b.content?.id??b.id]}]}));
  const coverage=taught.map(a=>{const archetype=a.archetype??a.id,sourceCount=original.filter(e=>key(e.b)===archetype).reduce((n,e)=>n+units(e.b),0),count=retained.filter(e=>key(e.b)===archetype).reduce((n,e)=>n+units(e.b),0),override=targetOverrides[topicId]?.[archetype]??a.practiceTarget??minimum,target=Math.max(minimum,sourceCount,override);return {archetype,sourceCount,count,target,gap:assessable?Math.max(0,target-count):null};});
  // A score sort is a proposal only: hold it whenever a retained dependency would be reversed or cross topics.
  const positions=new Map(retained.map((e,i)=>[e.b.id,i]));
  const orderHolds=retained.flatMap(({b})=>(b.flow?.dependsOn??[]).filter(id=>!positions.has(id)||positions.get(id)>=positions.get(b.id)).map(id=>({id:b.id,dependsOn:id,reason:'dependency order requires review'})));
  const gradientGaps=retained.slice(1).flatMap((e,i)=>{const previous=retained[i].b,step=e.b.classification?.reasoningScore-previous.classification?.reasoningScore;return step>maxStep?[{before:previous.id,after:e.b.id,step}]:[];});
  const highest=retained.length?retained.at(-1).b.classification?.reasoningScore:null;
  topics.push({topicId,order:orderHolds.length?null:retained.map(e=>e.b.id),proposedScoreOrder:retained.map(e=>e.b.id),orderHolds,itemBasis,sufficiencyStatus:assessable?'pending-calibration':'unassessable',coverage,missingArchetypes,missingRatings,missingItemReview,gradientGaps,upperRoutineGap:highest===null||!Number.isFinite(highest)?null:Math.max(0,routineCeiling-highest)});
 }
 return {version:1,project:project.id,revision:project.revision,mode:'proposal-only',approvalRequired:['archetype coverage','practice sufficiency including multipart practice units','gradient calibration'],calibration:{challengeThreshold:65,maxStep,minimum,routineCeiling,countUnit:'reviewed-independent-attempts',countLimit:'Single-attempt questions use one unit; multipart questions require explicit reviewed groups. Missing review holds sufficiency; independence does not prove variation.'},moves,topics,unresolvedDependencies:entries.flatMap(({b})=>(b.flow?.dependsOn??[]).filter(id=>!byId.has(id)).map(id=>({id:b.id,dependsOn:id}))),publicationBlocked:true};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){const [file,mapFile]=process.argv.slice(2);if(!file)throw Error('Usage: node polish/challenge-split.mjs PROJECT.json [ARCHETYPES.json]');console.log(JSON.stringify(challengeSplitReport(JSON.parse(fs.readFileSync(file,'utf8')), {archetypes:mapFile?JSON.parse(fs.readFileSync(mapFile,'utf8')):{}}),null,2));}

