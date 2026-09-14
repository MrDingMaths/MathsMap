<script>
  import BookletRichText from './BookletRichText.svelte';
  import {contentExcerpt,startExerciseOnNewPage,setPageBoundary} from '../lib/booklet-workspace.js';
  import {questionDifficulty} from '../lib/booklet-bank-ratings.js';
  import {onMount,untrack} from 'svelte';
  import {logicalUnits,flowNumbers,flowCommand,captureFlowClipboard,flowId,exerciseNumbers} from '../lib/booklet-flow.js';
 import {createProjectBlock,snapshotBankQuestion,normalizeEditableProject} from '../lib/editable-booklet-model.js';
  import {feedbackText} from '../lib/booklet-feedback.js';
  let {project,pages=[],bank=[],onrequestbank=null,onbank=null,onboundary=null,selectedBlockId='',selectedIds=[],onselection=null,documentClipboard=null,onpaste=null,disabled=false,onchange=null,onselect=null,onsection=null,onerror=null}=$props();
  let organising=$state(false),expandedTopic=$state('');
  $effect(()=>{const id=selectedBlockId;const topic=project.sections.find(s=>s.blocks.some(b=>b.id===id))?.topicId;expandedTopic=topic??project.topics[0]?.id??'';});
  const currentTopic=$derived(project.sections.find(s=>s.blocks.some(b=>b.id===selectedBlockId))?.topicId);
  function boundary(id,action){attempt(()=>commit(setPageBoundary(project,id,action)));}

  let selected=$state([]),clipboard=$state.raw(null),destination=$state(''),beforeId=$state(''),blockType=$state('question'),bankId=$state('');
  const numbers=$derived(flowNumbers(project));
  const exercises=$derived(exerciseNumbers(project));
  const projectId=$derived(project.id);
  const units=$derived(logicalUnits(project));
  const selection=$derived(selected.length?selected:selectedBlockId?[selectedBlockId]:[]);
  const availableClipboard=$derived(onselection?documentClipboard:clipboard);
  const target=$derived(project.sections.find(s=>s.id===destination)??project.sections.find(s=>s.blocks.some(b=>b.id===selectedBlockId))??project.sections[0]);
  const label=b=>b.sourceAtom?(b.sourceAtom.label||({definition:'Definition',identify:'Identify','key-ideas':'Key Ideas',example:'Example',review:'Review','guided-practice':'Guided Practice'}[b.sourceAtom.kind])||'Teaching')+(b.sourceAtom.visibleSubtitle?' · '+b.sourceAtom.visibleSubtitle:''):b.type==='question'?`Question ${numbers[b.id]??b.sourceOrder??''}`:b.title||b.label||(({'rich-text':'Text','worked-example':'Example',callout:'Theory','page-break':'Page break',image:'Image'}[b.type]??'Content')+(feedbackText(b.content)?' · '+feedbackText(b.content).replace(/\s+/g,' ').slice(0,45):''));
  $effect(()=>{projectId;clipboard=null;selected=[];destination='';beforeId='';});
  $effect(()=>{const id=selectedBlockId;untrack(()=>{if(id&&!selected.includes(id))selected=[id];});});
  $effect(()=>{selected=[...selectedIds];});
  function attempt(fn){try{if(disabled)return;fn();}catch(e){onerror?.(e.message);}}
  function commit(next){onchange?.(next);}
  function select(unit,checked){selected=checked?[...new Set([...selected,unit.id])]:selected.filter(id=>id!==unit.id);onselection?.(selected);if(checked)onselect?.(unit.blocks[0].id,unit.sectionId);}
  function afterSelection(){const section=project.sections.find(s=>s.blocks.some(b=>selection.includes(b.id)))??target;const ids=new Set(units.filter(u=>u.blocks.some(b=>selection.includes(b.id))).flatMap(u=>u.blocks.map(b=>b.id)));const last=Math.max(-1,...section.blocks.map((b,i)=>ids.has(b.id)?i:-1));return{sectionId:section.id,beforeId:section.blocks[last+1]?.id??null};}
  function command(type){attempt(()=>{
    if(type==='copy'||type==='cut'){clipboard=captureFlowClipboard(project,selection,type);return;}
    if(type==='paste'){if(!clipboard)return;commit(flowCommand(project,{type,clipboard,...afterSelection()}));if(clipboard.mode==='cut')clipboard=null;return;}
    if(type==='move'){commit(flowCommand(project,{type,ids:selection,sectionId:target.id,beforeId:beforeId||null}));return;}
    commit(flowCommand(project,{type,ids:selection,...afterSelection()}));if(type==='delete')selected=[];
  });}
  export function drop(id,sectionId,before){attempt(()=>{if(!id)return;commit(flowCommand(project,{type:'move',ids:selection.includes(id)?selection:[id],sectionId,beforeId:before??null}));});}
  function layout(patch){attempt(()=>commit(flowCommand(project,{type:'layout',ids:selection,patch})));}
  function insert(fromBank=false){attempt(()=>{const block=fromBank?snapshotBankQuestion(bank.find(b=>b.id===bankId)):createProjectBlock(blockType);const next=structuredClone($state.snapshot(project));const s=next.sections.find(s=>s.id===target.id),at=beforeId?s.blocks.findIndex(b=>b.id===beforeId):s.blocks.length;if(at<0)throw Error('Choose an insertion point.');s.blocks.splice(at,0,block);commit(normalizeEditableProject(next));selected=[block.id];onselect?.(block.id,s.id);});}
  function patchSection(id,patch){attempt(()=>{
    if(patch.pageBreakBefore===false&&project.sections.find(s=>s.id===id)?.phase==='practice')patch={...patch,showDifficultyHeading:false};
    if(patch.showDifficultyHeading===true)patch={...patch,pageBreakBefore:true};
    commit({...project,sections:project.sections.map(s=>s.id===id?{...s,...patch}:s)});
  });}
  function newSection(topicId){attempt(()=>{const section={id:flowId(),topicId,title:'Practice',role:'practice',phase:'practice',difficulty:null,blocks:[]};const sections=[...project.sections];const last=sections.findLastIndex(s=>s.topicId===topicId);sections.splice(last+1,0,section);commit({...project,sections});destination=section.id;onsection?.(section.id);});}
  function newTopic(){attempt(()=>{const topic={id:flowId(),title:'New topic'},section={id:flowId(),topicId:topic.id,title:'Teaching',role:'teaching',phase:'teaching',difficulty:null,blocks:[]};commit({...project,topics:[...project.topics,topic],sections:[...project.sections,section]});destination=section.id;});}
  function moveTopic(id,delta){attempt(()=>{const topics=[...project.topics],i=topics.findIndex(t=>t.id===id),to=Math.max(0,Math.min(topics.length-1,i+delta));topics.splice(to,0,...topics.splice(i,1));commit({...project,topics,sections:topics.flatMap(t=>project.sections.filter(s=>s.topicId===t.id))});});}
  function moveSection(id,delta){attempt(()=>{const sections=[...project.sections],i=sections.findIndex(s=>s.id===id),to=i+delta;if(!sections[to]||sections[to].topicId!==sections[i].topicId)return;sections.splice(to,0,...sections.splice(i,1));commit({...project,sections});});}
  function joinPrevious(id){attempt(()=>{const i=project.sections.findIndex(s=>s.id===id);if(i<1)return;if(project.sections[i-1].topicId!==project.sections[i].topicId)throw Error('Assign these sections to the same topic before joining them.');const sections=structuredClone($state.snapshot(project.sections));sections[i-1].blocks.push(...sections[i].blocks);sections.splice(i,1);commit({...project,sections});});}
  function reassignSection(id,topicId){attempt(()=>{const sections=project.sections.map(s=>s.id===id?{...s,topicId}:s);commit({...project,sections:project.topics.flatMap(t=>sections.filter(s=>s.topicId===t.id))});});}
  onMount(()=>{const key=e=>{if(onselection||disabled||e.target.closest('input,textarea,select,[contenteditable=true],.maths-editor,.focused-editor,[role=dialog]'))return;if(e.key==='Escape'){clipboard=null;return;}if((e.ctrlKey||e.metaKey)&&['x','c','v'].includes(e.key.toLowerCase())&&selection.length){e.preventDefault();command({x:'cut',c:'copy',v:'paste'}[e.key.toLowerCase()]);}else if(e.key==='Delete'&&selection.length){e.preventDefault();command('delete');}};window.addEventListener('keydown',key);return()=>window.removeEventListener('keydown',key);});
