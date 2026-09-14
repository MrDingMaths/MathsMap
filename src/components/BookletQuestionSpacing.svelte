<script>
 import {questionSpacing} from '../lib/booklet-document-tools.js';
 let {project,block,onchange}=$props();
 const spacing=$derived(questionSpacing(project,block));
</script>
<section aria-label="Whole question spacing">

 <label>Answer space height (mm)<input aria-label="Whole question answer space height (mm)" type="number" min="0" max="180" step=".5" placeholder="Mixed" disabled={!spacing.spaces.length} value={spacing.height} onchange={e=>{if(e.currentTarget.value!=='')onchange('height',Number(e.currentTarget.value));}}/></label>
 <small>{spacing.spaces.length} answer spaces · excludes cloze boxes</small>
 <label>Vertical gap (mm)<input aria-label="Whole question vertical gap (mm)" type="number" min="0" max="30" step=".5" placeholder="Mixed" disabled={!spacing.stacks.length} value={spacing.gap} onchange={e=>{if(e.currentTarget.value!=='')onchange('gap',Number(e.currentTarget.value));}}/></label>

</section>
<style>section{display:grid;gap:8px;font:14px system-ui}label{display:grid;gap:5px}input{font:inherit;padding:6px;width:100%;box-sizing:border-box}small{line-height:1.4;color:var(--text-muted,#617086)}</style>
