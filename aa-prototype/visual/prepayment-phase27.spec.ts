import { expect, test } from '@playwright/test'
import { runDemoAction } from './demoActions'
import { keepSignedInScript } from './storage/demoReady'

// The PWA opens signed out on a fresh handset (catch-up Phase 43a); these PWA tests clear storage, so the session is re-seeded on each load.
test.beforeEach(async ({ context }) => {
  await context.addInitScript(keepSignedInScript)
})

/**
 * Catch-up Phase 27: prepayment from a prepaid Contract. Admin: the rail's
 * Pre-payments card, Riley's panel awaiting approval (no amount field, no raise
 * button), the Invoices strip with its approval switch, Approve and send, a
 * half payment from the Booking detail; two payers giving two strip rows; the
 * clock jump turning the warning strong. Mobile: Nair's panel and units row
 * (paid), read-only. PWA: the office stand-in approving Riley's.
 */

const RILEY = 'BK0034'
const RILEY_LIST = 'L-34821-2026-11-27-AM'
const NAIR = 'BK0038'
const NAIR_LIST = 'L-34821-2026-11-27-PM'
const PWA = process.env['PWA_URL'] ?? `http://localhost:${process.env['AA_PWA_PORT'] ?? 5174}`

test('admin: rail card, Riley awaiting approval, Approve and send, then part paid from the Booking', async ({ page }) => {
  await page.goto('/admin/day/2026-11-24')
  await page.waitForLoadState('networkidle')
  // The Pre-payments tile opens its rows under the rail's two readings.
  await page.locator('[data-shot="rail-prepayments"]').click()
  const rail = page.locator('[data-shot="rail-prepayments-detail"]')
  await expect(rail).toBeVisible()
  const rileyRow = rail.locator(`[data-shot="rail-prepayment-row"][data-booking-id="${RILEY}"]`)
  await expect(rileyRow).toContainText('Annette Riley')
  await expect(rileyRow).toContainText('Awaiting approval')
  await expect(rileyRow).toContainText('$1,200.00')
  await expect(rileyRow).toContainText('In 3 days')
  await expect(rail.locator(`[data-shot="rail-prepayment-row"][data-booking-id="${NAIR}"]`)).toContainText('Paid')
  await rail.screenshot({ path: 'visual/shots/p27-01-rail-prepayments.png' })

  await page.goto(`/admin/day/2026-11-27/bookings/${RILEY}`)
  const panel = page.locator('[data-shot="booking-prepayment"][data-prepayment-status]')
  await expect(panel).toContainText('Pre-payment awaiting approval')
  await expect(panel).toContainText('Rhinoplasty')
  await expect(panel).toContainText('$1,200.00 plus GST')
  await expect(panel.locator('[data-shot="prepayment-approve-link"]')).toBeVisible()
  await expect(panel.locator('input')).toHaveCount(0)
  await expect(page.getByRole('button', { name: /Raise pre-procedure invoice/ })).toHaveCount(0)
  await expect(page.getByText(/deposit|estimate/i)).toHaveCount(0)
  await page.screenshot({ path: 'visual/shots/p27-02-admin-riley-panel.png', fullPage: true })

  // Approve on Invoices leads to the strip.
  await panel.locator('[data-shot="prepayment-approve-link"]').click()
  await expect(page).toHaveURL(/\/admin\/invoices$/)
  const strip = page.locator('[data-shot="invoices-awaiting-approval"]')
  await expect(strip.getByRole('switch', { name: 'Prepayment approval' })).toHaveAttribute('aria-checked', 'true')
  const row = strip.locator(`[data-shot="awaiting-approval-row"][data-booking-id="${RILEY}"]`)
  await expect(row).toContainText('Annette Riley')
  await expect(row).toContainText('$1,200.00')
  await strip.screenshot({ path: 'visual/shots/p27-03-invoices-strip.png' })
  await row.locator('[data-shot="approve-and-send"]').click()
  // Catch-up Phase 41: Approve and send opens the letter dialog; its own button sends.
  await page.locator('[data-shot="prepayment-letter-send"]').click()
  await expect(strip.locator('[data-shot="approve-and-send-result"]')).toContainText('AA Holding account')
  await expect(row).toHaveCount(0)

  // Half a payment, from the Booking detail.
  await page.goto(`/admin/day/2026-11-27/bookings/${RILEY}`)
  const paid = await runDemoAction(page, 'payment-half', { close: true })
  expect(paid).toContain('$690.00')
  await expect(page.locator('[data-shot="booking-prepayment"][data-prepayment-status]')).toContainText('Pre-payment part paid · $690.00 of $1,380.00 received')
  await page.screenshot({ path: 'visual/shots/p27-04-admin-riley-part-paid.png', fullPage: true })
})

