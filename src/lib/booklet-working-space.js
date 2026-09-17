import {contentSource} from './document-content.js';

// Authoring-time estimate only: never replace a saved/manual answerSpaceMm on load.
export function estimateWorkedWritingSpace(node, {widthMm=80, responseKind='working', preserveExplicit=true}={}) {
  if(node.responseSpace==='scaffold'||['cloze','inline','none'].includes(responseKind))return 0;
  if(preserveExplicit&&node.answerSpaceMm!=null&&Number.isFinite(Number(node.answerSpaceMm)))return Math.max(0,Number(node.answerSpaceMm));
  if(responseKind==='tick-cross')return 6;
  const source=contentSource(node.answer?.worked).trim();
  if(!source)throw new Error('Generate/review the worked solution before sizing '+node.id);
  const capacity=Math.max(12,Math.floor(widthMm/2.1));
  // TeX row separators matter even when the complete align* is on one JSON line.
  const rows=source.replace(/\\(?:begin|end)\{[^}]+\}/g,'').replace(/\$+/g,'').split(/\\\\(?:\[[^\]]*\])?|\n+/).filter(s=>s.trim());
  let height=0;
  for(const row of rows){
    const visible=row.replace(/\\(?:dfrac|tfrac|frac)/g,'/').replace(/\\[a-zA-Z]+/g,'x').replace(/[{}&_^]/g,'');
    const wraps=Math.max(1,Math.ceil(visible.length/capacity));
    const fractions=(row.match(/\\(?:dfrac|tfrac|frac)\b/g)||[]).length;
    const nested=/\\(?:dfrac|tfrac|frac)\s*\{[^}]*\\(?:dfrac|tfrac|frac)/.test(row);
    height+=wraps*(fractions?(nested?11:9):7);
  }
  // A solution figure represents student drawing, not a fixed four-mm surcharge.
  const figures=node.answer?.solutionDiagrams??[];
  if(figures.length)height+=Math.max(...figures.map(d=>Math.min(65,Number(d.heightMm)||(/number.?line/i.test(d.id+' '+d.spec?.description)?20:40))));
  return Math.ceil(Math.max(12,height+3)/2)*2;
}

export function sizeQuestionWorking(node,{widthMm=170,responseKinds={},records=[],preserveExplicit=true}={}) {
  const children=node.children??[];
  if(children.length){
    const columns=node.layout==='grid'?Math.max(1,Number(node.columns)||1):1;
    children.forEach(child=>sizeQuestionWorking(child,{widthMm:(widthMm-(columns-1)*6)/columns-6,responseKinds,records,preserveExplicit}));
  }else if(node.answer){
    const before=node.answerSpaceMm;
    node.answerSpaceMm=estimateWorkedWritingSpace(node,{widthMm,responseKind:responseKinds[node.id]??'working',preserveExplicit});
    records.push({id:node.id,widthMm,before,after:node.answerSpaceMm});
  }
  return records;
}
