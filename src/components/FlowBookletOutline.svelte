<script>
  import {questionDifficulty} from '../lib/booklet-bank-ratings.js';
  import {onMount,untrack} from 'svelte';
  import {logicalUnits,flowNumbers,flowCommand,captureFlowClipboard,flowId,exerciseNumbers} from '../lib/booklet-flow.js';
 import {createProjectBlock,snapshotBankQuestion,normalizeEditableProject} from '../lib/editable-booklet-model.js';
  import {feedbackText} from '../lib/booklet-feedback.js';
  let {project,pages=[],bank=[],onrequestbank=null,selectedBlockId='',selectedIds=[],onselection=null,documentClipboard=null,onpaste=null,disabled=false,onchange=null,onselect=null,onsection=null,onerror=null}=$props();
  let organising=$state(false);
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
<div class="flow-outline" class:document-outline={!!onselection} class:organising inert={disabled}>
  <strong>Topics and content</strong>
  {#if onselection}<button aria-pressed={organising} onclick={()=>{organising=!organising;if(organising)onrequestbank?.();}}>Organise booklet</button>{/if}
  <div class="commands">{#each [['cut','Cut'],['copy','Copy'],['paste','Paste'],['duplicate','Duplicate'],['delete','Delete']] as [type,title]}<button disabled={type==='paste'?!clipboard:!selection.length} onclick={()=>command(type)}>{title}</button>{/each}</div>
  {#if clipboard}<p role="status">{clipboard.mode==='cut'?'Ready to move':'Copied'} {clipboard.blocks.length} block(s). {#if clipboard.mode==='cut'}<button onclick={()=>clipboard=null}>Cancel cut</button>{/if}</p>{/if}
  <details open onfocusin={()=>onrequestbank?.()}><summary>Insert / move to</summary>
    <label>Destination section<select aria-label="Destination section" value={target?.id??''} onchange={e=>{destination=e.currentTarget.value;beforeId='';}}>{#each project.topics as topic}<optgroup label={topic.title}>{#each project.sections.filter(s=>s.topicId===topic.id) as s}<option value={s.id}>{s.title}</option>{/each}</optgroup>{/each}</select></label>
    <label>Insert before<select aria-label="Insert before" bind:value={beforeId}><option value="">End of section</option>{#each target?.blocks??[] as b}<option value={b.id}>{label(b)}</option>{/each}</select></label>
    <button disabled={!selection.length} onclick={()=>command('move')}>Move selected here</button>
    <button disabled={!availableClipboard} onclick={()=>attempt(()=>{if(onpaste){onpaste(target.id,beforeId||null);return;}commit(flowCommand(project,{type:'paste',clipboard,sectionId:target.id,beforeId:beforeId||null}));if(clipboard.mode==='cut')clipboard=null;})}>Paste here</button>
    <label>New content<select aria-label="New content" bind:value={blockType}>{#each [['question','Question'],['rich-text','Text'],['callout','Definition / theory'],['worked-example','Worked example'],['guided-practice','Guided practice'],['activity','Activity'],['image','Image'],['page-break','Page break']] as [value,title]}<option {value}>{title}</option>{/each}</select></label><button onclick={()=>insert()}>Insert content</button>
    <label>Question bank<select bind:value={bankId}><option value="">Choose a question</option>{#each bank as b}<option value={b.id}>{b.title||b.id}</option>{/each}</select></label><button disabled={!bankId} onclick={()=>insert(true)}>Insert bank copy</button>
  </details>
  <details><summary>Page layout for selection</summary>
    <button disabled={!selection.length} onclick={()=>layout({pageBreakBefore:true})}>Start on new page</button><button disabled={!selection.length} onclick={()=>layout({pageBreakBefore:false})}>Remove manual break</button>
    <button disabled={!selection.length} onclick={()=>layout({keepTogether:true})}>Keep together</button><button disabled={!selection.length} onclick={()=>layout({keepTogether:false})}>Allow safe continuation</button>
    <button disabled={!selection.length} onclick={()=>layout({keepWithNext:true})}>Keep with next</button><button disabled={!selection.length} onclick={()=>layout({keepWithNext:false})}>Release next</button>
    {#if selectedBlockId}{@const b=project.sections.flatMap(s=>s.blocks).find(b=>b.id===selectedBlockId)}{#if b?.content?.children?.length>1}<label>Continue here<select aria-label="Continue here" value={b.flow?.continueBefore??''} onchange={e=>layout({continueBefore:e.currentTarget.value||null})}><option value="">Automatic</option>{#each b.content.children.slice(1) as part}<option value={part.id}>Before part {part.label??part.id}</option>{/each}</select></label>{/if}{/if}
  </details>
  {#each project.topics as topic (topic.id)}
    <details open class="topic"><summary>{exercises[topic.id]?`Exercise ${exercises[topic.id]} · `:''}{topic.title}</summary>
      <label>Topic title<input value={topic.title} onchange={e=>attempt(()=>commit({...project,topics:project.topics.map(t=>t.id===topic.id?{...t,title:e.currentTarget.value||t.title}:t)}))}/></label>
      <div class="commands"><button onclick={()=>moveTopic(topic.id,-1)}>Topic up</button><button onclick={()=>moveTopic(topic.id,1)}>Topic down</button><button onclick={()=>newSection(topic.id)}>Add section</button></div>
      {#each project.sections.filter(s=>s.topicId===topic.id) as section (section.id)}
        <details open class="section" ondragover={e=>e.preventDefault()} ondrop={e=>{e.preventDefault();e.stopPropagation();drop(e.dataTransfer.getData('application/x-booklet-block'),section.id,null);}}>
          <summary onclick={()=>{destination=section.id;onsection?.(section.id);}}>{section.phase==='practice'&&exercises[topic.id]?`Exercise ${exercises[topic.id]}`:section.title}</summary>
          <details><summary>Page boundary</summary>
            <label><input type="checkbox" checked={section.pageBreakBefore!==false} onchange={e=>patchSection(section.id,{pageBreakBefore:e.currentTarget.checked})}/>Start section on a new page</label>
            {#if section.phase==='practice'&&!exercises[topic.id]}<label><input type="checkbox" checked={section.showDifficultyHeading!==false} onchange={e=>patchSection(section.id,{showDifficultyHeading:e.currentTarget.checked})}/>Show difficulty heading</label>{/if}
          </details>
          {#if section.phase==='practice'&&!exercises[topic.id]}<details><summary>Question numbering</summary><label>Start numbering at<input type="number" min="1" step="1" placeholder="Continue numbering" value={section.numberingStart??''} onchange={e=>patchSection(section.id,{numberingStart:e.currentTarget.value?Math.max(1,Math.trunc(Number(e.currentTarget.value))):null})}/></label></details>{/if}
          <details><summary>Section settings</summary><label>Section title<input value={section.title} onchange={e=>patchSection(section.id,{title:e.currentTarget.value||section.title})}/></label><label>Topic<select value={section.topicId} onchange={e=>reassignSection(section.id,e.currentTarget.value)}>{#each project.topics as t}<option value={t.id}>{t.title}</option>{/each}</select></label><label>Phase<select value={section.phase} onchange={e=>patchSection(section.id,{phase:e.currentTarget.value,role:e.currentTarget.value})}><option value="teaching">Teaching</option><option value="practice">Practice</option><option value="front-matter">Front matter</option></select></label>{#if !exercises[topic.id]}<label>Difficulty set<select value={section.difficulty??''} onchange={e=>patchSection(section.id,{difficulty:e.currentTarget.value||null,title:e.currentTarget.value||'Practice'})}><option value="">No tier</option>{#each ['Foundation','Development','Mastery','Challenge'] as tier}<option>{tier}</option>{/each}</select></label>{/if}<button onclick={()=>moveSection(section.id,-1)}>Section up</button><button onclick={()=>moveSection(section.id,1)}>Section down</button><button onclick={()=>joinPrevious(section.id)}>Join previous section</button></details>
          {#each units.filter(u=>u.sectionId===section.id) as unit (unit.id)}
            {@const p=pages.find(p=>p.blocks.some(b=>unit.blocks.some(u=>u.id===b.id)))}
            <div class="content-item" data-block-id={unit.id} class:active={unit.blocks.some(b=>b.id===selectedBlockId)} class:cut={clipboard?.mode==='cut'&&clipboard.ids.includes(unit.id)} draggable={true} ondragstart={e=>e.dataTransfer.setData('application/x-booklet-block',unit.id)} ondragover={e=>e.preventDefault()} ondrop={e=>{e.preventDefault();e.stopPropagation();drop(e.dataTransfer.getData('application/x-booklet-block'),section.id,unit.id);}} role="group" aria-label={label(unit.blocks[0])}>
              <input type="checkbox" aria-label={`Select ${label(unit.blocks[0])}`} checked={selected.includes(unit.id)} onchange={e=>select(unit,e.currentTarget.checked)}/><button onclick={()=>{selected=[unit.id];destination=section.id;beforeId=section.blocks[section.blocks.indexOf(unit.blocks.at(-1))+1]?.id??'';onselect?.(unit.id,section.id);}}>{label(unit.blocks[0])}{unit.blocks.length>1?' (group)':''}<small>{p?`p${p.pageNumber}`:''}{section.phase==='practice'&&questionDifficulty(unit.blocks[0])?` - ${questionDifficulty(unit.blocks[0]).difficulty} ${questionDifficulty(unit.blocks[0]).reasoningScore}/100`:''}</small></button>
            </div>
          {/each}
        </details>
      {/each}
    </details>
  {/each}
  <button onclick={newTopic}>Add topic</button>
</div>
<style>
 .document-outline>.commands,.document-outline:not(.organising)>details:not(.topic),.document-outline:not(.organising) .topic>label,.document-outline:not(.organising) .topic>.commands,.document-outline:not(.organising) .section>details{display:none}.document-outline .topic,.document-outline .section{border:0;margin:4px 0;padding:0}.document-outline .content-item{margin:2px 0}.document-outline .content-item button{border:0;background:transparent}.document-outline .section>summary{font-size:12px;color:#718096}.document-outline strong{display:block;margin-bottom:12px}
.flow-outline{font:14px system-ui;color:inherit}.flow-outline button,.flow-outline input,.flow-outline select{font:inherit;color:inherit;background:var(--panel,#fff);border:1px solid #b5c1cf;border-radius:4px;padding:6px;max-width:100%;min-height:32px}.commands{display:flex;flex-wrap:wrap;gap:4px;margin:8px 0}label{display:grid;gap:4px;margin:8px 0}details{margin:8px 0;padding:4px;border:1px solid #d5dde7;border-radius:5px}summary{cursor:pointer;font-weight:600;padding:4px}.section{margin-left:4px}.content-item{display:flex;gap:4px;margin:4px 0}.content-item button{flex:1;text-align:left}.content-item small{display:block;color:#66758d}.active{border-left:3px solid #286647}.cut{opacity:.5}p{font-size:12px}button{cursor:pointer}button:disabled{opacity:.45}
</style>
