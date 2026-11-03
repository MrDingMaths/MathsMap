# Shared pinned Chromium execution

New runtime pins include `scripts/booklet/shared-browser-engine.mjs`. Pinned lean-import/review dispatch uses this route when that module is in the pin; older pins retain their original private-mirror contract. Accepted pin files and historical bindings are never rewritten.

Each host shares the exact versioned canonical Chromium executable and engine inventory. It still launches a separate browser process. Playwright creates a fresh temporary user-data directory for each launch; hosts do not share profiles, cookies or browser connections. Downloads, Chrome logs and subprocess scratch directories belong to the host operation directory. Caller executable/channel/profile overrides cannot replace the binding.

The binding identifies the runtime manifest digest, engine version/inventory, canonical executable, operation UUID and host paths. Full pin and path/hash validation runs before launch and after close. Engine executables remain independent regular files; this route does not substitute hardlinks or junctions. Browser logging is kept outside the immutable engine.

## Ownership and maintenance

Each launch holds both its exclusive operation `browser-active.lease` and its UUID record under `<pin>/.booklet-work/shared-browser-leases/`. A successful close verifies the unchanged pin and matching lease records before releasing either record. Launch/close/verification failures retain ownership records for reconciliation. Never force-clear another host's record. Never modify, relocate or prune a canonical engine while any shared-engine lease remains; also reconcile actual processes and the coordinator's lane claims. This change does not grant canonical-engine cleanup authority.

Keep the three-host limit, RAM guard and revision/source/runtime checks. Read-only binary sharing is not permission to share profiles, bypass the sandbox, attach to the user's Chrome, or alter security settings. Existing Playwright launch defaults are preserved. A free-space check remains part of normal host admission; new engine bindings themselves contain only metadata, rather than copying about0.48GiB per host.

## Using the route

`createSharedEngineBinding(pinRoot, freshOperationDir)` prepares a small binding without copying engine binaries. Pass its receipt path/hash through `MATHSMAP_SHARED_BROWSER_RECEIPT` and `MATHSMAP_SHARED_BROWSER_SHA256`, alongside the exact `MATHSMAP_RUNTIME_PIN_HASH` and `MATHSMAP_BOOKLET_CHROMIUM`. Do not supply private-mirror environment variables simultaneously. `launchChromium` validates the binding and runs the shared lifecycle.

For normal pinned lean-review/import dispatch this is automatic on new capable pins. Existing custom QA runners must receive a scoped runtime/binding/environment/closure amendment before switching; they must not relabel a shared binding as a legacy private mirror or blindly refresh hashes. Existing active hosts may finish their immutable legacy route. Avoid launching further cold legacy copies where the supported shared route is available.

One new canonical copy may be needed when constructing a genuinely new versioned runtime pin. It is retained once for that pin and reused by every host; this is separate from the eliminated per-host engine copies. Do not create a new pin for each host.

## Validation on 3 November 2026

- Targeted tests:39 passed,0 failed;3 existing directory-symlink tests skipped because this environment does not permit creating those links. Lease isolation, failure retention, profile/executable override rejection and legacy launch behaviour were checked.
- Real pilot: three concurrent browsers used the same pinned Chromium156.0.8078.79 executable with three distinct temporary profiles. Each produced the same screenshot as a standard launch for a print specimen containing equation working, a table and SVG diagram, and produced a PDF. Cookie isolation, individual lease release, temporary-profile cleanup and unchanged canonical pin were confirmed. Per-host engine bytes copied:0.
- New immutable shared-capable pin smoke: use the retained local result for the actual outcome. The legacy baseline/pins remain intact. Pilot artifacts and receipts are retained in `.booklet-work/disk-audit-20261103/` and are not release assets.
- Application build passed, with existing Svelte/chunk-size warnings. No browser security settings, booklet content or bank data changed for this runtime fix.

The previously approved123-copy cleanup remains the only applied cleanup. Further mirrors require exact reference/closure/lease/hash verification and separate approval; shared execution is not authority to delete them.
