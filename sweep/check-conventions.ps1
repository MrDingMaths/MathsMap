param([Parameter(Mandatory=$true)][string[]]$Projects)
$ErrorActionPreference='Stop'
foreach($Project in $Projects){
 $dir=".booklet-work/pre-review-sweep/$Project/conventions"
 $changes=Get-Content "$dir/changes.json" -Raw | ConvertFrom-Json
 $blocks=$changes.changed -join ','
 $editions=switch($Project){
  'circle-trigonometry-v1' {'student,worked'}
  'expanding-brackets-v1' {'student,worked'}
  'solve-2-step-equations-v1' {'student,short,worked'}
  default {'student'}
 }
 node scripts/booklet/check-feedback-pages.mjs --project-file "$dir/candidate.json" --baseline-project-file "$dir/before.json" --blocks $blocks --editions $editions --out "$dir/pages-after" --cache-state "$dir/cache-state.json" --full-reason 'Authorised convention follow-up: named changed blocks and neighbours.' *> "$dir/check-after.log"
 $afterExit=$LASTEXITCODE
 node scripts/booklet/check-feedback-pages.mjs --project-file "$dir/before.json" --blocks $blocks --editions $editions --checks-only none --out "$dir/pages-before" --cache-state "$dir/cache-state.json" --full-reason 'Before images for convention follow-up, same affected blocks.' *> "$dir/check-before.log"
 $beforeExit=$LASTEXITCODE
 if($afterExit -ne 0 -or $beforeExit -ne 0){Write-Output "$Project requires check diagnosis: after $afterExit, before $beforeExit"}
 node sweep/compare.mjs "$Project/conventions" *> "$dir/comparisons.log"
 if($LASTEXITCODE -ne 0){Get-Content "$dir/comparisons.log" -Tail 15; throw "$Project comparisons failed"}
 foreach($edition in ($editions -split ',' | Where-Object {$_ -ne 'student'})){
  node sweep/compare.mjs "$Project/conventions" $edition *> "$dir/comparisons-$edition.log"
  if($LASTEXITCODE -ne 0){throw "$Project $edition comparisons failed"}
 }
 Write-Output "$Project checks and comparisons finished"
}
