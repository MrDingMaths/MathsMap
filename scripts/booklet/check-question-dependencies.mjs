import fs from 'node:fs';
import path from 'node:path';
import {questionDependencyFindings} from '../../src/lib/booklet-question-dependencies.js';
const args=process.argv.slice(2),id=args.find(a=>!a.startsWith('--'));
const files=id?[id+'.json']:fs.readdirSync('booklets/projects').filter(f=>f.endsWith('.json'));
const findings=files.flatMap(file=>questionDependencyFindings(JSON.parse(fs.readFileSync(path.join('booklets/projects',file),'utf8'))));
if(args.includes('--json'))console.log(JSON.stringify(findings,null,2));
else {for(const f of findings)console.log(`${f.projectId}: ${f.blockId} -> ${f.previousBlockId??'(none)'}${f.reviewed?' [reviewed self-contained]':''}: ${[...f.external,...f.references.map(r=>r.reference)].join('; ')}`);console.log(`${findings.length} flagged question(s), ${findings.filter(f=>!f.reviewed).length} need review. Wording identifies candidates, not approval to merge.`);}
if(args.includes('--strict')&&findings.some(f=>!f.reviewed))process.exitCode=1;
