// Apply James's approved pedagogy audit v2 comments (6 November 2026).
// Nothing is applied until James has reviewed the comments and named them:
//   node pedagogy/review.mjs audit-v2 apply-comments --project ID --comments all|ID,ID [--dry-run]
//   node pedagogy/review.mjs audit-v2 apply-comments --project ID --verified [--dry-run]
// `all` means every open v2 comment; a comment James deleted is rejected and never applied.
// Each comment's change was drafted, solved and rated during the audit and stored in
// booklets/provenance/pedagogy-review/audit-v2/ID.proposals.json, so applying makes no
// drafting call. Questions whose content changes here are rated by Sonnet comparison.
// One page check, one revision-checked save; applied comments are resolved with what was
// done, and anything that cannot be applied is left open and listed.
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {inlinesFromSource,fromSource,toSource,visitDocument} from '../public/libs/maths-editor/document-model.mjs';
import {verifiedRating,practiceRatingBlocks} from '../scripts/booklet/reasoning-ratings.mjs';
import {nodesOf,teacherBlocks} from '../polish/guards.mjs';
import {COMMENT_KIND,callSonnet,splitByCap,auditView,anchorRefs,ladderFor,setComparisonRating,inFlight,recordFile,proposalsFile,appliedChecks} from './audit-v2.mjs';
import {MODEL,EFFORT,LIMITS,bookletIndex,scoreOf,contentFingerprint,deriveComparisonScore,boldTerm} from './audit-v2-plan.mjs';
import {ratingContract,validatePlacements} from './audit-v2-prompts.mjs';
import {canonicalRunDir} from './review.mjs';

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=file=>JSON.parse(fs.readFileSync(file,'utf8').replace(/^\uFEFF/,''));
const write=(file,value)=>{fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,typeof value==='string'?value:JSON.stringify(value,null,1)+'\n');};
const now=()=>new Date().toISOString();
const rel=file=>path.relative(ROOT,file).replaceAll('\\','/');
const isDoc=v=>v&&typeof v==='object'&&v.format&&Array.isArray(v.blocks);
const allBlocks=p=>p.sections.flatMap(s=>s.blocks??[]);
const findBlock=(p,id)=>{for(const s of p.sections){const i=(s.blocks??[]).findIndex(b=>b.id===id);if(i>=0)return {section:s,index:i,block:s.blocks[i]};}return null;};

