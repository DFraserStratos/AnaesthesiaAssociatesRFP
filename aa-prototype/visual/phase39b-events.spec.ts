import { expect, test, type Page } from '@playwright/test'
import { runDemoAction } from './demoActions'

/**
 * Catch-up Phase 39b: pre-op, post-op and billing events. Stage post-op gives
 * Dr Souter a submitted ACL reconstruction (Coral Bennett, Wed 15 Jul PM, St
 * George's ACC); she adds a post-op ward review and a billing event on the
 * web Booking detail; the office reviews them in Review's Events tab (the ward
 * review priced at the Contract's rate), authorises the List, and the
 * Procedure's invoice carries them as their own dated lines; then a pain
 * consult on the invoiced Booking takes the Contract fee and is its own
 * invoice in the next run. The Contract's page shows the Event fees.
 */

/** The staged Booking, reached as the doc says: 38a's search for Bennett, the Wed 15 Jul result (the List's id is a runtime one). */
async function openBennett(page: Page, app: 'web' | 'mobile') {
  await page.goto(`/${app}/lists?q=Bennett`)
  const results = page.locator(app === 'web' ? '[data-shot="web-lookback-search"] tr[data-booking-id]' : '[data-shot="mobile-lookback-search"] button[data-booking-id]')
  await results.filter({ hasText: '18 Nov' }).first().click()
  await expect(page.locator('[data-shot="procedure-events"]').first()).toBeVisible()
}

/** The staged List's runtime id, from the open Booking's URL. */
function listIdOf(page: Page): string {
  return /\/lists\/([^/]+)\/bookings\//.exec(page.url())?.[1] ?? ''
}

let LIST = ''

async function authorise(page: Page) {
  await page.goto(`/admin/lists/to-authorise/${LIST}`)
  await page.getByRole('button', { name: 'Authorise for billing' }).first().click()
  await page.waitForTimeout(200)
  await page.getByRole('button', { name: 'Authorise for billing' }).last().click()
  await expect(page.getByText('List authorised · locked for billing')).toBeVisible()
}

