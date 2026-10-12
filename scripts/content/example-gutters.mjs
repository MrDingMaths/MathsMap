import {fromSource} from '../../src/lib/document-content.js';
import {splitInlineContent} from '../../src/lib/inline-content.js';
import {missingEqualsGutter,startsWithRelation} from '../booklet/check-equals-gutter.mjs';
import {teachingEquationDisplays} from '../../src/lib/booklet-teaching-alignment.js';

// Reuse Studio's report-only checker for paragraph and aligned continuations.
// An authored phantom in the wrong alignment column needs a separate check.
export function exampleGutterProblems(example){
  const aligned=teachingEquationDisplays({...example,id:'gutter-check',prompt:example.question_text,theorySolution:example.solution_text});
  const findings=[];
  for(const field of ['question_text','solution_text']){
    const display=aligned?.[field==='question_text'?'prompt':'theorySolution'];
    const documents=display?[display]:splitInlineContent(example[field]).parts.filter(row=>row.type==='text').flatMap(row=>[fromSource(row.value),{blocks:row.value.split(/\r?\n/).filter(line=>line.trim()).map(line=>{const match=/^\s*\$([^$]*)\$\s*$/.exec(line);return {type:'paragraph',inlines:[match?{type:'math',latex:match[1]}:{type:'text',text:line}]};})}]);
    for(const document of documents){
      const openingRows=[];
      const collect=node=>{if(!node||typeof node!=='object')return;if(node.type==='math')for(const env of String(node.latex||'').matchAll(/\\begin\{(?:align\*?|aligned|gather\*?|gathered|array)\}(?:\{[^}]*\})?([\s\S]*?)\\end\{(?:align\*?|aligned|gather\*?|gathered|array)\}/g))openingRows.push(env[1].split(/\\\\(?:\[[^\]]*\])?/)[0].trim());for(const value of Object.values(node))if(value&&typeof value==='object')if(Array.isArray(value))value.forEach(collect);else collect(value);};collect(document);
      findings.push(...missingEqualsGutter(document).filter(row=>row.shape==='lines'||row.shape==='rows'&&openingRows.includes(row.first)).map(row=>({...row,field})));
      const walk=node=>{
        if(!node||typeof node!=='object')return;
        if(node.type==='math'&&typeof node.latex==='string')for(const env of node.latex.matchAll(/\\begin\{(?:align\*?|aligned)\}([\s\S]*?)\\end\{(?:align\*?|aligned)\}/g)){
          const rows=env[1].split(/\\\\(?:\[[^\]]*\])?/);
          if(!env[1].includes('&')&&/^\s*\\mathrel\{\\phantom\{=\}\}/.test(rows[0])&&rows.slice(1).every(row=>startsWithRelation(row))){
            findings.push({field,shape:'rows',needs:'gutter',detail:'continuation aligned working has no relation column',first:env[0],second:''});continue;
          }
          for(let i=0;i<rows.length-1;i++){
            const first=rows[i].trim(),second=rows[i+1].trim();
            if(/^\\mathrel\{\\phantom\{=\}\}/.test(first)&&/^\s*&/.test(second)&&startsWithRelation(second))findings.push({field,shape:'rows',needs:'gutter',detail:'phantom opening expression is in the wrong aligned column',first,second});
          }
        }
        for(const value of Object.values(node))if(value&&typeof value==='object')if(Array.isArray(value))value.forEach(walk);else walk(value);
      };walk(document);
    }
  }
  return findings.filter((row,index)=>findings.findIndex(prior=>prior.field===row.field&&prior.first===row.first&&prior.second===row.second)===index);
}
export function repairExampleGutters(example){
  const result=structuredClone(example),operations=[];
  for(const problem of exampleGutterProblems(example)){
    const field=problem.field,first=problem.first;
    let replacement;
    if(problem.detail==='continuation aligned working has no relation column')replacement=first.replace(/(\\begin\{(?:align\*?|aligned)\}|\\\\(?:\[[^\]]*\])?)/g,'$1&');
    else if(problem.detail==='phantom opening expression is in the wrong aligned column')replacement='&'+first;
    else if(problem.shape==='rows'&&/^align/.test(problem.detail))replacement=first.startsWith('&')?'&\\mathrel{\\phantom{=}}'+first.slice(1):'&\\mathrel{\\phantom{=}}'+first;
    else replacement='\\mathrel{\\phantom{=}}'+first;
    const source=result[field];
    const needle=problem.shape==='lines'?'$'+first+'$':first;
    const inserted=problem.shape==='lines'?'$'+replacement+'$':replacement;
    const at=source.indexOf(needle);
    if(at<0||source.indexOf(needle,at+needle.length)>=0)throw Error('Gutter repair needs an unambiguous source occurrence: '+field+' '+first);
    result[field]=source.slice(0,at)+inserted+source.slice(at+needle.length);
    operations.push({field,at,before:needle,after:inserted});
  }
  if(exampleGutterProblems(result).length)throw Error('Scoped gutter repair did not resolve the reported opening');
  // Reverse every insertion and require the exact original fields. No other
  // mathematical, prose or diagram byte can change through this formatter.
  const proof=structuredClone(result);
  for(const operation of [...operations].reverse())proof[operation.field]=proof[operation.field].slice(0,operation.at)+operation.before+proof[operation.field].slice(operation.at+operation.after.length);
  if(JSON.stringify(proof)!==JSON.stringify(example))throw Error('Gutter formatting altered non-gutter content');
  return {example:result,operations};
}
