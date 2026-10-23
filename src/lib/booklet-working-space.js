import {contentSource} from './document-content.js';
import {arrangementItems} from '../../public/libs/maths-editor/arrangement-model.mjs';

// Authoring-time estimate only: never replace a saved/manual answerSpaceMm on load.
export function estimateWorkedWritingSpace(node, {widthMm=80, responseKind='working', preserveExplicit=true, studentWork, studentDiagrams,responseContext=null}={}) {
  if(node.responseSpace==='scaffold'||['cloze','inline','none'].includes(responseKind))return 0;
  if(preserveExplicit&&node.answerSpaceMm!=null&&Number.isFinite(Number(node.answerSpaceMm)))return Math.max(0,Number(node.answerSpaceMm));
  // Opt-in response-aware pilot: native response cells already own handwriting
  // capacity. Callers must identify a reviewed binding, never infer it from a table.
  if(responseContext?.kind==='table-cell'&&responseContext.providesWritingSpace===true)return 0;
  if(responseContext?.kind==='cloze')return 0;
  if(responseContext?.kind==='short'&&responseContext.expectedAnswer!=null){
    const expected=contentSource(responseContext.expectedAnswer).trim();
    if(expected&&!/\\(?:d?frac|tfrac|begin)|\n/.test(expected)&&!(studentDiagrams??node.answer?.solutionDiagrams??[]).length){
      const capacity=Math.max(1,Math.floor((widthMm-6)/2.2));
      return Math.max(8,Math.ceil(expected.length/capacity)*8+2);
    }
  }
  if(responseKind==='tick-cross')return 6;
  // A reviewed student-work projection excludes teacher explanations and optional
  // solution figures without altering the complete editable worked solution.
  const source=contentSource(studentWork??responseContext?.studentWork??node.answer?.worked).trim();
  const figures=studentDiagrams??(studentWork===undefined?node.answer?.solutionDiagrams??[]:[]);
  if(!source&&!figures.length)throw new Error('Generate/review the worked solution before sizing '+node.id);
  const capacity=Math.max(12,Math.floor(widthMm/2.1));
  // TeX row separators matter even when the complete align* is on one JSON line.
  const rows=source.replace(/\\(?:begin|end)\{[^}]+\}/g,'').replace(/\$+/g,'').split(/\\\\(?:\[[^\]]*\])?|\n+/).filter(s=>s.trim());
  let height=0;
  for(const row of rows){
    // TeX control words end before digits, so compact forms such as \frac12 count.
    const visible=row.replace(/\\(?:dfrac|tfrac|frac)(?![a-zA-Z])/g,'/').replace(/\\[a-zA-Z]+/g,'x').replace(/[{}&_^]/g,'');
    const wraps=Math.max(1,Math.ceil(visible.length/capacity));
    const fractions=(row.match(/\\(?:dfrac|tfrac|frac)(?![a-zA-Z])/g)||[]).length;
    const nested=/\\(?:dfrac|tfrac|frac)\s*\{[^}]*\\(?:dfrac|tfrac|frac)(?![a-zA-Z])/.test(row);
    height+=wraps*(fractions?(nested?11:9):8);
  }
  // A solution figure represents student drawing, not a fixed four-mm surcharge.
  if(figures.length)height+=Math.max(...figures.map(d=>{
    const statedHeight=Number(d.heightMm??d.requiredHeightMm);
    // Explicit student construction dimensions are reviewed requirements. The
    // legacy cap applies only when estimating from a teacher solution figure.
    if(studentDiagrams!==undefined&&Number.isFinite(statedHeight)&&statedHeight>0)return statedHeight;
    return Math.min(65,statedHeight||(/number.?line/i.test(d.id+' '+d.spec?.description)?20:40));
  }));
  return Math.ceil(Math.max(12,height+3)/2)*2;
}

// Teacher-calibrated working space (22 October 2026, user decision): match the
// teacher's final allowances on average. The default for new imports and unreviewed
// booklets, and the floor for tightening and the pagination optimiser.
// Refit by `node paginate/working-space.mjs calibrate`: per response kind a
// least-absolute-deviation line fitted to the teacher's finals on the books where the
// teacher worked on spacing, calibrated = ceil(scale * x + offset). x is the allowance
// recorded at import when there is one (`fromImport`, the closer fit), otherwise the
// node estimate (`fromEstimate`). Kinds without enough rows use the pooled fallback.
// About 38% of working answers get 2 mm or more less than the teacher would give;
// the teacher accepted that. Never under 8 mm, or the handwriting rule for a short
// expected answer where that is larger. Arrangement item heights and part allowances
// are the same value (layoutOverrides.answerSpaces mirrors the saved item), so one
// fit covers both. The data supports no fit for table row heights (78% unchanged);
// they keep the content-sized minimum in booklet-import-spacing.js.
export const WORKING_SPACE_CALIBRATION_20261022 = Object.freeze({
  version: '2026-10-22',
  method: 'least-absolute-deviation',
  floorMm: 8,
  kinds: Object.freeze({
    working: Object.freeze({fromImport: Object.freeze({scale: 0.63, offset: 2}), fromEstimate: Object.freeze({scale: 0.32, offset: 7.5})}),
    short: Object.freeze({fromImport: Object.freeze({scale: 0.22, offset: 6}), fromEstimate: Object.freeze({scale: 0.03, offset: 9.5})}),
    'tick-cross': Object.freeze({fromImport: Object.freeze({scale: 0, offset: -30}), fromEstimate: Object.freeze({scale: 0, offset: -30})}),
  }),
  fallback: Object.freeze({fromImport: Object.freeze({scale: 0.63, offset: 2}), fromEstimate: Object.freeze({scale: 0.35, offset: 6.5})}),
});

