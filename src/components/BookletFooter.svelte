<script>
  import {getContext} from 'svelte';
  const projectRevision = getContext('booklet-revision');
  let {
    pageNumber = 1,
    totalPages = 1,
    feedback = 'https://MrDingMaths.com',
    sourcePage = null,
  } = $props();
  const revision = $derived(projectRevision?.());
</script>

<footer class="booklet-footer">
  <span>{feedback}{revision != null ? ` | Revision ${revision}` : ''}</span>
  <span>{sourcePage?`Source p${sourcePage} · `:''}Page {pageNumber} of {totalPages}</span>
</footer>

<style>
  .booklet-footer {
    position: absolute;
    right: 15mm;
    bottom: 10mm;
    left: 15mm;
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 6mm;
    color: var(--booklet-muted);
    font-family: 'Nunito', system-ui, -apple-system, 'Segoe UI', sans-serif;
    font-size: 7.5pt;
    line-height: 1;
  }

  span { white-space: nowrap; }
</style>
