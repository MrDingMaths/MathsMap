// Offline, lossless representation benchmark; no generation or publication.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {isDeepStrictEqual} from 'node:util';
import {factorAuthorDiagrams,materializeAuthorDiagrams,SHARED_DIAGRAM_PROMPT,visitAuthorContent} from './shared-diagram-authoring.mjs';
import {validateSemanticResult} from './semantic-workflow.mjs';

const json=JSON.stringify,hash=value=>createHash('sha256').update(value).digest('hex');
const sizes=value=>({characters:json(value).length,bytes:Buffer.byteLength(json(value))});

// Measure exact text interning with every source field retained. This is never
// sent to production authors; small savings do not justify a second prompt format.
export function measureInventoryProjection(inventory) {
 const counts=new Map();let collision=false;
 const scan=value=>{
  if(typeof value==='string'&&value.length>=80)counts.set(value,(counts.get(value)??0)+1);
  else if(value&&typeof value==='object'){if(Object.keys(value).length===1&&'$sharedText' in value)collision=true;Object.values(value).forEach(scan);}
 };scan(inventory);
 const selected=new Map([...counts].filter(([,n])=>n>1).map(([text],i)=>[text,'t'+(i+1)]));
 const transform=(value,convert)=>{
  const replacement=convert(value);if(replacement!==undefined)return replacement;
  if(Array.isArray(value))return value.map(v=>transform(v,convert));
  if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).map(([k,v])=>[k,transform(v,convert)]));
  return value;
 };
 const dictionary=Object.fromEntries([...selected].map(([text,id])=>[id,text]));
 const projection={format:'inventory-text-dictionary-v1',dictionary,inventory:transform(inventory,v=>typeof v==='string'&&selected.has(v)?{$sharedText:selected.get(v)}:undefined)};
 const restored=transform(projection.inventory,v=>v&&typeof v==='object'&&Object.keys(v).length===1&&'$sharedText' in v?dictionary[v.$sharedText]:undefined);
 const original=sizes(inventory),candidate=sizes(projection);
 return {original,candidate,eligible:!collision,roundTripEqual:!collision&&isDeepStrictEqual(inventory,restored),potentialCharacterSaving:collision?0:Math.max(0,original.characters-candidate.characters)};
}

export function benchmarkSharedAuthoring(runDir) {
 const started=Date.now(),root=path.join(runDir,'semantic-packets'),files=fs.readdirSync(root).filter(n=>/^page-\d+\.author\.json$/.test(n)).sort(),cases=[];
 if(!files.length)throw Error('No canonical author packets found');
 for(const file of files){
  const sourceFile=path.join(root,file),raw=fs.readFileSync(sourceFile,'utf8'),packet=JSON.parse(raw),inventoryFile=sourceFile.replace(/\.author\.json$/,'.inventory.json'),inventoryRaw=fs.readFileSync(inventoryFile,'utf8'),inventory=JSON.parse(inventoryRaw);
  const compact=factorAuthorDiagrams(packet),expanded=materializeAuthorDiagrams(compact,{enabled:true});
  const check=value=>{try{validateSemanticResult(value,{stage:'author',page:packet.pageNumber,inventory});return null;}catch(error){return error.message;}};
  const beforeError=check(packet),afterError=check(expanded),sourceCodes=[];
  visitAuthorContent(packet.sections,node=>{if(node.format==='tikz')sourceCodes.push({id:node.id,hash:hash(node.code??'')});});
  const expandedCodes=[];visitAuthorContent(expanded.sections,node=>{if(node.format==='tikz')expandedCodes.push({id:node.id,hash:hash(node.code??'')});});
  const unchanged=isDeepStrictEqual(packet,expanded)&&isDeepStrictEqual(sourceCodes,expandedCodes);
  if(!unchanged||beforeError!==afterError)throw Error('Lossless materialization failed for '+file);
  if(hash(raw)!==hash(fs.readFileSync(sourceFile))||hash(inventoryRaw)!==hash(fs.readFileSync(inventoryFile)))throw Error('Source changed during benchmark: '+file);
  cases.push({page:packet.pageNumber,sourceHash:hash(raw),inventoryHash:hash(inventoryRaw),original:sizes(packet),compact:sizes(compact),fragments:Object.keys(compact.diagramLibrary??{}).length,diagramOccurrences:sourceCodes.length,unchanged,validationError:beforeError,inventoryProjection:measureInventoryProjection(inventory)});
 }
 const total=key=>cases.reduce((n,c)=>n+c[key].characters,0),originalCharacters=total('original'),compactCharacters=total('compact');
 return {mode:'offline-representation-benchmark',startedAt:new Date(started).toISOString(),elapsedMs:Date.now()-started,pages:cases.length,
  originalCharacters,compactCharacters,characterReduction:originalCharacters-compactCharacters,characterReductionPercent:100*(originalCharacters-compactCharacters)/originalCharacters,
  originalBytes:cases.reduce((n,c)=>n+c.original.bytes,0),compactBytes:cases.reduce((n,c)=>n+c.compact.bytes,0),
  pagesWithSharedDiagrams:cases.filter(c=>c.fragments).length,diagramOccurrences:cases.reduce((n,c)=>n+c.diagramOccurrences,0),allPacketsAndDiagramCodeUnchanged:cases.every(c=>c.unchanged),
  addedAuthorPromptCharacters:SHARED_DIAGRAM_PROMPT.length,
  inventory:{originalCharacters:cases.reduce((n,c)=>n+c.inventoryProjection.original.characters,0),potentialCharacterSaving:cases.reduce((n,c)=>n+c.inventoryProjection.potentialCharacterSaving,0),allRoundTripsEqual:cases.every(c=>c.inventoryProjection.roundTripEqual)},cases,
  limitations:'Measures compact JSON characters/UTF-8 bytes of existing packets, not model tokens, generated fidelity, latency or billed cost. Existing validation defects remain visible. The complete independent inventory and source packets are never modified. Defaults remain unchanged pending a generation benchmark and full acceptance on a new import.'};
}

if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const arg=name=>{const i=process.argv.indexOf(name);return i<0?null:process.argv[i+1];};
 const runDir=arg('--run-dir'),out=arg('--out');if(!runDir||!out)throw Error('Use --run-dir RUN --out LOCAL_REPORT.json');
 const report=benchmarkSharedAuthoring(runDir);fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,JSON.stringify(report,null,2)+'\n');
 const {cases,...summary}=report;console.log(JSON.stringify(summary,null,2));
}
