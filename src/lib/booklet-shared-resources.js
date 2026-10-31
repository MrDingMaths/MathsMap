// Explicit opt-in only. The coordinator supplies SHA-256 and a current semantic review.
// No renderer/load path infers a resource relationship.
const viewState=new WeakMap();
const serial=value=>JSON.stringify(value);
const visibilityOf=n=>[n.hidden,n.visible,n.excluded,n.excludeFromStudent,n.studentVisible,n.editions,n.edition,n.visibility,n.presentation?.editorOnly];
const sectionBindingOf=s=>serial([s.phase,s.mode,['candidate-pool','answers'].includes(s.role)?s.role:null,...visibilityOf(s)]);
const bindingOf=b=>serial([b.id,b.type,b.content,b.dependsOn,b.flow?.dependsOn,b.flow?.sharedResourceEdges,b.pairedBlockId,b.continuationOf,b.flow?.continuationOf,b.flow?.keepWithNext,b.flow?.studentRowGroup,b.flow?.sectionId,b.flow?.continueBefore,b.flow?.pageBreakBefore,b.flow?.sourcePageBreakBefore===true,b.flow?.exerciseHeadingBefore,b.sourceAtom,b.pedagogyRole,b.variant,b.presentation?.studentRole,b.sourceReview?.responses?.map(r=>[r.targetId,r.kind]),b.teachingRole,...visibilityOf(b)]);
const refs=v=>Array.isArray(v)?v:[];
const hidden=n=>n&&(n.hidden===true||n.visible===false||n.excluded===true||n.excludeFromStudent===true||n.studentVisible===false||n.presentation?.editorOnly===true||n.editions||n.edition||n.visibility);
function nativeTables(block){const out=[];function visit(n){if(!n||hidden(n))return;const p=n.prompt;if(p?.format==='maths-editor-document-v1'&&Array.isArray(p.blocks)&&!hidden(p))for(const t of p.blocks)if(t?.type==='table'&&!hidden(t))out.push(t);for(const c of n.children??[])visit(c);}visit(block.content);return out;}
// Mechanical requirements only: annotations are not semantic acceptance.
export function sharedResourceRequirements(project,{hash}={}){
 const tableHash=value=>{const result=hash?.(value);if(!/^[a-f0-9]{64}$/.test(result??''))throw Error('SHA-256 provider required');return result;};
 const entries=(project.sections??[]).flatMap(s=>(s.blocks??[]).map(b=>({b,s}))),by=new Map(),ids=new Set();
 // Fail closed on owner/descendant ambiguity only when this opt-in is used.
 for(const {b}of entries)annotationShape(b,project.id);
 for(const {b}of entries)if(b.flow&&Object.hasOwn(b.flow,'sharedResourceEdges')&&!Array.isArray(b.flow.sharedResourceEdges))throw Error('Invalid explicitly present annotation format'); const active=entries.some(({b})=>b.flow&&Object.hasOwn(b.flow,'sharedResourceEdges')); const relevant=new Set(entries.flatMap(({b})=>(b.flow?.sharedResourceEdges??[]).flatMap(e=>[e?.targetOwnerId,e?.tableId,b.id]))); let identifyingOwner;
 function identify(v){if(!v||typeof v!=='object')return;if(typeof v.id==='string'&&relevant.has(v.id)){if(ids.has(v.id)&&!(v===identifyingOwner.content&&v.id===identifyingOwner.id))throw Error('Ambiguous owner or descendant ID');ids.add(v.id);}for(const[k,x]of Object.entries(v))if(!['classification','flow','sourceReview','sourceRefs','sourceLayoutEvidence','bankRef'].includes(k)&&x&&typeof x==='object')Array.isArray(x)?x.forEach(identify):identify(x);}
 entries.forEach(({b,s},i)=>{if(by.has(b.id))throw Error('Ambiguous owner');by.set(b.id,{b,s,i});if(active){identifyingOwner=b;identify(b);}});
 const access=[],hard=[];
 for(const {b:consumer,s:consumerSection}of entries){const annotations=consumer.flow?.sharedResourceEdges??[];if(!Array.isArray(annotations))throw Error('Invalid annotation format');const seen=new Set();
  if(annotations.length&&(hidden(consumerSection)||hidden(consumer)||!['practice','teaching'].includes(consumerSection.phase)||['candidate-pool','answers'].includes(consumerSection.role)))throw Error('Hidden or unsupported resource consumer');
  for(const edge of annotations){const keys=['kind','projectId','targetOwnerId','tableId','tableSha256','relationship'];if(!edge||Object.keys(edge).some(k=>!keys.includes(k))||keys.some(k=>!Object.hasOwn(edge,k))||edge.kind!=='native-table-access-v1'||edge.relationship!=='resource-access-only'||typeof project.id!=='string'||!project.id||edge.projectId!==project.id||typeof edge.targetOwnerId!=='string'||!refs(consumer.flow?.dependsOn).includes(edge.targetOwnerId)||seen.has(edge.targetOwnerId))throw Error('Invalid explicit project-bound resource annotation');
   const target=by.get(edge.targetOwnerId),current=by.get(consumer.id);if(!target||target.i>=current.i)throw Error('Missing or late resource owner');if(hidden(target.s)||hidden(target.b)||!['practice','teaching'].includes(target.s.phase)||target.s.role==='candidate-pool'||target.s.role==='answers')throw Error('Excluded or unsupported resource source');
   const matches=nativeTables(target.b).filter(t=>t.id===edge.tableId);if(matches.length!==1||typeof edge.tableId!=='string'||!edge.tableId||!/^[a-f0-9]{64}$/.test(edge.tableSha256??'')||tableHash(matches[0])!==edge.tableSha256)throw Error('Missing, ambiguous, hidden or changed native prompt table');
   const binding={projectId:project.id,projectHash:tableHash(project),consumerId:consumer.id,consumerContentHash:tableHash(consumer.content),targetOwnerId:target.b.id,targetContentHash:tableHash(target.b.content),tableId:edge.tableId,tableSha256:edge.tableSha256,source:structuredClone(target.b),consumer:structuredClone(consumer),table:structuredClone(matches[0]),visibility:'NOT PROVEN: actual student-edition visibility is a rollout precondition'};
   seen.add(edge.targetOwnerId);access.push(binding);
  }
  function visit(n,isOwner=false){if(!n||typeof n!=='object')return;for(const target of refs(n.dependsOn))hard.push({consumerId:consumer.id,targetId:target,kind:'content-dependency'});for(const target of refs(n.flow?.dependsOn))hard.push({consumerId:consumer.id,targetId:target,kind:'flow-dependency',ownerFlow:isOwner});for(const target of[n.pairedBlockId,n.continuationOf,n.flow?.continuationOf].filter(Boolean))hard.push({consumerId:consumer.id,targetId:target,kind:'paired-or-continuation'});if(n.flow?.keepWithNext)hard.push({consumerId:consumer.id,kind:'keep-with-next'});for(const c of n.children??[])visit(c);}
  visit(consumer,true);visit(consumer.content);
 }
 return {access,hard,studentEditionVisibilityProven:false};
}

