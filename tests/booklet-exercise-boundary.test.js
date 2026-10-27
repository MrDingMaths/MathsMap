import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeEditableProject} from '../src/lib/editable-booklet-model.js';
import {flowEditionSections,flowNumbers} from '../src/lib/booklet-flow.js';
import {practiceRatingBlocks} from '../scripts/booklet/reasoning-ratings.mjs';

const editions=['student','short','worked','with-short','with-worked'];
const question=id=>({id,type:'question',content:{id:id+'-root',type:'question',label:'',prompt:'Differentiate $x^2$.',answer:{short:'$2x$',worked:'$f\u2032(x)=2x$'}}});
const fixture=()=>normalizeEditableProject({id:'warm-up',title:'Power rule',settings:{paginationMode:'flexible',exerciseOrganisation:'topic',numberPracticeTopicsOnly:true},topics:[{id:'t',title:'Power rule'}],sections:[{id:'warm-up',title:'Practice',topicId:'t',phase:'practice',blocks:[question('warm-up-task')]},{id:'exercise',title:'Exercise',topicId:'t',phase:'practice',blocks:[question('exercise-task')]}]});

test('an explicit pre-exercise practice section keeps its assessed task and answers',()=>{
 const project=fixture(),numbers=flowNumbers(project),required=practiceRatingBlocks(project).map(r=>r.block.id);
 const before=flowEditionSections(project,'student');
 assert.equal(before[0].blocks[0].flow.exerciseHeadingBefore,1);
 project.sections[0].exerciseStart=false;
 const normalized=normalizeEditableProject(project);
 assert.equal(normalized.sections[0].exerciseStart,false,'The native save/reopen model retains the explicit field');
 const after=flowEditionSections(normalized,'student');
 assert.equal(after[0].difficultyTitle,null);
 assert.equal(after[0].blocks[0].flow.exerciseHeadingBefore,undefined);
 assert.equal(after[1].blocks[0].flow.exerciseHeadingBefore,1);
 assert.equal(after[1].pageBreakBefore,true,'The real exercise keeps its forced page break');
 assert.deepEqual(flowNumbers(normalized),numbers);
 assert.deepEqual(practiceRatingBlocks(normalized).map(r=>r.block.id),required);
 assert.equal(required.length,2);
 for(const edition of ['short','worked'])assert.deepEqual(flowEditionSections(normalized,edition).flatMap(s=>s.blocks.map(b=>b.id)),required);
});

test('removing the optional boundary field restores every unchanged edition projection',()=>{
 const project=fixture(),before=editions.map(edition=>flowEditionSections(project,edition));
 project.sections[0].exerciseStart=false;
 assert.notDeepEqual(flowEditionSections(project,'student'),before[0]);
 delete project.sections[0].exerciseStart;
 assert.deepEqual(editions.map(edition=>flowEditionSections(project,edition)),before);
});
