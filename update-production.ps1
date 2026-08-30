$ErrorActionPreference = "Stop"

$zip = "$HOME\Downloads\voidworks-production-v8.zip"
$project = "C:\Users\neolo\Documents\dev\voidworks\voidworks-full"
$temp = Join-Path $env:TEMP "voidworks-production-v8"

if (!(Test-Path $zip)) { throw "ZIP niet gevonden: $zip" }
if (!(Test-Path $project)) { throw "Projectmap niet gevonden: $project" }
if (!(Test-Path (Join-Path $project ".git"))) { throw ".git ontbreekt in $project" }

if (Test-Path $temp) { Remove-Item $temp -Recurse -Force }
New-Item -ItemType Directory -Path $temp -Force | Out-Null
Expand-Archive -Path $zip -DestinationPath $temp -Force

$source = $temp
$nested = Join-Path $temp "voidworks-production-v8"
if (Test-Path $nested) { $source = $nested }

Get-ChildItem $source -Force |
  Where-Object { $_.Name -notin @(".git", ".vercel", ".env.local", "node_modules", ".next") } |
  ForEach-Object { Copy-Item $_.FullName -Destination $project -Recurse -Force }

Set-Location $project
if (Test-Path ".next") { Remove-Item ".next" -Recurse -Force }

npm install
npm run typecheck
npm run build

git add .
git commit -m "Voidworks v8 complete UI auth pricing languages themes"
if ($LASTEXITCODE -ne 0) { Write-Host "Geen nieuwe commit nodig." -ForegroundColor Yellow }
git push origin main

$vercel = "$env:APPDATA\npm\vercel.cmd"
& $vercel deploy --prod

Write-Host "Klaar: https://voidworks.eu" -ForegroundColor Green
Write-Host "Register: https://voidworks.eu/register"
Write-Host "BELANGRIJK: Supabase Email OTP length moet op 6 staan. Zie supabase\EMAIL-SETUP.md"
