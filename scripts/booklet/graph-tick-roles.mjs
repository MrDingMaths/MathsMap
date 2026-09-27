import assert from 'node:assert/strict';

export const GRAPH_TICK_OPEN=String.raw`\special{dvisvgm:raw <g data-graph-text="tick">}`;
export const GRAPH_TEXT_CLOSE=String.raw`\special{dvisvgm:raw </g>}`;

// Reviewed offsets use Unicode code points, matching the source audit. Wrapping
// a complete node preserves units, maths and scripts under final-size scaling.
export function annotateReviewedGraphTicks(code,nodes){
 const points=[...code],changes=[];
 for(const node of nodes){
  const {startOffset,endOffset,contentStartOffset,contentEndOffset}=node;
  assert.equal(points.slice(startOffset,endOffset).join(''),node.nodeSource,'Reviewed node source changed');
  assert.equal(points.slice(contentStartOffset,contentEndOffset).join(''),node.content,'Reviewed node content changed');
  if(!node.insertTickMarker){assert.equal(node.classification,'ordinary-category-label');continue;}
  assert.equal(node.classification,'axis-tick');
  assert(!node.nodeSource.includes('data-graph-text='),'Tick already has a semantic marker');
  changes.push(node);
 }
 let last=points.length;
 for(const node of [...changes].sort((a,b)=>b.contentStartOffset-a.contentStartOffset)){
  assert(node.contentEndOffset<=last,'Reviewed tick ranges overlap');last=node.contentStartOffset;
  points.splice(node.contentStartOffset,node.contentEndOffset-node.contentStartOffset,GRAPH_TICK_OPEN+node.content+GRAPH_TEXT_CLOSE);
 }
 return {code:points.join(''),changedNodeDefinitions:changes.length};
}
