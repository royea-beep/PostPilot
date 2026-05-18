# PostPilot Rules

## Language strategy
- Primary: English
- Secondary: None

## Stack
- PostPilot uses dedicated Supabase project `dfgqcednswxtrzvuiizq` (eu-central-1).
- Runtime DB connection: Supabase Transaction Pooler
  (`aws-0-eu-central-1.pooler.supabase.com:6543`) with
  `postgres.<project_ref>` user format.
- Custom role `postpilot_app` exists in the database but **Supavisor (the
  pooler) rejects it** at connection time. Do not use it as the runtime
  DATABASE_URL user.

## Do
- Use Supabase project `dfgqcednswxtrzvuiizq` for all DB operations
- Check `postpilot-app` Vercel project for active deployments
- Document any new post scheduling logic in `docs/`
- Use `royea-beep/PostPilot` repo for all code changes
- Verify Supabase pooler connection string is in Vercel env vars
- After any new deploy: wait >= 1 cron tick (5 min) before claiming the deploy
  is verified. Saved as vault entry
  `verify_fix_with_post_deploy_log_check_not_just_build_success`.

## Do not
- Do **not** connect to the Supabase **direct** endpoint
  (`db.<ref>.supabase.co:5432`) from Vercel -- it is IPv6-only and Vercel
  Lambda is IPv4-only. Use the pooler endpoint instead.
- Do **not** use the `postpilot_app` role for runtime -- Supavisor rejects it
  with `Tenant or user not found`. Use `postgres.<project_ref>`.
- Do not hardcode API keys in source code
- Do not delete scheduled-post data without backup
- Do not push without Manager approval

## Critical dates / deadlines
- None currently active

## Known sharp edges
- **Supabase pooler rejects custom roles.** Only the built-in
  `postgres` / `authenticator` / `anon` / `authenticated` / `service_role`
  work via Supavisor. To use a custom role, switch to direct connection
  (port 5432) and enable the $4/mo Supabase IPv4 add-on.
- **Vercel Lambda is IPv4-only; Supabase direct endpoint is IPv6-only by
  default.** Combining the two silently fails with `connect ETIMEDOUT` or
  similar -- no clear error.
- Reference incident: `postpilot-cron-7day-outage-2026-05-18`
  (`docs/HANDOFF_2026-05-18_cron-incident-resolved.md`,
  `empire_incident_log` row of same id).
