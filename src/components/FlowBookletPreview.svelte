<script>
  import {tick,onMount} from 'svelte';
  import FlowBookletPage from './FlowBookletPage.svelte';
  import {paginateFlow} from '../lib/booklet-pagination.js';
  import {settleBookletMeasurement,measurementKeyFor} from '../lib/booklet-measurement.js';
  let {project,edition='student',options={},zoom='width',selectedBlockId='',editing=false,onmap=null,onpage=null,onselect=null,onContentEdit=null,onSpaceResize=null,onmove=null}=$props();
  let measurement=$state.raw(null),result=$state.raw({pages:[],issues:[]}),progress=$state('Preparing pages…'),ready=$state(false),error=$state('');
  let metrics=$state.raw(null);
  let measureRoot,root=$state(),width=$state(794),active=$state(0),visible=$state(new Set()),generation=0,queue=Promise.resolve(),scrollRoot;
  const cache=new Map();
  const scale=$derived(zoom==='width'||zoom==='page'?Math.min(1,width/794):Number(zoom)||1);
  const signature=$derived(JSON.stringify([project.id,project.sections,project.topics,project.settings,edition,options]));
  export function jumpTo(id){const index=result.pages.findIndex(p=>p.id===id||p.blocks.some(b=>b.id===id));if(index<0)return;visible=new Set([...visible,index]);tick().then(()=>root?.querySelector(`[data-flow-index="${index}"]`)?.scrollIntoView({block:'start'}));}
  export async function waitUntilReady(){await queue;if(error)throw Error(error);if(!ready)throw Error('Pagination is still updating.');if(result.issues.length)throw Error(result.issues.map(i=>`${i.id}: ${i.message}`).join('\n'));return result;}
  $effect(()=>{
    signature;
    const snapshot=project,currentEdition=edition,currentOptions={...options},token=++generation,controller=new AbortController();
    ready=false;error='';onmap?.({pages:[],issues:[],ready:false});
    queue=queue.catch(()=>{}).then(async()=>{
      if(token!==generation)return;
      const started=performance.now(),stats={measurements:0,cacheHits:0,keyMs:0,renderMs:0,assetsMs:0,layoutMs:0};
      const keyFor=measurementKeyFor(snapshot,currentOptions);let lastYield=started;
      const anchor=root?.querySelector(`[data-flow-index="${active}"]`),anchorId=result.pages[active]?.blocks[0]?.id,offset=anchor?.getBoundingClientRect().top;
      const measure=async page=>{
        let timing=performance.now();
        const key=keyFor(page);
        stats.keyMs+=performance.now()-timing;
        if(cache.has(key)){stats.cacheHits++;return cache.get(key);}
        stats.measurements++;timing=performance.now();
        measurement={project:snapshot,page,options:currentOptions};await tick();stats.renderMs+=performance.now()-timing;
        timing=performance.now();await settleBookletMeasurement(measureRoot,{signal:controller.signal});stats.assetsMs+=performance.now()-timing;
        if(token!==generation)throw Object.assign(Error('Pagination superseded'),{cancelled:true});
        timing=performance.now();const main=measureRoot.querySelector('main'),footer=measureRoot.querySelector('footer');
        const start=main?.getBoundingClientRect().top??0;
        const end=Math.max(start,...[...(main?.children??[])].map(el=>el.getBoundingClientRect().bottom));
        const value={height:end-start,capacity:footer?footer.getBoundingClientRect().top-start-12:970};
        stats.layoutMs+=performance.now()-timing;
        cache.set(key,value);if(cache.size>1500)cache.delete(cache.keys().next().value);
        if(performance.now()-lastYield>32){await new Promise(resolve=>setTimeout(resolve,0));lastYield=performance.now();}
        return value;
      };
      try{
        const next=await paginateFlow(snapshot,currentEdition,measure,{cancelled:()=>token!==generation,onprogress:p=>progress=`Paginating section ${p.complete} of ${p.total}…`});
        if(token!==generation)return;
        metrics={...stats,totalMs:performance.now()-started};
        result=next;ready=true;progress='';measurement=null;visible=new Set([0,1,2,active-1,active,active+1]);onmap?.({...next,ready:true});await tick();
        if(anchorId&&offset!=null){const index=next.pages.findIndex(p=>p.blocks.some(b=>b.id===anchorId));if(index>=0){visible=new Set([...visible,index]);await tick();const el=root?.querySelector(`[data-flow-index="${index}"]`);if(el&&scrollRoot)scrollRoot.scrollTop+=el.getBoundingClientRect().top-offset;}}
        updateVisible();
      }catch(e){if(e.cancelled||token!==generation)return;error=e.message;measurement=null;onmap?.({pages:[],issues:[],ready:false,error:e.message});}
    });
    return()=>{generation++;controller.abort();};
  });
  function updateVisible(){
    if(!root||!scrollRoot)return;const bounds=scrollRoot.getBoundingClientRect(),next=new Set();let nearest=0,distance=Infinity;
    root.querySelectorAll('[data-flow-index]').forEach(el=>{const r=el.getBoundingClientRect(),i=Number(el.dataset.flowIndex);if(r.bottom>bounds.top-1500&&r.top<bounds.bottom+1500)next.add(i);const d=Math.abs(r.top-bounds.top-80);if(d<distance){nearest=i;distance=d;}});
    result.pages.forEach((p,i)=>{if(editing&&p.blocks.some(b=>b.id===selectedBlockId))next.add(i);});
    if([...next].join()!==[...visible].join())visible=next;
    if(nearest!==active){active=nearest;onpage?.(result.pages[active]);}
  }
  onMount(()=>{scrollRoot=root.closest('.project-canvas');const observer=new ResizeObserver(()=>{width=root.parentElement.clientWidth;updateVisible();});observer.observe(root.parentElement);scrollRoot?.addEventListener('scroll',updateVisible,{passive:true});return()=>{generation++;observer.disconnect();scrollRoot?.removeEventListener('scroll',updateVisible);};});
  function rememberHeight(el){const observer=new ResizeObserver(()=>{const height=el.scrollHeight;if(height>0)el.parentElement.dataset.height=height;});observer.observe(el);return{destroy(){observer.disconnect();}};}
