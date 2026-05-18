import { after } from 'next/server'

export function initErrorLogger(appName: string, supabaseUrl: string) {
  if (typeof window === 'undefined') return

  window.addEventListener('error', (e) => {
    fetch(`${supabaseUrl}/functions/v1/log-error`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        app: appName,
        message: e.message,
        stack: `${e.filename}:${e.lineno}:${e.colno}`,
        context: { type: 'uncaught' },
      }),
    }).catch(() => {})
  })

  window.addEventListener('unhandledrejection', (e) => {
    fetch(`${supabaseUrl}/functions/v1/log-error`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        app: appName,
        message: e.reason?.message || String(e.reason),
        stack: e.reason?.stack || null,
        context: { type: 'unhandled_rejection' },
      }),
    }).catch(() => {})
  })
}

// ---------------------------------------------------------------------------
// Server-side telemetry to empire-hq's log-error Edge Function (v6).
//
// IMPORTANT: the fetch is dispatched via Next.js 16 `after()` so the Vercel
// lambda stays alive past response commit until the POST completes. Without
// this wrapping, fire-and-forget fetches get killed mid-flight by lambda
// termination — which is exactly what made the v1.0.6 cron heartbeat
// unreliable (only the cold-start tick delivered).
//
// Never throws. 2s timeout. Silent no-op if URL unset.
// Schema: { project_slug, level, message, stack, route, user_id, metadata }
// ---------------------------------------------------------------------------

type LogLevel = 'error' | 'warn' | 'info'

interface LogOpts {
  route?: string
  userId?: string
  metadata?: Record<string, unknown>
  // Ad-hoc keys are merged into metadata jsonb
  [key: string]: unknown
}

// Run `work` after the response is sent. `after()` keeps the lambda alive
// until the returned Promise settles. Falls back to best-effort immediate
// fire if `after()` throws (e.g. called outside a request context — scripts,
// tests, or non-Next runtimes).
function fireAndForget(work: () => Promise<void>): void {
  try {
    after(work)
  } catch {
    void work()
  }
}

function postLog(level: LogLevel, message: string, err: unknown, opts: LogOpts): void {
  const url = process.env.NEXT_PUBLIC_BUG_REPORTER_SUPABASE_URL
  if (!url) return

  let stack: string | null = null
  let combinedMessage = message
  if (err instanceof Error) {
    stack = err.stack ?? null
    combinedMessage = err.message ? `${message}: ${err.message}` : message
  } else if (err != null) {
    combinedMessage = `${message}: ${String(err)}`
  }

  const { route, userId, metadata: providedMetadata, ...extras } = opts
  const hasExtras = Object.keys(extras).length > 0
  const metadata: Record<string, unknown> | null =
    providedMetadata || hasExtras ? { ...(providedMetadata ?? {}), ...extras } : null

  const body = {
    project_slug: 'postpilot',
    level,
    message: combinedMessage,
    stack,
    route: route ?? null,
    user_id: userId ?? null,
    metadata,
  }

  fireAndForget(async () => {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 2000)
    try {
      await fetch(`${url}/functions/v1/log-error`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal,
      })
    } catch {
      // never throw from a logger
    } finally {
      clearTimeout(timeout)
    }
  })
}

export function logError(message: string, err: unknown, opts: LogOpts = {}): void {
  postLog('error', message, err, opts)
}

export function logInfo(message: string, opts: LogOpts = {}): void {
  postLog('info', message, null, opts)
}
