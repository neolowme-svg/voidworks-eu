$ErrorActionPreference = "Stop"
$project = "C:\Users\neolo\Documents\dev\voidworks\voidworks-full"
$npm = "C:\Program Files\nodejs\npm.cmd"
$vercel = "$env:APPDATA\npm\vercel.cmd"

Set-Location $project
Remove-Item ".next" -Recurse -Force -ErrorAction SilentlyContinue
& $npm install
& $npm run typecheck
if ($LASTEXITCODE -ne 0) { Write-Host "TYPECHECK FAILED" -ForegroundColor Red; return }
& $npm run build
if ($LASTEXITCODE -ne 0) { Write-Host "BUILD FAILED" -ForegroundColor Red; return }
git add .
$changes = git status --porcelain
if ($changes) { git commit -m "Voidworks v13 project portal and account system" }
git push origin main
& $vercel deploy --prod
