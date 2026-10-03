# Compact independent campaign review

Opt in with `compact-independent-review-v1` using `preflightCompactReview` from `scripts/content/campaign-compact-review.mjs`. This is an assertion adapter for the existing lean/native review guards. Historical receipts keep their original format.

Solve every final assessment and requested example part independently. Supply each whole `verdict`, `independentSolution` and method/wording/scope `observation`, plus the normal complete source/Theory observations, actual reviewer profile, visual evidence, removals and step-repair evidence where applicable.

A quiz can replace its repetitive `options` array with:

```js
optionSet: {
  orderedTruths: [true, false, false, false],
  checkedEveryOption: true,
  checkedEveryExplanation: true,
  observation: 'All four ordered options and every printed explanation checked against the derived result: only 12 satisfies the equation; each other value matches its stated arithmetic error.',
  exceptions: [{ index: 2, observation: 'This explanation instead misstates the sign error; repair needed.' }]
}
```

The vector is the reviewer's mathematical judgment in candidate order. The shared observation must meaningfully describe the actual check of **every** option and its explanation (including absence of an explanation where appropriate). Exceptions use zero-based indexes and add the reviewer's specific observations. They never change or infer truth. Do not simultaneously supply `options` and `optionSet`. Explicit ordinary option arrays may be retained for questions that need separate observations. Removed original quizzes use their original option order/count.

```js
const checked = preflightCompactReview(root, state, {
  profile: COMPACT_REVIEW_PROFILE,
  binding: receiptBinding(root, state),
  result: reviewerSuppliedResult
});
// Retain checked, then submit it through the existing guarded review operation.
```

Expansion supplies no mathematical solution, verdict or truth. It copies only the explicit reviewer assertions, obtains canonical hashes through unchanged normal normalization, and runs `preflightReview`. Source/current candidate/dependency hashes, actual native actor and session independence, captured execution settings, full outcomes, option uniqueness/candidate disagreement, header repair and visual guards remain mandatory. Preflight is read-only and grants no acceptance; normal `recordReview` remains authoritative.

The existing lean CLI also supports the adapter:

```powershell
node scripts/content/campaign-lean-cli.mjs preflight-compact-review --profile lazy-campaign-delta-v1 --skill SKILL --input compact-review-input.json --out checked-review.json
```

The CLI profile selects the existing guarded execution path; the input's profile is `compact-independent-review-v1`. The output is an ordinary lean envelope for the existing sequential `review` batch operation. Retain the original compact assertions beside the immutable expanded receipt.

## Existing affected-assessment reuse

Use the existing stage `reusedOutcomes` and canonical `recordReview` route for a single-assessment repair. `stageAssignment` retains accepted outcomes only with matching dependency hash, teaching intro/facts/steps, methods, whole item hash and item-to-method mapping; the latest actual review supersedes older verdicts. `validateReviewStructure` appends only those captured retained outcomes that the new review does not replace. The affected whole item still needs an explicit independent solution and every ordered option/explanation checked. Changed teaching/source/method bindings can invalidate reuse.

The lean preflight currently requires complete explicit whole rows. This compact adapter preserves that rule: use complete explicit resubmission there, or the existing canonical scoped review route for omitted captured retained outcomes. Do not import candidate answers, invent retained acceptance, or add a second reuse ledger. An unchanged example requested in several assessment audits needs one full review for its own canonical whole-item locator, with all requested parts included; it is not duplicated merely because several coverage links reference it.
