import { logicalUnits, flowEditionSections } from './booklet-flow.js';
import { resolveArrangement, arrangementCatalog } from './booklet-arrangement.js';
import {paginateCompactAnswers} from './booklet-answer-pagination.js';
import {paragraphSlice} from './booklet-document-fragments.js';
import {paginationReuse,samePageCarry} from './booklet-pagination-cache.js';

const copy = v => JSON.parse(JSON.stringify(v));
const descendants = node => [node.id,...(node.children ?? []).flatMap(descendants)];
const refs = n => n.type === 'item' ? [n.ref] : (n.children ?? []).flatMap(refs);

// Safe cuts are structural: complete rows and dependency groups remain atomic.
export function questionSplitGroups(block, layouts={}) {
  if (block.flow?.keepTogether || block.pairedBlockId) return [];
  let node = block.content;
  while (node?.children?.length === 1 && !(node.questionDiagrams?.length) && !node.representations) node = node.children[0];
  if (!node?.children?.length || ((node.questionDiagrams?.length||node.sharedSolutionDiagrams?.length) && !block.flow?.repeatSharedDiagram) || node.representations) return [];
  const children = node.children, groups = children.map(c => descendants(c));
  const owner = new Map(groups.flatMap((ids,i) => ids.map(id => [id,i])));
  const joined = new Set();
  const join = indexes => {const sorted=[...new Set(indexes)].sort((a,b)=>a-b);for(let i=sorted[0];i<sorted.at(-1);i++)joined.add(i);};
  const arrangement = resolveArrangement(block,layouts[block.id]?.arrangement).tree;
  const scan = n => {if(n.direction === 'row')join(refs(n).map(ref=>owner.get(ref.split('/')[0])).filter(i=>i!==undefined));for(const child of n.children??[])scan(child);};
  scan(arrangement.root);
  const dependencies = n => {if(n.dependsOn?.length)join([owner.get(n.id),...n.dependsOn.map(id=>owner.get(id))].filter(i=>i!==undefined));for(const c of n.children??[])dependencies(c);};
  dependencies(node);
  const result=[];
  children.forEach((c,i)=>{if(i&&joined.has(i-1))result.at(-1).push(c.id);else result.push([c.id]);});
  return result.length>1 ? result.map(ids=>({parentId:node.id,ids})):[];
}

export function fragmentQuestion(block, groups, continuation=0) {
  const next=copy(block), targetId=groups[0].parentId, ids=new Set(groups.flatMap(g=>g.ids));
  const visit=n=>{if(n.id===targetId)n.children=n.children.filter(c=>ids.has(c.id));else n.children?.forEach(visit);};
  visit(next.content);
  next.flow={...next.flow,fragment:continuation};
  if(continuation!==(block.flow?.fragment??0)){
    next.flow.hideRepeatedStem=true;
    next.flow.sourceContinuationLabel=false;next.flow.sourcePageBreakBefore=false;next.flow.pageBreakBefore=false;
    delete next.flow.exerciseHeadingBefore;
    if(typeof next.content?.prompt==='string'&&/^Question \d+ continued\.?$/i.test(next.content.prompt))next.content.prompt='';
  }
  return next;
}

const fragmentLayoutCache=new WeakMap();
export function fragmentLayouts(blocks, layouts={}) {
  let byBlocks=fragmentLayoutCache.get(layouts);if(!byBlocks){byBlocks=new WeakMap();fragmentLayoutCache.set(layouts,byBlocks);}
  if(byBlocks.has(blocks))return byBlocks.get(blocks);
  const result={...layouts};
  for(const block of blocks){
    const stored=layouts[block.id]?.arrangement;
    if(!stored)continue;
    const allowed=arrangementCatalog(block).entries;
    const missing=n=>n.type==='item'?!allowed.has(n.ref):n.children.some(missing);
    if(!missing(stored.root))continue;
    const prune=n=>{
      if(n.type==='item')return allowed.has(n.ref)?copy(n):null;
      const children=n.children.map(prune).filter(Boolean);
      // Empty columns in a saved arrangement reserve intentional layout space.
      // Remove only groups emptied by this fragment's missing content.
      return n.children.length&&!children.length?null:{...n,children};
    };
    result[block.id]={...layouts[block.id],arrangement:{...stored,root:prune(stored.root)??{...stored.root,children:[]}}};
  }
  byBlocks.set(blocks,result);return result;
}

export function makeFlowPage(section,blocks,index=0,reason='section') {
  return {id:`${section.id}:page-${index}`,pageNumber:index+1,section,blocks,mode:section.mode,flexible:true,breakReason:reason,
    isCover:section.mode==='student'&&section.phase==='front-matter'&&(section.isCover===true||blocks.some(b=>b.sourcePageNumber===1)),
    continuation:0};
}

