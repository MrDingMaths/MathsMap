<script>
  import { deriveBookletCover } from '../lib/booklet-cover.js';
  import InlineContent from './InlineContent.svelte';
  import BookletFooter from './BookletFooter.svelte';

  let { pages = [],anchorPrefix='' } = $props();
  let cover = $derived(deriveBookletCover(pages));
</script>

<article class="booklet-cover" aria-label="Booklet cover">
  <div class="accent-bar" aria-hidden="true"></div>
  <div class="cover-inner">
    <header class="top-row"><div class="name-field"><span>Name</span></div></header>
    <section class="title-block">
      <p>{cover.course}</p>
      <h1>{cover.title}</h1>
    </section>
    <section class="book-info" class:no-topics={!cover.topics.length} aria-label="Book information">
      <div class="book-badge"><span>{cover.book}</span></div>
      <div class="topics">{#each cover.topics as topic}<div>{topic}</div>{/each}</div>
      <div class="meta">
        {#if cover.version}<div><strong>Version:</strong> {cover.version}</div>{/if}
        <div class="feedback"><strong>Feedback</strong></div>
        <div>{cover.feedback}</div>
      </div>
    </section>
    <section class="contents" aria-labelledby="booklet-contents-heading">
      <h2 id="booklet-contents-heading">Contents</h2>
      <div class="contents-list">
        {#each cover.contents as item}
          <div class="contents-row" class:numbered={item.number!=null||item.answerSection}>{#if item.number!=null||item.answerSection}<span class="contents-number">{item.number??''}</span>{/if}<span>{#if item.href}<a href={'#'+anchorPrefix+item.href.slice(1)}><InlineContent text={item.title}/></a>{:else}<InlineContent text={item.title} />{/if}</span>{#if item.number==null&&!item.answerSection}<span class="leader" aria-hidden="true"></span>{/if}<span class="page-no">{item.pageNumber}</span></div>
        {/each}
      </div>
    </section>
  </div>
  <BookletFooter pageNumber={1} totalPages={cover.totalPages} version={cover.version} feedback="https://MrDingMaths.com" />
</article>

<style>
  .contents-row a{color:inherit;text-decoration:none}
  .booklet-cover { --accent:var(--booklet-red); --ink:var(--booklet-ink); --muted:var(--booklet-muted); --line:var(--booklet-border); --type-meta:8.5pt; --type-label:9pt; --type-body:11.5pt; --type-subheading:17pt; --type-heading:16pt; --type-display:36pt; position:relative; width:210mm; min-height:297mm; overflow:hidden; box-sizing:border-box; background:var(--booklet-white); color:var(--ink); font-family:'Nunito',system-ui,-apple-system,'Segoe UI',sans-serif; font-size:11pt; line-height:1.38; print-color-adjust:exact; -webkit-print-color-adjust:exact; }
  .accent-bar { position:absolute; top:10mm; bottom:16mm; left:15mm; width:6mm; border-radius:1.8mm; background:var(--accent); }
  .cover-inner { display:flex; min-height:297mm; box-sizing:border-box; padding:10mm 15mm 10mm 30mm; flex-direction:column; }
  .top-row { display:flex; min-height:16mm; align-items:flex-start; justify-content:flex-end; }
  .name-field { display:flex; width:66mm; height:14mm; padding:2.3mm 3.2mm; box-sizing:border-box; align-items:flex-start; justify-content:flex-end; border:.45mm solid var(--booklet-muted); border-radius:4mm; }
  .name-field span { color:var(--muted); font-size:var(--type-label); line-height:1; }
  .title-block { margin-top:10mm; padding:0 2.5mm 8mm; border-bottom:.35mm solid var(--line); }
  .title-block p { margin:0 0 4.5mm; color:var(--booklet-ink); font-size:var(--type-subheading); letter-spacing:-.01em; }
  .title-block h1 { margin:0; font-size:var(--type-display); font-weight:800; line-height:1.08; letter-spacing:-.025em; }
  .book-info { display:grid; min-height:29mm; margin-top:8mm; grid-template-columns:31mm 1fr 58mm; }
  .book-badge,.topics,.meta { padding:5mm 4mm; }
  .book-badge { display:flex; align-items:flex-start; }
  .book-badge span { display:inline-block; padding:1.5mm 2.4mm; background:var(--booklet-redFill); font-size:12.5pt; font-weight:700; line-height:1.1; white-space:nowrap; }
  .topics { font-size:10pt; line-height:1.4; }
  .topics div + div { margin-top:.8mm; }
  .meta { color:var(--muted); font-size:var(--type-meta); line-height:1.45; }
  .no-topics { grid-template-columns:31mm minmax(0,1fr) max-content; }
  .no-topics .book-badge { padding-left:.1mm; }
  .no-topics .meta { padding-right:0; text-align:left; }
  .meta strong { color:var(--booklet-muted); font-weight:600; }
  .feedback { margin-top:2mm; }
  .contents { margin-top:6.5mm; padding:0 2.5mm; }
  .contents h2 { margin:0 0 4mm; color:var(--ink); font-size:var(--type-heading); font-weight:700; line-height:1; letter-spacing:.01em; }
  .contents-list { display:grid; gap:3.1mm; }
  .contents-row { display:grid; grid-template-columns:max-content 1fr max-content; align-items:end; gap:2mm; font-size:var(--type-body); line-height:1.15; }
  .contents-row.numbered { grid-template-columns:8mm minmax(0,1fr) 8mm; align-items:start; font-size:10pt; }
  .contents-number { font-variant-numeric:tabular-nums; }
  .leader { border-bottom:.45mm dotted var(--booklet-muted); transform:translateY(-1.25mm); }
  .page-no { min-width:5mm; text-align:right; font-variant-numeric:tabular-nums; }
</style>
