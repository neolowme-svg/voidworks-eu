$ErrorActionPreference = "Stop"

$project = "C:\Users\neolo\Documents\dev\voidworks\voidworks-full"
$repoName = "voidworks-eu"
$repoFull = "neolowme-svg/$repoName"

Set-Location $project

# Git installeren indien nodig
if (!(Get-Command git -ErrorAction SilentlyContinue)) {
    winget install --id Git.Git -e --source winget --accept-source-agreements --accept-package-agreements
    $env:Path += ";C:\Program Files\Git\cmd"
}

# GitHub CLI installeren indien nodig
if (!(Get-Command gh -ErrorAction SilentlyContinue)) {
    winget install --id GitHub.cli -e --source winget --accept-source-agreements --accept-package-agreements
    $env:Path += ";C:\Program Files\GitHub CLI"
}

gh auth status *> $null
if ($LASTEXITCODE -ne 0) {
    gh auth login --web --git-protocol https
}

if (!(Test-Path ".git")) {
    git init
    git branch -M main
}

git config user.name "neolowme-svg"
if (!(git config user.email)) {
    git config user.email "neolowme-svg@users.noreply.github.com"
}

git add .
git commit -m "Launch Voidworks website"
if ($LASTEXITCODE -ne 0) {
    Write-Host "Geen nieuwe commit nodig." -ForegroundColor Yellow
}

gh repo view $repoFull *> $null
if ($LASTEXITCODE -ne 0) {
    gh repo create $repoFull --public --source . --remote origin --push
} else {
    $origin = git remote get-url origin 2>$null
    if ($LASTEXITCODE -ne 0) {
        git remote add origin "https://github.com/$repoFull.git"
    } else {
        git remote set-url origin "https://github.com/$repoFull.git"
    }
    git push -u origin main
}

Write-Host "GitHub klaar: https://github.com/$repoFull" -ForegroundColor Green
