$ErrorActionPreference = "Stop"

$zip = "$HOME\Downloads\voidworks-production-v3.zip"
$project = "C:\Users\neolo\Documents\dev\voidworks\voidworks-full"
$temp = Join-Path $env:TEMP "voidworks-production-v3"

if (!(Test-Path $zip)) {
    throw "ZIP niet gevonden: $zip"
}

if (!(Test-Path $project)) {
    throw "Projectmap niet gevonden: $project"
}

if (!(Test-Path (Join-Path $project ".git"))) {
    throw ".git ontbreekt. Script stopt om je repository veilig te houden."
}

if (Test-Path $temp) {
    Remove-Item $temp -Recurse -Force
}
New-Item -ItemType Directory -Path $temp -Force | Out-Null
Expand-Archive -Path $zip -DestinationPath $temp -Force

# Oude statische versie opruimen. .git, .vercel en .env.local blijven altijd staan.
$legacy = @(
    "index.html",
    "login.html",
    "login.js",
    "script.js",
    "styles.css",
    "vercel.json",
    "update-v2.ps1"
)

foreach ($file in $legacy) {
    $target = Join-Path $project $file
    if (Test-Path $target) {
        Remove-Item $target -Force
    }
}

# Oude assets-map mag weg; nieuwe Next assets staan in public/assets.
$legacyAssets = Join-Path $project "assets"
if (Test-Path $legacyAssets) {
    Remove-Item $legacyAssets -Recurse -Force
}

Get-ChildItem $temp -Force |
    Where-Object { $_.Name -notin @(".git", ".vercel", ".env.local") } |
    ForEach-Object {
        Copy-Item $_.FullName -Destination $project -Recurse -Force
    }

Set-Location $project

Write-Host ""
Write-Host "Bestanden bijgewerkt." -ForegroundColor Green

$vercel = "$env:APPDATA\npm\vercel.cmd"

if (Test-Path $vercel) {
    Write-Host "Vercel environment variables ophalen..." -ForegroundColor Cyan
    & $vercel env pull .env.local --yes
}

Write-Host "Dependencies installeren..." -ForegroundColor Cyan
npm install

Write-Host "TypeScript controleren..." -ForegroundColor Cyan
npm run typecheck

Write-Host "Production build testen..." -ForegroundColor Cyan
npm run build

git add .
git commit -m "Upgrade Voidworks to Next.js and Supabase"
if ($LASTEXITCODE -ne 0) {
    Write-Host "Geen nieuwe commit nodig of commit is overgeslagen." -ForegroundColor Yellow
}

git push origin main

if (Test-Path $vercel) {
    Write-Host "Naar Vercel deployen..." -ForegroundColor Cyan
    & $vercel deploy --prod
}

Write-Host ""
Write-Host "Klaar." -ForegroundColor Green
Write-Host "Website:   https://voidworks.eu"
Write-Host "Login:     https://voidworks.eu/login"
Write-Host "Dashboard: https://voidworks.eu/dashboard"
Write-Host ""
Write-Host "Vergeet niet supabase\schema.sql eenmalig in Supabase SQL Editor uit te voeren." -ForegroundColor Yellow
