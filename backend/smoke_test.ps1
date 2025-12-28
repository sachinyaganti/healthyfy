$ErrorActionPreference = 'Stop'

$py = 'C:/Users/sachi/OneDrive/Documents/ElannVision/Healthyfy/healthyfy/.venv/Scripts/python.exe'
$backendDir = 'c:/Users/sachi/OneDrive/Documents/ElannVision/Healthyfy/healthyfy/backend'
$port = 8001
$base = "http://127.0.0.1:$port"

$proc = $null

try {
  Write-Host "Starting backend on $base"

  # Best-effort: free the port if something is already listening
  try {
    $conns = Get-NetTCPConnection -LocalAddress 127.0.0.1 -LocalPort $port -ErrorAction Stop
    foreach ($c in $conns) {
      if ($c.OwningProcess -and $c.OwningProcess -ne 0) {
        Stop-Process -Id $c.OwningProcess -Force -ErrorAction SilentlyContinue
      }
    }
  } catch {
    # ignore
  }

  # Start Uvicorn
  $args = @('-m','uvicorn','app.main:app','--app-dir',$backendDir,'--host','127.0.0.1','--port',"$port")
  $proc = Start-Process -FilePath $py -ArgumentList $args -PassThru

  # Wait for readiness
  $ok = $false
  for ($i=0; $i -lt 30; $i++) {
    try {
      Invoke-RestMethod -Method GET -Uri "$base/health" | Out-Null
      $ok = $true
      break
    } catch {
      Start-Sleep -Milliseconds 300
    }
  }

  if (-not $ok) {
    throw "Backend did not become ready on $base"
  }

  Write-Host 'GET /health'
  Invoke-RestMethod -Method GET -Uri "$base/health" | ConvertTo-Json -Depth 6

  Write-Host "`nPOST /api/fitness/plan"
  Invoke-RestMethod -Method POST -Uri "$base/api/fitness/plan" -ContentType 'application/json' -Body (@{ goal='general fitness'; level='beginner' } | ConvertTo-Json) | ConvertTo-Json -Depth 6

  Write-Host "`nPOST /api/nutrition/plan"
  Invoke-RestMethod -Method POST -Uri "$base/api/nutrition/plan" -ContentType 'application/json' -Body (@{ preference='balanced'; allergies='peanuts' } | ConvertTo-Json) | ConvertTo-Json -Depth 6

  Write-Host "`nPOST /api/mental/breathing"
  Invoke-RestMethod -Method POST -Uri "$base/api/mental/breathing" -ContentType 'application/json' -Body (@{ minutes=2 } | ConvertTo-Json) | ConvertTo-Json -Depth 6

  Write-Host "`nGET /api/mental/journal-prompt"
  Invoke-RestMethod -Method GET -Uri "$base/api/mental/journal-prompt" | ConvertTo-Json -Depth 6

  Write-Host "`nPOST /api/chronic/support"
  Invoke-RestMethod -Method POST -Uri "$base/api/chronic/support" -ContentType 'application/json' -Body (@{ condition='migraine' } | ConvertTo-Json) | ConvertTo-Json -Depth 6

  Write-Host "`nSmoke test OK"
  exit 0
} catch {
  Write-Host "`nSmoke test FAILED" -ForegroundColor Red
  Write-Host $_.Exception.Message -ForegroundColor Red
  if ($_.ScriptStackTrace) { Write-Host $_.ScriptStackTrace }
  exit 1
} finally {
  if ($proc -and -not $proc.HasExited) {
    try { Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue } catch {}
  }
}
