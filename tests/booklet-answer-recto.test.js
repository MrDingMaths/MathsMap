import test from 'node:test';
import assert from 'node:assert/strict';
import {paginateFlow} from '../src/lib/booklet-pagination.js';
import {normalizeEditableProject} from '../src/lib/editable-booklet-model.js';
import {deriveBookletCover} from '../src/lib/booklet-cover.js';
import {bodyMetrics,bodyEqualsStudent} from '../src/lib/booklet-pagination-metrics.js';
import {inspectBookletPage} from '../src/lib/booklet-qa.js';

function project(questionPages,compact){
 return normalizeEditableProject({id:`recto-${questionPages}-${compact}`,title:'Recto',topics:[{id:'t',title:'Topic'}],settings:{paginationMode:'flexible',...(compact?{compactAnswers:{}}:{})},sections:[
  {id:'cover',phase:'front-matter',isCover:true,blocks:[{id:'cover-text',type:'rich-text',content:'# Recto'}]},
  {id:'practice',topicId:'t',title:'Topic',phase:'practice',blocks:Array.from({length:questionPages-1},(_,i)=>({id:`q${i}`,type:'question',flow:{pageBreakBefore:true},content:{id:`root${i}`,prompt:'Calculate.',answer:{short:'2',worked:'1+1=2'}}}))}
 ]});
}
const measure=page=>({height:page.blocks.length*10,capacity:1000});
for(const compact of [false,true])for(const count of [3,4])for(const edition of ['with-short','with-worked'])test(`${edition}, compact ${compact}, ${count} question pages: answer recto and clean separator`,async()=>{
 const p=project(count,compact),before=structuredClone(p);
 const student=await paginateFlow(p,'student',measure);
 assert.equal(student.pages.length,count);
 const result=await paginateFlow(p,edition,measure),answer=result.pages.find(page=>page.mode!=='student');
 assert.equal(answer.pageNumber%2,1);
 assert.equal(result.pages.filter(page=>page.isBlank).length,count%2);
 const blank=result.pages.find(page=>page.isBlank);
 if(blank){assert.deepEqual(blank.blocks,[]);assert.equal(blank.pageNumber,count+1);assert.equal(blank.section.headingStyle,'none');}
 assert.deepEqual(result.pages.filter(page=>page.mode==='student'&&!page.isBlank).map(page=>page.blocks.map(b=>b.id)),student.pages.map(page=>page.blocks.map(b=>b.id)));
 assert.deepEqual((await paginateFlow(p,edition,measure,{previous:result})).pages,result.pages);
 assert.equal(deriveBookletCover(result.pages).contents.some(entry=>entry.pageNumber===blank?.pageNumber),false);
 if(compact)assert.equal(deriveBookletCover(result.pages).contents.find(entry=>entry.answerSection)?.pageNumber,answer.pageNumber);
 assert.deepEqual(p,before);
});
test('blank verso is excluded from body utilisation even when geometry supplies a body box',()=>{
 const body={page:2,blocks:[],space:{capacityMm:250,usedMm:100,remainingMm:150}};
 const blank={page:3,blocks:[],isBlank:true,space:{capacityMm:250,usedMm:0,remainingMm:250}};
 const p={sections:[],topics:[],settings:{}};
 assert.equal(bodyMetrics(p,[body,blank]).bodyPages,1);
 assert.equal(bodyEqualsStudent([body],[body,blank]),true);
});
test('page QA accepts only an actually empty designated blank page',()=>{
 const article={dataset:{blankPage:'true',pageNumber:'4'},children:[],textContent:''};
 assert.deepEqual(inspectBookletPage(article).issues,[]);
 assert.equal(inspectBookletPage({...article,textContent:'Footer'}).issues[0].kind,'nonempty-blank-page');
 assert.equal(inspectBookletPage({...article,children:[{}]}).issues[0].kind,'nonempty-blank-page');
});
