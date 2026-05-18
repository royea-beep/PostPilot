# Changelog

## [1.0.6] - 2026-05-18

Recovery release. Incident response for a 7+ day production cron outage,
plus the observability primitives so the next failure is loud, not silent.

### Fixed
- `/api/publish-scheduled` returning 500 every 5 minutes for 7+ days.
  Root cause was a 4-step cascade: stale `DATABASE_URL` → Supavisor pooler
  tenant mismatch → Supavisor rejection of custom roles → IPv6-only direct
  endpoint vs Vercel's IPv4-only Lambda. Full RCA in
  `docs/HANDOFF_2026-05-18_cron-incident-resolved.md`. Incident slug
  `postpilot-cron-7day-outage-2026-05-18` in `empire_incident_log`
  (TTD 7 days, TTR 3 hours).

### Added
- `PostDraft.source` field (`'ai' | 'template_fallback'`) distinguishing
  real AI captions from hardcoded fallback templates.
- UI badge on `/brand/[token]` variant cards marking template-fallback
  captions, with tooltip explaining AI was unavailable.
- `pp_analytics_events` rows of type `ai_fallback_served` on each fallback
  delivery so AI reliability is measurable.
- Server-side `logError()` and `logInfo()` exports in
  `src/lib/error-logger.ts`, posting to empire-hq's `log-error` Edge
  Function v6 with the v6 payload shape (`project_slug`, `level`, `route`,
  `user_id`, `metadata`).
- Heartbeat `logInfo` calls on both work-found and no-work paths of
  `/api/publish-scheduled`. Future alerting can now distinguish "cron
  ran, no work" from "cron never fired."
- Two FK indexes on `pp_posts` (`draftId`, `mediaId`), clearing the
  Supabase performance advisor warnings.

### Changed
- Database provider migrated from Neon to a dedicated Supabase project
  (`dfgqcednswxtrzvuiizq`, `eu-central-1`). Apr 28 attempt routed PostPilot
  to the shared `empire-hq` project; that was abandoned May 18 in favor
  of an isolated project.
- Vercel↔Supabase connection now uses the direct endpoint (port 5432)
  with the $4/mo IPv4 add-on. Supavisor pooler rejected the custom
  application role and isn't viable under the current architecture.
- Application connects as least-privilege role `postpilot_app` with
  per-table RLS policies (`app_access`), not the `postgres` superuser.
- 15 `console.error` call sites across `src/app/api/**` no longer
  dev-gated. Production errors now reach `error_logs` on empire-hq.
- `PROJECT-RULES.md`, `PROJECT-INFO.json`, root `CLAUDE.md` corrected
  to reflect the actual Supabase stack (was still claiming Neon).
- `.env.example` documents `NEXT_PUBLIC_BUG_REPORTER_SUPABASE_URL` and
  `_KEY` for the telemetry path.

### Infrastructure
- New Vercel env var `NODE_TLS_REJECT_UNAUTHORIZED=0` set during the
  cron recovery. Disables TLS verification globally inside the Lambda.
  Acceptable on a dev project with zero users, **tech debt to remove
  before customer traffic**: refactor `src/lib/db.ts` to handle SSL
  per-connection so this env var becomes unnecessary.
- Custom role `postpilot_app` password is the value provisioned
  2026-05-18 by Claude chat. Rotate via `ALTER USER` + Vercel env update
  when convenient — currently low-risk (zero users, never published).

### Known gaps (next release candidates)
- Cron alerting not implemented this release. The heartbeats added
  here make 15-min-idle detection straightforward; the actual alerter
  (edge function + Telegram bot) is queued for v1.1.
- `Style DNA` landing-page promise still describes learning from external
  Instagram history; system only learns from posts generated through
  PostPilot. Either rewrite copy or add a "paste 5 past captions"
  onboarding step. Product call, not engineering.
- `AnalyticsEvent.payload` is `String` (JSON-encoded), not `Jsonb`.
  Refactor candidate when `ai_fallback_served` query load grows.

## [1.0.0] — 2026-03-16

### Added
- Post types (Reels/Stories) + scheduled publishing
- SEO meta tags — OpenGraph + Twitter cards
- robots.txt + sitemap for SEO
- /api/status health endpoint + error logging
- Sync bug reports to Google Drive via Edge Function

### Fixed
- Rate limiting on auth routes + Instagram Reels validation
- Remove TikTok from UI + Instagram URL validation
- Strip sensitive console.error in API routes + fix null returns in publish pipeline

## [1.0.4] — 2026-03-15

### Added
- Capacitor iOS + TestFlight workflow
- Move bug FAB above share button + add access code login
- Promo codes — admin + friend bypass v1.0.4
- @royea/bug-reporter integration — floating bug reporter

### Fixed
- Replace misleading social connection text with honest copy
- Add decryptJsonWrapped for refresh token storage format
- Brands 403 plan limit UX v1.0.3
- Dashboard mediaUploads null crash v1.0.2
- Never overwrite ACTIVE subscriptionStatus on subscription_updated webhook
- Remove debug output from register endpoint

### Changed
- Add Capacitor config for iOS TestFlight
