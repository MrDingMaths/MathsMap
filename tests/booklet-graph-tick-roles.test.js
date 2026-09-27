import test from 'node:test';import assert from 'node:assert/strict';
import {annotateReviewedGraphTicks,GRAPH_TICK_OPEN,GRAPH_TEXT_CLOSE} from '../scripts/booklet/graph-tick-roles.mjs';

function node(code,source,content,classification='axis-tick'){
 const chars=[...code],start=chars.join('').indexOf(source),startOffset=[...code.slice(0,start)].length;
 const contentOffset=source.lastIndexOf(content),contentStartOffset=startOffset+[...source.slice(0,contentOffset)].length;
 return {nodeSource:source,content,startOffset,endOffset:startOffset+[...source].length,contentStartOffset,contentEndOffset:contentStartOffset+[...content].length,classification,insertTickMarker:classification==='axis-tick'};
}
test('wraps complete numeric/unit labels using Unicode code-point offsets and leaves categories intact',()=>{
 const source=String.raw`\node[font=\fontsize{8.5}{10}\selectfont] at (1,0) {$\x\text{ cm}$}`;
 const category=String.raw`\node[font=\fontsize{8.5}{10}\selectfont] at (2,0) {A}`;
 const code='%% π 😀\n'+source+';\n'+category+';';
 const result=annotateReviewedGraphTicks(code,[node(code,source,String.raw`$\x\text{ cm}$`),node(code,category,'A','ordinary-category-label')]);
 assert.equal(result.changedNodeDefinitions,1);
 assert(result.code.includes(GRAPH_TICK_OPEN+String.raw`$\x\text{ cm}$`+GRAPH_TEXT_CLOSE));
 assert(result.code.includes(category));
 assert.equal(result.code.replace(GRAPH_TICK_OPEN,'').replace(GRAPH_TEXT_CLOSE,''),code);
});
test('rejects stale reviewed node evidence before modifying a graph',()=>{
 const code=String.raw`\node at (0,0) {10}`,review=node(code,code,'10');
 assert.throws(()=>annotateReviewedGraphTicks(code.replace('{10}','{11}'),[review]),/source changed/);
});
