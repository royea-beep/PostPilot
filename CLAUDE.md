# MASTER CLAUDE CONTEXT
## Last updated: 2026-03-15 (session 3 — security + audit + fixes mega session)
## Owner: Roye Arguan (royearguan@gmail.com | GitHub: royea-beep)

---

## OPERATING MODEL

### The Triangle
| Role | Who | Does What |
|------|-----|-----------|
| **Strategic Brain** | Roye + ChatGPT | Direction, decisions, review, MEGA PROMPT creation |
| **Executor** | Claude Code / Cursor | Code, builds, deploys, pipelines |
| **QA** | Roye | Final approval, manual testing |

### The Cycle
1. Define direction + sharpen together (Hebrew)
2. Send full MEGA PROMPT to Claude (English)
3. Claude executes, returns numbered output
4. Analyze, summarize, decide what's next
5. User approves / corrects / adds
6. New MEGA PROMPT → back to step 2

### Language Rules
- **Chat with Roye:** Hebrew always
- **MEGA PROMPTs to Claude:** English always
- **UI text:** Hebrew (RTL) for Israeli products, English for SaaS products
- **Code:** English always

---

## ABSOLUTE RULES — NEVER BREAK

1. **Be autonomous.** Don't ask permission — execute. Only escalate if truly blocked on ONE specific question.
2. **Read before writing.** Never guess what a file contains. `cat` it first.
3. **Build must pass.** Run `npm run build` (or equivalent) after every change.
4. **No Stripe.** Use Payplus for Israeli products, LemonSqueezy for international SaaS — Stripe doesn't work in Israel.
5. **Dark mode default.** All UIs dark theme unless specified otherwise.
6. **Never hardcode secrets.** API keys from `.env` only.
7. **Windows 11 + bash shell.** Use Unix paths in scripts, `start ""` for browser.
8. **Don't break existing code.** Read files before editing. Understand context.
9. **Commit messages:** descriptive, English, prefixed with type (feat/fix/refactor/chore).
10. **Think like a project manager.** Always determine next steps proactively.
11. **Always prepare the next MEGA PROMPT** at the end of every cycle.
12. **TypeScript strict.** No `any` unless absolutely necessary.
13. **Never suggest "let's wrap up" or "tomorrow."** Keep going until done.

---

## ALL PROJECTS REGISTRY

### Tier 1 — Active / Shipped
| Project | Path | Stack | Status | URL |
|---------|------|-------|--------|-----|
| **9Soccer Mascots** | `C:\Projects\90Soccer-Mascots` | React 19 + Vite + ElevenLabs + SecretSauce | Shipped — ElevenLabs voice + FloatingMascot + SecretSauce hooks | https://ninesoccer-mascots.vercel.app |
| **ftable** | `C:\Projects\ftable` | Vanilla JS + Supabase + Tailwind | Live — FEATURED6 Top 6 grid fixed (v_leaderboard_top6 view) | https://ftable.co.il |
| **analyzer-standalone** | `C:\Projects\analyzer-standalone` | Next.js 16 + Claude Vision + LemonSqueezy + SecretSauce | Live v1.7.0 — Billing live: FREE 3/mo, Pro ₪79/50, Enterprise contact, Bulk CTA | https://analyzer.ftable.co.il |
| **Caps Poker** | `C:\Projects\Caps` | React Native + Expo | Live v1.3.3 — Bug reporter (shake+FAB), Central Perk theme, iPhone Safari fixed | https://caps.ftable.co.il + TestFlight Build 16 |
| **PostPilot** | `C:\Projects\CONTENT-AI\PostPilot` | Next.js 16 + Prisma 7 + Supabase Postgres 17 + LemonSqueezy | Live v1.0.5 — Meta App wired (495336020567948), promo codes live, 4 bugs fixed, bug reporter live. DB migrated Neon → Supabase 2026-04-28; cron 7-day outage resolved 2026-05-18 (see docs/HANDOFF_2026-05-18_cron-incident-resolved.md). | https://postpilot.ftable.co.il |

### Tier 2 — Ready to Launch
| Project | Path | Stack | Status |
|---------|------|-------|--------|
| **KeyDrop** | `C:\Projects\KeyDrop` | Next.js 16 + Prisma + LemonSqueezy | Live — LemonSqueezy billing E2E verified (Pro $19, Team $49) | https://1-2clicks.vercel.app |
| **ExplainIt** | `C:\Projects\ExplainIt` | Next.js 14 + Playwright + LemonSqueezy | Live — billing deployed (Free/Pro $19/Team $49), Playwright needs Railway | https://explainit-one.vercel.app |