test('events through review onto the Procedure invoice, then an own invoice in the next run', async ({ page }) => {
  // A long flow across three apps and a billing run: past the 30 s default under a parallel run.
  test.setTimeout(90_000)
  await page.goto('/web/lists')
  await page.waitForLoadState('networkidle')
  expect(await runDemoAction(page, 'stage-post-op', { close: true })).toContain('Staged')

  // The anaesthetist adds a post-op ward review (30 min) and a $180.00 billing event: no calculation shown.
  await openBennett(page, 'web')
  LIST = listIdOf(page)
  await page.locator('[data-shot="add-pre-post-op-event"]').first().click()
  const sheet = page.locator('[data-shot="add-event-sheet"]')
  await expect(sheet).toContainText('The office prices the time at review.')
  await expect(sheet).toContainText('Reviewed by the office, then billed in the next run.')
  await sheet.getByText('Post-op ward review').click()
  await sheet.locator('[data-shot="add-event-save"]').click()
  const ward = page.locator('[data-shot="procedure-event-row"][data-kind="postOp"]')
  await expect(ward).toContainText('Post-op ward review')
  await expect(ward).toContainText('30 min')
  await expect(ward).not.toContainText('$')

  await page.locator('[data-shot="add-billing-event"]').first().click()
  const billing = page.locator('[data-shot="add-billing-event-sheet"]')
  await billing.locator('input[data-shot="billing-event-description"]').fill('Nerve catheter')
  await billing.locator('input[data-shot="billing-event-amount"]').fill('180')
  await billing.locator('[data-shot="add-billing-event-save"]').click()
  await expect(page.locator('[data-shot="procedure-event-row"][data-kind="billing"]')).toContainText('$180.00')

  // The office reviews both in the Events tab: the ward review shows the calculation.
  await page.goto('/admin/finances/payments')
  const queue = page.locator('[data-shot="admin-events-queue"]')
  await expect(queue).toContainText('30 min · 2 time units x $25.00 Contract rate = $50.00')
  for (const kind of ['postOp', 'billing']) {
    await queue.locator(`tr[data-kind="${kind}"]`, { hasText: 'Coral Bennett' }).click()
    const review = page.locator('[data-shot="event-review-sheet"]')
    await review.locator('[data-shot="event-review-approve"]').click()
    await expect(review).toContainText('Approved. Invoiced in the next billing run.')
    await page.keyboard.press('Escape')
  }

  // Authorise: the run bundles both onto the Procedure's invoice as their own dated lines.
  await authorise(page)
  // The tab opens on Unpaid, oldest first (build plan Phase 62): today's invoice is on its last page, so the search pins the patient's.
  await page.goto('/admin/finances/invoices?q=Bennett')
  await expect(page.locator('[data-shot="invoice-list-event-lines"]')).toContainText('+2 event lines')
  await page.locator('[data-shot="invoice-list-event-lines"]').first().click()
  const lines = page.locator('[data-shot="invoice-event-lines"]')
  await expect(lines).toHaveCount(2)
  await expect(lines.nth(0)).toContainText('Post-op event · Post-op ward review · 19 Nov 2026 · 30 min')
  await expect(lines.nth(1)).toContainText('Billing event · Nerve catheter · 18 Nov 2026')

  // A pain consult on the invoiced Booking: the Contract fee replaces its time, and it is its own invoice.
  await openBennett(page, 'web')
  await page.locator('[data-shot="add-pre-post-op-event"]').first().click()
  await sheet.getByText('Pain consult').click()
  await sheet.locator('[data-shot="add-event-save"]').click()
  await page.goto('/admin/finances/payments')
  await expect(queue).toContainText('Contract fee STGACC-PAIN · $120.00 replaces 30 min')
  await queue.locator('tr[data-kind="postOp"]', { hasText: 'Pain consult' }).click()
  await page.locator('[data-shot="event-review-approve"]').click()
  await page.keyboard.press('Escape')
  await page.goto('/admin/finances/billing')
  expect(await runDemoAction(page, 'run-next-billing-run', { close: true })).toMatch(/AA-2026-\d{4}/)
  await page.goto('/admin/finances/invoices?q=Bennett')
  await page.locator('[data-shot="invoice-list-kind"][data-kind="additional"]').first().click()
  await expect(page.locator('[data-shot="invoice-additional-of"]')).toContainText('Post-op event · relates to AA-2026-')
})

test('the phone: the two add buttons and the bottom sheet with the ACC presets', async ({ page }) => {
  await page.goto('/mobile/lists')
  await page.waitForLoadState('networkidle')
  expect(await runDemoAction(page, 'stage-post-op', { close: true })).toContain('Staged')
  await openBennett(page, 'mobile')
  await expect(page.locator('[data-shot="add-billing-event"]').first()).toBeVisible()
  await page.locator('[data-shot="add-pre-post-op-event"]').first().click()
  const sheet = page.locator('[data-shot="add-event-sheet"]')
  await sheet.getByText('Pre-op', { exact: true }).click()
  await sheet.getByText('ACC pre-op assessment').click()
  await expect(sheet.locator('[data-shot="acc-preop-preset"]')).toHaveCount(3)
  // OQ-12's open-question caption is the office's (catch-up Phase 43a).
  await expect(sheet).not.toContainText('OQ-12')
})

test("the Contract page's Event fees on St George's ACC", async ({ page }) => {
  await page.goto('/admin/contracts')
  await page.waitForLoadState('networkidle')
  await page.locator('[data-shot=contract-search] input').fill('ACC elective')
  await page.locator('tr[data-contract="CT-STG-ACC"]').getByRole('button', { name: /^Open / }).click()
  await expect(page).toHaveURL(/\/admin\/contracts\/CT-STG-ACC$/)
  await page.locator('[data-shot=contract-tab-eventFees]').click()
  const fees = page.locator('[data-shot=contract-detail] [data-shot="contract-event-fees"]')
  await expect(fees).toContainText('STGACC-PAIN')
  await expect(fees).toContainText('$120.00')
})
