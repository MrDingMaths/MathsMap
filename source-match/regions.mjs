// Source regions for teaching blocks (22 October 2026, user approved).
//
// A block points at whole source pages. This finds the part of those pages the block
// prints: the page's word boxes (PyMuPDF, through regions.py) are aligned to the
// block's text by an anchored longest-common-subsequence match over letters and
// digits, and the region is the matched words together with the drawings and pictures
// in their band. Confidence is the share of the block's characters matched in runs of
// four or more. Below 0.6, or with no text layer, the block needs the model "locate"
// fallback (run.mjs), which returns a box for the region.
//
//   node source-match/regions.mjs --project rates-v1 [--candidate FILE] [--out FILE] [--blocks a,b]
//
// Output: <run>/source-match/regions.json keyed by blockId, each entry bound to the
// block's content hash. Nothing in the project is changed.
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {isPractice} from '../src/lib/booklet-flow.js';
import {blockPlainText,normKey,classifyDrawings,sourceInk,hueClass} from '../src/lib/teaching-signature.js';
import {blockHash} from '../bench/fields.mjs';
import {canonicalRunDir} from '../first-pass/review.mjs';

export const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
// Version 2: outlier clusters 160 points apart, owned pictures and shapes, answer text excluded.
export const REGIONS_VERSION=2;
const read=file=>JSON.parse(fs.readFileSync(file,'utf8').replace(/^﻿/,''));
export const MIN_CONFIDENCE=.6;
const MIN_RUN=4;

// ---- which blocks, which pages, which PDF ---------------------------------------------------

export const teachingBlocks=project=>(project.sections??[]).filter(s=>s.phase!=='front-matter').flatMap(s=>(s.blocks??[]).map(block=>({block,section:s}))).filter(({block})=>!isPractice(block));
export function blockPages(block){
 const pages=[block.sourcePageNumber,...(block.sourceRefs??[]).map(ref=>ref.pageNumber)].filter(Number.isInteger);
 return [...new Set(pages)].sort((a,b)=>a-b);
}
export function sourceFiles(project,{root=ROOT}={}){
 const run=canonicalRunDir(project,{root});
 if(!run)return null;
 const pdf=path.join(run,'source','booklet.pdf');
 return {run,pdf:fs.existsSync(pdf)?pdf:null,pages:path.join(run,'evidence','pages')};
}

// ---- PDF access -------------------------------------------------------------------------------

const REGIONS_PY=path.join(path.dirname(fileURLToPath(import.meta.url)),'regions.py');
function python(args,{root=ROOT}={}){
 const run=spawnSync(process.env.BOOKLET_PDF_PYTHON??'python',['-I',REGIONS_PY,...args],{cwd:root,encoding:'utf8',maxBuffer:256*1024*1024,windowsHide:true});
 if(run.status!==0)throw Error('regions.py failed: '+(run.stderr||run.error?.message||'exit '+run.status).slice(0,400));
 return run.stdout;
}
export function readPages(pdf,pages,{root=ROOT}={}){
 if(!pages.length)return {};
 return JSON.parse(python(['words',pdf,...pages.map(String)],{root})).pages;
}
// A crop of the source page, as a PNG the model can be shown (millimetres of the page).
export function cropPage(pdf,page,box,out,{zoom=2,root=ROOT}={}){
 return JSON.parse(python(['crop',pdf,String(page),...box.map(String),out,String(zoom)],{root}));
}

// ---- alignment ----------------------------------------------------------------------------------

