// Apply an explicitly reviewed answer.short amendment register. No automatic
// difficulty-based authoring: context and wording are reviewed before this step.
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {normaliseDiagramColours} from './normalise-diagram-colours.mjs';
import {revisionHash} from './bank-sync.mjs';
import {isDocument,fromSource,contentSource} from '../../src/lib/document-content.js';

export function appendShortAnswerMethod(value,method,id){
  if(!isDocument(value))return `${value}\n\n${method}`;
  const paragraph=fromSource(method).blocks;
  paragraph.forEach((b,i)=>{b.id=`${id}-short-method-${i+1}`;});
  return {...value,blocks:[...value.blocks,...paragraph]};
}

export function shortAnswerMethodMigration(register){
  return project=>{
    const selected=register.amendments.filter(r=>r.project===project.id);
    if(!selected.length)return {next:project,records:[]};
    const next=structuredClone(project),records=[],found=new Set();
    const blocks=project.sections.flatMap(s=>s.blocks);
    for(const record of selected)for(const context of record.context){
      assert.equal(revisionHash(blocks.find(b=>b.id===context.id)),context.blockHash,`Teaching context changed: ${project.id}/${context.id}`);
    }
    const visit=(node,location)=>{
      const record=selected.find(r=>r.node===node.id);
      if(record){
        found.add(record.node);
        assert.equal(revisionHash(node.prompt),record.promptHash,`Question changed: ${project.id}/${node.id}`);
        assert.equal(revisionHash(node.answer.worked),record.workedHash,`Worked context changed: ${project.id}/${node.id}`);
        if(revisionHash(node.answer.short)!==record.after){
          assert.equal(revisionHash(node.answer.short),record.before,`Short answer changed: ${project.id}/${node.id}`);
          node.answer.short=appendShortAnswerMethod(node.answer.short,record.method,node.id);
          assert.equal(revisionHash(node.answer.short),record.after,'Reviewed amendment hash');
          if(typeof node.answer.provenance==='string')node.answer.provenance={short:'authored',worked:node.answer.provenance};
          else if(node.answer.provenance)node.answer.provenance.short='authored';
          records.push({id:node.id,location,before:record.before,after:record.after});
        }
      }
      node.children?.forEach((child,i)=>visit(child,`${location}/children/${i}`));
    };
    next.sections.forEach((s,si)=>s.blocks.forEach((b,bi)=>{if(b.content)visit(b.content,`/sections/${si}/blocks/${bi}/content`);}));
    assert.equal(found.size,selected.length,`Every reviewed target exists: ${project.id}`);
    return {next,records};
  };
}

if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const arg=(name,fallback)=>{const i=process.argv.indexOf(name);return i<0?fallback:process.argv[i+1];};
  const file=arg('--register','booklets/provenance/adaptive-short-answers-2026-09-16.json');
  const register=JSON.parse(await fs.readFile(file,'utf8'));
  for(const record of register.amendments){
    assert.ok(record.context.length,`Missing reviewed teaching context: ${record.node}`);
    assert.ok(contentSource(record.method).split(/\s+/).length<=25,`Method exceeds 25 words: ${record.node}`);
  }
  // This shared transaction stages the bank, checks ownership/conflicts, retains
  // revisions and rejects stale files before committing the complete change.
  const report=await normaliseDiagramColours({apply:process.argv.includes('--apply'),migrate:shortAnswerMethodMigration(register),policy:register.policy});
  const reportFile=arg('--report');if(reportFile)await fs.writeFile(reportFile,JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify({applied:report.applied,files:report.files,projects:report.projects.map(p=>({id:p.id,methods:p.records.length}))}));
}
