/**
 * SSRF-safe URL validation for any user-supplied URL (e.g. brand logoUrl, website, link in bio).
 * Use validateUrl() before storing or redirecting to user-provided URLs.
 */
export { validateUrl, validateResolvedIp, clampMaxScreens } from '@royea/url-guard';
