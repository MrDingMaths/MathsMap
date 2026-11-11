// New questions inside a lettered run (11 November 2026). A teacher question can continue its letters over later
// unnumbered blocks (Trigonometric Identities and Equations: 3 a–h, then a block holding "i", then "j"). Such a run
// need not be marked with flow.continuationOf, so joinContinuedRuns does not see it, and the Stage 6 pilot placed
// two new two-part questions between h and i and between i and j: "3 a–h, a, b, i, a, b, j". A new question that
// sits inside a run and was not joined to it moves to just after the run's last block, in its own order.
const rank=l=>typeof l==='string'&&/^([a-z])\1*$/.test(l)?(l.length-1)*26+(l.charCodeAt(0)-97):null;
const practice=b=>b.type==='question'&&!/investigation|review|guided|example|key-ideas|theory/i.test(b.pedagogyRole??'')&&!String(b.id).startsWith('exam');
const flat=list=>list.flatMap(k=>(k.label==null||k.label==='')&&Array.isArray(k.children)?flat(k.children):[k]);
// A block's letters: {first, last, continues}. continues: an unnumbered block (or one labelled by a letter) whose
// first letter is not "a", so it carries on the question before it.
function letters(b){
 if(!practice(b)||!b.content)return null;const root=String(b.content.label??'').trim();
 if(rank(root)!=null)return {first:rank(root),last:rank(root),continues:rank(root)>0};
 const ranks=flat(b.content.children??[]).map(k=>rank(k.label)).filter(r=>r!=null);if(!ranks.length)return null;
 return {first:ranks[0],last:ranks.at(-1),continues:root===''&&ranks[0]>0};
}
// movable(b): a new audit question that may be moved (not a teacher block, not already joined to a run).
const defaultMovable=b=>String(b.id).startsWith('v2-')&&b.type==='question'&&!b.flow?.continuationOf&&!/^[a-z]+$/.test(String(b.content?.label??'').trim());
export function moveOutOfLetteredRuns(section,movable=defaultMovable){
 const blocks=section?.blocks;if(!blocks?.length)return [];const moved=[];
 const joins=(a,c)=>a&&c?.continues&&c.first===a.last+1;
 for(let guard=0;guard<blocks.length;guard++){
  const fixed=blocks.map((b,i)=>({b,i})).filter(({b})=>!movable(b));let done=true;
  for(let k=1;k<fixed.length;k++){if(!joins(letters(fixed[k-1].b),letters(fixed[k].b)))continue;
   // The whole run: from the block it continues to the last fixed block that still continues its letters.
   let end=k;while(end+1<fixed.length&&joins(letters(fixed[end].b),letters(fixed[end+1].b)))end++;
   const from=fixed[k-1].i,to=fixed[end].i,inside=blocks.slice(from+1,to).filter(movable);
   if(!inside.length){k=end;continue;}
   const kept=blocks.slice(from,to+1).filter(b=>!inside.includes(b));blocks.splice(from,to-from+1,...kept,...inside);
   moved.push(...inside.map(b=>b.id));done=false;break;}
  if(done)break;}
 return moved;
}
