import { test, expect, type Page } from '@playwright/test'

/**
 * Catch-up Phase 24: the price line on every Contract (mobile and web), the
 * anaesthetist's typed price and its no-charge caption, the read-only states,
 * the office's Review Fee cell, the Contract override pills, the discount and
 * no-charge invoices. Screenshots land in `visual/shots/p24-*.png`.
 */

const MON27 = '/lists/L-34821-2026-11-30-AM/bookings'

async function open(page: Page, url: string): Promise<void> {
  await page.goto(url)
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(500)
  await page.locator('[data-shot=price-card]').first().scrollIntoViewIfNeeded()
}

test('phase 24 mobile: No contract · RVG takes a typed price, no reason; $0 is a no-charge price', async ({ page }) => {
  await open(page, `/mobile${MON27}/BK0186`)
  const card = page.locator('[data-shot=price-card]').first()
  await expect(card).toHaveAttribute('data-state', 'override')
  await expect(card).toContainText('units x $26.50 = $106.00')
  await page.screenshot({ path: 'visual/shots/p24-01-mobile-override.png' })
  await card.locator('[data-shot=price-card-input]').fill('450.00')
  await card.locator('[data-shot=price-card-save]').click()
  await expect(card.locator('[data-shot=price-card-price]')).toHaveText('$450.00')
  await expect(card).toContainText('Price typed')
  await expect(card).toContainText('Computed $106.00')
  await expect(page.getByText(/reason/i)).toHaveCount(0)
  await card.locator('[data-shot=price-card-input]').fill('0.00')
  await card.locator('[data-shot=price-card-save]').click()
  await expect(card).toHaveAttribute('data-state', 'no-charge')
  await expect(card).toContainText('The RVG detail stays recorded. This gives a no-charge invoice.')
  await page.screenshot({ path: 'visual/shots/p24-02-mobile-no-charge.png' })
  await card.locator('[data-shot=price-card-clear]').click()
  await expect(card.locator('[data-shot=price-card-price]')).toHaveText('$106.00')
})

test('phase 24 mobile: read-only on Aria, the discount and her own price list; the amount on No contract · Fixed price', async ({ page }) => {
  await open(page, `/mobile${MON27}/BK0037`)
  const aria = page.locator('[data-shot=price-card]').first()
  await expect(aria).toHaveAttribute('data-state', 'read-only')
  await expect(aria).toContainText('x $26.50')
  await expect(aria).toContainText('Set by Aria Skin and Laser Clinic. To use a different price, change the Contract or alert the office.')
  await expect(aria.locator('input')).toHaveCount(0)

  await open(page, `/mobile${MON27}/BK0185`)
  const discount = page.locator('[data-shot=price-card]').first()
  await expect(discount).toHaveAttribute('data-state', 'read-only')
  await expect(discount).toContainText('Discount 10% · minus $15.90')
  await expect(discount.locator('[data-shot=price-card-price]')).toHaveText('$143.10')
  await page.screenshot({ path: 'visual/shots/p24-03-mobile-discount.png' })

  await open(page, '/mobile/lists/L-34821-2026-11-27-AM/bookings/BK0034')
  const own = page.locator('[data-shot=price-card]').first()
  await expect(own).toHaveAttribute('data-state', 'read-only')
  await expect(own).toContainText('Fixed price')
  // Riley's Procedure is prepaid since catch-up Phase 27: "Prepaid amount", no field, no caption (D30).
  await expect(own).toContainText('Prepaid amount')
  await expect(own).not.toContainText('alert the office')
  await expect(own.locator('input')).toHaveCount(0)

  await open(page, '/mobile/lists/L-34821-2026-12-14-PM/bookings/BK0177')
  const amount = page.locator('[data-shot=price-card]').first()
  await expect(amount).toHaveAttribute('data-state', 'amount')
  await expect(amount.locator('[data-shot=price-card-needs-price]')).toHaveText('Needs a price')
  await amount.locator('[data-shot=price-card-input]').fill('650.00')
  await amount.locator('[data-shot=price-card-save]').click()
  await expect(amount.locator('[data-shot=price-card-price]')).toHaveText('$650.00')
  await expect(page.locator('[data-shot=booking-total-strip]')).toContainText('$650.00')
})

