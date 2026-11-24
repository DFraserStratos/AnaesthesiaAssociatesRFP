import { test, expect, type Page } from '@playwright/test'
import { advanceClock, runDemoAction } from './demoActions'

/**
 * Phase 08 walkthrough — authorise → the synchronous billing run raises
 * invoices → the Invoices section → the invoice document (contract-holder and
 * patient layouts, agency wording, GST, delivery stubs) → print isolation.
 * A working artifact for eyeballing plus light assertions.
 */

/**
 * Two tests below reach past the UI into the persisted payload. Since
 * `src/store/persistStorage.ts` landed, that payload is written on a ~250ms
 * trailing timer rather than synchronously inside `setState`, so localStorage
 * is deliberately NOT in step with the store within the same tick. A read taken
 * straight after a mutation sees the PREVIOUS payload, and a raw `setItem` can
 * be clobbered by the pending write landing on top of it a moment later.
 *
 * So wait for the write to settle first. Polling rather than a fixed sleep,
 * because the point is to observe the payload actually containing what the flow
 * just produced, not to guess at a duration.
 */
/** A persisted ledger pair (catch-up Phase 36): the invoice it was made with, its legs' Xero mirror ids and any hand-off fault. */
interface PersistedLedgerPair {
  invoiceId?: string
  receivable?: { xeroAccRecId?: string }
  payable?: { xeroAccPayId?: string }
}

/** A persisted Xero sync queue item (catch-up Phase 37): a failed hand-off waits here. */
interface PersistedQueueItem {
  kind?: string
  status?: string
  target?: { pairId?: string }
}

/**
 * Wait for the persisted payload to contain a billing case matching `want`, and
 * return its `invoiceId`. Polling on the thing the test actually needs, rather
 * than on a case count or a fixed sleep: the seed already ships a PAID
 * pre-payment case, so a count would be satisfied by a stale payload.
 */
async function persistedInvoiceIdWhere(
  page: Page,
  want: 'handoff failed',
): Promise<string> {
  let found: string | null = null
  await expect
    .poll(
      async () => {
        found = await page.evaluate(() => {
          const raw = localStorage.getItem('aa-demo')
          if (raw === null) return null
          const persisted = JSON.parse(raw) as {
            state?: { billing?: { ledger?: Record<string, PersistedLedgerPair>; xeroQueue?: Record<string, PersistedQueueItem> } }
          }
          const queued = Object.values(persisted.state?.billing?.xeroQueue ?? {}).find((q) => q.kind === 'handoff' && q.status !== 'sent')
          const pairId = queued?.target?.pairId
          const hit = pairId !== undefined ? persisted.state?.billing?.ledger?.[pairId] : undefined
          return hit?.invoiceId ?? null
        })
        return found
      },
      { message: `the coalesced persist write should land a case where ${want}`, timeout: 5_000 },
    )
    .not.toBeNull()
  if (found === null) throw new Error(`Expected one billing case where ${want}`)
  return found
}

/** As above, for the invoice currently open in the address bar. */
async function waitForPersistedCaseOfOpenInvoice(page: Page): Promise<void> {
  await expect
    .poll(
      async () =>
        page.evaluate(() => {
          const raw = localStorage.getItem('aa-demo')
          if (raw === null) return false
          const persisted = JSON.parse(raw) as {
            state?: { billing?: { ledger?: Record<string, PersistedLedgerPair> } }
          }
          const invoiceId = window.location.pathname.split('/').at(-1)
          return Object.values(persisted.state?.billing?.ledger ?? {}).some(
            (candidate) => candidate.invoiceId === invoiceId,
          )
        }),
      { message: 'the open invoice should be in the persisted payload before it is rewritten', timeout: 5_000 },
    )
    .toBe(true)
}

