// Pedagogy audit v2: pure planning helpers (docs/booklet-pedagogy-audit-v2.md).
// No model calls, no file writes. Kept outside scripts/, which exports freeze.
import {createHash} from 'node:crypto';
import {questionReviewContent} from '../src/lib/booklet-review-profile.js';
import {isPractice} from '../src/lib/booklet-flow.js';
import {isTheoryReview} from '../src/lib/question-bank-eligibility.js';
import {questionKey,sharedQuestion} from '../src/lib/question-sync.js';
import {difficultyBandForScore,normaliseQuestion} from '../src/lib/practice-question-model.js';
import {endSectionRole,isExamQuestion} from '../polish/end-section-role.mjs';
import {nodesOf} from '../polish/guards.mjs';

export const MODEL='claude-sonnet-5-5';
export const EFFORT='medium';
export const LIMITS=Object.freeze({jump:15,floor:6,slack:3,routineCeiling:59,appliedBelow:60,minimumItems:3,countSlotsPerExercise:3,promptCharacters:280000,packCharacters:240000,draftsPerCall:5,challengeFollowing:4});
const sha=value=>createHash('sha256').update(typeof value==='string'?value:JSON.stringify(value)).digest('hex');

// ---- diagram-blind equivalence (James, 6 November 2026) ------------------------
// A diagram edit almost never changes what a question asks, so a change confined to
// free-form TikZ or SVG drawing code keeps the question's rating and reviewed type.
// Templated diagrams keep their mathematical model, which is content.
// The text a diagram prints (side lengths, angles, vertex names) is content and is kept; geometry,
// styling and comments are not.
const TIKZ=/(?:%[^\n]*\n\s*)*\\begin\{tikzpicture\}[\s\S]*?\\end\{tikzpicture\}/g,SVG=/<svg[\s\S]*?<\/svg>/g;
const NODE_TEXT=/\bnode\b\s*(?:\[[^\]]*\])?\s*(?:\([^)]*\)\s*)?(?:at\s*\([^)]*\)\s*)?\{((?:[^{}]|\{(?:[^{}]|\{[^{}]*\})*\})*)\}/g;
const printed=code=>'[diagram: '+[...String(code).replace(/%[^\n]*/g,'').matchAll(NODE_TEXT)].map(m=>m[1].trim()).filter(Boolean).sort().join(' | ')+']';
const svgText=code=>'[diagram: '+[...String(code).matchAll(/<text[^>]*>([\s\S]*?)<\/text>/g)].map(m=>m[1].trim()).filter(Boolean).sort().join(' | ')+']';
export function diagramBlind(value){
 if(typeof value==='string')return value.replace(TIKZ,printed).replace(SVG,svgText);
 if(Array.isArray(value))return value.map(diagramBlind);
 if(!value||typeof value!=='object')return value;
 const drawn=['tikz','svg'].includes(value.format)&&!value.mathematicalModel;
 return Object.fromEntries(Object.keys(value).sort().map(k=>[k,drawn&&k==='code'?(value.format==='svg'?svgText(value[k]):printed(value[k])):diagramBlind(value[k])]));
}
// Mirrors reasoningTaskHash (scripts/booklet/reasoning-ratings.mjs) with drawing code removed.
export const diagramBlindHash=block=>sha(diagramBlind(sharedQuestion({...normaliseQuestion(block),title:''}).content));
// Presentation does not change what a question asks either (9 November 2026, Polynomials 1A: paragraph indent and
// line height set by the editor, a figure's alignment, an empty mathematicalModel, and the source attribution the
// exam pass added had cut eight questions off their reviewed type).
const PRESENTATION=new Set(['align','indent','lineHeight','spaceBefore','spaceAfter','fontSize','widthMm','source']);
const presentationBlind=v=>Array.isArray(v)?v.map(presentationBlind):v&&typeof v==='object'?Object.fromEntries(Object.entries(v).filter(([k,x])=>!PRESENTATION.has(k)&&!(k==='mathematicalModel'&&x==null)).map(([k,x])=>[k,presentationBlind(x)])):v;
export const diagramEquivalent=(a,b)=>JSON.stringify(diagramBlind(presentationBlind(questionReviewContent(a))))===JSON.stringify(diagramBlind(presentationBlind(questionReviewContent(b))));

