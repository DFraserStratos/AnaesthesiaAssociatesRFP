import { test, expect, type Page } from '@playwright/test'

/**
 * Catch-up Phase 19a: price ranges, the Contract's own fields and starting
 * values. Merivale's Face lift with one range "In force today", a backdated
 * range re-pricing the seeded Booking (Admin and the web List), the range
 * refusals, Dr Souter's prepaid price list by holder, the Contracts search by
 * "CAT", AP0126 and H3, a default RVG code filling an empty Procedure, the RVG
 * time rule panel, the new T caption on mobile, and no Billing assumption
 * callout. Screenshots land in `visual/shots/p19a-*.png`.
 */

const FACE_LIFT_BOOKING = '/admin/day/2026-08-10/bookings/BK0163'

async function openContract(page: Page, search: string, id: string) {
  await page.goto('/admin/masters?view=contracts')
  await page.waitForLoadState('networkidle')
  await page.locator('[data-shot=contract-search] input').fill(search)
  await page.locator(`tr[data-contract="${id}"]`).locator('button:text-is("Edit")').click()
  await expect(page.locator('[data-shot=contract-detail]')).toBeVisible()
}

test("phase 19a Merivale's Face lift: a backdated range re-prices the seeded Booking", async ({ page }) => {
  // Before: $3,100 from 1 Jun 2026 on the Admin Booking and the web List.
  await page.goto(FACE_LIFT_BOOKING)
  await page.waitForLoadState('networkidle')
  await expect(page.getByTestId('booking-calculation')).toContainText('$3100.00')
  await page.screenshot({ path: 'visual/shots/p19a-01-booking-before.png', fullPage: true })

  await openContract(page, 'Face lift', 'CT-MER-FACELIFT')
  const ranges = page.locator('[data-shot=contract-price-ranges]')
  await expect(ranges.locator('[data-shot=price-range-row]')).toHaveCount(1)
  await expect(ranges.locator('[data-shot=price-range-row]').first()).toContainText('From 1 Jun 2026')
  await expect(ranges.getByText('In force today')).toBeVisible()
  await ranges.scrollIntoViewIfNeeded()
  await page.screenshot({ path: 'visual/shots/p19a-02-face-lift-ranges.png', fullPage: true })

  // A backdated range from 1 Jul (before today, 21 Jul, and the Booking's 10 Aug List): the earlier range now ends 30 Jun.
  await ranges.getByLabel('New range start').fill('2026-07-01')
  await ranges.getByLabel('New range price (ex GST)').fill('3200')
  await ranges.getByRole('button', { name: 'Add price range' }).click()
  await expect(ranges.locator('[data-shot=price-range-row]')).toHaveCount(2)
  await expect(ranges.locator('[data-shot=price-range-row]').first()).toContainText('1 Jun 2026 to 30 Jun 2026')
  await expect(ranges.locator('[data-shot=price-range-row]').nth(1)).toContainText('From 1 Jul 2026')
  await expect(ranges.locator('[data-shot=price-range-row]').nth(1)).toContainText('In force today')
  await page.screenshot({ path: 'visual/shots/p19a-03-face-lift-backdated.png', fullPage: true })

  await page.goto(FACE_LIFT_BOOKING)
  await expect(page.getByTestId('booking-calculation')).toContainText('$3200.00')
  await page.screenshot({ path: 'visual/shots/p19a-04-booking-after.png', fullPage: true })
  await page.goto('/web/lists/L-34821-2026-08-10-PM')
  await expect(page.locator('tr', { hasText: '13:30' })).toContainText('$3,200.00')
  await page.screenshot({ path: 'visual/shots/p19a-05-web-list-after.png', fullPage: true })

  // Audited, in words.
  await page.goto('/admin/audit')
  await expect(page.getByText('Price range added').first()).toBeVisible()
})