// ---- theory text onto the existing document ------------------------------------------
// The replacement is in the editor's source text (toSource), the form the audit saw: blank
// lines between blocks, list items as "1. " or "- " lines (nested content indented), table
// rows as lines of tab-separated cells, line breaks as newlines. It is written onto the
// existing document so ids, lists, scaffold layouts, alignment, borders and cell colours are
// kept (8 November 2026), trying in turn:
//  1. line by line: when the replacement has as many lines and cells as the block's text,
//     each paragraph (in lists, layouts and table cells too) takes its own lines; an
//     unchanged paragraph is left exactly as it was;
//  2. paragraphs and lists rebuilt: when the block holds only paragraphs and plain lists,
//     the replacement may add, merge or drop paragraphs and list items, keeping the order
//     of lists; formatting is carried over by position.
// A table whose rows change, images, annotated equations, and coloured, underlined or
// linked text that the rewrite changes are left to James by hand, with the reason.
const LIST_MARK=/^(?:\d+[.)]|[-+*•◦▪])\s+/;
const TEXT_INLINES=new Set(['text','math','break','tab','cloze']);
const sourceTokens=text=>{const out=[];for(const line of String(text).replace(/\r/g,'').split('\n')){if(!line.trim())continue;line.split('\t').forEach((cell,i)=>out.push({text:cell,sep:i?'\t':'\n'}));}return out;};
const paragraphSource=p=>toSource({format:'maths-editor-document-v1',version:1,blocks:[{...p,id:'x'}]});
// A replaced part is written in the style of its siblings: when the stem gives the command ("Simplify these
// expressions.") and most siblings are bare maths, the draft's repeated verb and the stem's own tail are dropped.
// Simplifying Expressions p37 Q4a "Simplify 3n/8n." and Rates 1 Q2b "Convert 22 m/s to kilometres per hour."
// sat among bare siblings (8 November 2026).
const textOf=p=>typeof p==='string'?p:(()=>{try{return toSource(p);}catch{return '';}})();
// A rewrite that merges paragraphs removes ids the block's saved arrangement names; the page check then
// refuses the booklet ("missing-arrangement-ref"). Only the dangling items leave the arrangement, so the rest
// of the teacher's layout holds (Features of Quadratics 1 p4-teaching, Stage 5, 9 November 2026).
export const singlePartDraft=leaf=>!(leaf?.children??[]).length&&!!String(leaf?.answer?.short??'').trim();
export function pruneArrangement(candidate,block){
 const has=id=>JSON.stringify(block).includes(`"id":${JSON.stringify(id)}`);let removed=0;
 for(const host of [candidate.settings?.layoutOverrides?.blockLayouts,block.presentation?.layoutOverrides?.blockLayouts]){const lay=host?.[block.id];if(!lay)continue;
  (function walk(v){if(!v||typeof v!=='object')return;if(Array.isArray(v)){for(let i=v.length-1;i>=0;i--){const ref=v[i]?.ref;if(typeof ref==='string'&&ref.includes('#')&&!has(ref.split('#').pop())){v.splice(i,1);removed++;}}v.forEach(walk);return;}Object.values(v).forEach(walk);})(lay);}
 return removed;
}
// A block that holds one labelled part of a long lettered exercise ("vv" of Circle Geometry 2 p39, a group
// with a single part) keeps that shell when a duplicate replaces it: the new question goes into the part,
// which keeps its id and label. Replacing the whole block dropped the labels vv, hhh and vvv (Stage 5,
// 10 November 2026). Returns null when the old block is not such a shell or the new question has parts.
export function keepPartShell(old,src){
 const kids=old?.children??[];if(kids.length!==1||!String(kids[0].label??'').trim()||(src?.children??[]).length)return null;
 const part=kids[0],next=structuredClone(old);
 next.children=[{...Object.fromEntries(Object.entries(structuredClone(src)).filter(([k])=>!['id','type','label','layout','columns'].includes(k))),id:part.id,type:part.type??'part',label:part.label}];
 return next;
}
export function bareLikeSiblings(prompt,stem,siblings,{figure=false}={}){
 const stemText=textOf(stem).trim(),verb=/^\s*([A-Z][a-z]+)\s+/.exec(textOf(prompt))?.[1];
 // Siblings that are figures alone under a whole instruction stem: a replaced part with its own figure whose one
 // sentence only restates the stem ("Find the equation of this line using an appropriate method." under "Find the
 // equation of these lines using an appropriate method.") prints its figure alone too (General and Point-Gradient
 // Form p13-q2 d and f, Stage 5 batch 3, 10 November 2026). Every one of its words is the stem's, read with
 // this/these and singular/plural alike; a prompt holding maths keeps it.
 if(figure&&typeof prompt==='string'&&!/\$/.test(prompt)&&stemText){
  const ws=t=>(t.replace(/\$[^$]+\$/g,' ').toLowerCase().match(/[a-z]+/g)??[]).map(w=>w==='this'?'these':w==='that'?'those':w.replace(/s$/,''));
  const sw=new Set(ws(stemText)),restates=t=>{const pw=ws(t);return !/\$/.test(t)&&pw.length>=3&&pw.every(w=>sw.has(w));};
  // Siblings are bare figures, or replaced parts restating the stem the same way (both d and f there).
  const sib=siblings.map(x=>textOf(x).trim());if(restates(prompt)&&sib.some(x=>!x)&&sib.every(x=>!x||restates(x)))return '';}
 // A first line that is the stem's own sentence ("Evaluate, without using a calculator." then the maths on the
 // next line) goes when the siblings are bare (Negative Indices p16-q5 l, Stage 5, 9 November 2026).
 if(typeof prompt==='string'){const norm=s=>s.toLowerCase().replace(/[^a-z0-9]+/g,' ').trim(),lines=prompt.split(/\n+/),sib=siblings.map(textOf).filter(Boolean);
  if(lines.length>1&&norm(lines[0])&&norm(lines[0])===norm(stemText.split(/(?<=[.?!:])\s/)[0]??'')&&sib.length&&sib.filter(s=>/^\s*\$/.test(s)).length*2>=sib.length){const rest=lines.slice(1).join('\n').trim();if(/^\$/.test(rest)&&!/\n/.test(rest))return rest;}}
 // A stem that ends mid-phrase ("Work out the size of each exterior angle of a:") is completed by each part
 // ("Regular heptagon."). A part that repeats the phrase, under any verb ("Find the size of each exterior angle
 // of a regular 9-sided polygon."), keeps only its completion (Angle Sums of Polygons p17-q5 b i, Stage 5,
 // 10 November 2026). The repeated words are the stem's last three or more words, which no sibling repeats.
 if(typeof prompt==='string'&&/:\s*$/.test(stemText)){const words=stemText.replace(/:\s*$/,'').split(/\s+/),sib=siblings.map(textOf).filter(Boolean),low=prompt.toLowerCase();
  for(let k=1;k<=words.length-3;k++){const phrase=words.slice(k).join(' ').toLowerCase(),at=low.indexOf(phrase);if(at<0)continue;
   if(sib.some(s=>s.toLowerCase().includes(phrase)))break;
   const rest=prompt.slice(at+phrase.length).trim();if(rest&&!/\n/.test(rest))return rest[0].toUpperCase()+rest.slice(1);break;}}
 // A part that restates the stem's words around its one item ("Find the reference angle, or related angle, of
 // the angle of inclination $\theta=130^\circ$." under "Find the reference angle, or related angle, of these
 // angles of inclination." beside bare "$\theta=160^\circ$") keeps only that item, when siblings are bare maths,
 // at least four in five of its words are the stem's, and one maths span is left once those the stem already
 // shows ("$0^\circ\le\theta<360^\circ$") are set aside (Circle Trigonometry 1 Exercises 4 and 6, Stage 5,
 // 10 November 2026).
 // A part whose later lines repeat the stem's later lines word for word ("Sketch the circle $(x+3)^2+y^2=9$.\nLabel
 // the coordinates of the centre and intercepts, if any. Check your sketch using DESMOS." under "Sketch the following
 // circles.\nLabel the coordinates …") drops them, and its first line is read by the rules below (Further Non-linear
 // Relationships 1 Exercise 5 Q3a, Stage 5, 10 November 2026). Lines of three or more words only.
 if(typeof prompt==='string'&&/\n/.test(prompt.trim())){const norm=s=>s.toLowerCase().replace(/[^a-z0-9]+/g,' ').trim(),stemNorm=' '+norm(stemText)+' ';
  const lines=prompt.trim().split(/\n+/),kept=lines.filter((l,i)=>i===0||!(norm(l).split(' ').length>=3&&stemNorm.includes(' '+norm(l)+' ')));
  if(kept.length===1&&kept.length<lines.length){const once=bareLikeSiblings(kept[0],stem,siblings);if(once!==kept[0])return once;}}
 if(typeof prompt==='string'&&!/\n/.test(prompt.trim())){const sib=siblings.map(textOf).filter(Boolean),stemMaths=new Set((stemText.match(/\$[^$]+\$/g)??[]).map(m=>m.replace(/\s/g,'')));
  const spans=(prompt.match(/\$[^$]+\$/g)??[]).filter(m=>!stemMaths.has(m.replace(/\s/g,''))),words=prompt.replace(/\$[^$]+\$/g,' ').toLowerCase().match(/[a-z]+/g)??[];
  const stemWords=new Set((stemText.replace(/\$[^$]+\$/g,' ').toLowerCase().match(/[a-z]+/g)??[]).flatMap(w=>[w,w.replace(/s$/,'')]));
  if(spans.length===1&&words.length>=3&&words.filter(w=>stemWords.has(w)||stemWords.has(w.replace(/s$/,''))).length*5>=words.length*4&&sib.length&&sib.filter(s=>/^\s*\$[^$]+\$\s*\.?\s*$/.test(s)).length*2>=sib.length)return spans[0];
  // The stem's opening words and its closing words around the items ("Find the distance between $(0,0)$ and
  // $(6,-8)$ without drawing the interval. Answer in exact form." under "Find the distance between each pair of
  // points without drawing the interval. Answer in exact form.") go when three or more words match at each end
  // that has them and the rest starts with maths, as the siblings do (Coordinate Geometry Formulas, 10 November 2026).
  const norm=s=>s.toLowerCase().replace(/[^a-z0-9]+/g,' ').trim(),pw=prompt.split(/(\s+)/),stemNorm=norm(stemText).split(' ');
  const firstMath=prompt.indexOf('$');
  if(firstMath>0&&sib.length&&sib.filter(s=>/^\s*\$/.test(s)).length*2>=sib.length){
   const head=norm(prompt.slice(0,firstMath)).split(' ').filter(Boolean);let k=0;while(k<head.length&&head[k]===stemNorm[k])k++;
   if(k===head.length&&k>=3){let rest=prompt.slice(firstMath);const lastMath=rest.lastIndexOf('$'),tail=norm(rest.slice(lastMath+1)).split(' ').filter(Boolean);
    let j=0;while(j<tail.length&&tail[tail.length-1-j]===stemNorm[stemNorm.length-1-j])j++;
    if(!tail.length||(j===tail.length&&j>=3)){rest=rest.slice(0,lastMath+1).trim();if(/^\$/.test(rest))return rest;}}}}
 // The verb may be any command in the stem's first sentence: "Add and subtract these fractions." covers a
 // drafted "Subtract these fractions. $…$" (Algebraic Fractions p5-q1 e, Stage 5, 9 November 2026).
 const stemCommand=stemText.split(/[.?!:]/)[0]??'';
 if(!verb||!new RegExp('^'+verb+'\\b','i').test(stemText)&&!new RegExp('^[^$]*\\b'+verb+'\\b','i').test(stemCommand))return prompt;
 const sib=siblings.map(textOf).filter(Boolean);if(!sib.length)return prompt;
 const bare=sib.filter(s=>!/^\s*[A-Za-z]{3,}\s/.test(s)||/^\s*\$/.test(s)).length;
 if(bare*2<sib.length)return prompt;
 const trim=s=>{
  // A whole instruction sentence before the maths ("Subtract these fractions. $…$") goes.
  const sentence=new RegExp('^\\s*'+verb+'\\b[^$.\\n]*\\.[ \\t]*(?=\\$)').exec(s);if(sentence)return s.slice(sentence[0].length).replace(/(\$)\s*\.\s*$/,'$1').trim();
  let t=s.replace(new RegExp('^\\s*'+verb+'\\s+'),'');
  // The stem's own tail ("… to kilometres per hour") is not repeated.
  const tail=/\s(to|as|in)\s[^.$]+\.?\s*$/.exec(t);if(tail&&stemText.toLowerCase().includes(tail[0].trim().replace(/\.$/,'').toLowerCase()))t=t.slice(0,tail.index);
  return t.replace(/(\$)\s*\.\s*$/,'$1').trim();};
 // Only a command over maths is trimmed: "Find the unknown value …" keeps its words (Comparing Fractions).
 if(typeof prompt==='string'){const t=trim(prompt);return /^\$/.test(t)&&!/\n/.test(t)?t:prompt;}
 const copy=structuredClone(prompt);
 // A leading paragraph of words alone that repeats the stem's command ("Decide what goes in the blank to make
 // the following true." over a bare equation) goes (Expanding Expressions p7-q5 b, Stage 5, 9 November 2026).
 let shifted=false;
 {const first=copy?.blocks?.[0],words=first?.type==='paragraph'&&(first.inlines??[]).every(x=>x.type==='text')?(first.inlines??[]).map(x=>x.text).join('').trim():'';
  if(words&&(copy.blocks.length>1)&&new RegExp('^'+verb+'\\b').test(words)&&/[.:]$/.test(words)){copy.blocks.shift();shifted=true;}}
 const paras=(copy?.blocks??[]).filter(b=>b.type==='paragraph');
 if(paras.length!==1)return shifted?copy:prompt;
 const inl=paras[0].inlines??[],first=inl[0];if(first?.type!=='text'||!new RegExp('^\\s*'+verb+'\\s+').test(first.text))return shifted?copy:prompt;
 first.text=new RegExp('^\\s*'+verb+'\\b[^.]*\\.\\s*$').test(first.text)?'':first.text.replace(new RegExp('^\\s*'+verb+'\\s+'),'');
 if(first.text.trim()||inl[1]?.type!=='math')return prompt;
 const last=inl.at(-1);if(last?.type==='text'&&/^\s*\.\s*$/.test(last.text)&&inl.at(-2)?.type==='math')inl.pop();
 if(!first.text)inl.shift();
 return copy;
}
// Colour, underline and links survive a rewrite when the styled text is still there word for
// word (the orange "⚠ " of a caution note); otherwise the paragraph is left to James.
const styled=n=>n.type==='text'&&(n.colour||n.href||(n.marks??[]).includes('underline'));
function carryStyles(old,fresh){
 if(old.some(n=>!TEXT_INLINES.has(n.type)||n.semanticRole))return null;
 const used=new Set();
 for(const o of old.filter(styled)){
  const i=fresh.findIndex((n,k)=>!used.has(k)&&n.type==='text'&&n.text===o.text);if(i<0)return null;used.add(i);
  fresh[i]={...fresh[i],...(o.colour?{colour:o.colour}:{}),...(o.href?{href:o.href}:{}),...((o.marks??[]).includes('underline')?{marks:[...new Set([...(fresh[i].marks??[]),'underline'])]}:{})};
 }
 return fresh;
}
const words=t=>new Set(String(t).toLowerCase().match(/[a-z0-9]+/g)??[]);
const likeness=(a,b)=>{const x=words(a),y=words(b);if(!x.size||!y.size)return 0;let n=0;for(const w of x)if(y.has(w))n++;return n/Math.max(x.size,y.size);};
function textHost(block,nodeId){
 // The block's own document, else (worked examples, cloze groups) its student-facing
 // documents, never answers or diagrams. A plain-string prompt is written only when the block
 // has no document (an empty group prompt is not the passage: writing there printed it twice).
 const docs=[],skip=new Set(['answer','solution','solutions','worked','theorySolution','solutionDiagrams','questionDiagrams','diagrams','sourceReview','classification','studio']);
 const walk=v=>{if(!v||typeof v!=='object')return;if(isDoc(v)){docs.push(v);return;}for(const [k,c]of Object.entries(v))if(!skip.has(k))walk(c);};
 if(isDoc(block.content))docs.push(block.content);else walk(block);
 // A node id names the part rewritten: its document, or one paragraph of it.
 if(nodeId)for(const d of docs){let node=null;visitDocument(d,n=>{if(n.id===nodeId)node=n;});if(node)return node.type==='paragraph'&&d.blocks.length>1?{docs:[d],paragraph:node}:{docs:[d]};}
 if(docs.length)return {docs};
 if(typeof block.content?.prompt==='string'&&block.content.prompt.trim())return {string:true};
 return {error:'the block has no editable text document'};
}
function leavesOf(doc){
 const out=[];let bad=null;
 const walk=(nodes,inItem=false)=>nodes.forEach((n,i)=>{
  if(n.type==='paragraph')out.push({node:n,listFirst:inItem&&i===0});
  else if(n.type==='list')n.items.forEach(item=>walk(item.blocks,true));
  else if(n.type==='table')n.rows.flat().forEach(c=>walk(c.blocks??[]));
  else if(n.type==='layout')(n.slots??[]).forEach(s=>walk(s.blocks??[]));
  else if(n.type==='image')out.push({node:n,image:true});
  else if(n.type!=='spacer')bad??=`a ${n.type==='annotated-equation'?'annotated equation':n.type} in the block`;});
 walk(doc.blocks);return {leaves:out,bad};
}
// Whether the apply can place a rewrite of this teaching block (11 November 2026: 77 confirmed Stage 5 rewrites
// stayed comments). Not rewritable: no editable text document, or every text document holds an annotated equation or
// another block that cannot be rewritten. Lines: the lines and table cells a line-by-line rewrite must keep.
export function theoryEditable(block){
 const host=textHost(block,null);
 if(host.error)return {rewritable:false,why:'no editable text'};
 if(host.string)return {rewritable:true};
 const ok=host.docs.map(d=>({d,...leavesOf(d)})).filter(x=>!x.bad);
 if(!ok.length)return {rewritable:false,why:leavesOf(host.docs[0]).bad};
 if(ok.every(x=>x.leaves.length&&x.leaves.every(l=>l.image)))return {rewritable:false,why:'text in an image'};
 return {rewritable:true,lines:ok.length===1?sourceTokens(toSource(ok[0].d)).length:null};
}
function byLines(doc,replacement){
 const {leaves,bad}=leavesOf(doc);if(bad)return {error:bad+' cannot be rewritten automatically'};
 const want=sourceTokens(toSource(doc)),counts=leaves.map(l=>sourceTokens(paragraphSource(l.node)).length);
 if(counts.reduce((a,b)=>a+b,0)!==want.length)return {error:'the block text does not map onto its paragraphs'};
 const got=sourceTokens(replacement);if(got.length!==want.length)return {error:`the replacement has ${got.length} lines and cells, the block ${want.length}`};
 let at=0;
 for(const [i,leaf]of leaves.entries()){
  const mine=got.slice(at,at+counts[i]);at+=counts[i];if(!mine.length)continue;
  const text=mine.map((t,k)=>(k?t.sep:'')+(k===0&&leaf.listFirst?t.text.trim().replace(LIST_MARK,''):t.text.trim())).join('');
  if(text===paragraphSource(leaf.node).replace(/\n[ \t]+/g,'\n').trim())continue;
  if(leaf.image)return {error:`the rewrite changes image ${leaf.node.id}`};
  const inlines=carryStyles(leaf.node.inlines??[],inlinesFromSource(text));
  if(!inlines)return {error:`paragraph ${leaf.node.id} has image text, or coloured, underlined or linked text the rewrite changes`};
  leaf.node.inlines=inlines;
 }
 return {ok:true};
}
function rebuild(doc,replacement,blockId){
 const top=doc.blocks;
 const simpleList=b=>b.type==='list'&&b.items.every(it=>it.blocks.length===1&&it.blocks[0].type==='paragraph');
 if(!top.every(b=>b.type==='paragraph'||simpleList(b)))return {error:'the block structure changes and it holds more than paragraphs and plain lists'};
 const fresh=fromSource(String(replacement).replace(/\r/g,'')).blocks;
 if(!fresh.every(b=>b.type==='paragraph'||b.type==='list'&&b.items.every(it=>it.blocks.every(x=>x.type==='paragraph'))))return {error:'the replacement adds a table or nested list'};
 const kinds=bs=>bs.filter(b=>b.type==='list').map(b=>b.ordered?'ol':'ul').join(',');
 if(kinds(fresh)!==kinds(top))return {error:"the replacement changes the block's lists"};
 const keep=({id,type,inlines,items,...rest})=>rest;let n=0,bad=null;
 const nextId=()=>`${blockId}-v2-${++n}`;
 // Paragraphs: one whose text is unchanged is kept whole; a changed one takes the formatting
 // and id of the next unused old paragraph (or the last one, for an added paragraph).
 const place=(olds,news)=>{const free=olds.map(()=>true),out=[];
  const exact=news.map(p=>{const src=paragraphSource(p);const j=olds.findIndex((o,k)=>free[k]&&paragraphSource(o)===src);if(j>=0)free[j]=false;return j;});
  news.forEach((p,i)=>{if(exact[i]>=0){out.push(olds[exact[i]]);return;}
   const j=free.indexOf(true),old=j>=0?olds[j]:olds.at(-1);if(j>=0)free[j]=false;
   const inlines=old?carryStyles(old.inlines??[],p.inlines):p.inlines;if(!inlines){bad??=`paragraph ${old.id} has image text, or coloured, underlined or linked text the rewrite changes`;return;}
   out.push({...(old?keep(old):{}),id:j>=0?old.id:nextId(),type:'paragraph',inlines});});
  return out;};
 const paras=place(top.filter(b=>b.type==='paragraph'),fresh.filter(b=>b.type==='paragraph'));
 const oldLists=top.filter(b=>b.type==='list');let p=0,l=0;
 const blocks=fresh.map(b=>{
  if(b.type==='paragraph')return paras[p++];
  const old=oldLists[l++],items=place(old.items.map(it=>it.blocks[0]),b.items.map(it=>it.blocks[0]));
  return {...keep(old),id:old.id,type:'list',ordered:b.ordered,start:b.start,items:items.map((para,k)=>({id:old.items.find(it=>it.blocks[0]===para||it.blocks[0].id===para?.id)?.id??nextId(),type:'list-item',blocks:[para]}))};
 });
 if(bad)return {error:bad};
 doc.blocks=blocks;return {ok:true};
}
export function theoryOnto(block,replacement,{nodeId=null}={}){
 const copy=structuredClone(block),host=textHost(copy,nodeId);
 if(host.error)return {error:host.error};
 if(host.string){copy.content.prompt=String(replacement);return {block:copy};}
 if(host.paragraph){
  if(String(replacement).replace(/\r/g,'').split(/\n[ \t]*\n/).filter(c=>c.trim()).length>1)return {error:`the rewrite of paragraph ${host.paragraph.id} has several paragraphs`};
  const inlines=carryStyles(host.paragraph.inlines??[],inlinesFromSource(String(replacement).trim()));
  if(!inlines)return {error:`paragraph ${host.paragraph.id} has image text, or coloured, underlined or linked text the rewrite changes`};
  host.paragraph.inlines=inlines;return {block:copy};
 }
 // Several documents and no node id (payloads before 8 November): the document whose text is
 // clearly closest to the rewrite; failing that, the only one that fits, if its text is close.
 let docs=host.docs;const multi=docs.length>1;
 if(multi){const ranked=docs.map(doc=>({doc,like:likeness(toSource(doc),replacement)})).sort((a,b)=>b.like-a.like);
  if(ranked[0].like>=0.4&&ranked[0].like-ranked[1].like>=0.15)docs=[ranked[0].doc];}
 const errors=[];
 for(const [name,fit]of [['lines',byLines],['rebuild',(d,r)=>rebuild(d,r,block.id)]]){
  const tries=docs.map(doc=>{const work=structuredClone(doc);return {doc,work,r:fit(work,replacement),like:likeness(toSource(doc),replacement)};});
  const ok=tries.filter(t=>t.r.ok).sort((a,b)=>b.like-a.like);
  if(ok.length===1&&(docs.length===1||ok[0].like>=0.3)||ok.length>1&&ok[0].like>=0.4&&ok[0].like-ok[1].like>=0.2){ok[0].doc.blocks=ok[0].work.blocks;return {block:copy};}
  if(ok.length>1)return {error:`the rewrite fits ${ok.length} of the block's text documents and does not say which`};
  errors.push(tries.length===1?tries[0].r.error:`no text document fits (${name})`);
 }
 return {error:errors.join('; ')};
}

