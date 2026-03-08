# PostPilot — Deploy to production

## 1. Host (e.g. Vercel)

- Connect the repo to Vercel (or your host).
- Set **all** env vars from `.env.example` in the project’s Environment Variables. Use **Production** (and optionally Preview).
- Set `NEXT_PUBLIC_APP_URL` to your production URL (e.g. `https://postpilot-app-nine.vercel.app`) with no trailing slash so checkout redirects and OAuth callbacks use the correct domain.
- For **LemonSqueezy**: set `LEMONSQUEEZY_API_KEY`, `LEMONSQUEEZY_STORE_ID`, `LEMONSQUEEZY_PRO_VARIANT_ID`, `LEMONSQUEEZY_AGENCY_VARIANT_ID`, `LEMONSQUEEZY_WEBHOOK_SECRET` (webhook URL: `https://your-domain.com/api/billing/webhook`).
- For **ftable caption API**: set `POSTPILOT_FTABLE_API_KEY`; use the same value as `POSTPILOT_API_KEY` in ftable’s Supabase Edge secrets.

## 2. Database

- **Local:** SQLite (`DATABASE_URL="file:./postpilot.db"`).
- **Production:** Prefer Postgres (Neon, Supabase, Vercel Postgres). In Prisma set `provider = "postgresql"` and `DATABASE_URL` to the Postgres URL. Run `prisma migrate deploy` in the build or release step.

## 3. Instagram / Meta OAuth (optional)

- Create an app at [Meta for Developers](https://developers.facebook.com/apps/).
- Set `INSTAGRAM_CLIENT_ID` and `INSTAGRAM_CLIENT_SECRET` (or the app’s Client ID and Client Secret). Add redirect URI for your domain.
- Deploy and test the connect flow.

## 4. After deploy

- Open your app URL and test: register → login → create brand → upload media → generate captions.
- Run the caption API check: `docs/VERIFY_CAPTION_API.md`.