export function createSharedResourceView(project,{confirmResourceOnly,...options}={}){
 const requirements=sharedResourceRequirements(project,options);
 for(const binding of requirements.access)if(typeof confirmResourceOnly!=='function'||confirmResourceOnly(structuredClone(binding))!==true)throw Error('Trusted coordinator semantic resource-only review required');
 const reviewed={...requirements,hard:requirements.hard.filter(e=>!(e.kind==='flow-dependency'&&e.ownerFlow&&requirements.access.some(a=>a.consumerId===e.consumerId&&a.targetOwnerId===e.targetId)))};
 const view=Object.freeze(structuredClone(reviewed));
 viewState.set(view,{projectId:project.id,blocks:new Map((project.sections??[]).flatMap(s=>(s.blocks??[]).map(b=>[b.id,bindingOf(b)]))),access:structuredClone(requirements.access),sectionBindings:new Map((project.sections??[]).flatMap(s=>(s.blocks??[]).map(b=>[b.id,sectionBindingOf(s)])))});return view;
}
function annotationShape(b,projectId){
 const descendants=n=>{if(!n||typeof n!=='object')return;if(n.flow&&Object.hasOwn(n.flow,'sharedResourceEdges'))throw Error('Resource annotations are supported only on owner flow');for(const child of n.children??[])descendants(child);};
 descendants(b.content);for(const child of b.children??[])descendants(child);
 if(!b.flow||!Object.hasOwn(b.flow,'sharedResourceEdges'))return;
 const edges=b.flow.sharedResourceEdges;if(!Array.isArray(edges))throw Error('Invalid explicitly present annotation format');
 const keys=['kind','projectId','targetOwnerId','tableId','tableSha256','relationship'],seen=new Set();
 for(const e of edges){if(!e||typeof e!=='object'||Object.keys(e).length!==keys.length||keys.some(k=>!Object.hasOwn(e,k))||e.kind!=='native-table-access-v1'||e.relationship!=='resource-access-only'||typeof e.projectId!=='string'||!e.projectId||projectId!==undefined&&e.projectId!==projectId||typeof e.targetOwnerId!=='string'||!refs(b.flow.dependsOn).includes(e.targetOwnerId)||seen.has(e.targetOwnerId)||typeof e.tableId!=='string'||!e.tableId||!/^[a-f0-9]{64}$/.test(e.tableSha256??''))throw Error('Invalid explicit project-bound resource annotation');seen.add(e.targetOwnerId);}
}
export function hasSharedResourceAnnotations(project){return (project.sections??[]).some(s=>(s.blocks??[]).some(b=>b.flow&&Object.hasOwn(b.flow,'sharedResourceEdges')));}
export function assertSharedResourceView(project,view){
 if(!view){for(const s of project.sections??[])for(const b of s.blocks??[])annotationShape(b,project.id);return;}
 const state=viewState.get(view);if(!state||state.projectId!==project.id)throw Error('Current globally validated shared-resource view required');
 const entries=(project.sections??[]).flatMap(s=>(s.blocks??[]).map(b=>({b,s}))),positions=new Map();
 if(entries.length!==state.blocks.size)throw Error('Resource view project membership changed');
 entries.forEach(({b,s},i)=>{if(positions.has(b.id)||state.blocks.get(b.id)!==bindingOf(b)||state.sectionBindings.get(b.id)!==sectionBindingOf(s))throw Error('Resource view content, identity or dependency changed');positions.set(b.id,i);});
 for(const edge of state.access){const consumer=entries[positions.get(edge.consumerId)];if(!consumer||hidden(consumer.s)||hidden(consumer.b)||['candidate-pool','answers'].includes(consumer.s.role))throw Error('Required resource consumer hidden or excluded');const target=entries[positions.get(edge.targetOwnerId)];if(!target||positions.get(edge.targetOwnerId)>=positions.get(edge.consumerId)||hidden(target.s)||hidden(target.b)||!['practice','teaching'].includes(target.s.phase)||['candidate-pool','answers'].includes(target.s.role)||!nativeTables(target.b).some(t=>t.id===edge.tableId))throw Error('Required resource missing, hidden or late');}
}
// Section-only callers may use the global capability, but cannot reuse it for
// stale inbound grouping/visibility fields on another member of the section.
export function assertSharedResourceSection(section,blocks,view){
 if(!view)return;
 const state=viewState.get(view);if(!state)throw Error('Current globally validated shared-resource view required');
 for(const b of blocks)if(state.blocks.get(b.id)!==bindingOf(b)||state.sectionBindings.get(b.id)!==sectionBindingOf(section))throw Error('Resource view section grouping or visibility changed');
}
export function requireResourceExportProject(project){
 if(!project||typeof project.id!=='string'||!project.id||!Array.isArray(project.sections))throw Error('Current booklet snapshot unavailable; export stopped before resource visibility checks');
 return project;
}
// Descendant/content references never qualify: only the exact owner flow edge does.
export function atomicFlowReferences(node,view){
 const annotations=node.flow&&Object.hasOwn(node.flow,'sharedResourceEdges');
 if(!annotations)return refs(node.flow?.dependsOn);
 annotationShape(node);if(!view)return refs(node.flow?.dependsOn);
 const state=viewState.get(view);if(!state||state.blocks.get(node.id)!==bindingOf(node))throw Error('Current globally validated shared-resource view required');
 return refs(node.flow?.dependsOn).filter(id=>!state.access.some(e=>e.consumerId===node.id&&e.targetOwnerId===id));
}
export function sharedResourceContext(project,consumerId,view){assertSharedResourceView(project,view);return structuredClone(viewState.get(view)?.access.filter(e=>e.consumerId===consumerId).map(e=>({targetOwnerId:e.targetOwnerId,tableId:e.tableId,tableSha256:e.tableSha256,table:e.table}))??[]);}
// Actual selected Questions-page evidence, not source order, establishes access.
// A table must be explicitly reported visible/readable on a selected page before
// (or above on the same page as) every consumer. Missing evidence holds export.
export function verifySharedResourcePages(project,view,{edition,pages,selectedPages,hash}={}){
 if(!view&&!hasSharedResourceAnnotations(project))return true;
 assertSharedResourceView(project,view);const edges=view?viewState.get(view)?.access??[]:sharedResourceRequirements(project,{hash}).access;if(!edges.length)return true;
 if(!['student','with-short','with-worked'].includes(edition)||!Array.isArray(pages)||!Array.isArray(selectedPages))throw Error('Selected Questions-page resource visibility evidence required');
 if(!selectedPages.length||selectedPages.some(i=>!Number.isSafeInteger(i)||i<0||i>=pages.length))throw Error('Select at least one valid Questions page');
 const selected=new Set(selectedPages),occurrences=id=>pages.flatMap((p,i)=>selected.has(i)?(p.elements??[]).filter(e=>e.id===id).map(e=>({...e,page:i})):[]);
 for(const edge of edges){const consumers=occurrences(edge.consumerId),tables=occurrences(edge.tableId).filter(e=>e.visible===true&&e.readable===true&&e.ownerId===edge.targetOwnerId&&e.tableSha256===edge.tableSha256);
 if(!consumers.length)continue; // This application-controlled selection contains no dependent question.
 if(consumers.some(c=>!Number.isFinite(c.y)||!tables.some(t=>Number.isFinite(t.y)&&(t.page<c.page||t.page===c.page&&t.y<c.y))))throw Error('Required table omitted, hidden, unreadable or late in selected export');}
 return true;
}
