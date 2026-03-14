# PostPilot — Project memory / handoff

## SecretSauce & business-logic protection (must)

- **Sensitive logic**: Plan limits (brandsLimit, postsPerMonth), pricing (Free/Pro $29/Agency $79), LemonSqueezy variant IDs, API keys (env), encryption key.
- **Current state**: API keys and variant IDs are server-only (env). Plan definitions and limits live in `src/lib/payments.ts` (server) but are **duplicated on the client** in `src/app/billing/page.tsx` (PLANS array with prices and feature text). Enforcement is server-side via `getPlanLimits()` in API routes.
- **Before release**: Run SecretSauce once: `npx @royea/secret-sauce analyze ./src` (or from repo root). Apply recommended protection levels. Prefer moving plan display (names, prices, limits) to a server config endpoint so the client does not hardcode pricing/limits; keep all enforcement in API (brands, publish, billing).
- **Keep server-side only**: LEMONSQUEEZY_* env, ANTHROPIC_API_KEY, ENCRYPTION_KEY, LEMONSQUEEZY_WEBHOOK_SECRET. Never expose variant IDs or real limits in client bundle for abuse (e.g. bypassing paywall logic).
