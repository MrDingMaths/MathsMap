// Cheap checks before settlement/export. These do not replace visual inspection.
import crypto from 'node:crypto';
import {renderMath} from '../../src/lib/render-math.js';
import {contentSource} from '../../src/lib/document-content.js';

const excluded=new Set(['source','sourceRefs','sourceAtom','sourceReview','sourceLayoutEvidence','spec','provenance','originalDiagram','verification','confirmedCorrections','corrections','inventoryMappings']);
const proseKeys=new Set(['prompt','short','worked','text','title','label','caption']);
const hash=text=>crypto.createHash('sha256').update(text).digest('hex');
const aside=/\b(?:this is the source answer|editorial (?:note|revision|correction)|transcription (?:note|revision|correction)|revised teaching section)\b/i;
const currency=/^\d[\d,.]*\s+(?:and|for|per|each|is|was|to|at|dollars|cents|from)\b/i;

export function importPreFinal(project,{reviews=[]}={}){
 const issues=[],reviewed=[],strings=new Set();let diagrams=0;
 const report=(rule,path,text,message)=>{
  const evidence={rule,path,hash:hash(text),message};
  const review=reviews.find(r=>r.rule===rule&&r.path===path&&r.hash===evidence.hash&&r.reviewer?.trim()&&r.reason?.trim());
  if(review)reviewed.push({...evidence,reviewer:review.reviewer,reason:review.reason});else issues.push(evidence);
 };
 const textCheck=(text,pointer,{native=false,latex=false}={})=>{
  if(!text)return;strings.add(pointer);
  if(aside.test(text))report('editorial-aside',pointer,text,'Review internal editorial wording in student-facing content');
  if(native)return;
  const source=latex?'$'+text+'$':text,normalized=source.replace(/\$\$([\s\S]*?)\$\$/g,(_,m)=>'$'+m+'$');
  const runs=[...normalized.matchAll(/(?<!\\)\$((?:\\.|[^$])*?)\$/g)];
  const rest=normalized.replace(/(?<!\\)\$((?:\\.|[^$])*?)\$/g,'');
  if(/(?<!\\)\$/.test(rest))report('math-delimiter',pointer,text,'Unmatched maths delimiter; encode currency as native text or escape its dollar sign');
  if(!latex&&runs.some(r=>currency.test(r[1])&&/^\d/.test(normalized.slice(r.index+r[0].length))))report('currency-delimiter',pointer,text,'Dollar amounts appear to have been paired as a maths run');
  if(renderMath(source).includes('class="katex-error"'))report('math-render',pointer,text,'Mathematics fails the shared text renderer');
 };
 const diagramCheck=(node,pointer)=>{
  diagrams++;const code=node.code??'',body=code.replace(/%[^\n]*/g,'');
  if(!/graph|plot|histogram|ogive|column|scatter|axis/i.test(node.id+' '+(node.spec?.kind??'')+' '+(node.spec?.description??'')+' '+code))return;
  for(const match of body.matchAll(/\\draw\[([^\]]*)\]\s*(\([^;]+);/g)){
   const [,options,geometry]=match,points=[...geometry.matchAll(/\((-?[\d.]+),\s*(-?[\d.]+)\)/g)].map(m=>[Number(m[1]),Number(m[2])]);
   if(points.length!==2||!geometry.includes('--')||/rectangle|circle|arc/.test(geometry)||!points.every(p=>p[0]===0)&&!points.every(p=>p[1]===0))continue;
   const tokens=options.split(',').map(t=>t.trim());
   const colour=tokens.filter(t=>/^draw=/.test(t)).at(-1)?.slice(5)??tokens.find(t=>/^(?:blue|red|green|orange|\w*(?:Blue|Red|Green|Orange))$/.test(t));
   if(colour&&!['black','#000000','none'].includes(colour))report('graph-axis-colour',pointer+'/code',code,'Review coloured baseline/axis; ordinary graph axes use black and series retain meaningful colour');
  }
 };
 const walk=(node,pointer='')=>{
  if(!node||typeof node!=='object')return;
  if(node.format==='tikz'){diagramCheck(node,pointer);return;}
  for(const [key,value] of Object.entries(node)){
   if(excluded.has(key))continue;
   const next=pointer+'/'+key.replace(/~/g,'~0').replace(/\//g,'~1');
   if(typeof value==='string'&&(proseKeys.has(key)||key==='latex'))textCheck(value,next,{native:node.type==='text'&&key==='text',latex:key==='latex'});
   else if(value&&typeof value==='object')walk(value,next);
  }
 };
 walk(project);
 for(const [si,section] of (project.sections??[]).entries()){
  const blocks=section.blocks??[];
  for(let bi=1;bi<blocks.length;bi++){
   const a=blocks[bi-1],b=blocks[bi];
   if(a.type!=='question'||b.type!=='question'||a.content?.children?.length||b.content?.children?.length)continue;
   const stem=n=>contentSource(n?.prompt).match(/^(?:True or False\?|(?:Simplify|Solve|Expand|Factorise|Rationalise|Convert|Write|List|Draw|Sketch|Complete)[^$\n]*[.?])/i)?.[0];
   const shared=stem(a.content);
   if(shared&&shared===stem(b.content)&&a.sourceReview?.sourceIdentity?.category===b.sourceReview?.sourceIdentity?.category&&!b.sourceReview?.separateSourceGroupReason)
    report('flattened-shared-stem',`/sections/${si}/blocks/${bi}`,JSON.stringify([a.content,b.content]),'Adjacent independent questions repeat a shared instruction; group source-related items as parts or record a source-backed separateSourceGroupReason.');
  }
 }
 return {version:1,ok:issues.length===0,projectHash:hash(JSON.stringify(project)),strings:strings.size,diagrams,issues,reviewed,note:'Text and graph-axis precheck only. Source coverage, palette/shading/visibility, physical lengths, final-size layout and all five visual editions remain required.'};
}