### Tier 3 — Other Projects
| Project | Path | What |
|---------|------|------|
| **SecretSauce** | `C:\Projects\SecretSauce` | Learning engine — learning_events live in 4 Supabase projects + bug_reports in 5 projects |
| **Wingman** | `C:\Projects\Wingman` | Social matchmaking v1.3.0 — SecretSauce hooks, trust circle real API, chat suggestions, 68 sprints |
| **ZProjectManager** | `C:\Projects\ZProjectManager` | Project OS v1.1.0 — Electron desktop, GitHub auto-fetch, audit log TTL, 15 features |
| **clubgg** | `C:\Projects\clubgg` | Poker club tools |
| **TokenWise** | `C:\Projects\TokenWise` | Token usage tracker |
| **VenueKit** | `C:\Projects\VenueKit` | Venue management |
| **Heroes-Hadera** | `C:\Projects\Heroes-Hadera` | Local community |

---

## AVAILABLE TOOLS & API KEYS

### Confirmed Active Keys
| Service | Key Location | Used In | Status |
|---------|-------------|---------|--------|
| **ElevenLabs** | `90Soccer-Mascots/.env` | Voice cloning, TTS | Active |
| **Anthropic Claude** | `analyzer-standalone/.env.local` | Product analysis, vision | Active |
| **HeyGen v2** | `analyzer-standalone/.env.local` | AI video generation | Active |
| **OpenAI (DALL-E 3)** | `90Soccer-Mascots` settings history | Image generation | Active |
| **Google OAuth** | `90Soccer-Mascots/.env` | Photos Picker API | Active |
| **Supabase** | Multiple projects | Database, auth, realtime | Active |
| **Payplus** | `analyzer-standalone/.env.local` | Payments (Israeli market) | Active |
| **LemonSqueezy** | PostPilot, analyzer, KeyDrop, ExplainIt | Payments (all SaaS projects) | Active — Store 309460, webhook registered for analyzer+PostPilot |
| **fal.ai** | `analyzer-standalone/.env.local` + `90Soccer-Mascots/.env` | Kling AI video proxy, AI media generation | Active |
| **FAL_API_KEY** | `analyzer-standalone/.env.local` + `90Soccer-Mascots/.env` | Kling/fal.ai video generation | Active |

### Payment Infrastructure
- **LemonSqueezy Store ID:** `309460` / Store Slug: `ftable` — primary payment provider for all SaaS
- **LemonSqueezy active on:** PostPilot (Pro $29, Agency $79), analyzer (Pro ₪79), KeyDrop (Pro $19, Team $49), ExplainIt (Pro $19, Team $49)
- **Payplus:** PLACEHOLDER keys only — waiting for Tzach response. Consider for ftable Israeli-only payments.
- **ftable payments:** Bit/PayBox manual transfers + FTC coins
- **No Stripe** — doesn't work in Israel

---

## REUSABLE PACKAGES (12 total)

All under `@royea` scope in analyzer-standalone `/packages/`:

### Original 8 (v1.3.0)
- `@royea/tokenwise` — cost intelligence + learning
- `@royea/heygen-client` — HeyGen video generation
- `@royea/kling-client` — Kling AI via fal.ai proxy
- `@royea/remove-bg-client` — background removal
- `@royea/unboxing-scripts` — video script generation
- `@royea/rate-limiter` — Upstash Redis rate limiting
- `@royea/supabase-auth-helpers` — auth utilities
- `@royea/product-analyzer-ui` — UI components

### New 7 (v1.7.0)
- `@royea/secretsauce` v1.0.0 — learning engine
- `@royea/game-engine` v1.0.0 — scoring + grades
- `@royea/animation-triggers` v1.0.0 — CSS animation presets
- `@royea/streak-engine` v1.0.0 — daily streak system
- `@royea/local-storage` v1.0.0 — type-safe localStorage
- `@royea/bug-reporter` v1.0.0 — shake/FAB bug reporter
- `@royea/secretsauce-crypto` v1.0.0 — AES-256-GCM vault for SecretSauce v2

---

## MEGA PROMPT TEMPLATE

Use this structure for every new MEGA PROMPT:

```
## [PROJECT] — [TASK TITLE]

## CONTEXT
[What exists, what we're solving]

## LOCKED DECISIONS
[Non-negotiable rules for this task]

## TASK
**Step 1** — [...]
**Step 2** — [...]

## CONSTRAINTS
[Technical limits, style rules]

## DEFINITION OF DONE
[Specific, testable criteria]
```

Full template with agents, phases, and scoring: `C:\Projects\MEGA_PROMPT_TEMPLATE.md`

---

## PROJECT-SPECIFIC CONTEXT

