# MASTER CLAUDE CONTEXT
## Last updated: 2026-03-14
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
| **9Soccer Mascots** | `C:\Projects\90Soccer-Mascots` | React 19 + Vite + ElevenLabs | Shipped | https://ninesoccer-mascots.vercel.app |
| **ftable** | `C:\Projects\ftable` | Vanilla JS + Supabase + Tailwind | Live | https://ftable.co.il |
| **analyzer-standalone** | `C:\Projects\analyzer-standalone` | Next.js 16 + Claude Vision + HeyGen + Kling (fal.ai) + Payplus | Live v1.6.5 | https://analyzer.ftable.co.il |
| **Caps Poker** | `C:\Projects\Caps` | React Native + Expo | In development | TestFlight |

### Tier 2 — Ready to Launch
| Project | Path | Stack | Status |
|---------|------|-------|--------|
| **KeyDrop** | `C:\Projects\KeyDrop` | Next.js 16 + Prisma + LemonSqueezy | Billing done, needs landing page |
| **PostPilot** | `C:\Projects\PostPilot` | Next.js 16 + Prisma + Neon + LemonSqueezy | Deployed, needs test flow |
| **ExplainIt** | `C:\Projects\ExplainIt` | Next.js 14 + Playwright + Railway | Working, needs billing |

### Tier 3 — Other Projects
| Project | Path | What |
|---------|------|------|
| **Wingman** | `C:\Projects\Wingman` | Social matchmaking platform |
| **clubgg** | `C:\Projects\clubgg` | Poker club tools |
| **crypto-arb-bot** | `C:\Projects\crypto-arb-bot` | Crypto arbitrage |
| **SecretSauce** | `C:\Projects\SecretSauce` | Codebase security scanner |
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
| **LemonSqueezy** | KeyDrop, PostPilot, ExplainIt | Payments (international SaaS) | Active |
| **fal.ai** | `analyzer-standalone/.env.local` + `90Soccer-Mascots/.env` | Kling AI video proxy, AI media generation | Active |

### Payment Infrastructure
- **Payplus:** Used for analyzer-standalone (Israeli market) — migrated from LemonSqueezy (March 2026)
- **LemonSqueezy Store ID:** `309460` / Store Slug: `ftable` — used for international SaaS projects
- **No Stripe** — doesn't work in Israel

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
- **Mascots:** Mia (lion, The Heart), Daniel (pig, The Player), The Lemon (coach)
- **Languages:** HE (default) / EN / AR / ES
- **Voice engine:** ElevenLabs with 12+ voice clones
- **Real voices:** Daniel teen (`1adDIriA2S2QRRxMuaES`), Roye (`8naZ7WTlMFBVcxgIAqZs`), Mia real (`xmLkwZONOK7ELNT0iwps`)
- **Character pipeline:** `scripts/modules/characterPipeline/` — reusable for any person
- **Video tools:** Kling/Runway prompts ready, HeyGen available from analyzer
- **Full bible:** `docs/PROJECT_ENGINE_BIBLE.md`

### Caps Poker
- **Iron Rules:** React Native + Expo only, iOS portrait, Omaha evaluation, no backend (Phase 1), Supabase Realtime (Phase 2)
- **Working model:** VAMOS sprints (12 completed)
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

### analyzer-standalone (v1.6.5)
- **Product:** Upload product image → AI generates listings in 4 languages + unboxing videos
- **Features:** Claude Vision analysis, HeyGen avatar video, Kling real unboxing video (via fal.ai), background removal (Sharp), 5-theme color switcher, font size controls, auto-run with saved preferences, Payplus payments
- **Themes:** Mission (blue), Emerald, Amber, Rose, Slate — stored in localStorage (`analyzer_theme`)
- **HeyGen avatars:** Verified IDs — Anna (HE), Abigail (EN), Salma (AR), Adriana (ES/PT), Chloe (FR), Judita (DE), Jin (ZH), Kavya (HI)
- **Kling AI:** Works via fal.ai proxy (`FAL_API_KEY`). Direct Kling keys expired — do NOT use `KLING_ACCESS_KEY_ID/SECRET`
- **Payments:** Migrated from LemonSqueezy to Payplus (March 2026)
- **Packages:** 8 reusable @royea packages in `/packages/`
- **Docs:** Architecture, avatar map, fal.ai integration, TokenWise learning — all in `/docs/`
- **Live:** https://analyzer.ftable.co.il

---

## WHAT TO DO ON FIRST MESSAGE

1. Read this file
2. Identify which project the user is talking about
3. Read that project's specific docs (bible, handoff, etc.)
4. Determine the highest-leverage next step
5. Execute or prepare a MEGA PROMPT
