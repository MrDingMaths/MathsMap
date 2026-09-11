// Audit stored editable paint declarations without reading source evidence as content.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {BOOKLET_PALETTE} from '../../public/libs/maths-editor/booklet-palette.mjs';
const allowed=new Set(Object.values(BOOKLET_PALETTE));
const evidence=new Set(['source','spec','sourceReview','sourceAtom','sourceLayoutEvidence','originalDiagram','originalContent','before','after','originalValue']);
export function inspectStoredBookletPalette(value){
 const issues=[];
 function walk(n,id='',location=''){
  if(!n||typeof n!=='object'||n.format==='image'||n.type==='image')return;id=n.id??id;
  for(const[k,v]of Object.entries(n)){
   if(evidence.has(k))continue;
   if(typeof v==='string'){
    const add=(colour,name)=>{if(!allowed.has(colour.toLowerCase()))issues.push({id,location:location+'/'+k,colour,...(name?{name}:{})});};
    if(/^(colour|color|background|backgroundColor|backgroundColour|borderColour|borderColor|headerFill|fill|stroke|gridColour)$/.test(k)&&v.startsWith('#'))add(v);
    if(k==='code')for(const m of v.matchAll(/\\definecolor\{([^}]+)\}\{(HTML|RGB|rgb)\}\{([^}]+)\}/g)){
     const hex=m[2]==='HTML'?'#'+m[3]:'#'+m[3].split(',').map(c=>Math.round(Number(c)*(m[2]==='rgb'?255:1)).toString(16).padStart(2,'0')).join('');add(hex,m[1]);
    }
    else for(const m of v.matchAll(/\\(?:color|textcolor)\{(#[^}]+)\}/g))add(m[1]);
   }else walk(v,id,location+'/'+k);
  }
 }
 walk(value);return issues;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const reports=[];for(const root of ['booklets/projects','booklets/question-bank'])for(const file of fs.readdirSync(root).filter(f=>f.endsWith('.json')&&f!=='manifest.json'))reports.push({file:root+'/'+file,issues:inspectStoredBookletPalette(JSON.parse(fs.readFileSync(root+'/'+file)))});
 const i=process.argv.indexOf('--report');if(i>=0)fs.writeFileSync(process.argv[i+1],JSON.stringify(reports,null,2));const failures=reports.filter(r=>r.issues.length);console.log(JSON.stringify({files:reports.length,findings:failures}));if(failures.length)process.exitCode=1;
}
