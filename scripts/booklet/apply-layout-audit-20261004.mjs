// Dry run stages all approved causes together. Applying requires candidate-hashed
// review evidence, then revision-safe load/save and shared automatic bank sync.
import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {loadBookletProject,saveBookletProject,getProjectBankSync} from './project-studio-server.mjs';
import {REPAIR_DIR,blocks} from './layout-repair-common-20261004.mjs';
import {repairPairedPreset} from './repair-paired-preset-20261004.mjs';
import {repairOneToThree} from './repair-one-to-three-paired-20261004.mjs';
import {repairTaxPaired} from './repair-tax-paired-20261004.mjs';
import {repairResponseLabels} from './repair-response-labels-20261004.mjs';
import {repairRegularGrid} from './repair-regular-grid-20261004.mjs';
import {repairPairedBorders} from './repair-paired-borders-scoped-20261004.mjs';
import {repairDecorativeInnerBox} from './repair-decorative-inner-box-20261004.mjs';
import {repairFormulaAlignment} from './repair-formula-alignment-20261004.mjs';
import {repairMeanAlignment} from './repair-mean-alignment-20261004.mjs';
import {repairGivenWorking} from './repair-given-working-20261004.mjs';
import {repairSquareRootWorking} from './repair-square-root-working-20261004.mjs';
import {repairDuplicateWorkedDiagram} from './repair-duplicate-worked-diagram-20261004.mjs';
export const REPAIRS=[repairPairedPreset,repairOneToThree,repairTaxPaired,repairResponseLabels,repairRegularGrid,repairPairedBorders,repairDecorativeInnerBox,repairFormulaAlignment,repairMeanAlignment,repairGivenWorking,repairSquareRootWorking,repairDuplicateWorkedDiagram];
export const PROJECTS=['rates-v1','operations-fractions-decimals-v1','earning-money-v1','length-v1','area-circles-sectors-v1','area-parallelograms-triangles-v1','logarithms-v1','solve-2-step-equations-v1','data-analysis-2-v1','simple-quadratic-equations-v1','circle-trigonometry-v1'];
export const hash=project=>createHash('sha256').update(JSON.stringify(project)).digest('hex');
export function repairApprovedLayout(source){let project=source,records=[];for(const repair of REPAIRS){const r=repair(project);project=r.project;records.push(...r.records);}return {project,records};}
async function main(){const apply=process.argv.includes('--apply'),only=process.argv.find(x=>x.startsWith('--project='))?.slice(10);await fs.mkdir(REPAIR_DIR,{recursive:true});for(const id of PROJECTS.filter(x=>!only||x===only)){
 const source=await loadBookletProject(id,{refreshRatings:false}),result=repairApprovedLayout(source),candidateHash=hash(result.project);const receipt={at:new Date().toISOString(),projectId:id,inputRevision:source.revision,inputHash:hash(source),candidateHash,records:result.records,status:'candidate'};
 if(apply&&!result.records.length){console.log(JSON.stringify({projectId:id,revision:source.revision,status:'unchanged'}));continue;}
 const beforeFile=path.join(REPAIR_DIR,id+'-before.json'),candidateFile=path.join(REPAIR_DIR,id+'-candidate.json');
 if(apply){const evidenceFile=path.join(REPAIR_DIR,id+'-review.json'),evidence=JSON.parse(await fs.readFile(evidenceFile,'utf8'));if(evidence.candidateHash!==candidateHash||evidence.inputHash!==hash(source)||evidence.status!=='accepted'||!evidence.inspectedPages?.length)throw Error('Current candidate lacks accepted visual evidence; reload and repeat dry run: '+id);const saved=await saveBookletProject(result.project,{expectedRevision:source.revision});const readback=await loadBookletProject(id,{refreshRatings:false});if(hash(saved)!==hash(readback))throw Error('Saved fields did not read back exactly: '+id);receipt.status='saved';receipt.savedRevision=saved.revision;receipt.savedHash=hash(readback);receipt.bankOwnedAffectedBlocks=blocks(result.project).filter(b=>b.bankRef?.id&&result.records.some(r=>r.blockId===b.id)).map(b=>b.id);receipt.sync=await getProjectBankSync(id);}
 else {await fs.writeFile(beforeFile,JSON.stringify(source,null,2)+'\n');await fs.writeFile(candidateFile,JSON.stringify(result.project,null,2)+'\n');}
 await fs.writeFile(path.join(REPAIR_DIR,id+'-receipt.json'),JSON.stringify(receipt,null,2)+'\n');console.log(JSON.stringify({...receipt,sync:receipt.sync?{items:receipt.sync.items?.length}:undefined}));
}}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)await main();
