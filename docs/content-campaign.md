# Published-content worked-example campaign

This is maintenance of the existing site, not a booklet import. Only the 1,056
skills published at initialization belong to this campaign; the 137 unpublished
skills stay excluded. Membership and actual initial practice/quiz/example counts
are frozen from files and reconciled against the manifest. Reinitialization reuses
the campaign and does not reset content baselines or successful evidence.

All substantive author, review and repair calls use `gpt-6.1-sol`, high reasoning,
with Standard (`service_tier="default"`, fast mode disabled) requested through the
existing local read-only Codex runner. Record observed model/session/usage/settings;
unavailable observations remain unavailable. Preserve historical model receipts.
At most three fresh worker sessions run concurrently, plus the coordinator.

## Source, scope and coverage

### Optional complete prerequisite references for native workers

Fresh native assignments may explicitly prepare with
`prerequisiteContextProfile: "native-prerequisite-context-ref-v1"` in the
`prepare --input` JSON. This changes serialization only: complete current parent
Theory, including all examples and figures, remains in the dependency/context
hash. Existing prepared assignments retain their exact profile and payloads;
they cannot opt in retroactively. The 24,000-character bound is unchanged.

The prepared `prerequisiteContextReference` points to an immutable manifest bound
to the actual assignment, native actor, execution profile, taxonomy, governing
scope, sources, parent content bytes and full parent Theory hashes. Its teaching
packs contain complete Theory when it fits, otherwise complete base teaching and
individual whole worked examples. An indivisible unit exceeding the bound fails
with its locator. Nothing is clipped or deleted.

Before authoring **and independently before reviewing**, the owned native worker
must personally read every mandatory pack, including its diagrams, then explicitly
call `recordPrerequisiteContextRead` (CLI: `record-prerequisite-read --input FILE`).
The input contains `acknowledgment: {complete: true, observation, parents, packs}`.
`parents` copies every manifest parent’s `{id,theoryHash,contentHash}` in order.
`packs` copies every `{path,hash,literalHash}` in order and adds `read: true` plus a
separate nonempty observation of the actual teaching read in that pack. Preparation
and file existence supply no reading acknowledgment. The immutable reading receipt
is bound to that worker’s assignment; the author’s receipt cannot stand in for the
independent reviewer’s reading. Stage and review revalidate current artifacts,
parent content, source/scope/taxonomy, ownership and every acknowledgment.

Missing, altered, stale, foreign or unread references fail closed. External
ephemeral runners and all no-tools/inline dispatch paths reject this profile;
they retain complete inline prerequisite context. References confer no source,
mathematical, method, header, diagram or publication acceptance. Native metrics
continue to record actual requested settings and leave unavailable provider/model
inference observations null.

Archived batch configurations and `docs/content-queue.md` provide mapping
candidates. Known relocated source paths resolve through `source-paths.mjs`.
Filename similarity is an indirect suggestion, never an accepted source mapping.
Stage 3 retains archived mappings as indirect candidates and borrows later-stage
wording/presentation only; mathematics, vocabulary and assumed knowledge remain
strictly Stage 3. Preserve a recorded governing topic/dot-point decision; otherwise
select the earliest applicable introduction in the skill's stage and confirm it
against the title, blurb, prerequisites, siblings and dependents. Later memberships
mean reuse, not permission to advance. Genuine unresolved scope conflicts block
acceptance of that skill.

Read source examples, Key Ideas and practice together, including original linked
images/PDF pages where needed. Use/adapt available booklet examples rather than
copying a published practice card into theory. Record exact source locations,
direct/indirect support, source hashes, observations and actual adjustments.
Retain original source evidence when correcting a source error.

An absent illustration linked by a selected `syllabus/Stage 3 Content.md`
section may use a specific `unavailableImages` declaration with its exact path,
`nonessential:true`, reason and complete `textAlternative` (retain the supplied
text/source locators and matching booklet references). Preparation retains that
gap inline and binds the absent image to a null dependency hash. The author must
preserve the declaration and explicitly add `accepted:true` and an observation;
the independent reviewer must return one `sourceImageReviews` decision for every
declared image, with `sourceIndex`, `imagePath`, `accepted` and an observation.
The coordinator supplies an omitted decision hash from the actual declaration.
Undeclared missing images and required original-booklet figures block preparation
and final staging. Every final source section is scanned again, including new or
expanded references. The coordinator retains actual hashes for all linked images
even when an author supplies an empty image list; image changes invalidate source
acceptance before publication. Explicit supplemental images delivered with the
exact prepared section also retain their hashes, including images outside its
Markdown lines. Conflicting supplied hashes are rejected. An explicitly justified
syllabus gap never waives
another undeclared missing figure.

