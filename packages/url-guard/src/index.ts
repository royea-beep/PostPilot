/**
 * @royea/url-guard — SSRF-safe URL validation for Node, Next.js, and Edge.
 * Thin wrapper around @royea/shared-utils: validates URLs (protocol, private IPs,
 * localhost, internal hostnames) and optional DNS rebinding checks via resolved IP.
 * Use this package when you only need URL validation without pulling the full shared-utils.
 */

export {
  validateUrl,
  validateResolvedIp,
  clampMaxScreens,
  isPrivateIp,
} from '@royea/shared-utils/validate-url';
