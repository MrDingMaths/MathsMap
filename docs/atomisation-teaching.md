# Atomisation for content (delivery rubric)

Companion to [atomisation-principles.md](atomisation-principles.md) (which covers
graph-building only). This doc covers **content**: how to break a routine into atoms
and present each atom type before assembling the full routine. Used when authoring
per-skill teaching content for the site.

> **Scope note:** pared to what informs **the site** (a self-paced web app).
> Classroom-only mechanics from the source guide — mini-whiteboards, 80% live
> thresholds, partner/peer marking, the tick trick, oral call-and-respond — are
> dropped. What's kept is what shapes content + UI: example selection, atom-type
> sequences, side-by-side layout, and step-by-step reveal.

## Core principle
In the worked example (**I Do**), everything shown should be *familiar*, so the
learner's attention is on how familiar pieces fit together in an unfamiliar way. Build
the unfamiliar atoms first.

## Process
1. **Choose a good example** (see [worked-example-principles.md](worked-example-principles.md)).
2. **Break the example into atoms** — write the worked solution line by line; for
   each line ask "what knowledge gets a learner from this line to the next?" Each is
   an atom. Include **invisible atoms** (unwritten decisions, e.g. "decide to use
   Pythagoras", "decide to add or subtract the equations").
3. **Mark prerequisite atoms** (already-met, → graph prereqs) vs **new atoms** to
   present here.
4. **Present new atoms separately**, by type (table below).
5. **Chain 2–3 atoms** into an intermediate before the full routine — don't jump from
   single atoms straight to the whole routine.
6. **Present the full routine** as the worked example + We Do, now that atoms are
   familiar.

## Atom types and how to present each
| Type | Test | Presentation |
|------|------|--------------|
| Category (Cat) | "Is this a ___?" (yes/no) | **NPPPN** example sequence |
| Comparative (Com) | before/after change (speed, gradient) | **PPNN** example sequence |
| Fact (F) | recall (formula, theorem) | state it, then a recall prompt |
| Transformation (T) | obvious input → output | **1–3 examples**, change one feature each |
| Routine (R) | complex multi-step | full worked example + We Do (it's a mini-routine) |

**NPPPN (Category):** N non-example → P positive (minimal change from the N) → P
maximally-different positive → P another maximally-different positive → N near-miss
non-example showing the boundary. (Use NPPPNN for harder concepts.) Present any
follow-up judge-it items in **mixed/random order** so the learner judges rather than
pattern-matches.

**PPNN (Comparative):** two positives showing the change, then two non-examples
showing what isn't the change.

**Fact:** state the fact plainly, then a single recall prompt (answer revealable).

**Transformation:** 1–3 examples, each varying **one** key feature, so the effect of
each change is visible; then a harder case to apply it.

## Four example-set principles (kept; site-relevant)
- **Wording** — keep wording identical across examples in a set.
- **Sameness** — use maximally-different positives to show the full range of the concept.
- **Setup/Difference** — an example and its near-miss non-example differ in **only**
  the critical feature; place them next to each other.
- **Mixed order** — when the learner judges examples, present them in mixed order.

## Common pitfalls
Skipping invisible atoms; introducing a new atom inside the worked example; jumping
straight to the full routine (no chaining); poor examples (repeated elements / hidden
process); inconsistent wording across a set.
