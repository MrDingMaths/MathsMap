// Diagnose the existing visibility gate before freezing/copying a renderer.
// This grants no review and uses the same code/asset-hash checks as export.
import fs from 'node:fs';
import {solidAcceptance} from '../audit-solid-visibility.mjs';

export function importDiagramPreflight(project,{file,defaultFile='booklets/provenance/solid-visibility-2026-09-12.json'}={}){
 if(file!==undefined&&(typeof file!=='string'||!file.trim()||file.startsWith('--')))throw Error('--visibility-reviews requires a review JSON file');
 const selected=file??defaultFile;let reviews={};
 if(fs.existsSync(selected)){
  const value=JSON.parse(fs.readFileSync(selected,'utf8').replace(/^\uFEFF/,''));
  if(!value?.reviews||typeof value.reviews!=='object'||Array.isArray(value.reviews))throw Error('Visibility review JSON requires an object named reviews: '+selected);
  reviews=value.reviews;
 }else if(file!==undefined)throw Error('Missing explicit visibility review file: '+selected);
 return solidAcceptance(project,reviews);
}
