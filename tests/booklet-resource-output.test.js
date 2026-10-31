import test from 'node:test';
import assert from 'node:assert/strict';
import {resourcePrintBindings,resourcePrintPageEvidence} from '../src/lib/booklet-resource-output.js';
import {sharedResourceHash,verifySharedResourcePages} from '../polish/shared-resources.mjs';

// Minimal DOM-shape fixture for the actual PracticeQuestionRenderer ->
// BookletArrangement student route. It deliberately has no data-node-id.
// Physical browser QA remains separate; these tests exercise scanner contracts.
class Element {
 constructor(tag,{dataset={},classes=[],text='',rect={left:0,top:0,right:600,bottom:800,width:600,height:800},style={}}={},children=[]){this.tagName=tag.toUpperCase();this.nodeType=1;this.dataset=dataset;this.classes=new Set(classes);this.classList={contains:c=>this.classes.has(c)};this.rect=rect;this.styleValues=style;this.children=children;this.childNodes=text?[{nodeType:3,textContent:text}]:children;this.clientWidth=100;this.scrollWidth=100;for(const c of children)c.parentElement=this;}
 get textContent(){return this.childNodes.map(n=>n.textContent).join('');}
 hasAttribute(name){return name.startsWith('data-')&&Object.hasOwn(this.dataset,name.slice(5).replace(/-([a-z])/g,(_,c)=>c.toUpperCase()));}
 getBoundingClientRect(){return this.rect;}
 matches(selector){return selector.split(',').some(raw=>{const s=raw.trim();if(s.startsWith('.'))return this.classes.has(s.slice(1));if(s==='td'||s==='th'||s==='footer')return this.tagName===s.toUpperCase();if(s==='table[data-id]')return this.tagName==='TABLE'&&this.hasAttribute('data-id');if(/^\[data-[\w-]+\]$/.test(s))return this.hasAttribute(s.slice(1,-1));return false;});}
 querySelectorAll(selector){return this.children.flatMap(c=>[...(c.matches(selector)?[c]:[]),...c.querySelectorAll(selector)]);}
 querySelector(selector){return this.querySelectorAll(selector)[0]??null;}
 closest(selector){for(let n=this;n;n=n.parentElement)if(n.matches(selector))return n;return null;}
}
const box=(top,bottom)=>({left:20,right:500,width:480,top,bottom,height:bottom-top});
function table(value='12'){
 const cell=new Element('td',{dataset:{id:'cell'},text:value,rect:box(40,60)}),row=new Element('tr',{},[cell]);cell.colSpan=1;cell.rowSpan=1;
 const t=new Element('table',{dataset:{id:'t'},rect:box(40,60)},[row]);row.cells=[cell];t.rows=[row];return t;
}
function question(id,children=[],top=20){return new Element('div',{dataset:{questionId:id},classes:['practice-question'],rect:box(top,top+80)},[new Element('div',{dataset:{arrangementBlock:id},classes:['booklet-arrangement']},children)]);}
function fixture(){
 const t=table(),source=question('a',[new Element('div',{dataset:{contentOwner:'a-root'}},[t])]),consumer=question('b',[],200),p1=new Element('div',{classes:['print-page'],dataset:{flowBlocks:'a'}},[source]),p2=new Element('div',{classes:['print-page'],dataset:{flowBlocks:'b'}},[consumer]),root=new Element('section',{classes:['project-print']},[p1,p2]);
 const native={id:'t',type:'table',rows:[[{id:'cell',blocks:[{id:'para',type:'paragraph',inlines:[{type:'text',text:'12'}]}]}]]};
 const project={id:'p',sections:[{id:'s',phase:'practice',blocks:[{id:'a',content:{id:'a-root',prompt:{format:'maths-editor-document-v1',blocks:[native]}}},{id:'b',content:{id:'b-root',prompt:'Use the table.'},flow:{dependsOn:['a'],sharedResourceEdges:[{kind:'native-table-access-v1',projectId:'p',relationship:'resource-access-only',targetOwnerId:'a',tableId:'t',tableSha256:sharedResourceHash(native)}]}}]}]};
 return {root,t,source,consumer,p1,p2,project,bindings:resourcePrintBindings(project,{hash:sharedResourceHash})};
}
function withDOM(action){
 const oldDocument=globalThis.document,oldStyle=globalThis.getComputedStyle;
 // The expected template is a separate source table, so mutations of the real
 // fixture table cannot alter the expected semantic cells.
 globalThis.document={createElement:()=>({content:{querySelector:()=>table()},set innerHTML(_value){}})};
 globalThis.getComputedStyle=el=>({display:'block',visibility:'visible',opacity:'1',clipPath:'none',overflowX:'visible',overflowY:'visible',fontSize:'13',...el.styleValues});
 try{return action();}finally{if(oldDocument===undefined)delete globalThis.document;else globalThis.document=oldDocument;if(oldStyle===undefined)delete globalThis.getComputedStyle;else globalThis.getComputedStyle=oldStyle;}
}

