# @royea/url-guard

**url-guard** provides SSRF-safe URL validation and DNS rebinding protection for any Node, Next.js, or Edge project. It blocks private/internal IPs, localhost, cloud metadata endpoints, and internal hostnames, and can optionally validate resolved IPs to mitigate DNS rebinding. It is a thin wrapper around [@royea/shared-utils](https://github.com/royea/shared-utils) so you get a single reusable “url-guard” product.

## Install

```bash
npm install @royea/url-guard
```

Or from a local sibling package:

```bash
npm install @royea/url-guard --save --save-prefix=file:../url-guard
```

(Alternatively, in `package.json`: `"@royea/url-guard": "file:../url-guard"`.)

## Usage

```javascript
import { validateUrl, validateResolvedIp } from '@royea/url-guard';

// Validate URL string (blocks bad protocols, private IPs, localhost, .internal/.local)
const check = validateUrl(userInput);
if (!check.valid) {
  return res.status(400).json({ error: check.error });
}

// Optional: DNS rebinding protection — ensure hostname doesn’t resolve to private IPs
const dns = await validateResolvedIp(new URL(check.url).hostname);
if (!dns.safe) {
  return res.status(400).json({ error: dns.error });
}

// Proceed with check.url
fetch(check.url);
```

## See also

- [@royea/shared-utils](https://github.com/royea/shared-utils) — full shared utilities (errors, auth, crypto, i18n, etc.); `validate-url` lives under `@royea/shared-utils/validate-url`.
