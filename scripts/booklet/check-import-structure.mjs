import fs from 'node:fs';
import {importStructureFindings} from '../../src/lib/booklet-import-structure.js';
const args=process.argv.slice(2),at=args.indexOf('--project-file'),file=args[at+1];
if(at<0||!file)throw Error('Use --project-file FILE');
const findings=importStructureFindings(JSON.parse(fs.readFileSync(file,'utf8')));
console.log(JSON.stringify({projectFile:file,errors:findings.filter(f=>f.severity==='error'),review:findings.filter(f=>f.severity==='review')},null,2));
if(findings.some(f=>f.severity==='error'))process.exitCode=1;
