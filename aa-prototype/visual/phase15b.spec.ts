import { expect, test } from '@playwright/test'
import { runDemoAction } from './demoActions'

/**
 * Catch-up Phase 15b: Copy a Booking is gone from all three apps (US-02.4.3
 * Retired), and Add a booking opens straight on the manual form (photo capture
 * is Future Work, US-02.4.4), reachable only through the badged demo action on
 * the mobile List.
 */

const LIST = 'L-34821-2026-07-21-PM'
const ELLISON = 'BK0009'

test('no Booking detail offers Copy booking, on mobile, web or Admin', async ({ page }) => {
  for (const path of [`/mobile/lists/${LIST}/bookings/${ELLISON}`, `/web/lists/${LIST}/bookings/${ELLISON}`, `/admin/day/2026-07-21/bookings/${ELLISON}`]) {
    await page.goto(path)
    await page.waitForLoadState('networkidle')
    await expect(page.getByRole('button', { name: 'Cancel booking' }).first(), path).toBeVisible()
    await expect(page.getByRole('button', { name: /Copy booking/ }), path).toHaveCount(0)
    await expect(page.getByText(/Copied from another Booking/), path).toHaveCount(0)
  }
  // Add another procedure stays, the one way to add a Procedure for the same patient.
  await page.goto(`/mobile/lists/${LIST}/bookings/${ELLISON}`)
  await page.waitForLoadState('networkidle')
  await expect(page.getByRole('button', { name: 'Add another procedure' })).toBeVisible()
})

test('Add a booking opens on the manual form on mobile and web, with no photo choice', async ({ page }) => {
  for (const path of [`/mobile/lists/${LIST}`, `/web/lists/${LIST}`]) {
    await page.goto(path)
    await page.waitForLoadState('networkidle')
    await page.getByRole('button', { name: /Add a booking/ }).first().click()
    const sheet = page.getByRole('dialog')
    await expect(sheet.getByRole('heading', { name: 'Add a booking' }), path).toBeVisible()
    await expect(sheet.getByLabel('Name'), path).toBeVisible()
    await expect(sheet.getByText('Photo of paper list'), path).toHaveCount(0)
    await expect(sheet.getByText('Enter manually'), path).toHaveCount(0)
    await expect(sheet.getByRole('button', { name: 'Back to Add a booking' }), path).toHaveCount(0)
    await page.screenshot({ path: `visual/shots/p15b-add-booking-${path.startsWith('/web') ? 'web' : 'mobile'}.png` })
  }
})

test('the Future-scope photo demo opens the badged photo prong on the mobile List', async ({ page }) => {
  await page.goto(`/mobile/lists/${LIST}`)
  await page.waitForLoadState('networkidle')
  expect(await runDemoAction(page, 'photo-capture-future', { close: true })).toBe('Photo capture opened on this List (Future scope).')
  const sheet = page.getByRole('dialog')
  await expect(sheet.getByText('Future scope')).toBeVisible()
  await expect(sheet.getByText('Photo of the paper list')).toBeVisible()
  await expect(sheet.getByRole('heading', { name: 'Add a booking' })).toHaveCount(0)
  await page.screenshot({ path: 'visual/shots/p15b-photo-future-scope.png' })
})
