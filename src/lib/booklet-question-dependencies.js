import {hashText} from './practice-question-model.js';
import {isTheoryReview} from './question-bank-eligibility.js';

// Read student-facing prompts only. Answers, quoted feedback and provenance are
// review data and must not manufacture a dependency.
export function promptText(value) {
 if(typeof value==='string')return value.replace(/\[tikz\][\s\S]*?\[\/tikz\]|\$\$[\s\S]*?\$\$|\$[^$]*\$/g,' ');
 if(!value||typeof value!=='object')return '';
 if(Array.isArray(value))return value.map(promptText).join(' ');
 return [promptText(value.text??''),...['blocks','inlines','slots','rows'].map(key=>promptText(value[key]))].join(' ').replace(/\s+/g,' ').trim();
}
export const dependencySignature=block=>hashText(JSON.stringify([block.content,block.dependsOn??[],block.pairedBlockId??null]));
const nodes=root=>root?[root,...(root.children??[]).flatMap(nodes)]:[];
const crossQuestion=/(?:\b(?:previous|preceding|earlier|next)\s+questions?\b|\bquestions?\s+(?:above|below)\b|\b(?:notation|graph|table|diagram|result|answer|method)\s+(?:as\s+)?above\b|\bas above\b|\b(?:questions?\s*\d+|Q\s*\d+)\b)/gi;

export function questionDependencyFindings(project) {
 const result=[];
 for(const section of project.sections??[]) {
  const blocks=section.blocks??[];
  for(let index=0;index<blocks.length;index++) {
   const block=blocks[index];if(block.type!=='question'||isTheoryReview(block,section)||section.phase!=='practice')continue;
   const owned=new Set();const collect=value=>{if(!value||typeof value!=='object')return;if(value.id)owned.add(value.id);Object.values(value).forEach(collect);};collect(block.content);
   // flow.continuationOf joins pagination fragments of an existing question;
   // it is not itself evidence that the fragment lacks mathematical givens.
   const external=[...new Set([block,...nodes(block.content)].flatMap(n=>[...(n.dependsOn??[]),n.pairedBlockId].filter(id=>id&&!owned.has(id)&&id!==block.id)))];
   const ordered=nodes(block.content);
   const hasTable=value=>value&&typeof value==='object'&&(value.type==='table'||Object.values(value).some(hasTable));
   const references=ordered.flatMap((node,nodeIndex)=>{
    const text=promptText(node.prompt);
    return [...text.matchAll(crossQuestion)].filter(match=>{
     const before=ordered.slice(0,nodeIndex);
     if(/^(?:graph|diagram)\s+(?:as\s+)?above$/i.test(match[0])&&[...before,node].some(n=>n.questionDiagrams?.length))return false;
     if(/^table\s+(?:as\s+)?above$/i.test(match[0])&&before.some(n=>hasTable(n.prompt)))return false;
     if(/previous questions/i.test(match[0])&&nodeIndex>1&&/two previous questions/i.test(text))return false;
     return true;
    }).map(match=>({nodeId:node.id,reference:match[0],prompt:text}));
   });
   if(!external.length&&!references.length)continue;
   const review=block.sourceReview?.bankDependencyReview;
   const contentExternal=nodes(block.content).some(n=>(n.dependsOn??[]).some(id=>!owned.has(id))||n.pairedBlockId&&!owned.has(n.pairedBlockId));
   const reviewed=!contentExternal&&review?.decision==='self-contained'&&review.signature===dependencySignature(block)&&typeof review.note==='string'&&review.note.trim().length>=20;
   result.push({projectId:project.id,sectionId:section.id,blockId:block.id,previousBlockId:blocks[index-1]?.id??null,bankId:block.bankRef?.id??null,external,references,reviewed});
  }
 }
 return result;
}
export function assertBankQuestionDependencies(project,{blockIds}={}) {
 const selected=blockIds?new Set(blockIds):null;
 const findings=questionDependencyFindings(project).filter(f=>(!selected||selected.has(f.blockId))&&!f.reviewed);
 if(findings.length)throw Object.assign(new Error('Question-bank dependency review required: '+findings.map(f=>f.blockId+' ('+(f.external.length?'external dependency '+f.external.join(', '):f.references.map(r=>r.reference).join('; '))+')').join(', ')+'. Append dependent follow-ups to their preceding question where possible; otherwise include the required context. For a self-contained method reference, record sourceReview.bankDependencyReview with decision "self-contained", the current dependencySignature and a substantive note.'),{statusCode:409,dependencyFindings:findings});
 return findings;
}

