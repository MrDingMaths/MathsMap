// Feedback 4 October 2026: a table line must not store an alignment that its
// cell overrides. Keep what prints: write the cell's alignment onto each such
// line. Every repaired table is rendered before and after and must be identical.
import {pathToFileURL} from 'node:url';
import {normalizeDocument,renderDocument} from '../../public/libs/maths-editor/document-model.mjs';
import {loadBookletProject,saveBookletProject} from './project-studio-server.mjs';
import {dormantAlignment} from './check-dormant-alignment.mjs';

export const projectIds=['comparing-fractions-v1','data-visualisation-1-v1','inverse-functions-v1','logarithms-v1','operations-fractions-decimals-v1','percentage-increase-decrease-change-v1','pythagoras-theorem-v1','stage4-indices-v1'];
const printed=table=>renderDocument(normalizeDocument({blocks:[structuredClone(table)]}));

export function repairDormantAlignment(source){
  const project=structuredClone(source),records=[];
  const walk=(node,blockId)=>{
    if(!node||typeof node!=='object')return;
    if(Array.isArray(node)){for(const child of node)walk(child,blockId);return;}
    if(node.type==='table'&&Array.isArray(node.rows)&&dormantAlignment(node).length){
      const before=printed(node);
      for(const cell of node.rows.flat()){
        if(!cell||cell.preserveParagraphAlignment)continue;
        const shown=cell.align??'center';
        for(const block of cell.blocks??[])if(block?.type==='paragraph'&&['center','right','justify'].includes(block.align)&&block.align!==shown){records.push({blockId,paragraph:block.id,from:block.align,to:shown});block.align=shown;}
      }
      if(printed(node)!==before)throw Error(`Print changed for table ${node.id} in ${blockId}`);
    }
    for(const child of Object.values(node))walk(child,blockId);
  };
  for(const section of project.sections)for(const block of section.blocks)walk(block,block.id);
  return {project,records};
}

if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
  const apply=process.argv.includes('--apply');
  for(const id of projectIds){
    const source=await loadBookletProject(id,{refreshRatings:false}),{project,records}=repairDormantAlignment(source);
    if(!records.length){console.log(`${id}: nothing to repair`);continue;}
    if(dormantAlignment(project.sections).length)throw Error(`${id}: lines remain after repair`);
    if(!apply){console.log(`${id}: would repair ${records.length} line${records.length===1?'':'s'} at revision ${source.revision}`);continue;}
    const saved=await saveBookletProject(project,{expectedRevision:source.revision});
    console.log(`${id}: repaired ${records.length} line${records.length===1?'':'s'}, revision ${source.revision} -> ${saved.revision}`);
  }
}
