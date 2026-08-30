$ErrorActionPreference = "Stop"

$zip = "$HOME\Downloads\voidworks-full-v2.zip"
$project = "C:\Users\neolo\Documents\dev\voidworks\voidworks-full"
$temp = Join-Path $env:TEMP "voidworks-full-v2-update"

if (!(Test-Path $zip)) {
    throw "ZIP niet gevonden: $zip"
}

if (!(Test-Path $project)) {
    throw "Projectmap niet gevonden: $project"
}

if (!(Test-Path (Join-Path $project ".git"))) {
    throw ".git ontbreekt in de projectmap. Stop om je repository niet te beschadigen."
}

if (Test-Path $temp) {
    Remove-Item $temp -Recurse -Force
}
New-Item -ItemType Directory -Force -Path $temp | Out-Null
Expand-Archive -Path $zip -DestinationPath $temp -Force

# Kopieer alleen projectbestanden. .git en .vercel in bestaande project blijven intact.
Get-ChildItem $temp -Force |
    Where-Object { $_.Name -notin @(".git", ".vercel", ".env.local") } |
    ForEach-Object {
        Copy-Item $_.FullName -Destination $project -Recurse -Force
    }

Set-Location $project

git status --short
git add .
git commit -m "Refine Voidworks design and add login page"
if ($LASTEXITCODE -ne 0) {
    Write-Host "Geen nieuwe commit nodig of commit kon niet worden gemaakt." -ForegroundColor Yellow
}

git push origin main

$vercel = "$env:APPDATA\npm\vercel.cmd"
if (Test-Path $vercel) {
    & $vercel deploy --prod
} else {
    Write-Host "Vercel CLI niet gevonden. GitHub is wel bijgewerkt." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Update klaar." -ForegroundColor Green
Write-Host "Website: https://voidworks.eu"
Write-Host "Login:   https://voidworks.eu/login.html"
