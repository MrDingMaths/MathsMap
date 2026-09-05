<script>
  import { onMount } from 'svelte';
  import { WORKFLOW_STAGES, recordMetric, workflowMeasurement } from '../lib/booklet-metrics.js';
  let {project,onchange}=$props();
  let stage=$state('audit'),type=$state('minutes'),value=$state(1),note=$state(''),started=$state(null),error=$state('');
  const report=$derived(workflowMeasurement(project));
  function record(event){try{onchange(recordMetric(project,event));error='';}catch(e){error=e.message;}}
  function stop(){if(started===null)return;const minutes=(Date.now()-started)/60000;started=null;record({stage,type:'minutes',value:minutes,note:'Active timer'});}
  onMount(()=>{const hide=()=>{if(document.hidden)stop();};document.addEventListener('visibilitychange',hide);return()=>document.removeEventListener('visibilitychange',hide);});
  function download(){const url=URL.createObjectURL(new Blob([JSON.stringify(report,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download=project.id+'-measurements.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
</script>
<details class="workflow-metrics project-screen"><summary>Workflow measurements</summary>
  <p>Record hands-on effort and corrections while reviewing. The timer pauses when this tab is hidden. Stop it before switching booklets.</p>
  <div class="controls"><label>Stage<select bind:value={stage} disabled={started!==null}>{#each WORKFLOW_STAGES as item}<option>{item}</option>{/each}</select></label><button onclick={()=>started===null?started=Date.now():stop()}>{started===null?'Start hands-on timer':'Stop and record time'}</button><label>Measure<select bind:value={type}><option value="minutes">Hands-on minutes</option><option value="correction">Corrections</option><option value="diagram-replacement">Diagram replacements</option><option value="ai-retry">AI retries</option></select></label><label>Amount<input type="number" min="0" step="0.1" bind:value/></label><label>Page / question and note<input bind:value={note}/></label><button onclick={()=>record({stage,type,value,note})}>Record measurement</button></div>
  <table><thead><tr><th>Stage</th><th>Minutes</th><th>Corrections</th><th>Diagram replacements</th><th>AI retries</th></tr></thead><tbody>{#each report.stages as item}<tr><td>{item.stage}</td><td>{item.handsOnMinutes?.toFixed(1)??'Not recorded'}</td><td>{item.corrections}</td><td>{item.diagramReplacements}</td><td>{item.aiRetries}</td></tr>{/each}</tbody></table>
  <p>{report.pages} source pages · {report.questions} questions · {report.correctionsPerPage?.toFixed(2)??'—'} corrections/page · {report.correctionsPerQuestion?.toFixed(2)??'—'} corrections/question · {report.acceptedProposalRate===null?'No proposals decided':Math.round(report.acceptedProposalRate*100)+'% proposals accepted'}</p>
  <button onclick={download}>Download measurements</button>{#if error}<p role="alert">{error}</p>{/if}
</details>
<style>.workflow-metrics{padding:1rem;border:1px solid #cad8e1;border-radius:8px;margin:1rem 0;background:white}.workflow-metrics summary{cursor:pointer;font-weight:700}.controls{display:flex;align-items:end;flex-wrap:wrap;gap:.5rem}label{display:grid;gap:.3rem;font-size:.8rem}input,select,button{padding:.4rem;border:1px solid #c6d1da;border-radius:4px}input[type=number]{width:65px}table{margin:.8rem 0;border-collapse:collapse;width:100%;font-size:.8rem}th,td{text-align:left;border:1px solid #dce5eb;padding:.4rem}</style>
