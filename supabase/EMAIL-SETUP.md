# Voidworks v9 e-mail setup

V9 gebruikt voor registratie een eigen server-side 6-cijferige code. De Supabase OTP-lengte bepaalt deze code dus niet meer.

## Verplicht
1. Resend -> Domains -> `voidworks.eu` moet Verified zijn.
2. Maak/gebruik een Resend API key.
3. Vercel -> voidworks-eu -> Settings -> Environment Variables:
   - `RESEND_API_KEY` = jouw Resend API key
   - `APP_SECURITY_SECRET` = een lange willekeurige server-only secret
4. Redeploy.

De registratie-mail wordt direct via Resend verstuurd als:
`Voidworks <no-reply@voidworks.eu>`

De registratiecode is altijd exact 6 cijfers en verloopt na 10 minuten. Alleen een HMAC-hash van de code wordt in de database opgeslagen.

## Supabase
Run `supabase/schema.sql` volledig in Supabase -> SQL Editor.

Bestaande bevestigde Supabase-gebruikers blijven geldig. Nieuwe v9-accounts worden pas bevestigd nadat de eigen 6-cijferige Voidworks-code is ingevoerd.

## Oud e-mailadres
Als `Authentication -> Users` de gebruiker nog bevat, is het adres nog geregistreerd. V9 toont dan alleen de normale melding dat het e-mailadres al geregistreerd is. Gebruik Dashboard -> Account verwijderen of verwijder de Auth-user handmatig om hetzelfde adres opnieuw te registreren.
