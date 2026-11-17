import { test, expect, type Page } from '@playwright/test'
import { runDemoAction } from './demoActions'

/**
 * Catch-up Phase 25: the lock at AUTHORISED (US-04.3.5, US-07.3.1, US-08.4.4)
 * and each Contract's history (US-04.1.3). Authorise Dr Souter's Mon 20 Jul AM
 * List from Review: the lock glyph in the Contract column and "(locked)" on
 * the rate; the Booking's "Contract locked at authorise" badge; the invoice's
 * Locked record card and "Regenerate from locked data" saying identical after
 * a Contract edit; the Contract's History tab with the edit and the Procedures
 * locked against it.
 */

const S3_AM = 'L-34821-2026-07-20-AM'

async function authoriseS3Am(page: Page): Promise<void> {
  await page.goto(`/admin/review/${S3_AM}`)
  await page.waitForLoadState('networkidle')
  await page.getByRole('button', { name: 'Authorise for billing' }).first().click()
  await page.waitForTimeout(200)
  await page.getByRole('button', { name: 'Authorise for billing' }).last().click()
  await expect(page.getByText('List authorised · locked for billing')).toBeVisible()
}

test('Review after authorise: the lock glyph on each Contract and the locked rate', async ({ page }) => {
  await authoriseS3Am(page)
  await expect(page.locator('[data-shot="procedure-contract-locked"]').first()).toBeVisible()
  await expect(page.locator('[data-shot="review-list-rate"]')).toHaveText('@ $26.50/unit (locked)')
  await expect(page.locator('[data-shot="review-locked-payee"]').first()).toContainText('Paid to Dr Melanie Souter')
  await page.screenshot({ path: 'visual/shots/p25-01-review-locked.png', fullPage: true })
})

test('the locked Booking shows the badge and a read-only office setup from the lock', async ({ page }) => {
  await authoriseS3Am(page)
  await page.goto('/admin/day/2026-07-20/bookings/BK0023')
  await page.waitForLoadState('networkidle')
  await expect(page.locator('[data-shot="booking-lock-badge"]').first()).toContainText('Contract locked at authorise')
  await expect(page.locator('[data-shot="office-billing-setup-1"]')).toHaveAttribute('data-locked', 'true')
  await expect(page.getByRole('button', { name: 'Change price' })).toHaveCount(0)
  await page.locator('[data-shot="booking-lock-badge"]').first().scrollIntoViewIfNeeded()
  await page.screenshot({ path: 'visual/shots/p25-02-booking-lock-badge.png', fullPage: true })
})

test('the invoice prints from its recipe: the Locked record card, and Regenerate says identical', async ({ page }) => {
  await authoriseS3Am(page)
  await page.goto('/admin/invoices')
  await page.waitForLoadState('networkidle')
  await page.getByRole('button', { name: 'View →' }).first().click()
  await page.waitForTimeout(300)
  const card = page.locator('[data-shot="invoice-locked-record"]')
  await expect(card).toBeVisible()
  await expect(card).toContainText('Paid to')
  await expect(card).toContainText('Dr Melanie Souter')
  const message = await runDemoAction(page, 'regenerate-invoice', { close: true })
  expect(message).toMatch(/^Regenerated from locked data: identical \(\d+ lines?, total \$[\d,.]+\)$/)
  await expect(page.locator('[data-shot="invoice-regenerated"]')).toHaveAttribute('data-identical', 'true')
  await card.scrollIntoViewIfNeeded()
  await page.screenshot({ path: 'visual/shots/p25-03-invoice-locked-record.png', fullPage: true })
})

test("a Contract's History tab: its audited edits and the Procedures locked against it", async ({ page }) => {
  await authoriseS3Am(page)
  await page.goto('/admin/masters?view=contracts')
  await page.waitForLoadState('networkidle')
  await page.locator('tr[data-contract="CT-FORTE-D1"] td').first().click()
  await page.waitForTimeout(300)
  await page.locator('[data-shot="contract-tab-history"]').click()
  const history = page.locator('[data-shot="contract-history"]')
  await expect(history).toBeVisible()
  await expect(history.locator('[data-shot="contract-locked-row"]').first()).toBeVisible()
  await page.screenshot({ path: 'visual/shots/p25-04-contract-history.png', fullPage: true })
})
