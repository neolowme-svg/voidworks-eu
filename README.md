# Voidworks

Production-ready statische website voor **voidworks.eu** en **www.voidworks.eu**.

## Projectstructuur

- `index.html` — website
- `styles.css` — styling
- `script.js` — mobiele navigatie, animaties, FAQ en contactformulier
- `assets/voidworks-wordmark.png` — logo met tekst
- `assets/voidworks-mark.png` — los beeldmerk
- `assets/favicon.png` — favicon
- `assets/projects/` — projectlogo's

## Domeinen

De website gebruikt `https://voidworks.eu/` als canonical domein. Wanneer `www.voidworks.eu` ook aan hetzelfde Vercel-project is gekoppeld, stuurt de frontend `www` door naar het hoofddomein.

Voor een volledige server-side redirect kun je dit ook in Vercel Dashboard instellen bij **Project → Settings → Domains**.

## Contactmail

Het contactformulier opent standaard `info@voidworks.eu`. Pas dit in `script.js` aan als je een ander e-mailadres wilt gebruiken.
