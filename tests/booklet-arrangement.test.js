import test from 'node:test';
import assert from 'node:assert/strict';
import {group,item,transformArrangement,arrangementItems,normalizeArrangement} from '../public/libs/maths-editor/arrangement-model.mjs';
import {arrangementCatalog,arrangementQuestionBlock,resolveArrangement,replaceArrangementContent,shareUnchanged,applyArrangementContent,addArrangementText,removeArrangementText} from '../src/lib/booklet-arrangement.js';
import {fromSource,hasVisibleContent} from '../src/lib/document-content.js';
import {arrangementExamTitle,findContent} from '../src/lib/booklet-arrangement.js';

test('editing resolves active content instead of preserved source evidence with matching IDs',()=>{
 const evidence={id:'example',blocks:[{id:'paragraph',type:'paragraph',inlines:[{type:'text',text:'Original'}]}]};
 const active={id:'example',prompt:fromSource('Editable formula $x$\n\nKeep this paragraph.')};
 const block={id:'methods',type:'worked-example',sourceLayoutEvidence:{original:evidence},sourceReview:{original:evidence},examples:[active]};
 assert.equal(findContent(block,'example'),active);
 assert.equal(findContent({id:'evidence-only',sourceLayoutEvidence:{original:evidence}},'example'),undefined);
 const catalog=arrangementCatalog(block),entry=[...catalog.entries.values()].find(e=>e.ownerId==='example'&&e.field==='prompt');
 const edited=replaceArrangementContent(block,entry,fromSource('Changed $y$'));
 assert.equal(edited.sourceLayoutEvidence.original.blocks[0].inlines[0].text,'Original');
 assert.deepEqual(edited.examples[0].prompt.blocks[1],active.prompt.blocks[1]);
 assert.match(JSON.stringify(edited.examples[0].prompt.blocks[0]),/Changed/);
});

test('exam attribution accompanies only the first root prompt in native arrangements',()=>{
 for(const native of [false,true]){
  const block={id:'exam',type:'question',title:'2021 HSC Standard 2 Band 5',content:{id:'stem',prompt:native?fromSource('Find the angle.\n\nGive a reason.'):'Find the angle.',children:[{id:'part',prompt:'Explain.'}]}};
  const labels=[...arrangementCatalog(block).entries.values()].map(e=>arrangementExamTitle(block,e)).filter(Boolean);
  assert.deepEqual(labels,['2021 HSC Standard 2']);
  block.title='Development';
  assert.equal([...arrangementCatalog(block).entries.values()].some(e=>arrangementExamTitle(block,e)),false);
 }
});
const fixture=()=>({version:1,root:group('root',[group('row',[group('left',[item('a'),item('b')]),group('right',[item('graph')])],'row')])});
const textFixture=()=>({id:'activity',type:'question',sourceAtom:{kind:'investigation'},content:{id:'q',prompt:'Interpret Coordinates',children:[{id:'a',label:'a',prompt:'$(2,4)$',answer:{short:'right, up'},answerSpaceMm:8}]}});

test('legacy-to-native editing retains the first rendered field slot with distinct keys for later paragraphs',()=>{
 const block=textFixture(),before=arrangementCatalog(block),legacy=[...before.entries.values()].find(e=>e.ownerId==='a'&&e.field==='prompt');
 block.content.children[0].prompt=fromSource('$(2,4)$\n\nAnother paragraph.');
 const after=arrangementCatalog(block),native=[...after.entries.values()].filter(e=>e.ownerId==='a'&&e.field==='prompt');
 assert.equal(native[0].editorKey,legacy.editorKey);
 assert.notEqual(native[1].editorKey,native[0].editorKey);
 assert.notEqual(native[0].ref,legacy.ref,'Stored content references still identify native nodes');
 assert.equal(new Set([...after.entries.values()].map(e=>e.editorKey??e.ref)).size,after.entries.size);
});