test('admin: two payers give two strip rows; approving one leaves the other', async ({ page }) => {
  await page.goto('/admin/day/2026-11-24')
  await page.waitForLoadState('networkidle')
  const added = await runDemoAction(page, 'add-prepaid-booking', { choice: 'two-payers', close: true })
  expect(added).toContain('2 payers await approval')
  await page.goto('/admin/invoices')
  const strip = page.locator('[data-shot="invoices-awaiting-approval"]')
  const rows = strip.locator('[data-shot="awaiting-approval-row"]')
  await expect(rows).toHaveCount(3)
  await expect(strip).toContainText('Ian Gray')
  await expect(strip).toContainText('$900.00')
  await strip.screenshot({ path: 'visual/shots/p27-05-invoices-two-payers.png' })
  await rows.filter({ hasText: 'Ian Gray' }).locator('[data-shot="approve-and-send"]').click()
  await page.locator('[data-shot="prepayment-letter-send"]').click()
  await expect(rows).toHaveCount(2)
  await expect(rows.filter({ hasText: 'Fiona Gray' })).toHaveCount(1)
})

test('admin: switching approval off confirms, and the next prepaid Booking is sent at once', async ({ page }) => {
  await page.goto('/admin/invoices')
  await page.waitForLoadState('networkidle')
  const strip = page.locator('[data-shot="invoices-awaiting-approval"]')
  await strip.getByRole('switch', { name: 'Prepayment approval' }).click()
  await page.locator('[data-shot="prepayment-approval-off-confirm"]').click()
  await expect(strip.getByRole('switch', { name: 'Prepayment approval' })).toHaveAttribute('aria-checked', 'false')
  // Riley's was ready, so it went now.
  await expect(strip.locator('[data-shot="awaiting-approval-row"]')).toHaveCount(0)
  await page.goto('/admin/day/2026-11-24')
  const added = await runDemoAction(page, 'add-prepaid-booking', { choice: 'one-payer', close: true })
  expect(added).toContain('sent at once')
})

test('admin: the warning turns strong two days before', async ({ page }) => {
  await page.goto(`/admin/day/2026-11-27/bookings/${RILEY}`)
  await page.waitForLoadState('networkidle')
  const moved = await runDemoAction(page, 'prepayment-two-days-before', { close: true })
  expect(moved).toContain('Wed 25 Nov')
  await expect(page.locator('[data-shot="booking-warnings"]')).toContainText('Strong')
  await page.screenshot({ path: 'visual/shots/p27-06-admin-riley-strong.png', fullPage: true })
})

test('mobile (framed): Nair, paid, read-only panel and units row', async ({ page }) => {
  await page.goto(`/mobile/lists/${NAIR_LIST}/bookings/${NAIR}`)
  await page.waitForLoadState('networkidle')
  const slide = page.locator('[data-testid="slide-booking"]')
  const panel = slide.locator('[data-shot="booking-prepayment"][data-prepayment-status]')
  await expect(panel).toContainText('Pre-payment received')
  await expect(panel).not.toContainText('Septoplasty')
  await expect(panel.locator('[data-shot="prepayment-approve-link"]')).toHaveCount(0)
  await expect(slide.locator('[data-shot="capture-prepaid"]')).toContainText('Prepaid $1,200.00 · paid')
  await panel.screenshot({ path: 'visual/shots/p27-07-mobile-nair-panel.png' })
  await slide.locator('[data-shot="capture-prepaid"]').scrollIntoViewIfNeeded()
  await page.screenshot({ path: 'visual/shots/p27-08-mobile-nair-units.png' })
})

test.describe('phone (PWA, 375 x 812)', () => {
  test.use({ viewport: { width: 375, height: 812 }, hasTouch: true, isMobile: true })

  test('the office stand-in approves and sends Riley\'s prepayment', async ({ page }) => {
    await page.goto(`${PWA}/mobile/lists/${RILEY_LIST}/bookings/${RILEY}`)
    await page.waitForLoadState('networkidle')
    const panel = page.locator('[data-testid="slide-booking"] [data-shot="booking-prepayment"][data-prepayment-status]')
    await expect(panel).toContainText('Pre-payment awaiting approval')
    await page.locator('[data-shot="pwa-demo-actions"]').click()
    const action = page.locator('[data-shot="pwa-demo-action-pwa-office-approves-prepayment"]')
    await expect(action).toContainText('Office stand-in')
    await action.getByRole('button', { name: 'Run' }).click()
    await expect(action.getByRole('status')).toContainText('$1,380.00')
    await page.keyboard.press('Escape')
    await expect(panel).toContainText('Pre-payment unpaid')
    await page.screenshot({ path: 'visual/shots/p27-09-pwa-stand-in.png' })
  })
})
