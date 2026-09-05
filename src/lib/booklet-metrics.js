import { studioProject, reviewTargets } from './booklet-review-model.js';
export const WORKFLOW_STAGES=['import','audit','revision','assembly','export'];
export function recordMetric(project,event) {
  if(!WORKFLOW_STAGES.includes(event.stage))throw new Error('Choose a workflow stage');
  const p=studioProject(project),value=Number(event.value??1);
  if(!Number.isFinite(value)||value<0)throw new Error('Measurement must be a non-negative number');
  p.studio.metrics.push({...event,value,at:new Date().toISOString()});return p;
}
export function workflowMeasurement(project) {
  const targets=reviewTargets(project),pages=new Set(project.sections.map(s=>s.sourcePageNumber).filter(Boolean)),questions=targets.filter(t=>t.kind==='block'&&t.block.type==='question').length;
  const events=project.studio?.metrics??[],operations=(project.studio?.proposals??[]).flatMap(p=>p.operations),accepted=operations.filter(o=>o.status==='accepted').length,rejected=operations.filter(o=>o.status==='rejected').length;
  const sum=(type,stage)=>events.filter(e=>(e.type===type || type==='diagram-replacement'&&e.type==='diagram')&&(!stage||e.stage===stage)).reduce((n,e)=>n+Number(e.value??1),0);
  return {format:'mathsmap-workflow-measurement-v1',projectId:project.id,revision:project.revision,pages:pages.size,questions,stages:WORKFLOW_STAGES.map(stage=>({stage,handsOnMinutes:events.some(e=>e.stage===stage&&e.type==='minutes')?sum('minutes',stage):null,corrections:sum('correction',stage),diagramReplacements:sum('diagram-replacement',stage),aiRetries:sum('ai-retry',stage)})),correctionsPerPage:pages.size?sum('correction')/pages.size:null,correctionsPerQuestion:questions?sum('correction')/questions:null,acceptedProposals:accepted,rejectedProposals:rejected,acceptedProposalRate:accepted+rejected?accepted/(accepted+rejected):null,events};
}