Stage 4, 5 and 6 syllabus illustrations have a narrower opt-in:
`profile: "source-authored-long-description-v1"` on the individual gap. It
requires the complete source-embedded `*Image long description*:` in the same
single-image, single-column example box. Supply `textAlternativeLocator` as
`{path, sourceHash, startLine, endLine, imageLine, boxStartLine, boxEndLine}`.
The path and full current source hash must match the selected reference; that
reference must include the entire box. The description starts at its source
marker and ends at the last nonblank body row before the closing box boundary.
`textAlternative` must equal that complete body after whitespace and box-padding
normalization. A copied, shortened, foreign or stale description is rejected.
This profile does not apply to missing original-booklet figures or essential
illustrations. It grants no pixel-inspection credit or automatic acceptance:
the author must still explicitly accept the individual gap, and a different
independent reviewer must supply the existing `sourceImageReviews` decision.
Legacy Stage 3 declarations and decision hashes are unchanged; the new profile
is included in a decision hash only when present.

Source-image discovery reconstructs Pandoc grid-table columns before reading
wrapped image alt text. Each column is scanned separately, while ordinary
multiline image references remain intact. Source selection and final staging use
the same reader; ordinary hyperlinks supply no image evidence.
If an absent illustration later appears, its new dependency invalidates prior
acceptance so the actual evidence can be reconciled.

Every valid practice and quiz item maps to explicitly described methods. Each
required distinct method maps to an example; structural slugs alone do not prove
method equivalence. Contrasting conceptual examples are useful where needed.
There are no quotas for superficial cases. Preserve good narrow sets and valid
mastery omissions. Repair out-of-scope items before considering example coverage.
For new or adapted worked examples, keep arithmetic manageable without easy numbers hiding structure or coincidental
equal values or digits in different roles, such as a checked rounding digit matching
the resulting digit; retain equality essential to the concept and unchanged digits.
Preserve good existing practice/quiz values and useful examples unless there is an
actual mathematical, source, scope or teaching defect. Do not rewrite for number
aesthetics alone or pad numerical quotas.

Site text uses the strict rich-text schema: inline `$...$`, concise visible working
one step per line, and the booklet's taught language/method/notation. Booklet-only
display/`align*` conventions do not apply to these fields. New examples use the
ordered `theory.workedExamples` array. Untouched singular legacy examples remain
supported; both fields together are invalid. Ordinary theory maintenance keeps
steps frozen. The campaign's separate steps-repair acceptance checks all dependent
practice, quiz and example headers and requires independent current-hash evidence.

## Commands and APIs

```text
node scripts/content/campaign.mjs init
node scripts/content/campaign.mjs status
node scripts/content/campaign.mjs next --worker author-session --ids round-decimals
node scripts/content/campaign.mjs prepare --skill round-decimals --worker author-session --input source-selection.json
node scripts/content/campaign.mjs stage --skill round-decimals --worker author-session --input author-result.json
node scripts/content/campaign.mjs next --worker independent-review-session --role review
node scripts/content/campaign.mjs prepare --skill round-decimals --worker independent-review-session
node scripts/content/campaign.mjs record-review --skill round-decimals --worker independent-review-session --input review-result.json
node scripts/content/campaign.mjs record-visual --skill round-decimals --worker visual-review-session --input visual-result.json
node scripts/content/campaign.mjs request-repair --skill round-decimals --input hash-bound-finding.json
node scripts/content/campaign.mjs publish --skill round-decimals
node scripts/content/campaign.mjs receipt
```

All commands accept `--campaign ID` and `--root PATH`. Init prints a compact summary;
`--full` prints the complete frozen manifest. Source selection is `{sources:[...]}`
with source path/hash and exact `startLine`/`endLine` where applicable. Repeated
prepare preserves an existing explicit selection. Each packet is bounded to 24,000
variable characters and contains whole questions, solutions and options. Token
estimates are informational. An indivisible oversized context must be diagnosed;
do not truncate it silently. Small, source-related scopes and precise sections
keep packets useful. Exact source selection must include real, bounded excerpts;
file-path references alone are insufficient for the read-only worker.
The runner inlines the complete pair once, scope/prerequisite context and selected
source excerpts; required evidence does not depend on worker file-tool access.
Relevant source images in those excerpts are hash-bound and attached. The inline
whole-skill payload must also fit 24,000 characters before a paid call starts;
otherwise the bounded adapter separates teaching/method planning, whole-item author
patches, independently solved review batches and the final source/theory/coverage
review. It preserves order and unaffected metadata and rejects missing, duplicated
or stale patches. Every actual call still receives bounded inline evidence. A truly
indivisible oversized question requires a recorded exception and diagnosis; no
assessment item is silently omitted. Whole-book mapping suggestions still need
precise section selection before dispatch; the engine does not invent that evidence.

