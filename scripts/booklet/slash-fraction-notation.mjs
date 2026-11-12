import katex from 'katex';
import {invalidFractionSpans} from '../../src/lib/practice-question-model.js';

// Keep this pass conservative. A quotient can contain a decimal, a product
// written without an operator, a delimited expression, or a LaTeX atom.
const command=/\\[A-Za-z]+|\\[^A-Za-z]/y;
const number=/(?:\d+(?:\.\d+)?|\.\d+)/y;
const letters=/[A-Za-z]+/y;
const constants=new Set(['\\pi','\\theta','\\alpha','\\beta','\\gamma','\\phi','\\Delta','\\omega','\\mu','\\sigma','\\lambda','\\tau','\\ell','\\rho','\\sqrt','\\frac','\\dfrac','\\tfrac','\\overline','\\bar','\\vec','\\ln','\\log','\\sin','\\cos','\\tan']);
const arity={'\\frac':2,'\\dfrac':2,'\\tfrac':2,'\\sqrt':1,'\\overline':1,'\\bar':1,'\\vec':1};
const isFunction=/^\\(?:ln|log|sin|cos|tan)$/;
const take=(re,s,i)=>{re.lastIndex=i;return re.exec(s)?.[0];};
const explicit = new Map([
 [String.raw`P=1-\operatorname{nPr}(365,x)/365^x`,String.raw`P=1-\frac{\operatorname{nPr}(365,x)}{365^x}`],
 [String.raw`A_n=\pi r^2(\sin u/u)`,String.raw`A_n=\pi r^2(\frac{\sin u}{u})`],
 [String.raw`\sin u/u\to1`,String.raw`\frac{\sin u}{u}\to1`],
 [String.raw`\sec x=1/\cos x`,String.raw`\sec x=\frac{1}{\cos x}`],
 [String.raw`\cot x=1/\tan x`,String.raw`\cot x=\frac{1}{\tan x}`],
 [String.raw`h_n(x)=P_n(x)/Q_n(x)`,String.raw`h_n(x)=\frac{P_n(x)}{Q_n(x)}`],
 ['a/[h(h+1)]=2',String.raw`\frac{a}{[h(h+1)]}=2`],
 [String.raw`\log_3(x)=t/\log_2(3)`,String.raw`\log_3(x)=\frac{t}{\log_2(3)}`],
 ['R_n(x)/D(x)',String.raw`\frac{R_n(x)}{D(x)}`],
 [String.raw`D=1/\delta`,String.raw`D=\frac{1}{\delta}`],
 [String.raw`\tan\alpha=1/\cot\alpha`,String.raw`\tan\alpha=\frac{1}{\cot\alpha}`],
 [String.raw`\tan\beta=1/\cot\beta`,String.raw`\tan\beta=\frac{1}{\cot\beta}`],
 [String.raw`1/\cos2\theta`,String.raw`\frac{1}{\cos2\theta}`],
 [String.raw`1/\binom N2`,String.raw`\frac{1}{\binom N2}`],
 [String.raw`\binom{20}{r+2}/\binom{20}{r}=8`,String.raw`\frac{\binom{20}{r+2}}{\binom{20}{r}}=8`],
 ["PP'=2PH=2|S|/r",String.raw`PP'=2PH=\frac{2|S|}{r}`],
 ['3/[(k+1)(4k+1)]',String.raw`\frac{3}{[(k+1)(4k+1)]}`],
 [String.raw`n>1/\delta`,String.raw`n>\frac{1}{\delta}`],
 [String.raw`\Pr(G)/\Pr(E)`,String.raw`\frac{\Pr(G)}{\Pr(E)}`],
 ['1/[n(n-1)]',String.raw`\frac{1}{[n(n-1)]}`],
 [String.raw`a/b=\sin A/\sin B`,String.raw`\frac{a}{b}=\frac{\sin A}{\sin B}`],
 [String.raw`1/\sin x`,String.raw`\frac{1}{\sin x}`],
 ['[SPR]=[PQRS]/2',String.raw`[SPR]=\frac{[PQRS]}{2}`],
 ['[SXY]=[SPR]/4=[PQRS]/8',String.raw`[SXY]=\frac{[SPR]}{4}=\frac{[PQRS]}{8}`],
 [String.raw`c=a\sin C/\sin A`,String.raw`c=\frac{a\sin C}{\sin A}`],
 [String.raw`a/\sin A=2R`,String.raw`\frac{a}{\sin A}=2R`],
 [String.raw`\Phi=1+1/\Phi`,String.raw`\Phi=1+\frac{1}{\Phi}`],
 [String.raw`1/\Phi=\Phi-1\approx0.618034`,String.raw`\frac{1}{\Phi}=\Phi-1\approx0.618034`]
]);

