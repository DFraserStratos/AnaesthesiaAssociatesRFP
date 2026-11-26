import { expect, test, type Page } from '@playwright/test'

/**
 * Catch-up Phase 40: Admin, Patients. Search finds Sarah Mitchell by name and
 * NHI; her record shows the three balance tiles ($610.00 strong, billed to
 * her) and the invoice table with Paid and Unpaid rows, and never the internal
 * patient id. Waiting for NHI's old address lands on Intake's Needs NHI filter
 * (build plan Phase 68), each waiting row its own item. Needs follow-up (build plan
 * Phase 57) lists the patient with the reminder logged on her page, once, and
 * Done on the page takes her off. Heather Sinclair's record
 * reads in credit with the Credited invoice. Master data's Patient balance
 * warning refuses 0, saves 20 and restores 90. Each test starts from a fresh
 * browser context, so from the seed. Shots land in `visual/shots/`.
 */

const MITCHELL = 'CQY9304'
const SINCLAIR = 'ZAN2219'

async function open(page: Page, path: string): Promise<void> {
  await page.goto(path)
  await page.waitForLoadState('networkidle')
}

test('search finds Sarah Mitchell; her record shows the strong balance and both invoice states, never the internal id', async ({ page }) => {
  await open(page, '/admin/people/patients?filter=all')
  await expect(page.locator('[data-shot="admin-patients"]')).toBeVisible()
  const search = page.getByLabel('Search patients')

  await search.fill('Sarah Mitchell')
  const row = page.locator(`[data-shot="patient-search-table"] [data-patient-nhi="${MITCHELL}"]`)
  await expect(row).toBeVisible()
  await expect(row).toContainText('Sarah Mitchell')
  await expect(row).toContainText(MITCHELL)

  await search.fill(MITCHELL)
  await expect(row).toBeVisible()
  await page.screenshot({ path: 'visual/shots/admin-patients-search.png', fullPage: true })
  await row.getByRole('button', { name: /Open the page of Sarah Mitchell/ }).click()

  await expect(page).toHaveURL(new RegExp(`/admin/people/patients/${MITCHELL}$`))
  const record = page.locator('[data-shot="admin-patient-record"]')
  await expect(record).toBeVisible()
  await expect(page.locator('[data-shot="patient-record-nhi"]')).toContainText(MITCHELL)

  const tiles = page.locator('[data-shot="patient-balance"]')
  await expect(tiles.locator('[data-tile="balance"]')).toBeVisible()
  await expect(tiles.locator('[data-tile="otherPayers"]')).toBeVisible()
  const own = tiles.locator('[data-tile="billedToPatient"]')
  await expect(own).toContainText('$610.00')
  await expect(own.locator('[data-shot="patient-balance-strength"]')).toHaveAttribute('data-strength', 'strong')
  await expect(own).toContainText('98 days')

  const invoices = page.locator('[data-shot="patient-invoices"]')
  await expect(invoices.locator('[data-invoice-status="unpaid"]').first()).toBeVisible()
  await expect(invoices.locator('[data-invoice-status="paid"]').first()).toBeVisible()
  await expect(invoices.locator('[data-shot="patient-invoice-patient-tag"]').first()).toBeVisible()

  // The NHI is the identifier: no internal patient id anywhere on the page.
  expect(/PT0/.test(await page.locator('body').innerText())).toBe(false)
  await page.screenshot({ path: 'visual/shots/admin-patient-record-mitchell.png', fullPage: true })
})

test('Waiting for NHI: the old address lands on Intake showing Waiting for an NHI, each waiting row its own arrival, opened on its own page', async ({ page }) => {
  await open(page, '/admin/patients/waiting')
  await expect(page).toHaveURL(/\/admin\/intake\?show=needs-nhi$/)
  const rows = page.locator('[data-shot="intake-inbox-row"]')
  await expect(rows.first()).toBeVisible()
  const count = await rows.count()
  await expect(page.locator('[data-shot="intake-inbox-row"][data-arrival-kind="needsNhi"]')).toHaveCount(count)
  const mere = rows.filter({ hasText: 'Mere Tipene' })
  await expect(mere).toHaveCount(1)
  await mere.click()
  await expect(page.locator('[data-shot="intake-arrival-page"]')).toHaveAttribute('data-arrival-kind', 'needsNhi')
  // Phase 72: the Needs NHI bench (the old table's row hooks moved onto it).
  const row = page.locator('[data-shot="intake-bench-needsNhi"] [data-shot="waiting-nhi-row"]')
  await expect(row).toHaveAttribute('data-row-id', 'IRS001')
  await expect(row.locator('[data-shot="waiting-nhi-chase"]')).toBeVisible()
  await page.screenshot({ path: 'visual/shots/admin-waiting-nhi.png', fullPage: true })
  // The Forte list's arrival (Receive list with a missing NHI) is retired; Add NHI on the seeded row is walked in admin-matching.spec.ts.
})

