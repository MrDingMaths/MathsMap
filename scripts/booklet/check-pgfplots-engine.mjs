import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {prepareTikz} from '../../src/lib/tikz-prepare.js';
export async function loadTikzEngine(){
 const root=path.resolve('public/libs/tikzjax'),logs=[];
 // Call the bundled worker API directly: identical TeX/WASM/assets, no browser required.
 const bundle=fs.readFileSync(path.join(root,'run-tex.js'),'utf8').replace('e("./node_modules/threads/worker.mjs")','({expose:api=>globalThis.texWorker=api})');
 const context=vm.createContext({postMessage:m=>{logs.push(m);if(logs.length>1000)logs.shift();},console,performance,WebAssembly,TextEncoder,TextDecoder,URL,Uint8Array,ArrayBuffer,Buffer,setTimeout,clearTimeout,fetch:async url=>{
  const filename=path.resolve(root,String(url).replace(/^local\//,''));if(!filename.startsWith(root+path.sep))throw Error('Unexpected TeX asset path');try{return new Response(fs.readFileSync(filename));}catch{return new Response('',{status:404});}
 }});
 vm.runInContext(bundle,context);await context.texWorker.load('local');
 return async source=>{logs.length=0;const p=prepareTikz(source);try{return await context.texWorker.texify(p.cleanCode,{texPackages:p.pkgJson,addToPreamble:p.preamble,showConsole:true});}catch(e){throw Error(e.message+'\n'+JSON.stringify(logs.slice(-80)));}};
}
if(process.argv[1]?.endsWith('check-pgfplots-engine.mjs')){
 const compile=await loadTikzEngine(),result=await compile(fs.readFileSync(process.argv[2]??'output/graph-repair/generated-smoke.tex','utf8'));
 fs.writeFileSync('output/graph-repair/pgfplots-smoke.svg',result.svg);console.log('Compiled PGFPlots',result.svg.length,result.timings);
}
