# Voidworks v10 e-mail setup

V10 gebruikt een eigen server-side verificatiecode via Resend. De registratiecode is daarom altijd exact **6 cijfers** en is niet afhankelijk van Supabase's ingebouwde OTP-lengte.

## Verplicht
1. Resend -> Domains -> `voidworks.eu` moet `Verified` zijn.
2. Vercel -> `voidworks-eu` -> Settings -> Environment Variables:
   - `RESEND_API_KEY`
   - `APP_SECURITY_SECRET`
   - `NEXT_PUBLIC_TURNSTILE_SITE_KEY`
   - `TURNSTILE_SECRET_KEY`
   - `ADMIN_EMAIL=neolowme@gmail.com`
3. De bestaande Supabase environment variables moeten aanwezig blijven.
4. Redeploy na wijzigingen aan environment variables.

Registratiemail:
`Voidworks <no-reply@voidworks.eu>`

De 6-cijferige code verloopt na 10 minuten. Alleen een HMAC-hash van de code wordt opgeslagen.

## Database
Run `supabase/schema.sql` volledig in Supabase -> SQL Editor als de v9/v10 migratie nog niet is uitgevoerd. Het script is idempotent.

## Bestaand / verwijderd e-mailadres
- Bestaat het Auth-account én het Voidworks-profiel nog, dan toont registratie alleen: `Dit e-mailadres is al geregistreerd.`
- Is alleen het profiel verwijderd en bestaat er nog een verweesd Supabase Auth-record, dan verwijdert v10 dat verweesde record tijdens een nieuwe registratie en maakt het account opnieuw aan.
- Dashboard -> Account verwijderen verwijdert het echte Supabase Auth-account en gekoppelde applicatiegegevens.
