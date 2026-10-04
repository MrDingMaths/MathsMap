import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import katex from 'katex';
import {repairIntegersCloze} from '../scripts/booklet/repair-integers-cloze-20261004.mjs';
import {walk} from '../scripts/booklet/repair-integers-feedback-20261002.mjs';
import {renderDocument} from '../public/libs/maths-editor/document-model.mjs';
import {resolveArrangement} from '../src/lib/booklet-arrangement.js';

const source=JSON.parse(fs.readFileSync('tests/fixtures/booklets/integers-cloze-r231.json'));
const {project,records}=repairIntegersCloze(source);
const find=id=>project.sections.flatMap(s=>s.blocks).find(b=>b.id===id);
test('repairs preserve source evidence, answers, identities, classifications and bank refs',()=>{
 const fields=p=>{const result=[];walk(p.sections,n=>{if(n.answer&&typeof n.answer==='object')result.push([n.id,n.answer]);if(n.classification)result.push([n.id,n.classification,n.bankRef]);});return result;};
 assert.deepEqual(fields(project),fields(source));assert.deepEqual(project.source,source.source);
 assert.deepEqual(repairIntegersCloze(project).project,project);
 assert.equal(find('p35-q11').content.children[0].columns,2);
 for(const id of ['p35-q11','p37-q13'])assert.equal(resolveArrangement(find(id),project.settings.layoutOverrides.blockLayouts[id]?.arrangement,project.settings.layoutOverrides).missing.length,0);
});
test('dotted clozes have expected responses and valid native mathematics',()=>{
 for(const b of project.sections.flatMap(s=>s.blocks))walk(b.content,n=>{
  for(const i of n.inlines??[]){if(i.type==='math')katex.renderToString(i.latex,{throwOnError:true,displayMode:!!i.display});if(i.type==='cloze'&&i.reviewStatus==='reviewed'){assert.ok(i.answer);assert.equal(i.answer,i.expectedResponse);}}
 });
 for(const id of ['p35-q9','p40-q4','p47-q8','p48-q10']){const b=find(id);assert.doesNotMatch(JSON.stringify(b.content),/boxed/);let count=0;walk(b.content,n=>{if(n.type==='cloze')count++;});assert.ok(count);}
 assert.match(JSON.stringify(find('p43-q14').content),/boxed/,'Card-selection scaffolds retain meaningful boxes');
});
const evaluate=latex=>{
 let s=latex.replace(/(-?\d+)\\frac\{([^{}]+)\}\{([^{}]+)\}/g,(_,a,b,c)=>`(${a}${Number(a)<0?'-':'+'}(${b})/(${c}))`).replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g,'($1)/($2)').replace(/\\mathord\{([^{}]+)\}/g,'$1').replace(/\\times/g,'*').replace(/\\div/g,'/').replace(/\\(?:left|right)/g,'').replace(/\\[,;! ]/g,'').replace(/[{}]/g,'').trim();
 assert.match(s,/^[\d.()+*/\s-]+$/);try{return Function(`return (${s})`)();}catch(e){throw Error(`Cannot evaluate ${latex}: ${s}`,{cause:e});}
};
test('every converted calculation agrees with its accepted response',()=>{
 const changed=new Set(records.map(r=>r.targetId));let checked=0;
 for(const b of project.sections.flatMap(s=>s.blocks))walk(b.content,n=>{
  if(!changed.has(n.id))return;
  walk(n.prompt,p=>{if(p.type!=='paragraph')return;let line='';const check=()=>{const pieces=line.replace(/\\mathord\{([^{}]+)\}/g,'$1').split(/([=<>])/);if(pieces.length===3){const a=evaluate(pieces[0]),z=evaluate(pieces[2]);assert.ok(pieces[1]==='='?Math.abs(a-z)<1e-8:pieces[1]==='<'?a<z:a>z,`${n.id}: ${line}`);checked++;}line='';};
   for(const i of p.inlines??[]){if(i.type==='break'){check();continue;}if(i.type==='math')line+=i.latex;if(i.type==='cloze'){const a=i.answer.replace(/\$/g,'');line+=/^[<>+-]$/.test(a)?a:`(${a})`;}}
   check();
  });
 });
 assert.ok(checked>150);
});
test('magic squares are contiguous native tables with empty student cells',()=>{
 for(const part of find('p37-q13').content.children){const t=part.prompt.blocks[0];assert.equal(t.border,true);assert.equal(t.rows.length,3);assert.ok(t.rows.every(r=>r.length===3));assert.doesNotMatch(JSON.stringify(t),/"arrangement":"cards"/);
  const values=t.rows.map(r=>r.map(c=>{const i=c.blocks[0].inlines[0];return Number((i.latex??i.answer).replace(/\$/g,''));}));
  const sum=values[0].reduce((s,v)=>s+v,0);for(let k=0;k<3;k++){assert.equal(values[k].reduce((s,v)=>s+v,0),sum);assert.equal(values.reduce((s,r)=>s+r[k],0),sum);}assert.equal(values.reduce((s,r,k)=>s+r[k],0),sum);assert.equal(values.reduce((s,r,k)=>s+r[2-k],0),sum);
  const html=renderDocument(part.prompt);assert.match(html,/--document-cloze-dots:var\(--document-table-cloze-dots,none\)/);assert.doesNotMatch(html,/>\$-10\$</);
 }
});
