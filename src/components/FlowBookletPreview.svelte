<script>
  import {tick,onMount,getContext,untrack} from 'svelte';
  import {dimensionCacheContext,measurementStore,digestKey,cacheMode} from '../lib/booklet-render-cache.js';
  import {createPaginationKey,createWorkYield} from '../lib/booklet-pagination-work.js';
  import FlowBookletPage from './FlowBookletPage.svelte';
  import {pageBoundaryKind} from '../lib/booklet-workspace.js';
  import BookletPageGuide from './BookletPageGuide.svelte';
  import {measureBookletPage} from '../lib/booklet-page-space.js';
  import {paginateFlow} from '../lib/booklet-pagination.js';
  import {settleBookletMeasurement,measurementKeyFor} from '../lib/booklet-measurement.js';
  let {project,edition='student',options={},zoom='width',selectedBlockId='',editing=false,composing=false,onmap=null,onprogress=null,onpage=null,onselect=null,onContentEdit=null,onSpaceResize=null,onmove=null,onremovebreak=null}=$props();
  let measurement=$state.raw(null),result=$state.raw({pages:[],issues:[]}),progress=$state('Preparing pages…'),ready=$state(false),error=$state('');
  let metrics=$state.raw(null);
  let measureRoot,root=$state(),width=$state(794),active=$state(0),visible=$state(new Set()),generation=0,queue=Promise.resolve(),scrollRoot;
  const cache=new Map();
  let paginationRuns=0;
  const loadTimings=[];
  const documentEditor=getContext('booklet-inline-edit');
  const scale=$derived(zoom==='width'||zoom==='page'?Math.min(1,width/794):Number(zoom)||1);
  const paginationKey=createPaginationKey();
  const signature=$derived(paginationKey(project,edition,options));
  function scrollToElement(element){if(!element||!scrollRoot)return;const inset=scrollRoot.querySelector('.canvas-heading')?.getBoundingClientRect().height??80;scrollRoot.scrollTop+=element.getBoundingClientRect().top-scrollRoot.getBoundingClientRect().top-inset;}
  export function jumpTo(id){const index=result.pages.findIndex(p=>p.id===id||p.blocks.some(b=>b.id===id));if(index<0)return;visible=new Set([...visible,index]);tick().then(()=>scrollToElement(root?.querySelector(`[data-flow-index="${index}"]`)));}
  async function followReference(event){
    const link=event.target.closest('a[href^="#"]');if(!link)return;
    const anchorId=link.getAttribute('href').slice(1),id=anchorId.replace(/^screen-/,'');
    let index=-1;
    if(id.startsWith('answer-section-'))index=result.pages.findIndex(p=>p.mode===id.slice(15));
    else if(id.startsWith('exercise-topic-'))index=result.pages.findIndex(p=>p.mode==='student'&&p.section.exerciseNumber===Number(id.slice(15)));
    else if(id.startsWith('question-'))index=result.pages.findIndex(p=>p.mode==='student'&&p.blocks.some(b=>b.id===id.slice(9)));
    else {const match=/^answer-(short|worked)-(.*)$/.exec(id);if(match)index=result.pages.findIndex(p=>p.mode===match[1]&&p.blocks.some(b=>b.id===match[2]));}
    if(index<0)return;
    event.preventDefault();event.stopPropagation();visible=new Set([...visible,index]);await tick();
    const group=root.querySelector(`[data-flow-index="${index}"]`);
    scrollToElement(group?.querySelector(`[id="${CSS.escape(anchorId)}"]`)??group);
  }
  export async function waitUntilReady(){await queue;if(error)throw Error(error);if(!ready)throw Error('Pagination is still updating.');if(result.issues.length)throw Error(result.issues.map(i=>`${i.id}: ${i.message}`).join('\n'));return result;}
  $effect(()=>{
    signature;
    if(composing)return;
    const snapshot=untrack(()=>project),currentEdition=untrack(()=>edition),currentOptions=untrack(()=>({...options})),token=++generation,controller=new AbortController();
    const prepareInitialPreview=untrack(()=>!result.pages.length||result.edition!==currentEdition);
    ready=false;error='';progress='Preparing pages…';onmap?.({...untrack(()=>result),ready:false});
    const report=untrack(()=>onprogress);
    const reportProgress=value=>{if(token===generation)untrack(()=>report?.({projectId:snapshot.id,...value}));};
    reportProgress({stage:'Preparing pages',ready:false});
    queue=queue.catch(()=>{}).then(async()=>{
      // Superseded edits must not each add their own debounce delay to the queue.
      if(token!==generation)return;
      if(editing)await new Promise(resolve=>setTimeout(resolve,250));
      if(token!==generation)return;
      const started=performance.now(),stats={generation:++paginationRuns,measurements:0,cacheHits:0,persistentHits:0,keyMs:0,renderMs:0,assetsMs:0,layoutMs:0};
      const cacheStarted=performance.now(),cacheContext=await dimensionCacheContext(snapshot);
      stats.cacheSetupMs=performance.now()-cacheStarted;
      const keyFor=measurementKeyFor(snapshot,currentOptions),yieldWork=createWorkYield();
      const anchor=root?.querySelector(`[data-flow-index="${active}"]`),anchorId=result.pages[active]?.blocks[0]?.id,offset=anchor?.getBoundingClientRect().top;
      const measure=async page=>{
        await yieldWork();if(token!==generation)throw Object.assign(Error('Pagination superseded'),{cancelled:true});
        let timing=performance.now();
        const sourceKey=keyFor(page),key=cacheContext?await digestKey(cacheContext+sourceKey):sourceKey;
        stats.keyMs+=performance.now()-timing;
        if(cacheMode()!=='off'&&cache.has(key)){stats.cacheHits++;return cache.get(key);}
        if(cacheContext){const saved=await measurementStore.get(key);if(saved){stats.cacheHits++;stats.persistentHits++;cache.set(key,saved);return saved;}}
        stats.measurements++;timing=performance.now();
        measurement={project:snapshot,page,options:currentOptions};await tick();stats.renderMs+=performance.now()-timing;
        timing=performance.now();await settleBookletMeasurement(measureRoot,{signal:controller.signal});stats.assetsMs+=performance.now()-timing;
        if(token!==generation)throw Object.assign(Error('Pagination superseded'),{cancelled:true});
        timing=performance.now();const value=measureBookletPage(measureRoot)??{height:0,capacity:970};
        stats.layoutMs+=performance.now()-timing;
        cache.set(key,value);if(cache.size>1500)cache.delete(cache.keys().next().value);
        if(cacheContext)await measurementStore.set(key,value);
        return value;
      };
      try{
        const next=await paginateFlow(snapshot,currentEdition,measure,{cancelled:()=>token!==generation,onprogress:p=>{if(token!==generation)return;const stage=`Paginating ${p.phase??'sections'}`;progress=`${stage} · section ${p.complete} of ${p.total}…`;reportProgress({stage,complete:p.complete,total:p.total,ready:false});}});
        if(token!==generation)return;
        const paginationMs=performance.now()-started;
        metrics={...stats,paginationMs,totalMs:paginationMs};
        const editingBookmark=documentEditor?.beforePagination(next.pages);
        result=next;ready=!prepareInitialPreview;progress=prepareInitialPreview?'Preparing page preview…':'';measurement=null;visible=new Set([0,1,2,active-1,active,active+1]);
        if(editingBookmark){const editedPage=next.pages.findIndex(p=>p.blocks.some(b=>b.id===selectedBlockId));if(editedPage>=0)visible.add(editedPage);}
        onmap?.({...next,ready});if(prepareInitialPreview)reportProgress({stage:'Preparing page preview',ready:false});await tick();
        if(prepareInitialPreview){
          await settleBookletMeasurement(root.querySelector('.flow-paper'),{signal:controller.signal});
          if(token!==generation)return;
          ready=true;progress='';onmap?.({...next,ready:true});reportProgress({stage:'Ready',ready:true});
        }
        if(anchorId&&offset!=null){const index=next.pages.findIndex(p=>p.blocks.some(b=>b.id===anchorId));if(index>=0){visible=new Set([...visible,index]);await tick();const el=root?.querySelector(`[data-flow-index="${index}"]`);if(el&&scrollRoot)scrollRoot.scrollTop+=el.getBoundingClientRect().top-offset;}}
        updateVisible();
        documentEditor?.afterPagination(editingBookmark);
        metrics={...stats,paginationMs,previewMs:performance.now()-started-paginationMs,totalMs:performance.now()-started};
        loadTimings.push(metrics);root.dataset.paginationRuns=JSON.stringify(loadTimings);
      }catch(e){if(e.cancelled||token!==generation)return;error=e.message;progress='';measurement=null;onmap?.({pages:[],issues:[],ready:false,error:e.message});reportProgress({stage:'Preparing pages',ready:false,error:e.message});}
    });
    return()=>{generation++;controller.abort();};
  });
  function updateVisible(){
    if(!root||!scrollRoot)return;const bounds=scrollRoot.getBoundingClientRect(),next=new Set();let nearest=0,distance=Infinity;
    root.querySelectorAll('[data-flow-index]').forEach(el=>{const r=el.getBoundingClientRect(),i=Number(el.dataset.flowIndex);if(r.bottom>bounds.top-1500&&r.top<bounds.bottom+1500)next.add(i);const d=Math.abs(r.top-bounds.top-80);if(d<distance){nearest=i;distance=d;}});
    result.pages.forEach((p,i)=>{if(editing&&p.blocks.some(b=>b.id===selectedBlockId)||result.issues.some(issue=>p.blocks.some(b=>b.id===issue.id)))next.add(i);});
    if([...next].join()!==[...visible].join())visible=next;
    if(nearest!==active){active=nearest;onpage?.(result.pages[active]);}
  }
  onMount(()=>{scrollRoot=root.closest('.project-canvas');const observer=new ResizeObserver(()=>{width=root.parentElement.clientWidth;updateVisible();});observer.observe(root.parentElement);scrollRoot?.addEventListener('scroll',updateVisible,{passive:true});return()=>{generation++;observer.disconnect();scrollRoot?.removeEventListener('scroll',updateVisible);};});
