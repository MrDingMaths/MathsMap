param(
  [Parameter(Mandatory=$true)][string]$JobId,
  [Parameter(Mandatory=$true)][string]$TranscriptionJson,
  [string]$InputPath = '.diagnostic-questions/visual-jobs-current.json',
  [string]$OutputDirectory = '.diagnostic-questions/transcriptions-full-20260802'
)

$authoritative = Get-Content -Raw -LiteralPath $InputPath | ConvertFrom-Json
$job = @($authoritative.jobs) | Where-Object { $_.jobId -eq $JobId }
if (@($job).Count -ne 1) { throw "Expected exactly one authoritative job for $JobId" }
$transcriptions = $TranscriptionJson | ConvertFrom-Json
if (@($transcriptions).Count -ne @($job.candidates).Count) { throw "Transcription count mismatch for $JobId" }

$outCandidates = @()
for ($i = 0; $i -lt @($job.candidates).Count; $i++) {
  $candidate = $job.candidates[$i]
  $transcription = $transcriptions[$i]
  $outCandidates += [pscustomobject]@{
    source = $candidate.source
    qualityScore = $candidate.qualityScore
    workerInstructions = $candidate.workerInstructions
    transcription = $transcription
  }
}

New-Item -ItemType Directory -Force -Path $OutputDirectory | Out-Null
$out = [pscustomobject]@{ jobId = $JobId; candidates = $outCandidates }
$path = Join-Path $OutputDirectory ($JobId + '.json')
$out | ConvertTo-Json -Depth 50 | Set-Content -LiteralPath $path -Encoding UTF8
Write-Output $path
