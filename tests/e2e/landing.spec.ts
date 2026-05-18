import { test, expect } from '@playwright/test'

test.describe('landing', () => {
  test('loads with hero + 4 CTAs + footer; no console errors', async ({ page }) => {
    const consoleErrors: string[] = []
    page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()) })

    await page.goto('/', { waitUntil: 'networkidle' })

    await expect(page.getByRole('heading', { level: 1 })).toContainText('AI Captions That Sound Like Your Brand')

    const ctas = page.getByRole('link', { name: /Start Free|Get started/i })
    expect(await ctas.count()).toBeGreaterThanOrEqual(4)

    await expect(page.locator('footer')).toContainText(/Built by Roy/i)

    // Ignore Vercel analytics 404s and other expected noise; only fail on real app errors.
    const realErrors = consoleErrors.filter((e) => !/_vercel|favicon|analytics/i.test(e))
    expect(realErrors, `console errors: ${realErrors.join('\n')}`).toEqual([])
  })
})