// ---- placing new blocks ------------------------------------------------------------------
function challengeSection(p){
 let ch=p.sections.find(s=>s.phase==='practice'&&s.role==='challenge');
 if(!ch){ch={id:p.id+'-challenge',topicId:'challenge',title:'Challenge exercise',phase:'practice',role:'challenge',workingSpace:'none',blocks:[]};p.sections.push(ch);p.topics??=[];if(!p.topics.some(t=>t.id==='challenge'))p.topics.push({id:'challenge',title:'Challenge exercise'});}
 return ch;
}
// The topic's opening Review box: appended to an existing review group at the start of
// the topic, otherwise a new group at the start of the topic's first section.
function addToReview(p,topicId,block){
 const sections=p.sections.filter(s=>s.topicId===topicId&&s.phase!=='front-matter');
 if(!sections.length)return 'topic '+topicId+' not found';
 // The existing Review box may sit in the second section, after a heading-only one (Area 1,
 // 8 November 2026: appending to the first section printed a second Review box).
 const first=sections.find(s=>s.blocks?.[0]?.sourceAtom?.kind==='review')??sections.find(s=>(s.blocks??[]).length)??sections[0],blocks=first.blocks??=[];
 let end=0;while(end<blocks.length&&blocks[end].sourceAtom?.kind==='review')end++;
 const atom=end?blocks[end-1].sourceAtom:{id:topicId+'-v2-review',kind:'review',label:'Review',order:0};
 blocks.splice(end,0,{...block,pedagogyRole:'review',sourceAtom:atom});
 return null;
}

