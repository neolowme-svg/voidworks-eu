# Voidworks v13 security notes

The project uses layered hardening. No application can honestly guarantee that every possible vulnerability is impossible, but v13 includes practical controls for the main web risks.

Implemented controls:

- HTTPS/HSTS and restrictive response security headers.
- React escaping for rendered user content; no direct HTML rendering of project messages.
- Supabase query APIs instead of SQL string concatenation for browser input.
- Row Level Security on user-facing Supabase tables.
- Service-role, Resend, Turnstile, backup and webhook secrets remain server-only.
- Same-origin validation on state-changing application routes.
- CSRF tokens on authenticated account, project-message and admin actions.
- Cloudflare Turnstile on login, registration, password recovery, contact and project requests.
- Single-use Turnstile token handling and server-side rate limiting.
- Server-side pricing calculation for project requests.
- Six-digit verification/action/reset codes are stored as HMAC hashes, expire after 15 minutes and are attempt-limited.
- Passwords are stored/hashed by Supabase Auth, not by the Voidworks application database.
- Seven-day application sessions use random tokens; only token hashes are stored in the database and the browser token is Secure + HttpOnly + SameSite=Lax.
- Account deletion, password change and profile change require an emailed one-time code.
- Admin authorization is checked server-side using the authenticated Supabase user email and `ADMIN_EMAIL`; changing client-side state cannot grant admin access.
- Resend inbound webhook signatures are verified before email replies are accepted, and received event IDs are deduplicated.
- Inbound project email is accepted only from the configured admin address or the matching project requester address.
- Server fetch destinations are fixed to required providers, reducing SSRF exposure.
- Application logs intentionally do not log passwords, raw verification/action codes, session tokens or secret values.
- Automated SQL backups remain private, with the existing 12-hour schedule and seven-day retention workflow; admin UI provides manual backup controls when configured.
