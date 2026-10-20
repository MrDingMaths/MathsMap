// Source margin cross-references are evidence, not printed question content.
const number=String.raw`\d+[a-z]?(?:\([a-z0-9]+\))?`;
const list=String.raw`${number}(?:\s*(?:,\s*(?:and\s+)?|and\s+|[–—-]\s*)(?:${number}|[a-z]))*`;
const reference=String.raw`Examples?\s+${list}`;
const only=new RegExp(String.raw`^\s*(?:(?:see\s+)?${reference}(?:\s*:\s*[a-z](?:[–—-][a-z])?)?\s*[.;]?\s*)+$`,'i');
const parenthetical=new RegExp(String.raw`\s*\(\s*(?:see\s+)?${reference}\s*\)`,'gi');
const sentence=new RegExp(String.raw`(^|[.!?]\s+)${reference}\.(?=\s|$)`,'g');
const asIn=new RegExp(String.raw`\bAs in ${reference},\s*`,'g');
const referTo=new RegExp(String.raw`\s*(?:Refer to|See) ${reference}\.?\s*$`,'gim');
const trailingAsIn=new RegExp(String.raw`,\s*as in ${reference}\.`,'gi');
export function stripExampleCueText(value){
 if(typeof value!=='string')return value;
 let next=value.split('\n').filter(line=>!only.test(line)).join('\n').replace(parenthetical,'').replace(sentence,'$1').replace(asIn,'').replace(referTo,'').replace(trailingAsIn,'.');
 if(next===value)return value;
 return next.replace(/\n[ \t]*\n(?:[ \t]*\n)+/g,'\n\n').replace(/[ \t]+([:;,.!?])/g,'$1').trim();
}
export function omitSourceExampleCues(project){
 const next=structuredClone(project),changes=[],removedParagraphIds=[],metadataChanges=[];
 function visit(value,blockId,path){
  if(!value||typeof value!=='object')return;
  if(value.format==='tikz'||value.type==='math'||value.type==='worked-example')return;
  if(Array.isArray(value)){for(let i=value.length-1;i>=0;i--){const child=value[i];if(child?.type==='paragraph'&&child.inlines?.length&&child.inlines.every(x=>x.type==='text'||x.type==='break')){const text=child.inlines.map(x=>x.type==='text'?x.text:'\n').join('');if(only.test(text)){changes.push({blockId,path:path+'/'+i,original:text,corrected:''});if(child.id)removedParagraphIds.push(child.id);value.splice(i,1);continue;}}visit(child,blockId,path+'/'+i);}return;}
  for(const [key,child] of Object.entries(value)){
   if(['source','sourceReview','sourceInventory','sourceRefs','sourceLayoutEvidence','provenance','spec','originalContent','originalDiagram','code','latex'].includes(key))continue;
   if(typeof child==='string'&&['prompt','text','short','worked','question_text','instructions'].includes(key)){const corrected=stripExampleCueText(child);if(corrected!==child){value[key]=corrected;changes.push({blockId,path:path+'/'+key,original:child,corrected});}}
   else if(child&&typeof child==='object')visit(child,blockId,path+'/'+key);
  }
 }
 for(const section of next.sections??[])for(const block of section.blocks??[])if(block.type==='question'&&!block.pedagogyRole)visit(block.content,block.id,'/content');
 // Do not silently break a manually arranged paragraph reference.
 const removed=new Set(removedParagraphIds);
 function check(value){if(!value||typeof value!=='object')return;if(value.type==='item'&&typeof value.ref==='string'&&removed.has(value.ref.split('#').at(-1)))throw Error('Example cue has an explicit arrangement reference: '+value.ref);for(const child of Object.values(value))check(child);}
 check(next.settings?.layoutOverrides);for(const section of next.sections??[])for(const block of section.blocks??[])check(block.presentation);
 // This is the derived display inventory, not the original inventory packet.
 // Explicitly account for an omitted margin cue rather than leaving a missing
 // source mapping after its native paragraph has been removed.
 for(const [index,entry]of (next.source?.inventory?.entries??[]).entries()){
  const reference=removedParagraphIds.includes(entry.targetId)||typeof entry.description==='string'&&only.test(entry.description)||
   typeof entry.sourceLabel==='string'&&only.test(entry.sourceLabel)&&/\b(?:margin|reference|cross-reference)\b/i.test(entry.description??'');
  if(entry.exclusionReason||!entry.embeddedInQuestion||!['teaching','example'].includes(entry.kind)||!reference)continue;
  entry.exclusionReason='Source example-reference cue omitted from printed questions at the user’s request (18 October 2026); original source evidence retained.';
  metadataChanges.push({path:'/source/inventory/entries/'+index+'/exclusionReason',entryId:entry.id});
 }
 return {project:next,changes,metadataChanges,blockIds:[...new Set(changes.map(x=>x.blockId))]};
}
