import {normalizeDocument,paragraph,uid,safeLink} from './document-model.mjs';

export function plainTextDocument(text){return normalizeDocument({blocks:String(text).replace(/\r\n?/g,'\n').split('\n').map(line=>paragraph([{type:'text',text:line,marks:[]}]))});}

/** Read a constrained Word/browser clipboard vocabulary. Never insert clipboard DOM. */
export function readClipboard(data,{plain=false}={}){
  const text=data.getData('text/plain');if(plain)return {document:plainTextDocument(text),unsupported:[]};
  const rich=data.getData('application/x-maths-editor+json');if(rich)return {document:normalizeDocument(JSON.parse(rich)),unsupported:[]};
  const html=data.getData('text/html');if(!html)return {document:plainTextDocument(text),unsupported:[]};
  const body=new DOMParser().parseFromString(html,'text/html').body;
  const encoded=body.querySelector('[data-maths-document]')?.dataset.mathsDocument;
  if(encoded)return {document:normalizeDocument(JSON.parse(encoded)),unsupported:[]};
  const unsupported=[];
  if(/<(?:m:)?oMath\b|<(?:m:)?oMathPara\b|<math\b|equation\.\d|mso-element:equation/i.test(html))unsupported.push('Word equations');
  if(body.querySelector('object,embed,iframe,svg,canvas')||/<(?:v:shape|o:oleobject)\b/i.test(html))unsupported.push('embedded objects');
  if(body.querySelector('img'))unsupported.push('images');
  if(body.querySelector('table table'))unsupported.push('nested tables');
  body.querySelectorAll('script,style,meta,link,object,embed,iframe,svg,canvas').forEach(n=>n.remove());
  const inline=(node,marks=[],href)=>{
    if(node.nodeType===3)return node.textContent?[{type:'text',text:node.textContent,marks,...(href?{href}:{})}]:[];
    if(node.nodeType!==1)return [];
    if(node.tagName==='BR')return [{type:'break'}];
    if(node.tagName==='IMG')return [];
    const next=new Set(marks),style=node.style;
    if(['STRONG','B'].includes(node.tagName)||style.fontWeight==='bold'||Number(style.fontWeight)>=600)next.add('bold');
    if(['EM','I'].includes(node.tagName)||style.fontStyle==='italic')next.add('italic');
    if(node.tagName==='U'||style.textDecoration.includes('underline'))next.add('underline');
    const link=node.tagName==='A'?safeLink(node.getAttribute('href')):href;
    return [...node.childNodes].flatMap(n=>inline(n,[...next],link));
  };
  const blocks=root=>{
    const result=[];let run=[];const flush=()=>{if(run.some(i=>i.type!=='text'||i.text.trim()))result.push(paragraph(run));run=[];};
    for(const node of root.childNodes){
      if(node.nodeType!==1){run.push(...inline(node));continue;}
      if(node.matches('ul,ol')){flush();result.push({id:uid(),type:'list',ordered:node.tagName==='OL',start:Number(node.getAttribute('start')??1),items:[...node.children].filter(n=>n.tagName==='LI').map(li=>({id:uid(),type:'list-item',blocks:blocks(li)}))});}
      else if(node.tagName==='TABLE'){flush();result.push({id:uid(),type:'table',rows:[...node.rows].map(row=>[...row.cells].map(cell=>({id:uid(),type:'cell',header:cell.tagName==='TH',colspan:cell.colSpan,rowspan:cell.rowSpan,blocks:blocks(cell)})))});}
      else if(node.matches('p,h1,h2,h3,h4,h5,h6')){
        flush();const inlines=inline(node);if(/mso-list\s*:/i.test(node.getAttribute('style')??'')){
          const raw=node.textContent,ordered=/^\s*\d+[.)]/.test(raw);let list=result.at(-1);if(list?.type!=='list'||list.ordered!==ordered){list={id:uid(),type:'list',ordered,items:[]};result.push(list);}const first=inlines.find(i=>i.type==='text');if(first)first.text=first.text.replace(/^\s*(?:\d+[.)]|[•·▪o])\s*/, '');list.items.push({id:uid(),type:'list-item',blocks:[paragraph(inlines)]});
        }else result.push(paragraph(inlines));
      }else if(node.matches('div,section,article,main,blockquote,li')){flush();result.push(...blocks(node));}
      else run.push(...inline(node));
    }flush();return result.length?result:[paragraph()];
  };
  return {document:normalizeDocument({blocks:blocks(body)}),unsupported,text:text||body.textContent};
}
