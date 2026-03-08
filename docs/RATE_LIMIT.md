# Rate limiting — add to new public APIs

Any **public** or **server-to-server** route that doesn’t require a logged-in user should be rate-limited to avoid abuse.

## Pattern (already used in this repo)

1. **Define a limiter** in `src/lib/rate-limit.ts`:

   ```ts
   import { RateLimiterMemory } from 'rate-limiter-flexible';

   export const myRouteLimiter = new RateLimiterMemory({
     points: 30,        // requests
     duration: 15 * 60, // per 15 minutes, per IP
     keyPrefix: 'my-route',
   });
   ```

2. **Apply in the route** before handling the request:

   ```ts
   import { myRouteLimiter, applyRateLimit } from '@/lib/rate-limit';

   export async function POST(req: NextRequest) {
     const rateLimitResponse = await applyRateLimit(myRouteLimiter, req);
     if (rateLimitResponse) return rateLimitResponse;
     // ... rest of handler
   }
   ```

3. **Dependency:** `rate-limiter-flexible` is already in `package.json`.

## Existing usage

- **`/api/ftable/caption`** — `ftableCaptionLimiter`: 30 req / 15 min per IP.

## Reference

- KeyDrop uses the same pattern: `src/lib/rate-limit.ts` + `applyRateLimit(limiter, req)` on auth/validate/submit routes. Copy that pattern for new public endpoints (webhooks, magic-link callbacks, etc.).