test('Needs follow-up: a reminder for today puts Sarah on the list once; Done on her page takes her off', async ({ page }) => {
  await open(page, `/admin/people/patients/${MITCHELL}`)
  const log = page.locator('[data-shot="patient-follow-up-log"]')
  await expect(log).toBeVisible()

  await log.locator('[data-shot="patient-follow-up-text"]').fill('Spoke to Sarah, she will pay on Friday')
  await log.locator('[data-shot="patient-follow-up-save"]').click()
  await expect(log.locator('[data-kind="call"]').filter({ hasText: 'Spoke to Sarah, she will pay on Friday' })).toBeVisible()

  await log.getByRole('button', { name: 'Reminder', exact: true }).click()
  await expect(log.locator('[data-shot="patient-follow-up-date"]')).toHaveValue('2026-11-24')
  await log.locator('[data-shot="patient-follow-up-text"]').fill('Check the Friday payment arrived')
  await log.locator('[data-shot="patient-follow-up-save"]').click()
  await expect(log.locator('[data-kind="reminder"]').filter({ hasText: 'Check the Friday payment arrived' })).toBeVisible()

  // The old Follow-up link lands on the filter (D100).
  await open(page, '/admin/patients/follow-up')
  await expect(page).toHaveURL(/\/admin\/people\/patients\?filter=follow-up$/)
  await expect(page.locator('[data-shot="patients-needs-office"]')).toBeVisible()
  const sarah = page.locator(`[data-shot="patient-search-table"] tr[data-patient-nhi="${MITCHELL}"]`)
  await expect(sarah).toHaveCount(1)
  await expect(sarah).toHaveAttribute('data-reasons', /followUpDue/)
  await expect(sarah).toContainText('Follow-up due today')
  await expect(sarah.getByRole('button', { name: /Clear|Done/ })).toHaveCount(0)
  await page.screenshot({ path: 'visual/shots/admin-patient-follow-up.png', fullPage: true })
  await sarah.locator('td').first().click()

  await expect(page).toHaveURL(new RegExp(`/admin/people/patients/${MITCHELL}$`))
  const needs = page.locator('[data-shot="patient-needs-office"]')
  await expect(needs).toContainText('Follow-up due today')
  await needs.getByRole('button', { name: 'Mark done: Check the Friday payment arrived' }).click()
  await expect(needs).toHaveCount(0)
  // Back returns to the filter she was opened from; she has left it.
  await page.getByRole('link', { name: /Patients/ }).first().click()
  await expect(page).toHaveURL(/filter=follow-up/)
  await expect(page.locator(`tr[data-patient-nhi="${MITCHELL}"]`)).toHaveCount(0)

  // Phase 68: clearing the balance warning Add NHI raises on Losa Tuilagi (Add NHI on her waiting row) moved to 72; re-added there.
})

test("Heather Sinclair's record reads in credit, with the Credited invoice", async ({ page }) => {
  await open(page, `/admin/people/patients/${SINCLAIR}`)
  await expect(page.locator('[data-shot="admin-patient-record"]')).toBeVisible()
  const own = page.locator('[data-shot="patient-balance"] [data-tile="billedToPatient"]')
  await expect(own).toContainText('In credit $260.00')
  await expect(own.locator('[data-shot="patient-balance-strength"]')).toHaveAttribute('data-strength', 'mild')
  const credited = page.locator('[data-shot="patient-invoices"] [data-invoice-status="credited"]')
  await expect(credited).toHaveCount(1)
  await expect(credited).toHaveText('Credited')
  expect(/PT0/.test(await page.locator('body').innerText())).toBe(false)
  await page.screenshot({ path: 'visual/shots/admin-patient-record-sinclair.png', fullPage: true })
})

test('Master data, Patient balance warning: 0 is refused, 20 saves, 90 restores', async ({ page }) => {
  await open(page, '/admin/masters?view=patientBalance')
  const view = page.locator('[data-shot="master-patient-balance-threshold"]')
  await expect(view).toBeVisible()
  const field = page.locator('[data-shot="patient-balance-threshold-field"]')
  const save = page.locator('[data-shot="patient-balance-threshold-save"]')
  await expect(field).toHaveValue('90')
  await expect(save).toBeDisabled()

  await field.fill('0')
  await expect(view).toContainText('Enter a whole number of days from 1 to 730.')
  await expect(save).toBeDisabled()

  await field.fill('20')
  await expect(save).toBeEnabled()
  await save.click()
  await expect(page.locator('[data-shot="patient-balance-threshold-saved"]')).toContainText('after 20 days')
  await expect(view).toContainText('Now 20 days.')
  await page.screenshot({ path: 'visual/shots/admin-master-patient-balance.png', fullPage: true })

  await field.fill('90')
  await save.click()
  await expect(page.locator('[data-shot="patient-balance-threshold-saved"]')).toContainText('after 90 days')
  await expect(view).toContainText('Now 90 days.')
})
