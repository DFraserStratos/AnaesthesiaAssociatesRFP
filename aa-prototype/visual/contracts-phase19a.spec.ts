import { test, expect, type Locator, type Page } from '@playwright/test'

/**
 * Catch-up Phase 19a: price ranges, the Contract's own fields and starting
 * values. Merivale's Face lift with one range "In force today", a backdated
 * range re-pricing the seeded Booking (Admin and the web List), the range
 * refusals, Dr Souter's prepaid price list by holder, the Contracts search by
 * "CAT", AP0126 and H3, a default RVG code filling an empty Procedure, the RVG
 * time rule panel, the new T caption on mobile, and no Billing assumption
 * callout. Screenshots land in `visual/shots/p19a-*.png`.
 */

const FACE_LIFT_BOOKING = '/admin/day/2026-12-14/bookings/BK0163'

/** A Contract's page, by its id (build plan Phase 45). */
async function openContract(page: Page, id: string) {
  await page.goto(`/admin/contracts/${id}`)
  await page.waitForLoadState('networkidle')
  await expect(page.locator('[data-shot=contract-detail]')).toBeVisible()
}

/** A range's row, by its start (the table is newest first). */
function rangeRow(ranges: Locator, startISO: string): Locator {
  return ranges.locator(`tr[data-shot=price-range-row][data-range-start="${startISO}"]`)
}

/** Add a range from the dashed "Add a price range" row, saved by the card's "Add price range". */
async function addRange(ranges: Locator, startISO: string, price: string) {
  await ranges.locator('[data-shot=price-range-add-open]').getByRole('button', { name: 'Add a price range' }).click()
  const row = ranges.locator('tr[data-shot=price-range-add]')
  await row.getByLabel('Start of the new range').fill(startISO)
  await row.getByLabel('Price (ex GST) of the new range').fill(price)
  await ranges.locator('[data-shot=price-range-add-save]').click()
}

test('phase 45 the old Master data link to a Contract redirects to its page, and Back does not bounce', async ({ page }) => {
  await page.goto('/admin/day/2026-11-24')
  await page.waitForLoadState('networkidle')
  await page.goto('/admin/masters?view=contracts&contract=CT-MER-FACELIFT')
  await expect(page).toHaveURL(/\/admin\/contracts\/CT-MER-FACELIFT$/)
  await expect(page.locator('[data-shot=contract-detail]')).toBeVisible()
  await page.goBack()
  await expect(page).toHaveURL(/\/admin\/day\/2026-11-24$/)
})

test("phase 19a Merivale's Face lift: a backdated range re-prices the seeded Booking", async ({ page }) => {
  // Before: $3,100 from 1 Jun 2026 on the Admin Booking and the web List.
  await page.goto(FACE_LIFT_BOOKING)
  await page.waitForLoadState('networkidle')
  await expect(page.getByTestId('booking-calculation')).toContainText('$3,100.00')
  await page.screenshot({ path: 'visual/shots/p19a-01-booking-before.png', fullPage: true })

  await openContract(page, 'CT-MER-FACELIFT')
  const ranges = page.locator('[data-shot=contract-price-ranges]')
  await expect(ranges.locator('[data-shot=price-range-row]')).toHaveCount(1)
  const first = rangeRow(ranges, '2026-10-05')
  await expect(first.locator('td').nth(0)).toHaveText('5 Oct 2026')
  await expect(first.locator('td').nth(1)).toHaveText('Onwards')
  await expect(first).toHaveAttribute('data-range-state', 'inForce')
  await expect(first).toContainText('In force')
  await ranges.scrollIntoViewIfNeeded()
  await page.screenshot({ path: 'visual/shots/p19a-02-face-lift-ranges.png', fullPage: true })

  // A backdated range from 4 Nov (before today, 24 Nov, and the Booking's 14 Dec List): the earlier range now ends 3 Nov.
  await addRange(ranges, '2026-11-04', '3200')
  await expect(ranges.locator('[data-shot=price-range-row]')).toHaveCount(2)
  // Newest first.
  await expect(ranges.locator('[data-shot=price-range-row]').first()).toHaveAttribute('data-range-start', '2026-11-04')
  const ended = rangeRow(ranges, '2026-10-05')
  await expect(ended.locator('td').nth(0)).toHaveText('5 Oct 2026')
  await expect(ended.locator('td').nth(1)).toHaveText('3 Nov 2026')
  await expect(ended).toHaveAttribute('data-range-state', 'ended')
  const backdated = rangeRow(ranges, '2026-11-04')
  await expect(backdated.locator('td').nth(0)).toHaveText('4 Nov 2026')
  await expect(backdated.locator('td').nth(1)).toHaveText('Onwards')
  await expect(backdated.locator('td').nth(2)).toHaveText('$3,200.00')
  await expect(backdated.locator('td').nth(3)).toHaveText('+3.2%')
  await expect(backdated).toHaveAttribute('data-range-state', 'inForce')
  await expect(backdated).toContainText('In force')
  await page.screenshot({ path: 'visual/shots/p19a-03-face-lift-backdated.png', fullPage: true })

  await page.goto(FACE_LIFT_BOOKING)
  await expect(page.getByTestId('booking-calculation')).toContainText('$3,200.00')
  await page.screenshot({ path: 'visual/shots/p19a-04-booking-after.png', fullPage: true })
  await page.goto('/web/lists/L-34821-2026-12-14-PM')
  await expect(page.locator('tr', { hasText: '13:30' })).toContainText('$3,200.00')
  await page.screenshot({ path: 'visual/shots/p19a-05-web-list-after.png', fullPage: true })

  // Audited, in words.
  await page.goto('/admin/audit')
  await expect(page.getByText('Price range added').first()).toBeVisible()
})

