# Voidworks email setup

Outgoing application emails are sent through the Resend API using `RESEND_API_KEY` and the sender:

`Voidworks <no-reply@voidworks.eu>`

The app generates its own exact six-digit verification/security/reset codes. Codes expire after 15 minutes and only HMAC hashes are stored.

## Outgoing mail

Verify `voidworks.eu` in Resend and keep the required Resend DNS records in Cloudflare. Put the current Resend API key in Vercel as `RESEND_API_KEY`.

## Reply-to-project sync

To make replies from the admin mailbox also appear inside the Voidworks project conversation:

1. Enable Resend Receiving on a managed receiving domain or on `reply.voidworks.eu`.
2. Add the exact receiving DNS/MX records shown by Resend to Cloudflare.
3. Add `RESEND_INBOUND_DOMAIN=reply.voidworks.eu` (or the managed Resend receiving domain) to Vercel.
4. Add a Resend webhook for `email.received` pointing to `https://voidworks.eu/api/webhooks/resend/inbound`.
5. Put its signing secret in Vercel as `RESEND_WEBHOOK_SECRET`.
6. Redeploy.