// Letters and digits of the page's words in reading order, each tied to its word.
function pageStream(words){
 const chars=[],wordOf=[];
 words.forEach((w,wi)=>{for(const ch of normKey(w.t)){chars.push(ch);wordOf.push(wi);}});
 return {chars,wordOf};
}
function gramSet(chars,k=5){const set=new Set();for(let i=0;i+k<=chars.length;i++)set.add(chars.slice(i,i+k).join(''));return set;}
// The stretch of the page that holds most of the block's 5-grams.
function pickWindow(block,page){
 const grams=gramSet(block),width=Math.min(page.length,Math.round(block.length*2+160));
 if(width>=page.length)return [0,page.length];
 const hit=new Uint8Array(page.length);
 for(let i=0;i+5<=page.length;i++)if(grams.has(page.slice(i,i+5).join('')))hit[i]=1;
 let sum=0,best=0,at=0;
 for(let i=0;i<page.length;i++){sum+=hit[i];if(i>=width)sum-=hit[i-width];if(sum>best){best=sum;at=Math.max(0,i-width+1);}}
 return [Math.max(0,at-40),Math.min(page.length,at+width+40)];
}
// LCS of two character arrays, keeping only runs of MIN_RUN or more.
export function lcsRuns(a,b,{minRun=MIN_RUN}={}){
 const n=a.length,m=b.length;if(!n||!m)return [];
 const w=m+1,table=new Uint16Array((n+1)*w);
 for(let i=1;i<=n;i++){
  const row=i*w,prev=(i-1)*w;
  for(let j=1;j<=m;j++)table[row+j]=a[i-1]===b[j-1]?table[prev+j-1]+1:Math.max(table[prev+j],table[row+j-1]);
 }
 const pairs=[];let i=n,j=m;
 while(i>0&&j>0){
  if(a[i-1]===b[j-1]){pairs.push([i-1,j-1]);i--;j--;}
  else if(table[(i-1)*w+j]>=table[i*w+j-1])i--;else j--;
 }
 pairs.reverse();
 // Keep a pair only inside a run of consecutive pairs of at least minRun.
 const kept=[];let start=0;
 for(let k=1;k<=pairs.length;k++){
  if(k===pairs.length||pairs[k][0]!==pairs[k-1][0]+1||pairs[k][1]!==pairs[k-1][1]+1){if(k-start>=minRun)kept.push(...pairs.slice(start,k));start=k;}
 }
 return kept;
}
// Align a block's text to one page's words, in up to three passes: a block whose parts
// the PDF stores in another order (columns) is matched part by part.
export function alignBlockText(text,words){
 const blockChars=[...normKey(text)],{chars,wordOf}=pageStream(words);
 const matchedBlock=new Uint8Array(blockChars.length),matchedPage=new Uint8Array(chars.length);
 let total=0;
 for(let pass=0;pass<3&&blockChars.length&&chars.length;pass++){
  const aIdx=[...blockChars.keys()].filter(i=>!matchedBlock[i]),bIdx=[...chars.keys()].filter(i=>!matchedPage[i]);
  if(aIdx.length<MIN_RUN||bIdx.length<MIN_RUN)break;
  const a=aIdx.map(i=>blockChars[i]),b=bIdx.map(i=>chars[i]),[from,to]=pickWindow(a,b);
  const pairs=lcsRuns(a,b.slice(from,to),{minRun:pass?6:MIN_RUN});
  if(!pairs.length)break;
  for(const [i,j] of pairs){matchedBlock[aIdx[i]]=1;matchedPage[bIdx[from+j]]=1;}
  const gained=pairs.length;total+=gained;
  if(gained<Math.max(MIN_RUN,.04*blockChars.length))break;
 }
 const perWord=new Map();
 for(let i=0;i<chars.length;i++)if(matchedPage[i])perWord.set(wordOf[i],(perWord.get(wordOf[i])??0)+1);
 const matchedWords=new Set();
 for(const [wi,count] of perWord)if(count>=Math.max(1,Math.ceil(normKey(words[wi].t).length*.5)))matchedWords.add(wi);
 return {confidence:blockChars.length?Math.min(1,total/blockChars.length):0,chars:blockChars.length,matchedChars:total,matchedWords};
}

// ---- regions ----------------------------------------------------------------------------------------

const PAGE_OFFSET_PT=1000;
const inside=(w,box,m=0)=>{const cx=(w.x0+w.x1)/2,cy=(w.y0+w.y1)/2;return cx>=box[0]-m&&cx<=box[2]+m&&cy>=box[1]-m&&cy<=box[3]+m;};
const overlap=(a,b)=>{const w=Math.min(a[2],b[2])-Math.max(a[0],b[0]),h=Math.min(a[3],b[3])-Math.max(a[1],b[1]);return w>0&&h>0?w*h:0;};

