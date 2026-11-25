import { expect, test, type Page } from '@playwright/test'
import { advanceClock, runDemoAction } from './demoActions'

/**
 * Catch-up Phase 37 (EP-09, US-09.2.4, US-10.2.4): the Xero mirror's
 * resilience. An outage queues the hand-offs (authorising still bills), the
 * queue retries with backoff as the clock moves, and Restore drains it with
 * exactly one Xero pair per invoice. Changes AA staff make directly in Xero (a
 * void, an amended total) are found by the reconciliation poll and flagged on
 * Finances · Xero (build plan Phase 58 moved the connection line, the sync queue
 * and the divergence panel there from the Billing monitor; the Lists' problems
 * stay on Finances · Billing). A bulk hospital remittance lands in Xero with one
 * line left for the office to match in Xero's Bank reconciliation.
 */

const SOUTER_MON_AM = 'L-34821-2026-11-23-AM'

/** A clean seed: the store persists to localStorage, so clear it and load again. */
async function fresh(page: Page, path: string): Promise<void> {
  await page.goto(path)
  await page.evaluate(() => window.localStorage.clear())
  await page.goto(path)
  await page.waitForLoadState('networkidle')
}

/** Every ACCREC number listed on the Xero simulator's Invoices tab, with its pair path. */
async function xeroPairs(page: Page): Promise<{ number: string; href: string }[]> {
  await page.goto('/demo/xero/invoices')
  await page.waitForLoadState('networkidle')
  return page.locator('a[aria-label^="View pair "]').evaluateAll((els) =>
    els.map((e) => ({ number: (e.textContent ?? '').trim(), href: e.getAttribute('href') ?? '' })),
  )
}

/** How many ACCRECs the Xero simulator holds: past its 200-row safety cap, its "Showing 200 of N" line says. */
async function xeroPairCount(page: Page): Promise<number> {
  const listed = await xeroPairs(page)
  const cap = page.locator('[data-shot="xero-table-cap"]').first()
  if ((await cap.count()) === 0) return listed.length
  return Number(((await cap.textContent()) ?? '').replace(/^.* of /, '').replace(/\D/g, ''))
}

/** Authorise a List on Review (the usual confirm); returns how many invoices the run raised. */
async function authorise(page: Page, listId: string): Promise<number> {
  await page.goto(`/admin/review/${listId}`)
  await page.waitForLoadState('networkidle')
  await page.getByRole('button', { name: 'Authorise for billing' }).first().click()
  await page.getByRole('button', { name: 'Authorise for billing' }).last().click()
  await expect(page.getByText('List authorised · locked for billing')).toBeVisible()
  const summary = page.locator('[data-shot="review-delivery-summary"]')
  await expect(summary).toHaveText(/^\d+ invoices? raised\./)
  return Number(((await summary.textContent()) ?? '').match(/^(\d+)/)?.[1])
}

/** Finances · Billing filtered to Dr Souter: its groups page at 20 across the whole practice, and hers is not on page 1. */
async function openMonitor(page: Page): Promise<void> {
  await page.goto('/admin/finances/billing?anaesthetist=34821')
  await page.waitForLoadState('networkidle')
  await expect(page.getByRole('heading', { name: 'Finances', level: 1 })).toBeVisible()
}

/** Finances · Xero: the connection line, the Xero sync queue and Changed directly in Xero. */
async function openXero(page: Page): Promise<void> {
  await page.goto('/admin/finances/xero')
  await page.waitForLoadState('networkidle')
  await expect(page.getByRole('heading', { name: 'Finances', level: 1 })).toBeVisible()
}

const queueRows = (page: Page) => page.locator('[data-shot="billing-xero-queue"] [data-queue-item]')

async function attemptsOf(page: Page): Promise<number[]> {
  // The Attempts cell is the row's second cell.
  return queueRows(page).evaluateAll((rows) => rows.map((r) => Number(r.querySelectorAll('td')[1]?.textContent ?? 'NaN')))
}

