/// <reference lib="dom" />
/**
 * This project's own artifact checks on the real-catalogue board (read-only; runs only with
 * BOARD_E2E_REAL=1). The generic sweep over every region and heading is `artifact-regions.spec.ts`;
 * these name this project's artifacts and sources, so they are not part of the kit.
 */
import { expect, test } from '@playwright/test'

test('a heading with a record ID opens from the Sections list and from its link (B04, R-28)', async ({ page }) => {
  test.setTimeout(90_000)
  // FINDINGS R-28's own case: AR-58's "9.1 Catalogue, EP-04 Contracts", from its link and from the Sections list.
  await page.goto('/#/artifacts/AR-58?region=91-catalogue-ep-04-contracts')
  await expect(page.locator('.doc-sheet .region-box')).toBeVisible({ timeout: 20_000 })
  await expect(page.locator('.viewer-flag')).toHaveCount(0)
  await page.goto('/#/artifacts/AR-58')
  const sections = page.locator('.spot-list.auto')
  if (await page.getByRole('button', { name: /^Show all/ }).isVisible()) await page.getByRole('button', { name: /^Show all/ }).click()
  await sections.getByText('9.1 Catalogue, EP-04 Contracts').click()
  await expect(page).toHaveURL(/region=91-catalogue-ep-04-contracts/)
  await expect(page.locator('.doc-sheet .region-box')).toBeVisible()
  await expect(page.locator('.viewer-flag')).toHaveCount(0)
})

test('real sources open their spot: an RFP printed page, and a note point', async ({ page }) => {
  test.setTimeout(90_000)
  // US-01.1.1 cites the RFP's printed p.18 (PDF p.19) first, and points 17 and 36 of the 29 September notes.
  await page.goto('/#/outline?item=US-01.1.1')
  const rows = page.locator('.sheet .sources-section .link-row')
  await rows.filter({ hasText: 'RFP: Booking and Billing Systems Upgrade' }).first().click()
  await expect(page).toHaveURL(/#\/artifacts\/AR-15\?region=p19$/)
  await expect(page.locator('.pdf-page[data-page="19"] .region-box')).toBeVisible({ timeout: 30_000 })

  await page.goto('/#/outline?item=US-01.1.1')
  await rows.filter({ hasText: 'Notes on the AA client meeting, 29 September' }).getByRole('button', { name: 'Point 36' }).click()
  await expect(page).toHaveURL(/#\/artifacts\/AR-10\?region=L\d+-\d+$/)
  await expect(page.locator('.doc-sheet .region-box')).toBeVisible()
  await expect(page.locator('.viewer-flag')).toHaveCount(0)
})
