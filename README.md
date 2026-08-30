# Voidworks

Statische website voor **voidworks.eu** en **www.voidworks.eu**.

## v2 wijzigingen

- Neon/glow/orbit-effecten verwijderd.
- Rustigere donkerblauwe bureau/tech-stijl.
- Solid paarse CTA's in plaats van neon gradients.
- Hero, diensten, projecten, proces, FAQ en contact opnieuw ontworpen.
- Nieuwe `/login.html`.
- Login + registratie tabs.
- Wachtwoord tonen/verbergen.
- Live password-strength indicator.
- Checks voor lengte, hoofdletter, kleine letter, cijfer, speciaal teken en spaties.
- Wachtwoordbevestiging en frontend form-validatie.

## Belangrijk over login

De loginpagina is **frontend-only**. Er worden geen wachtwoorden verstuurd of opgeslagen. Voor een echte klantomgeving moet er een backend/authentication-provider aan worden gekoppeld.

Gebruik nooit localStorage als echte login-oplossing en zet geen geheime API keys in frontend JavaScript.

## Structuur

- `index.html`
- `login.html`
- `styles.css`
- `script.js`
- `login.js`
- `assets/`
- `vercel.json`

## Contact

Het contactformulier opent `info@voidworks.eu` in het e-mailprogramma van de bezoeker.
