import { expect, test, type Page } from '@playwright/test'
import { runDemoAction } from './demoActions'

/**
 * Catch-up Phase 39: credit notes, credit in full and rebill, the combined
 * split and the anaesthetist's credit note. The office corrects Sarah
 * Mitchell's staged invoice (38b's Stage post-op scenario on Dr Sharma's Tue
 * 14 Jul AM List): the Correct this invoice rail, the credit sheet in both
 * modes, the copy of the original's lines, the pending original, review and
 * the next billing run, the credit note document with its negative invoice
 * card, the credited original, the Xero pair with its credit note and the
 * Audit viewer filtered to creditNote. The split runs on the staged Merivale
 * combination (`stage-combined-procedure`): Left to allocate at a mismatch and
 * at $0.00, then one split component's document line. Dr Souter credits her
 * own invoiced HBK03 on web and mobile (reached through search in the app;
 * opened by URL here). Shots land in `visual/shots/` (gitignored).
 */

const MITCHELL_ADMIN = '/admin/day/2026-11-17/bookings/BK0032'
const SHARMA_TUE14 = 'L-41267-2026-11-17-AM'
const SOUTER_WEB_HBK03 = '/web/lists/L-HIST-03/bookings/HBK03'
const SOUTER_MOBILE_HBK03 = '/mobile/lists/L-HIST-03/bookings/HBK03'

async function stagePostOp(page: Page): Promise<string> {
  await page.goto(`/admin/review/${SHARMA_TUE14}`)
  await page.waitForLoadState('networkidle')
  expect(await runDemoAction(page, 'stage-post-op', { close: true })).toContain('Staged')
  await page.goto(MITCHELL_ADMIN)
  const entry = page.locator('[data-shot="procedure-credit-note-button"]').first()
  await expect(entry).toBeEnabled()
  const invoiceId = await entry.getAttribute('data-invoice-id')
  expect(invoiceId).not.toBeNull()
  return invoiceId!
}

/** Approve the oldest credit in Review's Events tab, then run the next billing run from Finances · Billing. */
async function approveAndRun(page: Page): Promise<void> {
  await page.goto('/admin/review?tab=events')
  const row = page.locator('[data-shot="admin-events-queue"] tr', { has: page.locator('[data-shot="review-credit-row"]') }).first()
  await row.click()
  const review = page.locator('[data-shot="event-review-sheet"]')
  await expect(review.locator('[data-shot="event-review-credit"]')).toBeVisible()
  await review.locator('[data-shot="event-review-approve"]').click()
  await page.keyboard.press('Escape')
  await page.goto('/admin/finances/billing')
  expect(await runDemoAction(page, 'run-next-billing-run', { close: true })).toContain('credit note')
}

