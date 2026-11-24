import { test, expect } from '@playwright/test'

/**
 * Catch-up Phase 21a: office review flags (US-07.2.2). The review-flags List
 * (Dr Chen, Tue 14 Jul AM, SUBMITTED) shows each Procedure's flags under its
 * stack, Approve on the anaesthetist's Contract change turns into "Approved",
 * and the anaesthetist's Booking then reads "Approved by the office". Flags
 * never block: Authorise stays available once every Booking is complete.
 */

test('review flags: the Contract change, the typed price, the misfit, Approve', async ({ page }) => {
  await page.goto('/admin/review/L-45178-2026-11-17-AM')
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(400)

  const flags = page.locator('[data-shot="review-flag"]')
  await expect(flags.filter({ hasText: 'Changed by Dr Chen: was Cataract IOL (LA by Anaesthetist)' })).toBeVisible()
  await expect(flags.filter({ hasText: /^Price typed: \$1,200\.00 \(computed \$[\d,.]+\)$/ })).toBeVisible()
  await expect(page.locator('[data-shot="review-flag"][data-rule="contractNoLongerFits"]')).toHaveText('Contract not offered on this List')
  await expect(page.locator('[data-shot="review-flag"][data-rule="needsPrice"]')).toHaveText('Needs a price')
  // Catch-up Phase 25a's Booking on the Disabled Contract is the fifth on this List.
  await expect(page.locator('[data-shot="review-flag"][data-rule="contractDisabled"]')).toHaveText('Contract disabled on Fri 13 Nov')
  await expect(page.locator('[data-shot="review-procedure-stack"]')).toHaveCount(5)
  await expect(page.locator('[data-shot="review-payer"]')).toHaveCount(5)
  await expect(page.locator('[data-shot="review-contract-approve-all"]')).toHaveText('Approve the Contract change')
  await page.screenshot({ path: 'visual/shots/r21a-01-review-flags.png', fullPage: true })

  await page.locator('[data-shot="review-contract-approve"]').click()
  await expect(page.locator('[data-shot="review-contract-approved"]')).toHaveText(/^Approved Tue 24 Nov, \d\d:\d\d$/)
  await expect(page.locator('[data-shot="review-flag"][data-rule="contractChanged"]')).toHaveCount(0)
  await expect(page.locator('[data-shot="review-contract-approve-all"]')).toHaveCount(0)
  await page.screenshot({ path: 'visual/shots/r21a-02-approved.png', fullPage: true })

  await page.goto('/mobile/lists/L-45178-2026-11-17-AM/bookings/BK0178')
  await page.waitForTimeout(800)
  await expect(page.locator('[data-shot="contract-approval-status"]')).toHaveText(/^Approved by the office Tue 24 Nov, \d\d:\d\d$/)
})