</script>
<div class="flow-document" bind:this={root} onclick={followReference} role="presentation" data-pagination-metrics={metrics?JSON.stringify(metrics):undefined} data-paginated-edition={result.edition} data-pagination-state={error?'error':ready&&result.edition===edition?'ready':'pending'} aria-busy={!ready&&!error}>
  {#if progress}<p role="status">{progress}</p>{/if}
  {#if error}<p role="alert">Pagination failed: {error}</p>{/if}
  {#each result.issues as issue}<p class="layout-issue" role="alert"><button onclick={()=>jumpTo(issue.id)}>{issue.id}</button>: {issue.message}</p>{/each}
  <div class="flow-paper" style:zoom={scale}>
    {#each result.pages as page,index (page.id)}
      {@const boundary=page.blocks[0]?.flow?.fragment?'automatic':pageBoundaryKind(project,page.blocks[0]?.id)}
      <section class="flow-page-group" data-flow-index={index} data-page-number={page.pageNumber}>
        <div class="page-boundary"><button class="page-marker" aria-label={`Page ${page.pageNumber}: ${page.section.title}, ${page.section.difficultyTitle??''}`} onclick={()=>onpage?.(page)} ondragover={e=>e.preventDefault()} ondrop={e=>{e.preventDefault();onmove?.(e.dataTransfer.getData('application/x-booklet-block'),page.section.sourceSectionId,page.blocks[0]?.id);}}><span>Page {page.pageNumber} · {page.section.difficultyTitle??page.section.title}</span><small>{boundary==='manual'?'Manual page break':boundary==='source'?'Source page boundary':page.breakReason==='manual'?'Manual continuation':page.breakReason==='section'?'New section':'Automatic page break'}</small></button>{#if boundary==='manual'&&onremovebreak}<button class="remove-break" aria-label={'Remove manual break before page '+page.pageNumber} onclick={()=>onremovebreak(page.blocks[0]?.id)}>Remove</button>{/if}</div>
        {#if visible.has(index)||result.pages.length<8}
          <div class="flow-page-content" onclick={()=>onselect?.(page)} role="presentation"><BookletPageGuide revision={signature} pending={!ready}><FlowBookletPage {project} {page} pages={result.pages} {options} editMode={true} {onContentEdit} {onSpaceResize}/></BookletPageGuide></div>
        {:else}<div class="page-placeholder" aria-label={`Page ${page.pageNumber} content`}></div><div class="placeholder-status" aria-hidden="true"></div>{/if}
      </section>
    {/each}
  </div>
</div>
<div class="flow-measure" bind:this={measureRoot} aria-hidden="true" inert>{#if measurement}<FlowBookletPage project={measurement.project} page={measurement.page} pages={[measurement.page]} options={measurement.options}/>{/if}</div>
<style>
.page-boundary{display:flex;align-items:center;gap:10px}.remove-break{font:13px system-ui;border:1px solid #ccd5df;border-radius:4px;background:var(--panel,#fff);color:inherit;padding:4px 8px;cursor:pointer}
.flow-document{min-width:0}.flow-paper{width:210mm;margin:auto;color:#24282d}.page-marker{display:flex;width:100%;justify-content:space-between;align-items:center;border:0;background:transparent;color:var(--text,#465f7b);padding:10px 0;cursor:pointer;font:14px system-ui}.page-marker small{color:inherit}.flow-page-group{scroll-margin-top:110px;margin-bottom:20px}.page-placeholder{background:white;height:297mm;box-shadow:0 2px 8px #182c4224}.placeholder-status{height:34px}.flow-measure{position:fixed;left:-20000px;top:0;width:210mm;visibility:hidden;pointer-events:none}.layout-issue{padding:12px;background:#fff2de;color:#633d04}.flow-page-content{display:flow-root}
</style>
