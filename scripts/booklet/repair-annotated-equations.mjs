import fs from 'node:fs';
import {fromSource,normalizeDocument} from '../../src/lib/document-content.js';
import {validateEditableProject} from '../../src/lib/editable-booklet-model.js';

import {saveBookletProject} from './project-studio-server.mjs';
import {BOOKLET_HOUSE_STYLE} from '../../src/lib/booklet-house-style.js';
const root='output/annotated-equations/',active='booklets/projects/linear-relationships-complete-v1.json';
fs.mkdirSync(root,{recursive:true});if(!fs.existsSync(root+'before.json'))fs.copyFileSync(active,root+'before.json');
const before=JSON.parse(fs.readFileSync(root+'before.json'));let project=structuredClone(before);
const descriptions={29:['coefficient of $x$\nnumber $x$ is multiplied by\nchange in $y$ as $x$ increases by 1','constant term\nterm with no variable\nvalue of $y$ when $x=0$'],73:['coefficient of $x$\ngradient (steepness)','constant term\n$y$-intercept\n(where the line crosses the $y$-axis)']};
const converted=[];
for(const section of project.sections)for(const block of section.blocks){
 if(!['page-29-rule-diagram','page-73-formula-diagram'].includes(block.id))continue;
 const original={format:block.format,code:block.code,widthMm:block.widthMm,spec:block.spec};
 const id=block.id+'-equation',labels=descriptions[section.sourcePageNumber];if(!labels||block.format!=='tikz')throw new Error('Formula source changed; review before converting');
 const labelBlocks=(source,index)=>{const blocks=fromSource(source).blocks;blocks.forEach((p,i)=>Object.assign(p,{id:id+'-label-'+index+'-'+i,fontSize:10,lineHeight:1.32,spaceAfter:0,spaceBefore:0,align:'center'}));return blocks;};
 block.type='rich-text';block.content=normalizeDocument({blocks:[{id,type:'annotated-equation',latex:'y=mx+c',fontSize:20,width:150,gap:6,anchors:[{id:id+'-m',start:2,end:3,text:'m'},{id:id+'-c',start:5,end:6,text:'c'}],annotations:labels.map((label,index)=>({id:id+'-annotation-'+index,targetId:id+(index?'-c':'-m'),colour:BOOKLET_HOUSE_STYLE.colours[index?'red':'blue'],placement:'below',decoration:'arrow',blocks:labelBlocks(label,index)}))}]});
 block.spec={...block.spec,sourcePage:section.sourcePageNumber,originalDiagram:original,conversion:'Structured annotated equation; original source diagram retained for comparison.'};
 delete block.format;delete block.code;delete block.widthMm;block.reviewStatus='needs-review';converted.push({page:section.sourcePageNumber,id:block.id});
}
if(converted.length!==2)throw new Error('Expected both source formula diagrams');
project.settings.showKeyIdeasAnswers=false;
const checked=validateEditableProject(project);if(!checked.valid)throw new Error(checked.errors.join('\n'));
fs.writeFileSync(root+'candidate.json',JSON.stringify(project,null,2)+'\n');
if(process.argv.includes('--adopt')){
 const current=JSON.parse(fs.readFileSync(active)),merged=structuredClone(current);
 for(const item of converted){const old=before.sections.find(s=>s.sourcePageNumber===item.page).blocks.find(b=>b.id===item.id),section=merged.sections.find(s=>s.sourcePageNumber===item.page),index=section.blocks.findIndex(b=>b.id===item.id);
  if(index<0||JSON.stringify(section.blocks[index])!==JSON.stringify(old))throw new Error('Formula changed in another session: '+item.id+'; review before conversion.');
  section.blocks[index]=project.sections.find(s=>s.sourcePageNumber===item.page).blocks.find(b=>b.id===item.id);
 }
 merged.settings.showKeyIdeasAnswers=current.settings.showKeyIdeasAnswers??false;
 fs.writeFileSync(root+'pre-adoption.json',JSON.stringify(current,null,2)+'\n');
 const saved=await saveBookletProject(merged,{expectedRevision:current.revision});
 fs.writeFileSync(root+'candidate.json',JSON.stringify(saved,null,2)+'\n');
 fs.writeFileSync(root+'adoption.json',JSON.stringify({fromRevision:current.revision,savedRevision:saved.revision,converted,preservedOtherEdits:true},null,2)+'\n');
 console.log('Saved revision '+saved.revision+'; retained all unrelated saved edits.');
}
console.log(JSON.stringify({sourceRevision:before.revision,converted}));
