// Reports practice questions whose part labels restart inside one question
// (a-d under one instruction, then a-d again under the next). Restarted labels
// force the answer sections to print a position number and repeat the group's
// instruction beside every answer (`20(4)c`). House style labels the parts of
// one question in a single sequence (a-j), which needs neither. Report only:
// each finding carries the labels a repair would assign.
import fs from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {arrangesLabelledParts,firstAnswerNode} from '../../src/lib/booklet-exercises.js';
import {isPractice} from '../../src/lib/booklet-flow.js';

const text=node=>String(node.label??'').trim();
const isWrapper=node=>node.label!=null&&!text(node)&&node.children?.length>0;
const ROMAN=/^(?:x{0,3})(?:ix|iv|v?i{0,3})$/;
const roman=n=>[['x',10],['ix',9],['v',5],['iv',4],['i',1]].reduce((out,[symbol,value])=>{while(n>=value){out+=symbol;n-=value;}return out;},'');
const REFERENCE=/\b[Pp]arts?\s*\(?(?:[a-z]|i{2,3}|iv|vi{1,3}|ix)\)?(?![a-zA-Z(])/;

// One finding per parent whose blank-labelled groups repeat part labels.
// `labels` maps node id to [current, proposed]; `manual` names what stops an
// automatic repair.
export function restartedPartLabels(project) {
  const findings=[];
  const continued=new Set((project.sections??[]).flatMap(section=>section.blocks??[]).flatMap(block=>[block.flow?.continuationOf??block.continuationOf,(block.flow?.continuationOf??block.continuationOf)&&block.id]).filter(Boolean));
  for(const section of project.sections??[])for(const block of section.blocks??[]){
    if(!isPractice(block)||!block.content||typeof block.content!=='object')continue;
    const responses=block.sourceReview?.responses??[];
    const visit=parent=>{
      for(const child of parent.children??[])visit(child);
      const restarted=(parent.children??[]).filter(child=>isWrapper(child)&&child.children.every(text)&&!arrangesLabelledParts(child,parent));
      if(!restarted.length)return;
      const slots=parent.children.flatMap(child=>isWrapper(child)?child.children:[child]);
      const manual=[];
      if(block.presentation?.sourceResponseLabels===true)manual.push('source response labels are pinned');
      if(continued.has(block.id))manual.push('question continues across blocks');
      if(slots.some(isWrapper))manual.push('nested unlabelled groups');
      if(restarted.some(group=>new Set(group.children.map(text)).size!==group.children.length))manual.push('a label repeats inside one group');
      const named=slots.map(text).filter(Boolean);
      const style=named.every(label=>ROMAN.test(label))&&named.includes('ii')?'roman':named.every(label=>/^[a-z]$/.test(label))?'alpha':null;
      if(!style)manual.push('labels are neither a-z nor roman numerals');
      const labelled=slots.filter(slot=>text(slot)||firstAnswerNode(slot,responses)===slot&&(slot.answer?.short||slot.answer?.worked));
      if(style==='alpha'&&labelled.length>26)manual.push('more than 26 parts');
      if(REFERENCE.test(JSON.stringify(block.content)))manual.push('wording refers to a part by label');
      const labels=Object.fromEntries(labelled.map((slot,index)=>[slot.id,[text(slot),style==='roman'?roman(index+1):String.fromCharCode(97+index)]]));
      findings.push({project:project.id,blockId:block.id,parentId:parent.id,groups:restarted.map(group=>group.id),current:slots.map(text),labels,manual,linked:!!block.bankRef});
    };
    visit(block.content);
  }
  return findings;
}

async function main() {
  const args=process.argv.slice(2),strict=args.includes('--strict'),ids=args.filter(arg=>!arg.startsWith('--'));
  const root=path.resolve('booklets/projects');
  const files=ids.length?ids.map(id=>`${id}.json`):(await fs.readdir(root)).filter(file=>file.endsWith('.json')).sort();
  let total=0;
  for(const file of files){
    const findings=restartedPartLabels(JSON.parse(await fs.readFile(path.join(root,file),'utf8')));
    if(!findings.length)continue;
    total+=findings.length;
    console.log(`${file.replace(/\.json$/,'')}: ${findings.length}`);
    for(const finding of findings){
      console.log(`  ${finding.blockId}${finding.parentId===finding.blockId?'':' > '+finding.parentId}  [${finding.current.map(label=>label||'·').join(' ')}] -> [${Object.values(finding.labels).map(([,next])=>next).join(' ')}]${finding.manual.length?'  (by hand: '+finding.manual.join('; ')+')':''}`);
    }
  }
  console.log(total?`${total} question${total===1?'':'s'} restart part labels.`:'No question restarts its part labels.');
  if(strict&&total)process.exitCode=1;
}

if(import.meta.url===pathToFileURL(process.argv[1]??'').href)await main();
