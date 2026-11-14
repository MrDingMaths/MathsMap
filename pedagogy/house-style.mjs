// House-style defaults learned from James's comments and Studio edits on Working with Functions 1
// (13-14 November 2026). The principles are written up in docs/booklet-build-principles.md; this module holds the
// parts that can be computed. Helpers suggest or apply a default and leave teacher decisions alone.
//
//   node pedagogy/house-style.mjs <project-id | path.json>     report what the next review would flag
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {regridParts} from '../src/lib/booklet-arrangement.js';

// The width a reader sees, in characters: LaTeX commands dropped, a fraction counted by its wider line.
export function promptWidth(prompt){
 let t=typeof prompt==='string'?prompt:JSON.stringify(prompt??'');
 // A drawn blank counts by its width (about 2.6 mm a character); a radical sign takes about two characters.
 t=t.replace(/\$/g,'').replace(/\\(?:color|textcolor)\{[^{}]*\}/g,'').replace(/\\hspace\{([\d.]+)mm\}/g,(m,mm)=>'x'.repeat(Math.round(+mm/2.6))).replace(/\\(?:boxed|phantom|rule)\{[^{}]*\}(\{[^{}]*\})?/g,'xx');
 for(let i=0;i<5;i++)t=t.replace(/\\[dt]?frac\{([^{}]*)\}\{([^{}]*)\}/g,(m,a,b)=>a.length>=b.length?a:b);
 return t.replace(/\\sqrt/g,'xx').replace(/\\(?:times|div|cdot|pm)/g,'x').replace(/\\[a-zA-Z]+/g,'').replace(/[{}^_\s]/g,'').length;
}
const leaves=n=>(n?.children??[]).length?n.children.flatMap(leaves):[n];
// Widest line a student writes: each worked-answer line after its alignment point.
export function workingWidth(part){
 const w=String(part?.answer?.worked??'').replace(/^\$+|\$+$/g,'').replace(/\\begin\{(?:aligned|align\*?)\}|\\end\{(?:aligned|align\*?)\}/g,'');
 return Math.max(0,...w.split(/\\\\/).map(l=>promptWidth(l.includes('&')?l.slice(l.indexOf('&')+1):l)));
}
// Maths characters one part can hold at each column count (175 mm text width, 11 pt maths).
// Calibrated on James's choices: his 4-across grids hold working up to ~21 characters; 3-across tolerates long
// working that wraps (up to ~40). Beyond 21 with four parts, the complete-row rule gives his 2 by 2 grid.
export const COLUMN_CAPACITY=Object.freeze({4:21,3:40,2:Infinity});
// The printed prompt must fit too. This is an estimate: the rendered overflow check (check-feedback-pages,
// question-column-overflow) decides. WF1 trial, 14 Nov: 16 / 20 kept 22 of James's 29 choices.
export const PROMPT_CAPACITY=Object.freeze({4:16,3:20,2:Infinity});
// Any words outside the maths ("2\sqrt3 or \sqrt{11}") make a prose part: the rule does not apply.
const hasWords=s=>/[a-z]{2,}/i.test(String(s).replace(/\$[^$]*\$/g,'').replace(/\\[a-zA-Z]+/g,''));