// ---- content fingerprints ------------------------------------------------------
// What a student reads and answers, and nothing else. Layout, labels, numbering,
// source references, classification, emphasis and whitespace outside maths are
// dropped; free-form TikZ code stays (it cannot tell presentation from maths);
// templated diagram size and proportions are dropped.
const DROP=new Set(['id','label','displayNumber','answerSpaceMm','responseSpaceMm','layout','columns','align','arrangement','width','height','widthMm','heightMm','sizeMm','scale','presentation','flow','sourceReview','sourceRefs','sourcePageNumber','sourceOrder','sourceAtom','sourceLayoutEvidence','sourceIdentity','classification','snapshotKind','bankRef','provenance','marks','bold','italic','underline','reviewStatus','role','preserveParagraphAlignment','keepTogether','workingSpace','source','origin','colourModel']);
const stripEmphasis=s=>{
 // Whitespace and ** / __ emphasis outside $…$ maths are presentation.
 const parts=s.split(/(\$\$[\s\S]*?\$\$|\$[^$]*\$)/);
 return parts.map((part,i)=>i%2?part:part.replace(/\*\*|__/g,'').replace(/\s+/g,' ')).join('').trim();
};
function normalise(value,key){
 if(typeof value==='string')return key==='code'?value:stripEmphasis(value);
 if(Array.isArray(value)){
  // Adjacent text runs that differ only in emphasis are one run: bolding a word splits it.
  const plain=v=>{if(!v||typeof v!=='object'||v.type!=='text'||typeof v.text!=='string')return null;const {text,marks,bold,italic,underline,...rest}=v;return JSON.stringify(rest);};
  const merged=[];
  for(const child of value){const last=merged.at(-1);if(plain(last)!==null&&plain(last)===plain(child))merged[merged.length-1]={...last,text:last.text+child.text,marks:[]};else merged.push(child);}
  return merged.map(child=>normalise(child)).filter(child=>child!==undefined&&!(typeof child==='string'&&!child));
 }
 if(!value||typeof value!=='object')return value;
 const result={};
 for(const k of Object.keys(value).sort()){if(DROP.has(k))continue;const child=normalise(value[k],k);if(child===undefined||child===null||child===''||(Array.isArray(child)&&!child.length))continue;result[k]=child;}
 return result;
}
export const contentView=block=>normalise(block.type==='question'?questionReviewContent(block):block);
export const contentFingerprint=block=>sha(contentView(block));
// The question text only: a correction that leaves this unchanged changed only the answer or worked solution.
export const wordingFingerprint=block=>sha(normalise(JSON.parse(JSON.stringify(block.type==='question'?questionReviewContent(block):block,(k,v)=>['answer','theorySolution','solutionDiagrams','solution'].includes(k)?undefined:v))));

// ---- booklet structure ---------------------------------------------------------
export function sectionKind(section,project){
 if(section.phase==='front-matter')return 'front-matter';
 if(section.phase==='teaching')return 'teaching';
 if(section.phase!=='practice'||section.role==='candidate-pool')return 'other';
 const role=endSectionRole(section,project);
 if(role==='exam')return 'exam';
 if(role==='challenge')return 'challenge';
 if(role==='mixed-review')return 'mixed-review';
 return 'exercise';
}
export const isWorkedExample=block=>block.type==='worked-example'||['example','worked-example'].includes(block.pedagogyRole);
// Every block with its section, kind and position; routine = an exercise question a student practises.
export function bookletIndex(project){
 const rows=[];
 for(const section of project.sections??[]){
  const kind=sectionKind(section,project);
  (section.blocks??[]).forEach((block,i)=>{
   const question=kind!=='teaching'&&isPractice(block)&&!isTheoryReview(block,section);
   rows.push({block,section,kind,index:i,question,routine:question&&kind==='exercise'&&!isExamQuestion(block),exam:question&&(kind==='exam'||isExamQuestion(block)),example:isWorkedExample(block)});
  });
 }
 return rows;
}
export const scoreOf=block=>Number.isFinite(block?.classification?.reasoningScore)?block.classification.reasoningScore:null;

