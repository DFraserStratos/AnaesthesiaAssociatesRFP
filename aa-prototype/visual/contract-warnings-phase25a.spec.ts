import { test, expect, type Page } from '@playwright/test'

/**
 * Catch-up Phase 25a: the Contract change warnings and the Disabled Contract
 * flag. (The warning-only "Replaces" on a new Contract is gone since build plan
 * Phase 46; Phase 49 brings Replace from a date.) Disable's confirm lists them from today and
 * Review of Dr Souter's Mon 10 Aug PM flags each, never blocking; the backdated
 * range warns that Judith Calloway's authorised Face lift kept its old price;
 * the seeded Disabled Contract's Booking on 21a's review-flags List reads
 * "Contract disabled on Fri 10 Jul". Screenshots land in `visual/shots/p25a-*.png`.
 */

const FACE_LIFT = 'CT-MER-FACELIFT'
const MON_10_AUG = 'L-34821-2026-12-14-PM'
const REVIEW_FLAGS_LIST = 'L-45178-2026-11-17-AM'

/** A Contract's page, by its id (build plan Phase 45): a Disabled one opens the same way. */
async function openContract(page: Page, id: string) {
  await page.goto(`/admin/contracts/${id}`)
  await page.waitForLoadState('networkidle')
  await expect(page.locator('[data-shot=contract-detail]')).toBeVisible()
}

test('phase 25a Disable lists the Procedures still on the Face lift; Review flags them, never as a blocker; Make active clears them', async ({ page }) => {
  await openContract(page, FACE_LIFT)
  await page.locator('[data-shot=contract-disable]').click()
  // The confirm lists the Procedures still on it from today; nothing moves.
  const sheet = page.locator('[data-shot=contract-disable-sheet]')
  await expect(sheet).toBeVisible()
  await expect(sheet).toContainText('Disable Face lift?')
  const warning = sheet.locator('[data-shot=contract-still-on-warning]')
  await expect(warning).toContainText('dated on or after Tue 24 Nov')
  await expect(warning).toContainText('Sophie Matthews')
  await expect(warning).toContainText('Paula Westerman')
  await expect(warning.locator('[data-shot=contract-still-on-row]').first()).toBeVisible()
  await page.screenshot({ path: 'visual/shots/p25a-02-disable-warning.png', fullPage: true })
  await sheet.locator('[data-shot=contract-disable-confirm]').click()
  await expect(sheet).toHaveCount(0)
  await expect(page.locator('[data-shot=contract-disabled-note]')).toContainText('Disabled on Tue 24 Nov')
  await expect(page.locator('[data-shot=contract-make-active]')).toBeVisible()

  // History records the disable.
  await page.locator('[data-shot=contract-tab-history]').click()
  await expect(page.locator('[data-shot=contract-history]')).toContainText('Kirsty')

  await page.goto(`/admin/lists/to-authorise/${MON_10_AUG}`)
  await page.waitForLoadState('networkidle')
  await expect(page.locator('[data-shot=review-flag]', { hasText: 'Contract disabled on Tue 24 Nov' }).first()).toBeVisible()
  // A flag, never a block: no authorise blocker names it (contractChangeSelectors.test.ts pins the blockers unchanged).
  await expect(page.getByText(/Contract disabled on Tue 24 Nov:/)).toHaveCount(0)
  await page.screenshot({ path: 'visual/shots/p25a-03-review-flag-disabled.png', fullPage: true })

  await openContract(page, FACE_LIFT)
  await page.locator('[data-shot=contract-detail]').getByRole('button', { name: 'Make active' }).click()
  await expect(page.locator('[data-shot=contract-disabled-note]')).toHaveCount(0)
  await page.goto(`/admin/lists/to-authorise/${MON_10_AUG}`)
  await page.waitForLoadState('networkidle')
  await expect(page.locator('[data-shot=review-flag]', { hasText: 'Contract disabled' })).toHaveCount(0)
})

test('phase 25a the backdated range warns that an authorised Procedure kept its old price', async ({ page }) => {
  await openContract(page, FACE_LIFT)
  const ranges = page.locator('[data-shot=contract-price-ranges]')
  await expect(ranges.locator('[data-shot=price-range-kept]')).toHaveCount(0)
  await ranges.locator('[data-shot=price-range-add-open]').getByRole('button', { name: 'Add a price range' }).click()
  await ranges.getByLabel('Start of the new range').fill('2026-11-04')
  await ranges.getByLabel('Price (ex GST) of the new range').fill('3300')
  await ranges.locator('[data-shot=price-range-add-save]').click()
  const kept = ranges.locator('[data-shot=price-range-kept]')
  // The everyday practice seed authorises two more Face lifts on or after 4 Nov (Daniel Poutama, Ella Tawhiri) beside Judith Calloway's.
  await expect(kept).toContainText('3 authorised Procedures kept their old price')
  await expect(kept.locator('[data-shot=price-range-kept-row]')).toHaveCount(3)
  await expect(kept).toContainText('Judith Calloway')
  await expect(kept).toContainText('$3,100.00')
  await expect(kept).not.toContainText('Sophie Matthews')
  await kept.scrollIntoViewIfNeeded()
  await page.screenshot({ path: 'visual/shots/p25a-04-kept-price.png', fullPage: true })
})

test('phase 25a the seeded Disabled Contract: its Booking on the review-flags List is flagged', async ({ page }) => {
  await page.goto(`/admin/lists/to-authorise/${REVIEW_FLAGS_LIST}`)
  await page.waitForLoadState('networkidle')
  const flag = page.locator('[data-shot=review-flag]', { hasText: 'Contract disabled on Fri 13 Nov' })
  await expect(flag).toHaveCount(1)
  await page.screenshot({ path: 'visual/shots/p25a-05-seeded-disabled-flag.png', fullPage: true })
})
