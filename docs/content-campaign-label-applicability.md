# Exact booklet-label applicability

`campaign-booklet-label-plain-fields-v1` is an opt-in transition from renderer
`dd9b2a10902549edd583636280be10c51aad8904d7ded9ff3e1a69edb590419e` to
`d87b01fee718ef0280cd775e140986aaad5eafdbc812e4fae8bfa469c16788ab`.
Only the source-labelled teaching activity example sequence changed. Whole plain
strings routed through InlineContent/TikZ do not call teachingLabels. Native
documents and teaching blocks are excluded; source lists retain their existing
restricted, exact HTML comparison.

The full 702-file manifests, exact before/current source bytes, unchanged route
sources, original field/block/input/PNG attribution and live browser/environment
checks remain mandatory. The retained old source is reconstructed by reversing
only this delta with original CRLF preserved; its literal hash matches the old
manifest. Git's normalized HEAD blob is diagnostic evidence, not the old bytes.

A distinct actor must accept code and source applicability with GPT-6.1 Sol,
Medium/default. The source review format is `booklet-label-source-review-v1`,
with `accepted:true`, `pixelAcceptance:false`, `profile` and `sourceEvidence`
referencing the exact fixed source-facts artifact. The code review uses the
existing format and binds every new profile code file. Coordinator activation
uses the existing activateRenderApplicability with this explicit profile and a
genuine current-signature environment receipt. Source applicability grants no
pixel acceptance. Terminal positive actual inspection is still required for
pixel reuse; only this profile permits a genuine Medium terminal inspector.
Historical profiles retain their High defaults and unchanged original receipts.
