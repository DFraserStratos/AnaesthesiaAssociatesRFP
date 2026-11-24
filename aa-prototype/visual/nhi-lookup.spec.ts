import { expect, test, type Page } from '@playwright/test'
import { runDemoAction } from './demoActions'

/**
 * Catch-up Phase 40a: the NHI lookup through the simulated Digital Services
 * Hub, on Dr Souter's ACTIVE Tue 21 Jul PM List. On web Add a booking: ZAA0068
 * is refused as typed with Look up disabled; ZBR4417 finds Mereana Tipene and
 * the payer block reads her; a Different payer typed as a guardian survives a
 * second lookup; the Hub set to Unavailable from Demo actions shows Retry and
 * the badge, then Available again. On the Admin patient record, Fiona Gray's
 * refresh from the register: Use register for the name, Apply, Last
 * refreshed. A mobile shot of the lookup with the purpose note. Waits on
 * data-shot selectors, never fixed sleeps. Shots land in `visual/shots/`.
 */

const LIST = 'L-34821-2026-11-24-PM'

async function open(page: Page, path: string): Promise<void> {
  await page.goto(path)
  await page.waitForLoadState('networkidle')
}

async function openAddBooking(page: Page, path: string) {
  await open(page, path)
  await page.getByRole('button', { name: /Add a booking/ }).first().click()
  const sheet = page.getByRole('dialog')
  await expect(sheet.getByRole('heading', { name: 'Add a booking' })).toBeVisible()
  return sheet
}

test('web Add a booking: validated as typed, looked up, the payer follows, a guardian stays, the Hub unavailable', async ({ page }) => {
  const sheet = await openAddBooking(page, `/web/lists/${LIST}`)
  const nhi = sheet.getByLabel('NHI')
  const lookUp = sheet.locator('[data-shot=nhi-lookup-button]')
  const status = sheet.locator('[data-shot=nhi-lookup-status]')
  await expect(sheet.locator('[data-shot=nhi-purpose]')).toHaveText(
    'Looked up on behalf of Dr Melanie Souter (HPI CPN 10SOUM), only to identify this patient. Health Information Privacy Code 2020.',
  )

  await nhi.fill('ZAA0068')
  await expect(sheet.getByText('The check digit does not match.')).toBeVisible()
  await expect(lookUp).toBeDisabled()

  await nhi.fill('ZBR4417')
  await lookUp.click()
  await expect(status).toContainText('Found Mereana Tipene on the NHI register')
  await expect(sheet.getByLabel('Name', { exact: true }).first()).toHaveValue('Mereana Tipene')
  await expect(sheet.locator('[data-shot=add-booking-payer]')).toContainText('Mereana Tipene')
  await page.locator('[data-shot=nhi-lookup]').screenshot({ path: 'visual/shots/p40a-web-nhi-found.png' })

  // A guardian typed as the payer is never overwritten by a second lookup.
  await sheet.locator('[data-shot=payer-different-tick] input').check()
  const other = sheet.locator('[data-shot=payer-other-fields]')
  await other.getByLabel('Name').fill('Hine Tipene')
  await nhi.fill('ZBT2253')
  await lookUp.click()
  await expect(status).toContainText('Found Lucas Brennan')
  await expect(other.getByLabel('Name')).toHaveValue('Hine Tipene')

  // The Hub's mode, from Demo actions while the sheet is open.
  await runDemoAction(page, 'nhi-hub-mode', { choice: 'unavailable', close: true })
  await expect(sheet.locator('[data-shot=nhi-hub-mode-badge]')).toContainText('Hub simulated as Unavailable')
  await lookUp.click()
  await expect(status).toContainText('The Digital Services Hub is not answering.')
  await expect(sheet.locator('[data-shot=nhi-lookup-retry]')).toBeVisible()
  await page.screenshot({ path: 'visual/shots/p40a-web-hub-unavailable.png' })
  await runDemoAction(page, 'nhi-hub-mode', { choice: 'available', close: true })
  await expect(sheet.locator('[data-shot=nhi-hub-mode-badge]')).toHaveCount(0)
  await sheet.locator('[data-shot=nhi-lookup-retry]').click()
  await expect(status).toContainText('Found Lucas Brennan')
})

test("Admin patient record: Fiona Gray's refresh from the NHI register", async ({ page }) => {
  await open(page, '/admin/patients/ZAM1098')
  await expect(page.locator('[data-shot=patient-register-stamp]')).toHaveText('Not refreshed yet')
  await expect(page.locator('[data-shot=patient-register-provisional]')).toHaveText('Provisional')
  await page.locator('[data-shot=patient-register-refresh-button]').click()
  const panel = page.locator('[data-shot=patient-register-refresh]')
  await expect(panel.locator('[data-shot=nhi-lookup-status]')).toContainText('On the NHI register: Fiona Tamihana')
  const table = panel.locator('[data-shot=patient-register-differences]')
  await expect(table.locator('[data-field=name]')).toContainText('Fiona Gray')
  await expect(table.locator('[data-field=name]')).toContainText('Fiona Tamihana')
  await expect(table.locator('[data-field=address]')).toContainText('5 Kowhai Lane')
  await page.screenshot({ path: 'visual/shots/p40a-register-refresh.png', fullPage: true })
  await table.locator('[data-field=name] select').selectOption('use')
  await panel.locator('[data-shot=patient-register-apply]').click()
  await expect(page.locator('[data-shot=patient-register-done]')).toContainText('Refreshed from the NHI register.')
  await expect(page.locator('[data-shot=patient-register-stamp]')).toHaveText('Last refreshed 24 Nov 2026, 08:00')
  await expect(page.locator('[data-shot=patient-details]')).toContainText('Fiona Tamihana')

  // Refresh again: the name now matches; the kept address still differs (Keep is the default).
  await page.locator('[data-shot=patient-register-refresh-button]').click()
  await expect(panel.locator('[data-shot=patient-register-differences] [data-field=address]')).toBeVisible()
  await expect(panel.locator('[data-shot=patient-register-differences] [data-field=name]')).toHaveCount(0)
})

test('mobile Add a booking: the lookup and the purpose note in the bottom sheet', async ({ page }) => {
  const sheet = await openAddBooking(page, `/mobile/lists/${LIST}`)
  await sheet.getByLabel('NHI').fill('ZBX41AL')
  await sheet.locator('[data-shot=nhi-lookup-button]').click()
  await expect(sheet.locator('[data-shot=nhi-lookup-status]')).toContainText('Found Ana Fifita')
  await expect(sheet.locator('[data-shot=nhi-lookup-status]')).toContainText('New format NHI')
  await expect(sheet.locator('[data-shot=nhi-purpose]')).toContainText('Dr Melanie Souter (HPI CPN 10SOUM)')
  await page.screenshot({ path: 'visual/shots/p40a-mobile-nhi-found.png' })
})
