$ErrorActionPreference = "Stop"
$target = "C:\Users\neolo\Documents\dev\voidworks\voidworks-full"
Write-Host "Voidworks v8 installeren naar $target"
Copy-Item "$PSScriptRoot\*" $target -Recurse -Force
Set-Location $target
if (Test-Path ".next") { Remove-Item ".next" -Recurse -Force }
npm install
npm run build
Write-Host "Klaar. Controleer dat /register in de buildlijst staat."
