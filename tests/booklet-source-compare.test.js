import test from 'node:test';
import assert from 'node:assert/strict';
import {reportUrl,pageImageUrl,runIdOf,sourcePagesOf,sourceOptionsOf,reviewQueue} from '../src/lib/booklet-source-compare.js';

test('the Source tab reads the polish report and page images through the import run endpoint',()=>{
 assert.equal(reportUrl('rates-v1-20261002-medium'),'/__booklet/full-imports/rates-v1-20261002-medium/files/polish/report.json');
 assert.equal(pageImageUrl('r',4),'/__booklet/full-imports/r/files/evidence/pages/page-004.png');
 assert.equal(pageImageUrl('a b',12),'/__booklet/full-imports/a%20b/files/evidence/pages/page-012.png');
 assert.equal(runIdOf({source:{runId:'x'}}),'x');
 assert.equal(runIdOf({}),null);
});

test('a block\'s source pages are its own page and its references, in order, without repeats',()=>{
 assert.deepEqual(sourcePagesOf({sourcePageNumber:4,sourceRefs:[{pageNumber:5},{pageNumber:4},{pageNumber:'x'}]}),[4,5]);
 assert.deepEqual(sourcePagesOf({sourceRefs:[{pageNumber:9}]}),[9]);
 assert.deepEqual(sourcePagesOf(null),[]);
});

test('the polish queue lists what the residual review left by page, then the breaks, then the reported pedagogy findings',()=>{
 const rows=reviewQueue({
  residual:{listed:[{id:'r2',area:'spacing',page:9,targets:['q9-a'],comment:'gap'},{id:'r1',area:'labels',page:3,targets:['q2'],comment:'label'}]},
  breakSuggestions:[{firstBlockId:'q20',pageBefore:11,freeMm:84,estPagesSaved:1},{firstBlockId:'q30',pageBefore:20,freeMm:70,estPagesSaved:2}],
  pedagogy:{reportedOnly:[{id:'pf-1',kind:'difficulty-jump',finding:'Q5 jumps.'}]}});
 assert.deepEqual(rows.map(r=>[r.kind,r.target]),[['residual','q2'],['residual','q9-a'],['break','q20'],['break','q30'],['pedagogy',null]]);
 assert.equal(rows[0].label,'labels · p3');
 assert.match(rows[2].detail,/Page 11 has 84 mm free.*about 1 page\./);assert.match(rows[3].detail,/about 2 pages\./);
 assert.deepEqual(reviewQueue(null),[]);assert.deepEqual(reviewQueue({}),[]);
});


test('merged source selection distinguishes equal page numbers and honours explicit run identities',()=>{
 const project={source:{runId:'main',imports:[{runId:'merge run',title:'Added source'}]}};
 const options=sourceOptionsOf(project,{sourcePageNumber:3,sourceRefs:[{pageNumber:3,runId:'merge run'},{pageNumber:3,runId:'main'},{pageNumber:3,runId:'merge run'}]});
 assert.equal(options.length,2);
 assert.equal(options[0].url,'/__booklet/full-imports/merge%20run/files/evidence/pages/page-003.png');
 assert.equal(options[0].label,'Added source · p3');
 assert.notEqual(options[0].key,options[1].key);
 assert.deepEqual(sourceOptionsOf(project,{sourcePageNumber:3,sourceRefs:[{pageNumber:3,runId:'merge run'}]}).map(p=>p.runId),['merge run']);
 assert.equal(sourceOptionsOf({runId:'legacy'},{sourcePageNumber:2})[0].runId,'legacy');
 assert.deepEqual(sourceOptionsOf(project,null),[]);
});
