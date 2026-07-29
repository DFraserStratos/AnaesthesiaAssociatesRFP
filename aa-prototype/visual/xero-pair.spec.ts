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
  const scenario = page.getByText('S3 · Money end-to-end', { exact: true }).locator('..').locator('..').locator('..')
  await scenario.getByRole('button', { name: 'Jump', exact: true }).click()
  await scenario.getByRole('button', { name: 'Confirm jump' }).click()
  await scenario.getByRole('button', { name: 'Go to Admin app' }).click()

  // Authorise the Forte AM List and the St George's PM List.
  await page.getByRole('button', { name: /Review queue/ }).first().click()
  const forteRow = page.getByRole('row').filter({ hasText: /Dr Melanie Souter/ }).filter({ hasText: /Forte Health/ })
  await forteRow.getByRole('button', { name: 'Review →' }).click()
  await page.getByRole('button', { name: 'Authorise for billing' }).first().click()
  await page.getByRole('button', { name: 'Authorise for billing' }).last().click()
  await expect(page.getByText('List authorised · locked for billing')).toBeVisible()

  await page.getByRole('button', { name: /Review queue/ }).first().click()
  const stgRow = page.getByRole('row').filter({ hasText: /Dr Melanie Souter/ }).filter({ hasText: /St George's/ })
  await stgRow.getByRole('button', { name: 'Review →' }).click()
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
  await expect(page.getByText('Linked Billing Engine case, not stored on the Xero contact')).toBeVisible()
  await expect(page.getByText('Alan Prentice')).toBeVisible()
  await expect(page.getByText('Xero InvoiceID')).toBeVisible()
  await expect(page.getByText('Xero BillID')).toBeVisible()
  await expect(page.getByText('Draft', { exact: true })).toBeVisible()
  await expect(page.getByText('ZAC3326')).toHaveCount(0)

  const pairURL = page.url()
  await page.reload()
  await page.waitForLoadState('networkidle')
  expect(page.url()).toBe(pairURL)
  await expect(page.getByText('Alan Prentice')).toBeVisible()
  await page.screenshot({ path: 'visual/shots/xero-s3-pair.png', fullPage: true })

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