test('authorise raises and sends invoices; contract-holder document, Resend and print', async ({ page }) => {
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

  // The run is synchronous and sends each invoice (catch-up Phase 22): the banner counts them.
  await expect(page.getByText('List authorised · locked for billing')).toBeVisible()
  await expect(page.locator('[data-shot="review-delivery-summary"]')).toHaveText(/^6 invoices raised\. \d+ emailed, \d+ to post\./)
  await page.screenshot({ path: 'visual/shots/a8-01-authorised-banner.png', fullPage: true })

  // Jump to the Invoices section.
  await page.getByRole('button', { name: 'View invoices' }).click()
  await page.waitForTimeout(300)
  await expect(page.getByRole('heading', { name: 'Invoices' })).toBeVisible()
  await expect(page.getByText('Recently billed')).toBeVisible()
  await expect(page.getByText(/AA-2026-\d{4}/).first()).toBeVisible()
  await expect(page.getByTestId('invoice-list-table-shell').getByRole('columnheader', { name: 'Patient / booking' })).toBeVisible()
  await expect(page.getByTestId('invoice-list-table-shell').getByRole('columnheader', { name: 'Anaesthetist' })).toBeVisible()
  await expect(page.getByTestId('invoice-list-table-shell').getByRole('columnheader', { name: 'List', exact: true })).toBeVisible()
  await expect(page.getByTestId('invoice-list-table-shell').getByRole('columnheader', { name: 'List date' })).toBeVisible()
  const invoiceWidth = await page.getByTestId('invoice-list-screen').evaluate((element) => element.getBoundingClientRect().width)
  expect(invoiceWidth).toBeGreaterThan(1080)
  await page.screenshot({ path: 'visual/shots/a8-02-invoices-table.png', fullPage: true })

  // The source List is a real link. Since the Patient / booking cell became a link
  // too, both cells share ONE compact neutral chrome (`.aa-table-entity-link`:
  // inline-flex row + chevron, no underline, colour inherited from the cell)
  // rather than the List cell alone wearing a status-tinted pill — so this
  // asserts that shared treatment, not the retired tint. The link lands on the
  // List date and opens the existing transient drawer.
  const firstInvoiceRow = page.getByTestId('invoice-list-table-shell').locator('tbody tr').first()
  await expect(firstInvoiceRow.locator('td').first()).toHaveCSS('vertical-align', 'middle')
  const sourceListLink = firstInvoiceRow.getByRole('link', { name: /in day view$/ })
  await expect(sourceListLink).toHaveAttribute('href', '/admin/day/2026-11-23')
  await expect(sourceListLink).toHaveCSS('display', 'inline-flex')
  await expect(sourceListLink).toHaveCSS('text-decoration-line', 'none')
  await sourceListLink.click()
  await expect(page).toHaveURL(/\/admin\/day\/2026-11-23$/)
  await expect(page.getByTestId('admin-list-drawer')).toBeVisible()
  await expect(page.getByTestId('admin-list-drawer')).toContainText("St George's")
  await page.goBack()
  await expect(page).toHaveURL(/\/admin\/invoices$/)

  // Open a document: contract-holder layout.
  await page.getByRole('button', { name: /^View invoice / }).first().click()
  await page.waitForTimeout(300)
  await expect(page.getByText('TAX INVOICE')).toBeVisible()
  await expect(page.getByText('Attn: Accounts')).toBeVisible()
  // Issued in the anaesthetist's name with AA as agent (US-08.4.5; provisional, OQ-29).
  await expect(page.locator('[data-shot="invoice-supplier"]')).toContainText('Dr Kate Morrison')
  await expect(page.locator('[data-shot="invoice-supplier"]')).toContainText(/GST number \d{3}-\d{3}-\d{3}/)
  await expect(page.locator('[data-shot="invoice-agent-block"]')).toContainText(/Issued by Anaesthesia Associates Limited as agent for Dr Kate Morrison\. AA GST number/)
  await expect(page.locator('[data-shot="invoice-agent-block"]')).toContainText('Provisional (OQ-29)')
  await expect(page.getByText('GST (15%)')).toBeVisible()
  await expect(page.locator('[data-shot="invoice-gst-caption"]')).toHaveText('Prices are held GST exclusive. GST is added at the foot of the invoice.')
  await expect(page.getByRole('button', { name: /^Email inv/ })).toHaveCount(0)

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

  // The run already emailed it: the Delivery card says where, with Resend beside Print.
  await expect(page.locator('[data-shot="invoice-delivery"]')).toContainText(/Emailed to \S+@\S+ at \d{2}:\d{2}/)
  await expect(page.getByText('Simulated send')).toBeVisible()
  const emailBox = await page.getByRole('button', { name: 'Resend' }).boundingBox()
  const printBox = await page.getByRole('button', { name: 'Print' }).boundingBox()
  if (emailBox === null || printBox === null) throw new Error('Invoice action buttons are missing')
  expect(emailBox.height).toBeCloseTo(40, 0)
  expect(printBox.height).toBeCloseTo(40, 0)
  expect(emailBox.y).toBeCloseTo(printBox.y, 0)
  expect(emailBox.width).toBeGreaterThan(printBox.width)

  // Phase 10: authorising now hands the invoice off to Xero. The rail keeps
  // the two references separately labelled instead of one long footer string.
  await expect(page.getByTestId('xero-handoff-status')).toHaveText('Mirrored in Xero')
  await expect(page.getByTestId('xero-accrec-reference')).toHaveText(/^XR\d{4}$/)
  await expect(page.getByTestId('xero-accpay-reference')).toHaveText(/^XP\d{4}$/)
  await page.screenshot({ path: 'visual/shots/a8-03-contract-holder-doc.png', fullPage: true })

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
  // Settle the coalesced write FIRST: this is a read-modify-write of the
  // payload, so a stale read would rewrite the wrong thing, and a write still
  // pending when `page.reload()` fires `pagehide` would flush straight over the
  // top of the fixture.
  await waitForPersistedCaseOfOpenInvoice(page)
  await page.evaluate(() => {
    const raw = localStorage.getItem('aa-demo')
    if (raw === null) throw new Error('Persisted demo state is missing')
    const persisted = JSON.parse(raw) as {
      state: {
        billing: {
          ledger: Record<string, {
            invoiceId?: string
            receivable?: { xeroAccRecId?: string }
            payable?: { xeroAccPayId?: string }
          }>
        }
      }
    }
    const invoiceId = window.location.pathname.split('/').at(-1)
    const pair = Object.values(persisted.state.billing.ledger).find((candidate) => candidate.invoiceId === invoiceId)
    if (pair === undefined) throw new Error('Current invoice ledger pair is missing')
    if (pair.receivable !== undefined) delete pair.receivable.xeroAccRecId
    if (pair.payable !== undefined) delete pair.payable.xeroAccPayId
    localStorage.setItem('aa-demo', JSON.stringify(persisted))
  })
  await page.reload()
  await page.waitForLoadState('networkidle')
  await expect(page.getByTestId('xero-handoff-status')).toHaveText('Not yet in Xero')
  await expect(page.getByTestId('xero-accrec-reference')).toHaveCount(0)
  await expect(page.getByTestId('xero-accpay-reference')).toHaveCount(0)

  // Resend appends a second send to the history (the office only resends).
  await page.getByRole('button', { name: 'Resend' }).click()
  await expect(page.getByTestId('invoice-send-history').locator('li')).toHaveCount(2)
})

