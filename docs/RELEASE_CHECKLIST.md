# PostPilot — Release checklist

**Done:** Hebrew first, deploy doc, .env.example (all vars including LemonSqueezy), caption API + ftable key doc. Auth, billing API, webhook stub in place.

- [ ] **Set production env** — Vercel (or host): all vars from `.env.example`. LemonSqueezy webhook URL: `https://your-domain.com/api/billing/webhook`.
- [ ] **Database** — Production: switch to Postgres, `prisma migrate deploy`. See DEPLOY.md.
- [ ] **OAuth (optional)** — Instagram/Meta: set `INSTAGRAM_CLIENT_ID`, `INSTAGRAM_CLIENT_SECRET`; add redirect URI. Deploy and test connect.
- [ ] **Smoke-test** — Register, login, create brand, upload, generate caption, verify ftable caption API per VERIFY_CAPTION_API.md.
