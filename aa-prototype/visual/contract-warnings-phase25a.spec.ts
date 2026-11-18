import { test, expect, type Page } from '@playwright/test'

/**
 * Catch-up Phase 25a: the Contract change warnings and the Disabled Contract
 * flag. A new Contract replacing Merivale's Face lift from 1 Aug lists the
 * Procedures still on it (nothing moves); Disable lists them from today and
 * Review of Dr Souter's Mon 10 Aug PM flags each, never blocking; the backdated
 * range warns that Judith Calloway's authorised Face lift kept its old price;
 * the seeded Disabled Contract's Booking on 21a's review-flags List reads
 * "Contract disabled on Fri 10 Jul". Screenshots land in `visual/shots/p25a-*.png`.
 */

const FACE_LIFT = 'CT-MER-FACELIFT'
const MON_10_AUG = 'L-34821-2026-08-10-PM'
const REVIEW_FLAGS_LIST = 'L-45178-2026-07-14-AM'

async function openContract(page: Page, search: string, id: string, opts: { all?: boolean } = {}) {
  await page.goto('/admin/masters?view=contracts')
  await page.waitForLoadState('networkidle')
  // A Disabled Contract is listed only when asked for.
  if (opts.all === true) await page.locator('[data-shot=contract-status-filter]').getByRole('button', { name: 'All', exact: true }).click()
  await page.locator('[data-shot=contract-search] input').fill(search)
  await page.locator(`tr[data-contract="${id}"]`).locator('button:text-is("Edit")').click()
  await expect(page.locator('[data-shot=contract-detail]')).toBeVisible()
}

test('phase 25a a new Contract replacing the Face lift from a date lists the Procedures still on it', async ({ page }) => {
  await page.goto('/admin/masters?view=contracts')
  await page.waitForLoadState('networkidle')
  await page.getByRole('button', { name: 'New contract' }).click()
  const panel = page.locator('[data-shot=contract-detail]')
  await expect(panel).toBeVisible()
  await panel.locator('[data-shot=contract-links] select').first().selectOption({ label: 'Merivale Plastic Surgery' })
  await panel.getByLabel('Name').fill('Face lift 2026')
  const replaces = panel.locator('[data-shot=contract-replaces]')
  await replaces.getByLabel('Replaces').selectOption(FACE_LIFT)
  await replaces.getByLabel('From').fill('2026-08-01')
  const warning = panel.locator('[data-shot=contract-still-on-warning]')
  await expect(warning).toContainText('dated on or after Sat 1 Aug')
  await expect(warning).toContainText('Nothing moves by itself')
  const rows = warning.locator('[data-shot=contract-still-on-row]')
  await expect(rows.first()).toBeVisible()
  await expect(warning).toContainText('Sophie Matthews')
  await expect(warning).not.toContainText('Judith Calloway')
  await warning.scrollIntoViewIfNeeded()
  await page.screenshot({ path: 'visual/shots/p25a-01-dated-change.png', fullPage: true })
})

test('phase 25a Disable lists the Procedures still on the Face lift; Review flags them and Authorise is not blocked; Make active clears them', async ({ page }) => {
  await openContract(page, 'Face lift', FACE_LIFT)
  const panel = page.locator('[data-shot=contract-detail]')
  await panel.locator('[data-shot=contract-disable]').click()
  await expect(panel.locator('[data-shot=contract-disabled-note]')).toContainText('Disabled on Tue 21 Jul')
  const warning = panel.locator('[data-shot=contract-still-on-warning]')
  await expect(warning).toContainText('dated on or after Tue 21 Jul')
  await expect(warning).toContainText('Sophie Matthews')
  await expect(warning).toContainText('Paula Westerman')
  await page.screenshot({ path: 'visual/shots/p25a-02-disable-warning.png', fullPage: true })

  // History records the disable.
  await panel.locator('[data-shot=contract-tab-history]').click()
  await expect(panel.locator('[data-shot=contract-history]')).toContainText('Kirsty')

  await page.goto(`/admin/review/${MON_10_AUG}`)
  await page.waitForLoadState('networkidle')
  await expect(page.locator('[data-shot=review-flag]', { hasText: 'Contract disabled on Tue 21 Jul' }).first()).toBeVisible()
  await page.screenshot({ path: 'visual/shots/p25a-03-review-flag-disabled.png', fullPage: true })

  await openContract(page, 'Face lift', FACE_LIFT, { all: true })
  await page.locator('[data-shot=contract-detail]').getByRole('button', { name: 'Make active' }).click()
  await page.goto(`/admin/review/${MON_10_AUG}`)
  await page.waitForLoadState('networkidle')
  await expect(page.locator('[data-shot=review-flag]', { hasText: 'Contract disabled' })).toHaveCount(0)
})

test('phase 25a the backdated range warns that an authorised Procedure kept its old price', async ({ page }) => {
  await openContract(page, 'Face lift', FACE_LIFT)
  const ranges = page.locator('[data-shot=contract-price-ranges]')
  await expect(ranges.locator('[data-shot=price-range-kept]')).toHaveCount(0)
  await ranges.getByLabel('New range start').fill('2026-07-01')
  await ranges.getByLabel('New range price (ex GST)').fill('3300')
  await ranges.getByRole('button', { name: 'Add price range' }).click()
  const kept = ranges.locator('[data-shot=price-range-kept]')
  await expect(kept).toContainText('1 authorised Procedure kept its old price')
  await expect(kept.locator('[data-shot=price-range-kept-row]')).toHaveCount(1)
  await expect(kept).toContainText('Judith Calloway')
  await expect(kept).toContainText('$3,100.00')
  await expect(kept).not.toContainText('Sophie Matthews')
  await kept.scrollIntoViewIfNeeded()
  await page.screenshot({ path: 'visual/shots/p25a-04-kept-price.png', fullPage: true })
})

test('phase 25a the seeded Disabled Contract: its Booking on the review-flags List is flagged', async ({ page }) => {
  await page.goto(`/admin/review/${REVIEW_FLAGS_LIST}`)
  await page.waitForLoadState('networkidle')
  const flag = page.locator('[data-shot=review-flag]', { hasText: 'Contract disabled on Fri 10 Jul' })
  await expect(flag).toHaveCount(1)
  await page.screenshot({ path: 'visual/shots/p25a-05-seeded-disabled-flag.png', fullPage: true })
})