test('the authorised design-day list leaves the mobile main view (catch-up Phase 38a: at AUTHORISED)', async ({ page }) => {
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
  // The modifiers step on an RVG price (catch-up Phase 21a): "None apply" is a valid answer.
  await page.locator('[data-shot="capture-modifiers-none"]').click()
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
  // Name the list, don't take the first Souter row: the seed also ships her two
  // Mon 20 money-story lists SUBMITTED, and both sort ahead of this Tue 21 one.
  // No `.first()` anywhere here, so an ambiguous queue fails loudly instead of
  // quietly authorising a different list.
  await page
    .getByRole('row')
    .filter({ hasText: /Souter/ })
    .filter({ hasText: 'Southern Cross' })
    .getByRole('button', { name: /Review/ })
    .click()
  await page.waitForTimeout(300)
  await page.getByRole('button', { name: 'Authorise for billing' }).first().click()
  await page.waitForTimeout(200)
  await page.getByRole('button', { name: 'Authorise for billing' }).last().click()
  await page.waitForTimeout(400)
  await expect(page.locator('[data-shot="review-delivery-summary"]')).toHaveText(/^4 invoices raised\./)

  // Authorised = gone from the anaesthetist's main view (catch-up Phase 38a; search still finds it).
  await page.goto('/mobile')
  await page.waitForLoadState('networkidle')
  await page.getByRole('button', { name: 'Done', exact: true }).click()
  await page.waitForTimeout(300)
  await expect(page.getByText('Southern Cross')).toHaveCount(0)
  await page.screenshot({ path: 'visual/shots/a8-09-done-after-billing.png', fullPage: true })
})