// Independent practice items: a reviewed practiceItems grouping, else one per question (30 October rule).
export function practiceItems(block){
 const items=block.classification?.archetypeReview?.practiceItems;
 return Array.isArray(items)&&items.length?items:[{nodeIds:[block.content?.id??block.id]}];
}

// Complete-task parts of a question, for the core-type minimum (James, 8 November 2026): each part a
// student answers on its own counts, at most `cap` per question. A part that leans on an earlier one
// ("hence", "your answer", "part (a)"), or that has no numbers, maths or figure of its own under a
// shared stem (the next step of one problem), joins the item before it, so a scaffolded chain is one.
// A reviewed practiceItems grouping still wins (30 October rule).
const SKIP_TEXT=new Set(['id','label','children','answer','answerSpaceMm','responseSpace','responseSpaceMm','sourceRefs','sourceReview','classification','layout','arrangement','presentation','flow']);
const ownText=node=>{const out=[];const walk=(v,k)=>{if(SKIP_TEXT.has(k))return;if(typeof v==='string'){if(!['type','format','id'].includes(k))out.push(v);return;}if(Array.isArray(v))v.forEach(x=>walk(x));else if(v&&typeof v==='object')for(const [kk,vv] of Object.entries(v))walk(vv,kk);};for(const [k,v] of Object.entries(node??{}))walk(v,k);return out.join(' ');};
const hasFigure=node=>['questionDiagrams','diagrams','table','tables','images'].some(k=>Array.isArray(node?.[k])?node[k].length>0:!!node?.[k]);
const LEANS=/\bhence\b|\bthus\b|your answers?\b|previous (part|answer|question)|\bpart\s*\(?[a-z]\)|\b(in|from|using|use) \(?[a-h]\)|\babove\b/i;
export function practiceItemCount(block,{cap=3}={}){
 const reviewed=block.classification?.archetypeReview?.practiceItems;
 if(Array.isArray(reviewed)&&reviewed.length)return reviewed.length;
 const root=block.content;if(!root||typeof root!=='object')return 1;
 const leaves=[];
 const visit=(node,trail)=>{const kids=(node.children??[]).filter(c=>c&&typeof c==='object'&&['part','group'].includes(c.type));
  if(!kids.length){if(node!==root)leaves.push({node,trail});return;}
  for(const c of kids)visit(c,node===root?[]:[...trail,node]);};
 visit(root,[]);
 if(leaves.length<2)return 1;
 // Answer cells in the stem's table ("Complete the table") are rows a student fills on their own.
 const tableRows=/"type":"table"/.test(JSON.stringify(root.prompt??''));
 // A part with no material of its own is the next step of one problem only when the stem holds the problem's
 // data ("Four friends have $14, $22 …"). Under a stem without data ("Draw these geometrical figures."), each
 // part ("Line FG", "Ray ZY") is a task of its own: Angle Relationships 1 Q2 counted as one item, and the
 // count top-up added two more drawing questions (8 November 2026).
 const MATERIAL=/\d|\$|\\\(|\\frac|[=+×÷<>]/;
 const stemData=MATERIAL.test(ownText(root))||hasFigure(root)||tableRows;
 let items=0;
 for(const [i,{node,trail}] of leaves.entries()){
  const text=[node,...trail].map(ownText).join(' '),material=MATERIAL.test(text)||[node,...trail].some(hasFigure);
  const blank=!ownText(node).trim()&&![node,...trail].some(hasFigure);
  const step=!material&&!(blank&&tableRows)&&(stemData||blank);
  if(i===0||!(LEANS.test(ownText(node))||step))items++;
 }
 return Math.max(1,Math.min(cap,items));
}

// ---- duplicate candidates ------------------------------------------------------
// The existing exact normalisation (questionKey), for whole questions and single parts.
export function duplicateKeys(block){
 const keys=[];
 const whole=questionKey(block);if(whole&&whole!=='{}')keys.push({scope:'question',key:whole});
 // A part is compared with what defines it: its question's stem and the parts before it
 // ("x = 1" alone, or "find the tangent at P", is not a question).
 const promptOf=node=>typeof node.prompt==='string'?node.prompt:JSON.stringify(node.prompt??'');
 // A stem's diagrams and tables are part of what defines its parts (6 November 2026): pilot 2
 // dropped two new questions as duplicates because their part (a) shared the booklet's house
 // wording with an existing question, although the diagrams and numbers differed.
 const stemOf=node=>{const extra=Object.fromEntries(Object.entries(node).filter(([k])=>k!=='children'&&/diagram|image|figure|table/i.test(k)));return Object.keys(extra).length?{prompt:promptOf(node),...extra}:promptOf(node);};
 const visit=(node,stems)=>{
  if(!node||typeof node!=='object')return;
  if(node.type==='part'){const key=questionKey({content:{stems,part:{...node,label:null,id:null,children:undefined},children:node.children??null}});if(key&&key!=='{}')keys.push({scope:'part',key,nodeId:node.id});}
  const before=[...stems,stemOf(node)];
  for(const child of node.children??[]){visit(child,[...before]);before.push(stemOf(child));}
 };
 visit(block.content,[]);
 return keys;
}
export function duplicatePairs(blocks,{stale=null}={}){
 const byKey=new Map(),pairs=[],seen=new Set();
 for(const block of blocks)for(const row of duplicateKeys(block)){const list=byKey.get(row.key)??[];list.push({id:block.id,nodeId:row.nodeId??null,scope:row.scope});byKey.set(row.key,list);}
 for(const list of byKey.values())for(let i=0;i<list.length;i++)for(let j=i+1;j<list.length;j++){
  const a=list[i],b=list[j];if(a.id===b.id)continue;
  if(stale&&!stale.has(a.id)&&!stale.has(b.id))continue;
  const id=[a.id,b.id].sort().join('|');if(seen.has(id))continue;seen.add(id);
  pairs.push({ids:[a.id,b.id],nodes:[a.nodeId,b.nodeId],scope:a.scope==='question'&&b.scope==='question'?'question':'part'});
 }
 return pairs;
}

// ---- Australian spelling ------------------------------------------------------
// US-to-Australian word list. Only whole words outside maths; capitalisation is kept.
const STEMS=[['color','colour'],['center','centre'],['meter','metre'],['liter','litre'],['favor','favour'],['behavior','behaviour'],['neighbor','neighbour'],['labor','labour'],['honor','honour'],['gray','grey'],['catalog','catalogue'],['analog','analogue'],['defense','defence'],['offense','offence'],['fiber','fibre'],['theater','theatre'],['caliber','calibre']];
const WORDS=new Map();
for(const [us,au] of STEMS)for(const suffix of ['','s','ed','ing'])WORDS.set(us+suffix,au+suffix);
for(const [us,au] of [['centered','centred'],['centering','centring'],['labeled','labelled'],['labeling','labelling'],['modeling','modelling'],['modeled','modelled'],['traveled','travelled'],['traveling','travelling'],['totaled','totalled'],['canceled','cancelled'],['canceling','cancelling'],['signaled','signalled'],['fueled','fuelled'],['program','program'],['meters','metres'],['kilometer','kilometre'],['kilometers','kilometres'],['centimeter','centimetre'],['centimeters','centimetres'],['millimeter','millimetre'],['millimeters','millimetres'],['milliliter','millilitre'],['milliliters','millilitres'],['analyze','analyse'],['analyzed','analysed'],['analyzing','analysing'],['paralyze','paralyse'],['skeptical','sceptical'],['aluminum','aluminium'],['jewelry','jewellery'],['mold','mould'],['plow','plough'],['tire','tyre'],['tires','tyres'],['check','check']])WORDS.set(us,au);
for(const verb of ['factor','minim','maxim','organ','recogn','real','rational','summar','general','normal','special','standard','categor','emphas','apolog','author','visual','memor','priorit','util','optim','symbol','character','critic','familiar','hypothes','parameter','polar','vector','synthes','energ','harmon','legal','modern','custom'])for(const [us,au] of [['ize','ise'],['izes','ises'],['ized','ised'],['izing','ising'],['ization','isation'],['izations','isations']])WORDS.set(verb+us,verb+au);
for(const key of [...WORDS.keys()])if(WORDS.get(key)===key)WORDS.delete(key);
// Words with a second, correctly spelt meaning ("tire" = grow weary, "mold" rare) are left alone.
const AMBIGUOUS=new Set(['tire','tires','mold']);
const matchCase=(from,to)=>from===from.toUpperCase()?to.toUpperCase():from[0]===from[0].toUpperCase()?to[0].toUpperCase()+to.slice(1):to;
export function australianSpelling(text){
 const changes=[];
 // Code is never respelt: maths, inline TikZ in a prompt or answer ("[tikz] … \end{tikzpicture}"), and command
 // names (\color). Operations with Decimals 1 p100-q7: "align=center" in an answer's inline figure became
 // "align=centre", and the short edition stopped on "Mathematics failed to render" (8 November 2026).
 const parts=String(text).split(/(\[tikz\][\s\S]*?\\end\{tikzpicture\}|\\begin\{tikzpicture\}[\s\S]*?\\end\{tikzpicture\}|\$\$[\s\S]*?\$\$|\$[^$]*\$|\\\([\s\S]*?\\\)|\\\[[\s\S]*?\\\])/);
 const out=parts.map((part,i)=>i%2?part:part.replace(/(?<!\\)\b[A-Za-z]+\b/g,word=>{const lower=word.toLowerCase(),to=WORDS.get(lower);if(!to||AMBIGUOUS.has(lower))return word;const fixed=matchCase(word,to);changes.push({from:word,to:fixed});return fixed;})).join('');
 return {text:out,changes};
}
// Student-visible prose fields: question/part prompts, answers, editor text inlines.
const PROSE_KEYS=new Set(['prompt','short','worked','text','title','instruction','stem','note','caption']);
export function spellBlock(block){
 const copy=structuredClone(block),changes=[];
 const visit=(value,owner)=>{
  if(Array.isArray(value)){value.forEach(child=>visit(child,owner));return;}
  if(!value||typeof value!=='object')return;
  if(value.type==='math'||['tikz','svg'].includes(value.format))return;
  for(const [key,child]of Object.entries(value)){
   if(['sourceReview','classification','sourceAtom','flow','presentation','code','latex','id'].includes(key))continue;
   if(typeof child==='string'&&PROSE_KEYS.has(key)){const {text,changes:found}=australianSpelling(child);if(found.length){value[key]=text;changes.push(...found.map(c=>({...c,nodeId:value.id??owner,field:key})));}}
   else visit(child,value.id??owner);
  }
 };
 visit(copy,copy.id);
 return {block:copy,changes};
}

// Bold the first occurrence of a defined term in a passage, outside maths. Returns null if not found.
export function boldTerm(block,term){
 const copy=structuredClone(block);let done=false;
 const pattern=new RegExp('\\b'+term.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'\\b','i');
 const visit=value=>{
  if(done||!value||typeof value!=='object')return;
  if(Array.isArray(value)){
   for(let i=0;i<value.length&&!done;i++){const inline=value[i];
    if(inline?.type==='text'&&typeof inline.text==='string'&&!(inline.marks??[]).includes('bold')){const m=inline.text.match(pattern);if(m){const before=inline.text.slice(0,m.index),after=inline.text.slice(m.index+m[0].length),base={...inline};delete base.text;value.splice(i,1,...[before&&{...base,text:before},{...base,text:m[0],marks:[...new Set([...(inline.marks??[]),'bold'])]},after&&{...base,text:after}].filter(Boolean));done=true;}}
    else visit(inline);}
   return;
  }
  if(value.type==='math'||['tikz','svg'].includes(value.format))return;
  for(const [key,child]of Object.entries(value)){
   if(done||['sourceReview','classification','sourceAtom','flow','presentation','id'].includes(key))continue;
   if(typeof child==='string'&&PROSE_KEYS.has(key)){const parts=child.split(/(\$\$[\s\S]*?\$\$|\$[^$]*\$|\*\*[^*]*\*\*)/);for(let i=0;i<parts.length&&!done;i+=2){const m=parts[i].match(pattern);if(m){parts[i]=parts[i].slice(0,m.index)+'**'+m[0]+'**'+parts[i].slice(m.index+m[0].length);done=true;}}if(done)value[key]=parts.join('');}
   else visit(child);
  }
 };
 visit(copy);
 return done?copy:null;
}

// ---- rating by comparison -----------------------------------------------------
// Sonnet places a question between two Sol-rated references; the score comes from
// where it lands. Returns {score, how, flagged} or {score:null, how:'inconsistent'|'none'}.
export function deriveComparisonScore(placement,scores){
 const s=id=>id==null?null:scores.get(String(id))??null;
 if(placement.equalTo!=null&&s(placement.equalTo)!=null)return {score:s(placement.equalTo),how:'equal'};
 const lo=s(placement.harderThan),hi=s(placement.easierThan);
 if(lo!=null&&hi!=null){
  if(lo>hi)return {score:null,how:'inconsistent'};
  const f=placement.closerTo==='harderThan'?0.25:placement.closerTo==='easierThan'?0.75:0.5;
  return {score:Math.round(lo+(hi-lo)*f),how:'between'};
 }
 if(lo!=null)return {score:Math.min(100,lo+5),how:'above-top',flagged:true};
 if(hi!=null)return {score:Math.max(0,hi-5),how:'below-bottom',flagged:true};
 return {score:null,how:'none'};
}
export const bandFor=difficultyBandForScore;

// ---- gap plan -----------------------------------------------------------------
// Fewest evenly spaced slots that bring every neighbouring step to `jump` or under.
// A slot is filled by a question that lands strictly between its neighbours (6 November
// 2026): the two questions either side of the gap, or for one of several slots in a gap,
// the targets of the slots either side. A ±slack window around the target was narrower
// than the steps comparison scoring can produce (a quarter of the gap), so correctly
// placed questions were dropped.
export function jumpSlots(units,{jump=LIMITS.jump,floor=LIMITS.floor,ceiling=Infinity}={}){
 const scored=units.filter(unit=>Number.isFinite(unit.score)),slots=[];
 for(let i=1;i<scored.length;i++){
  const a=scored[i-1],b=scored[i],gap=b.score-a.score;
  if(gap<=jump)continue;
  const n=Math.ceil(gap/jump)-1;
  if(gap/(n+1)<floor)continue;
  const targets=Array.from({length:n},(_,k)=>Math.min(ceiling,Math.round(a.score+gap*(k+1)/(n+1))));
  for(let k=0;k<n;k++){const lo=k?targets[k-1]:a.score,hi=k<n-1?targets[k+1]:b.score;
   slots.push({reason:'difficulty-jump',after:a.lastId,before:b.firstId,between:[a.score,b.score],target:targets[k],range:[Math.max(0,lo+1),Math.min(ceiling,hi-1)],neighbours:{harderThan:a.lastId,easierThan:b.firstId}});}
 }
 return slots;
}
// Accept window for a slot without a gap (type count, worked-example practice, varied item):
// between the nearest applied scores below and above the target, at least ±slack wide.
export function slotWindow(target,scored,{slack=LIMITS.slack,ceiling=Infinity}={}){
 const below=scored.filter(s=>s.score<target).sort((x,y)=>y.score-x.score)[0]??null,above=scored.filter(s=>s.score>target).sort((x,y)=>x.score-y.score)[0]??null;
 return {range:[Math.max(0,Math.min(below?.score??target-slack,target-slack)),Math.min(ceiling,Math.max(above?.score??target+slack,target+slack))],neighbours:{harderThan:below?.id??null,easierThan:above?.id??null}};
}
// Ordered routine units for an exercise: consecutive dependent blocks travel together.
export function exerciseUnits(blocks,{applied=block=>Number.isFinite(scoreOf(block))}={}){
 return blocks.map(block=>({firstId:block.id,lastId:block.id,ids:[block.id],score:applied(block)?scoreOf(block):null}));
}
