import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {standardBookletContent,standardBookletColour,standardTikzColours,BOOKLET_PALETTE} from '../../public/libs/maths-editor/booklet-palette.mjs';
import {normaliseDiagramColours} from './normalise-diagram-colours.mjs';
import {revisionHash} from './bank-sync.mjs';
import {answerDiagramSignature} from '../../src/lib/booklet-exercises.js';
import {visitActiveDiagrams} from './normalise-diagram-colours.mjs';
const skip=new Set(['source','spec','sourceReview','sourceAtom','sourceLayoutEvidence','originalDiagram','originalContent','before','after','originalValue']);
const graphColour=v=>{const hex=standardBookletColour(v,{diagram:true});return Object.entries(BOOKLET_PALETTE).find(([,h])=>h===hex)?.[0]??v;};
function modelPalette(model,id){
 const next=structuredClone(model);
 for(const line of next.lines??[])line.colour=graphColour(line.colour??'blue');
 for(const point of next.points??[])if(point.colour)point.colour=graphColour(point.colour);
 for(const label of next.labels??[]){
  if(id==='page-93-q4-diagram-1'&&['A','B','C'].includes(label.text))label.options=['blue','red','green'][['A','B','C'].indexOf(label.text)];
  else if(label.options)label.options=label.options.split(',').map(graphColour).join(',');
 }
 if(next.panels)next.panels=next.panels.map(p=>modelPalette(p,id));
 return next;
}
export function migrateBookletPalette(value,{baseline=value}={}){
 const next=standardBookletContent(value),records=[];
 function walk(n,id=''){
  if(!n||typeof n!=='object')return;id=n.id??id;
  if(n.mathematicalModel)n.mathematicalModel=modelPalette(n.mathematicalModel,id);
  if(typeof n.code==='string'){
   n.code=n.code.replace(/^(% mathsmap-graph-model: )(.*)$/gm,(_,a,b)=>a+JSON.stringify(modelPalette(JSON.parse(b),id)));
   if(id==='page-93-q4-diagram-1')n.code=n.code.replace(/\\node\[(teal|orange|magenta),/g,(_,c)=>'\\node['+({teal:'blue',orange:'red',magenta:'green'}[c])+',');
   n.code=n.code.replace(/^(% mathsmap-diagram-colours )(.*)$/gm,(_,a,b)=>{const p=JSON.parse(b);for(const entry of p.semantic)entry.hex=standardBookletColour('#'+entry.hex,{diagram:true}).slice(1).toUpperCase();return a+JSON.stringify(p);});
   n.code=standardTikzColours(n.code);
  }
  for(const[k,v]of Object.entries(n))if(!skip.has(k)&&k!=='mathematicalModel')walk(v,id);
 }
 walk(next);
 // Preserve reviewed answer widths only when their previous source signature was valid.
 const originals=new Map(),current=new Map();visitActiveDiagrams(baseline,n=>originals.set(n.id,n));visitActiveDiagrams(next,n=>current.set(n.id,n));
 for(const styles of Object.values(next.settings?.compactAnswers?.diagramStyles??{}))for(const[id,style]of Object.entries(styles)){
  const before=originals.get(id),after=current.get(id);
  if(before&&after&&style.sourceSignature===answerDiagramSignature(before))style.sourceSignature=answerDiagramSignature(after);
 }
 function diff(a,b,location='',id=value.id){
  if(JSON.stringify(a)===JSON.stringify(b))return;
  if(a&&b&&typeof a==='object'&&typeof b==='object'){id=b.id??id;for(const key of new Set([...Object.keys(a),...Object.keys(b)]))diff(a[key],b[key],location+'/'+key,id);}
  else records.push({id,location,before:revisionHash(a??null),after:revisionHash(b??null),departure:'Source shade mapped to the standard booklet palette; mathematical role retained.'});
 }
 diff(value,next);return {next,records};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const b=process.argv.indexOf('--baseline-dir'),baselineDir=b>=0?process.argv[b+1]:null;
 const migrate=value=>migrateBookletPalette(value,{baseline:baselineDir&&fs.existsSync(path.join(baselineDir,value.id+'.json'))?JSON.parse(fs.readFileSync(path.join(baselineDir,value.id+'.json'))):value});
 const report=await normaliseDiagramColours({apply:process.argv.includes('--apply'),migrate,policy:'Standard booklet palette for all active editable content; source evidence and rasters retained'});
 const i=process.argv.indexOf('--report');if(i>=0)fs.writeFileSync(process.argv[i+1],JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify({applied:report.applied,files:report.files,projects:report.projects.map(p=>({id:p.id,changes:p.records.length})),bank:report.bank.length}));
}