</script>
<nav class="flow-outline" aria-label="Booklet outline" inert={disabled}>
 <div class="outline-title"><strong>Outline</strong><details class="item-menu"><summary aria-label="Booklet organisation">•••</summary><div><button onclick={newTopic}>Add topic</button></div></details></div>
 {#each project.topics as topic (topic.id)}
  <section class="topic">
   <div class="topic-heading"><button class="topic-toggle" aria-expanded={expandedTopic===topic.id} onclick={()=>expandedTopic=expandedTopic===topic.id?'':topic.id}><span aria-hidden="true">{expandedTopic===topic.id?'▾':'▸'}</span><strong>{exercises[topic.id]?exercises[topic.id]+'. ':''}{topic.title}</strong></button>
    <details class="item-menu"><summary aria-label={'Actions for '+topic.title}>•••</summary><div>
     <label>Topic title<input value={topic.title} onchange={e=>attempt(()=>commit({...project,topics:project.topics.map(t=>t.id===topic.id?{...t,title:e.currentTarget.value||t.title}:t)}))}/></label>
     <button onclick={()=>attempt(()=>commit(startExerciseOnNewPage(project,topic.id)))}>Start exercise on new page</button><button onclick={()=>moveTopic(topic.id,-1)}>Move topic up</button><button onclick={()=>moveTopic(topic.id,1)}>Move topic down</button><button onclick={()=>newSection(topic.id)}>Add section</button>
    </div></details>
   </div>
   {#if expandedTopic===topic.id}
    {#each project.sections.filter(s=>s.topicId===topic.id) as section (section.id)}
     <div class="section" ondragover={e=>e.preventDefault()} ondrop={e=>{e.preventDefault();drop(e.dataTransfer.getData('application/x-booklet-block'),section.id,null);}} role="group" aria-label={section.title}>
      <div class="section-heading"><button onclick={()=>{destination=section.id;onsection?.(section.id);}}>{section.phase==='practice'?'Practice':section.title}</button><details class="item-menu"><summary aria-label={'Section settings: '+section.title}>•••</summary><div>
       <label>Title<input value={section.title} onchange={e=>patchSection(section.id,{title:e.currentTarget.value||section.title})}/></label>
       <label>Topic<select value={section.topicId} onchange={e=>reassignSection(section.id,e.currentTarget.value)}>{#each project.topics as t}<option value={t.id}>{t.title}</option>{/each}</select></label>
       <label>Phase<select value={section.phase} onchange={e=>patchSection(section.id,{phase:e.currentTarget.value,role:e.currentTarget.value})}><option value="teaching">Teaching</option><option value="practice">Practice</option><option value="front-matter">Front matter</option></select></label>
       <label class="check"><input type="checkbox" checked={section.pageBreakBefore!==false} onchange={e=>patchSection(section.id,{pageBreakBefore:e.currentTarget.checked})}/>Start on new page</label>
       {#if !exercises[topic.id]}<label>Start numbering<input type="number" min="1" placeholder="Continue" value={section.numberingStart??''} onchange={e=>patchSection(section.id,{numberingStart:e.currentTarget.value?Math.max(1,Math.trunc(Number(e.currentTarget.value))):null})}/></label><label>Difficulty<select value={section.difficulty??''} onchange={e=>patchSection(section.id,{difficulty:e.currentTarget.value||null})}><option value="">None</option>{#each ['Foundation','Development','Mastery','Challenge'] as tier}<option>{tier}</option>{/each}</select></label><label class="check"><input type="checkbox" checked={section.showDifficultyHeading!==false} onchange={e=>patchSection(section.id,{showDifficultyHeading:e.currentTarget.checked})}/>Show difficulty heading</label>{/if}
       <button onclick={()=>moveSection(section.id,-1)}>Move section up</button><button onclick={()=>moveSection(section.id,1)}>Move section down</button><button onclick={()=>joinPrevious(section.id)}>Join previous section</button>
      </div></details></div>
      {#each units.filter(u=>u.sectionId===section.id) as unit (unit.id)}
       {@const b=unit.blocks[0]}{@const p=pages.find(p=>p.blocks.some(b=>unit.blocks.some(u=>u.id===b.id)))}
       <div class="content-item" data-block-id={unit.id} class:active={unit.blocks.some(b=>b.id===selectedBlockId)} draggable={true} ondragstart={e=>e.dataTransfer.setData('application/x-booklet-block',unit.id)} ondragover={e=>e.preventDefault()} ondrop={e=>{e.preventDefault();e.stopPropagation();drop(e.dataTransfer.getData('application/x-booklet-block'),section.id,unit.id);}} role="group" aria-label={label(b)}>
        <button class="content-select" onclick={()=>{selected=[unit.id];onselection?.(selected);destination=section.id;beforeId=section.blocks[section.blocks.indexOf(unit.blocks.at(-1))+1]?.id??'';onselect?.(unit.id,section.id);}}><span class="content-label">{label(b).split(' · ')[0]}<small>{p?'p'+p.pageNumber:''}</small></span>{#if contentExcerpt(b.content)}<div class="excerpt"><BookletRichText text={contentExcerpt(b.content,85)}/></div>{/if}</button>
        <details class="item-menu"><summary aria-label={'Actions for '+label(b)}>•••</summary><div>
         <button onclick={()=>boundary(unit.id,'before')}>Page break before</button><button onclick={()=>boundary(unit.id,'after')}>Page break after</button><button onclick={()=>boundary(unit.id,'remove')}>Remove break before</button>
         <button onclick={()=>{selected=[unit.id];onselection?.(selected);command('duplicate');}}>Duplicate</button><button onclick={()=>{selected=[unit.id];onselection?.(selected);command('delete');}}>Delete</button>
         <details><summary>Move to…</summary><label>Section<select value={target?.id??''} onchange={e=>{destination=e.currentTarget.value;beforeId='';}}>{#each project.topics as t}<optgroup label={t.title}>{#each project.sections.filter(s=>s.topicId===t.id) as dest}<option value={dest.id}>{dest.title}</option>{/each}</optgroup>{/each}</select></label><label>Before<select bind:value={beforeId}><option value="">End of section</option>{#each target?.blocks??[] as targetBlock}<option value={targetBlock.id}>{label(targetBlock)}</option>{/each}</select></label><button onclick={()=>{selected=[unit.id];command('move');}}>Move here</button></details>
        </div></details>
       </div>
      {/each}
     </div>
    {/each}
   {/if}
  </section>
 {/each}
</nav>
<style>
 .flow-outline{font:14px system-ui;color:inherit}.outline-title,.topic-heading,.section-heading,.content-label{display:flex;align-items:center;justify-content:space-between;gap:6px}.outline-title{margin-bottom:12px}.topic{border-bottom:1px solid var(--border,#e0e5eb);padding:4px 0}.topic-toggle{display:flex;align-items:baseline;gap:6px;text-align:left;flex:1}.topic-toggle strong{font-weight:600}.section-heading>button{color:var(--text-muted,#647181);font-size:12px;text-align:left}.section{padding-left:10px}.content-item{display:flex;align-items:start;border-radius:5px;margin:2px 0}.content-select{flex:1;min-width:0;text-align:left;padding:7px 6px}.content-label{font-weight:500}.content-label small{font-size:12px;color:var(--text-muted,#647181);font-weight:400;white-space:nowrap}.excerpt{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;font-size:12px;line-height:1.4;color:var(--text-muted,#647181);margin-top:3px}.active{color:#183b58;background:#e8f2fc;box-shadow:inset 3px 0 #268cff}.item-menu{position:relative}.item-menu>summary{cursor:pointer;list-style:none;padding:5px;font-size:13px;min-width:24px;text-align:center}.item-menu>div{position:absolute;right:0;top:100%;z-index:30;width:200px;max-height:360px;overflow:auto;padding:10px;border:1px solid var(--border,#ccd5df);border-radius:6px;background:var(--panel,#fff);box-shadow:0 4px 18px #0002}.item-menu>div button{display:block;width:100%;text-align:left;border:1px solid var(--border,#ccd5df);margin:4px 0}.item-menu label{display:grid;gap:4px;margin:8px 0}.item-menu .check{display:flex;align-items:center}button,input,select{font:inherit;color:inherit;background:transparent;border:0;min-height:32px;box-sizing:border-box;max-width:100%;border-radius:4px}button{cursor:pointer}input,select{border:1px solid var(--border,#ccd5df);background:var(--panel,#fff);padding:4px;width:100%}input[type=checkbox]{width:auto;min-height:0}button:hover,summary:hover{background:#268cff12}:focus-visible{outline:2px solid #268cff;outline-offset:1px}button:disabled{opacity:.45}
.active .excerpt,.active .content-label small{color:#405b73}.excerpt :global(p){margin:0!important}.excerpt :global(.document-content){font-size:12px}</style>
