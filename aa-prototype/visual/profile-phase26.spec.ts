import { test, expect } from '@playwright/test'

/**
 * Catch-up Phase 26: the anaesthetist profile and bank details. Dr Souter's
 * Profile card on the mobile More tab and its rate sheet, the web Profile page,
 * and the Admin record page's Profile card with the Master data table. The rate
 * saved here is set back, so no later beat sees it.
 */

test('phase 26 mobile More: the Profile card and the rate sheet', async ({ page }) => {
  await page.goto('/mobile/more')
  await page.waitForLoadState('networkidle')
  const card = page.locator('[data-shot="mobile-profile"]')
  await expect(card).toContainText('$26.50')
  await expect(card).toContainText('10SOUM')
  await expect(card).toContainText('99-0101-•••••21-00')
  await expect(card).not.toContainText('0034821')
  await page.waitForTimeout(450)
  await page.screenshot({ path: 'visual/shots/p26-01-mobile-profile.png' })

  await card.getByRole('button', { name: 'Change' }).click()
  const sheet = page.locator('[data-shot="mobile-rate-sheet"]')
  await expect(sheet).toBeVisible()
  await expect(sheet).toContainText('Authorised Lists keep their locked rate.')
  await page.waitForTimeout(450)
  await page.screenshot({ path: 'visual/shots/p26-02-mobile-rate-sheet.png' })

  await sheet.getByLabel('Rate per unit ($)').fill('27.00')
  await sheet.getByRole('button', { name: 'Save rate' }).click()
  await expect(card.locator('[data-shot="mobile-profile-rate"]')).toContainText('$27.00')

  // Set it back.
  await card.getByRole('button', { name: 'Change' }).click()
  await page.locator('[data-shot="mobile-rate-sheet"]').getByLabel('Rate per unit ($)').fill('26.50')
  await page.locator('[data-shot="mobile-rate-sheet"]').getByRole('button', { name: 'Save rate' }).click()
  await expect(card.locator('[data-shot="mobile-profile-rate"]')).toContainText('$26.50')
})

test('phase 26 web profile: Billing saves; Contact, Identity and Bank are read-only', async ({ page }) => {
  await page.goto('/web/profile')
  await page.waitForLoadState('networkidle')
  const profile = page.locator('[data-shot="web-profile"]')
  await expect(profile.locator('[data-shot="web-bank-panel"]')).toContainText('99-0101-•••••21-00')
  await expect(profile.locator('[data-shot="web-identity-panel"]')).toContainText('10SOUM')
  await expect(profile.getByRole('textbox')).toHaveCount(1)
  const save = profile.getByRole('button', { name: 'Save changes' })
  await expect(save).toBeDisabled()
  await page.waitForTimeout(450)
  await page.screenshot({ path: 'visual/shots/p26-03-web-profile.png', fullPage: true })

  await profile.getByLabel('Rate per unit ($)').fill('27.00')
  await expect(save).toBeEnabled()
  await save.click()
  await expect(profile.getByText('Rate saved.')).toBeVisible()
  await profile.getByLabel('Rate per unit ($)').fill('26.50')
  await save.click()
  await expect(save).toBeDisabled()
})

test('phase 26 admin: Master data columns and the record page Profile card', async ({ page }) => {
  await page.goto('/admin/people/anaesthetists?q=Souter')
  await page.waitForLoadState('networkidle')
  const table = page.locator('[data-shot="masters-anaesthetists"]')
  await expect(table.locator('th').nth(2)).toHaveText('Rate per unit')
  await expect(table.locator('th', { hasText: 'GST period' })).toHaveCount(0)
  const souter = table.locator('tr[data-anaesthetist="34821"]')
  await expect(souter).toContainText('10SOUM')
  await expect(souter).toContainText('99-0101-•••••21-00')
  await page.waitForTimeout(450)
  await page.screenshot({ path: 'visual/shots/p26-04-admin-masters.png', fullPage: true })

  await page.goto('/admin/people/anaesthetists/34821')
  await page.waitForLoadState('networkidle')
  const card = page.locator('[data-shot="anaesthetist-details"]')
  await expect(card.getByRole('heading', { name: 'Profile' })).toBeVisible()
  await expect(card).toContainText('99-0101-•••••21-00')
  await page.waitForTimeout(450)
  await page.screenshot({ path: 'visual/shots/p26-05-admin-record.png', fullPage: true })

  await page.getByRole('button', { name: 'Edit details' }).click()
  const dialog = page.getByRole('dialog')
  await dialog.getByLabel('Bank account number (required)').fill('12-34')
  await expect(dialog.getByText('That bank account number does not look right.', { exact: false })).toBeVisible()
  await dialog.getByLabel('HPI CPN (required)').fill('')
  await expect(dialog.getByRole('button', { name: 'Save changes' })).toBeDisabled()
  // Build plan Phase 52: the sheet has no Status control; the status card makes an anaesthetist inactive.
  await expect(dialog.getByText('Status', { exact: true })).toHaveCount(0)
  await page.waitForTimeout(300)
  await page.screenshot({ path: 'visual/shots/p26-06-admin-edit.png', fullPage: true })
  await page.keyboard.press('Escape')

  const status = page.locator('[data-shot="anaesthetist-status"]')
  await expect(status).toHaveAttribute('data-status', 'active')
  await status.getByRole('button', { name: 'Make inactive' }).click()
  const sheet = page.locator('[data-shot="make-inactive-sheet"]')
  // Dr Souter holds Lists after today, so the sheet lists them and Make inactive waits.
  await expect(sheet.locator('[data-shot="make-inactive-lists"]')).toContainText('Reassign them first.')
  await expect(page.locator('[data-shot="make-inactive-confirm"]')).toBeDisabled()
  await page.waitForTimeout(300)
  await page.screenshot({ path: 'visual/shots/p26-07-admin-make-inactive.png', fullPage: true })
})
