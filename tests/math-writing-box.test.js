import test from 'node:test';
import assert from 'node:assert/strict';
import {renderMath} from '../src/lib/render-math.js';
import {prepareMathWritingBoxes,trustMathWritingBox} from '../src/lib/math-writing-box.js';
test('native dotted writing blanks render in logarithm arguments and bases',()=>{
 const blank=String.raw`\enclose{dottedbox}{\rule{0pt}{5mm}\hspace{9mm}}`;
 const html=renderMath(`$\\log_2${blank}=\\log_{${blank}}9$`);
 assert.ok(!html.includes('katex-error'));
 assert.equal((html.split('katex-html')[1].match(/min-width:9mm/g)??[]).length,2);
 assert.ok(html.includes('border-bottom:0.2mm dotted currentColor'));
});
test('writing-box trust cannot enable arbitrary styles, links or dimensions',()=>{
 assert.equal(trustMathWritingBox({command:'\\htmlStyle',style:'position:fixed;inset:0'}),false);
 assert.equal(trustMathWritingBox({command:'\\href',url:'https://example.com'}),false);
 const oversized=String.raw`\enclose{dottedbox}{\rule{0pt}{5mm}\hspace{999mm}}`;
 assert.equal(prepareMathWritingBoxes(oversized),oversized);
});
