import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import fs from 'node:fs';
// Poppler's Windows file APIs need the native extended form beyond MAX_PATH.
// Keep artifact paths and hashes unchanged; only the external tool argument changes.
export function pdfToolPath(file,platform=process.platform){
 if(platform!=='win32')return file;
 const absolute=path.win32.resolve(file);
 return absolute.length>=260?path.win32.toNamespacedPath(absolute):file;
}
// Poppler candidates: PATH first, then common Windows installs (scoop shim and app folders).
export function popplerCandidates(env=process.env,platform=process.platform){
 const found=['pdftotext'];
 if(platform==='win32'){
  const scoop=path.win32.join(env.SCOOP??path.win32.join(env.USERPROFILE??'','scoop'));
  found.push(path.win32.join(scoop,'shims','pdftotext.exe'));
  try{for(const v of fs.readdirSync(path.win32.join(scoop,'apps','poppler')))found.push(path.win32.join(scoop,'apps','poppler',v,'bin','pdftotext.exe'));}catch{}
 }
 return found;
}
// The DOM cannot expose Chromium's final fragmentation of flowing answer sheets.
// Poppler supplies actual printed word bounds, including SVG graph labels.
export function inspectPrintedPdf(file) {
 const pyScript=fileURLToPath(new URL('./pdf-word-bounds.py',import.meta.url));
 const attempts=process.env.BOOKLET_PDF_PYTHON?[[process.env.BOOKLET_PDF_PYTHON,[pyScript,file]]]:popplerCandidates().map(command=>[command,['-bbox','-enc','UTF-8',pdfToolPath(file),'-']]);
 const failures=[];let result;
 // Take the first backend that really prints Poppler word boxes. Git for Windows ships an Xpdf
 // pdftotext without -bbox that can shadow Poppler on PATH, so a bare name is not trusted.
 for(const [command,args] of attempts){
  const tried=spawnSync(command,args,{encoding:'utf8',maxBuffer:32*1024*1024,windowsHide:true});
  if(!tried.error&&tried.status===0&&/<page /.test(tried.stdout)){result=tried;break;}
  failures.push(command+': '+(tried.error?.message??(tried.stderr||'').split(String.fromCharCode(10),1)[0]).trim());
 }
 if(!result)throw Error('PDF geometry validation requires Poppler pdftotext with -bbox (or BOOKLET_PDF_PYTHON with PyMuPDF). Tried: '+failures.join('; '));
 const pages=[];
 for(const match of result.stdout.matchAll(/<page width="([\d.]+)" height="([\d.]+)">([\s\S]*?)<\/page>/g)){
  const width=Number(match[1]),height=Number(match[2]),words=[...match[3].matchAll(/<word xMin="([\d.-]+)" yMin="([\d.-]+)" xMax="([\d.-]+)" yMax="([\d.-]+)">([\s\S]*?)<\/word>/g)].map(m=>({left:+m[1],top:+m[2],right:+m[3],bottom:+m[4],text:m[5]}));
  const anchors=words.filter(w=>w.top>height-42&&(/MrDingMaths|^Page$|^Source$/.test(w.text)||(w.text==='/'&&w.left>width-100)));
  const footer=words.filter(w=>anchors.some(a=>Math.abs(a.top-w.top)<3)),body=words.filter(w=>!footer.includes(w));
  const issues=body.filter(w=>w.left<-.5||w.right>width+.5||w.top<-.5||w.bottom>height+.5).map(w=>({kind:'pdf-page-overflow',text:w.text}));
  const clearanceMm=footer.length&&body.length?(Math.min(...footer.map(w=>w.top))-Math.max(...body.map(w=>w.bottom)))*25.4/72:null;
  if(clearanceMm!==null&&clearanceMm<3)issues.push({kind:'pdf-footer-clearance',clearanceMm});
  pages.push({page:pages.length+1,clearanceMm,issues});
 }
 if(!pages.length)throw Error('PDF geometry validation returned no pages');
 return pages;
}
