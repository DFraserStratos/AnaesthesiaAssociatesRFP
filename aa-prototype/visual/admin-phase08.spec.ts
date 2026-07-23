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
  await page.getByRole('button', { name: /Morrison/ }).first().click()
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
  await page.getByRole('button', { name: 'View invoices →' }).click()
  await page.waitForTimeout(300)
  await expect(page.getByRole('heading', { name: 'Invoices' })).toBeVisible()
  await expect(page.getByText('Recently billed')).toBeVisible()
  await expect(page.getByText(/AA-2026-\d{4}/).first()).toBeVisible()
  await page.screenshot({ path: 'visual/shots/a8-02-invoices-table.png', fullPage: true })

  // Open a document: contract-holder layout.
  await page.getByRole('button', { name: 'View →' }).first().click()
  await page.waitForTimeout(300)
  await expect(page.getByText('TAX INVOICE')).toBeVisible()
  await expect(page.getByText('Attn: Accounts')).toBeVisible()
  await expect(page.getByText(/Billed by Anaesthesia Associates as agent for/)).toBeVisible()
  await expect(page.getByText('GST (15%)')).toBeVisible()
  // Phase 10: authorising now hands the invoice off to Xero, so the document
  // shows its ACCREC / ACCPAY pair (was "Xero handoff pending · Phase 10").
  await expect(page.getByText(/Xero: ACCREC AA-2026-/)).toBeVisible()
  await page.screenshot({ path: 'visual/shots/a8-03-contract-holder-doc.png', fullPage: true })

  // Email = mark emailed-at, demo-badged as a simulated send.
  await page.getByRole('button', { name: 'Email invoice' }).click()
  await page.waitForTimeout(300)
  await expect(page.getByText('Simulated send')).toBeVisible()
  await expect(page.getByText(/Emailed \d/)).toBeVisible()
  await page.screenshot({ path: 'visual/shots/a8-04-emailed.png', fullPage: true })

  // Print isolation: in print media only the document is visible.
  await page.emulateMedia({ media: 'print' })
  await page.screenshot({ path: 'visual/shots/a8-05-print-preview.png', fullPage: true })
  await page.emulateMedia({ media: 'screen' })
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
  await page.getByRole('button', { name: /Souter/ }).first().click()
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
  await page.screenshot({ path: 'visual/shots/a8-06-invoices-mixed.png', fullPage: true })

  // Open the patient-layout invoice: insured-reimbursement wording.
  const patientRow = page.locator('tr', { hasText: 'Patient' }).filter({ hasText: 'AA-2026' }).first()
  await patientRow.getByRole('button', { name: 'View →' }).click()
  await page.waitForTimeout(300)
  await expect(page.getByText('TAX INVOICE')).toBeVisible()
  await expect(page.getByText('Insured reimbursement')).toBeVisible()
  await expect(page.getByText(/claim this invoice from your insurer/)).toBeVisible()
  await page.screenshot({ path: 'visual/shots/a8-07-patient-doc.png', fullPage: true })
})
