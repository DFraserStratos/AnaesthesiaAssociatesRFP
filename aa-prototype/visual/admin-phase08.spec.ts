import { test, expect } from '@playwright/test'

/**
 * Phase 08 walkthrough — authorise → the synchronous billing run raises
 * invoices → the Invoices section → the invoice document (contract-holder and
 * patient layouts, agency wording, GST, delivery stubs) → print isolation.
 * A working artifact for eyeballing plus light assertions.
 */

test('authorise raises invoices; contract-holder document + email + print', async ({ page }) => {
  await page.goto('/admin')
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(400)

  // Review queue → Morrison → authorise.
  await page.getByRole('button', { name: /Review queue/ }).first().click()
  await page.waitForTimeout(300)
  await page.getByRole('row').filter({ hasText: /Morrison/ }).getByRole('button', { name: /Review/ }).click()
  await page.waitForTimeout(300)
  await page.getByRole('button', { name: 'Authorise for billing' }).first().click()
  await page.waitForTimeout(200)
  await page.getByRole('button', { name: 'Authorise for billing' }).last().click()
  await page.waitForTimeout(400)

  // The run is synchronous: the banner counts the raised invoices.
  await expect(page.getByText('List authorised · locked for billing')).toBeVisible()
  await expect(page.getByText(/6 invoices raised by the billing run/)).toBeVisible()
  await page.screenshot({ path: 'visual/shots/a8-01-authorised-banner.png', fullPage: true })

  // Jump to the Invoices section.
  await page.getByRole('button', { name: 'View invoices' }).click()
  await page.waitForTimeout(300)
  await expect(page.getByRole('heading', { name: 'Invoices' })).toBeVisible()
  await expect(page.getByText('Recently billed')).toBeVisible()
  await expect(page.getByText(/AA-2026-\d{4}/).first()).toBeVisible()
  await expect(page.getByRole('columnheader', { name: 'Patient / card' })).toBeVisible()
  await expect(page.getByRole('columnheader', { name: 'Anaesthetist' })).toBeVisible()
  await expect(page.getByRole('columnheader', { name: 'List', exact: true })).toBeVisible()
  await expect(page.getByRole('columnheader', { name: 'List date' })).toBeVisible()
  const invoiceWidth = await page.getByTestId('invoice-list-screen').evaluate((element) => element.getBoundingClientRect().width)
  expect(invoiceWidth).toBeGreaterThan(1080)
  await page.screenshot({ path: 'visual/shots/a8-02-invoices-table.png', fullPage: true })

  // The source List is a real link carrying the day-view status treatment. It
  // lands on the List date and opens the existing transient drawer.
  const sourceListLink = page.getByTestId('invoice-list-table-shell').getByRole('link').first()
  await expect(sourceListLink.locator('xpath=ancestor::tr/td').first()).toHaveCSS('vertical-align', 'middle')
  await expect(sourceListLink).toHaveCSS('background-color', 'rgb(232, 238, 252)')
  await expect(sourceListLink).toHaveCSS('color', 'rgb(31, 68, 163)')
  await sourceListLink.click()
  await expect(page).toHaveURL(/\/admin\/day\/2026-07-20$/)
  await expect(page.getByTestId('admin-list-drawer')).toBeVisible()
  await expect(page.getByTestId('admin-list-drawer')).toContainText("St George's")
  await page.goBack()
  await expect(page).toHaveURL(/\/admin\/invoices$/)

  // Open a document: contract-holder layout.
  await page.getByRole('button', { name: 'View →' }).first().click()
  await page.waitForTimeout(300)
  await expect(page.getByText('TAX INVOICE')).toBeVisible()
  await expect(page.getByText('Attn: Accounts')).toBeVisible()
  await expect(page.getByText(/Billed by Anaesthesia Associates as agent for/)).toBeVisible()
  await expect(page.getByText('GST (15%)')).toBeVisible()

  // Desktop composition: a centred 760px document + 24px gap + 264px sticky rail.
  const detailLayout = await page.getByTestId('invoice-detail-workspace').evaluate((workspace) => {
    const document = workspace.querySelector('.aa-invoice-doc')
    const rail = workspace.querySelector('[data-testid="invoice-info-rail"]')
    const screen = workspace.closest('[data-testid="invoice-detail-screen"]')
    if (!(document instanceof HTMLElement) || !(rail instanceof HTMLElement) || !(screen instanceof HTMLElement)) {
      throw new Error('Invoice detail layout nodes are missing')
    }
    const workspaceBox = workspace.getBoundingClientRect()
    const documentBox = document.getBoundingClientRect()
    const railBox = rail.getBoundingClientRect()
    const screenBox = screen.getBoundingClientRect()
    return {
      workspaceWidth: workspaceBox.width,
      documentWidth: documentBox.width,
      railWidth: railBox.width,
      gap: railBox.left - documentBox.right,
      leftInset: workspaceBox.left - screenBox.left,
      rightInset: screenBox.right - workspaceBox.right,
      railPosition: getComputedStyle(rail).position,
      railTop: getComputedStyle(rail).top,
    }
  })
  expect(detailLayout.workspaceWidth).toBeCloseTo(1048, 0)
  expect(detailLayout.documentWidth).toBeCloseTo(760, 0)
  expect(detailLayout.railWidth).toBeCloseTo(264, 0)
  expect(detailLayout.gap).toBeCloseTo(24, 0)
  expect(detailLayout.leftInset).toBeCloseTo(detailLayout.rightInset, 0)
  expect(detailLayout.railPosition).toBe('sticky')
  expect(detailLayout.railTop).toBe('24px')

  const emailBox = await page.getByRole('button', { name: 'Email invoice' }).boundingBox()
  const printBox = await page.getByRole('button', { name: 'Print' }).boundingBox()
  if (emailBox === null || printBox === null) throw new Error('Invoice action buttons are missing')
  expect(emailBox.height).toBeCloseTo(40, 0)
  expect(printBox.height).toBeCloseTo(40, 0)
  expect(emailBox.y).toBeCloseTo(printBox.y, 0)
  expect(emailBox.width).toBeGreaterThan(printBox.width)

  // Phase 10: authorising now hands the invoice off to Xero. The rail keeps
  // the two references separately labelled instead of one long footer string.
  await expect(page.getByTestId('xero-handoff-status')).toHaveText('ACCREC and ACCPAY created')
  await expect(page.getByTestId('xero-accrec-reference')).toHaveText(/AA-2026-\d{4}/)
  await expect(page.getByTestId('xero-accpay-reference')).toHaveText(/AA-2026-\d{4}-P/)
  await page.screenshot({ path: 'visual/shots/a8-03-contract-holder-doc.png', fullPage: true })

  // Email = mark emailed-at, demo-badged as a simulated send.
  await page.getByRole('button', { name: 'Email invoice' }).click()
  await page.waitForTimeout(300)
  await expect(page.getByText('Simulated send')).toBeVisible()
  await expect(page.getByText(/Emailed \d/)).toBeVisible()
  await page.screenshot({ path: 'visual/shots/a8-04-emailed.png', fullPage: true })

  // Print isolation: in print media only the document is visible.
  await page.emulateMedia({ media: 'print' })
  await expect(page.locator('.aa-invoice-doc')).toBeVisible()
  await expect(page.getByTestId('invoice-info-rail')).toBeHidden()
  await page.screenshot({ path: 'visual/shots/a8-05-print-preview.png', fullPage: true })
  await page.emulateMedia({ media: 'screen' })

  // Handoff is synchronous in the prototype, so pending is an instantaneous
  // view state. Inject that one view fixture after the real flow to pin the
  // rail's defensive pending branch without changing application behaviour.
  await page.evaluate(() => {
    const raw = localStorage.getItem('aa-demo')
    if (raw === null) throw new Error('Persisted demo state is missing')
    const persisted = JSON.parse(raw) as {
      state: {
        billing: {
          cases: Record<string, {
            invoiceId?: string
            accRecId?: string
            accPayId?: string
            handoffFailure?: unknown
          }>
        }
      }
    }
    const invoiceId = window.location.pathname.split('/').at(-1)
    const billingCase = Object.values(persisted.state.billing.cases).find((candidate) => candidate.invoiceId === invoiceId)
    if (billingCase === undefined) throw new Error('Current invoice case is missing')
    delete billingCase.accRecId
    delete billingCase.accPayId
    delete billingCase.handoffFailure
    localStorage.setItem('aa-demo', JSON.stringify(persisted))
  })
  await page.reload()
  await page.waitForLoadState('networkidle')
  await expect(page.getByTestId('xero-handoff-status')).toHaveText('Xero handoff pending')
  await expect(page.getByTestId('xero-accrec-reference')).toHaveCount(0)
  await expect(page.getByTestId('xero-accpay-reference')).toHaveCount(0)
})

