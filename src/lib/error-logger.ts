// Client-side error logger. Server-side telemetry (logError, logInfo) lives
// in `./error-logger.server.ts` so the `next/server` import (which `after()`
// requires) never leaks into the client bundle.

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
