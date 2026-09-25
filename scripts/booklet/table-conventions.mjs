import {answerDiagramSignature} from '../../src/lib/booklet-exercises.js';
// Reviewed native table semantics from the 17 September 2026 active-book audit.
// Explicit IDs keep raw observations, teaching layouts and unrelated new tables untouched.
const rules=(header,centre,ids)=>Object.fromEntries(ids.split(/\s+/).filter(Boolean).map(id=>[id,{header,centre}]));
export const REVIEWED_TABLES = {
  "angle-relationships-v1": {
    ...rules("row",false,`p18-q4-table`),
  },
  "data-visualisation-1-v1": {
    ...rules("row",true,`p3-example-table p3-household-frequency-table p3-numerical-model-table p4-q1-a-scaffold p4-q1-b-scaffold p4-q2-scaffold p4-q2-table p4-q3-scaffold p4-q3-table p5-q5-table p6-q7-table p6-q8-table p6-q9-beth-table p6-q9-sven-table p7-q12-table p7-q13-left-table p7-q13-right-table p8-worked-data-table p8-guided-data-table p9-q3-data-table p10-height-table p10-colour-frequency-table p11-q1-table p11-q2-table p12-q5-table-a p12-q5-table-b p12-q5-table-c p12-q5-table-d p16-worked-table p16-your-turn-table p22-q1-a-table p22-q1-b-table p24-q7-a-frequency-table p24-q7-a-answer-table p29-q11-frequency-table p36-q9-data p37-q12-b-table p43-worked-table p43-your-turn-table p44-q1-table p44-q2-table p45-q4-table p45-q6-table p45-q6-table-answers p46-example-table p46-a-table p47-example-table p47-practice-table p48-q1-a-table p48-q1-b-table p48-q2-a-table p48-q2-b-table p49-q3-table p49-q4-table p49-q5-a-table p49-q5-b-table p50-c-table p50-d-table p50-q6-a-table p50-q6-b-table p50-q6-c-table p55-q6-table`),
    ...rules("column",true,`p5-q4-table p5-q6-table p7-q11-table p17-q1-a-table p17-q1-b-table p18-q3-table p19-q7-table p30-q13-table p51-sales-table p54-q3-table`),
    ...rules("row",false,`p51-purpose-table`),
  },
  "logarithms-v1": {
    ...rules("column",false,`p3-powers-table p4-table-1 p4-table-2 p4-table-3 p4-table-4 p9-q8-a-table p11-laws-table p35-q4-table p37-exp-values p37-log-values p40-q1-a-table p40-q2-a-table`),
    ...rules("row",false,`p21-example-method-table p27-q22-table`),
  },
  "probability-v1": {
    ...rules("row",false,`p12-q8-table p38-q8-table`),
    ...rules("row",true,`p18-q29-table p22-q6-table p26-q7-a-table p26-q7-b-table p26-q8-table p27-q10-table p28-q13-table p28-q15-table p29-q17-table p29-q18-table p29-q19-table p38-q11-a-table p38-q11-b-table p38-q11-c-table p38-q11-d-table p40-q20-table p41-q22-table p42-q26-table p42-q27-table`),
    ...rules("column",true,`p24-q3-table p24-q4-table p25-q5-table p38-q10-table p39-q13-table p39-q14-table p40-q19-table p41-q24-a-table p41-q24-b-table p41-q24-c-table p41-q24-d-table`),
  },
  "project-ac094b6d-f3e7-45ac-b585-6092b8d15f58": {
    ...rules("row",false,`p3-guided-a-front-response-table p3-guided-a-back-response-table p3-guided-a-side-response-table p3-guided-a-top-response-table p3-guided-b-front-response-table p3-guided-b-back-response-table p3-guided-b-side-response-table p3-guided-b-top-response-table p4-q1-a-front-response-table p4-q1-a-back-response-table p4-q1-a-side-response-table p4-q1-a-top-response-table p4-q1-b-front-response-table p4-q1-b-back-response-table p4-q1-b-side-response-table p4-q1-b-top-response-table p4-q1-c-front-response-table p4-q1-c-back-response-table p4-q1-c-side-response-table p4-q1-c-top-response-table p4-q1-d-front-response-table p4-q1-d-back-response-table p4-q1-d-side-response-table p4-q1-d-top-response-table p5-e-front-response-table p5-e-back-response-table p5-e-side-response-table p5-e-top-response-table p5-f-front-response-table p5-f-back-response-table p5-f-side-response-table p5-f-top-response-table p5-g-front-response-table p5-g-back-response-table p5-g-side-response-table p5-g-top-response-table p5-h-front-response-table p5-h-back-response-table p5-h-side-response-table p5-h-top-response-table p11-guided-table-headings`),
  },
  "volume-v1": {
    ...rules("row",false,`p3-guided-a-front-response-table p3-guided-a-back-response-table p3-guided-a-side-response-table p3-guided-a-top-response-table p3-guided-b-front-response-table p3-guided-b-back-response-table p3-guided-b-side-response-table p3-guided-b-top-response-table p4-q1-a-front-response-table p4-q1-a-back-response-table p4-q1-a-side-response-table p4-q1-a-top-response-table p4-q1-b-front-response-table p4-q1-b-back-response-table p4-q1-b-side-response-table p4-q1-b-top-response-table p4-q1-c-front-response-table p4-q1-c-back-response-table p4-q1-c-side-response-table p4-q1-c-top-response-table p4-q1-d-front-response-table p4-q1-d-back-response-table p4-q1-d-side-response-table p4-q1-d-top-response-table p5-e-front-response-table p5-e-back-response-table p5-e-side-response-table p5-e-top-response-table p5-f-front-response-table p5-f-back-response-table p5-f-side-response-table p5-f-top-response-table p5-g-front-response-table p5-g-back-response-table p5-g-side-response-table p5-g-top-response-table p5-h-front-response-table p5-h-back-response-table p5-h-side-response-table p5-h-top-response-table p11-guided-table-headings`),
  },
};