The named synchronous APIs in `campaign-support.mjs` mirror the CLI. Author/review
JSON contracts live in `campaign-runner.mjs`. `normalizeWorkerResult` fills only
omitted bookkeeping hashes from actual payload/source bytes; supplied wrong hashes
are rejected. Both raw and normalized worker outputs are retained locally.
Manual native reviews may supply `reviewerProfile`; it is recorded exactly as
provenance and fills otherwise absent metrics. Exposed model/effort settings remain
distinct from observed provider metadata. Unavailable native speed and usage stay
null. `record-review-profile` can attach omitted provenance to the exact current
unowned review without repeating mathematics or overwriting historical metrics.
Prepare also retains complete hashed `source-evidence.json` independently of which
excerpts fit alongside assessment packets; dispatch must inline that actual evidence
within each applicable bounded assignment or diagnose an indivisible exception.

Newly prepared assignments capture `boundedContextProfile: "source-metadata-refs-v1"`.
Fresh preparations also capture `packetSourceProfile: "packet-source-evidence-ref-v1"`.
Repeated packet references retain exact source paths, file hashes, line ranges,
support, image hashes and missing-image decisions. Derived `rawExcerptHash`,
`excerptHash` and normalization metadata remain complete in the immutable hashed
source-evidence artifact and prepared sources, rather than repeating beside
every question. Actual selected excerpts remain unchanged and the coordinator
source loader still delivers complete evidence inline. Existing prepared leases
without this profile keep their original packet and cache identity on resume and
explicit reprepare. Preparation failures expose `error.packetBudget` with the
actual JSON character count, per-field sizes and whole-item sizes; a failed
preparation does not authorize truncation, source approval or a larger limit.

Fresh repair preparations also capture `previousReviewProfile:
"whole-item-prior-review-ref-v1"`. The complete targeted previous review is stored
once in an immutable `previous-review-<hash>.json` artifact, bound to the reviewer,
assignment, current stage, candidate, snapshot and original review hash. Packet
global context retains its identity, complete findings and reference; each owned
whole assessment item carries its complete `priorReview`. Both inline and bounded
coordinators verify and load the reference before dispatch. Bounded example jobs
also receive the corresponding complete prior outcome. Workers need no file tools.
The actual Names regression retains all 21 targeted outcomes and every question,
solution, MCQ option and reason in three packets of 23,060, 23,680 and 23,838
characters; its former empty global context alone was 36,235 characters. Existing
prepared/checkpointed leases retain their original full-review packets and cache
identity, including explicit reprepare. No historical evidence is migrated.

In author and example jobs that contain **every complete selected source inline**,
redundant metadata uses explicit zero-based `sourceEvidenceIndex` references.
`sourceFields` names the unchanged fields copied from that source; an
`unavailableImageIndex` identifies its exact gap declaration. Full excerpts, image
hashes/attachments, reasons and textual alternatives remain in `sourceEvidence`.
Source-review rows retain their order, support, complete observations/adjustments
and explicit acceptance decisions, so method `sourceRefs` still index the same
rows. `fieldOrder` allows exact reconstruction; mismatched/ambiguous source spans,
image lists or gap declarations are rejected. Complete plan source reviews remain
in assembled results and the ledger. Candidate selection hints remain candidate
evidence, with no inferred mathematical/source acceptance.

Existing prepared owners without this profile keep their legacy author payloads
and successful cache identities, including explicit reprepare and paid-call resume.
Planning, independent review, divided source-context jobs and contexts lacking the
complete selected evidence keep their existing format. No source is shortened or
omitted to fit a batch. The actual 23-item MultiNumber ticket-derived regression
fixture packs into 15 legacy author batches versus 3 profiled batches (14, 7 and 2
whole items), all at most 24,000 variable characters. These are local packing
counts, not measured paid-call, time or usage savings.

Split method-coverage reviews receive each owned complete assessment or example,
including every quiz option and reason, and its actual independently derived
solution, observation and verdict. Each method group also receives the complete
independently reviewed examples for every method it assesses, including mixed
questions whose examples belong to separate single-method groups. Supporting
examples do not become additional owned items. Missing/stale independent working
or missing supporting examples blocks dispatch. Changed mapping packets receive
fresh coverage review while unchanged whole-item answer reviews remain reusable.

Canonical diagram captures use `content-campaign-render-dependencies-v2`: an
immutable manifest binds the producer, actual containers/styles, local module
imports (including the actual HTML bootstrap, re-exports and literal dynamic
imports), quoted and `url(...)` CSS imports/assets and the
installed TeX/font assets. Variable local imports need an explicit dependency
declaration. The producer waits for `document.fonts.ready` before pixels and
records the actual browser version, viewport, device scale and font status.
Historical partial signatures and unknown historical dependency hashes stay in
their original receipts; they do not establish current renderer acceptance.
Validation can share a signature only within one synchronous operation, checking
actual bytes again at its end; no global signature cache survives mutations.

Fresh and cached TikZ SVGs allow outer viewport ink to remain visible. The shared
flow measurement also reserves measured ordinary stroke ink plus one physical
pixel of raster sampling clearance at scrolling boundaries. Flip-card transition
completion refits the initially mirrored back face. Both paths preserve the
source viewport, geometry, label size and intentional clip paths/masks.
Required diagram receipts are checked separately
from mathematical/source freshness. A renderer-only change marks rendering stale
and prevents a current-completion claim, while retaining the accepted maths,
source, stage and publication records; it does not redispatch content authors.

