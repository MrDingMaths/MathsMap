import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
const base=path.resolve(process.argv[2]), m=JSON.parse(fs.readFileSync(path.join(base,'benchmark.json'))), keyFile=path.join(base,'review-key.json');
if(!fs.existsSync(keyFile)){const order=m.arms.map(a=>a.id);for(let i=order.length-1;i>0;i--){const j=crypto.randomInt(i+1);[order[i],order[j]]=[order[j],order[i]];}fs.writeFileSync(keyFile,JSON.stringify(Object.fromEntries(order.map((a,i)=>['sample-'+(i+1),a])),null,2));}
const key=JSON.parse(fs.readFileSync(keyFile)),review=path.join(base,'blind-review');fs.mkdirSync(review,{recursive:true});
for(const [label,arm]of Object.entries(key)){
 const candidates=m.packets.flatMap(p=>{const file=path.join(base,'runs',arm,p.id,'candidate.json');return fs.existsSync(file)?JSON.parse(fs.readFileSync(file)).pages??[]:[];});
 fs.writeFileSync(path.join(review,label+'.json'),JSON.stringify({pages:candidates},null,2));
 for(const mode of ['student','short','worked']){const from=path.join(base,'renders',arm,mode),to=path.join(review,label,mode);fs.mkdirSync(to,{recursive:true});if(fs.existsSync(from))for(const f of fs.readdirSync(from))fs.copyFileSync(path.join(from,f),path.join(to,f));}
}
const pages=m.packets.flatMap(p=>p.pages).sort((a,b)=>a-b);
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
const source=path.relative(review,path.resolve('.booklet-work/full-imports',m.sourceRun,'evidence/pages')).replaceAll('\\','/');
const rows=pages.map(n=>{const name='page-'+String(n).padStart(3,'0')+'.png';return `<section id="p${n}"><h2>Source page ${n}</h2><div class="panels"><figure><figcaption>Source</figcaption><a href="${source}/${name}"><img src="${source}/${name}"></a></figure>${Object.keys(key).map(label=>`<figure><figcaption>${label}</figcaption><a data-link="${label}/${name}" href="${label}/student/${name}"><img data-candidate="${label}/${name}" src="${label}/student/${name}"></a></figure>`).join('')}</div></section>`;}).join('');
fs.writeFileSync(path.join(review,'index.html'),`<!doctype html><meta charset="utf-8"><title>Anonymous booklet comparison</title><style>body{font:16px system-ui;background:#eee;margin:20px}header{position:sticky;top:0;background:white;padding:12px;z-index:1}.panels{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}figure{margin:0}img{width:100%;background:white}figcaption{font-weight:700;padding:8px}h2{margin-top:30px}a{color:#185a90}</style><header><b>Anonymous source comparison</b> <select id="mode"><option value="student">Student</option><option value="short">Short answers</option><option value="worked">Worked solutions</option></select> ${pages.map(p=>`<a href="#p${p}">${p}</a>`).join(' · ')}</header><p>Initial outputs; no corrections or acceptance inferred. Click any page to inspect at full size. Missing images indicate unfinished or failed candidates. Source remains student evidence in all modes.</p>${rows}<script>document.querySelector('#mode').onchange=e=>{for(const img of document.querySelectorAll('[data-candidate]')){const[a,n]=img.dataset.candidate.split('/');img.src=a+'/'+e.target.value+'/'+n;img.parentElement.href=img.src;}};</script>`);
console.log('Anonymous review material updated. Model key remains separate.');
