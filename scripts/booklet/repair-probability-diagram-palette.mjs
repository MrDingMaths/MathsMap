// Reviewed Probability outcome fills. Dry-run by default; --apply saves with
// project revision checks and the canonical project's automatic bank sync.
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {BOOKLET_PALETTE} from '../../public/libs/maths-editor/booklet-palette.mjs';
import {diagramColourPolicy,DIAGRAM_COLOUR_PREFIX} from '../../src/lib/diagram-colours.js';
import {answerDiagramSignature} from '../../src/lib/booklet-exercises.js';
import {loadBookletProject,saveBookletProject} from './project-studio-server.mjs';

const hash=value=>createHash('sha256').update(value).digest('hex');
const evidenceKeys=new Set(['source','spec','sourceReview','sourceAtom','sourceLayoutEvidence','originalDiagram','originalContent','before','after','mathematicalModel','provenance','verification']);
const projectIds=['probability-v1','project-7dddd268-30cb-45b5-b0af-263524af6b34'];
const hex=value=>value.slice(1).toUpperCase();
function fillFor(name,id){
  if(id==='p12-q7-spinner')return null; // Its sector accents are already mixed to 20% in the drawing commands.
  if(name==='greyOutcome')return BOOKLET_PALETTE.skipped;
  if(name==='counterLetter'&&id.startsWith('p14-q13-'))return BOOKLET_PALETTE.black;
  if(!/^(?:outcome|sector|category|ball|counter)/.test(name))return null;
  if(/Purple$/.test(name)||['outcomeP','categoryP'].includes(name))return BOOKLET_PALETTE.purpleFill;
  if(/(?:Pink|Red|R)$/.test(name))return BOOKLET_PALETTE.redFill;
  if(/(?:Green|G)$/.test(name))return BOOKLET_PALETTE.greenFill;
  if(/(?:Blue|Cyan|B)$/.test(name))return BOOKLET_PALETTE.blueFill;
  if(/(?:Orange|Yellow|YellowProxy|Y)$/.test(name))return BOOKLET_PALETTE.orangeFill;
  return null;
}
function repairCode(source,id){
  let code=source;
  const policy=diagramColourPolicy(code);
  if(!policy)throw Error('Missing diagram colour roles: '+id);
  const originalDefinitions=[...code.matchAll(/\\definecolor\{([^}]+)\}\{HTML\}\{([^}]+)\}/g)];
  const changes=[];
  for(const [,name,before] of originalDefinitions){
    const colour=fillFor(name,id);
    if(!colour||before.toLowerCase()===hex(colour).toLowerCase())continue;
    if(!policy.semantic.some(e=>e.name===name))throw Error('Unreviewed colour alias: '+id+'/'+name);
    code=code.replace(`\\definecolor{${name}}{HTML}{${before}}`,`\\definecolor{${name}}{HTML}{${hex(colour)}}`);
    const entry=policy.semantic.find(e=>e.name===name);
    entry.hex=hex(colour);
    if(/Purple$/.test(name)||['outcomeP','categoryP'].includes(name))entry.reason='Purple outcome category shown with light purple booklet fill';
    if(name==='counterLetter')entry.reason='Black outcome letter remains readable on light counter fills';
    changes.push({name,before,after:hex(colour)});
  }
  if(id==='p31-histogram-solution'&&!code.includes('probabilityBlueFill')){
    code=code.replace('\\definecolor{probabilityBlue}{HTML}{268CFF}',`\\definecolor{probabilityBlue}{HTML}{268CFF}\n\\definecolor{probabilityBlueFill}{HTML}{${hex(BOOKLET_PALETTE.blueFill)}}`)
      .replace('draw=probabilityBlue,fill=probabilityBlue,','draw=probabilityBlue,fill=probabilityBlueFill,');
    policy.semantic.push({name:'probabilityBlueFill',hex:hex(BOOKLET_PALETTE.blueFill),reason:'Light blue fill shows theoretical probability bars; blue outlines retain the series'});
    changes.push({name:'probabilityBlueFill',before:'268CFF',after:hex(BOOKLET_PALETTE.blueFill)});
  }
  if(!changes.length)return {code:source,changes};
  const lines=code.split('\n');
  const first=lines.findIndex(line=>line.startsWith(DIAGRAM_COLOUR_PREFIX));
  if(first<0)throw Error('Missing role metadata: '+id);
  lines[first]=DIAGRAM_COLOUR_PREFIX+JSON.stringify(policy);
  return {code:lines.join('\n'),changes};
}
export function repairProbabilityDiagramPalette(project){
  const next=structuredClone(project),records=[];
  const oldSignatures=new Map(),newDiagrams=new Map();
  function walk(node,location=''){
    if(!node||typeof node!=='object')return;
    if(node.format==='tikz'&&typeof node.code==='string'){
      oldSignatures.set(node.id,answerDiagramSignature(node));
      const before=node.code,{code,changes}=repairCode(before,node.id);
      if(changes.length){node.code=code;records.push({id:node.id,location,beforeHash:hash(before),afterHash:hash(code),changes});}
      newDiagrams.set(node.id,node);
    }
    for(const [key,value] of Object.entries(node))if(!evidenceKeys.has(key))walk(value,location+'/'+key);
  }
  walk(next.sections,'/sections');
  for(const styles of Object.values(next.settings?.compactAnswers?.diagramStyles??{}))for(const [id,style] of Object.entries(styles)){
    const before=oldSignatures.get(id),after=newDiagrams.get(id);
    if(before&&after&&style.sourceSignature===before)style.sourceSignature=answerDiagramSignature(after);
  }
  return {next,records};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const apply=process.argv.includes('--apply'),reports=[];
  for(const id of projectIds){
    const project=await loadBookletProject(id);
    const {next,records}=repairProbabilityDiagramPalette(project);
    reports.push({id,fromRevision:project.revision,diagrams:records.length,records});
    if(apply&&records.length){const saved=await saveBookletProject(next,{expectedRevision:project.revision});reports.at(-1).toRevision=saved.revision;}
  }
  const out=process.argv.indexOf('--report');
  if(out>=0)await fs.writeFile(process.argv[out+1],JSON.stringify({applied:apply,projects:reports},null,2)+'\n');
  console.log(JSON.stringify({applied:apply,projects:reports.map(({id,fromRevision,toRevision,diagrams})=>({id,fromRevision,toRevision,diagrams}))}));
}
