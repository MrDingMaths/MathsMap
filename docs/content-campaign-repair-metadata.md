# Oversized native repair metadata

`native-repair-metadata-ref-v1` is an explicit preparation option for a fresh,
oversized native repair using the native prerequisite reference profile. It
stores complete prior findings, repair targets and the relevant previous review
once in an immutable assignment-owned artifact. Packets retain complete questions,
solutions, options and targeted prior outcomes. Every native packet and prerequisite
pack remains bounded by 24,000 characters.

Call `prepareAssignment` with both
`prerequisiteContextProfile: "native-prerequisite-context-ref-v1"` and
`repairMetadataProfile: "native-repair-metadata-ref-v1"`. It rejects small repairs,
external ownership and attempts to migrate historical preparations. The returned
`repairMetadataReference` identifies the full artifact. Use
`loadRepairMetadata(root, prepared, state)` to validate and load it without granting
reading credit, then call `recordRepairMetadataRead` with the current owned worker
and `{complete: true, reference: prepared.repairMetadataReference, observation}`.

The artifact binds the owned actor, execution profile, assignment, stage,
candidate, prepared snapshot, previous review, scope, source references and full
dependency hash. Both semantic and literal file hashes are checked. It is not a
summary and grants no mathematical or visual acceptance.

The native worker must personally read the complete artifact using the guarded
loader and record its exact reference, `complete: true`, and a reading observation
with `recordRepairMetadataRead`. Preparation or file existence does not establish
reading. The normal prerequisite acknowledgment is also required. Missing,
altered, foreign, stale or unread evidence fails before lean staging or normal
staging. The stage retains the metadata reference and actual reading receipt.

Historical preparations keep their captured format and bytes. They cannot opt
into this profile during reprepare. External workers cannot dispatch native
prerequisite or repair-metadata references. Existing independent outcomes remain
eligible only under the normal unchanged-content and teaching-dependency guards.

Changing the activation-pinned support code requires a fresh independent code
review and renderer activation. Older rendering evidence remains historical or
pending under the existing guards; this metadata mechanism does not rebind it.

`activateScopedRendererPolicy` remains immutable. A subsequent independently
reviewed activation uses `migrateScopedRendererPolicy` with the exact
`expectedPolicy` object `{rendererDependencyProfile, rendererActivation,
rendererActivatedAt}`, its `hashValue` as `expectedPolicyHash`, the new immutable
`rendererActivation`, `migratedBy` and a substantive `reason`. The existing ledger
lock covers the comparison and save. Publication ownership/status or an active
publication journal blocks migration. The old activation's literal bytes and the
new review/code/live browser are verified, and prior policy/reference/time are
retained in `rendererPolicyHistory`. Skill records and historical receipts are
untouched. A stale, repeated, malformed or unreviewed migration is rejected.
