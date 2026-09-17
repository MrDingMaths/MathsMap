import fs from 'node:fs';
import {spawnSync} from 'node:child_process';

const decodeName=name=>name.replace(/#([\da-f]{2})/gi,(_,hex)=>String.fromCharCode(parseInt(hex,16)));

// Chromium writes link dictionaries outside object streams. Inspect those actual
// annotations: pdftohtml can merge adjacent links or omit textless link regions.
export function pdfLinkAnnotations(bytes){
 const source=bytes.toString('latin1'),links=[];
 for(const match of source.matchAll(/^\d+ \d+ obj\r?\n([\s\S]*?)\r?\nendobj/gm)){
  const object=match[1];
  if(!/^<<\s*\/Type\s*\/Annot\b/.test(object)||! /\/Subtype\s*\/Link\b/.test(object))continue;
  const named=object.match(/\/Dest\s*\/([^\s<>\[\]()]+)/);
  if(named){
   const rect=object.match(/\/Rect\s*\[([^\]]+)\]/)?.[1].trim().split(/\s+/).map(Number);
   if(rect?.length!==4||rect.some(v=>!Number.isFinite(v))||rect[2]<=rect[0]||rect[3]<=rect[1])throw Error('Invalid PDF link rectangle');
   links.push({destination:decodeName(named[1]),rect});
  }else if(/\/Dest\b|\/S\s*\/GoTo\b/.test(object))throw Error('Unsupported internal PDF link representation');
 }
 return links;
}

export function verifyPdfNavigation(annotations,destinations,expectedLinks){
 const actual=new Map(),expected=new Map();
 for(const link of annotations){
  if(!destinations.has(link.destination))throw Error('PDF link has no named destination: '+link.destination);
  actual.set(link.destination,(actual.get(link.destination)??0)+1);
 }
 for(const link of expectedLinks){
  const destination=decodeURIComponent(link.href.slice(1));
  if(!link.exists)throw Error('DOM link has no destination: '+destination);
  expected.set(destination,(expected.get(destination)??0)+1);
 }
 for(const [destination,count] of expected){
  if((actual.get(destination)??0)<count)throw Error(`PDF lost links to ${destination}: expected ${count}, found ${actual.get(destination)??0}`);
 }
 return {annotations:annotations.length,expectedLinks:expectedLinks.length,destinations:destinations.size};
}

export function inspectPdfNavigation(file,expectedLinks){
 const result=spawnSync('pdfinfo',['-dests',file],{encoding:'utf8',maxBuffer:32*1024*1024,windowsHide:true});
 if(result.error||result.status!==0)throw Error('PDF navigation validation requires pdfinfo: '+(result.error?.message??result.stderr));
 if(/error|bad named destination|failed to look up/i.test(result.stderr))throw Error(result.stderr);
 const destinations=new Map([...result.stdout.matchAll(/^\s*(\d+)\s+\[[^\]]*\]\s+"([^"]+)"\s*$/gm)].map(m=>[m[2],Number(m[1])]));
 return verifyPdfNavigation(pdfLinkAnnotations(fs.readFileSync(file)),destinations,expectedLinks);
}