test('invoice rail shows a hand-off waiting for Xero', async ({ page }) => {
  // Arm the real one-shot fault from the Billing monitor's Demo actions, then
  // authorise through the normal office flow.
  await page.goto('/admin/billing')
  await page.waitForLoadState('networkidle')
  await runDemoAction(page, 'arm-handoff-fault')
  await expect(page.locator('[data-shot="demo-action-arm-handoff-fault"]').getByText('Armed', { exact: true })).toBeVisible()
  await page.keyboard.press('Escape')

  await page.goto('/admin/review')
  await page.waitForLoadState('networkidle')
  await page.getByRole('row').filter({ hasText: /Morrison/ }).getByRole('button', { name: /Review/ }).click()
  await page.getByRole('button', { name: 'Authorise for billing' }).first().click()
  await page.getByRole('button', { name: 'Authorise for billing' }).last().click()
  await expect(page.locator('[data-shot="review-delivery-summary"]')).toHaveText(/^6 invoices raised\./)

  // Resolve the invoice id from the persisted result of that real mechanism,
  // then open the ordinary routed invoice page. Polled, because the persist
  // write is coalesced (see the helper's docblock).
  const failedInvoiceId = await persistedInvoiceIdWhere(page, 'handoff failed')

  await page.goto(`/admin/invoices/${failedInvoiceId}`)
  await page.waitForLoadState('networkidle')
  const status = page.getByTestId('xero-handoff-status')
  // Catch-up Phase 37: the fault is one failed attempt waiting in the Xero sync queue, retried by it.
  await expect(status).toHaveText('Waiting for Xero')
  await expect(page.locator('[data-shot="invoice-waiting-for-xero"]')).toHaveText('The invoice and its ledger pair stand. Attempt 1 · next try 08:02; the Xero sync queue retries it.')
  await expect(page.getByTestId('xero-accrec-reference')).toHaveCount(0)
  await expect(page.getByTestId('xero-accpay-reference')).toHaveCount(0)
  await expect(status.locator('xpath=ancestor::section')).toHaveCSS('background-color', 'rgb(249, 240, 220)')

  // The queue's next tick (clock +15 min, past the 08:02 next try) lands it in Xero with no manual step.
  await advanceClock(page)
  await expect(status).toHaveText('Mirrored in Xero')
  await expect(page.locator('[data-shot="invoice-waiting-for-xero"]')).toHaveCount(0)
  await expect(page.getByTestId('xero-accrec-reference')).toHaveCount(1)
})

