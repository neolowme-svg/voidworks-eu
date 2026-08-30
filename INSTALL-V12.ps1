$ErrorActionPreference = "Stop"
$project = "C:\Users\neolo\Documents\dev\voidworks\voidworks-full"
$npm = "C:\Program Files\nodejs\npm.cmd"
$vercel = "$env:APPDATA\npm\vercel.cmd"

Set-Location $project
Remove-Item ".next" -Recurse -Force -ErrorAction SilentlyContinue

& $npm install
if ($LASTEXITCODE -ne 0) { throw "npm install failed" }

& $npm run typecheck
if ($LASTEXITCODE -ne 0) { throw "typecheck failed" }

& $npm run build
if ($LASTEXITCODE -ne 0) { throw "build failed" }

Write-Host "Local checks passed." -ForegroundColor Green
Write-Host "Run git add/commit/push and Vercel deploy after reviewing the changes." -ForegroundColor Cyan
