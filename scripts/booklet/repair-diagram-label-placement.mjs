import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
import {visitActiveDiagrams,normaliseDiagramColours} from './normalise-diagram-colours.mjs';
import {revisionHash} from './bank-sync.mjs';

export function applyLabelPlacements(value,repairs){
  const next=structuredClone(value),records=[],byId=new Map(repairs.map(r=>[r.id,r]));
  visitActiveDiagrams(next,(node,location)=>{
    const repair=byId.get(node.id);if(!repair||node.format!=='tikz')return;
    const before=node.code;
    for(const change of repair.changes){
      if(node.code.includes(change.after))continue;
      assert.ok(node.code.includes(change.before),'Diagram changed; review placement before applying: '+node.id);
      node.code=node.code.replace(change.before,change.after);
    }
    if(node.code!==before)records.push({id:node.id,location,before:revisionHash(before),after:revisionHash(node.code),departure:'Label placement adjusted for 10 pt type; geometry, values, rotation and colours retained.'});
  });
  return {next,records};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const repairs=JSON.parse(fs.readFileSync('booklets/provenance/diagram-label-placements-2026-09-11.json')).repairs;
  const report=await normaliseDiagramColours({apply:process.argv.includes('--apply'),migrate:value=>applyLabelPlacements(value,repairs),policy:'Reviewed native label placement at 10 pt'});
  fs.writeFileSync('.booklet-work/diagram-typography/placement-transaction.json',JSON.stringify(report,null,2));
  console.log(JSON.stringify({...report,projects:report.projects.map(p=>({id:p.id,changed:p.records.length})),bank:report.bank.length}));
}
