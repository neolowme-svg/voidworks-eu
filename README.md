# Voidworks v14

Production Next.js + Supabase build for voidworks.eu.

## v14 changes

- Pricing package buttons are readable in both themes and vertically centered.
- Package options open in a real viewport modal using a React portal; no manual scrolling to find it.
- Extra language is €5 for every package.
- Login now includes **Remember me**. Enabled = 7-day app session; disabled = browser-session cookie.
- After successful registration + 6-digit email verification, the user is sent to `/login` with the email prefilled.
- Account settings were redesigned and cleaned up.
- Password changes require current password + new password twice, include show/hide controls, reject reusing the same password, and invalidate old app sessions.
- Username uniqueness remains enforced server-side.
- Success/error feedback is explicit for profile/password changes.
- Mobile navigation is scrollable to the bottom on small screens.
- Home contact CTA can launch the same `/project-request/...` workflow used by pricing, including project storage/admin email handling.
- New UI copy added in Dutch, English and German.

## Required existing environment

Keep the same environment variables and Supabase schema from v13. This update does not require a new database migration.

## Install/update on Windows PowerShell

Use `npm.cmd` because some PowerShell execution policies block `npm.ps1`.

```powershell
$zip = "$HOME\Downloads\voidworks-production-v14.zip"
$project = "C:\Users\neolo\Documents\dev\voidworks\voidworks-full"
$tmp = "$env:TEMP\voidworks-v14"
$npm = "C:\Program Files\nodejs\npm.cmd"
$vercel = "$env:APPDATA\npm\vercel.cmd"

Remove-Item $tmp -Recurse -Force -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Path $tmp -Force | Out-Null
Expand-Archive -Path $zip -DestinationPath $tmp -Force

Get-ChildItem "$tmp\voidworks-production-v14" -Force |
Where-Object { $_.Name -notin @(".git", ".vercel", ".env.local", "node_modules", ".next") } |
ForEach-Object { Copy-Item $_.FullName -Destination $project -Recurse -Force }

cd $project
Remove-Item ".next" -Recurse -Force -ErrorAction SilentlyContinue
& $npm install
& $npm run typecheck
& $npm run build
```

Only deploy if typecheck and build both succeed.