test('M10 view effect: the billed design-day list vanishes from the mobile app', async ({ page }) => {
  // Presenter advances the clock so Finish now stamps an afternoon time.
  await page.goto('/demo/control')
  await page.waitForLoadState('networkidle')
  for (let i = 0; i < 9; i++) await page.getByRole('button', { name: '+1 hour' }).click()
  await page.getByRole('button', { name: '+15 min' }).click()
  await page.waitForTimeout(200)

  // Mobile: finish Ellison → complete → submit the design-day PM list.
  await page.goto('/mobile')
  await page.waitForLoadState('networkidle')
  await page.getByText('Southern Cross', { exact: false }).first().click()
  await page.waitForTimeout(500)
  await page.getByText('Margaret Ellison', { exact: false }).first().click()
  await page.waitForTimeout(600)
  await page.getByRole('button', { name: 'Finish now' }).click()
  await page.waitForTimeout(400)
  await page.getByRole('button', { name: 'Mark complete' }).click()
  await page.waitForTimeout(1300)
  await page.getByRole('button', { name: 'Mark list completed' }).click()
  await page.waitForTimeout(500)
  await page.getByRole('button', { name: 'Submit to office' }).click()
  await page.waitForTimeout(700)

  // The SUBMITTED (authorised-later, still unbilled) list shows under Done.
  await page.goto('/mobile')
  await page.waitForLoadState('networkidle')
  await page.getByRole('button', { name: 'Done', exact: true }).click()
  await page.waitForTimeout(300)
  await expect(page.getByText('Southern Cross').first()).toBeVisible()
  await page.screenshot({ path: 'visual/shots/a8-08-done-before-billing.png', fullPage: true })

  // Office authorises → the run bills it in the same moment.
  await page.goto('/admin')
  await page.waitForLoadState('networkidle')
  await page.getByRole('button', { name: /Review queue/ }).first().click()
  await page.waitForTimeout(300)
  await page.getByRole('row').filter({ hasText: /Souter/ }).getByRole('button', { name: /Review/ }).first().click()
  await page.waitForTimeout(300)
  await page.getByRole('button', { name: 'Authorise for billing' }).first().click()
  await page.waitForTimeout(200)
  await page.getByRole('button', { name: 'Authorise for billing' }).last().click()
  await page.waitForTimeout(400)
  await expect(page.getByText(/4 invoices raised by the billing run/)).toBeVisible()

  // Billed = gone from the anaesthetist's views (billedAt, not AUTHORISED).
  await page.goto('/mobile')
  await page.waitForLoadState('networkidle')
  await page.getByRole('button', { name: 'Done', exact: true }).click()
  await page.waitForTimeout(300)
  await expect(page.getByText('Southern Cross')).toHaveCount(0)
  await page.screenshot({ path: 'visual/shots/a8-09-done-after-billing.png', fullPage: true })
})

