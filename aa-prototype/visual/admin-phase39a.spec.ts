import { expect, test, type Page } from '@playwright/test'
import { runDemoAction } from './demoActions'

/**
 * Catch-up Phase 39a: the weekly payment cycle on the Billing monitor (open,
 * closed with an anomaly, a held line, approved and paid), a run's record with
 * its payment schedule, a remittance advice with a netted negative invoice,
 * the anaesthetist ledger's still-to-net caption, the invoice's "Paid out in
 * Week 30", and web Accounts' Remittances. Shots land in `visual/shots/`
 * (gitignored).
 */

async function monitor(page: Page): Promise<void> {
  await page.goto('/admin/billing')
  await page.waitForLoadState('networkidle')
}

async function payWeek(page: Page): Promise<string> {
  await page.locator('[data-shot="payment-cycle-close"]').click()
  await page.locator('[data-shot="payment-cycle-approve"]').click()
  await page.locator('[data-shot="payment-cycle-send"]').click()
  await page.locator('[data-shot="billing-run-payables-in-xero"]').click()
  await expect(page.locator('[data-shot="billing-payables-result"]')).toContainText('Week 30 paid in Xero')
  const runId = await page.locator('[data-shot="payables-runs"] tbody tr').first().getAttribute('data-run-id')
  expect(runId).not.toBeNull()
  return runId!
}

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
})

test('the payment cycle opens on Week 30 with nothing waiting and Week 29 paid and seeded', async ({ page }) => {
  await monitor(page)
  const panel = page.locator('[data-shot="payment-cycle"]')
  await expect(panel).toContainText('Payment cycle · Week 30 · 20 Jul to 26 Jul 2026')
  await expect(panel).toContainText('Planned Friday 24 Jul')
  await expect(panel).toContainText('Planned Monday 27 Jul')
  await expect(panel).toContainText('Planned Tuesday 28 Jul')
  await expect(panel).not.toContainText(/provisional/i)
  await expect(page.locator('[data-shot="payables-run-draft"]')).toContainText("Nothing is waiting for this week's run.")
  await expect(page.locator('[data-shot="payment-cycle-close"]')).toBeDisabled()
  const first = page.locator('[data-shot="payables-runs"] tbody tr').first()
  await expect(first).toContainText('Week 29')
  await expect(first).toContainText('Paid')
  await expect(first).toContainText('Seeded')
  await panel.scrollIntoViewIfNeeded()
  await panel.screenshot({ path: 'visual/shots/a39a-01-cycle-open.png' })
})

test('an anomaly held out rolls into Week 31; approve, send and run pay the rest', async ({ page }) => {
  await monitor(page)
  expect(await runDemoAction(page, 'stage-payment-week', { choice: 'bctis', close: true })).toContain('19 payables released for Dr Sharma into Week 30')
  expect(await runDemoAction(page, 'stage-bank-mismatch', { close: true })).toContain('The bank download is missing the receipt')
  await page.locator('[data-shot="payment-cycle-close"]').click()
  const checks = page.locator('[data-shot="payment-cycle-anomalies"]')
  await expect(checks).toContainText('Receipt not on the bank download')
  await expect(page.locator('[data-shot="payment-cycle-approve"]')).toBeDisabled()
  await page.locator('[data-shot="payment-cycle-anomalies"]').screenshot({ path: 'visual/shots/a39a-02-anomaly.png' })
  await page.locator('[data-shot="payment-cycle-hold-anomaly"]').first().click()
  await expect(page.locator('[data-shot="payment-cycle-held"]')).toContainText('Rolls into Week 31')
  await page.locator('[data-shot="payment-cycle"]').screenshot({ path: 'visual/shots/a39a-03-held.png' })
  await page.locator('[data-shot="payment-cycle-approve"]').click()
  await page.locator('[data-shot="payment-cycle-send"]').click()
  await page.locator('[data-shot="billing-run-payables-in-xero"]').click()
  await expect(page.locator('[data-shot="billing-payables-result"]')).toContainText('Week 30 paid in Xero: 18 BCTIs')
  await expect(page.locator('[data-shot="payment-cycle"]')).toContainText('Payment cycle · Week 31')
  await expect(page.locator('[data-shot="payment-cycle-rolled"]')).toContainText('Rolled from Week 30')
  await page.locator('[data-shot="payment-cycle"]').screenshot({ path: 'visual/shots/a39a-04-paid.png' })
})

