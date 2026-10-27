#!/usr/bin/env node
// Contact sheets of the Questions pages (polish pipeline, 23 October 2026): the PDF of the student edition rasterised
// at 60 dpi, four pages to a sheet, so a person can look at every page of a booklet in a few minutes.
//   node polish/sheets.mjs --pdf FILE --out DIR [--per-sheet 4] [--dpi 60] [--title TEXT]
// Pages are drawn by Poppler's pdftoppm; the sheets are laid out and photographed by headless Chrome with the images
// embedded as data URLs (no page needs the network). Writes DIR/sheet-01.png, ... and DIR/index.json.
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {isMain,parseArgs,write} from '../checks/lib/common.mjs';
import {pdfToolPath} from '../scripts/booklet/pdf-layout-qa.mjs';

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const escapeHtml=text=>String(text).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

// The numbered PNGs pdftoppm leaves for a PDF, in page order.
export function rasterise(pdf,dir,{dpi=60}={}){
 fs.mkdirSync(dir,{recursive:true});
 const run=spawnSync('pdftoppm',['-r',String(dpi),'-png',pdfToolPath(pdf),path.join(dir,'page')],{windowsHide:true,encoding:'utf8',maxBuffer:1<<26});
 if(run.status!==0)throw Error('pdftoppm failed: '+(run.stderr||run.error?.message));
 return fs.readdirSync(dir).filter(name=>/^page-\d+\.png$/.test(name)).sort().map(name=>path.join(dir,name));
}
// The page numbers of each sheet.
export const sheetPlan=(count,perSheet=4)=>Array.from({length:Math.ceil(count/perSheet)},(_,s)=>Array.from({length:Math.min(perSheet,count-s*perSheet)},(_,i)=>s*perSheet+i+1));
export function sheetHtml(pages,files,{title=''}={}){
 const cells=pages.map((number,i)=>`<figure><figcaption>${escapeHtml(title)} p${number}</figcaption><img src="data:image/png;base64,${fs.readFileSync(files[i]).toString('base64')}"></figure>`).join('');
 return `<style>body{margin:0;display:flex;gap:8px;background:#fff;font:bold 14px sans-serif}figure{margin:0;width:510px}img{width:510px;border:1px solid #888}figcaption{color:#c00;padding:2px}</style>${cells}`;
}

export async function makeSheets({pdf,out,perSheet=4,dpi=60,title='',log=()=>{}}){
 const raster=path.join(out,'pages'),files=rasterise(pdf,raster,{dpi});
 if(!files.length)throw Error('The PDF has no pages');
 const {chromium}=createRequire(path.join(ROOT,'package.json'))('playwright-core');
 let browser;try{browser=await chromium.launch({headless:true});}catch{browser=await chromium.launch({headless:true,channel:'chrome'});}
 const sheets=[];
 try{
  const page=await browser.newPage({viewport:{width:perSheet*520,height:800}});
  for(const [s,numbers] of sheetPlan(files.length,perSheet).entries()){
   await page.setContent(sheetHtml(numbers,numbers.map(n=>files[n-1]),{title}));
   await page.waitForFunction(()=>[...document.images].every(image=>image.complete));
   const file=path.join(out,`sheet-${String(s+1).padStart(2,'0')}.png`);
   await page.screenshot({path:file,fullPage:true});
   sheets.push({file:path.relative(out,file),pages:numbers});
  }
 }finally{await browser.close();}
 fs.rmSync(raster,{recursive:true,force:true});
 write(path.join(out,'index.json'),{pdf:path.resolve(pdf),pages:files.length,perSheet,dpi,sheets});
 log(`${files.length} pages on ${sheets.length} sheets`);
 return {pages:files.length,sheets};
}

async function main(){
 const opts=parseArgs(process.argv.slice(2),{values:['--pdf','--out','--per-sheet','--dpi','--title']});
 if(!opts['--pdf']||!opts['--out'])throw Error('Usage: node polish/sheets.mjs --pdf FILE --out DIR [--per-sheet 4] [--dpi 60] [--title TEXT]');
 console.log(JSON.stringify(await makeSheets({pdf:path.resolve(opts['--pdf']),out:path.resolve(opts['--out']),perSheet:Number(opts['--per-sheet']??4),dpi:Number(opts['--dpi']??60),title:opts['--title']??'',log:m=>console.error(m)}),null,1));
}
if(isMain(import.meta))await main().catch(error=>{console.error(error.stack??error.message);process.exitCode=1;});