// ---- one Sonnet comparison call for questions changed here --------------------------
export async function rateChanged(ctx,candidate,ids,root){
 if(!ids.length)return [];
 const rows=bookletIndex(candidate),exclude=new Set(ids),anchors=anchorRefs(root),refIds=new Set();
 const items=ids.map(id=>{const r=rows.find(x=>x.block.id===id);const ladder=ladderFor(candidate,{sectionId:r.section.id,topicId:r.section.topicId,exclude});ladder.forEach(x=>refIds.add(x));return {id,ladder:[...ladder,...anchors.map(a=>a.ref)],task:auditView(r.block)};});
 const blocks=new Map(rows.map(r=>[r.block.id,r.block])),refs=new Map([...anchors.map(a=>[a.ref,a.score]),...[...refIds].map(id=>[id,scoreOf(blocks.get(id))])]);
 const system=ratingContract()+'\n\nStanding anchors:\n'+anchors.map(a=>JSON.stringify(a)).join('\n');
 // An over-cap batch is halved; a question over the cap on its own stays unrated (score null) and the apply continues.
 const ratingPrompt=(list,trim)=>{const used=new Set(list.flatMap(i=>i.ladder));return JSON.stringify({references:[...refIds].filter(id=>!trim||used.has(id)).map(id=>({ref:id,score:scoreOf(blocks.get(id)),task:auditView(blocks.get(id))})),targets:list});};
 const whole=system.length+ratingPrompt(items,false).length<=LIMITS.promptCharacters;
 const parts=await splitByCap(items,list=>system.length+ratingPrompt(list,!whole).length,list=>callSonnet(ctx,{stage:'rating',system,prompt:ratingPrompt(list,!whole),validate:r=>validatePlacements(r,list.map(i=>i.id))}));
 const value=new Map(parts.flatMap(p=>p.value?[...p.value.value]:[])),fileOf=new Map(parts.filter(p=>p.value).flatMap(p=>p.items.map(i=>[i.id,p.value.file])));
 return items.map(it=>{const p=value.get(it.id),file=fileOf.get(it.id);if(!p)return {id:it.id,score:null,how:'over the prompt cap',harderThan:null,easierThan:null};const d=deriveComparisonScore(p,refs);if(d.score!=null)setComparisonRating(blocks.get(it.id),d.score,p,refs,file);return {id:it.id,score:d.score,how:d.how,harderThan:p?.harderThan??null,easierThan:p?.easierThan??null};});
}

