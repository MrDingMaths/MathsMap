// Safe, local-only adapters for explicitly linked Codex session metadata.
// Never return message bodies, tool arguments/results, instructions or credentials.
import fs from 'node:fs';
import {createHash} from 'node:crypto';

export const USAGE_FIELDS=Object.freeze(['input_tokens','cached_input_tokens','cache_write_input_tokens','output_tokens','reasoning_output_tokens','total_tokens']);
const number=value=>typeof value==='number'&&Number.isFinite(value)&&value>=0?value:null;
export const timestamp=value=>typeof value==='number'&&Number.isFinite(value)?value:typeof value==='string'&&Number.isFinite(Date.parse(value))?Date.parse(value):null;
const digest=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
const counterKey=value=>digest([value.input_tokens,value.output_tokens,value.total_tokens]);
const taskTime=(value,fallback)=>typeof value==='number'&&value>=0&&value<1e11?value*1000:timestamp(value)??fallback;

export function normalizeUsage(value) {
 const usage=Object.fromEntries(USAGE_FIELDS.map(key=>[key,number(value?.[key]) ]));
 usage.cached_input_tokens??=number(value?.input_tokens_details?.cached_tokens);
 usage.reasoning_output_tokens??=number(value?.output_tokens_details?.reasoning_tokens);
 if(usage.input_tokens!==null&&usage.cached_input_tokens>usage.input_tokens)usage.cached_input_tokens=null;
 if(usage.output_tokens!==null&&usage.reasoning_output_tokens>usage.output_tokens)usage.reasoning_output_tokens=null;
 // Cache and reasoning are subsets, not additional tokens.
 if(usage.input_tokens!==null&&usage.output_tokens!==null)usage.total_tokens=usage.input_tokens+usage.output_tokens;
 return usage;
}

export function aggregateUsage(records) {
 const usage=Object.fromEntries(USAGE_FIELDS.map(key=>[key,null])),unavailableByMetric=Object.fromEntries(USAGE_FIELDS.map(key=>[key,0]));
 let missingUsage=0;
 for(const record of records){
  const value=normalizeUsage(record.usage);
  if(USAGE_FIELDS.every(key=>value[key]===null))missingUsage++;
  for(const key of USAGE_FIELDS)if(value[key]===null)unavailableByMetric[key]++;else usage[key]=(usage[key]??0)+value[key];
 }
 return {usage,missingUsage,unavailableByMetric};
}

export function unionDuration(intervals) {
 let total=0,end=-Infinity;
 for(const [a,b]of intervals.filter(([a,b])=>Number.isFinite(a)&&Number.isFinite(b)&&b>=a).toSorted((a,b)=>a[0]-b[0])){total+=Math.max(0,b-Math.max(a,end));end=Math.max(end,b);}
 return total;
}

export function overlapDuration(left,right) {
 const intersections=[];
 for(const [a,b]of left)for(const [c,d]of right)if(Math.min(b,d)>Math.max(a,c))intersections.push([Math.max(a,c),Math.min(b,d)]);
 return unionDuration(intersections);
}

// Iterate lines so entire transcripts/base64 payloads are not retained in memory.
function* jsonLines(file) {
 const fd=fs.openSync(file,'r'),buffer=Buffer.alloc(64*1024);let pending='',line=0;
 // StringDecoder preserves UTF-8 characters at buffer boundaries.
 const decoder=new TextDecoder();
 try{
  let size;
  while((size=fs.readSync(fd,buffer,0,buffer.length,null))){
   pending+=decoder.decode(buffer.subarray(0,size),{stream:true});let end;
   while((end=pending.indexOf('\n'))>=0){const raw=pending.slice(0,end);pending=pending.slice(end+1);line++;if(raw.trim())yield {raw,line,tail:false};}
  }
  pending+=decoder.decode();if(pending.trim())yield {raw:pending,line:line+1,tail:true};
 }finally{fs.closeSync(fd);}
}

function mergeRecords(records) {
 const unique=new Map();let duplicates=0,conflicts=0;
 for(const row of records){
  const previous=unique.get(row.id);
  if(!previous){unique.set(row.id,{...row,usage:normalizeUsage(row.usage)});continue;}
  duplicates++;
  for(const key of USAGE_FIELDS){
   const old=previous.usage[key],value=normalizeUsage(row.usage)[key];
   if(old!==null&&value!==null&&old!==value){previous.usage[key]=null;previous.conflictingUsage=true;conflicts++;}
   else if(old===null&&value!==null&&!previous.conflictingUsage)previous.usage[key]=value;
  }
 }
 return {records:[...unique.values()],duplicates,conflicts};
}

