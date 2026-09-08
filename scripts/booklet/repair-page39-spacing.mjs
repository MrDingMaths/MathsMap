import fs from 'node:fs';
import {graphTikz,readGraphModel} from '../../src/lib/graph-model.js';
import {validateEditableProject} from '../../src/lib/editable-booklet-model.js';
import {saveBookletProject} from './project-studio-server.mjs';
const active='booklets/projects/linear-relationships-complete-v1.json',out='output/page39-spacing/';
fs.mkdirSync(out,{recursive:true});
const before=JSON.parse(fs.readFileSync(active)),project=structuredClone(before);
fs.writeFileSync(out+'before-project.json',JSON.stringify(before,null,2));
const section=project.sections.find(s=>s.sourcePageNumber===39);
for(const b of section.blocks){
 const tree=project.settings.layoutOverrides.blockLayouts[b.id].arrangement;
 function compact(n){if(n.type==='group')n.gap=n.direction==='row'?2:0.7;n.children?.forEach(compact);}
 compact(tree.root);
 for(const part of b.content.children){
  for(const n of part.prompt?.blocks??[]){if(n.type==='paragraph'){n.lineHeight=1.2;n.spaceAfter=0.5;}}
  const d=part.questionDiagrams[0],model=d.mathematicalModel??readGraphModel(d.code);
  if(b.id.endsWith('q2')){
   d.widthMm=part.label==='b'?44:54;
   function sizeDiagram(n){if(n.ref===d.id)n.width=d.widthMm;n.children?.forEach(sizeDiagram);}sizeDiagram(tree.root);
   for(const t of part.prompt.blocks.filter(n=>n.type==='table')){const width=part.label==='d'?50:58,ratio=width/t.widthMm;t.widthMm=width;t.widths=t.widths.map(w=>w*ratio);}
  }
  // Keep manually edited graph geometry; only adjust its explicit font commands.
  if(!model){d.code=d.code.replace('font=\\large','font=\\fontsize{20}{24}\\selectfont').replace('font=\\small','font=\\fontsize{18}{21.6}\\selectfont');continue;}
  model.tickFontPt=b.id.endsWith('q1')?13:16;
  model.labelFontPt=b.id.endsWith('q1')?15:18;
  d.mathematicalModel=model;d.code=graphTikz(model);
 }
}
const check=validateEditableProject(project);if(!check.valid)throw Error(check.errors.join('\n'));
fs.writeFileSync(out+'candidate.json',JSON.stringify(project,null,2));
if(process.argv.includes('--adopt')){const saved=await saveBookletProject(project,{expectedRevision:before.revision});console.log('Saved revision '+saved.revision);}