test('phase 19a range refusals: a duplicate start, the last range, a prepaid zero, a rate Contract', async ({ page }) => {
  await openContract(page, 'CT-MER-FACELIFT')
  const ranges = page.locator('[data-shot=contract-price-ranges]')
  // The only range offers no Remove.
  await ranges.getByRole('button', { name: 'Correct the range from 5 Oct 2026' }).click()
  await expect(ranges.getByRole('button', { name: 'Remove (a Contract keeps at least one price range)' })).toBeDisabled()
  await ranges.getByRole('button', { name: 'Cancel', exact: true }).click()
  await addRange(ranges, '2026-10-05', '3300')
  await expect(page.locator('[data-shot=contract-detail] [role=alert]')).toContainText('Another price range already starts on 5 Oct 2026.')
  await page.screenshot({ path: 'visual/shots/p19a-06-duplicate-start.png', fullPage: true })

  await openContract(page, 'CT-SOUTER-RHINO')
  const souter = page.locator('[data-shot=contract-price-ranges]')
  await expect(souter.locator('[data-shot=price-range-row]')).toHaveCount(2)
  await addRange(souter, '2027-04-06', '0')
  await expect(page.locator('[data-shot=contract-detail] [role=alert]')).toContainText("A prepaid Contract's price must be above zero.")
  await page.screenshot({ path: 'visual/shots/p19a-07-prepaid-zero.png', fullPage: true })

  // A rate Contract has no price ranges at all.
  await openContract(page, 'CT-SXAP')
  await expect(page.locator('[data-shot=contract-price-ranges]')).toHaveCount(0)
})

