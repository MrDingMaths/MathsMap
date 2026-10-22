import { BOOKLET_HOUSE_STYLE, houseStyleVariables, clozeWidthMm, clozeLayout, HOUSE_STYLE_PROMPT } from '../../public/libs/maths-editor/house-style.mjs';
import {styleGraph,graphTikz} from './graph-model.js';
import {styleManualGraphStrokes} from './graph-stroke-source.js';
import { isDocument } from './document-content.js';
export { BOOKLET_HOUSE_STYLE, houseStyleVariables, clozeWidthMm, HOUSE_STYLE_PROMPT };

// Teaching-block scale (22 October 2026, user approved). For theory, worked examples, scaffolds
// and guided practice the source decides structure and this scale decides every measurement:
// vertical gaps snap to 1, 2 or 4 mm (within a group 1 mm; between groups 2 or 4 mm by the
// rank of the source gap), each relative indent level is one 4 mm step, and columns are
// aligned to the same 1.5 mm the checks compare with. Arrowheads, widths, palette, cloze width
// and fraction boxes stay with BOOKLET_HOUSE_STYLE and IMPORT_SPACING; house rules win.
export const TEACHING_SCALE = Object.freeze({
  gapsMm: Object.freeze([1, 2, 4]),
  withinGroupMm: 1,
  betweenGroupMm: Object.freeze([2, 4]),
  indentStepMm: 4,
  maxIndentLevels: 3,
  alignToleranceMm: 1.5,
  columnCounts: Object.freeze({ min: 2, max: 5 }),
});

// Explicit adoption is a normal project transaction; loading never restyles content.
export function adoptHouseStyle(project) {
  const next=JSON.parse(JSON.stringify(project));
  const {colours,tables}=BOOKLET_HOUSE_STYLE;
  const walk=(value,keyIdeas=false)=>{
    if(!value||typeof value!=='object')return;
    keyIdeas ||= value.variant==='key-ideas'||value.sourceAtom?.kind==='key-ideas';
    if(value.format==='tikz'&&value.mathematicalModel){value.mathematicalModel=styleGraph(value.mathematicalModel,value.widthMm??65);value.code=graphTikz(value.mathematicalModel);}
    else if(value.format==='tikz'&&value.code?.includes('\\end{tikzpicture}'))value.code=styleManualGraphStrokes(value.code).code;
    if(isDocument(value)){
      const format=node=>{
        if(node.type==='paragraph'&&keyIdeas)node.lineHeight=1.5;
        if(node.type==='cloze'){
          const expected=node.expectedResponse||node.answer;
          if(expected){Object.assign(node,clozeLayout(expected));node.expectedResponse=expected;}
          else node.reviewStatus='needs-review';
        }
        if(node.type==='table'){
          if(!node.borderColour||['#a9b7c6','#2f4058','#000000','#d9d9d9','#cccccc'].includes(node.borderColour.toLowerCase()))node.borderColour=colours.border;
          if(node.borderWidthMm==null||node.borderWidthMm===.26)node.borderWidthMm=tables.borderMm;
          for(const row of node.rows??[])for(const cell of row){
            if(/^#(?:d3e8fc|d6eaff|d6e6ff|ddebf7|dae8fc|fce4d6|fbe2d5|fce5cd|f8cbad|fff2cc)$/i.test(cell.background??''))cell.background=colours.tableLabel;
          }
        }
        for(const child of Object.values(node))if(child&&typeof child==='object')Array.isArray(child)?child.forEach(x=>x&&typeof x==='object'&&(Array.isArray(x)?x.forEach(format):format(x))):format(child);
      };
      value.blocks.forEach(format);return;
    }
    for(const [key,child] of Object.entries(value))if(!['sourceAtom','spec','originalDiagram'].includes(key)&&child&&typeof child==='object')Array.isArray(child)?child.forEach(item=>walk(item,keyIdeas)):walk(child,keyIdeas);
  };
  walk(next.sections);
  next.settings={...next.settings,houseStyleVersion:BOOKLET_HOUSE_STYLE.version};
  return next;
}
