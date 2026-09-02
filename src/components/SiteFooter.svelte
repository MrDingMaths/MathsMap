<footer class="site-footer other-sites">
  <div class="other-sites__inner">
    <span class="other-sites__label">Other sites</span>
    <div class="other-sites__links">
      <a href="https://mathsbase.mrdingmaths.com/" class="other-site" target="_blank" rel="noopener">
        <span class="other-site__icon"><img src="https://mathsbase.mrdingmaths.com/favicon.svg" alt=""></span>
        <span class="other-site__name">MathsBase</span>
        <span class="other-site__arrow" aria-hidden="true">&rarr;</span>
      </a>
    </div>
  </div>
</footer>

<style>
  .site-footer {
    padding: 1.25rem max(1rem, 4vw) 2rem;
    border-top: 1px solid var(--border);
    background: var(--bg);
    color: var(--muted);
    font-family: var(--font-body);
  }
  .other-sites__inner {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    flex-wrap: wrap;
  }
  .other-sites__label {
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }
  .other-sites__links { display: flex; gap: 0.65rem; flex-wrap: wrap; justify-content: center; }
  .other-site {
    display: inline-flex;
    align-items: center;
    gap: 0.55rem;
    min-height: 2.5rem;
    padding: 0.42rem 0.7rem;
    border: 1px solid var(--border);
    border-radius: 10px;
    background: var(--panel);
    color: var(--text);
    text-decoration: none;
    transition: border-color var(--motion-fast), background var(--motion-fast), transform var(--motion-fast) var(--ease-snap);
  }
  .other-site:hover {
    border-color: var(--border-strong);
    background: var(--panel-2);
    text-decoration: none;
    transform: translateY(-1px);
  }
  .other-site__icon { display: grid; place-items: center; width: 1.55rem; height: 1.55rem; flex: none; }
  .other-site__icon img { display: block; width: 100%; height: 100%; object-fit: contain; }
  .other-site__name { font-size: 0.86rem; font-weight: 600; }
  .other-site__arrow { color: var(--accent); font-size: 1rem; line-height: 1; }
  @media (max-width: 600px) {
    .site-footer { padding-bottom: 5rem; }
    .other-sites__inner { flex-direction: column; gap: 0.65rem; }
  }
</style>
