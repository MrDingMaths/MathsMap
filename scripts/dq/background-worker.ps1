param(
  [Parameter(Mandatory = $true)]
  [string]$PayloadPath,

  [Parameter(Mandatory = $true)]
  [string]$DqRunToken
)

$ErrorActionPreference = 'Stop'
$payload = Get-Content -Raw -LiteralPath $PayloadPath | ConvertFrom-Json
if ($payload.runToken -ne $DqRunToken) {
  throw 'Background worker token does not match its payload.'
}

$exitCode = 1
$outcome = 'failed'
$failure = $null
try {
  # The crawler intentionally writes progress to stderr. Windows PowerShell
  # promotes native stderr records under ErrorActionPreference=Stop, which
  # would otherwise terminate a healthy crawl on its first progress line.
  $previousErrorActionPreference = $ErrorActionPreference
  $ErrorActionPreference = 'Continue'
  & $payload.nodePath $payload.captureScript @($payload.captureArgs) 1>> $payload.stdoutPath 2>> $payload.stderrPath
  $exitCode = $LASTEXITCODE
  $ErrorActionPreference = $previousErrorActionPreference
  $outcome = if ($exitCode -eq 0) { 'completed' } else { 'failed' }
} catch {
  $ErrorActionPreference = 'Stop'
  $failure = $_.Exception.Message
  $failure | Out-File -LiteralPath $payload.stderrPath -Append -Encoding utf8
} finally {
  $finishedAt = (Get-Date).ToUniversalTime().ToString('o')
  $exitRecord = [ordered]@{
    schemaVersion = 1
    runId = $payload.runId
    runToken = $DqRunToken
    pid = $PID
    outcome = $outcome
    exitCode = $exitCode
    startedAt = $payload.startedAt
    finishedAt = $finishedAt
    failure = $failure
  }
  $temporary = "$($payload.exitPath).$PID.tmp"
  $exitRecord | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath $temporary -Encoding utf8
  Move-Item -LiteralPath $temporary -Destination $payload.exitPath -Force
}

exit $exitCode
