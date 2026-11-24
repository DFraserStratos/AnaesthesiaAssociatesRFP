import { expect, test, type Page } from '@playwright/test'

/**
 * Catch-up Phase 43a (US-13.5.3, PWA first): a fresh handset. Runs under the
 * `pwa-device` project (iPhone 14 Pro on the PWA server) with empty storage,
 * so the PWA opens on its sign-in screen.
 * Apart from `pwa-device.spec.ts`, whose tests start signed in.
 */

test.use({ storageState: { cookies: [], origins: [] } })

const DEEP_BOOKING = '/mobile/lists/L-34821-2026-07-21-PM/bookings/BK0009'

async function settle(page: Page, ms = 400): Promise<void> {
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(ms)
}

async function bottomOf(page: Page, selector: string): Promise<number> {
  const box = await page.locator(selector).boundingBox()
  return box === null ? 0 : box.y + box.height
}

test('opens on the sign-in screen, pre-filled; the inline messages; Sign in lands where it opened and survives a reload', async ({ page }) => {
  await page.goto('/mobile/lists')
  await settle(page)
  const screen = page.locator('[data-shot="sign-in-screen"]')
  await expect(screen).toBeVisible()
  await expect(page.getByLabel('Email')).toHaveValue('m.souter@aa-associates.example')
  await expect(page.getByLabel('Password')).toHaveAttribute('type', 'password')
  await expect(page.getByLabel('Password')).not.toHaveValue('')
  await expect(page.locator('[data-shot="sign-in-provisional"]')).toBeVisible()
  await page.screenshot({ path: 'visual/shots/pwa-43a-sign-in.png' })

  await page.getByLabel('Password').fill('')
  await page.locator('[data-shot="sign-in-submit"]').click()
  await expect(page.getByText('Enter your password')).toBeVisible()
  await page.getByLabel('Password').fill('demo')
  await page.getByLabel('Email').fill('someone@else.example')
  await page.locator('[data-shot="sign-in-submit"]').click()
  await expect(page.getByText('No account with that email. Use the demo account.')).toBeVisible()
  await page.getByLabel('Email').fill('m.souter@aa-associates.example')
  await page.getByLabel('Password').press('Enter')
  await expect(screen).toHaveCount(0)
  await expect(page).toHaveURL(/\/mobile\/lists$/)

  // The Demo chip on Lists offers the app-wide Sign out.
  await page.locator('[data-shot="pwa-demo-actions"]').click()
  await expect(page.locator('[data-shot="pwa-demo-action-pwa-sign-out"]')).toBeVisible()
  await page.keyboard.press('Escape')

  await page.reload()
  await settle(page)
  await expect(screen).toHaveCount(0)
})

test('a deep link survives sign-in; the PWA Reset keeps the session; the Demo chip signs out', async ({ page }) => {
  await page.goto(DEEP_BOOKING)
  await settle(page)
  await expect(page.locator('[data-shot="sign-in-screen"]')).toBeVisible()
  // The sign-in card clears the top inset and the dock floor.
  expect(await bottomOf(page, '[data-shot="sign-in-submit"]')).toBeLessThanOrEqual(page.viewportSize()!.height)
  await page.locator('[data-shot="sign-in-submit"]').click()
  await expect(page).toHaveURL(new RegExp(`${DEEP_BOOKING}$`))
  await expect(page.locator('[data-shot="procedure-stack"]').first()).toBeVisible()

  // The PWA's own Reset (More, Demo panel) leaves the handset signed in.
  await page.goto('/mobile/more')
  await settle(page)
  await page.getByRole('button', { name: 'Reset demo data' }).click()
  await page.getByRole('button', { name: 'Confirm reset' }).click()
  await settle(page, 600)
  await page.reload()
  await settle(page)
  await expect(page.locator('[data-shot="sign-in-screen"]')).toHaveCount(0)

  // The Demo chip's Sign out returns to the sign-in screen; then it reads Already signed out.
  await page.locator('[data-shot="pwa-demo-actions"]').click()
  const row = page.locator('[data-shot="pwa-demo-action-pwa-sign-out"]')
  await row.getByRole('button', { name: 'Run' }).click()
  await expect(row.getByRole('status')).toContainText('Signed out. Tap Sign in to come back.')
  await expect(row.getByRole('button', { name: 'Run' })).toBeDisabled()
  await expect(row).toContainText('Already signed out')
  await page.keyboard.press('Escape')
  await expect(page.locator('[data-shot="sign-in-screen"]')).toBeVisible()
  await expect(page.getByLabel('Email')).toHaveValue('m.souter@aa-associates.example')
})
