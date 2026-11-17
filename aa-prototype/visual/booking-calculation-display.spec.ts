import { expect, test, type Page } from '@playwright/test'

/**
 * Every Booking shows what the price comes to (catch-up Phase 24; US-03.3.10,
 * RV-29): the phone pins the dock strip (restored from `d1562b4c`, fee only:
 * no Off / Units / Fee setting) above Mark complete, the web rail puts the
 * total panel above Mark complete, widths matched, and the completion moment
 * names the units and price. The office Booking keeps the full fee panel.
 */

async function openMobileEllison(page: Page): Promise<void> {
  await page.goto('/mobile')
  await page.waitForLoadState('networkidle')
  await page.getByText('Southern Cross', { exact: false }).first().click()
  await page.getByText('Margaret Ellison', { exact: false }).first().click()
  await expect(page.locator('[data-shot="capture-billing"]').last()).toBeVisible()
  await page.waitForTimeout(600)
}

async function openWebEllison(page: Page): Promise<void> {
  await page.goto('/web/lists')
  await page.waitForLoadState('networkidle')
  await page.getByText('Southern Cross').first().click()
  await page.getByText('Margaret Ellison').first().click()
  await expect(page.locator('[data-shot="capture-billing"]').last()).toBeVisible()
  await page.waitForTimeout(200)
}

async function openAdminBooking(page: Page): Promise<void> {
  await page.goto('/admin/day/2026-07-21')
  await page.waitForLoadState('networkidle')
  await page.locator('[data-list-id="L-34821-2026-07-21-AM"]').click() // Souter's St George's AM (the band and rail card also name St George's since catch-up Phase 31)
  await page.getByRole('button', { name: 'Open', exact: true }).first().click()
  await expect(page.getByText(/Office billing setup/).first()).toBeVisible()
}

async function advanceClockTo1715(page: Page): Promise<void> {
  await page.goto('/demo/control')
  await page.waitForLoadState('networkidle')
  for (let i = 0; i < 9; i++) {
    await page.getByRole('button', { name: '+1 hour', exact: true }).click()
  }
  await page.getByRole('button', { name: '+15 min', exact: true }).click()
}

test('mobile anaesthetist Booking pins the price strip above Mark complete, and the price ticks up as a modifier is claimed', async ({ page }) => {
  await advanceClockTo1715(page)
  await openMobileEllison(page)

  const strip = page.locator('[data-shot=booking-total-strip]')
  await expect(strip).toBeVisible()
  await expect(strip).toContainText('UNITS')
  await expect(strip).toContainText('$')
  const complete = page.getByRole('button', { name: 'Mark complete' })
  const stripBox = await strip.boundingBox()
  const completeBox = await complete.boundingBox()
  expect(stripBox).not.toBeNull()
  expect(completeBox).not.toBeNull()
  // The strip sits above the bar in the dock, never a sheet, toast or confirm.
  expect(stripBox!.y + stripBox!.height).toBeLessThanOrEqual(completeBox!.y)
  const card = page.locator('[data-shot=price-card]').first()
  await expect(card).toBeVisible()
  await page.screenshot({ path: 'visual/shots/booking-calculation-mobile-fee.png', fullPage: true })

  // Claim a modifier: the price line and the strip both rise, with no prompt (US-03.3.10 "Updates as entered").
  const priceBefore = await card.locator('[data-shot=price-card-price]').innerText()
  const stripBefore = await strip.innerText()
  await page.locator('[data-shot="capture-modifiers"]').first().locator('[data-shot="modifier-add"]').click()
  await page.locator('[data-shot="modifier-picker"] [data-modifier-code="AS3"]').click()
  await page.getByPlaceholder('A short reason, as an insurer would ask').fill('ASA III on pre-op review')
  await page.getByRole('button', { name: 'Claim', exact: true }).click()
  await page.waitForTimeout(1200)
  await expect(card.locator('[data-shot=price-card-price]')).not.toHaveText(priceBefore)
  expect(await strip.innerText()).not.toBe(stripBefore)
  await expect(page.locator('[role=alertdialog]')).toHaveCount(0)

  await page.getByRole('button', { name: 'Finish now' }).click()
  await complete.click()
  const overlay = page.getByTestId('completion-overlay')
  await expect(overlay.getByText('Booking complete', { exact: true })).toBeVisible()
  await expect(overlay.getByText(/units · \$/)).toBeVisible()
})

test('web anaesthetist rail: the total panel above Mark complete, widths matched, sticky', async ({ page }) => {
  await openWebEllison(page)

  const calculation = page.getByTestId('booking-calculation')
  await expect(calculation).toContainText('BOOKING TOTAL')
  const complete = page.getByRole('button', { name: 'Mark complete' })
  const totalBox = await calculation.boundingBox()
  const completeBox = await complete.boundingBox()
  expect(totalBox).not.toBeNull()
  expect(completeBox).not.toBeNull()
  expect(completeBox!.y - (totalBox!.y + totalBox!.height)).toBeCloseTo(8, 0)
  expect(Math.abs(completeBox!.width - totalBox!.width)).toBeLessThan(1)
  // The panel starts level with the first capture card (the Procedure card since catch-up Phase 20a).
  const first = await page.locator('[data-shot=procedure-stack]').first().boundingBox()
  expect(first).not.toBeNull()
  expect(Math.abs(first!.y - totalBox!.y)).toBeLessThan(1)
  await expect(page.getByTestId('web-booking-commit')).toHaveCSS('position', 'sticky')
  await page.screenshot({ path: 'visual/shots/booking-calculation-web-fee.png', fullPage: true })
})

test('Admin Booking keeps the full fee panel', async ({ page }) => {
  await openAdminBooking(page)

  const calculation = page.getByTestId('booking-calculation')
  await expect(calculation).toContainText('BOOKING TOTAL')
  await expect(calculation).toContainText('$')
})
