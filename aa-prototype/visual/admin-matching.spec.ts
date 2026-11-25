import { expect, test, type Page } from '@playwright/test'

/**
 * Catch-up Phase 33: Admin, Matching (on Admin Intake since Phase 34). Import a sample hospital file, read the
 * wording as received, decide rows (create, apply ticked differences, a day
 * move's two rows, reject), the later update waiting for approval, and the
 * no-NHI row released by typing one. Nothing changes the schedule until the
 * office decides (RV-13).
 */

async function fresh(page: Page): Promise<void> {
  await page.goto('/admin/intake/matching')
  await page.evaluate(() => window.localStorage.clear())
  await page.goto('/admin/intake/matching')
  await page.waitForLoadState('networkidle')
}

async function importSample(page: Page, sampleId: string): Promise<void> {
  await closePanel(page)
  await page.locator('[data-shot="matching-import-open"]').click()
  await expect(page.locator('[data-shot="matching-import"]')).toBeVisible()
  await page.locator(`[data-sample-id="${sampleId}"]`).click()
  await page.locator('[data-shot="matching-import-confirm"]').click()
}

const stat = (page: Page, key: string) => page.locator(`[data-stat="${key}"]`)
const panel = (page: Page) => page.locator('[data-shot="matching-panel"]')
const rowLocator = (page: Page, text: string) => page.locator('[data-shot^="matching-row-"]', { hasText: text })
/** Close an open row panel (its scrim covers the table), then the row. */
const row = (page: Page, text: string) => ({
  first: () => row(page, text),
  click: async () => {
    await closePanel(page)
    await rowLocator(page, text).first().click()
  },
})
async function closePanel(page: Page): Promise<void> {
  if (await page.locator('[data-shot="matching-panel"]').isVisible()) {
    await page.keyboard.press('Escape')
    await expect(page.locator('[data-shot="matching-panel"]')).toBeHidden()
  }
}

test("St George's import: rows land with their wording as received, nothing applied", async ({ page }) => {
  await fresh(page)
  await expect(page.getByText('Import hospital file').first()).toBeVisible()
  // The seeded row waiting for an NHI, with its stub on a List (catch-up Phase 33a), is the only row at reset.
  await expect(rowLocator(page, 'Mere Tipene')).toBeVisible()
  expect(/download/i.test(await page.locator('[data-shot="admin-matching"]').innerText())).toBe(false)

  await importSample(page, 'SAMPLE_STG')
  await expect(page.locator('[data-shot="matching-import-result"]')).toContainText("5 rows imported from St George's")
  await expect(stat(page, 'open')).toContainText('6')
  await expect(stat(page, 'new')).toContainText('3') // two from the file plus the seeded waiting row (33a)
  await expect(stat(page, 'modification')).toContainText('1')
  await expect(stat(page, 'cancellation')).toContainText('1')
  await expect(stat(page, 'unmatched')).toContainText('1')
  await expect(page.locator('[data-received]').filter({ hasText: 'lap appy ?conv to open' })).toHaveCount(1)
  await page.screenshot({ path: 'visual/shots/admin-matching-imported.png', fullPage: true })

  await importSample(page, 'SAMPLE_STG')
  await expect(page.locator('[data-shot="matching-import-result"]')).toContainText('All 5 rows were already imported. Nothing new.')
})

test("R1 Create Booking; R3 applies the ticked fields; R4 and R5 a day move; a reject needs a reason", async ({ page }) => {
  await fresh(page)
  await importSample(page, 'SAMPLE_STG')

  await row(page, 'Sarah Mitchell').click()
  await expect(rowLocator(page, 'Sarah Mitchell')).toContainText('Create Booking on Dr Souter, Tue 1 Dec AM')
  await expect(page.locator('[data-shot="matching-stack"]')).toBeVisible()
  await page.locator('[data-shot="matching-apply"]').click()
  await expect(page.locator('[data-shot="matching-banner"]')).toContainText('Needs an invoice destination')
  await expect(stat(page, 'open')).toContainText('5')

  await row(page, 'Diane Foster').click()
  const diff = page.locator('[data-shot="matching-diff"]')
  await expect(diff).toContainText('Replaces the current text')
  await expect(diff).toContainText('WLE MM')
  await diff.getByRole('checkbox', { name: /Note/ }).uncheck()
  await expect(page.locator('[data-shot="matching-apply"]')).toHaveText(/Apply 2 changes/)
  await page.screenshot({ path: 'visual/shots/admin-matching-diff.png', fullPage: true })
  await page.locator('[data-shot="matching-apply"]').click()
  await expect(page.locator('[data-shot="matching-banner"]')).toBeVisible()

  await row(page, 'Marcus Webb').first().click()
  await expect(panel(page)).toContainText('Cancellation')
  await page.locator('[data-shot="matching-apply"]').click()
  await expect(page.locator('[data-shot="matching-banner"]')).toBeVisible()
  await row(page, 'Marcus Webb').first().click()
  await expect(panel(page)).toContainText('New')
  await page.locator('[data-shot="matching-apply"]').click()
  await expect(page.locator('[data-shot="matching-banner"]')).toBeVisible()
  expect(/Reschedule/.test(await page.locator('body').innerText())).toBe(false)

  await row(page, 'Dylan Kereama').click()
  await panel(page).getByRole('radio', { name: /Reject/ }).click()
  await expect(page.locator('[data-shot="matching-apply"]')).toBeDisabled()
  await panel(page).getByRole('button', { name: 'Not an AA booking' }).click()
  await page.locator('[data-shot="matching-apply"]').click()
  await expect(stat(page, 'open')).toContainText('1')
})

