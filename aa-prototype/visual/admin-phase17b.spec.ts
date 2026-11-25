import { test, expect } from '@playwright/test'

/**
 * Catch-up Phase 17b: no surgeons' rooms; a practice name, a personal contact
 * and office contacts on each surgeon; the HPI CPN optional. Admin only:
 * nothing here reaches the anaesthetist apps or the PWA.
 */

test('phase 17b the surgeons table: practice, office contact, HPI CPN, and no rooms view', async ({ page }) => {
  // The old rooms view lands on People's Surgeons tab (build plan Phase 53, D100).
  await page.goto('/admin/masters?view=surgeonRooms')
  await page.waitForLoadState('networkidle')
  await expect(page).toHaveURL(/\/admin\/people\/surgeons$/)
  await expect(page.locator('[data-people-tab="surgeons"]')).toHaveAttribute('aria-current', 'page')
  await expect(page.getByRole('button', { name: "Surgeons' rooms", exact: true })).toHaveCount(0)
  const table = page.locator('[data-shot="masters-surgeons"]')
  // The list pages at 50: find each surgeon by name.
  const search = page.getByLabel('Search by name, practice or HPI CPN')
  await search.fill('Wainwright')
  const wainwright = table.locator('tr[data-surgeon="S-WAINWRIGHT"]')
  await expect(wainwright).toHaveAttribute('data-practice', 'Upper GI Partners and Hillsborough Colorectal Specialists')
  await expect(wainwright.getByText('info@uppergi.example')).toBeVisible()
  await search.fill('Whaanga')
  await expect(table.locator('tr[data-surgeon="S-WHAANGA"]').getByText('No HPI CPN yet')).toBeVisible()
  await page.waitForTimeout(450)
  await page.screenshot({ path: 'visual/shots/p17b-01-surgeons.png', fullPage: true })
})

test("phase 17b Mr Wainwright's profile: practice and contacts, an office contact per practice", async ({ page }) => {
  await page.goto('/admin/people/surgeons/S-WAINWRIGHT')
  await page.waitForLoadState('networkidle')
  await expect(page.locator('[data-shot="surgeon-name-card"]').getByText('Upper GI Partners and Hillsborough Colorectal Specialists')).toBeVisible()
  const card = page.locator('[data-shot="surgeon-contacts"]')
  await expect(card.locator('[data-office-contact]')).toHaveCount(2)
  await expect(card.locator('[data-office-contact="1"]').getByText('Office emails go here first')).toBeVisible()
  await expect(page.locator('[data-shot="surgeon-room-card"]')).toHaveCount(0)
  await page.waitForTimeout(450)
  await page.screenshot({ path: 'visual/shots/p17b-02-profile.png', fullPage: true })
})

test('phase 17b the Contacts card (Phase 55): plus adds an office contact set, minus removes an extra one', async ({ page }) => {
  await page.goto('/admin/people/surgeons/S-DALGETY')
  await page.waitForLoadState('networkidle')
  await page.getByRole('button', { name: 'Edit contacts' }).click()
  const sheet = page.locator('[data-shot="surgeon-contacts"]')
  await expect(sheet.locator('[data-office-contact]')).toHaveCount(2)
  await sheet.getByRole('button', { name: 'Add office contact' }).click()
  await expect(sheet.locator('[data-office-contact]')).toHaveCount(3)
  await expect(sheet.locator('[data-office-contact="3"] [data-contact-field="name"]')).toBeFocused()
  await page.waitForTimeout(450)
  await page.screenshot({ path: 'visual/shots/p17b-03-edit-sheet.png', fullPage: true })
  await sheet.getByRole('button', { name: 'Remove office contact 3' }).click()
  await expect(sheet.locator('[data-office-contact]')).toHaveCount(2)
  await expect(sheet.getByRole('button', { name: 'Remove office contact 1' })).toHaveCount(0)
})
