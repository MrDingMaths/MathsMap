<script>
  import BookletOutlineRow from './BookletOutlineRow.svelte';
  import {contentExcerpt,startExerciseOnNewPage,setPageBoundary} from '../lib/booklet-workspace.js';
  import {onMount,untrack} from 'svelte';
  import {logicalUnits,flowNumbers,flowCommand,captureFlowClipboard,flowId,exerciseNumbers,selectedFlowIds} from '../lib/booklet-flow.js';
 import {createProjectBlock,snapshotBankQuestion,normalizeEditableProject} from '../lib/editable-booklet-model.js';
  import {feedbackText} from '../lib/booklet-feedback.js';
  let {project,pages=[],bank=[],onrequestbank=null,onbank=null,onboundary=null,selectedBlockId='',activePage=0,selectedIds=[],onselection=null,onpick=null,documentClipboard=null,onpaste=null,disabled=false,onchange=null,onselect=null,onsection=null,onerror=null}=$props();
  let openMenus=$state({});
  let organising=$state(false),expandedTopic=$state(''),outlineQuery=$state('');
  const matches=unit=>!outlineQuery||unit.blocks.some(b=>(label(b)+' '+contentExcerpt(b.content,10000)).toLowerCase().includes(outlineQuery.toLowerCase()));
  $effect(()=>{const id=selectedBlockId;const topic=project.sections.find(s=>s.blocks.some(b=>b.id===id))?.topicId;expandedTopic=topic??project.topics[0]?.id??'';});
  const viewTopic=$derived(activePage?project.sections.find(s=>s.blocks.some(b=>pages[activePage-1]?.blocks.some(v=>v.id===b.id)))?.topicId:undefined);
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
  // Ctrl/Cmd and Shift clicks extend the shared document selection; a plain click selects and reveals one item.
  function pick(unit,section,e){
    if(onpick&&(e.shiftKey||e.ctrlKey||e.metaKey)){onpick(unit.blocks.map(b=>b.id),e);return;}
    selected=[unit.id];onselection?.(selected);destination=section.id;beforeId=section.blocks[section.blocks.indexOf(unit.blocks.at(-1))+1]?.id??'';onselect?.(unit.id,section.id);
  }
  const picked=unit=>unit.blocks.some(b=>selected.includes(b.id));
  // Tick boxes add to or remove from the selection; Shift extends a range.
  function tick(unit,checked,e){
    if(onpick){onpick(unit.blocks.map(b=>b.id),{shiftKey:e.shiftKey,ctrlKey:!e.shiftKey});return;}
    select(unit,checked);
  }
  function ticks(sectionIds){const inside=units.filter(u=>sectionIds.includes(u.sectionId)),on=inside.filter(picked).length;return{ids:inside.flatMap(u=>u.blocks.map(b=>b.id)),checked:!!inside.length&&on===inside.length,indeterminate:on>0&&on<inside.length};}
  function selectAll(ids,checked){selected=selectedFlowIds(project,checked?[...selected,...ids]:selected.filter(id=>!ids.includes(id)));onselection?.(selected);if(checked&&!selected.includes(selectedBlockId))onselect?.(ids[0],project.sections.find(s=>s.blocks.some(b=>b.id===ids[0]))?.id);}
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
 <input class="outline-search" aria-label="Search outline" placeholder="Search outline" bind:value={outlineQuery}/>
 {#each project.topics.filter(t=>!outlineQuery||units.some(u=>project.sections.find(s=>s.id===u.sectionId)?.topicId===t.id&&matches(u))) as topic (topic.id)}
  {@const topicTicks=ticks(project.sections.filter(s=>s.topicId===topic.id).map(s=>s.id))}
  <section class="topic">
   <div class="topic-heading" class:in-view={viewTopic===topic.id}><input type="checkbox" class="group-check" aria-label={'Select everything in '+topic.title} disabled={!topicTicks.ids.length} checked={topicTicks.checked} indeterminate={topicTicks.indeterminate} onchange={e=>selectAll(topicTicks.ids,e.currentTarget.checked)}/><button class="topic-toggle" aria-expanded={expandedTopic===topic.id} onclick={()=>expandedTopic=expandedTopic===topic.id?'':topic.id}><span aria-hidden="true">{expandedTopic===topic.id?'▾':'▸'}</span><strong>{exercises[topic.id]?exercises[topic.id]+'. ':''}{topic.title}</strong></button>
    <details class="item-menu" ontoggle={e=>openMenus[topic.id]=e.currentTarget.open}><summary aria-label={'Actions for '+topic.title}>•••</summary>{#if openMenus[topic.id]}<div>
     <label>Topic title<input value={topic.title} onchange={e=>attempt(()=>commit({...project,topics:project.topics.map(t=>t.id===topic.id?{...t,title:e.currentTarget.value||t.title}:t)}))}/></label>
     <button onclick={()=>attempt(()=>commit(startExerciseOnNewPage(project,topic.id)))}>Start exercise on new page</button><button onclick={()=>moveTopic(topic.id,-1)}>Move topic up</button><button onclick={()=>moveTopic(topic.id,1)}>Move topic down</button><button onclick={()=>newSection(topic.id)}>Add section</button>
    </div>{/if}</details>
   </div>
   {#if outlineQuery||expandedTopic===topic.id}
    {#each project.sections.filter(s=>s.topicId===topic.id) as section (section.id)}
     {@const sectionTicks=ticks([section.id])}
     <div class="section" ondragover={e=>e.preventDefault()} ondrop={e=>{e.preventDefault();drop(e.dataTransfer.getData('application/x-booklet-block'),section.id,null);}} role="group" aria-label={section.title}>
      <div class="section-heading"><input type="checkbox" class="group-check" aria-label={'Select everything in '+section.title} disabled={!sectionTicks.ids.length} checked={sectionTicks.checked} indeterminate={sectionTicks.indeterminate} onchange={e=>selectAll(sectionTicks.ids,e.currentTarget.checked)}/><button onclick={()=>{destination=section.id;onsection?.(section.id);}}>{section.phase==='practice'?'Practice':section.title}</button><details class="item-menu" ontoggle={e=>openMenus[section.id]=e.currentTarget.open}><summary aria-label={'Section settings: '+section.title}>•••</summary>{#if openMenus[section.id]}<div>
       <label>Title<input value={section.title} onchange={e=>patchSection(section.id,{title:e.currentTarget.value||section.title})}/></label>
       <label>Topic<select value={section.topicId} onchange={e=>reassignSection(section.id,e.currentTarget.value)}>{#each project.topics as t}<option value={t.id}>{t.title}</option>{/each}</select></label>
       <label>Phase<select value={section.phase} onchange={e=>patchSection(section.id,{phase:e.currentTarget.value,role:e.currentTarget.value})}><option value="teaching">Teaching</option><option value="practice">Practice</option><option value="front-matter">Front matter</option></select></label>
       <label class="check"><input type="checkbox" checked={section.pageBreakBefore!==false} onchange={e=>patchSection(section.id,{pageBreakBefore:e.currentTarget.checked})}/>Start on new page</label>
       {#if !exercises[topic.id]}<label>Start numbering<input type="number" min="1" placeholder="Continue" value={section.numberingStart??''} onchange={e=>patchSection(section.id,{numberingStart:e.currentTarget.value?Math.max(1,Math.trunc(Number(e.currentTarget.value))):null})}/></label><label>Difficulty<select value={section.difficulty??''} onchange={e=>patchSection(section.id,{difficulty:e.currentTarget.value||null})}><option value="">None</option>{#each ['Foundation','Development','Mastery','Challenge'] as tier}<option>{tier}</option>{/each}</select></label><label class="check"><input type="checkbox" checked={section.showDifficultyHeading!==false} onchange={e=>patchSection(section.id,{showDifficultyHeading:e.currentTarget.checked})}/>Show difficulty heading</label>{/if}
       <button onclick={()=>moveSection(section.id,-1)}>Move section up</button><button onclick={()=>moveSection(section.id,1)}>Move section down</button><button onclick={()=>joinPrevious(section.id)}>Join previous section</button>
      </div>{/if}</details></div>
      {#each units.filter(u=>u.sectionId===section.id&&matches(u)) as unit (unit.id)}
       {@const b=unit.blocks[0]}{@const p=pages.find(p=>p.blocks.some(b=>unit.blocks.some(u=>u.id===b.id)))}
       <div class="content-item" data-block-id={unit.id} class:active={unit.blocks.some(b=>b.id===selectedBlockId)} class:in-view={!!activePage&&p?.pageNumber===activePage} class:picked={selected.length>1&&picked(unit)} draggable={true} ondragstart={e=>e.dataTransfer.setData('application/x-booklet-block',unit.id)} ondragover={e=>e.preventDefault()} ondrop={e=>{e.preventDefault();e.stopPropagation();drop(e.dataTransfer.getData('application/x-booklet-block'),section.id,unit.id);}} role="group" aria-label={label(b)}>
        <BookletOutlineRow block={b} number={numbers[b.id]} page={p?.pageNumber} checked={picked(unit)} pressed={picked(unit)} active={unit.blocks.some(b=>b.id===selectedBlockId)} onpick={e=>pick(unit,section,e)} oncheck={(checked,e)=>tick(unit,checked,e)}/>
        <details class="item-menu" ontoggle={e=>openMenus[unit.id]=e.currentTarget.open}><summary aria-label={'Actions for '+label(b)}>•••</summary>{#if openMenus[unit.id]}<div>
         <button onclick={()=>boundary(unit.id,'before')}>Page break before</button><button onclick={()=>boundary(unit.id,'after')}>Page break after</button><button onclick={()=>boundary(unit.id,'remove')}>Remove break before</button>
         <button onclick={()=>{selected=[unit.id];onselection?.(selected);command('duplicate');}}>Duplicate</button><button onclick={()=>{selected=[unit.id];onselection?.(selected);command('delete');}}>Delete</button>
         <details><summary>Move to…</summary><label>Section<select value={target?.id??''} onchange={e=>{destination=e.currentTarget.value;beforeId='';}}>{#each project.topics as t}<optgroup label={t.title}>{#each project.sections.filter(s=>s.topicId===t.id) as dest}<option value={dest.id}>{dest.title}</option>{/each}</optgroup>{/each}</select></label><label>Before<select bind:value={beforeId}><option value="">End of section</option>{#each target?.blocks??[] as targetBlock}<option value={targetBlock.id}>{label(targetBlock)}</option>{/each}</select></label><button onclick={()=>{if(!picked(unit))selected=[unit.id];command('move');}}>{selected.length>1&&picked(unit)?'Move selection here':'Move here'}</button></details>
        </div>{/if}</details>
       </div>
      {/each}
     </div>
    {/each}
   {/if}
  </section>
 {/each}
</nav>
<style>
 .flow-outline{font:14px system-ui;color:inherit}.outline-title,.topic-heading,.section-heading{display:flex;align-items:center;justify-content:space-between;gap:6px}.outline-title{margin-bottom:12px}.topic{border-bottom:1px solid var(--border,#e0e5eb);padding:4px 0}.topic-toggle{display:flex;align-items:baseline;gap:6px;text-align:left;flex:1}.topic-toggle strong{font-weight:600}.section-heading>button{color:var(--text-muted,#647181);font-size:12px;text-align:left}.section{padding-left:10px}.content-item{display:flex;align-items:start;border-radius:5px;margin:2px 0}.group-check{flex:none;width:15px;height:15px;margin:0 2px 0 4px;accent-color:#268cff;cursor:pointer}.section-heading>button{flex:1}.active{color:#183b58;background:#e8f2fc;box-shadow:inset 3px 0 #268cff}.picked{color:#183b58;background:#e8f2fc}.topic-heading.in-view .topic-toggle strong{box-shadow:inset 0 -2px #438ccc}.content-item.in-view{box-shadow:inset 2px 0 #438ccc88}.item-menu{position:relative}.item-menu>summary{cursor:pointer;list-style:none;padding:5px;font-size:13px;min-width:24px;text-align:center}.item-menu>div{position:absolute;right:0;top:100%;z-index:30;width:200px;max-height:360px;overflow:auto;padding:10px;border:1px solid var(--border,#ccd5df);border-radius:6px;background:var(--panel,#fff);box-shadow:0 4px 18px #0002}.item-menu>div button{display:block;width:100%;text-align:left;border:0;border-radius:4px;background:transparent;margin:1px 0}.item-menu>div button:hover:not(:disabled){background:var(--app-canvas,#eef1f5)}.item-menu label{display:grid;gap:4px;margin:8px 0}.item-menu .check{display:flex;align-items:center}button,input,select{font:inherit;color:inherit;background:transparent;border:0;min-height:32px;box-sizing:border-box;max-width:100%;border-radius:4px}button{cursor:pointer}input,select{border:1px solid var(--border,#ccd5df);background:var(--panel,#fff);padding:4px;width:100%}input[type=checkbox]{width:auto;min-height:0}button:hover,summary:hover{background:#268cff12}:focus-visible{outline:2px solid #268cff;outline-offset:1px}button:disabled{opacity:.45}
</style>
