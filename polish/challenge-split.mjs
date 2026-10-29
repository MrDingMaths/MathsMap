import {validatePracticeItems} from '../pedagogy/practice-item-targets.mjs';
// Read-only calibration: no live save or generation is permitted by this entry point.
import fs from 'node:fs';
import {pathToFileURL} from 'node:url';
import {isPractice} from '../src/lib/booklet-flow.js';
import {teacherBlocks,nodesOf} from './guards.mjs';
import {endSectionRole} from './end-section-role.mjs';
const rawLinks=b=>nodesOf(b).flatMap(n=>[...(n.dependsOn??[]),...(n.flow?.dependsOn??[]),n.continuationOf,n.flow?.continuationOf,n.pairedBlockId].filter(Boolean));
const ownersOf=entries=>new Map(entries.flatMap(({b})=>nodesOf(b).map(n=>[n.id,b.id])));
const blockLinks=(b,owners)=>[...new Set(rawLinks(b).map(id=>owners.get(id)??id).filter(id=>id!==b.id))];
export function challengeSplitReport(project,{archetypes={},maxStep=10,minimum=3,routineCeiling=64,targetOverrides={},responseAnchors}={}){
 if(archetypes.projectId&&archetypes.projectId!==project.id)throw Error('Archetype map belongs to another project');
 if(archetypes.revision!==undefined&&archetypes.revision!==project.revision)throw Error('Archetype map revision is stale');
 const sections=(project.sections??[]).filter(s=>s.phase==='practice'&&!['challenge','exam','mixed-review','candidate-pool'].includes(endSectionRole(s,project)));
 const entries=sections.flatMap(s=>(s.blocks??[]).map(b=>({b,s}))),byId=new Map(entries.map(e=>[e.b.id,e]));
 const responseAnchorHolds=[];
 for(const {b} of entries){const items=archetypes.questions?.[b.id]?.practiceItems;if(items===undefined)continue;
  try{validatePracticeItems(b,items,{responseAnchors});}catch(error){if(!items.some(item=>Object.hasOwn(item??{},'responseAnchor')))throw error;responseAnchorHolds.push({id:b.id,reason:error.message});}
 }
 const multipart=b=>{let responses=0;const walk=n=>{if(n?.type==='part')responses++;for(const c of n?.children??[])walk(c);};walk(b.content);return responses>1;};
 const moveSections=(project.sections??[]).filter(s=>s.phase==='practice'&&!['challenge','candidate-pool'].includes(endSectionRole(s,project)));
 const moveEntries=moveSections.flatMap(s=>(s.blocks??[]).map(b=>({b,s}))),moveById=new Map(moveEntries.map(e=>[e.b.id,e]));
 const external=b=>b.source?.origin==='MathsBase'||b.sourceReview?.origin?.provider==='MathsBase';
 const owned=b=>!external(b)&&(b.source?.origin==='booklet'||project.id&&b.sourceReview?.origin?.projectId===project.id||b.sourceReview?.origin?.artifact?.path&&b.sourceReview?.origin?.blockId===b.id);
 const endSection=s=>['exam','mixed-review'].includes(endSectionRole(s,project));
 const scopeHolds=moveEntries.filter(({b})=>isPractice(b)&&b.classification?.reasoningScore>=65&&external(b)).map(({b,s})=>({kind:'external-source-eligibility',id:b.id,sectionId:s.id,reason:'External MathsBase additions must remain routine; never use as automatic Challenge fill'}));
 const moveOwners=ownersOf(moveEntries),protectedMoves=teacherBlocks(project);
 const parent=new Map(moveEntries.map(e=>[e.b.id,e.b.id]));
 const root=id=>{while(parent.get(id)!==id)id=parent.get(id);return id;};
 for(const {b} of moveEntries)for(const id of blockLinks(b,moveOwners))if(parent.has(id))parent.set(root(b.id),root(id));
 for(const s of moveSections)for(let i=0;i<s.blocks.length-1;i++)if(s.blocks[i].flow?.keepWithNext)parent.set(root(s.blocks[i].id),root(s.blocks[i+1].id));
 const proposedRoots=new Set(moveEntries.filter(({b,s})=>isPractice(b)&&Number.isFinite(b.classification?.reasoningScore)&&b.classification.reasoningScore>=65&&!external(b)&&(!endSection(s)||owned(b))).map(({b})=>root(b.id))),movedRoots=new Set();
 for(const key of proposedRoots){const unit=moveEntries.filter(({b})=>root(b.id)===key),uncertain=unit.filter(({b,s})=>external(b)||endSection(s)&&!owned(b)||blockLinks(b,moveOwners).some(id=>!moveById.has(id)));const sourceSections=new Set(unit.map(e=>e.s.id)),sectionPositions=unit.map(e=>project.sections.findIndex(s=>s.id===e.s.id)),crossesTeaching=project.sections.slice(Math.min(...sectionPositions),Math.max(...sectionPositions)+1).some(s=>s.phase!=='practice'||(s.blocks??[]).some(b=>!isPractice(b))),emptied=[...sourceSections].some(id=>{const section=moveSections.find(s=>s.id===id);return !endSection(section)&&section.blocks.every(b=>unit.some(e=>e.b.id===b.id));}),protectedMeaning=unit.some(({b})=>protectedMoves.has(b.id)||!isPractice(b)),continuationMixed=unit.some(({b})=>nodesOf(b).some(n=>n.continuationOf||n.flow?.continuationOf))&&unit.some(({b})=>b.classification?.reasoningScore<65)&&!unit.every(({b})=>archetypes.questions?.[b.id]?.continuationUnitReviewed===true);if(uncertain.length||emptied||protectedMeaning||continuationMixed||crossesTeaching){scopeHolds.push({kind:'uncertain-owned-move-unit',ids:unit.map(e=>e.b.id),reason:crossesTeaching?'Linked unit crosses teaching or meaningful instructional content':continuationMixed?'Semantic-unit review required: mixed-score continuation/shared-stem independence not established':emptied?'Whole linked unit would remove an existing exercise boundary':protectedMeaning?'Linked unit contains protected or instructional content':'External, uncertain ownership or unresolved dependency in linked unit'});}else movedRoots.add(key);}
 for(const {b,s} of moveEntries)if(endSection(s)&&isPractice(b)&&b.classification?.reasoningScore>=65&&!external(b)&&!owned(b))scopeHolds.push({kind:'uncertain-owned-end-question',id:b.id,sectionId:s.id});
 const moves=moveEntries.filter(({b})=>movedRoots.has(root(b.id))).map(({b,s})=>({id:b.id,from:s.id,topicId:s.topicId,score:b.classification?.reasoningScore,linked:b.classification?.reasoningScore<65,fromEndSection:endSection(s)}));
 const highOwnedExamRemaining=moveEntries.filter(({b,s})=>endSection(s)&&owned(b)&&isPractice(b)&&b.classification?.reasoningScore>=65&&!moves.some(m=>m.id===b.id)).map(({b,s})=>({id:b.id,sectionId:s.id,score:b.classification.reasoningScore})); const moved=new Set(moves.map(x=>x.id)),topics=[];
 for(const topicId of new Set(sections.map(s=>s.topicId))){
  const original=entries.filter(e=>e.s.topicId===topicId&&isPractice(e.b));
  const retained=original.filter(e=>!moved.has(e.b.id)).sort((a,b)=>(a.b.classification?.reasoningScore??Infinity)-(b.b.classification?.reasoningScore??Infinity));
  const key=b=>{const a=archetypes.questions?.[b.id]??archetypes[b.id]??b.classification?.archetype??b.archetype;return typeof a==='string'?a:a?.archetype;};
  const missingArchetypes=original.filter(e=>!(e.b.classification?.reasoningScore>=65)&&!key(e.b)).map(e=>e.b.id),missingRatings=original.filter(e=>!Number.isFinite(e.b.classification?.reasoningScore)).map(e=>e.b.id);
  const topicMap=archetypes.topics?.find(t=>t.topicId===topicId);
  const taught=(topicMap?.archetypes??topicMap?.clusters??[]).filter(a=>a.routine!==false&&a.taught!==false&&a.challengeOnly!==true&&a.newOnly!==true&&(['covered','bridge','prior-knowledge'].includes(a.coverage)||a.taught===true));
  const missingItemReview=original.filter(({b})=>!(b.classification?.reasoningScore>=65)&&multipart(b)&&!archetypes.questions?.[b.id]?.practiceItems).map(({b})=>b.id);
  const clusterIds=new Set((topicMap?.archetypes??topicMap?.clusters??[]).map(c=>c.archetype??c.id));
  const itemsOf=b=>(archetypes.questions?.[b.id]?.practiceItems??[{nodeIds:[b.content?.id??b.id]}]).map(item=>({...item,archetype:Object.hasOwn(item,'archetype')?item.archetype:key(b)}));
  const invalidItemArchetypes=original.flatMap(({b})=>(archetypes.questions?.[b.id]?.practiceItems??[]).filter(item=>Object.hasOwn(item,'archetype')&&(typeof item.archetype!=='string'||!item.archetype.trim()||!clusterIds.has(item.archetype))).map(item=>({id:b.id,nodeIds:item.nodeIds,archetype:item.archetype,reason:'Explicit item archetype must name an existing cluster in the same topic'})));
  const topicResponseAnchorHolds=responseAnchorHolds.filter(hold=>original.some(({b})=>b.id===hold.id));
  const assessable=!topicResponseAnchorHolds.length&&!!topicMap&&!missingArchetypes.length&&!missingRatings.length&&!missingItemReview.length&&!invalidItemArchetypes.length;
  const countItems=(rows,archetype)=>rows.reduce((n,{b})=>n+itemsOf(b).filter(item=>item.archetype===archetype).length,0);
  const itemBasis=original.map(({b})=>({id:b.id,basis:archetypes.questions?.[b.id]?.practiceItems?'reviewed-independent-attempts':multipart(b)?'unreviewed-multipart':'whole-question',items:itemsOf(b)}));
  const coverage=taught.map(a=>{
   const archetype=a.archetype??a.id,currentBeforeCount=countItems(original,archetype);
   if(a.originalPracticeCount!==undefined&&(!Number.isSafeInteger(a.originalPracticeCount)||a.originalPracticeCount<0))throw Error('Invalid originalPracticeCount for '+archetype);
   const sourceCount=a.originalPracticeCount??currentBeforeCount,count=countItems(retained,archetype),override=targetOverrides[topicId]?.[archetype]??a.practiceTarget??minimum,target=Math.max(minimum,sourceCount,override);
   return {archetype,sourceCount,currentBeforeCount,sourceCountBasis:a.originalPracticeCount===undefined?'current-project-provisional':'reviewed-original-baseline',count,target,gap:assessable?Math.max(0,target-count):null};
  });
  // A score sort is a proposal only: hold it whenever a retained dependency would be reversed or cross topics.
  const positions=new Map(retained.map((e,i)=>[e.b.id,i]));
  const orderHolds=retained.flatMap(({b})=>(b.flow?.dependsOn??[]).filter(id=>!positions.has(id)||positions.get(id)>=positions.get(b.id)).map(id=>({id:b.id,dependsOn:id,reason:'dependency order requires review'})));
  const gradientGaps=retained.slice(1).flatMap((e,i)=>{const previous=retained[i].b,step=e.b.classification?.reasoningScore-previous.classification?.reasoningScore;return step>maxStep?[{before:previous.id,after:e.b.id,step}]:[];});
  const originalRoutineScores=original.map(e=>e.b.classification?.reasoningScore).filter(score=>Number.isFinite(score)&&score<65);
  const upperRoutineTarget=topicMap?.routineUpperScore??(originalRoutineScores.length?Math.max(...originalRoutineScores):null);
  if(upperRoutineTarget!==null&&(!Number.isFinite(upperRoutineTarget)||upperRoutineTarget<0||upperRoutineTarget>=65))throw Error('Routine upper target must be below65');
  const highest=retained.length?Math.max(...retained.map(e=>e.b.classification?.reasoningScore).filter(Number.isFinite)):null;
  topics.push({topicId,order:orderHolds.length?null:retained.map(e=>e.b.id),proposedScoreOrder:retained.map(e=>e.b.id),orderHolds,itemBasis,sufficiencyStatus:assessable?'pending-calibration':'unassessable',coverage,missingArchetypes,missingRatings,missingItemReview,invalidItemArchetypes,responseAnchorHolds:topicResponseAnchorHolds,gradientGaps,upperRoutineTarget,upperRoutineTargetBasis:topicMap?.routineUpperScore===undefined?'original-routine-exercise-demand':'reviewed-original-demand',upperRoutineGap:upperRoutineTarget===null||highest===null||!Number.isFinite(highest)?null:Math.max(0,upperRoutineTarget-highest)});
 }
 return {version:1,project:project.id,revision:project.revision,mode:'proposal-only',approvalRequired:['archetype coverage','practice sufficiency including multipart practice units','gradient calibration'],calibration:{challengeThreshold:65,maxStep,minimum,routineCeiling,upperDemandRule:'Below65 is a ceiling; retain appropriate original/taught demand, never target64 universally',countUnit:'reviewed-independent-attempts',countLimit:'Single-attempt questions use one unit; multipart questions require explicit reviewed groups. Missing review holds sufficiency; independence does not prove variation.'},moves,scopeHolds,highOwnedExamRemaining,topics,unresolvedDependencies:entries.flatMap(({b})=>(b.flow?.dependsOn??[]).filter(id=>!byId.has(id)).map(id=>({id:b.id,dependsOn:id}))),publicationBlocked:true};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){const [file,mapFile]=process.argv.slice(2);if(!file)throw Error('Usage: node polish/challenge-split.mjs PROJECT.json [ARCHETYPES.json]');console.log(JSON.stringify(challengeSplitReport(JSON.parse(fs.readFileSync(file,'utf8')), {archetypes:mapFile?JSON.parse(fs.readFileSync(mapFile,'utf8')):{}}),null,2));}


