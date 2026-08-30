$ErrorActionPreference = "Stop"

$projectPath = "C:\Users\neolo\Documents\dev\voidworks\voidworks-full"
$vercelProject = "voidworks-eu"

Set-Location $projectPath

if (!(Get-Command vercel -ErrorAction SilentlyContinue)) {
    if (!(Get-Command npm -ErrorAction SilentlyContinue)) {
        throw "Node.js/npm ontbreekt. Installeer Node.js eerst via https://nodejs.org/"
    }
    npm install -g vercel
}

vercel whoami *> $null
if ($LASTEXITCODE -ne 0) {
    vercel login
}

# Link of maak Vercel project
vercel link --yes --project $vercelProject

# Productiedeployment
vercel deploy --prod

# Domeinen aan project toevoegen
vercel domains add voidworks.eu $vercelProject
vercel domains add www.voidworks.eu $vercelProject

Write-Host ""
Write-Host "Controleer nu de vereiste DNS-records:" -ForegroundColor Cyan
vercel domains inspect voidworks.eu
vercel domains inspect www.voidworks.eu

Write-Host ""
Write-Host "Domeinen toegevoegd. Als DNS nog niet goed staat, gebruik de records die hierboven worden getoond." -ForegroundColor Green