</script>
<div class="flow-document" bind:this={root} data-pagination-metrics={metrics?JSON.stringify(metrics):undefined} data-paginated-edition={result.edition} data-pagination-state={error?'error':ready&&result.edition===edition?'ready':'pending'} aria-busy={!ready&&!error}>
  {#if progress}<p role="status">{progress}</p>{/if}
  {#if error}<p role="alert">Pagination failed: {error}</p>{/if}
  {#each result.issues as issue}<p class="layout-issue" role="alert"><button onclick={()=>jumpTo(issue.id)}>{issue.id}</button>: {issue.message}</p>{/each}
  <div class="flow-paper" style:zoom={scale}>
    {#each result.pages as page,index (page.id)}
      <section class="flow-page-group" data-flow-index={index} data-page-number={page.pageNumber}>
        <button class="page-marker" aria-label={`Page ${page.pageNumber}: ${page.section.title}, ${page.section.difficultyTitle??''}`} onclick={()=>onpage?.(page)} ondragover={e=>e.preventDefault()} ondrop={e=>{e.preventDefault();onmove?.(e.dataTransfer.getData('application/x-booklet-block'),page.section.sourceSectionId,page.blocks[0]?.id);}}><span>Page {page.pageNumber} · {page.section.difficultyTitle??page.section.title}</span><small>{page.breakReason==='manual'?'Manual page break':page.breakReason==='section'?'New section':'Page break'}</small></button>
        {#if visible.has(index)||result.pages.length<8}
          <div use:rememberHeight class="flow-page-content" onclick={()=>onselect?.(page)} role="presentation"><FlowBookletPage {project} {page} pages={result.pages} {options} compact={true} editMode={true} {onContentEdit} {onSpaceResize}/></div>
        {:else}<div class="page-placeholder" style:height={`${Math.max(100,Number(root?.querySelector(`[data-flow-index="${index}"]`)?.dataset.height)||850)}px`} aria-label={`Page ${page.pageNumber} content`}></div>{/if}
      </section>
    {/each}
  </div>
</div>
<div class="flow-measure" bind:this={measureRoot} aria-hidden="true" inert>{#if measurement}<FlowBookletPage project={measurement.project} page={measurement.page} pages={[measurement.page]} options={measurement.options}/>{/if}</div>
<style>
.flow-document{min-width:0}.flow-paper{width:210mm;margin:auto;background:white;color:#24282d}.page-marker{display:flex;width:100%;justify-content:space-between;align-items:center;border:0;border-top:1px dashed #aab9ca;background:#f5f7fa;color:#465f7b;padding:10px 15mm;cursor:pointer;font:14px system-ui}.page-marker small{color:#718096}.flow-page-group{scroll-margin-top:110px}.page-placeholder{background:white}.flow-measure{position:fixed;left:-20000px;top:0;width:210mm;visibility:hidden;pointer-events:none}.layout-issue{padding:12px;background:#fff2de;color:#633d04}.flow-page-content{display:flow-root}
</style>
