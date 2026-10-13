// Reports calculations whose opening line is a bare expression and whose next
// line begins with a relation sign, where the opening line has no equals-sign
// gutter. House style indents the opening expression by one relation sign
// (`\mathrel{\phantom{=}}`) so it sits above the right-hand sides and the
// relation signs stack. Report only: existing booklets are not repaired here.
import fs from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';

const RELATION=String.raw`(?:=|<|>|\\(?:approx|leq?|geq?|neq?|equiv)(?![a-zA-Z]))`;
const STARTS=new RegExp('^'+RELATION),ANY=new RegExp(RELATION);
const SKIP=new Set(['sourceLayoutEvidence','sourceReview','originalDiagram','spec','questionDiagrams','solutionDiagrams']);

// Leading wrappers that print nothing: alignment tabs, groups, colour, style.
const lead=latex=>{let text=latex,before;do{before=text;text=text.replace(/^(?:\s+|&|\{|\\displaystyle|\\color\{[^}]*\}|\\textcolor\{[^}]*\})/,'');}while(text!==before);return text;};
const body=latex=>latex.replace(/\\text(?:rm|bf|it)?\{[^}]*\}/g,'').replace(/\\(?:text)?color\{[^}]*\}/g,'');
export const startsWithRelation=latex=>STARTS.test(lead(latex));
// Hand-made gutters (`\quad`, `\ `, `\hspace{…}`) are reported so they can be
// replaced by the standard one.
const MANUAL=/^(?:\\q?quad|\\enspace|\\[ ,;:]|~|\\hspace\*?\{[^}]*\})/;
export const manualGutter=latex=>MANUAL.test(lead(latex));
export const bareExpression=latex=>!/phantom/.test(latex)&&!ANY.test(body(latex))&&/[0-9a-zA-Z]/.test(body(latex));

function rows(latex) {
  const match=/\\begin\{(aligned|align\*?|gathered|gather\*?|array)\}(\{[^}]*\})?/.exec(latex);
  const inner=latex.replace(/\\begin\{(?:aligned|align\*?|gathered|gather\*?|array)\}(?:\{[^}]*\})?/g,'').replace(/\\end\{(?:aligned|align\*?|gathered|gather\*?|array)\}/g,'');
  return {env:match?.[1]??'',columns:match?.[2]??'',rows:inner.split(/\\\\(?:\[[^\]]*\])?/)};
}
const firstMath=value=>{
  if(typeof value==='string')return /^\s*\$\$?([\s\S]*?)\$\$?/.exec(value)?.[1]??'';
  const inline=value?.blocks?.[0]?.inlines?.[0];return inline?.type==='math'?inline.latex??'':'';
};
// A plain-string prompt counts when its last line is one maths expression.
const lastLineMath=value=>{const line=String(value).trimEnd().split(/\r?\n/).at(-1)??'';const match=/^\s*\$\$?([^$]+)\$\$?\s*$/.exec(line);return match?match[1]:'';};
const lastParagraph=value=>{if(typeof value==='string')return lastLineMath(value);const block=value?.blocks?.at?.(-1);return block?.type==='paragraph'&&block.inlines?.length===1&&block.inlines[0].type==='math'?block.inlines[0].latex??'':'';};
const field=trail=>trail.includes('answer')?(trail.includes('worked')?'worked answer':trail.includes('short')?'short answer':'answer'):trail.includes('theorySolution')?'example solution':trail.includes('examples')?'example':'prompt';

