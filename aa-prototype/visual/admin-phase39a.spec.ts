import { expect, test, type Page } from '@playwright/test'
import { runDemoAction } from './demoActions'

/**
 * Catch-up Phase 39a: the weekly payment cycle on Finances · Payments (open,
 * closed with an anomaly, a held line, approved and paid), a run's record with
 * its payment schedule, a remittance advice with a netted negative invoice,
 * the anaesthetist ledger's still-to-net caption, the invoice's "Paid out in
 * Week 30", and web Accounts' Remittances. Shots land in `visual/shots/`
 * (gitignored). Build plan Phase 58 moved the cycle from the Billing monitor to
 * the Payments tab, and Stage refund after payout to the invoice's page only.
 */

async function monitor(page: Page): Promise<void> {
  await page.goto('/admin/finances/payments')
  await page.waitForLoadState('networkidle')
}

/**
 * Each step waits for the panel to show it done before the next: at practice scale
 * the monitor re-renders slowly, and a click on the next step's stale render is lost.
 */
async function approveAndSend(page: Page): Promise<void> {
  const panel = page.locator('[data-shot="payment-cycle"]')
  await page.locator('[data-shot="payment-cycle-approve"]').click()
  await expect(panel).toContainText(/Approved \w{3} \d+ \w{3}/)
  await page.locator('[data-shot="payment-cycle-send"]').click()
  await expect(panel).toContainText(/Sent \w{3} \d+ \w{3}/)
}

async function payWeek(page: Page): Promise<string> {
  await page.locator('[data-shot="payment-cycle-close"]').click()
  await expect(page.locator('[data-shot="payment-cycle"]')).toContainText(/Closed \w{3} \d+ \w{3}/)
  await approveAndSend(page)
  await page.locator('[data-shot="billing-run-payables-in-xero"]').click({ timeout: 90_000 })
  await expect(page.locator('[data-shot="billing-payables-result"]')).toContainText('Week 48 paid in Xero')
  const runId = await page.locator('[data-shot="payables-runs"] tbody tr').first().getAttribute('data-run-id')
  expect(runId).not.toBeNull()
  return runId!
}

test.beforeEach(async ({ page }) => {
  // Run payables in Xero pays the whole practice's week (about 1,600 BCTIs) in one synchronous
  // step: about 16 s on a quiet machine, more under the full parallel run.
  test.setTimeout(120_000)
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
})

test('the payment cycle opens on Week 48 with the practice waiting and Week 47 paid and seeded', async ({ page }) => {
  await monitor(page)
  const panel = page.locator('[data-shot="payment-cycle"]')
  await expect(panel).toContainText('Payment cycle · Week 48 · 23 Nov to 29 Nov 2026')
  await expect(panel).toContainText('Planned Friday 27 Nov')
  await expect(panel).toContainText('Planned Monday 30 Nov')
  await expect(panel).toContainText('Planned Tuesday 1 Dec')
  await expect(panel).not.toContainText(/provisional/i)
  // The whole practice's released BCTIs already wait for this week's run, so the week can be closed.
  await expect(page.locator('[data-shot="payables-run-draft"]')).toContainText("Waiting for this week's run")
  await expect(page.locator('[data-shot="payment-cycle-close"]')).toBeEnabled()
  const first = page.locator('[data-shot="payables-runs"] tbody tr').first()
  await expect(first).toContainText('Week 47')
  await expect(first).toContainText('Paid')
  await expect(first).toContainText('Seeded')
  await panel.scrollIntoViewIfNeeded()
  await panel.screenshot({ path: 'visual/shots/a39a-01-cycle-open.png' })
})

test('an anomaly held out rolls into Week 49; approve, send and run pay the rest', async ({ page }) => {
  await monitor(page)
  expect(await runDemoAction(page, 'stage-payment-week', { choice: 'bctis', close: true })).toContain('19 payables released for Dr Sharma into Week 48')
  expect(await runDemoAction(page, 'stage-bank-mismatch', { close: true })).toContain('The bank download is missing the receipt')
  await page.locator('[data-shot="payment-cycle-close"]').click()
  const checks = page.locator('[data-shot="payment-cycle-anomalies"]')
  await expect(checks).toContainText('Receipt not on the bank download')
  await expect(page.locator('[data-shot="payment-cycle-approve"]')).toBeDisabled()
  await page.locator('[data-shot="payment-cycle-anomalies"]').screenshot({ path: 'visual/shots/a39a-02-anomaly.png' })
  await page.locator('[data-shot="payment-cycle-hold-anomaly"]').first().click()
  await expect(page.locator('[data-shot="payment-cycle-held"]')).toContainText('Rolls into Week 49')
  await page.locator('[data-shot="payment-cycle"]').screenshot({ path: 'visual/shots/a39a-03-held.png' })
  await approveAndSend(page)
  await page.locator('[data-shot="billing-run-payables-in-xero"]').click({ timeout: 90_000 })
  await expect(page.locator('[data-shot="billing-payables-result"]')).toContainText('Week 48 paid in Xero: 1615 BCTIs') // the practice's 1,597 and Dr Sharma's 19, less the one held
  await expect(page.locator('[data-shot="payment-cycle"]')).toContainText('Payment cycle · Week 49')
  await expect(page.locator('[data-shot="payment-cycle-rolled"]')).toContainText('Rolled from Week 48')
  await page.locator('[data-shot="payment-cycle"]').screenshot({ path: 'visual/shots/a39a-04-paid.png' })
})

