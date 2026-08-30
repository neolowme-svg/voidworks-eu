$ErrorActionPreference = "Stop"

$zip = "$HOME\Downloads\voidworks-production-v9.zip"
$project = "C:\Users\neolo\Documents\dev\voidworks\voidworks-full"
$temp = Join-Path $env:TEMP "voidworks-production-v9"
$npm = "C:\Program Files\nodejs\npm.cmd"
$vercel = "$env:APPDATA\npm\vercel.cmd"

if (!(Test-Path $zip)) { throw "ZIP niet gevonden: $zip" }
if (!(Test-Path $project)) { throw "Projectmap niet gevonden: $project" }
if (!(Test-Path (Join-Path $project ".git"))) { throw ".git ontbreekt in $project" }

Remove-Item $temp -Recurse -Force -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Path $temp -Force | Out-Null
Expand-Archive -Path $zip -DestinationPath $temp -Force

$source = $temp
$nested = Join-Path $temp "voidworks-production-v9"
if (Test-Path $nested) { $source = $nested }

Get-ChildItem $source -Force |
  Where-Object { $_.Name -notin @(".git", ".vercel", ".env.local", "node_modules", ".next") } |
  ForEach-Object { Copy-Item $_.FullName -Destination $project -Recurse -Force }

Set-Location $project
Remove-Item ".\middleware.ts" -Force -ErrorAction SilentlyContinue
Remove-Item ".\proxy.ts" -Force -ErrorAction SilentlyContinue
Remove-Item ".\lib\supabase\proxy.ts" -Force -ErrorAction SilentlyContinue
Remove-Item ".\INSTALL-V8.ps1" -Force -ErrorAction SilentlyContinue
Remove-Item ".\supabase\email-confirmation.html" -Force -ErrorAction SilentlyContinue
Remove-Item ".next" -Recurse -Force -ErrorAction SilentlyContinue

& $npm install
if ($LASTEXITCODE -ne 0) { throw "npm install is mislukt" }
& $npm run typecheck
if ($LASTEXITCODE -ne 0) { throw "Typecheck is mislukt" }
& $npm run build
if ($LASTEXITCODE -ne 0) { throw "Build is mislukt" }

git add .
git commit -m "Voidworks v9 security auth backups legal accessibility"
if ($LASTEXITCODE -ne 0) { Write-Host "Geen nieuwe commit nodig." -ForegroundColor Yellow }
git push origin main
if ($LASTEXITCODE -ne 0) { throw "git push is mislukt" }

& $vercel deploy --prod
if ($LASTEXITCODE -ne 0) { throw "Vercel deploy is mislukt" }

Write-Host "Klaar: https://voidworks.eu" -ForegroundColor Green
Write-Host "BELANGRIJK: run supabase\schema.sql en voeg RESEND_API_KEY toe. Zie README.md."
