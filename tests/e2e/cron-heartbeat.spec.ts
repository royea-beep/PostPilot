import { test, expect } from '@playwright/test'

test.describe('cron heartbeat (after() fix verification)', () => {
  test('GET /api/publish-scheduled returns 200 with Bearer secret', async ({ request }) => {
    const secret = process.env.CRON_SECRET
    test.skip(!secret, 'CRON_SECRET not set - skipping live cron probe')

    const res = await request.get('/api/publish-scheduled', {
      headers: { Authorization: `Bearer ${secret}` },
    })
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body).toHaveProperty('processed')
  })

  test('heartbeat lands in empire-hq error_logs within 10s', async ({ request }) => {
    const secret = process.env.CRON_SECRET
    const supaUrl = process.env.NEXT_PUBLIC_BUG_REPORTER_SUPABASE_URL
    const supaKey = process.env.NEXT_PUBLIC_BUG_REPORTER_SUPABASE_KEY
    test.skip(
      !secret || !supaUrl || !supaKey,
      'CRON_SECRET / supabase URL / KEY not all set - skipping log roundtrip test'
    )

    const start = new Date()
    await request.get('/api/publish-scheduled', {
      headers: { Authorization: `Bearer ${secret}` },
    })

    let found = false
    for (let i = 0; i < 5 && !found; i++) {
      await new Promise((r) => setTimeout(r, 2000))
      const since = encodeURIComponent(start.toISOString())
      const url =
        `${supaUrl}/rest/v1/error_logs` +
        `?project_slug=eq.postpilot` +
        `&level=eq.info` +
        `&route=eq./api/publish-scheduled` +
        `&created_at=gte.${since}` +
        `&select=id,message,created_at&order=created_at.desc&limit=5`
      const res = await request.get(url, {
        headers: { apikey: supaKey!, Authorization: `Bearer ${supaKey}` },
      })
      if (res.ok()) {
        const rows = await res.json()
        if (Array.isArray(rows) && rows.length > 0) {
          found = true
          break
        }
      }
    }
    expect(found, 'expected a heartbeat row in empire-hq error_logs within 10s').toBe(true)
  })
})
