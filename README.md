# Voidworks production v9

Complete Next.js 15.5.24 + Supabase productieversie.

## In v9
- Donker/licht thema en NL/EN/DE met PNG-vlaggen.
- Grotere, beter leesbare tekst in navbar, login, pricing, processen en footer.
- Losse `/login` en `/register`.
- Eigen exact 6-cijferige e-mailverificatie via Resend met branded Voidworks-mail.
- Simpele gelokaliseerde melding voor bestaande e-mailadressen.
- Oude geldige Supabase-accounts kunnen blijven inloggen; ontbrekende profiles worden veilig hersteld.
- Password strength met kleuren en ontbrekende eisen.
- Password reset: random one-time token, 15 minuten geldig, token alleen in URL-fragment en alleen als HMAC in de database.
- Extra app-sessie met Secure HttpOnly cookie, maximaal 7 dagen.
- Rate limiting, same-origin controles, CSRF op gevoelige account/admin-acties, optionele Cloudflare Turnstile, honeypots en timingchecks.
- RLS + server-only writes voor verificatie/securitytabellen.
- CSP, HSTS, anti-clickjacking, nosniff en Permissions-Policy.
- Admin uitsluitend server-side op exact `neolowme@gmail.com` (of server-only `ADMIN_EMAIL`).
- Admin databaseback-ups: automatisch elke 12 uur, private `.sql`, 7 dagen retentie, handmatig starten/downloaden/verwijderen.
- GDPR/AVG Privacy Policy, Terms of Service, Cookie Policy, consent UI en Accessibility-pagina.
- Google robots/sitemap basis en uitleg van het opleverproces.
- Prijzen/configurator met pakketafhankelijke add-ons.

## Eenmalig na installatie
1. Run `supabase/schema.sql` volledig in Supabase SQL Editor.
2. Vercel server envs toevoegen:
   - `RESEND_API_KEY`
   - `APP_SECURITY_SECRET`
   - optioneel/aanbevolen voor bot protection: `NEXT_PUBLIC_TURNSTILE_SITE_KEY` + `TURNSTILE_SECRET_KEY`
   - voor handmatig backup starten: `GITHUB_BACKUP_TOKEN`
3. GitHub repo -> Settings -> Secrets and variables -> Actions:
   - `POSTGRES_URL_NON_POOLING`
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
4. Voor de Vercel backup-knop heeft `GITHUB_BACKUP_TOKEN` alleen Actions write nodig voor repo `neolowme-svg/voidworks-eu`.

Zie `supabase/EMAIL-SETUP.md` voor de 6-cijferige mailflow.

## Opmerking beveiliging
De code bevat defense-in-depth voor de relevante OWASP-risico's, maar geen enkele website kan eerlijk garanderen dat iedere toekomstige kwetsbaarheid onmogelijk is. Houd Next.js/Supabase dependencies en platforminstellingen actueel.