`refresh-visual` records renderer-only inspections under the campaign lock, with
`expectedVisualRevisionHash` from `visualRefreshRevision(state)` for optimistic
concurrency. It accepts published, accepted, visual-pending and repair-needed
stages with no active owner. Current stage/candidate, live pair and complete
source/scope/prerequisite bindings must match before and after validation. It
updates only the visual ledger and writes immutable before/inspection artifacts;
published content, quiz, publication journal and mathematical/source outcomes
remain unchanged. A partial refresh leaves every unrefreshed field rendering
stale and cannot establish current completion.

Each field carries a current canonical `renderReceipt`, exact whole-field and
ordered block hashes, positive geometry/palette/visibility observations, and a
different content-author reviewer profile (`model: "gpt-6.1-sol"`, `effort:
"high"`, `requestedServiceTier: "default"`, explicit `reviewerIdentity`). Use
`inspectionMode: "fresh"`, `actualPixelInspection: true` and `inspectedAt` after
capture for actual new pixel inspection. Both capture and inspection timestamps
must be valid; missing or invalid capture times cannot establish a fresh inspection.
For unchanged pixels, use
`inspectionMode: "identical-png-reuse"` and `reusedInspection: {review:
{path,hash}, profile?: {path,hash}}` pointing to an immutable original explicit
positive inspection. Every actual PNG byte must equal its fresh current capture.
The original reviewer/receipt remains attributed; omitted historical renderer
dependencies remain `legacy-partial-unverified`. Changed or previously negative
pixels require fresh inspection. Synthetic test captures never supply campaign
pixel acceptance.

The only content-verdict transition supported by this API is the exact recorded
Ratios F1 border presentation finding at its frozen original stage/field/item
hashes. `resolvedPresentationFindings` must bind that finding, its immutable
original negative visual proof and a fresh accepted whole-item independent
derivation by a reviewer different from both the author and original mathematics
reviewer. It preserves the original repair outcome/finding and negative PNG
history; all thirteen current canonical fields must pass before acceptance.
Other findings and mathematical repairs stay pending and use ordinary repair
ownership. This narrow exception cannot resolve a later or different candidate.

```text
node scripts/content/campaign.mjs refresh-visual --campaign ID --skill ID --worker ID --input refreshed-inspections.json
```

```text
node scripts/content/campaign.mjs run --ids round-decimals --concurrency 1 --max-calls 1
node scripts/content/campaign.mjs run --ids round-decimals,add-subtract-fractions --concurrency 3
node scripts/content/campaign.mjs run --select-sources --source-budget 10000 --concurrency 3 --publish
```

`run` uses the established local runner, independent ephemeral sessions even with
one slot, and recorded ownership. It stages/reviews only unless `--publish` is
explicitly selected. Coordinator publication is serialized by the canonical
publication lock. Failed calls preserve metrics/output references and leave the
affected skill pending while unrelated eligible skills proceed. Two failures with
the same shared cause stop fresh dispatch for diagnosis. That run does not silently
retry a failed skill. Explicit `release --skill ID --worker ID --reason TEXT` releases a stranded
assignment without claiming completion.
An undispatched `--max-calls` checkpoint retains its prepared assignment, worker
lease, source selection and successful bounded jobs. Rerunning the command resumes
that assignment without paying for unchanged completed jobs again; source and live
content hashes are still checked. The checkpoint releases only its coordinator
claim and records actual call metrics, without adding a failure finding or repeat
failure credit. Use explicit `release` to relinquish a checkpointed worker lease.
Live coordinator PID/host ownership prevents a second runner from resuming the same
paid assignment; only proven dead ownership can be reclaimed. Selected campaign
prerequisites publish first, while prerequisites outside an explicit pilot set may
retain their existing baseline.

`--select-sources` selects precise candidate spans for fresh assignments. Prepared
and staged selections remain intact. Structural/lexical candidates never establish
source acceptance; authoring and independent review must confirm methods, wording
and scope from the actual excerpts. Exact semantic overrides may live in ignored
`source-overrides/<skillId>.json` with `{skillId,sources,notes}`. Source hashes, line
ranges and the selected source budget are checked before dispatch. Each assignment
keeps its selection receipt; a changed receipt requires reconciliation. Candidate
availability and lexical misses must not be reported as accepted coverage or proven
source gaps. The optional `prepareSources` runner callback supports the same path.
When an original skill booklet/example is absent, suitable existing booklet
wording and setout plus explicit syllabus scope can support an adaptation with
honest indirect provenance. A missing original example alone is not a blocker;
missing essential method or scope evidence is.

