import test from 'node:test';
import assert from 'node:assert/strict';
import { sourcePresentationFlags } from '../src/lib/source-presentation.js';
test('source evidence detects invented headings, bordered alignment tables and misplaced exam labels', () => {
  const page = { id:'page-1',pageNumber:1,section:{title:'Invented topic',sourceHeading:{text:'',style:'none'}},blocks:[
    {id:'table',content:'| a | b |\n| --- | --- |',sourceTableStyle:'borderless'},
    {id:'q',type:'question',title:'Wrong label',sourceExamLabel:'NAPLAN A',content:{prompt:'Question'}},
  ]};
  assert.deepEqual(sourcePresentationFlags({pages:[page]}).map(f=>[f.rootId,f.category]),[['page-1','header'],['table','table'],['q','structure']]);
  page.section.headingStyle='none';page.blocks[0].tableStyle='borderless';page.blocks[1].title='NAPLAN A';
  assert.deepEqual(sourcePresentationFlags({pages:[page]}),[]);
  page.blocks[1].content.prompt='NAPLAN A\nQuestion';
  assert.equal(sourcePresentationFlags({pages:[page]})[0].rootId,'q');
});
test('new imports require explicit source evidence without breaking legacy records',()=>{
  const raw={pages:[{id:'p',pageNumber:1,section:{title:'Title'},blocks:[{id:'table',content:'| a | b |'}]}]};
  assert.equal(sourcePresentationFlags(raw).length,0);
  assert.equal(sourcePresentationFlags(raw,{requireEvidence:true}).length,2);
});
