$ErrorActionPreference = "Stop"

$project = "C:\Users\neolo\Documents\dev\voidworks\voidworks-full"
$npm = "C:\Program Files\nodejs\npm.cmd"
$vercel = "$env:APPDATA\npm\vercel.cmd"

Set-Location $project
Remove-Item ".next" -Recurse -Force -ErrorAction SilentlyContinue

& $npm install
if ($LASTEXITCODE -ne 0) { Write-Host "npm install failed" -ForegroundColor Red; return }

& $npm run typecheck
if ($LASTEXITCODE -ne 0) { Write-Host "TYPECHECK FAILED - send the error output to ChatGPT" -ForegroundColor Red; return }

& $npm run build
if ($LASTEXITCODE -ne 0) { Write-Host "BUILD FAILED - send the error output to ChatGPT" -ForegroundColor Red; return }

git add .
git commit -m "Voidworks v11 auth turnstile locale fixes"
if ($LASTEXITCODE -ne 0) { Write-Host "Nothing new to commit, or git commit failed. Continuing only if working tree is clean." -ForegroundColor Yellow }

git push origin main
if ($LASTEXITCODE -ne 0) { Write-Host "git push failed" -ForegroundColor Red; return }

& $vercel deploy --prod
if ($LASTEXITCODE -ne 0) { Write-Host "Vercel deploy failed" -ForegroundColor Red; return }

Write-Host "Done. Test https://voidworks.eu/register and https://voidworks.eu/login" -ForegroundColor Green