test('the office credits in full and rebills from a copy: rail, both modes, pending, issued, Xero and the audit', async ({ page }) => {
  // Heavy at practice scale: under the full parallel run it can pass 30s (it passes alone).
  test.setTimeout(90_000)
  const invoiceId = await stagePostOp(page)
  await page.goto(`/admin/finances/invoices/${invoiceId}`)

  // The Correct this invoice rail card.
  const correct = page.locator('[data-shot="invoice-correct"]')
  await expect(correct).toContainText('The invoice is never edited')
  for (const shot of ['credit-note-button', 'credit-rebill-button', 'split-combined-rail-button']) await expect(correct.locator(`[data-shot="${shot}"]`)).toBeEnabled()
  await page.getByTestId('invoice-info-rail').screenshot({ path: 'visual/shots/p39-01-correct-rail.png' })

  // Credit note: no new invoices; an added card offers the copy of the original's lines.
  await correct.locator('[data-shot="credit-note-button"]').click()
  const sheet = page.locator('[data-shot="credit-sheet"]')
  await expect(sheet).toHaveAttribute('data-mode', 'credit')
  // The office sees the original's total including GST; a copy of its lines prices to it exactly.
  const originalTotal = (await sheet.locator('[data-shot="credit-original-total"]').innerText()).trim()
  await expect(sheet.locator('[data-shot="credit-money-state"]')).toContainText('Unpaid: nothing held.')
  await expect(sheet.locator('[data-shot="credit-not-refund"]')).toContainText('A credit note is not a refund.')
  await expect(sheet.locator('[data-shot="credit-replacement"]')).toHaveCount(0)
  await page.screenshot({ path: 'visual/shots/p39-02-credit-sheet.png' })
  await sheet.locator('[data-shot="credit-add-invoice"]').click()
  await sheet.locator('[data-shot="credit-copy-lines"]').click()
  await expect(sheet.locator('[data-shot="credit-replacement-totals"]')).toContainText(originalTotal)
  await page.keyboard.press('Escape')
  await expect(sheet).toHaveCount(0)

  // Credit in full and rebill: one card holding the copy, editable.
  await correct.locator('[data-shot="credit-rebill-button"]').click()
  const rebill = page.locator('[data-shot="credit-sheet"]')
  await expect(rebill).toHaveAttribute('data-mode', 'rebill')
  const card = rebill.locator('[data-shot="credit-replacement"]')
  await expect(card).toHaveCount(1)
  await expect(card.locator('input[data-shot="line-description"]').first()).not.toHaveValue('')
  await expect(card.locator('[data-shot="credit-replacement-totals"]')).toContainText(originalTotal)
  await expect(rebill.locator('[data-shot="credit-trail"]')).toContainText('Contra')
  await page.screenshot({ path: 'visual/shots/p39-03-rebill-copy-draft.png' })
  await rebill.locator('[data-shot="credit-reason-chip"]', { hasText: 'Wrong amount' }).click()
  await rebill.locator('[data-shot="credit-submit"]').click()
  await expect(rebill).toHaveCount(0)

  // The pending original.
  await expect(page.locator('[data-shot="invoice-standing"]')).toHaveAttribute('data-standing', 'creditPending')
  await expect(page.locator('[data-shot="invoice-standing"]')).toHaveText('Credit waiting for review')
  await expect(page.locator('[data-shot="invoice-correct-refusal"]')).toContainText('waiting for review')
  await page.screenshot({ path: 'visual/shots/p39-04-pending-original.png', fullPage: true })

  await approveAndRun(page)

  // The credited original, its banner and the credit note document with its negative invoice card.
  await page.goto(`/admin/finances/invoices/${invoiceId}`)
  await expect(page.locator('[data-shot="invoice-standing"]')).toHaveText('Credited')
  const banner = page.locator('[data-shot="invoice-credited-banner"]')
  await expect(banner).toContainText('Credited in full by CN-2026-')
  await expect(banner).toContainText('rebilled as AA-2026-')
  await page.screenshot({ path: 'visual/shots/p39-05-credited-original.png', fullPage: true })
  const accRecId = (await page.getByTestId('xero-accrec-reference').innerText()).trim()
  await banner.getByRole('link', { name: /^CN-2026-/ }).click()
  const doc = page.locator('[data-shot="credit-note-document"]')
  await expect(doc).toContainText('CREDIT NOTE')
  await expect(doc).toContainText('Total credited')
  await expect(page.locator('[data-shot="negative-invoice-card"]')).toContainText('-P')
  await expect(page.locator('[data-shot="negative-invoice-card"]')).toContainText('offset against the unpaid payable')
  await page.screenshot({ path: 'visual/shots/p39-06-credit-note-document.png', fullPage: true })

  // The rebill names what it rebills.
  await page.goto(`/admin/finances/invoices/${invoiceId}`)
  await page.locator('[data-shot="invoice-credited-banner"]').getByRole('link', { name: /^AA-2026-/ }).click()
  await expect(page.locator('[data-shot="invoice-rebill-of"]')).toContainText('Rebills AA-2026-')

  // The Invoices table: the credit note row and the credited original. The original reads Paid and
  // the tab opens on Unpaid, so look under All, pinned to the patient by the search: the credit note
  // rides directly above the invoice it credits.
  await page.goto('/admin/finances/invoices?show=all&q=Mitchell')
  await expect(page.locator('[data-shot="invoices-tabs"]')).toHaveAttribute('data-invoices-view', 'all')
  await expect(page.locator('[data-shot="invoice-list-kind"][data-kind="creditNote"]')).toHaveCount(1)
  await expect(page.locator('tr[data-credit-note-id] + tr [data-shot="invoice-list-standing"][data-standing="credited"]')).toHaveCount(1)
  await expect(page.locator('[data-shot="invoice-list-credits"]')).toContainText('Credits AA-2026-')
  await expect(page.locator('[data-shot="invoice-list-standing"][data-standing="credited"]')).toHaveCount(1)
  await expect(page.locator('[data-shot="invoice-list-rebills"]')).toHaveCount(1)
  await page.getByTestId('invoice-list-table-shell').screenshot({ path: 'visual/shots/p39-07-invoices-table.png' })

  // The ledger stays square after the credit (build plan Phase 64: the credit tiles left the tab for its one sentence and four figures).
  await page.goto('/admin/finances/ledger')
  await expect(page.locator('[data-shot="ledger-balance"]')).toHaveAttribute('data-in-balance', 'true')
  await expect(page.locator('[data-shot="ledger-balance"]')).toContainText('The books are square')
  await page.screenshot({ path: 'visual/shots/p39-08-ledger.png', fullPage: true })

  // The Xero pair with its credit note.
  await page.goto(`/demo/xero/invoices/${accRecId}`)
  const xcn = page.locator('[data-shot="xero-credit-note"]')
  await expect(xcn).toContainText('ACCRECCREDIT')
  await expect(xcn).toContainText('Unallocated')
  await expect(xcn.locator('[data-shot="xero-credit-new-pairs"]')).toContainText('AA-2026-')
  await page.screenshot({ path: 'visual/shots/p39-09-xero-credit-note.png', fullPage: true })

  // The Audit viewer, filtered to the credit note.
  await page.goto('/admin/audit')
  await page.getByLabel('Entity type').selectOption('creditNote')
  await expect(page.locator('body')).toContainText('Credit note raised')
  await page.screenshot({ path: 'visual/shots/p39-10-audit-credit-note.png', fullPage: true })
})