test('exemplar staging via the guard console: patient layout and the fee split', async ({ page }) => {
  await page.goto('/demo/data')
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(400)

  // Stage the insured-reimbursement list (Rutherford Thu 16, a pinned past
  // ACTIVE exemplar) as the office: submit, then authorise — the billing run
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
  await runGuard('Submit list', /2026-11-19 AM · Dr James Rutherford/)
  await runGuard('Authorise list', /2026-11-19 AM · Dr James Rutherford/)

  // The fee-split exemplar (Souter Mon 20 PM): nib $132.50 and Alan Prentice the rest (catch-up Phase 22).
  await runGuard('Submit list', /2026-11-23 PM · Dr Melanie Souter/)
  await runGuard('Authorise list', /2026-11-23 PM · Dr Melanie Souter/)

  // Into the admin Invoices section.
  await page.goto('/admin')
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(400)
  await page.getByRole('button', { name: 'Invoices' }).first().click()
  await page.waitForTimeout(300)

  // Both shares are emailed by the run (nib's Party delivers by email; no portal, D55).
  await expect(page.getByText('Upload portal')).toHaveCount(0)
  const alanRows = page.getByTestId('invoice-list-table-shell').locator('tbody tr').filter({ hasText: 'Alan Prentice' })
  await expect(alanRows).toHaveCount(2)
  // Catch-up Phase 38b put a Kind column after Number, so every column after it moved one on.
  await expect(alanRows.locator('[data-shot="invoice-list-kind"]')).toHaveText(['Invoice', 'Invoice'])
  await expect(alanRows.locator('td:nth-child(4)')).toHaveText(['Dr Melanie Souter', 'Dr Melanie Souter'])
  await expect(alanRows.locator('td:nth-child(5)')).toHaveText([
    /St George's · PM.*Ms G\. Lim/,
    /St George's · PM.*Ms G\. Lim/,
  ])
  await expect(alanRows.locator('td:nth-child(6)')).toHaveText(['MON 20 JUL', 'MON 20 JUL'])
  expect((await alanRows.locator('td:nth-child(8)').allTextContents()).map((t) => t.replace(/Split$/, '').trim()).sort()).toEqual(['Alan Prentice', 'nib'])
  await expect(alanRows.locator('[data-shot="invoice-list-split"]')).toHaveCount(2)
  await expect(alanRows.locator('[data-shot="invoice-list-delivery"]')).toHaveText([/^Emailed \d{2}:\d{2}$/, /^Emailed \d{2}:\d{2}$/])
  await page.screenshot({ path: 'visual/shots/a8-06-invoices-mixed.png', fullPage: true })

  // Open the patient-layout invoice: the AIA claim is No contract · RVG billed
  // to the patient, so the note is payment on receipt (catch-up Phase 20; the
  // insured-reimbursement wording went with the payment category).
  const patientRow = page.locator('tr', { hasText: 'Patient' }).filter({ hasText: 'AA-2026' }).first()
  await patientRow.getByRole('button', { name: /^View invoice / }).click()
  await page.waitForTimeout(300)
  await expect(page.getByText('TAX INVOICE')).toBeVisible()
  await expect(page.getByText('Payment is due on receipt of this invoice.')).toBeVisible()
  await expect(page.getByText(/claim this invoice from your insurer/)).toHaveCount(0)
  await page.screenshot({ path: 'visual/shots/a8-07-patient-doc.png', fullPage: true })

  // nib's share: holder layout, emailed to nib, the split note linking Alan's share.
  await page.getByTestId('invoice-detail-screen').getByRole('button', { name: 'Invoices', exact: true }).click()
  const nibRow = page
    .getByTestId('invoice-list-table-shell')
    .locator('tbody tr')
    .filter({ hasText: 'Alan Prentice' })
    .filter({ hasText: 'nib' })
    .first()
  await nibRow.getByRole('button', { name: /^View invoice / }).click()
  const insurerRail = page.getByTestId('invoice-info-rail')
  await expect(insurerRail.locator('[data-shot="invoice-delivery"]')).toContainText('Emailed to claims@nib.example')
  await expect(insurerRail.getByText('Present via nib upload portal')).toHaveCount(0)
  await expect(insurerRail.getByRole('button', { name: /^Email inv/ })).toHaveCount(0)
  await expect(page.getByText('Attn: Accounts')).toBeVisible()
  // The split is under No contract · RVG, which has no holder reference code to print.
  await expect(page.locator('[data-shot="invoice-holder-reference"]')).toHaveCount(0)
  await expect(page.locator('[data-shot="invoice-btm-breakdown"]')).toContainText('Base 4 + Time 4 + Modifiers 0 = 8 units at $26.50')
  await expect(page.locator('[data-shot="invoice-cross-match"]')).toContainText('Surgeon')
  await expect(page.locator('[data-shot="invoice-split-note"]')).toContainText('This fee of $212.00 is split. The other share is invoiced separately to Alan Prentice, AA-2026-')
  await expect(page.locator('.aa-invoice-doc')).toContainText('$152.38')
  const insurerPrintBox = await insurerRail.getByRole('button', { name: 'Print' }).boundingBox()
  if (insurerPrintBox === null) throw new Error('Insurer Print action is missing')
  expect(insurerPrintBox.height).toBeCloseTo(40, 0)
  await page.screenshot({ path: 'visual/shots/a8-10-insurer-doc.png', fullPage: true })
})
