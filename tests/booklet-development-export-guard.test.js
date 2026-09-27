import test from 'node:test';
import assert from 'node:assert/strict';
import {requireBoundedDevelopmentExport} from '../scripts/booklet/page-review.mjs';

const scope={projectId:'example-v1',edition:'with-short'};

test('development exports require an explicit reason when no page baseline exists',()=>{
 assert.throws(()=>requireBoundedDevelopmentExport({...scope,hasBaseline:false}),/No page baseline.*whole booklet/);
 assert.doesNotThrow(()=>requireBoundedDevelopmentExport({...scope,hasBaseline:false,reason:'Initial import baseline'}));
});

test('development exports stop before rendering when the baseline renderer changed',()=>{
 assert.throws(()=>requireBoundedDevelopmentExport({...scope,hasBaseline:true,baselineRenderer:'old',currentRenderer:'new'}),/renderer differs.*whole booklet/);
 assert.doesNotThrow(()=>requireBoundedDevelopmentExport({...scope,hasBaseline:true,baselineRenderer:'old',currentRenderer:'new',reason:'Reviewed renderer migration'}));
});

test('development exports stop when the page comparison expands to the whole edition',()=>{
 assert.throws(()=>requireBoundedDevelopmentExport({...scope,hasBaseline:true,selectedPages:95,totalPages:95}),/selected all 95 pages/);
 assert.doesNotThrow(()=>requireBoundedDevelopmentExport({...scope,hasBaseline:true,selectedPages:3,totalPages:95}));
 assert.doesNotThrow(()=>requireBoundedDevelopmentExport({...scope,hasBaseline:true,selectedPages:95,totalPages:95,reason:'Global pagination change'}));
});
