import { test, expect } from '@playwright/test'

const ROUTES = ['/', '/register', '/login', '/billing', '/dashboard', '/platforms', '/analytics']

for (const route of ROUTES) {
  test(`no console errors on ${route}`, async ({ page }) => {
    const errors: string[] = []
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })
    page.on('pageerror', (err) => errors.push(`pageerror: ${err.message}`))

    await page.goto(route, { waitUntil: 'networkidle' })

    // /dashboard, /billing, /platforms, /analytics may redirect to /login when not authed.
    // That's fine — we still want zero console errors during that flow.
    const realErrors = errors.filter((e) => !/_vercel|favicon|analytics|401|403/i.test(e))
    expect(realErrors, `errors on ${route}: ${realErrors.join('\n')}`).toEqual([])
  })
}

test('GET /api/status returns 200', async ({ request }) => {
  const res = await request.get('/api/status')
  expect(res.status()).toBe(200)
  const body = await res.json()
  expect(body.status).toBe('ok')
})