test('netting: 19 BCTIs and a credit after payout; the run detail, schedule, remittance advice and ledger', async ({ page }) => {
  await monitor(page)
  expect(await runDemoAction(page, 'stage-payment-week', { choice: 'withCredit', close: true })).toContain('A negative invoice of -$365.70 is waiting to be netted.')
  await expect(page.locator('[data-shot="payables-run-draft"]')).toContainText('-$365.70')
  const runId = await payWeek(page)

  await page.goto(`/admin/finances/payments/${runId}`)
  await expect(page.locator('[data-shot="payables-run-detail"]')).toContainText('Paid')
  const schedule = page.locator('[data-shot="payment-schedule"]')
  await expect(schedule).toContainText('PAYMENT SCHEDULE · Week 48')
  await expect(schedule).toContainText('Sent to the accountant')
  await schedule.scrollIntoViewIfNeeded()
  await page.screenshot({ path: 'visual/shots/a39a-05-run-detail.png' })

  await page.goto(`/admin/finances/payments/${runId}/remittance/41267`)
  const advice = page.locator('[data-shot="remittance-advice"]')
  await expect(advice).toContainText('REMITTANCE ADVICE')
  await expect(advice).toContainText('Week 48, 2026')
  await expect(advice.locator('[data-shot="remittance-netted"]')).toContainText('-$365.70')
  await expect(advice.locator('[data-shot="remittance-netted"]')).toContainText(/Negative invoice CN-2026-\d+-P · credit of AA-2026-PP20/)
  await expect(advice.locator('[data-shot="remittance-still-to-net"]')).toHaveCount(0)
  await page.screenshot({ path: 'visual/shots/a39a-06-remittance.png' })

  await page.goto('/admin/finances/invoices/PPINV01')
  await expect(page.locator('[data-shot="payment-week"]')).toContainText('Paid out in Week 48')

  await page.goto('/admin/finances/ledger/anaesthetists/41267')
  // A rail row per run, its title the week (build plan Phase 65); newest first, so Week 48 is among the first three.
  await expect(page.locator('[data-shot="ledger-payment-runs"] li[data-run-id] a', { hasText: 'Week 48' }).first()).toBeVisible()
  await expect(page.locator('[data-shot="ledger-still-to-net"]')).toHaveCount(0)
})

test('Stage refund after payout pays out through a one-bill staged run the office approved (no back door)', async ({ page }) => {
  await page.goto('/admin/review/L-41267-2026-11-17-AM')
  await page.waitForLoadState('networkidle')
  await runDemoAction(page, 'stage-post-op', { close: true })
  // The entry lives on the invoice's page: the Control Panel's Open screen lands on Sarah Mitchell's invoice.
  await page.waitForTimeout(400)
  await page.goto('/demo/control')
  await page.waitForLoadState('networkidle')
  await page.locator('[data-shot="index-stage-refund-after-payout"]').first().getByRole('button', { name: /Open screen/ }).click()
  await expect(page).toHaveURL(/\/admin\/finances\/invoices\/[^/]+$/)
  await page.waitForLoadState('networkidle')
  expect(await runDemoAction(page, 'stage-refund-after-payout', { close: true })).toContain('approved for payment and paid out to Dr Sharma')
  // A staged one-bill run, paid, on Payments.
  await monitor(page)
  await expect(page.locator('[data-shot="payables-runs"] tbody tr').first()).toContainText('Staged')
})

test('web Accounts · Remittances lists Dr Souter\'s weekly runs and opens an advice', async ({ page }) => {
  await page.goto('/web/accounts/remittances')
  await page.waitForLoadState('networkidle')
  const table = page.locator('[data-shot="web-remittances"]')
  await expect(table.locator('tbody tr').first()).toContainText('Week 47')
  await page.screenshot({ path: 'visual/shots/w39a-01-remittances.png' })
  await table.locator('tbody tr').first().click()
  const sheet = page.locator('[data-shot="web-remittance-sheet"]')
  await expect(sheet).toContainText('REMITTANCE ADVICE')
  await expect(sheet).toContainText('Week 47, 2026')
  await page.waitForTimeout(400)
  await page.screenshot({ path: 'visual/shots/w39a-02-remittance-sheet.png' })
})
