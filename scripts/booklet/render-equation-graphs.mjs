// Render compiled SVGs with the same Computer Modern fonts used by the booklet.
import fs from 'node:fs';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),{Resvg}=require('../../output/graph-repair/runtime/node_modules/@resvg/resvg-js');
const dir='output/graph-repair/svg';fs.mkdirSync('output/graph-repair/png',{recursive:true});
const files=process.argv.slice(2).length?process.argv.slice(2):fs.readdirSync(dir).filter(f=>f.endsWith('.svg'));
for(const file of files){const svg=fs.readFileSync(dir+'/'+file);const rendered=new Resvg(svg,{fitTo:{mode:'width',value:700},background:'white',font:{fontFiles:fs.readdirSync('output/graph-repair/fonts').map(n=>'output/graph-repair/fonts/'+n),loadSystemFonts:false,defaultFontFamily:'cmr10'}}).render();fs.writeFileSync('output/graph-repair/png/'+file.replace('.svg','.png'),rendered.asPng());}
console.log('Rendered',files.length,'graph PNGs');