// Matched words that lie far from the rest are chance matches of a common word. Words in
// a vertical cluster (160 points from the rest, more than a worked answer space) holding under 15% of the matched letters are dropped.
export function dropOutliers(words,matched,{gapPt=160,share=.15}={}){
 const rows=[...matched].map(i=>({i,y0:words[i].y0,y1:words[i].y1,n:normKey(words[i].t).length})).sort((a,b)=>a.y0-b.y0);
 if(rows.length<2)return new Set(matched);
 const clusters=[];let top=-Infinity;
 for(const row of rows){
  if(!clusters.length||row.y0-top>gapPt)clusters.push([]);
  clusters.at(-1).push(row);top=Math.max(top,row.y1);
 }
 const total=rows.reduce((s,r)=>s+r.n,0),keep=new Set();
 const weight=c=>c.reduce((s,r)=>s+r.n,0),largest=Math.max(...clusters.map(weight));
 for(const c of clusters)if(weight(c)===largest||weight(c)>=share*total)for(const r of c)keep.add(r.i);
 return keep;
}
const letters=word=>normKey(word.t).length;
// A list number or a part label: kept even when the block text did not name it.
const markerLike=w=>/^(?:\d{1,2}|[a-z]|[ivxlc]{1,4})[.)]$/i.test(w.t)||w.b&&/^[a-z]$/i.test(w.t);

// Pictures and drawn shapes (arrows, polygons) near a block's words belong to the nearest
// block on the page, if one is within 40 points. Thin rules and frames are structure of the
// page, not content, and stay out.
const isShape=d=>d.items?.some(item=>['l','c','qu'].includes(item[0]))&&(d.rect[2]-d.rect[0]>1.5||d.rect[3]-d.rect[1]>1.5);
const gap=(a,b)=>Math.hypot(Math.max(a[0]-b[2],0,b[0]-a[2]),Math.max(a[1]-b[3],0,b[1]-a[3]));
export function ownItems(page,boxes,{reach=40}={}){
 const owned=new Map([...boxes.keys()].map(k=>[k,{images:new Set(),drawings:new Set()}])),grown=new Map([...boxes].map(([k,b])=>[k,[...b]]));
 const items=[...page.images.map((img,i)=>({rect:img.bbox,kind:'images',index:i})),...page.drawings.map((d,i)=>({rect:d.rect,kind:'drawings',index:i,ok:isShape(d)&&d.rect[2]-d.rect[0]<page.width*.8})).filter(x=>x.ok!==false)];
 const taken=new Set();
 // Each round gives an item to the nearest box within reach; boxes grow with what they take,
 // so a figure with an arrow beside it is taken in two rounds.
 for(let round=0;round<4;round++){
  let changed=false;
  for(const item of items){
   if(taken.has(item))continue;
   let best=null,bestGap=Infinity;
   for(const [key,box] of grown){const g=gap(item.rect,box);if(g<bestGap){bestGap=g;best=key;}}
   if(best==null||bestGap>reach)continue;
   owned.get(best)[item.kind].add(item.index);taken.add(item);changed=true;
   const box=grown.get(best);grown.set(best,[Math.min(box[0],item.rect[0]),Math.min(box[1],item.rect[1]),Math.max(box[2],item.rect[2]),Math.max(box[3],item.rect[3])]);
  }
  if(!changed)break;
 }
 return owned;
}

// What the signature reads from a region besides its words: the boxes of relation signs
// ("=", ":") and the arrows found in its drawings (points, from the page's top-left).
export function partExtras(words,drawings){
 return {
  relations:words.filter(w=>/^[=:≠≈<>≤≥]$/.test(w.t)).map(w=>({t:w.t,x0:w.x0,y0:w.y0,x1:w.x1,y1:w.y1})),
  arrows:classifyDrawings(drawings).arrows.map(a=>({kind:a.kind,start:a.start,end:a.end,heads:a.heads,curved:a.curved,colour:a.colour??null}))
 };
}

