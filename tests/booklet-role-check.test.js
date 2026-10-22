import test from 'node:test';
import assert from 'node:assert/strict';
import {roleFindings,applyRoleFix,headerAbove,headerFamily,kindFamily,groupFamily,roleFamily,hasWorking,FAMILY_ROLE} from '../src/lib/booklet-role-check.js';

const question=(id,extra={})=>({id,type:'question',content:{id:id+'-q',type:'question',answer:{short:'4',worked:''},children:[]},...extra});
const project=blocks=>({id:'p',sections:[{id:'s',phase:'teaching',blocks}]});
const groups=entries=>new Map(Object.entries(entries));

test('header words and inventory kinds map to the role families',()=>{
 assert.equal(headerFamily('Guided Practice'),'guided');
 assert.equal(headerFamily('Key ideas'),'key-ideas');
 assert.equal(headerFamily('Example Simplify rates'),'example');
 assert.equal(headerFamily('Review'),'review');
 assert.equal(headerFamily('Simplifying Rates'),null);
 assert.equal(kindFamily('information'),'theory');
 assert.equal(kindFamily('guided-practice'),'guided');
 assert.equal(groupFamily({header:'Guided Practice',kind:'teaching'}),'guided','a printed header wins over the recorded kind');
 assert.equal(groupFamily({header:'Simplifying Rates',kind:'information'}),'theory');
});

test('a role that disagrees with the source group is a finding, with the role to change to',()=>{
 const block=question('b1',{pedagogyRole:'example',sourceAtom:{kind:'example',label:'Example'}});
 const found=roleFindings(project([block]),{groups:groups({b1:{family:'guided',kind:'guided-practice',header:'Guided practice'}})}).filter(f=>f.kind==='role-mismatch');
 assert.equal(found.length,1);
 assert.equal(found[0].expected,'guided');
 assert.equal(found[0].suggestedRole,'guided-practice');
 assert.match(found[0].detail,/solutions would show in the Questions edition/);
 const agreeing=roleFindings(project([block]),{groups:groups({b1:{family:'example',kind:'example',header:'Example'}})});
 assert.equal(agreeing.filter(f=>f.kind==='role-mismatch').length,0);
});

test('a role already changed by the teacher or changeBlockRole is a decision, not a finding',()=>{
 const block=question('b1',{pedagogyRole:'guided-practice',sourceAtom:{kind:'guided-practice'},sourceReview:{roleBefore:{pedagogyRole:'example'}}});
 assert.deepEqual(roleFindings(project([block]),{groups:groups({b1:{family:'example',kind:'example',header:'Example'}})}),[]);
});

test('weak evidence does not move a block: a catch-all teaching group, a practice group holding guided practice',()=>{
 const keyIdeas=question('k',{pedagogyRole:'key-ideas',sourceAtom:{kind:'key-ideas'}});
 assert.deepEqual(roleFindings(project([keyIdeas]),{groups:groups({k:{family:'theory',kind:'teaching',header:''}})}),[],'inventory kind teaching is a catch-all');
 const guided=question('g',{pedagogyRole:'guided-practice',sourceAtom:{kind:'guided-practice'}});
 assert.deepEqual(roleFindings(project([guided]),{groups:groups({g:{family:'practice',kind:'practice',header:'Practice'}})}),[]);
 const exercise=question('e-review-q3');
 assert.deepEqual(roleFindings(project([exercise]),{}),[],'a numbered exercise is not made a review by its id');
});

test('header words printed above the region outrank the inventory, and a disagreement is ambiguous',()=>{
 const block=question('b1',{pedagogyRole:'definition',sourceAtom:{kind:'definition',label:'Rule'}});
 const [finding]=roleFindings(project([block]),{groups:groups({b1:{family:'theory',kind:'information',header:'Rule'}}),headers:new Map([['b1','Key Ideas']])});
 assert.equal(finding.expected,'key-ideas');
 assert.equal(finding.ambiguous,true,'the inventory says theory, the page says Key ideas: ask');
 assert.equal(finding.source,'region-header');
});

test('an example with nothing to demonstrate is practice, whose answers would be on show',()=>{
 const empty={id:'ex',type:'worked-example',pedagogyRole:'worked-example',sourceAtom:{kind:'example'},examples:[{id:'e1',steps:[]}]};
 const solved={...empty,id:'ex2',examples:[{id:'e1',steps:[{id:'s'}]}]};
 const found=roleFindings(project([empty,solved]),{});
 assert.deepEqual(found.map(f=>[f.blockId,f.kind,f.suggestedRole]),[['ex','example-without-working','guided-practice']]);
 assert.equal(hasWorking(solved),true);
 assert.equal(hasWorking(empty),false);
});

test('a your-turn block must hide its solutions from the Questions edition',()=>{
 const open=question('y',{pedagogyRole:'guided-practice',sourceAtom:{kind:'example'},presentation:{studentRole:'your-turn'}});
 const hidden=question('y2',{pedagogyRole:'guided-practice',sourceAtom:{kind:'example'},presentation:{studentRole:'your-turn',hideStudentSolutions:true}});
 assert.deepEqual(roleFindings(project([open,hidden]),{}).map(f=>[f.blockId,f.kind]),[['y','solutions-visible']]);
 const fixed=applyRoleFix(project([open]),{kind:'solutions-visible',blockId:'y'});
 assert.equal(fixed.sections[0].blocks[0].presentation.hideStudentSolutions,true);
 assert.equal(open.presentation.hideStudentSolutions,undefined,'the input is not mutated');
});

test('a role fix goes through changeBlockRole and refuses without a role',()=>{
 const calls=[];
 const next=applyRoleFix(project([]),{kind:'role-mismatch',blockId:'b',suggestedRole:'review'},(p,id,role)=>{calls.push([id,role]);return p;});
 assert.deepEqual(calls,[['b','review']]);
 assert.ok(next);
 assert.throws(()=>applyRoleFix(project([]),{kind:'role-mismatch',blockId:'b'},()=>null),/No role/);
 assert.equal(FAMILY_ROLE.guided,'guided-practice');
 assert.equal(roleFamily(question('x',{pedagogyRole:'definition'})),'theory');
});

test('the header band is read from the words just above the region box',()=>{
 const words=[{t:'Guided',x0:60,y0:100,x1:100,y1:112},{t:'Practice',x0:104,y0:100,x1:150,y1:112},{t:'Footer',x0:60,y0:700,x1:90,y1:710},{t:'Elsewhere',x0:400,y0:100,x1:450,y1:112},{t:'inside',x0:60,y0:130,x1:100,y1:142}];
 assert.equal(headerAbove(words,[55,118,300,400]),'Guided Practice');
 assert.equal(headerAbove(words,[55,40,300,90]),'');
});
