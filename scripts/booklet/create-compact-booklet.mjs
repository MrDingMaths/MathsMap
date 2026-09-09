// Preview semantic import without creating an intermediate layout project.
import fs from 'node:fs';
import {loadRun} from './transcription.mjs';
import {contentProject} from '../../src/lib/booklet-source-content.js';
import {validateEditableProject} from '../../src/lib/editable-booklet-model.js';
import {importReconstruction} from './import-reconstruction.mjs';
const args=process.argv.slice(2),arg=name=>args[args.indexOf(name)+1];
if(!['--run-id','--input','--project-id'].every(name=>args.includes(name)&&arg(name)))throw Error('Use --run-id ID --input FILE --project-id ID [--apply]');
const runId=arg('--run-id'),input=arg('--input'),projectId=arg('--project-id');
const {manifest}=loadRun(runId),candidate=JSON.parse(fs.readFileSync(input,'utf8').replace(/^\uFEFF/,''));
const preview=contentProject(candidate,{runId,projectId,selectedPages:manifest.selectedPages}),checked=validateEditableProject(preview);
if(!checked.valid)throw Error(checked.errors.join('; '));
console.log(JSON.stringify({id:projectId,topics:preview.topics.length,sections:preview.sections.length,blocks:preview.sections.reduce((n,s)=>n+s.blocks.length,0),mode:'compact'}));
if(args.includes('--apply'))console.log(JSON.stringify({created:(await importReconstruction({runId,input,projectId,mode:'compact'})).id}));
