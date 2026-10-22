// Block-role check (22 October 2026, user approved: docs/booklet-verification-speed.md).
// A block's role decides its header, its numbering and whether the Questions edition shows its
// solutions. This compares the role with what the source says the block is: the header band the
// inventory recorded for the source group that holds it, and (when a source region is known) the
// words printed above that region. It also flags solutions that would show in the Questions edition
// on a your-turn or guided block. Pure: the inventory groups and header words come from the caller.
import {blockRole} from './booklet-layout-actions.js';
import {teachingAnswerCategory,teachingQuestionMode} from './booklet-answer-options.js';
import {contentSource} from './document-content.js';

// The family a role belongs to. theory and definition read the same on the page.
export const ROLE_FAMILY=Object.freeze({theory:'theory',definition:'theory','rich-text':'theory',example:'example','worked-example':'example','guided-practice':'guided',question:'practice','key-ideas':'key-ideas',review:'review',investigation:'activity',identify:'activity',activity:'activity',proof:'activity',verify:'activity',interpret:'activity'});
// The role changeBlockRole is asked for to reach a family.
export const FAMILY_ROLE=Object.freeze({theory:'theory',example:'example',guided:'guided-practice',practice:'question','key-ideas':'key-ideas',review:'review',activity:'investigation'});

const HEADER=[[/guided\s*practice|your\s+turn/i,'guided'],[/key\s*ideas/i,'key-ideas'],[/^\s*(?:worked\s+)?example\b/i,'example'],[/^\s*review\b/i,'review'],[/\b(?:investigation|activity)\b/i,'activity']];
const KIND=Object.freeze({information:'theory',teaching:'theory',theory:'theory',definition:'theory',rule:'theory',explanation:'theory',summary:'theory','teaching-summary':'theory','teaching summary':'theory','method-summary':'theory','information summary':'theory',
 example:'example','worked-example':'example','worked-example continuation':'example','worked-example-solution':'example','example-with-your-turn':'example','worked-example-with-responses':'example',
 'guided-practice':'guided','guided practice':'guided','key-ideas':'key-ideas','key ideas':'key-ideas',review:'review','chapter-review':'review','review-activity':'review',
 investigation:'activity',identify:'activity',activity:'activity',proof:'activity','proof activity':'activity','teaching-activity':'activity',interpret:'activity','interpret activity':'activity','interpretation activity':'activity',
 practice:'practice',exercise:'practice','multipart-practice':'practice','multipart-question':'practice','exercise-question':'practice'});
export const headerFamily=text=>{for(const [pattern,family] of HEADER)if(pattern.test(String(text??'')))return family;return null;};
export const kindFamily=kind=>KIND[String(kind??'').toLowerCase().trim()]??null;
// A source group's family: its printed header wins over the kind the inventory recorded.
export const groupFamily=group=>headerFamily(group?.header)??kindFamily(group?.kind);
export const roleFamily=block=>ROLE_FAMILY[blockRole(block)]??null;

// The words printed just above a source region, which is where its header band sits.
// `words` are page words ({t,x0,y0,x1,y1}) and `box` the region box, in points.
export function headerAbove(words,box,{reach=34}={}){
 const near=words.filter(w=>w.y1<=box[1]+3&&w.y0>=box[1]-reach&&w.x1>=box[0]-6&&w.x0<=box[2]+6).sort((a,b)=>a.y0-b.y0||a.x0-b.x0);
 return near.map(w=>w.t).join(' ').trim();
}

const visit=(node,fn)=>{if(!node||typeof node!=='object')return;fn(node);for(const value of Object.values(node))if(value&&typeof value==='object')Array.isArray(value)?value.forEach(child=>visit(child,fn)):visit(value,fn);};
// Whether a block carries worked solutions (a demonstration) as the role "example" expects.
export function hasWorking(block){
 let found=false;
 const text=value=>{try{return String(contentSource(value)??'').trim();}catch{return '';}};
 visit({content:block.content,examples:block.examples},node=>{
  if(node.answer&&typeof node.answer==='object'&&text(node.answer.worked))found=true;
  if(node.steps?.length||text(node.theorySolution))found=true;
 });
 return found;
}
const hasAnswers=block=>{let found=false;visit({content:block.content,examples:block.examples},node=>{if(node.answer&&typeof node.answer==='object'||node.type==='cloze'&&node.answer)found=true;});return found;};