// The region of one block on one page: the matched words, the pictures and shapes it owns,
// the unclaimed words inside that box and just below it, and the rules and drawings in it.
// `claimed` holds the indexes of words matched by another block on the same page.
function regionOnPage(page,matchedWords,claimed,owned,{margin=14}={}){
 const {words,drawings,images}=page;
 // Small blue text is the printed answer in the corner of a question's cell; the student
 // edition does not show it, so it is not part of the region.
 const sizes=words.map(w=>w.s).filter(Boolean).sort((a,b)=>a-b),typical=sizes[sizes.length>>1]??11;
 const answerText=w=>w.s&&w.s<=.86*typical&&hueClass(w.c)==='blue';
 matchedWords=new Set([...matchedWords].filter(i=>!answerText(words[i])));
 const matched=[...matchedWords].map(i=>words[i]);
 if(!matched.length)return null;
 let box=[Math.min(...matched.map(w=>w.x0)),Math.min(...matched.map(w=>w.y0)),Math.max(...matched.map(w=>w.x1)),Math.max(...matched.map(w=>w.y1))];
 const grow=rect=>{box=[Math.min(box[0],rect[0]),Math.min(box[1],rect[1]),Math.max(box[2],rect[2]),Math.max(box[3],rect[3])];};
 for(const i of owned?.images??[])grow(images[i].bbox);
 for(const i of owned?.drawings??[])grow(drawings[i].rect);
 // Unclaimed words directly below the box (labels under a figure) extend it.
 for(let again=true,round=0;again&&round<4;round++){
  again=false;
  for(const [i,w] of words.entries()){
   if(matchedWords.has(i)||claimed.has(i)||w.y0>=page.height-50||w.y0<box[1]||w.y0>box[3]+14||w.y1<=box[3]||w.x0>box[2]+12||w.x1<box[0]-12)continue;
   grow([w.x0,w.y0,w.x1,w.y1]);again=true;
  }
 }
 // Words the block text did not predict are kept only when they carry no letters or digits (relation signs, brackets, dots, markers): the rest is answer text and pictures, which the printed question does not show.
 const keepWords=words.map((w,i)=>({w,i})).filter(({w,i})=>matchedWords.has(i)||!claimed.has(i)&&!answerText(w)&&(!normKey(w.t)||markerLike(w))&&inside(w,[box[0]-margin,box[1]-1,box[2]+margin,box[3]+1])&&w.y0<page.height-50);
 const around=[box[0]-6,box[1]-8,box[2]+6,box[3]+8];
 const keepDrawings=drawings.filter((d,i)=>(owned?.drawings.has(i)||overlap(d.rect,around)>0&&!isShape(d))&&!(d.rect[2]-d.rect[0]>page.width*.8));
 const figures=images.filter((img,i)=>owned?.images.has(i));
 return {box,words:keepWords.map(({w,i})=>({...w,i,m:matchedWords.has(i)})),drawings:keepDrawings,images:figures,arrowCount:classifyDrawings(keepDrawings).arrows.length};
}

