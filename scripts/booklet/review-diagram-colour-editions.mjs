// Read-only exports of all current projects/editions, with isolated browser data.
import fs from 'node:fs';
import {spawn} from 'node:child_process';
const reviewRoot=process.env.BOOKLET_DIAGRAM_REVIEW_OUT??'.booklet-work/diagram-colours';
const out=reviewRoot+'/editions';fs.mkdirSync(out,{recursive:true});
const modes=['student','short','worked','with-short','with-worked'],results=[];
function run(args,log){return new Promise(resolve=>{const stream=fs.createWriteStream(log),child=spawn(process.execPath,args,{stdio:['ignore','pipe','pipe'],windowsHide:true});child.stdout.pipe(stream);child.stderr.pipe(stream);child.on('close',code=>{stream.end();resolve(code);});});}
await Promise.all(fs.readdirSync('booklets/projects').filter(f=>f.endsWith('.json')&&(!process.env.BOOKLET_REVIEW_PROJECT||f===process.env.BOOKLET_REVIEW_PROJECT+'.json')).map(async file=>{
 const id=file.replace('.json','');
 for(const mode of modes){
  const pdf=`${out}/${id}-${mode}.pdf`,log=pdf+'.log';
  const args=['scripts/booklet/export-pdf.mjs','--base','http://127.0.0.1:5173','--project',`booklets/projects/${file}`,'--mode',mode,'--out',pdf,'--cache-state',reviewRoot+'/browser-state.json'];
  const exitCode=await run(args,log);
  let draftExitCode=null;
  if(exitCode)draftExitCode=await run([...args,'--draft'],pdf+'.draft.log');
  const row={id,mode,exitCode,draftExitCode,pdf,qa:fs.existsSync(pdf+'.qa.json')?JSON.parse(fs.readFileSync(pdf+'.qa.json')).flatMap(p=>p.issues.map(i=>({page:p.page,...i}))):null,printed:fs.existsSync(pdf+'.printed-qa.json')?JSON.parse(fs.readFileSync(pdf+'.printed-qa.json')).flatMap(p=>p.issues.map(i=>({page:p.page,...i}))):null};
  results.push(row);fs.writeFileSync(out+'/report.json',JSON.stringify(results,null,2));console.log(id,mode,'exit',exitCode,'draft',draftExitCode,'issues',row.qa?.length,row.printed?.length);
 }
}));
if(results.some(r=>r.exitCode))process.exitCode=1;
