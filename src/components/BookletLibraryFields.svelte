<script>
  import { PROJECT_CATEGORIES, normalizeProjectLibrary } from '../lib/booklet-library.js';
  let { library, courses = [], onchange, allowUnassigned = true, disabled = false } = $props();
  const value = $derived(normalizeProjectLibrary(library));
  function update(patch){onchange({...value,...patch});}
</script>
<label>Project category<select aria-label="Project category" value={value.category??''} disabled={disabled} onchange={e=>update({category:e.currentTarget.value||null})}>
  {#if allowUnassigned}<option value="">Unassigned</option>{/if}
  {#each PROJECT_CATEGORIES as [id,label]}<option value={id}>{label}</option>{/each}
</select></label>
<label>Home course<select aria-label="Home course" value={value.courseId} disabled={disabled} onchange={e=>update({courseId:e.currentTarget.value})}>
  <option value="">Unassigned</option>{#each [...courses].sort((a,b)=>a.stage-b.stage||a.order-b.order) as course}<option value={course.id}>Stage {course.stage} / {course.title}</option>{/each}
</select></label>
{#if value.category==='class'}<label>Class label<input aria-label="Class label" value={value.classLabel} disabled={disabled} onchange={e=>update({classLabel:e.currentTarget.value})}/></label>{/if}
<style>label{display:block;margin:10px 0;font-size:13px}select,input{display:block;box-sizing:border-box;width:100%;margin-top:4px;padding:6px}</style>
