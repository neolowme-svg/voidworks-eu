# Voidworks — 6-cijferige verificatiecode

## 1. Resend
- Resend -> Domains -> `voidworks.eu` moet **Verified** zijn.
- SPF/DKIM records blijven in Cloudflare staan zoals Resend ze opgeeft.

## 2. Supabase Custom SMTP
Supabase -> Authentication -> Emails / SMTP Settings:
- Custom SMTP: **ON**
- Sender name: `Voidworks`
- Sender email: `no-reply@voidworks.eu`
- Host: `smtp.resend.com`
- Port: `465` (SSL) of `587` (STARTTLS)
- Username: `resend`
- Password: jouw Resend API key

## 3. Exact 6 cijfers instellen
Supabase -> Authentication -> Sign In / Providers -> Email:
- Email provider: **ON**
- Confirm email: **ON**
- **Email OTP length: 6**
- Email OTP expiration: bijvoorbeeld `3600` seconden

Dit is verplicht. Alleen de tekst in de mailtemplate op "6 cijfers" zetten verandert de echte OTP-lengte niet.

## 4. Confirm signup template
Supabase -> Authentication -> Email Templates -> Confirm signup:
- Subject: `Je Voidworks verificatiecode`
- Body: plak ALLES uit `supabase/email-confirmation.html`
- `{{ .Token }}` moet letterlijk in de template blijven staan.

## 5. URL Configuration
Supabase -> Authentication -> URL Configuration:
- Site URL: `https://voidworks.eu`
- Redirect URLs:
  - `https://voidworks.eu/auth/callback`
  - `https://www.voidworks.eu/auth/callback`
  - `http://localhost:3000/auth/callback`

## 6. Oud e-mailadres opnieuw gebruiken
Verwijder niet alleen een rij uit `public.profiles`. Het echte login-account staat in `auth.users`.

V8 heeft daarom in Dashboard -> Account een knop **Account verwijderen**. Die verwijdert via de server het echte Supabase Auth-account. Daarna kan hetzelfde e-mailadres opnieuw registreren en krijgt het opnieuw een verificatiemail.

Handmatig kan ook via Supabase -> Authentication -> Users -> Delete user.

## 7. Mail komt niet aan
- Kijk direct in Resend -> Logs.
- Geen log: Supabase SMTP-config controleren.
- Delivered: spam/ongewenst controleren.
- Failed/Bounced: open de Resend foutmelding.
- Wacht minimaal 60 seconden tussen nieuwe signup/verificatie-mails.
