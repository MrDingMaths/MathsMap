import fs from 'node:fs';
import assert from 'node:assert/strict';
import {reconcileSyncLayout} from '../../src/lib/question-sync-layout.js';
import {resolveArrangement} from '../../src/lib/booklet-arrangement.js';
import {reconcileFeedback} from '../../src/lib/booklet-feedback.js';

const visit=(n,fn)=>{if(!n||typeof n!=='object')return;fn(n);Object.values(n).forEach(v=>{if(Array.isArray(v))v.forEach(x=>visit(x,fn));else if(v&&typeof v==='object')visit(v,fn);});};
const openIds=new Set(['p3-q3-response','p9-q10-content','p9-q11-response','p14-q10','p14-q11-a','p14-q11-b','p22-q9-a','p22-q10-content','p23-q12-reasoning','p23-q13-c','p23-q13-d','p36-q9-node','p36-q10-node','p36-q11-b','p36-q11-c','p36-q12-a','p36-q12-b','p51-q17-response']);
const otherOpen={
 'area-parallelograms-triangles-v1':['p5-investigation-fitting-squares'],
 'concept-maths-adv11-ch03':['p30-q9-a','p30-q9-b'],
 'concept-maths-adv11-ch07':['p44-q4-root','p44-q5-root'],
 'solve-2-step-equations-v1':['p67-q1-c','p67-q1-d'],
};
const independentInline=new Set(['p22-q9-b','p118-q43-a','p118-q43-c','p118-q44-a','p118-q44-b','p31-part-a']);
export function repairIntegersFeedback(project){
 const next=structuredClone(project),records=[];
 const integers=project.id==='computation-with-integers-v1';
 const reviewed=new Set(integers?openIds:otherOpen[project.id]??[]);
 for(const [si,s] of next.sections.entries())for(const [bi,b] of s.blocks.entries()){
  const before=structuredClone(b);
  if(integers&&b.id==='p3-review')b.content.blocks=[];
  if(integers&&b.id==='p23-q13')visit(b.content.prompt,n=>{if(n.background==='#268cff')n.background='transparent';if(n.colour==='#ffffff')n.colour='#24282d';});
  if(integers&&['p12-q3-block','p19-q1','p19-q2'].includes(b.id))visit(b.content,n=>{
   if(b.id==='p12-q3-block'&&n.id!=='p12-q3-a-row')return;
   if(n.type==='table')n.annotations=(n.annotations??[]).filter(a=>a.type!=='box');
   if(b.id==='p12-q3-block'&&n.type==='table'&&n.widths?.length===4){n.widthMm=100;n.widths=[60,13,10,17];}
  });
  // Reviewed independent responses use unruled handwriting space. Embedded
  // completion blanks, tables, true/false slots and teaching scaffolds survive.
  const walk=n=>{
   if(!n)return;
   if(reviewed.has(n.id)&&n.prompt?.blocks){
    let height=0;
    n.prompt.blocks=n.prompt.blocks.filter(p=>{
     if(p.type!=='paragraph'||!p.inlines?.length||!p.inlines.every(i=>['cloze','break'].includes(i.type)))return true;
     height+=Math.max(...p.inlines.filter(i=>i.type==='cloze').map(i=>(i.lines??1)*8),8);return false;
    });
    if(height){delete n.responseSpace;n.answerSpaceMm=Math.max(n.answerSpaceMm??0,height);}
   }
   // The same open-response rule applies to the complete temperature questions.
   if(integers&&['p23-q13-a','p23-q13-b'].includes(n.id)){
    visit(n.prompt,p=>{if(p.type==='paragraph')p.inlines=p.inlines.filter(i=>i.type!=='cloze');});
    delete n.responseSpace;n.answerSpaceMm=8;
   }
   n.children?.forEach(walk);
  };if(b.type==='question')walk(b.content);
  // A completed question ending in '?' followed by a single answer blank is
  // an open response. The result inside p58's supplied card scaffold is local
  // completion evidence, so retains its required position.
  if(b.type==='question'){
   const inlineWalk=n=>{
    if(!n)return;
    if(n.id!=='p58-q17-result')for(const p of n.prompt?.blocks??[]){
     if(p.type!=='paragraph'||p.inlines?.at(-1)?.type!=='cloze')continue;
     if(!independentInline.has(n.id)&&!p.inlines.slice(0,-1).some(i=>i.type==='text'&&/\?\s*$/.test(i.text)))continue;
     const blank=p.inlines.pop();delete n.responseSpace;n.answerSpaceMm=Math.max(n.answerSpaceMm??0,(blank.lines??1)*8);
    }
    n.children?.forEach(inlineWalk);
   };inlineWalk(b.content);
  }
  const holders=[next.settings?.layoutOverrides?.blockLayouts?.[b.id],b.presentation?.layoutOverrides?.blockLayouts?.[b.id],b.presentation?.arrangement?b.presentation:null].filter(Boolean);
  for(const holder of holders){
   const priorMissing=holder.arrangement?resolveArrangement(before,holder.arrangement).missing:[];
   if(JSON.stringify(before.content)!==JSON.stringify(b.content))reconcileSyncLayout(before,b,holder);
   if(integers&&['p19-q1','p19-q2'].includes(b.id))visit(holder.arrangement,n=>{
    if(n.type==='group'&&n.direction==='row'&&n.children?.some(c=>c.ref?.endsWith('-diagram'))){
     n.gap=1;
     for(const c of n.children){if(c.ref?.endsWith('-diagram')){c.width=b.id==='p19-q1'?132:115;c.align='left';}else if(b.id==='p19-q1'&&c.ref?.includes('/prompt'))c.width=35;c.weight=c.width??1;}
    }
   });
   if(integers&&['p10-q15','p18-guided-practice'].includes(b.id))visit(holder.arrangement,n=>{
    if(n.type==='group'&&n.direction==='row'&&n.children?.some(c=>c.ref?.endsWith('-diagram')||c.ref?.endsWith('-number-line'))){
     n.gap=1;
     for(const c of n.children){if(c.ref?.endsWith('-diagram')||c.ref?.endsWith('-number-line')){c.width=b.id==='p10-q15'?124:120;c.align='left';}c.weight=c.width??1;}
    }
   });
   if(holder.arrangement)assert.deepEqual(resolveArrangement(b,holder.arrangement).missing,priorMissing,'Dangling arrangement '+b.id);
  }
  if(JSON.stringify(before)!==JSON.stringify(b))records.push({id:b.id,location:`/sections/${si}/blocks/${bi}`});
 }
 return {next:reconcileFeedback(project,next),records};
}
if(process.argv.includes('--candidate')){
 const out='.booklet-work/integers-feedback-r73';fs.mkdirSync(out,{recursive:true});
 const report=[];
 for(const file of fs.readdirSync('booklets/projects').filter(f=>f.endsWith('.json'))){
  const raw=fs.readFileSync('booklets/projects/'+file,'utf8'),p=JSON.parse(raw),r=repairIntegersFeedback(p);
  if(!r.records.length)continue;
  const originalFile=out+'/'+p.id+'-original.json';
  if(fs.existsSync(originalFile)){const old=fs.readFileSync(originalFile,'utf8');const oldRevision=JSON.parse(old).revision;const archived=out+'/'+p.id+'-original-r'+oldRevision+'.json';if(!fs.existsSync(archived))fs.writeFileSync(archived,old);}
  fs.writeFileSync(originalFile,raw);fs.writeFileSync(out+'/'+p.id+'-candidate.json',JSON.stringify(r.next,null,2));
  report.push({id:p.id,revision:p.revision,records:r.records});
 }
 fs.writeFileSync(out+'/changes.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
}
