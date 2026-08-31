$ErrorActionPreference = "Stop"
$project = "C:\Users\neolo\Documents\dev\voidworks\voidworks-full"
$npm = "C:\Program Files\nodejs\npm.cmd"
$vercel = "$env:APPDATA\npm\vercel.cmd"
Set-Location $project
Remove-Item ".next" -Recurse -Force -ErrorAction SilentlyContinue
& $npm install
if ($LASTEXITCODE -ne 0) { throw "npm install failed" }
& $npm run typecheck
if ($LASTEXITCODE -ne 0) { throw "typecheck failed" }
& $npm run build
if ($LASTEXITCODE -ne 0) { throw "build failed" }
git add .
$changes = git status --porcelain
if ($changes) { git commit -m "Voidworks v14 UI account and project flow fixes" }
git push origin main
& $vercel deploy --prod