// A first cumulative snapshot is not a fresh-call counter. Use its explicit last
// usage, then deltas; repeated snapshots (including rate-limit updates) count once.
function cumulativeRecords(snapshots,directTotals) {
 const rows=[],seen=new Set();let previous=null,baselineUnavailable=false,counterRegressions=0;
 for(const snapshot of snapshots){
  const total=normalizeUsage(snapshot.total),key=counterKey(total);
  if(USAGE_FIELDS.every(field=>total[field]===null)){baselineUnavailable=true;continue;}
  if(seen.has(key))continue;seen.add(key);
  const fields=USAGE_FIELDS.filter(field=>total[field]!==null&&previous?.[field]!==null&&previous?.[field]!==undefined);
  if(previous&&fields.some(field=>total[field]<previous[field])){
   counterRegressions++;rows.push({id:'cumulative:'+key,time:snapshot.time,turnId:snapshot.turnId,usage:null,kind:'unavailable-cumulative-regression'});continue;
  }
  let usage;
  if(!previous){usage=normalizeUsage(snapshot.last);baselineUnavailable=USAGE_FIELDS.some(field=>total[field]!==null&&(usage[field]===null||total[field]!==usage[field]));}
  else usage=Object.fromEntries(USAGE_FIELDS.map(field=>[field,total[field]!==null&&previous[field]!==null?total[field]-previous[field]:null]));
  previous=total;
  if(directTotals.has(key))continue;
  if(USAGE_FIELDS.every(field=>usage[field]===null)||USAGE_FIELDS.some(field=>(usage[field]??0)>0))rows.push({id:'cumulative:'+key,time:snapshot.time,turnId:snapshot.turnId,usage,kind:'cumulative-delta'});
 }
 return {rows,baselineUnavailable,counterRegressions};
}

export function readCodexSessionUsage(file,{sessionId,startedAt=null,endedAt=null}={}) {
 if(typeof sessionId!=='string'||!sessionId.trim())throw Error('Session usage requires an explicit session identity');
 const lower=startedAt===null?-Infinity:timestamp(startedAt),upper=endedAt===null?Infinity:timestamp(endedAt);
 if(lower===null||upper===null||upper<=lower)throw Error('Invalid linked session interval');
 if(!fs.existsSync(file))return {sessionId,available:false,reason:'rollout-unavailable',records:[],intervals:[],unfinished:[],toolCalls:null,compactions:null,usage:normalizeUsage(null),missingUsage:1};
 const identities=new Set(),direct=[],directTotals=new Set(),snapshots=[],toolRows=new Map(),compactionRows=new Map(),starts=new Map(),ends=new Map();
 let currentTurn=null,canonicalSessionId=null,incompleteTail=false,unidentifiedUsageRecords=0;
 const keep=time=>time!==null&&time>=lower&&time<upper;
 const addDirect=(payload,time)=>{
  if(!payload?.response_id){unidentifiedUsageRecords++;return;}
  direct.push({id:'response:'+payload.response_id,responseId:payload.response_id,turnId:payload.turn_id??currentTurn,time,usage:payload.usage,elapsedMs:number(payload.duration_ms??payload.elapsed_ms),kind:'response'});
  if(payload.thread_token_usage)directTotals.add(counterKey(normalizeUsage(payload.thread_token_usage)));
 };
 for(const {raw,line,tail}of jsonLines(file)){
  let event;try{event=JSON.parse(raw);}catch{if(tail){incompleteTail=true;break;}throw Error('Invalid session event JSON at line '+line);}
  const payload=event.payload??{},time=timestamp(event.timestamp??event.at??event.time);
  if(event.type==='session_meta'){canonicalSessionId=payload.id??payload.session_id;for(const key of ['id','session_id'])if(typeof payload[key]==='string')identities.add(payload[key]);}
  else if(event.type==='thread.started'&&event.thread_id){identities.add(event.thread_id);canonicalSessionId??=event.thread_id;}
  else if(event.type==='turn_context')currentTurn=payload.turn_id??currentTurn;
  else if(event.type==='token_usage_record')addDirect(payload,time);
  else if(event.type==='event_msg'&&payload.type==='token_count'){
   if(payload.info?.total_token_usage)snapshots.push({time,turnId:currentTurn,total:payload.info.total_token_usage,last:payload.info.last_token_usage});
  }else if(event.type==='event_msg'&&payload.type==='task_started'){
   currentTurn=payload.turn_id??currentTurn;const id=payload.turn_id??'turn-line-'+line;
   if(!starts.has(id))starts.set(id,{time:time??taskTime(payload.started_at,null),turnId:id});
  }else if(event.type==='event_msg'&&payload.type==='task_complete'){
   const id=payload.turn_id??currentTurn;if(id)ends.set(id,{time:time??taskTime(payload.completed_at,null),turnId:id});
  }else if(event.type==='response_item'&&['function_call','custom_tool_call','tool_call'].includes(payload.type)){
   const id=payload.call_id??payload.id??'tool-line-'+line;if(!toolRows.has(id))toolRows.set(id,{id,time});
  }else if(event.type==='compacted'){
   const id=payload.compaction_response_id??payload.window_id??'compaction-line-'+line;if(!compactionRows.has(id))compactionRows.set(id,{id,time});
   if(payload.latest_token_usage_record)addDirect(payload.latest_token_usage_record,time);
  }
 }
 if(!identities.has(sessionId))throw Error('Linked session identity does not match rollout metadata');
 const fallback=cumulativeRecords(snapshots,directTotals),merged=mergeRecords([...direct,...fallback.rows]);
 const records=merged.records.filter(row=>keep(row.time)).map(row=>({...row,sessionId:canonicalSessionId??sessionId})),intervals=[],unfinished=[];
 for(const [id,start]of starts){
  const finish=ends.get(id);
  if(!finish){if(start.time!==null&&start.time<upper)unfinished.push({turnId:id,startedAt:new Date(start.time).toISOString()});continue;}
  if(start.time!==null&&finish.time!==null&&finish.time>=start.time&&finish.time>lower&&start.time<upper)intervals.push([Math.max(start.time,lower),Math.min(finish.time,upper)]);
 }
 const tools=[...toolRows.values()].filter(row=>keep(row.time)),compactions=[...compactionRows.values()].filter(row=>keep(row.time));
 return {sessionId,canonicalSessionId,sessionAliases:[...identities],available:true,records,intervals,unfinished,...aggregateUsage(records),toolCalls:tools.length,toolRecords:tools,compactions:compactions.length,compactionRecords:compactions,
  calls:records.length,responseCalls:records.filter(row=>row.kind==='response').length,cumulativeObservations:records.filter(row=>row.kind!=='response').length,
  duplicatedRecords:merged.duplicates,conflictingMetrics:merged.conflicts,incompleteTail,baselineUnavailable:fallback.baselineUnavailable,counterRegressions:fallback.counterRegressions,unidentifiedUsageRecords,
  coverage:!records.length?'unavailable':incompleteTail||fallback.baselineUnavailable||fallback.counterRegressions||merged.conflicts||unidentifiedUsageRecords?'partial':'recorded',
  note:'Numeric metadata only. Response IDs are deduplicated; legacy cumulative observations are deltas, not necessarily individual model calls. Cached input and reasoning output are subsets. Completed task intervals measure active session work; missing call durations and human waiting are not inferred.'};
}