test('the combined split: Left to allocate at a mismatch and at $0.00, then a component names its part', async ({ page }) => {
  await page.goto('/admin/finances/invoices')
  await page.waitForLoadState('networkidle')
  expect(await runDemoAction(page, 'stage-combined-procedure')).toContain('Staged: a billed Merivale combination')
  await page.getByRole('link', { name: /^Open AA-2026-\d{4}$/ }).click()
  await expect(page.getByTestId('invoice-detail-workspace')).toBeVisible()
  const originalUrl = page.url()

  await page.locator('[data-shot="split-combined-rail-button"]').click()
  const sheet = page.locator('[data-shot="split-combined-sheet"]')
  await expect(sheet).toContainText('into additional invoices')
  await expect(sheet).toContainText('The new invoices must add up to the credited invoice.')
  await expect(sheet).toContainText('The original invoice is credited in full.')
  const components = sheet.locator('[data-shot="split-component"]')
  await expect(components).toHaveCount(2)
  const left = sheet.locator('[data-shot="split-left-to-allocate"]')
  await expect(left).toHaveAttribute('data-done', 'false')

  await components.nth(0).locator('input[data-shot="line-description"]').fill('Facelift')
  await components.nth(0).locator('input[data-shot="line-amount"]').fill('2000')
  await components.nth(1).locator('input[data-shot="line-description"]').fill('Blepharoplasty')
  await components.nth(1).locator('input[data-shot="line-amount"]').fill('1000')
  await expect(left).toHaveAttribute('data-done', 'false')
  await expect(sheet.locator('[data-shot="credit-submit"]')).toBeDisabled()
  await expect(sheet.locator('[data-shot="credit-submit"]')).toHaveText('Save 2 invoices for review')
  await page.screenshot({ path: 'visual/shots/p39-11-split-mismatch.png' })

  await components.nth(1).locator('[data-shot="split-put-rest"]').click()
  await expect(left).toHaveAttribute('data-done', 'true')
  await expect(left).toContainText('$0.00')
  await expect(sheet.locator('[data-shot="credit-submit"]')).toBeEnabled()
  await page.screenshot({ path: 'visual/shots/p39-12-split-allocated.png' })
  await sheet.locator('[data-shot="credit-submit"]').click()
  await expect(sheet).toHaveCount(0)

  await approveAndRun(page)
  await page.goto(originalUrl)
  await expect(page.locator('[data-shot="invoice-credited-banner"]')).toContainText('replaced by')
  await page.locator('[data-shot="invoice-credited-banner"]').getByRole('link', { name: /^AA-2026-/ }).first().click()
  await expect(page.locator('[data-shot="invoice-split-part"]')).toContainText(/Additional invoice · part 1 of 2 · replaces AA-2026-\d{4} · /)
  await page.screenshot({ path: 'visual/shots/p39-13-split-component.png', fullPage: true })
})

for (const app of ['web', 'mobile'] as const) {
  test(`Dr Souter credits her own invoiced Procedure on ${app}: the entry, the sheet and the event`, async ({ page }) => {
    await page.goto(app === 'web' ? SOUTER_WEB_HBK03 : SOUTER_MOBILE_HBK03)
    const entry = page.locator('[data-shot="anaesthetist-credit-note-button"]').first()
    await expect(entry).toHaveText('Credit note')
    await expect(page.locator('[data-shot="split-combined-button"]')).toHaveCount(0)
    await entry.scrollIntoViewIfNeeded()
    await page.screenshot({ path: `visual/shots/p39-${app}-14-credit-entry.png` })

    await entry.click()
    const form = page.locator('[data-shot="credit-form"]')
    await expect(form).toHaveAttribute('data-variant', 'anaesthetist')
    await expect(form).toContainText('AA-2026-H03')
    await expect(form).toContainText('Your payment for this invoice is reversed.')
    await expect(form).toContainText('A credit note is not a refund.')
    await expect(form).toContainText('The office reviews it, then it is issued in the next billing run.')
    for (const shot of ['credit-money-state', 'credit-trail', 'credit-copy-lines', 'split-left-to-allocate']) await expect(form.locator(`[data-shot="${shot}"]`)).toHaveCount(0)
    await page.screenshot({ path: `visual/shots/p39-${app}-15-credit-sheet.png` })

    await form.locator('[data-shot="credit-reason-chip"]', { hasText: 'Less work than expected' }).click()
    await page.locator('[data-shot="credit-submit"]').click()
    const event = page.locator('[data-shot="procedure-credit-event"]').first()
    await expect(event).toContainText('Credits AA-2026-H03 in full')
    await expect(event).toContainText('Raised by you')
    await expect(event.locator('[data-shot="procedure-event-status"]')).toHaveText('Awaiting review')
    await expect(event.locator('[data-shot="procedure-event-edit"]')).toBeVisible()
    await expect(page.locator('[data-shot="anaesthetist-credit-note-button"]').first()).toBeDisabled()
    await event.scrollIntoViewIfNeeded()
    await page.screenshot({ path: `visual/shots/p39-${app}-16-credit-event.png` })
  })
}
