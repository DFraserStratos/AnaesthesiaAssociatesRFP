import { expect, test, type Page } from '@playwright/test'
import { runDemoAction } from './demoActions'

/**
 * Catch-up Phase 42 · Master data, reference data and loads: Public holidays,
 * the hospital calendar with Labour Day, the Seed load view with staged
 * hospitals, RVG groups, surgeons and Contracts loads and the loaded state,
 * the RVG time rule sheet, and the go-live view before and after "Load
 * approved data". Staged through the harness bar's Demo actions.
 */

const MASTERS = '/admin/masters'

async function fresh(page: Page, path: string): Promise<void> {
  await page.goto(path)
  await page.evaluate(() => window.localStorage.clear())
  await page.goto(path)
  await page.waitForLoadState('networkidle')
}

async function cleanCopy(page: Page, where: string) {
  const text = (await page.locator('body').innerText())
  expect(/\bslots?\b/i.test(text), `${where} shows "slot"`).toBe(false)
  expect(/phase 42/i.test(text), `${where} shows "Phase 42"`).toBe(false)
  expect(/[–—]/.test(text), `${where} shows an en or em dash`).toBe(false)
}

/** Stage a sample sheet from the bar and return its result panel on Seed load. */
async function stageSample(page: Page, entity: string, fileName: string) {
  const msg = await runDemoAction(page, 'load-sample-spreadsheet', { choice: fileName, close: true })
  expect(msg).toContain(`${fileName} checked`)
  const panel = page.locator(`[data-seed-sheet="${entity}"] [data-shot="master-load-result"]`)
  await expect(panel).toHaveAttribute('data-load-status', 'staged')
  return panel
}

test('Public holidays: the master calendar, and Christmas Day on the hospital calendar', async ({ page }) => {
  await fresh(page, `${MASTERS}?view=publicHolidays`)
  const view = page.locator('[data-shot="masters-public-holidays"]')
  await expect(view.getByRole('heading', { name: 'Public holidays', exact: true })).toBeVisible()
  await expect(view.locator('tr[data-public-holiday]').filter({ hasText: 'Labour Day' })).toBeVisible()
  await expect(view.getByRole('button', { name: 'Add public holiday' })).toBeVisible()
  await expect(page.locator('[data-masters-view="publicHolidays"]')).toHaveAttribute('aria-current', 'page')
  await page.screenshot({ path: 'visual/shots/p42-01-public-holidays.png', fullPage: true })
  await cleanCopy(page, 'Public holidays')

  await page.goto(`${MASTERS}?view=hospitals`)
  await page.waitForLoadState('networkidle')
  await page.getByRole('button', { name: 'Calendar', exact: true }).click()
  const calendar = page.locator('[data-shot="hospital-calendar"]')
  await calendar.getByLabel('Hospital').selectOption({ label: "St George's" })
  // The calendar opens on the demo month (Nov 2026), so Labour Day (26 Oct) is behind it: the next is Christmas.
  await calendar.getByRole('button', { name: 'Next month' }).click()
  await expect(calendar).toContainText('December 2026')
  const christmas = calendar.locator('button[data-calendar-day="2026-12-25"]')
  await expect(christmas).toContainText('Christmas Day')
  await expect(christmas).toContainText('Public holiday')
  await expect(christmas).toHaveAttribute('aria-label', /Christmas Day \(public holiday\)/)
  await page.screenshot({ path: 'visual/shots/p42-02-hospital-calendar-labour-day.png', fullPage: true })
  await cleanCopy(page, 'Hospital calendar')
})

test('Seed load: a staged hospitals load, its result panel, and the loaded state', async ({ page }) => {
  await fresh(page, `${MASTERS}?view=seedLoad`)
  const view = page.locator('[data-shot="seed-load"]')
  await expect(view.getByRole('heading', { name: 'Seed load', exact: true })).toBeVisible()
  await expect(view).toContainText('Demo stand-in: in the real system a developer runs this load')
  await expect(view).toContainText('There is no Contract upload or export in the first release')
  await expect(view.locator('[data-seed-sheet]')).toHaveCount(12)
  await expect(view.locator('[data-seed-sheet="surgeons"]')).toContainText('A surgeon needs at least one specialty; an HPI CPN may be left blank.')
  await expect(view).toContainText('Reset the demo and load the same sheets again: the records come back identical.')
  await page.screenshot({ path: 'visual/shots/p42-03-seed-load.png', fullPage: true })
  await cleanCopy(page, 'Seed load')

  const panel = await stageSample(page, 'hospitals', 'hospitals.csv')
  await expect(panel).toContainText('hospitals.csv: 6 rows · 2 valid · 4 rejected')
  await expect(panel.locator('tr[data-row-status="valid"]')).toHaveCount(2)
  await expect(panel.locator('tr[data-row-status="rejected"]')).toHaveCount(4)
  const commit = panel.locator('[data-shot="master-load-commit"]')
  await expect(commit).toHaveText('Load 2 valid rows')
  await panel.scrollIntoViewIfNeeded()
  await page.screenshot({ path: 'visual/shots/p42-04-hospitals-staged.png', fullPage: true })

  await panel.getByRole('button', { name: 'Only rejected' }).click()
  await expect(panel.locator('tr[data-row-status="valid"]')).toHaveCount(0)
  await panel.getByRole('button', { name: 'All rows' }).click()

  await commit.click()
  await expect(panel).toHaveAttribute('data-load-status', 'loaded')
  await expect(panel.locator('[data-shot="master-load-loaded"]')).toContainText('Loaded 2 rows on 24 Nov 2026 · 4 rejected rows were not loaded')
  await expect(panel.getByRole('button', { name: /Open the record from row/ })).toHaveCount(2)
  await page.screenshot({ path: 'visual/shots/p42-05-hospitals-loaded.png', fullPage: true })
  await cleanCopy(page, 'Seed load, loaded')

  await page.goto(`${MASTERS}?view=hospitals`)
  await page.waitForLoadState('networkidle')
  await expect(page.locator('[data-shot="masters-hospitals"]')).toContainText('Rangiora Day Surgery')
  await expect(page.locator('[data-shot="masters-hospitals"]')).toContainText('Ashburton Hospital')
})

