# Voidworks v6

Complete productieversie van voidworks.eu.

## In deze ZIP
- Extra donkere Voidworks UI, geïnspireerd door de compacte zwart/paars uitstraling uit de aangeleverde Voidbot-referentie.
- Homepage, projecten, diensten, werkwijze, contact en footer.
- Losse `/login` pagina.
- Losse `/register` pagina.
- Registratie opent direct een modal met 6 losse vakken voor de e-mailcode.
- OTP plakken werkt ook.
- Nieuwe code opnieuw versturen vanuit de modal.
- Beveiligd `/dashboard` via server-side Supabase sessiecontrole.
- Wachtwoord reset.
- Supabase database schema.
- Voidworks HTML e-mailtemplate met `{{ .Token }}`, logo en no-reply tekst.
- Vercel Next.js configuratie.

## Installeren over je bestaande repo
Pak de ZIP uit en kopieer alles over:

`C:\Users\neolo\Documents\dev\voidworks\voidworks-full`

Laat je bestaande `.git`, `.vercel` en `.env.local` staan.

Daarna:

```powershell
npm install
npm run build
git add .
git commit -m "Voidworks v6 dark redesign and OTP verification"
git push origin main
$vercel = "$env:APPDATA\npm\vercel.cmd"
& $vercel deploy --prod
```

Lees `supabase/EMAIL-SETUP.md` als de verificatiecode niet aankomt.