test('clearing text removes its layout item and spacing while preserving parts and answers',()=>{
 for(const structured of [false,true]){
  const block=textFixture();if(structured)block.content.prompt=fromSource(block.content.prompt);
  const initial=resolveArrangement(block),entry=[...initial.entries.values()].find(e=>e.ownerId==='q'&&e.field==='prompt');
  const selected=arrangementItems(initial.tree.root).find(n=>n.ref===entry.ref).id;
  const tree=transformArrangement(initial.tree,'properties',selected,{before:12,after:15});
  const cleared=applyArrangementContent(block,tree,selected,entry,fromSource(' \n\n\t'));
  assert.equal(hasVisibleContent(cleared.block.content.prompt),false);
  assert.equal(arrangementItems(cleared.tree.root).some(n=>n.ref.startsWith('q/prompt')),false);
  assert.deepEqual(cleared.block.content.children,block.content.children);
  assert.deepEqual(resolveArrangement(cleared.block,cleared.tree).missing,[]);
  assert.equal(hasVisibleContent(block.content.prompt),true,'undo snapshot stays intact');
 }
});

test('old saved empty paragraphs collapse, preserving explicit spacers, cloze and tables',()=>{
 const block=textFixture(),doc=fromSource('Original');block.content.prompt=doc;
 const initial=resolveArrangement(block);doc.blocks[0].inlines=[{type:'text',text:'\u00a0\u200b',marks:[]},{type:'break'}];
 const restored=resolveArrangement(block,initial.tree);
 assert.equal(arrangementItems(restored.tree.root).some(n=>n.ref.startsWith('q/prompt')),false);
 assert.deepEqual(restored.missing,[]);
 for(const n of [{type:'spacer',height:10},{type:'table',rows:[]},{type:'paragraph',inlines:[{type:'cloze',answer:''}]}])assert.equal(hasVisibleContent({...doc,blocks:[n]}),true);
});

test('remove and restore a prompt before its parts with no missing references',()=>{
 const block=textFixture(),initial=resolveArrangement(block),entry=initial.entries.get('q/prompt');
 const removed=removeArrangementText(block,initial.tree,'layout:q/prompt',entry);
 const added=addArrangementText(removed.block,removed.tree,removed.selected);
 assert.equal(hasVisibleContent(added.block.content.prompt),true);
 const refs=arrangementItems(added.tree.root).map(n=>n.ref);
 assert.ok(refs.findIndex(r=>r.startsWith('q/prompt'))<refs.indexOf('a/prompt'));
 assert.deepEqual(added.block.content.children,block.content.children);
 assert.deepEqual(resolveArrangement(added.block,added.tree).missing,[]);
 assert.equal(new Set(refs).size,refs.length);
});

test('add and remove text in a custom column preserves neighbours and layout',()=>{
 const block=textFixture();block.content.prompt=fromSource('First\n\nSecond');
 const initial=resolveArrangement(block),entry=[...initial.entries.values()].find(e=>e.ownerId==='q'&&e.field==='prompt');
 const selected='layout:'+entry.ref;
 const tree=transformArrangement(initial.tree,'group',selected,{id:'custom-column'});
 const added=addArrangementText(block,tree,selected),resolved=resolveArrangement(added.block,added.tree);
 assert.deepEqual(resolved.missing,[]);
 assert.equal(added.tree.root.children.find(n=>n.id==='custom-column').children.length,2);
 const removed=removeArrangementText(added.block,added.tree,added.selected,resolved.entries.get(added.selected.slice(7)));
 assert.deepEqual(removed.block.content.prompt,block.content.prompt);
 assert.deepEqual(removed.tree,tree);
});

test('adding to a group migrates legacy multi-paragraph text without losing any reference',()=>{
 const block=textFixture();block.content.prompt='First\n\nSecond';
 const initial=resolveArrangement(block),added=addArrangementText(block,initial.tree,initial.tree.root.id);
 const resolved=resolveArrangement(added.block,added.tree),refs=arrangementItems(added.tree.root).map(n=>n.ref);
 assert.deepEqual(resolved.missing,[]);
 for(const e of resolved.entries.values())if(e.ownerId==='q'&&e.field==='prompt')assert.equal(refs.filter(ref=>ref===e.ref).length,1);
});

