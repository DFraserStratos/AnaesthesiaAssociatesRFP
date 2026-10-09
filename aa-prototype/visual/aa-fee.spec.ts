import { expect, test } from '@playwright/test'
import { runDemoAction } from './demoActions'

/**
 * AA's monthly fee (catch-up Phase 16): settings, seeding a month of BCTIs, the
 * monthly run, the fee pair in the Xero simulation, Record fee payment and the
 * web AA fees tab.
 */
test('AA fee: settings, seeded BCTIs, the monthly run, the fee pair and the web tab', async ({ page }) => {
  test.setTimeout(90_000)
  const consoleErrors: string[] = []
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text())
  })
  page.on('pageerror', (error) => consoleErrors.push(error.message))

  // Fee settings: the labelled sample schedule, ex GST, with the worked example.
  await page.goto('/admin/billing/aa-fees/settings')
  const settings = page.locator('[data-shot=admin-aa-fee-settings]')
  await expect(settings).toBeVisible()
  await expect(settings.getByTestId('aa-fee-sample')).toHaveText('Sample schedule')
  await expect(settings).toContainText('Amounts exclude GST')
  await expect(settings.getByTestId('aa-fee-example')).toContainText('$500.00 + $5.00 x 40 = $700.00')
  await page.screenshot({ path: 'visual/shots/p16-01-aa-fee-settings.png', fullPage: true })

  // An empty description is refused with a reason; removing the item clears it.
  await settings.getByRole('button', { name: 'Add item' }).click()
  await expect(settings.getByRole('alert')).toContainText('needs a description')
  await expect(settings.getByRole('button', { name: 'Save settings' })).toBeDisabled()
  await settings.getByLabel('Fixed item 3 description').fill('Software licence')
  await settings.getByLabel('Fixed item 3 amount').fill('25')
  await expect(settings.getByTestId('aa-fee-example')).toContainText('$525.00 + $5.00 x 40 = $725.00')
  await settings.getByRole('button', { name: 'Remove Software licence' }).click()
  await expect(settings.getByTestId('aa-fee-example')).toContainText('= $700.00')

  // Fee invoices: Dr Souter's seeded history and the July preview.
  await page.getByRole('link', { name: 'Fee invoices' }).click()
  await expect(page).toHaveURL(/\/admin\/billing\/aa-fees$/)
  const screen = page.locator('[data-shot=admin-aa-fee-invoices]')
  await expect(screen.getByTestId('aa-fee-month')).toHaveText('July 2026')
  await expect(page.getByTestId('aa-fee-row-AA-FEE-2026-H01')).toContainText('Paid')
  await expect(page.getByTestId('aa-fee-row-AA-FEE-2026-H02')).toContainText('Unpaid')
  await expect(screen.getByTestId('aa-fee-count-rule')).toContainText("Being confirmed with AA's accountant")

  // Seed a month of BCTIs, then run: Dr Rutherford's $700.00 before GST, $805.00 with GST.
  expect(await runDemoAction(page, 'seed-month-of-bctis', { close: true })).toMatch(/now has 40 paid in July 2026/)
  const rutherford = page.getByTestId('aa-fee-preview-29104')
  await expect(rutherford).toContainText('40')
  await expect(rutherford).toContainText('$700.00')
  await page.screenshot({ path: 'visual/shots/p16-02-aa-fee-preview.png', fullPage: true })
  await screen.getByRole('button', { name: 'Run monthly fee invoices' }).click()
  await expect(screen.getByRole('status')).toContainText('Raised 14 fee invoices for July 2026')
  await expect(screen.getByRole('button', { name: 'Run monthly fee invoices' })).toBeDisabled()
  await expect(screen).toContainText('Every active anaesthetist already has a fee invoice for July 2026.')
  const rutherfordRow = page.locator('tr', { hasText: 'Dr Rutherford' }).filter({ hasText: 'July 2026' })
  await expect(rutherfordRow).toContainText('$700.00')
  await expect(rutherfordRow).toContainText('$105.00')
  await expect(rutherfordRow).toContainText('$805.00')
  await rutherfordRow.getByRole('button', { name: /Show .* details/ }).click()
  await expect(page.locator('[data-testid^=aa-fee-detail-]')).toContainText('Counted BCTIs (40)')
  await page.screenshot({ path: 'visual/shots/p16-03-aa-fee-run.png', fullPage: true })

  // The Billing monitor's compact panel.
  await page.goto('/admin/billing')
  await expect(page.locator('[data-shot=billing-aa-fee-invoices]')).toContainText('Latest month invoiced: July 2026')

  // The Xero simulation: fee pairs listed with an AA fee chip; the H02 pair.
  await page.goto('/demo/xero/invoices')
  const h02Row = page.getByRole('row').filter({ hasText: 'AA-FEE-2026-H02' })
  await expect(h02Row).toContainText('AA fee')
  await h02Row.click()
  const pair = page.locator('[data-shot=xero-aa-fee-pair]')
  await expect(pair).toContainText("Anaesthesia Associates (AA's own account)")
  await expect(pair).toContainText('never netted')
  await expect(page.locator('[data-shot=xero-accpay-card]')).toHaveCount(0)
  await page.screenshot({ path: 'visual/shots/p16-04-xero-fee-pair.png', fullPage: true })
  // Record fee payment is the only payment action here.
  await page.locator('[data-shot="demo-actions"]').click()
  await expect(page.locator('[data-shot="demo-action-record-fee-payment"]')).toBeVisible()
  await expect(page.locator('[data-shot="demo-action-payment-full"]')).toHaveCount(0)
  await page.keyboard.press('Escape')
  await page.getByRole('button', { name: 'Record fee payment' }).click()
  await expect(page.getByRole('status')).toContainText('AA-FEE-2026-H02 paid')
  await expect(page.getByRole('button', { name: 'Fee paid' })).toBeDisabled()

  // The web AA fees tab, focused from the pair.
  await page.getByRole('link', { name: /View in Dr Souter's account/ }).click()
  await expect(page).toHaveURL(/\/web\/accounts\/fees\?invoice=AA-FEE-2026-H02$/)
  const fees = page.locator('[data-shot=web-accounts-aa-fees]')
  await expect(page.getByTestId('aa-fee-history-row-AA-FEE-2026-H02')).toContainText('Paid')
  await expect(page.getByTestId('aa-fee-history-row-AA-FEE-2026-H01')).toContainText('Paid')
  await expect(fees).toContainText('never deducted from your payments')
  await page.screenshot({ path: 'visual/shots/p16-05-web-aa-fees.png', fullPage: true })

  expect(consoleErrors).toEqual([])
})