// measure(page) returns height of the actual main children and available body
// capacity at print width. It must settle fonts, images and diagrams first.
const combinedSnapshots=new WeakMap(),combinedBodies=new WeakMap();
function combinedPageBody(page,answerMode){
 if(page.mode!=='student')return page.blocks;
 let modes=combinedBodies.get(page.blocks);if(!modes){modes=new Map();combinedBodies.set(page.blocks,modes);}
 if(!modes.has(answerMode))modes.set(answerMode,page.blocks.map(block=>block.flow?.exerciseNumber?{...block,flow:{...block.flow,answerMode}}:block));return modes.get(answerMode);
}
export async function paginateFlow(project,edition,measure,{cancelled=()=>false,onprogress=()=>{},previous=null,context=''}={}) {
  if(project.settings.compactAnswers&&edition!=='student'){
    const prior=combinedSnapshots.get(previous);
    const answers=await paginateCompactAnswers(project,edition,measure,{cancelled,previous:prior?.answers??previous,context,onprogress:p=>onprogress({...p,phase:edition.includes('short')?'short answers':'worked solutions'})});
    if(!edition.startsWith('with-'))return answers;
    const student=await paginateFlow(project,'student',measure,{cancelled,previous:prior?.student,context,onprogress:p=>onprogress({...p,phase:'questions'})});
    // Cross-edition links are derived after both maps are complete.
    const answerMode=edition.includes('short')?'short':'worked';
    const pages=[...student.pages,...answers.pages].map(p=>({...p,blocks:combinedPageBody(p,answerMode)}));
    pages.forEach((p,i)=>{p.pageNumber=i+1;p.totalPages=pages.length;});
    const result={pages,issues:[...student.issues,...answers.issues],edition};combinedSnapshots.set(result,{student,answers});return result;
  }
  const editionSections=flowEditionSections(project,edition),sections=[],pages=[],issues=[],seenTopics=new Set();
  const sectionById=new Map(editionSections.map(s=>[s.id,s]));
  for(const section of editionSections){
    const previous=sections.at(-1);
    if(section.mode==='student'&&section.pageBreakBefore===false&&previous?.mode===section.mode&&previous.topicId===section.topicId)previous.blocks.push(...section.blocks);
    else sections.push({...section,blocks:[...section.blocks]});
  }
  const layouts=project.settings.layoutOverrides.blockLayouts ?? {};
  const reuse=paginationReuse(project,edition,previous,context);
  const check=()=>{if(cancelled())throw Object.assign(Error('Pagination superseded'),{cancelled:true});};
  for(let sectionIndex=0;sectionIndex<sections.length;sectionIndex++){
    check();const section=sections[sectionIndex];
    if(!section.blocks.length)continue;
    let current=[],reason='section',continuation=0;
    const topicKey=JSON.stringify([section.mode,section.phase==='front-matter'?section.sourceSectionId:section.topicId??section.sourceSectionId]);
    // Heading space is part of measurement: only the first page of a topic
    // carries its title, and only the first page of a section carries its tier.
    // Keep the section metadata on every page for navigation and the contents.
    const pageFor=blocks=>({...makeFlowPage(sectionById.get(`${blocks[0]?.flow?.sectionId}:${section.mode}`)??section,blocks,pages.length,reason),continuation,
      showTopicHeading:!seenTopics.has(topicKey),showDifficultyHeading:continuation===0});
    const flush=()=>{if(current.length){pages.push(pageFor(current));seenTopics.add(topicKey);continuation++;current=[];}reason='overflow';};
    const fits=async blocks=>{check();const value=await measure(pageFor(blocks));check();return value;};
    const units=logicalUnits({sections:[section]});
    const groupStart=pages.length,issueStart=issues.length;
    const cached=reuse.get(section.id,section,units,seenTopics.has(topicKey));
    const appendPages=items=>items.forEach(p=>pages.push({...p,id:`${p.section.id}:page-${pages.length}`,pageNumber:pages.length+1}));
    if(cached.unchanged){appendPages(cached.prior.pages);issues.push(...cached.prior.issues);if(cached.prior.seenTopic)seenTopics.add(topicKey);Object.assign(cached.entry,cached.prior);onprogress({complete:sectionIndex+1,total:sections.length,pages:pages.length,reused:cached.prior.pages.length});continue;}
    const retain=()=>{cached.entry.pages=pages.slice(groupStart);cached.entry.issues=issues.slice(issueStart);cached.entry.seenTopic=seenTopics.has(topicKey);};
    if(pageFor(section.blocks).isCover){current=section.blocks;flush();retain();continue;}
    let begin=0;
    // Resume before the first changed logical unit. Its preceding partial page
    // stays in the carry, so keep-with-next and safe question fragments still fit.
    const resume=cached.prior?.checkpoints.filter(c=>c.index<=cached.first).at(-1);
    if(resume){begin=resume.index;appendPages(cached.prior.pages.slice(0,resume.pageCount));issues.push(...cached.prior.issues.slice(0,resume.issueCount));current=[...resume.current];continuation=resume.continuation;reason=resume.reason;if(resume.seenTopic)seenTopics.add(topicKey);cached.entry.checkpoints=cached.prior.checkpoints.filter(c=>c.index<begin);}
    const add=async (blocks,force=false)=>{
      check();
      // A source continuation is one editing unit, but its first fragment may
      // share the current page. Honour any internal imported/manual boundaries.
      if(blocks.length>1&&(blocks.some(b=>b.flow?.continuationOf||b.continuationOf)&&!blocks.some(b=>b.flow?.keepTogether||b.flow?.keepWithNext||b.pairedBlockId)||blocks.slice(1).some(b=>b.flow?.pageBreakBefore||section.mode==='student'&&b.flow?.sourcePageBreakBefore&&b.flow?.pageBreakBefore!==false))){
        for(let i=0;i<blocks.length;i++)await add([blocks[i]],force&&i===0);return;
      }
      if(blocks.length===1&&blocks[0].flow?.continueBefore){
        const b=blocks[0],groups=questionSplitGroups(b,layouts),at=groups.findIndex(g=>g.ids.includes(b.flow.continueBefore));
        if(at>0){const left=fragmentQuestion(b,groups.slice(0,at)),right=fragmentQuestion(b,groups.slice(at),1);left.flow.continueBefore=null;right.flow.continueBefore=null;await add([left]);flush();reason='manual';await add([right]);return;}
        issues.push({kind:'unsafe-continuation',id:b.id,message:'The continuation point crosses a row or dependency. Choose a safe part boundary.'});
        blocks=[{...b,flow:{...b.flow,continueBefore:null}}];
      }
      if(force||blocks[0]?.flow?.pageBreakBefore||section.mode==='student'&&blocks[0]?.flow?.sourcePageBreakBefore&&blocks[0]?.flow?.pageBreakBefore!==false){flush();reason='manual';}
      let size=await fits([...current,...blocks]);
      if(size.height<=size.capacity+.2){current.push(...blocks);return;}
      // The trial may use a page's remaining space at an established safe part
      // boundary, rather than moving the entire next question to a fresh page.
      if(current.length&&project.settings.exerciseOrganisation==='topic'&&blocks.length===1&&blocks[0].type==='question'){
        const block=blocks[0],groups=questionSplitGroups(block,layouts);
        let best=0,low=1,high=groups.length-1;
        while(low<=high){const count=Math.floor((low+high)/2),fragment=fragmentQuestion(block,groups.slice(0,count),block.flow?.fragment??0);const measured=await fits([...current,fragment]);if(measured.height<=measured.capacity+.2){best=count;low=count+1;}else high=count-1;}
        if(best){current.push(fragmentQuestion(block,groups.slice(0,best),block.flow?.fragment??0));flush();await add([fragmentQuestion(block,groups.slice(best),(block.flow?.fragment??0)+1)]);return;}
      }
      if(current.length){flush();size=await fits(blocks);}
      if(size.height<=size.capacity+.2){current=blocks;return;}
      // Teaching atoms and pre-existing source continuation chains can break
      // between their complete blocks, retaining the shared atom heading.
      if(blocks.length>1&&!blocks.some(b=>b.flow?.keepTogether||b.flow?.keepWithNext||b.pairedBlockId)){
        for(const b of blocks)await add([b]);return;
      }
      const block=blocks[0];
      const groups=blocks.length===1&&block.type==='question'?questionSplitGroups(block,layouts):[];
      if(groups.length){
        let offset=0,part=block.flow?.fragment??0;
        while(offset<groups.length){
          let best=0,low=1,high=groups.length-offset;
          while(low<=high){const count=Math.floor((low+high)/2),fragment=fragmentQuestion(block,groups.slice(offset,offset+count),part);const measured=await fits([fragment]);if(measured.height<=measured.capacity+.2){best=count;low=count+1;}else high=count-1;}
          if(!best){const fragment=fragmentQuestion(block,[groups[offset]],part);await add([fragment]);best=1;}
          else current=[fragmentQuestion(block,groups.slice(offset,offset+best),part)];
          offset+=best;part++;if(offset<groups.length)flush();
        }
        return;
      }
      // Paragraphs (including whole equation/table blocks) are safe boundaries.
      const document=block.content?.format==='maths-editor-document-v1'?block.content:null;
      const stored=layouts[block.id]?.arrangement;
      const hasRow=n=>n?.direction==='row'||(n?.children??[]).some(hasRow);
      if(blocks.length===1&&!block.flow?.keepTogether&&!stored&&document?.blocks.length===1&&document.blocks[0].type==='paragraph'&&!document._bookletSlice){
        const text=document.blocks[0].inlines.map(i=>i.type==='text'?i.text:'\ufffc').join('');
        const ends=[...text.matchAll(/\s+/g)].map(m=>m.index+m[0].length);if(ends.at(-1)!==text.length)ends.push(text.length);
        let start=0,part=block.flow?.fragment??0;
        while(start<text.length){const candidates=ends.filter(n=>n>start);let lo=0,hi=candidates.length-1,best=-1;
          const fragment=end=>({...block,content:paragraphSlice(document,start,end),flow:{...block.flow,fragment:part}});
          while(lo<=hi){const mid=Math.floor((lo+hi)/2),measured=await fits([fragment(candidates[mid])]);if(measured.height<=measured.capacity+.2){best=mid;lo=mid+1;}else hi=mid-1;}
          if(best<0){await add([fragment(text.length)]);return;}
          current=[fragment(candidates[best])];start=candidates[best];part++;if(start<text.length)flush();
        }
        if(text.length)return;
      }
      if(blocks.length===1&&!block.flow?.keepTogether&&!hasRow(stored?.root)&&document?.blocks.length>1){
        let part=block.flow?.fragment??0;
        for(const paragraph of document.blocks){await add([{...block,content:{...document,blocks:[paragraph]},flow:{...block.flow,fragment:part++}}]);flush();}
        return;
      }
      if(blocks.length===1&&!block.flow?.keepTogether&&!stored){
        const paragraphs=typeof block.content==='string'?block.content.split(/\n\s*\n/):[];
        const examples=block.type==='worked-example'&&block.presentation?.layout!=='columns'?block.examples??[]:[];
        const fragments=paragraphs.length>1?paragraphs.map(content=>({...block,content})):examples.length>1?examples.map(example=>({...block,examples:[example]})):[];
        if(fragments.length){for(let i=0;i<fragments.length;i++){await add([{...fragments[i],flow:{...block.flow,fragment:i}}]);flush();}return;}
      }
      issues.push({kind:'oversized-content',id:block.id,sectionId:section.sourceSectionId,message:'Content has no safe page break. Add a continuation point or adjust its arrangement/working space.'});
      current=blocks;flush();
    };
    for(let i=begin;i<units.length;i++){
      const checkpoint={index:i,pageCount:pages.length-groupStart,issueCount:issues.length-issueStart,current:[...current],continuation,reason,seenTopic:seenTopics.has(topicKey)};
      const oldCheckpoint=cached.prior?.checkpoints.find(c=>c.index===i);
      if(i>begin&&oldCheckpoint&&cached.suffix(i)&&continuation===oldCheckpoint.continuation&&reason===oldCheckpoint.reason&&checkpoint.seenTopic===oldCheckpoint.seenTopic&&samePageCarry(current,oldCheckpoint.current)){
        appendPages(cached.prior.pages.slice(oldCheckpoint.pageCount));issues.push(...cached.prior.issues.slice(oldCheckpoint.issueCount));cached.entry.checkpoints.push(...cached.prior.checkpoints.filter(c=>c.index>=i));current=[];break;
      }
      cached.entry.checkpoints.push(checkpoint);
      const unit=units[i];
      if(unit.blocks[0].type==='page-break'){flush();reason='manual';continue;}
      const blocks=[...unit.blocks];
      while(blocks.at(-1)?.flow?.keepWithNext&&i+1<units.length&&units[i+1].blocks[0].type!=='page-break')blocks.push(...units[++i].blocks);
      // Existing continuation labels are presentation only. Preserve source text.
      for(let j=0;j<blocks.length;j++)if(blocks[j].flow?.continuationOf||blocks[j].continuationOf){blocks[j]={...blocks[j],content:{...blocks[j].content,prompt:typeof blocks[j].content?.prompt==='string'&&/^Question \d+ continued\.?$/i.test(blocks[j].content.prompt)?blocks[j].flow?.sourceContinuationLabel?blocks[j].content.prompt.replace(/\d+/,blocks[j].flow.displayNumber??blocks[j].sourceOrder):'':blocks[j].content?.prompt},flow:{...blocks[j].flow,fragment:j||1}};}
      await add(blocks);
    }
    flush();retain();onprogress({complete:sectionIndex+1,total:sections.length,pages:pages.length});
  }
  pages.forEach((p,i)=>{p.pageNumber=i+1;p.totalPages=pages.length;p.section=sectionById.get(p.section.id)??p.section;});
  return reuse.finish({pages,issues,edition});
}
