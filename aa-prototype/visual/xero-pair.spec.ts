import { expect, test } from '@playwright/test'

test('S3: the nib invoice opens its routed ACCREC and ACCPAY pair', async ({ page }) => {
  test.setTimeout(60_000)
  const consoleErrors: string[] = []
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text())
  })
  page.on('pageerror', (error) => consoleErrors.push(error.message))

  // Stage both S3 Lists from a clean reset.
  await page.goto('/demo/control')
  await page.waitForLoadState('networkidle')
  const scenario = page.locator('[data-scenario="S3"]')
  await scenario.getByRole('button', { name: 'Jump', exact: true }).click()
  await scenario.getByRole('button', { name: 'Confirm jump' }).click()
  // Beat 1's link opens the Mon 20 Jul AM List on Admin Review (catch-up Phase 44).
  await scenario.getByRole('button', { name: 'Beat 1 · Admin Review' }).click()
  await expect(page).toHaveURL(/\/admin\/lists\/to-authorise\/L-34821-2026-11-23-AM$/)

  // Authorise the Forte AM List and the St George's PM List.
  await page.getByRole('button', { name: /^Lists/ }).first().click()
  await page.locator('[data-lists-tab="to-authorise"]').click()
  // Mon 20 Jul: catch-up Phase 23 seeds a second Souter Forte List (Mon 13 Jul AM) in the queue.
  const forteRow = page.getByRole('row').filter({ hasText: /Dr Melanie Souter/ }).filter({ hasText: /Forte Health/ }).filter({ hasText: /23 Nov/i })
  await forteRow.getByRole('button', { name: /^Review / }).click()
  await page.getByRole('button', { name: 'Authorise for billing' }).first().click()
  await page.getByRole('button', { name: 'Authorise for billing' }).last().click()
  await expect(page.getByText('List authorised · locked for billing')).toBeVisible()

  await page.getByRole('button', { name: /^Lists/ }).first().click()
  await page.locator('[data-lists-tab="to-authorise"]').click()
  const stgRow = page.getByRole('row').filter({ hasText: /Dr Melanie Souter/ }).filter({ hasText: /St George's/ })
  await stgRow.getByRole('button', { name: /^Review / }).click()
  await page.getByRole('button', { name: 'Authorise for billing' }).first().click()
  await page.getByRole('button', { name: 'Authorise for billing' }).last().click()
  await expect(page.getByText('List authorised · locked for billing')).toBeVisible()

  // The Xero row is now an explicit route-backed drill-down.
  await page.goto('/demo/xero/invoices')
  await page.waitForLoadState('networkidle')
  const nibRow = page.getByRole('row').filter({ hasText: 'nib' }).filter({ hasText: '$152.38' })
  await expect(nibRow).toHaveCount(1)
  const tableWidths = await page.getByTestId('xero-invoice-table-shell').evaluate((element) => ({
    client: element.clientWidth,
    scroll: element.scrollWidth,
  }))
  expect(tableWidths.scroll).toBe(tableWidths.client)
  await nibRow.hover()
  await expect(nibRow.locator('td').first()).toHaveCSS('background-color', 'rgb(237, 241, 239)')
  await nibRow.click()
  await expect(page).toHaveURL(/\/demo\/xero\/invoices\/XR\d+$/)

  await expect(page.getByRole('heading', { name: 'AA-2026-0005', exact: true, level: 2 })).toBeVisible()
  await expect(page.getByText('Accounts receivable · ACCREC')).toBeVisible()
  await expect(page.getByText('Accounts payable · ACCPAY')).toBeVisible()
  // Catch-up Phase 36: the callout names the ledger pair, AA's system of record, and says the mirror matches it.
  const ledgerCallout = page.locator('[data-shot=xero-engine-link]')
  await expect(ledgerCallout).toContainText('Ledger pair (the system of record)')
  await expect(ledgerCallout).toContainText("The Billing Engine's ledger pair this record mirrors, not stored on the Xero contact.")
  await expect(ledgerCallout).toContainText('AA-2026-0005')
  await expect(ledgerCallout).toContainText('AA-2026-0005-P')
  await expect(page.locator('[data-shot=xero-ledger-match]')).toHaveText('Matches the ledger')
  await expect(page.getByText('Alan Prentice')).toBeVisible()
  const flow = page.getByTestId('xero-money-flow-grid')
  await expect(flow).toContainText('nib')
  await expect(flow).toContainText('Anaesthesia Associates')
  await expect(flow).toContainText('Dr Melanie Souter')
  await expect(flow).toContainText('MONEY INTO AA')
  await expect(flow).toContainText('MONEY OUT OF AA')
  // The payable is the gross amount: no fee box (catch-up Phase 16).
  await expect(page.getByTestId('aa-service-fee')).toHaveCount(0)
  const accPayCard = page.locator('[data-shot=xero-accpay-card]')
  await expect(accPayCard).toContainText('$152.38')
  await expect(accPayCard).toContainText('AA-2026-0005-P')
  // The ACCPAY stands as the buyer-created tax invoice (catch-up Phase 22; US-09.1.4; provisional, OQ-29).
  const bcti = accPayCard.locator('[data-shot=xero-accpay-buyer-created]')
  await expect(bcti).toContainText('Buyer-created tax invoice')
  await expect(bcti).toContainText('Dr Melanie Souter, GST 104-348-211')
  await expect(bcti).toContainText('Anaesthesia Associates Limited, GST 102-345-678')
  await expect(bcti).toContainText('Provisional (OQ-29)')
  await expect(bcti).toContainText('for services invoiced on AA-2026-0005')
  await expect(bcti).not.toContainText('Alan Prentice')
  const identifiers = page.locator('[data-shot=xero-invoice-identifiers]')
  await expect(identifiers).toContainText('InvoiceNumber')
  await expect(identifiers).toContainText('AA-2026-0005')
  await expect(identifiers).toContainText('Reference')
  await expect(page.getByText('Xero InvoiceID')).toBeVisible()
  await expect(page.getByText('Xero BillID')).toBeVisible()
  await expect(page.getByText('Draft', { exact: true })).toBeVisible()
  await expect(page.getByText('ZAC3326')).toHaveCount(0)
  await accPayCard.scrollIntoViewIfNeeded()
  await page.screenshot({ path: 'visual/shots/xero-s3-pair-payable.png', fullPage: true })

  const pairURL = page.url()
  await page.reload()
  await page.waitForLoadState('networkidle')
  expect(page.url()).toBe(pairURL)
  await expect(page.getByText('Alan Prentice')).toBeVisible()
  await page.screenshot({ path: 'visual/shots/xero-s3-pair.png', fullPage: true })

  await page.getByRole('button', { name: 'Simulate payment and payout' }).click()
  await expect(page.getByRole('button', { name: 'Payment and payout complete' })).toBeDisabled()
  await expect(page.getByRole('status')).toContainText('$152.38')
  // Catch-up Phase 37: the payout is a bill payment made in Xero, and the engine records the disbursement from its webhook.
  await expect(accPayCard.locator('[data-shot=xero-accpay-paid-in-xero]')).toContainText('$152.38')
  const detection = accPayCard.locator('[data-shot=xero-accpay-engine-detection] [data-engine-state]')
  await expect(detection).toHaveCount(1)
  await expect(detection).toHaveAttribute('data-engine-state', 'recorded')
  await expect(detection).toContainText(/disbursement recorded .*by webhook/)
  await expect(accPayCard).toContainText('Disbursed')
  await page.screenshot({ path: 'visual/shots/xero-s3-pair-settled.png', fullPage: true })
  await page.getByRole('link', { name: /View in Dr Souter's account/ }).click()
  await expect(page).toHaveURL(/\/web\/accounts\/payments\?invoice=AA-2026-0005$/)
  const paymentRow = page.getByTestId('payment-history-row-AA-2026-0005')
  // Received by AA, released to you and paid to you: all $152.38.
  await expect(paymentRow.getByText('$152.38')).toHaveCount(3)
  await expect(paymentRow).toContainText('Paid to you')
  await paymentRow.scrollIntoViewIfNeeded()
  await page.screenshot({ path: 'visual/shots/web-s3-payment-history.png', fullPage: true })
  await page.goBack()
  await expect(page.getByRole('button', { name: 'Payment and payout complete' })).toBeVisible()

  await page.goBack()
  await expect(page).toHaveURL(/\/demo\/xero\/invoices$/)
  await expect(page.getByRole('link', { name: /View pair/ }).first()).toBeVisible()

  // A stale bookmark returns to the collection instead of rendering blank.
  await page.goto('/demo/xero/invoices/not-a-real-pair')
  await page.waitForLoadState('networkidle')
  await expect(page).toHaveURL(/\/demo\/xero\/invoices$/)
  await expect(page.getByRole('link', { name: /View pair/ }).first()).toBeVisible()
  expect(consoleErrors, `console errors: ${consoleErrors.join(' | ')}`).toEqual([])
})