### 9Soccer Mascots
- **Brand:** 9Soccer (NEVER "90Soccer")
- **GitHub:** royea-beep/90Soccer-Mascots (private, 110 files committed March 15)
- **Mascots:** Mia (lion, The Heart), Daniel (pig, The Player), The Lemon (coach)
- **Languages:** HE (default) / EN / AR / ES
- **Voice engine:** ElevenLabs with 12+ voice clones
- **Real voices:** Daniel teen (`1adDIriA2S2QRRxMuaES`), Roye (`8naZ7WTlMFBVcxgIAqZs`), Mia real (`xmLkwZONOK7ELNT0iwps`)
- **Character pipeline:** `scripts/modules/characterPipeline/` — reusable for any person
- **Video tools:** Kling/Runway prompts ready, HeyGen available from analyzer
- **FloatingMascot:** Interactive mascot component with SecretSauce hooks
- **Full bible:** `docs/PROJECT_ENGINE_BIBLE.md`

### Caps Poker (v1.3.3)
- **Iron Rules:** React Native + Expo only, iOS portrait, Omaha evaluation, no backend (Phase 1), Supabase Realtime (Phase 2)
- **Working model:** VAMOS sprints (12 completed)
- **Theme:** Central Perk (coffee-inspired UI)
- **Features:** Timer redesign, efficiency analysis, iPhone Safari fix, bug reporter (shake+FAB)
- **Bug reporter:** Shake phone or tap FAB → modal → sends to Supabase bug_reports
- **Web:** caps.ftable.co.il — `output: "single"` + `type="module"` via fix-web-html.js
- **Full handoff:** `docs/full_handoff.md`

### ftable
- **Stack:** Vanilla JS + HTML, NO React, NO build step
- **Deploy:** `bash deploy.sh file1 file2...` (FTP to cPanel)
- **Language:** All Hebrew, RTL
- **Supabase ref:** `uiyqswnhrbfctafeihdh`
- **Payments:** Bit/PayBox deep links (no webhook API)

### Wingman
- **Concept:** Social matchmaking infrastructure ("I know someone perfect for you")
- **Not a dating app** — it's matchmaking via trust networks
- **Product doc:** `PRODUCT_FOUNDATION.md`

### analyzer-standalone (v1.7.0)
- **Product:** Upload product image → AI generates listings in 4 languages + unboxing videos
- **Features:** Claude Vision analysis, HeyGen avatar video, Kling real unboxing video (via fal.ai), background removal (Sharp), 5-theme color switcher, font size controls, auto-run with saved preferences, SecretSauce learning hooks
- **Billing (NEW):** LemonSqueezy — FREE 3/mo, Pro ₪79/50 analyses, Enterprise "צור קשר"
- **Bulk mode:** WhatsApp CTA for catalog-level analysis (972504141513)
- **Missing:** Create "Analyzer Pro" product/variant in LemonSqueezy dashboard (currently using Team variant 1377974)
- **Themes:** Mission (blue), Emerald, Amber, Rose, Slate — stored in localStorage (`analyzer_theme`)
- **HeyGen avatars:** Verified IDs — Anna (HE), Abigail (EN), Salma (AR), Adriana (ES/PT), Chloe (FR), Judita (DE), Jin (ZH), Kavya (HI)
- **Kling AI:** Works via fal.ai proxy (`FAL_API_KEY`). Direct Kling keys expired — do NOT use `KLING_ACCESS_KEY_ID/SECRET`
- **Packages:** 14 reusable @royea packages in `/packages/` (added bug-reporter, secretsauce-crypto)
- **Docs:** Architecture, avatar map, fal.ai integration, TokenWise learning — all in `/docs/`
- **Live:** https://analyzer.ftable.co.il

### PostPilot (v1.0.5)
- **Product:** Social media post scheduling with Manual Copy & Post workflow
- **Billing (VERIFIED E2E):** LemonSqueezy — FREE (2 brands/10 posts), Pro $29 (10/100), Agency $79 (unlimited)
- **Meta App:** 495336020567948 (shared with 9Soccer), credentials wired, verification pending
- **Promo codes:** PROMO_CODE_ADMIN (2223→AGENCY), PROMO_CODE_FRIEND (1234→PRO) — at registration + dashboard
- **Bugs fixed (v1.0.2-v1.0.5):** dashboard mediaUploads null crash, 403 brand limit UX, brand creation error handling, refresh token decrypt helper
- **Features:** Demo mode, SecretSauce learning hooks, bug reporter, promo codes, Meta OAuth ready
- **Live:** https://postpilot.ftable.co.il

### KeyDrop
- **Product:** Encrypted one-time links for collecting API keys/credentials from clients
- **Billing:** LemonSqueezy — Free (5 req/mo), Pro $19 (100 req/mo), Team $49 (unlimited). Checkout + webhook E2E verified.
- **Completed:** Payplus → LemonSqueezy swap, DATABASE_URL fixed (Neon PostgreSQL), all env vars set
- **Pending:** Create dedicated LS products in dashboard (currently using ftable placeholder variants)
- **Live:** https://1-2clicks.vercel.app

