# Changelog

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
