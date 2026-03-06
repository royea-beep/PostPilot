# PostPilot — AI Social Media Copilot

## What This Is
A Next.js web app where agencies create brands, send clients a magic link, and clients upload content, get AI-generated captions, and publish to social media. The AI learns each brand's posting style over time (Style DNA).

## Tech Stack
- **Next.js 16** (App Router, Turbopack)
- **Prisma 6** with SQLite
- **Tailwind CSS 4** (via @tailwindcss/postcss)
- **TypeScript** (strict mode)
- **Claude Haiku API** for caption generation (with fallback templates)
- **AES-256-GCM** for OAuth token encryption
- **JWT** with refresh token rotation

## Architecture
```
src/
  app/
    api/
      auth/login/         # POST — email/password login
      auth/register/      # POST — create agency account
      auth/refresh/       # POST — rotate token pair
      brands/             # GET (list) / POST (create)
      brands/public/      # GET — public brand info (for client page)
      brands/[id]/analyze/# POST — trigger Style DNA analysis
      drafts/             # POST — generate 3 AI caption options
      publish/            # POST — publish draft + auto-analyze style
      upload/             # POST — file upload (multipart, 100MB max)
    brand/[token]/        # Client-facing 5-step flow (upload -> format -> captions -> publish -> done)
    dashboard/            # Agency dashboard (brand cards, stats)
    login/                # Login page
    register/             # Registration page
    page.tsx              # Landing page
    layout.tsx            # Root layout with AuthProvider
    globals.css           # Tailwind + custom animations
  lib/
    ai-captions.ts        # Claude Haiku API call, fallback templates, Hebrew/English
    auth.ts               # JWT sign/verify, bcrypt hash/compare
    auth-context.tsx      # Client-side auth state, auto-refresh, authFetch with 401 retry
    auth-guard.ts         # withAuth HOF for API routes
    crypto.ts             # AES-256-GCM encrypt/decrypt for OAuth tokens
    db.ts                 # Prisma singleton
    rate-limit.ts         # In-memory per-IP rate limiter
    style-engine.ts       # Style DNA: analyzes posts for tone, emoji, hashtag patterns
    validation.ts         # Zod schemas
  proxy.ts                # Next.js 16 proxy (rate limiting on /api/*)
prisma/
  schema.prisma           # 10 models: User, RefreshToken, Brand, SocialConnection,
                          #   StyleProfile, MediaUpload, PostDraft, Post, AuditLog
```

## Database Models
- **User** — agency accounts (email, passwordHash, businessName)
- **RefreshToken** — JWT refresh tokens with revocation
- **Brand** — client brands with magic token for shareable links
- **SocialConnection** — encrypted OAuth tokens per platform
- **StyleProfile** — learned posting style (tone, emoji/hashtag patterns, samples)
- **MediaUpload** — uploaded photos/videos (stored in uploads/)
- **PostDraft** — AI-generated caption options (3 per upload)
- **Post** — published posts with platform response tracking
- **AuditLog** — action trail per brand

## Key Patterns
- Magic link access: clients use `/brand/{token}` without auth
- JWT auth: 15min access + 7d refresh, automatic rotation
- authFetch: client-side fetch wrapper that retries on 401
- Style DNA: auto-analyzes after each publish, improves AI captions
- Rate limiting: proxy.ts applies per-IP limits on all API routes
- File uploads: multipart FormData, type/size validation, stored locally
- AI fallback: works without ANTHROPIC_API_KEY using template captions
- Bilingual: Hebrew (RTL) + English throughout client pages

## Security
- Passwords: bcrypt with cost 12
- Tokens: AES-256-GCM encrypted OAuth tokens
- JWT secrets: from environment variables (never hardcoded)
- Rate limiting: 10-30 req/min per IP depending on endpoint
- File validation: whitelist of MIME types, 100MB max
- Zod validation on all inputs
- SQL injection safe via Prisma parameterized queries

## Development
```bash
npm run dev          # Start dev server (Turbopack)
npm run build        # Production build
npm run start        # Start production server
npx prisma studio    # Browse database
npx prisma migrate dev --name <name>  # New migration
```

## Environment Variables
See `.env.example` for all required variables.

## What's Stubbed (Future Work)
- OAuth connect flow (Instagram, Facebook, TikTok API integration)
- Actual platform publishing (currently saves records, doesn't call APIs)
- Scheduling (schema supports scheduledFor, UI not built)
- Media thumbnails (sharp installed but not wired)

## Credits
Built by Roy & Claude Opus
