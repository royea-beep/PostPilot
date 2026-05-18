import { test, expect } from '@playwright/test'

test.describe('register + login', () => {
  test('register form renders and is interactive', async ({ page }) => {
    await page.goto('/register', { waitUntil: 'networkidle' })
    await expect(page.getByPlaceholder('Your name')).toBeVisible()
    await expect(page.getByPlaceholder('Email')).toBeVisible()
    await expect(page.getByPlaceholder(/Password/)).toBeVisible()
    await expect(page.getByRole('button', { name: /Create Account/i })).toBeVisible()
  })

  test('login form renders and is interactive', async ({ page }) => {
    await page.goto('/login', { waitUntil: 'networkidle' })
    await expect(page.getByPlaceholder('Email')).toBeVisible()
    await expect(page.getByPlaceholder('Password')).toBeVisible()
    await expect(page.getByRole('button', { name: /Sign In/i })).toBeVisible()
  })

  test('end-to-end register -> dashboard (skipped without RUN_LIVE_AUTH=1)', async ({ page }) => {
    test.skip(!process.env.RUN_LIVE_AUTH, 'Live auth e2e disabled — set RUN_LIVE_AUTH=1 to enable')
    const stamp = Date.now()
    const email = `e2e+${stamp}@postpilot.test`
    const password = `Pw_e2e_${stamp}!`

    await page.goto('/register', { waitUntil: 'networkidle' })
    await page.getByPlaceholder('Your name').fill('E2E Test')
    await page.getByPlaceholder('Email').fill(email)
    await page.getByPlaceholder(/Password/).fill(password)
    await page.getByRole('button', { name: /Create Account/i }).click()
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15_000 })
  })
})
