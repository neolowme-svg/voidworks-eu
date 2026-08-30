$ErrorActionPreference = "Stop"
$Target = "C:\Users\neolo\Documents\dev\voidworks\voidworks-full"
$Source = $PSScriptRoot

Write-Host "Voidworks v7 -> $Target" -ForegroundColor Cyan
if (-not (Test-Path $Target)) { throw "Projectmap niet gevonden: $Target" }

Get-ChildItem $Source -Force | Where-Object { $_.Name -notin @("INSTALL-V7.ps1", ".git", "node_modules", ".next") } | ForEach-Object {
    Copy-Item $_.FullName -Destination $Target -Recurse -Force
}

Set-Location $Target
if (Test-Path ".next") { Remove-Item ".next" -Recurse -Force }

npm install
npm run build

Write-Host "" 
Write-Host "Controle: /register en /auth/signout moeten hierboven in de build staan." -ForegroundColor Green
Write-Host "Daarna uitvoeren:" -ForegroundColor Cyan
Write-Host 'git add .; git commit -m "Voidworks v7 complete fixes and pricing"; git push origin main'
Write-Host '$vercel = "$env:APPDATA\npm\vercel.cmd"; & $vercel deploy --prod'