// `needs` is 'gutter' where the working prints from the left edge (the opening
// line is left-aligned too, or centred above it and should move left), and
// 'check' where the working itself is centred or right-aligned.
export function missingEqualsGutter(value) {
  const hits=[];
  const walk=(node,owner,trail,cell)=>{
    if(!node||typeof node!=='object')return;
    if(Array.isArray(node)){for(const child of node)walk(child,owner,trail,cell);return;}
    const next=typeof node.id==='string'&&(node.type==='question'||node.type==='part'||node.content||node.sourceAtom||trail.at(-1)==='examples')?node.id:owner;
    if(node.type==='cell')cell=node;
    const shown=block=>cell&&!cell.preserveParagraphAlignment?cell.align??'center':block.align??'left';
    if(Array.isArray(node.blocks))for(let i=0;i<node.blocks.length-1;i++){
      // Working that continues in a borderless scaffold table starts in its
      // first cell.
      const a=node.blocks[i],next1=node.blocks[i+1],inner=next1?.type==='table'?next1.rows?.[0]?.find(c=>c?.blocks?.length):null,b=inner?inner.blocks[0]:next1;
      if(a?.type!=='paragraph'||b?.type!=='paragraph'||!a.inlines?.length||a.inlines.some(inline=>inline.type!=='math')||b.inlines?.[0]?.type!=='math')continue;
      const first=a.inlines.map(inline=>inline.latex??'').join(''),second=b.inlines[0].latex??'';
      if(/\\\\/.test(first)||!bareExpression(first)||!startsWithRelation(second))continue;
      const align=[shown(a),inner?inner.preserveParagraphAlignment?b.align??'left':inner.align??'center':shown(b)];
      hits.push({owner:next??'',field:field(trail),shape:'lines',needs:align[1]==='left'?'gutter':'check',detail:align.join('/')+(manualGutter(first)?', manual spacing':''),id:a.id??'',first,second});
    }
    if(node.type==='math'&&typeof node.latex==='string'&&/\\\\/.test(node.latex)){
      const parsed=rows(node.latex);
      for(let i=0;i<parsed.rows.length-1;i++){
        const first=parsed.rows[i],second=parsed.rows[i+1];
        // Wrapped lines after a relation row continue that row; they open nothing.
        let prior=i-1;while(prior>0&&manualGutter(parsed.rows[prior])&&!startsWithRelation(parsed.rows[prior]))prior--;
        if(!bareExpression(first)||!startsWithRelation(second)||i>0&&startsWithRelation(parsed.rows[prior]))continue;
        // `&a+b\\={}&c` already puts the relation in the gutter column.
        if(/^align/.test(parsed.env)&&/^\s*&/.test(first)&&ANY.test(body(second.split('&')[0])))continue;
        const left=/^align/.test(parsed.env)&&/^\s*&/.test(first)&&!/&/.test(first.replace(/^\s*&/,''))||parsed.env==='array'&&/^\{l/.test(parsed.columns);
        hits.push({owner:next??'',field:field(trail),shape:'rows',needs:left?'gutter':'check',detail:(parsed.env||'no environment')+(manualGutter(first)?', manual spacing':''),id:'',first:first.trim(),second:second.trim()});
        break;
      }
    }
    if(trail.at(-1)==='examples'&&node.prompt&&node.theorySolution&&!node.equationAlignment){
      const first=lastParagraph(node.prompt),second=lead(firstMath(node.theorySolution)).replace(/^\\begin\{[a-z*]+\}/,'');
      if(first&&!/\\\\/.test(first)&&bareExpression(first)&&startsWithRelation(second))hits.push({owner:node.id??next??'',field:'example',shape:'solution',needs:'check',detail:'no equationAlignment',id:'',first,second:second.split(/\\\\/)[0]});
    }
    for(const [key,child] of Object.entries(node))if(!SKIP.has(key))walk(child,next,[...trail,key],cell);
  };
  walk(value,'',[],null);
  return hits;
}

async function main(){
  const args=process.argv.slice(2),strict=args.includes('--strict'),list=args.includes('--list'),names=args.filter(a=>!a.startsWith('--'));
  const root=path.resolve('booklets/projects');
  const files=names.length?names.map(n=>path.join(root,n.endsWith('.json')?n:n+'.json')):(await fs.readdir(root)).filter(n=>n.endsWith('.json')&&n!=='manifest.json').map(n=>path.join(root,n));
  let total=0,gutter=0;
  for(const file of files){
    const project=JSON.parse(await fs.readFile(file,'utf8')),hits=[];
    for(const section of project.sections??[])for(const block of section.blocks??[])for(const hit of missingEqualsGutter(block))hits.push({...hit,block:block.id,sourcePage:block.sourcePageNumber??section.sourcePageNumber??null});
    if(!hits.length)continue;
    total+=hits.length;
    const needs=hits.filter(hit=>hit.needs==='gutter').length;gutter+=needs;
    console.log(`${project.id}: ${needs} need a gutter, ${hits.length-needs} to check by eye`);
    if(names.length||list)for(const hit of hits)console.log(`  [${hit.needs}] source p${hit.sourcePage??'?'} ${hit.owner||hit.block} (${hit.field}, ${hit.shape}, ${hit.detail}): ${hit.first}  |  ${hit.second}`);
  }
  console.log(total?`${gutter} opening expression${gutter===1?'':'s'} need an equals-sign gutter; ${total-gutter} more to check by eye.`:'No opening expression is missing its equals-sign gutter.');
  if(strict&&gutter)process.exitCode=1;
}
if(import.meta.url===pathToFileURL(process.argv[1]??'').href)await main();
