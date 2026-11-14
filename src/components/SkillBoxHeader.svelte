<script>
  // Read-only booklet teaching-box header for the public skill page: same icon,
  // tinted fill and coloured left bar as Studio's BookletSectionHeader, sized for
  // the screen, without the Studio editing chain (EditableBookletText pulls in
  // the whole maths editor, which would bloat the public bundle).
  // Only the icons the skill page uses, so the rest stay out of the bundle.
  import { ICON_DEFINITION, ICON_EXAMPLE } from '../lib/booklet-header-icons.js';
  let { kind = 'definition', label } = $props();
  const ICONS = { definition: ICON_DEFINITION, example: ICON_EXAMPLE };
  const TONES = { definition: 'blue', example: 'orange' };
  let tone = $derived(TONES[kind] ?? 'blue');
</script>

<div class="accent-header {tone}">
  <svg class="header-icon" viewBox="0 0 24 24" aria-hidden="true">
    <path d={ICONS[kind] ?? ICON_DEFINITION} fill="currentColor" fill-rule="evenodd" clip-rule="evenodd" />
  </svg>
  <span class="header-main">{label}</span>
</div>

<style>
  .accent-header {
    display: flex; align-items: center; gap: 0.5rem; min-height: 2rem; box-sizing: border-box;
    padding: 0.3rem 0.75rem 0.3rem 0.65rem; border: 1px solid var(--booklet-border); border-left: 6px solid currentColor;
    font-size: 0.98rem; line-height: 1.05;
  }
  .accent-header.blue { color: var(--booklet-blue); background: var(--booklet-blueFill); }
  .accent-header.orange { color: var(--booklet-orange); background: var(--booklet-orangeFill); }
  .header-icon { display: block; width: 1.2rem; height: 1.2rem; flex: 0 0 1.2rem; color: var(--booklet-ink); }
  /* Nunito's capitals sit above the centre of its line box. */
  .header-main { position: relative; top: 0.1em; color: var(--booklet-ink); font-weight: 700; }
</style>
