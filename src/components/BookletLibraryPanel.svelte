<script>
  // Read-only view of another booklet. Ticked topics and items are copied into
  // the open booklet; the source is loaded into memory and never saved.
  import {setContext,tick} from 'svelte';
  import BookletOutlineRow from './BookletOutlineRow.svelte';
  import FlowBookletPreview from './FlowBookletPreview.svelte';
  import {loadBookletProject} from '../lib/booklet-project-storage.js';
  import {groupLibraryProjects} from '../lib/booklet-library.js';
  import {libraryTopics,libraryPicks} from '../lib/booklet-library-transfer.js';
  import {logicalUnits,flowNumbers} from '../lib/booklet-flow.js';
  import {contentExcerpt,outlineKind} from '../lib/booklet-workspace.js';
  import {teachingLabels} from '../lib/booklet-labels.js';
  import {skills,courses} from '../lib/data.js';
  let {projects=[],currentId='',destination='',disabled=false,oninsert=null}=$props();
  let source=$state.raw(null),loading=$state(''),error=$state(''),bookletQuery=$state('');
  let ticked=$state([]),query=$state(''),group=$state(''),expanded=$state({}),asTopics=$state(true),inserting=$state(false);
  let previewTopic=$state.raw(null),previewDialog=$state();
  const cache=new Map();let request=0,lastUnit='';
  // The preview shows the source booklet, so it reads that booklet's labels
  // and settings and takes no part in editing the open one.
  const previewProject=$derived(source&&previewTopic?{...source,settings:{...source.settings,generatedCover:false},topics:(source.topics??[]).filter(t=>t.id===previewTopic.id),sections:previewTopic.sections}:null);
  const previewLabels=$derived(teachingLabels(previewProject?.sections.flatMap(s=>s.blocks)??[]));
  setContext('booklet-labels',()=>previewLabels);
  setContext('booklet-presentation',()=>source?.settings);
  for(const key of ['booklet-inline-edit','booklet-document-actions','booklet-edit-request','booklet-cover-edit'])setContext(key,null);

  const groups=$derived(groupLibraryProjects(projects.filter(p=>p.id!==currentId),courses,{query:bookletQuery}));
  const topics=$derived(source?libraryTopics(source):[]);
  const numbers=$derived(source?flowNumbers(source):{});
  const units=$derived.by(()=>{if(!source)return [];const shown=new Set(topics.flatMap(t=>t.sections.map(s=>s.id)));return logicalUnits(source).filter(u=>shown.has(u.sectionId));});
  const skillTitle=id=>skills.find(s=>s.id===id)?.title??'';
  const searchText=$derived(new Map(units.map(u=>[u.id,u.blocks.map(b=>[outlineKind(b).label,b.sourceAtom?.label,b.sourceAtom?.visibleSubtitle,skillTitle(b.classification?.primarySkillId),contentExcerpt(b.content,10000)].join(' ')).join(' ').toLowerCase()])));
  const visible=$derived(units.filter(u=>(!group||outlineKind(u.blocks[0]).group===group)&&(!query.trim()||searchText.get(u.id).includes(query.trim().toLowerCase()))));
  const filtering=$derived(!!group||!!query.trim());
  const picks=$derived(source&&ticked.length?libraryPicks(source,ticked):null);
  const isTicked=unit=>unit.blocks.some(b=>ticked.includes(b.id));
  const unitIds=list=>list.flatMap(u=>u.blocks.map(b=>b.id));
  function ticks(sectionIds){const inside=visible.filter(u=>sectionIds.includes(u.sectionId)),on=inside.filter(isTicked).length;return{units:inside,checked:!!inside.length&&on===inside.length,indeterminate:on>0&&on<inside.length};}
  function setTicks(list,checked){const ids=unitIds(list);ticked=checked?[...new Set([...ticked,...ids])]:ticked.filter(id=>!ids.includes(id));}
  // Shift extends from the last ticked item through the items currently shown.
  function tickUnit(unit,checked,event){
    const from=visible.findIndex(u=>u.id===lastUnit),to=visible.indexOf(unit);
    if(event?.shiftKey&&from>=0)setTicks(visible.slice(Math.min(from,to),Math.max(from,to)+1),true);
    else setTicks([unit],checked);
    lastUnit=unit.id;
  }
  async function choose(id,{refresh=false}={}){
    const token=++request;error='';loading=projects.find(p=>p.id===id)?.title??id;
    try{
      if(refresh)cache.delete(id);
      let loaded=cache.get(id);
      if(!loaded){loaded=await loadBookletProject(id);cache.delete(id);cache.set(id,loaded);while(cache.size>3)cache.delete(cache.keys().next().value);}
      if(token!==request)return;
      source=loaded;ticked=[];query='';group='';lastUnit='';previewTopic=null;
      expanded=Object.fromEntries(libraryTopics(loaded).slice(0,1).map(t=>[t.id,true]));
    }catch(e){if(token===request)error=e.message;}
    finally{if(token===request)loading='';}
  }
  async function insert(){
    if(!picks||inserting)return;inserting=true;error='';
    try{await oninsert?.(source,[...ticked],{asTopics});ticked=[];lastUnit='';}
    catch(e){error=e.message;}finally{inserting=false;}
  }
  async function preview(topic){previewTopic=topic;await tick();if(!previewDialog?.open)previewDialog?.showModal();}
  const count=(n,word)=>`${n} ${word}${n===1?'':'s'}`;
  const target=$derived(!picks?'':asTopics&&picks.topics.length&&!picks.items.length?`${count(picks.topics.length,'new topic')} after “${destination}”`:asTopics&&picks.topics.length?`${count(picks.topics.length,'new topic')} after “${destination}”, other items into it`:`into “${destination}”, after the selected item`);