test('current question/arrangement wrappers produce real consumer and native table evidence without old node IDs',()=>withDOM(()=>{const f=fixture();assert.equal(f.root.querySelectorAll('[data-node-id]').length,0);const pages=resourcePrintPageEvidence(f.bindings,f.root);assert.equal(pages[0].elements[0].id,'t');assert.equal(pages[0].elements[0].readable,true);assert.equal(pages[1].elements[0].id,'b');}));
test('unexpected missing consumer or obsolete-only selector cannot silently pass an empty evidence scan',()=>withDOM(()=>{const f=fixture();f.p2.children=[];assert.throws(()=>resourcePrintPageEvidence(f.bindings,f.root),/Expected dependent question b/);}));
test('answer wrappers cannot satisfy a missing student consumer',()=>withDOM(()=>{const f=fixture();f.consumer.classes.add('answer-key');assert.throws(()=>resourcePrintPageEvidence(f.bindings,f.root),/Expected dependent question b/);}));
test('same-ID native table under another question owner is not accepted as the required source',()=>withDOM(()=>{const f=fixture();f.source.dataset.questionId='foreign';f.source.children[0].dataset.arrangementBlock='foreign';const pages=resourcePrintPageEvidence(f.bindings,f.root);assert.equal(pages[0].elements.length,0);assert.equal(pages[1].elements[0].id,'b');}));
test('source native semantic mutation or hidden source table produces unusable resource evidence',()=>withDOM(()=>{for(const change of [f=>f.t.rows[0].cells[0].childNodes[0].textContent='13',f=>f.t.styleValues.visibility='hidden']){const f=fixture();change(f);const pages=resourcePrintPageEvidence(f.bindings,f.root);assert.equal(pages[0].elements[0].readable,false);}}));
test('legacy node-root fallback remains supported while current wrappers take precedence',()=>withDOM(()=>{const f=fixture();for(const [node,id]of [[f.source,'a-root'],[f.consumer,'b-root']]){node.dataset={nodeId:id};node.children[0].dataset={};}const pages=resourcePrintPageEvidence(f.bindings,f.root);assert.equal(pages[0].elements[0].readable,true);assert.equal(pages[1].elements[0].id,'b');}));

test('current DOM full view and selected source+consumer pass; selected consumer without its source table holds',()=>withDOM(()=>{const f=fixture(),pages=resourcePrintPageEvidence(f.bindings,f.root);assert.equal(verifySharedResourcePages(f.project,null,{edition:'student',pages,selectedPages:[0,1],hash:sharedResourceHash}),true);assert.throws(()=>verifySharedResourcePages(f.project,null,{edition:'student',pages,selectedPages:[1],hash:sharedResourceHash}),/Required table omitted/);assert.equal(verifySharedResourcePages(f.project,null,{edition:'student',pages,selectedPages:[0],hash:sharedResourceHash}),true);}));
