// Smoke tests for the public, signed-out surface of GM/OS: each page renders and throws no uncaught errors.
// They catch blank-page and crash regressions that unit tests and the build can't see.
import { test, expect } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  // Skip the boot animation (BootSequence.jsx) so pages are interactive immediately.
  await page.addInitScript(() => { try { localStorage.setItem('gmos_booted', '1') } catch { /* ignore */ } })
})

/** Fails the test on any uncaught exception in the page. */
function trackErrors(page) {
  const errors = []
  page.on('pageerror', (err) => errors.push(err.message))
  return errors
}

test('landing page renders for signed-out visitors', async ({ page }) => {
  const errors = trackErrors(page)
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1, name: /Prep less/ })).toBeVisible()
  expect(errors).toEqual([])
})

test('sign-in page renders', async ({ page }) => {
  const errors = trackErrors(page)
  await page.goto('/login')
  await expect(page).toHaveTitle(/Sign in/)
  await expect(page.getByText('Sign in to GM/OS')).toBeVisible()
  expect(errors).toEqual([])
})

for (const [path, text] of [
  ['/PrivacyPolicy', /privacy/i],
  ['/Terms', /terms/i],
  ['/blog', /GM tips/],
  ['/features', /feature/i],
  ['/compare', /compar/i],
]) {
  test(`public page ${path} renders`, async ({ page }) => {
    const errors = trackErrors(page)
    await page.goto(path)
    await expect(page.locator('main, #root').first()).toContainText(text)
    expect(errors).toEqual([])
  })
}
