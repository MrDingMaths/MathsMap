import fs from 'node:fs';
import {resolveArrangement,findContent} from '../../src/lib/booklet-arrangement.js';
import {group,findArrangement,arrangementItems,transformArrangement} from '../../public/libs/maths-editor/arrangement-model.mjs';
import {validateEditableProject} from '../../src/lib/editable-booklet-model.js';

import {saveBookletProject} from './project-studio-server.mjs';
const dir='output/focused-arrangements/',active='booklets/projects/linear-relationships-complete-v1.json';
fs.mkdirSync(dir,{recursive:true});if(!fs.existsSync(dir+'before.json'))fs.copyFileSync(active,dir+'before.json');
const before=JSON.parse(fs.readFileSync(dir+'before.json')),project=structuredClone(before),changes=[];
const block=id=>project.sections.flatMap(s=>s.blocks).find(b=>b.id===id);
const saveTree=(b,tree)=>{const layouts=project.settings.layoutOverrides.blockLayouts;layouts[b.id]={...layouts[b.id],arrangement:tree};changes.push({id:b.id,kind:'arrangement'});};
const b11=block('page-11-q14');let tree=resolveArrangement(b11).tree;
for(const letter of ['j','i'])tree=transformArrangement(tree,'full-width','page-11-q14-'+letter+':question');
// Existing prescribed response-space values remain the authority.
for(const i of arrangementItems(tree.root)){const e=resolveArrangement(b11,tree).entries.get(i.ref);if(e?.kind==='space')i.height=project.settings.layoutOverrides.answerSpaces[e.ownerId]??e.value;}
saveTree(b11,tree);
const b30=block('page-30-we-1');
for(const [index,example]of b30.examples.entries()){
 const table=example.prompt.blocks.find(n=>n.type==='table'),row=table.rows[1];
 table.annotations=[{id:table.id+'-constant-circle',type:'circle',cellId:row[index===0?1:2].id,colour:'#ef6068'},...row.slice(1,-1).map((c,i)=>({id:table.id+'-difference-'+i,type:'arrow',cellId:c.id,toCellId:row[i+2].id,side:'bottom',label:index===0?'+2':'−3',colour:'#268cff',curveMm:3,distanceMm:1}))];table.marginAfter=11;
}
changes.push({id:b30.id,kind:'source table annotations'});
const b38=block('page-38-q17');tree=resolveArrangement(b38).tree;
for(const n of b38.content.children){for(const table of n.prompt?.blocks??[])if(table.type==='table')table.marginBefore=0;}
for(const i of arrangementItems(tree.root)){const e=resolveArrangement(b38,tree).entries.get(i.ref);if(e?.kind==='space')i.height=project.settings.layoutOverrides.answerSpaces[e.ownerId]??e.value;}
saveTree(b38,tree);
const b39=block('page-39-q1');let r=resolveArrangement(b39);tree=r.tree;
for(const part of b39.content.children){
 const partGroup=findArrangement(tree.root,part.id+':question'),all=arrangementItems(partGroup),label=all.filter(i=>r.entries.get(i.ref)?.kind==='label'),graph=all.filter(i=>r.entries.get(i.ref)?.kind==='diagram'),tables=all.filter(i=>r.entries.get(i.ref)?.value?.blocks?.[0]?.type==='table'),responses=all.filter(i=>r.entries.get(i.ref)?.value?.blocks?.[0]?.type==='paragraph');
 for(const response of responses)response.keepInline=true;
 for(const g of graph){g.width=41;findContent(b39,r.entries.get(g.ref).diagramId).widthMm=41;}
 for(const t of tables){const table=findContent(b39,r.entries.get(t.ref).nodeId);table.widthMm=46;table.widths=table.widths.map(()=>46/table.widths.length);t.width=46;}
 const left=group(part.id+':graph-table',[...graph,...tables]);left.weight=1.45;left.gap=0;
 const right=group(part.id+':responses',responses);right.weight=1;
 partGroup.children=[...label,group(part.id+':arranged',[left,right],'row')];
}
tree.root.gap=0;
saveTree(b39,tree);changes.push({id:b39.id,kind:'table and diagram widths'});
// Graph series receive named colours without recolouring axes or algebra labels.
for(const section of project.sections)for(const b of section.blocks){
 let changed=false;
 function walk(n){if(!n||typeof n!=='object')return;if(n.format==='tikz'&&(section.sourcePageNumber===41||/graph|Cartesian|coordinate|axes|line passing/i.test(n.alt??''))&&n.code){
  let code=n.code.replace(/\\definecolor\{answerblue\}\{RGB\}\{0,119,238\}/g,'\\definecolor{answerblue}{HTML}{268CFF}');
  if(section.sourcePageNumber===41)code=code.replace(/(\\(?:draw|fill)\[)(?:orange|green|sourceorange|sourcegreen)(?=[,\]])/g,'$1blue');
  if(code!==n.code){n.code=code;changed=true;}
 }for(const [key,v]of Object.entries(n))if(!['spec','sourceAtom','originalDiagram'].includes(key)&&v&&typeof v==='object')Array.isArray(v)?v.forEach(walk):walk(v);}
 walk(b);if(changed)changes.push({id:b.id,kind:'graph palette'});
}
const checked=validateEditableProject(project);if(!checked.valid)throw Error(checked.errors.join('\n'));
fs.writeFileSync(dir+'candidate.json',JSON.stringify(project,null,2)+'\n');
fs.writeFileSync(dir+'changes.json',JSON.stringify(changes,null,2)+'\n');
if(process.argv.includes('--adopt')){
 const latest=JSON.parse(fs.readFileSync(active)),merged=structuredClone(latest),ids=[...new Set(changes.map(c=>c.id))];
 for(const id of ids){const old=before.sections.flatMap(s=>s.blocks).find(b=>b.id===id),current=latest.sections.flatMap(s=>s.blocks).find(b=>b.id===id),next=project.sections.flatMap(s=>s.blocks).find(b=>b.id===id);if(JSON.stringify(old)!==JSON.stringify(current))throw Error('Saved content changed; review before adopting '+id);for(const section of merged.sections){const i=section.blocks.findIndex(b=>b.id===id);if(i>=0)section.blocks[i]=next;}const layout=project.settings.layoutOverrides.blockLayouts[id];if(JSON.stringify(before.settings.layoutOverrides.blockLayouts[id])!==JSON.stringify(latest.settings.layoutOverrides.blockLayouts[id]))throw Error('Layout changed: '+id);if(layout)merged.settings.layoutOverrides.blockLayouts[id]=layout;}
 fs.writeFileSync(dir+'pre-adoption.json',JSON.stringify(latest,null,2));const saved=await saveBookletProject(merged,{expectedRevision:latest.revision});fs.writeFileSync(dir+'candidate.json',JSON.stringify(saved,null,2));console.log('Saved revision '+saved.revision);
}
console.log(JSON.stringify({sourceRevision:before.revision,changes:changes.length}));
