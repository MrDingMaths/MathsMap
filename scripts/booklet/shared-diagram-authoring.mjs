// Internal, opt-in generation format. Canonical packets retain ordinary TikZ strings.
export const SHARED_DIAGRAM_FORMAT='shared-diagrams-v1';
const evidenceKeys=new Set(['sourceAtom','sourceReview','sourceLayoutEvidence','spec','provenance']);
const has=(object,key)=>Object.prototype.hasOwnProperty.call(object,key);

export const SHARED_DIAGRAM_PROMPT=String.raw`Optional internal shared-diagram authoring (shared-diagrams-v1): use this only for repeated native geometry. You may instead return ordinary complete code strings.
To share code, add authoringFormat:"shared-diagrams-v1" and diagramLibrary:{fragmentId:"literal TikZ source",...} to the page envelope. A DIAGRAM may replace code with codeParts:["fragmentId",{text:"occurrence-specific literal source"},...]. The caller concatenates parts exactly, with NO inserted spaces/newlines, then removes internal fields before normal validation. Keep every occurrence's own id, width, role, spec and source references. Library IDs are not inventory/content IDs.
Every expanded diagram must be one complete tikzpicture. Share the same picture options, coordinates and base geometry with solution-only marks/labels inside that one picture. Referenced diagrams cannot use overlayOf or role:solution-overlay; emit a complete role:solution figure instead. Preserve all givens and question-versus-answer visibility. Never share answers into question figures. Do not use recursive references, textual replacement, separate SVG layers or per-layer scaling. Literal braces/newlines/TeX remain exact. Source review, numerical geometry and final-size question/short/worked preflight still apply.`;

export function visitAuthorContent(value,visitor) {
 if(!value||typeof value!=='object')return;
 visitor(value);
 for(const [key,child] of Object.entries(value))if(!evidenceKeys.has(key))visitAuthorContent(child,visitor);
}

export function materializeAuthorDiagrams(packet,{enabled=false}={}) {
 if(!packet||typeof packet!=='object')return packet;
 const internal=has(packet,'authoringFormat')||has(packet,'diagramLibrary');
 let references=false;
 visitAuthorContent(packet.sections,node=>{if(has(node,'codeParts'))references=true;});
 if(!internal&&!references)return packet;
 if(!enabled)throw Error('Shared-diagram authoring requires explicit config.authoringFormat');
 if(packet.authoringFormat!==SHARED_DIAGRAM_FORMAT)throw Error('Unsupported or missing shared-diagram authoringFormat');
 const library=packet.diagramLibrary;
 if(!library||typeof library!=='object'||Array.isArray(library))throw Error('diagramLibrary must map fragment IDs to literal source strings');
 const fragments=new Map(Object.entries(library));
 for(const [id,code] of fragments)if(!/^[a-zA-Z0-9._-]{1,96}$/.test(id)||typeof code!=='string'||!code.length)throw Error('Invalid diagram fragment '+id);
 const result=structuredClone(packet);
 visitAuthorContent(result.sections,node=>{
  if(!has(node,'codeParts'))return;
  if(node.format!=='tikz'||has(node,'code')||!node.id)throw Error('codeParts requires a uniquely identified TikZ occurrence without code');
  if(node.overlayOf||node.role==='solution-overlay')throw Error('Shared diagrams must expand into a complete figure, not separately scaled overlays');
  if(!Array.isArray(node.codeParts)||!node.codeParts.length)throw Error('codeParts requires a nonempty ordered list');
  node.code=node.codeParts.map(part=>{
   if(typeof part==='string'){
    if(!fragments.has(part))throw Error('Unknown diagram fragment '+part);
    return fragments.get(part);
   }
   if(part&&typeof part==='object'&&Object.keys(part).length===1&&typeof part.text==='string')return part.text;
   throw Error('A diagram part must be a fragment ID or a literal {text}');
  }).join('');
  // No nested pictures: marks and labels share the actual base coordinate frame.
  const starts=[...node.code.matchAll(/\\begin\{tikzpicture\}/g)],ends=[...node.code.matchAll(/\\end\{tikzpicture\}/g)];
  if(starts.length!==1||ends.length!==1||starts[0].index>=ends[0].index)throw Error('Expanded diagram must contain exactly one complete tikzpicture: '+node.id);
  delete node.codeParts;
 });
 delete result.authoringFormat;delete result.diagramLibrary;
 return result;
}

// Conservative offline experiment: factor repeated, exact contiguous source lines.
// No coordinate inference, TeX rewriting, source corrections or project writes.
export function factorAuthorDiagrams(packet) {
 const source=materializeAuthorDiagrams(packet,{enabled:true}),result=structuredClone(source),diagrams=[];
 visitAuthorContent(result.sections,node=>{if(node.format==='tikz'&&typeof node.code==='string'&&!node.overlayOf&&node.role!=='solution-overlay')diagrams.push(node);});
 const lines=code=>code.match(/[^\n]*\n|[^\n]+$/g)??[],counts=new Map();
 for(const node of diagrams)for(const line of new Set(lines(node.code)))counts.set(line,(counts.get(line)??0)+1);
 const candidates=new Map(),chunks=new Map();
 for(const node of diagrams){
  const parts=[];let text='',common=null;
  const flush=()=>{if(text){parts.push({text,common});text='';}};
  for(const line of lines(node.code)){const repeated=counts.get(line)>1;if(common!==repeated){flush();common=repeated;}text+=line;}flush();
  chunks.set(node,parts);
  for(const part of parts)if(part.common&&part.text.length>=80)candidates.set(part.text,(candidates.get(part.text)??0)+1);
 }
 const selected=new Map();
 for(const [text,count] of candidates)if(count>1){
  const id='d'+(selected.size+1);
  // Account for library entry and reference overhead before considering a fragment.
  if((count-1)*JSON.stringify(text).length>count*(id.length+4)+id.length+8)selected.set(text,id);
 }
 if(!selected.size)return source;
 const library=Object.fromEntries([...selected].map(([text,id])=>[id,text]));
 for(const node of diagrams){
  const parts=chunks.get(node);if(!parts.some(p=>selected.has(p.text)))continue;
  node.codeParts=[];let literal='';
  for(const p of parts){if(selected.has(p.text)){if(literal){node.codeParts.push({text:literal});literal='';}node.codeParts.push(selected.get(p.text));}else literal+=p.text;}
  if(literal)node.codeParts.push({text:literal});delete node.code;
 }
 result.authoringFormat=SHARED_DIAGRAM_FORMAT;result.diagramLibrary=library;
 return JSON.stringify(result).length<JSON.stringify(source).length?result:source;
}
