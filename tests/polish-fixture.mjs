// A small booklet and the stubs the first-pass tools need, shared by the polish tests (23 October 2026).
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

export const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
export const QUESTIONS=6;
export const temp=(t,prefix='polish-')=>{const dir=fs.mkdtempSync(path.join(os.tmpdir(),prefix));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));return dir;};
export const payloadOf=prompt=>JSON.parse(prompt.slice(prompt.indexOf('Input:\n')+7));
export const question=n=>({id:'q'+n,type:'question',sourcePageNumber:n,content:{id:'q'+n+'-root',type:'question',label:String(n),prompt:'Find the area.',layout:'grid',columns:2,children:['a','b'].map(part=>({id:`q${n}-${part}`,type:'part',label:part,prompt:`$${n}\\times ${part==='a'?2:3}$`,answerSpaceMm:18,answer:{short:String(n*(part==='a'?2:3)),worked:'Multiply.'}}))}});
export const booklet=()=>({id:'first-pass-fixture',title:'Area of Rectangles',revision:3,settings:{flowEdition:'student',cover:{course:'Year 7'},layoutOverrides:{answerSpaces:{'q1-a':20}}},studio:{flags:[]},
 sections:[
  {id:'front',phase:'front-matter',title:'Cover',blocks:[{id:'cover-block',type:'rich-text',content:'Name: ...'}]},
  {id:'practice',phase:'practice',topicId:'area',title:'Exercise 1',blocks:Array.from({length:QUESTIONS},(_,i)=>question(i+1))}
 ]});
// Questions: a cover then one question a page; the answer editions one question a page.
export const pagemap=()=>{
 const ids=Array.from({length:QUESTIONS},(_,i)=>'q'+(i+1));
 return {student:[{page:1,blocks:['cover-block'],nodes:[]},...ids.map((id,i)=>({page:i+2,blocks:[id],nodes:[id,id+'-a',id+'-b']}))],
  short:ids.map((id,i)=>({page:i+1,blocks:[id],nodes:[id+'-a']})),worked:ids.map((id,i)=>({page:i+1,blocks:[id],nodes:[id+'-a']}))};
};
export const fakeImages=map=>Object.fromEntries(Object.entries(map).map(([edition,pages])=>[edition,Object.fromEntries(pages.map(page=>[page.page,`${edition}-${page.page}.png`]))]));
export const finding=(page,targets,extra={})=>({page,edition:'student',targets,area:'spacing',scope:'local',comment:'Reduce the gap on '+targets[0]+'.',gain:'Fits the page.',...extra});
export const reviewRunner=review=>async options=>{const payload=payloadOf(options.prompt);return {result:review[payload.edition+':'+payload.pages[0].page]??{findings:[],notReliablyReviewed:[]},metrics:{}};};
export function workspace(t,mutate){
 const dir=temp(t),projectFile=path.join(dir,'candidate.json'),project=booklet();mutate?.(project);
 fs.writeFileSync(projectFile,JSON.stringify(project,null,2)+'\n');
 return {dir,projectFile,
  options:{projectFile,root:ROOT,provenanceDir:path.join(dir,'provenance'),workDir:path.join(dir,'work'),runDir:null,lease:async(_dir,_details,action)=>action(),mapPages:async()=>pagemap(),renderImages:async()=>({images:fakeImages(pagemap()),report:'stub',failures:[],reused:false})},
  record:()=>JSON.parse(fs.readFileSync(path.join(dir,'provenance','first-pass-fixture.json'),'utf8')),project:()=>JSON.parse(fs.readFileSync(projectFile,'utf8'))};
}
export const patch=(targetId,field,original,corrected)=>({targetId,field,original,corrected});