`--ids` remains the complete selected dependency scope. Optional `--author-ids`
limits only fresh author dispatch to source-ready candidates; repairs, staged
reviews and already prepared assignments can continue independently of that filter.
`--exclude-ids` prevents assignment selection, including failed skills in a runner,
without removing their prerequisite relationships. A selected prerequisite must
still publish before its dependent can be authored, even when the prerequisite is
excluded or has failed. Unrelated ready skills can proceed.
The source preparer's read-only preview uses the same selector/override checks
without creating an assignment receipt. Missing readiness stays pending as
`source-prep-gap`, with zero model calls and no acceptance. On actual assignment,
source/hash validation runs again and saves the immutable source-selection receipt.
Readiness means candidate evidence is available, never accepted source coverage.

Fresh automatic source selection separates the taught subject from its representation: probability expressed as a fraction needs actual favourable/total outcome counting evidence, and geometry notation needs the requested object/naming context. Generic fraction, language or notation overlap alone cannot select an unrelated topic. Governing object names may supply context when the skill blurb is sparse. Heading-only sections without teaching are not automatic teaching candidates; a heuristic miss does not establish a genuine source gap. These suggestions remain candidate-only, preserve complete units within the 10,000-character source budget, and do not override curated or staged source decisions or migrate prepared receipts. Geometrical wording is normalised separately from geometric sequences/growth.

## Acceptance and publication

Every final assessment/example receives an independently derived written solution
and an observation about method, wording and scope. Every MCQ option receives its
own mathematical verdict and explanation review, and exactly one valid option
must agree with the marked answer. Author/reviewer worker/session identities differ.
Successful output JSON is not acceptance. Review outcomes bind to final item hashes
and exact staged/source/scope snapshots. Required repairs and consequential unresolved
findings keep that skill pending while unaffected work proceeds.

When a complete theory/coverage packet fits, its worked examples retain their full
questions and solutions alongside independent working. Larger collections receive
explicit independent header and method-mapping checks for every whole item. Their
final `review-theory-source` job owns only the actual source, before/current theory,
method definitions, scope and missing-illustration decisions. It carries the actual
rejected checks and a hash-bound record of the separate reviews; it does not claim
to reread unseen examples or accept headers/mappings from counts. The coordinator
requires every explicit check and prevents step acceptance while any check fails.

New, changed and flagged diagram fields require actual rendered artifact bytes,
verified artifact hashes, source-field hashes and every inline block hash. Geometry,
palette and applicable solid visibility observations accompany visual acceptance.
`captureCampaignDiagrams` produces a `content-campaign-render-v1` receipt using the
existing `shoot-tikz` renderer, exact input/block hashes, renderer signature, manifest
and decoded nonempty PNGs. Supply that receipt path/hash with each visual review.
It records captures without granting acceptance. The engine verifies every block,
actual artifact bytes and current renderer again before publication; a filename or
arbitrary bytes cannot establish rendering.
Unchanged generic theory diagrams do not become changed merely because an example
was added. `recordVisualReview` completes this separate gate without repeating the
mathematical review. Representative desktop/mobile UI checks and relevant automated
checks are still coordinator obligations; do not label successful JSON as visual QA.

Durable, lean membership/source/scope/coverage/acceptance records live under
`booklets/provenance/content-campaign/ID`. Snapshots, attempts, packets, raw results,
renders and prior-stage evidence live under ignored `.agywork/content-campaign/ID`.
Do not embed image pixels or large source extracts in durable records. Repair workers
start from the prior staged candidate and relevant review outcomes, retaining sound
work. Prior stage paths/hashes and substantive corrections are preserved.
`requestRepair` binds a coordinator finding and target locators to the current stage
and live baseline. Repair packets include failed or targeted outcomes, rather than
duplicating all passing solutions. Matching accepted item evidence retains its
original reviewer attribution when content, actual source/scope/teaching/method
dependencies remain unchanged. Changed examples and current method-to-example
coverage still receive fresh independent review.
For an unowned published skill, `requestRepair` additionally requires the exact
published live pair, unchanged staged candidate and current source/scope
dependencies. It retains the original publication in history and prepares a new
immutable repair snapshot with the published pair as its concurrency baseline;
original candidate, initial item dispositions, journal and evidence stay intact.
Unchanged independent outcomes remain reusable, and a second publication still
requires a different reviewer and canonical validation/readback. Review findings
with explicit `observation`/`repair` text gain a nonempty pending description while
their original fields remain preserved; incomplete findings are rejected.

The default variable-evidence limit remains 24,000 characters. When one complete
method-mapping check cannot fit under its captured format, diagnose the actual
whole question, independent working, sources and supporting method examples before
dispatch. `runCampaign({oversizeExceptions})` and `run --oversize-exceptions FILE`
accept a JSON object keyed by frozen skill ID, then canonical whole-item locator.
Each exception requires `reason`, `indivisible: true`, `kind`, measured
`variableChars` before exception metadata, and exact `stageHash`, `candidateHash`,
`itemHash` and `dependencyHash`. The measured count and all bindings must still
match; a repaired candidate requires a new diagnosis and measurement. This does
not increase the general limit, remove source evidence or relax item ownership.
The actual ticket retains its full payload, current total character count and
`budgetException` including the job kind and diagnosis.

