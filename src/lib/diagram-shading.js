// Inventory only: mathematical meaning cannot be inferred from a colour name.
// Never apply this scanner as a renderer-wide paint filter.
export function shadingCandidates(source) {
  const code=String(source).replace(/(?<!\\)%[^\n]*/g,m=>' '.repeat(m.length));
  const result=[];
  const paintOption=/(?:\b(?:fill|shading)\s*=|(?<!dash\s)\bpattern\s*=|\b(?:top|bottom|left|right|middle|ball) color\s*=|[\[,{]\s*(?:fill|shade)\s*[,}\]])/;
  const commands=/\\(filldraw|shadedraw|fill|shade|path|draw|pic|node)\b/g;
  let match;
  while((match=commands.exec(code))){
    const end=code.indexOf(';',match.index);if(end<0)continue;
    const text=code.slice(match.index,end+1),command=match[1];
    if(!/^(fill|shade)/.test(command)&&!paintOption.test(text))continue;
    result.push({index:match.index,end:end+1,command,text:String(source).slice(match.index,end+1)});
    commands.lastIndex=end+1;
  }
  // Styles and macros may introduce paint without an explicit drawing command.
  // Such source still needs review; never silently classify it as unshaded.
  const uncovered=code.split('').map((c,i)=>result.some(r=>i>=r.index&&i<r.end)?' ':c).join('');
  if(paintOption.test(uncovered)||/\\(?:pgfusepath|pgfdeclare.*shading)\b/.test(uncovered))result.push({index:-1,end:-1,command:'style',text:'Paint in a style or unsupported PGF command requires explicit review.'});
  return result;
}

export function inspectShadingReview(source,sourceHash,review,occurrence,contextHash) {
  const candidates=shadingCandidates(source);
  if(!candidates.length)return [];
  const fail=reason=>[{kind:'diagram-shading-review',reason}];
  if(!review)return fail('Review each fill: mathematical purpose, demonstrated clarity, or a structural mask/marker.');
  if(review.sourceHash!==sourceHash)return fail('Shading review is stale after a source edit.');
  if(review.status!=='accepted'||!review.evidence?.trim())return fail('Final-size shading review is incomplete.');
  if(occurrence&&!review.occurrences?.includes(occurrence))return fail('This occurrence and its teaching context have not been reviewed.');
  if(contextHash&&review.contextHashes?.[occurrence]!==contextHash)return fail('Shading purpose must be reviewed again after its question or teaching context changes.');
  if(!Array.isArray(review.decisions)||review.decisions.length!==candidates.length)return fail('Every paint candidate requires a decision.');
  for(let i=0;i<candidates.length;i++){
    const d=review.decisions[i];
    if(d.index!==candidates[i].index||!['mathematical','clarity','structural'].includes(d.purpose)||!d.reason?.trim()||/^(?:solid (?:face )?shading|supplied (?:projected )?(?:face|cross-section) fill|distinguish(?:es)? (?:visible )?(?:solid |prism )?faces?)\.?$/i.test(d.reason.trim()))return fail('Retained shading needs a specific purpose for each paint operation.');
    if(d.purpose==='clarity'&&!d.comparison?.trim())return fail('Clarity shading requires an outline-only comparison at final size.');
  }
  return [];
}