// Candidate-only transformation. Publication remains blocked until coverage/backfill and render gates pass.
export function challengeSplitCandidate(project,{archetypes,approvedCalibration=false,...options}={}){
 if(!approvedCalibration)throw Error('Challenge split requires approved calibration');
 const report=challengeSplitReport(project,{archetypes,...options}),candidate=structuredClone(project),moved=new Set(report.moves.map(m=>m.id));
 if(report.topics.some(topic=>topic.responseAnchorHolds.length))throw Error('Unverified response anchors hold candidate transformation');
 const semanticHeldIds=new Set(report.scopeHolds.filter(h=>h.reason?.startsWith('Semantic-unit review')).flatMap(h=>h.ids??[]));
 const challengeBlocks=[],candidateOwners=ownersOf(project.sections.flatMap(s=>s.blocks.map(b=>({b,s}))));
 for(const section of candidate.sections){
  if(section.phase!=='practice'||['challenge','candidate-pool'].includes(endSectionRole(section,project)))continue;
  challengeBlocks.push(...section.blocks.filter(b=>moved.has(b.id)));
  section.blocks=section.blocks.filter(b=>!moved.has(b.id));
 }
 // Only uninterrupted routine runs may pack across source sections. Instructional blocks,
 // teaching checkpoints, dependencies and explicit layout/break decisions bound each run.
 report.packOrders=[];
 const protectedForOrder=new Set([...teacherBlocks(project),...semanticHeldIds]),eligible=s=>s.phase==='practice'&&!['challenge','exam','mixed-review','candidate-pool'].includes(endSectionRole(s,project));
 const safeBlock=b=>isPractice(b)&&!protectedForOrder.has(b.id)&&!b.flow?.keepWithNext&&!b.pairedBlockId&&!b.flow?.pageBreakBefore&&!b.flow?.exercisePageBreakBefore;
 for(let index=0;index<candidate.sections.length;index++){
  const first=candidate.sections[index],topic=report.topics.find(t=>t.topicId===first.topicId);if(!eligible(first)||!topic)continue;
  const run=[first];let end=index;
  while(end+1<candidate.sections.length){const next=candidate.sections[end+1];if(!eligible(next)||next.topicId!==first.topicId||!run.at(-1).blocks.every(safeBlock)||!next.blocks.every(safeBlock)||next.pageBreakBefore||next.flow?.pageBreakBefore)break;run.push(next);end++;}
  const all=run.flatMap(s=>s.blocks);
  // Meaningful non-question instructions remain in place and prevent reordering across them.
  let start=0;while(start<all.length){if(!safeBlock(all[start])){start++;continue;}let stop=start+1;while(stop<all.length&&safeBlock(all[stop]))stop++;const segment=all.slice(start,stop),parents=new Map(segment.map(b=>[b.id,b.id])),find=id=>{while(parents.get(id)!==id)id=parents.get(id);return id;};
   const outside=segment.some(b=>blockLinks(b,candidateOwners).some(id=>!parents.has(id)));
   for(const b of segment)for(const id of blockLinks(b,candidateOwners))if(parents.has(id))parents.set(find(b.id),find(id));
   const groups=new Map();for(const b of segment){const key=find(b.id);if(!groups.has(key))groups.set(key,[]);groups.get(key).push(b);}
   const groupList=[...groups.values()],score=g=>Math.max(...g.map(b=>b.classification?.reasoningScore??Infinity));
   const sorted=outside?segment:groupList.sort((a,b)=>score(a)-score(b)).flat();all.splice(start,stop-start,...sorted);start=stop;}
  report.packOrders.push(all.filter(isPractice).map(b=>b.id));
  let cursor=0;for(const section of run){const count=section.blocks.length;section.blocks=all.slice(cursor,cursor+count);cursor+=count;}index=end;
 }
 const challengeSections=candidate.sections.filter(s=>endSectionRole(s,candidate)==='challenge');
 if(challengeBlocks.length||challengeSections.length){let section=challengeSections[0];if(!section){section={id:project.id+'-challenge',title:'Challenge',role:'challenge',phase:'practice',topicId:project.id+'-challenge',workingSpace:'none',blocks:[]};candidate.sections.push(section);}section.role='challenge';section.workingSpace='none';section.blocks.push(...challengeSections.slice(1).flatMap(s=>s.blocks),...challengeBlocks);candidate.topics??=[];if(!candidate.topics.some(t=>t.id===section.topicId))candidate.topics.push({id:section.topicId,title:'Challenge'});candidate.sections=candidate.sections.filter(s=>!challengeSections.includes(s)&&s!==section).concat(section);}
 for(const topic of report.topics){
  const actual=candidate.sections.filter(s=>eligible(s)&&s.topicId===topic.topicId).flatMap(s=>s.blocks).filter(isPractice);
  topic.actualOrder=actual.map(b=>b.id);topic.order=topic.actualOrder;
  topic.rejectedProposalOrderHolds=topic.orderHolds;
  const actualPositions=new Map(actual.map((b,i)=>[b.id,i]));
  topic.orderHolds=actual.flatMap(b=>blockLinks(b,candidateOwners).filter(id=>!actualPositions.has(id)||actualPositions.get(id)>=actualPositions.get(b.id)).map(id=>({id:b.id,dependsOn:id,reason:'actual dependency order violation'})));
  const groupParent=new Map(actual.map(b=>[b.id,b.id]));
  const groupRoot=id=>{while(groupParent.get(id)!==id)id=groupParent.get(id);return id;};
  for(const b of actual)for(const id of blockLinks(b,candidateOwners))if(groupParent.has(id))groupParent.set(groupRoot(b.id),groupRoot(id));
  const unitMap=new Map();for(const b of actual){const key=groupRoot(b.id);if(!unitMap.has(key))unitMap.set(key,[]);unitMap.get(key).push(b);}
  topic.gradientUnits=[...unitMap.values()].map(members=>({ids:members.map(b=>b.id),score:Math.max(...members.map(b=>b.classification?.reasoningScore??NaN)),scoreBasis:'max-member-rating; original ratings unchanged'}));
  topic.gradientGaps=topic.gradientUnits.slice(1).flatMap((unit,i)=>{const before=topic.gradientUnits[i],step=unit.score-before.score;return Math.abs(step)>report.calibration.maxStep?[{before:before.ids.at(-1),after:unit.ids[0],beforeUnit:before.ids,afterUnit:unit.ids,step}]:[];});  topic.orderDiffersFromProposal=JSON.stringify(topic.actualOrder)!==JSON.stringify(topic.proposedScoreOrder);
 }
 // Request whole practice blocks through the shared paginator; oversized blocks must be reported by its render gate.
 report.splitHolds=[];const protectedIds=teacherBlocks(project);
 for(const section of candidate.sections)for(const b of section.blocks??[])if(isPractice(b)){
  if(b.flow?.keepTogether===false||protectedIds.has(b.id)||semanticHeldIds.has(b.id)){report.splitHolds.push({id:b.id,reason:'explicit/protected user layout preserved'});continue;}
  b.flow={...b.flow,keepTogether:true};
 }
 report.paginationRequired={optimiser:'paginate/optimise.mjs',apply:true,named:true,checks:['no practice fragments','no added pages','no oversized blocks','forced exercise breaks retained'],status:'pending-render'};
 report.candidateOnly=true;report.publicationHolds=[...report.scopeHolds,...report.highOwnedExamRemaining.map(h=>({kind:'high-owned-end-question-remaining',...h})),
 ...report.topics.flatMap(t=>[
  ...(t.sufficiencyStatus==='unassessable'?[{kind:'unassessable-sufficiency',topicId:t.topicId}]:[]),
  ...t.coverage.filter(c=>c.gap>0).map(c=>({kind:'practice-deficit',topicId:t.topicId,archetype:c.archetype,gap:c.gap})),
  ...t.gradientGaps.map(g=>({kind:'gradient-gap',topicId:t.topicId,...g})),
  ...(t.upperRoutineGap===null||t.upperRoutineGap>report.calibration.maxStep?[{kind:'upper-routine-gap',topicId:t.topicId,gap:t.upperRoutineGap}]:[]),
  ...t.orderHolds.map(h=>({kind:'dependency-order',topicId:t.topicId,...h}))]),
 ...report.unresolvedDependencies.map(d=>({kind:'unresolved-dependency',...d})),
 ...report.splitHolds.map(h=>({kind:'protected-split-layout',...h})),
 {kind:'pagination-verification-pending'}];
 report.backfillBlocked=report.publicationHolds.some(h=>['unassessable-sufficiency','practice-deficit','gradient-gap','upper-routine-gap'].includes(h.kind));
 return {project:candidate,report};
}
