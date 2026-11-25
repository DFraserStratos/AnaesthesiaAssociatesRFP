import { test, expect } from '@playwright/test'

/**
 * Catch-up Phase 18a: specialties, funding tags and the open-price fallbacks.
 * The Specialties tab (add, rename, a held one refusing removal), a surgeon
 * save refused with no specialty then saved with two, the Funding tags tab,
 * and tagging a hospital's first Contract on its page making its Fixed price
 * Contract in the catalogue. Admin only: nothing here has a mobile, web or PWA shot.
 */

test('phase 18a specialties tab', async ({ page }) => {
  await page.goto('/admin/masters?view=specialties')
  await page.waitForLoadState('networkidle')
  const table = page.locator('[data-shot="masters-specialties"]')
  await expect(table.locator('tr[data-specialty]')).toHaveCount(12)
  await expect(table.locator('tr', { hasText: 'Ophthalmology' }).getByText('23 surgeons, 12 Contracts')).toBeVisible()
  await page.screenshot({ path: 'visual/shots/p18a-01-specialties.png', fullPage: true })

  await page.getByRole('button', { name: 'Add specialty' }).click()
  const sheet = page.locator('[data-shot="specialty-sheet"]')
  await sheet.getByLabel('Name').fill('Paediatric surgery')
  await page.screenshot({ path: 'visual/shots/p18a-02-specialty-add.png', fullPage: true })
  await sheet.getByRole('button', { name: 'Add specialty' }).click()
  await expect(table.locator('tr', { hasText: 'Paediatric surgery' })).toBeVisible()

  await page.getByRole('button', { name: 'Rename Paediatric surgery' }).click()
  await sheet.getByLabel('Name').fill('Paediatric and neonatal surgery')
  await sheet.getByRole('button', { name: 'Save name' }).click()
  await expect(table.getByText('Paediatric and neonatal surgery')).toBeVisible()

  await page.getByRole('button', { name: 'Remove Ophthalmology' }).click()
  await expect(page.getByRole('alert')).toContainText('Ophthalmology is held by 23 surgeons and 12 Contracts, so it cannot be removed.')
  await page.screenshot({ path: 'visual/shots/p18a-03-specialty-held.png', fullPage: true })
  await page.getByRole('button', { name: 'Remove Paediatric and neonatal surgery' }).click()
  await expect(table.locator('tr[data-specialty]')).toHaveCount(12)
})

test('phase 18a surgeon specialties: none refused, two saved', async ({ page }) => {
  await page.goto('/admin/masters/surgeons/S-WHITFORD')
  await page.waitForLoadState('networkidle')
  const pills = page.locator('[data-shot="surgeon-specialties"]')
  await expect(pills.getByText('Ophthalmology')).toBeVisible()
  await page.getByRole('button', { name: 'Edit details' }).click()
  const sheet = page.locator('[data-shot="surgeon-edit-sheet"]')
  await sheet.getByRole('button', { name: 'Remove Ophthalmology' }).click()
  await sheet.getByRole('button', { name: 'Save changes' }).click()
  await expect(sheet.getByRole('alert')).toContainText('Choose at least one specialty.')
  await page.screenshot({ path: 'visual/shots/p18a-04-surgeon-required.png', fullPage: true })
  await sheet.getByLabel('Specialties', { exact: true }).selectOption({ label: 'Ophthalmology' })
  await sheet.getByLabel('Specialties', { exact: true }).selectOption({ label: 'Plastic surgery' })
  await sheet.getByRole('button', { name: 'Save changes' }).click()
  await expect(pills.getByText('Plastic surgery')).toBeVisible()
  await page.screenshot({ path: 'visual/shots/p18a-05-surgeon-two.png', fullPage: true })

  await page.goto('/admin/masters?view=surgeons')
  const row = page.locator('[data-shot="masters-surgeons"] tr[data-surgeon="S-WHITFORD"]')
  await expect(row).toContainText('Ophthalmology, Plastic surgery')
})

