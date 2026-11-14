<script>
  import AppTile from './AppTile.svelte';
  import { APPS, CURRENT_APP, ABOUT_TEXT, CONTACT_EMAIL } from '../lib/apps.js';

  const me = APPS.find((app) => app.id === CURRENT_APP);
  const others = APPS.filter((app) => app.id !== CURRENT_APP);
</script>

<footer class="sitefoot">
  <div class="wrap">
    <div class="about">
      <AppTile id={me.id} size="sm" />
      <div><b>{me.name}</b>{ABOUT_TEXT}</div>
    </div>
    <div>
      <p class="eyebrow">Other sites</p>
      <div class="others">
        {#each others as app (app.id)}
          <a href={app.url}><AppTile id={app.id} size="xs" />{app.name}</a>
        {/each}
      </div>
    </div>
    <div class="meta">
      <span>Questions or corrections:</span>
      <span class="email">{CONTACT_EMAIL}</span>
    </div>
  </div>
</footer>

<style>
  .sitefoot { border-top: 1px solid var(--border); background: var(--panel); margin-top: 64px; font-family: var(--font-body); }
  .wrap { max-width: 1200px; margin: 0 auto; display: grid; grid-template-columns: 1.2fr 2fr 1fr; gap: 24px; padding: 28px max(16px, env(safe-area-inset-right)) 28px max(16px, env(safe-area-inset-left)); align-items: start; }
  .about { display: flex; gap: 12px; align-items: flex-start; font-size: 0.875rem; color: var(--muted); }
  .about b { display: block; color: var(--text); font-size: 0.9375rem; }
  .eyebrow { margin: 0 0 8px; color: var(--muted); font-size: 0.75rem; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; }
  .others { display: flex; gap: 8px; flex-wrap: wrap; }
  .others a { display: flex; align-items: center; gap: 8px; height: 40px; padding: 0 12px 0 8px; border: 1px solid var(--border); border-radius: var(--radius-md); background: var(--panel); color: var(--text); font-size: 0.875rem; font-weight: 700; text-decoration: none; }
  .others a:hover { border-color: var(--border-strong); text-decoration: none; }
  .meta { display: flex; flex-direction: column; gap: 4px; color: var(--muted); font-size: 0.875rem; }
  .email { color: var(--text); font-weight: 700; user-select: all; }
  @media (max-width: 760px) {
    .wrap { grid-template-columns: 1fr; padding-bottom: calc(28px + var(--bottom-nav-height, 0px)); }
  }
</style>
