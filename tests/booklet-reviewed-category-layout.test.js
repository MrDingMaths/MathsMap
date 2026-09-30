import test from 'node:test';
import assert from 'node:assert/strict';
import {reconcileReviewedCategoryLayouts} from '../scripts/booklet/reviewed-category-layout.mjs';
import {resolveArrangement} from '../src/lib/booklet-arrangement.js';
const fixture=()=>({source:{reviewProfile:'textbook-three-pass-v1'},settings:{},sections:[{blocks:[{id:'b',type:'question',sourceOrder:1,sourceReview:{sourceIdentity:{category:'Additional practice'},sourceCategoryHeading:{label:'Additional practice'}},content:{id:'q',type:'question',prompt:{format:'maths-editor-document-v1',blocks:[{id:'b-category-heading',type:'paragraph',inlines:[{type:'text',text:'Additional practice',bold:true}]},{id:'stem',type:'paragraph',inlines:[{type:'text',text:'Find the angle.'}]}]},answer:{short:'30°',worked:'Use the sine rule.'},answerSpaceMm:20}}]}]});
const refs=n=>n.type==='item'?[n.ref]:n.children.flatMap(refs);
test('extends a custom arrangement without changing reviewed content or old placement',()=>{
 const p=fixture(),b=p.sections[0].blocks[0],before=structuredClone({content:b.content,sourceReview:b.sourceReview});
 const old={id:'old',type:'group',direction:'row',gap:0,children:[{id:'label',type:'item',ref:'q/label',width:7},{id:'body',type:'group',direction:'stack',gap:3,children:[{id:'stem',type:'item',ref:'q/prompt#stem',width:80},{id:'space',type:'item',ref:'q/space'}]}]};
 p.settings.layoutOverrides={blockLayouts:{b:{arrangement:{version:1,root:{id:'root',type:'group',direction:'stack',gap:3,children:[old]}}}}};
 assert.deepEqual(reconcileReviewedCategoryLayouts(p),['b']);
 const a=p.settings.layoutOverrides.blockLayouts.b.arrangement;
 assert.equal(a.root.children[0].ref,'q/prompt#b-category-heading');assert.deepEqual(a.root.children[1],old);
 assert.deepEqual({content:b.content,sourceReview:b.sourceReview},before);
 assert.deepEqual(b.presentation.layoutOverrides.blockLayouts.b.arrangement,a);
 assert.deepEqual(reconcileReviewedCategoryLayouts(p),[]);
});
test('expands whole-field aliases without duplicating the heading or losing width',()=>{
 const p=fixture();p.settings.layoutOverrides={blockLayouts:{b:{arrangement:{version:1,root:{id:'root',type:'group',direction:'stack',children:[{id:'label',type:'item',ref:'q/label'},{id:'prompt',type:'item',ref:'q/prompt',width:81},{id:'space',type:'item',ref:'q/space'}]}}}}};
 reconcileReviewedCategoryLayouts(p);const a=p.settings.layoutOverrides.blockLayouts.b.arrangement;
 assert.equal(refs(a.root).filter(r=>r==='q/prompt#b-category-heading').length,1);
 assert.equal(a.root.children.find(n=>n.id==='prompt').width,81);
 assert.equal(resolveArrangement(p.sections[0].blocks[0],a).missing.length,0);
});
test('default heading precedes the numbered row and legacy projects are unchanged',()=>{
 const p=fixture();reconcileReviewedCategoryLayouts(p);const a=p.settings.layoutOverrides.blockLayouts.b.arrangement;
 assert.equal(a.root.children[0].ref,'q/prompt#b-category-heading');assert.equal(a.root.children[1].children[0].width,7);
 const legacy=fixture();delete legacy.source.reviewProfile;const before=structuredClone(legacy);assert.deepEqual(reconcileReviewedCategoryLayouts(legacy),[]);assert.deepEqual(legacy,before);
});
test('an existing row remains intact beneath the restored heading',()=>{
 const p=fixture(),row={id:'row',type:'group',direction:'row',gap:4,children:[{id:'label',type:'item',ref:'q/label',width:7},{id:'body',type:'group',direction:'stack',children:[{id:'stem',type:'item',ref:'q/prompt#stem'},{id:'space',type:'item',ref:'q/space'}]}]};
 p.settings.layoutOverrides={blockLayouts:{b:{arrangement:{version:1,root:row}}}};reconcileReviewedCategoryLayouts(p);
 const a=p.settings.layoutOverrides.blockLayouts.b.arrangement;assert.equal(a.root.direction,'stack');assert.equal(a.root.children[0].ref,'q/prompt#b-category-heading');assert.deepEqual(a.root.children[1],row);
});