If a paid mathematical batch already succeeded before this local budget failure,
an optional `failureVariableChars` records the original failing count separately
from today's measured payload. Only its exact coordinator failure message may be
ignored for a cache comparison, and only with the explicitly bound exception.
Every other original/current review payload byte—including substantive findings,
source context, options, working, methods and theory—must match. Original ticket
profile and contract hashes are verified. Retained attempts keep their actual
`inputHash`, session and raw cache unchanged; `requestedInputHash` and a
diagnosis-bound reuse attribution record the comparison. Repair verdicts remain
repairs; aggregate coverage/source/header reviews remain required.

The MultiNumber regression records the actual original mapping payload at 25,158
characters and its resumed payload at 25,314 including the coordinator diagnostic.
It preserves 27 independently reviewed outcomes (22 accepted, five requiring
repair) without repeating mathematical calls. Three complete method examples and
all source evidence remain inline in the one explicitly excepted mapping ticket.

Publication validates the whole candidate pair in isolation before public writes,
checks original pair hashes (including practice order), preserves unaffected bytes,
and delegates atomic files/journaling/shared locks to `publication.mjs`. Baseline
item matching reserves unchanged hashes one-to-one before removals or replacements,
so insertion/deletion/reordering cannot disguise a removed item. Every original item
has a retained/repaired/removed final disposition and independent review evidence.
Readback verifies the exact accepted candidate.

An interrupted publication is recovered through its journal before further dispatch.
`recover --skill ID` resumes a dead publisher; a live publisher cannot be stolen.
Use `--force` only for an explicitly established abandoned campaign owner. Concurrent
unexpected file changes block recovery rather than overwrite them. Manifest rebuilds
use the shared publication lock and can be deferred until the publication batch ends.

Finish with the scoped regressions, relevant arithmetic/options/duplicates/format/
diagram checks, representative UI evidence, manifest readback, one settled build
and storage check. No booklet PDF export is required for unchanged evidence books.
The receipt reports actual elapsed wall time, attempts, available usage, substantive
corrections and pending decisions. Completion requires every frozen skill published
with current live pair and source/scope/prerequisite dependency hashes. Stale finals
are reported and reopened for reconciliation while publication history is retained;
do not claim unmeasured savings or fill unavailable usage with zero.

### Prospective stable worker lineage and additive usage

An unprepared repair whose repeated source metadata prevents a complete question
from fitting may capture `repair-common-source-ref-v1`. Each packet carries the
exact ordered source-file/range/index and metadata hash, referencing its immutable
complete source-evidence artifact. Actual excerpts, image hashes and unavailable
illustration reasons/full descriptions/accepted observations remain in that
artifact and the prepared references. Both dispatch paths verify the reference
before supplying the full actual evidence once; workers never need a file read.
Prerequisite theory, all findings, targeted previous outcomes and whole questions
including options/whys remain intact. Ordinary fitting preparations and every
already prepared/checkpointed cache keep their recorded packet format. This is
metadata deduplication, not a source omission, budget increase or visual waiver.

`stable-worker-lineage-v1` is an explicit opt-in for **new ownership**, separate
from packet, cache, review and renderer profiles. After independent code review,
the coordinator can activate it with
`node scripts/content/campaign.mjs activate-lineage --campaign ID`. Activation
only records `futureAssignmentPolicy` in the campaign header. Existing owned or
prepared assignments resume under their captured policy; accepted records and
historical missing identities are neither migrated nor invented. No renderer
dependency or mathematical outcome changes merely because this policy activates.

For a fresh native assignment, the coordinator supplies
`next --worker UNIQUE_JOB_ID --native-actor /root/actual_worker`, or the API
`workerLineage: {kind: 'native', actorId: '/root/actual_worker'}`. The actor must
identify the actual continuing worker, not a fresh assignment/session UUID.
The ignored native preparation helper accepts `--native-actor` and optional
`--resume-worker`; old active owners need no new argument. Ownership and
preparation freeze the binding. Native author metrics must contain matching
`authorIdentity`; native review metrics/profile must contain matching
`reviewerIdentity`, exposed `model: 'gpt-6.1-sol'`, `effort: 'high'` and
`requestedServiceTier: 'default'`. All supplied worker/actor/settings aliases
must agree before metric merging. Native actual provider, observed model, tier,
speed and inference usage stay null when unavailable. A new UUID cannot permit
the actual author to review their own stage. Profile attachment cannot replace
an already recorded reviewer identity.

