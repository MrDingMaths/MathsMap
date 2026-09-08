const equal=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const copy=v=>v===undefined?undefined:JSON.parse(JSON.stringify(v));
const object=v=>v&&typeof v==='object'&&!Array.isArray(v);
const keyed=v=>Array.isArray(v)&&v.every(x=>object(x)&&typeof x.id==='string')&&new Set(v.map(x=>x.id)).size===v.length;
// Structured editor values are atomic. Arrays of identified project entities merge by ID.
export function mergeProjectChanges(base,local,latest,choices={}) {
  // Merge ownership and content once globally. Section-local merging otherwise
  // interprets a move plus a remote edit as an unrelated deletion/insertion.
  const moving = [base,local,latest].some(p=>p.settings?.paginationMode==='flexible');
  const flatten = p => ({...p,sections:p.sections.map(s=>({...s,blocks:s.blocks.map(b=>({id:b.id}))})),flowEntities:p.sections.flatMap(s=>s.blocks.map(block=>({id:block.id,sectionId:s.id,block})))});
  const inputs = moving ? [base,local,latest].map(flatten) : [base,local,latest];
  const conflicts=[];
  function merge(b,l,r,path){
    if(equal(l,b))return copy(r);if(equal(r,b)||equal(l,r))return copy(l);
    if(object(b)&&object(l)&&object(r)&&!l.format?.startsWith('maths-editor-')){
      const result={};for(const key of new Set([...Object.keys(b),...Object.keys(l),...Object.keys(r)])){
        const v=merge(b[key],l[key],r[key],path+'/'+key.replace(/~/g,'~0').replace(/\//g,'~1'));if(v!==undefined)result[key]=v;
      }return result;
    }
    if(keyed(b)&&keyed(l)&&keyed(r)){
      const ids=a=>a.map(x=>x.id),common=new Set(b.filter(x=>l.some(y=>y.id===x.id)&&r.some(y=>y.id===x.id)).map(x=>x.id));
      const order=a=>ids(a).filter(x=>common.has(x));
      if(!equal(order(l),order(b))&&!equal(order(r),order(b))&&!equal(order(l),order(r)))return conflict(b,l,r,path);
      const primary=!equal(order(l),order(b))?l:r,secondary=primary===l?r:l,ordering=[...ids(primary)];
      for(const item of secondary)if(!ordering.includes(item.id)){const at=secondary.indexOf(item),prior=secondary.slice(0,at).reverse().find(x=>ordering.includes(x.id));ordering.splice(prior?ordering.indexOf(prior.id)+1:0,0,item.id);}
      return ordering.map(id=>merge(b.find(x=>x.id===id),l.find(x=>x.id===id),r.find(x=>x.id===id),path+'/id='+encodeURIComponent(id))).filter(x=>x!==undefined);
    }
    return conflict(b,l,r,path);
  }
  function conflict(b,l,r,path){if(choices[path]==='local')return copy(l);if(choices[path]==='latest')return copy(r);conflicts.push({path,base:copy(b),local:copy(l),latest:copy(r)});return copy(l);}
  const project=merge(...inputs,'');project.revision=latest.revision;if(latest.updatedAt!==undefined)project.updatedAt=latest.updatedAt;
  if(moving){
    const entities=new Map(project.flowEntities.map(e=>[e.id,e]));
    for(const section of project.sections){
      const ordered=section.blocks.map(b=>b.id);
      for(const e of entities.values())if(e.sectionId===section.id&&!ordered.includes(e.id))ordered.push(e.id);
      section.blocks=ordered.map(id=>entities.get(id)).filter(e=>e?.sectionId===section.id).map(e=>e.block);
    }
    // A deleted section with edited/moved surviving content is a real conflict.
    for(const sectionId of new Set([...entities.values()].filter(e=>!project.sections.some(s=>s.id===e.sectionId)).map(e=>e.sectionId))){
      const path='/sections/id='+encodeURIComponent(sectionId),choice=choices[path];
      const sourceProject=choice==='local'?local:choice==='latest'?latest:[local,latest,base].find(p=>p.sections.some(s=>s.id===sectionId));
      const source=sourceProject.sections.find(s=>s.id===sectionId);
      if(!choice&&!conflicts.some(c=>c.path===path))conflicts.push({path,base:copy(base.sections.find(s=>s.id===sectionId)),local:copy(local.sections.find(s=>s.id===sectionId)),latest:copy(latest.sections.find(s=>s.id===sectionId))});
      if(source){
        const previous=sourceProject.sections.slice(0,sourceProject.sections.indexOf(source)).reverse().find(s=>project.sections.some(p=>p.id===s.id));
        const at=previous?project.sections.findIndex(s=>s.id===previous.id)+1:0;
        project.sections.splice(at,0,{...copy(source),blocks:[...entities.values()].filter(e=>e.sectionId===sectionId).map(e=>e.block)});
      }
    }
    delete project.flowEntities;
  }
  return {project,conflicts};
}
