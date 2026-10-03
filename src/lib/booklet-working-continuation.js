// Explicit opt-in: pagination projects a saved writing allowance across pages.
// The stored question, answer identity and total allowance remain unchanged.
export function workingContinuation(block,heightMm,index=0,totalMm=block.content?.answerSpaceMm){
  const next=structuredClone(block);
  next.content.answerSpaceMm=heightMm;
  next.flow={...next.flow,fragment:(block.flow?.fragment??0)+index,workingSpaceSlice:{ownerId:next.content.id,heightMm,totalMm}};
  if(index){
    next.flow.hideRepeatedStem=true;
    next.flow.pageBreakBefore=false;next.flow.sourcePageBreakBefore=false;
    delete next.flow.exerciseHeadingBefore;
    next.content.prompt='';next.content.afterDiagramPrompt='';
    next.content.questionDiagrams=[];
  }
  return next;
}
