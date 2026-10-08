<script>
  // One outline item: tick box, what kind of content it is, and for practice
  // questions the reasoning load. Shared by the booklet outline and the library.
  import BookletRichText from './BookletRichText.svelte';
  import {contentExcerpt,outlineKind} from '../lib/booklet-workspace.js';
  import {questionDifficulty} from '../lib/booklet-bank-ratings.js';
  let {block,number=null,page=null,checked=false,active=false,pressed=false,oncheck=null,onpick=null}=$props();
  const kind=$derived(outlineKind(block));
  const rating=$derived(kind.kind==='question'?questionDifficulty(block):null);
  const chip=$derived(kind.kind==='question'?'Q'+(number??''):kind.label);
  // A custom activity name or subtitle sits beside the chip.
  const detail=$derived([block.sourceAtom?.label&&block.sourceAtom.label!==kind.label?block.sourceAtom.label:'',block.sourceAtom?.visibleSubtitle??'',!block.sourceAtom&&block.type!=='question'?block.title||block.label||'':''].filter(Boolean).join(' · '));
  const name=$derived((kind.kind==='question'?'Question '+(number??''):kind.label)+(detail?' · '+detail:''));
  const excerpt=$derived(contentExcerpt(block.content,85));
</script>
<input class="content-check" type="checkbox" aria-label={'Select '+name} {checked} onclick={e=>e.stopPropagation()} onchange={e=>oncheck?.(e.currentTarget.checked,e)}/>
<button class="content-select" class:active aria-pressed={pressed} aria-label={name} onclick={e=>onpick?.(e)}>
  <span class="content-label"><span class="kind" data-kind={kind.kind}>{chip}</span><span class="detail">{detail}</span>{#if rating}<span class="load" data-band={rating.difficulty} title={`Reasoning load ${rating.reasoningScore} · ${rating.difficulty}${rating.difficultyReason?' — '+rating.difficultyReason:''}`}>{rating.difficulty[0]} {rating.reasoningScore}</span>{/if}<small>{page?'p'+page:''}</small></span>
  {#if excerpt}<div class="excerpt"><BookletRichText text={excerpt}/></div>{/if}
</button>
<style>
  .content-check{flex:none;width:15px;height:15px;min-height:0;margin:10px 0 0 4px;padding:0;accent-color:#268cff;cursor:pointer}
  .content-select{flex:1;min-width:0;text-align:left;padding:7px 6px;font:inherit;color:inherit;background:transparent;border:0;border-radius:4px;cursor:pointer}
  .content-select:hover{background:#268cff12}.content-select:focus-visible,.content-check:focus-visible{outline:2px solid #268cff;outline-offset:1px}
  .content-label{display:flex;align-items:center;gap:6px;font-weight:500}.detail{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .content-label small{font-size:12px;color:var(--text-muted,#647181);font-weight:400;white-space:nowrap}
  .kind,.load{flex:none;font-size:11px;font-weight:600;line-height:1;padding:3px 6px;border-radius:4px;white-space:nowrap;color:#24282d;background:#e6eaef}
  .kind[data-kind=definition]{background:#dbe9f8}.kind[data-kind=key-ideas]{background:#e8e0f6}.kind[data-kind=investigation]{background:#fbe9c6}.kind[data-kind=identify]{background:#d8efec}
  .kind[data-kind=example]{background:#fde2cf}.kind[data-kind=guided-practice]{background:#dff0d8}.kind[data-kind=question]{background:transparent;border:1px solid #9aa7b5;padding:2px 5px}
  .load{font-weight:500;font-variant-numeric:tabular-nums}.load[data-band=Foundation]{background:#dff0d8}.load[data-band=Development]{background:#fbe9c6}.load[data-band=Mastery]{background:#fde2cf}.load[data-band=Challenge]{background:#f6d5d5}
  .excerpt{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;font-size:12px;line-height:1.4;color:var(--text-muted,#647181);margin-top:3px}
  .active .excerpt,.active .content-label small{color:#405b73}.excerpt :global(p){margin:0!important}.excerpt :global(.document-content){font-size:12px}
</style>