// ---- the command ----------------------------------------------------------------------------
// auto (8 November 2026, James): verified findings are applied by the audit's own --apply, on the
// run's candidate (`candidateIn`), using only payloads marked autoApply. Their comments stay open,
// marked "Applied automatically", for James to review; the caller renders and saves once.
// verified (8 November 2026, James): the same on a live booklet audited before automatic
// application existed (the pilots). Payloads without an autoApply mark get one by the audit's
// rule: a verified comment's insert, review, theory or replacement, not on a teacher-protected
// block. One render and one save; the comments stay open, marked "Applied automatically".
const AUTO_OPS=new Set(['insert','review','theory','replace-node','teaching']);
const isKeyIdeas=b=>b?.pedagogyRole==='key-ideas'||b?.sourceAtom?.kind==='key-ideas';
// Maths in a new block that the booklet renderer cannot set (Data Analysis 2 j4: \multicolumn, which KaTeX
// lacks, failed the whole booklet's page check, 8 November 2026). Uses the app's own renderer.
let renderMathFn=null;
async function mathFailures(blocks){
 renderMathFn??=(await import('../src/lib/render-math.js')).renderMath;const bad=[];
 const test=s=>{if(/\$/.test(s)&&renderMathFn(s).includes('katex-error'))bad.push(s.slice(0,120));};
 (function walk(x,key){if(typeof x==='string'){if(['prompt','short','worked','text'].includes(key))test(x);return;}if(!x||typeof x!=='object')return;
  if(key==='questionDiagrams')return;if((x.type==='math'||x.type==='annotated-equation')&&typeof x.latex==='string')test('$'+x.latex+'$');
  for(const [k,v]of Object.entries(x))walk(v,Array.isArray(x)?key:k);})(blocks,'');
 return bad;}