When a strict native stage is revised, known strict native author bindings are
retained as additive `nativeAuthorLineage`, with the actual original stage and
candidate hashes. The guard conservatively excludes every such known author
from fresh review or visual acceptance of the revised stage, including an
original author returning under a new assignment UUID after another worker's
partial repair. Missing historical author identities are never filled in.
The first strict revision may also retain an actual supplied historical
`metrics.authorIdentity`, explicitly labeled `historical-author-metrics` and
bound to that original stage/candidate. It does not relabel the old stage as
strict or invent identities for historical stages without that metadata.

Native visual recording and renderer-only refresh for a strict stage require
the same explicit coordinator-bound `reviewerProfile.workerLineage`, matching
reviewer identity/settings, and a different actual author. Authentic earlier
inspection profiles remain immutable and usable under their original policy;
reuse still needs the existing exact source/block/PNG evidence. Legacy unknown
authorship remains explicitly unknown. Bindings are trusted coordinator
declarations, not a claim that JSON cryptographically attests agent identity.

The external runner supplies `kind: 'external-ephemeral'` for new strict jobs.
It records actual reported Codex session IDs, rejects assignment IDs masquerading
as provider sessions, and rejects author/reviewer session overlap. It does not
take over strict native leases, or unmigrated legacy native leases identified by
their existing native worker label/interface. Their prepared state and paid
caches are preserved without adding lineage. Historical runner payloads and caches remain
unchanged when the policy is absent.

`node scripts/content/campaign.mjs measure-usage --campaign ID` is read-only.
Its additive `content-campaign-usage-v1` report counts distinct recorded native
author/review assignments as a **minimum job count**, including recorded released
or checkpointed jobs; actual native inference calls are unknown. It excludes
unrecorded main/application work. Explicit external dispatches are deduplicated
by actual call/attempt/provider-session identities; cached reuse, zero-call
checkpoint refusals and aggregate `availableUsage` are not added again. Dispatch
observations without a dedup identity and unspecified historical metrics are
reported separately. Missing telemetry remains null; conflicting telemetry is
flagged and excluded from token totals. Cached input is a subset of input;
reasoning output is a subset of output. They must never be summed again.
Recorded configured `serviceTier` is preserved separately from an explicitly
reported actual tier; it cannot establish otherwise unavailable provider speed.
Preserved legacy `workerCalls`/`usageUnavailableCalls` may overlap these views
and have mixed unknown provenance: there is deliberately no combined call total
or campaign attribution from shared account usage deltas.

All unspecified legacy metric observations retain their raw metadata and
available usage. `legacyAvailableTokenTotals` and
`allDeduplicatedAvailableTokenTotals` expose known counters without pretending
that an absent dispatch marker proves native or external attribution. These
views overlap the explicit-marker view and must not be added together. Flat and
nested cache/reasoning aliases are normalized; compatible unknown counters may
be completed, while contradictory known counters are excluded. A session-only
checkpoint aliases a uniquely identified real call; if the same provider session
contains multiple real calls, the unidentified observation remains ambiguous.

Optional `measure-usage --historical-external-evidence FILE
--historical-external-evidence-hash HASH` verifies additive historical CLI
attribution against the actual hash-bound event files, started thread ID and
completed-turn usage. It reports source-proven historical dispatches separately
and a deduplicated identified-dispatch view. It never rewrites old markers or
equates failed invocations, native assignments or legacy `workerCalls` with
actual inference calls. Multi-turn logs require more precise evidence.

Native rows distinguish `exposedModel`, `recordedObservedModel` and
`actualObservedProviderModel`. A historical `observedModel` copied from exposed
settings does not establish a provider response. Explicit provider observations
remain available; otherwise actual model/tier/usage stay unknown. Optional
`--native-profile-clarification FILE --native-profile-clarification-hash HASH`
retains a verified clarification and each original profile's byte hash without
editing the historical profile or acceptance evidence.
# Exact renderer applicability addendum

Ordinary canonical receipts still require the complete current renderer signature. The optional `campaign-three-delta-plain-fields-v1` addendum is limited to the independently reviewed three-file `4cd2…` → `34846…` interval. It does not exclude the active document-model module or relabel an old capture as current. Both complete 700-file manifests, exact source snapshots and the independent scope proof are checked; all other dependency entries, native geometry, fonts, browser environment, full field/caption input, candidate and mathematical/source/prerequisite acceptance remain bound.

The complete actual field passes through the bound InlineContent/source-list parser. Only plain strings and its paragraph/list nodes are supported. Structured documents, tables, speech bubbles and unknown input types require affected current inspection. Ordinary mathematical arrays and words such as “table” are preserved. Both hash-verified old/current document renderers produce exactly equal list HTML, using consistent deterministic generated IDs without stripping mathematical output.