test('invoice rail keeps a failed Xero handoff visible and actionable', async ({ page }) => {
  // Arm the real one-shot fault, then authorise through the normal office flow.
  await page.goto('/demo/control')
  await page.waitForLoadState('networkidle')
  await page.getByRole('button', { name: 'Arm handoff failure' }).click()
  await expect(page.getByText('Armed', { exact: true })).toBeVisible()

  await page.goto('/admin/review')
  await page.waitForLoadState('networkidle')
  await page.getByRole('row').filter({ hasText: /Morrison/ }).getByRole('button', { name: /Review/ }).click()
  await page.getByRole('button', { name: 'Authorise for billing' }).first().click()
  await page.getByRole('button', { name: 'Authorise for billing' }).last().click()
  await expect(page.getByText(/6 invoices raised by the billing run/)).toBeVisible()

  // Resolve the invoice id from the persisted result of that real mechanism,
  // then open the ordinary routed invoice page.
  const failedInvoiceId = await page.evaluate(() => {
    const raw = localStorage.getItem('aa-demo')
    if (raw === null) throw new Error('Persisted demo state is missing')
    const persisted = JSON.parse(raw) as {
      state: {
        billing: {
          cases: Record<string, {
            invoiceId?: string
            handoffFailure?: unknown
          }>
        }
      }
    }
    const failedCase = Object.values(persisted.state.billing.cases).find(
      (candidate) => candidate.invoiceId !== undefined && candidate.handoffFailure !== undefined,
    )
    if (failedCase?.invoiceId === undefined) throw new Error('Expected one failed Xero handoff')
    return failedCase.invoiceId
  })

  await page.goto(`/admin/invoices/${failedInvoiceId}`)
  await page.waitForLoadState('networkidle')
  const status = page.getByTestId('xero-handoff-status')
  await expect(status).toHaveText('Xero handoff failed')
  await expect(page.getByText('The invoice remains valid. Resolve and retry in Billing monitor.')).toBeVisible()
  await expect(page.getByTestId('xero-accrec-reference')).toHaveCount(0)
  await expect(page.getByTestId('xero-accpay-reference')).toHaveCount(0)
  await expect(status.locator('xpath=ancestor::section')).toHaveCSS('background-color', 'rgb(249, 240, 220)')
})

