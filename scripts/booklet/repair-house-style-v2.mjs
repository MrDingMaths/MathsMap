// Historical migration retired: its blanket font growth must not run again.
throw new Error('Superseded typography migration. Use scripts/booklet/calibrate-graph-typography.mjs and review its candidate before saving.');
import fs from 'node:fs';
import {graphTikz,styleGraph,readGraphModel} from '../../src/lib/graph-model.js';
import {clozeLayout} from '../../public/libs/maths-editor/house-style.mjs';
import {validateEditableProject} from '../../src/lib/editable-booklet-model.js';
const out='output/house-style-v2/';fs.mkdirSync(out,{recursive:true});
const original='booklets/projects/linear-relationships-complete-v1.json';
if(!fs.existsSync(out+'before.json'))fs.copyFileSync(original,out+'before.json');
const p=JSON.parse(fs.readFileSync(out+'before.json')),changes=[],unknown=[];
p.settings.houseStyleVersion='1.1.0';
const strip=s=>String(s??'').replace(/\$/g,'').trim();
const map={'page-66-q1-p1':['Distance travelled (km)','Cost (dollars)'],'page-82-q1-sentence':['ies','n','olution'],'page-83-q2-b':['find how many triangles can be made with 17 matchsticks'],'page-39-q1-a':['1','1','x + 1'],'page-39-q1-b':['-1','-2','-x - 2'],'page-39-q2-a':['1','1','x + 1']};
function fill(n,page){
 if(!n||typeof n!=='object')return;
 if(n.prompt&&n.answer){const blanks=[];function collect(v){if(!v||typeof v!=='object')return;if(v.type==='cloze')blanks.push(v);Object.values(v).forEach(x=>Array.isArray(x)?x.forEach(collect):collect(x));}collect(n.prompt);
 let answers=map[n.id],short=strip(n.answer.short);
 if(!answers&&n.id.startsWith('page-10-q12'))answers=short.replace(/[()]/g,'').split(',').map(s=>s.trim());
 if(!answers&&n.id.startsWith('page-11-q14')){answers=['-10','-10'];blanks.forEach(b=>{b.expectedResponse='-10';b.reviewStatus='open-response';});}
 if(!answers&&n.id.startsWith('page-84-q1'))answers=[...short.matchAll(/(?:Line:|Horizontal line:)\s*([^,]+)/gi)].map(m=>m[1].trim());
 if(!answers&&/page-(90|91|92)-/.test(n.id)){const m=short.match(/\(([^,]+),\s*([^)]+)\)/);if(m)answers=[m[0],m[1],m[2]];}
 if(!answers&&n.id.startsWith('page-87-'))answers=[short.replace(/^x\s*=\s*/,'')];
 if(!answers&&blanks.length===1&&short&&!/Answers will vary/i.test(short))answers=[short];
 blanks.forEach((b,i)=>{if(!b.answer&&answers?.[i]){if(b.reviewStatus!=='open-response')b.answer=answers[i];b.expectedResponse=answers[i];}if(!b.answer&&!b.expectedResponse){b.reviewStatus='needs-review';unknown.push({page,id:n.id,index:i});}});
 }
 if(n.type==='cloze'){
  const expected=n.expectedResponse||n.answer;if(expected){const layout=clozeLayout(expected);n.width=layout.width;n.lines=layout.lines;n.expectedResponse=expected;}else n.reviewStatus='needs-review';
 }
 if(n.format==='tikz'&&n.code){const model=n.mathematicalModel??readGraphModel(n.code);if(model){n.mathematicalModel=styleGraph(model,n.widthMm??65);n.code=graphTikz(n.mathematicalModel);changes.push({page,id:n.id,kind:'graph'});}else if(/\\begin\{axis\}/.test(n.code)){
  const raw=JSON.parse(n.code.match(/^% mathsmap-graph-model: (.+)$/m)?.[1]??'null');
  const font=Math.min(36,Math.ceil(11.5*((raw?.widthCm??6.5)*10+18)/(n.widthMm??65)));
  n.code=n.code.replace(/font=\\(?:large|small|normalsize|footnotesize|scriptsize|tiny)|font=\\fontsize\{[^}]+\}\{[^}]+\}\\selectfont/g,`font=\\fontsize{${font}}{${font*1.2}}\\selectfont`).replace(/grid style=\{[^}]+\}/g,'grid style={housegrid,thin}').replace('\\begin{axis}', '\\definecolor{housegrid}{HTML}{CCCCCC}\n\\begin{axis}');changes.push({page,id:n.id,kind:'manual-graph-fonts'});
 }}
 for(const [k,v]of Object.entries(n))if(!['spec','sourceAtom','answer','mathematicalModel','originalDiagram'].includes(k))Array.isArray(v)?v.forEach(x=>fill(x,page)):fill(v,page);
}
for(const s of p.sections)fill(s.blocks,s.sourcePageNumber);
// Keep a reasonable consistent graph/text layout on the dense representation pages.
for(const s of p.sections.filter(s=>[62,63,64,67,68,69,70,83].includes(s.sourcePageNumber))){
 function compact(n){if(!n||typeof n!=='object')return;if(n.type==='paragraph'){n.lineHeight=Math.min(n.lineHeight??1.32,1.32);n.spaceAfter=Math.min(n.spaceAfter??1,1);}for(const [k,v]of Object.entries(n))if(!['spec','sourceAtom'].includes(k))Array.isArray(v)?v.forEach(compact):compact(v);}compact(s.blocks);
}
const checked=validateEditableProject(p);if(!checked.valid)throw Error(checked.errors.join('\n'));
fs.writeFileSync(out+'candidate.json',JSON.stringify(p,null,2));fs.writeFileSync(out+'migration.json',JSON.stringify({changes,unknown},null,2));console.log(JSON.stringify({graphs:changes.length,unknown}));
