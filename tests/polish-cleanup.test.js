// The 23 October 2026 simplification: source-match, the teaching presets and signature, TEACHING_SCALE and the
// roles, theory-diff and whitespace checks are gone, and nothing still imports them.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const GONE=['source-match','src/lib/teaching-signature.js','src/lib/booklet-teaching-presets.js','checks/roles.mjs','checks/theory-diff.mjs','checks/whitespace.mjs',
 'src/lib/booklet-role-check.js','src/lib/booklet-theory-diff.js','src/lib/booklet-whitespace-check.js',
 'tests/source-match.test.js','tests/teaching-signature.test.js','tests/booklet-teaching-presets.test.js','tests/booklet-role-check.test.js','tests/booklet-theory-diff.test.js','tests/booklet-whitespace-check.test.js'];
const KEPT=['checks/wrapped-math.mjs','src/lib/booklet-wrap-check.js','checks/lib/common.mjs','checks/lib/model.mjs','checks/replay-render.mjs'];

test('the retired modules are deleted and the kept ones remain',()=>{
 for(const file of GONE)assert.equal(fs.existsSync(path.join(ROOT,file)),false,file+' is deleted');
 for(const file of KEPT)assert.equal(fs.existsSync(path.join(ROOT,file)),true,file+' stays');
});

const files=dir=>fs.existsSync(dir)?fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?(e.name==='node_modules'?[]:files(path.join(dir,e.name))):/\.(?:m?js)$/.test(e.name)?[path.join(dir,e.name)]:[]):[];
const SPECIFIER=/(?:\bfrom\s*|\bimport\s*\(\s*|\bimport\s+)['"](\.{1,2}\/[^'"]+)['"]/g;
// Test files also hold fixture strings that look like imports: for them only a real import statement counts.
const STATEMENT=/^import\s[^'"\n]*['"](\.{1,2}\/[^'"]+)['"]/gm;

test('every relative import in the pipeline, the library and the tests resolves',()=>{
 const missing=[];
 for(const dir of ['src','sweep','bench','checks','handoff','paginate','polish','first-pass','tests']){
  for(const file of files(path.join(ROOT,dir))){
   const source=fs.readFileSync(file,'utf8');
   for(const match of source.matchAll(dir==='tests'||/\.test\.m?js$/.test(file)?STATEMENT:SPECIFIER)){
    const target=path.resolve(path.dirname(file),match[1].split('?')[0]);
    if(!fs.existsSync(target))missing.push(path.relative(ROOT,file)+' -> '+match[1]);
   }
  }
 }
 assert.deepEqual(missing,[]);
});

test('nothing names the retired helpers any more',()=>{
 const names=/teaching-signature|booklet-teaching-presets|TEACHING_SCALE|booklet-role-check|booklet-theory-diff|booklet-whitespace-check|source-match\/(?:regions|run|model|customs)/;
 const hits=[];
 for(const dir of ['src','sweep','bench','checks','paginate','polish','first-pass']){
  for(const file of files(path.join(ROOT,dir))){
   if(/BookletSourceCompare|booklet-source-compare/.test(file))continue; // the Source tab reads the files an import run holds
   const lines=fs.readFileSync(file,'utf8').split(/\r?\n/);
   lines.forEach((line,i)=>{if(names.test(line)&&!/^\s*\/\//.test(line))hits.push(path.relative(ROOT,file)+':'+(i+1));});
  }
 }
 assert.deepEqual(hits,[]);
});

test('the surviving checks and the chain still import cleanly',async()=>{
 for(const file of ['checks/wrapped-math.mjs','checks/replay-render.mjs','polish/run.mjs','polish/dependencies.mjs','polish/content.mjs','polish/normalise.mjs','sweep/rules.mjs','paginate/lib/working-space-apply.mjs','bench/corpus.mjs','first-pass/apply.mjs']){
  const mod=await import(new URL('file:///'+path.join(ROOT,file).replaceAll('\\','/')).href);
  assert.ok(Object.keys(mod).length>0,file+' exports something');
 }
 const {STEPS}=await import('../polish/run.mjs');
 assert.ok(STEPS.includes('normalise')&&STEPS.includes('residual')&&!STEPS.includes('source-match'));
 assert.equal(fs.existsSync(path.join(ROOT,'handoff')),false,'handoff/ is replaced by polish/');
 const {patchAllowed}=await import('../first-pass/apply.mjs');
 assert.equal(patchAllowed({targetId:'b',field:'/content/presentation/numberSteps'}),true,'the patch guard keeps the layout fields');
 assert.equal(patchAllowed({targetId:'b',field:'/sourceReview/structure'}),false,'the source-match record is no longer a repair target');
 assert.equal(patchAllowed({targetId:'b',field:'/sourceReview/customArrangement'}),false);
});

test('the apply guard refuses a patch that turns a page break on, and allows one that removes it',async()=>{
 const {patchAllowed,addsPageBreak}=await import('../first-pass/apply.mjs');
 for(const field of ['/flow/sourcePageBreakBefore','/flow/pageBreakBefore','/flow/exercisePageBreakBefore'])assert.equal(patchAllowed({targetId:'b',field,original:false,corrected:true}),false,field+' on');
 assert.equal(patchAllowed({targetId:'b',field:'/flow',original:null,corrected:{pageBreakBefore:true}}),false);
 assert.equal(addsPageBreak({targetId:'b',field:'/flow/keepWithNext',corrected:true}),false);
 assert.equal(patchAllowed({targetId:'b',field:'/flow/pageBreakBefore',original:true,corrected:false}),true);
 assert.equal(patchAllowed({targetId:'b',field:'/flow/keepWithNext',original:null,corrected:true}),true);
});
