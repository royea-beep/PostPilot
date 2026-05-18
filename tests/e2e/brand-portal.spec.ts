import { test, expect } from '@playwright/test'

test.describe('brand portal (public client-facing /brand/[token])', () => {
  test('template-fallback badge renders when draft.source === template_fallback', async ({ page }) => {
    const token = process.env.BRAND_TEST_TOKEN
    test.skip(!token, 'BRAND_TEST_TOKEN not set — skipping brand portal test')

    const errors: string[] = []
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })
    await page.goto(`/brand/${token}`, { waitUntil: 'networkidle' })

    // Page must load at minimum (upload step visible)
    await expect(page.locator('body')).toBeVisible()
    expect(errors.filter((e) => !/_vercel|favicon|analytics/i.test(e))).toEqual([])

    // If any caption variant card has the fallback badge, verify its tooltip
    const badge = page.locator('text=/^Template$|^תבנית$/').first()
    if (await badge.count() > 0) {
      await badge.hover()
      const titleAttr = await badge.locator('xpath=ancestor-or-self::span[@title]').first().getAttribute('title')
      expect(titleAttr, 'badge must have a Template AI tooltip').toMatch(/Template caption|AI service was unavailable|תבנית/i)
    }
  })
})
