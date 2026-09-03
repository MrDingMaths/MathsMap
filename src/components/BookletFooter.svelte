<script>
  let {
    pageNumber = 1,
    totalPages = 1,
    version = '',
    feedback = 'https://MrDingMaths.com',
  } = $props();
</script>

<footer class="booklet-footer">
  <span>{feedback}{version ? ` | ${version}` : ''}</span>
  <span>Page {pageNumber} of {totalPages}</span>
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
    color: #b4b4b4;
    font-family: 'Nunito', system-ui, -apple-system, 'Segoe UI', sans-serif;
    font-size: 7.5pt;
    line-height: 1;
  }

  span { white-space: nowrap; }
</style>
