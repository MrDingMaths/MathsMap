// Pre-save content rules for pedagogy audit v2 (10 November 2026). The apply checks every block the audit
// added or changed against these before it renders or saves; a block that breaks one is held back (its change
// stays a comment, or its new question is taken out) and the apply runs again. Each rule names a family of
// defect found only by looking at saved pages: maths printed as plain text (Further Non-linear Relationships 1
// Key ideas), a replaced part restating its stem (five shapes, Stage 5), a part losing its label (Circle
// Geometry 2 vv) and a long lettered run broken by numbers or repeats (Circle Geometry 1 Exercise 6).
// Only what the audit wrote is judged: teacher text in a changed block is compared with the live booklet first.
import {bareMaths} from './audit-v2-prompts.mjs';

const blocksOf=p=>(p?.sections??[]).flatMap(s=>s.blocks??[]);
// Plain text of a prompt: a string as written, or the text runs of an editor document with its maths as $…$.
export function promptText(prompt){
 if(prompt==null)return '';if(typeof prompt==='string')return prompt;
 const out=[];(function walk(x){if(!x||typeof x!=='object')return;if(Array.isArray(x)){x.forEach(walk);return;}
  // A dollar sign in a text run is money ("loses $4880"), never a maths delimiter.
  if(x.type==='text'&&typeof x.text==='string'){out.push(x.text.replace(/\$/g,'\\$'));return;}
  if(x.type==='math'){out.push(' $'+(x.latex??'')+'$ ');return;}
  if(x.type==='cloze'){out.push(' [[blank]] ');return;}
  if(x.type==='paragraph'||x.type==='list-item'){(x.inlines??x.children??[]).forEach(walk);out.push('\n');return;}
  for(const [k,v]of Object.entries(x))if(!['answer','diagrams','questionDiagrams','code','latex','tikz'].includes(k))walk(v);})(prompt);
 return out.join('').replace(/[ \t]+/g,' ');
}
// Every node with an id in a block's content, with its parent.
function nodesOf(block){
 const out=[];(function walk(n,parent){if(!n||typeof n!=='object')return;if(n.id)out.push({node:n,parent});for(const c of n.children??[])walk(c,n);})(block?.content,null);
 return out;
}
const words=t=>String(t).replace(/\$\$[\s\S]*?\$\$|\$[^$]*\$/g,' ').toLowerCase().match(/[a-z]+/g)??[];
// True when a line of the part is mostly the stem: it shares a run of k or more consecutive words with the stem,
// and those runs cover at least half its words. A context phrase inside a new sentence ("Use the difference of
// two squares to write $2^8-1$ as a product of three whole numbers …") is not a restatement; "Hence show that …"
// repeats a goal on purpose.
export function sharedRun(a,b,k=4){
 const wb=words(b);if(wb.length<k)return false;
 const grams=new Set();for(let i=0;i+k<=wb.length;i++)grams.add(wb.slice(i,i+k).join(' '));
 for(const line of String(a).split('\n')){const wa=words(line);if(wa.length<k||wa[0]==='hence')continue;
  const covered=new Set();for(let i=0;i+k<=wa.length;i++)if(grams.has(wa.slice(i,i+k).join(' ')))for(let j=i;j<i+k;j++)covered.add(j);
  if(covered.size&&covered.size*2>=wa.length)return true;}
 return false;
}
const LONG_LETTERS=/^[a-z]{2,4}$/;const isLongLabel=l=>LONG_LETTERS.test(l)&&new Set(l).size===1;
const labelsIn=block=>nodesOf(block).map(({node})=>String(node.label??'').trim()).filter(Boolean);
// Labels in a section, in print order, of the run's own parts (block roots and their direct parts).
const sectionLabels=section=>(section.blocks??[]).flatMap(b=>[b.content,...(b.content?.children??[])].map(n=>String(n?.label??'').trim()).filter(Boolean));