test('phase 24 web: the same card, its states and the rail total', async ({ page }) => {
  await open(page, `/web${MON27}/BK0186`)
  const card = page.locator('[data-shot=price-card]').first()
  await expect(card).toHaveAttribute('data-state', 'override')
  await expect(page.getByTestId('booking-calculation')).toContainText('$106.00')
  await page.screenshot({ path: 'visual/shots/p24-04-web-override.png' })

  await open(page, `/web${MON27}/BK0185`)
  await expect(page.locator('[data-shot=price-card]').first()).toHaveAttribute('data-state', 'read-only')
  await expect(page.locator('[data-shot=price-card]').first()).toContainText('Discount 10% · minus $15.90')
  await open(page, '/web/lists/L-34821-2026-12-14-PM/bookings/BK0177')
  await expect(page.locator('[data-shot=price-card]').first()).toHaveAttribute('data-state', 'amount')
  await expect(page.locator('[data-shot=price-card-needs-price]').first()).toHaveText('Needs a price')
  // Her AUTHORISED List: the figures only, locked.
  await open(page, '/web/lists/L-34821-2026-11-19-PM/bookings/BK0188')
  const locked = page.locator('[data-shot=price-card]').first()
  await expect(locked).toHaveAttribute('data-state', 'locked')
  await expect(locked.locator('input')).toHaveCount(0)
  await expect(locked).toContainText('Invoiced')
  await page.screenshot({ path: 'visual/shots/p24-07-web-locked.png' })
})

test('phase 24 admin: the discount Booking total shows the gross, the discount line and the price', async ({ page }) => {
  await page.goto('/admin/day/2026-11-30/bookings/BK0185')
  await page.waitForLoadState('networkidle')
  const lines = page.locator('[data-shot=booking-total-lines]')
  await expect(lines).toContainText('$159.00')
  await expect(lines).toContainText('Discount 10%')
  await expect(page.getByTestId('booking-calculation')).toContainText('$143.10')
  await page.screenshot({ path: 'visual/shots/p24-08-discount-lines.png', fullPage: true })
})

test('phase 24 admin: Review shows the typed price beside the computed one; Contracts name who may change the price', async ({ page }) => {
  await page.goto('/admin/review/L-45178-2026-11-17-AM')
  await page.waitForLoadState('networkidle')
  await expect(page.locator('[data-shot=review-fee-computed]').first()).toHaveText('Computed $265.50')
  await page.screenshot({ path: 'visual/shots/p24-05-review-fee.png', fullPage: true })

  await page.goto('/admin/contracts')
  await page.waitForLoadState('networkidle')
  await expect(page.locator('tr[data-contract="CT-NO-CONTRACT"] [data-shot=contract-override-pill]')).toHaveText('Anaesthetist can override the price')
  await expect(page.locator('tr[data-contract="CT-ARIA-HOURLY"] [data-shot=contract-override-pill]')).toHaveText('Price fixed for the anaesthetist')
  await expect(page.locator('tr[data-contract="CT-MER-FACELIFT"] [data-shot=contract-override-pill]')).toHaveCount(0)
})

test('phase 24 admin: authorising the no-charge List raises a $0.00 "No charge" invoice', async ({ page }) => {
  await page.goto('/admin/review/L-34821-2026-11-16-AM')
  await page.waitForLoadState('networkidle')
  await expect(page.locator('[data-shot=review-no-charge]')).toHaveText('No charge')
  await page.getByRole('button', { name: 'Authorise for billing' }).first().click()
  await page.waitForTimeout(200)
  await page.getByRole('button', { name: 'Authorise for billing' }).last().click()
  await page.waitForTimeout(400)
  await expect(page.getByText('List authorised · locked for billing')).toBeVisible()
  await page.goto('/admin/invoices')
  await page.waitForLoadState('networkidle')
  await page.getByText('Ihaia Paewai').first().click()
  await page.waitForTimeout(400)
  await page.getByRole('button', { name: /^Invoice AA-2026-/ }).first().click()
  await page.waitForTimeout(400)
  await expect(page.locator('[data-shot=invoice-no-charge]')).toHaveText('No charge')
  await page.screenshot({ path: 'visual/shots/p24-06-no-charge-invoice.png', fullPage: true })
})
