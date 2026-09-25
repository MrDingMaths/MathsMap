import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {inventoryShading,auditShading} from './check-diagram-shading.mjs';
import {inspectStoredBookletPalette} from './audit-booklet-palette.mjs';
import {solidAcceptance} from '../audit-solid-visibility.mjs';
const i=process.argv.indexOf('--run-dir');if(i<0)throw Error('Use --run-dir DIR');
const dir=path.resolve(process.argv[i+1]),protocol=JSON.parse(fs.readFileSync(path.join(dir,'protocol.json')));
const totals=[];
for(const arm of protocol.arms)for(const sample of protocol.samples){
 const base=path.join(dir,arm.id,sample.id),file=path.join(base,'project.json');if(!fs.existsSync(file))continue;
 const project=JSON.parse(fs.readFileSync(file)),projectHash=crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
 const out=path.join(base,'content-audit.json');if(fs.existsSync(out)&&JSON.parse(fs.readFileSync(out)).projectHash===projectHash)continue;
 const figures=inventoryShading(process.cwd(),[file]);
 const result={projectHash,at:new Date().toISOString(),diagnosticOnly:true,palette:inspectStoredBookletPalette(project),visibility:solidAcceptance(project,{}),
  shading:auditShading(figures,{reviews:{},images:{}}),figures:figures.map(f=>({location:f.location,sourceHash:f.sourceHash,contextHash:f.contextHash,candidates:f.candidates})),
  note:'No acceptance records are invented. Missing source-hashed review is reported separately from directly detected content defects; raw candidates remain unchanged.'};
 fs.writeFileSync(out,JSON.stringify(result,null,2));totals.push({arm:arm.id,sample:sample.id,palette:result.palette.length,visibility:result.visibility.length,shading:result.shading.length,figures:figures.length});
}
console.log(JSON.stringify(totals));