After a different actual worker accepts the seven current module/support/schema/test/fixture/docs hashes (including the imported layout applicability helper), the coordinator can call `activateRenderApplicability(root, {scopeReview, codeReview, currentEnvironmentReceipt, coordinatorIdentity:'/root', out})` from `scripts/content/campaign-render-applicability.mjs`. This creates a new immutable addendum only; it does not record skill acceptance. The code review uses format `content-campaign-render-applicability-code-review-v1`, `accepted:true`, distinct `authorIdentity`/`reviewerIdentity`, Sol 6.1 high/default profile, and `files:[{path,hash}]`. Supply its resulting `{path,hash}` as `rendererApplicability` on each explicit `recordRefreshedVisualReview` row. No policy or existing owner is migrated automatically.

The current environment reference must be a genuine current-signature canonical producer receipt. The synchronous API runs a read-only headless launcher/version probe at activation and once per validation operation, and rechecks current executable bytes before and after validation. It does not navigate the application or create pixels. The actual live version must match the original and current captured versions; UA, viewport, DPR, registered font inventory and loaded document-font status must agree. Unused individual font statuses may differ by question and remain original evidence. The current binary hash is additive evidence; old captures' unrecorded binary hashes stay unknown. Thus an upgrade cannot pass using only a historical environment JSON artifact.

The shared revision/lock, live pair and complete source/coverage checks still run. Original receipt/signature and authentic inspection profile remain unchanged; current signature, feature proof and addendum are separate ledger evidence. Reused pixels must trace to an immutable positive **actual** terminal inspection with exact source/block/input/PNG bytes, not just an intermediate accepted flag or a mathematical reviewer profile. Changed pixels need fresh actual inspection. Partial refreshes preserve all untouched history; future extra changes, stale code/proof, parser or environment drift reject this addendum. The source-hashed contract is `docs/content-campaign-render-applicability.json`. This profile supplies no dark-theme, unrelated booklet feature or new mathematical-review acceptance.

### Fixed native-field layout applicability

The separate `campaign-three-layout-delta-native-fields-v1` profile supports only the exact captured f422 manifest to fixed 01b5 manifest described in [the source-hashed schema](content-campaign-layout-applicability.json). The three changed arrangement modules are outside the independently reviewed native display path; all other 697 bindings remain exact, including the already captured active LabelSpace revision. It supplies no booklet grid, editor, export, parser, geometry or future-signature waiver. Complete actual field strings are parsed; structured tables, layout bubbles and unknown types reject.

After independent source and code acceptance, the root coordinator may call `activateRenderApplicability(root, {profile:'campaign-three-layout-delta-native-fields-v1', scopeReview, codeReview, currentEnvironmentReceipt, coordinatorIdentity:'/root', out})`. This creates only an immutable addendum. The code review must bind the nine files listed in `LAYOUT_APPLICABILITY.codeFiles` (including the historical-profile schema and regression tests); a genuine target-signature producer environment and live browser binary/version probe are required. The existing `recordRefreshedVisualReview` API accepts its reference as `rendererApplicability` only on `identical-png-reuse` rows tracing to authentic positive terminal actual inspection. Source/stage/pair/order/prerequisite and revision checks still run; subsequent receipt checks reconstruct missing persisted field values from the complete current candidate. Original receipts, signatures, profiles, observations and PNGs remain unchanged, and the applicability evidence records the different current signature separately with zero new pixel credit.

The historical fourcd-to-348 profile, source files and acceptance artifacts are retained. Neither profile is enabled automatically; ordinary complete-signature validation stays strict. Extra drift, mismatched current browser/fonts, stale source or code, malformed field values and absent original actual pixel attribution reject before ledger mutation.

Historical six-file code acceptances remain immutable evidence. Current operations for that profile require a new independent code acceptance also binding the imported layout helper; this requirement neither activates nor migrates any historical addendum or source/pixel signature.


## Explicit Medium execution override (2 October 2026)

The human user requested “switch model to gpt6.1 sol medium” in the
`worked-examples-2026-09` campaign. This overrides High only for new campaign
assignments. `activate-execution-override --campaign worked-examples-2026-09
--input FILE` records `{request:"switch model to gpt6.1 sol medium",
requestedBy:"human user"}` with the actual recording time in `campaign.json`.
The historical campaign profile and completed/held High assignments remain High.

New ownership captures `user-requested-sol61-medium-v1`, Sol 6.1 Medium,
requested Standard/default tier, fast mode disabled and the human request reason.
Every new assignment requires coordinator-bound worker lineage. Preparation,
bounded prompts, cache identities, native/external validation, CLI configuration
and review receipts follow that captured profile; resuming ownership never
migrates its settings. Other efforts are rejected. Author and reviewer remain
independent actual actors/sessions. Accepted High outcomes and their original
renderer applicability/pixel inspection proofs retain their historical settings.
Fresh visual refreshes follow the prospective campaign profile.

The native spawn interface exposes model and reasoning effort, but cannot set a
service tier; record the requested tier separately and keep observed provider
model, actual tier and usage null when unavailable. This override does not
change the main chat selector or global booklet defaults. CLI workers receive
an explicit run-specific `reasoningOverride`; ordinary booklet jobs stay High.