const DEFAULT_OPTIONS=Object.freeze({showReviewAnswers:false,showIdentifyAnswers:false,showGuidedPracticeAnswers:false,showKeyIdeasAnswers:false});
// Findings for one project. `groups` maps a source entry id to {family,kind,header}; `headers`
// maps a block id to the header words read above its source region. Either may be empty.
export function roleFindings(project,{groups=new Map(),headers=new Map()}={}){
 const out=[];
 for(const section of project.sections??[]){
  if(section.phase==='front-matter')continue;
  for(const block of section.blocks??[]){
   if(block.type==='page-break')continue;
   const role=blockRole(block),actual=ROLE_FAMILY[role]??null;
   // A role the teacher or changeBlockRole already set is a decision, not a guess.
   if(block.sourceReview?.roleBefore)continue;
   const group=groups.get(block.id)??groups.get(block.sourceAtom?.id),read=headers.get(block.id)??null;
   const expectedGroup=group?.family??null,expectedHeader=headerFamily(read);
   // The block's own label says what the import took it to be; a role that disagrees with it was changed since.
   const label=block.sourceAtom?.label,expectedLabel=headerFamily(label)??(/(?:^|[-_ ])review(?:$|[-_ ])/i.test(block.id)?'review':null);
   const expected=expectedHeader??expectedGroup??expectedLabel;
   // Weak evidence is not enough to move a block: an inventory "teaching" group is a catch-all (a Key
   // Ideas box is one), a practice group holds its guided practice, and a block id naming "review"
   // does not make a numbered exercise a review.
   const weak=!expectedHeader&&(expectedGroup==='theory'&&group?.kind&&!headerFamily(group.header)&&['key-ideas','review','activity','guided'].includes(actual)
    ||expectedGroup==='practice'&&actual==='guided'||!expectedGroup&&actual==='practice');
   if(expected&&actual&&expected!==actual&&!weak){
    const solutionsShow=expected==='guided'&&teachingQuestionMode(block,DEFAULT_OPTIONS,'student')==='worked';
    const origin=expectedHeader?`the source prints "${read}"`:expectedGroup?`the source group is "${group.header||group.kind}"`:`the block is labelled "${label||block.id}"`;
    out.push({kind:'role-mismatch',blockId:block.id,role,actual,expected,suggestedRole:FAMILY_ROLE[expected],
     source:expectedHeader?'region-header':expectedGroup?'inventory':'label',
     // When the header words and the inventory group disagree the model is asked.
     ambiguous:!!(expectedHeader&&expectedGroup&&expectedHeader!==expectedGroup),
     detail:`role ${role} but ${origin} (${expected})`+(solutionsShow?'; its solutions would show in the Questions edition':'')});
   }
   // An example with no solution is practice shown as a demonstration: its answers or blanks are on show.
   const unsolved=block.type==='worked-example'?!!block.examples?.length:block.type==='question'&&hasAnswers(block);
   if(actual==='example'&&unsolved&&!block.pairedBlockId&&block.presentation?.studentRole!=='your-turn'&&!hasWorking(block)&&!block.sourceReview?.responses?.some(r=>r.kind==='none')){
    out.push({kind:'example-without-working',blockId:block.id,role,actual,expected:'guided',suggestedRole:'guided-practice',ambiguous:false,detail:'role example but the block has no worked solution to demonstrate; students would see its answers'});
   }
   // Your-turn and guided blocks keep their solutions out of the Questions edition.
   if(teachingAnswerCategory(block)==='guided'&&hasAnswers(block)&&!block.presentation?.hideStudentSolutions&&block.presentation?.studentRole==='your-turn'){
    out.push({kind:'solutions-visible',blockId:block.id,role,actual,expected:actual,ambiguous:false,detail:'your-turn block does not hide its solutions in the Questions edition (presentation.hideStudentSolutions)'});
   }
  }
 }
 return out;
}

// The repair for one finding, a pure project -> project step. Role mismatches use the
// existing changeBlockRole (which refuses what it cannot do honestly); a missing hide switch is set.
export function applyRoleFix(project,finding,changeRole){
 if(finding.kind==='solutions-visible'){
  const next=structuredClone(project);
  for(const section of next.sections)for(const block of section.blocks)if(block.id===finding.blockId)block.presentation={...block.presentation,hideStudentSolutions:true};
  return next;
 }
 if(!finding.suggestedRole)throw Error('No role to change to');
 return changeRole(project,finding.blockId,finding.suggestedRole);
}
