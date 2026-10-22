// Page-side reader for source-match: what a reader sees in each teaching block,
// as the geometry the structural signature is built from. The function runs inside
// the page (render-geometry.mjs serialises it), so it must stay self-contained.
//
// Per block id it records, in millimetres from the page's top-left (0.1 mm):
//   words   text items: one per text node inside a formula (a KaTeX leaf), one per
//           word elsewhere; {t,x,y,w,h,b:bold,c:colour,m:1 inside a formula}
//   rules   fraction bars, as zero-height rects
//   figures diagrams and pictures large enough to carry content
//   items   list-item starts (a list marker is not a text node)
//   arrows  arrows drawn by table annotations and annotated equations:
//           {source,start,end,mid,heads,curved,label,target?}
// A block's text is found by climbing from each node to the nearest element whose
// id is one of the block's node ids (`idToBlock`).
export function inkGeometry(element,{idToBlock}){
 const paper=element.querySelector('.booklet-page')??element,paperRect=paper.getBoundingClientRect();
 const k=paperRect.width?210/paperRect.width:0,mm=value=>Math.round(value*k*10)/10;
 const box=r=>({x:mm(r.left-paperRect.left),y:mm(r.top-paperRect.top),w:mm(r.width),h:mm(r.height)});
 const ownerOf=el=>{
  for(let n=el;n&&n!==element;n=n.parentElement){
   const d=n.dataset;if(!d)continue;
   for(const id of [d.editRoot,d.questionId,d.nodeId,d.id,d.diagramId,d.exampleId,d.contentOwner,d.arrangementBlock])if(id&&idToBlock[id])return idToBlock[id];
   if(d.documentGroup)for(const id of d.documentGroup.split(/\s+/))if(idToBlock[id])return idToBlock[id];
  }
  return null;
 };
 // The paragraph (or the nearest node) a piece of text belongs to, so a repair can name it.
 const nodeOf=el=>{const n=el.closest('[data-id],[data-node-id],[data-question-id]');return n?(n.dataset.id??n.dataset.nodeId??n.dataset.questionId):null;};
 const hex=css=>{const m=/rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)/.exec(css||'');return m?'#'+[m[1],m[2],m[3]].map(v=>Math.round(Number(v)).toString(16).padStart(2,'0')).join(''):null;};
 const out={},slot=id=>out[id]??={words:[],rules:[],figures:[],items:[],arrows:[]};
 const walker=document.createTreeWalker(element,NodeFilter.SHOW_TEXT);
 for(let node=walker.nextNode();node;node=walker.nextNode()){
  const parent=node.parentElement;if(!parent||!node.textContent.trim())continue;
  if(parent.closest('.katex-mathml,script,style,[data-diagram-id],.tikz-wrap,button,.accent-header,.numbered-content > b'))continue;
  if(parent.closest('svg')&&!parent.closest('[data-table-annotations]'))continue;
  const block=ownerOf(parent);if(!block)continue;
  const css=getComputedStyle(parent);
  if(css.visibility==='hidden'||css.display==='none')continue;
  const bold=Number(css.fontWeight)>=600||css.fontWeight==='bold',colour=hex(css.color),inMath=!!parent.closest('.katex-html');
  const text=node.textContent,pieces=[];
  if(inMath)pieces.push({s:0,e:text.length});
  else for(const m of text.matchAll(/\S+/g))pieces.push({s:m.index,e:m.index+m[0].length});
  for(const piece of pieces){
   const range=document.createRange();range.setStart(node,piece.s);range.setEnd(node,piece.e);
   const rect=[...range.getClientRects()].find(r=>r.width>.3&&r.height>.3);if(!rect)continue;
   const t=text.slice(piece.s,piece.e).trim();if(!t)continue;
   slot(block).words.push({t,...box(rect),b:bold,c:colour,m:inMath?1:0,n:nodeOf(parent)});
  }
 }
 // A cloze or outlined maths box prints no text but occupies the line, as dots do in the source.
 for(const el of element.querySelectorAll('[data-cloze],.fbox')){
  if(el.closest('.katex-mathml,.accent-header'))continue;
  const block=ownerOf(el);if(!block)continue;
  const r=el.getBoundingClientRect();if(r.width<.5||r.height<.5)continue;
  slot(block).words.push({t:el.matches('.fbox')?'□':'…',...box(r),b:false,c:null,m:el.matches('.fbox')?1:0,blank:1,n:nodeOf(el)});
 }
 for(const li of element.querySelectorAll('li')){
  const block=ownerOf(li);if(!block)continue;
  const r=li.getBoundingClientRect();
  slot(block).items.push({...box({left:r.left,top:r.top,width:r.width,height:Math.min(r.height,40)}),ordered:li.parentElement?.tagName==='OL',n:nodeOf(li)});
 }
 // Generated markers (step numbers, part labels) are ::before content, not text nodes.
 for(const el of element.querySelectorAll('*')){
  if(el.closest('svg,.katex,.katex-html,.accent-header'))continue;
  const content=getComputedStyle(el,'::before').content;
  if(!content||content==='none'||content==='normal')continue;
  const text=content.replace(/^["']|["']$/g,'').trim();
  if(!/^(?:\d{1,2}|[a-z]|[ivxlc]{1,4})[.)]?$|^[•●▪◦]$/i.test(text))continue;
  const block=ownerOf(el);if(!block)continue;
  const r=el.getBoundingClientRect();if(r.width<.5&&r.height<.5)continue;
  slot(block).items.push({...box({left:r.left,top:r.top,width:r.width,height:Math.min(r.height,40)}),ordered:true,generated:text});
 }
 for(const el of element.querySelectorAll('.frac-line')){
  const block=ownerOf(el);if(!block)continue;
  const r=el.getBoundingClientRect();if(r.width<.5)continue;
  slot(block).rules.push(box({left:r.left,top:r.top+r.height/2,width:r.width,height:0}));
 }
 for(const el of element.querySelectorAll('[data-diagram-id],.tikz-wrap,img')){
  if(el.matches('.tikz-wrap')&&el.closest('[data-diagram-id]'))continue;
  const block=ownerOf(el);if(!block)continue;
  const b=box(el.getBoundingClientRect());if(b.w*b.h<150)continue;
  slot(block).figures.push({...b,kind:el.tagName==='IMG'?'image':'diagram',id:el.dataset.diagramId??null});
 }
 // A path's ends are measured through its own transform.
 const ends=path=>{
  const m=path.getScreenCTM(),len=path.getTotalLength?path.getTotalLength():0;if(!m)return null;
  const at=distance=>{const p=path.getPointAtLength(distance),q=new DOMPoint(p.x,p.y).matrixTransform(m);return [mm(q.x-paperRect.left),mm(q.y-paperRect.top)];};
  return {start:at(0),end:at(len),mid:at(len/2)};
 };
 for(const svg of element.querySelectorAll('[data-table-annotations]')){
  const table=svg.parentElement?.querySelector('table'),block=ownerOf(table??svg);if(!block)continue;
  for(const group of svg.querySelectorAll('g[data-annotation-id]')){
   const paths=[...group.querySelectorAll('path')].filter(p=>p.getAttribute('stroke')!=='transparent');
   const line=paths.find(p=>p.getAttribute('fill')==='none'),heads=paths.filter(p=>p!==line&&p.getAttribute('fill')!=='none');
   if(!line)continue;
   const geometry=ends(line);if(!geometry)continue;
   // The tip of a head is its first point; whichever end of the line it is nearer to carries it.
   let atStart=false,atEnd=false;
   for(const head of heads){
    const m=/M\s*([-\d.e]+)[ ,]+([-\d.e]+)/.exec(head.getAttribute('d')||'');if(!m)continue;
    const q=new DOMPoint(Number(m[1]),Number(m[2])).matrixTransform(head.getScreenCTM()),tip=[mm(q.x-paperRect.left),mm(q.y-paperRect.top)];
    if(Math.hypot(tip[0]-geometry.start[0],tip[1]-geometry.start[1])<Math.hypot(tip[0]-geometry.end[0],tip[1]-geometry.end[1]))atStart=true;else atEnd=true;
   }
   const label=(group.querySelector('text')?.textContent??group.querySelector('foreignObject')?.textContent??'').trim();
   slot(block).arrows.push({source:'table',id:group.dataset.annotationId,...geometry,heads:atStart&&atEnd?'both':atStart?'start':'end',curved:/ C /.test(line.getAttribute('d')||''),label,colour:line.getAttribute('stroke')});
  }
 }
 for(const figure of element.querySelectorAll('[data-type="annotated-equation"]')){
  const block=ownerOf(figure);if(!block)continue;
  const svg=figure.querySelector(':scope > [data-equation-arrows]');if(!svg)continue;
  const paths=[...svg.querySelectorAll('path')];let index=0;
  for(const label of figure.querySelectorAll('[data-equation-label]')){
   const target=figure.querySelector('[id="ae-'+figure.dataset.equationInstance+'-'+label.dataset.targetIndex+'"]');
   if(!target||!['arrow','bracket','highlight'].includes(label.dataset.decoration))continue;
   const path=paths[index++];if(!path||label.dataset.decoration!=='arrow')continue;
   const geometry=ends(path);if(!geometry)continue;
   slot(block).arrows.push({source:'equation',...geometry,heads:'end',curved:false,label:label.textContent.trim(),target:target.textContent.trim()});
  }
  for(const connection of JSON.parse(figure.dataset.termConnections||'[]')){
   const path=paths[index++];if(!path||!connection)continue;
   const geometry=ends(path);if(!geometry)continue;
   slot(block).arrows.push({source:'equation',...geometry,heads:'end',curved:true,label:'',target:''});
  }
 }
 return out;
}

// Every node id in a block, keyed to the block, so the page-side reader can attribute text.
export function nodeIdsByBlock(blocks){
 const map={};
 const walk=(node,blockId)=>{
  if(Array.isArray(node)){node.forEach(child=>walk(child,blockId));return;}
  if(!node||typeof node!=='object')return;
  if(typeof node.id==='string')map[node.id]??=blockId;
  for(const [key,child] of Object.entries(node))if(child&&typeof child==='object'&&!['sourceReview','sourceLayoutEvidence','sourceAtom','provenance','spec','classification','bankRef'].includes(key))walk(child,blockId);
 };
 for(const block of blocks)walk(block,block.id);
 return map;
}
