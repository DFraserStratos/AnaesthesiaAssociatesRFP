import { expect, test } from '@playwright/test'
import { runDemoAction } from './demoActions'

/**
 * Catch-up Phase 38b: events on a Procedure and the additional invoice. The
 * seeded event (Dr Souter's additional invoice on David Chen's HP03, awaiting
 * review) shows on Admin, web and mobile; the office creates one on Sarah
 * Mitchell's staged Procedure, reviews it in Review's Events tab, runs the
 * next billing run, and the new invoice links both ways to the original.
 * The anaesthetist apps are Dr Souter's alone, so Dr Sharma's own route is
 * proven by the store and component tests.
 */

const CHEN_ADMIN = '/admin/day/2026-10-26/bookings/HBK03'
const MITCHELL_ADMIN = '/admin/day/2026-11-17/bookings/BK0032'
const SHARMA_TUE14 = 'L-41267-2026-11-17-AM'

test('the seeded event: Admin, web and mobile, with the office and the anaesthetist views', async ({ page }) => {
  await page.goto(CHEN_ADMIN)
  const events = page.locator('[data-shot="procedure-events"]').first()
  await expect(events).toBeVisible()
  const row = events.locator('[data-shot="procedure-event-row"]')
  await expect(row).toHaveCount(1)
  await expect(row).toContainText('Additional invoice')
  await expect(row).toContainText('Post-op ward review, Tue 27 Oct, 20 min')
  await expect(row).toContainText('$85.00')
  await expect(row).toContainText('Raised by Dr Souter')
  await expect(row).toContainText("St George's")
  await expect(row.locator('[data-shot="procedure-event-status"]')).toHaveText('Awaiting review')
  for (const shot of ['procedure-event-review', 'procedure-event-edit', 'procedure-event-remove']) await expect(row.locator(`[data-shot="${shot}"]`)).toBeVisible()
  await expect(page.locator('[data-shot="booking-total"]')).toContainText('Events')

  await page.goto('/web/lists/L-HIST-03/bookings/HBK03')
  const webRow = page.locator('[data-shot="procedure-event-row"]')
  await expect(webRow).toContainText('Raised by you')
  await expect(webRow).toContainText('$85.00')
  await expect(webRow.locator('[data-shot="procedure-event-review"]')).toHaveCount(0)
  await expect(webRow.locator('[data-shot="procedure-event-edit"]')).toBeVisible()
  await expect(page.locator('[data-shot="booking-total-gst"]')).toHaveCount(0)

  await page.goto('/mobile/lists/L-HIST-03/bookings/HBK03')
  await expect(page.locator('[data-shot="procedure-event-row"]')).toContainText('Raised by you')
})

test('a Booking with no events: the add controls on the owner\'s apps, the empty line on Admin', async ({ page }) => {
  await page.goto('/admin/day/2026-11-24/bookings/BK0001')
  await expect(page.locator('[data-shot="procedure-events"]').first()).toContainText('No events on this Procedure yet.')
  await page.goto('/web/lists/L-34821-2026-11-24-AM/bookings/BK0001')
  await expect(page.locator('[data-shot="procedure-block"]').first()).toBeVisible()
  // Catch-up Phase 39b: the section now always shows on the owner's Procedure, so the add buttons have a home; no event rows.
  await expect(page.locator('[data-shot="procedure-event-row"]')).toHaveCount(0)
  await expect(page.locator('[data-shot="add-pre-post-op-event"]').first()).toBeVisible()
})