test('outage: authorising still bills, the hand-offs queue and back off with the clock, Restore leaves one Xero pair per invoice', async ({ page }) => {
  test.setTimeout(90_000)
  await fresh(page, '/admin/finances/xero')
  const connection = page.locator('[data-shot="billing-xero-connection"]')
  await expect(connection).toContainText('Connected')
  await expect(page.locator('[data-shot="billing-xero-queue"]').getByText('Nothing is waiting for Xero.')).toBeVisible()
  await expect(page.locator('[data-shot="billing-xero-divergence"]')).toHaveCount(0)

  const before = await xeroPairCount(page)

  // Simulate Xero outage from Finances · Xero.
  await openXero(page)
  expect(await runDemoAction(page, 'xero-outage-start')).toMatch(/Xero is unavailable/)
  await expect(page.locator('[data-shot="demo-action-xero-outage-restore"]').getByRole('button', { name: 'Run' })).toBeEnabled()
  await page.keyboard.press('Escape')
  await expect(connection).toContainText(/Xero unavailable since \d\d:\d\d · 0 waiting/)

  // Authorise a List on Review: it bills with no error.
  const invoices = await authorise(page, SOUTER_MON_AM)
  expect(invoices).toBeGreaterThan(0)
  await expect(page.locator('[role="alert"]').filter({ hasText: /Xero/ })).toHaveCount(0)

  // The queue holds one hand-off per invoice, attempt 1; the List is Waiting for Xero under Problems only.
  await openXero(page)
  await expect(queueRows(page)).toHaveCount(invoices)
  for (const kind of await queueRows(page).evaluateAll((rows) => rows.map((r) => r.getAttribute('data-queue-kind')))) expect(kind).toMatch(/handoff/i)
  expect(await attemptsOf(page)).toEqual(Array(invoices).fill(1))
  await expect(queueRows(page).first().getByText('Waiting', { exact: true })).toBeVisible()
  await expect(connection).toContainText(`· ${invoices} waiting`)
  await page.screenshot({ path: 'visual/shots/p37-xero-01-queue.png', fullPage: true })
  await openMonitor(page)
  await expect(page.locator(`tbody[data-shot="billing-pipeline-${SOUTER_MON_AM}"]`)).toHaveAttribute('data-problems', /waitingForXero/)

  // The Xero simulator: the outage banner, and no new pair.
  const during = await xeroPairCount(page)
  await expect(page.locator('[data-shot="xero-outage-banner"]')).toBeVisible()
  expect(during).toBe(before)

  // Clock +15 min: each row has been retried, so attempts rise (and the next try moves out by the backoff).
  await openXero(page)
  await advanceClock(page)
  await expect.poll(async () => Math.min(...(await attemptsOf(page)))).toBeGreaterThan(1)
  await expect(queueRows(page)).toHaveCount(invoices)
  await page.screenshot({ path: 'visual/shots/p37-xero-02-backoff.png', fullPage: true })

  // Restore Xero: the queue drains in order.
  expect(await runDemoAction(page, 'xero-outage-restore', { close: true })).toMatch(new RegExp(`Xero is back\\. The queue sent ${invoices} waiting call`))
  await expect(page.locator('[data-shot="billing-xero-queue"]').getByText('Nothing is waiting for Xero.')).toBeVisible()
  await expect(connection).toHaveText(/Connected$/)
  await openMonitor(page)
  await expect(page.locator(`tbody[data-shot="billing-pipeline-${SOUTER_MON_AM}"]`)).toHaveAttribute('data-problems', '')

  // Exactly one Xero pair per invoice.
  const after = await xeroPairCount(page)
  await expect(page.locator('[data-shot="xero-outage-banner"]')).toHaveCount(0)
  expect(after).toBe(before + invoices)
  const numbers = (await xeroPairs(page)).map((p) => p.number)
  expect(new Set(numbers).size).toBe(numbers.length)

  // Restoring again changes nothing.
  await page.locator('[data-shot="demo-actions"]').click()
  await expect(page.locator('[data-shot="demo-action-xero-outage-restore"]').getByRole('button', { name: 'Run' })).toBeDisabled()
  await expect(page.locator('[data-shot="demo-action-xero-outage-restore"]')).toContainText('Xero is connected')
  await page.keyboard.press('Escape')
  expect(await xeroPairCount(page)).toBe(after)
})