test('phase 18a funding tags and the Fixed price fallbacks', async ({ page }) => {
  await page.goto('/admin/masters?view=fundingTags')
  await page.waitForLoadState('networkidle')
  const tags = page.locator('[data-shot="masters-funding-tags"]')
  await expect(tags.locator('tr[data-tag] td:first-child')).toHaveText(['SXAP', 'HNZ', 'ACC'])
  await page.getByRole('button', { name: 'Move HNZ up' }).click()
  await expect(tags.locator('tr[data-tag] td:first-child')).toHaveText(['HNZ', 'SXAP', 'ACC'])
  await page.getByRole('button', { name: 'Move HNZ down' }).click()
  await expect(tags.locator('tr[data-tag] td:first-child')).toHaveText(['SXAP', 'HNZ', 'ACC'])
  await page.getByRole('button', { name: 'Remove SXAP' }).click()
  await expect(page.getByRole('alert')).toContainText('SXAP is carried by 11 Contracts')
  await page.screenshot({ path: 'visual/shots/p18a-06-funding-tags.png', fullPage: true })

  // The system rows in the catalogue.
  await page.goto('/admin/contracts')
  await page.waitForLoadState('networkidle')
  const catalogue = page.locator('[data-shot="contract-catalogue"]')
  await page.getByLabel('Search by name, code or AA code').fill('Fixed price')
  await expect(catalogue.locator('tr[data-system="openPriceFallback"]').first()).toBeVisible()
  await expect(catalogue.getByText('No contract · Fixed price')).toBeVisible()
  await page.screenshot({ path: 'visual/shots/p18a-07-fallbacks.png', fullPage: true })
  await page.getByLabel('Search by name, code or AA code').fill('')

  // Tag Forte Health's Contract SXAP on its page: its Fixed price Contract appears at once (Christchurch
  // Eye Surgery holds seeded SXAP items since catch-up Phase 19a, so its fallback already exists).
  await catalogue.locator('tr', { hasText: 'FORTE-001' }).getByRole('button', { name: /^Open / }).click()
  const detail = page.locator('[data-shot="contract-detail"]')
  await expect(detail).toBeVisible()
  const where = detail.locator('[data-shot="contract-where"]')
  await where.getByRole('button', { name: 'Edit where it is offered' }).click()
  await where.getByLabel('Funding tag').selectOption({ label: 'SXAP' })
  await expect(where.locator('[data-shot="contract-placement"]')).toHaveText('Offered under Forte Health › SXAP')
  await page.screenshot({ path: 'visual/shots/p18a-08-contract-tag.png', fullPage: true })
  await where.getByRole('button', { name: 'Save', exact: true }).click()
  await expect(where).not.toHaveAttribute('data-editing', '')
  await expect(where.locator('[data-shot="contract-funding-tag"]')).toContainText('SXAP')
  await page.goto('/admin/contracts')
  await page.waitForLoadState('networkidle')
  await expect(catalogue.getByText('Forte Health · SXAP · Fixed price')).toBeVisible()
  await page.screenshot({ path: 'visual/shots/p18a-09-new-fallback.png', fullPage: true })

  // A system Contract: only its name, AA code and invoice description change (the invoice-and-codes card), no Disable.
  await catalogue.locator('tr', { hasText: 'STG-ACC-FIX' }).getByRole('button', { name: /^Open / }).click()
  await expect(detail.locator('[data-shot="contract-system-notice"]')).toContainText('Only its name, AA code and invoice description can change.')
  await expect(detail.locator('[data-shot="contract-disable"]')).toHaveCount(0)
  await expect(detail.getByRole('button', { name: 'Disable' })).toHaveCount(0)
  await expect(detail.getByRole('button', { name: /^Edit / })).toHaveCount(1)
  await expect(detail.locator('[data-shot="contract-codes"]').getByRole('button', { name: 'Edit invoice and codes' })).toBeVisible()
  await page.screenshot({ path: 'visual/shots/p18a-10-system-contract.png', fullPage: true })
})
