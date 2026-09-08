// Fresh source reconstruction entry point. Never edits/adopts a historical import.
import fs from 'node:fs';
import path from 'node:path';
import { ARMS, prepareBenchmark, runBenchmark } from './benchmark.mjs';
import { reconstructionHazards } from './source-fidelity.mjs';
const [command,first,second,...args]=process.argv.slice(2),option=name=>args[args.indexOf(name)+1];
if(command==='prepare'){
 const armId=args.includes('--arm')?option('--arm'):'A',arm=ARMS.find(a=>a.id===armId);
 if(armId!=='A')throw new Error('Production transcription is Astra Low. Use benchmark.mjs for explicitly requested model comparisons.');
 const run=path.resolve(first),manifest=JSON.parse(fs.readFileSync(path.join(run,'manifest.json')));
 const pages=args.includes('--pages')?option('--pages').split(',').map(Number):manifest.selectedPages;
 if(!pages.length||pages.some(n=>!Number.isInteger(n)||!manifest.selectedPages.includes(n))||new Set(pages).size!==pages.length)throw new Error('Pages must be unique extracted source page numbers.');
 const size=args.includes('--packet-size')?Number(option('--packet-size')):1;if(![1,2,3].includes(size))throw new Error('Packet size must be 1, 2 or 3.');
 const packets=[];for(let i=0;i<pages.length;i+=size)packets.push(pages.slice(i,i+size));
 const result=prepareBenchmark(run,second,{packets,arms:[arm],promptVersion:4});
 console.log(JSON.stringify({directory:path.resolve(second),arm,pages:result.packets.flatMap(p=>p.pages),stages:['source extraction evidence','editable reconstruction','TikZ generation','human editing'],status:'prepared'},null,2));
}else if(command==='run')await runBenchmark(first);
else if(command==='check'){
 const candidate=JSON.parse(fs.readFileSync(first));
 const hazards=reconstructionHazards(candidate.pages??[]);
 if(!candidate.pages?.length)hazards.push({code:'empty',message:'Reconstruction has no pages'});
 const report={valid:hazards.length===0,hazards};console.log(JSON.stringify(report,null,2));if(!report.valid)process.exitCode=1;
}else throw new Error('Use prepare RUN OUT [--pages 1,2,3] (Astra Low), run DIRECTORY, or check CANDIDATE.');