test('exemplar staging via the guard console: patient layout + nib upload portal', async ({ page }) => {
  await page.goto('/demo/data')
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(400)

  // Stage the insured-reimbursement list (Rutherford Thu 16, a pinned past
  // DRAFT exemplar) as the office: submit, then authorise — the billing run
  // fires on the authorise event.
  // The demo-data page carries several selects; scope to the guard console's
  // by their distinctive option values/placeholders.
  const personaSelect = page.locator('select').filter({ has: page.locator('option[value="kirsty"]') })
  const actionSelect = page.locator('select').filter({ has: page.locator('option[value="submitList"]') })
  async function runGuard(action: string, listLabel: RegExp) {
    await personaSelect.selectOption('kirsty')
    await actionSelect.selectOption({ label: action })
    const listSelect = page.locator('select').filter({ hasText: 'Choose a list' })
    const value = await listSelect.locator('option', { hasText: listLabel }).first().getAttribute('value')
    await listSelect.selectOption(value ?? '')
    await page.getByRole('button', { name: 'Attempt' }).click()
    await page.waitForTimeout(300)
  }
  await runGuard('Submit list', /2026-07-16 AM · Dr James Rutherford/)
  await runGuard('Authorise list', /2026-07-16 AM · Dr James Rutherford/)

  // Two-funder exemplar (Souter Mon 20 PM): as seeded it splits nib + St George's.
  await runGuard('Submit list', /2026-07-20 PM · Dr Melanie Souter/)
  await runGuard('Authorise list', /2026-07-20 PM · Dr Melanie Souter/)

  // Into the admin Invoices section.
  await page.goto('/admin')
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(400)
  await page.getByRole('button', { name: 'Invoices' }).first().click()
  await page.waitForTimeout(300)

  // The nib line-split invoice presents via the upload portal, never email.
  await expect(page.getByText('Upload portal').first()).toBeVisible()
  const alanRows = page.getByTestId('invoice-list-table-shell').locator('tbody tr').filter({ hasText: 'Alan Prentice' })
  await expect(alanRows).toHaveCount(2)
  await expect(alanRows.locator('td:nth-child(3)')).toHaveText(['Dr Melanie Souter', 'Dr Melanie Souter'])
  await expect(alanRows.locator('td:nth-child(4)')).toHaveText([
    /St George's · PM.*Ms G\. Lim/,
    /St George's · PM.*Ms G\. Lim/,
  ])
  await expect(alanRows.locator('td:nth-child(5)')).toHaveText(['MON 20 JUL', 'MON 20 JUL'])
  expect((await alanRows.locator('td:nth-child(7)').allTextContents()).sort()).toEqual(["St George's", 'nib'])
  await page.screenshot({ path: 'visual/shots/a8-06-invoices-mixed.png', fullPage: true })

  // Open the patient-layout invoice: insured-reimbursement wording.
  const patientRow = page.locator('tr', { hasText: 'Patient' }).filter({ hasText: 'AA-2026' }).first()
  await patientRow.getByRole('button', { name: 'View →' }).click()
  await page.waitForTimeout(300)
  await expect(page.getByText('TAX INVOICE')).toBeVisible()
  await expect(page.getByText('Insured reimbursement')).toBeVisible()
  await expect(page.getByText(/claim this invoice from your insurer/)).toBeVisible()
  await page.screenshot({ path: 'visual/shots/a8-07-patient-doc.png', fullPage: true })

  // Direct-claim insurer invoices keep the upload handoff honest: status and
  // demo badge in the rail, Print available, and no invented portal action.
  await page.getByRole('button', { name: 'All invoices' }).click()
  const nibRow = page
    .getByTestId('invoice-list-table-shell')
    .locator('tbody tr')
    .filter({ hasText: 'Alan Prentice' })
    .filter({ hasText: 'nib' })
    .first()
  await nibRow.getByRole('button', { name: 'View →' }).click()
  const insurerRail = page.getByTestId('invoice-info-rail')
  await expect(insurerRail.getByText('Present via nib upload portal')).toBeVisible()
  await expect(insurerRail.getByText('Simulated portal handoff')).toBeVisible()
  await expect(insurerRail.getByRole('button', { name: 'Email invoice' })).toHaveCount(0)
  const insurerPrintBox = await insurerRail.getByRole('button', { name: 'Print' }).boundingBox()
  if (insurerPrintBox === null) throw new Error('Insurer Print action is missing')
  expect(insurerPrintBox.height).toBeCloseTo(40, 0)
  await page.screenshot({ path: 'visual/shots/a8-10-insurer-doc.png', fullPage: true })
})