// Regions for every named teaching block: {blockId:{blockHash,pages,confidence,...}}.
export function buildRegions(project,{pdf,blocks=null,root=ROOT,reuse={}}={}){
 const entries=teachingBlocks(project).filter(({block})=>!blocks||blocks.includes(block.id));
 const needPages=[...new Set(entries.flatMap(({block})=>blockPages(block)))];
 const pageData=readPages(pdf,needPages,{root});
 const out={},work=[];
 for(const {block} of entries){
  const hash=blockHash(block),prior=reuse[block.id];
  // A region the model located does not depend on the alignment, so a newer algorithm keeps it.
  if(prior&&prior.blockHash===hash&&(prior.version===REGIONS_VERSION||prior.located)){out[block.id]=prior;continue;}
  const text=blockPlainText(block),pages=blockPages(block).filter(n=>pageData[n]);
  const entry={version:REGIONS_VERSION,blockId:block.id,blockHash:hash,pages,text:text.slice(0,400),textLayer:pages.some(n=>pageData[n].textLayer),confidence:0,needsLocate:false,reason:null,parts:[]};
  out[block.id]=entry;
  if(!pages.length){entry.needsLocate=true;entry.reason='no source page';continue;}
  const chars=normKey(text).length;
  if(!chars){entry.needsLocate=true;entry.reason=entry.textLayer?'figure-only block: no text to align':'no text layer';continue;}
  work.push({entry,text,chars,pages,alignments:pages.map(n=>({page:n,...alignBlockText(text,pageData[n].words)}))});
 }
 // A word matched by two blocks of one page belongs to the one that matched more of its text.
 const owner=new Map();
 for(const w of work)for(const a of w.alignments){
  a.score=a.matchedChars/Math.max(1,w.chars);
  for(const i of a.matchedWords){const key=a.page+':'+i,held=owner.get(key);if(!held||a.score>held.score)owner.set(key,{score:a.score,entry:w.entry});}
 }
 // Each block's matched words on each page, then the pictures and shapes nearest to them.
 const kept=new Map(),boxes=new Map();
 for(const w of work)for(const a of w.alignments){
  const page=pageData[a.page],mine=new Set([...a.matchedWords].filter(i=>owner.get(a.page+':'+i)?.entry===w.entry)),keep=dropOutliers(page.words,mine);
  kept.set(w.entry.blockId+':'+a.page,keep);
  if(keep.size){const ws=[...keep].map(i=>page.words[i]);(boxes.get(a.page)??boxes.set(a.page,new Map()).get(a.page)).set(w.entry.blockId,[Math.min(...ws.map(x=>x.x0)),Math.min(...ws.map(x=>x.y0)),Math.max(...ws.map(x=>x.x1)),Math.max(...ws.map(x=>x.y1))]);}
 }
 const ownedByPage=new Map([...boxes].map(([n,map])=>[n,ownItems(pageData[n],map)]));
 for(const w of work){
  const parts=[];let matchedLetters=0;
  w.alignments.forEach((a,k)=>{
   const page=pageData[a.page],keep=kept.get(w.entry.blockId+':'+a.page);
   const claimed=new Set([...owner].filter(([key,v])=>key.startsWith(a.page+':')&&v.entry!==w.entry).map(([key])=>Number(key.split(':')[1])));
   const region=regionOnPage(page,keep,claimed,ownedByPage.get(a.page)?.get(w.entry.blockId));
   if(!region)return;
   const letterCount=[...keep].reduce((s,i)=>s+letters(page.words[i]),0);
   matchedLetters+=letterCount;
   parts.push({page:a.page,pageIndex:k,confidence:Math.min(1,letterCount/w.chars),...region,width:page.width,height:page.height});
  });
  w.entry.confidence=Math.round(Math.min(1,matchedLetters/w.chars)*1000)/1000;
  w.entry.parts=parts.map(({page,pageIndex,confidence,box,words,drawings,images,width,height})=>({page,pageIndex,confidence:Math.round(confidence*1000)/1000,box:box.map(v=>Math.round(v*100)/100),width,height,words,drawings,images,...partExtras(words,drawings)}));
  if(w.entry.confidence<MIN_CONFIDENCE){w.entry.needsLocate=true;w.entry.reason=`matched ${Math.round(w.entry.confidence*100)}% of the block text`;}
 }
 return out;
}

