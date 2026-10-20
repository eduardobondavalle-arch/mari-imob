$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$stateFile = Join-Path $projectRoot '.cache\share-preview.json'
if (-not (Test-Path -LiteralPath $stateFile)) { Write-Output 'Nenhuma apresentacao registrada.'; exit 0 }
$previewState = Get-Content -LiteralPath $stateFile -Raw | ConvertFrom-Json
$tunnelProcess = Get-Process -Id $previewState.tunnelPid -ErrorAction SilentlyContinue
$expectedExecutable = [IO.Path]::GetFullPath((Join-Path $projectRoot '.cache\tools\cloudflared.exe'))
if ($tunnelProcess -and $tunnelProcess.Path -eq $expectedExecutable) {
    Stop-Process -Id $tunnelProcess.Id
    Write-Output 'Link temporario encerrado. O localhost de desenvolvimento continua funcionando.'
} else {
    Write-Output 'O tunel desta apresentacao ja foi encerrado.'
}
