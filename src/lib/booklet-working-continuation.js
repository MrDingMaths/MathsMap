// Explicit opt-in: pagination projects a saved writing allowance across pages.
// The stored question, answer identity and total allowance remain unchanged.
export function workingContinuationOwner(block){
  let node=block.content;
  while(node?.children?.length){
    // A single retained part fragment may own a long response. Never split a
    // multi-cell row, dependency/paired group or an ancestor's own response.
    if(node.children.length!==1||node.keepTogether||node.flow?.keepTogether||node.pairedBlockId||node.representations||node.layout==='grid'||node.columns>1||node.dependsOn?.length||node.answer!=null||node.answerSpaceMm>0||node.sharedSolutionDiagrams?.length||node.questionDiagrams?.length)return null;
    node=node.children[0];
  }
  return node&&!node.keepTogether&&!node.flow?.keepTogether&&!node.pairedBlockId&&!node.representations&&Number.isFinite(node.answerSpaceMm)&&node.answerSpaceMm>0?node:null;
}
export function workingContinuation(block,heightMm,index=0,totalMm=workingContinuationOwner(block)?.answerSpaceMm){
  const next=structuredClone(block);
  const owner=workingContinuationOwner(next);if(!owner)throw Error('No safe working-response owner');
  owner.answerSpaceMm=heightMm;
  next.flow={...next.flow,fragment:(block.flow?.fragment??0)+index,workingSpaceSlice:{ownerId:owner.id,heightMm,totalMm}};
  if(index){
    next.flow.hideRepeatedStem=true;
    next.flow.pageBreakBefore=false;next.flow.sourcePageBreakBefore=false;
    delete next.flow.exerciseHeadingBefore;
    let node=next.content;for(;;){node.prompt='';node.afterDiagramPrompt='';node.questionDiagrams=[];if(node===owner)break;node=node.children[0];}
  }
  return next;
}