test('netting: 19 BCTIs and a credit after payout; the run detail, schedule, remittance advice and ledger', async ({ page }) => {
  await monitor(page)
  expect(await runDemoAction(page, 'stage-payment-week', { choice: 'withCredit', close: true })).toContain('A negative invoice of -$365.70 is waiting to be netted.')
  await expect(page.locator('[data-shot="payables-run-draft"]')).toContainText('-$365.70')
  const runId = await payWeek(page)

  await page.goto(`/admin/billing/payment-runs/${runId}`)
  await expect(page.locator('[data-shot="payables-run-detail"]')).toContainText('Paid')
  const schedule = page.locator('[data-shot="payment-schedule"]')
  await expect(schedule).toContainText('PAYMENT SCHEDULE · Week 30')
  await expect(schedule).toContainText('Sent to the accountant')
  await schedule.scrollIntoViewIfNeeded()
  await page.screenshot({ path: 'visual/shots/a39a-05-run-detail.png' })

  await page.goto(`/admin/billing/payment-runs/${runId}/remittance/41267`)
  const advice = page.locator('[data-shot="remittance-advice"]')
  await expect(advice).toContainText('REMITTANCE ADVICE')
  await expect(advice).toContainText('Week 30, 2026')
  await expect(advice.locator('[data-shot="remittance-netted"]')).toContainText('-$365.70')
  await expect(advice.locator('[data-shot="remittance-netted"]')).toContainText(/Negative invoice CN-2026-\d+-P · credit of AA-2026-PP20/)
  await expect(advice.locator('[data-shot="remittance-still-to-net"]')).toHaveCount(0)
  await page.screenshot({ path: 'visual/shots/a39a-06-remittance.png' })

  await page.goto('/admin/invoices/PPINV01')
  await expect(page.locator('[data-shot="payment-week"]')).toContainText('Paid out in Week 30')

  await page.goto('/admin/ledger/anaesthetists/41267')
  await expect(page.locator('[data-shot="ledger-payment-runs"]')).toContainText('Week 30')
  await expect(page.locator('[data-shot="ledger-still-to-net"]')).toHaveCount(0)
})

test('Stage refund after payout pays out through a one-bill staged run the office approved (no back door)', async ({ page }) => {
  await page.goto('/admin/review/L-41267-2026-07-14-AM')
  await page.waitForLoadState('networkidle')
  await runDemoAction(page, 'stage-post-op', { close: true })
  await monitor(page)
  expect(await runDemoAction(page, 'stage-refund-after-payout', { close: true })).toContain('approved for payment and paid out to Dr Sharma')
  // A staged one-bill run, paid.
  await expect(page.locator('[data-shot="payables-runs"] tbody tr').first()).toContainText('Staged')
})

test('web Accounts · Remittances lists Dr Souter\'s weekly runs and opens an advice', async ({ page }) => {
  await page.goto('/web/accounts/remittances')
  await page.waitForLoadState('networkidle')
  const table = page.locator('[data-shot="web-remittances"]')
  await expect(table.locator('tbody tr').first()).toContainText('Week 29')
  await page.screenshot({ path: 'visual/shots/w39a-01-remittances.png' })
  await table.locator('tbody tr').first().click()
  const sheet = page.locator('[data-shot="web-remittance-sheet"]')
  await expect(sheet).toContainText('REMITTANCE ADVICE')
  await expect(sheet).toContainText('Week 29, 2026')
  await page.waitForTimeout(400)
  await page.screenshot({ path: 'visual/shots/w39a-02-remittance-sheet.png' })
})
