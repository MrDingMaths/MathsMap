import test from 'node:test';
import assert from 'node:assert/strict';
import {pdfLinkAnnotations,verifyPdfNavigation} from '../scripts/booklet/pdf-navigation-qa.mjs';

const annotation=(id,dest,rect='0 0 10 10')=>`${id} 0 obj\n<</Type /Annot\n/Subtype /Link\n/Rect [${rect}]\n/Dest /${dest}>>\nendobj\n`;
test('PDF annotation checks retain repeated/textless links and decode PDF names',()=>{
 const links=pdfLinkAnnotations(Buffer.from(annotation(1,'question#20one')+annotation(2,'question#20one')));
 assert.equal(links.length,2);assert.equal(links[0].destination,'question one');
 assert.deepEqual(verifyPdfNavigation(links,new Map([['question one',2]]),[{href:'#question%20one',exists:true},{href:'#question%20one',exists:true}]),{annotations:2,expectedLinks:2,destinations:1});
});
test('PDF navigation rejects missing annotations, unresolved targets and empty rectangles',()=>{
 const links=pdfLinkAnnotations(Buffer.from(annotation(1,'question'))),destinations=new Map([['question',2]]),expected=[{href:'#question',exists:true}];
 assert.throws(()=>verifyPdfNavigation([],destinations,expected),/lost links/);
 assert.throws(()=>verifyPdfNavigation(links,new Map(),expected),/no named destination/);
 assert.throws(()=>pdfLinkAnnotations(Buffer.from(annotation(1,'question','0 0 0 10'))),/rectangle/);
});
