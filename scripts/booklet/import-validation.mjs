import {leanPreExportLint} from './import-pre-final.mjs';
import {restartedPartLabels} from './check-part-label-sequence.mjs';
import {dormantAlignment} from './check-dormant-alignment.mjs';
import {missingEqualsGutter} from './check-equals-gutter.mjs';
import {ratingCoverage} from './reasoning-ratings.mjs';
import {structuralPreflight} from './feedback-preflight.mjs';

export function validateImport(project){
 const lint=leanPreExportLint(project),labels=restartedPartLabels(project),alignment=dormantAlignment(project);
 const gutter=(project.sections??[]).flatMap(s=>(s.blocks??[]).flatMap(b=>missingEqualsGutter(b)));
 const ratings=ratingCoverage(project),structure=structuralPreflight(project);
 const blockers=[...lint.blocking.map(r=>r.rule+' '+(r.blockId??r.path)),...labels.map(r=>'Part-label sequence: '+(r.id??r.blockId??JSON.stringify(r))),...alignment.map(r=>'Dormant alignment: '+r.paragraph),...gutter.filter(r=>r.needs==='gutter').map(r=>'Missing equals gutter: '+r.owner),...structure.issues.map(r=>'Structure: '+(r.message??r.kind))];
 if(ratings.missing.length)blockers.push(ratings.missing.length+' missing/unverified reasoning ratings');
 return {ok:!blockers.length,blockers,warnings:[...lint.review,...gutter.filter(r=>r.needs!=='gutter')],ratings};
}