export function applyWorkingSpaceFit(fit, estimate, floorMm = 8) {
  return estimate > 0 ? Math.max(floorMm, Math.ceil(fit.scale * estimate + fit.offset - 1e-9)) : 0;
}

// The allowance a response gets by default, and the least tightening may leave it.
// Takes the options of estimateWorkedWritingSpace (any stored value is ignored) plus
// `importMm`, the allowance recorded when the booklet was imported
// (sourceReview.workingSpaceEstimate). Responses that own no writing space (cloze,
// inline, scaffold, native table cells) stay 0.
export function calibratedWorkingSpace(node, opts = {}, calibration = WORKING_SPACE_CALIBRATION_20261022) {
  const {importMm, ...estimateOptions} = opts;
  // An explicit imported zero is a response contract (for example a native
  // table supplies all cells), not missing estimation data. Deterministic
  // calibration must not invent an extra external writing area from its key.
  if(importMm===0&&node.answerSpaceMm===0)return 0;
  const kind = estimateOptions.responseKind ?? 'working';
  const estimate = estimateWorkedWritingSpace(node, {...estimateOptions, preserveExplicit: false});
  if (!(estimate > 0)) return 0;
  const fits = calibration.kinds[kind] ?? calibration.fallback;
  const fromImport = Number.isFinite(importMm) && importMm > 0;
  const value = applyWorkingSpaceFit(fromImport ? fits.fromImport : fits.fromEstimate, fromImport ? importMm : estimate, calibration.floorMm);
  // A short expected answer keeps the handwriting capacity the estimator derived for it.
  return kind === 'short' ? Math.max(value, estimate) : value;
}

// The allowance recorded for a part when its block was imported, if any.
export const importedAllowance = (block, targetId) => block?.sourceReview?.workingSpaceEstimate?.estimates?.find(e => e.targetId === targetId)?.answerSpaceMm;

// Every stored copy of a part's allowance: the part's answerSpaceMm, layoutOverrides.answerSpaces[id] and the
// height of a saved arrangement's space item. [[where, mm], ...], finite values only.
export function allowanceCopies(project, block, node) {
  const o = project?.settings?.layoutOverrides ?? {};
  const layout = o.blockLayouts?.[block.id]?.arrangement;
  const items = layout ? arrangementItems(layout.root).filter(item => item.ref === node.id + '/space' && Number.isFinite(item.height)) : [];
  return [['answerSpaceMm', node.answerSpaceMm], ['answerSpaces', o.answerSpaces?.[node.id]], ...items.map((item, i) => ['item' + i, item.height])].filter(([, v]) => Number.isFinite(v));
}
// True when the part has a recorded import value and every stored copy still equals it (the 17 October rule:
// a value that was changed since import belongs to the teacher or a repair and is left alone).
export const stillImportAllowance = (copies, importMm) => Number.isFinite(importMm) && copies.length > 0 && copies.every(([, v]) => Math.abs(v - importMm) < 0.01);

// The one floor Studio's Tighten and the pagination optimiser share (22 October 2026). A teacher-reviewed
// booklet (`reviewed`) keeps the estimator floor Tighten always used, so named tightening there is no deeper
// than before; an unreviewed booklet gets the calibrated floor, with the width and table-cell context
// recorded at import. Returns 0 for responses that own no writing space; throws as the estimators do.
export function workingSpaceFloor(block, node, {reviewed = false, widthMm} = {}) {
  if (reviewed) return estimateWorkedWritingSpace(node, {preserveExplicit: false, ...(widthMm ? {widthMm} : {})});
  const kind = block?.sourceReview?.responses?.find(r => r.targetId === node.id)?.kind ?? 'working';
  const width = widthMm ?? block?.sourceReview?.workingSpaceEstimate?.estimates?.find(e => e.targetId === node.id)?.widthMm;
  const binding = block?.sourceReview?.tableResponses?.find(r => r.targetId === node.id);
  return calibratedWorkingSpace(node, {responseKind: kind, importMm: importedAllowance(block, node.id), ...(width ? {widthMm: width} : {}), responseContext: binding ? {kind: 'table-cell', providesWritingSpace: true} : {kind, expectedAnswer: node.answer?.short}});
}

export function sizeQuestionWorking(node,{widthMm=170,responseKinds={},records=[],preserveExplicit=true,studentWorkById={},studentDiagramsById={}}={}) {
  const children=node.children??[];
  if(children.length){
    const columns=node.layout==='grid'?Math.max(1,Number(node.columns)||1):1;
    children.forEach(child=>sizeQuestionWorking(child,{widthMm:(widthMm-(columns-1)*6)/columns-6,responseKinds,records,preserveExplicit,studentWorkById,studentDiagramsById}));
  }else if(node.answer){
    const before=node.answerSpaceMm;
    node.answerSpaceMm=estimateWorkedWritingSpace(node,{widthMm,responseKind:responseKinds[node.id]??'working',preserveExplicit,studentWork:studentWorkById[node.id],studentDiagrams:studentDiagramsById[node.id]});
    records.push({id:node.id,widthMm,before,after:node.answerSpaceMm});
  }
  return records;
}
