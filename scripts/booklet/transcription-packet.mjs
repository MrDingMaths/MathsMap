// Bounded execution evidence for an existing pinned transcription task.
// Original prompts/results are never rewritten; packets have independent provenance.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
const hash=v=>crypto.createHash('sha256').update(v).digest('hex');
const read=file=>fs.readFileSync(file,'utf8').replace(/^\uFEFF/,'');
const tokens=text=>new Set(String(text).normalize('NFKC').toLowerCase().match(/[a-z]{3,}|-?\d+(?:\.\d+)?/g)??[]);
export function rankEvidence(query,records,limit=3){
  const wanted=tokens(query),sets=records.map(r=>tokens(r.text)),frequency=new Map();
  sets.forEach(set=>set.forEach(t=>frequency.set(t,(frequency.get(t)??0)+1)));
  return records.map((record,index)=>{let score=0;for(const t of wanted)if(sets[index].has(t))score+=Math.log(1+records.length/(frequency.get(t)??1));return {...record,score:score/Math.sqrt(Math.max(1,sets[index].size))};}).sort((a,b)=>b.score-a.score).slice(0,limit);
}
export function readableEvidence(records){
  return records.map(record=>`## ${record.reference}\n\n${record.text}`).join('\n\n---\n\n')+'\n';
}
export function textWindows(text,size=6000,overlap=800){
  if(!Number.isInteger(size)||!Number.isInteger(overlap)||size<=0||overlap<0||overlap>=size)throw new Error('Window size must be positive with overlap smaller than size');
  const windows=[];for(let start=0;start<text.length;start+=size-overlap)windows.push({start,end:Math.min(text.length,start+size),text:text.slice(start,start+size)});return windows;
}
export function nearbyAssetOccurrences(occurrences,excerpts,contextChars=6000){
  if(!Number.isInteger(contextChars)||contextChars<0)throw new Error('Asset context must be a nonnegative integer');
  return occurrences.filter(a=>excerpts.some(e=>a.markdownOffset>=Math.max(0,e.start-contextChars)&&a.markdownOffset<e.end+contextChars));
}
export function supplementalAssetLinks(markdown,occurrences){
  const known=new Set(occurrences.map(a=>a.path.replaceAll('\\','/')));
  const links=[];
  for(const m of markdown.matchAll(/\]\(([^)\r\n]+?\.(?:png|jpe?g|svg|webp|gif))\)/gi)){
    const assetPath=m[1].replaceAll('\\','/');
    if(!known.has(assetPath))links.push({occurrenceId:`word-link-${m.index}`,path:assetPath,markdownOffset:m.index,reviewStatus:'needs-review',note:'Recovered image link missing from the original occurrence index; verify placement against PDF.'});
  }
  return links;
}
export function verifyPacketFiles(dir,packet){
  if(packet.format!=='mathsmap-transcription-packet-v1'||!/^task-\d{3,}$/.test(packet.task))throw new Error('Invalid packet contract');
  for(const entry of packet.files){
    const relative=path.relative(path.resolve(dir),path.resolve(dir,entry.path));
    if(relative==='..'||relative.startsWith('..'+path.sep)||path.isAbsolute(relative))throw new Error('Packet file outside packet directory');
    const bytes=fs.readFileSync(path.resolve(dir,entry.path));
    if(bytes.length!==entry.bytes||hash(bytes)!==entry.sha256)throw new Error(`Packet evidence changed: ${entry.path}`);
  }
  if(hash(read(path.join(dir,packet.task+'.md')))!==packet.executionTaskSha256)throw new Error('Packet execution prompt changed');
  return packet;
}