// ---- order dependencies inside one exercise (23 October 2026, polish pipeline step 2) ----------------------------
// A question that scaffolds the next, refers back to an earlier one or shares its stimulus must keep its order
// when the pagination optimiser moves questions. The deterministic pass reads the student-facing words of each
// question; polish/dependencies.mjs adds one model call per exercise for what wording alone cannot show. Pairs are
// {dependent, requires, kind, evidence}: `dependent` must stay after `requires`. They are stored as
// block.flow.dependsOn (layout metadata that exerciseUnits() reads like dependsOn, with no bank-dependency
// meaning: the bank's content-level block.dependsOn is not touched).
const STIMULUS='graph|table|diagram|figure|chart|map|data(?:\\s+set)?|information|shape|picture|photo|net|solid|pattern|sequence|number line|spinner|scenario|situation';
const PATTERNS=[
 {kind:'previous-question',target:'previous',re:/\b(?:previous|preceding|prior|earlier|last)\s+(?:two\s+)?(?:questions?|parts?)\b|\b(?:question|part)s?\s+above\b/i},
 // "Answer the following questions" is a stem for several parts, not a pointer to the next question.
 {kind:'next-question',target:'next',re:/\bnext\s+questions?\b|\bquestions?\s+below\b/i},
 // "Give your answer to 2 decimal places" is a rounding instruction, not a reference.
 {kind:'answer-reuse',target:'previous',re:/\b(?:your|the)\s+(?:answers?|results?|working)\s+(?:to|from|for|in)\s+(?:questions?|parts?|Q\s*\d|(?:the\s+)?(?:(?:previous|last|earlier|above)\b|(?:first|second)\s+(?:question|part))|\(?[a-z]\)?(?![a-z]))|\b(?:use|using)\s+(?:your|the|this|that)\s+(?:answers?|results?)\b(?!\s+(?:to|in)\s+(?:\d|the\s+nearest))|\b(?:result|answer|value|values|rate|speed|formula)\s+(?:you\s+)?(?:found|obtained|calculated|got)\s+(?:in|from)\b|\bsame\s+as\s+(?:in\s+)?(?:question|part|above|before)\b/i},
 {kind:'above',target:'previous',re:new RegExp(`\\b(?:${STIMULUS}|result|answer|equation|formula|expression|working|rates?|values?)s?\\s+(?:as\\s+)?(?:given\\s+)?above\\b|\\b(?:the\\s+)?above\\s+(?:${STIMULUS}|result|answer|equation|formula|expression)\\b|\\bas\\s+above\\b|\\b(?:from|in|using|use)\\s+(?:the\\s+)?(?:information|data)\\s+above\\b`,'i')},
 {kind:'same-stimulus',target:'previous',re:new RegExp(`\\b(?:the|this|these|those)\\s+same\\s+(?:${STIMULUS})\\b(?!\\s+plane)|\\bsame\\s+(?:${STIMULUS})\\s+as\\b`,'i')},
];
const NUMBERED=/\b(?:questions?|Q)\s*\.?\s*(\d{1,3})\b/gi;
const PART_REFERENCE=/\bparts?\s*\(?([a-z])\)?(?![a-z])/gi;
// "Use the table", "from the graph", "refer to the diagram": a question that reads a figure it does not carry.
const DEFINITE_STIMULUS=new RegExp(`\\b(?:use|using|from|refer to|read|reading|look at|study|according to|shown in|given in|in)\\s+(?:the|this|these|that)\\s+(?:${STIMULUS})\\b(?!\\s+(?:of|for|to)\\b)`,'i');
const questionNodes=block=>nodes(block.content);
const ownStimulus=block=>{
 const hasTable=value=>value&&typeof value==='object'&&(value.type==='table'||Object.values(value).some(hasTable));
 return questionNodes(block).some(n=>n.questionDiagrams?.length||n.sharedSolutionDiagrams?.length)||hasTable(block.content?.prompt)||questionNodes(block).some(n=>hasTable(n.prompt));
};
export const questionNumber=block=>{const n=Number(block.flow?.exerciseNumber??block.sourceOrder);return Number.isFinite(n)?n:null;};
const blockWords=block=>questionNodes(block).map(n=>promptText(n.prompt)).join(' ').replace(/\s+/g,' ').trim();
const partLabels=block=>new Set(questionNodes(block).filter(n=>n!==block.content&&/^[a-z]$/i.test(String(n.label??''))).map(n=>String(n.label).toLowerCase()));
const quote=(text,match)=>text.slice(Math.max(0,match.index-20),match.index+match[0].length+20).trim();

