# Voidworks — production v3

Deze versie is omgebouwd van statische HTML naar **Next.js 16 + Supabase Auth**.

## Wat zit erin

- Rustige dark-navy Voidworks stijl zonder neon/glow.
- Afgeronde cards, screenshots, formulieren en footer.
- Flexwrap- en Fentex-homepage screenshots in het portfolio.
- Animaties bij scroll, hover, knoppen en routewissels.
- Zelfde navbar + footer op home, login, reset en dashboard.
- Supabase login.
- Supabase registratie met e-mailbevestiging.
- Wachtwoordsterkte-indicator.
- Wachtwoord vergeten + reset flow.
- Beveiligde `/dashboard`.
- `profiles`, `client_projects` en `contact_requests` tabellen.
- Row Level Security voor klantgegevens.
- Contactformulier schrijft server-side naar Supabase.
- Security headers.
- Geen service-role key in client code.

## Supabase project

Project ID: `jiocyearbxybzalnmxcv`

De Vercel Supabase integration levert al environment variables. De code ondersteunt de Vercel-namen:

- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY` of `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` of `SUPABASE_SECRET_KEY`

De publishable key wordt tijdens de Next.js build veilig als public browser key beschikbaar gemaakt. De service-role/secret key blijft alleen server-side.

## 1. Database schema uitvoeren

Open:

Supabase -> SQL Editor -> New query

Plak de volledige inhoud van:

`supabase/schema.sql`

en voer hem één keer uit.

## 2. Auth URL's instellen in Supabase

Ga naar:

Authentication -> URL Configuration

Zet:

Site URL:
`https://voidworks.eu`

Redirect URLs:
`https://voidworks.eu/auth/callback`
`https://www.voidworks.eu/auth/callback`
`http://localhost:3000/auth/callback`

## 3. Lokaal env ophalen

Omdat het Vercel-project al gekoppeld is:

```powershell
cd "C:\Users\neolo\Documents\dev\voidworks\voidworks-full"
$vercel = "$env:APPDATA\npm\vercel.cmd"
& $vercel env pull .env.local
```

## 4. Installeren

```powershell
npm install
npm run typecheck
npm run build
```

## 5. Deployen

```powershell
git add .
git commit -m "Upgrade Voidworks to Next.js and Supabase"
git push origin main

$vercel = "$env:APPDATA\npm\vercel.cmd"
& $vercel deploy --prod
```

## Clientproject aan een account koppelen

Na registratie staat de user in Supabase onder Authentication -> Users.

Gebruik daarna SQL, waarbij je de UUID van de user invult:

```sql
insert into public.client_projects
  (client_id, name, status, description, live_url)
values
  (
    'USER_UUID_HIER',
    'Voorbeeldproject',
    'In ontwikkeling',
    'Homepage en klantomgeving worden gebouwd.',
    null
  );
```

Door RLS ziet iedere ingelogde klant alleen projecten met zijn eigen `client_id`.
