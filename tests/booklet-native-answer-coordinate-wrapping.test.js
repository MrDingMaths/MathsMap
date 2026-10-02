import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,readdirSync,readFileSync} from 'node:fs';
import {dirname,join,resolve} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';

// Exercise the application's exported function, without duplicating its code.
// Discover its containing module because the handoff supplies no module path.
function repositoryRoot(){
  for(const start of [process.cwd(),dirname(fileURLToPath(import.meta.url))]){
    let directory=resolve(start);
    for(;;){
      if(existsSync(join(directory,'src','lib')))return directory;
      const parent=dirname(directory);
      if(parent===directory)break;
      directory=parent;
    }
  }
  throw new Error('Run this standalone node:test file within the MathsMap repository.');
}
function findExport(directory){
  const found=[];
  for(const entry of readdirSync(directory,{withFileTypes:true})){
    const path=join(directory,entry.name);
    if(entry.isDirectory())found.push(...findExport(path));
    else if(/\.(?:js|mjs)$/.test(entry.name)&&/export\s+function\s+compactAnswerDisplay\s*\(/.test(readFileSync(path,'utf8')))found.push(path);
  }
  return found;
}
const modules=findExport(join(repositoryRoot(),'src','lib'));
assert.equal(modules.length,1,'Locate exactly one application compactAnswerDisplay export');
const {compactAnswerDisplay}=await import(pathToFileURL(modules[0]).href);
assert.equal(typeof compactAnswerDisplay,'function');

function freezeDeep(value){
  if(value&&typeof value==='object'){
    Object.freeze(value);
    for(const child of Object.values(value))freezeDeep(child);
  }
  return value;
}
function paragraph(id,latex,prefix=''){
  return {id,type:'paragraph',align:'left',inlines:[{type:'text',text:prefix},{id:id+'-math',type:'math',latex,display:false,authorTag:'preserve'}]};
}
function document(blocks){
  return {format:'maths-editor-document-v1',version:1,id:'document-id',custom:{source:'accepted'},blocks};
}
function mathInParagraph(block){return block.inlines.find(inline=>inline.type==='math');}

const p62Coordinates=String.raw`(40,0),\ (50,10),\ (60,50),\ (70,110),\ (80,155),\ (90,185),\ (100,200)`;
const p62Wrapped=String.raw`(40,0),\allowbreak \ (50,10),\allowbreak \ (60,50),\allowbreak \ (70,110),\allowbreak \ (80,155),\allowbreak \ (90,185),\allowbreak \ (100,200)`;
const p64Coordinates=String.raw`(1.5,0.02),\ (3.5,0.14),\ (4.5,0.10),\ (7.5,0.08),\ (12.5,0.06)`;
const p64Wrapped=String.raw`(1.5,0.02),\allowbreak \ (3.5,0.14),\allowbreak \ (4.5,0.10),\allowbreak \ (7.5,0.08),\allowbreak \ (12.5,0.06)`;

test('actual p62 and p64 native paragraph lists acquire only top-level break opportunities',()=>{
  const input=document([
    paragraph('p62-q22c-short-result','10,50,110,155,185,200','Cumulative bar heights: '),
    paragraph('p62-q22c-short-method',p62Coordinates,'Polygon: join '),
    paragraph('p64-q28-b-short-heights',String.raw`0.02,\ 0.14,\ 0.10,\ 0.08,\ 0.06`,'Bar heights, in interval order: '),
    paragraph('p64-q28-b-short-method',p64Coordinates,'Join the bar-top midpoints ')
  ]);
  const snapshot=structuredClone(input);
  freezeDeep(input);
  const output=compactAnswerDisplay(input);
  assert.equal(mathInParagraph(output.blocks[0]).latex,String.raw`10,\allowbreak 50,\allowbreak 110,\allowbreak 155,\allowbreak 185,\allowbreak 200`);
  assert.equal(mathInParagraph(output.blocks[1]).latex,p62Wrapped);
  assert.equal(mathInParagraph(output.blocks[2]).latex,String.raw`0.02,\allowbreak \ 0.14,\allowbreak \ 0.10,\allowbreak \ 0.08,\allowbreak \ 0.06`);
  assert.equal(mathInParagraph(output.blocks[3]).latex,p64Wrapped);
  assert.deepEqual(input,snapshot,'Stored document and original editable TeX remain unchanged');
  assert.notStrictEqual(output,input);
  assert.equal(output.id,input.id);
  assert.equal(output.format,input.format);
  assert.equal(output.version,input.version);
  assert.deepEqual(output.custom,input.custom);
  for(let index=0;index<input.blocks.length;index++){
    const before=input.blocks[index],after=output.blocks[index];
    assert.equal(after.id,before.id);
    assert.equal(after.type,before.type);
    assert.equal(after.align,before.align);
    assert.deepEqual(after.inlines[0],before.inlines[0]);
    const originalMath=mathInParagraph(before),displayMath=mathInParagraph(after);
    assert.equal(displayMath.id,originalMath.id);
    assert.equal(displayMath.authorTag,originalMath.authorTag);
    assert.equal(displayMath.display,originalMath.display);
  }
});

test('actual coordinate lists are traversed inside native table-cell arrays',()=>{
  const table={id:'coordinate-table',type:'table',widthMm:78,widths:[1,1],padding:1,border:true,rows:[[
    {id:'cell-62',type:'cell',align:'center',blocks:[paragraph('table-p62',p62Coordinates)]},
    {id:'cell-64',type:'cell',align:'left',blocks:[paragraph('table-p64',p64Coordinates)]}
  ]]};
  const input=document([table]);
  const snapshot=structuredClone(input);
  freezeDeep(input);
  const output=compactAnswerDisplay(input);
  const result=output.blocks[0];
  assert.equal(mathInParagraph(result.rows[0][0].blocks[0]).latex,p62Wrapped);
  assert.equal(mathInParagraph(result.rows[0][1].blocks[0]).latex,p64Wrapped);
  for(const key of ['id','type','widthMm','widths','padding','border'])assert.deepEqual(result[key],table[key]);
  assert.deepEqual(result.rows[0].map(cell=>cell.id),['cell-62','cell-64']);
  assert.deepEqual(result.rows[0].map(cell=>cell.align),['center','left']);
  assert.deepEqual(input,snapshot);
});

test('legacy inline strings use the same breaks and preserve display maths',()=>{
  assert.equal(compactAnswerDisplay('$'+p62Coordinates+'$'),'$'+p62Wrapped+'$');
  assert.equal(compactAnswerDisplay('$'+p64Coordinates+'$'),'$'+p64Wrapped+'$');
  assert.equal(compactAnswerDisplay('$1,2;3$'),String.raw`$1,\allowbreak 2;\allowbreak 3$`);
  assert.equal(compactAnswerDisplay('$$1,2;3$$'),'$$1,2;3$$');
  assert.equal(compactAnswerDisplay(String.raw`\$1,2\$`),String.raw`\$1,2\$`);
});

test('nested fractions, coordinates, mixed-endpoint intervals and braces stay intact',()=>{
  const latex=String.raw`\frac{(1,2)}{\frac{3,4}{5,6}},\ (7,8);\ [0,10),\ {a,b},\ \{c,d\}`;
  const expected=String.raw`\frac{(1,2)}{\frac{3,4}{5,6}},\allowbreak \ (7,8);\allowbreak \ [0,10),\allowbreak \ {a,b},\allowbreak \ \{c,d\}`;
  const input=document([paragraph('nested',latex)]);
  assert.equal(mathInParagraph(compactAnswerDisplay(input).blocks[0]).latex,expected);
  assert.equal(compactAnswerDisplay('$'+latex+'$'),'$'+expected+'$');
  const escaped=String.raw`1\,2,3\;4;5`;
  assert.equal(compactAnswerDisplay('$'+escaped+'$'),String.raw`$1\,2,\allowbreak 3\;4;\allowbreak 5$`);
});

test('native displayed maths, non-math strings and unrelated values are preserved',()=>{
  const input=document([
    {id:'display-block',type:'math',latex:'1,2;3',display:true,metadata:{accepted:true}},
    {id:'implicit-display-block',type:'math',latex:'4,5'},
    {id:'paragraph',type:'paragraph',inlines:[
      {id:'display-inline',type:'math',latex:'6,7',display:true},
      {id:'plain-text',type:'text',text:'Keep 8,9;10'},
      {id:'implicit-inline',type:'math',latex:'11,12'}
    ]},
    {id:'diagram',type:'diagram',code:'(1,2)--(3,4)',widthMm:72,spec:{sourcePage:62}}
  ]);
  const snapshot=structuredClone(input);
  freezeDeep(input);
  const output=compactAnswerDisplay(input);
  assert.deepEqual(output.blocks[0],snapshot.blocks[0]);
  assert.deepEqual(output.blocks[1],snapshot.blocks[1]);
  assert.deepEqual(output.blocks[2].inlines[0],snapshot.blocks[2].inlines[0]);
  assert.deepEqual(output.blocks[2].inlines[1],snapshot.blocks[2].inlines[1]);
  assert.equal(output.blocks[2].inlines[2].latex,String.raw`11,\allowbreak 12`);
  assert.equal(output.blocks[2].inlines[2].id,'implicit-inline');
  assert.deepEqual(output.blocks[3],snapshot.blocks[3]);
  assert.deepEqual(input,snapshot);
});

test('existing break opportunities are not duplicated on repeated display preparation',()=>{
  const input=document([paragraph('idempotent',p62Coordinates)]);
  const once=compactAnswerDisplay(input);
  const twice=compactAnswerDisplay(once);
  assert.equal(mathInParagraph(twice.blocks[0]).latex,p62Wrapped);
  const legacy='$'+p64Coordinates+'$';
  assert.equal(compactAnswerDisplay(compactAnswerDisplay(legacy)),'$'+p64Wrapped+'$');
});

test('existing prose glue still follows delimiter preparation',()=>{
  assert.equal(compactAnswerDisplay('$x$.'),String.raw`$x\text{.}$`);
  assert.equal(compactAnswerDisplay('$|A|$'), '${|A|}$');
  assert.equal(compactAnswerDisplay('x-axis'), 'x\u2060-\u2060axis');
});
