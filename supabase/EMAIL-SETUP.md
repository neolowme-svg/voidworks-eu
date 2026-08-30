# Voidworks verificatiecode per e-mail

## 1. Resend
- Resend -> Domains -> `voidworks.eu` moet **Verified** zijn.
- Controleer dat SPF/DKIM records in Cloudflare staan zoals Resend ze opgeeft.

## 2. Supabase Custom SMTP
Supabase -> Authentication -> Emails / SMTP Settings:

- Custom SMTP: **ON**
- Sender name: `Voidworks`
- Sender email: `no-reply@voidworks.eu`
- Host: `smtp.resend.com`
- Port: `465` (SSL) of `587` (STARTTLS)
- Username: `resend`
- Password: jouw Resend API key

## 3. Email provider
Supabase -> Authentication -> Providers -> Email:

- Enable Email provider: **ON**
- Confirm email: **ON**

## 4. Confirm signup template
Supabase -> Authentication -> Email Templates -> Confirm signup:

- Subject: `Je Voidworks verificatiecode`
- Body: plak ALLES uit `supabase/email-confirmation.html`
- Controleer dat `{{ .Token }}` letterlijk in de template staat.

## 5. URL Configuration
Supabase -> Authentication -> URL Configuration:

- Site URL: `https://voidworks.eu`
- Redirect URLs:
  - `https://voidworks.eu/auth/callback`
  - `https://www.voidworks.eu/auth/callback`
  - `http://localhost:3000/auth/callback`

## 6. Als de code nog steeds niet aankomt
1. Registreer met een NIEUW e-mailadres, of verwijder eerst de oude test-user in Supabase -> Authentication -> Users.
2. Kijk direct in Resend -> Logs.
3. Geen Resend-log = Supabase gebruikt je custom SMTP niet. Controleer stap 2.
4. `Delivered` = check spam/ongewenst.
5. `Failed`/`Bounced` = open de log en fix de fout die Resend meldt.
6. Gebruik in de template `{{ .Token }}` en niet alleen `{{ .ConfirmationURL }}`.

De frontend opent na `Account maken` automatisch de verificatie-popup en controleert de 6-cijferige OTP met Supabase `verifyOtp`.
