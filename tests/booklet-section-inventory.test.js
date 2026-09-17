import test from 'node:test';
import assert from 'node:assert/strict';
import {contentNodes,contentVerificationKey,inspectContentCoverage} from '../src/lib/booklet-content-verification.js';

test('calculated section headings remain verifiable source targets',async()=>{
 const block={id:'body',type:'rich-text',content:'Complete syllabus'};
 const project={sections:[{id:'syllabus',title:'Syllabus Content',phase:'front-matter',blocks:[block]}],source:{inventory:{entries:[{id:'heading',targetId:'syllabus',field:'/title',pageNumber:2},{id:'body-source',targetId:'body',pageNumber:2}]}}};
 const nodes=contentNodes(project);
 assert.equal(nodes.get('syllabus').block,block);
 for(const entry of project.source.inventory.entries)entry.verification={checked:true,signature:await contentVerificationKey(project,entry)};
 assert.equal((await inspectContentCoverage(project)).contentComplete,true);
 project.sections[0].title='Changed heading';
 assert.equal((await inspectContentCoverage(project)).contentComplete,false);
});
