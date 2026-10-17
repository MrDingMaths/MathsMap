<script>
 import {blockSpacing,BLOCK_SPACING_FIELDS} from '../lib/booklet-bulk-spacing.js';
 let {project,blockIds=[],onchange,category='layout'}=$props();
 const state=$derived(blockSpacing(project,blockIds));
 const groups=$derived([
  ['Answer spaces',[['height','Height (mm)',state.counts.spaces],['gap','Gap between parts (mm)',state.counts.stacks]]],
  ['Text',[['lineHeight','Line spacing',state.counts.paragraphs],['spaceBefore','Space before (mm)',state.counts.spaced],['spaceAfter','Space after (mm)',state.counts.spaced]]],
  ['Tables',[['rowHeight','Row height (mm)',state.counts.rows],['padding','Cell padding (mm)',state.counts.tables]]],
  ['Worked examples',[['aboveMm','Space above (mm)',state.counts.examples],['belowMm','Space below (mm)',state.counts.examples],['gapMm','Column gap (mm)',state.counts.examples],['minHeightMm','Minimum height (mm)',state.counts.examples]]],
 ].filter(([title])=>category==='tables'?title==='Tables':title!=='Tables').map(([title,fields])=>[title,fields.filter(f=>f[2])]).filter(([,fields])=>fields.length));
 function commit(key,input){if(input.value===''||!input.validity.valid)return;onchange(key,Number(input.value));}
</script>
<section aria-label="Whole block spacing">
 {#each groups as [title,fields]}
  <h4>{title}</h4>
  <div class="fields">{#each fields as [key,label,count]}<label title={count+' affected'}>{label}<input aria-label={key==='height'?'Whole question answer space height (mm)':key==='gap'?'Whole question vertical gap (mm)':'Whole block '+title.toLowerCase()+': '+label.toLowerCase()} type="number" min={BLOCK_SPACING_FIELDS[key][1]} max={BLOCK_SPACING_FIELDS[key][2]} step={key==='lineHeight'?.05:.5} placeholder={state.values[key]===''?'Mixed':''} value={state.values[key]} onchange={e=>commit(key,e.currentTarget)} onkeydown={e=>{if(e.key==='Enter')e.currentTarget.blur();}}/></label>{/each}</div>
 {:else}<p>Nothing in this block has adjustable spacing.</p>{/each}
</section>
<style>section{font:14px system-ui}h4{font:600 12px system-ui;text-transform:uppercase;letter-spacing:.04em;color:var(--text-muted,#617086);margin:12px 0 6px}h4:first-child{margin-top:0}.fields{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px 10px}label{display:grid;gap:4px;font-size:13px;align-content:end}input{font:inherit;padding:6px;width:100%;min-width:0;min-height:32px;box-sizing:border-box;color:inherit;background:var(--panel,#fff);border:1px solid var(--line,#cbd5e1);border-radius:5px}p{font-size:13px;color:var(--text-muted,#617086);margin:0}</style>
