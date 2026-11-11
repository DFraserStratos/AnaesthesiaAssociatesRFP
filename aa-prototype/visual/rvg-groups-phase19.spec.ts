import { expect, test, type Page } from '@playwright/test'

/**
 * Catch-up Phase 19: the RVG groups and the RVG code type-ahead. Any base-unit
 * value is accepted; one outside the guide warns the office after the procedure.
 */

async function openEllison(page: Page): Promise<void> {
  await page.goto('/mobile')
  await page.waitForLoadState('networkidle')
  await page.getByText('Southern Cross', { exact: false }).first().click()
  await page.waitForTimeout(500)
  await page.getByText('Margaret Ellison', { exact: false }).first().click()
  await page.waitForTimeout(600)
}

async function advanceClockTo1715(page: Page): Promise<void> {
  await page.goto('/demo/control')
  await page.waitForLoadState('networkidle')
  for (let i = 0; i < 9; i++) await page.getByRole('button', { name: '+1 hour' }).click()
  await page.getByRole('button', { name: '+15 min' }).click()
  await page.waitForTimeout(200)
}

const card = (page: Page) => page.locator('[data-shot=capture-procedure-code]').first()
const search = (page: Page) => page.getByPlaceholder('Search RVG code or description')

test('an AA group added in Admin is picked in the mobile type-ahead', async ({ page }) => {
  await page.goto('/admin/masters?view=rvgGroups')
  await page.waitForLoadState('networkidle')
  await page.getByRole('button', { name: 'Add group' }).click()
  const sheet = page.locator('[data-shot=rvg-group-sheet]')
  await sheet.getByLabel('RVG code').fill('H3')
  await sheet.getByLabel('Anatomy heading').fill('Head')
  await sheet.getByLabel('Description').fill('Brow lift')
  await sheet.getByRole('textbox', { name: 'Base units' }).fill('0')
  await sheet.getByRole('button', { name: 'Add group' }).click()
  await expect(sheet.getByRole('alert')).toHaveText('Base units must be a whole number above 0.')
  await sheet.getByRole('textbox', { name: 'Base units' }).fill('5')
  await sheet.getByRole('button', { name: 'Add group' }).click()
  await expect(sheet).toHaveCount(0)
  await expect(page.locator('[data-shot=masters-rvg-groups]')).toContainText('Brow lift')

  await openEllison(page)
  await card(page).getByText('Change', { exact: true }).click()
  await search(page).fill('brow')
  await page.locator('button[data-rvg-code=H3]', { hasText: 'Brow lift' }).click()
  await expect(card(page)).toContainText('Brow lift')
  await expect(card(page)).toContainText('Base 5 units · from the RVG group')
  await expect(page.locator('[data-shot=units-row-b]').first()).toContainText('From the RVG group')
  await page.screenshot({ path: 'visual/shots/p19-01-aa-group-picked.png' })
})

test('typing a code lists every row with that code, each with its description, anatomy and base units', async ({ page }) => {
  await openEllison(page)
  await card(page).getByText('Change', { exact: true }).click()
  await expect(search(page)).toBeFocused()
  await search(page).fill('H1')
  const h1 = page.locator('button[data-rvg-code=H1]')
  await expect(h1.first()).toContainText('B 4')
  await expect(h1.first()).toContainText('Head')
  await search(page).fill('T2')
  const t2 = page.locator('button[data-rvg-code=T2]')
  await expect(t2).toHaveCount(3)
  await page.screenshot({ path: 'visual/shots/p19-02-type-ahead-t2.png' })
  await search(page).fill('zzzz')
  await expect(page.getByText('No RVG codes match that search.')).toBeVisible()
})

test('Clear leaves the Procedure with no RVG code and its text untouched', async ({ page }) => {
  await openEllison(page)
  await card(page).getByRole('button', { name: 'Clear' }).click()
  await expect(card(page)).toContainText('No RVG code')
  // Catch-up Phase 20: Ellison's Contract prices from RVG units, so the code is required: "Add RVG code".
  await expect(card(page)).toContainText('Add RVG code')
  await expect(page.locator('[data-shot=units-row-b]').first()).toContainText('No RVG code')
})

test('H4 with 14 typed: the caption, completion goes through, the warning on the Admin To-do', async ({ page }) => {
  await advanceClockTo1715(page)
  await openEllison(page)
  await card(page).getByText('Change', { exact: true }).click()
  await search(page).fill('H4')
  await page.locator('button[data-rvg-code=H4]').first().click()
  await expect(page.locator('[data-shot=rvg-range-units]')).toContainText('Guide 10 to 12 · starts at 10')
  await page.getByRole('button', { name: 'Base units 10. Type a value' }).click()
  await page.getByLabel('Base units', { exact: true }).fill('14')
  await page.keyboard.press('Enter')
  await expect(page.locator('[data-shot=rvg-range-units]')).toContainText('14 chosen')
  await expect(page.locator('[data-shot=rvg-outside-guide]')).toHaveText('Outside the guide range. The office will see a warning after the procedure.')
  await page.screenshot({ path: 'visual/shots/p19-03-outside-guide.png' })

  await page.getByRole('button', { name: 'Finish now' }).click()
  await page.getByRole('button', { name: 'Mark complete' }).click()
  await expect(page.getByRole('button', { name: 'Mark list completed' })).toBeVisible()

  await page.goto('/admin/day/2026-07-21')
  await page.waitForLoadState('networkidle')
  await expect(page.locator('[data-shot="admin-warnings-todo"]')).toContainText('Base units 14 are outside the RVG guide for H4 (10 to 12).')
})