test('adding text to worked example and theory roots uses a renderable content field',()=>{
 for(const block of [{id:'b',type:'worked-example',examples:[{id:'a',prompt:'Example'}]},{id:'b',type:'callout',content:''}]){
  const initial=resolveArrangement(block),added=addArrangementText(block,initial.tree,initial.tree.root.id);
  const resolved=resolveArrangement(added.block,added.tree);
  assert.deepEqual(resolved.missing,[]);
  assert.ok(resolved.entries.has(added.selected.slice(7)));
 }
});
test('full-width moves a part outside its column, preserving each reference once',()=>{const before=fixture(),after=transformArrangement(before,'full-width','layout:b');assert.equal(after.root.children[1].ref,'b');assert.equal(before.root.children.length,1);assert.deepEqual(arrangementItems(after.root).map(n=>n.ref).sort(),['a','b','graph']);});
test('group, ungroup, drag movement and reordering retain content references',()=>{let v=fixture();v=transformArrangement(v,'group','layout:a',{ids:['layout:a','layout:b'],id:'paired'});v=transformArrangement(v,'ungroup','paired');v=transformArrangement(v,'move','layout:b',{targetId:'right',position:'inside'});assert.equal(v.root.children[0].children[1].children[1].ref,'b');assert.throws(()=>transformArrangement(v,'move','row',{targetId:'right',position:'inside'}));});
test('reject duplicate references and protect unmodified branches',()=>{assert.throws(()=>normalizeArrangement({version:1,root:group('g',[item('a'),{...item('a'),id:'different'}])}));const p={a:{value:1},b:{value:2}},n=shareUnchanged(p,{a:{value:1},b:{value:3}});assert.equal(n.a,p.a);assert.notEqual(n.b,p.b);});
test('editing one table or paragraph keeps its ID and other content and solutions',()=>{const doc=fromSource('First\n\nSecond'),b={id:'b',type:'question',content:{id:'q',prompt:doc,children:[],answer:{short:'42'}}};const catalog=arrangementCatalog(b),entry=[...catalog.entries.values()].find(e=>e.kind==='document');const next=replaceArrangementContent(b,entry,fromSource('Changed'));assert.equal(next.content.prompt.blocks[0].id,entry.nodeId);assert.deepEqual(next.content.prompt.blocks[1],b.content.prompt.blocks[1]);assert.deepEqual(next.content.answer,b.content.answer);});
test('legacy null grid count does not loop or lose children',()=>{const b={id:'b',type:'question',content:{id:'q',layout:'grid',columns:null,children:Array.from({length:5},(_,i)=>({id:'p'+i,prompt:'part',children:[]}))}};const c=arrangementCatalog(b);assert.equal([...c.entries.values()].filter(e=>e.kind==='text').length,5);});
test('adoption carries explicit answer-space and diagram overrides into the tree',()=>{const b={id:'b',type:'question',content:{id:'q',prompt:'Text',children:[],questionDiagrams:[{id:'d',format:'tikz',widthMm:70}]}};const c=arrangementCatalog(b,{answerSpaces:{q:0},blockLayouts:{q:{diagramWidthMm:48}}});const nodes=arrangementItems(c.initial.root);assert.equal(nodes.find(n=>n.ref==='q/space').height,0);assert.equal(nodes.find(n=>n.ref==='d').width,48);});
test('content application accepts reactive proxies without losing the original',()=>{const b={id:'b',type:'question',content:{id:'q',prompt:'Text',children:[]}},proxy=new Proxy(b,{}),e=arrangementCatalog(proxy).entries.get('q/prompt');const next=replaceArrangementContent(proxy,e,fromSource('Edited'));assert.equal(next.content.prompt.blocks[0].inlines[0].text,'Edited');assert.equal(b.content.prompt,'Text');});


test('null preview numbering preserves saved question label references',()=>{
 const b={id:'page-44-q1',type:'question',sourceOrder:1,content:{id:'page-44-q1-root',prompt:'',children:[]}};
 const saved=resolveArrangement(b).tree;
 const preview=resolveArrangement(arrangementQuestionBlock(b,null),saved);
 assert.deepEqual(preview.missing,[]);
 assert.equal(preview.entries.get('page-44-q1-root/label').value,'1');
 assert.equal(arrangementQuestionBlock(b,6).sourceOrder,6);
 const unnumbered=arrangementQuestionBlock({...b,sourceOrder:undefined});
 assert.equal(resolveArrangement(unnumbered).entries.has('page-44-q1-root/label'),false);
 assert.equal(b.sourceOrder,1);
});

