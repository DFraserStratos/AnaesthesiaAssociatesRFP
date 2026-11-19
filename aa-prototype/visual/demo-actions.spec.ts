import { expect, test } from '@playwright/test'
import { runDemoAction } from './demoActions'

/**
 * Catch-up Phase 14 — the harness bar's "Demo actions" menu: scoped to its
 * screen, absent where a screen has nothing to offer, and acting on the entity
 * in the URL (a part payment on the invoice page moves that invoice's money).
 */

test('demo actions: one on the Review queue, ten on the Day view, seven on the Billing monitor', async ({ page }) => {
  // The Review queue holds "Run the next billing run" (catch-up Phase 38b).
  await page.goto('/admin/review')
  await page.waitForLoadState('networkidle')
  await expect(page.locator('[data-shot="demo-actions"]')).toHaveAccessibleName('Demo actions for this screen, 1')

  // The Day view carries the sample warnings (catch-up Phase 15a), Simulate sickness (catch-up Phase 30), Add Draft List for this day (catch-up Phase 31), Colleague moves a List to the office (catch-up Phase 32) and Colleague hands a Booking to Dr Souter (catch-up Phase 32a), Move to 2 days before procedure and Add prepaid Booking (catch-up Phase 27), Inject unmatched receipt for the Reconciliation card (catch-up Phase 37), and Switch office user (catch-up Phase 35).
  await page.goto('/admin/day/2026-07-21')
  await page.waitForLoadState('networkidle')
  await expect(page.locator('[data-shot="demo-actions"]')).toHaveAccessibleName('Demo actions for this screen, 10')
  await expect(page.locator('[data-shot="demo-action-inject-unmatched-receipt"]')).toHaveCount(0)
  await page.locator('[data-shot="demo-actions"]').click()
  await expect(page.locator('[data-shot="demo-action-inject-unmatched-receipt"]')).toBeVisible()
  await page.keyboard.press('Escape')

  // The Billing monitor keeps its entries with its filters in the URL (catch-up Phase 37).
  await page.goto('/admin/billing?anaesthetist=34821&problems=1&sort=date-asc')
  await page.waitForLoadState('networkidle')
  await expect(page.locator('[data-shot="demo-actions"]')).toHaveAccessibleName('Demo actions for this screen, 7')

  await page.goto('/admin/billing')
  await page.waitForLoadState('networkidle')
  const pill = page.locator('[data-shot="demo-actions"]')
  await expect(pill).toHaveAccessibleName('Demo actions for this screen, 7')
  await pill.focus()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('dialog')).toBeVisible()
  for (const id of ['billing-failure', 'arm-handoff-fault', 'xero-outage-start', 'xero-outage-restore', 'run-reconciliation-poll', 'run-archive-job', 'run-next-billing-run']) {
    await expect(page.locator(`[data-shot="demo-action-${id}"]`)).toBeVisible()
  }
  // The screen's own "Run payables in Xero" panel (badged Simulated Xero, not a registry entry) is untouched.
  await expect(page.locator('[data-shot="billing-payables-run"]')).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect(pill).toBeFocused()
})

test('demo actions: a half payment from an invoice page moves that invoice\'s money chip', async ({ page }) => {
  // Authorise Dr Souter's Mon 20 AM List so its invoices reach Xero.
  await page.goto('/admin/review/L-34821-2026-07-20-AM')
  await page.waitForLoadState('networkidle')
  await page.getByRole('button', { name: 'Authorise for billing' }).first().click()
  await page.getByRole('button', { name: 'Authorise for billing' }).last().click()
  await expect(page.locator('[data-shot="review-delivery-summary"]')).toHaveText(/invoices? raised\./)

  // The Control Panel index's Open screen lands on an open invoice.
  await page.goto('/demo/control')
  await page.waitForLoadState('networkidle')
  await page.locator('[data-shot="index-payment-half"]').getByRole('button', { name: /Open screen/ }).click()
  await expect(page).toHaveURL(/\/admin\/invoices\//)

  const chips = page.locator('[data-shot="invoice-money-states"]')
  await expect(chips).toBeVisible()
  const before = await chips.textContent()
  expect(await runDemoAction(page, 'payment-half')).toMatch(/^Webhook for AA-2026-\d{4}: .* authorised for exactly /)
  expect(await runDemoAction(page, 'payment-replay')).toMatch(/^Duplicate webhook ignored/)
  await page.keyboard.press('Escape')
  await expect(chips).not.toHaveText(before ?? '')
})
