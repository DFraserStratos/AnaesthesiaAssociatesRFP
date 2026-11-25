import { test, expect, type Locator, type Page } from '@playwright/test'

/**
 * UI unification U2: one modal layer. The Escape bug (README section 4 bug 1):
 * with the RVG code picker open over a Contract being edited, one Escape used
 * to close both and lose the edit. Now it closes the picker only; the edit
 * stays. Since build plan Phase 45 the edit is the invoice-and-codes card on
 * the Contract's page; the create panel (New contract) keeps the same rule.
 * `visual/shots/u2-escape-after.png` sits beside
 * `docs/archive/ui-unification/shots/escape-bug-after.png`, which shows nothing open.
 */

const panel = (page: Page) => page.locator('[data-shot=contract-detail]')
const codes = (page: Page) => page.locator('[data-shot=contract-codes]')
const picker = (page: Page) => page.locator('[data-shot=rvg-type-ahead]')

async function editThenOpenPicker(page: Page, form: Locator) {
  const name = form.getByLabel('Name', { exact: true })
  await name.fill('Edited before the picker')
  await form.getByRole('button', { name: 'Choose the default RVG code' }).click()
  await expect(picker(page)).toBeVisible()
}

test('U2 Escape bug: one Escape in the code picker closes the picker only, the invoice-and-codes edit stays', async ({ page }) => {
  await page.goto('/admin/contracts')
  await page.waitForLoadState('networkidle')
  const row = page.locator('tr[data-contract]').filter({ has: page.locator('td:first-child', { hasText: /^CES-001$/ }) })
  await row.getByRole('button', { name: /^Open / }).click()
  await expect(panel(page)).toBeVisible()
  await codes(page).getByRole('button', { name: 'Edit invoice and codes' }).click()
  await expect(codes(page)).toHaveAttribute('data-editing', '')

  // Search empty, focus in the search (autoFocus): one Escape.
  await editThenOpenPicker(page, codes(page))
  await expect(picker(page).getByRole('searchbox')).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(picker(page)).toHaveCount(0)
  await expect(codes(page)).toHaveAttribute('data-editing', '')
  await expect(codes(page).getByLabel('Name', { exact: true })).toHaveValue('Edited before the picker')
  await expect(codes(page).getByRole('button', { name: 'Choose the default RVG code' })).toBeFocused()
  await page.screenshot({ path: 'visual/shots/u2-escape-after.png' })

  // Again with focus on a picker row.
  await codes(page).getByRole('button', { name: 'Choose the default RVG code' }).click()
  await picker(page).locator('[role=list] button').first().focus()
  await page.keyboard.press('Escape')
  await expect(picker(page)).toHaveCount(0)
  await expect(codes(page).getByLabel('Name', { exact: true })).toHaveValue('Edited before the picker')

  // Text in the search: Escape clears it, then closes the picker; the edit stays.
  await codes(page).getByRole('button', { name: 'Choose the default RVG code' }).click()
  await picker(page).getByRole('searchbox').fill('H1')
  await page.keyboard.press('Escape')
  await expect(picker(page).getByRole('searchbox')).toHaveValue('')
  await page.keyboard.press('Escape')
  await expect(picker(page)).toHaveCount(0)
  await expect(codes(page)).toHaveAttribute('data-editing', '')
  await expect(codes(page).getByLabel('Name', { exact: true })).toHaveValue('Edited before the picker')
})

test("U2 Escape bug: the demo catalogue's ContractPanel example (the create panel) keeps its panel too", async ({ page }) => {
  await page.goto('/demo/catalogue/admin')
  await page.waitForLoadState('networkidle')
  const row = page.locator('[data-catalogue-row="ContractPanel (ContractEditSheet)"]')
  await row.getByRole('button', { name: 'New Contract' }).click()
  await expect(panel(page)).toBeVisible()
  await expect(panel(page)).toContainText('New contract')
  await editThenOpenPicker(page, panel(page))
  await page.keyboard.press('Escape')
  await expect(picker(page)).toHaveCount(0)
  await expect(panel(page)).toBeVisible()
  await expect(panel(page).getByLabel('Name', { exact: true })).toHaveValue('Edited before the picker')
  // The next Escape closes the panel.
  await page.keyboard.press('Escape')
  await expect(panel(page)).toHaveCount(0)
})

test('U2 one Escape, one layer: the Admin Day List drawer, its History, then the drawer', async ({ page }) => {
  await page.goto('/admin/day/2026-11-24')
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
