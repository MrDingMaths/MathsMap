import { HOUSE_STYLE_PROMPT } from '../../src/lib/booklet-house-style.js';
import { SOLUTION_CONVENTIONS } from './solution-conventions.mjs';
// Isolated, immutable, single-attempt fresh reconstruction comparison.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawn, spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { rankEvidence, textWindows, nearbyAssetOccurrences, supplementalAssetLinks } from './transcription-packet.mjs';
import { runStructured } from '../agy/lib/agy-structured.mjs';
import { DIRECT_AGENT, DIRECT_AGENT_CONFIG, INSTALLED_READER_PROFILE } from './transcription-direct.mjs';
import { normalizeDocument } from '../../public/libs/maths-editor/document-model.mjs';
export const ARMS=[{id:'A',provider:'codex',model:'gpt-6-astra',effort:'low'},{id:'B',provider:'codex',model:'gpt-5.6-luna',effort:'max'},{id:'C',provider:'agy',model:'gemini-3.8-flash-high',effort:'high'}];
export const PACKETS=[[1,2,3],[7,9,13],[14,16,24],[28,29,33]];
const read=p=>fs.readFileSync(p,'utf8').replace(/^\uFEFF/,'');
const json=p=>JSON.parse(read(p));
export const sha=v=>crypto.createHash('sha256').update(v).digest('hex');
const save=(p,v)=>{fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,typeof v==='string'?v:JSON.stringify(v,null,2)+'\n',{flag:'wx'});};
const root=path.resolve(import.meta.dirname,'../..');
export function reconstructionPrompt(stage,promptVersion=4){
 const names={reconstruction:`scripts/booklet/prompts/reconstruction-v${promptVersion}.md`,diagrams:`scripts/booklet/prompts/diagram-reconstruction-v${promptVersion}.md`,tikz:'docs/tikz-prompt.md'};
 if(!names[stage])throw new Error('Unknown reconstruction stage');
 return read(path.join(root,names[stage]))+(['reconstruction','diagrams'].includes(stage)&&promptVersion>=4?'\n\n'+HOUSE_STYLE_PROMPT:'')+(stage==='reconstruction'&&promptVersion>=4?'\n\n'+SOLUTION_CONVENTIONS:'');
}
const filesBelow=dir=>fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?filesBelow(path.join(dir,e.name)):[path.join(dir,e.name)]);
export function rendererPins(){return Object.fromEntries(['src','public/libs/maths-editor','public/libs/tikzjax'].flatMap(d=>filesBelow(path.join(root,d))).map(p=>[path.relative(root,p).replaceAll('\\','/'),sha(fs.readFileSync(p))]));}
export function verifyPins(pins,dir=root){for(const [name,hash] of Object.entries(pins))if(sha(fs.readFileSync(path.join(dir,name)))!==hash)throw new Error('Frozen input changed: '+name);}
export function diagramRecords(value){const found=[];const walk=v=>{if(!v||typeof v!=='object')return;if(v.format==='tikz'&&v.id)found.push(v);Object.values(v).forEach(walk);};walk(value);return found;}
export function mergeDiagrams(candidate,reply){
  const copy=structuredClone(candidate), records=diagramRecords(copy), got=reply?.diagrams;
  if(!Array.isArray(got)||got.length!==records.length||new Set(got.map(d=>d.id)).size!==records.length)throw new Error('Diagram stage coverage mismatch');
  for(const d of records){const result=got.find(x=>x.id===d.id);if(!result||!/^\s*\\begin\{tikzpicture\}/.test(result.code??'')||!result.code.trim().endsWith('\\end{tikzpicture}'))throw new Error('Missing complete TikZ: '+d.id);d.code=result.code;if(result.mathematicalModel)d.mathematicalModel=result.mathematicalModel;d.uncertainties=result.uncertainties??[];d.reviewStatus='needs-review';}
  return copy;
}
export function candidateChecks(candidate,pages){
  const flags=[];const add=(id,code,note)=>flags.push({rootId:id,code,severity:'major',note});
  if(JSON.stringify(candidate?.pages?.map(p=>p.pageNumber).sort((a,b)=>a-b))!==JSON.stringify([...pages].sort((a,b)=>a-b)))add(null,'coverage','Missing, duplicate or unexpected page');
  const seen=new Set();
  const walk=(v,key='')=>{if(!v||typeof v!=='object')return;if(key==='sourceAtom')return;
    if(v.id){if(seen.has(v.id))add(v.id,'duplicate-id','Duplicate content identity');seen.add(v.id);}
    if(v.format==='maths-editor-document-v1'){try{normalizeDocument(v);}catch(e){add(v.id,'document',e.message);}}
    if(v.type==='table'){
      const widths=v.rows?.map(r=>r.reduce((n,c)=>n+(c.colspan??1),0))??[];
      if(new Set(widths).size>1&&!v.rows.flat().some(c=>(c.rowspan??1)>1))add(v.id,'table-shape','Rows have different column counts');
      const cells=new Set(v.rows?.flat().map(c=>c.id));for(const a of v.annotations??[])if(!cells.has(a.cellId)||(a.type==='arrow'&&!cells.has(a.toCellId)))add(v.id,'annotation-anchor','Annotation references a missing cell');
    }
    if(v.format==='image'&&!v.retentionReason)add(v.id,'retained-image','Image requires a reconstruction exception');
    if(v.format==='tikz'&&!v.code?.trim())add(v.id,'missing-tikz','Diagram has no rendered code');
    if(v.answer&&/\b(plot|sketch|draw.*(?:graph|line))\b/i.test(typeof v.prompt==='string'?v.prompt:'' )&&!(v.answer.solutionDiagrams?.length))add(v.id,'missing-plot-answer','Graphical task has no solution diagram');
    for(const [k,x] of Object.entries(v)){if(typeof x==='string'&&['prompt','content','short','worked','theorySolution'].includes(k)){
      const prose=x.replace(/\$\$[\s\S]*?\$\$|(?<!\\)\$[^$]*\$/g,'');if(/\\(?:quad|qquad|frac|times|div)\b/.test(prose))add(v.id,'raw-latex','Bare TeX outside mathematics');
    }else walk(x,k);}
  };walk(candidate);return flags;
}
export function prepareBenchmark(runDir,out,{packets:requestedPackets=PACKETS,arms=ARMS,promptVersion=3}={}){
  runDir=path.resolve(runDir);out=path.resolve(out);if(fs.existsSync(out))throw new Error('Benchmark directory already exists');
  const manifest=json(path.join(runDir,'manifest.json')), word=read(path.join(runDir,'evidence/word/document.md')),windows=textWindows(word,4500,600);
  const teacher=read(path.join(runDir,'evidence/teacher/pages.txt')).split('\f').map((text,i)=>({sourcePage:i+1,text}));
  const indexed=json(path.join(runDir,'evidence/word/asset-occurrences.json')).occurrences,occurrences=[...indexed,...supplementalAssetLinks(word,indexed)];
  fs.mkdirSync(out,{recursive:true});
  const packets=requestedPackets.map((pages,i)=>{
    const dir=path.join(out,'inputs','packet-'+(i+1)),images=[],evidence=[],pins={};fs.mkdirSync(dir,{recursive:true});
    const copy=(source,name)=>{const target=path.join(dir,name);fs.mkdirSync(path.dirname(target),{recursive:true});fs.copyFileSync(source,target,fs.constants.COPYFILE_EXCL);pins[name]=sha(fs.readFileSync(target));return name;};
    const context=[...new Set(pages.flatMap(p=>[p-1,p,p+1]).filter(p=>p>=1&&p<=manifest.selectedPages.at(-1)))].sort((a,b)=>a-b);
    for(const n of context){const prefix=`evidence/pages/page-${String(n).padStart(3,'0')}`;const name=copy(path.join(runDir,prefix+'.png'),prefix+'.png');images.push({path:name,role:pages.includes(n)?'requested student page':'context only',page:n});if(pages.includes(n))evidence.push({source:'student page '+n,text:read(path.join(runDir,prefix+'.txt'))});}
    const excerpts=new Map(),teachers=new Map();
    for(const p of evidence){for(const e of rankEvidence(p.text,windows,2))excerpts.set(e.start,e);for(const e of rankEvidence(p.text,teacher,2))teachers.set(e.sourcePage,e);}
    for(const e of excerpts.values())evidence.push({source:`Word candidate characters ${e.start}-${e.end}; verify against source image`,text:e.text});
    for(const e of teachers.values()){
      evidence.push({source:`Teacher page ${e.sourcePage}; candidate only, match by mathematics and identity`,text:e.text});
      const name=`evidence/teacher/page-${e.sourcePage}.png`,target=path.join(dir,name);fs.mkdirSync(path.dirname(target),{recursive:true});
      const proc=spawnSync('pdftoppm',['-f',String(e.sourcePage),'-l',String(e.sourcePage),'-scale-to','1600','-png','-singlefile',manifest.source.teacherPdf,target.slice(0,-4)],{windowsHide:true,encoding:'utf8'});if(proc.status!==0)throw new Error(proc.stderr||'Teacher render failed');pins[name]=sha(fs.readFileSync(target));images.push({path:name,role:'candidate teacher evidence',page:e.sourcePage});
    }
    const assets=nearbyAssetOccurrences(occurrences,[...excerpts.values()],0).map(a=>{const absolute=path.resolve(a.path),relative=path.relative(runDir,absolute).replaceAll('\\','/');if(relative.startsWith('../'))throw new Error('Unexpected source asset');if(!pins[relative])copy(absolute,relative);return{...a,path:relative};});
    save(path.join(dir,'evidence.json'),{images,evidence,assets});pins['evidence.json']=sha(fs.readFileSync(path.join(dir,'evidence.json')));
    return{id:'packet-'+(i+1),pages,directory:path.relative(out,dir),images,pins};
  });
  const prompts={};for(const [stage,name]of Object.entries({reconstruction:`scripts/booklet/prompts/reconstruction-v${promptVersion}.md`,diagrams:`scripts/booklet/prompts/diagram-reconstruction-v${promptVersion}.md`,tikz:'docs/tikz-prompt.md'})){const text=reconstructionPrompt(stage,promptVersion);save(path.join(out,'inputs',stage+'.md'),text);prompts[stage]={path:'inputs/'+stage+'.md',sha256:sha(text)};}
  const benchmark={format:'mathsmap-reconstruction-benchmark-v1',createdAt:new Date().toISOString(),sourceRun:manifest.id,sourceHashes:{pdf:manifest.source.pdfHash,docx:manifest.source.docxHash},arms,packets,prompts,promptVersion,schema:{kind:'embedded reconstruction contract',sha256:prompts.reconstruction.sha256},rendererPins:rendererPins(),timeoutMs:900000,attempts:1,concurrencyPerArm:1,transportDifferences:'Codex attaches the common student/context/teacher images and uses read-only execution; AGY reads the same images through its verified reader profile. Optional original Word graphics are available at listed packet paths. Tool use is logged. This compares configured systems, not an isolated model capability.',scoring:{critical:['wrong mathematics','missing question/part','practice answer leak'],major:['missing diagram','lost scaffold','duplicate content','wrong layout','clipping'],minor:['typography','small spacing difference'],reviewed:false}};
  for(const file of Object.keys(benchmark.rendererPins).filter(f=>!f.startsWith('public/libs/tikzjax/'))){const dest=path.join(out,'frozen-renderer',file);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.copyFileSync(path.join(root,file),dest,fs.constants.COPYFILE_EXCL);}
  save(path.join(out,'benchmark.json'),benchmark);return benchmark;
}
function decode(text){return JSON.parse(text.trim().replace(/^```(?:json)?\s*/,'').replace(/\s*```$/,''));}
async function codexRun({arm,cwd,prompt,images,out,timeoutMs}){
  const raw=path.join(out,'last-message.txt'),command=process.env.BOOKLET_CODEX_BIN??'codex';
  const args=['exec','--ephemeral','--ignore-user-config','--skip-git-repo-check','--sandbox','read-only','-C',cwd,'--model',arm.model,'-c',`model_reasoning_effort="${arm.effort}"`,'--json','--output-last-message',raw];
  for(const image of images)args.push('--image',image);args.push('-');
  const stream=fs.createWriteStream(path.join(out,'events.jsonl'),{flags:'wx'}),errors=fs.createWriteStream(path.join(out,'stderr.txt'),{flags:'wx'});const start=Date.now();let usage=null,observedModel=null;
  await new Promise((resolve,reject)=>{const child=spawn(command,args,{cwd,windowsHide:true,shell:false,stdio:['pipe','pipe','pipe']});let buffer='',failure=null;
    const timer=setTimeout(()=>{failure=new Error('Benchmark invocation exceeded 15 minutes');child.kill();},timeoutMs);
    child.stdout.on('data',chunk=>{stream.write(chunk);buffer+=chunk;let end;while((end=buffer.indexOf('\n'))>=0){const line=buffer.slice(0,end);buffer=buffer.slice(end+1);try{const e=JSON.parse(line);if(e.usage)usage=e.usage;if(e.model)observedModel=e.model;}catch{}}});child.stderr.pipe(errors);child.stdin.on('error',e=>{failure=e;});child.on('error',e=>{failure=e;});child.on('close',code=>{clearTimeout(timer);stream.end();if(failure)reject(failure);else if(code!==0)reject(new Error('Codex exited '+code));else resolve();});child.stdin.end(prompt);
  });
  return{result:decode(read(raw)),metrics:{wallMs:Date.now()-start,usage,observedModel,requestedModel:arm.model,effort:arm.effort}};
}
async function stageRun(base,m,packet,arm,stage,candidate){
  const dir=path.join(base,'runs',arm.id,packet.id,stage);if(fs.existsSync(dir))return fs.existsSync(path.join(dir,'result.json'))?json(path.join(dir,'result.json')):null;
  fs.mkdirSync(dir,{recursive:true});const startedAt=new Date().toISOString(),start=Date.now();
  const inputDir=path.join(base,packet.directory);verifyPins(packet.pins,inputDir);verifyPins(m.rendererPins);
  const sources=json(path.join(inputDir,'evidence.json'));
  const textEvidence=JSON.stringify({...sources,images:sources.images.map(i=>({...i,path:path.join(inputDir,i.path)})),assets:sources.assets.map(a=>({...a,path:path.join(inputDir,a.path)}))});
  let prompt=read(path.join(base,m.prompts[stage].path))+`\n\nRequested pages: ${packet.pages.join(', ')}. Reconstruct each exactly once. All source paths are confined to ${inputDir}. Only read listed evidence images if needed; do not use shell, web, search, filesystem exploration or edits. Return the final JSON directly.\n\nEVIDENCE:\n`+textEvidence;
  if(stage==='diagrams')prompt+='\n\nFULL TIKZ MANUAL:\n'+read(path.join(base,m.prompts.tikz.path))+'\n\nTHIS ARM RECONSTRUCTION:\n'+JSON.stringify(candidate)+'\n\nREQUESTED DIAGRAMS:\n'+JSON.stringify(diagramRecords(candidate));
  save(path.join(dir,'request.txt'),prompt);let metrics=null,observedModel=null;
  try{
    const out=arm.provider==='agy'?await runStructured({cwd:inputDir,prompt,agent:DIRECT_AGENT,profilePath:INSTALLED_READER_PROFILE,profileSha256:sha(DIRECT_AGENT_CONFIG),autoApproveTools:true,model:arm.model,effort:arm.effort,timeoutMs:m.timeoutMs,maxToolCalls:80,onProgress:e=>{if(e.event==='init')observedModel=e.model;fs.appendFileSync(path.join(dir,'events.jsonl'),JSON.stringify(e)+'\n');}}):await codexRun({arm,cwd:inputDir,prompt,images:packet.images.map(i=>path.join(inputDir,i.path)),out:dir,timeoutMs:m.timeoutMs});
    metrics=out.metrics;save(path.join(dir,'result.json'),out.result);save(path.join(dir,'execution.json'),{status:'completed',startedAt,wallMs:Date.now()-start,arm,observedModel:observedModel??metrics.observedModel??null,metrics,promptHash:sha(prompt),resultHash:sha(JSON.stringify(out.result))});return out.result;
  }catch(e){save(path.join(dir,'execution.json'),{status:'failed',startedAt,wallMs:Date.now()-start,arm,metrics:e.metrics??metrics,error:e.message,promptHash:sha(prompt)});if(e.envelope)save(path.join(dir,'failed-envelope.json'),e.envelope);return null;}
}
export async function runBenchmark(base){
  base=path.resolve(base);const m=json(path.join(base,'benchmark.json'));verifyPins(m.rendererPins);for(const p of Object.values(m.prompts))if(sha(read(path.join(base,p.path)))!==p.sha256)throw new Error('Benchmark prompt changed');
  const lock=path.join(base,'execution.lock');const fd=fs.openSync(lock,'wx');try{
    for(const [index,packet]of m.packets.entries()){
      const order=[...m.arms.slice(index%3),...m.arms.slice(0,index%3)];
      await Promise.all(order.map(async arm=>{
        console.log(JSON.stringify({arm:arm.id,packet:packet.id,stage:'reconstruction',event:'start'}));
        const candidate=await stageRun(base,m,packet,arm,'reconstruction');if(!candidate){console.log(JSON.stringify({arm:arm.id,packet:packet.id,event:'failed'}));return;}
        const diagrams=diagramRecords(candidate);let result=candidate;
        if(diagrams.length){console.log(JSON.stringify({arm:arm.id,packet:packet.id,stage:'diagrams',count:diagrams.length,event:'start'}));const reply=await stageRun(base,m,packet,arm,'diagrams',candidate);if(!reply)return;try{result=mergeDiagrams(candidate,reply);}catch(e){const file=path.join(base,'runs',arm.id,packet.id,'integration-error.json');if(!fs.existsSync(file))save(file,{error:e.message});return;}}
        const target=path.join(base,'runs',arm.id,packet.id,'candidate.json');if(!fs.existsSync(target)){save(target,result);save(path.join(base,'runs',arm.id,packet.id,'checks.json'),candidateChecks(result,packet.pages));}
        console.log(JSON.stringify({arm:arm.id,packet:packet.id,event:'completed',flags:candidateChecks(result,packet.pages).length}));
      }));
    }
  }finally{fs.closeSync(fd);fs.unlinkSync(lock);}
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){const[cmd,...args]=process.argv.slice(2);if(cmd==='prepare')console.log(JSON.stringify(prepareBenchmark(args[0],args[1]),null,2));else if(cmd==='run')await runBenchmark(args[0]);else throw new Error('Use prepare RUN_DIR OUTPUT_DIR or run BENCHMARK_DIR');}
