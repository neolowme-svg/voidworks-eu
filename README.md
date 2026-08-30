# Voidworks v12

Production Next.js/Supabase build for voidworks.eu.

## v12 fixes

- Rebuilt registration flow so new accounts no longer depend on a pre-existing Auth user lookup.
- New accounts always use a server-generated 6-digit Voidworks verification code.
- Verification state prefers the private `email_verification_codes` table and safely falls back to Supabase Auth `app_metadata` if that table is unavailable.
- Login no longer uses honeypot/form-age checks that could cause false “check your details” errors.
- Turnstile now uses separate actions for login, register, reset and contact, with one fresh token per attempt.
- Double-submit protection prevents one Turnstile token from being consumed twice.
- Wrong credentials return only the credential error; Turnstile errors are returned only when Turnstile validation actually fails.
- Same-origin checking now works correctly behind Vercel/custom domains.
- Added a visible Home link to desktop and mobile navigation.
- Home section links use full `/#...` navigation and homepage content is never hidden behind a failed reveal animation.
- User-selected language persists through navigation with a functional `vw_locale` cookie; IP country is only used as the first default.
- NL -> Dutch, DE -> German, all other countries -> English when no language has been chosen.
- Dutch, English and German translation trees have matching keys.
- Password reset uses the same corrected Turnstile flow.

## Required production environment variables

- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
- SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SECRET_KEY
- APP_SECURITY_SECRET
- RESEND_API_KEY
- NEXT_PUBLIC_TURNSTILE_SITE_KEY
- TURNSTILE_SECRET_KEY
- ADMIN_EMAIL

Optional:
- TURNSTILE_HOSTNAMES=voidworks.eu,www.voidworks.eu
- GITHUB_BACKUP_TOKEN
- GITHUB_REPOSITORY=neolowme-svg/voidworks-eu

## Database

`supabase/schema.sql` remains idempotent. Running the complete file again is safe and makes sure the verification/reset/rate-limit tables exist.
