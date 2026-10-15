// Opt-in authoring preferences (4 October 2026): preset arrangements, templated
// diagram families and standard avatars. Canonical packets retain ordinary TikZ
// strings and image blocks; recorded runs without the option are unchanged.
import {templateDiagram,DIAGRAM_TEMPLATE_FAMILIES} from '../../src/lib/diagram-templates.js';
import {avatarBlocks,avatarSrc,AVATAR_WIDTH_MM} from '../../src/lib/booklet-avatars.js';
import {visitAuthorContent,materializeAuthorDiagrams,SHARED_DIAGRAM_FORMAT} from './shared-diagram-authoring.mjs';
import {importStructureFindings} from '../../src/lib/booklet-import-structure.js';

export const HOUSE_AUTHORING='house-presets-v1';
const has=(object,key)=>Object.prototype.hasOwnProperty.call(object,key);

export const HOUSE_AUTHORING_PROMPT=String.raw`HOUSE AUTHORING PREFERENCES (house-presets-v1). These take precedence over earlier wording about preserving source arrangements, source diagram dimensions and source portraits. Source appearance is evidence, not a layout target: reproduce content, order, mathematical structure and meaningful relationships, and apply house style to everything else.

FRACTION COMPONENTS (14 October 2026). Missing numerators and denominators use outlined native maths boxes, for example \frac{\boxed{\rule{0pt}{5mm}\hspace{8mm}}}{12}, with widths sized for the actual numerical, algebraic or formula response. Preserve wider existing handwriting capacity. This overrides dotted-cloze defaults only inside missing fraction components; complete-fraction response spaces retain the ordinary convention. Keep source evidence, supplied values and ordinary ellipses. Do not migrate accepted content automatically on load.

DEPENDENT FOLLOW-UPS. Before questions can enter the bank, every whole question must carry its own mathematical givens and shared task. Append a follow-up that requires the preceding question as its next part where possible, including authored pedagogy extensions. Preserve both answers, source identities, meaningful instruction groups and handwriting space, and continue one part-label sequence across those groups. References to a preceding method alone do not require merging when all givens are already present. Inspect adjacent tasks for implicit shared context as well as explicit previous-question wording; wording matches alone never authorise a merge.

HEADERS AND TABLES. Use sentence case for displayed section, theory-box and table headers, retaining proper names, acronyms and syllabus codes in their original case. Keep original source headings in evidence. Opening syllabus content is one unboxed rich-text block beneath the Syllabus content section header; never a theory box. Do not put an inner card or one-column bordered table around prose or formulas already inside a teaching box. Keep genuine data/comparison tables as one native editable table: grouped headings, merged cells and all data rows belong together, with stable answer-owning leaves bound to its responses. Never split its heading and rows into separate tables or cards. Use house blue label cells and grey borders; retain colour only where it carries mathematical meaning. Ambiguous one-column tables need review for a mathematical or response purpose. Add new teaching activities only when explicitly requested.

PRESET ARRANGEMENTS. Use the default semantic layout for teaching and practice content; do not write a custom arrangement tree to imitate source spacing. The presets are: (1) stacked parts: omit layout; (2) parts in equal columns: layout:"grid" with columns from 2 to 5 (use the source column count, including five-across demonstration strips) and children in reading order (rows fill left to right, so parts in one row share a top edge); (3) diagram above the prompt: diagramPlacement:"before-prompt"; (4) diagram after the prompt: omit diagramPlacement; (5) diagram left of the prompt and parts: diagramPlacement:"beside-prompt"; (6) diagram right of them: diagramPlacement:"right-of-prompt"; (7) paired Worked Example | Your Turn rows: ONE question block for the whole activity, whose root group has label:"", a prompt holding one native 1-row, 2-cell heading table ("Worked Example", "Your Turn"), layout:"grid", columns:2 and children alternating worked part, your-turn part for each source row. Each worked part has label:"", its instruction and permanent blue working in its prompt and answerSpaceMm:0; each your-turn part has label:"", its instruction and given in its prompt, the estimated answerSpaceMm and its answer. Add sourceReview.responses entries with label:"" for every part when the source prints no part letters. The heading table has border:false, marginBefore:0.5 and marginAfter:0.5; each heading cell has paddingTop:0.75 and paddingBottom:0.75, keeping normal horizontal padding. Do not set a minimum heading row height. This user-directed spacing leaves breathing room without stacking full table margins and vertical padding. Nothing in this layout draws a box or rule. Where a worked example's working follows from its given equation, write them as ONE centred display aligned block whose first row is the given in ordinary ink (\\color{#24282d} in each of its cells) and whose later rows are the blue working, so every relation sign lines up as in the source; a your-turn given stays a centred equation. Lines that do not follow from the previous line, such as separately labelled calculations, are independent: keep them as separate left-aligned lines and do not align them as a chain. Never build a row from one-cell bordered tables, a block per row, or a separate heading block: those cannot share row heights or break between rows. When the source prints parts down columns, keep the source labels and reading order and use the row grid. A custom arrangement is allowed only where position carries mathematical or instructional meaning: paired figures that must be compared, a matching activity, card placement, or a diagram that specific working must sit beside. For each one add sourceReview.customArrangement:{reason} naming that meaning; "matches the source" is not a reason. Keep every instruction, label, given and response; presets keep the per-part answerSpaceMm estimate.

TEMPLATED DIAGRAMS. For these families return diagramTemplate INSTEAD of code, keeping id, role, spec and source references. The caller generates the TikZ and width; proportions follow the template, not the source. Reproduce mathematical content exactly.
- {family:"number-line",min,max,step,minorStep?,labels:"all"|"ends"|"none"|[{value,tex}],points?:[{value,style:"closed"|"open",label?}],jumps?:[{from,to,label?}],arrows?:"both"|"right"|"none",lengthMm?}. tex and label are TeX mathematics without dollar signs, for example "\\frac{2}{6}" or "-3". Label only the ticks the source labels.
- {family:"fraction-grid",rows?,cols,shaded?:count|[[row,col]],fillOrder?:"rows"|"columns",shadeReason} for one bar or rectangle, or {family:"fraction-grid",models:[{rows?,cols,shaded?}],separators?:["+"],shadeReason} for a row of models. Cells are zero-based from the top-left. shadeReason states what the shading represents and is required whenever anything is shaded; a model the student shades has no shaded value.
- {family:"fraction-circle",sectors,shaded?:count|[index],radiusMm?,shadeReason} or models/separators as above. Sectors are zero-based, clockwise from the top.
- {family:"blank-grid",rows,cols,cellMm?} for a square grid students draw on.
Use ordinary complete TikZ code for every other diagram, and for a diagram in these families when the template cannot express a mathematical feature of the source (for example crossed-out parts, labelled segments or unequal parts); say which feature in spec.description.

DECORATIVE IMAGES AND AVATARS. Omit mascots and illustrations with no instructional or mathematical content; keep every word they say or label as editable text and map their inventory entry with an explicit exclusion. Keep any image a question depends on. A character who speaks uses the speech-bubble layout whose first slot holds {id,type:"image",avatar:"CHARACTER NAME",alt:"CHARACTER NAME"}: give the printed name, or a stable description such as "Student 1" when unnamed, and the same value for every appearance of that character. Do not supply src, crop or source portrait assets; the caller assigns the standard avatar. Keep the name in the statement where the source prints it. Difficulty pictograms beside a question number (chillies, stars) are never content: leave them out of prompts, answers and diagrams, and record their count against the inventory entry as source evidence only. Studio shows its own chillies from the reasoning score.`;

