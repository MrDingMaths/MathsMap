// Read-only calibration: no live save or generation is permitted by this entry point.
import fs from 'node:fs';
import {pathToFileURL} from 'node:url';
import {isPractice} from '../src/lib/booklet-flow.js';
export function challengeSplitReport(project,{archetypes={},maxStep=10,minimum=3,routineCeiling=64,targetOverrides={}}={}){
 if(archetypes.projectId&&archetypes.projectId!==project.id)throw Error('Archetype map belongs to another project');
 if(archetypes.revision!==undefined&&archetypes.revision!==project.revision)throw Error('Archetype map revision is stale');
 const sections=(project.sections??[]).filter(s=>s.phase==='practice'&&!['challenge','exam','mixed-review','candidate-pool'].includes(s.role));
 const entries=sections.flatMap(s=>(s.blocks??[]).map(b=>({b,s}))),byId=new Map(entries.map(e=>[e.b.id,e]));
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
  const assessable=!!topicMap&&!missingArchetypes.length&&!missingRatings.length;
  const coverage=taught.map(a=>{const archetype=a.archetype??a.id,sourceCount=original.filter(e=>key(e.b)===archetype).length,count=retained.filter(e=>key(e.b)===archetype).length,override=targetOverrides[topicId]?.[archetype]??a.practiceTarget??minimum,target=Math.max(minimum,sourceCount,override);return {archetype,sourceCount,count,target,gap:assessable?Math.max(0,target-count):null};});
  // A score sort is a proposal only: hold it whenever a retained dependency would be reversed or cross topics.
  const positions=new Map(retained.map((e,i)=>[e.b.id,i]));
  const orderHolds=retained.flatMap(({b})=>(b.flow?.dependsOn??[]).filter(id=>!positions.has(id)||positions.get(id)>=positions.get(b.id)).map(id=>({id:b.id,dependsOn:id,reason:'dependency order requires review'})));
  const gradientGaps=retained.slice(1).flatMap((e,i)=>{const previous=retained[i].b,step=e.b.classification?.reasoningScore-previous.classification?.reasoningScore;return step>maxStep?[{before:previous.id,after:e.b.id,step}]:[];});
  const highest=retained.length?retained.at(-1).b.classification?.reasoningScore:null;
  topics.push({topicId,order:orderHolds.length?null:retained.map(e=>e.b.id),proposedScoreOrder:retained.map(e=>e.b.id),orderHolds,sufficiencyStatus:assessable?'pending-calibration':'unassessable',coverage,missingArchetypes,missingRatings,gradientGaps,upperRoutineGap:highest===null||!Number.isFinite(highest)?null:Math.max(0,routineCeiling-highest)});
 }
 return {version:1,project:project.id,revision:project.revision,mode:'proposal-only',approvalRequired:['archetype coverage','practice sufficiency including multipart practice units','gradient calibration'],calibration:{challengeThreshold:65,maxStep,minimum,routineCeiling,countUnit:'question-block',countLimit:'Multipart practice is not independently counted; calibrate content units before treating deficits as backfill requirements.'},moves,topics,unresolvedDependencies:entries.flatMap(({b})=>(b.flow?.dependsOn??[]).filter(id=>!byId.has(id)).map(id=>({id:b.id,dependsOn:id}))),publicationBlocked:true};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){const [file,mapFile]=process.argv.slice(2);if(!file)throw Error('Usage: node polish/challenge-split.mjs PROJECT.json [ARCHETYPES.json]');console.log(JSON.stringify(challengeSplitReport(JSON.parse(fs.readFileSync(file,'utf8')), {archetypes:mapFile?JSON.parse(fs.readFileSync(mapFile,'utf8')):{}}),null,2));}

