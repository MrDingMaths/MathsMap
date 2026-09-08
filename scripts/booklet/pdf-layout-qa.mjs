import {spawnSync} from 'node:child_process';
// The DOM cannot expose Chromium's final fragmentation of flowing answer sheets.
// Poppler supplies actual printed word bounds, including SVG graph labels.
export function inspectPrintedPdf(file) {
 const result=spawnSync('pdftotext',['-bbox','-enc','UTF-8',file,'-'],{encoding:'utf8',maxBuffer:32*1024*1024,windowsHide:true});
 if(result.error||result.status!==0)throw Error('PDF geometry validation requires Poppler pdftotext: '+(result.error?.message??result.stderr));
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
