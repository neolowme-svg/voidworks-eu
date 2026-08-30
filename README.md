# Voidworks production v7

Complete Next.js + Supabase production build.

## In v7
- Donker Voidworks-design behouden
- `/login` en `/register`
- Registratie opent direct een 8-cijferige OTP-verificatiemodal
- OTP ondersteunt plakken, losse vakjes en opnieuw versturen
- Uitgebreide wachtwoordsterkte met kleurstatus en ontbrekende eisen
- Verwijderde/deactiveerde profielen kunnen niet blijven inloggen via oude sessies
- Dubbele login-knop op auth-pagina's opgelost
- Grotere stapnummers in Werkwijze
- Nieuwe interactieve Prijzen-sectie
- Pakketten: Landing page, Volledige website, Website + admin panel, Webplatform + API
- Extra opties: hosting, onderhoud, VIP support, extra admin panel, API-koppeling, CMS, SEO en priority delivery
- Prijskeuze wordt automatisch in het contactformulier gezet
- Voidworks e-mailtemplate aangepast voor 8-cijferige OTP

## Installeren over bestaand project
Pak alle bestanden uit over de root van je huidige Voidworks-project.

```powershell
npm install
npm run build
git add .
git commit -m "Voidworks v7 complete fixes and pricing"
git push origin main
$vercel = "$env:APPDATA\npm\vercel.cmd"
& $vercel deploy --prod
```

## Supabase e-mail
Gebruik `supabase/email-confirmation.html` als **Authentication -> Email Templates -> Confirm signup** template.
De template gebruikt `{{ .Token }}`.

## Account echt verwijderen
Voor volledige verwijdering: **Supabase -> Authentication -> Users -> Delete user**.
V7 blokkeert daarnaast ook login als alleen het gekoppelde `public.profiles` record ontbreekt.
