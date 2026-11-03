# Private browser storage investigation and approved cleanup — 3 November 2026

The D: volume was full, not just a Git repository problem. A single read-only metadata inventory measured MathsMap at **598,749,186,477 logical bytes (557.63 GiB)**, including **533.97 GiB in `.booklet-work`**. D: capacity was 1,000,186,310,656 bytes and only 331,776 bytes were available. Logical folder sizes can differ from allocated disk space; directory junctions were not followed.

## Cause and observed impact

The dominant category was **777 private Chromium mirror directories**, containing about **371.71 GiB** of engine files. These were historical render-host copies, not 777 simultaneously running browsers. A normal complete copy has 263 files and 514,275,944 bytes (0.479 GiB).

`createPrivateMirror` in `scripts/booklet/browser-engine-mirror.mjs` creates a fresh exclusive operation directory, copies each pinned engine file with `COPYFILE_EXCL`, and verifies the copy. `scripts/booklet/frozen-runtime-pin.mjs` verifies the mirror and absent browser lease during dispatch cleanup, but retains the binaries. Repeated bounded render hosts therefore accumulated independent copies. Existing verification rejects hardlinks and reparse paths; replacing mirrors with shared links is not a supported cleanup shortcut.

Every new copy necessarily adds roughly 0.48 GiB of disk writes plus hash-verification reads. This is measurable I/O overhead, although this investigation did not benchmark its share of total elapsed rendering time. Merely retaining inactive copies does not imply browser CPU/RAM use. The confirmed consequence was ENOSPC: a geometry mirror failed before server/browser start, and two reviewed-candidate writes left known zero-byte invalid files. Those accepted reviews remain intact and must be reused during reconstruction.

Other measured categories included canonical Chromium engines (11.02 GiB), physical node_modules (1.18 GiB), frozen application copies (15.07 GiB), original/native/extracted evidence, revisions and rendered outputs. None of these categories was bulk-cleaned.

## Exact authorized cleanup

The user approved the previously disclosed **123 closed copies**, comprising the first 23-copy proposal plus the additional 100-copy manifest. Fresh checks confirmed no active lane hosts or browser/workspace executable processes, no current explicit booklet/bank/provenance references to these mirrors, matching closure/release evidence, intact canonical runtime pins, and matching SHA-256 hashes for source and target engine files. Latest predecessors and incomplete/uncertain mirrors were excluded.

Only the **32,349 individually listed regular engine files** were unlinked. No recursive directory deletion was used. No additional mirror, source, booklet, bank record, candidate, review, log, output, raster, binding, closure receipt, canonical engine or runtime was deleted. Post-cleanup checks confirmed all listed files absent and all 123 bindings, closure receipts and canonical pins unchanged.

| Measurement | Bytes | GiB |
| --- | ---: | ---: |
| Approved logical engine bytes removed | 63,255,941,112 | 58.91 |
| Available space before | 331,776 | 0.00031 |
| Available space immediately after | 63,282,544,640 | 58.94 |
| Observed available-space increase | 63,282,212,864 | 58.94 |

The small difference between logical bytes and observed free-space change reflects filesystem allocation and possible concurrent volume activity; it is not extra claimed deletion. Cleanup completed at 2026-11-03T04:12:40.253Z.

The exact local receipt, manifest, classification and diagnostic inventory are retained in `.booklet-work/disk-audit-20261103/`, outside release files. Receipt `mathsmap-approved123-cleanup-receipt-20261103.json` SHA-256: `7bd454724307f7e9ad33b4890c84ce237665170a329266ab46dd1feb3c6089b4`. The additional-100 proposal SHA-256 is `b40021d5768f6e4cc3f776b6b604a6865d889cd188856be68a042c752ef1cc87`.

## Remaining work and prevention

The other mirrors remain untouched. Many lack matching release evidence or have terminal cleanup errors; they cannot be assumed safe because they are old. The audit qualified another 395 copies at metadata level only, without extending deletion authorization. Original sources, reviews, candidates and the approximately 88 GiB unclassified remainder remain protected.

Continue using shared pinned runtimes and supported export reuse. For future retention changes, prefer an explicitly approved closed-mirror lifecycle that preserves bindings/evidence and canonical regeneration inputs after ownership is conclusively released, plus a pre-admission free-space budget. No runtime, retention or security setting was changed in this cleanup. The standard export pruner remains subject to its idle-session constraints in [the storage policy](booklet-storage.md).
