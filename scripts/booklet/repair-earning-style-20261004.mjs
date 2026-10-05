import fs from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {isDeepStrictEqual} from 'node:util';
import {loadBookletProject} from './project-studio-server.mjs';
import {snapshotInput,startFeedbackJob} from './feedback-closeout.mjs';
import {block,find,doc,retire,note,clearArrangement,archiveRequirements} from './layout-repair-common-20261004.mjs';
import {sentenceCaseHeader,isTableHeader,walkImportContent,importStructureFindings} from '../../src/lib/booklet-import-structure.js';
export const RUN='.booklet-work/earning-style-feedback-20261004';
const BLUE='#d3e8fc',BORDER='#cccccc';
const p=(id,text,extra={})=>({id,type:'paragraph',align:'left',inlines:[{type:'text',text}],...extra});
const cell=(id,blocks,extra={})=>({id,type:'cell',align:'left',verticalAlign:'top',blocks,...extra});
function rehomePrompt(part){const blocks=part.prompt.blocks;part.prompt='';part.responseSpace='scaffold';part.answerSpaceMm=0;return blocks;}
function flattenReference(b){const flatten=nodes=>nodes.flatMap(n=>{if(n.type==='layout'&&n.arrangement==='cards'&&n.slots?.length===1){retire(b,[n.id,n.slots[0].id]);return flatten(n.slots[0].blocks);}if(n.type==='table'&&n.rows.every(r=>r.length===1)){retire(b,[n.id,...n.rows.flat().map(c=>c.id)]);return flatten(n.rows.flat().flatMap(c=>c.blocks));}return [n];});b.content.blocks=flatten(b.content.blocks);}
export function repairEarningStyle(input){
 const project=structuredClone(input),changes=[],before=new Map(project.sections.flatMap(s=>s.blocks).map(b=>[b.id,JSON.stringify(b)]));
 const setHeader=(owner,key,path)=>{const prior=owner?.[key],next=sentenceCaseHeader(prior);if(prior!==next){owner[key]=next;changes.push({kind:'sentence-case',path,original:prior,replacement:next});}};
 for(const topic of project.topics??[])setHeader(topic,'title','topics/'+topic.id+'/title');
 for(const section of project.sections){
  setHeader(section,'title','sections/'+section.id+'/title');
  for(const b of section.blocks){
   if(b.type!=='question')setHeader(b,'title',b.id+'/title');setHeader(b,'label',b.id+'/label');
   if(b.sourceAtom){setHeader(b.sourceAtom,'label',b.id+'/sourceAtom/label');setHeader(b.sourceAtom,'visibleSubtitle',b.id+'/sourceAtom/visibleSubtitle');}
   walkImportContent(b.content,n=>{if(n.type!=='table')return;for(const [ri,row]of n.rows.entries())for(const c of row)if(isTableHeader(c,ri)){
    if(['#fce8d5','#fcdfe1'].includes(c.background)&&!/(?:bar|fraction|shade)/i.test(n.id)){changes.push({kind:'table-header-palette',path:b.id+'/'+c.id,original:c.background,replacement:BLUE});c.background=BLUE;n.borderColour=BORDER;n.borderWidthMm=.2;}
    for(const paragraph of c.blocks??[])if(paragraph.type==='paragraph'&&paragraph.inlines?.every(i=>['text','break'].includes(i.type))){
    // Keep run boundaries and formatting; casing depends on the complete heading.
    const original=paragraph.inlines.map(i=>i.type==='break'?'\n':i.text).join(''),replacement=sentenceCaseHeader(original);let offset=0;
    if(original!==replacement){for(const inline of paragraph.inlines){if(inline.type==='break'){offset++;continue;}inline.text=replacement.slice(offset,offset+inline.text.length);offset+=inline.text.length;}changes.push({kind:'sentence-case',path:b.id+'/'+paragraph.id,original,replacement});}
   }}});
  }
 }
 // The same split-table mechanism occurs in several accepted imports. Combine
 // only complete table-only row prompts; preserve the semantic answer leaves.
 for(const finding of importStructureFindings(project).filter(f=>f.kind==='fragmented-table')){
  const b=block(project,finding.blockId);if(project.id==='earning-money-v1'&&b.id==='p17-q13')continue;
  const root=b.content,table=find(root,finding.targetId);
  if(root.children.some(part=>part.questionDiagrams?.length||!part.prompt?.blocks?.length||part.prompt.blocks.some(t=>t.type!=='table'||t.annotations?.length)))continue;
  const rows=root.children.map(part=>part.prompt.blocks.find(t=>t.rows?.flat().some(c=>!isTableHeader(c,0))));
  if(rows.some(t=>!t))continue;
  const headerRows=table.rows.length,rowPartIds=[];table.rowHeights??=[];
  for(const [i,part]of root.children.entries()){
   const rowTable=rows[i];table.rows.push(...rowTable.rows);rowPartIds.push(...rowTable.rows.map(()=>part.id));table.rowHeights.push(...(rowTable.rowHeights??rowTable.rows.map(()=>0)));
   for(const t of part.prompt.blocks)retire(b,[t.id,...(t===rowTable?[]:t.rows.flat().flatMap(c=>[c.id,...c.blocks.map(p=>p.id)]))]);part.prompt='';
   if(part.label){const c=rowTable.rows[0][0],first=c.blocks[0];if(first?.type==='paragraph')first.inlines.unshift({type:'text',text:part.label+') '});}
  }
  const pairedFigures=project.id==='properties-of-geometrical-figures-v1'&&b.id==='p27-properties-activity'?structuredClone(b.presentation?.layoutOverrides?.blockLayouts?.[b.id]?.arrangement):null;
  clearArrangement(project,b);archiveRequirements(b);
  if(pairedFigures){
   const rowOwners=new Set(root.children.map(part=>part.id));
   pairedFigures.root.children=pairedFigures.root.children.filter(n=>n.type!=='item'||!rowOwners.has(n.ref?.split('/')[0]));
   b.presentation.layoutOverrides.blockLayouts[b.id]={arrangement:pairedFigures};
   b.sourceReview.arrangementMeaning='The two rows of three named figures support comparison of corresponding quadrilateral properties. Keep that relationship above the single native response table.';
  }
  if(project.id==='percentages-problems-v1'&&['p34-q8','p36-q1'].includes(b.id)||project.id==='properties-of-geometrical-figures-v1'&&b.id==='p27-properties-activity'){
   b.flow??={};b.flow.tableContinuation={tableId:table.id,headerRows,rowPartIds};b.flow.repeatSharedStem=true;
  }
  if(project.id==='data-analysis-v1'&&b.id==='p24-q2-block'){
   b.flow??={};b.flow.sourcePageBreakBefore=true;
   b.sourceReview??={};b.sourceReview.intentionalDepartures??=[];
   b.sourceReview.intentionalDepartures.push('Keep the consolidated nine-row response table together on a fresh page; the former separated rows could paginate independently.');
  }
  changes.push({kind:'consolidated-table',path:b.id+'/'+table.id,rows:table.rows.length});
 }
 if(project.id==='earning-money-v1'&&!block(project,'p3-time-conversion-activity')){
  const syllabus=block(project,'p2-syllabus-block');syllabus.type='rich-text';delete syllabus.variant;delete syllabus.title;delete syllabus.label;
  project.sections.find(s=>s.blocks.includes(syllabus)).title='Syllabus content';
  for(const id of ['p4-total-pay-formula','p12-penalty-rate-reference','p22-piecework-formulas-block','p25-royalties-formula','p26-commission-formulas','p31-salary-formulas','p41-formulas-block','p46-gross-income-block','p46-taxable-income-formula-block','p49-net-income-explanation','p65-formula-box']){const b=block(project,id);flattenReference(b);archiveRequirements(b);clearArrangement(project,b);}
  const q13=block(project,'p17-q13'),root=q13.content,employees=find(root,'p17-q13-employees-header');
  employees.rows.push(...root.children.map(part=>find(part.prompt,part.id+'-row').rows[0]));
  for(const part of root.children){retire(q13,[part.id+'-row']);part.prompt='';}
  clearArrangement(project,q13);archiveRequirements(q13);
  // This is a real table. Label its rows explicitly while keeping stable answer parts.
  employees.widths=[29,21,25,12.5,12.5];
  for(const [i,part]of root.children.entries())employees.rows[i+2][0].blocks[0].inlines.unshift({type:'text',text:part.label+') '});
  for(const table of root.prompt.blocks.filter(n=>n.type==='table')){table.borderColour=BORDER;table.borderWidthMm=.2;for(const [ri,row]of table.rows.entries())for(const c of row)if(isTableHeader(c,ri))c.background=BLUE;}
  const q18=block(project,'p18-q18'),r=q18.content,demo=r.children[0],explanation=r.children[1],definition=explanation.children[0],check=explanation.children[1];
  const left=find(demo.prompt,'p18-q18-left-table'),right=find(explanation.prompt,'p18-q18-right-heading-table'),leftBlocks=left.rows[1][0].blocks;
  const definitionText=p('p18-q18-definition-instruction',definition.prompt,{spaceAfter:24});definition.prompt='';definition.responseSpace='scaffold';definition.answerSpaceMm=0;
  const checkBlocks=rehomePrompt(check),scaffold=checkBlocks.find(n=>n.type==='table');scaffold.marginBefore=0;scaffold.marginAfter=0;
  // Keep genuine label/response alignment inside the explanation cell.
  const paired={id:'p18-q18-paired-table',type:'table',widths:[1,1],padding:2,border:true,borderColour:BORDER,borderWidthMm:.2,rows:[
   [cell(left.rows[0][0].id,left.rows[0][0].blocks,{background:BLUE,align:'center'}),cell(right.rows[0][0].id,right.rows[0][0].blocks,{background:BLUE,align:'center'})],
   [cell(left.rows[1][0].id,leftBlocks,{preserveParagraphAlignment:true,preserveParagraphSpacing:true}),cell('p18-q18-explanation-body-cell',[definitionText,...checkBlocks],{preserveParagraphSpacing:true})]
  ]};
  retire(q18,[left.id,right.id]);r.prompt=doc([p('p18-q18-stem',r.prompt),paired]);demo.prompt='';demo.responseSpace='scaffold';demo.answerSpaceMm=0;explanation.prompt='';delete r.layout;delete r.columns;clearArrangement(project,q18);archiveRequirements(q18);
  const d=block(project,'p3-time-conversion-diagram');
  // Global every-path draw style repaints the arrowhead's normally un-stroked
  // construction paths. Set ordinary line style on actual arrows instead.
  d.code=d.code.replace(',every path/.style={draw=black,line width=0.8pt}','').replaceAll('\\draw[->]','\\draw[->,black,line width=0.8pt]');
  d.code=d.code.replaceAll('2.85','2.1').replaceAll('2.75','2.05').replaceAll('2.65','1.95');d.reviewStatus='needs-review';
  const teaching=block(project,'p3-teaching');find(teaching.content,'p3-teaching-year-equalities').inlines[0].latex=String.raw`1\text{ year}=12\text{ months}=52\text{ weeks}=26\text{ fortnights}`;
  const rules=find(teaching.content,'p3-teaching-rules');rules.items[0].blocks.push(p('p3-per-annum-note','Per annum (p.a.) means per year.'));
  const section=project.sections.find(s=>s.blocks.includes(teaching));
  if(!section.blocks.some(b=>b.id==='p3-time-conversion-activity')){
   const tasks=[['Convert 2 years to months.','24 months',String.raw`$2\times12=24$ months.`],['Convert 24 months to years.','2 years',String.raw`$24\div12=2$ years.`],['Convert 3 months to weeks.','Approximately 13 weeks',String.raw`Using 12 months and 52 weeks per year, $3\div12\times52=13$ weeks.`],['Convert 13 weeks to months.','Approximately 3 months',String.raw`Using 52 weeks and 12 months per year, $13\div52\times12=3$ months.`]];
   const activity={id:'p3-time-conversion-activity',type:'question',sourcePageNumber:3,sourceRefs:[{pageNumber:3}],sourceAtom:{id:'p3-time-conversion-activity-group',kind:'identify',label:'Activity',visibleSubtitle:'Converting units of time'},presentation:{sourceResponseLabels:true},content:{id:'p3-time-conversion-activity-root',type:'group',label:'',prompt:'Use 12 months and 52 weeks per year. Convert through years when changing between months and weeks.',layout:'grid',columns:2,children:tasks.map(([prompt,short,worked],i)=>({id:'p3-time-conversion-activity-'+String.fromCharCode(97+i),type:'part',label:String.fromCharCode(97+i),prompt,answerSpaceMm:i<2?12:20,answer:{short,worked}}))},sourceReview:{responses:[{targetId:'p3-time-conversion-activity-root',kind:'none',label:''},...tasks.map((_,i)=>({targetId:'p3-time-conversion-activity-'+String.fromCharCode(97+i),kind:'working',label:String.fromCharCode(97+i)}))],intentionalDepartures:['User-requested new four-question variation activity, 4 October 2026; not transcribed source content.'],teachingContext:{pdfPages:[3],methodNote:'Convert using the taught year equivalences; never assume four weeks per month.'},workingSpaceEstimate:{method:'solution-steps',estimates:tasks.map((_,i)=>({targetId:'p3-time-conversion-activity-'+String.fromCharCode(97+i),widthMm:83,mathematicalRows:i<2?1:2,answerSpaceMm:i<2?12:20}))}}};
   activity.snapshotKind='local';activity.bankRef=null;
   section.blocks.push(activity);
  }
 }
 const changedBlockIds=[];
 for(const s of project.sections)for(const b of s.blocks)if(before.get(b.id)!==JSON.stringify(b)){note(b,'earning-style-feedback');changedBlockIds.push(b.id);}
 return {project,changes,changedBlockIds,findings:importStructureFindings(project)};
}
async function main(){
 startFeedbackJob(RUN,{task:'Earning Money feedback and shared heading audit'});
 const audit=[];
 for(const name of (await fs.readdir('booklets/projects')).filter(n=>n.endsWith('.json'))){
  const id=name.slice(0,-5),source=await loadBookletProject(id,{refreshRatings:false}),result=repairEarningStyle(source);
  if(!result.changedBlockIds.length&&!result.changes.length)continue;
  let dir=path.join(RUN,id);const prior=await fs.readFile(path.join(dir,'before.json'),'utf8').catch(()=>null);
  if(prior&&!isDeepStrictEqual(JSON.parse(prior),source))dir=path.join(dir,'revision-'+source.revision);
  await snapshotInput(dir,source);await fs.writeFile(path.join(dir,'candidate.json'),JSON.stringify(result.project,null,2)+'\n');
  audit.push({projectId:id,revision:source.revision,dir,beforeFile:path.join(dir,'before.json'),candidateFile:path.join(dir,'candidate.json'),changedBlockIds:result.changedBlockIds,changes:result.changes,findings:result.findings});
 }
 await fs.writeFile(path.join(RUN,'audit.json'),JSON.stringify(audit,null,2)+'\n');
 console.log(JSON.stringify(audit.map(a=>({project:a.projectId,blocks:a.changedBlockIds.length,headers:a.changes.length,errors:a.findings.filter(f=>f.severity==='error').length}))));
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)await main();
