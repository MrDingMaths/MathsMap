<script>
  // Skill-page theory in an adapted booklet house style: the same accent
  // headers (BookletSectionHeader), palette (--booklet-*), blue working and red
  // step numbers as Booklet Studio teaching pages, resized for the screen.
  // Theory fields carry the same rich-text format as practice cards, inline
  // `[tikz]` figures included, so they render through InlineContent. It emits
  // block-level divs, hence divs rather than <p> wrappers.
  import InlineContent from './InlineContent.svelte';
  import BookletSectionHeader from './BookletSectionHeader.svelte';
  import { getWorkedExamples } from '../lib/theory-content.js';
  import { teachingEquationDisplays } from '../lib/booklet-teaching-alignment.js';
  import { pairParts } from '../lib/skill-parts.js';
  let { theory } = $props();
  let examples = $derived(getWorkedExamples(theory).map((example, i) => {
    const aligned = teachingEquationDisplays({ ...example, id: `theory-example-${i}`, prompt: example.question_text, theorySolution: example.solution_text });
    return {
      prompt: aligned?.prompt ?? example.question_text ?? '',
      solution: aligned?.theorySolution ?? example.solution_text ?? '',
      paired: aligned ? null : pairParts(example.question_text, example.solution_text),
    };
  }));
  const INK = '#24282d';
  const BLUE = '#268cff';
</script>

<div class="theory booklet-web">
  {#if theory.intro}<div class="theory-intro"><InlineContent text={theory.intro} /></div>{/if}

  {#if theory.facts?.length || theory.steps?.length}
    <section class="booklet-box" aria-label="Theory">
      <BookletSectionHeader kind="definition" label="Theory" />
      <div class="box-body">
        {#if theory.facts?.length}
          <ul class="facts">{#each theory.facts as fact}<li><InlineContent text={fact} textColor={INK} /></li>{/each}</ul>
        {/if}
        {#if theory.steps?.length}
          <div class="method-heading">Method</div>
          <ol class="steps">
            {#each theory.steps as step, i}
              <li class="step"><b class="step-number">{i + 1}.</b><div><InlineContent text={step} textColor={INK} /></div></li>
            {/each}
          </ol>
        {/if}
      </div>
    </section>
  {/if}

  {#each examples as example, i}
    {@const title = examples.length > 1 ? `Example ${i + 1}` : 'Example'}
    <section class="booklet-box" aria-label={title}>
      <BookletSectionHeader kind="example" label={title} />
      <div class="box-body">
        {#if example.paired}
          {#if example.paired.stem}<div class="example-stem"><InlineContent text={example.paired.stem} textColor={INK} nativeTables={true} /></div>{/if}
          {#if example.paired.solutionStem}<div class="example-working"><InlineContent text={example.paired.solutionStem} textColor={BLUE} nativeTables={true} /></div>{/if}
          {#each example.paired.rows as row}
            <div class="example-row">
              <b class="part-label">{row.label}</b>
              <div class="example-prompt"><InlineContent text={row.prompt} textColor={INK} nativeTables={true} /></div>
              <div class="example-working"><InlineContent text={row.solution} textColor={BLUE} nativeTables={true} /></div>
            </div>
          {/each}
        {:else}
          <div class="example-stem"><InlineContent text={example.prompt} textColor={INK} nativeTables={true} /></div>
          <div class="example-working whole"><InlineContent text={example.solution} textColor={BLUE} nativeTables={true} /></div>
        {/if}
      </div>
    </section>
  {/each}
</div>

<style>
  .theory { display: flex; flex-direction: column; gap: 1.1rem; font-family: 'Nunito', var(--font-body); }
  .theory-intro { font-size: 1rem; line-height: 1.65; }

  /* Booklet teaching box: tinted accent header + white body, 1px border, no top border. */
  .booklet-box { background: #ffffff; color: var(--booklet-ink); border-radius: 2px; overflow: hidden; }
  .booklet-box :global(.accent-header) {
    min-height: 2rem; gap: 0.5rem; padding: 0.3rem 0.75rem 0.3rem 0.65rem;
    border-left-width: 6px; font-size: 0.98rem; border-top: 1px solid var(--booklet-border); border-right: 1px solid var(--booklet-border);
  }
  .booklet-box :global(.header-icon) { width: 1.2rem; height: 1.2rem; flex-basis: 1.2rem; }
  .box-body { padding: 0.85rem 1rem 1rem; border: 1px solid var(--booklet-border); border-top: 0; }

  .facts { margin: 0; padding-left: 1.15rem; display: flex; flex-direction: column; gap: 0.5rem; }
  .facts li { padding-left: 0.2rem; line-height: 1.6; }
  .facts li::marker { color: var(--booklet-blue); }

  .method-heading { margin: 0.95rem 0 0.4rem; font-weight: 800; color: var(--booklet-ink); }
  .facts + .method-heading { padding-top: 0.8rem; border-top: 1px solid var(--booklet-border); }
  .steps { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 0.4rem; }
  .step { display: grid; grid-template-columns: 1.6rem minmax(0, 1fr); align-items: baseline; line-height: 1.55; }
  .step-number { color: var(--booklet-red); font-weight: 800; }

  .example-stem { font-weight: 600; margin-bottom: 0.4rem; }
  .example-working { line-height: 1.8; }
  .example-working.whole { margin-top: 0.5rem; }
  /* Booklet worked-example row: label | prompt | working, hairline between rows. */
  .example-row {
    display: grid; grid-template-columns: 1.6rem minmax(0, 1fr) minmax(0, 1.35fr); gap: 0.5rem 1rem;
    align-items: start; padding: 0.7rem 0;
  }
  .example-row + .example-row { border-top: 1px solid var(--booklet-border); }
  .example-row:last-child { padding-bottom: 0; }
  .part-label { font-weight: 800; color: var(--booklet-ink); line-height: 1.6; }
  .example-prompt { line-height: 1.6; }
  @media (max-width: 640px) {
    .example-row { grid-template-columns: 1.6rem minmax(0, 1fr); }
    .example-row .example-working { grid-column: 2; }
    .box-body { padding: 0.75rem 0.8rem 0.85rem; }
  }
</style>
