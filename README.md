# Voidworks production v8

Volledige Next.js + Supabase productieversie.

## Nieuw in v8
- Donkere Voidworks-stijl behouden, maar login/auth tekst beter leesbaar.
- Licht thema met witte achtergrond, donkere tekst en dezelfde paarse knoppen.
- Nederlands, Engels en Duits met custom taalmenu en vlaggen.
- Alle logo-assets blijven PNG; Next Image optimalisatie/transcoding staat uit.
- Discord-knop bovenaan en in footer: https://discord.gg/SBtnUvrzg6
- Exact 6 OTP-invoervakken in registratie-popup.
- Password strength met kleuren + ontbrekende eisen.
- Correcte account-verwijdering uit Supabase Auth zodat hetzelfde e-mailadres opnieuw kan registreren.
- Custom dropdown voor "Waar gaat het om?"; geen browser-native selectmenu.
- Prijzen: Landing €200, Volledige website €350, Webshop €425, Webplatform + API €500.
- Admin panel los toe te voegen aan Landing/Website/Webshop; altijd inbegrepen bij Webplatform.
- Pakketafhankelijke opties voor hosting, onderhoud, VIP support, CMS, priority, extra API, SEO, extra taal en copywriting.
- Tekst over AI-ondersteunde workflow en normale oplevering binnen 2–4 werkdagen.

## Eerst Supabase 6-digit OTP goed zetten
Lees `supabase/EMAIL-SETUP.md` en zet in Supabase bij Email **Email OTP length = 6**.

## Installeren over bestaand project
Gebruik `INSTALL-V8.ps1` of kopieer de inhoud van deze map over je bestaande project.
