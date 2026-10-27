<script>
 // House palette swatches shared by text, table borders and fills.
 let {colours=[],label='Colour',onpick,custom=false,none=false,current=''}=$props();
</script>
<span class="swatches" role="group" aria-label={label}>
 {#if none}<button class="swatch none" aria-label={label+': none'} title="None" class:current={!current} onclick={()=>onpick('')}>⌀</button>{/if}
 {#each colours as colour}<button class="swatch" class:current={current===colour.value} aria-label={label+': '+colour.name} title={`${colour.name} (${colour.value})`} style:background-color={colour.value} onclick={()=>onpick(colour.value)}></button>{/each}
 {#if custom}<input type="color" aria-label={label+': custom'} title="Custom colour" value={current||'#24282d'} onchange={e=>onpick(e.currentTarget.value)}/>{/if}
</span>
<style>
 .swatches{display:inline-flex;align-items:center;gap:2px;flex-wrap:nowrap}
 .swatch{width:18px;height:18px;min-height:0!important;padding:0!important;border:1px solid #8a96a3;border-radius:3px;cursor:pointer}
 .swatch.current{outline:2px solid #268cff;outline-offset:1px}.none{background:var(--panel,#fff);color:#687482;font-size:11px;line-height:1}
 input[type=color]{width:22px;height:20px;min-height:0!important;padding:0!important;border:1px solid #8a96a3;border-radius:3px;background:none}
</style>
