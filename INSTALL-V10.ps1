$ErrorActionPreference = "Stop"
$target = "C:\Users\neolo\Documents\dev\voidworks\voidworks-full"
$npm = "C:\Program Files\nodejs\npm.cmd"

Write-Host "Voidworks v10 installeren naar $target" -ForegroundColor Cyan
if (!(Test-Path $target)) { throw "Projectmap niet gevonden: $target" }

Get-ChildItem $PSScriptRoot -Force |
  Where-Object { $_.Name -notin @(".git", ".vercel", ".env.local", "node_modules", ".next") } |
  ForEach-Object { Copy-Item $_.FullName -Destination $target -Recurse -Force }

Set-Location $target
Remove-Item ".next" -Recurse -Force -ErrorAction SilentlyContinue

& $npm install
if ($LASTEXITCODE -ne 0) { throw "npm install is mislukt" }
& $npm run typecheck
if ($LASTEXITCODE -ne 0) { throw "Typecheck is mislukt" }
& $npm run build
if ($LASTEXITCODE -ne 0) { throw "Build is mislukt" }

Write-Host "Build geslaagd. Deploy pas nu naar Vercel." -ForegroundColor Green