test('phase 19a range refusals: a duplicate start, the last range, a prepaid zero, a rate Contract', async ({ page }) => {
  await openContract(page, 'Face lift', 'CT-MER-FACELIFT')
  const ranges = page.locator('[data-shot=contract-price-ranges]')
  // The only range offers no Delete.
  await expect(ranges.getByRole('button', { name: 'Delete (a Contract keeps at least one price range)' })).toBeDisabled()
  await ranges.getByLabel('New range start').fill('2026-06-01')
  await ranges.getByLabel('New range price (ex GST)').fill('3300')
  await ranges.getByRole('button', { name: 'Add price range' }).click()
  await expect(page.locator('[data-shot=contract-detail] [role=alert]')).toContainText('Another price range already starts on 1 Jun 2026.')
  await page.screenshot({ path: 'visual/shots/p19a-06-duplicate-start.png', fullPage: true })

  await openContract(page, 'Rhinoplasty', 'CT-SOUTER-RHINO')
  const souter = page.locator('[data-shot=contract-price-ranges]')
  await expect(souter.locator('[data-shot=price-range-row]')).toHaveCount(2)
  await souter.getByLabel('New range start').fill('2026-12-01')
  await souter.getByLabel('New range price (ex GST)').fill('0')
  await souter.getByRole('button', { name: 'Add price range' }).click()
  await expect(page.locator('[data-shot=contract-detail] [role=alert]')).toContainText("A prepaid Contract's price must be above zero.")
  await page.screenshot({ path: 'visual/shots/p19a-07-prepaid-zero.png', fullPage: true })

  // A rate Contract has no price ranges at all.
  await openContract(page, 'Affiliated', 'CT-SXAP')
  await expect(page.locator('[data-shot=contract-price-ranges]')).toHaveCount(0)
})

test("phase 19a Dr Souter's price list, and the Contracts search by CAT, AP0126 and H3", async ({ page }) => {
  await page.goto('/admin/masters?view=contracts&holder=PY-SOUTER')
  await page.waitForLoadState('networkidle')
  const rows = page.locator('[data-shot=contract-catalogue] tr[data-contract]')
  // Catch-up Phase 20 added Nair's item (SOUTER-004, Rhinoplasty, cosmetic component).
  await expect(rows).toHaveCount(4)
  await expect(page.locator('tr[data-contract="CT-SOUTER-RHINO"]')).toContainText('$1,200.00 from 1 Jan 2026')
  await expect(page.locator('tr[data-contract="CT-SOUTER-RHINO"]')).toContainText('Prepaid')
  await page.screenshot({ path: 'visual/shots/p19a-08-souter-list.png', fullPage: true })

  await page.goto('/admin/masters?view=contracts')
  await page.locator('[data-shot=contract-search] input').fill('CAT')
  for (const id of ['CT-CES-SXAP-CATIOL', 'CT-CES-HNZ-CAT', 'CT-CES-ACC-CAT']) await expect(page.locator(`tr[data-contract="${id}"]`)).toBeVisible()
  await page.screenshot({ path: 'visual/shots/p19a-09-search-cat.png', fullPage: true })
  await page.locator('[data-shot=contract-search] input').fill('AP0126')
  await expect(rows).toHaveCount(1)
  await page.locator('[data-shot=contract-search] input').fill('H3')
  for (const id of ['CT-MER-FACELIFT', 'CT-MER-FACELIFT-1', 'CT-MER-FACELIFT-2']) await expect(page.locator(`tr[data-contract="${id}"]`)).toBeVisible()
  await expect(page.locator('tr[data-contract="CT-MER-FACELIFT-1"]')).toContainText('$3,400.00 from 1 Jun 2026')
  await page.screenshot({ path: 'visual/shots/p19a-10-search-h3.png', fullPage: true })

  // The codes: holder reference, invoice description and the default RVG code.
  await page.locator('tr[data-contract="CT-MER-FACELIFT-1"]').locator('button:text-is("Edit")').click()
  const codes = page.locator('[data-shot=contract-codes]')
  await expect(codes.locator('[data-shot=contract-default-rvg]')).toContainText('H3')
  await expect(codes.getByLabel('Invoice description')).toHaveValue('Facelift plus 1 add on (eg bleph)')
  await codes.scrollIntoViewIfNeeded()
  await page.screenshot({ path: 'visual/shots/p19a-11-contract-codes.png', fullPage: true })
})

test('phase 19a a default RVG code fills an empty Procedure', async ({ page }) => {
  // Annette Riley's rhinoplasty (Fri 24 Jul) has no RVG code. Catch-up Phase 20:
  // the office moves it off Dr Souter's prepaid list on the step rail, to
  // Merivale's Face lift under Patient › Standard.
  await page.goto('/admin/day/2026-07-24/bookings/BK0034')
  await page.waitForLoadState('networkidle')
  await expect(page.getByRole('button', { name: 'No RVG code. Choose' }).first()).toBeVisible()
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

  await page.goto('/mobile/lists/L-34821-2026-07-21-AM/bookings/BK0001')
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