test('changes made in Xero: a void and an amended total, flagged at the reconciliation poll', async ({ page }) => {
  test.setTimeout(90_000)
  await fresh(page, '/admin/finances/xero')
  const before = new Set((await xeroPairs(page)).map((p) => p.number))
  await authorise(page, SOUTER_MON_AM)
  const fresh2 = (await xeroPairs(page)).filter((p) => !before.has(p.number))
  expect(fresh2.length).toBeGreaterThanOrEqual(2)
  const [voidPair, amendPair] = fresh2 as [{ number: string; href: string }, { number: string; href: string }]

  // Void one pair directly in Xero: the Xero sim shows it; the engine does not know yet.
  await page.goto(voidPair.href)
  await page.waitForLoadState('networkidle')
  expect(await runDemoAction(page, 'xero-void-invoice', { close: true })).toMatch(new RegExp(`${voidPair.number} is voided in Xero`))
  await expect(page.locator('[data-shot="xero-accrec-voided"]')).toBeVisible()
  await openXero(page)
  await expect(page.locator('[data-shot="billing-xero-divergence"]')).toHaveCount(0)

  // Run reconciliation poll: the divergence panel flags it, and its List shows under Problems only.
  expect(await runDemoAction(page, 'run-reconciliation-poll', { close: true })).toMatch(/Reconciliation poll/)
  const divergence = page.locator('[data-shot="billing-xero-divergence"]')
  await expect(divergence).toBeVisible()
  const voidRow = divergence.locator('[data-divergence-kind="voidedInXero"]')
  await expect(voidRow).toHaveCount(1)
  await expect(voidRow).toContainText(voidPair.number)
  await expect(voidRow).toContainText('Voided in Xero')
  await page.screenshot({ path: 'visual/shots/p37-xero-03-voided-flag.png', fullPage: true })
  await openMonitor(page)
  await expect(page.locator(`tbody[data-shot="billing-pipeline-${SOUTER_MON_AM}"]`)).toHaveAttribute('data-problems', /voidedInXero/)

  // Amend another pair's total in Xero, then the poll: a second flag, against the issued amount.
  await page.goto(amendPair.href)
  await page.waitForLoadState('networkidle')
  expect(await runDemoAction(page, 'xero-amend-invoice', { close: true })).toMatch(new RegExp(`${amendPair.number} now totals`))
  await expect(page.locator('[data-shot="xero-accrec-amended"]')).toContainText('Amended in Xero')
  expect(await runDemoAction(page, 'run-reconciliation-poll', { close: true })).toMatch(/Reconciliation poll/)
  await openMonitor(page)
  await expect(page.locator(`tbody[data-shot="billing-pipeline-${SOUTER_MON_AM}"]`)).toHaveAttribute('data-problems', /amendedInXero/)
  await openXero(page)
  const amendRow = divergence.locator('[data-divergence-kind="amendedInXero"]')
  await expect(amendRow).toHaveCount(1)
  await expect(amendRow).toContainText(amendPair.number)
  await expect(amendRow).toContainText(/Amended in Xero \d\d:\d\d · total \$/)
  await expect(amendRow).toContainText(/Receivable open, \$/)

  // A second poll adds no second flag.
  await runDemoAction(page, 'run-reconciliation-poll', { close: true })
  await expect(divergence.locator('[data-divergence-id]')).toHaveCount(2)

  // Resolve the void: the side panel records the outcome with a note; the flag leaves the panel.
  await voidRow.getByRole('button', { name: 'Resolve' }).click()
  const panel = page.locator('[data-shot="billing-xero-resolve-panel"]')
  await expect(panel).toBeVisible()
  await expect(panel).toContainText('Recording a resolution moves no money')
  await page.locator('textarea[data-shot="billing-xero-resolve-note"]').fill('Re-issued in Xero by the office.')
  await page.locator('[data-shot="billing-xero-resolve-save"]').click()
  await expect(panel).toBeHidden()
  await expect(divergence.locator('[data-divergence-kind="voidedInXero"]')).toHaveCount(0)
  await expect(divergence.locator('[data-divergence-kind="amendedInXero"]')).toHaveCount(1)
  await page.screenshot({ path: 'visual/shots/p37-xero-04-amended-flag.png', fullPage: true })
})

test('bulk hospital remittance: two lines matched by the add-on, the $980.00 line matched by the office in Xero', async ({ page }) => {
  await fresh(page, '/demo/xero/invoices')

  expect(await runDemoAction(page, 'xero-bulk-remittance', { close: true })).toMatch(/2 lines matched by invoice number .*1 line could not be matched/)

  await page.goto('/demo/xero/bank')
  await page.waitForLoadState('networkidle')
  const bank = page.locator('[data-shot="xero-bank-reconciliation"]')
  await expect(bank).toBeVisible()
  await expect(page.locator('[data-shot="xero-bank-scope"]')).toContainText('Matched in Xero, not by the Billing Engine')
  const unmatched = page.locator('[data-shot="xero-bank-unmatched"]')
  await expect(unmatched).toContainText('Unmatched items · for office staff, handled in Xero')
  await expect(unmatched).toContainText('$980.00')
  await expect(unmatched).toContainText('AA-2026-H40')
  await page.screenshot({ path: 'visual/shots/p37-xero-05-bank-unmatched.png', fullPage: true })

  // Match in Xero to AA-2026-H04.
  const pick = unmatched.locator('select[data-shot^="xero-bank-pick-"]')
  await expect(pick).toHaveCount(1)
  const lineId = ((await pick.getAttribute('data-shot')) ?? '').replace('xero-bank-pick-', '')
  const h04 = await pick.locator('option').evaluateAll((opts) => opts.map((o) => ({ value: (o as HTMLOptionElement).value, text: o.textContent ?? '' })).find((o) => o.text.startsWith('AA-2026-H04'))?.value)
  expect(h04).toBeTruthy()
  await pick.selectOption(h04!)
  await page.locator(`[data-shot="xero-bank-match-${lineId}"]`).click()
  await expect(page.locator('[data-shot="xero-bank-match-result"]')).toContainText('Matched in Xero: $980.00 paid AA-2026-H04')
  await expect(unmatched.getByText('Every line is matched.')).toBeVisible()

  // A second remittance is refused.
  await page.locator('[data-shot="demo-actions"]').click()
  await expect(page.locator('[data-shot="demo-action-xero-bulk-remittance"]').getByRole('button', { name: 'Run' })).toBeDisabled()
  await page.keyboard.press('Escape')
  await page.screenshot({ path: 'visual/shots/p37-xero-06-bank-matched.png', fullPage: true })
})