test('Seed load: staged RVG groups, surgeons and Contracts loads', async ({ page }) => {
  await fresh(page, `${MASTERS}?view=seedLoad`)

  const rvg = await stageSample(page, 'rvgGroups', 'rvg-groups.csv')
  await expect(rvg).toContainText('rvg-groups.csv: 7 rows · 3 valid · 4 rejected')
  await expect(page.locator('[data-seed-sheet="rvgGroups"]')).toContainText('A code may appear on more than one row.')
  await rvg.scrollIntoViewIfNeeded()
  await page.screenshot({ path: 'visual/shots/p42-06-rvg-groups-staged.png', fullPage: true })

  const surgeons = await stageSample(page, 'surgeons', 'surgeons.csv')
  await expect(surgeons).toContainText('surgeons.csv: 10 rows · 5 valid · 5 rejected')
  // No specialty: rejected.
  await expect(surgeons.locator('tr[data-load-row]').filter({ hasText: 'Mr Peter Lawry' })).toHaveAttribute('data-row-status', 'rejected')
  // No HPI CPN: valid.
  await expect(surgeons.locator('tr[data-load-row]').filter({ hasText: 'Dr Matthew Corrigan' })).toHaveAttribute('data-row-status', 'valid')
  // No surname: valid, with its note.
  const aroha = surgeons.locator('tr[data-load-row]').filter({ hasText: 'Dr Aroha' })
  await expect(aroha).toHaveAttribute('data-row-status', 'valid')
  await expect(aroha).toContainText('No surname: complete it in People.')
  await expect(surgeons.locator('tr[data-load-row]').filter({ hasText: 'Jane Mercer' })).toContainText('No title: complete it in People.')
  await surgeons.scrollIntoViewIfNeeded()
  await page.screenshot({ path: 'visual/shots/p42-07-surgeons-staged.png', fullPage: true })

  const contracts = await stageSample(page, 'contracts', 'contracts.csv')
  await expect(contracts).toContainText('contracts.csv: 9 rows · 4 valid · 5 rejected')
  const prepaidRvg = contracts.locator('tr[data-load-row]').filter({ hasText: 'Septoplasty' })
  await expect(prepaidRvg).toHaveAttribute('data-row-status', 'rejected')
  await expect(prepaidRvg).toContainText(/prepaid/i)
  await expect(contracts.locator('tr[data-load-row]').filter({ hasText: 'Hip arthroscopy fixed fee' })).toContainText('1 range')
  await contracts.scrollIntoViewIfNeeded()
  await page.screenshot({ path: 'visual/shots/p42-08-contracts-staged.png', fullPage: true })
  await cleanCopy(page, 'Seed load, staged')
})

test('RVG groups: the time rule sheet', async ({ page }) => {
  await fresh(page, `${MASTERS}?view=rvgGroups`)
  await page.locator('[data-shot="rvg-time-rule-edit"]').click()
  const sheet = page.locator('[data-shot="rvg-time-rule-sheet"]')
  await expect(sheet).toBeVisible()
  await expect(sheet.getByRole('heading', { name: 'Edit the RVG time rule' })).toBeVisible()
  await expect(sheet.locator('[data-shot="rvg-time-rule-part-interval"]')).toHaveText('A part interval always rounds up.')
  await expect(sheet.locator('[data-shot="rvg-time-rule-preview"]')).toContainText('95')
  await expect(sheet.locator('[data-shot="rvg-time-rule-preview"]')).toContainText('125')
  await page.screenshot({ path: 'visual/shots/p42-09-rvg-time-rule-sheet.png', fullPage: true })
  await cleanCopy(page, 'RVG time rule sheet')
})

test('Go-live load: before and after "Load approved data"', async ({ page }) => {
  await fresh(page, `${MASTERS}?view=goLive`)
  const view = page.locator('[data-shot="masters-go-live"]')
  await expect(view.getByRole('heading', { name: 'Go-live load', exact: true })).toBeVisible()
  await expect(view).toContainText('No go-live load prepared')

  const msg = await runDemoAction(page, 'go-live-data-load', { close: true })
  expect(msg).toMatch(/^Go-live load prepared:/)
  await expect(view).toHaveAttribute('data-go-live-status', 'staged')
  await expect(view.locator('[data-shot="go-live-candidates"] tr[data-scan-row]').first()).toBeVisible()
  await expect(view).toContainText('Solutions Plus identifiers and unit values are not carried over. Only operation names are used.')
  await expect(view.locator('[data-shot="go-live-tile-load"]')).toContainText('Will load')
  await page.screenshot({ path: 'visual/shots/p42-10-go-live-staged.png', fullPage: true })
  await cleanCopy(page, 'Go-live, staged')

  await view.locator('[data-shot="go-live-commit"]').click()
  await expect(view).toHaveAttribute('data-go-live-status', 'loaded')
  const result = view.locator('[data-shot="go-live-result"]')
  await expect(result).toContainText(/Loaded .+\. \d+ Solutions Plus entr(y was|ies were) not loaded\./)
  await expect(view.locator('[data-shot="go-live-commit"]')).toHaveCount(0)
  await page.screenshot({ path: 'visual/shots/p42-11-go-live-loaded.png', fullPage: true })
  await cleanCopy(page, 'Go-live, loaded')
})
