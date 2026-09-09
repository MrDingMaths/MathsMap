import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { normalizeDocument, renderDocument } from '../public/libs/maths-editor/document-model.mjs';
import { splitBookletTables, groupBookletBlocks } from '../src/lib/booklet-preview.js';
import { candidateChecks, mergeDiagrams } from '../scripts/booklet/candidate-validation.mjs';
import { BOOKLET_AGY_MODEL, hashValue, contentHash, editableTranscription, saveContentOverride, applyContentOverrides } from '../scripts/booklet/transcription.mjs';
test('structured tables preserve source width, rotation, cell treatment and stable annotation anchors',()=>{
 const doc=normalizeDocument({blocks:[{id:'t',type:'table',widthMm:72,rowHeights:[28],widths:[1,2],annotations:[{id:'arrow',type:'arrow',cellId:'a',toCellId:'b',label:'+4',colour:'#268cff'}],rows:[[{id:'a',type:'cell',rotation:-90,align:'center',verticalAlign:'middle',background:'#d3e8fc',blocks:[]},{id:'b',type:'cell',colour:'#ef6068',blocks:[]}]]}]});
 assert.deepEqual(normalizeDocument(doc),doc);const html=renderDocument(doc);
 for(const text of ['width:72mm','rotate(-90deg)','vertical-align:middle','background:#d3e8fc','color:#ef6068','data-annotations'])assert.ok(html.includes(text),text);
 assert.equal(candidateChecks({pages:[{pageNumber:1,blocks:doc.blocks}]},[1]).length,0);
 doc.blocks[0].annotations[0].toCellId='missing';assert.ok(candidateChecks({pages:[{pageNumber:1,blocks:doc.blocks}]},[1]).some(f=>f.code==='annotation-anchor'));
});
test('visible headings are separate from metadata and Markdown alignment survives',()=>{
 const atom={id:'a',kind:'review',label:'Review',description:'Substitute into formulas'};
 assert.equal(groupBookletBlocks([{id:'b',sourceAtom:atom}])[0].atom.visibleSubtitle,'');
 assert.equal(groupBookletBlocks([{id:'b',sourceAtom:{...atom,kind:'identify',visibleSubtitle:'$m$ from a table'}}])[0].atom.visibleSubtitle,'$m$ from a table');
 assert.deepEqual(splitBookletTables('| x | y |\n| :---: | ---: |\n| 1 | 2 |')[0].alignments,['center','right']);
});
test('draft edit survives reload and merge, rejects stale browser saves and exposes changed candidates',t=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'booklet-edit-v3-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));
 const save=(name,v)=>{fs.mkdirSync(path.dirname(path.join(dir,name)),{recursive:true});fs.writeFileSync(path.join(dir,name),JSON.stringify(v));};
 const manifest={id:'test',model:BOOKLET_AGY_MODEL,selectedPages:[1],lanes:{},pins:{model:hashValue(BOOKLET_AGY_MODEL),files:{},runFiles:{}}};
 save('manifest.json',manifest);save('review.json',{pages:[{pageNumber:1,accepted:false}],history:[]});
 const packet={pages:[{id:'page-1',pageNumber:1,section:{id:'page-1-section',title:'T'},blocks:[{id:'page-1-b',type:'rich-text',content:'Original'}]}],assets:[]};save('lanes/exact/task-001.result.json',packet);
 const base=editableTranscription(dir);const req={rootId:'page-1-b',pointer:'/content',value:'Edited',expectedRevision:0,expectedBaseHash:contentHash(base)};
 saveContentOverride(dir,req);assert.equal(fs.existsSync(path.join(dir,'merged')),false);
 assert.throws(()=>saveContentOverride(dir,req),/changed/);
 const review=JSON.parse(fs.readFileSync(path.join(dir,'review.json')));assert.equal(review.revision,1);assert.equal(review.pages[0].accepted,false);
 assert.equal(applyContentOverrides(editableTranscription(dir),review).pages[0].blocks[0].content,'Edited');
 save('merged/transcription.json',base);assert.equal(applyContentOverrides(editableTranscription(dir),review).pages[0].blocks[0].content,'Edited');
 base.pages[0].blocks[0].content='New source';save('merged/transcription.json',base);
 const conflicts=[];const effective=applyContentOverrides(editableTranscription(dir),review,{strict:false,conflicts});assert.equal(conflicts.length,1);assert.equal(effective.pages[0].blocks[0].content,'New source');assert.equal(review.contentOverrides['page-1-b']['/content'].value,'Edited');
});
test('diagram replies require complete coverage',()=>{
 const candidate={pages:[{pageNumber:1,blocks:[{id:'p',format:'tikz',code:''}]}]};
 assert.throws(()=>mergeDiagrams(candidate,{diagrams:[]}),/coverage/);
 const merged=mergeDiagrams(candidate,{diagrams:[{id:'p',code:'\\begin{tikzpicture}\\draw(0,0)--(1,1);\\end{tikzpicture}'}]});assert.equal(candidate.pages[0].blocks[0].code,'');assert.equal(merged.pages[0].blocks[0].reviewStatus,'needs-review');
});