### ExplainIt
- **Product:** Auto explainer video + documentation generator from any website
- **Stack:** Next.js 14 + Playwright + Prisma (SQLite) + LemonSqueezy
- **Billing:** Deployed — Free (3 pipelines/mo), Pro $19 (50 pipelines), Team $49 (unlimited)
- **Pricing page:** Live at /pricing with 3-tier cards
- **Pending:** Create dedicated LS products, deploy to Railway (Playwright needs server-side Chromium)
- **Live:** https://explainit-one.vercel.app

### SecretSauce (v2.0)
- **Product:** Encrypted learning engine — scoring weights + analysis prompts in AES-256-GCM vault
- **learning_events:** live in 4 Supabase projects (analyzer, 9soccer, caps, wingman)
- **bug_reports:** live in 5 projects (analyzer, 9soccer, postpilot, caps, wingman)
- **Packages:** `@royea/secretsauce` v1.0.0, `@royea/bug-reporter` v1.0.0
- **SecretSauce v2.0:** Encrypted vault (secretsauce_vault), server-side analysis API, HMAC fingerprinting, obfuscation script
- **Wingman integration:** Mixpanel→Learner bridge, server flush via POST /v1/learn

---

## COMPLETED — Session 3 (2026-03-15)

### Part 1 — Security + Billing + Audit
- **KeyDrop:** Payplus → LemonSqueezy swap complete, E2E verified, DATABASE_URL fixed, deployed
- **Supabase Security:** 99 issues fixed across Wingman (29) + ftable (73) + Heroes-Hadera (15). Zero ERRORs remain.
- **9Soccer App Store:** Privacy Policy ✅, RevenueCat production key ✅ (`appl_WsnUMUMWcxEmMWYiyBumbucCiqe`), Hebrew/English UI ✅ (~120 i18n keys), VAPID key fix ✅
- **ExplainIt:** SQLite→PostgreSQL migration, LS checkout API fixed (relationships format), E2E register→checkout verified
- **clubgg:** 13/13 settlement validation pass, config.py target corrected
- **preprompt-web:** Build fixed (vendored @royea/prompt-guard)
- **ftable:** Google Search Console verification meta tag added
- **Portfolio cleanup:** Deleted mypoly, MegaPromptGPT, crypto-arb-bot

### Part 2 — QA + Fixes + TestFlight Prep
- **PostPilot:** Misleading UI fixed (3 strings → honest copy→paste language), access code login added (FTABLE2026/ADMIN2026/BETA2026), bug FAB moved to bottom:80px, bug reporter wired to Supabase
- **9Soccer QA (67 items):** 16 automatic fixes — userId null guards on 7 game modes + Game.tsx, LaunchScreen white→dark (#0B0E18), rate-limit GC for memory leak, 22 achievement titles i18n'd, PredictionMode null safety, BR error handling, matchmaking cleanup fix
- **9Soccer Supabase:** 51/51 tables now have RLS (bug_reports + learning_events fixed)
- **9Soccer Screenshots:** 6 App Store screenshots captured at 1290x2796
- **TestFlight prep — 4 projects:** Bundle IDs registered, provisioning profiles created, Capacitor added + iOS dirs generated, GitHub Actions workflows configured, 6/7 secrets set on PostPilot/analyzer/KeyDrop/ExplainIt

## PENDING

- **TestFlight:** Set DISTRIBUTION_P12_PASSWORD on all 4 repos → push → builds trigger
- **9Soccer App Store:** Age rating (Wager Mode) + privacy nutrition labels (manual in ASC)
- **LemonSqueezy:** Create dedicated products: KeyDrop Pro $19 + Team $49, Analyzer Pro ₪79, ExplainIt Pro $19 + Team $49
- **LemonSqueezy:** Waiting for social media for account approval
- **Payplus:** Waiting for Tzach response
- **Railway (letsmakebillions):** DB connection hanging — needs pooler URL (port 6543) or remove DATABASE_URL
- **cryptowhale Supabase:** Pause decision pending
- **Google Search Console:** Waiting for verification tag from Roye
- **ExplainIt:** Railway deploy for Playwright/generation features
- **Supabase Auth:** Enable Leaked Password Protection on ftable + Heroes-Hadera

## NEXT SESSION STARTS WITH

1. Get DISTRIBUTION_P12_PASSWORD from Roye → set on all 4 repos
2. Push all 4 → TestFlight builds trigger
3. Monitor builds → fix any failures
4. Then: Wingman sprint, Heroes-Hadera, letsmakebillions Railway fix

---

## WHAT TO DO ON FIRST MESSAGE

1. Read this file
2. Identify which project the user is talking about
3. Read that project's specific docs (bible, handoff, etc.)
4. Determine the highest-leverage next step
5. Execute or prepare a MEGA PROMPT