// blocks: the questions of one exercise in order. Returns the deterministic pairs, no duplicates.
export function orderDependencies(blocks) {
 const pairs=[],seen=new Set();
 const add=(dependent,requires,kind,evidence)=>{
  if(!dependent||!requires||dependent.id===requires.id)return;
  const key=dependent.id+'>'+requires.id;if(seen.has(key))return;seen.add(key);
  pairs.push({dependent:dependent.id,requires:requires.id,kind,evidence:String(evidence).slice(0,120)});
 };
 const numbers=new Map();
 blocks.forEach(b=>{const n=questionNumber(b);if(n!=null)numbers.set(n,[...(numbers.get(n)??[]),b]);});
 blocks.forEach((block,index)=>{
  const text=blockWords(block);if(!text)return;
  const before=blocks[index-1]??null,after=blocks[index+1]??null,mine=ownStimulus(block);
  for(const {kind,target,re} of PATTERNS){
   const match=re.exec(text);if(!match)continue;
   // A figure or table "above" that this question carries itself is not a reference to another question.
   if((kind==='above'||kind==='same-stimulus')&&mine&&!/\b(?:result|answer|equation|formula|expression|working)\b/i.test(match[0]))continue;
   // "Express your answer to part (a) ..." inside a question that has its own part (a) is internal.
   if(kind==='answer-reuse'&&/\bparts?$/i.test(match[0])){
    const label=/^\s*\(?([a-z])\)?(?![a-z])/i.exec(text.slice(match.index+match[0].length,match.index+match[0].length+8))?.[1];
    if(label&&partLabels(block).has(label.toLowerCase()))continue;
   }
   if(target==='previous'){
    add(block,before,kind,quote(text,match));
    if(/\btwo\s+previous\b|\blast\s+two\b/i.test(match[0]))add(block,blocks[index-2],kind,quote(text,match));
   }else add(after,block,'scaffolds-next',quote(text,match));
  }
  for(const match of text.matchAll(NUMBERED)){
   const targets=(numbers.get(Number(match[1]))??[]).filter(b=>b!==block);
   if(targets.length===1)add(block,targets[0],blocks.indexOf(targets[0])<index?'question-reference':'forward-reference',quote(text,match));
  }
  const own=partLabels(block);
  for(const match of text.matchAll(PART_REFERENCE)){
   const label=match[1].toLowerCase();
   if(own.has(label))continue; // a part of this very question
   const holder=[...blocks.slice(0,index)].reverse().find(b=>partLabels(b).has(label));
   if(holder)add(block,holder,'part-reference',quote(text,match));
  }
  if(!mine&&DEFINITE_STIMULUS.test(text)){
   const holder=blocks[index-1]&&ownStimulus(blocks[index-1])?blocks[index-1]:null;
   if(holder)add(block,holder,'shared-stimulus',text.match(DEFINITE_STIMULUS)[0]);
  }
 });
 return pairs;
}

// The pairs as block.flow.dependsOn (a sorted union with what is already stored). Returns the changed block ids.
export function applyFlowDependencies(project,pairs) {
 const by=new Map();
 for(const pair of pairs)by.set(pair.dependent,[...(by.get(pair.dependent)??[]),pair.requires]);
 const changed=[];
 for(const section of project.sections??[])for(const block of section.blocks??[]){
  const wanted=by.get(block.id);if(!wanted)continue;
  const next=[...new Set([...(block.flow?.dependsOn??[]),...wanted])].sort();
  if(JSON.stringify(next)===JSON.stringify([...(block.flow?.dependsOn??[])].sort()))continue;
  block.flow={...block.flow,dependsOn:next};changed.push(block.id);
 }
 return changed;
}
