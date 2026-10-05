// Apply only the reviewed staged maintenance, through Studio's revision-safe
// project/bank transaction. Rendering and explicit inspection are prerequisites.
import fs from 'node:fs';
import path from 'node:path';
import {isDeepStrictEqual as eq} from 'node:util';
import {createHash} from 'node:crypto';
import {artifactHash,projectReviewHash} from './page-review.mjs';
import {resolveComments} from './feedback-closeout.mjs';
import {RUN} from './repair-earning-style-20261004.mjs';
import {loadBookletProject} from './project-studio-server.mjs';
const read=f=>JSON.parse(fs.readFileSync(f,'utf8'));
const write=(f,v)=>fs.writeFileSync(f,JSON.stringify(v,null,2)+'\n');
const base=process.env.BOOKLET_REPAIR_BASE??'http://localhost:5199';
const request=async(id,suffix='',options={})=>{const r=await fetch(base+'/__booklet/projects/'+encodeURIComponent(id)+suffix,options);const data=await r.json();if(!r.ok)throw Error(id+': '+r.status+' '+JSON.stringify(data));return data;};
const equivalentBlock=b=>{const c=structuredClone(b);if(c.bankRef)delete c.bankRef.revision;if(c.flow)delete c.flow.bankDifficulty;return c;};
const resolutions=[
 ['f82704db-06f2-4b77-9f56-cb0c3424df73','Renamed the section Syllabus content and retained all outcomes/bullets in one unboxed editable rich-text block.',[2]],
 ['2254b905-e707-4463-ad65-8a0921c47cca','Stored Units of time and the applicable teaching headers in sentence case.',[3]],
 ['c92ca040-32b6-4baa-ab14-d7272932d8a5','Compacted the Units of time teaching group, fixed the arrow-path style and reduced chart height. Added the four authorized conversion questions, editable methods and 12/12/20/20 mm working space. Month/week conversions use years (12 months and 52 weeks); teaching answers are excluded from practice answer sections.',[3,4]],
 ['bf32dce5-b1e4-45cb-b426-66e02552f462','Audited inner teaching containers and removed confirmed redundant formula/definition cards and tables, including wrappers nested inside cards. Preserved genuine data, response regions and meaningful paired examples.',[5,17,32,37,38,46,61,69,75,90,102,103]],
 ['d50db820-ab67-4916-b4aa-6982f3567e8b','Applied stored sentence-case section, teaching and table headers across applicable current booklets, preserving acronyms, proper names and source evidence; removed the exercise-heading uppercase CSS.',[1,3,17,32]],
 ['018d20c1-756b-4857-9fa0-192b8ade352c','Removed the total-pay formula inner frame. The editable formula remains beneath its shared teaching header. Import guidance now prohibits source-decorative inner frames.',[5]],
 ['73d677d1-05da-4c8d-b8a9-984f9fa1ac69','Removed the redundant penalty-rate reference table, retaining every rate and multiplication instruction as editable text and mathematics.',[17]],
 ['ebcc3b30-7167-43da-aa2c-57ffedc53b2f','Rebuilt all three employee rows and the grouped hours heading as one native editable table. Original a/b/c identities, source values, answers and 28 mm writing allowances remain.',[25,26]],
 ['c4b7f8f7-abe2-4922-9684-2904ba710e2c','Applied the standard light-blue header fill and grey borders to both Question 13 tables and applicable decorative table headers throughout affected books.',[25]],
 ['8232a44b-507e-4877-955b-bafd2b2233f7','Rebuilt Question 18 as one native two-column Worked solution/Explanation table, preserving its permanent demonstration, explanation questions, answers, dotted checking scaffold and 24 mm definition-writing region.',[27,28]],
 ['ade3c655-d77d-45a4-961c-94c42e171f46','Removed the nested Piecework formula frame while retaining the shared teaching container, source prose, editable formulas, examples and guided practice.',[32,33]]
].map(([id,resolution,pages])=>({id,resolution,evidence:{inspectedPages:pages.map(page=>({edition:'student',page})),checks:['source/content preservation','138 focused tests','five-edition scoped QA','Studio mount/reopen','cross-book occurrence audit']}}));
async function main(){
 const audit=read(RUN+'/audit.json'),batch=read(RUN+'/batch-checks.json'),visual=read(RUN+'/cross-book-inspected.json'),content=read(RUN+'/content-checks.json'),exceptions=fs.existsSync(RUN+'/baseline-exceptions.json')?read(RUN+'/baseline-exceptions.json'):[];
 const done=fs.existsSync(RUN+'/publication.json')?read(RUN+'/publication.json'):[];
 const ordered=[...audit.filter(a=>a.projectId!=='earning-money-v1'),...audit.filter(a=>a.projectId==='earning-money-v1')];
 // Complete validation before the first mutation, including latest revisions.
 for(const a of ordered){
  if(done.some(d=>d.projectId===a.projectId))continue;
  const reportFile=a.projectId==='earning-money-v1'?a.dir+'/wrappers-final/feedback-pages.json':batch.find(b=>b.projectId===a.projectId)?.report;
  if(!reportFile)throw Error('Missing render check '+a.projectId);
  const r=read(reportFile),candidate=read(a.candidateFile),exception=exceptions.find(e=>e.project===a.projectId);
  if(!r.passed&&!exception?.verifiedUnchanged)throw Error('Failed render check '+a.projectId);
  if(r.passes.findLast(p=>p.name==='candidate')?.projectHash!==projectReviewHash(candidate))throw Error('Stale render check '+a.projectId);
  if(content.find(c=>c.project===a.projectId)?.issues.length!==0)throw Error('Missing content verification '+a.projectId);
  if(a.projectId!=='earning-money-v1'&&!visual.some(v=>v.project===a.projectId))throw Error('Missing explicit visual inspection '+a.projectId);
  const live=await request(a.projectId);
  if(live.revision!==a.revision)throw Error('Concurrent revision '+a.projectId+'; reconcile and verify before applying');
  if(!eq(await loadBookletProject(a.projectId,{refreshRatings:false}),read(a.beforeFile)))throw Error('Concurrent content edit '+a.projectId+'; reconcile before applying');
 }
 // Immutable owner-bank evidence also catches scope changes made by auto-sync.
 const bankSnapshot=path.join(RUN,'bank-before');fs.mkdirSync(bankSnapshot,{recursive:true});
 const owners=read('booklets/question-bank/.sync/links.json');
 for(const id of Object.keys(owners)){const file='booklets/question-bank/'+id+'.json',dest=path.join(bankSnapshot,id+'.json');if(fs.existsSync(file)&&!fs.existsSync(dest))fs.copyFileSync(file,dest,fs.constants.COPYFILE_EXCL);}
 for(const [name,file]of [['links.json','booklets/question-bank/.sync/links.json'],['manifest.json','booklets/question-bank/manifest.json'],['shading.json','booklets/provenance/diagram-shading-2026-09-12.json']]){const dest=path.join(bankSnapshot,name);if(!fs.existsSync(dest))fs.copyFileSync(file,dest,fs.constants.COPYFILE_EXCL);}
 for(const a of ordered){
  if(done.some(d=>d.projectId===a.projectId))continue;
  let candidate=read(a.candidateFile);
  if(a.projectId==='earning-money-v1'){
   const diagram=candidate.sections.flatMap(s=>s.blocks).find(b=>b.id==='p3-time-conversion-diagram');
   diagram.reviewStatus='reviewed';
   diagram.sourceReview.feedbackDiagramReview={sourceHash:createHash('sha256').update(diagram.code).digest('hex'),edition:'student',page:3,checks:['all 12 conversion arrows and labels retained','10 pt label-size check','final-size printed visual inspection'],evidence:RUN+'/earning-money-v1/pages-final/feedback-pages.json'};
   candidate=resolveComments(candidate,resolutions);
  }
  const live=await request(a.projectId),bankBefore=await request(a.projectId,'/bank-sync');
  if(live.revision!==a.revision||!eq(await loadBookletProject(a.projectId,{refreshRatings:false}),read(a.beforeFile)))throw Error('Concurrent edit '+a.projectId);
  const saved=await request(a.projectId,'',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({project:candidate,expectedRevision:a.revision})});
  const reopened=await request(a.projectId),bankAfter=await request(a.projectId,'/bank-sync');
  if(reopened.revision!==a.revision+1)throw Error('Unexpected saved revision '+a.projectId);
  const blocks=new Map(reopened.sections.flatMap(s=>s.blocks).map(b=>[b.id,b])),wanted=new Map(candidate.sections.flatMap(s=>s.blocks).map(b=>[b.id,b]));
  const mismatched=a.changedBlockIds.filter(id=>!eq(equivalentBlock(blocks.get(id)),equivalentBlock(wanted.get(id))));
  const result={projectId:a.projectId,beforeRevision:a.revision,revision:reopened.revision,blocksChecked:a.changedBlockIds.length,mismatched,candidateHash:artifactHash(a.candidateFile),savedAt:new Date().toISOString(),bankBefore,bankAfter};
  write(path.join(a.dir,'saved.json'),reopened);write(path.join(a.dir,'readback.json'),result);
  done.push(result);write(RUN+'/publication.json',done);
  if(mismatched.length)throw Error('Readback differs '+a.projectId+': '+mismatched.join(', '));
  console.log(JSON.stringify({project:a.projectId,revision:reopened.revision,blocksChecked:a.changedBlockIds.length}));
 }
 write(RUN+'/comment-resolutions.json',resolutions);
}
if(process.argv.includes('--apply'))await main();else console.log('Review staged evidence, then run with --apply. No projects changed.');