test("phase 19a Dr Souter's price list, and the Contracts search by CAT, AP0126 and H3", async ({ page }) => {
  await page.goto('/admin/contracts?group=holder&in=PY-SOUTER')
  await page.waitForLoadState('networkidle')
  const rows = page.locator('[data-shot=contract-catalogue] tr[data-contract]')
  // Catch-up Phase 20 added Nair's item (SOUTER-004, Rhinoplasty, cosmetic component).
  await expect(rows).toHaveCount(4)
  await expect(page.locator('tr[data-contract="CT-SOUTER-RHINO"]')).toContainText('$1,200.00 from 1 Jan 2026')
  await expect(page.locator('tr[data-contract="CT-SOUTER-RHINO"]')).toContainText('Prepaid')
  await page.screenshot({ path: 'visual/shots/p19a-08-souter-list.png', fullPage: true })

  await page.goto('/admin/contracts')
  await page.locator('[data-shot=contract-search] input').fill('CAT')
  for (const id of ['CT-CES-SXAP-CATIOL', 'CT-CES-HNZ-CAT', 'CT-CES-ACC-CAT']) await expect(page.locator(`tr[data-contract="${id}"]`)).toBeVisible()
  await page.screenshot({ path: 'visual/shots/p19a-09-search-cat.png', fullPage: true })
  await page.locator('[data-shot=contract-search] input').fill('AP0126')
  await expect(rows).toHaveCount(1)
  await page.locator('[data-shot=contract-search] input').fill('H3')
  for (const id of ['CT-MER-FACELIFT', 'CT-MER-FACELIFT-1', 'CT-MER-FACELIFT-2']) await expect(page.locator(`tr[data-contract="${id}"]`)).toBeVisible()
  await expect(page.locator('tr[data-contract="CT-MER-FACELIFT-1"]')).toContainText('$3,400.00 from 5 Oct 2026')
  await page.screenshot({ path: 'visual/shots/p19a-10-search-h3.png', fullPage: true })

  // The codes: holder reference, invoice description and the default RVG code.
  await page.locator('tr[data-contract="CT-MER-FACELIFT-1"]').getByRole('button', { name: /^Open / }).click()
  await expect(page).toHaveURL(/\/admin\/contracts\/CT-MER-FACELIFT-1$/)
  const codes = page.locator('[data-shot=contract-codes]')
  await expect(codes.locator('[data-shot=contract-default-rvg]')).toContainText('H3')
  await expect(codes).toContainText('Facelift plus 1 add on (eg bleph)')
  await codes.getByRole('button', { name: 'Edit invoice and codes' }).click()
  await expect(codes.getByLabel('Invoice description')).toHaveValue('Facelift plus 1 add on (eg bleph)')
  await codes.scrollIntoViewIfNeeded()
  await page.screenshot({ path: 'visual/shots/p19a-11-contract-codes.png', fullPage: true })
})

test('phase 19a a default RVG code fills an empty Procedure', async ({ page }) => {
  // Annette Riley's rhinoplasty (Fri 24 Jul) has no RVG code. Catch-up Phase 20:
  // the office moves it off Dr Souter's prepaid list on the step rail, to
  // Merivale's Face lift under Patient › Standard.
  await page.goto('/admin/day/2026-11-27/bookings/BK0034')
  await page.waitForLoadState('networkidle')
  // Prepaid at a fixed price: the code is only offered for reference (catch-up Phase 20).
  await expect(page.locator('[data-shot=rvg-code-add-reference]').first()).toBeVisible()
  // The Billing card is inline on the Booking: change step 2, then choose the Contract.
  await page.locator('[data-shot=contract-rail-step-2]').first().click()
  await page.locator('[data-rail-option=standard]').first().click()
  await page.locator('[data-shot=contract-combo]').first().click()
  await page.locator('[data-contract-id=CT-MER-FACELIFT]').first().click()
  await expect(page.getByRole('button', { name: /^RVG code H3, / }).first()).toBeVisible()
  await page.screenshot({ path: 'visual/shots/p19a-12-default-fills.png', fullPage: true })
})

test('phase 19a time units as data: the time rule panel, the T caption, no Billing assumption', async ({ page }) => {
  await page.goto('/admin/masters?view=rvgGroups')
  await page.waitForLoadState('networkidle')
  const panel = page.locator('[data-shot=masters-rvg-time-rule]')
  await expect(panel).toContainText('1 unit per 15 minutes or part for the first 2 hours, then 1 unit per 10 minutes or part.')
  await page.screenshot({ path: 'visual/shots/p19a-13-time-rule.png' })

  await page.goto('/mobile/lists/L-34821-2026-11-24-AM/bookings/BK0001')
  await page.waitForLoadState('networkidle')
  const t = page.locator('[data-shot=units-row-t]').first()
  await t.scrollIntoViewIfNeeded()
  await expect(t).toContainText('From start and finish stamps · RVG time tiers')
  await expect(t.locator('input')).toHaveCount(0)
  await page.screenshot({ path: 'visual/shots/p19a-14-mobile-t-caption.png' })

  await page.goto('/demo/control')
  await page.waitForLoadState('networkidle')
  await expect(page.getByText('Billing assumption')).toHaveCount(0)
})
