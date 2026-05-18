'use client'

import { useEffect, useState } from 'react'

interface CheckResult {
  name: string
  status: 'PASS' | 'FAIL'
  detail: string
}

const PL_BUG_REPORTER_URL = process.env.NEXT_PUBLIC_BUG_REPORTER_SUPABASE_URL || ''

async function runChecks(): Promise<CheckResult[]> {
  const checks = await Promise.allSettled([
    // 1. /api/status
    (async (): Promise<CheckResult> => {
      const t0 = performance.now()
      const res = await fetch('/api/status')
      const ms = Math.round(performance.now() - t0)
      if (res.ok) {
        const body = await res.json().catch(() => ({}))
        return body?.status === 'ok'
          ? { name: 'status_api', status: 'PASS', detail: `(${res.status}, ${ms}ms)` }
          : { name: 'status_api', status: 'FAIL', detail: `(${res.status}, body.status=${body?.status})` }
      }
      return { name: 'status_api', status: 'FAIL', detail: `(${res.status})` }
    })(),

    // 2. /api/billing/plans
    (async (): Promise<CheckResult> => {
      const res = await fetch('/api/billing/plans')
      if (!res.ok) return { name: 'billing_plans', status: 'FAIL', detail: `(${res.status})` }
      const body = await res.json().catch(() => null)
      const plans = Array.isArray(body) ? body : Array.isArray(body?.plans) ? body.plans : null
      if (plans && plans.length > 0) {
        return { name: 'billing_plans', status: 'PASS', detail: `(${res.status}, ${plans.length} plans)` }
      }
      return { name: 'billing_plans', status: 'FAIL', detail: `(${res.status}, no plans array)` }
    })(),

    // 3. ProjectLearner pl-tracker.js script tag present in DOM
    (async (): Promise<CheckResult> => {
      const scripts = Array.from(document.scripts)
      const plScript = scripts.find((s) => /pl-tracker\.js/i.test(s.src))
      return plScript
        ? { name: 'projectlearner_script_tag', status: 'PASS', detail: '(loaded)' }
        : { name: 'projectlearner_script_tag', status: 'FAIL', detail: '(pl-tracker.js not in DOM)' }
    })(),

    // 4. NEXT_PUBLIC_BUG_REPORTER_SUPABASE_URL compiled-in
    (async (): Promise<CheckResult> => {
      return PL_BUG_REPORTER_URL
        ? { name: 'bug_reporter_env', status: 'PASS', detail: '(set)' }
        : { name: 'bug_reporter_env', status: 'FAIL', detail: '(unset)' }
    })(),

    // 5. /api/_smoke JSON endpoint
    (async (): Promise<CheckResult> => {
      const res = await fetch('/api/_smoke')
      if (!res.ok) return { name: 'smoke_endpoint', status: 'FAIL', detail: `(${res.status})` }
      const body = await res.json().catch(() => null)
      return body?.ok
        ? { name: 'smoke_endpoint', status: 'PASS', detail: `(${res.status})` }
        : { name: 'smoke_endpoint', status: 'FAIL', detail: `(${res.status}, body.ok=${body?.ok})` }
    })(),
  ])

  return checks.map((c, i) => {
    const names = ['status_api', 'billing_plans', 'projectlearner_script_tag', 'bug_reporter_env', 'smoke_endpoint']
    if (c.status === 'fulfilled') return c.value
    return { name: names[i] ?? `check_${i}`, status: 'FAIL', detail: `(threw: ${String(c.reason).slice(0, 80)})` }
  })
}

export default function SmokePage() {
  const [results, setResults] = useState<CheckResult[] | null>(null)

  useEffect(() => {
    runChecks().then(setResults).catch((err) => {
      setResults([{ name: 'harness', status: 'FAIL', detail: `runChecks threw: ${String(err).slice(0, 80)}` }])
    })
  }, [])

  if (!results) {
    return (
      <main style={{ fontFamily: 'monospace', padding: 24 }}>
        <h1>_smoke</h1>
        <pre>running checks...</pre>
      </main>
    )
  }

  const passed = results.filter((r) => r.status === 'PASS').length
  const total = results.length

  return (
    <main style={{ fontFamily: 'monospace', padding: 24 }}>
      <meta name="robots" content="noindex,nofollow" />
      <h1>_smoke</h1>
      <pre id="smoke-results">{`DONE_${passed}_OF_${total}
RESULTS_BEGIN
${results.map((r) => `${r.name}: ${r.status} ${r.detail}`).join('\n')}
RESULTS_END`}</pre>
      <div id="smoke-complete" data-passed={passed} data-total={total} />
    </main>
  )
}
