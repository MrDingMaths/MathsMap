<script>
  import {inspectContentCoverage,verificationAssetSignatures} from '../lib/booklet-content-verification.js';
  let {project,onselect=()=>{},layoutIssues=[]}=$props();
  let report=$state(null),error=$state(''),limit=$state(30),requested=$state.raw(null),checkedProject=$state.raw(null),checking=$state(false);
  const projectId=$derived(project.id);
  $effect(()=>{projectId;report=null;error='';limit=30;requested=null;checkedProject=null;checking=false;});
  $effect(()=>{
    const snapshot=requested?.project;if(!snapshot)return;let active=true;checking=true;error='';
    const timer=setTimeout(async()=>{
      try{
        const assetSignatures=await verificationAssetSignatures(snapshot,async src=>{
          const response=await fetch(src,{cache:'no-store'});
          if(!response.ok)throw Error('Missing diagram');
          return response.arrayBuffer();
        });
        const value=await inspectContentCoverage(snapshot,{assetSignatures});
        if(active){report=value;checkedProject=snapshot;error='';}
      }catch(e){if(active)error=e.message;}
      finally{if(active)checking=false;}
    },200);
    return()=>{active=false;clearTimeout(timer);};
  });
</script>
{#if project.source?.runId}
<details class="coverage"><summary>Source coverage and exceptions</summary>
  <button disabled={checking} onclick={()=>requested={project}}>{checking?'Checking source coverage…':report?'Recheck source coverage':'Check source coverage'}</button>
  {#if report&&checkedProject!==project}<p>The booklet has changed since this check. Recheck to update the findings.</p>{/if}
  {#if error}<p role="alert">{error}</p>{:else if !report}<p>Run a source comparison when you are ready to review the booklet.</p>{:else}
    <p>{report.counts.verified} verified · {report.counts.excluded} accounted exclusions · {report.issues.length} content findings</p>
    <p>Content fidelity: {report.contentComplete?'checked':'needs review'}. Teaching and arrangements: {report.presentation?.required?(report.presentation.complete?'checked':'needs review'):'legacy project'}. Rendered layout: {layoutIssues.length?`${layoutIssues.length} findings`:'use edition checks to verify'}.</p>
    {#each [...report.issues,...layoutIssues.map(i=>({...i,note:i.note??i.message??i.kind,targetId:i.blockId??i.id}))].slice(0,limit) as item}
      <p><button disabled={!item.targetId} onclick={()=>onselect(item.targetId)}>{item.kind}</button> {item.note}</p>
    {/each}
    {#if report.issues.length+layoutIssues.length>limit}<button onclick={()=>limit+=50}>Show more findings</button>{/if}
  {/if}
</details>
{/if}
<style>.coverage{margin-bottom:16px}.coverage p{font-size:14px;overflow-wrap:anywhere}.coverage button{font:inherit;cursor:pointer}</style>
