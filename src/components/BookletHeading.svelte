<script>
 let {kind='main',id=undefined,children}=$props();
</script>
<header {id} class="section-band" class:exercise-heading={kind==='exercise'}>{@render children()}</header>
<style>
 .section-band{display:flex;min-height:12mm;box-sizing:border-box;align-items:center;margin:0 0 4mm;padding:2.2mm 2.4mm;background:var(--booklet-headerBlue);color:var(--booklet-white);font-size:13pt;font-weight:700;line-height:1.05;letter-spacing:.02em;break-inside:avoid;break-after:avoid}
 .exercise-heading{min-height:6mm;justify-content:flex-end;padding:0;margin-bottom:1mm;border-top:.25mm solid var(--booklet-blue);background:transparent;color:var(--booklet-ink);text-transform:uppercase}
 .section-band :global(.text-line){min-height:0}
 .section-band :global(p){font-size:inherit!important;line-height:inherit!important;margin:0!important}
</style>
