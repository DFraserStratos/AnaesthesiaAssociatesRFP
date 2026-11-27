import { expect, test } from '@playwright/test'
import { runDemoAction } from './demoActions'

/**
 * Catch-up Phase 14 — the harness bar's "Demo actions" menu: scoped to its
 * screen, absent where a screen has nothing to offer, and acting on the entity
 * in the URL (a part payment on the invoice page moves that invoice's money).
 */

test('demo actions: none on Lists › To authorise, eleven on the Day view, three on Finances · Billing, five on Xero, three on Payments', async ({ page }) => {
  // "Run the next billing run" left the old Review queue with its events, for Finances › Payments (US-13.3.3).
  await page.goto('/admin/lists/to-authorise')
  await page.waitForLoadState('networkidle')
  await expect(page.locator('[data-lists-page="to-authorise"]')).toBeVisible()
  await expect(page.locator('[data-shot="demo-actions"]')).toHaveCount(0)

  // The Day view carries the sample warnings (catch-up Phase 15a), Simulate sickness (catch-up Phase 30), Add Draft List for this day (catch-up Phase 31), Colleague moves a List to the office (catch-up Phase 32) and Colleague hands a Booking to Dr Souter (catch-up Phase 32a), Move to 2 days before procedure and Add prepaid Booking (catch-up Phase 27), Inject unmatched receipt for the Reconciliation card (catch-up Phase 37), Switch office user (catch-up Phase 35) and Load full-scale data (catch-up Phase 43).
  await page.goto('/admin/day/2026-11-24')
  await page.waitForLoadState('networkidle')
  await expect(page.locator('[data-shot="demo-actions"]')).toHaveAccessibleName('Demo actions for this screen, 11')
  await expect(page.locator('[data-shot="demo-action-inject-unmatched-receipt"]')).toHaveCount(0)
  await page.locator('[data-shot="demo-actions"]').click()
  await expect(page.locator('[data-shot="demo-action-inject-unmatched-receipt"]')).toBeVisible()
  await page.keyboard.press('Escape')

  // Build plan Phase 58 re-homed the Billing monitor's ten entries across the Finances tabs (D111).
  // Finances · Billing keeps its entries with its filters in the URL (catch-up Phase 37).
  await page.goto('/admin/finances/billing?anaesthetist=34821&problems=1&sort=date-asc')
  await page.waitForLoadState('networkidle')
  await expect(page.locator('[data-shot="demo-actions"]')).toHaveAccessibleName('Demo actions for this screen, 3')

  await page.goto('/admin/finances/billing')
  await page.waitForLoadState('networkidle')
  const pill = page.locator('[data-shot="demo-actions"]')
  await expect(pill).toHaveAccessibleName('Demo actions for this screen, 3')
  await pill.focus()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('dialog')).toBeVisible()
  for (const id of ['billing-failure', 'run-next-billing-run', 'payer-loses-billing-email']) {
    await expect(page.locator(`[data-shot="demo-action-${id}"]`)).toBeVisible()
  }
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect(pill).toBeFocused()

  // Finances · Xero: the hand-off fault, the outage pair and the two jobs.
  await page.goto('/admin/finances/xero')
  await page.waitForLoadState('networkidle')
  await expect(pill).toHaveAccessibleName('Demo actions for this screen, 5')
  await pill.click()
  for (const id of ['arm-handoff-fault', 'xero-outage-start', 'xero-outage-restore', 'run-reconciliation-poll', 'run-archive-job']) {
    await expect(page.locator(`[data-shot="demo-action-${id}"]`)).toBeVisible()
  }
  await page.keyboard.press('Escape')

  // Finances · Payments: the payment week and the bank mismatch (catch-up Phase 39a), and the billing run its waiting events go out in.
  await page.goto('/admin/finances/payments')
  await page.waitForLoadState('networkidle')
  await expect(pill).toHaveAccessibleName('Demo actions for this screen, 3')
  await pill.click()
  for (const id of ['run-next-billing-run', 'stage-payment-week', 'stage-bank-mismatch']) {
    await expect(page.locator(`[data-shot="demo-action-${id}"]`)).toBeVisible()
  }
  await page.keyboard.press('Escape')
  // The screen's own "Run payables in Xero" panel (badged Simulated Xero, not a registry entry) is untouched.
  await expect(page.locator('[data-shot="billing-payables-run"]')).toBeVisible()
})

test('demo actions: a half payment from an invoice page moves that invoice\'s money chip', async ({ page }) => {
  // Authorise Dr Souter's Mon 20 AM List so its invoices reach Xero.
  await page.goto('/admin/lists/to-authorise/L-34821-2026-11-23-AM')
  await page.waitForLoadState('networkidle')
  await page.getByRole('button', { name: 'Authorise for billing' }).first().click()
  await page.getByRole('button', { name: 'Authorise for billing' }).last().click()
  await expect(page.locator('[data-shot="review-delivery-summary"]')).toHaveText(/invoices? raised\./)

  // The Control Panel index's Open screen lands on an open invoice.
  await page.goto('/demo/control')
  await page.waitForLoadState('networkidle')
  await page.locator('[data-shot="index-payment-half"]').getByRole('button', { name: /Open screen/ }).click()
  await expect(page).toHaveURL(/\/admin\/finances\/invoices\//)

  const chips = page.locator('[data-shot="invoice-money-states"]')
  await expect(chips).toBeVisible()
  const before = await chips.textContent()
  expect(await runDemoAction(page, 'payment-half')).toMatch(/^Webhook for AA-2026-\d{4}: .* authorised for exactly /)
  expect(await runDemoAction(page, 'payment-replay')).toMatch(/^Duplicate webhook ignored/)
  await page.keyboard.press('Escape')
  await expect(chips).not.toHaveText(before ?? '')
})