// live: the booklet before the apply; candidate: the booklet to be saved; made: ids of blocks the audit
// added or changed. Returns Map(blockId → reason) of blocks to hold back.
export function contentRules(live,candidate,made){
 const liveBlocks=new Map(blocksOf(live).map(b=>[b.id,b])),out=new Map(),flag=(id,why)=>{if(!out.has(id))out.set(id,why);};
 for(const block of blocksOf(candidate)){if(!made.has(block.id))continue;
  const before=liveBlocks.get(block.id),liveNodes=new Map(before?nodesOf(before).map(({node})=>[node.id,node]):[]);
  const own=[...nodesOf(block),...(block.examples??[]).map(e=>({node:e,parent:null}))];
  // A node is the audit's own writing when it is new or its prompt differs from the live booklet's.
  const changed=({node})=>{const l=liveNodes.get(node.id);return !l||JSON.stringify(l.prompt)!==JSON.stringify(node.prompt);};
  for(const entry of own.filter(changed)){const {node,parent}=entry;
   for(const field of ['prompt','theorySolution']){const text=promptText(node[field]);
    // 1. Maths written as plain text.
    for(const line of text.split('\n'))if(!/\\(?:begin\{tikzpicture\}|draw\b|node\b)/.test(line)&&bareMaths(line)){flag(block.id,`maths written as plain text in ${node.id}: "${line.trim().slice(0,60)}"`);break;}}
   // 2. A part restating its stem among bare siblings (an item, or four words at most): none of them restates it,
   // and at least half are bare. Parts that are all sentences may share the stem's words ("the number of ice creams").
   const stem=promptText(parent?.prompt),mine=promptText(node.prompt);
   if(parent&&words(stem).length>=5&&sharedRun(mine,stem)){const sibs=(parent.children??[]).filter(c=>c!==node),bare=sibs.filter(c=>words(promptText(c.prompt)).length<=4).length;
    if(sibs.length&&bare*2>=sibs.length&&!sibs.some(c=>sharedRun(promptText(c.prompt),stem)))flag(block.id,`${node.id} (${node.label??''}) restates its stem: "${mine.trim().slice(0,60)}"`);}}
  // 3. Labels lost: a node whose label was emptied, or a block that held one labelled part of a run (a shell,
  // Circle Geometry 2 "vv") and now has none. A whole question replaced by one new question loses its parts by design.
  if(before){for(const {node} of nodesOf(block)){const l=liveNodes.get(node.id);if(l&&String(l.label??'').trim()&&!String(node.label??'').trim())flag(block.id,`${node.id} lost its label "${l.label}"`);}
   const kids=before.content?.children??[],shell=kids.length===1&&String(kids[0].label??'').trim();
   // A run relettered after a removal earlier in it (Circle Geometry 1, "y" now "t") keeps a letter: only none is lost.
   if(shell&&!labelsIn(block).some(l=>String(l??'').trim()))flag(block.id,`lost its part label ${shell}`);}
 }
 // 4. Long lettered runs (aa, ccc …): a new repeat, or a new numbered question inside the run.
 const liveSections=new Map((live.sections??[]).map(s=>[s.id,s]));
 for(const section of candidate.sections??[]){const labels=sectionLabels(section);if(!labels.some(isLongLabel))continue;
  const before=liveSections.get(section.id),liveLabels=before?sectionLabels(before):[];
  const count=list=>{const m=new Map();for(const l of list.filter(isLongLabel))m.set(l,(m.get(l)??0)+1);return m;},now=count(labels),then=count(liveLabels);
  const repeated=[...now].filter(([l,n])=>n>1&&n>(then.get(l)??0)).map(([l])=>l);
  for(const b of (section.blocks??[]).filter(b=>made.has(b.id))){const mine=[b.content,...(b.content?.children??[])].map(n=>String(n?.label??'').trim());
   const rep=mine.filter(l=>repeated.includes(l));if(rep.length)flag(b.id,`repeats the label ${rep[0]} in a lettered run`);
   const root=String(b.content?.label??'').trim();if(/^\d+$/.test(root)&&!liveBlocks.has(b.id))flag(b.id,`numbered ${root} inside a lettered run`);}}
 return out;
}