// A region from the box the locate step returned (fractions of the page), for a block whose
// text could not be aligned. Every word, drawing and picture inside the box belongs to it.
export function regionFromBox(page,box){
 const rect=[box[0]*page.width,box[1]*page.height,box[2]*page.width,box[3]*page.height];
 const area=r=>(r[2]-r[0])*(r[3]-r[1]);
 return {
  box:rect.map(v=>Math.round(v*100)/100),
  words:page.words.map((w,i)=>({...w,i,m:true})).filter(w=>inside(w,rect)&&w.y0<page.height-50),
  drawings:page.drawings.filter(d=>overlap(d.rect,rect)>0&&!(d.rect[2]-d.rect[0]>page.width*.8)),
  images:page.images.filter(img=>overlap(img.bbox,rect)>.3*Math.min(area(img.bbox),area(rect)))
 };
}
export function locatedEntry(entry,page,pageNumber,box){
 const part=regionFromBox(page,box);
 return {...entry,located:true,needsLocate:false,reason:null,confidence:Math.max(entry.confidence??0,.6),
  parts:[{page:pageNumber,pageIndex:0,confidence:1,...part,...partExtras(part.words,part.drawings),width:page.width,height:page.height}]};
}

// Ink (millimetres) for a region, ready for fromSourceGeometry's signature builder.
// A block over several pages stacks its pages, 300 mm apart.
export function regionInk(entry){
 const stacked={words:[],drawings:[],images:[]};
 for(const part of entry.parts??[]){
  const dy=part.pageIndex*PAGE_OFFSET_PT;
  for(const w of part.words)stacked.words.push({...w,y0:w.y0+dy,y1:w.y1+dy,p:part.pageIndex});
  for(const d of part.drawings)stacked.drawings.push({...d,rect:[d.rect[0],d.rect[1]+dy,d.rect[2],d.rect[3]+dy],items:d.items.map(item=>shiftItem(item,dy))});
  for(const img of part.images)stacked.images.push({...img,bbox:[img.bbox[0],img.bbox[1]+dy,img.bbox[2],img.bbox[3]+dy]});
 }
 return sourceInk(stacked);
}
function shiftItem(item,dy){
 if(item[0]==='re')return [item[0],item[1],item[2]+dy,item[3],item[4]+dy];
 return [item[0],...item.slice(1).map(p=>[p[0],p[1]+dy])];
}

// The region as a crop box in points on its first page, with a little room.
export function regionCrop(entry,{pad=10}={}){
 const part=entry.parts?.[0];if(!part)return null;
 return {page:part.page,box:[Math.max(0,part.box[0]-pad),Math.max(0,part.box[1]-pad),Math.min(part.width,part.box[2]+pad),Math.min(part.height,part.box[3]+pad)]};
}

export function regionsFile(project,{root=ROOT,out=null}={}){
 if(out)return path.resolve(out);
 const files=sourceFiles(project,{root});
 return files?path.join(files.run,'source-match','regions.json'):null;
}
export function loadRegions(file){return file&&fs.existsSync(file)?read(file):{version:REGIONS_VERSION,blocks:{}};}
export function saveRegions(file,value){fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,JSON.stringify(value)+'\n');}

async function main(){
 const args=process.argv.slice(2),arg=(name,fallback)=>{const i=args.indexOf(name);return i<0?fallback:args[i+1];};
 const candidate=arg('--candidate'),id=arg('--project');
 if(!candidate&&!id)throw Error('Use --project ID or --candidate FILE');
 const project=candidate?read(candidate):read(path.join(ROOT,'booklets','projects',id+'.json'));
 const files=sourceFiles(project);
 if(!files?.pdf)throw Error('No source PDF for '+project.id);
 const file=regionsFile(project,{out:arg('--out')}),prior=loadRegions(file);
 const blocks=arg('--blocks')?.split(',')??null;
 const regions=buildRegions(project,{pdf:files.pdf,blocks,reuse:prior.blocks});
 saveRegions(file,{version:REGIONS_VERSION,projectId:project.id,pdf:path.relative(ROOT,files.pdf).replaceAll('\\','/'),builtAt:new Date().toISOString(),blocks:{...prior.blocks,...regions}});
 const rows=Object.values(regions);
 console.log(JSON.stringify({file,blocks:rows.length,confident:rows.filter(r=>!r.needsLocate).length,needsLocate:rows.filter(r=>r.needsLocate).map(r=>({id:r.blockId,confidence:r.confidence,reason:r.reason}))},null,1));
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href)await main();
