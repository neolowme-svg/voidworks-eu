# Voidworks v13

Production Next.js + Supabase build for `voidworks.eu`.

## What changed in v13

- Real Voidworks PNG logo/mark everywhere; no fake `V` marks and no AVIF branding assets.
- Pricing page now shows only the project packages. Choosing a package opens a custom Voidworks modal for compatible extras.
- The selected package continues to `/project-request/[package]` with a full project intake form.
- Project request asks for requester name/email, company name, company description, site type, requirements and optional style guide/inspiration.
- Request pricing is recalculated server-side; the browser cannot set its own total.
- Every project request is stored in Supabase and emails both the requester and the configured admin address.
- Requests automatically link to the account that uses the same verified email address.
- Dashboard contains real project cards, project details and a project conversation.
- Admin dashboard contains users, project requests, request details, statuses, messages and backups.
- Admin replies are stored on the website and mailed to the client.
- Optional Resend Inbound webhook support lets replies sent from the configured admin mailbox be imported into the project conversation and relayed to the client.
- Account Settings includes profile/username, password change and account deletion.
- Profile/password/delete actions require a fresh one-time six-digit email code that expires after 15 minutes.
- Forgot password is now `/forgot-password` and uses a six-digit one-time code valid for 15 minutes.
- App sessions are stored server-side and backed by a seven-day Secure HttpOnly SameSite cookie.
- Cookie consent is server-initialized and persisted, preventing the banner from flashing back after a saved choice.
- NL/EN/DE, light/dark theme, legal pages, Discord and previous security controls remain included.

## Required Vercel environment variables

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
SUPABASE_SERVICE_ROLE_KEY   # or SUPABASE_SECRET_KEY
APP_SECURITY_SECRET
RESEND_API_KEY
NEXT_PUBLIC_TURNSTILE_SITE_KEY
TURNSTILE_SECRET_KEY
ADMIN_EMAIL=neolowme@gmail.com
```

For email reply sync, also add:

```text
RESEND_INBOUND_DOMAIN=reply.voidworks.eu
RESEND_WEBHOOK_SECRET=whsec_...
```

Optional:

```text
TURNSTILE_HOSTNAMES=voidworks.eu,www.voidworks.eu
GITHUB_BACKUP_TOKEN=
GITHUB_REPOSITORY=neolowme-svg/voidworks-eu
```

## Database migration

Run the complete `supabase/schema.sql` in **Supabase → SQL Editor**. It is written as an idempotent migration and adds the v13 project, message, account-code, app-session and webhook tables/RPCs.

## Resend inbound reply sync

This part needs one external Resend setup; the application code is already included.

1. In Resend, enable **Receiving** for either a Resend managed receiving domain or a custom receiving subdomain such as `reply.voidworks.eu`.
2. If you use a custom subdomain, copy the exact MX/DNS records Resend gives you into Cloudflare DNS. Keep Cloudflare as your DNS provider.
3. Set `RESEND_INBOUND_DOMAIN` in Vercel to the receiving domain only, for example `reply.voidworks.eu`.
4. In **Resend → Webhooks**, add endpoint `https://voidworks.eu/api/webhooks/resend/inbound` and subscribe to `email.received`.
5. Copy that webhook's signing secret to Vercel as `RESEND_WEBHOOK_SECRET`.
6. Redeploy Production.

Project emails use a reply address like `project+<project-id>@<RESEND_INBOUND_DOMAIN>`. When `neolowme@gmail.com` replies to that thread, the webhook stores the reply in the project conversation and sends it to the project requester.

## Build

On the existing Windows setup use `npm.cmd`, because PowerShell may block `npm.ps1`:

```powershell
$npm = "C:\Program Files\nodejs\npm.cmd"
& $npm install
& $npm run typecheck
& $npm run build
```