test("S1 Beat 1: Sarah Mitchell's strong balance warning previews, lands on the to-do list, and shows on Dr Souter's mobile List", async ({ page }) => {
  // Catch-up Phase 40: she owes $610.00 on an invoice billed to her, unpaid 98 days.
  await fresh(page)
  await importSample(page, 'SAMPLE_STG')
  await row(page, 'Sarah Mitchell').click()
  const preview = page.locator('[data-shot="matching-balance-preview"]')
  await expect(preview).toBeVisible()
  await expect(preview).toHaveAttribute('data-strength', 'strong')
  await expect(preview).toContainText('$610.00')
  await expect(preview).toContainText('98 days')
  await expect(page.locator('[data-shot="matching-patient-record-link"]')).toBeVisible()
  await page.screenshot({ path: 'visual/shots/admin-matching-balance-preview.png', fullPage: true })

  await page.locator('[data-shot="matching-apply"]').click()
  const result = page.locator('[data-shot="matching-balance-result"]')
  await expect(result).toHaveAttribute('data-strength', 'strong')
  await expect(result).toContainText('Strong balance warning on the to-do list')

  await page.goto('/admin/day/2026-11-24')
  await page.waitForLoadState('networkidle')
  const todo = page.locator('[data-shot="admin-warnings-todo"]')
  // The practice's To-do runs past the card's first rows.
  await todo.getByRole('button', { name: /^Show all/ }).click()
  const todoRow = todo.locator('li', { hasText: 'Sarah Mitchell' }).filter({ hasText: '$610.00' })
  await expect(todoRow).toHaveCount(1)
  await expect(todoRow).toContainText('98 days')

  await page.goto('/mobile/lists/L-34821-2026-12-01-AM')
  await page.waitForLoadState('networkidle')
  const chip = page.locator('[data-shot="balance-alert-chip"][data-strength="strong"]')
  await expect(chip.first()).toBeVisible()
  expect(/\$610/.test(await page.locator('body').innerText())).toBe(false)
  await page.screenshot({ path: 'visual/shots/mobile-balance-alert-strong.png', fullPage: true })
})

test('the later update for the Booking R1 created waits for approval', async ({ page }) => {
  await fresh(page)
  await importSample(page, 'SAMPLE_STG')
  await row(page, 'Sarah Mitchell').click()
  await page.locator('[data-shot="matching-apply"]').click()
  await expect(page.locator('[data-shot="matching-banner"]')).toBeVisible()
  await importSample(page, 'SAMPLE_STG_UPDATE')
  await row(page, 'Sarah Mitchell').click()
  await expect(panel(page)).toContainText('Matched by date, surgeon, hospital and session, then NHI')
  await expect(page.locator('[data-shot="matching-apply"]')).toHaveText(/Apply 3 changes/)
  await page.screenshot({ path: 'visual/shots/admin-matching-update.png', fullPage: true })
})

test('Southern Cross: the no-NHI row waits under Unmatched, its stub on the List, until the NHI is added', async ({ page }) => {
  await fresh(page)
  await importSample(page, 'SAMPLE_SX')
  await expect(stat(page, 'unmatched')).toContainText('3')
  await closePanel(page)
  await page.locator('[aria-label="Show rows"]').getByText(/^Unmatched/).click()
  await expect(page.locator('[data-shot="matching-unmatched"]')).toContainText('Waiting for an NHI')
  await row(page, 'Tama Henare').click()
  await expect(page.locator('[data-shot="matching-apply"]')).toBeDisabled()
  await expect(page.locator('[data-shot="matching-stub"]')).toContainText("A stub stands on Dr Souter's Tue 1 Dec PM List")
  await page.screenshot({ path: 'visual/shots/admin-matching-unmatched.png', fullPage: true })
  await page.locator('[data-shot="matching-nhi"]').getByRole('textbox').fill('ZQA1008')
  // Add NHI (catch-up Phase 33a): the Booking takes the stub's place on the List.
  await page.locator('[data-shot="stub-add-nhi"]').click()
  await expect(page.locator('[data-shot="matching-banner"]')).toContainText("Dr Souter's Tue 1 Dec PM List")
  await expect(page.locator('[data-shot="matching-stub-resolved"]')).toBeVisible()
})