export function summarizeWeeklyUsage(observations) {
 const unique=new Map();for(const row of observations)if(!unique.has(row.id))unique.set(row.id,row);
 const rows=[...unique.values()].toSorted((a,b)=>timestamp(a.at)-timestamp(b.at)),windows=new Map();
 for(const row of rows){const key=[row.limitId??'codex',timestamp(row.resetAt),row.windowMinutes].join(':');(windows.get(key)??(windows.set(key,[]),windows.get(key))).push(row);}
 const summaries=[...windows].map(([key,entries])=>{
  const first=entries[0],last=entries.at(-1),concurrent=entries.some(row=>row.unrelatedConcurrentUsage==='present'||row.unrelatedSessionIds?.length)?'present':entries.every(row=>row.unrelatedConcurrentUsage==='none')?'none':'unknown';
  const regression=entries.some((row,index)=>index&&row.usedPercent<entries[index-1].usedPercent),change=entries.length>1&&!regression?last.usedPercent-first.usedPercent:null;
  return {key,resetAt:first.resetAt,windowMinutes:first.windowMinutes,observations:entries.length,startedAt:first.at,endedAt:last.at,observedChangePercentagePoints:change,attributedToRunPercentagePoints:concurrent==='none'?change:null,unrelatedConcurrentUsage:concurrent,
   reason:entries.length<2?'needs-two-observations':regression?'non-monotonic-allowance':concurrent!=='none'?'concurrent-usage-not-excluded':null};
 });
 const single=summaries.length===1?summaries[0]:null;
 return {windows:summaries,observedChangePercentagePoints:single?.observedChangePercentagePoints??null,attributedToRunPercentagePoints:single?.attributedToRunPercentagePoints??null,
  reason:summaries.length>1?'different-reset-windows':single?.reason??'no-recorded-observations',note:'Allowance changes are compared only inside one reset window. Attribution requires an explicit assertion that unrelated concurrent usage was absent; token counts do not establish allowance consumption.'};
}