test('default preview and editor share overrides, width and preserve custom arrangements',()=>{
 const b={id:'b',type:'question',sourceOrder:6,content:{id:'q',prompt:'Text',diagramPlacement:'right-of-prompt',children:[],questionDiagrams:[{id:'d',format:'image',src:'/pattern.png',widthMm:70}]}};
 const overrides={answerSpaces:{q:0},diagramWidths:{d:65},blockLayouts:{q:{textWidthMm:80,gapMm:3}}};
 const editor=resolveArrangement(b,null,overrides,165),preview=resolveArrangement(arrangementQuestionBlock(b),null,overrides,165);
 assert.deepEqual(preview.tree,editor.tree);
 assert.equal(arrangementItems(preview.tree.root).find(n=>n.ref==='d').width,65);
 assert.equal(arrangementItems(preview.tree.root).find(n=>n.ref==='q/space').height,0);
 const custom=transformArrangement(editor.tree,'properties','layout:d',{align:'right',width:50});
 assert.deepEqual(resolveArrangement(b,custom,overrides,180).tree,custom);
 const broken=structuredClone(custom);arrangementItems(broken.root).find(n=>n.ref==='d').ref='deleted-diagram';
 assert.deepEqual(resolveArrangement(b,broken).missing.map(n=>n.ref),['deleted-diagram']);
});


test('live text drafts reconcile new paragraphs without changing the saved content or layout',()=>{
 const block={id:'example',type:'worked-example',presentation:{layout:'columns'},examples:[{id:'a',prompt:'Original prompt',theorySolution:'Original solution'},{id:'b',prompt:'Other part'}]};
 const initial=resolveArrangement(block),tree=initial.tree,entry=initial.entries.get('a/prompt');
 const before=JSON.stringify({block,tree});
 const draft=fromSource('Updated prompt\n\nAnother paragraph');
 const live=applyArrangementContent(block,tree,'layout:a/prompt',entry,draft);
 assert.equal(JSON.stringify({block,tree}),before,'discarding the preview leaves the saved state intact');
 assert.equal(live.block.examples[0].prompt.blocks.length,2);
 assert.equal(live.block.examples[0].theorySolution,'Original solution');
 assert.deepEqual(live.block.examples[1],block.examples[1]);
 const rendered=resolveArrangement(live.block,live.tree);
 assert.deepEqual(rendered.missing,[]);
 const refs=arrangementItems(live.tree.root).map(n=>n.ref);
 for(const paragraph of draft.blocks)assert.equal(refs.filter(ref=>ref==='a/prompt#'+paragraph.id).length,1);
 assert.deepEqual(applyArrangementContent(block,tree,'layout:a/prompt',entry,draft),live,'applying the edit matches its preview');
});

test('live structured paragraph edits retain the selected reference and neighbouring content',()=>{
 const block={id:'example',type:'worked-example',examples:[{id:'a',prompt:fromSource('First\n\nSecond')}]};
 const initial=resolveArrangement(block),entry=[...initial.entries.values()].find(e=>e.kind==='document');
 const live=applyArrangementContent(block,initial.tree,'layout:'+entry.ref,entry,fromSource('Typed text'));
 assert.equal(live.block.examples[0].prompt.blocks[0].id,entry.nodeId);
 assert.deepEqual(live.block.examples[0].prompt.blocks[1],block.examples[0].prompt.blocks[1]);
 assert.deepEqual(resolveArrangement(live.block,live.tree).missing,[]);
 assert.equal(block.examples[0].prompt.blocks[0].inlines[0].text,'First');
});

test('diagram content edits preserve alignment unless the image editor changes it',()=>{
 const block={id:'b',type:'question',content:{id:'q',prompt:'',children:[],questionDiagrams:[{id:'d',format:'image',src:'/old.png',widthMm:50}]}};
 const initial=resolveArrangement(block),entry=initial.entries.get('d');
 const centered=transformArrangement(initial.tree,'properties','layout:d',{align:'center'});
 const resized=applyArrangementContent(block,centered,'layout:d',entry,{...entry.value,widthMm:40,src:'/new.png'});
 assert.equal(arrangementItems(resized.tree.root).find(n=>n.ref==='d').align,'center');
 const right=applyArrangementContent(block,centered,'layout:d',entry,{...entry.value,align:'right'});
 assert.equal(arrangementItems(right.tree.root).find(n=>n.ref==='d').align,'right');
 assert.equal(resolveArrangement(right.block).tree.root.children.find(n=>n.ref==='d').align,'right');
 assert.equal(arrangementItems(centered.root).find(n=>n.ref==='d').align,'center');
});
