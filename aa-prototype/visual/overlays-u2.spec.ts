import { test, expect, type Page } from '@playwright/test'

/**
 * UI unification U2: one modal layer. The Escape bug (README section 4 bug 1):
 * with the RVG code picker open over the Contract panel, one Escape used to
 * close both and lose the form. Now it closes the picker only; the panel and
 * its edit stay. `visual/shots/u2-escape-after.png` sits beside
 * `docs/ui-unification/shots/escape-bug-after.png`, which shows nothing open.
 */

const panel = (page: Page) => page.locator('[data-shot=contract-detail]')
const picker = (page: Page) => page.locator('[data-shot=rvg-type-ahead]')

async function editThenOpenPicker(page: Page) {
  const name = panel(page).getByLabel('Name', { exact: true })
  await name.fill('Edited before the picker')
  await panel(page).getByRole('button', { name: 'Choose the default RVG code' }).click()
  await expect(picker(page)).toBeVisible()
}

test('U2 Escape bug: one Escape in the code picker closes the picker only, the Contract panel and its edit stay', async ({ page }) => {
  await page.goto('/admin/masters?view=contracts')
  await page.waitForLoadState('networkidle')
  const row = page.locator('tr[data-contract]').filter({ has: page.locator('td:first-child', { hasText: /^CES-001$/ }) })
  await row.getByRole('button', { name: /^Edit / }).click()
  await expect(panel(page)).toBeVisible()

  // Search empty, focus in the search (autoFocus): one Escape.
  await editThenOpenPicker(page)
  await expect(picker(page).getByRole('searchbox')).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(picker(page)).toHaveCount(0)
  await expect(panel(page)).toBeVisible()
  await expect(panel(page).getByLabel('Name', { exact: true })).toHaveValue('Edited before the picker')
  await expect(panel(page).getByRole('button', { name: 'Choose the default RVG code' })).toBeFocused()
  await page.screenshot({ path: 'visual/shots/u2-escape-after.png' })

  // Again with focus on a picker row.
  await panel(page).getByRole('button', { name: 'Choose the default RVG code' }).click()
  await picker(page).locator('[role=list] button').first().focus()
  await page.keyboard.press('Escape')
  await expect(picker(page)).toHaveCount(0)
  await expect(panel(page).getByLabel('Name', { exact: true })).toHaveValue('Edited before the picker')

  // Text in the search: Escape clears it, then closes the picker, then the panel.
  await panel(page).getByRole('button', { name: 'Choose the default RVG code' }).click()
  await picker(page).getByRole('searchbox').fill('H1')
  await page.keyboard.press('Escape')
  await expect(picker(page).getByRole('searchbox')).toHaveValue('')
  await page.keyboard.press('Escape')
  await expect(picker(page)).toHaveCount(0)
  await expect(panel(page)).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(panel(page)).toHaveCount(0)
})

test("U2 Escape bug: the demo catalogue's ContractPanel example keeps its panel too", async ({ page }) => {
  await page.goto('/demo/catalogue/admin')
  await page.waitForLoadState('networkidle')
  const row = page.locator('[data-catalogue-row="ContractPanel (ContractEditSheet)"]')
  await row.getByRole('button', { name: 'New Contract' }).click()
  await expect(panel(page)).toBeVisible()
  await editThenOpenPicker(page)
  await page.keyboard.press('Escape')
  await expect(picker(page)).toHaveCount(0)
  await expect(panel(page)).toBeVisible()
  await expect(panel(page).getByLabel('Name', { exact: true })).toHaveValue('Edited before the picker')
})

test('U2 one Escape, one layer: the Admin Day List drawer, its History, then the drawer', async ({ page }) => {
  await page.goto('/admin/day/2026-07-21')
  await page.waitForLoadState('networkidle')
  await page.locator('[data-list-id]').first().click()
  const drawer = page.getByTestId('admin-list-drawer')
  await expect(drawer).toBeVisible()
  await expect(drawer).toHaveAttribute('role', 'dialog')
  await drawer.getByRole('button', { name: 'History' }).click()
  await expect(page.getByRole('dialog')).toHaveCount(2)
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).toHaveCount(1)
  await expect(drawer).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(drawer).toHaveCount(0)
})
