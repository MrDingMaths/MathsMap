// Historical migration retired: its blanket font growth must not run again.
throw new Error('Superseded typography migration. Use scripts/booklet/calibrate-graph-typography.mjs and review its candidate before saving.');
import fs from 'node:fs';import {graphTikz} from '../../src/lib/graph-model.js';
const out='output/house-style-v2/',file=out+'candidate.json',p=JSON.parse(fs.readFileSync(file)),report=JSON.parse(fs.readFileSync(out+(process.argv[2]??'all')+'.json'));
const minima=new Map();for(const r of report)for(const g of r.graphs??[])if(g.id&&g.minimumPt)minima.set(g.id,Math.min(minima.get(g.id)??Infinity,g.minimumPt));
const changes=[];
function manualPalette(code){
 const colours=['blue','red','green'],found=[];
 for(const m of code.matchAll(/\\(?:draw|addplot)\[([^\]]+)\]([^\n]*)/g)){if(/grid|axis|rectangle/.test(m[2]))continue;const c=m[1].match(/\b(answerblue|sourceblue|sourcered|sourcegreen|sourceorange|blue|red|green|orange|teal|magenta|cyan)\b/)?.[1];if(c&&!found.includes(c))found.push(c);}
 const map=Object.fromEntries(found.map((c,i)=>[c,colours[i%3]]));
 code=code.replace(/(\\(?:draw|addplot|node)\[)([^\]]+)(\])/g,(all,a,b,c)=>a+b.replace(/\b(answerblue|sourceblue|sourcered|sourcegreen|sourceorange|blue|red|green|orange|teal|magenta|cyan)\b/g,x=>map[x]??x)+c);
 code=code.replace(/grid style=\{[^}]+\}/g,'grid style={housegrid,thin}');
 if(!code.includes('\\definecolor{housegrid}'))code=code.replace(/(\\begin\{tikzpicture\}(?:\[[^\n]*\])?)/,'$1\n\\definecolor{housegrid}{HTML}{CCCCCC}');
 code=code.replace(/\b(blue|red|green|answerblue)(?:!\d+![a-z]+|!\d+)/g,'$1').replace(/\\definecolor\{answerblue\}\{RGB\}\{[^}]+\}/g,'\\definecolor{answerblue}{HTML}{268CFF}');
 return code;
}
function walk(n){if(!n||typeof n!=='object')return;
 if(n.format==='tikz'&&n.code){const min=minima.get(n.id),factor=min&&min<11?11.5/min:1;
  if(factor>1){
   if(n.mathematicalModel){n.mathematicalModel.nodeScale=(n.mathematicalModel.nodeScale??1)*factor*1.06;if(n.mathematicalModel.panels)for(const panel of n.mathematicalModel.panels)panel.nodeScale=(panel.nodeScale??1)*factor*1.06;n.code=graphTikz(n.mathematicalModel);}
   else {const previous=Number(n.code.match(/% mathsmap-label-scale=([\d.]+)/)?.[1]??1),scale=previous*factor*1.06;
    n.code=n.code.replace(/\n% mathsmap-label-scale=[^\n]+\n\\tikzset\{every node\/\.append style=\{scale=[^}]+\}\}/,'');
    n.code=n.code.replace(/(\\begin\{tikzpicture\}(?:\[[^\n]*\])?)/,`$1\n% mathsmap-label-scale=${scale}\n\\tikzset{every node/.append style={scale=${scale}}}`);
   }
   changes.push({id:n.id,kind:'font-calibration',minimumBefore:min});
  }
  n.code=manualPalette(n.code);
 }
 if(n.type==='table'&&n.widthMm){const sum=n.widths.reduce((a,b)=>a+b,0),widths=n.widths.map(w=>w*n.widthMm/sum);for(const row of n.rows)row.forEach((c,i)=>{function blank(x){if(x?.type==='cloze')widths[i]=Math.max(widths[i],x.width+2*(n.padding??1)+1);if(x&&typeof x==='object')Object.values(x).forEach(v=>Array.isArray(v)?v.forEach(blank):blank(v));}blank(c);});n.widths=widths;n.widthMm=widths.reduce((a,b)=>a+b,0);}
 for(const [k,v]of Object.entries(n))if(!['spec','sourceAtom','mathematicalModel','originalDiagram'].includes(k))Array.isArray(v)?v.forEach(walk):walk(v);
}
walk(p.sections);
// Long worked solutions need their own continuation, without altering their content.
if(process.argv.includes('--paginate')){
 for(const num of [32,34]){const s=p.sections.find(s=>s.sourcePageNumber===num);if(s.blocks.some(b=>b.type==='page-break'))continue;const blocks=[];for(const b of s.blocks){if(blocks.length)blocks.push({id:b.id+'-break',type:'page-break'});if(b.content?.children?.length>4){const original=b.content.children;b.content.children=original.slice(0,4);blocks.push(b,{id:b.id+'-part-break',type:'page-break'},{...structuredClone(b),id:b.id+'-continued',content:{...structuredClone(b.content),id:b.content.id+'-continued',children:original.slice(4)}});}else blocks.push(b);}s.blocks=blocks;}
 for(const num of [55,60]){const s=p.sections.find(s=>s.sourcePageNumber===num);if(!s.blocks.some(b=>b.type==='page-break'))s.blocks.splice(1,0,{id:`page-${num}-continuation-break`,type:'page-break'});}
}
fs.writeFileSync(file,JSON.stringify(p,null,2));fs.writeFileSync(out+'calibration-'+(process.argv[2]??'all')+'.json',JSON.stringify(changes,null,2));console.log(JSON.stringify({calibrated:changes.length}));