function groupEnd(s,i,open,close){
 let depth=0;
 for(let j=i;j<s.length;j++){
  if(s[j]===open)depth++;
  if(s[j]===close&&!--depth)return j+1;
 }
 return null;
}
function argumentEnd(s,i){
 while(/\s/.test(s[i]??''))i++;
 if(s[i]==='{')return groupEnd(s,i,'{','}');
 const cmd=take(command,s,i);
 if(cmd)return i+cmd.length;
 return /^[A-Za-z\d]$/.test(s[i]??'')?i+1:null;
}
function atom(s,i){
 const cmd=take(command,s,i);
 let end;
 if(cmd==='\\left'){
  const delimiter=s[i+cmd.length],pairs={'(':')','[':']','|':'|'};
  if(!pairs[delimiter])return null;
  let depth=1;
  const tags=/\\(?:left|right)(?:\(|\)|\[|\]|\|)/g;
  tags.lastIndex=i+cmd.length+1;
  for(let hit;(hit=tags.exec(s));){
   depth+=hit[0].startsWith('\\left')?1:-1;
   if(!depth){if(hit[0].at(-1)!==pairs[delimiter])return null;end=tags.lastIndex;break;}
  }
 }else if(cmd&&constants.has(cmd)){
  end=i+cmd.length;
  if(cmd==='\\sqrt'&&s[end]==='[')end=groupEnd(s,end,'[',']');
  for(let n=0;end!=null&&n<(arity[cmd]??0);n++)end=argumentEnd(s,end);
  if(isFunction.test(cmd)){
   const next=atom(s,end);
   if(!next)return null;
   end=next.end;
  }
 }else if(!cmd&&s[i]==='('){
  end=groupEnd(s,i,'(',')');
 }else if(!cmd){
  const word=take(number,s,i)??take(letters,s,i);
  if(word)end=i+word.length;
 }
 if(!end)return null;
 while(s[end]==='^'||s[end]==='_'){
  end=argumentEnd(s,end+1);
  if(!end)return null;
 }
 return {start:i,end};
}
function tokens(s){
 const out=[];
 for(let i=0;i<s.length;){
  const a=atom(s,i);
  if(a){out.push(a);i=a.end;continue;}
  const c=take(command,s,i);
  const span=c?.length??1;
  out.push({start:i,end:i+span,boundary:true});
  i+=span;
 }
 return out;
}
function flagged(body,i){
 // Replace the other slashes with a marker to ask the validator about just
 // this slash while keeping the surrounding groups and commands in place.
 const isolated=body.replace(/(?<!\\)\//g,(s,j)=>j===i?s:'·');
 if(invalidFractionSpans('$'+isolated+'$').length===0)return false;
 return !/!\s*$/.test(body.slice(0,i));
}
function operand(s,index,side){
 const ts=tokens(s);
 if(side==='left'){
  let i=ts.findLastIndex(t=>t.end<=index&&/^\s*$/.test(s.slice(t.end,index)));
  if(i<0||ts[i].boundary)return null;
  const end=ts[i].end;
  while(i>0&&!ts[i-1].boundary&&ts[i-1].end===ts[i].start)i--;
  return {start:ts[i].start,end};
 }
 const i=ts.findIndex(t=>t.start>=index&&/^\s*$/.test(s.slice(index,t.start)));
 if(i<0||ts[i].boundary)return null;
 // Multiple juxtaposed atoms after a slash can change operator precedence.
 if(ts[i+1]&&!ts[i+1].boundary&&ts[i+1].start===ts[i].end)return null;
 return ts[i];
}
function candidate(body,i){
 // An operand may be inside a bracket, a macro argument or an exponent.
 // Search at that nesting level before considering the whole expression.
 const stack=[];
 for(let j=0;j<i;j++){
  if('{('.includes(body[j])&&body[j-1]!=='\\')stack.push(j);
  else if('})'.includes(body[j])&&body[j-1]!=='\\'&&stack.length&&'{('.indexOf(body[stack.at(-1)])==='})'.indexOf(body[j]))stack.pop();
 }
 const start=stack.length?stack.at(-1)+1:0;
 const open=body[start-1],close=open==='{'?'}':')';
 const end=stack.length?(groupEnd(body,start-1,open,close)??body.length+1)-1:body.length;
 const local=body.slice(start,end),slash=i-start;
 const a=operand(local,slash,'left'),b=operand(local,slash+1,'right');
 if(!a||!b)return null;
 const before=local.slice(a.start,b.end);
 const numerator=local.slice(a.start,a.end),denominator=local.slice(b.start,b.end);
 if(/[{}]/.test(numerator+denominator)&&!balanced(numerator+denominator))return null;
 // Preserve surrounding signs and delimiters. Keep parentheses that were
 // present in the source, even when the vinculum makes them redundant.
 return {start:a.start+start,end:b.end+start,before,after:'\\frac{'+numerator+'}{'+denominator+'}'};
}
function balanced(s){
 let depth=0;
 for(let i=0;i<s.length;i++){
  if(s[i-1]==='\\')continue;
  if(s[i]==='{')depth++;
  if(s[i]==='}'&&--depth<0)return false;
 }
 return depth===0;
}
export function transform(body){
 const original=body,edits=[];
 if(explicit.has(body))body=explicit.get(body);
 // In this probability label the slash is a unit. Separate the unit from
 // the prose so the bank can recognise the existing km/h notation.
 body=body.replaceAll('\\text{more than 10 km/h over limit}', '\\text{more than 10 }\\text{km/h}\\text{ over limit}');
 for(let count=0;count<100;count++){
  if(!invalidFractionSpans('$'+body+'$').length){
   try{katex.renderToString(body,{displayMode:true,throwOnError:true,strict:'ignore'});}catch{return {body:original,edits:[],reason:'TeX parse failed'};}
   return {body,edits};
  }
  const slashes=[...body.matchAll(/(?<!\\)\//g)].filter(m=>flagged(body,m.index));
  const edit=slashes.map(m=>candidate(body,m.index)).find(Boolean);
  if(!edit)return {body:original,edits:[],reason:'Ambiguous or unsupported operands'};
  body=body.slice(0,edit.start)+edit.after+body.slice(edit.end);
  edits.push(edit);
 }
 return {body:original,edits:[],reason:'Too many nested quotients'};
}

function repairText(value,native){
 const source=native?'$'+value+'$':value;
 const spans=invalidFractionSpans(source).sort((a,b)=>b.start-a.start);
 if(!spans.length)return value;
 let fixed=source,previous=source.length;
 for(const span of spans){
  if(span.end>previous)return null;
  previous=span.start;
  const result=transform(span.body);
  if(result.reason)return null;
  const delimiter=span.delimiter==='$'?['$','$']:span.delimiter==='\\()'?['\\(','\\)']:['\\[','\\]'];
  fixed=fixed.slice(0,span.start)+delimiter[0]+result.body+delimiter[1]+fixed.slice(span.end);
 }
 return native?fixed.slice(1,-1):fixed;
}

function editableStrings(content,visit){
 const walk=(value,path,parent)=>{
  if(typeof value==='string'){
   const key=path.at(-1);
   const native=key==='latex'&&['math','annotated-equation'].includes(parent?.type);
   if(native||key==='prompt'||key==='short'||key==='worked'||key==='answer'&&parent?.type==='cloze')visit(value,path,parent,native);
  }else if(value&&typeof value==='object'){
   for(const [key,child] of Object.entries(value))walk(child,[...path,key],value);
  }
 };
 const question=(node,path)=>{
  walk(node.prompt,[...path,'prompt'],node);
  for(const key of ['short','worked'])walk(node.answer?.[key],[...path,'answer',key],node.answer);
  (node.children??[]).forEach((child,i)=>question(child,[...path,'children',String(i)]));
 };
 question(content,[]);
}

// Reconstruct the exact prior reviewed text only if every recorded path is
// still editable maths and the current value is the result of this repair.
export function beforeSlashFractionRepair(block){
 const evidence=block.sourceReview?.slashFractionNotation;
 if(evidence?.version!==1||!Array.isArray(evidence.fields)||!evidence.fields.length)return null;
 const original=structuredClone(block);
 delete original.sourceReview.slashFractionNotation;
 const pending=new Map(evidence.fields.map(({path,before})=>[JSON.stringify(path),before]));
 if(pending.size!==evidence.fields.length)return null;
 editableStrings(original.content,(value,path,parent,native)=>{
  const key=JSON.stringify(path);
  if(!pending.has(key))return;
  const before=pending.get(key);
  if(typeof before==='string'&&before!==value&&repairText(before,native)===value){
   parent[path.at(-1)]=before;
   pending.delete(key);
  }
 });
 return pending.size?null:original;
}

export function repairSlashFractionNotation(block){
 if(block.sourceReview?.slashFractionNotation)return null;
 const repaired=structuredClone(block),fields=[];
 let unresolved=false;
 editableStrings(repaired.content,(value,path,parent,native)=>{
  const fixed=repairText(value,native);
  if(fixed===null){unresolved=true;return;}
  if(fixed===value)return;
  fields.push({path,before:value});
  parent[path.at(-1)]=fixed;
 });
 if(unresolved||!fields.length)return null;
 repaired.sourceReview={...repaired.sourceReview,slashFractionNotation:{version:1,fields}};
 return repaired;
}
