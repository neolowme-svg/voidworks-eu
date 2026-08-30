$ErrorActionPreference = "Stop"

$zip = "$HOME\Downloads\voidworks-production-v6.zip"
$project = "C:\Users\neolo\Documents\dev\voidworks\voidworks-full"
$temp = Join-Path $env:TEMP "voidworks-production-v6"

if (!(Test-Path $zip)) { throw "ZIP niet gevonden: $zip" }
if (!(Test-Path $project)) { throw "Projectmap niet gevonden: $project" }
if (!(Test-Path (Join-Path $project ".git"))) { throw ".git ontbreekt in $project" }

if (Test-Path $temp) { Remove-Item $temp -Recurse -Force }
New-Item -ItemType Directory -Path $temp -Force | Out-Null
Expand-Archive -Path $zip -DestinationPath $temp -Force

$source = Join-Path $temp "voidworks-production-v6"
if (!(Test-Path $source)) { $source = $temp }

Get-ChildItem $source -Force |
  Where-Object { $_.Name -notin @(".git", ".vercel", ".env.local", "update-production.ps1") } |
  ForEach-Object { Copy-Item $_.FullName -Destination $project -Recurse -Force }

Set-Location $project

if (Test-Path ".next") { Remove-Item ".next" -Recurse -Force }

npm install
npm run typecheck
npm run build

git add .
git commit -m "Voidworks v6 dark redesign and OTP verification"
if ($LASTEXITCODE -ne 0) { Write-Host "Geen nieuwe commit nodig." -ForegroundColor Yellow }
git push origin main

$vercel = "$env:APPDATA\npm\vercel.cmd"
if (Test-Path $vercel) { & $vercel deploy --prod }

Write-Host "Klaar: https://voidworks.eu" -ForegroundColor Green
Write-Host "Login: https://voidworks.eu/login"
Write-Host "Register: https://voidworks.eu/register"
Write-Host "E-mail setup: supabase\EMAIL-SETUP.md"
