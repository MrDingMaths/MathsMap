import {pathToFileURL} from 'node:url';
import {normalizeProjectLibrary} from '../../src/lib/booklet-library.js';
import {validateCaptureBase} from './local-preview-url.mjs';

export const initialLibrary = {
  'angle-relationships-v1': {category:'master'},
  'data-visualisation-1-v1': {category:'master'},
  'index-laws-complete-v1': {category:'master'},
  'linear-relationships-v1': {category:'master',courseId:'s4'},
  'logarithms-v1': {category:'master'},
  'non-right-angled-trigonometry-v1': {category:'master'},
  'probability-v1': {category:'master'},
  'volume-v1': {category:'master'},
  'project-ac094b6d-f3e7-45ac-b585-6092b8d15f58': {category:'class',classLabel:'8MAT6'},
  'concept-maths-adv11-ch01': {category:'import-review',courseId:'s6-adv11'},
};

export function libraryMigration(projects) {
  return projects.filter(p=>initialLibrary[p.id]&&!p.library?.category&&!p.library?.archivedAt&&!p.library?.courseId&&!p.library?.classLabel)
    .map(p=>({id:p.id,expectedRevision:p.revision,library:normalizeProjectLibrary(initialLibrary[p.id])}));
}

if(process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href){
  const args=process.argv.slice(2), index=args.indexOf('--base');
  if(index<0)throw Error('Specify the running authoring server with --base http://localhost:PORT; add --apply to save.');
  const base=validateCaptureBase(args[index+1]);
  const response=await fetch(base+'/__booklet/projects?summary=1');
  if(!response.ok)throw Error('Could not list projects');
  const changes=libraryMigration(await response.json());
  console.log(JSON.stringify({apply:args.includes('--apply'),changes},null,2));
  if(args.includes('--apply'))for(const change of changes){
    const saved=await fetch(base+'/__booklet/projects/'+encodeURIComponent(change.id)+'/library',{method:'PATCH',headers:{'content-type':'application/json'},body:JSON.stringify(change)});
    const value=await saved.json();if(!saved.ok)throw Error(`${change.id}: ${value.error}`);
    console.log(`${value.id}: revision ${value.revision}`);
  }
}
