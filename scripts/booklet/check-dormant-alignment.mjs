// Reports table lines whose stored alignment is overridden by their cell.
// A cell imposes its own alignment on every line unless it keeps per-line
// alignment (`preserveParagraphAlignment`), so a paragraph stored as centred in
// a left-aligned cell prints left. For a new import that usually means the
// source alignment was recorded on the wrong node. Report only: existing
// booklets are not repaired here, because changing either value changes print.
import fs from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';

const INTENTIONAL=new Set(['center','right','justify']);

export function dormantAlignment(value,trail=[]) {
  const hits=[];
  const walk=(node,owner)=>{
    if(!node||typeof node!=='object')return;
    if(Array.isArray(node)){for(const child of node)walk(child,owner);return;}
    const next=typeof node.id==='string'&&(node.type==='question'||node.type==='part'||node.content||node.sourceAtom)?node.id:owner;
    if(node.type==='table'&&Array.isArray(node.rows))for(const cell of node.rows.flat()){
      if(!cell||cell.preserveParagraphAlignment)continue;
      const shown=cell.align??'center';
      for(const block of cell.blocks??[])if(block?.type==='paragraph'&&INTENTIONAL.has(block.align)&&block.align!==shown)hits.push({owner:next??'',table:node.id??'',cell:cell.id??'',paragraph:block.id??'',stored:block.align,shown});
    }
    for(const child of Object.values(node))walk(child,next);
  };
  walk(value,trail.at(-1));
  return hits;
}

async function main(){
  const args=process.argv.slice(2),strict=args.includes('--strict'),names=args.filter(a=>!a.startsWith('--'));
  const root=path.resolve('booklets/projects');
  const files=names.length?names.map(n=>path.join(root,n.endsWith('.json')?n:n+'.json')):(await fs.readdir(root)).filter(n=>n.endsWith('.json')&&n!=='manifest.json').map(n=>path.join(root,n));
  let total=0;
  for(const file of files){
    const project=JSON.parse(await fs.readFile(file,'utf8')),hits=[];
    for(const section of project.sections??[])for(const block of section.blocks??[])for(const hit of dormantAlignment(block,[block.id]))hits.push({...hit,block:block.id,sourcePage:block.sourcePageNumber??section.sourcePageNumber??null});
    if(!hits.length)continue;
    total+=hits.length;
    const blocks=new Map();for(const hit of hits)blocks.set(hit.block,(blocks.get(hit.block)??0)+1);
    console.log(`${project.id}: ${hits.length} line${hits.length===1?'':'s'} in ${blocks.size} block${blocks.size===1?'':'s'}`);
    if(names.length)for(const hit of hits)console.log(`  ${hit.block} (source p${hit.sourcePage??'?'}) ${hit.paragraph}: stored ${hit.stored}, prints ${hit.shown}`);
  }
  console.log(total?`${total} line${total===1?'':'s'} store an alignment their cell overrides.`:'No overridden table-line alignment found.');
  if(strict&&total)process.exitCode=1;
}
if(import.meta.url===pathToFileURL(process.argv[1]??'').href)await main();