const nonContent=/^(source.*|.*Evidence|original.*|history|snapshot|baseline|edits)$/i;
const hasLabel=cell=>(cell.blocks??[]).some(block=>(block.inlines??[]).some(value=>String(value.text??value.latex??'').trim()));

/** Pure, scoped migration. Publication and revision/bank transactions belong to the caller. */
export function repairStatisticalTableContent(input) {
  const project=structuredClone(input), reviewed=REVIEWED_TABLES[project.id]??{};
  const report={tables:[],diagrams:[],preserved:[]};
  function walk(value,path) {
    if(!value||typeof value!=='object')return;
    if(project.id==='linear-relationships-v1'&&value.type==='table'&&value.rows?.length===2){
      const cellLabel=cell=>(cell?.blocks??[]).flatMap(block=>block.inlines??[]).map(inline=>inline.latex??inline.text??'').join('').replace(/\\(?:boldsymbol|mathbf|textbf)\{([^{}]*)\}/g,'$1').trim();
      const labels=value.rows.map(row=>cellLabel(row[0]));
      const variableColumns=value.rows[0].map((cell,c)=>cellLabel(cell)==='x'&&cellLabel(value.rows[1][c])==='y'?c:-1).filter(c=>c>=0);
      const quantityPairs=new Set(['Number of shapes|Number of matches','Number of shapes x|Number of matches y','Number of tables|Number of chairs','Pentagons x|Matches y','Squares x|Matches y','Term x|Value y','Independent variable x|Dependent variable y','Distance travelled x|Cost y','Distance (km) x|Cost (dollars) y','Mass (kg) x|Cost (dollars) y','Time (h) x|Cost (dollars) y','Time (h) x|Fuel (L) y','x Time (min)|y Height (cm)','x Time (hr)|y Volume (L)','Week|Total amount saved','Hours|Job price']);
      if(variableColumns.length||quantityPairs.has(labels.join('|'))){
        const columns=[...new Set([...variableColumns,...(quantityPairs.has(labels.join('|'))?[0]:[])])];
        let headers=0;
        for(const row of value.rows)row.forEach((cell,c)=>{if(Boolean(cell.header)!==columns.includes(c)){cell.header=columns.includes(c);headers++;}});
        if(headers)report.tables.push({id:value.id,path,headers,centred:0,reason:'x/y row labels'});
      }
    }
    // These borderless one-column structures are body rows of the reviewed
    // Colour obtained/Frequency table, not independent layout or raw-data tables.
    if(project.id==='probability-v1'&&value.id==='p29-q19-colours-aligned-rows'&&value.type==='table'){
      let centred=0;
      for(const cell of value.rows.flat())if(!cell.preserveParagraphAlignment&&cell.align!=='center'){cell.align='center';centred++;}
      if(centred)report.tables.push({id:value.id,path,headers:0,centred});
    }
    const rule=value.type==='table'?reviewed[value.id]:null;
    if(rule&&value.border!==false&&value.border!==0&&Array.isArray(value.rows)) {
      let headers=0,centred=0,widthChanged=false;
      if(project.id==='probability-v1'&&value.id==='p22-q6-table'&&value.widths?.length===3&&value.widthMm) {
        const total=value.widths.reduce((sum,width)=>sum+width,0),actual=value.widths.map(width=>value.widthMm*width/total);
        // Keep Outcome unchanged; borrow only from the long, naturally wrapping
        // expected-frequency heading so the word Probability stays intact.
        if(actual[1]<31-.01){const extra=31-actual[1];value.widths=[actual[0],31,actual[2]-extra];widthChanged=true;}
      }
      // These source tables need more room for their now-bold row labels.
      // Redistribute within the existing overall width; keep the 10 pt type size.
      const labelMinimum=project.id==='probability-v1'?({'p24-q4-table':44,'p25-q5-table':49,'p40-q19-table':31,'p41-q24-a-table':26,'p41-q24-b-table':26,'p41-q24-c-table':26,'p41-q24-d-table':26}[value.id]):project.id==='data-visualisation-1-v1'&&value.id==='p30-q13-table'?27:null;
      if(labelMinimum&&value.widths?.length>1&&value.widthMm) {
        const total=value.widths.reduce((sum,width)=>sum+width,0),labelWidth=value.widthMm*value.widths[0]/total;
        if(labelWidth<labelMinimum-.01) {
          const rest=total-value.widths[0],available=value.widthMm-labelMinimum;
          value.widths=[labelMinimum,...value.widths.slice(1).map(width=>width/rest*available)];
          widthChanged=true;
        }
        if(value.id==='p25-q5-table'&&(value.padding==null||value.padding>1)){value.padding=1;widthChanged=true;}
      }
      value.rows.forEach((row,r)=>row.forEach((cell,c)=>{
        const rowHeading=project.id==='data-visualisation-1-v1'&&value.id==='p9-q3-data-table'&&c===0;
        if(((rule.header==='row'?r===0:c===0)||rowHeading)&&hasLabel(cell)&&!cell.header){cell.header=true;headers++;}
        if(rule.centre&&cell.align!=='center') {
          // Authored left/right defaults are not local exceptions; an explicit
          // paragraph arrangement is, as are the reviewed prose-table exclusions.
          if(cell.preserveParagraphAlignment)report.preserved.push({table:value.id,cell:cell.id,reason:'explicit local alignment'});
          else {cell.align='center';centred++;}
        }
      }));
      if(headers||centred||widthChanged)report.tables.push({id:value.id,path,headers,centred,...(widthChanged?{widthChanged:true}:{})});
    }
    if(typeof value.code==='string') {
      const before=value.code;
      const beforeSignature=answerDiagramSignature(value);
      if(project.id==='data-visualisation-1-v1'){
        // Literal stem/leaf and ordering labels identify headed statistical
        // diagrams in both question and answer fields. Do not touch data nodes.
        value.code=value.code.replace(/(\\node(?:\[[^\]]*\])?\s+at\s*\([^;]*?\)\s*)\{(Stem|Leaf|Tens|Units|RAW|ORDERED)\};/g,
          (whole,prefix,label)=>/\\bfseries/.test(prefix)?whole:`${prefix}{\\textbf{${label}}};`);
        if(value.id==='p30-q13-a-solution-plot')value.code=value.code.replace(/\{(Melbourne|Adelaide)\};/g,(_,label)=>`{\\textbf{${label}}};`);
        if(value.id==='p9-q3-supplied-pictogram'){
          value.code=value.code.replace(String.raw`{People\\on bus};`,String.raw`{\textbf{People}\\\textbf{on bus}};`);
          value.code=value.code.replace(String.raw`\node[anchor=west] at (1,{-8*\row-8}) {\name};`,String.raw`\node[anchor=center] at (12.5,{-8*\row-8}) {\textbf{\name}};`);
        }
      }
      if(project.id==='data-visualisation-1-v1'&&['p8-worked-pictogram-native','p8-guided-frame','p8-guided-solution-native'].includes(value.id)) {
        // Header/category nodes only: symbol origins, fractional symbols and the key stay intact.
        value.code=value.code.replace(/\\node at \((12\.5|57),4\)\{(Month|Sunny days|Name|Goals)\};/g,
          (_,x,label)=>`\\node[anchor=center] at (${x},4){\\textbf{${label}}};`);
        value.code=value.code.replace(/\\node\[anchor=west\] at \(1,(-6|-18|-30)\)\{(January|February|March|Kat|Sophie|Ava)\};/g,
          (_,y,label)=>`\\node[anchor=center] at (12.5,${y}){${label}};`);
      }
      if(project.id==='data-visualisation-1-v1'&&['p4-q1-a-table','p4-q1-b-table'].includes(value.id)) {
        for(const label of ['Score','Tally','Frequency'])value.code=value.code.replace(`{${label}};`,`{\\textbf{${label}}};`);
      }
      if(project.id==='probability-v1'&&value.id==='p30-q20-table') {
        for(const [label,y] of [['Number','10.5'],['Frequency','3.5']]) {
          value.code=value.code.replace(`\\node[anchor=west] at (2,${y}) {${label}};`,`\\node at (15.5,${y}) {\\textbf{${label}}};`);
        }
      }
      if(project.id==='probability-v1'&&value.id==='p30-q21-table') {
        for(const label of ['Number obtained','Frequency'])value.code=value.code.replace(`{\\textit{${label}}};`,`{\\textbf{\\textit{${label}}}};`);
      }
      if(value.code!==before){
        const refreshedModes=[];
        for(const mode of ['short','worked']){
          const style=project.settings?.compactAnswers?.diagramStyles?.[mode]?.[value.id];
          if(style?.sourceSignature===beforeSignature){style.sourceSignature=answerDiagramSignature(value);refreshedModes.push(mode);}
        }
        report.diagrams.push({id:value.id,path,reason:'bold statistical header; centre row labels where applicable',refreshedModes});
      }
    }
    for(const[key,child]of Object.entries(value))if(!nonContent.test(key))walk(child,`${path}/${key}`);
  }
  walk(project.sections,'/sections');
  return {project,report};
}
