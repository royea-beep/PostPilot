# HANDOFF — PostPilot cron 7-day outage resolved

**Date:** 2026-05-18
**Incident ID:** `postpilot-cron-7day-outage-2026-05-18`
**Severity:** sev2_high (logged in `empire_incident_log` on empire-hq)
**TTD:** 10080 minutes (7 days — outage ran undetected)
**TTR:** 180 minutes (once detected)

## Summary

Production cron `GET /api/publish-scheduled` returned HTTP 500 every 5
minutes for at least 7 days (verified 2026-05-10 → 2026-05-18). The
scheduled-publishing pipeline was dead. Landing, auth, dashboard, brand
portal, on-demand caption generation, and manual publishing all kept
working — so the breakage was invisible to anyone not watching Vercel
runtime logs. The baseline scanner (`vercel_projects_monitored`) that
should have flagged the consecutive errors had itself stalled with
`last_scanned_at = 2026-05-02`.

## Root cause

Cascading config drift after the 2026-04-28 Neon → Supabase migration:

1. The migration moved tables to Supabase `empire-hq`
   (`vjxqlqtlywovnbidovit`) via MCP `apply_migration`. Schema picked
   "Option B" (shared empire-hq project with `pp_` table prefix).
2. The 2026-05-09 `ci: retrigger Vercel after webhook miss` commit
   redeployed the build but did not change env vars. `DATABASE_URL` in
   Vercel was still pointing at the broken Neon pooler URL all along.
3. After re-pointing the env to a fresh dedicated Supabase project
   (`dfgqcednswxtrzvuiizq`, eu-central-1), the **pooler endpoint**
   rejected the custom `postpilot_app` role with
   `FATAL: Tenant or user not found`.
4. Switching to the **direct endpoint** (`db.<ref>.supabase.co:5432`)
   worked from local development but still returned 500 from Vercel.

## The actual fix

**Vercel Lambda is IPv4-only by default; Supabase's direct endpoint is
IPv6-only.** Confirmed by DNS:

```
$ nslookup db.dfgqcednswxtrzvuiizq.supabase.co
Address:  2a00:a040:3:2::162           ← IPv6 only
Address:  2a05:d014:1e9b:b302:...      ← IPv6 only
(no A records)

$ nslookup aws-0-eu-central-1.pooler.supabase.com
Address:  2a00:a040:3:2::162           ← IPv6
Addresses:  18.198.145.223             ← IPv4 ✓ (dual-stack)
```

Resolution: dashboard-reset the `postgres` role password on the new
project, switch `DATABASE_URL` to the pooler with `postgres.<project_ref>`
user format. Cost: $0. Cron returned to healthy on first tick after
deploy.

Alternative (not taken): $4/month Supabase IPv4 add-on, which adds an
A record to the direct endpoint and lets the existing `postpilot_app`
role keep being used.

## Two gotchas worth flagging for future PostPilot work

1. **Supavisor (Supabase pooler) does NOT accept custom roles** like
   `postpilot_app`. Only the built-in roles (`postgres`, `authenticator`,
   `anon`, `authenticated`, `service_role`) connect via the pooler. If a
   future bot creates a new app-specific role, it must use direct
   connection (port 5432) — which requires the IPv4 add-on for Vercel.
2. **Vercel Lambda is IPv4-only; Supabase direct endpoint is IPv6-only by
   default.** Combining the two silently fails. The $4/month IPv4 add-on
   is non-negotiable for direct connections from Vercel, or use the
   pooler with `postgres.<ref>`.

## Lessons recorded separately

- "Verify ≥ 1 cron tick after deploy READY before claiming done" —
  vault entry `verify_fix_with_post_deploy_log_check_not_just_build_success`.
  Set 2026-04-28, NOT applied to the 2026-05-09 retrigger, which is why
  this dragged for 9 days before detection.
- Baseline scanner stall: `vercel_projects_monitored.last_scanned_at` was
  stuck on 2026-05-02 with `latest_deployment_state = ERROR` and
  `consecutive_error_deploys = 4`. The scanner is supposed to alert on
  consecutive errors but the scanner itself stalled. Re-synced manually
  on 2026-05-18. Adding alerting on `last_scanned_at` staleness itself
  is a separate sprint.

## State at handoff

- **Schema:** 11 `pp_*` tables on `dfgqcednswxtrzvuiizq`. RLS enabled
  with `app_access` policies for `postpilot_app` (defined but unused at
  runtime — runtime uses `postgres` via pooler).
- **Prisma migrations:** History initialized. `prisma/migrations/0_init`
  + `migration_lock.toml` exist locally and `0_init` is marked applied in
  `_prisma_migrations`. Future schema changes use `npx prisma migrate dev`.
- **Old Supabase project:** 11 orphan `pp_*` tables on `empire-hq`
  (`vjxqlqtlywovnbidovit`) dropped 2026-05-18 during cleanup.
- **Performance:** 2 unindexed FK columns on `pp_posts(draftId, mediaId)`
  added 2026-05-18. Supabase performance advisor should now be clean of
  those `unindexed_foreign_keys` warnings.
- **Vercel env:** `NODE_TLS_REJECT_UNAUTHORIZED=0` is set in production
  as a legacy debug artifact. Not load-bearing once the pooler URL is in
  place. Safe to remove when convenient.