// Prompt strings of a question block, and the share of the old text's words a rewrite keeps.
const docText=d=>{const out=[];(function walk(x){if(!x||typeof x!=='object')return;if(typeof x.text==='string')out.push(x.text);for(const v of Object.values(x))walk(v);})(d);return out.join(' ');};
const questionPromptsOf=b=>{const out=[];(function walk(n){if(!n||typeof n!=='object')return;const t=typeof n.prompt==='string'?n.prompt:n.prompt&&typeof n.prompt==='object'?docText(n.prompt):'';if(t.trim())out.push(t);for(const c of n.children??[])walk(c);})(b.content);return out;};
const wordsOf=s=>new Set(String(s).toLowerCase().replace(/\$\$[\s\S]*?\$\$/g,' ').replace(/\$[^$]*\$/g,' ').match(/[a-z]{3,}/g)??[]);
const wordOverlap=(old,next)=>{const a=wordsOf(old),b=wordsOf(next);if(!a.size)return 0;let k=0;for(const w of a)if(b.has(w))k++;return k/a.size;};
// A sibling takes a rewrite only when its own words (maths aside) resemble it (Volume p19, 8 November 2026).
export function siblingRewriteFits(content,replacement){
 const was=(()=>{try{return (typeof content==='string'?content:toSource(content)).replace(/\$\$[\s\S]*?\$\$|\$[^$]*\$/g,' ');}catch{return '';}})();
 return /[A-Za-z]{3}/.test(was)&&wordOverlap(was,replacement)>=0.3;
}
// Every question diagram in a content tree, in document order.
const diagramsIn=node=>{const out=[];(function walk(n){if(!n||typeof n!=='object')return;for(const d of n.questionDiagrams??[])out.push(d);for(const c of n.children??[])walk(c);})(node);return out;};
export async function applyComments({projectId,comments,dryRun=false,projectFile=null,proposals=null,root=ROOT,log=console.error,candidateIn=null,auto=false,workDir=null,verified=false}){
 if(verified)auto=true;
 if(!comments&&!auto)throw Error('apply-comments needs --comments all or a list of comment ids: comments are applied only after James has reviewed them');
 const liveFile=projectFile??path.join(root,'booklets','projects',projectId+'.json'),live=candidateIn??read(liveFile);
 const testOnly=!!projectFile||!!candidateIn;
 if(!testOnly){const busy=inFlight(live);if(busy.length)throw Error('Another import, review, export or repair is running: '+busy[0].slice(0,200));}
 const storeFile=proposals&&typeof proposals==='object'?null:proposals??proposalsFile(projectId,{root});
 const storeDoc=storeFile?read(storeFile):proposals,store=storeDoc.comments??{};
 if(verified){const guarded=teacherBlocks(live),flagOf=new Map((live.studio?.flags??[]).map(f=>[f.id,f]));
  for(const [id,entry]of Object.entries(store)){const f=flagOf.get(id);if(!f)continue;
   for(const p of entry.payloads??[])p.autoApply??=!/· unverified/.test(f.note)&&AUTO_OPS.has(p.op)&&!guarded.has(p.blockId??'')&&!(p.op==='theory'&&guarded.has(f.targetId));}}
 // A comment already applied automatically is never applied again.
 const open=(live.studio?.flags??[]).filter(f=>f.kind===COMMENT_KIND&&!f.resolved&&!f.autoApplied);
 const wanted=auto?open.filter(f=>store[f.id]?.payloads?.some(p=>p.autoApply&&!p.applied)):comments==='all'?open:open.filter(f=>String(comments).split(',').map(s=>s.trim()).includes(f.id));
 if(!auto&&comments!=='all'){const missing=String(comments).split(',').map(s=>s.trim()).filter(id=>!open.some(f=>f.id===id));if(missing.length)throw Error('Not open v2 comments (resolved, deleted, already applied or not v2): '+missing.join(', '));}
 const stamp=now().replace(/[-:]/g,'').replace(/\..*/,'').replace('T','-');
 const runDir=workDir??path.join(root,'.booklet-work','pedagogy-audit-v2',projectId,stamp+'-apply-comments');
 const ctx={workDir:runDir,runDir:candidateIn?canonicalRunDir(read(liveFile),{root}):testOnly?null:canonicalRunDir(live,{root}),calls:[],log,dryRun};
 const candidate=structuredClone(live),report={projectId,revision:live.revision,startedAt:now(),comments:comments,applied:[],manual:[],stale:[],ratings:[]};
 const changedHosts=new Set(),inserted=new Set(),resolutions=new Map(),teachingAnchor=new Map();
 const fpOf=id=>{const f=findBlock(candidate,id);return f?contentFingerprint(f.block):null;};
 const liveFp=id=>{const f=findBlock(live,id);return f?contentFingerprint(f.block):null;};
 // Content edits first, so inserts land next to the edited blocks.
 const order={'set-field':0,'replace-node':0,theory:0,bold:0,rating:1,insert:2,teaching:2,review:3};
 const work=[];
 for(const flag of wanted){const entry=store[flag.id];
  if(!entry?.payloads?.length){report.manual.push({comment:flag.id,kind:flag.findingKind,target:flag.targetId,reason:'no stored change: apply by hand'});continue;}
  for(const pay of entry.payloads){if(pay.applied||auto&&!pay.autoApply)continue;work.push({flag,pay});}}
 // Key ideas boxes are placed after new teaching, so they can follow it.
 const rank=w=>w.pay.op==='insert'&&isKeyIdeas(w.pay.block)?2.5:order[w.pay.op]??9;
 work.sort((a,b)=>rank(a)-rank(b));
 const failed=new Set();
 for(const {flag,pay}of work){
  const fail=reason=>{report.manual.push({comment:flag.id,kind:flag.findingKind,target:flag.targetId,op:pay.op,reason});failed.add(flag.id);};
  // A change taken out after a failed page check (applyAuditV2's one retry) stays a comment with its reason.
  if(pay.notApplied){fail(pay.notApplied);continue;}
  {const fresh=pay.op==='teaching'?pay.blocks:pay.op==='replace-node'?[pay.content]:(pay.op==='insert'||pay.op==='review')?[pay.block]:null;
   const bad=fresh?await mathFailures(fresh):[];if(bad.length){fail('its maths does not render in the booklet: '+bad[0]);continue;}}
  // A change to an existing block needs that block exactly as the audit saw it.
  if(pay.blockId&&pay.op!=='insert'&&pay.op!=='review'&&pay.targetFingerprint&&liveFp(pay.blockId)!==pay.targetFingerprint){report.stale.push({comment:flag.id,op:pay.op,block:pay.blockId,reason:'the block changed after the audit'});failed.add(flag.id);continue;}
  const done=text=>{resolutions.set(flag.id,[...(resolutions.get(flag.id)??[]),text]);report.applied.push({comment:flag.id,kind:flag.findingKind,op:pay.op,key:pay.key,what:text});};
  if(pay.op==='set-field'){const f=findBlock(candidate,pay.blockId);const node=f&&(nodesOf(f.block).find(n=>n.id===pay.nodeId)??(f.block.content?.id===pay.nodeId?f.block.content:null));
   if(!node){fail('node '+pay.nodeId+' not found');continue;}
   if(pay.field==='prompt')node.prompt=pay.value;else node.answer={...node.answer,[pay.field]:pay.value};
   changedHosts.add(pay.blockId);done(`${pay.field} of ${pay.nodeId} corrected.`);continue;}
  if(pay.op==='replace-node'){const f=findBlock(candidate,pay.blockId);if(!f){fail('block '+pay.blockId+' not found');continue;}
   const src=pay.content,leaf=(src.children??[]).length===1?src.children[0]:src;
   const whole=!pay.nodeIds.length||pay.nodeIds.includes(pay.blockId)||pay.nodeIds.includes(f.block.content?.id);
   if(whole){const oldDiagrams=diagramsIn(f.block.content),next=keepPartShell(f.block.content,src)??{...structuredClone(src),id:f.block.content?.id??src.id,label:f.block.content?.label??null};
    // A saved arrangement names the old question's diagrams (Area 2 p20-q5, 8 November 2026). With as
    // many new diagrams as old, each new one takes its predecessor's id so the arrangement holds;
    // otherwise the block's stale arrangement is dropped and the default layout is used.
    const newDiagrams=diagramsIn(next);
    if(oldDiagrams.length&&oldDiagrams.length===newDiagrams.length)newDiagrams.forEach((d,k)=>{d.id=oldDiagrams[k].id;});
    else if(oldDiagrams.length||newDiagrams.length)for(const host of [candidate.settings?.layoutOverrides?.blockLayouts,f.block.presentation?.layoutOverrides?.blockLayouts])if(host?.[pay.blockId])delete host[pay.blockId];
    // The old block's title names its source (Area 2 p20-q5: "2009 HSC Standard 2 Band 4"); the new question has none.
    // Any other id the arrangement names that the new question lacks (Data Analysis 3 p74-q5: prompt
    // documents and response space) drops the arrangement too.
    {const has=id=>JSON.stringify(next).includes(`"id":${JSON.stringify(id)}`);
     for(const host of [candidate.settings?.layoutOverrides?.blockLayouts,f.block.presentation?.layoutOverrides?.blockLayouts]){const lay=host?.[pay.blockId];if(!lay)continue;
      const refs=[];(function walk(x){if(!x||typeof x!=='object')return;if(typeof x.ref==='string')refs.push(x.ref);for(const v of Object.values(x))walk(v);})(lay);
      if(refs.some(r=>{const [base,rest]=r.split('/');const doc=(rest??'').split('#')[1];return !has(base)||(doc&&!has(doc));}))delete host[pay.blockId];}}
    f.block.content=next;delete f.block.title;f.block.classification={...f.block.classification,...pay.classification,primarySkillId:f.block.classification?.primarySkillId??pay.classification?.primarySkillId};changedHosts.add(pay.blockId);done(`${pay.blockId} replaced with a new question.`);continue;}
   // A part is replaced by one item with an answer. A draft of a whole question with several parts put its stem
   // on the part and emptied the answer (Index Laws index-t7-q5 a, Stage 5, 9 November 2026); it stays a comment.
   if(!singlePartDraft(leaf)){fail('the draft is not a single part with an answer, so it cannot replace '+pay.nodeIds.join(', '));continue;}
   let ok=true;for(const nodeId of pay.nodeIds){const node=nodesOf(f.block).find(n=>n.id===nodeId);if(!node){ok=false;break;}const before=node.prompt;
    const parent=nodesOf(f.block).find(n=>(n.children??[]).some(c=>c.id===nodeId));
    node.prompt=bareLikeSiblings(leaf.prompt,parent?.prompt,(parent?.children??[]).filter(c=>c.id!==nodeId).map(c=>c.prompt),{figure:!!leaf.questionDiagrams?.length});node.answer={short:leaf.answer?.short??'',worked:leaf.answer?.worked??'',provenance:{short:'authored',worked:'authored'}};if(leaf.questionDiagrams?.length)node.questionDiagrams=leaf.questionDiagrams;
    (f.block.sourceReview??={}).corrections=[...(f.block.sourceReview.corrections??[]),{at:now(),targetId:nodeId,kind:'approved-departure',approvedBy:'James',comment:flag.id,before,reason:'Repeated item replaced (pedagogy audit v2).'}];}
   if(!ok){fail('a repeated part was not found');continue;}
   // A replaced part's new prompt drops the document ids its saved arrangement names (Data Visualisation 1
   // p4-q1-b, 8 November 2026): an arrangement naming ids the block no longer has is dropped.
   {const has=id=>JSON.stringify(f.block.content).includes(`"id":${JSON.stringify(id)}`);// content only: the correction record keeps the old prompt
    for(const host of [candidate.settings?.layoutOverrides?.blockLayouts,f.block.presentation?.layoutOverrides?.blockLayouts]){const lay=host?.[pay.blockId];if(!lay)continue;
     const refs=[];(function walk(x){if(!x||typeof x!=='object')return;if(typeof x.ref==='string')refs.push(x.ref);for(const v of Object.values(x))walk(v);})(lay);
     if(refs.some(r=>{const [base,rest]=r.split('/');const doc=(rest??'').split('#')[1];return !has(base)||(doc&&!has(doc));}))delete host[pay.blockId];}}
   changedHosts.add(pay.blockId);done(`${pay.nodeIds.join(', ')} replaced with ${typeof leaf.prompt==='string'?leaf.prompt:'a new part'}.`);continue;}
  if(pay.op==='theory'){const f=findBlock(candidate,pay.blockId);if(!f){fail('block not found');continue;}
   // A rewrite pinned to a block without the text (Area 1 p22: the diagrams of a definition box)
   // goes to the sibling in the same teaching box that holds the text, if it fits there exactly.
   // The node the audit names decides first: Area 2's p10 rewrite named p10-identify-demonstration, in the
   // box's text block, but was pinned to its question, whose instruction it replaced (8 November 2026).
   const holds=(b,id)=>JSON.stringify(b).includes(`"id":${JSON.stringify(id)}`);
   let target=f,r=null;
   if(pay.nodeId&&!holds(f.block,pay.nodeId)&&f.block.sourceAtom?.id){const i=f.section.blocks.findIndex((b,k)=>k!==f.index&&b.sourceAtom?.id===f.block.sourceAtom.id&&holds(b,pay.nodeId));
    if(i>=0){const s=theoryOnto(f.section.blocks[i],pay.replacement,{nodeId:pay.nodeId});if(!s.error){target={...f,index:i,block:f.section.blocks[i]};r=s;}}}
   r??=theoryOnto(f.block,pay.replacement,{nodeId:pay.nodeId});
   if(r.error&&target===f&&f.block.sourceAtom?.id){for(const [i,b]of f.section.blocks.entries()){if(i===f.index||b.sourceAtom?.id!==f.block.sourceAtom.id||!isDoc(b.content))continue;const s=theoryOnto(b,pay.replacement,{nodeId:pay.nodeId});if(!s.error){target={...f,index:i,block:b};r=s;break;}}}
   if(r.error){fail(r.error);continue;}
   // A question's text is its instruction. A rewrite that does not resemble any prompt in it is meant for
   // something else, such as a worked answer (Angle Relationships 2 p63-guided: the solution replaced the
   // question "Find the value of angle a"), so it stays a comment.
   if(target.block.type==='question'&&!questionPromptsOf(target.block).some(p=>wordOverlap(p,pay.replacement)>=0.5)){fail('the rewrite does not match any prompt of this question; it may be meant for an answer');continue;}
   // A rewrite moved to a sibling must resemble the sibling's own words. Volume p19: a sentence meant for the
   // plain-text note "For the other prisms …" went to the box's formula display and replaced V = lwh, which has
   // no words, so the box lost its formula and printed the note twice (8 November 2026).
   if(target!==f&&!siblingRewriteFits(target.block.content,pay.replacement)){fail(`the rewrite does not resemble the text of ${target.block.id}, the only sibling it fits`);continue;}
   f.section.blocks[target.index]=r.block;pruneArrangement(candidate,r.block);changedHosts.add(target.block.id);done(target===f?'Replacement text applied.':`Replacement text applied to ${target.block.id}, which holds this box's text.`);continue;}
  if(pay.op==='bold'){const f=findBlock(candidate,pay.blockId);if(!f){fail('block not found');continue;}let next=f.block;const terms=[];for(const t of pay.terms){const r=boldTerm(next,t);if(r){next=r;terms.push(t);}}if(!terms.length){fail('no term found to bold');continue;}f.section.blocks[f.index]=next;done('Bolded '+terms.join(', ')+'.');continue;}
  if(pay.op==='rating'){const f=findBlock(candidate,pay.blockId);if(!f||!verifiedRating(f.block,pay.classification)){fail('the rating no longer matches the question');continue;}f.block.classification={...f.block.classification,...pay.classification,assessment:{...pay.classification.assessment,approvedBy:'James',approvedAt:now()}};done(`Rating ${pay.classification.reasoningScore} accepted.`);continue;}
  // New teaching: a worked example and its guided practice, after the named teaching block and
  // always before the lesson's Key ideas.
  if(pay.op==='teaching'){
   const blocks=structuredClone(pay.blocks??[]);if(!blocks.length){fail('no blocks stored');continue;}
   // A worked example without a figure whose guided practice has figures is unfinished (Angle Relationships 1 j13).
   // A finished drawing (solutionDiagrams) is the example's figure too (Data Visualisation 1-2 stem-and-leaf, 9 November 2026).
   const figs=x=>/"(questionDiagrams|solutionDiagrams)":\[\{/.test(JSON.stringify(x??null));
   if(blocks[0]?.type==='worked-example'&&!figs(blocks[0].examples)&&blocks.slice(1).some(figs)){fail('the worked example has no figure but its guided practice has: the drafter left it out');continue;}
   if(blocks.some(b=>findBlock(candidate,b.id))){fail('a block with id '+blocks.find(b=>findBlock(candidate,b.id)).id+' already exists');continue;}
   const at=pay.after?findBlock(candidate,pay.after):null,pre=!at&&pay.before?findBlock(candidate,pay.before):null;let section=at?.section??pre?.section??candidate.sections.find(s=>s.id===pay.sectionId);
   if(!section){fail('its lesson was not found');continue;}
   const keyIdeas=b=>b?.pedagogyRole==='key-ideas'||b?.sourceAtom?.kind==='key-ideas';
   let index=at?at.index+(keyIdeas(at.block)?0:1):pre?pre.index:section.blocks.length;const guidedNext=b=>b?.pedagogyRole==='guided-practice'||b?.sourceAtom?.kind==='guided-practice';if(at&&!keyIdeas(at.block)){while(guidedNext(section.blocks[index]))index++;
    // The example's own guided practice may open the next section of the same lesson.
    const next=candidate.sections[candidate.sections.indexOf(section)+1];if(index===section.blocks.length&&next?.topicId===section.topicId&&guidedNext(next.blocks?.[0])){section=next;index=0;while(guidedNext(section.blocks[index]))index++;}
    // Teaching added earlier in this apply after the same block stays first (Area 2 j7, j8, 8 November 2026).
    while(section.blocks[index]&&teachingAnchor.get(section.blocks[index].id)===pay.after)index++;}
   // Only a Key ideas box after the named block closes the lesson. One that opens it (Angle Relationships 1
   // p22-key-ideas, a rule box) is not a limit: clamping to it put j13 at the start of the lesson.
   const from=at&&at.section===section?at.index:-1,ki=section.blocks.findIndex((b,i)=>i>from&&keyIdeas(b));if(ki>=0&&index>ki)index=ki;
   for(const b of blocks)(b.sourceReview??={}).addition={approvedBy:auto?'James (standing approval of verified findings, 8 November 2026)':'James',date:now().slice(0,10),comment:flag.id,reason:auto?'Verified pedagogy audit v2 new teaching, applied automatically.':'Approved pedagogy audit v2 comment.'};
   section.blocks.splice(index,0,...blocks);blocks.forEach(b=>{inserted.add(b.id);teachingAnchor.set(b.id,pay.after);});
   done(`Worked example${blocks.length>1?' and guided practice':''} added ${at?(keyIdeas(at.block)?'before ':'after ')+pay.after:pre?'before '+pay.before:'to the lesson'}.`);continue;}
  if(pay.op==='insert'||pay.op==='review'){
   const block=structuredClone(pay.block);if(findBlock(candidate,block.id)){fail('a block with id '+block.id+' already exists');continue;}
   (block.sourceReview??={}).addition={approvedBy:auto?'James (standing approval of verified findings, 8 November 2026)':'James',date:now().slice(0,10),comment:flag.id,reason:auto?'Verified pedagogy audit v2 finding, applied automatically.':'Approved pedagogy audit v2 comment.'};
   if(pay.op==='review'){const e=addToReview(candidate,pay.topicId,block);if(e){fail(e);continue;}inserted.add(block.id);done('Added to the opening Review box.');continue;}
   const routineOver=['proposal-extensions','proposal-variation'].includes(flag.findingKind)&&scoreOf(block)!=null&&scoreOf(block)>LIMITS.routineCeiling;
   if(routineOver){challengeSection(candidate).blocks.push(block);inserted.add(block.id);done(`Added to the Challenge exercise (rated ${scoreOf(block)}).`);continue;}
   const at=pay.after?findBlock(candidate,pay.after):null,section=at?.section??candidate.sections.find(s=>s.id===pay.sectionId);
   if(!section){fail('its exercise was not found');continue;}
   // A new Key ideas box closes the lesson: it goes after any teaching this apply added there.
   let pos=at?at.index+1:section.blocks.length;if(isKeyIdeas(block))while(section.blocks[pos]&&inserted.has(section.blocks[pos].id))pos++;
   section.blocks.splice(pos,0,block);inserted.add(block.id);done(pay.after?`Added after ${pay.after}.`:'Added at the end of the exercise.');continue;}
  fail('unknown change '+pay.op);
 }
 // A comment is resolved only when every one of its changes applied.
 for(const id of failed)resolutions.delete(id);
 // Ratings: practice questions changed here, or inserted with a rating that no longer matches.
 const practice=new Set(practiceRatingBlocks(candidate).map(r=>r.block.id));
 const toRate=[...new Set([...changedHosts,...inserted])].filter(id=>practice.has(id)&&!verifiedRating(findBlock(candidate,id).block));
 report.toRate=toRate;
 if(!dryRun&&toRate.length){fs.mkdirSync(runDir,{recursive:true});report.ratings=await rateChanged(ctx,candidate,toRate,root);
  for(const r of report.ratings.filter(r=>r.score==null)){report.manual.push({block:r.id,reason:'comparison placement '+r.how+': rate by hand'});}}
 if(auto){
  // Applied comments stay open for review, marked as applied; a failed one stays a proposal and says why.
  const flags=new Map(candidate.studio.flags.map(f=>[f.id,f]));
  const byComment=new Map();for(const a of report.applied)byComment.set(a.comment,[...(byComment.get(a.comment)??[]),a.what]);
  for(const [id,texts]of byComment){const f=flags.get(id);if(!f)continue;const rest=failed.has(id)||store[id].payloads.some(p=>!p.applied&&!p.autoApply);
   f.note=f.note.replace(/^\[Pedagogy audit v2 · /,'[Pedagogy audit v2 · Applied automatically · ')+'\nApplied: '+texts.join(' ');
   if(!rest)f.autoApplied={at:now(),what:texts.join(' ')};}
  for(const m of [...report.manual,...report.stale].filter(m=>m.comment)){const f=flags.get(m.comment);if(f&&!f.note.includes('Not applied automatically'))f.note+='\nNot applied automatically: '+m.reason+'. Apply by hand, or delete this comment.';}
  // Every payload that changed the candidate is marked applied, even in a comment that partly failed, so it is never applied twice.
  report.appliedKeys=[...new Set(report.applied.map(a=>a.comment+'|'+a.key))];
  report.resolved=[];report.calls=ctx.calls;report.pageBlocks=[...new Set([...changedHosts,...inserted])];
  if(!verified)return {candidate,report};
 }
 if(!auto)for(const [id,texts]of resolutions){const f=candidate.studio.flags.find(x=>x.id===id);f.resolved=true;f.resolvedAt=now();f.resolution='Approved by James and applied: '+texts.join(' ');}
 report.resolved=auto?[]:[...resolutions.keys()];report.calls=ctx.calls;
 write(path.join(runDir,'candidate.json'),{...candidate,revision:live.revision});
 const changed=[...new Set([...changedHosts,...inserted])];
 report.pageBlocks=changed;
 if(dryRun||testOnly){report.dryRun=true;write(path.join(runDir,'report.json'),report);write(path.join(runDir,'report.md'),applyReport(report));return {run:rel(runDir),...summary(report)};}
 // One page check of the changed blocks, then one revision-checked save.
 if(changed.length){const out=path.join(runDir,'pages'),answers=[...changedHosts,...inserted].length?'student,short,worked':'student';
  const r=spawnSync(process.execPath,['scripts/booklet/check-feedback-pages.mjs','--project-file',path.join(runDir,'candidate.json'),'--blocks',changed.join(','),'--editions',answers,'--full-development-reason',verified?'Verified pedagogy audit v2 findings applied automatically (standing approval, 8 November 2026).':'Approved pedagogy audit v2 comments added or changed questions and answers.','--out',out],{cwd:root,encoding:'utf8',maxBuffer:64*1024*1024,timeout:1800000});
  report.render={exitCode:r.status,out:rel(out),stdout:String(r.stdout).slice(-3000)};
  if(r.status!==0){write(path.join(runDir,'report.json'),report);throw Error('Page check failed; nothing saved. See '+rel(path.join(runDir,'report.json')));}}
 const {publishProject}=await import('../scripts/booklet/publish-project.mjs');
 // Applied changes to a bank-owned question sync to the bank, as a Studio save does (James, 8 November 2026).
 const saved=await publishProject({candidateFile:path.join(runDir,'candidate.json'),expectedRevision:live.revision,apply:true,allowBank:true,root,record:path.join(runDir,'publication.json'),ledger:path.join(root,'.booklet-work','pedagogy-audit-v2','publications.jsonl'),note:verified?'pedagogy audit v2 verified findings applied':'pedagogy audit v2 approved comments'});
 report.savedRevision=saved.to;
 if(verified&&storeFile){const keys=new Set(report.appliedKeys);for(const [id,entry]of Object.entries(store))for(const p of entry.payloads??[])if(keys.has(id+'|'+p.key))p.applied=true;write(storeFile,storeDoc);}
 const file=recordFile(projectId,{root});if(fs.existsSync(file)){const rec=read(file);
  // What this apply produced was checked on the way in: record it, so later runs do not resend its topics.
  const own=appliedChecks(candidate,changed);rec.checks={...rec.checks,...own.checks};rec.types={...rec.types,...own.types};if(rec.checkedRevision===live.revision)rec.checkedRevision=saved.to;
  rec.runs=[...(rec.runs??[]),{kind:'apply-comments',at:report.startedAt,run:rel(runDir),fromRevision:live.revision,toRevision:saved.to,model:MODEL,effort:EFFORT,applied:report.applied.length,resolved:report.resolved.length,manual:report.manual.length,calls:ctx.calls.map(({id,stage,model,effort,elapsedMs,usage,costUsd,ok})=>({id,stage,model,effort,elapsedMs,usage,costUsd,ok}))}];write(file,rec);}
 write(path.join(runDir,'report.json'),report);write(path.join(runDir,'report.md'),applyReport(report));
 return {run:rel(runDir),revision:saved.to,...summary(report)};
}
const summary=r=>({applied:r.applied.length,resolved:r.resolved.length,manual:r.manual,stale:r.stale,ratings:r.ratings,toRate:r.toRate});
function applyReport(r){return ['# Approved pedagogy audit v2 comments: '+r.projectId,'',`Revision ${r.revision}${r.savedRevision?' → '+r.savedRevision:''}${r.dryRun?' (dry run, nothing saved)':''}.`,'','## Applied','',...r.applied.map(a=>`- ${a.kind} (${a.comment.slice(0,8)}): ${a.what}`),'','## Ratings by Sonnet comparison','',...(r.ratings.length?r.ratings.map(x=>`- ${x.id}: ${x.score??'not placed'} (between ${x.harderThan??'—'} and ${x.easierThan??'—'})`):(r.toRate??[]).map(id=>`- ${id}: to rate`)),'','## Left open for James','',...[...r.manual,...r.stale].map(m=>`- ${m.kind??m.op??''} ${m.comment?.slice(0,8)??m.block??''}: ${m.reason}`),''].join('\n');}

export async function applyCommentsMain(args){
 const value=name=>{const i=args.indexOf(name);return i<0?undefined:args[i+1];};
 const projectId=value('--project');if(!projectId)throw Error('apply-comments needs --project ID');
 return applyComments({projectId,comments:value('--comments'),verified:args.includes('--verified'),dryRun:args.includes('--dry-run'),projectFile:value('--project-file')&&path.resolve(value('--project-file')),proposals:value('--proposals')&&path.resolve(value('--proposals'))});
}
