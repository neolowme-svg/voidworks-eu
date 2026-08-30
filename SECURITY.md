# Voidworks security notes

V10 includes layered hardening, but no web application can truthfully guarantee immunity from every OWASP-class issue.

Implemented controls include:
- HTTPS/HSTS and restrictive security headers.
- React output escaping and no `dangerouslySetInnerHTML` for user content.
- Supabase query APIs instead of concatenated SQL for user input.
- Supabase RLS for user-facing tables.
- Server-only service-role, Resend, Turnstile and GitHub secrets.
- Same-origin checks on state-changing routes.
- CSRF tokens for authenticated destructive/admin actions.
- Cloudflare Turnstile on login, registration, password-reset requests and public contact forms.
- Turnstile tokens are reset after every server validation so single-use tokens are never reused.
- Database-backed atomic rate limiting with hashed identifiers.
- Honeypot fields on public forms.
- Exact six-digit email verification codes; only HMAC hashes are stored.
- Passwords handled by Supabase Auth rather than stored by the Voidworks application.
- One-time password reset tokens with a 15-minute expiry; only token hashes are stored.
- Seven-day application sessions in Secure HttpOnly SameSite cookies.
- Server-side admin authorization based on `ADMIN_EMAIL`; the client receives only a boolean result.
- External server fetches use fixed destinations, reducing SSRF surface.
- Safe protocol validation before rendering project URLs.
- No application logging of passwords, verification codes, reset tokens or service secrets.
- Private SQL backups every 12 hours with seven-day retention and manual create/download/delete controls.
