# Voidworks v11

Production Next.js/Supabase build for voidworks.eu.

## v11 fixes

- Registration no longer depends on the public profile/verification tables to create and email a verification code.
- Existing unfinished registrations can be resumed; the new 6-digit code is generated server-side and stored only as an HMAC hash in server-managed Supabase Auth app metadata.
- Login is handled through one server endpoint so wrong credentials, unverified email, Turnstile failure, rate limiting and temporary security-service failure get different messages.
- Turnstile verification no longer sends a potentially incorrect proxy IP to Siteverify and distinguishes a failed challenge from a service/configuration problem.
- Application sessions are signed HttpOnly cookies with a 7-day lifetime and no longer fail if the optional app_sessions table is missing.
- Dashboard no longer treats a missing profile row as a deleted Auth account.
- Dutch, English and German translation trees have the same keys; the accidentally German Dutch legal text has been replaced.
- Initial language is chosen from Vercel's IP-country header: NL -> Dutch, DE -> German, all other countries -> English. A saved language preference still overrides this when preference consent is enabled.
- Added /tos in addition to /terms.

## Required production environment variables

- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (or compatible public key variable)
- SUPABASE_SERVICE_ROLE_KEY (server only)
- APP_SECURITY_SECRET
- RESEND_API_KEY
- NEXT_PUBLIC_TURNSTILE_SITE_KEY
- TURNSTILE_SECRET_KEY
- ADMIN_EMAIL

Optional backup variables remain documented in `.env.example`.

## Install

Copy this complete folder over the existing project while preserving `.git`, `.vercel`, `.env.local` and `node_modules`, then run `INSTALL-V11.ps1`, or use the PowerShell commands supplied with the ZIP.
