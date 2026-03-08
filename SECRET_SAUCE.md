# SecretSauce — PostPilot

Security audit checklist: **keep sensitive logic server-side**. See [ZProjectManager/docs/SECRET_SAUCE_CHECKLIST.md](../../ZProjectManager/docs/SECRET_SAUCE_CHECKLIST.md) for the full checklist.

## Server-only (never in client)

- **LEMONSQUEEZY_***, **ANTHROPIC_API_KEY**, **ENCRYPTION_KEY**, **JWT_***, **POSTPILOT_FTABLE_API_KEY** → env only; never `NEXT_PUBLIC_*`.
- **Variant IDs** and **webhook secret** → env only; checkout and webhook validation in API only.
- **Rate-limit** config (points, duration) in `src/lib/rate-limit.ts` → only imported by API routes.
- **Plan limits** (brandsLimit, postsPerMonth) → enforced in API via `getPlanLimits()`; display comes from **GET /api/billing/plans** (no client hardcoding).

## Implemented

- **GET /api/billing/plans** — public endpoint returns plan display (name, price, features). Billing page fetches from it instead of hardcoding PLANS.
- **src/lib/payments.ts** — `getPlanDisplay()` is the single source of truth for UI; variant IDs stay in server env.

## Before release

- Run `npx @royea/secret-sauce analyze ./src` if available; else use the shared checklist.
- Ensure production env has all server-only vars; never commit `.env`.
