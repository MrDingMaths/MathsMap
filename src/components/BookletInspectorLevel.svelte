<script>
 // One level of the selection breadcrumb (Question › Part › Table › Cell) and its inspector groups.
 let {title,children}=$props();
</script>
<section class="inspector-level" aria-label={title}>
 <h3>{title}</h3>
 {@render children()}
</section>
<style>
 .inspector-level{margin:0 0 12px;padding:6px 10px 2px;border:1px solid var(--line,#d5dde7);border-radius:6px;background:var(--panel,#fff)}
 h3{margin:2px 0 4px;font:700 12px system-ui;text-transform:uppercase;letter-spacing:.04em;color:var(--text-muted,#617086)}
</style>