</script>
<section class="library" aria-label="Copy from another booklet">
 {#if !source}
  <p class="hint">Choose a booklet to copy topics, theory and questions from. It opens read-only; only this booklet changes.</p>
  <input class="search" type="search" aria-label="Search booklets" placeholder="Search booklets" bind:value={bookletQuery}/>
  {#if loading}<p role="status">Loading {loading}…</p>{/if}
  {#if error}<p role="alert">{error}</p>{/if}
  <div class="booklets">{#each groups as g (g.key)}<h3>{g.label}</h3>{#each g.projects as item (item.id)}<button class="booklet" disabled={!!loading} onclick={()=>choose(item.id)}>{item.title}</button>{/each}{:else}<p>No booklets{bookletQuery?' match your search':''}.</p>{/each}</div>
 {:else}
  <header><strong title={source.title}>{source.title}</strong><small>Read-only · revision {source.revision}</small>
   <div class="source-actions"><button onclick={()=>{source=null;ticked=[];}}>Change booklet</button><button disabled={!!loading} onclick={()=>choose(source.id,{refresh:true})}>{loading?'Loading…':'Refresh'}</button></div></header>
  <input class="search" type="search" aria-label="Search this booklet" placeholder="Search content or skill" bind:value={query}/>
  <div class="filters" role="group" aria-label="Show">{#each [['','All'],['theory','Theory'],['examples','Examples'],['questions','Questions']] as [value,label]}<button aria-pressed={group===value} onclick={()=>group=value}>{label}</button>{/each}</div>
  {#if error}<p role="alert">{error}</p>{/if}
  <div class="topics">
   {#each topics as topic (topic.id)}
    {@const topicTicks=ticks(topic.sections.map(s=>s.id))}
    {#if topicTicks.units.length}
     <section class="topic">
      <div class="topic-heading"><input type="checkbox" aria-label={'Tick everything shown in '+topic.title} checked={topicTicks.checked} indeterminate={topicTicks.indeterminate} onchange={e=>setTicks(topicTicks.units,e.currentTarget.checked)}/>
       <button class="topic-toggle" aria-expanded={filtering||!!expanded[topic.id]} onclick={()=>expanded[topic.id]=!expanded[topic.id]}><span aria-hidden="true">{filtering||expanded[topic.id]?'▾':'▸'}</span><strong>{topic.title}</strong><small>{topicTicks.units.length}</small></button>
       <button class="preview-button" aria-label={'Preview '+topic.title} onclick={()=>preview(topic)}>Preview</button></div>
      {#if filtering||expanded[topic.id]}
       {#each topic.sections as section (section.id)}
        {@const sectionTicks=ticks([section.id])}
        {#if sectionTicks.units.length}
         <div class="section" role="group" aria-label={section.title}>
          <div class="section-heading"><input type="checkbox" aria-label={'Tick everything shown in '+section.title} checked={sectionTicks.checked} indeterminate={sectionTicks.indeterminate} onchange={e=>setTicks(sectionTicks.units,e.currentTarget.checked)}/><span>{section.phase==='practice'?'Practice':section.title}</span></div>
          {#each sectionTicks.units as unit (unit.id)}
           <div class="content-item" class:ticked={isTicked(unit)}><BookletOutlineRow block={unit.blocks[0]} number={numbers[unit.blocks[0].id]} page={unit.blocks[0].sourcePageNumber} checked={isTicked(unit)} pressed={isTicked(unit)} oncheck={(checked,e)=>tickUnit(unit,checked,e)} onpick={e=>tickUnit(unit,!isTicked(unit),e)}/></div>
          {/each}
         </div>
        {/if}
       {/each}
      {/if}
     </section>
    {/if}
   {:else}<p>This booklet has no teaching or practice content.</p>{/each}
   {#if topics.length&&!visible.length}<p>Nothing matches.</p>{/if}
  </div>
  <footer>
   {#if picks}
    <p><strong>{count(picks.units,'item')} ticked</strong> → {target}</p>
    {#if picks.topics.length}<label class="check"><input type="checkbox" bind:checked={asTopics}/>Whole topics become new topics</label>{/if}
   {:else}<p>Tick topics or items to copy.</p>{/if}
   <div class="source-actions"><button class="primary" disabled={!picks||disabled||inserting} onclick={insert}>{inserting?'Inserting…':'Insert into this booklet'}</button><button disabled={!ticked.length} onclick={()=>ticked=[]}>Clear</button></div>
  </footer>
 {/if}
</section>
<dialog class="library-preview" bind:this={previewDialog} aria-label="Source preview" onclose={()=>previewTopic=null}>
 {#if previewProject}
  <header><strong>{previewTopic.title}</strong><small>{source.title} · read-only preview</small><button onclick={()=>previewDialog.close()}>Close</button></header>
  <div class="preview-pages">{#key previewTopic.id}<FlowBookletPreview project={previewProject} edition="student" options={{showResponseSpaces:true}} zoom="width"/>{/key}</div>
 {/if}
</dialog>
<style>
 .library{display:flex;flex-direction:column;gap:8px;min-height:0;height:100%;font:14px system-ui;color:inherit}
 .hint,.library p{margin:0;font-size:13px;line-height:1.4;color:var(--text-muted,#647181)}.library p[role=alert]{color:#994020}
 header{display:grid;gap:2px}header strong{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}small{font-size:12px;color:var(--text-muted,#647181)}
 .source-actions,.filters{display:flex;flex-wrap:wrap;gap:6px}
 .search{width:100%;box-sizing:border-box}
 .booklets,.topics{flex:1;min-height:0;overflow:auto}
 h3{font-size:12px;font-weight:600;margin:12px 0 4px;color:var(--text-muted,#647181)}
 .booklet{display:block;width:100%;text-align:left;border:0;background:transparent;white-space:normal}
 .topic{border-bottom:1px solid var(--border,#e0e5eb);padding:4px 0}.topic-heading,.section-heading{display:flex;align-items:center;gap:6px}
 .topic-toggle{display:flex;align-items:baseline;gap:6px;flex:1;min-width:0;text-align:left;border:0;background:transparent}.topic-toggle strong{font-weight:600;flex:1}
 .preview-button{font-size:12px;min-height:26px;padding:2px 8px}
 .section{padding-left:10px}.section-heading span{font-size:12px;color:var(--text-muted,#647181)}
 .content-item{display:flex;align-items:start;border-radius:5px;margin:2px 0}.ticked{background:#e8f2fc;color:#183b58}
 footer{display:grid;gap:6px;padding-top:8px;border-top:1px solid var(--border,#ccd5df)}footer p strong{color:var(--text,#24282d)}
 .check{display:flex;align-items:center;gap:6px;font-size:13px}
 button,input{font:inherit;color:inherit;min-height:32px;box-sizing:border-box;border-radius:5px}
 button{cursor:pointer;padding:5px 10px;border:1px solid var(--border,#c7d0da);background:var(--panel,#fff)}button:hover:not(:disabled){background:#268cff12}button:disabled{opacity:.45}
 .filters button[aria-pressed=true]{border-color:#268cff;background:#edf6ff;color:#183b58}
 input[type=search]{padding:6px 8px;border:1px solid var(--border,#ccd5df);background:var(--panel,#fff)}
 input[type=checkbox]{flex:none;width:15px;height:15px;min-height:0;margin:0 0 0 4px;accent-color:#268cff;cursor:pointer}
 .primary{background:#286647;border-color:#286647;color:#fff}.primary:hover:not(:disabled){background:#225a3e}
 :focus-visible{outline:2px solid #268cff;outline-offset:1px}
 .library-preview{box-sizing:border-box;width:min(900px,calc(100vw - 32px));height:calc(100dvh - 48px);max-width:none;max-height:none;padding:0;border:1px solid var(--border,#ccd5df);border-radius:10px;background:var(--app-canvas,#eef1f5);color:var(--text,#24282d);overflow:hidden}
 .library-preview[open]{display:flex;flex-direction:column}.library-preview::backdrop{background:#14233380}
 .library-preview header{display:flex;align-items:center;gap:12px;padding:10px 16px;background:var(--panel,#fff);border-bottom:1px solid var(--border,#ccd5df)}.library-preview header small{flex:1}
 .preview-pages{flex:1;min-height:0;overflow:auto;padding:16px}
</style>
