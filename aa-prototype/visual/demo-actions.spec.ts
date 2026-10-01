import { expect, test } from '@playwright/test'
import { runDemoAction } from './demoActions'

/**
 * Catch-up Phase 14 — the harness bar's "Demo actions" menu: scoped to its
 * screen, absent where a screen has nothing to offer, and acting on the entity
 * in the URL (a part payment on the invoice page moves that invoice's money).
 */

test('demo actions: absent on the Day view, four entries on the Billing monitor', async ({ page }) => {
  await page.goto('/admin/day/2026-07-21')
  await page.waitForLoadState('networkidle')
  await expect(page.locator('[data-shot="demo-actions"]')).toHaveCount(0)

  await page.goto('/admin/billing')
  await page.waitForLoadState('networkidle')
  const pill = page.locator('[data-shot="demo-actions"]')
  await expect(pill).toHaveAccessibleName('Demo actions for this screen, 4')
  await pill.focus()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('dialog')).toBeVisible()
  for (const id of ['billing-failure', 'arm-handoff-fault', 'run-reconciliation-poll', 'run-archive-job']) {
    await expect(page.locator(`[data-shot="demo-action-${id}"]`)).toBeVisible()
  }
  // The screen's own product "Run payables" button is untouched.
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
  await expect(page.getByText(/invoices? raised by the billing run/)).toBeVisible()

  // The Control Panel index's Open screen lands on an open invoice.
  await page.goto('/demo/control')
  await page.waitForLoadState('networkidle')
  await page.locator('[data-shot="index-payment-half"]').getByRole('button', { name: /Open screen/ }).click()
  await expect(page).toHaveURL(/\/admin\/invoices\//)

  const chips = page.locator('[data-shot="invoice-money-states"]')
  await expect(chips).toBeVisible()
  const before = await chips.textContent()
  expect(await runDemoAction(page, 'payment-half')).toMatch(/^Webhook applied/)
  expect(await runDemoAction(page, 'payment-replay')).toMatch(/^Duplicate webhook ignored/)
  await page.keyboard.press('Escape')
  await expect(chips).not.toHaveText(before ?? '')
})
