// In-memory continuation checkpoints. They are deliberately absent from project
// JSON and persistent measurement caches: content and renderer identity own reuse.
const snapshots=new WeakMap(),nodeIds=new WeakMap();
const without=(object,keys)=>Object.fromEntries(Object.entries(object??{}).filter(([key])=>!keys.includes(key)));
const same=(a,b)=>a?.length===b?.length&&a.every((v,i)=>v===b[i]);
function ids(block){
  if(nodeIds.has(block))return nodeIds.get(block);
  const found=new Set();
  const scan=n=>{if(!n||typeof n!=='object')return;if(n.id)found.add(n.id);for(const [key,v]of Object.entries(n))if(!['source','sourceReview','sourceLayoutEvidence','originalDiagram','originalGraph','mathematicalModel','bankRef','classification'].includes(key))Array.isArray(v)?v.forEach(scan):scan(v);};
  scan(block);nodeIds.set(block,[...found]);return [...found];
}
export function paginationReuse(project,edition,previous,context=''){
  const old=snapshots.get(previous),runs=new Map();
  const settings=project.settings??{},globalKey=JSON.stringify([project.id,project.title,project.subtitle,project.source?.runId,without(settings,['layoutOverrides','cover']),project.assets,context,edition]);
  const eligible=old?.globalKey===globalKey;
  return {
    get(key,section,units,seenTopic){
      const overrides=settings.layoutOverrides??{};
      const metadata=JSON.stringify([without(section,['blocks']),seenTopic,section.isCover?settings.cover:null]);
      const inputs=units.map(unit=>({blocks:unit.blocks,layout:JSON.stringify(unit.blocks.map(block=>ids(block).map(id=>[id,...Object.keys(overrides).sort().map(key=>overrides[key]?.[id])])))}));
      const prior=eligible&&old.runs.get(key),compatible=prior?.metadata===metadata;
      const matches=i=>compatible&&same(inputs[i]?.blocks,prior.inputs[i]?.blocks)&&inputs[i]?.layout===prior.inputs[i]?.layout;
      let first=0;while(first<inputs.length&&matches(first))first++;
      const entry={metadata,inputs,checkpoints:[],pages:[],issues:[]};runs.set(key,entry);
      return {entry,prior:compatible?prior:null,first,unchanged:compatible&&first===inputs.length&&inputs.length===prior.inputs.length,
        suffix:from=>compatible&&inputs.length===prior.inputs.length&&inputs.slice(from).every((_,i)=>matches(from+i))};
    },
    finish(result){snapshots.set(result,{globalKey,runs});return result;},
  };
}
export function samePageCarry(a,b){return same(a,b);}

// Reuse derived field identities even though numbering and section metadata are
// calculated afresh. Unchanged fields keep their mounted editor/rendered body.
const projections=new Map();
const shallow=(a,b)=>a&&Object.keys(a).length===Object.keys(b).length&&Object.keys(b).every(k=>a[k]===b[k]);
export function shareFlowProjection(project,edition,sections){
  const key=project.id+':'+edition,old=projections.get(key),previous=new Map(old?.flatMap(s=>s.blocks.map(b=>[b.id,b]))??[]);
  const result=sections.map(section=>{
    const blocks=section.blocks.map(block=>{const prior=previous.get(block.id);if(prior&&shallow(prior.flow,block.flow))block={...block,flow:prior.flow};return shallow(prior,block)?prior:block;});
    const prior=old?.find(s=>s.id===section.id),candidate={...section,blocks:same(prior?.blocks,blocks)?prior.blocks:blocks};
    return shallow(prior,candidate)?prior:candidate;
  });
  projections.set(key,result);if(projections.size>40)projections.delete(projections.keys().next().value);return result;
}