// Replaces diagramTemplate with generated code and gives avatar blocks a valid
// provisional image; assembly assigns the booklet-wide rotation.
export function materializeHouseAuthoring(packet,{enabled=false}={}) {
 if(!packet||typeof packet!=='object')return packet;
 let used=false;
 visitAuthorContent(packet.sections,node=>{if(has(node,'diagramTemplate')||node.type==='image'&&has(node,'avatar'))used=true;});
 const structure=enabled?importStructureFindings(packet):[],errors=structure.filter(f=>f.severity==='error');
 if(errors.length)throw Error('House authoring structure: '+errors.map(f=>f.blockId+': '+f.note).join('; '));
 const warnings=structure.filter(f=>f.severity==='review');
 const checked=warnings.length?{...packet,findings:[...(packet.findings??[]),...warnings]}:packet;
 if(!used)return checked;
 if(!enabled)throw Error('diagramTemplate and avatar authoring require config.authoringPreferences');
 const result=structuredClone(checked);
 visitAuthorContent(result.sections,node=>{
  if(!has(node,'diagramTemplate'))return;
  if(has(node,'code')||has(node,'codeParts')||!node.id)throw Error('diagramTemplate requires a uniquely identified diagram without code');
  if(node.overlayOf||node.role==='solution-overlay')throw Error('A templated diagram is a complete figure, not an overlay: '+node.id);
  if(!DIAGRAM_TEMPLATE_FAMILIES.includes(node.diagramTemplate?.family))throw Error('Unsupported diagram template family for '+node.id);
  let built;
  try{built=templateDiagram(node.id,node.diagramTemplate);}catch(error){throw Error(`Diagram template ${node.id}: ${error.message}`);}
  node.format='tikz';node.code=built.code;node.widthMm??=built.widthMm;
  node.spec={...(node.spec&&typeof node.spec==='object'?node.spec:{}),template:built.template};
  delete node.diagramTemplate;
 });
 for(const section of result.sections??[])for(const block of avatarBlocks(section)){
  if(block.src&&block.src!==avatarSrc(0))throw Error('An avatar image names its character and has no source asset');
  Object.assign(block,{src:avatarSrc(0),alt:block.alt??block.avatar.trim(),width:AVATAR_WIDTH_MM,aspectRatio:1});
 }
 return result;
}

export const authorMaterializer=config=>packet=>materializeAuthorDiagrams(materializeHouseAuthoring(packet,{enabled:config.authoringPreferences===HOUSE_AUTHORING}),{enabled:config.authoringFormat===SHARED_DIAGRAM_FORMAT});