// Columns for a multi-part question or guided practice whose parts are short expressions. Calibrated on the 29
// column changes James made by hand in WF1 (r207-r504; with the width limits below it reproduces 22): use the most columns that give
// complete rows; stacked fractions and long prompts 2 across. null = rule does not apply (one part, diagrams,
// prose parts, document prompts); the caller keeps the layout it has.
export function houseColumns(content,{workingSpace=true}={}){
 const base=baseColumns(content);if(base==null)return null;
 // James (14 Nov): "sometimes I want 2x2 grid if the working out can get horizontally long". The most columns
 // up to the rule whose width holds the prompt and (where students write in the booklet) the widest working
 // line, and that still give complete rows.
 const parts=leaves(content),n=parts.length;
 const prompt=Math.max(...parts.map(p=>promptWidth(p.prompt))),work=workingSpace?Math.max(0,...parts.map(workingWidth)):0;
 const complete=c=>c>=n||n%c===0||n%c>=c-1;
 return [4,3,2].find(c=>c<=base&&c<=n&&prompt<=PROMPT_CAPACITY[c]&&work<=COLUMN_CAPACITY[c]&&complete(c))??Math.min(2,n);
}
function baseColumns(content){
 const parts=leaves(content);
 if(parts.length<2)return null;
 if(parts.some(p=>(p.questionDiagrams??[]).length||typeof p.prompt!=='string'||hasWords(p.prompt)))return null;
 const width=Math.max(...parts.map(p=>promptWidth(p.prompt))),n=parts.length;
 if(parts.some(p=>/\\[dt]?frac\{[^{}]*\\[dt]?frac/.test(p.prompt)))return Math.min(2,n);
 if(width>22)return 2;
 // Rationalising a binomial surd denominator needs half the page per part: four make a 2 by 2 grid
 // (James: "add 1 more example and make it 2x2 grid", p56-t3). Short single-surd denominators still run 4 across.
 const binomialSurd=p=>/\\[dt]?frac\{[^{}]*\}\{[^{}]*\\sqrt\{?[^{}]*\}?\s*[+-]|\\[dt]?frac\{[^{}]*\}\{[^{}]*[+-]\s*\d*\\sqrt/.test(p.prompt);
 if(parts.filter(binomialSurd).length>=Math.ceil(n/2))return Math.min(n<=4?2:3,n);
 if(n<=4)return width<=19?n:Math.min(2,n);
 if(n%4===0&&(width<=9||n%3!==0))return 4;
 if(n%3===0)return 3;
 return width<=12?4:3;
}

// Worked examples whose prompts are short expressions run in one row (James asked for 4 columns on every such
// example: ru6, p14, p24, p3); fraction sums and rationalising 3; long products of fractions 2.
export function exampleColumns(block){
 const ex=block?.examples??[];if(ex.length<2)return null;
 const text=e=>typeof e.prompt==='string'?e.prompt:(e.prompt?.blocks??[]).every(b=>b.type==='paragraph')?(e.prompt.blocks??[]).map(b=>(b.inlines??[]).map(i=>i.latex??'').join('')).join(''):null;
 const prompts=ex.map(text);if(prompts.some(p=>p==null))return null;
 // The working decides as much as the prompt: the widest line of any solution.
 const latexOf=v=>{const out=[];const walk=x=>{if(!x||typeof x!=='object')return;if(Array.isArray(x))return x.forEach(walk);if(typeof x.latex==='string')out.push(x.latex);else if(x.type==='text'&&x.text)out.push(x.text);Object.values(x).forEach(walk);};walk(v);return out.join('\\\\');};
 const solution=e=>typeof e.theorySolution==='string'?e.theorySolution:latexOf(e.theorySolution);
 const lines=ex.flatMap(e=>solution(e).replace(/\\begin\{(?:aligned|array)\}(\{[^}]*\})?|\\end\{(?:aligned|array)\}/g,'').split(/\\\\/));
 const width=Math.max(...prompts.map(promptWidth),...lines.map(l=>promptWidth(l.replace(/\\color\{[^}]*\}/g,''))));
 const n=ex.length,complete=c=>c>=n||n%c===0||n%c>=c-1;
 return [4,3,2].find(c=>c<=n&&width<=({4:16,3:26,2:Infinity})[c]&&complete(c))??Math.min(2,n);
}

// Apply houseColumns to a freshly drawn bank question, regridding a saved arrangement it brings with it.
// Returns the block unchanged when the rule does not apply or the arrangement cannot be regridded.
export function applyHouseColumns(block,{workingSpace=true}={}){
 const c=block?.content,want=houseColumns(c,{workingSpace});
 if(!want||(c.layout==='grid'&&c.columns===want))return block;
 const next=structuredClone(block);next.content.layout='grid';next.content.columns=want;
 const saved=next.presentation?.layoutOverrides?.blockLayouts?.[next.id];
 if(saved?.arrangement){const arrangement=regridParts(saved.arrangement,next.content,want);if(!arrangement)return block;saved.arrangement=arrangement;}
 (next.houseStyle??={}).columns={from:c.layout==='list'?1:c.columns,to:want,rule:'houseColumns'};
 return next;
}

// Rules (theory) tables: label column fitted to the longest label, light grey hairline borders. James restyled
// every WF1 rules table this way by hand (label column 30-52 mm of 175, #cccccc at 0.26 mm).
export const RULES_TABLE=Object.freeze({widthMm:175,borderColour:'#cccccc',borderWidthMm:0.26,labelBackground:'#d3e8fc',mmPerChar:2.3,labelPaddingMm:8,minLabelMm:28,maxLabelMm:65});
export function rulesTableWidths(labels,{widthMm=RULES_TABLE.widthMm}={}){
 const longest=Math.max(0,...labels.map(l=>String(l??'').replace(/\*\*|\$[^$]*\$/g,m=>m.startsWith('$')?'xxxx':'').length));
 const label=Math.min(RULES_TABLE.maxLabelMm,Math.max(RULES_TABLE.minLabelMm,Math.round(longest*RULES_TABLE.mmPerChar+RULES_TABLE.labelPaddingMm)));
 return [label,widthMm-label];
}

// Hand-numbered steps ("1.", "2.") in worked-example working.
export function hasStepNumbers(block){
 if(block?.type!=='worked-example')return false;
 return /"text":"\s*\d+\.\s*[^"]*"|\\\\color\{#ef6068\}\d+\./.test(JSON.stringify(block.examples??[]));
}
// The highest step number an example uses.
export function exampleStepCount(block){
 const j=JSON.stringify(block?.examples??[]);
 return Math.max(0,...[...j.matchAll(/"text":"\s*(\d+)\.|\\\\color\{#ef6068\}(\d+)\./g)].map(m=>+(m[1]??m[2])));
}
// Explicit steps in a topic's theory: items of an ordered list, or paragraphs/cells that open "1.", "Step 1".
// James (14 November 2026): step numbers are right when the theory lists explicit steps and the example's
// numbers correspond to them; consolidating the theory into a rules table removed those steps in WF1.
export function theoryStepCount(project,topicId){
 let most=0;
 for(const s of project.sections??[]){
  if(s.topicId!==topicId||!(s.phase==='teaching'||s.role==='teaching'))continue;
  for(const b of s.blocks??[]){
   if(b.type==='worked-example'||b.type==='question')continue;
   const walk=v=>{if(!v||typeof v!=='object')return;if(Array.isArray(v))return v.forEach(walk);
    if(v.ordered===true&&Array.isArray(v.items))most=Math.max(most,v.items.length);
    if(Array.isArray(v.inlines)){const t=v.inlines.map(i=>i.text??'').join('').trim(),m=/^(?:Step\s*)?(\d+)[.):]/i.exec(t);if(m)most=Math.max(most,+m[1]);}
    Object.values(v).forEach(walk);};
   walk(b.content);
  }
 }
 return most;
}

// What a review of this booklet would flag against the build principles. Report only; nothing is changed.
export function houseStyleFindings(project){
 const out=[];const add=(rule,section,block,detail)=>out.push({rule,section:section.id,block:block.id,detail});
 const layouts=project.settings?.layoutOverrides?.blockLayouts??{};
 for(const s of project.sections??[]){
  const words=new Set();
  for(const b of s.blocks??[]){
   if(hasStepNumbers(b)){const steps=theoryStepCount(project,s.topicId),used=exampleStepCount(b);
    if(!steps||used>steps)add('step-numbers',s,b,steps?`example numbers run to ${used} but the theory lists ${steps} steps`:'numbered working but the theory lists no steps: use equals-gutter lines (P, S, F labels may stay without numbers)');}
   if(b.type==='worked-example'){
    const want=exampleColumns(b),has=b.presentation?.columns;if(want&&has&&want>has)add('example-columns',s,b,`${has} columns; short prompts suggest ${want}`);
    for(const e of b.examples??[])for(const blk of (e.prompt?.blocks??[]))if(blk.type==='annotated-equation'&&blk.align!=='left')add('annotated-left',s,b,e.id+': annotated equation is '+(blk.align??'centred'));
   }
   if(b.type==='question'&&b.content){
    const want=houseColumns(b.content,{workingSpace:s.workingSpace!=='none'}),c=b.content,has=c.layout==='list'?1:c.columns;
    // Only a clear miss: James accepted one-column differences across WF1, but widened every 2-column grid of
    // short expressions he saw.
    if(want&&has&&want-has>=2&&!layouts[b.id]?.houseStyleException)add('columns',s,b,`${has} column${has===1?'':'s'}; house rule gives ${want}`);
    for(const p of leaves(c))if(typeof p.prompt==='object'&&p.prompt?.blocks?.some(x=>x.type==='table'&&x.rows?.[0]?.some(cell=>cell.background)&&(x.widths?.length??0)>=2))add('pairs-table',s,b,p.id+': highlighted pairs in a full-width table (use \\colorbox pairs that hug the terms)');
   }
   if(b.type==='rich-text')for(const t of (b.content?.blocks??[]).filter(x=>x.type==='table'&&x.rows?.[0]?.[0]?.background==='#d3e8fc'))
    if(t.borderColour!==RULES_TABLE.borderColour||!(t.widths?.[0]>10))add('rules-table',s,b,'rules table not in house style (fitted label column, #cccccc 0.26 mm borders)');
  }
 }
 return out;
}

if(import.meta.url===pathToFileURL(process.argv[1]??'').href){
 const arg=process.argv[2];if(!arg)throw Error('usage: node pedagogy/house-style.mjs <project-id | file.json>');
 const file=fs.existsSync(arg)?arg:path.join('booklets','projects',arg+'.json');
 const project=JSON.parse(fs.readFileSync(file,'utf8')),found=houseStyleFindings(project);
 const by={};for(const f of found)(by[f.rule]??=[]).push(f);
 for(const [rule,list] of Object.entries(by)){console.log(`${rule}: ${list.length}`);for(const f of list)console.log(`  ${f.section} ${f.block}: ${f.detail}`);}
 console.log(found.length?`${found.length} finding${found.length===1?'':'s'} against docs/booklet-build-principles.md`:'No house-style findings.');
}
