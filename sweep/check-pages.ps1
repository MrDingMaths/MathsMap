# Before/after pages for a prepared sweep: renders the candidate's affected
# Questions pages (with automated checks) and the same blocks from the
# before-snapshot, for side-by-side review. Run from PowerShell (Poppler).
#   powershell -File sweep/check-pages.ps1 -Project ID [-Editions student]
param([Parameter(Mandatory=$true)][string]$Project,[string]$Editions='student')
$ErrorActionPreference='Stop'
$dir=".booklet-work/pre-review-sweep/$Project"
$changes=Get-Content "$dir/changes.json" -Raw | ConvertFrom-Json
$blocks=($changes.changed -join ',')
node scripts/booklet/check-feedback-pages.mjs --project-file "$dir/candidate.json" --baseline-project-file "$dir/before.json" --blocks $blocks --editions $Editions --out "$dir/pages-after" --full-reason 'Pre-review sweep: the changed blocks and their neighbours bound the selection.'
$afterExit=$LASTEXITCODE
node scripts/booklet/check-feedback-pages.mjs --project-file "$dir/before.json" --blocks $blocks --editions $Editions --checks-only none --out "$dir/pages-before" --full-reason 'Pre-review sweep: before images of the same blocks.'
"after exit $afterExit, before exit $LASTEXITCODE"
