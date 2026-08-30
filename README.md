# Voidworks v10

Production Next.js/Supabase version for voidworks.eu.

## Main fixes in v10
- Login/register flow repaired.
- Turnstile no longer reuses one-time tokens after a failed attempt.
- Submit buttons wait until the security challenge is ready.
- Email verification is always exactly six digits.
- Verification confirms Supabase Auth before finishing the Voidworks profile state.
- Duplicate registration shows only the localized "email already registered" message.
- Orphaned Auth users caused by deleting the application profile can re-register safely.
- NL/EN/DE error/status text is complete for the auth flow.
- Terms of Service is a separate `/terms` page; privacy, cookies and accessibility have separate pages too.
- Cookie consent actually controls whether language/theme preferences are persisted.
- Text/readability increased throughout the site.
- Security headers, rate limiting, CSRF/origin controls, seven-day app sessions and 15-minute one-time password resets remain enabled.
- Automated private `.sql` database backup every 12 hours, seven-day retention, plus admin create/download/delete.

## Required Vercel environment variables
- `RESEND_API_KEY`
- `APP_SECURITY_SECRET`
- `NEXT_PUBLIC_TURNSTILE_SITE_KEY`
- `TURNSTILE_SECRET_KEY`
- `ADMIN_EMAIL=neolowme@gmail.com`
- Existing Supabase variables from the Vercel integration
- `GITHUB_BACKUP_TOKEN` only for the admin "create backup" button

## Database
Run `supabase/schema.sql` in Supabase SQL Editor if the v9 schema has not already been applied. It is idempotent.

## GitHub Actions backup secrets
Repository -> Settings -> Secrets and variables -> Actions:
- `POSTGRES_URL_NON_POOLING`
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

## Turnstile
Production widget hostnames:
- `voidworks.eu`
- `www.voidworks.eu`

The website validates Turnstile server-side and renders a fresh challenge after each validation attempt.

## Legal note
The included privacy/terms/cookie/accessibility pages are a practical GDPR-oriented baseline, not a substitute for legal review for your exact business structure, contracts and jurisdiction.
