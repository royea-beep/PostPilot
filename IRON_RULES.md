# PostPilot — Iron Rules
# Read this file at the start of EVERY session.
# Auto-generated: 2026-03-21 IST

## UNIVERSAL RULES (all projects)

### Git
- NEVER commit directly to main/master without tsc check
- ALWAYS: npx tsc --noEmit → build → git commit → git push
- NEVER delete files — archive with reason in commit message
- Commit message format: "feat|fix|chore|docs: description"

### Code Quality
- TypeScript: 0 errors required before any commit
- NEVER leave TODO comments in committed code
- NEVER hardcode credentials, API keys, or secrets
- ALWAYS use environment variables for external services

### Database (Supabase)
- NEVER DROP TABLE or TRUNCATE without checking row count first
- NEVER expose service_role key in client-side code
- ALWAYS enable RLS on new tables
- ALWAYS use ALTER TABLE — never recreate tables with data

### Payments
- LemonSqueezy — FREE (2 brands/10 posts), Pro $29 (10/100), Agency $79 (unlimited)
- NEVER touch payment variants without checking LS dashboard first
- Webhook: order_created event drives access grants

### Deployment
- Next.js/web → npx vercel --prod --yes
- NEVER deploy without successful build first

## IRON RULE: Responsive Design
# Added: 2026-03-21 | Reason: Recurring bug across all projects

FORBIDDEN:
  w-[400px], h-[600px], style={{ width: "Xpx" }}, text-[18px] on layout

REQUIRED:
  w-full, max-w-*, flex-wrap, text-base sm:text-lg

TEST BREAKPOINTS: 320px / 390px / 768px / 1280px

QUICK AUDIT:
  grep -rn "w-\[" src --include="*.tsx"
  grep -rn "style={{ width" src --include="*.tsx"

## NEXT.JS / WEB RULES
- NEVER use "use client" unless truly needed
- Prefer server components for data fetching
- ALWAYS check bundle size after adding new dependencies
- Images: use next/image with proper width/height
- Deploy: npx vercel --prod --yes (never manual Vercel dashboard)

## PROJECT: PostPilot
- Stack: Next.js 16 + Prisma + Neon + LemonSqueezy
- Meta App ID: 495336020567948
- Live: https://postpilot.ftable.co.il
- Add project-specific rules below