test('the office creates, reviews and runs an additional invoice; it links both ways', async ({ page }) => {
  await page.goto(`/admin/review/${SHARMA_TUE14}`)
  await page.waitForLoadState('networkidle')
  expect(await runDemoAction(page, 'stage-post-op', { close: true })).toContain('Staged')

  await page.goto(MITCHELL_ADMIN)
  const button = page.locator('[data-shot="additional-invoice-button"]').first()
  await expect(button).toHaveText('Create additional invoice')
  await button.click()
  const sheet = page.locator('[data-shot="additional-invoice-sheet"]')
  await expect(sheet).toContainText('Additional to AA-2026-')
  await expect(sheet.locator('[data-shot="event-same-as"]')).toBeVisible()
  await sheet.locator('input[data-shot="line-description"]').fill('Post-op ward review, Wed 18 Nov, 15 min')
  await sheet.locator('input[data-shot="line-amount"]').fill('30')
  await expect(sheet.locator('[data-shot="additional-invoice-totals"]')).toContainText('$34.50')
  await sheet.locator('[data-shot="additional-invoice-save"]').click()
  const row = page.locator('[data-shot="procedure-event-row"]').first()
  await expect(row).toContainText('Raised by the office')
  await expect(row.locator('[data-shot="procedure-event-status"]')).toHaveText('Awaiting review')

  await page.goto('/admin/review?tab=events')
  const queue = page.locator('[data-shot="admin-events-queue"]')
  await expect(queue.locator('tr')).toHaveCount(2)
  await queue.locator('tr', { hasText: 'Sarah Mitchell' }).click()
  const review = page.locator('[data-shot="event-review-sheet"]')
  await expect(review).toContainText('$34.50')
  await review.locator('[data-shot="event-review-approve"]').click()
  await expect(review).toContainText('Approved. Invoiced in the next billing run.')
  await page.keyboard.press('Escape')

  // Build plan Phase 58: the events awaiting the run sit on Finances · Payments; the run itself is Billing's trigger.
  await page.goto('/admin/finances/payments')
  await expect(page.locator('[data-shot="events-awaiting-run"]')).toContainText('Sarah Mitchell')
  await page.locator('[data-shot="finances-tabs"] [data-finances-tab="billing"]').click()
  await expect(page).toHaveURL(/\/admin\/finances\/billing/)
  expect(await runDemoAction(page, 'run-next-billing-run', { close: true })).toMatch(/^Billing run done: 1 additional invoice raised \(AA-2026-\d{4}\)\.$/)
  await page.locator('[data-shot="finances-tabs"] [data-finances-tab="payments"]').click()
  await expect(page).toHaveURL(/\/admin\/finances\/payments/)
  await expect(page.locator('[data-shot="events-awaiting-run"]')).toHaveCount(0)

  await page.goto('/admin/finances/invoices')
  const additional = page.locator('[data-shot="invoice-list-kind"][data-kind="additional"]')
  await expect(additional).toHaveCount(1)
  await expect(page.locator('[data-shot="invoice-list-additional-to"]')).toContainText('Additional to AA-2026-')
  await additional.click()
  await expect(page.locator('[data-shot="invoice-additional-of"]')).toContainText('Additional invoice · relates to AA-2026-')
  await expect(page.locator('[data-shot="invoice-additional-links"]')).toBeVisible()
  await page.locator('[data-shot="invoice-additional-of"] a').first().click()
  await expect(page.locator('[data-shot="invoice-additional-links"]')).toContainText('Raised by the office')
})

test("Dr Souter creates an additional invoice on her own invoiced Procedure: a dialog on web, a bottom sheet on the phone", async ({ page }) => {
  await page.goto('/web/lists/L-HIST-03/bookings/HBK03')
  const raise = page.locator('[data-shot="additional-invoice-button"]').first()
  await expect(raise).toHaveText('Create additional invoice')
  await raise.click()
  const sheet = page.locator('[data-shot="additional-invoice-sheet"]')
  await expect(sheet).toContainText('Additional to AA-2026-H03')
  await sheet.locator('input[data-shot="line-description"]').fill('Nerve catheter review, Wed 28 Oct')
  await sheet.locator('input[data-shot="line-amount"]').fill('45')
  await sheet.locator('[data-shot="additional-invoice-save"]').click()
  const mine = page.locator('[data-shot="procedure-event-row"]', { hasText: 'Nerve catheter review' })
  await expect(mine).toContainText('Raised by you')
  await expect(mine.locator('[data-shot="procedure-event-status"]')).toHaveText('Awaiting review')

  await page.goto('/mobile/lists/L-HIST-03/bookings/HBK03')
  await page.locator('[data-shot="additional-invoice-button"]').first().click()
  await expect(page.locator('[data-shot="additional-invoice-sheet"]')).toBeVisible()
  await expect(page.locator('[data-shot="additional-invoice-sheet"]')).toContainText('Same as the original invoice')
})
