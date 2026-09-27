// Intended path: tests/fixtures/booklets/table-baseline.mjs
// Small representative native rows: callout, separate equality, and result box.
export const equationCellIds=[['callout-label','callout-fraction'],['plain-label','plain-equals','plain-fraction'],['result-label','result-fraction','result-equals','result-box']];
const math=(id,latex)=>({id:id+'-paragraph',type:'paragraph',align:'left',spaceBefore:0,spaceAfter:0,inlines:[{type:'math',latex,display:false}]});
const cell=(id,latex,verticalAlign)=>({id,type:'cell',align:'left',verticalAlign,blocks:[math(id,latex)]});
const fraction=(height,width)=>String.raw`\dfrac{\boxed{\rule{0pt}{${height}mm}\hspace{${width}mm}}+1}{2}`;
export function tableBaselineFixture(alignment='baseline'){
 const table=(id,widths,row)=>({id,type:'table',border:false,padding:0,widthMm:widths.reduce((a,b)=>a+b,0),widths,rowHeights:[18],marginBefore:5,marginAfter:5,rows:[row]});
 const callout=table('callout-table',[20,26,24],[cell('callout-label',String.raw`\text{Position}`,alignment),cell('callout-fraction','='+fraction(6,11),alignment),cell('callout-note',String.raw`\boxed{\begin{gathered}\text{Count the}\\\text{scores}\end{gathered}}`,'middle')]);
 callout.annotations=[{id:'count-arrow',type:'arrow',cellId:'callout-note',toCellId:'callout-fraction',side:'top',colour:'#000000',startAnchor:'math-box',endAnchor:'math-box',distanceMm:0,curveMm:4}];
 const plain=table('plain-table',[20,7,26],[{id:'plain-label',type:'cell',align:'left',verticalAlign:alignment,blocks:[{id:'plain-label-paragraph',type:'paragraph',spaceBefore:0,spaceAfter:0,inlines:[{type:'text',text:'Position'}]}]},cell('plain-equals','=',alignment),cell('plain-fraction',fraction(4,11),alignment)]);
 const result=table('result-table',[25,30,7,30],[cell('result-label',String.raw`\text{Position}=`,alignment),cell('result-fraction',fraction(5,9),alignment),cell('result-equals','=',alignment),cell('result-box',String.raw`\boxed{\rule{0pt}{5mm}\hspace{6mm}}\begin{array}{l}\scriptstyle\mathrm{th}\\[-2pt]\text{score.}\end{array}`,alignment)]);
 return{format:'maths-editor-document-v1',version:1,blocks:[callout,plain,result]};
}
