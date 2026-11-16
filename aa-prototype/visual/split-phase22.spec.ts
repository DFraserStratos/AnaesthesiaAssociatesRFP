import { test, expect, type Page } from '@playwright/test'

/**
 * Catch-up Phase 22: the Split button (US-08.2.3) on a Procedure's Contract
 * part, the office's on the Admin Booking detail and the anaesthetist's on the
 * phone, and the Master data Contracts table's derived Layout and Delivery
 * columns (US-04.2.8). Prentice's Booking (BK0025, Souter Mon 20 PM) is seeded
 * split: nib $132.50, Alan Prentice the rest of $212.00.
 */

async function shareRow(page: Page, index: number) {
  return page.locator('[data-shot="split-row"]').nth(index)
}

test('the office splits a fee on the Admin Booking detail', async ({ page }) => {
  await page.goto('/admin/day/2026-07-20/bookings/BK0025')
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(400)

  const summary = page.locator('[data-shot="procedure-split-summary"]')
  await expect(summary).toHaveText('nib $132.50, Alan Prentice $79.50 (the rest)')
  await expect(page.getByText(/^Funder alloc/)).toHaveCount(0)
  await expect(page.getByText(/^Funders$/)).toHaveCount(0)

  await page.locator('[data-shot="procedure-split-button"]').click()
  const sheet = page.locator('[data-shot="split-sheet"]')
  await expect(sheet).toBeVisible()
  await expect(sheet.locator('[data-shot="split-fee"]')).toHaveText('$212.00')
  await expect(sheet.locator('[data-shot="split-amount"]')).toHaveText(['$132.50', '$79.50'])
  await expect(sheet.locator('[data-shot="split-total"]')).toHaveText('$212.00 of $212.00')
  await page.waitForTimeout(500)
  await page.screenshot({ path: 'visual/shots/s22-01-split-sheet-amount.png', fullPage: true })

  // 62.5% gives the same amounts.
  const nibShare = (await shareRow(page, 0)).locator('[data-shot="split-share-input"] input')
  await nibShare.fill('62.5%')
  await expect(sheet.locator('[data-shot="split-amount"]')).toHaveText(['$132.50', '$79.50'])
  await page.screenshot({ path: 'visual/shots/s22-02-split-sheet-percent.png', fullPage: true })

  // Words are refused with the parser's message.
  await nibShare.fill('abc')
  await expect(sheet.getByRole('alert')).toHaveText('Type an amount such as $48 or a percentage such as 48%.')

  // "Takes the rest" is one of N: choosing it on nib's row takes it off Alan's, whose share is then needed.
  await nibShare.fill('60%')
  await (await shareRow(page, 0)).locator('[data-shot="split-rest-toggle"]').click()
  await expect((await shareRow(page, 1)).locator('[data-shot="split-rest-toggle"]')).toHaveAttribute('aria-checked', 'false')
  await expect((await shareRow(page, 1)).locator('[data-shot="split-share-input"] input')).toBeVisible()
  await expect(sheet.locator('[data-shot="split-total"]')).toHaveText('· of $212.00')
  await (await shareRow(page, 1)).locator('[data-shot="split-rest-toggle"]').click()

  // nib 60% and save.
  await expect(sheet.locator('[data-shot="split-amount"]')).toHaveText(['$127.20', '$84.80'])
  await sheet.getByRole('button', { name: 'Save split' }).click()
  await expect(sheet).toHaveCount(0)
  await expect(summary).toHaveText('nib $127.20, Alan Prentice $84.80 (the rest)')

  // Remove split: invoiced in full to the payer.
  await page.locator('[data-shot="procedure-split-button"]').click()
  await page.locator('[data-shot="split-sheet"]').getByRole('button', { name: 'Remove split' }).click()
  await expect(summary).toHaveText('Alan Prentice')
})

test('Master data Contracts: Layout and Delivery are derived, read-only columns', async ({ page }) => {
  await page.goto('/admin/masters?view=contracts')
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(400)
  const table = page.locator('[data-shot="contract-catalogue"]').last()
  const nib = table.locator('tr[data-contract="CT-NIB-D1"]')
  await expect(nib.locator('[data-shot="contract-layout"]')).toHaveText("Holder's layout")
  await expect(nib.locator('[data-shot="contract-delivery"]')).toHaveText('Email')
  await expect(nib).toContainText('NIBAN2026')
  const rvg = table.locator('tr[data-system="noContractRvg"]')
  await expect(rvg.locator('[data-shot="contract-layout"]')).toHaveText("Patient's layout")
  await expect(rvg.locator('[data-shot="contract-delivery"]')).toHaveText("Payer's email or post")
  await nib.scrollIntoViewIfNeeded()
  await page.screenshot({ path: 'visual/shots/s22-03-contracts-layout-delivery.png', fullPage: true })
})

test('the anaesthetist splits a fee on the phone, before the List is authorised', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/mobile/lists/L-34821-2026-07-21-AM/bookings/BK0002')
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(800)

  // Paid by is the Billing summary's fourth row on the phone (owner review, idea 6).
  const summary = page.locator('[data-shot="procedure-split-summary"]').first()
  await expect(summary).toContainText("St George's")
  await expect(summary).toContainText('Tap to split the fee')
  await page.locator('[data-shot="procedure-split-button"]').first().click()
  const sheet = page.locator('[data-shot="split-sheet"]')
  await expect(sheet).toBeVisible()

  // The second row: an insurer at 40%; the first (the Contract's party) takes the rest.
  const second = page.locator('[data-shot="split-row"]').nth(1)
  await second.getByTestId('party-picker-toggle').click()
  await second.locator('[data-shot="party-option"]').filter({ hasText: 'nib' }).click()
  await second.locator('[data-shot="split-share-input"] input').fill('40%')
  await expect(sheet.locator('[data-shot="split-amount"]').nth(1)).not.toHaveText('·')
  await page.waitForTimeout(500)
  await page.screenshot({ path: 'visual/shots/s22-04-mobile-split-sheet.png' })
  await sheet.getByRole('button', { name: 'Save split' }).click()
  await expect(sheet).toHaveCount(0)
  await expect(summary).toContainText('nib $')
  await expect(summary).toContainText('Split 2 ways')
})
